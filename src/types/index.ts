/**
 * TOGETHERLY — CORE DATA TYPES & ZOD SCHEMAS
 */
import { z } from 'zod';

export type AccountStatus = 'active' | 'suspended' | 'deleted';
export type ThemeMode = 'light' | 'dark' | 'system';
export type ReminderFrequency = 'off' | 'light' | 'normal' | 'frequent';

export interface UserPreferences {
  notificationsEnabled: boolean;
  notifyCoupleActivity?: boolean;
  notifyGameInvitations?: boolean;
  notifyTurnReady?: boolean;
  notifyDailyChallenge?: boolean;
  notifyAchievements?: boolean;
  notifyStreakReminder?: boolean;
  notifyRomanticReminders?: boolean;
  notifyCheesy?: boolean;
  notifyFlirty?: boolean; // Default false (opt-in)
  notifyDoubleMeaning?: boolean; // Default false (opt-in)
  reminderFrequency?: ReminderFrequency;
  quietHoursEnabled?: boolean;
  quietHoursStart?: string; // 'HH:mm', e.g. '22:00'
  quietHoursEnd?: string; // 'HH:mm', e.g. '09:00'
  discreetPreviews?: boolean;
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

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'revoked' | 'cancelled';

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

export type DailyChallengeCategory = 
  | 'relationship_questions'
  | 'competitive_games'
  | 'cooperative_games'
  | 'funny_challenges'
  | 'creative_challenges'
  | 'preference_matching';

export interface DailyChallenge {
  id: string; // YYYY-MM-DD or template ID
  date: string;
  title: string;
  description: string;
  category: DailyChallengeCategory;
  targetGameId?: string;
  targetCount: number;
  rewardXP: number;
  hint?: string;
}

export interface CoupleDailyChallengeProgress {
  date: string; // YYYY-MM-DD
  challengeId: string;
  currentCount: number;
  targetCount: number;
  completed: boolean;
  rewardClaimed: boolean;
  completedAt?: number;
  contributions: Record<string, number>;
}

export type AchievementCategory = 
  | 'first_steps'
  | 'game_mastery'
  | 'consistency'
  | 'exploration'
  | 'special';

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: AchievementCategory;
  tier: AchievementTier;
  rewardXP: number;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
  progress?: number;
  targetCount?: number;
}

export interface CoupleAchievement {
  achievementId: string;
  unlockedAt: number;
  unlockedBy?: string;
  tier: AchievementTier;
  rewardClaimed: boolean;
}

export type CoupleActivityType = 
  | 'game_completed'
  | 'game_won'
  | 'daily_challenge'
  | 'achievement_unlocked'
  | 'level_up'
  | 'streak_milestone'
  | 'turn_ready';

export interface CoupleActivityItem {
  id: string;
  coupleId: string;
  type: CoupleActivityType;
  title: string;
  description: string;
  timestamp: number;
  actorUid?: string;
  actorName?: string;
  gameId?: string;
  referenceId?: string;
  xpAwarded?: number;
  actionRequired?: boolean;
}

export interface XPTransaction {
  id: string;
  coupleId: string;
  source: 'game_win' | 'game_completion' | 'daily_challenge' | 'streak_bonus' | 'achievement';
  referenceId: string;
  gameId?: string;
  amount: number;
  createdAt: number;
  verified: boolean;
}

export type NotificationType = 
  | 'partner_invited'
  | 'partner_accepted'
  | 'game_invitation'
  | 'partner_joined'
  | 'your_turn'
  | 'partner_moved'
  | 'answers_ready'
  | 'game_completed'
  | 'rematch_requested'
  | 'daily_challenge_available'
  | 'challenge_completed'
  | 'achievement_unlocked'
  | 'level_unlocked'
  | 'romantic_reminder';

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

