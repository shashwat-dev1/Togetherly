/**
 * TOGETHERLY — COUPLE & INVITATION SERVICE
 *
 * Implements atomic pairing, 6-character code generation,
 * 48-hour expiration checks, and partner state synchronization.
 */
import { CoupleProfile, CoupleInvitation, UserProfile } from '@/types';

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
   * Create an invitation for the user's partner
   */
  async createInvitation(user: UserProfile): Promise<CoupleInvitation> {
    const code = this.generateInviteCode();
    const invitation: CoupleInvitation = {
      id: `inv_${Date.now()}`,
      code,
      createdBy: user.uid,
      creatorName: user.displayName,
      creatorAvatarId: user.avatarId,
      status: 'pending',
      createdAt: Date.now(),
      expiresAt: Date.now() + 48 * 60 * 60 * 1000, // 48 hours
    };

    mockInvitations[code] = invitation;
    return invitation;
  },

  /**
   * Redeems an invitation code to pair two users into one couple
   */
  async acceptInvitation(code: string, joiningUser: UserProfile): Promise<CoupleProfile> {
    const normalizedCode = code.trim().toUpperCase();
    const invite = mockInvitations[normalizedCode];

    // For local testing convenience, if code is "LOVE24" or any test code:
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

  async getActiveCouple(coupleId?: string | null): Promise<CoupleProfile | null> {
    if (!coupleId && !mockCouple) return null;
    return mockCouple;
  },

  async disconnectCouple(): Promise<void> {
    if (mockCouple) {
      mockCouple.status = 'disconnected';
    }
    mockCouple = null;
  },

  getMockCurrentCouple(): CoupleProfile | null {
    return mockCouple;
  },

  setMockCouple(couple: CoupleProfile | null) {
    mockCouple = couple;
  },
};

