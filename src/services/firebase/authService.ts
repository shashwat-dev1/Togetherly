/**
 * TOGETHERLY — AUTHENTICATION SERVICE
 *
 * Supports email/password registration, login, logout, password reset,
 * and profile updates with live Firebase Auth + Firestore user persistence,
 * or deterministic offline mock mode.
 */
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured, runtimeMode } from './config';
import { UserProfile, UserPreferences } from '@/types';
import { clearTimeTogetherWidget } from '@/features/together/timeTogetherWidget';

// In-memory mock store for offline testing and fast local preview
let mockUser: UserProfile | null = {
  uid: 'usr_mock_alex',
  email: 'alex@togetherly.test',
  displayName: 'Alex',
  avatarId: 'avatar_bear',
  createdAt: Date.now() - 86400000 * 7,
  updatedAt: Date.now(),
  activeCoupleId: 'couple_mock_123',
  accountStatus: 'active',
  fcmTokens: [],
  preferences: {
    notificationsEnabled: true,
    notifyTurnReady: true,
    notifyDailyChallenge: true,
    notifyAchievements: true,
    notifyStreakReminder: true,
    soundEnabled: true,
    hapticsEnabled: true,
    matureContentAllowed: false,
    theme: 'light',
  },
};

export const AuthService = {
  /**
   * Registers a new user account with Firebase Auth and persists profile in Firestore.
   */
  async register(email: string, password: string, displayName: string): Promise<UserProfile> {
    if (isFirebaseConfigured && auth && db) {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName });

      const profile: UserProfile = {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName,
        avatarId: 'avatar_bunny',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        activeCoupleId: null,
        accountStatus: 'active',
        fcmTokens: [],
        preferences: {
          notificationsEnabled: true,
          notifyTurnReady: true,
          notifyDailyChallenge: true,
          notifyAchievements: true,
          notifyStreakReminder: true,
          soundEnabled: true,
          hapticsEnabled: true,
          matureContentAllowed: false,
          theme: 'light',
        },
      };

      // Persist user record in Firestore
      const userRef = doc(db, 'users', cred.user.uid);
      await setDoc(userRef, {
        ...profile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return profile;
    }

    // Mock Mode
    mockUser = {
      uid: `usr_${Date.now().toString(36)}`,
      email,
      displayName,
      avatarId: 'avatar_bunny',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      activeCoupleId: null,
      accountStatus: 'active',
      fcmTokens: [],
      preferences: {
        notificationsEnabled: true,
        notifyTurnReady: true,
        notifyDailyChallenge: true,
        notifyAchievements: true,
        notifyStreakReminder: true,
        soundEnabled: true,
        hapticsEnabled: true,
        matureContentAllowed: false,
        theme: 'light',
      },
    };
    return mockUser;
  },

  /**
   * Signs in an existing user and retrieves their authoritative profile from Firestore.
   */
  async login(email: string, password: string): Promise<UserProfile> {
    if (isFirebaseConfigured && auth && db) {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const userRef = doc(db, 'users', cred.user.uid);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const data = userSnap.data();
        return {
          ...data,
          uid: cred.user.uid,
          email: cred.user.email,
          displayName: data.displayName || cred.user.displayName || 'Player',
          avatarId: data.avatarId || 'avatar_bear',
          activeCoupleId: data.activeCoupleId || null,
          accountStatus: data.accountStatus || 'active',
          fcmTokens: data.fcmTokens || [],
          preferences: data.preferences || {
            notificationsEnabled: true,
            notifyTurnReady: true,
            notifyDailyChallenge: true,
            notifyAchievements: true,
            notifyStreakReminder: true,
            soundEnabled: true,
            hapticsEnabled: true,
            matureContentAllowed: false,
            theme: 'light',
          },
          createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
          updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : Date.now(),
        } as UserProfile;
      }

      // If document does not exist yet, initialize it
      const fallbackProfile: UserProfile = {
        uid: cred.user.uid,
        email: cred.user.email,
        displayName: cred.user.displayName || 'Player',
        avatarId: 'avatar_bear',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        activeCoupleId: null,
        accountStatus: 'active',
        fcmTokens: [],
        preferences: {
          notificationsEnabled: true,
          notifyTurnReady: true,
          notifyDailyChallenge: true,
          notifyAchievements: true,
          notifyStreakReminder: true,
          soundEnabled: true,
          hapticsEnabled: true,
          matureContentAllowed: false,
          theme: 'light',
        },
      };

      await setDoc(userRef, {
        ...fallbackProfile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      return fallbackProfile;
    }

    // Mock mode returns current or default mock user
    if (!mockUser) {
      mockUser = {
        uid: 'usr_mock_alex',
        email,
        displayName: 'Alex',
        avatarId: 'avatar_bear',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        activeCoupleId: 'couple_mock_123',
        accountStatus: 'active',
        fcmTokens: [],
        preferences: {
          notificationsEnabled: true,
          notifyTurnReady: true,
          notifyDailyChallenge: true,
          notifyAchievements: true,
          notifyStreakReminder: true,
          soundEnabled: true,
          hapticsEnabled: true,
          matureContentAllowed: false,
          theme: 'light',
        },
      };
    }
    return mockUser;
  },

  /**
   * Restores existing session from Firebase Auth and hydrates profile from Firestore.
   */
  async restoreSession(): Promise<UserProfile | null> {
    if (isFirebaseConfigured && auth && db) {
      const currentUser = auth.currentUser;
      if (!currentUser) return null;

      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const data = userSnap.data();
        return {
          ...data,
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: data.displayName || currentUser.displayName || 'Player',
          avatarId: data.avatarId || 'avatar_bear',
          activeCoupleId: data.activeCoupleId || null,
          accountStatus: data.accountStatus || 'active',
          fcmTokens: data.fcmTokens || [],
          preferences: data.preferences || {
            notificationsEnabled: true,
            notifyTurnReady: true,
            notifyDailyChallenge: true,
            notifyAchievements: true,
            notifyStreakReminder: true,
            soundEnabled: true,
            hapticsEnabled: true,
            matureContentAllowed: false,
            theme: 'light',
          },
          createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : Date.now(),
          updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : Date.now(),
        } as UserProfile;
      }
      return null;
    }

    return runtimeMode === 'mock' ? mockUser : null;
  },

  async logout(): Promise<void> {
    try {
      clearTimeTogetherWidget();
    } catch (error) {
      console.warn('[AuthService] Could not clear the home widget:', error);
    }
    if (isFirebaseConfigured && auth) {
      await signOut(auth);
    }
    mockUser = null;
  },

  async resetPassword(email: string): Promise<void> {
    if (isFirebaseConfigured && auth) {
      await sendPasswordResetEmail(auth, email);
    }
    return Promise.resolve();
  },

  async updateAvatar(avatarId: string): Promise<void> {
    if (isFirebaseConfigured && auth?.currentUser && db) {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        avatarId,
        updatedAt: serverTimestamp(),
      });
    }
    if (mockUser) {
      mockUser.avatarId = avatarId;
    }
  },

  async updatePreferences(preferences: Partial<UserPreferences>): Promise<void> {
    if (isFirebaseConfigured && auth?.currentUser && db) {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        preferences,
        updatedAt: serverTimestamp(),
      });
    }
    if (mockUser) {
      mockUser.preferences = {
        ...mockUser.preferences,
        ...preferences,
      };
    }
  },

  getMockCurrentUser(): UserProfile | null {
    return mockUser;
  },
};
