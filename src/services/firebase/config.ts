/**
 * TOGETHERLY — FIREBASE CLIENT SERVICE & MULTI-MODE RUNTIME CONFIGURATION
 *
 * Distinct Runtime Modes:
 * 1. 'production' — Live Cloud Firebase services
 * 2. 'emulator'   — Local Firebase Emulator Suite (Auth: 9099, Firestore: 8080, Functions: 5001)
 * 3. 'mock'       — In-memory development mock with dual-account simulation
 *
 * Never silently defaults without exposing the active runtime mode to UI and logs.
 */
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, Auth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, Firestore } from 'firebase/firestore';

export type FirebaseRuntimeMode = 'production' | 'emulator' | 'mock';

export interface FirebaseEnvConfig {
  apiKey?: string;
  authDomain?: string;
  projectId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  emulatorHost?: string;
}

const firebaseConfig: FirebaseEnvConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  emulatorHost: process.env.EXPO_PUBLIC_FIREBASE_EMULATOR_HOST,
};

const hasProductionCredentials = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.projectId &&
  firebaseConfig.appId
);

const isEmulatorExplicitlyRequested = 
  process.env.EXPO_PUBLIC_FIREBASE_MODE === 'emulator' ||
  process.env.EXPO_PUBLIC_USE_EMULATOR === 'true';

// Determine the active runtime mode
export function resolveRuntimeMode(): FirebaseRuntimeMode {
  if (isEmulatorExplicitlyRequested) {
    return 'emulator';
  }
  if (hasProductionCredentials) {
    return 'production';
  }
  return 'mock';
}

export const runtimeMode: FirebaseRuntimeMode = resolveRuntimeMode();
export const isFirebaseConfigured: boolean = runtimeMode === 'production' || runtimeMode === 'emulator';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (runtimeMode === 'production') {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    console.log('[Togetherly Firebase] Connected to PRODUCTION Firebase project:', firebaseConfig.projectId);
  } catch (err) {
    console.error('[Togetherly Firebase] Failed to initialize production Firebase:', err);
  }
} else if (runtimeMode === 'emulator') {
  try {
    // Emulator suite initialization with default dev project
    const emulatorConfig = {
      apiKey: firebaseConfig.apiKey || 'demo-togetherly-api-key',
      authDomain: 'localhost',
      projectId: firebaseConfig.projectId || 'demo-togetherly',
      storageBucket: 'demo-togetherly.appspot.com',
      messagingSenderId: '1234567890',
      appId: '1:1234567890:android:mockappid',
    };
    app = getApps().length === 0 ? initializeApp(emulatorConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);

    // Default host: 10.0.2.2 for Android emulator, 127.0.0.1 for Web/iOS/Node
    const isAndroid = typeof process !== 'undefined' && process.env?.EXPO_OS === 'android';
    const defaultHost = isAndroid ? '10.0.2.2' : '127.0.0.1';
    const host = firebaseConfig.emulatorHost || defaultHost;

    connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true });
    connectFirestoreEmulator(db, host, 8080);
    console.log(`[Togetherly Firebase] Connected to LOCAL EMULATOR SUITE at ${host} (Auth: 9099, Firestore: 8080)`);
  } catch (err) {
    console.error('[Togetherly Firebase] Failed to connect to Firebase Emulator:', err);
  }
} else {
  console.info(
    '[Togetherly Firebase] RUNNING IN MOCK MODE (Dev). Real-time simulation active. Set EXPO_PUBLIC_FIREBASE_MODE=emulator or provide production keys to switch.'
  );
}

export { app, auth, db };
