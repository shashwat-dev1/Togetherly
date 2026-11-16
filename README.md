# Togetherly — Two people. One little world.

An Android-first, private multiplayer gaming platform designed exclusively for couples to play, connect, and spend quality time together across any distance.

[![Git Remote](https://img.shields.io/badge/GitHub-Togetherly-purple?logo=github)](https://github.com/shashwat-dev1/Togetherly)
[![Expo SDK](https://img.shields.io/badge/Expo-SDK%2058-blue?logo=expo)](https://expo.dev)
[![React Native](https://img.shields.io/badge/React%20Native-0.88-61DAFB?logo=react)](https://reactnative.dev)
[![Firebase](https://img.shields.io/badge/Firebase-Spark%20(Free%20Plan)-orange?logo=firebase)](https://firebase.google.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict%20Mode-blue?logo=typescript)](https://www.typescriptlang.org)
[![Testing](https://img.shields.io/badge/Tests-72%20Passed%20(100%25)-brightgreen)]()

---

## 📖 Product Identity & Philosophy

Togetherly is **not** a dating app, a chat app, or relationship counselling software.  
It is a private, shared digital living room for two people.

- **Audience:** Long-distance couples, dating pairs, newlyweds, and partners living together.
- **Platform:** Android-first (iOS compatible via React Native & Expo Router).
- **Core Experience:** 10 curated multiplayer games, double-blind relationship reveals, server-controlled daily challenges, shared XP progression, and non-punitive streaks.

---

## 🎮 The 10 Multiplayer Games

| # | Game | Mode | Description |
|---|---|---|---|
| **1** | **Who Knows Whom Better?** | Simultaneous Reveal | Curated relationship questions answered independently and revealed simultaneously with match score. |
| **2** | **This or That** | Simultaneous Reveal | Rapid-fire couple preference quiz calculating compatibility percentage. |
| **3** | **Tic-Tac-Toe** | Turn-Based | Real-time 3x3 board with Hearts & Stars, turn alternation, and instant rematch. |
| **4** | **Rock Paper Scissors** | Simultaneous Reveal | Best-of-3 animated hand showdown with atomic double-blind reveal. |
| **5** | **Truth or Dare** | Turn-Based | 100+ curated prompts across Cute, Funny, Romantic, Deep, and Adventurous categories. |
| **6** | **Couple Trivia** | Timed Simultaneous | 150 trivia questions across 5 categories with timed rounds and speed points. |
| **7** | **Draw & Guess** | Real-Time Canvas | Vector SVG stroke synchronisation, 60 prompts, live guess chat, and cooperative scoring. |
| **8** | **Connect Four** | Turn-Based | 7x6 gravity drop board with horizontal, vertical, and diagonal win detection. |
| **9** | **Memory Match** | Turn-Based | 16-card grid with 8 couple pairs, deterministic seed shuffle, and bonus turn on match. |
| **10** | **Word Guess** | Cooperative | 5-letter relationship word puzzle with Wordle-standard letter evaluation and hints. |

---

## ⚙️ Technology Stack

- **Client:** React Native (0.88.1), Expo SDK 58, Expo Router, TypeScript (Strict Mode).
- **State & Validation:** Zustand, Zod schemas, TanStack Query.
- **Styling & UI:** Semantic design token palette (`src/constants/tokens.ts`), Lucide Icons, React Native SVG.
- **Backend:** Firebase Auth, Cloud Firestore (WebSockets real-time listeners), Firebase Spark Plan (100% Free / Zero Cloud Functions).
- **Security:** Strict Firestore rules, double-blind secret isolation, deterministic idempotency, and protected feedback.

---

## 🚀 Getting Started (Development)

### 1. Prerequisites
- Node.js (v18+ or v20+)
- npm or bun
- Android device or Android Studio Emulator

### 2. Installation
```bash
git clone https://github.com/shashwat-dev1/Togetherly.git
cd Togetherly
npm install
npm --prefix functions install
```

### 3. Environment Configuration
Copy the template and choose your runtime mode:
```bash
cp .env.example .env
```

| Mode | Configuration in `.env` | Use Case |
|---|---|---|
| **Production / Pilot** | `EXPO_PUBLIC_FIREBASE_MODE=production` + Live Firebase API keys | Closed pilot testing on physical Android devices. |
| **Emulator** | `EXPO_PUBLIC_FIREBASE_MODE=emulator` | Local development with Firebase Emulator Suite. |
| **In-Memory Mock** | `EXPO_PUBLIC_FIREBASE_MODE=mock` | Quick UI preview without backend dependencies. |

### 4. Running the Development Server
```bash
npx expo start
```
Press `a` in the terminal to open on an Android emulator or scan the QR code with Expo Go / custom dev client.

---

## 🧪 Testing & Quality Gates

Run the automated test suite and strict typechecks:

```bash
# Run 72 automated unit, integration, and Spark compatibility tests
npm test

# Run strict TypeScript check (0 errors)
npx tsc --noEmit

# Run Expo / React Compiler linter (0 errors, 0 warnings)
npx expo lint

# Deploy Firestore Security Rules & Indexes to Spark (100% Free)
npm run deploy:spark
```

---

## 📱 Generating an Android Pilot APK

For internal pilot distribution to 5–6 couples without Google Play:

```bash
# Install EAS CLI
npm install -g eas-cli

# Log in to your Expo account
eas login

# Build a standalone installable APK
eas build --profile pilot --platform android
```
The resulting `.apk` file can be downloaded from Expo and sideloaded directly onto any Android device. See [SPARK_DEPLOYMENT_GUIDE.md](file:///c:/Projects/LDR/SPARK_DEPLOYMENT_GUIDE.md) for complete instructions.

---

## 📚 Pilot Documentation Directory

- [SPARK_MIGRATION_AUDIT.md](file:///c:/Projects/LDR/SPARK_MIGRATION_AUDIT.md) — Comprehensive Cloud Function dependency audit & Spark migration map.
- [SPARK_COST_AUDIT.md](file:///c:/Projects/LDR/SPARK_COST_AUDIT.md) — $0.00 infrastructure cost analysis & quota verification.
- [SPARK_DEPLOYMENT_GUIDE.md](file:///c:/Projects/LDR/SPARK_DEPLOYMENT_GUIDE.md) — Step-by-step instructions for Firebase Spark rules deployment & APK build.
- [PILOT_READINESS_REPORT.md](file:///c:/Projects/LDR/PILOT_READINESS_REPORT.md) — 16-dimension pilot readiness assessment.
- [FIREBASE_CONFIGURATION_CHECK.md](file:///c:/Projects/LDR/FIREBASE_CONFIGURATION_CHECK.md) — Firebase configuration audit and Google Sign-In fingerprint guide.
- [REALTIME_TEST_PLAN.md](file:///c:/Projects/LDR/REALTIME_TEST_PLAN.md) — Cross-device real-time sync verification plan.
- [PILOT_TESTING_CHECKLIST.md](file:///c:/Projects/LDR/PILOT_TESTING_CHECKLIST.md) — Two-device physical testing scorecard.
- [DATABASE_SCHEMA.md](file:///c:/Projects/LDR/DATABASE_SCHEMA.md) — Complete Firestore document and collection models.

---

## 🛡️ Security & Privacy Notice

Togetherly enforces end-to-end relationship isolation:
- Couple data is accessible exclusively to the two paired members.
- Simultaneous answers remain strictly double-blind until both submit.
- Scores, XP, winners, and streaks are server-authoritative.
- Passwords, authentication tokens, private guesses, and PII are never logged.
