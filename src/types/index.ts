/**
 * TOGETHERLY — CORE DATA TYPES & ZOD SCHEMAS
 */
import { z } from 'zod';

export type AccountStatus = 'active' | 'suspended' | 'deleted';
export type ThemeMode = 'light' | 'dark' | 'system';

export interface UserPreferences {
  notificationsEnabled: boolean;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  matureContentAllowed: boolean;
  theme: ThemeMode;
}

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string;
  avatarId: string;
  createdAt: number;
  updatedAt: number;
  activeCoupleId: string | null;
  accountStatus: AccountStatus;
  fcmTokens: string[];
  preferences: UserPreferences;
}

export interface CoupleMemberSummary {
  displayName: string;
  avatarId: string;
  joinedAt: number;
  isOnline?: boolean;
  lastActiveAt?: number;
}

export interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate: string; // YYYY-MM-DD
}

export interface SubscriptionSummary {
  isPlus: boolean;
  tier: 'free' | 'monthly' | 'annual' | 'lifetime';
  purchasedByUid?: string;
  expiresAt?: number;
}

export interface CoupleProfile {
  id: string;
  memberIds: [string, string];
  members: Record<string, CoupleMemberSummary>;
  createdAt: number;
  createdBy: string;
  status: 'active' | 'disconnected';
  sharedXP: number;
  coupleLevel: number;
  streakData: StreakData;
  subscriptionSummary: SubscriptionSummary;
}

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

export interface CoupleInvitation {
  id: string;
  code: string; // 6-character code
  createdBy: string;
  creatorName: string;
  creatorAvatarId: string;
  status: InvitationStatus;
  createdAt: number;
  expiresAt: number;
  claimedBy?: string;
  claimedAt?: number;
}

export type GameCategory = 
  | 'relationship_quiz'
  | 'truth_or_dare'
  | 'preferences'
  | 'trivia'
  | 'drawing'
  | 'classic_board'
  | 'word_puzzle'
  | 'mini_action';

export type GameplayMode = 'realtime' | 'turn_based' | 'simultaneous';

export type GameSessionStatus = 
  | 'waiting'
  | 'ready'
  | 'active'
  | 'completed'
  | 'abandoned'
  | 'expired';

export interface GameDefinition {
  id: string;
  name: string;
  tagline: string;
  category: GameCategory;
  categoryLabel: string;
  iconName: string;
  gameMode: GameplayMode;
  estimatedMinutes: number;
  isPremium: boolean;
  isImplemented: boolean;
  description: string;
  instructions: string[];
  rulesSummary: string;
}

export interface GameAction {
  id: string;
  playerId: string;
  actionType: string;
  payload: Record<string, any>;
  idempotencyKey?: string;
  serverTimestamp: number;
}

export interface PrivateSubmission {
  playerId: string;
  round: number;
  encryptedOrSecretAnswer: any;
  submittedAt: number;
}

export interface GameSession {
  id: string;
  coupleId: string;
  gameId: string;
  playerIds: [string, string];
  readyPlayers: string[];
  status: GameSessionStatus;
  gameMode: GameplayMode;
  currentTurn?: string;
  scores: Record<string, number>;
  gameState: Record<string, any>;
  winnerId: string | 'draw' | null;
  xpAwarded: number;
  rematchSessionId?: string;
  rematchRequestedBy?: string;
  abandonedBy?: string;
  createdAt: number;
  updatedAt: number;
  expiresAt: number;
}

export interface DailyChallenge {
  id: string; // YYYY-MM-DD
  date: string;
  title: string;
  description: string;
  category: 'quiz' | 'action' | 'game' | 'reflection';
  targetGameId?: string;
  targetCount: number;
  rewardXP: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  rewardXP: number;
  icon: string;
  unlockedAt?: number;
}

// Zod Validation Schemas
export const RegisterSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  displayName: z.string().min(2, 'Name must be at least 2 characters').max(30, 'Name is too long'),
});

export const LoginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const InvitationCodeSchema = z.object({
  code: z
    .string()
    .length(6, 'Invitation code must be exactly 6 characters')
    .regex(/^[A-Z0-9]+$/, 'Code can only contain letters and numbers'),
});

