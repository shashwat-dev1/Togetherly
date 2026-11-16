# Togetherly — Environment Configuration & Setup Reference

This document explains all environment variables, runtime modes, and credential requirements for configuring Togetherly in development, local emulation, and live pilot builds.

---

## 1. Environment Variables Reference

All client-facing configuration variables in Togetherly are prefixed with `EXPO_PUBLIC_` so they are securely bundled by the Expo build system:

| Variable | Required In Pilot? | Default | Description | Example Value |
|---|---|---|---|---|
| `EXPO_PUBLIC_FIREBASE_MODE` | **YES** | `mock` | Active runtime mode (`production`, `emulator`, `mock`). | `production` |
| `EXPO_PUBLIC_APP_ENV` | **YES** | `development` | Application lifecycle stage (`pilot`, `production`, `development`). | `pilot` |
| `EXPO_PUBLIC_FIREBASE_API_KEY` | **YES** | *None* | Web/Mobile API Key from Firebase Console. | `AIzaSy...` |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | **YES** | *None* | Firebase Auth Domain. | `togetherly-pilot.firebaseapp.com` |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | **YES** | *None* | Cloud Firebase Project ID. | `togetherly-pilot` |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET`| Optional | *None* | Cloud Storage Bucket URL. | `togetherly-pilot.appspot.com` |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | **YES** | *None* | FCM Sender ID (numerical). | `123456789012` |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | **YES** | *None* | Firebase Mobile/Web Application ID. | `1:1234567890:android:abcdef...` |
| `EXPO_PUBLIC_FIREBASE_EMULATOR_HOST` | Emulator Only | `127.0.0.1` | IP address of local emulator machine. | `10.0.2.2` (Android emulator) |
| `EXPO_PUBLIC_PILOT_COHORT_ID` | Optional | `pilot_cohort_1` | Identifier for current test group. | `pilot_nov2026` |

---

## 2. Runtime Mode Resolution Hierarchy

Togetherly resolves its backend runtime mode through the following safety-checked priority in `src/services/firebase/config.ts`:

```
1. EXPO_PUBLIC_FIREBASE_MODE === 'emulator'
   └─► Connects to local Auth (9099) and Firestore (8080) emulators.

2. EXPO_PUBLIC_FIREBASE_MODE === 'production' OR EXPO_PUBLIC_APP_ENV === 'pilot'
   ├─► If credentials are valid: Connects to Live Firebase Project.
   └─► If credentials are missing: Throws prominent PILOT CONFIGURATION ERROR.
       (Mock mode is strictly prohibited from silently activating in pilot builds).

3. Valid credentials present in .env
   └─► Automatically resolves to 'production'.

4. No credentials and no explicit mode set
   └─► Defaults to 'mock' for local developer preview with Alex/Sam seed data.
```

---

## 3. Step-by-Step Configuration Recipes

### Recipe A: Configuring for the Closed Pilot Build
1. Create a `.env` file from the template:
   ```bash
   cp .env.example .env
   ```
2. Set `EXPO_PUBLIC_FIREBASE_MODE=production`.
3. Set `EXPO_PUBLIC_APP_ENV=pilot`.
4. Copy the exact `apiKey`, `authDomain`, `projectId`, `messagingSenderId`, and `appId` from your live Firebase project console.
5. Verify configuration locally before building:
   ```bash
   npx expo start
   ```
   Ensure the top status banner does **not** say `PILOT SETUP REQUIRED` or `DEV: IN-MEMORY MOCK`.

### Recipe B: Configuring for Local Firebase Emulator Suite
1. In `.env`, set:
   ```ini
   EXPO_PUBLIC_FIREBASE_MODE=emulator
   EXPO_PUBLIC_FIREBASE_EMULATOR_HOST=127.0.0.1
   ```
2. Start the Firebase emulator suite:
   ```bash
   firebase emulators:start
   ```
3. Start the Expo app:
   ```bash
   npx expo start
   ```

### Recipe C: Quick Local In-Memory Mock Mode
1. In `.env`, set:
   ```ini
   EXPO_PUBLIC_FIREBASE_MODE=mock
   ```
2. No Firebase connection or internet access required. All state runs in local device RAM.

---

## 4. Cost Control & Budget Alerts

For a closed pilot of 5–6 couples over 15 days:
- Firestore document reads/writes are far below the free tier limits (50,000 reads/day free).
- Cloud Functions invocations are far below the free tier limit (2,000,000 invocations/month free).

To ensure zero risk of unexpected cost:
1. Open Google Cloud Console $\rightarrow$ **Billing** $\rightarrow$ **Budgets & Alerts**.
2. Create a budget for project `togetherly-pilot`.
3. Target amount: **$5.00 / month**.
4. Set email triggers at **50% ($2.50)** and **100% ($5.00)**.
