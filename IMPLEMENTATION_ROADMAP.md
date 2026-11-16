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

### Phase 0: Project Foundation (Completed)
- [x] Initial project inspection & Git repository setup.
- [x] Technical architecture, database schema, project status documentation.
- [x] Expo SDK 58 application initialization.
- [x] Dependencies installation (`zustand`, `zod`, `@tanstack/react-query`, `firebase`, `lucide-react-native`, `react-native-svg`, `expo-haptics`).
- [x] Design token system (`src/constants/tokens.ts`) with theme switcher (light/dark/romantic).
- [x] TypeScript strict mode configuration and baseline tests.

### Phase 1: Functional Application Foundation (Completed)
- [x] 5-Tab Navigation layout (`(tabs)/home`, `games`, `our-world`, `activity`, `profile`).
- [x] Reusable UI component library (`AppButton`, `GameCard`, `Avatar`, `CoupleAvatar`, `Modal`, `Toast`, `Badge`).
- [x] Firebase Configuration with emulator & offline fallback mode.
- [x] Authentication Flow (`(auth)/login`, `(auth)/register`, `(auth)/forgot-password`).
- [x] Onboarding Profile Setup (`(onboarding)/profile-setup`, avatar selection).
- [x] Couple Pairing Flow (`(onboarding)/pair`, invite code generation, invite code redemption, native share).
- [x] Realtime couple presence and dashboard header.

### Phase 2: Multiplayer Engine (Completed)
- [x] Universal game session interface and state machine (`src/games/engine.ts`).
- [x] Real-time sync listener with automatic retry & exponential backoff.
- [x] Turn-based alternation validation.
- [x] Simultaneous submission & double-blind reveal mechanism.
- [x] Disconnect and abandonment timer handler.

### Phase 3: First Four Playable Games (Completed)
- [x] Game 1: **Who Knows Whom Better?** (Relationship Quiz, 7 question decks, simultaneous reveal).
- [x] Game 2: **This or That** (Preferences comparison, affinity % calculation).
- [x] Game 3: **Tic-Tac-Toe** (Realtime 3x3 grid, alternating turns, win/draw detection, rematch).
- [x] Game 4: **Rock Paper Scissors** (Best of 3, simultaneous hidden picks, reveal animation).

### Phase 4: Remaining Six Games (Completed)
- [x] Game 5: **Truth or Dare** (100+ curated prompts across Cute, Funny, Romantic, Deep, Adventurous, and optional age-gated mature decks).
- [x] Game 6: **Couple Trivia** (150 curated questions across 5 categories, timed quiz rounds, speed point calculation, partner reveal, match leaderboard).
- [x] Game 7: **Draw & Guess** (Structured SVG vector stroke sync, 60 curated romantic prompts, color/brush picker, undo/clear, live guess validation, cooperative scoring).
- [x] Game 8: **Connect Four** (7x6 column drop physics/logic, 4-in-a-row detection in horizontal, vertical, and both diagonals, full-board draw detection).
- [x] Game 9: **Memory Match** (16 cards with 8 couple-themed pairs, deterministic seed shuffle, alternating turns with bonus turn on match, pair tracking).
- [x] Game 10: **Word Guess** (5-letter couple word puzzles with Wordle-standard letter evaluation, 6 collaborative attempts, on-screen keyboard, romantic hints).

### Phase 5: Engagement & Retention Engine (Completed)
- [x] **Daily Challenge Engine:** Server-controlled daily challenges with deterministic UTC date mapping and 104 reusable definitions across 6 categories; single claim reward enforcement.
- [x] **Shared Couple XP & Progression Curve:** Server-authoritative leveling formula `250*(level-1) + 50*(level-1)^2`, level progression bar, 10 couple level titles, immutable XP transaction audit log.
- [x] **Couple Achievement System:** 18 curated couple achievements across 5 categories (First Steps, Game Mastery, Consistency, Exploration, Special) with 4 tiers (Bronze, Silver, Gold, Platinum).
- [x] **Daily & Weekly Streaks:** UTC calendar boundary evaluation, milestone rewards (3, 7, 14, 30 days), non-punitive design preserving longest streak on missed days.
- [x] **Activity History Feed:** Paginated timeline with filter tabs (All, Turns Waiting, Games, Milestones), relative timestamps, and one-tap game turn resumption.
- [x] **Our World Screen:** Hydrated achievement gallery with category filtering, milestone statistics, and interactive achievement detail modal.
- [x] **Granular Notification Preferences:** In-app switches for turn alerts, daily challenges, achievements, and streak reminders; multi-cast FCM push trigger in Cloud Functions.
- [x] **Deep Linking Architecture:** `togetherly://` scheme supporting pairing codes, game sessions, daily challenges, achievements, and activity navigation.

### Phase 6: Monetisation Architecture (Next Up)
- [ ] Google Play Billing integration / RevenueCat wrapper.
- [ ] Togetherly Plus subscription tier (Monthly & Annual).
- [ ] Freemium gatekeeper service (3 free games vs 10 plus games; free vs premium decks).
- [ ] Google Mobile Ads (AdMob) SDK configuration (interstitial ads with cooldown, rewarded ads for hints).

### Phase 7: Testing, Hardening & Security
- [ ] End-to-end device testing with two active clients.
- [ ] Firebase Security Rules unit verification.
- [ ] Latency & offline reconnect resilience testing.

### Phase 8: Store Deployment
- [ ] Google Play Console store assets, icon sets, screenshots.
- [ ] Release AAB bundling & signing.
- [ ] Play Store review submission.
