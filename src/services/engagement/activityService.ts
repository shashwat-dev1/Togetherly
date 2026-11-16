/**
 * TOGETHERLY — COUPLE ACTIVITY TIMELINE SERVICE
 *
 * Persistent, paginated activity feed tracking games played,
 * achievements unlocked, daily challenges conquered, and turns waiting.
 */
import { CoupleActivityItem } from '@/types';
import { runtimeMode, db } from '@/services/firebase/config';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  orderBy,
  limit as firestoreLimit,
  serverTimestamp,
} from 'firebase/firestore';

// In-Memory store for mock mode
const mockActivities: Map<string, CoupleActivityItem[]> = new Map();

// Seed initial realistic activity history for demo couple
const SEED_ACTIVITIES: CoupleActivityItem[] = [
  {
    id: 'act_seed_1',
    coupleId: 'cpl_demo_mock_123',
    type: 'turn_ready',
    title: 'Your Turn to Draw',
    description: 'Sam is waiting for your next guess in Draw & Guess!',
    timestamp: Date.now() - 1000 * 60 * 12,
    actorName: 'Sam',
    gameId: 'draw-and-guess',
    actionRequired: true,
  },
  {
    id: 'act_seed_2',
    coupleId: 'cpl_demo_mock_123',
    type: 'game_completed',
    title: 'Tic-Tac-Toe Showdown',
    description: 'Match ended in a tactical draw! +20 Shared XP awarded.',
    timestamp: Date.now() - 1000 * 60 * 60 * 2,
    gameId: 'tic-tac-toe',
    xpAwarded: 20,
    actionRequired: false,
  },
  {
    id: 'act_seed_3',
    coupleId: 'cpl_demo_mock_123',
    type: 'achievement_unlocked',
    title: 'Milestone Unlocked!',
    description: 'Unlocked "Seven Days Together" consistency achievement! 🔥',
    timestamp: Date.now() - 1000 * 60 * 60 * 24,
    xpAwarded: 150,
    actionRequired: false,
  },
  {
    id: 'act_seed_4',
    coupleId: 'cpl_demo_mock_123',
    type: 'daily_challenge',
    title: 'Daily Challenge Conquered',
    description: 'Completed "Mind Reader Showdown" together! +100 Shared XP earned.',
    timestamp: Date.now() - 1000 * 60 * 60 * 28,
    xpAwarded: 100,
    actionRequired: false,
  },
  {
    id: 'act_seed_5',
    coupleId: 'cpl_demo_mock_123',
    type: 'level_up',
    title: 'Level 5 Unlocked!',
    description: 'You and Sam advanced to Couple Level 5 — Dynamic Duo! 💖',
    timestamp: Date.now() - 1000 * 60 * 60 * 48,
    actionRequired: false,
  },
];

mockActivities.set('cpl_demo_mock_123', [...SEED_ACTIVITIES]);

export const ActivityService = {
  /**
   * Records a new activity item in the couple timeline.
   */
  async recordActivity(
    coupleId: string,
    activity: Omit<CoupleActivityItem, 'id' | 'coupleId' | 'timestamp'>
  ): Promise<CoupleActivityItem> {
    const newItem: CoupleActivityItem = {
      ...activity,
      id: `act_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      coupleId,
      timestamp: Date.now(),
    };

    if (runtimeMode === 'production' || runtimeMode === 'emulator') {
      if (!db) throw new Error('Firestore not initialized');
      const actRef = doc(collection(db, 'couples', coupleId, 'activities'));
      await setDoc(actRef, {
        ...newItem,
        id: actRef.id,
        timestamp: serverTimestamp(),
      });
      return { ...newItem, id: actRef.id };
    }

    // Mock Mode
    if (!mockActivities.has(coupleId)) {
      mockActivities.set(coupleId, []);
    }
    mockActivities.get(coupleId)!.unshift(newItem);
    return newItem;
  },

  /**
   * Fetches paginated activity timeline.
   */
  async getActivities(coupleId: string, maxItems: number = 20): Promise<CoupleActivityItem[]> {
    if (runtimeMode === 'production' || runtimeMode === 'emulator') {
      if (!db) throw new Error('Firestore not initialized');
      const actColl = collection(db, 'couples', coupleId, 'activities');
      const q = query(actColl, orderBy('timestamp', 'desc'), firestoreLimit(maxItems));
      const snap = await getDocs(q);

      return snap.docs.map((d) => {
        const data = d.data();
        return {
          ...data,
          id: d.id,
          timestamp: data.timestamp?.toMillis ? data.timestamp.toMillis() : Date.now(),
        } as CoupleActivityItem;
      });
    }

    // Mock Mode
    const list = mockActivities.get(coupleId) || [];
    return list.slice(0, maxItems);
  },
};

