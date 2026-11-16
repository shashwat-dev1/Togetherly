# Togetherly — Closed Pilot Testing Checklist & Scorecard

**Target Project:** Togetherly (`togetherly-17397`)  
**Package Identifier:** `com.togetherly.couples`  
**Distribution:** Standalone Android APK (EAS `pilot` profile)  
**Test Setup:** Two Physical Android Devices (Device A & Device B) on Independent Networks  
**Tester Cohort:** Internal Team Verification $\rightarrow$ 5–6 Pilot Couples  
**Document Version:** 1.1.0  

---

## 1. Automated Quality Gates

| Quality Gate | Command | Expected Output | Status |
|---|---|---|---|
| **TypeScript Typecheck** | `npx tsc --noEmit` | Clean exit with 0 errors | 🟢 PASS |
| **Expo Linter** | `npx expo lint` | Clean exit with 0 warnings/errors | 🟢 PASS |
| **Jest Automated Test Suite** | `npm test` | 72 passing tests across 6 suites | 🟢 PASS |
| **Cloud Functions Compilation** | `npm --prefix functions run build` | Clean TypeScript build | 🟢 PASS |
| **Secrets & Credentials Safety** | `git status` | `.env` and `google-services.json` ignored | 🟢 PASS |
| **EAS Build Configuration** | `eas.json` | Standalone APK `pilot` profile ready | 🟢 PASS |

---

## 2. Two-Phone Physical Device Verification Matrix

Use this scorecard during physical two-phone validation across separate cellular/Wi-Fi networks. Mark each test as **PASS**, **FAIL**, or **NOT TESTED**.

| Test ID | Test Category & Description | Device A Action | Device B Action | Expected Real-Time Behavior | Verified Status |
|---|---|---|---|---|:---:|
| **TEST A** | **Authentication** | Register with `test_a@togetherly.test` | Register with `test_b@togetherly.test` | Two independent user profiles created in Firestore `/users/{uid}`; sessions persist across app restarts. | `[ NOT TESTED ]` |
| **TEST B** | **Pairing Handshake** | Generate 6-char invitation code (e.g. `K9X2B4`) | Enter code `K9X2B4` & tap "Connect" | Atomic Firestore transaction creates `/couples/{coupleId}`. Device A transitions to Home automatically without manual refresh. | `[ NOT TESTED ]` |
| **TEST C** | **Multiplayer Sync** | Start Tic-Tac-Toe match | Join match via Activity tab | Device A places Heart at index 4; Device B's board renders Heart in <500ms. Turn indicator switches to Device B. | `[ NOT TESTED ]` |
| **TEST D** | **Simultaneous Double-Blind Answers** | Submit answer in *Who Knows Whom Better?* | Submit answer after Partner A | Device A's answer remains strictly hidden from Device B until Device B submits. Simultaneous reveal and scoring trigger atomically. | `[ NOT TESTED ]` |
| **TEST E** | **Network Drop & Reconnection** | Play active match of Connect Four | Toggle Airplane Mode ON for 15s, then OFF | Device B displays "Reconnecting..." banner; upon reconnection, board state updates to latest moves without resetting. | `[ NOT TESTED ]` |
| **TEST F** | **Backgrounding & Foregrounding** | Draw 3 strokes in Draw & Guess | Press Android Home button, wait 30s, re-open app | App resumes active `onSnapshot` listener; canvas catches up with Device A's new strokes seamlessly. | `[ NOT TESTED ]` |
| **TEST G** | **Security & Access Control** | Authenticated as Couple A | Attempt to join Couple B's session via deep link | Security rules and session engine deny access; user returned to Home with error notification. | `[ NOT TESTED ]` |
| **TEST H-01** | **Game 1: Who Knows Whom Better?** | Answer 5 relationship questions | Answer 5 relationship questions | Double-blind submissions, secret answers, reveal, accuracy scores match. | `[ NOT TESTED ]` |
| **TEST H-02** | **Game 2: This or That** | Select 10 preference choices | Select 10 preference choices | Simultaneous choices reveal affinity percentage accurately. | `[ NOT TESTED ]` |
| **TEST H-03** | **Game 3: Tic-Tac-Toe** | Make alternating moves | Make alternating moves | Turns alternate cleanly; winning 3-in-a-row or draw detected properly. | `[ NOT TESTED ]` |
| **TEST H-04** | **Game 4: Rock Paper Scissors** | Pick Hand (Rock/Paper/Scissors) | Pick Hand in secret | Secret pick revealed simultaneously; best of 3 tracked correctly. | `[ NOT TESTED ]` |
| **TEST H-05** | **Game 5: Truth or Dare** | Pick Category & prompt | Confirm completion or skip | Turns alternate; skips respect configurable limits; round history syncs. | `[ NOT TESTED ]` |
| **TEST H-06** | **Game 6: Couple Trivia** | Answer timed quiz questions | Answer timed quiz questions | 20s timer syncs; simultaneous lock-in; speed bonus calculated. | `[ NOT TESTED ]` |
| **TEST H-07** | **Game 7: Draw & Guess** | Draw visual strokes | Guess secret prompt | Coordinates stream in real time; correct guess triggers win round. | `[ NOT TESTED ]` |
| **TEST H-08** | **Game 8: Connect Four** | Drop colored discs | Drop colored discs | Turn alternation, physics drop animation, and 4-in-a-row lines sync. | `[ NOT TESTED ]` |
| **TEST H-09** | **Game 9: Memory Match** | Flip two cards | Flip two cards | Identical shuffled card layout; matched pairs removed simultaneously. | `[ NOT TESTED ]` |
| **TEST H-10** | **Game 10: Word Guess** | Enter 5-letter word guess | View shared letter feedback | Green/yellow/gray letter feedback synchronizes across 6 attempts. | `[ NOT TESTED ]` |

