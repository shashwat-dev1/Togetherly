# Togetherly — Technical Architecture Specification

## 1. System Overview

Togetherly is architected as an Android-first, cross-platform mobile client powered by Firebase backend services. It is designed around private 2-player state synchronization, strict server-side validation for game results and entitlements, and an extensible modular game engine.

```
+-------------------------------------------------------------------------------+
|                               TOGETHERLY CLIENT                               |
|                                                                               |
|  +--------------------+  +---------------------+  +------------------------+  |
|  |    Expo Router     |  |    Design Tokens    |  |    Modular Game UI     |  |
|  |  (5 Tabs + Auth)   |  |   & UI Components   |  | (10 Playable Engines)  |  |
|  +--------------------+  +---------------------+  +------------------------+  |
|            |                        |                         |               |
|  +--------------------+  +---------------------+  +------------------------+  |
|  |   Zustand Stores   |  |   TanStack Query    |  |    Game State Hook     |  |
|  |  (Auth, Pair, XP)  |  |  (Caches & Queries) |  |   (Sync & Lifecycle)   |  |
|  +--------------------+  +---------------------+  +------------------------+  |
|                                     |                                         |
+-------------------------------------|-----------------------------------------+
                                      |
                     [TLS / HTTPS / Firestore Protocol]
                                      |
+-------------------------------------v-----------------------------------------+
|                              FIREBASE BACKEND                                 |
|                                                                               |
|  +--------------------+  +---------------------+  +------------------------+  |
|  |   Firebase Auth    |  |   Cloud Firestore   |  |    Cloud Functions     |  |
|  |  (Email, Google)   |  |   (Data Storage)    |  |   (Server Authority)   |  |
|  +--------------------+  +---------------------+  +------------------------+  |
|  |   Firebase Storage |  |   Firebase FCM      |  |   Firebase App Check   |  |
|  |  (Avatars, Assets) |  | (Push Notifications)|  |   (Integrity & Anti-Bot)| |
|  +--------------------+  +---------------------+  +------------------------+  |
+-------------------------------------------------------------------------------+
```

---

## 2. Client Architecture

### 2.1 Directory Structure
```
c:\Projects\LDR\
├── assets/                  # Icons, illustrations, sound assets, fonts
├── functions/               # Firebase Cloud Functions (TypeScript)
├── src/
│   ├── app/                 # Expo Router routes
│   │   ├── (auth)/          # Authentication flow (sign-in, register, forgot-password)
│   │   ├── (onboarding)/    # Profile setup, avatar picker, partner invite
│   │   ├── (tabs)/          # 5 Core Bottom Tabs
│   │   │   ├── home/        # Dashboard, couple status, daily challenge, continue play
│   │   │   ├── games/       # Browse, search, filter, game launch
│   │   │   ├── our-world/   # Shared couple profile, milestones, memory lane
│   │   │   ├── activity/    # Pending moves, game invites, match history
│   │   │   └── profile/     # Settings, pairing manager, subscription, privacy
│   │   ├── game/            # Active game session screen
│   │   └── _layout.tsx      # Root provider layout (Theme, Auth, QueryClient)
│   ├── components/          # Reusable UI component library
│   │   ├── common/          # AppButton, AppTextInput, Card, Badge, Modal, Toast
│   │   ├── couple/          # Avatar, CoupleAvatar, StreakCounter, XPBar
│   │   ├── games/           # GameCard, Scoreboard, CountdownTimer, GameResultCard
│   │   └── layout/          # ScreenHeader, BottomSheet, SafeContainer
│   ├── constants/           # Design tokens, theme colors, typography, spacing
│   ├── context/             # React Contexts (AuthContext, ThemeContext)
│   ├── games/               # Modular Game Registry and game engines
│   │   ├── registry.ts      # Game metadata, categories, rules
│   │   ├── engine.ts        # Common session lifecycle and state machine
│   │   ├── who-knows-whom/  # Relationship Quiz engine
│   │   ├── this-or-that/    # Preference engine
│   │   ├── tic-tac-toe/     # Realtime grid engine
│   │   ├── rock-paper-scissors/ # Simultaneous submission engine
│   │   └── ...              # Other 6 games
│   ├── hooks/               # Custom hooks (useGameSession, useCouple, useAuth)
│   ├── services/            # Firebase SDK bindings, Firestore queries, Auth
│   ├── stores/              # Zustand lightweight client state stores
│   ├── types/               # TypeScript interfaces, Zod schemas
│   └── utils/               # Date formatting, code generation, link handlers
```

---

## 3. Data Flow & Security Rules

### 3.1 Security Principles
1. **Zero-Trust Client Scoring:** Clients never directly increment `couples/{coupleId}.sharedXP` or declare themselves winners. Moves are committed to `gameSessions/{id}/actions` or validated via Cloud Functions.
2. **Atomic Pairing:** Couple invitations use unique cryptographic hashes, expire in 48 hours, and require a Firestore transaction to claim, ensuring neither user can be in two couples simultaneously.
3. **Private Isolation:** `couples/{coupleId}/privateData/{uid}` holds answers not yet revealed to the partner, preventing premature client inspection via Firestore rules.

---

## 4. Cross-Platform & Android-First Considerations
- Built strictly with Expo cross-platform primitives (`react-native-reanimated`, `react-native-gesture-handler`, `expo-font`, `react-native-svg`).
- Android hardware back button handled properly in modals and active game sessions.
- Android edge-to-edge system navigation bars and safe-area insets supported natively.
- No direct Android NDK/JNI dependencies that break iOS portability.

