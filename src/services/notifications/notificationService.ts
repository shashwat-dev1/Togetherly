/**
 * TOGETHERLY — NOTIFICATION & FCM SERVICE
 *
 * Implements:
 * 1. Real-time in-app notification dispatching and live Firestore onSnapshot subscription.
 * 2. Granular user preference enforcement across all 8 couple notification categories.
 * 3. Deep link route resolution for all notification payloads.
 * 4. Foreground notification presentation configuration.
 * 5. Event deduplication and mock/offline fallback.
 */
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
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
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';

// Configure foreground notification presentation behavior
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export interface NotificationPayload {
  toUid: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
}

export interface InAppNotification {
  id: string;
  recipientUid: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, string>;
  read: boolean;
  createdAt: number;
}

// In-Memory notification queue & listeners for mock mode and deduplication
const mockNotificationInbox: Map<string, NotificationPayload[]> = new Map();
const processedNotificationIds = new Set<string>();
const inAppListeners = new Set<(notification: InAppNotification) => void>();

export const NotificationService = {
  /**
   * Registers an FCM push device token for a user.
   */
  async registerDeviceToken(uid: string, token: string): Promise<void> {
    if (!token || !uid) return;

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
      if (!user.fcmTokens) user.fcmTokens = [];
      if (!user.fcmTokens.includes(token)) {
        user.fcmTokens.push(token);
      }
    }
  },

  /**
   * Unregisters an FCM device token on sign out.
   */
  async unregisterDeviceToken(uid: string, token: string): Promise<void> {
    if (!token || !uid) return;

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
    if (user && user.uid === uid && user.fcmTokens) {
      user.fcmTokens = user.fcmTokens.filter((t) => t !== token);
    }
  },

  /**
   * Verifies if a notification type is allowed by the recipient's preferences.
   * Granularly respects all 8 category toggles.
   */
  shouldSendNotification(preferences?: UserPreferences, type?: NotificationType): boolean {
    if (!preferences) return true;
    if (preferences.notificationsEnabled === false) return false;

    switch (type) {
      case 'partner_invited':
      case 'partner_accepted':
        return preferences.notifyCoupleActivity !== false;

      case 'game_invitation':
      case 'partner_joined':
      case 'rematch_requested':
        return preferences.notifyGameInvitations !== false;

      case 'your_turn':
      case 'partner_moved':
      case 'answers_ready':
        return preferences.notifyTurnReady !== false;

      case 'daily_challenge_available':
      case 'challenge_completed':
        return preferences.notifyDailyChallenge !== false;

      case 'achievement_unlocked':
      case 'level_unlocked':
        return preferences.notifyAchievements !== false;

      case 'romantic_reminder':
        return preferences.notifyRomanticReminders !== false;

      default:
        return true;
    }
  },

  /**
   * Dispatches a notification to the partner account.
   * Writes to Firestore `/notifications` collection for real-time delivery
   * and notifies all active in-app listeners.
   */
  async sendNotification(payload: NotificationPayload): Promise<boolean> {
    const { toUid, type, title, body, data } = payload;
    if (!toUid) return false;

    if (runtimeMode === 'production' || runtimeMode === 'emulator') {
      if (!db) return false;

      // 1. Check recipient user preferences
      try {
        const recipientSnap = await getDoc(doc(db, 'users', toUid));
        if (recipientSnap.exists()) {
          const userData = recipientSnap.data();
          if (!this.shouldSendNotification(userData.preferences, type)) {
            return false; // Silenced by user preference
          }
        }
      } catch (err) {
        console.warn('[NotificationService] Preference check warning:', err);
      }

      // 2. Write to notifications queue (picked up in real-time by partner app)
      const notifRef = doc(collection(db, 'notifications'));
      const notifDoc: InAppNotification = {
        id: notifRef.id,
        recipientUid: toUid,
        type,
        title,
        body,
        data: data || {},
        read: false,
        createdAt: Date.now(),
      };

      await setDoc(notifRef, {
        ...notifDoc,
        createdAt: serverTimestamp(),
      });

      return true;
    }

    // Mock Mode Dispatch
    if (!mockNotificationInbox.has(toUid)) {
      mockNotificationInbox.set(toUid, []);
    }
    mockNotificationInbox.get(toUid)!.unshift(payload);

    // Notify any local mock subscribers
    const mockItem: InAppNotification = {
      id: `mock_notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      recipientUid: toUid,
      type,
      title,
      body,
      data: data || {},
      read: false,
      createdAt: Date.now(),
    };
    inAppListeners.forEach((fn) => fn(mockItem));

    return true;
  },

  /**
   * Subscribes to real-time in-app notifications for the logged-in user.
   * Emits unread events and deduplicates using an in-memory Set.
   */
  subscribeToInAppNotifications(
    uid: string,
    onNotification: (notification: InAppNotification) => void
  ): Unsubscribe {
    if (!uid) return () => {};

    if (runtimeMode === 'production' || runtimeMode === 'emulator') {
      if (!db) return () => {};

      const notifsRef = collection(db, 'notifications');
      const q = query(
        notifsRef,
        where('recipientUid', '==', uid),
        where('read', '==', false)
      );

      return onSnapshot(
        q,
        (snapshot) => {
          snapshot.docChanges().forEach((change) => {
            if (change.type === 'added') {
              const docId = change.doc.id;
              if (!processedNotificationIds.has(docId)) {
                processedNotificationIds.add(docId);
                // Prune deduplication set if it exceeds 300 entries
                if (processedNotificationIds.size > 300) {
                  const firstKey = processedNotificationIds.values().next().value;
                  if (firstKey) processedNotificationIds.delete(firstKey);
                }

                const data = change.doc.data();
                const notif: InAppNotification = {
                  id: docId,
                  recipientUid: data.recipientUid,
                  type: data.type,
                  title: data.title,
                  body: data.body,
                  data: data.data || {},
                  read: data.read || false,
                  createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
                };
                onNotification(notif);
              }
            }
          });
        },
        (error) => {
          console.warn('[NotificationService] Snapshot error:', error);
        }
      );
    }

    // Mock Mode Subscription
    const listener = (item: InAppNotification) => {
      if (item.recipientUid === uid && !processedNotificationIds.has(item.id)) {
        processedNotificationIds.add(item.id);
        onNotification(item);
      }
    };
    inAppListeners.add(listener);

    return () => {
      inAppListeners.delete(listener);
    };
  },

  /**
   * Marks a notification as read in Firestore.
   */
  async markNotificationAsRead(notificationId: string): Promise<void> {
    if (!notificationId) return;

    if (runtimeMode === 'production' || runtimeMode === 'emulator') {
      if (!db) return;
      try {
        const notifRef = doc(db, 'notifications', notificationId);
        await updateDoc(notifRef, {
          read: true,
          readAt: serverTimestamp(),
        });
      } catch (err) {
        console.warn('[NotificationService] Failed to mark read:', err);
      }
    }
  },

  /**
   * Resolves the navigation route and params for a notification payload.
   */
  getRouteForNotification(
    type: NotificationType,
    data?: Record<string, string>
  ): { pathname: string; params?: Record<string, string> } {
    switch (type) {
      case 'game_invitation':
      case 'partner_joined':
      case 'your_turn':
      case 'partner_moved':
      case 'answers_ready':
      case 'rematch_requested':
        if (data?.gameId && data?.sessionId) {
          return {
            pathname: '/game',
            params: {
              gameId: data.gameId,
              sessionId: data.sessionId,
            },
          };
        }
        return { pathname: '/(tabs)/games' };

      case 'daily_challenge_available':
      case 'challenge_completed':
        return { pathname: '/(tabs)/home' };

      case 'partner_accepted':
      case 'partner_invited':
        return { pathname: '/(tabs)/home' };

      case 'achievement_unlocked':
      case 'level_unlocked':
        return { pathname: '/(tabs)/our-world' };

      case 'romantic_reminder':
      default:
        return { pathname: '/(tabs)/home' };
    }
  },

  /**
   * Handles user tapping on a system notification banner.
   */
  handleNotificationResponse(
    response: Notifications.NotificationResponse,
    router: { push: (route: any) => void }
  ): void {
    const rawData = response.notification.request.content.data;
    const type = rawData?.type as NotificationType;
    const data = rawData as Record<string, string> | undefined;

    const route = this.getRouteForNotification(type, data);
    router.push(route);
  },

  /**
   * Fetches mock notifications inbox for a user (for tests and dev display).
   */
  getMockInbox(uid: string): NotificationPayload[] {
    return mockNotificationInbox.get(uid) || [];
  },

  /**
   * Clears mock notifications inbox and deduplication set (used in tests).
   */
  clearMockInbox(uid?: string) {
    if (uid) {
      mockNotificationInbox.delete(uid);
    } else {
      mockNotificationInbox.clear();
      processedNotificationIds.clear();
    }
  },
};
