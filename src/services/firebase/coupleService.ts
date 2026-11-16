/**
 * TOGETHERLY — COUPLE & INVITATION SERVICE
 *
 * Implements atomic pairing, 6-character code generation,
 * 48-hour expiration checks, Firestore real-time partner synchronization,
 * and offline/mock mode fallback.
 */
import { CoupleProfile, CoupleInvitation, UserProfile } from '@/types';
import { db, isFirebaseConfigured, runtimeMode } from './config';
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
  /**
   * Generates a random uppercase 6-character alphanumeric invite code
   */
  generateInviteCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
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

      return await runTransaction(firestore, async (txn) => {
        const inviteSnap = await txn.get(inviteRef);
        if (!inviteSnap.exists()) {
          throw new Error('Invitation code not found. Please double check the 6-character code.');
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

        const coupleId = `cpl_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
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

    return newCouple;
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
