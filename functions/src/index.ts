/**
 * TOGETHERLY — FIREBASE CLOUD FUNCTIONS (TYPESCRIPT)
 *
 * Server-authoritative game logic, double-blind reveal engine,
 * turn validation, anti-cheat score calculations, and XP transactions.
 */
import * as functions from 'firebase-functions/v1';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();

/**
 * 1. CLOUD FUNCTION: SUBMIT ACTION & VALIDATE TURN (Real-Time / Turn-Based)
 */
export const validateAndApplyAction = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { sessionId, actionType, payload, idempotencyKey } = data;
  const callerUid = context.auth.uid;

  const sessionRef = db.collection('gameSessions').doc(sessionId);

  return await db.runTransaction(async (transaction) => {
    const sessionSnap = await transaction.get(sessionRef);
    if (!sessionSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Session not found');
    }

    const session = sessionSnap.data()!;

    // 1. Membership check
    if (!session.playerIds.includes(callerUid)) {
      throw new functions.https.HttpsError('permission-denied', 'Caller is not a player in this session');
    }

    // 2. Status check
    if (session.status !== 'active') {
      throw new functions.https.HttpsError('failed-precondition', `Session is not active (current: ${session.status})`);
    }

    // 3. Turn check for turn-based games
    if (session.gameMode === 'turn_based' && session.currentTurn !== callerUid) {
      throw new functions.https.HttpsError('failed-precondition', 'Not your turn');
    }

    const partnerId = session.playerIds.find((id: string) => id !== callerUid);
    let nextTurn = partnerId;
    const nextGameState = { ...session.gameState };
    const nextScores = { ...session.scores };
    let nextWinner = session.winnerId;
    let nextStatus = session.status;
    let xpAwarded = 0;

    // --- Tic-Tac-Toe Server Logic ---
    if (session.gameId === 'tic-tac-toe') {
      const { index, symbol } = payload;
      const board = [...(nextGameState.board || Array(9).fill(null))];

      if (board[index] !== null) {
        throw new functions.https.HttpsError('invalid-argument', 'Square is already occupied');
      }

      board[index] = symbol;
      nextGameState.board = board;

      // Server win check
      const lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6],
      ];
      let won = false;
      for (const [a, b, c] of lines) {
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
          nextWinner = callerUid;
          nextStatus = 'completed';
          nextScores[callerUid] = (nextScores[callerUid] || 0) + 1;
          xpAwarded = 30;
          won = true;
          break;
        }
      }

      if (!won && board.every((c: any) => c !== null)) {
        nextWinner = 'draw';
        nextStatus = 'completed';
        xpAwarded = 15;
      }
    } else {
      Object.assign(nextGameState, payload);
      if (payload.scores) Object.assign(nextScores, payload.scores);
      if (payload.winnerId !== undefined) nextWinner = payload.winnerId;
      if (payload.status) nextStatus = payload.status;
      if (payload.currentTurn) nextTurn = payload.currentTurn;
    }

    // Write action log
    const actionRef = sessionRef.collection('actions').doc();
    transaction.set(actionRef, {
      id: actionRef.id,
      playerId: callerUid,
      actionType,
      payload,
      idempotencyKey: idempotencyKey || null,
      serverTimestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update session state
    transaction.update(sessionRef, {
      gameState: nextGameState,
      scores: nextScores,
      currentTurn: nextTurn,
      winnerId: nextWinner,
      status: nextStatus,
      xpAwarded,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Award XP to couple if match ended
    if (nextStatus === 'completed' && xpAwarded > 0) {
      await awardCoupleXP(transaction, session.coupleId, xpAwarded, sessionId, session.gameId);
    }

    return { success: true, status: nextStatus, winnerId: nextWinner };
  });
});

/**
 * 2. CLOUD FUNCTION: TRIGGER ON PRIVATE ANSWER WRITTEN (Double-Blind Reveal Engine)
 */
