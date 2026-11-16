# Togetherly — Closed Pilot Readiness Audit

**Document Version:** 1.0.0  
**Target Audience:** Engineering Team & Pilot Operations  
**Pilot Cohort:** 5–6 Couples (10–12 Testers, Android Physical Devices)  
**Evaluation Date:** November 2026  
**Auditor Role:** Senior Product Architect & Security Engineer  

---

## 1. Current Architecture Overview

Togetherly is an Android-first multiplayer entertainment platform for couples.

```
┌────────────────────────────────────────────────────────┐
│                   Android Client App                   │
│  React Native 0.88 + Expo SDK 58 + Expo Router (Tabs) │
│  Zustand Client Store + Lucide Icons + React SVG       │
└───────────────────────────┬────────────────────────────┘
                            │
               HTTPS / Firestore WebSockets
                            ▼
┌────────────────────────────────────────────────────────┐
│                 Firebase Cloud Backend                 │
│  - Firebase Auth: Email/Password Authentication        │
│  - Cloud Firestore: Realtime Multi-Document Listeners   │
│  - Cloud Functions v1: Turn validation & blind reveal  │
│  - Firebase Cloud Messaging: Push notifications        │
│  - Security Rules: Member authorization & anti-cheat   │
└────────────────────────────────────────────────────────┘
```

---

## 2. Completed Functionality

### Core Foundations & Infrastructure
- [x] **Expo SDK 58 Architecture:** TypeScript strict mode, clean modular component hierarchy.
- [x] **Design Token System:** Semantic palette (`primary`, `secondary`, `accent`, `surface`, `border`, `textMuted`) with dark/romantic theme switching.
- [x] **Universal Multiplayer Game Engine (`src/services/firebase/gameSessionService.ts`):** Supports turn-based, simultaneous double-blind, and real-time cooperative modes.
- [x] **All 10 Multiplayer Games Implemented:**
  1. *Who Knows Whom Better?* (Relationship trivia, double-blind reveal)
  2. *This or That* (Affinity matching, preference reveal)
  3. *Tic-Tac-Toe* (Alternating turns, win/draw detection, rematch)
  4. *Rock Paper Scissors* (Best of 3, simultaneous hidden picks)
  5. *Truth or Dare* (100+ prompts, turn management, skip limits)
  6. *Couple Trivia* (150 questions across 5 categories, timed rounds)
  7. *Draw & Guess* (Structured SVG vector stroke sync, 60 prompts)
  8. *Connect Four* (7x6 column drop logic, 4-in-a-row detection)
  9. *Memory Match* (16 cards, 8 pairs, seed-based deterministic layout)
  10. *Word Guess* (5-letter romantic word puzzles, Wordle evaluation)
- [x] **Engagement Ecosystem:**
  - 104 Daily Challenges across 6 categories with deterministic UTC date picker.
  - Shared Couple XP leveling curve ($250 \times (L - 1) + 50 \times (L - 1)^2$).
  - 18 Couple Achievements across 5 tiers with unlock evaluation.
  - Daily & weekly streak tracking with non-punitive missed-day recovery.
  - Activity feed timeline with filter tabs.
  - Granular notification preferences.
  - Deep linking router (`togetherly://`).

---

## 3. Mock versus Production Functionality Audit

| Feature | Mock Implementation | Real Production Backend | Readiness Status |
|---|---|---|---|
| **Game Session Engine** | In-memory `Map<string, GameSession>` with reactive subscriber simulation | Cloud Firestore `gameSessions/{id}` with `onSnapshot` real-time listeners | 🟢 Implemented & Ready |
| **Simultaneous Reveal** | Local secret cache `mockPrivateAnswers` | Firestore `privateAnswers` subcollection + Cloud Function trigger | 🟢 Implemented & Ready |
| **Authentication** | Hardcoded mock users (`usr_mock_alex`, `usr_mock_sam`) | Firebase Auth (`createUserWithEmailAndPassword`, `signInWithEmailAndPassword`) | 🟡 Requires Firestore `users/{uid}` persistence |
| **Couple Pairing** | In-memory `mockInvitations` & static pre-paired couple | Firestore `invitations` & `couples` collections | 🔴 **BLOCKER:** `coupleService.ts` was only in-memory |
| **FCM Notifications** | Local memory queue `mockNotificationInbox` | Firestore `notifications` queue + `onNotificationCreated` Cloud Function | 🟢 Implemented & Ready |
| **XP & Streaks** | In-memory update on mock couple object | Firestore `couples/{coupleId}` + `xpTransactions` subcollection | 🟢 Implemented & Ready |
| **Daily Challenges** | In-memory progress map | Firestore `couples/{coupleId}/dailyChallengeProgress/{date}` | 🟢 Implemented & Ready |

---

## 4. Real-Time Synchronization Readiness

