# Togetherly — Changelog

All notable changes to the Togetherly platform will be documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

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
