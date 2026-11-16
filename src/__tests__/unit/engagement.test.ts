/**
 * TOGETHERLY — ENGAGEMENT & RETENTION ENGINE UNIT TESTS
 *
 * Verifies:
 * 1. Daily Challenge Catalogue & Deterministic Date Picker
 * 2. Daily Challenge Service (Game Matching, Progress & Single-Claim Enforcement)
 * 3. Shared XP & Couple Level Progression Math
 * 4. Streak Calculation & Milestone Detection
 * 5. Achievement Catalogue & Evaluation Engine
 * 6. Notification Preferences & Deep Linking Architecture
 */
import {
  CHALLENGE_BANK,
  getDailyChallengeForDate,
  getCurrentDateString,
  ChallengeTemplate,
} from '../../constants/challenges';
import {
  ACHIEVEMENT_CATALOGUE,
  getHydratedAchievements,
} from '../../constants/achievements';
import {
  calculateLevelFromXP,
  XPProgressionService,
} from '../../services/engagement/xpProgressionService';
import { StreakService, getYesterdayDateString } from '../../services/engagement/streakService';
import { DailyChallengeService } from '../../services/engagement/dailyChallengeService';
import { AchievementService } from '../../services/engagement/achievementService';
import { NotificationService } from '../../services/notifications/notificationService';
import { DeepLinkingService } from '../../services/navigation/deepLinking';
import { StreakData, UserPreferences } from '../../types';

