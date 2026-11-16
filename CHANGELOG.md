# Togetherly — Changelog

All notable changes to the Togetherly platform will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [0.3.0-alpha] - 2026-11-16
### Added
- **Six Additional Fully Playable Multiplayer Games (Phase 4):**
  1. **Truth or Dare (`src/games/truth-or-dare/`):**
     - 100+ curated prompts across Cute, Funny, Romantic, Deep, and Adventurous categories.
     - Turn-based selection, skip limit tracking, partner response logs, and optional age-gated mature content.
  2. **Couple Trivia (`src/games/couple-trivia/`):**
     - 150 curated multiple-choice trivia questions across 5 categories (Love & Cinema, Travel, Pop Culture, Food, Science).
     - 20-second per-round countdown timers, speed bonus multipliers, simultaneous answer submission, double-blind reveal, and match leaderboard.
  3. **Draw & Guess (`src/games/draw-and-guess/`):**
     - Interactive vector-based SVG drawing canvas (`Polyline` serialization).
     - Color palette, brush size selector, undo, clear, 60 curated romantic prompts, secret prompt masking for guesser, live guess feed, and cooperative scoring.
  4. **Connect Four (`src/games/connect-four/`):**
     - 7 columns x 6 rows board with gravity-based disc dropping physics and logic.
     - Alternating real-time turns, 4-in-a-row detection (horizontal, vertical, both diagonals), full-board draw detection, and winning line highlight.
  5. **Memory Match (`src/games/memory-match/`):**
     - 16-card grid with 8 couple-themed matching pairs.
     - Deterministic PRNG seed shuffling guaranteeing identical card layout across partner devices while preserving hidden card security.
     - Alternating turns, mismatch auto-reset delay, pair tracking, and bonus turn on successful match.
  6. **Word Guess (`src/games/word-guess/`):**
     - 5-letter romantic word guessing game with 50+ relationship words.
     - Wordle-standard letter evaluation (green correct, yellow present, gray absent), 6 cooperative attempts, on-screen keyboard, and romantic hint system.
- **Game Engine & Cloud Functions Extension:**
  - Integrated all 6 new games into `gameSessionService.ts` and `useGameSession.ts`.
  - Added server-side validation in Firebase Cloud Functions (`functions/src/index.ts`) for generic turn actions and `couple-trivia` scoring.
  - Configured `src/games/registry.ts` with all 10 games marked active and playable (`isImplemented: true`).
  - Wired all 10 games into the universal multiplayer runner screen (`src/app/game.tsx`).
- **Test Suite Expansion:**
  - Expanded unit test suite from 28 to 46 automated tests (`src/__tests__/unit/gameRules.test.ts`).
  - 100% pass rate across 4 test suites.

## [0.2.0-alpha] - 2026-11-16
### Added
- **Multi-Mode Firebase Runtime Engine:**
  - Distinct runtime modes: `'production'`, `'emulator'`, `'mock'`.
  - Visible development banner (`BackendConnectionBanner.tsx`) displaying current backend connection status.
  - Zero silent defaulting; comprehensive setup guides in `.env.example`.
- **Universal Multiplayer Game Session Engine (`src/services/firebase/gameSessionService.ts`):**
  - Session creation, joining, snapshot synchronization, and listener cleanup.
  - Turn alternation and membership authorization validation.
  - Double-blind secret submission architecture (`submitSimultaneousAnswer`): private answers remain hidden until both submit.
  - Server-controlled answer reveal, scoring, and win detection.
  - Automatic session reconnection and exponential backoff.
  - Idempotent action dispatching preventing duplicate moves.
- **Firebase Security Architecture (`firestore.rules` & Cloud Functions):**
  - Strict security rules with default deny.
  - Private answer protection preventing partner reads prior to reveal.
  - Anti-tampering restrictions blocking client edits to `scores`, `winnerId`, and `xpAwarded`.
  - TypeScript Firebase Cloud Functions (`functions/src/index.ts`) validating actions, double-blind reveals, and atomic XP transactions.
- **Four Fully Playable Multiplayer Games:**
  1. *Who Knows Whom Better?* (7 curated decks, simultaneous guess vs truth submission, reveal, affinity scoring).
  2. *This or That* (Curated preference cards, independent picks, affinity % calculation).
  3. *Tic-Tac-Toe* (Real-time alternating turns with custom Hearts & Stars, win/draw detection, rematch).
  4. *Rock Paper Scissors* (Simultaneous hidden weapons, animated reveal, best-of-three match progression).
- **Automated Test Suite Expansion:**
  - Added integration tests (`gameSessionService.test.ts`) covering full session lifecycle.
  - Added security tests (`securityRules.test.ts`) covering unauthorized access denial and idempotency.
  - 28 total passing tests with 100% pass rate.

## [0.1.0-alpha] - 2026-11-16
### Added
- Initialized Expo SDK 58 project with TypeScript strict mode and Expo Router.
- Designed centralized Design Token system with Soft Lavender, Coral, and Cream.
- Initialized core component library architecture (`AppButton`, `GameCard`, `CoupleAvatar`, `Modal`, `EmptyState`).
- Built 5-Tab Navigation (`home`, `games`, `our-world`, `activity`, `profile`).
- Created authentication and couple pairing flows.
