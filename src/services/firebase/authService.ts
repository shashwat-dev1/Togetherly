/**
 * TOGETHERLY — AUTHENTICATION SERVICE
 *
 * Supports email/password registration, login, logout, password reset,
 * and profile updates with live Firebase Auth or deterministic offline mock.
 */
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail,
  updateProfile,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from './config';
import { UserProfile, UserPreferences } from '@/types';

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
    soundEnabled: true,
    hapticsEnabled: true,
    matureContentAllowed: false,
    theme: 'light',
  },
};

export const AuthService = {
  async register(email: string, password: string, displayName: string): Promise<UserProfile> {
    if (isFirebaseConfigured && auth) {
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
          soundEnabled: true,
          hapticsEnabled: true,
          matureContentAllowed: false,
          theme: 'light',
        },
      };
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
        soundEnabled: true,
        hapticsEnabled: true,
        matureContentAllowed: false,
        theme: 'light',
      },
    };
    return mockUser;
  },

  async login(email: string, password: string): Promise<UserProfile> {
    if (isFirebaseConfigured && auth) {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const profile: UserProfile = {
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
          soundEnabled: true,
          hapticsEnabled: true,
          matureContentAllowed: false,
          theme: 'light',
        },
      };
      return profile;
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
          soundEnabled: true,
          hapticsEnabled: true,
          matureContentAllowed: false,
          theme: 'light',
        },
      };
    }
    return mockUser;
  },

  async logout(): Promise<void> {
    if (isFirebaseConfigured && auth) {
      await signOut(auth);
    }
    mockUser = null;
  },

  async resetPassword(email: string): Promise<void> {
    if (isFirebaseConfigured && auth) {
      await sendPasswordResetEmail(auth, email);
    }
    // In mock mode, resolve successfully
    return Promise.resolve();
  },

  async updateAvatar(avatarId: string): Promise<void> {
    if (mockUser) {
      mockUser.avatarId = avatarId;
    }
  },

  async updatePreferences(preferences: Partial<UserPreferences>): Promise<void> {
    if (isFirebaseConfigured && auth && auth.currentUser) {
      const { db } = await import('./config');
      if (db) {
        const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userRef, {
          preferences,
          updatedAt: serverTimestamp(),
        });
      }
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