---

## 3. Pilot Retention & Engagement Verification

| Check | Description | Pass Criteria | Status |
|---|---|---|:---:|
| **Daily Challenge** | Server UTC daily challenge displays on both devices | Both see identical prompt and category | `[ NOT TESTED ]` |
| **Progress Increment** | Playing required game increments challenge counter | Counter updates on both screens in real time | `[ NOT TESTED ]` |
| **Reward Claim** | Tapping "Claim Reward" awards +100 Shared XP | XP bar advances; level-up detected; second claim blocked | `[ NOT TESTED ]` |
| **Streak Tracking** | Playing on consecutive days updates couple streak | Streak counter increments; flame badge updates | `[ NOT TESTED ]` |
| **Achievements** | Completing milestone unlocks achievement | Badge renders in Our World tab with detail modal | `[ NOT TESTED ]` |
| **Activity Timeline** | Completed matches logged in Activity feed | Chronological list of shared moments rendered | `[ NOT TESTED ]` |

---

## 4. In-App Tester Feedback Verification

| Check | Action | Pass Criteria | Status |
|---|---|---|:---:|
| **Feedback Submission** | Open Profile tab $\rightarrow$ Tap "Send Feedback" $\rightarrow$ Select Category (Bug/Sync/UX) $\rightarrow$ Enter details $\rightarrow$ Submit | Document saved in Firestore `/pilotFeedback/{id}`. Confirmation alert shown. Input fields reset. | `[ NOT TESTED ]` |
| **Access Isolation** | Tester attempts to query all feedback documents | Security rules allow users to read only their own submissions. | `[ NOT TESTED ]` |

---

## 5. Post-Testing Sign-off

- **Operator / Lead Tester Name:** __________________________________
- **Date Tested:** ______________________
- **Device A Model & Android OS:** __________________________________
- **Device B Model & Android OS:** __________________________________
- **Pilot Go / No-Go Decision:** `[ ] GO FOR 5-6 COUPLES`  `[ ] NO-GO (FIXES REQUIRED)`
