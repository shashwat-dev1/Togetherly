/**
 * TOGETHERLY — COUPLE & INVITATION SERVICE
 *
 * Implements atomic pairing, secure code generation,
 * 48-hour expiration checks, Firestore real-time partner synchronization,
 * and offline/mock mode fallback.
 */
import {
  CoupleProfile,
  CoupleInvitation,
  UserProfile,
  INVITATION_CODE_ALPHABET,
  INVITATION_CODE_LENGTH,
  InvitationCodeSchema,
} from '@/types';
import { getRandomValues } from 'expo-crypto';
import { auth, db, isFirebaseConfigured, runtimeMode } from './config';
import { NotificationService } from '@/services/notifications/notificationService';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  runTransaction,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  Unsubscribe,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';

// Pre-seeded couple profile for development preview
let mockCouple: CoupleProfile | null = {
  id: 'couple_mock_123',
  memberIds: ['usr_mock_alex', 'usr_mock_sam'],
  members: {
    usr_mock_alex: {
      displayName: 'Alex',
      avatarId: 'avatar_bear',
      joinedAt: Date.now() - 86400000 * 7,
      isOnline: true,
      lastActiveAt: Date.now(),
    },
    usr_mock_sam: {
      displayName: 'Sam',
      avatarId: 'avatar_fox',
      joinedAt: Date.now() - 86400000 * 7,
      isOnline: true,
      lastActiveAt: Date.now() - 1000 * 60 * 12,
    },
  },
  createdAt: Date.now() - 86400000 * 7,
  createdBy: 'usr_mock_alex',
  status: 'active',
  sharedXP: 1450,
  coupleLevel: 5,
  streakData: {
    currentStreak: 7,
    longestStreak: 14,
    lastActiveDate: new Date().toISOString().split('T')[0],
  },
  subscriptionSummary: {
    isPlus: false,
    tier: 'free',
  },
};

const mockInvitations: Record<string, CoupleInvitation> = {};

