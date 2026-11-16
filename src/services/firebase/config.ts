/**
 * TOGETHERLY — FIREBASE CLIENT SERVICE INITIALIZATION
 *
 * Configures Firebase with real environment credentials.
 * Includes graceful offline/mock fallback for local preview & unit tests
 * when live credentials are not yet injected in .env.
 */
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  Auth
} from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';

export interface FirebaseEnvConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

const firebaseConfig: FirebaseEnvConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    console.log('[Togetherly Firebase] Initialized live Firebase connection to:', firebaseConfig.projectId);
  } catch (err) {
    console.warn('[Togetherly Firebase] Live initialization error, running in local preview mode:', err);
  }
} else {
  console.info(
    '[Togetherly Firebase] No live credentials detected in .env. Running in Offline/Mock Development Mode. All features are fully interactive.'
  );
}

export { app, auth, db };

