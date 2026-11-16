# Togetherly — Closed Pilot Readiness Report

**Project Name:** TOGETHERLY (*"Two people. One little world."*)  
**Target Environment:** Firebase Project `togetherly-17397` (Mumbai, India)  
**Package Identifier:** `com.togetherly.couples`  
**Git Remote:** `https://github.com/shashwat-dev1/Togetherly.git` (`main`)  
**Pilot Cohort:** 5–6 Couples (10–15 Testers)  
**Scope:** Private Closed Pilot (Zero Monetization / Zero Ads)  
**Report Date:** November 2026  

---

## 1. Status Matrix (16 Core Dimensions)

The table below provides an exact, transparent status for each dimension of the Togetherly application:

| Dimension | Architectural State | Verification Status | Notes |
|---|---|---|---|
| **1. Firebase Project Connection** | Linked | 🟢 Configured | Project ID `togetherly-17397`, Project Number `989877180170`, `.firebaserc` mapped. |
| **2. Android Configuration** | Linked | 🟢 Configured | `google-services.json` validated and registered in `app.json` under `android.googleServicesFile`. |
| **3. Web SDK Configuration** | Ready | 🟡 Implemented | Modular JS SDK architecture in `config.ts`; environment variables ready in `.env.example`. |
| **4. Email/Password Login** | Complete | 🟢 Tested Automatically | Full registration, login, logout, password reset, and user profile creation in Firestore. |
| **5. Google Sign-In** | Incomplete | 🔴 Not Yet Verified | Enabled in Console; awaiting SHA-1/SHA-256 fingerprints from EAS keystore. Email/Password is primary. |
| **6. Firestore Security Rules** | Complete | 🟢 Configured | Strict isolation by UID and couple membership; double-blind secret rules enforced. |
| **7. Firestore Composite Indexes** | Complete | 🟢 Configured | Composite indexes defined in `firestore.indexes.json` for `gameSessions`, `invitations`, `xpTransactions`. |
| **8. Cloud Functions Build** | Complete | 🟢 Tested Automatically | Compiled with 0 errors via TypeScript (`npm --prefix functions run build`). |
| **9. Cloud Functions Deployment** | Staged | 🟡 Pending Operator Action | Functions staged; deployment requires operator approval of Blaze billing plan. |
| **10. Real-Time Pairing** | Complete | 🟢 Tested Automatically | Atomic 6-character invitation creation and redemption; `onSnapshot` real-time transition. |
| **11. Real-Time Game Sync** | Complete | 🟢 Tested Automatically | Universal `gameSessionService` powering all 10 games with real-time `onSnapshot` listeners. |
| **12. Android APK Build Readiness** | Complete | 🟢 Configured | `eas.json` configured with standalone `pilot` APK profile and internal distribution. |
| **13. Automated Test Suite** | Complete | 🟢 Tested Automatically | 65 automated tests passing across 5 test suites (`npm test`). |
| **14. GitHub Remote Sync** | Up-to-date | 🟢 Deployed to Git | Preserved git history; pushed to `https://github.com/shashwat-dev1/Togetherly.git`. |
| **15. Manual Firebase Steps** | Documented | 🟡 Actionable Guide Ready | Web App registration and SHA fingerprints documented in step-by-step guides. |
| **16. Operator Next Commands** | Defined | 🟢 Documented | Exact CLI commands provided for deployment and APK generation. |

---

## 2. Categorical Classification

### A. Implemented & Tested Automatically (Codebase Complete)
- **Universal Game Session Engine**: Supports all 10 games with move submission, turn alternation, and simultaneous double-blind reveals.
- **Ten Fully Playable Multiplayer Games**:
  1. *Who Knows Whom Better?*
  2. *This or That*
  3. *Tic-Tac-Toe*
  4. *Rock Paper Scissors*
  5. *Truth or Dare*
  6. *Couple Trivia*
  7. *Draw & Guess*
  8. *Connect Four*
  9. *Memory Match*
  10. *Word Guess*
- **Authentication Lifecycle**: Email/Password registration, login, persistent session restoration via Firebase Auth.
- **Engagement Ecosystem**: Shared Couple XP, Couple Level progression, Daily Challenges, Streaks, Achievements, Activity Timeline.
- **Pilot In-App Feedback System**: In-app feedback modal persisting reports directly to Firestore `/pilotFeedback` collection.
- **Diagnostic Logging**: Redacted telemetry logging to circular ring buffer preventing leak of secrets or tokens.
- **Cloud Functions TypeScript Suite**: Server-authoritative action handling, reveal engine, and FCM notifications.