describe('1. Daily Challenge System', () => {
  test('catalogue contains at least 100 curated challenges across all 6 categories', () => {
    expect(CHALLENGE_BANK.length).toBeGreaterThanOrEqual(100);

    const categories = new Set(CHALLENGE_BANK.map((c: ChallengeTemplate) => c.category));
    expect(categories.has('relationship_questions')).toBe(true);
    expect(categories.has('competitive_games')).toBe(true);
    expect(categories.has('cooperative_games')).toBe(true);
    expect(categories.has('funny_challenges')).toBe(true);
    expect(categories.has('creative_challenges')).toBe(true);
    expect(categories.has('preference_matching')).toBe(true);

    CHALLENGE_BANK.forEach((c: ChallengeTemplate) => {
      expect(c.id).toBeTruthy();
      expect(c.title).toBeTruthy();
      expect(c.description).toBeTruthy();
      expect(c.rewardXP).toBeGreaterThanOrEqual(50);
      expect(c.targetCount).toBeGreaterThanOrEqual(1);
    });
  });

  test('deterministic challenge selection returns identical challenge for the same date', () => {
    const testDate = '2026-11-20';
    const challenge1 = getDailyChallengeForDate(testDate);
    const challenge2 = getDailyChallengeForDate(testDate);

    expect(challenge1.id).toBe(challenge2.id);
    expect(challenge1.title).toBe(challenge2.title);
  });

  test('different dates cycle through challenges', () => {
    const challengeDay1 = getDailyChallengeForDate('2026-11-20');
    const challengeDay2 = getDailyChallengeForDate('2026-11-21');

    expect(challengeDay1.id).not.toBe(challengeDay2.id);
  });

  test('getCurrentDateString produces standard YYYY-MM-DD UTC date format', () => {
    const dateStr = getCurrentDateString();
    expect(dateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('2. Daily Challenge Service & Progress', () => {
  const coupleId = 'cpl_test_engagement_1';
  const date = '2026-12-01';

  test('initializes daily challenge progress at 0 with completed=false and claimed=false', async () => {
    const { challenge, progress } = await DailyChallengeService.getDailyChallengeWithProgress(coupleId, date);
    expect(progress.date).toBe(date);
    expect(progress.challengeId).toBe(challenge.id);
    expect(progress.currentCount).toBe(0);
    expect(progress.completed).toBe(false);
    expect(progress.rewardClaimed).toBe(false);
  });

  test('recording matching game activity advances challenge progress to completion', async () => {
    const { challenge } = await DailyChallengeService.getDailyChallengeWithProgress(coupleId, date);
    const targetGame = challenge.targetGameId || 'tic-tac-toe';

    let latestProgress = null;
    for (let i = 0; i < challenge.targetCount; i++) {
      const result = await DailyChallengeService.recordGameActivity(
        coupleId,
        'usr_player_1',
        targetGame,
        date
      );
      latestProgress = result.progress;
    }

    expect(latestProgress).not.toBeNull();
    expect(latestProgress!.currentCount).toBeGreaterThanOrEqual(challenge.targetCount);
    expect(latestProgress!.completed).toBe(true);
  });

  test('claims reward and rejects subsequent duplicate claim attempts', async () => {
    const claim = await DailyChallengeService.claimChallengeReward(coupleId, date);
    expect(claim.rewardXP).toBeGreaterThan(0);
    expect(claim.newTotalXP).toBeGreaterThan(0);

    // Second claim attempt must reject
    await expect(DailyChallengeService.claimChallengeReward(coupleId, date)).rejects.toThrow(
      'Daily challenge reward has already been claimed'
    );
  });
});

describe('3. Shared XP & Couple Level Progression', () => {
  test('calculates level, titles and progress percent accurately', () => {
    // Level 1 at 0 XP
    const lvl1 = calculateLevelFromXP(0);
    expect(lvl1.level).toBe(1);
    expect(lvl1.title).toBe('New Spark');
    expect(lvl1.currentLevelXP).toBe(0);
    expect(lvl1.progressPercent).toBe(0);

    // Level 2 threshold is 250*1 + 50*1 = 300 XP
    const lvl2 = calculateLevelFromXP(300);
    expect(lvl2.level).toBe(2);
    expect(lvl2.title).toBe('Sweet Duo');

    // Mid-level XP
    const lvlMid = calculateLevelFromXP(150);
    expect(lvlMid.level).toBe(1);
    expect(lvlMid.progressRatio).toBeCloseTo(0.5, 1);
    expect(lvlMid.xpToNextLevel).toBe(150);
  });

  test('awardXP increments XP, tracks level ups, and records transaction', async () => {
    const coupleId = 'cpl_xp_test';
    const initialHistory = await XPProgressionService.getXPTransactions(coupleId);
    const result = await XPProgressionService.awardXP(coupleId, 350, 'game_win', 'session_abc');

    expect(result.newXP).toBeGreaterThanOrEqual(350);
    expect(result.newLevel).toBeGreaterThanOrEqual(1);

    const history = await XPProgressionService.getXPTransactions(coupleId);
    expect(history.length).toBe(initialHistory.length + 1);
    expect(history[0].amount).toBe(350);
    expect(history[0].source).toBe('game_win');
  });
});

describe('4. Streak Calculation & Milestone Detection', () => {
  test('activity on the same UTC day keeps streak unchanged', () => {
    const existing: StreakData = {
      currentStreak: 5,
      longestStreak: 5,
      lastActiveDate: '2026-11-16',
    };
    const { nextData, changed } = StreakService.computeNextStreak(existing, '2026-11-16');

    expect(changed).toBe(false);
    expect(nextData.currentStreak).toBe(5);
    expect(nextData.longestStreak).toBe(5);
    expect(nextData.lastActiveDate).toBe('2026-11-16');
  });

  test('activity on the next consecutive day increments streak and detects milestone', () => {
    const yesterday = getYesterdayDateString('2026-11-16');
    const existing: StreakData = {
      currentStreak: 6,
      longestStreak: 6,
      lastActiveDate: yesterday,
    };
    const { nextData, changed, milestone } = StreakService.computeNextStreak(existing, '2026-11-16');

    expect(changed).toBe(true);
    expect(nextData.currentStreak).toBe(7);
    expect(nextData.longestStreak).toBe(7);
    expect(nextData.lastActiveDate).toBe('2026-11-16');
    expect(milestone).toBe(7); // 7-day milestone
  });

  test('activity after a missed day resets current streak to 1 without destroying longest streak', () => {
    const existing: StreakData = {
      currentStreak: 12,
      longestStreak: 12,
      lastActiveDate: '2026-11-10', // Missed several days
    };
    const { nextData, changed } = StreakService.computeNextStreak(existing, '2026-11-16');

    expect(changed).toBe(true);
    expect(nextData.currentStreak).toBe(1);
    expect(nextData.longestStreak).toBe(12); // Longest preserved (non-punitive)
    expect(nextData.lastActiveDate).toBe('2026-11-16');
  });
});

describe('5. Achievement System', () => {
  test('catalogue has 18 achievements across all 5 tiers and categories', () => {
    expect(ACHIEVEMENT_CATALOGUE).toHaveLength(18);

    const categories = new Set(ACHIEVEMENT_CATALOGUE.map((a) => a.category));
    expect(categories.has('first_steps')).toBe(true);
    expect(categories.has('game_mastery')).toBe(true);
    expect(categories.has('consistency')).toBe(true);
    expect(categories.has('exploration')).toBe(true);
    expect(categories.has('special')).toBe(true);

    const tiers = new Set(ACHIEVEMENT_CATALOGUE.map((a) => a.tier));
    expect(tiers.has('bronze')).toBe(true);
    expect(tiers.has('silver')).toBe(true);
    expect(tiers.has('gold')).toBe(true);
    expect(tiers.has('platinum')).toBe(true);
  });

  test('getHydratedAchievements correctly marks unlocked achievements and timestamps', () => {
    const unlockedMap = {
      first_match: { unlockedAt: 1700000000000 },
      mind_readers: { unlockedAt: 1700000050000 },
    };
    const hydrated = getHydratedAchievements(unlockedMap);

    const firstMatch = hydrated.find((a) => a.id === 'first_match')!;
    expect(firstMatch.unlocked).toBe(true);
    expect(firstMatch.unlockedAt).toBe(1700000000000);

    const locked = hydrated.find((a) => a.id === 'streak_30')!;
    expect(locked.unlocked).toBe(false);
  });

  test('evaluateAndUnlockAchievements unlocks First Match on first game completed', async () => {
    const coupleId = 'cpl_ach_eval_1';
    const unlocked = await AchievementService.evaluateAndUnlockAchievements(coupleId, {
      gameId: 'tic-tac-toe',
      totalMatchesPlayed: 1,
    });

    const hasFirstMatch = unlocked.some((a) => a.id === 'first_match');
    expect(hasFirstMatch).toBe(true);

    // Second evaluation should NOT re-unlock the same achievement
    const secondPass = await AchievementService.evaluateAndUnlockAchievements(coupleId, {
      gameId: 'tic-tac-toe',
      totalMatchesPlayed: 2,
    });
    expect(secondPass.some((a) => a.id === 'first_match')).toBe(false);
  });

  test('unlocks Mind Readers on 100% affinity match', async () => {
    const coupleId = 'cpl_ach_eval_2';
    const unlocked = await AchievementService.evaluateAndUnlockAchievements(coupleId, {
      gameId: 'who-knows-whom',
      affinityPercent: 100,
    });

    expect(unlocked.some((a) => a.id === 'mind_readers')).toBe(true);
  });
});

describe('6. Notification Preferences & Deep Linking', () => {
  test('respects granular user notification preferences', () => {
    const allEnabled: UserPreferences = {
      notificationsEnabled: true,
      notifyTurnReady: true,
      notifyDailyChallenge: true,
      notifyAchievements: true,
      notifyStreakReminder: true,
      soundEnabled: true,
      hapticsEnabled: true,
      matureContentAllowed: false,
      theme: 'light',
    };
    expect(NotificationService.shouldSendNotification(allEnabled, 'your_turn')).toBe(true);
    expect(NotificationService.shouldSendNotification(allEnabled, 'daily_challenge_available')).toBe(true);

    // Master switch off suppresses everything
    const masterDisabled: UserPreferences = {
      ...allEnabled,
      notificationsEnabled: false,
    };
    expect(NotificationService.shouldSendNotification(masterDisabled, 'your_turn')).toBe(false);
    expect(NotificationService.shouldSendNotification(masterDisabled, 'achievement_unlocked')).toBe(false);

    // Turn notifications silenced specifically
    const turnSilenced: UserPreferences = {
      ...allEnabled,
      notifyTurnReady: false,
    };
    expect(NotificationService.shouldSendNotification(turnSilenced, 'your_turn')).toBe(false);
    expect(NotificationService.shouldSendNotification(turnSilenced, 'daily_challenge_available')).toBe(true);
  });

  test('generates valid deep links for all engagement destinations', () => {
    expect(DeepLinkingService.createInviteLink('K89J21')).toBe('togetherly://pair?code=K89J21');
    expect(DeepLinkingService.createGameLink('connect-four', 'sess_999')).toBe(
      'togetherly://game?gameId=connect-four&sessionId=sess_999'
    );
    expect(DeepLinkingService.createDailyChallengeLink('2026-11-20')).toBe(
      'togetherly://daily-challenge?date=2026-11-20'
    );
    expect(DeepLinkingService.createAchievementLink('first_match')).toBe(
      'togetherly://achievements?id=first_match'
    );
  });

  test('parses togetherly:// deep links into structured routing targets', () => {
    const pairTarget = DeepLinkingService.parseDeepLink('togetherly://pair?code=XYZ789');
    expect(pairTarget.isValid).toBe(true);
    expect(pairTarget.route).toBe('/(onboarding)/pair');
    expect(pairTarget.params?.code).toBe('XYZ789');

    const gameTarget = DeepLinkingService.parseDeepLink(
      'togetherly://game?gameId=draw-and-guess&sessionId=sess_456'
    );
    expect(gameTarget.isValid).toBe(true);
    expect(gameTarget.route).toBe('/game');
    expect(gameTarget.params?.gameId).toBe('draw-and-guess');
    expect(gameTarget.params?.sessionId).toBe('sess_456');

    const challengeTarget = DeepLinkingService.parseDeepLink(
      'togetherly://daily-challenge?date=2026-11-20'
    );
    expect(challengeTarget.isValid).toBe(true);
    expect(challengeTarget.route).toBe('/(tabs)/home');
    expect(challengeTarget.params?.date).toBe('2026-11-20');

    const invalidTarget = DeepLinkingService.parseDeepLink('https://google.com');
    expect(invalidTarget.isValid).toBe(false);
  });
});
