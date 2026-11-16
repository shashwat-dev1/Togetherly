/**
 * TOGETHERLY — COUPLE STREAK ENGINE
 *
 * Tracks consecutive daily engagement across meaningful game and challenge activity.
 * Handles boundary transitions, streak milestones, and persistence.
 */
import { StreakData } from '@/types';
import { runtimeMode, db } from '@/services/firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export interface StreakUpdateResult {
  streakChanged: boolean;
  currentStreak: number;
  longestStreak: number;
  milestoneReached?: number; // e.g. 3, 7, 14, 30
}

/**
 * Helper to get date string 'YYYY-MM-DD' in UTC.
 */
export function getUtcDateString(d: Date = new Date()): string {
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Returns the preceding day string 'YYYY-MM-DD' in UTC.
 */
export function getYesterdayDateString(todayStr: string): string {
  const [y, m, d] = todayStr.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() - 1);
  return getUtcDateString(date);
}

const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100];

export const StreakService = {
  /**
   * Computes updated streak data given current streak state and today's date.
   */
  computeNextStreak(
    currentData: StreakData = { currentStreak: 0, longestStreak: 0, lastActiveDate: '' },
    todayStr: string = getUtcDateString()
  ): { nextData: StreakData; changed: boolean; milestone?: number } {
    const { currentStreak, longestStreak, lastActiveDate } = currentData;
    const yesterdayStr = getYesterdayDateString(todayStr);

    // 1. Already recorded activity today
    if (lastActiveDate === todayStr) {
      return {
        nextData: { ...currentData },
        changed: false,
      };
    }

    let nextCurrent = 1;
    // 2. Activity was yesterday: streak extends!
    if (lastActiveDate === yesterdayStr) {
      nextCurrent = currentStreak + 1;
    }

    const nextLongest = Math.max(longestStreak, nextCurrent);
    const nextData: StreakData = {
      currentStreak: nextCurrent,
      longestStreak: nextLongest,
      lastActiveDate: todayStr,
    };

    let milestone: number | undefined;
    if (STREAK_MILESTONES.includes(nextCurrent) && nextCurrent > currentStreak) {
      milestone = nextCurrent;
    }

    return {
      nextData,
      changed: true,
      milestone,
    };
  },

  /**
   * Updates couple streak on backend / store.
   */
  async recordCoupleActivity(
    coupleId: string,
    todayStr: string = getUtcDateString()
  ): Promise<StreakUpdateResult> {
    if (runtimeMode === 'production' || runtimeMode === 'emulator') {
      if (!db) throw new Error('Firestore not initialized');
      const coupleRef = doc(db, 'couples', coupleId);
      const coupleSnap = await getDoc(coupleRef);
      if (!coupleSnap.exists()) {
        throw new Error(`Couple ${coupleId} not found`);
      }

      const existingData: StreakData = coupleSnap.data().streakData || {
        currentStreak: 0,
        longestStreak: 0,
        lastActiveDate: '',
      };

      const { nextData, changed, milestone } = this.computeNextStreak(existingData, todayStr);

      if (changed) {
        await updateDoc(coupleRef, { streakData: nextData });
      }

      return {
        streakChanged: changed,
        currentStreak: nextData.currentStreak,
        longestStreak: nextData.longestStreak,
        milestoneReached: milestone,
      };
    }

    // Mock Mode
    const { CoupleService } = await import('@/services/firebase/coupleService');
    const couple = CoupleService.getMockCurrentCouple();
    const existingData: StreakData = couple?.streakData || {
      currentStreak: 0,
      longestStreak: 0,
      lastActiveDate: '',
    };

    const { nextData, changed, milestone } = this.computeNextStreak(existingData, todayStr);

    if (couple && changed) {
      couple.streakData = nextData;
    }

    return {
      streakChanged: changed,
      currentStreak: nextData.currentStreak,
      longestStreak: nextData.longestStreak,
      milestoneReached: milestone,
    };
  },
};
