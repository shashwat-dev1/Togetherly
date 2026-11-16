# Togetherly — Real-Time Multiplayer Test Plan

**Document Version:** 1.0.0  
**Testing Scope:** Closed Pilot Readiness (Two Independent Android Devices / Distinct Geographic Locations)  
**Target Architecture:** Cloud Firestore Real-Time Snapshot Listeners & Cloud Functions  

---

## 1. Executive Summary

This testing plan defines the protocol to verify real-time multiplayer synchronization across two independent physical Android devices over cellular data and independent Wi-Fi networks.

---

## 2. Test Matrix Overview

| Test Suite | Objective | Network Conditions | Pass Criteria |
|---|---|---|---|
| **RTP-01** | Account Creation & Atomic Pairing | High-speed Wi-Fi | Partner B joins via 6-character code; both reach paired home within <2s. |
| **RTP-02** | Session Creation & Handshake | 4G LTE / Wi-Fi | Session status transitions `waiting` $\rightarrow$ `ready` $\rightarrow$ `active` simultaneously. |
| **RTP-03** | Turn-Based Game Synchronization | Cross-network | Move on Device A reflects on Device B in <500ms; turn switches to Partner B. |
| **RTP-04** | Simultaneous Double-Blind Reveal | Wi-Fi / 5G | Answers remain secret until both submit; atomic reveal & scoring within <1s. |
| **RTP-05** | Temporary Network Interruption | Airplane mode toggle (10s) | Reconnection banner appears; state restored on reconnect without board reset. |
| **RTP-06** | App Backgrounding & Foregrounding | Home button / app switch | App resumes active session listener; catches up to partner's moves. |
| **RTP-07** | Duplicate Action / Idempotency | Double-tap move button | Only one action processed; second action discarded gracefully without error. |
| **RTP-08** | Stale Session & Abandonment | App force-kill during match | Session status transitions to `abandoned` or remaining partner can cleanly exit. |
| **RTP-09** | Rematch Handshake | Normal latency | Rematch button provisions clean linked session; both devices navigate to new match. |
| **RTP-10** | Concurrent Simultaneous Submissions | Millisecond-delta submit | Cloud Function handles concurrent writes without race condition or score drift. |

---

## 3. Detailed Step-by-Step Test Procedures

### Test RTP-01: Couple Pairing & Real-Time Presence
1. **Device A:** Install APK. Launch app. Tap "Register". Sign up with test email (`tester_a1@togetherly.test`).
2. **Device A:** On Pairing screen, tap "Generate Invitation Code". Verify 6-character uppercase code (e.g. `K9X2B4`).
3. **Device B:** Install APK. Launch app. Tap "Register". Sign up with test email (`tester_b1@togetherly.test`).
4. **Device B:** On Pairing screen, select "I have a code". Enter `K9X2B4`. Tap "Connect with Partner".
5. **Expected Result:**
   - Device B accepts code atomically via Firestore transaction.
   - Device A’s real-time snapshot listener detects couple creation and transitions from Pairing screen to `(tabs)/home` automatically without manual refresh.
   - Both devices display each other's name on the shared couple header.

---

### Test RTP-02: Turn-Based Synchronization (Tic-Tac-Toe & Connect Four)
1. **Device A:** Navigate to **Games** tab $\rightarrow$ Tap **Tic-Tac-Toe** $\rightarrow$ Tap **Start Match**.
2. **Device B:** App receives turn notification or sees match in **Activity** tab $\rightarrow$ Taps **Join Match**.
3. **Device A:** Makes first move (places Heart at index 4).
4. **Device B:** Verify board updates within <500ms with Heart at center. Turn indicator switches to "Your Turn (Star)".
5. **Device B:** Places Star at index 0.
6. **Device A:** Verify board updates within <500ms.
7. **Complete Game:** Play to win or draw.
8. **Expected Result:**
   - Winner banner displayed on both devices simultaneously.
   - Shared XP awarded once (+30 XP) and recorded in `xpTransactions`.
   - Streak updated and reflected in both UI headers.

---

### Test RTP-03: Simultaneous Double-Blind Reveal (Who Knows Whom Better? & This or That)
1. **Device A & B:** Enter **Who Knows Whom Better?**.
2. **Device A:** Submits Round 1 answer.
3. **Verification on Device B:** Device B does **NOT** see Device A's selection. UI displays: *"Partner has submitted — waiting for your answer!"*.
4. **Device B:** Submits Round 1 answer.
5. **Expected Result:**
   - Cloud Function `onPrivateAnswerWritten` triggers when both `snap1` and `snap2` exist in `privateAnswers`.
   - Both answers revealed simultaneously with accuracy calculation.
   - Neither player could intercept the partner's answer prior to their own submission.

---

### Test RTP-04: Network Disconnection & Reconnection Recovery
1. Start an active game of **Connect Four** between Device A and Device B.
2. Device A drops a disc in column 3.
3. **On Device B:** Enable **Airplane Mode** for 15 seconds.
4. **On Device A:** Drops disc in column 4.
5. **On Device B:** Turn off Airplane Mode.
6. **Expected Result:**
   - Device B shows *"Connection lost. Reconnecting..."* while offline.
   - Device B reconnects via `useGameSession` exponential backoff without crashing.
   - Latest board state containing Device A's move in column 4 is rendered correctly.
   - Game continues seamlessly.

---

### Test RTP-05: App Backgrounding & Multi-Tasking
1. During an active round of **Draw & Guess**, Device B presses the Android Home button (backgrounding app).
2. Device A draws 3 strokes and submits a stroke batch.
3. Device B re-opens Togetherly from Android Recent Apps.
4. **Expected Result:**
   - `onSnapshot` listener resumes on foreground event.
   - Drawing canvas on Device B catches up to Device A's drawing strokes.

---

### Test RTP-06: Idempotent Action Submission
1. In **Word Guess**, rapidly tap "Submit Guess" 4 times in quick succession.
2. **Expected Result:**
   - First submission processed with `idempotencyKey`.
   - Subsequent 3 taps rejected by idempotency check or duplicate state check without decrementing remaining attempts twice.

---

## 4. Verification Checklist & Sign-Off

- [ ] Real-time sync verified on two physical phones on separate networks.
- [ ] No private answers visible in Firestore inspector before mutual submission.
- [ ] Anti-cheat security verified: Client write to `sharedXP` blocked by security rules.
- [ ] In-app feedback modal successfully logs entries to `pilotFeedback`.
- [ ] Zero crash reports on background/foreground transitions.
