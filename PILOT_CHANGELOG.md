# Togetherly — Closed Pilot Changelog & Release Notes

All changes, hardening updates, and preparation deliverables for the closed pilot release are documented here.

---

## [1.0.0-pilot] - November 2026

### 🚀 Highlights
- **Repository Connection:** Local project connected to GitHub remote repository (`https://github.com/shashwat-dev1/Togetherly.git`) on branch `main` with preserved commit history.
- **Dedicated Pilot Readiness:** Prepared Togetherly for a private, invite-only closed pilot with 5–6 couples across independent Android devices and network environments.

### 🔒 Backend & Real-Time Sync Hardening
- **Firestore Pairing Service (`src/services/firebase/coupleService.ts`):**
  - Connected `createInvitation` to Firestore collection `invitations/{code}` with 48-hour expiration.
  - Implemented atomic `acceptInvitation` transaction creating `couples/{coupleId}` and linking `activeCoupleId` on both partner documents simultaneously.
  - Added real-time `subscribeToCouple` listener so Partner A's phone updates instantly when Partner B redeems the invitation code.
- **Firestore User Profile Persistence (`src/services/firebase/authService.ts`):**
  - Connected `register` to create and write authoritative `users/{uid}` profiles in Firestore.
  - Connected `login` to hydrate user profile from Firestore and restore `activeCoupleId`.
  - Added `restoreSession()` restoring active Firebase Auth sessions on app launch.
- **Anti-Silent-Mock Safety Policy (`src/services/firebase/config.ts`):**
  - Prevented mock mode from silently activating if pilot builds have missing or invalid credentials.
  - Added `isPilotMisconfigured` flag exposing prominent error banner rather than pretending multiplayer is working.
- **Clean Store Neutrality (`useAuthStore.ts`, `useCoupleStore.ts`, `login.tsx`):**
  - Stopped pre-seeding stores with mock Alex/Sam data in production/pilot mode.
  - Hid developer quick-demo login buttons in production builds.

### 🐞 In-App Pilot Feedback System
- **Feedback Collection Service (`src/services/feedback/feedbackService.ts`):**
  - Created service persisting structured reports to Firestore collection `pilotFeedback`.
  - Supports categories: Bug (`bug`), Sync Issue (`sync_problem`), Game Issue (`game_issue`), Suggestion (`ux_suggestion`), Game Idea (`new_game_idea`), General (`general`).
- **In-App Feedback Modal (`src/components/common/FeedbackModal.tsx`):**
  - Added accessible in-app modal with category chips, optional game selector, multiline description, and submission status.
  - Added "Send Feedback or Report Issue" entrypoint in Profile tab.
- **Security Rules (`firestore.rules`):**
  - Added rule allowing testers to create and read only their own feedback.

### 📊 Observability & Telemetry
- **Logging Service (`src/services/telemetry/loggingService.ts`):**
  - Added structured diagnostic logger tracking auth failures, pairing failures, session create/join/action failures, listener errors, reconnects, and crashes.
  - Strict PII and secret denylist redacting passwords, tokens, API keys, and private answers.
  - 100-entry in-memory ring buffer for attaching to crash and feedback reports.

### 📱 Android Build & Distribution
- **EAS Build Configuration (`eas.json`):**
  - Created EAS configuration with `pilot` and `preview` profiles generating standalone installable APKs (`"buildType": "apk"`).
- **Android Permissions (`app.json`):**
  - Added explicit Android permissions: `INTERNET`, `VIBRATE`, `ACCESS_NETWORK_STATE`, `POST_NOTIFICATIONS`.
- **Harden Git Tracking (`.gitignore`):**
  - Added comprehensive ignore rules for signing keys (`.keystore`, `.jks`), service accounts (`*serviceAccount*.json`), `google-services.json`, debug logs, and `.env` files.

### 📚 Pilot Documentation Suite
- `PILOT_READINESS_AUDIT.md`: 10-point architectural, security, and deployment audit.
- `PILOT_DEPLOYMENT_GUIDE.md`: Step-by-step instructions for Firebase setup, Blaze billing, rules/functions deployment, EAS build, and APK sideloading.
- `PILOT_TESTING_CHECKLIST.md`: Manual verification checklist across all 10 games, pairing, and resilience.
- `PILOT_FEEDBACK_GUIDE.md`: Guide for testers on submitting useful reports.
- `REALTIME_TEST_PLAN.md`: 10-point cross-network real-time multiplayer synchronization test plan.
- `ENVIRONMENT_SETUP.md`: Comprehensive reference for all environment variables.
- `README.md`: Upgraded from default template to full product, architecture, and pilot handbook.
