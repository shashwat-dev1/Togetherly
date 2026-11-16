# Togetherly — Real-Time Multiplayer Test Plan (Two Devices)

**Target Environment:** Firebase Project `togetherly-17397`  
**Database Region:** Mumbai, India (`asia-south1`)  
**Package Identifier:** `com.togetherly.couples`  
**Distribution:** Standalone Android APK (EAS `pilot` profile)  
**Testing Scope:** Physical Device Verification across Separate Networks  
**Document Version:** 1.1.0  

---

## 1. Overview & Setup

This test plan defines the exact protocol to verify real-time multiplayer synchronization between two physical Android devices (Device A and Device B) connected over cellular networks and distinct Wi-Fi connections.

### Test Requirements:
- **Device A:** Physical Android device (Wi-Fi or Mobile Data).
- **Device B:** Physical Android device (Separate Wi-Fi or Mobile Data in a different location if possible).
- **Installed Build:** Standalone APK built via `eas build --profile pilot --platform android`.
- **Backend:** Connected to live Firebase project `togetherly-17397` in Mumbai.

---

## 2. Test Procedures (Tests A through H)

### TEST A — Authentication Lifecycle
1. **Device A:** Launch app. Tap "Register". Enter email `tester_alex@togetherly.test`, password `Password123!`, display name `Alex`.
2. **Device B:** Launch app. Tap "Register". Enter email `tester_sam@togetherly.test`, password `Password123!`, display name `Sam`.
3. **Verify:**
   - Both devices complete registration and reach the un-paired Pairing Screen.
   - User documents exist in Firestore under `/users/{uid_alex}` and `/users/{uid_sam}`.
   - Force close the app on Device A and re-open. Confirm session is restored without prompting for credentials.

---

### TEST B — Couple Invitation & Pairing Handshake
1. **Device A (Alex):** Tap "Generate Invitation Code". Note the 6-character uppercase code (e.g. `K9X2B4`).
2. **Device B (Sam):** Select "I have a code". Enter `K9X2B4` and tap "Connect with Partner".
3. **Verify:**
   - Firestore updates `/invitations/K9X2B4` to status `'accepted'` within an atomic transaction.
   - New couple document is created in `/couples/{coupleId}` containing both UIDs.
   - Device A’s real-time snapshot listener detects couple creation and automatically navigates to `(tabs)/home` without Alex tapping refresh.
   - Both devices display the shared header with both partner names (`Alex & Sam`).

---

### TEST C — Real-Time Turn-Based Multiplayer (Tic-Tac-Toe / Connect Four)
1. **Device A:** Navigate to Games $\rightarrow$ Start **Tic-Tac-Toe** match.
2. **Device B:** Open Activity tab $\rightarrow$ Tap "Join Match".
3. **Device A:** Place Heart at center tile (index 4).
4. **Device B:** Verify center tile updates to Heart in <500ms without manual refresh. Turn indicator switches to "Your Turn (Star)".
5. **Device B:** Place Star at top-left tile (index 0).
6. **Device A:** Verify top-left tile updates to Star in <500ms.
7. Play until a player wins or draws.
8. **Verify:**
   - Winner modal triggers simultaneously on both devices.
   - Shared Couple XP is awarded (+30 XP) and visible in the header XP bar on both screens.

---

### TEST D — Simultaneous Double-Blind Reveal (Who Knows Whom Better? / This or That)
1. **Device A & B:** Both enter **Who Knows Whom Better?**.
2. **Device A:** Select answer for Round 1 and submit.
3. **Device B Check:** Device B must see: *"Partner has submitted — waiting for your answer!"*. Device A's selection must NOT be visible on Device B or in Device B's network traffic.
4. **Device B:** Select answer for Round 1 and submit.
5. **Verify:**
   - Both submissions exist in `/gameSessions/{sessionId}/privateAnswers/`.
   - Simultaneous reveal triggers atomically. Both screens reveal both selections at the exact same moment.
   - Match calculation scores match points accurately.

---

### TEST E — Network Interruption & Reconnection Recovery
1. Start an active match of **Connect Four** between Device A and Device B.
2. Device A drops a disc in column 3.
3. **On Device B:** Enable **Airplane Mode** for 15 seconds.
4. **On Device A:** Drop disc in column 4.
5. **On Device B:** Disable Airplane Mode.
6. **Verify:**
   - Device B displays "Reconnecting..." indicator while disconnected.
   - Upon network reconnection, `useGameSession` listener reconnects with exponential backoff.
   - Device B's board updates to render Device A's disc in column 4 without resetting or crashing.

---

### TEST F — Backgrounding & Multi-Tasking
1. During an active round of **Draw & Guess**, Device B presses the Android Home button (minimizing the app).
2. Device A draws 3 strokes.
3. Device B re-opens Togetherly from Android Recent Apps after 30 seconds.
4. **Verify:**
   - Canvas on Device B catches up to Device A's strokes immediately upon foregrounding.

---

### TEST G — Security & Cross-Couple Boundary Isolation
1. Authenticate Device A and B as Couple 1.
2. Generate an invitation code for Couple 2 on a third simulator/device.
3. From Device A, attempt to access Couple 2's session or private documents.
4. **Verify:**
   - Firestore security rules deny the query with `Missing or insufficient permissions`.
   - App displays a polite notice and returns to Home safely.

---

### TEST H — All Ten Games Validation
Execute a complete match across two devices for each of the ten games:
1. **Who Knows Whom Better?**: 5 rounds of simultaneous double-blind questions.
2. **This or That**: 10 rapid preference rounds with affinity percentage.
3. **Tic-Tac-Toe**: Turn alternation, line detection, and draw conditions.
4. **Rock Paper Scissors**: Secret hand selection, simultaneous reveal, best-of-3 scoring.
5. **Truth or Dare**: Category selection, prompt randomization, skip counter, completion handshake.
6. **Couple Trivia**: Timed multiple-choice questions, speed scoring bonus.
7. **Draw & Guess**: Coordinate streaming, color/brush controls, guess evaluation.
8. **Connect Four**: Alternating disc drops, physics bounce, 4-in-a-row detection.
9. **Memory Match**: Synchronized card deck, flip transitions, pair removal.
10. **Word Guess**: 6 attempts, collaborative letter feedback (green/yellow/gray).