export const CoupleService = {
  generateInviteCode(): string {
    const bytes = getRandomValues(new Uint8Array(INVITATION_CODE_LENGTH));
    return Array.from(bytes, (byte) => INVITATION_CODE_ALPHABET[byte & 31]).join('');
  },

  /**
   * Create an invitation for the user's partner.
   * Persists to Firestore `invitations/{code}` with a 48-hour expiration window.
   */
  async createInvitation(user: UserProfile): Promise<CoupleInvitation> {
    const code = this.generateInviteCode();
    const expiresAt = Date.now() + 48 * 60 * 60 * 1000;

    const invitation: CoupleInvitation = {
      id: code,
      code,
      createdBy: user.uid,
      creatorName: user.displayName,
      creatorAvatarId: user.avatarId,
      status: 'pending',
      createdAt: Date.now(),
      expiresAt,
    };

    if (isFirebaseConfigured && db) {
      const firestore = db;
      const inviteRef = doc(firestore, 'invitations', code);
      await setDoc(inviteRef, {
        ...invitation,
        createdAt: serverTimestamp(),
        expiresAt: Timestamp.fromMillis(expiresAt),
      });
      return invitation;
    }

    mockInvitations[code] = invitation;
    return invitation;
  },

  /**
   * Redeems an invitation code to pair two users into one couple atomically.
   */
  async acceptInvitation(code: string, joiningUser: UserProfile): Promise<CoupleProfile> {
    const normalizedCode = code.trim().toUpperCase();

    if (isFirebaseConfigured && db) {
      const firestore = db;
      const inviteRef = doc(firestore, 'invitations', normalizedCode);

      if (auth?.currentUser?.uid !== joiningUser.uid) {
        throw new Error('Sign in again before connecting with your partner.');
      }
      if (!InvitationCodeSchema.safeParse({ code: normalizedCode }).success) {
        throw new Error('This invitation code is invalid. Ask your partner for a new code.');
      }
      const couple = await runTransaction(firestore, async (txn) => {
        const inviteSnap = await txn.get(inviteRef);
        if (!inviteSnap.exists()) {
          throw new Error('Invitation code not found. Please double check the code.');
        }

        const inviteData = inviteSnap.data();
        if (inviteData.status !== 'pending') {
          throw new Error('This invitation code has already been redeemed.');
        }

        const expiresAtMillis = inviteData.expiresAt?.toMillis
          ? inviteData.expiresAt.toMillis()
          : inviteData.expiresAt;
        if (Date.now() > expiresAtMillis) {
          throw new Error('This invitation code has expired. Please ask your partner for a new code.');
        }

        if (inviteData.createdBy === joiningUser.uid) {
          throw new Error('You cannot pair with yourself. Share the code with your partner!');
        }

        const partnerId = inviteData.createdBy;
        const partnerName = inviteData.creatorName || 'Partner';
        const partnerAvatar = inviteData.creatorAvatarId || 'avatar_fox';

        // Rules resolve the invitation and couple by the same document ID.
        const coupleId = normalizedCode;
        const coupleRef = doc(firestore, 'couples', coupleId);

        const newCouple: CoupleProfile = {
          id: coupleId,
          memberIds: [partnerId, joiningUser.uid],
          members: {
            [partnerId]: {
              displayName: partnerName,
              avatarId: partnerAvatar,
              joinedAt: Date.now(),
              isOnline: true,
              lastActiveAt: Date.now(),
            },
            [joiningUser.uid]: {
              displayName: joiningUser.displayName,
              avatarId: joiningUser.avatarId,
              joinedAt: Date.now(),
              isOnline: true,
              lastActiveAt: Date.now(),
            },
          },
          createdAt: Date.now(),
          createdBy: partnerId,
          status: 'active',
          sharedXP: 100,
          coupleLevel: 1,
          streakData: {
            currentStreak: 1,
            longestStreak: 1,
            lastActiveDate: new Date().toISOString().split('T')[0],
          },
          subscriptionSummary: {
            isPlus: false,
            tier: 'free',
          },
        };

        // 1. Mark invitation as accepted
        txn.update(inviteRef, {
          status: 'accepted',
          claimedBy: joiningUser.uid,
          claimedAt: serverTimestamp(),
        });

        // 2. Create the couple document
        txn.set(coupleRef, {
          ...newCouple,
          createdAt: serverTimestamp(),
        });

        // 3. Link coupleId on joining user doc
        const joiningUserRef = doc(firestore, 'users', joiningUser.uid);
        txn.update(joiningUserRef, {
          activeCoupleId: coupleId,
          updatedAt: serverTimestamp(),
        });

        // 4. Link coupleId on partner doc
        const partnerRef = doc(firestore, 'users', partnerId);
        txn.update(partnerRef, {
          activeCoupleId: coupleId,
          updatedAt: serverTimestamp(),
        });

        return newCouple;
      });

      NotificationService.sendNotification({
        toUid: couple.createdBy,
        type: 'partner_accepted',
        title: 'Your person is here! ❤️',
        body: 'The wait is over. Your little world is officially connected.',
        data: { coupleId: couple.id },
      }).catch(() => {});
      return couple;
    }

    // Mock Mode
    const invite = mockInvitations[normalizedCode];
    const partnerName = invite ? invite.creatorName : 'Partner';
    const partnerId = invite ? invite.createdBy : 'usr_partner_demo';
    const partnerAvatar = invite ? invite.creatorAvatarId : 'avatar_fox';

    if (invite && invite.createdBy === joiningUser.uid) {
      throw new Error('You cannot pair with yourself. Share the code with your partner!');
    }

    const coupleId = `cpl_${Date.now().toString(36)}`;
    const newCouple: CoupleProfile = {
      id: coupleId,
      memberIds: [partnerId, joiningUser.uid],
      members: {
        [partnerId]: {
          displayName: partnerName,
          avatarId: partnerAvatar,
          joinedAt: Date.now(),
          isOnline: true,
          lastActiveAt: Date.now(),
        },
        [joiningUser.uid]: {
          displayName: joiningUser.displayName,
          avatarId: joiningUser.avatarId,
          joinedAt: Date.now(),
          isOnline: true,
          lastActiveAt: Date.now(),
        },
      },
      createdAt: Date.now(),
      createdBy: partnerId,
      status: 'active',
      sharedXP: 100,
      coupleLevel: 1,
      streakData: {
        currentStreak: 1,
        longestStreak: 1,
        lastActiveDate: new Date().toISOString().split('T')[0],
      },
      subscriptionSummary: {
        isPlus: false,
        tier: 'free',
      },
    };

    mockCouple = newCouple;
    if (invite) {
      invite.status = 'accepted';
      invite.claimedBy = joiningUser.uid;
      invite.claimedAt = Date.now();
    }

    // Notify partner in mock mode too
    NotificationService.sendNotification({
      toUid: partnerId,
      type: 'partner_accepted',
      title: 'Your person is here! ❤️',
      body: 'The wait is over. Your little world is officially connected.',
      data: { coupleId },
    }).catch(() => {});

    return newCouple;
  },

  /**
   * Cancels an active pending invitation.
   */
  async cancelInvitation(code: string, userId: string): Promise<void> {
    const normalizedCode = code.trim().toUpperCase();
    if (isFirebaseConfigured && db) {
      const inviteRef = doc(db, 'invitations', normalizedCode);
      const snap = await getDoc(inviteRef);
      if (snap.exists() && snap.data().createdBy === userId) {
        await updateDoc(inviteRef, {
          status: 'cancelled',
          cancelledAt: serverTimestamp(),
        });
      }
      return;
    }

    const invite = mockInvitations[normalizedCode];
    if (invite && invite.createdBy === userId) {
      invite.status = 'cancelled';
    }
  },

  /**
   * Checks if the user has an active pending invitation created by them.
   */
  async getActiveInvitationForUser(userId: string): Promise<CoupleInvitation | null> {
    if (isFirebaseConfigured && db) {
      try {
        const q = query(
          collection(db, 'invitations'),
          where('createdBy', '==', userId),
          where('status', '==', 'pending')
        );
        const snap = await getDocs(q);
        const docSnap = snap.docs.find((candidate) => {
          const expiry = candidate.data().expiresAt;
          return InvitationCodeSchema.safeParse({ code: candidate.id }).success &&
            expiry instanceof Timestamp && expiry.toMillis() > Date.now();
        });
        if (docSnap) {
          const data = docSnap.data();
          const expiresAt = data.expiresAt?.toMillis ? data.expiresAt.toMillis() : (data.expiresAt || 0);
          if (Date.now() < expiresAt) {
            return {
              id: docSnap.id,
              code: data.code,
              createdBy: data.createdBy,
              creatorName: data.creatorName,
              creatorAvatarId: data.creatorAvatarId,
              status: 'pending',
              createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
              expiresAt,
            };
          }
        }
      } catch (err) {
        console.warn('[CoupleService] getActiveInvitationForUser warning:', err);
      }
      return null;
    }

    const found = Object.values(mockInvitations).find(
      (inv) => inv.createdBy === userId && inv.status === 'pending' && Date.now() < inv.expiresAt
    );
    return found || null;
  },

  /**
   * Retrieves active couple profile.
   */
  async getActiveCouple(coupleId?: string | null): Promise<CoupleProfile | null> {
    if (isFirebaseConfigured && db) {
      if (!coupleId) return null;
      const firestore = db;
      const coupleRef = doc(firestore, 'couples', coupleId);
      const snap = await getDoc(coupleRef);
      if (!snap.exists()) return null;
      const data = snap.data();
      return {
        ...data,
        id: snap.id,
        createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
      } as CoupleProfile;
    }

    if (!coupleId && !mockCouple) return null;
    return mockCouple;
  },

  /**
   * Subscribes to real-time couple document updates so both partner phones update immediately.
   */
  subscribeToCouple(
    coupleId: string,
    onUpdate: (couple: CoupleProfile) => void,
    onError?: (err: Error) => void
  ): Unsubscribe {
    if (isFirebaseConfigured && db) {
      const firestore = db;
      const coupleRef = doc(firestore, 'couples', coupleId);
      return onSnapshot(
        coupleRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            onUpdate({
              ...data,
              id: snap.id,
              createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
            } as CoupleProfile);
          }
        },
        (err) => {
          console.error('[CoupleService] Snapshot listener error:', err);
          if (onError) onError(err);
        }
      );
    }

    return () => {};
  },

  /**
   * Subscribes to real-time invitation document updates so creator's phone detects partner pairing immediately.
   */
  subscribeToInvitation(
    code: string,
    onAccepted: (claimedBy: string) => void,
    onError?: (err: Error) => void
  ): Unsubscribe {
    if (isFirebaseConfigured && db) {
      const inviteRef = doc(db, 'invitations', code.trim().toUpperCase());
      return onSnapshot(
        inviteRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            if (data.status === 'accepted' && data.claimedBy) {
              onAccepted(data.claimedBy);
            }
          }
        },
        (err) => {
          if (onError) onError(err);
        }
      );
    }
    return () => {};
  },

  async disconnectCouple(coupleId?: string | null): Promise<void> {
    if (isFirebaseConfigured && db && coupleId) {
      const firestore = db;
      const coupleRef = doc(firestore, 'couples', coupleId);
      await updateDoc(coupleRef, {
        status: 'disconnected',
        updatedAt: serverTimestamp(),
      });
    }
    if (mockCouple) {
      mockCouple.status = 'disconnected';
    }
    mockCouple = null;
  },

  getMockCurrentCouple(): CoupleProfile | null {
    return runtimeMode === 'mock' ? mockCouple : null;
  },

  setMockCouple(couple: CoupleProfile | null) {
    mockCouple = couple;
  },
};
