const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { resolve } = require('node:path');
const { before, after, test } = require('node:test');
const { initializeTestEnvironment, assertSucceeds, assertFails } = require('@firebase/rules-unit-testing');
const {
  collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, query, runTransaction,
  serverTimestamp, setDoc, Timestamp, updateDoc, where, writeBatch,
} = require('firebase/firestore');

const projectId = 'demo-togetherly';
const code = (letter) => letter.repeat(26);
let env;
let a;
let b;
let c;
let anonymous;

before(async () => {
  assert.ok(process.env.FIRESTORE_EMULATOR_HOST, 'Run with firebase emulators:exec');
  env = await initializeTestEnvironment({
    projectId,
    firestore: { rules: readFileSync(resolve(__dirname, '../../firestore.rules'), 'utf8') },
  });
  await env.clearFirestore();
  [a, b, c] = ['alice', 'bob', 'carol'].map((uid) => env.authenticatedContext(uid).firestore());
  anonymous = env.unauthenticatedContext().firestore();
  await Promise.all([[a, 'alice'], [b, 'bob'], [c, 'carol']].map(([db, uid]) =>
    assertSucceeds(setDoc(doc(db, 'users', uid), { uid, activeCoupleId: null }))));
});

after(() => env?.cleanup());

function invitation(id, creator) {
  return {
    id, code: id, createdBy: creator, creatorName: creator, creatorAvatarId: 'avatar_fox',
    status: 'pending', createdAt: serverTimestamp(), expiresAt: Timestamp.fromMillis(Date.now() + 3600000),
  };
}

function queueRedemption(writer, db, id, creator, recipient, options = {}) {
  const coupleId = options.coupleId || id;
  const memberIds = options.memberIds || [creator, recipient];
  writer.update(doc(db, 'invitations', id), {
    status: 'accepted', claimedBy: recipient, claimedAt: serverTimestamp(),
  });
  writer.set(doc(db, 'couples', coupleId), {
    id: coupleId, memberIds, members: Object.fromEntries(memberIds.map((uid) => [uid, {}])),
    createdBy: creator, createdAt: serverTimestamp(), status: 'active',
  });
  for (const uid of [creator, recipient]) {
    if (uid !== options.omit) {
      writer.update(doc(db, 'users', uid), { activeCoupleId: coupleId, updatedAt: serverTimestamp() });
    }
  }
}

function batchRedemption(db, id, creator, recipient, options) {
  const batch = writeBatch(db);
  queueRedemption(batch, db, id, creator, recipient, options);
  return batch.commit();
}

test('pending invite lookup, atomic redemption and inviter realtime update', { timeout: 20000 }, async () => {
  const id = code('A');
  const spare = code('B');
  const invite = doc(a, 'invitations', id);
  await assertSucceeds(setDoc(invite, invitation(id, 'alice')));
  await assertSucceeds(setDoc(doc(a, 'invitations', spare), invitation(spare, 'alice')));
  await assertFails(setDoc(doc(b, 'invitations', code('C')), invitation(code('C'), 'alice')));
  await assertFails(getDocs(collection(b, 'invitations')));
  await assertFails(getDocs(query(collection(b, 'invitations'), where('createdBy', '==', 'alice'))));
  const own = await assertSucceeds(getDocs(query(collection(a, 'invitations'),
    where('createdBy', '==', 'alice'), where('status', '==', 'pending'))));
  assert.equal(own.size, 2);
  const lookup = await assertSucceeds(getDoc(doc(b, 'invitations', id)));
  assert.deepEqual(Object.keys(lookup.data()).sort(), Object.keys(invitation(id, 'alice')).sort());
  await assertFails(getDoc(doc(anonymous, 'invitations', id)));
  await assertFails(batchRedemption(anonymous, id, 'alice', 'bob'));
  await assertFails(batchRedemption(b, id, 'alice', 'bob', { omit: 'alice' }));
  await assertFails(batchRedemption(b, id, 'alice', 'bob', { memberIds: ['alice', 'bob', 'carol'] }));
  await assertFails(updateDoc(doc(b, 'users', 'bob'), { activeCoupleId: id }));
  assert.equal((await getDoc(invite)).data().status, 'pending');

  let unsubscribe;
  try {
    const accepted = new Promise((resolveUpdate, rejectUpdate) => {
      unsubscribe = onSnapshot(invite, (snapshot) => {
        if (snapshot.data()?.status === 'accepted') resolveUpdate(snapshot.data());
      }, rejectUpdate);
    });
    await Promise.all([
      assertSucceeds(runTransaction(b, async (txn) => {
        const snapshot = await txn.get(doc(b, 'invitations', id));
        assert.equal(snapshot.data().createdBy, 'alice');
        queueRedemption(txn, b, id, 'alice', 'bob');
      })),
      accepted.then((data) => assert.equal(data.claimedBy, 'bob')),
    ]);
  } finally {
    unsubscribe?.();
  }

  for (const [db, uid] of [[a, 'alice'], [b, 'bob']]) {
    assert.equal((await getDoc(doc(db, 'users', uid))).data().activeCoupleId, id);
    assert.deepEqual((await getDoc(doc(db, 'couples', id))).data().memberIds, ['alice', 'bob']);
  }
  await assertFails(batchRedemption(c, id, 'alice', 'carol'));
  await assertFails(batchRedemption(c, spare, 'alice', 'carol'));
  await assertFails(updateDoc(doc(c, 'couples', id), { sharedXP: 0 }));
  await assertFails(getDoc(doc(c, 'couples', id)));
  await assertFails(setDoc(doc(c, 'couples', id, 'privateData', 'carol'), { note: 'denied' }));
  await assertFails(updateDoc(doc(b, 'couples', id), { memberIds: ['alice', 'bob', 'carol'] }));
  await assertFails(updateDoc(doc(b, 'users', 'bob'), { activeCoupleId: null }));
  await assertFails(deleteDoc(doc(b, 'users', 'bob')));
});

