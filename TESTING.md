# Togetherly — Testing Strategy & Verification Plan

## 1. Testing Philosophy
Every core component, game engine, and synchronization flow in Togetherly must be verified before being marked complete. As stated in Section 18 of the specification:
> "Never mark a feature complete based only on its UI rendering."

---

## 2. Test Suites & Categorization

### 2.1 Unit Tests (`src/__tests__/unit/`)
- **Game Logic:**
  - *Who Knows Whom Better:* Scoring matrices, question evaluation.
  - *Tic-Tac-Toe:* Row/column/diagonal win detection, full-board draw detection.
  - *Rock Paper Scissors:* Tie, Rock > Scissors, Scissors > Paper, Paper > Rock, best-of-3 counter.
  - *This or That:* Affinity score calculation: `(matches / total) * 100`.
- **Validation Schemas:**
  - Zod schemas for user profile, invitation code, game actions.
- **Progression Math:**
  - XP thresholds per level, streak date delta calculations.

### 2.2 Integration Tests (`src/__tests__/integration/`)
- **Pairing Lifecycle:**
  - Code generation -> Code hashing -> Redeem invitation -> Couple document creation.
  - Expiration after 48 hours.
  - Prevention of self-pairing or multi-couple memberships.
- **Game Engine Synchronization:**
  - State transitions: `waiting` -> `ready` -> `active` -> `completed`.
  - Simultaneous submission: Answer A submitted, Answer B submitted -> reveal trigger.
  - Disconnect recovery: resuming an existing `sessionId` without creating a duplicate.

### 2.3 Security Rules Tests (`functions/__tests__/firestore-rules/`)
- Cloud Firestore emulator unit tests verifying that:
  - User cannot read/write another couple's session.
  - User cannot modify `sharedXP` directly without Cloud Functions.
  - User cannot reveal `privateData/{partnerUid}` before the server publishes the round result.

### 2.4 End-to-End Simulation (Two-Account Testing)
- Account A (Host) and Account B (Partner) run in isolated client environments.
- Verify full loop:
  1. Account A logs in & generates invitation code `TGT-789`.
  2. Account B logs in & redeems code `TGT-789`.
  3. Couple is created: both dashboards transition to `paired` state.
  4. Account A selects *Who Knows Whom Better?*.
  5. Account B sees real-time match invite in Activity tab.
  6. Both submit answers; scores are revealed.
  7. Shared XP increases for the couple.

