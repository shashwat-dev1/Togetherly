/**
 * TOGETHERLY — DAILY CHALLENGE SERVICE
 *
 * Coordinates daily challenge generation, shared couple progress,
 * event-based verification, single reward claiming, and streak linkage.
 */
import { DailyChallenge, CoupleDailyChallengeProgress } from '@/types';
import { getDailyChallengeForDate, getCurrentDateString } from '@/constants/challenges';
import { XPProgressionService } from './xpProgressionService';
import { StreakService } from './streakService';
import { ActivityService } from './activityService';
import { AchievementService } from './achievementService';
import { runtimeMode, db } from '@/services/firebase/config';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';

// In-Memory store: Map<coupleId_date, CoupleDailyChallengeProgress>
const mockChallengeProgress: Map<string, CoupleDailyChallengeProgress> = new Map();

export const DailyChallengeService = {
  /**
   * Retrieves today's daily challenge together with the couple's active progress.
   */
  async getDailyChallengeWithProgress(
    coupleId: string,
    dateStr: string = getCurrentDateString()
  ): Promise<{ challenge: DailyChallenge; progress: CoupleDailyChallengeProgress }> {
    const challenge = getDailyChallengeForDate(dateStr);
    const progressKey = `${coupleId}_${dateStr}`;

    if (runtimeMode === 'production' || runtimeMode === 'emulator') {
      if (!db) throw new Error('Firestore not initialized');
      const progRef = doc(db, 'couples', coupleId, 'dailyChallengeProgress', dateStr);
      const snap = await getDoc(progRef);

      if (snap.exists()) {
        return {
          challenge,
          progress: snap.data() as CoupleDailyChallengeProgress,
        };
      }

      // Initialize fresh progress record
      const initialProgress: CoupleDailyChallengeProgress = {
        date: dateStr,
        challengeId: challenge.id,
        currentCount: 0,
        targetCount: challenge.targetCount,
        completed: false,
        rewardClaimed: false,
        contributions: {},
      };

      await setDoc(progRef, {
        ...initialProgress,
        createdAt: serverTimestamp(),
      });

      return { challenge, progress: initialProgress };
    }

    // Mock Mode
    let progress = mockChallengeProgress.get(progressKey);
    if (!progress) {
      progress = {
        date: dateStr,
        challengeId: challenge.id,
        currentCount: 0,
        targetCount: challenge.targetCount,
        completed: false,
        rewardClaimed: false,
        contributions: {},
      };
      mockChallengeProgress.set(progressKey, progress);
    }

    return { challenge, progress };
  },

  /**
   * Records game completion activity and advances the daily challenge progress.
   */
  async recordGameActivity(
    coupleId: string,
    playerId: string,
    gameId: string,
    dateStr: string = getCurrentDateString()
  ): Promise<{ challenge: DailyChallenge; progress: CoupleDailyChallengeProgress; justCompleted: boolean }> {
    const { challenge, progress } = await this.getDailyChallengeWithProgress(coupleId, dateStr);

    // If challenge is already completed, no-op
    if (progress.completed) {
      return { challenge, progress, justCompleted: false };
    }

    // Check if the played game matches the target game (or any game if none specified)
    const matchesTarget = !challenge.targetGameId || challenge.targetGameId === gameId;
    if (!matchesTarget) {
      return { challenge, progress, justCompleted: false };
    }

    const nextCount = Math.min(challenge.targetCount, progress.currentCount + 1);
    const isCompletedNow = nextCount >= challenge.targetCount;

    const nextProgress: CoupleDailyChallengeProgress = {
      ...progress,
      currentCount: nextCount,
      completed: isCompletedNow,
      completedAt: isCompletedNow ? Date.now() : progress.completedAt,
      contributions: {
        ...progress.contributions,
        [playerId]: (progress.contributions[playerId] || 0) + 1,
      },
    };

    if (runtimeMode === 'production' || runtimeMode === 'emulator') {
      if (!db) throw new Error('Firestore not initialized');
      const progRef = doc(db, 'couples', coupleId, 'dailyChallengeProgress', dateStr);
      await setDoc(progRef, nextProgress, { merge: true });
    } else {
      mockChallengeProgress.set(`${coupleId}_${dateStr}`, nextProgress);
    }

    return {
      challenge,
      progress: nextProgress,
      justCompleted: isCompletedNow,
    };
  },

  /**
   * Claims the one-time XP reward for a completed daily challenge.
   */
  async claimChallengeReward(
    coupleId: string,
    dateStr: string = getCurrentDateString()
  ): Promise<{ rewardXP: number; newTotalXP: number; newLevel: number }> {
    const { challenge, progress } = await this.getDailyChallengeWithProgress(coupleId, dateStr);

    if (!progress.completed) {
      throw new Error('Daily challenge is not yet completed');
    }

    if (progress.rewardClaimed) {
      throw new Error('Daily challenge reward has already been claimed');
    }

    // 1. Mark reward claimed
    const updatedProgress: CoupleDailyChallengeProgress = {
      ...progress,
      rewardClaimed: true,
    };

    if (runtimeMode === 'production' || runtimeMode === 'emulator') {
      if (!db) throw new Error('Firestore not initialized');
      const progRef = doc(db, 'couples', coupleId, 'dailyChallengeProgress', dateStr);
      await setDoc(progRef, { rewardClaimed: true }, { merge: true });
    } else {
      mockChallengeProgress.set(`${coupleId}_${dateStr}`, updatedProgress);
    }

    // 2. Award Shared XP
    const xpResult = await XPProgressionService.awardXP(
      coupleId,
      challenge.rewardXP,
      'daily_challenge',
      challenge.id
    );

    // 3. Update couple streak
    await StreakService.recordCoupleActivity(coupleId, dateStr);

    // 4. Log in couple activity timeline
    await ActivityService.recordActivity(coupleId, {
      type: 'daily_challenge',
      title: 'Daily Challenge Completed!',
      description: `Conquered "${challenge.title}"! (+${challenge.rewardXP} Shared XP)`,
      xpAwarded: challenge.rewardXP,
      actionRequired: false,
    });

    // 5. Evaluate achievements
    await AchievementService.evaluateAndUnlockAchievements(coupleId, {
      gameId: challenge.targetGameId || 'daily_challenge',
      challengesCompleted: 1,
    });

    return {
      rewardXP: challenge.rewardXP,
      newTotalXP: xpResult.newXP,
      newLevel: xpResult.newLevel,
    };
  },
};

