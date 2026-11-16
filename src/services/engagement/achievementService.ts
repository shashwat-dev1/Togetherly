/**
 * TOGETHERLY — COUPLE ACHIEVEMENT SERVICE
 *
 * Evaluates unlock conditions, prevents duplicate rewards,
 * awards achievement XP, and logs timeline milestones.
 */
import { Achievement, CoupleAchievement } from '@/types';
import { ACHIEVEMENT_CATALOGUE, AchievementTemplate, getHydratedAchievements } from '@/constants/achievements';
import { XPProgressionService } from './xpProgressionService';
import { ActivityService } from './activityService';
import { runtimeMode, db } from '@/services/firebase/config';
import {
  collection,
  doc,
  getDocs,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';

// In-Memory map of coupleId -> Map<achievementId, CoupleAchievement>
const mockCoupleAchievements: Map<string, Map<string, CoupleAchievement>> = new Map();

// Seed initial achievements for demo couple
const seedDemoAchievements = () => {
  const map = new Map<string, CoupleAchievement>();
  map.set('first_match', {
    achievementId: 'first_match',
    unlockedAt: Date.now() - 1000 * 60 * 60 * 72,
    tier: 'bronze',
    rewardClaimed: true,
  });
  map.set('streak_7', {
    achievementId: 'streak_7',
    unlockedAt: Date.now() - 1000 * 60 * 60 * 24,
    tier: 'silver',
    rewardClaimed: true,
  });
  map.set('mind_readers', {
    achievementId: 'mind_readers',
    unlockedAt: Date.now() - 1000 * 60 * 60 * 12,
    tier: 'gold',
    rewardClaimed: true,
  });
  mockCoupleAchievements.set('cpl_demo_mock_123', map);
};
seedDemoAchievements();

export interface GameEventContext {
  gameId: string;
  isWin?: boolean;
  affinityPercent?: number;
  triviaCorrectCount?: number;
  isComeback?: boolean;
  distinctGamesPlayed?: string[];
  totalMatchesPlayed?: number;
  totalMatchesWon?: number;
  totalDrawingsSolved?: number;
  totalWordsSolved?: number;
  totalQuizMatches?: number;
  totalBoardMatches?: number;
  currentStreak?: number;
  challengesCompleted?: number;
}

export const AchievementService = {
  /**
   * Fetches all achievements with hydrated unlock status for a couple.
   */
  async getCoupleAchievements(coupleId: string): Promise<Achievement[]> {
    if (runtimeMode === 'production' || runtimeMode === 'emulator') {
      if (!db) throw new Error('Firestore not initialized');
      const coll = collection(db, 'couples', coupleId, 'achievements');
      const snap = await getDocs(coll);
      const unlockedMap: Record<string, { unlockedAt: number }> = {};
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        unlockedMap[docSnap.id] = {
          unlockedAt: data.unlockedAt?.toMillis ? data.unlockedAt.toMillis() : Date.now(),
        };
      });
      return getHydratedAchievements(unlockedMap);
    }

    // Mock Mode
    const map = mockCoupleAchievements.get(coupleId) || new Map();
    const unlockedMap: Record<string, { unlockedAt: number }> = {};
    for (const [id, rec] of map.entries()) {
      unlockedMap[id] = { unlockedAt: rec.unlockedAt };
    }
    return getHydratedAchievements(unlockedMap);
  },

  /**
   * Evaluates and unlocks any earned achievements based on an event.
   * Returns an array of newly unlocked achievement definitions.
   */
  async evaluateAndUnlockAchievements(
    coupleId: string,
    context: GameEventContext
  ): Promise<AchievementTemplate[]> {
    const existingAchievements = await this.getCoupleAchievements(coupleId);
    const unlockedIds = new Set(existingAchievements.filter((a) => a.unlocked).map((a) => a.id));

    const newlyUnlocked: AchievementTemplate[] = [];

    for (const template of ACHIEVEMENT_CATALOGUE) {
      if (unlockedIds.has(template.id)) continue; // Already unlocked

      let shouldUnlock = false;

      switch (template.id) {
        // --- First Steps ---
        case 'first_match':
          shouldUnlock = (context.totalMatchesPlayed || 0) >= 1;
          break;
        case 'first_win':
          shouldUnlock = (context.totalMatchesWon || 0) >= 1 || !!context.isWin;
          break;
        case 'first_daily_challenge':
          shouldUnlock = (context.challengesCompleted || 0) >= 1;
          break;

        // --- Game Mastery ---
        case 'quiz_champions':
          shouldUnlock = (context.totalQuizMatches || 0) >= 5;
          break;
        case 'mind_readers':
          shouldUnlock = (context.affinityPercent || 0) >= 100;
          break;
        case 'drawing_duo':
          shouldUnlock = (context.totalDrawingsSolved || 0) >= 5;
          break;
        case 'board_game_rivals':
          shouldUnlock = (context.totalBoardMatches || 0) >= 10;
          break;
        case 'word_wizards':
          shouldUnlock = (context.totalWordsSolved || 0) >= 5;
          break;

        // --- Consistency / Streaks ---
        case 'streak_3':
          shouldUnlock = (context.currentStreak || 0) >= 3;
          break;
        case 'streak_7':
          shouldUnlock = (context.currentStreak || 0) >= 7;
          break;
        case 'streak_14':
          shouldUnlock = (context.currentStreak || 0) >= 14;
          break;
        case 'streak_30':
          shouldUnlock = (context.currentStreak || 0) >= 30;
          break;

        // --- Exploration ---
        case 'game_explorer':
          shouldUnlock = (context.distinctGamesPlayed?.length || 0) >= 3;
          break;
        case 'five_games':
          shouldUnlock = (context.distinctGamesPlayed?.length || 0) >= 5;
          break;
        case 'all_ten_games':
          shouldUnlock = (context.distinctGamesPlayed?.length || 0) >= 10;
          break;

        // --- Special ---
        case 'perfect_match':
          shouldUnlock = context.gameId === 'this-or-that' && (context.affinityPercent || 0) === 100;
          break;
        case 'perfect_quiz':
          shouldUnlock = context.gameId === 'couple-trivia' && (context.triviaCorrectCount || 0) >= 5;
          break;
        case 'comeback_victory':
          shouldUnlock = !!context.isComeback;
          break;
      }

      if (shouldUnlock) {
        newlyUnlocked.push(template);
      }
    }

    // Process and persist newly unlocked achievements
    for (const ach of newlyUnlocked) {
      await this.persistUnlock(coupleId, ach);
    }

    return newlyUnlocked;
  },

  /**
   * Persists the unlock, awards reward XP, and creates an activity timeline entry.
   */
  async persistUnlock(coupleId: string, ach: AchievementTemplate): Promise<void> {
    if (runtimeMode === 'production' || runtimeMode === 'emulator') {
      if (!db) throw new Error('Firestore not initialized');
      const achRef = doc(db, 'couples', coupleId, 'achievements', ach.id);
      await setDoc(achRef, {
        achievementId: ach.id,
        unlockedAt: serverTimestamp(),
        tier: ach.tier,
        rewardClaimed: true,
      });
    } else {
      if (!mockCoupleAchievements.has(coupleId)) {
        mockCoupleAchievements.set(coupleId, new Map());
      }
      mockCoupleAchievements.get(coupleId)!.set(ach.id, {
        achievementId: ach.id,
        unlockedAt: Date.now(),
        tier: ach.tier,
        rewardClaimed: true,
      });
    }

    // Award bonus XP
    await XPProgressionService.awardXP(
      coupleId,
      ach.rewardXP,
      'achievement',
      ach.id
    );

    // Record in activity feed
    await ActivityService.recordActivity(coupleId, {
      type: 'achievement_unlocked',
      title: `${ach.title} Unlocked!`,
      description: `${ach.icon} ${ach.description} (+${ach.rewardXP} Shared XP)`,
      xpAwarded: ach.rewardXP,
      actionRequired: false,
    });
  },
};
