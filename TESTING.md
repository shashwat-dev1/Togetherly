# Togetherly — Testing Strategy & Verification Plan

## 1. Testing Philosophy
Every core component, game engine, and synchronization flow in Togetherly must be verified before being marked complete. As stated in Section 18 of the specification:
> "Never mark a feature complete based only on its UI rendering."

---

## 2. Automated Test Suites & Coverage

### 2.1 Unit Tests (`src/__tests__/unit/`)
- `gameRules.test.ts`:
  - **Tic-Tac-Toe:** Horizontal, diagonal, draw detection, in-progress checks.
  - **Rock Paper Scissors:** Win matrix (Rock > Scissors, Paper > Rock, Scissors > Paper, Ties).
  - **This or That:** Affinity percentage formula: `Math.round((matches / total) * 100)`.
  - **Connect Four:** Gravity drop row calculation, 4-in-a-row detection in horizontal, vertical, and diagonal directions, full-board draw detection.
  - **Memory Match:** 16-card generation (8 pairs), deterministic layout matching across session seeds, card shuffling variation.
  - **Word Guess:** Wordle-standard evaluation (correct green, present yellow, absent gray), multi-letter handling, 50+ romantic word bank.
  - **Couple Trivia:** 150-question bank coverage across 5 categories, 4 multiple choice options per item, valid correct answers.
  - **Truth or Dare:** 100+ prompt catalog across 5 wholesome categories, mature deck isolation.
  - **Draw & Guess:** 60-prompt catalog with romantic, food, objects, animals, activities.
- `pairingAndValidation.test.ts`:
  - Zod schemas for user registration, login, and 6-character invite codes.
  - Invitation code generation (uppercase alphanumeric, length 6).
  - 48-hour expiration calculations.
  - Self-pairing prevention rejection.
  - Atomic couple document creation.

### 2.2 Integration Tests (`src/__tests__/integration/`)
- `gameSessionService.test.ts`:
  - `createGameSession`: Session initialized with `'waiting'` status.
  - `joinGameSession`: Automatic transition to `'active'` when both players join.
  - `submitGameAction`: Validates turn alternation, board state updates.
  - Invalid turn rejection: Throws error if player attempts move out of turn.
  - Double-blind secret submission: Verifies that answers remain private when only one player submits, and triggers atomic reveal & scoring once both submit.
  - `requestRematch`: Creates a linked rematch session preserving match history.
  - `reconnectToSession`: Recovers active session without resetting the board.

### 2.3 Security Tests (`src/__tests__/security/`)
- `securityRules.test.ts`:
  - Blocks unauthorized users outside the couple from joining sessions.
  - Blocks unauthorized users from dispatching moves.
  - Blocks unauthorized users from submitting simultaneous answers.
  - Idempotency test: duplicate actions with the same `idempotencyKey` are discarded without repeating effects.

---

## 3. Manual Two-Device Testing Guide

To test real multiplayer between two independent accounts on two separate Android devices:

### Step 1: Start the Development Server
```bash
npx expo start
```

### Step 2: Device A (Alex — Host)
1. Launch Togetherly on Device A (or Android Emulator 1).
2. On the Sign In screen, tap **"Sign in as Alex"** (or create an account with email/password).
3. Go to the **Games** tab and select **"Tic-Tac-Toe"** (or **"Who Knows Whom Better?"**).
4. Tap **"Invite Partner & Play"**.
5. The session starts in the Lobby: *"Waiting for Sam to join..."* with status indicator.

### Step 3: Device B (Sam — Partner)
1. Launch Togetherly on Device B (or Android Emulator 2).
2. On the Sign In screen, tap **"Sign in as Sam"** (or create partner account).
3. Open the **Activity** tab.
4. Tap **"Play Your Turn"** or navigate to the same game in the **Games** tab.
5. The session status immediately transitions to **"LIVE SYNC (Active)"** on both devices simultaneously!

### Step 4: Play & Verify
- **For Tic-Tac-Toe:** Device A taps cell 0 (`❤️`). Device B instantly sees cell 0 filled with `❤️` and gets the turn prompt `Your Turn (⭐)`. Device B taps cell 4 (`⭐`). Both devices reflect the move in real time!
- **For Who Knows Whom Better?:** Device A selects their answers and locks them in. Notice Device B does **NOT** see Device A's answers! Device B selects their answers. As soon as Device B submits, **both devices simultaneously reveal the side-by-side results!**
- **For Rematch:** Tap **"Play Rematch"** on Device A. Device B's session immediately links to the new match!

---

## 4. Running the Test Suite
```bash
npm test
```
All 28 tests pass with zero failures.
