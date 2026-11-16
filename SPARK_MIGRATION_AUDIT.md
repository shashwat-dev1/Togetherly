# Togetherly — Firebase Spark Migration & Architecture Audit

**Target Environment:** Firebase Project `togetherly-17397` (Mumbai, India)  
**Infrastructure Tier:** Firebase Spark Plan (100% Free / Zero Billing / Zero Credit Card)  
**Android Application ID:** `com.togetherly.couples`  
**Document Version:** 1.0.0  
**Audit Date:** November 2026  

---

## 1. Executive Summary

This audit documents the complete migration of the Togetherly backend architecture from requiring Cloud Functions (which demands the paid Firebase Blaze plan) to running entirely on the **Firebase Spark (Free) Plan**.

The primary objective is to enable 5–6 couples (10–15 testers) to participate in a private closed pilot across separate physical Android devices and cellular networks without requiring credit card registration, billing activation, or paid external infrastructure.

---

## 2. Cloud Function Dependencies & Spark Replacements

| Cloud Function / Feature | Former Role (Blaze Plan) | Spark Architecture Replacement | Technical Implementation | Security & Integrity Trade-off |
|---|---|---|---|---|
| **`validateAndApplyAction`** | Server-authoritative turn check, move logic, win checking, and action logging. | Client-side engine with atomic Firestore writes & security rules. | [GameSessionService.submitGameAction](file:///c:/Projects/LDR/src/services/firebase/gameSessionService.ts#L313-L440) checks turns, board boundaries, and applies actions directly to `gameSessions/{sessionId}` and `actions/{actionId}`. | Firestore Security Rules verify player membership and prevent session reassignment. Rules cannot prevent client-calculated moves if a modified client is used, which is acceptable for a trusted private pilot. |
| **`onPrivateAnswerWritten`** | Background Firestore trigger calculating simultaneous double-blind reveals. | Client-side deterministic reveal triggered by second submitter with Firestore rule guards. | [GameSessionService.submitSimultaneousAnswer](file:///c:/Projects/LDR/src/services/firebase/gameSessionService.ts#L463-L650) checks if partner's immutable answer doc exists. If both exist, computes match deterministically and writes to `gameSessions/{sessionId}`. | Double-blind secret guarantee is enforced via Firestore Security Rules: Player B cannot read Player A's answer until Player B's answer is written in Firestore (`exists(...)` rule). |
| **`awardCoupleXP` & `xpTransactions`** | Admin SDK transaction updating couple level and writing audit records. | Client-side deterministic transaction with idempotency IDs. | [XPProgressionService.awardXP](file:///c:/Projects/LDR/src/services/engagement/xpProgressionService.ts#L101-L157) uses deterministic transaction IDs (`tx_${source}_${referenceId}`) to prevent duplicate awards. | Firestore Rules permit couple members to update `sharedXP` and `coupleLevel`. Server-side tamper-proofing is deferred until public launch. |
| **`onNotificationCreated`** | Dispatched Android FCM push notifications via Cloud Functions. | Real-time in-app snapshot synchronization + persistent Activity Timeline. | Firestore `onSnapshot` updates partner screens in <500ms when app is active. [ActivityService](file:///c:/Projects/LDR/src/services/engagement/activityService.ts) maintains a persistent feed of turns and milestones. | Background push notifications requiring a server are deferred; in-app real-time multiplayer is 100% functional. |
| **Scheduled Daily Reset** | Scheduled cron function selecting daily challenge. | Deterministic UTC date-based challenge algorithm. | [DailyChallengeService.getDailyChallenge](file:///c:/Projects/LDR/src/services/engagement/dailyChallengeService.ts) seeds random generator with UTC date (`YYYY-MM-DD`). | 100% consistent across all devices globally without any scheduled server jobs. |

---

## 3. Detailed Component Architecture on Spark

### 3.1 Real-Time Multiplayer Session Engine
- **Turn-Based Games (Tic-Tac-Toe, Connect Four, Truth or Dare, Memory Match, Word Guess, Draw & Guess)**:
  - Both devices subscribe to `gameSessions/{sessionId}` via `onSnapshot`.
  - When Device A makes a move, `submitGameAction` validates turn order and writes the updated board state to Firestore.
  - Device B's `onSnapshot` listener fires in <500ms, updating the UI and switching the active turn indicator.
- **Simultaneous Games (Who Knows Whom Better?, This or That, Rock Paper Scissors, Couple Trivia)**:
  - Device A submits: Secret answer written to `/gameSessions/{sessionId}/privateAnswers/{playerA}_r{round}`. Public state updated to `waitingForPartner: true`.
  - Device B's UI displays: *"Partner has submitted — waiting for your answer!"*. Device B is blocked by Firestore Security Rules from reading Device A's answer.
  - Device B submits: Writes secret answer to `/privateAnswers/{playerB}_r{round}`. Because both now exist, Device B reads Device A's answer, computes the deterministic round score and reveals both answers simultaneously.
  - Device A's `onSnapshot` listener receives the revealed round result and plays the reveal animation simultaneously!

### 3.2 Progression & Shared XP Idempotency
- XP rewards are tied to a unique `referenceId` (e.g. `sessionId` for game wins, `dateStr` for daily challenges).
- Before awarding XP, `XPProgressionService.awardXP` verifies whether `tx_${source}_${referenceId}` already exists in Firestore `/couples/{coupleId}/xpTransactions`.
- If found, the transaction is rejected as an idempotent duplicate, preventing XP farming or race conditions.

### 3.3 Daily Challenges
- Instead of requiring a Cloud Scheduler cron job, daily challenges are derived deterministically using the UTC date string (`YYYY-MM-DD`).
- Both partners calculate the exact same challenge independently from a curated pool of 100+ challenges.
- Completion progress is tracked in Firestore under `/couples/{coupleId}/dailyChallengeProgress/{date}`.

---

## 4. Security Model & Honest Limitations on Spark

Under the Firebase Spark plan, all code executes on the client device (React Native / Hermes) and communicates directly with Firebase Authentication and Cloud Firestore.

### What is Strictly Enforced by Firestore Security Rules:
1. **Authentication Required**: No unauthenticated requests are permitted.
2. **User Data Isolation**: A user can only read/write their own document in `/users/{uid}`.
3. **Couple Boundaries**: Only authenticated members of a couple can read or write documents under `/couples/{coupleId}`.
4. **Session Access Control**: Only the two paired players in `playerIds` can access `/gameSessions/{sessionId}`.
5. **Double-Blind Answer Privacy**: Player B cannot read Player A's answer document until Player B's answer has been committed to Firestore.
6. **Immutable Invitation Redemption**: Invitation codes cannot be claimed more than once or redeemed by the creator.

### Honest Architectural Limitations (Accepted for Closed Pilot):
1. **Client-Authoritative Scoring**: Because game calculations execute in TypeScript on the players' phones rather than in an isolated server sandbox, an adversary with root access and modified client binaries could theoretically manipulate game scores.
   - *Mitigation for Pilot*: Testers consist of 5–6 invited couples (friends and relatives) using official APK builds.
2. **Background Push Notifications**: Push notifications sent while the app is killed require a backend service holding server credentials.
   - *Mitigation for Pilot*: Real-time in-app synchronization keeps active players synchronized. Turn alerts are listed in the in-app Activity tab.
3. **Anti-Cheat Guarantees**: Absolute anti-cheat guarantees require a trusted server backend (Cloud Functions on Blaze). This is intentionally deferred until commercial launch.

---

## 5. Verification Checklist

- [x] All 10 multiplayer games functional without Cloud Functions.
- [x] Zero references to `httpsCallable` or backend server endpoints in client code.
- [x] `firebase.json` updated to exclude `functions` from deployment.
- [x] Firestore security rules hardened for Spark double-blind reveal.
- [x] XP award idempotency verified with automated tests.
- [x] 72 automated tests passing across 6 suites (`npm test`).