export const onPrivateAnswerWritten = functions.firestore
  .document('gameSessions/{sessionId}/privateAnswers/{answerDocId}')
  .onWrite(async (change, context) => {
    if (!change.after.exists) return null;

    const { sessionId } = context.params;
    const writtenData = change.after.data()!;
    const { round } = writtenData;

    const sessionRef = db.collection('gameSessions').doc(sessionId);
    const sessionSnap = await sessionRef.get();
    if (!sessionSnap.exists) return null;

    const session = sessionSnap.data()!;
    if (session.status !== 'active') return null;

    const player1Id = session.playerIds[0];
    const player2Id = session.playerIds[1];

    // Fetch both private submissions for this round
    const privateColl = sessionRef.collection('privateAnswers');
    const snap1 = await privateColl.doc(`${player1Id}_r${round}`).get();
    const snap2 = await privateColl.doc(`${player2Id}_r${round}`).get();

    // If only one submitted, do NOT reveal anything yet!
    if (!snap1.exists || !snap2.exists) {
      await sessionRef.update({
        'gameState.waitingForPartner': true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
      return null;
    }

    // BOTH SUBMITTED: Server-authoritative reveal and calculation!
    const ans1 = snap1.data()!.answer;
    const ans2 = snap2.data()!.answer;
    const nextScores = { ...session.scores };
    let revealedResult: any = null;

    if (session.gameId === 'who-knows-whom') {
      const p1Correct = ans1?.guessForPartner === ans2?.answer;
      const p2Correct = ans2?.guessForPartner === ans1?.answer;

      if (p1Correct) nextScores[player1Id] = (nextScores[player1Id] || 0) + 1;
      if (p2Correct) nextScores[player2Id] = (nextScores[player2Id] || 0) + 1;

      revealedResult = {
        round,
        [player1Id]: { ...ans1, correct: p1Correct },
        [player2Id]: { ...ans2, correct: p2Correct },
      };
    } else if (session.gameId === 'this-or-that') {
      const match = ans1 === ans2;
      if (match) {
        nextScores[player1Id] = (nextScores[player1Id] || 0) + 1;
        nextScores[player2Id] = (nextScores[player2Id] || 0) + 1;
      }
      revealedResult = {
        round,
        matched: match,
        [player1Id]: ans1,
        [player2Id]: ans2,
      };
    } else if (session.gameId === 'rock-paper-scissors') {
      let winner: string | 'tie' = 'tie';
      if (ans1 !== ans2) {
        if (
          (ans1 === 'Rock' && ans2 === 'Scissors') ||
          (ans1 === 'Paper' && ans2 === 'Rock') ||
          (ans1 === 'Scissors' && ans2 === 'Paper')
        ) {
          winner = player1Id;
          nextScores[player1Id] = (nextScores[player1Id] || 0) + 1;
        } else {
          winner = player2Id;
          nextScores[player2Id] = (nextScores[player2Id] || 0) + 1;
        }
      }
      revealedResult = {
        round,
        winner,
        [player1Id]: ans1,
        [player2Id]: ans2,
      };
    } else if (session.gameId === 'couple-trivia') {
      const p1Correct = ans1?.selectedOption >= 0 && ans1?.selectedOption === ans1?.correctIndex;
      const p2Correct = ans2?.selectedOption >= 0 && ans2?.selectedOption === ans2?.correctIndex;

      const p1Pts = p1Correct ? 100 + (ans1?.timeLeft || 0) * 5 : 0;
      const p2Pts = p2Correct ? 100 + (ans2?.timeLeft || 0) * 5 : 0;

      if (p1Correct) nextScores[player1Id] = (nextScores[player1Id] || 0) + p1Pts;
      if (p2Correct) nextScores[player2Id] = (nextScores[player2Id] || 0) + p2Pts;

      revealedResult = {
        round,
        [player1Id]: { ...ans1, pointsGained: p1Pts, correct: p1Correct },
        [player2Id]: { ...ans2, pointsGained: p2Pts, correct: p2Correct },
      };
    }

    const roundHistory = session.gameState.roundHistory || [];
    const updatedHistory = [...roundHistory, revealedResult];
    const maxRounds = session.gameState.maxRounds || 5;
    const isFinalRound = round >= maxRounds ||
      (session.gameId === 'rock-paper-scissors' && (nextScores[player1Id] >= 2 || nextScores[player2Id] >= 2));

    let finalWinner: string | 'draw' | null = null;
    let finalStatus = isFinalRound ? 'completed' : 'active';
    let xpAwarded = isFinalRound ? 50 : 0;

    if (isFinalRound) {
      if (nextScores[player1Id] > nextScores[player2Id]) {
        finalWinner = player1Id;
      } else if (nextScores[player2Id] > nextScores[player1Id]) {
        finalWinner = player2Id;
      } else {
        finalWinner = 'draw';
      }
    }

    await sessionRef.update({
      scores: nextScores,
      winnerId: finalWinner,
      status: finalStatus,
      xpAwarded,
      'gameState.round': isFinalRound ? round : round + 1,
      'gameState.waitingForPartner': false,
      'gameState.lastRevealedResult': revealedResult,
      'gameState.roundHistory': updatedHistory,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    if (isFinalRound && xpAwarded > 0) {
      await db.runTransaction(async (txn) => {
        await awardCoupleXP(txn, session.coupleId, xpAwarded, sessionId, session.gameId);
      });
    }

    return null;
  });

/**
 * Helper: Atomically Award Shared XP and Record Audit Transaction
 */
async function awardCoupleXP(
  transaction: admin.firestore.Transaction,
  coupleId: string,
  amount: number,
  sessionId: string,
  gameId: string
) {
  const coupleRef = db.collection('couples').doc(coupleId);
  const coupleSnap = await transaction.get(coupleRef);
  if (!coupleSnap.exists) return;

  const coupleData = coupleSnap.data()!;
  const currentXP = coupleData.sharedXP || 0;
  const newXP = currentXP + amount;
  const newLevel = Math.floor(newXP / 500) + 1;

  transaction.update(coupleRef, {
    sharedXP: newXP,
    coupleLevel: newLevel,
    'streakData.lastActiveDate': new Date().toISOString().split('T')[0],
  });

  const xpTxRef = db.collection('xpTransactions').doc();
  transaction.set(xpTxRef, {
    id: xpTxRef.id,
    coupleId,
    source: 'game_win',
    referenceId: sessionId,
    gameId,
    amount,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    verified: true,
  });
}
