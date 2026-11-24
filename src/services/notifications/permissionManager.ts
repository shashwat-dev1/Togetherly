/**
 * TOGETHERLY — NOTIFICATION PERMISSION & DEVICE TOKEN MANAGER
 *
 * Handles native notification permission requests, channel setup,
 * device push token registration, and Spark architecture status.
 *
 * Conforms strictly to Firebase Spark plan constraints:
 * - Device tokens are stored securely in `/users/{uid}` in Firestore.
 * - No privileged server secrets or admin keys are bundled into the client.
 * - Remote push delivery is classified as NOT CONFIGURED (Spark-compliant)
 *   while real-time in-app and local scheduled channels are ACTIVE.
 */
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { db, runtimeMode } from '@/services/firebase/config';
import { doc, updateDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';

export type RemotePushStatus = 'ACTIVE' | 'NOT_CONFIGURED' | 'PERMISSION_DENIED' | 'UNSUPPORTED';

export interface PushStatusReport {
  localNotificationsActive: boolean;
  realtimeInAppActive: boolean;
  remotePushStatus: RemotePushStatus;
  deviceToken: string | null;
  statusMessage: string;
}

/**
 * Architectural status note for Firebase Spark Plan
 */
export const SPARK_REMOTE_PUSH_STATUS: RemotePushStatus = 'NOT_CONFIGURED';
export const SPARK_REMOTE_PUSH_REASON = 
  'Firebase Spark plan operates at $0.00 zero-cost without Cloud Functions. Remote push delivery requires a trusted server-side sender (Firebase Blaze with Cloud Functions or a self-hosted push server). In Spark mode, device tokens are registered securely to /users/{uid}/fcmTokens, and all notifications are delivered in real-time via Firestore onSnapshot while the app is active, and locally via Android notification channels when scheduled.';

export const PermissionManager = {
  /**
   * Checks current permission status without prompting the user.
   */
  async checkPermissions(): Promise<Notifications.NotificationPermissionsStatus> {
    if (Platform.OS === 'web') {
      return {
        status: Notifications.PermissionStatus.UNDETERMINED,
        granted: false,
        canAskAgain: false,
        expires: 'never',
      };
    }

    try {
      return await Notifications.getPermissionsAsync();
    } catch (err) {
      console.warn('[PermissionManager] Failed to check permissions:', err);
      return {
        status: Notifications.PermissionStatus.UNDETERMINED,
        granted: false,
        canAskAgain: true,
        expires: 'never',
      };
    }
  },

  /**
   * Requests notification permissions from the user.
   */
  async requestPermissions(): Promise<boolean> {
    if (Platform.OS === 'web') return false;

    try {
      const existing = await Notifications.getPermissionsAsync();
      if (existing.granted) return true;

      const requested = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });

      return requested.granted;
    } catch (err) {
      console.warn('[PermissionManager] Failed to request permissions:', err);
      return false;
    }
  },

  /**
   * Registers the device push token to Firestore `/users/{uid}/fcmTokens`.
   * Never throws; logs warning on failure.
   */
  async registerDeviceTokenSafely(uid: string): Promise<string | null> {
    if (Platform.OS === 'web' || !uid) return null;

    try {
      const permissions = await Notifications.getPermissionsAsync();
      if (!permissions.granted) {
        const granted = await this.requestPermissions();
        if (!granted) return null;
      }

      // Obtain Expo push token (or FCM token on native Android)
      let token: string | null = null;
      try {
        const tokenData = await Notifications.getExpoPushTokenAsync();
        token = tokenData.data;
      } catch (tokenErr) {
        console.warn('[PermissionManager] Could not retrieve Expo push token:', tokenErr);
        // Fallback to native device token if available
        try {
          const deviceToken = await Notifications.getDevicePushTokenAsync();
          token = typeof deviceToken.data === 'string' ? deviceToken.data : JSON.stringify(deviceToken.data);
        } catch {
          // Native device token not available (e.g. simulator without Google Play Services)
          return null;
        }
      }

      if (!token) return null;

      // Commit to Firestore in production/emulator
      if (runtimeMode === 'production' || runtimeMode === 'emulator') {
        if (db) {
          const userRef = doc(db, 'users', uid);
          await updateDoc(userRef, {
            fcmTokens: arrayUnion(token),
            lastTokenRegisteredAt: serverTimestamp(),
          });
        }
      }

      return token;
    } catch (err) {
      console.warn('[PermissionManager] Error during token registration:', err);
      return null;
    }
  },

  /**
   * Returns a complete diagnostic status of all three notification tiers.
   */
  async getStatusReport(uid?: string): Promise<PushStatusReport> {
    const permissions = await this.checkPermissions();
    const isGranted = permissions.granted;

    return {
      localNotificationsActive: isGranted,
      realtimeInAppActive: true, // Always active via Firestore snapshot listeners
      remotePushStatus: isGranted ? SPARK_REMOTE_PUSH_STATUS : 'PERMISSION_DENIED',
      deviceToken: null,
      statusMessage: isGranted
        ? 'Real-time in-app alerts and local romantic reminders are fully active. Remote FCM background push is NOT CONFIGURED (Spark Free Plan).'
        : 'Notification permissions have not been granted on this device.',
    };
  },
};