### Strengths
- **Native WebSockets / SSE via Firestore:** Real-time listeners (`onSnapshot`) eliminate polling overhead and provide sub-second updates across devices.
- **Idempotency:** Action submissions accept `idempotencyKey` preventing duplicate moves when network packets retry.
- **Exponential Backoff:** `useGameSession` hook contains built-in backoff reconnection logic (1s to 10s ceiling).

### Identified Risks & Gaps
1. **Network Interruption Recovery:** While reconnection logic exists in `useGameSession`, if a client drops off mid-turn, there was no prominent UI indicator stating *"Partner disconnected — waiting for reconnection"*.
2. **Turn Desynchronization:** If two devices submit actions nearly simultaneously on turn-based games, Firestore transactions must reject the out-of-turn submission gracefully without freezing the client UI.

---

## 5. Authentication and Pairing Readiness

### Identified Gap (Deployment Blocker #1)
In Phase 1, `AuthService.ts` and `CoupleService.ts` used in-memory stores for developer preview.
- **Problem:** When Tester A creates an invitation code on their phone in a production build, it was stored in local device RAM. Tester B on a separate phone in another city queries Firestore and gets "Invitation not found".
- **Remediation:** Wire `CoupleService.createInvitation` and `CoupleService.acceptInvitation` directly to Firestore with atomic transactions, and wire `AuthService` to write/read `users/{uid}`.

---

## 6. Database Security Assessment

### Firestore Rules (`firestore.rules`)
- **Default Deny:** Enforced (`match /{document=**} { allow read, write: if false; }`).
- **User Privacy:** Users can only modify their own profile (`isOwner(uid)`).
- **Couple Isolation:** Couple data strictly restricted to verified couple members (`isCoupleMember(coupleId)`).
- **Anti-Cheat Scoring:** Clients are prohibited from modifying `sharedXP`, `coupleLevel`, `scores`, or `winnerId` directly.
- **Double-Blind Privacy:** Subcollection `privateAnswers/{answerId}` only permits the authoring player to read their own secret answer prior to server reveal.

---

## 7. Cloud Functions Readiness

The project includes Firebase Cloud Functions v1 with strict TypeScript:
1. `validateAndApplyAction`: Server-authoritative turn check and score verification.
2. `onPrivateAnswerWritten`: Server double-blind reveal trigger when both partners submit.
3. `onNotificationCreated`: Multicast push dispatcher with automatic dead-token pruning.

**Requirement:** Deploying Cloud Functions requires the Firebase project to be on the **Blaze (Pay as you go)** plan. Free Spark plan does not permit Node.js Cloud Functions.

---

## 8. Android Build Readiness

- **Expo SDK:** 58.0.0 (Latest stable).
- **Package Name:** `com.togetherly.couples`.
- **Permissions Required:** `INTERNET`, `VIBRATE`, `ACCESS_NETWORK_STATE`, `POST_NOTIFICATIONS`.
- **EAS Build Configuration:** Missing `eas.json` for standalone internal APK generation.
- **Remediation:** Create `eas.json` with an explicit `pilot` profile configured for `"buildType": "apk"`.

---

## 9. Deployment Blockers Summary

| # | Severity | Blocker Description | Required Fix |
|---|---|---|---|
| **1** | **CRITICAL** | `CoupleService` was in-memory only; pairing between two separate phones failed in production. | Implement real Firestore queries & transactions in `CoupleService`. |
| **2** | **CRITICAL** | `AuthService` did not write `users/{uid}` in Firestore upon registration or read it upon login. | Persist and hydrate `users/{uid}` in Firestore. |
| **3** | **HIGH** | Default stores (`useAuthStore`, `useCoupleStore`) pre-seeded with mock Alex/Sam data. | In production/pilot mode, initialize with clean `null` state so real testers register and pair. |
| **4** | **HIGH** | Missing `eas.json` for generating standalone APK. | Create `eas.json` with APK build profile. |
| **5** | **MEDIUM** | In-app feedback system for pilot testers was missing. | Create `pilotFeedback` collection, UI modal, and submission service. |
| **6** | **MEDIUM** | Centralized diagnostic logging service was missing. | Create `loggingService.ts` for sanitized error telemetry. |

---

## 10. Prioritized Remediation Plan

1. **Phase A (Backend Wiring):** Connect `CoupleService` and `AuthService` to real Firestore with unit/integration verification.
2. **Phase B (Store Neutrality):** Update `useAuthStore` and `useCoupleStore` to prevent mock data leakage in production.
3. **Phase C (Build & Permissions):** Add `eas.json` and configure Android permissions in `app.json`.
4. **Phase D (Feedback & Observability):** Implement `FeedbackService`, in-app feedback modal, and `LoggingService`.
5. **Phase E (Verification & Documentation):** Run full test suite, verify compilation, and publish pilot guides.

