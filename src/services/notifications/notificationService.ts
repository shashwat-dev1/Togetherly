/**
 * TOGETHERLY — NOTIFICATION & FCM SERVICE
 *
 * Device token registration, preference-based dispatching,
 * deep link payload generation, and mock/offline fallback.
 */
import { NotificationType, UserPreferences } from '@/types';
import { runtimeMode, db } from '@/services/firebase/config';
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  collection,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';

export interface NotificationPayload {
  toUid: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
}

// In-Memory notification queue for mock mode
const mockNotificationInbox: Map<string, NotificationPayload[]> = new Map();

export const NotificationService = {
  /**
   * Registers an FCM push device token for a user.
   */
  async registerDeviceToken(uid: string, token: string): Promise<void> {
    if (!token) return;

    if (runtimeMode === 'production' || runtimeMode === 'emulator') {
      if (!db) return;
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        fcmTokens: arrayUnion(token),
        updatedAt: serverTimestamp(),
      });
      return;
    }

    // Mock Mode
    const { useAuthStore } = await import('@/stores/useAuthStore');
    const user = useAuthStore.getState().user;
    if (user && user.uid === uid) {
      if (!user.fcmTokens.includes(token)) {
        user.fcmTokens.push(token);
      }
    }
  },

  /**
   * Unregisters an FCM device token on sign out.
   */
  async unregisterDeviceToken(uid: string, token: string): Promise<void> {
    if (!token) return;

    if (runtimeMode === 'production' || runtimeMode === 'emulator') {
      if (!db) return;
      const userRef = doc(db, 'users', uid);
      await updateDoc(userRef, {
        fcmTokens: arrayRemove(token),
        updatedAt: serverTimestamp(),
      });
      return;
    }

    // Mock Mode
    const { useAuthStore } = await import('@/stores/useAuthStore');
    const user = useAuthStore.getState().user;
    if (user && user.uid === uid) {
      user.fcmTokens = user.fcmTokens.filter((t) => t !== token);
    }
  },

  /**
   * Verifies if a notification type is enabled by the recipient's preferences.
   */
  shouldSendNotification(preferences?: UserPreferences, type?: NotificationType): boolean {
    if (!preferences) return true;
    if (preferences.notificationsEnabled === false) return false;

    switch (type) {
      case 'your_turn':
      case 'partner_moved':
        return preferences.notifyTurnReady !== false;
      case 'daily_challenge_available':
      case 'challenge_completed':
        return preferences.notifyDailyChallenge !== false;
      case 'achievement_unlocked':
      case 'level_unlocked':
        return preferences.notifyAchievements !== false;
      default:
        return true;
    }
  },

  /**
   * Dispatches a notification to the partner account.
   */
  async sendNotification(payload: NotificationPayload): Promise<boolean> {
    const { toUid, type, title, body, data } = payload;

    if (runtimeMode === 'production' || runtimeMode === 'emulator') {
      if (!db) return false;

      // 1. Check user preferences
      const recipientSnap = await getDoc(doc(db, 'users', toUid));
      if (recipientSnap.exists()) {
        const userData = recipientSnap.data();
        if (!this.shouldSendNotification(userData.preferences, type)) {
          return false; // Silenced by user preference
        }
      }

      // 2. Write to notifications queue (picked up by Cloud Functions FCM trigger)
      const notifRef = doc(collection(db, 'notifications'));
      await setDoc(notifRef, {
        id: notifRef.id,
        recipientUid: toUid,
        type,
        title,
        body,
        data: data || {},
        read: false,
        createdAt: serverTimestamp(),
      });

      return true;
    }

    // Mock Mode Dispatch
    if (!mockNotificationInbox.has(toUid)) {
      mockNotificationInbox.set(toUid, []);
    }
    mockNotificationInbox.get(toUid)!.unshift(payload);
    return true;
  },

  /**
   * Fetches mock notifications inbox for a user (for tests and dev display).
   */
  getMockInbox(uid: string): NotificationPayload[] {
    return mockNotificationInbox.get(uid) || [];
  },

  /**
   * Clears mock notifications inbox.
   */
  clearMockInbox(uid?: string) {
    if (uid) {
      mockNotificationInbox.delete(uid);
    } else {
      mockNotificationInbox.clear();
    }
  },
};