test('expired invitations cannot be read or redeemed by a recipient', async () => {
  const id = code('D');
  await env.withSecurityRulesDisabled(async (context) => {
    const db = context.firestore();
    await setDoc(doc(db, 'invitations', id), {
      ...invitation(id, 'carol'), expiresAt: Timestamp.fromMillis(Date.now() - 60000),
    });
    await setDoc(doc(db, 'users', 'dana'), { activeCoupleId: null });
  });
  const d = env.authenticatedContext('dana').firestore();
  await assertFails(getDoc(doc(d, 'invitations', id)));
  await assertFails(batchRedemption(d, id, 'carol', 'dana'));
});

test('concurrent redemptions of separate invitations can pair the inviter only once', async () => {
  const profiles = ['host', 'first', 'second'].map((uid) => ({
    uid, db: env.authenticatedContext(uid).firestore(),
  }));
  await Promise.all(profiles.map(({ db, uid }) =>
    setDoc(doc(db, 'users', uid), { activeCoupleId: null })));
  const [host, ...guests] = profiles;
  const ids = [code('E'), code('F')];
  await Promise.all(ids.map((id) => setDoc(doc(host.db, 'invitations', id), invitation(id, host.uid))));

  const results = await Promise.allSettled(guests.map(({ uid, db }, index) =>
    batchRedemption(db, ids[index], host.uid, uid)));
  const winner = results.findIndex(({ status }) => status === 'fulfilled');
  assert.notEqual(winner, -1);
  const loser = 1 - winner;
  assert.equal(results[loser].reason?.code, 'permission-denied');
  assert.equal((await getDoc(doc(host.db, 'users', host.uid))).data().activeCoupleId, ids[winner]);
  assert.equal((await getDoc(doc(guests[loser].db, 'users', guests[loser].uid))).data().activeCoupleId, null);
  assert.equal((await getDoc(doc(host.db, 'invitations', ids[loser]))).data().status, 'pending');
});

test('shared dates are visible to partners and protected from unrelated access', async () => {
  const id = code('A');
  const anniversary = (db) => doc(db, 'couples', id, 'togetherDates', 'anniversary');
  await assertSucceeds(setDoc(anniversary(a), { date: '2024-02-29' }));
  assert.equal((await assertSucceeds(getDoc(anniversary(b)))).data().date, '2024-02-29');
  await assertFails(getDoc(anniversary(c)));
  await assertFails(setDoc(anniversary(c), { date: '2026-01-01' }));
  await assertFails(setDoc(anniversary(b), { date: 'today', privateNote: 'extra field' }));
  await assertSucceeds(deleteDoc(anniversary(b)));
});

