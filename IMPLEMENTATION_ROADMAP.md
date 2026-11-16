# Togetherly — Implementation Roadmap

## Overview of Development Phases

```
[Phase 0: Foundation] ──> [Phase 1: App & Pairing] ──> [Phase 2: Multiplayer Engine]
         │                                                        │
         v                                                        v
[Phase 5: Engagement] <── [Phase 4: 6 Games] <── [Phase 3: First 4 Playable Games]
         │
         v
[Phase 6: Monetisation] ──> [Phase 7: QA & Sec] ──> [Phase 8: Play Store Release]
```

---

## Detailed Step-by-Step Breakdown

### Phase 0: Project Foundation (Current)
- [x] Initial project inspection & Git repository setup.
- [x] Technical architecture, database schema, project status documentation.
- [x] Expo SDK 58 application initialization.
- [ ] Dependencies installation (`zustand`, `zod`, `@tanstack/react-query`, `firebase`, `lucide-react-native`, `react-native-svg`, `expo-haptics`).
- [ ] Design token system (`src/constants/tokens.ts`) with theme switcher (light/dark/romantic).
- [ ] TypeScript strict mode configuration and baseline tests.

### Phase 1: Functional Application Foundation
- [ ] 5-Tab Navigation layout (`(tabs)/home`, `games`, `our-world`, `activity`, `profile`).
- [ ] Reusable UI component library (`AppButton`, `GameCard`, `Avatar`, `CoupleAvatar`, `Modal`, `Toast`, `Badge`).
- [ ] Firebase Configuration with emulator & offline fallback mode.
- [ ] Authentication Flow (`(auth)/login`, `(auth)/register`, `(auth)/forgot-password`).
- [ ] Onboarding Profile Setup (`(onboarding)/profile-setup`, avatar selection).
- [ ] Couple Pairing Flow (`(onboarding)/pair`, invite code generation, invite code redemption, native share).
- [ ] Realtime couple presence and dashboard header.

### Phase 2: Multiplayer Engine
- [ ] Universal game session interface and state machine (`src/games/engine.ts`).
- [ ] Real-time sync listener with automatic retry & exponential backoff.
- [ ] Turn-based alternation validation.
- [ ] Simultaneous submission & double-blind reveal mechanism.
- [ ] Disconnect and abandonment timer handler.

### Phase 3: First Four Playable Games
- [ ] Game 1: **Who Knows Whom Better?** (Relationship Quiz, 7 question decks, simultaneous reveal).
- [ ] Game 2: **This or That** (Preferences comparison, affinity % calculation).
- [ ] Game 3: **Tic-Tac-Toe** (Realtime 3x3 grid, alternating turns, win/draw detection, rematch).
- [ ] Game 4: **Rock Paper Scissors** (Best of 3, simultaneous hidden picks, reveal animation).

### Phase 4: Remaining Six Games
- [ ] Game 5: **Truth or Dare** (Curated romantic/deep/spicy prompts, age gating).
- [ ] Game 6: **Couple Trivia** (Timed multiple choice, category selection, leaderboard).
- [ ] Game 7: **Draw & Guess** (SVG stroke-vector serialization, live draw sync, guess submit).
- [ ] Game 8: **Connect Four** (7x6 column drop physics/logic, 4-in-a-row detection).
- [ ] Game 9: **Memory Match** (Card grid flip, turn matching, pairs tracker).
- [ ] Game 10: **Word Guess** (Couples themed wordle/clue gameplay).

### Phase 5: Engagement & Shared World
- [ ] Daily Challenge system with server reset logic.
- [ ] Shared Couple XP and leveling system.
- [ ] Couple Achievements system (First Match, Perfect Match, 7-Day Streak).
- [ ] Push Notifications via FCM and Deep Link routing.

### Phase 6: Monetisation Architecture
- [ ] Google Play Billing integration / RevenueCat wrapper.
- [ ] Plus Plan entitlement propagation: 1 subscription unlocks Plus for both partners.
- [ ] Google AdMob integration (Rewarded ads for bonus games, interstitial post-match, zero ads for Plus).

### Phase 7: Quality Assurance & Security
- [ ] Firestore Security Rules unit test suite.
- [ ] End-to-end two-account match verification.
- [ ] Low-end Android memory and FPS profiling.

### Phase 8: Play Store Release
- [ ] App bundle signing (AAB).
- [ ] Google Play Store listing, Privacy Policy, Data Safety disclosure.

