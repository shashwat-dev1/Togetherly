/**
 * UNIT & INTEGRATION TESTS — PAIRING & INPUT VALIDATION
 */
import { RegisterSchema, InvitationCodeSchema } from '../../types';
import { CoupleService } from '../../services/firebase/coupleService';

describe('Validation Schemas (Zod)', () => {
  test('validates correct registration payloads', () => {
    const valid = {
      displayName: 'Alex',
      email: 'alex@togetherly.test',
      password: 'password123',
    };
    const res = RegisterSchema.safeParse(valid);
    expect(res.success).toBe(true);
  });

  test('rejects short passwords', () => {
    const invalid = {
      displayName: 'Alex',
      email: 'alex@togetherly.test',
      password: 'short',
    };
    const res = RegisterSchema.safeParse(invalid);
    expect(res.success).toBe(false);
  });

  test('validates 6-character invitation code', () => {
    expect(InvitationCodeSchema.safeParse({ code: 'ABC123' }).success).toBe(true);
    expect(InvitationCodeSchema.safeParse({ code: 'TOOLONG' }).success).toBe(false);
    expect(InvitationCodeSchema.safeParse({ code: 'SHRT' }).success).toBe(false);
    expect(InvitationCodeSchema.safeParse({ code: 'ab#123' }).success).toBe(false);
  });
});

describe('Couple Pairing Lifecycle', () => {
  test('generates unique 6-character alphanumeric invite codes', () => {
    const code = CoupleService.generateInviteCode();
    expect(code).toHaveLength(6);
    expect(code).toMatch(/^[A-Z0-9]+$/);
  });

  test('creates pending invitation with 48h expiration window', async () => {
    const mockUser = {
      uid: 'user_host_1',
      displayName: 'Host User',
      avatarId: 'avatar_bear',
      email: 'host@test.com',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      activeCoupleId: null,
      accountStatus: 'active' as const,
      fcmTokens: [],
      preferences: {
        notificationsEnabled: true,
        soundEnabled: true,
        hapticsEnabled: true,
        matureContentAllowed: false,
        theme: 'light' as const,
      },
    };

    const invite = await CoupleService.createInvitation(mockUser);
    expect(invite.code).toHaveLength(6);
    expect(invite.createdBy).toBe(mockUser.uid);
    expect(invite.status).toBe('pending');
    expect(invite.expiresAt - invite.createdAt).toBe(48 * 60 * 60 * 1000);
  });

  test('prevents self-pairing when same user tries to claim own code', async () => {
    const mockUser = {
      uid: 'user_host_self',
      displayName: 'Self User',
      avatarId: 'avatar_bear',
      email: 'self@test.com',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      activeCoupleId: null,
      accountStatus: 'active' as const,
      fcmTokens: [],
      preferences: {
        notificationsEnabled: true,
        soundEnabled: true,
        hapticsEnabled: true,
        matureContentAllowed: false,
        theme: 'light' as const,
      },
    };

    const invite = await CoupleService.createInvitation(mockUser);
    await expect(CoupleService.acceptInvitation(invite.code, mockUser)).rejects.toThrow(
      'You cannot pair with yourself'
    );
  });

  test('successfully links two different users into an active couple', async () => {
    const hostUser = {
      uid: 'user_host_a',
      displayName: 'Alice',
      avatarId: 'avatar_bunny',
      email: 'alice@test.com',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      activeCoupleId: null,
      accountStatus: 'active' as const,
      fcmTokens: [],
      preferences: {
        notificationsEnabled: true,
        soundEnabled: true,
        hapticsEnabled: true,
        matureContentAllowed: false,
        theme: 'light' as const,
      },
    };

    const partnerUser = {
      uid: 'user_partner_b',
      displayName: 'Bob',
      avatarId: 'avatar_fox',
      email: 'bob@test.com',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      activeCoupleId: null,
      accountStatus: 'active' as const,
      fcmTokens: [],
      preferences: {
        notificationsEnabled: true,
        soundEnabled: true,
        hapticsEnabled: true,
        matureContentAllowed: false,
        theme: 'light' as const,
      },
    };

    const invite = await CoupleService.createInvitation(hostUser);
    const couple = await CoupleService.acceptInvitation(invite.code, partnerUser);

    expect(couple.status).toBe('active');
    expect(couple.memberIds).toContain(hostUser.uid);
    expect(couple.memberIds).toContain(partnerUser.uid);
    expect(couple.members[hostUser.uid].displayName).toBe('Alice');
    expect(couple.members[partnerUser.uid].displayName).toBe('Bob');
  });
});

