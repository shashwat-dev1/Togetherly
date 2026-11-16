/**
 * TOGETHERLY — FIREBASE CLIENT SERVICE & MULTI-MODE RUNTIME CONFIGURATION
 *
 * Distinct Runtime Modes:
 * 1. 'production' — Live Cloud Firebase services (used for closed pilot & live users)
 * 2. 'emulator'   — Local Firebase Emulator Suite (Auth: 9099, Firestore: 8080, Functions: 5001)
 * 3. 'mock'       — In-memory development mock with dual-account simulation
 *
 * IMPORTANT: In pilot builds, mock mode is strictly prohibited from silently activating.
 * If credentials are missing, an explicit error is exposed.
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
  firebaseConfig.appId &&
  firebaseConfig.apiKey !== 'AIzaSy...' &&
  !firebaseConfig.apiKey.includes('...')
);

const requestedMode = process.env.EXPO_PUBLIC_FIREBASE_MODE?.toLowerCase();
const isPilotOrProdRequested =
  requestedMode === 'production' ||
  requestedMode === 'pilot' ||
  process.env.EXPO_PUBLIC_APP_ENV === 'pilot' ||
  process.env.EXPO_PUBLIC_APP_ENV === 'production';

const isEmulatorExplicitlyRequested =
  requestedMode === 'emulator' ||
  process.env.EXPO_PUBLIC_USE_EMULATOR === 'true';

export let isPilotMisconfigured = false;
export let pilotConfigError: string | null = null;

// Determine the active runtime mode
export function resolveRuntimeMode(): FirebaseRuntimeMode {
  if (isEmulatorExplicitlyRequested) {
    return 'emulator';
  }

  // If pilot or production was explicitly requested but credentials are missing
  if (isPilotOrProdRequested) {
    if (!hasProductionCredentials) {
      isPilotMisconfigured = true;
      pilotConfigError =
        'PILOT CONFIGURATION ERROR: Live Firebase credentials are required for pilot builds. Mock mode is disabled to protect test integrity. Please set EXPO_PUBLIC_FIREBASE_API_KEY, EXPO_PUBLIC_FIREBASE_PROJECT_ID, and EXPO_PUBLIC_FIREBASE_APP_ID in your pilot environment.';
      console.error(`[Togetherly Firebase] ${pilotConfigError}`);
      return 'production'; // Keep production intent so it fails visibly rather than quietly mocking
    }
    return 'production';
  }

  // Auto-detect: If valid credentials exist, use production
  if (hasProductionCredentials) {
    return 'production';
  }

  // Fallback to mock ONLY for local development preview when neither pilot nor emulator was requested
  return 'mock';
}

export const runtimeMode: FirebaseRuntimeMode = resolveRuntimeMode();
export const isFirebaseConfigured: boolean =
  (runtimeMode === 'production' && hasProductionCredentials) || runtimeMode === 'emulator';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

if (runtimeMode === 'production') {
  if (hasProductionCredentials) {
    try {
      app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
      auth = getAuth(app);
      db = getFirestore(app);
      console.log('[Togetherly Firebase] Connected to LIVE Firebase project:', firebaseConfig.projectId);
    } catch (err) {
      console.error('[Togetherly Firebase] Failed to initialize live Firebase project:', err);
    }
  } else {
    console.warn(
      '[Togetherly Firebase] Production mode selected but live credentials missing. Mock mode prevented by safety policy.'
    );
  }
} else if (runtimeMode === 'emulator') {
  try {
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
    '[Togetherly Firebase] RUNNING IN LOCAL DEV MOCK MODE. To test with real multiplayer, configure Firebase credentials or run the emulator suite.'
  );
}

export { app, auth, db };
