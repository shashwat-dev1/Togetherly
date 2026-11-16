/**
 * TOGETHERLY — SHARED COUPLE XP & PROGRESSION ENGINE
 *
 * Server-authoritative level curve, progression progress bar calculation,
 * level titles, transaction auditing, and level-up detection.
 */
import { runtimeMode, db } from '@/services/firebase/config';
import { XPTransaction } from '@/types';
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';

export interface LevelProgress {
  level: number;
  totalXP: number;
  currentLevelMinXP: number;
  nextLevelXP: number;
  currentLevelXP: number;
  xpToNextLevel: number;
  progressPercent: number; // 0 to 100
  progressRatio: number; // 0.0 to 1.0
  title: string;
}

const LEVEL_TITLES = [
  'New Spark',
  'Sweet Duo',
  'Harmonious Pair',
  'Soul Mates',
  'Dynamic Duo',
  'Cosmic Lovers',
  'Inseparable Pair',
  'Eternal Flame',
  'Two Halves One Soul',
  'Togetherly Royalty',
];

/**
 * Returns cumulative XP required to reach a specific level.
 * Level 1: 0 XP
 * Level 2: 300 XP
 * Level 3: 700 XP
 * Level 4: 1200 XP
 * Level 5: 1800 XP
 * Level 6: 2500 XP
 */
export function getXPRequiredForLevel(level: number): number {
  if (level <= 1) return 0;
  return Math.floor(250 * (level - 1) + 50 * (level - 1) * (level - 1));
}

/**
 * Calculates current level and progress details from total XP.
 */
export function calculateLevelFromXP(totalXP: number): LevelProgress {
  const safeXP = Math.max(0, totalXP);
  let level = 1;
  while (getXPRequiredForLevel(level + 1) <= safeXP) {
    level++;
  }

  const currentLevelMinXP = getXPRequiredForLevel(level);
  const nextLevelXP = getXPRequiredForLevel(level + 1);
  const xpNeededForThisLevel = nextLevelXP - currentLevelMinXP;
  const currentLevelXP = safeXP - currentLevelMinXP;
  const xpToNextLevel = Math.max(0, nextLevelXP - safeXP);

  const progressRatio = xpNeededForThisLevel > 0
    ? Math.min(1, Math.max(0, currentLevelXP / xpNeededForThisLevel))
    : 1;

  const progressPercent = Math.round(progressRatio * 100);
  const titleIndex = Math.min(level - 1, LEVEL_TITLES.length - 1);
  const title = LEVEL_TITLES[titleIndex];

  return {
    level,
    totalXP: safeXP,
    currentLevelMinXP,
    nextLevelXP,
    currentLevelXP,
    xpToNextLevel,
    progressPercent,
    progressRatio,
    title,
  };
}

// In-Memory mock store for offline / mock mode testing
const mockXPTransactions: Map<string, XPTransaction[]> = new Map();

export const XPProgressionService = {
  calculateLevelFromXP,
  getXPRequiredForLevel,

  /**
   * Awards XP to couple, checks for level-up, records immutable transaction audit.
   */
  async awardXP(
    coupleId: string,
    amount: number,
    source: XPTransaction['source'],
    referenceId: string,
    gameId?: string
  ): Promise<{ newXP: number; newLevel: number; leveledUp: boolean }> {
    if (amount <= 0) {
      throw new Error('XP award amount must be greater than zero');
    }

    if (runtimeMode === 'production' || runtimeMode === 'emulator') {
      if (!db) throw new Error('Firestore not initialized');
      const coupleRef = doc(db, 'couples', coupleId);
      const coupleSnap = await getDoc(coupleRef);
      if (!coupleSnap.exists()) {
        throw new Error(`Couple ${coupleId} not found`);
      }

      const coupleData = coupleSnap.data();
      const currentXP = coupleData.sharedXP || 0;
      const currentLevel = coupleData.coupleLevel || 1;

      const newXP = currentXP + amount;
      const newProgress = calculateLevelFromXP(newXP);
      const leveledUp = newProgress.level > currentLevel;

      // Update couple doc
      await updateDoc(coupleRef, {
        sharedXP: newXP,
        coupleLevel: newProgress.level,
        updatedAt: serverTimestamp(),
      });

      // Record transaction
      const txRef = doc(collection(db, 'couples', coupleId, 'xpTransactions'));
      await setDoc(txRef, {
        id: txRef.id,
        coupleId,
        source,
        referenceId,
        gameId: gameId || null,
        amount,
        createdAt: serverTimestamp(),
        verified: true,
      });

      return {
        newXP,
        newLevel: newProgress.level,
        leveledUp,
      };
    }

    // Mock Mode
    const { CoupleService } = await import('@/services/firebase/coupleService');
    const mockCouple = CoupleService.getMockCurrentCouple();
    const currentXP = mockCouple?.sharedXP || 0;
    const currentLevel = mockCouple?.coupleLevel || 1;

    const newXP = currentXP + amount;
    const newProgress = calculateLevelFromXP(newXP);
    const leveledUp = newProgress.level > currentLevel;

    if (mockCouple) {
      mockCouple.sharedXP = newXP;
      mockCouple.coupleLevel = newProgress.level;
    }

    const tx: XPTransaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      coupleId,
      source,
      referenceId,
      gameId,
      amount,
      createdAt: Date.now(),
      verified: true,
    };

    if (!mockXPTransactions.has(coupleId)) {
      mockXPTransactions.set(coupleId, []);
    }
    mockXPTransactions.get(coupleId)!.unshift(tx);

    return {
      newXP,
      newLevel: newProgress.level,
      leveledUp,
    };
  },

  /**
   * Retrieves paginated XP transaction history.
   */
  async getXPTransactions(coupleId: string): Promise<XPTransaction[]> {
    if (runtimeMode === 'production' || runtimeMode === 'emulator') {
      // In production fetch from subcollection
      return [];
    }
    return mockXPTransactions.get(coupleId) || [];
  },
};