test('Last Heart session authorizes teammates and enforces move and winner transitions', async () => {
  const id = code('A');
  const session = (db) => doc(db, 'gameSessions', 'last-heart-test');
  const initial = {
    id: 'last-heart-test', coupleId: id, gameId: 'last-heart', gameMode: 'turn_based',
    playerIds: ['alice', 'bob'], readyPlayers: ['alice'], status: 'waiting', currentTurn: 'alice',
    gameState: { remaining: 15, turnNumber: 0, round: 1, maxRounds: 5 },
    scores: { alice: 0, bob: 0 }, winnerId: null, xpAwarded: 0,
    createdAt: serverTimestamp(), updatedAt: serverTimestamp(),
  };
  await assertFails(setDoc(session(a), initial));
  const lobby = writeBatch(a);
  lobby.set(session(a), initial);
  lobby.set(doc(a, 'couples', id, 'gameLobbies', 'last-heart'), { sessionId: initial.id });
  await assertSucceeds(lobby.commit());

  const lobbies = (db) => query(collection(db, 'gameSessions'), where('coupleId', '==', id),
    where('status', 'in', ['waiting', 'active', 'ready']));
  assert.equal((await assertSucceeds(getDocs(lobbies(b)))).size, 1);
  await assertFails(getDocs(lobbies(c)));
  await assertFails(getDoc(session(c)));
  await assertFails(updateDoc(session(a), { readyPlayers: ['alice', 'bob'], status: 'active', updatedAt: serverTimestamp() }));
  await assertSucceeds(updateDoc(session(b), { readyPlayers: ['alice', 'bob'], status: 'active', updatedAt: serverTimestamp() }));

  const move = (remaining, turnNumber, currentTurn) => ({
    gameState: { ...initial.gameState, remaining, turnNumber }, currentTurn, updatedAt: serverTimestamp(),
  });
  await assertFails(updateDoc(session(b), move(12, 1, 'alice')));
  await assertFails(updateDoc(session(a), move(11, 1, 'bob')));
  await assertSucceeds(updateDoc(session(a), move(12, 1, 'bob')));
  await assertSucceeds(updateDoc(session(b), move(9, 2, 'alice')));
  await assertSucceeds(updateDoc(session(a), move(6, 3, 'bob')));
  await assertSucceeds(updateDoc(session(b), move(3, 4, 'alice')));
  await assertFails(updateDoc(session(a), { ...move(0, 5, 'alice'), status: 'completed', winnerId: 'bob', xpAwarded: 30, 'scores.bob': 1 }));
  await assertSucceeds(updateDoc(session(a), { ...move(0, 5, 'alice'), status: 'completed', winnerId: 'alice', xpAwarded: 30, 'scores.alice': 1 }));
  assert.equal((await getDoc(session(b))).data().winnerId, 'alice');
});

if (process.env.TOGETHERLY_BASELINE_RULES) {
  test('deployed rules deny precisely the inviter profile update in the APK transaction', async () => {
    const original = await initializeTestEnvironment({
      projectId,
      firestore: { rules: readFileSync(process.env.TOGETHERLY_BASELINE_RULES, 'utf8') },
    });
    try {
      await original.clearFirestore();
      const host = original.authenticatedContext('alice').firestore();
      const guest = original.authenticatedContext('bob').firestore();
      await setDoc(doc(host, 'users', 'alice'), { activeCoupleId: null });
      await setDoc(doc(guest, 'users', 'bob'), { activeCoupleId: null });
      await setDoc(doc(host, 'invitations', 'ABCDEF'), invitation('ABCDEF', 'alice'));
      const redeem = (omit) => runTransaction(guest, async (txn) => {
        assert.equal((await txn.get(doc(guest, 'invitations', 'ABCDEF'))).data().createdBy, 'alice');
        queueRedemption(txn, guest, 'ABCDEF', 'alice', 'bob', { omit, coupleId: 'cpl_legacy' });
      });
      await assertFails(redeem());
      assert.equal((await getDoc(doc(host, 'invitations', 'ABCDEF'))).data().status, 'pending');
      await assertSucceeds(redeem('alice'));
      assert.equal((await getDoc(doc(host, 'users', 'alice'))).data().activeCoupleId, null);
    } finally {
      await original.cleanup();
    }
  });
}
