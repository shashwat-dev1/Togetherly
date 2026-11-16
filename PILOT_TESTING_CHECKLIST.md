# Togetherly — Pilot Testing Checklist

**Target:** Pre-Distribution Acceptance & Quality Verification  
**Audience:** Pilot Operators & QA Testers  
**Testing Devices:** Two Separate Physical Android Phones on Independent Networks  

---

## 1. Pre-Distribution Acceptance Gates

| Gate | Description | Verified Status |
|---|---|---|
| **Lint & Compile** | `npx expo lint` returns 0 errors and 0 warnings. | 🟢 PASS |
| **Strict TypeScript** | `npx tsc --noEmit` returns 0 errors. | 🟢 PASS |
| **Automated Tests** | `npm test` passes all 65 automated tests across 5 suites. | 🟢 PASS |
| **Cloud Functions** | `npm --prefix functions run build` compiles with 0 errors. | 🟢 PASS |
| **Git Safety** | No `.env` files, credentials, keystores, or secrets tracked in Git. | 🟢 PASS |
| **EAS Profile** | `eas.json` configured with `pilot` profile building standalone APK. | 🟢 PASS |

---

## 2. Real-Device Verification Checklist (Two Phones)

### Phase 1: Authentication & Account Creation
- [ ] Device 1 (Partner A): Successfully creates account with email & password.
- [ ] Device 1: User profile document created in Firestore under `/users/{uid}`.
- [ ] Device 2 (Partner B): Successfully creates account with email & password.
- [ ] Device 2: User profile document created in Firestore under `/users/{uid}`.
- [ ] Logout and re-login works smoothly on both devices with session restoration.

### Phase 2: Couple Pairing Handshake
- [ ] Device 1: Taps "Generate Invitation Code". Generates clean 6-character uppercase alphanumeric code.
- [ ] Code is persisted in Firestore `/invitations/{code}` with 48h expiration.
- [ ] Device 2: Enters the 6-character code and taps "Connect with Partner".
- [ ] Atomic pairing transaction succeeds:
  - Invitation status marked `'accepted'`.
  - New document created in `/couples/{coupleId}` with both `memberIds`.
  - Both users' documents updated with `activeCoupleId`.
- [ ] Device 1 receives real-time update and automatically transitions to the Home dashboard without user tapping refresh.
- [ ] Shared header shows both avatars and correct partner display name.

### Phase 3: Game Session Lifecycle (All 10 Games)
- [ ] **Who Knows Whom Better?:** Partner A submits answer. Partner B's UI confirms submission without showing answer. Partner B submits. Answers reveal simultaneously with correct match score.
- [ ] **This or That:** Both answer 10 preference questions. Mutual picks revealed simultaneously with final affinity percentage.
- [ ] **Tic-Tac-Toe:** Turns alternate cleanly. Move on Device 1 renders on Device 2 in <500ms. Win/Draw detected accurately.
- [ ] **Rock Paper Scissors:** Both pick hands in secret. Both hands revealed at once. Best of 3 tracked properly.
- [ ] **Truth or Dare:** Category selection, prompt display, skip limits, and partner confirmation sync across devices.
- [ ] **Couple Trivia:** 20-second timer sync, option lock-in, simultaneous reveal, and speed points awarded correctly.
- [ ] **Draw & Guess:** Strokes drawn on Device 1 appear on Device 2 via SVG coordinate sync. Guesses submitted in real time.
- [ ] **Connect Four:** Disc drop physics and alternating turns sync accurately. 4-in-a-row winning lines detected.
- [ ] **Memory Match:** Identical card deck layout on both devices. Card flip transitions and matched pairs sync cleanly.
- [ ] **Word Guess:** Letter evaluations (green, yellow, gray) sync across 6 collaborative attempts.

### Phase 4: Engagement & Retention
- [ ] Daily challenge for current UTC date appears on both partner home dashboards.
- [ ] Completing a required game increments daily challenge progress counter on both devices.
- [ ] Claiming challenge reward awards shared XP (+100 XP) and updates couple level bar on both devices.
- [ ] Second claim attempt is blocked.
- [ ] Activity tab renders completed games, turn notices, and milestone badges.
- [ ] Our World tab displays hydrated achievements (Bronze, Silver, Gold, Platinum) with detail modal on tap.

### Phase 5: Resilience & Disconnection
- [ ] Toggle Airplane Mode on Device 2 for 10 seconds mid-game. "Reconnecting..." indicator appears.
- [ ] Turn off Airplane Mode. Active game session reconnects and catches up to latest board state without resetting.
- [ ] Background app by pressing Android Home button. Foreground app after 30 seconds. State resumes cleanly.

### Phase 6: In-App Feedback Submission
- [ ] Open Profile tab $\rightarrow$ Tap "Send Feedback or Report Issue".
- [ ] Select category (e.g. "Sync Issue" or "Bug"). Select related game. Enter description. Tap "Send Feedback".
- [ ] Document created in Firestore under `/pilotFeedback/{id}`.
- [ ] Success message displayed. Input fields reset cleanly.