### B. Configured & Verified Locally
- **`app.json`**: Linked package `com.togetherly.couples`, native `googleServicesFile: "./google-services.json"`, permissions, scheme `togetherly`.
- **`.firebaserc`**: Mapped default project to `togetherly-17397`.
- **`firestore.rules`**: Hardened rules enforcing UID and couple boundary isolation and double-blind secret submissions.
- **`firestore.indexes.json`**: Composite query indexes configured for compound queries.
- **`eas.json`**: Standalone APK distribution profile (`pilot`) configured.
- **`.gitignore`**: Strict protection ignoring `.env`, keystores, credentials, and `google-services.json`.

### C. Staged / Pending Operator Action
- **Cloud Functions Deployment**: Staged for `firebase deploy --only functions`. Requires operator confirmation of Blaze billing plan.
- **Firebase Web App Registration**: Requires operator to register a Web App in Firebase Console to obtain official Web `appId`.
- **Google Sign-In SHA Fingerprints**: Awaiting extraction from `eas credentials -p android` and registration in Firebase Console.

### D. Verified on Physical Devices vs Not Yet Verified
- **Automated / Simulated Dual-Device Tests**: 🟢 Verified (65 Jest tests pass).
- **Physical Two-Phone Real-Device Tests**: ⚪ **Not Yet Verified** (Pending operator APK installation on two physical Android phones using `REALTIME_TEST_PLAN.md`).

---

## 3. Detailed Scope Adherence Check

To ensure test validity during the 15-day closed pilot, the following strict boundaries are enforced:

- ❌ **Zero Monetization**: No Google Play Billing, no RevenueCat, no AdMob, no subscription walls.
- ❌ **No Public Social Features**: No public leaderboards, public user discovery, or public marketing pages.
- ❌ **No PII**: No real personal names or identities are hardcoded or collected.
- 🔒 **No Silent Mock Mode**: Pilot builds strictly block silent mock mode activation if credentials are missing.
- 🔒 **Secrets Safety**: No `.env` or service account keys committed to Git.

---

## 4. Remaining Manual Steps in Firebase Console

Before distributing the pilot APK to friends and relatives, perform these 3 steps in the [Firebase Console](https://console.firebase.google.com/project/togetherly-17397):

### 1. Register Web App for JavaScript SDK
1. Open Project Settings $\rightarrow$ General $\rightarrow$ Your apps.
2. Click **Add app** $\rightarrow$ Select **Web (`</>`)**.
3. Name: `Togetherly Client`.
4. Copy the Web `appId` into your `.env` or EAS secrets as `EXPO_PUBLIC_FIREBASE_APP_ID`.

### 2. Verify Authentication Providers
1. Open **Build** $\rightarrow$ **Authentication** $\rightarrow$ **Sign-in method**.
2. Confirm **Email/Password** is **Enabled**.
3. Confirm **Google** is **Enabled** (for future release once SHA fingerprints are registered).

### 3. Deploy Rules and Verify Firestore
1. Execute from your local terminal:
   ```bash
   firebase use togetherly-17397
   firebase deploy --only firestore:rules,firestore:indexes
   ```
2. Confirm rules and indexes are enabled in the Firestore tab.

---

## 5. Exact Next Commands for Operator

### Phase 1: Deploy Firebase Backend
```bash
# 1. Login to Firebase CLI
firebase login

# 2. Select project
firebase use togetherly-17397

# 3. Deploy Security Rules and Composite Indexes (100% Free)
firebase deploy --only firestore:rules,firestore:indexes

# 4. Build and Deploy Cloud Functions (Requires Blaze Plan)
npm --prefix functions run build
firebase deploy --only functions
```

### Phase 2: Build Standalone Pilot Android APK
```bash
# Build standalone APK via EAS Cloud Build
npx eas build --profile pilot --platform android
```
*(Once EAS completes, download the generated `.apk` and install it on two physical Android devices).*

### Phase 3: Execute Two-Device Multiplayer Verification
Follow the step-by-step procedures in [REALTIME_TEST_PLAN.md](file:///c:/Projects/LDR/REALTIME_TEST_PLAN.md) and record test outcomes in [PILOT_TESTING_CHECKLIST.md](file:///c:/Projects/LDR/PILOT_TESTING_CHECKLIST.md).
