# TOGETHERLY — COMPLETE NOTIFICATIONS & ENGAGEMENT ARCHITECTURE
**Document Version:** 1.0.0  
**Project ID:** `togetherly-17397`  
**Package Name:** `com.togetherly.couples`  
**Plan Tier:** Firebase Spark ($0.00 / Zero Billing Required)  
**Status:** FULLY IMPLEMENTED & VERIFIED  

---

## EXECUTIVE SUMMARY

Togetherly's notification and romantic engagement engine delivers an intimate, playful, and responsive shared experience for couples while operating strictly within the zero-cost **Firebase Spark Plan**.

The system is structured across three clearly separated, reliable notification mechanisms:
1. **Real-Time In-App Notifications:** Driven by live Firestore `onSnapshot` subscriptions on the `/notifications` collection for instant game invitations, partner moves, turn alerts, and pairing connections when the app is active.
2. **Local Scheduled Notifications:** Powered by `expo-notifications` and native Android Notification Channels (`couple-activity`, `games`, `romantic-reminders`) for recurring love reminders, daily challenge notifications, and quiet hours enforcement directly on the client.
3. **FCM Push Device Token Registration:** Spark-compatible push architecture. The device securely registers its Expo / FCM push token to `/users/{uid}/fcmTokens` without embedding privileged Google Cloud service account keys or requesting billing. Remote background delivery is formally classified in diagnostics as `NOT CONFIGURED` (Spark Free Tier) to avoid faking remote delivery.

---

## 1. THREE-TIER NOTIFICATION ARCHITECTURE

```
                                      +---------------------------------------------+
                                      |            TOGETHERLY USER DEVICE           |
                                      +---------------------------------------------+
                                                             |
            +------------------------------------------------+-----------------------------------------------+
            |                                                |                                               |
            v                                                v                                               v
+-----------------------+                        +-----------------------+                       +-----------------------+
|        TIER 1         |                        |        TIER 2         |                       |        TIER 3         |
|   Real-Time In-App    |                        |   Local Scheduled     |                       |   Spark FCM Device    |
|     (Firestore)       |                        | (expo-notifications)  |                       |   Token Registration  |
+-----------------------+                        +-----------------------+                       +-----------------------+
| * Firestore onSnapshot|                        | * Android Channels:   |                       | * Device push token   |
|   on `/notifications` |                        |   - couple-activity   |                       |   stored safely in    |
| * Unread query filter |                        |   - games             |                       |   `/users/{uid}`      |
| * In-memory dedup Set |                        |   - romantic-reminders|                       | * No service keys     |
| * Floating top banner |                        | * 130 curated notes   |                       |   embedded in client  |
| * Immediate tap route |                        | * Quiet hours engine  |                       | * Remote push status: |
|   to active session   |                        | * Frequency schedule  |                       |   `NOT CONFIGURED`    |
+-----------------------+                        +-----------------------+                       +-----------------------+
```

---

## 2. CURATED NOTIFICATION LIBRARY (130 HANDCRAFTED TEMPLATES)

The notification catalogue (`src/constants/notificationsCatalogue.ts`) contains **130 unique, romantic, cheeky, and engagement templates** across 8 distinct categories. Repetitive templates, generic filler, and coercive/invasive prompts were strictly eliminated.

| Category | Template Count | Default State | Intimacy & Tone | Lock-Screen Discreet Fallback |
| :--- | :---: | :---: | :--- | :--- |
| **Cute** | 16 | **Enabled** | Wholesome, sweet, comforting | *"You have a sweet message waiting on Togetherly."* |
| **Romantic** | 18 | **Enabled** | Deep affection, emotional connection | *"A special couple reminder is waiting for you."* |
| **Cheesy** | 16 | **Enabled** | Playful puns, adorable pick-up lines | *"Someone left you a little note on Togetherly."* |
| **Funny** | 16 | **Enabled** | Couple banter, lighthearted teasing | *"Check in on your little world."* |
| **Flirty** | 16 | **OPT-IN (Disabled)** | Spicy, romantic teasers for adult couples | *"You have a private notification from your partner."* |
| **Playful Double-Meaning**| 16 | **OPT-IN (Disabled)** | Cheeky double-entendres, tasteful banter | *"Togetherly: You have an unread update."* |
| **Missing-You** | 16 | **Enabled** | Warm distance-closing thoughts | *"Your partner is thinking of you right now."* |
| **Game Invitations** | 16 | **Enabled** | Fun challenges & playful dares | *"Game time on Togetherly!"* |
| **TOTAL** | **130** | — | — | — |

### Token Interpolation & Discreet Mode
- **Dynamic Token `{partnerName}`:** Every template seamlessly substitutes `{partnerName}` with the actual partner display name (e.g., *"Thinking of Priya ❤️"*). If no partner is connected, it gracefully falls back to *"your partner"*.
- **Lock-Screen Privacy (Discreet Mode):** When `discreetPreviews` is enabled in settings, notification bodies on the lock screen are substituted with neutral text (e.g., *"You have a message on Togetherly"*) to protect intimate messages from being visible to colleagues, family, or friends.

---

## 3. QUIET HOURS & FREQUENCY SCHEDULING ENGINE

Implemented in `src/services/notifications/localScheduler.ts`:

### Quiet Hours Detection (`isWithinQuietHours`)
- **Default Schedule:** 10:00 PM (`22:00`) to 9:00 AM (`09:00`) device time.
- **Overnight Window Logic:** Handles time intervals spanning midnight accurately (`startMinutes > endMinutes`).
- **Next Eligible Time (`getNextEligibleTime`):** If a scheduled reminder falls within quiet hours, it automatically shifts forward to the end of quiet hours (`09:00`) with a 0–30 minute random jitter to prevent robotic burst notifications.

### Reminder Frequency Intervals
| Setting | Delivery Cadence | Scheduled Target Window |
| :--- | :--- | :--- |
| **Off** | 0 reminders | All pending scheduled reminders cancelled immediately |
| **Light** | Every 48 hours (2–3 days) | Next eligible morning or afternoon window |
| **Normal** (Default) | Every 24 hours (1 / day) | Staggered daytime hours (11:00 AM – 8:00 PM) |
| **Frequent** | Every 12 hours (2 / day) | Morning awake slot + evening intimacy slot |

---

## 4. NOTIFICATION EVENTS & GAME LIFECYCLE DISPATCH

All required couple and gameplay notification events are wired to both real-time Firestore synchronization and in-app banner presentation:

| Event ID | Name | Trigger Point | Notification Title | Notification Body | Deep Link Target |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **1** | Invitation Created | User generates 6-char pairing code in `pair.tsx` | *"Waiting for your person ❤️"* | *"Your invite is ready. Share it with your partner to start your little world together."* | `/(onboarding)/pair` |
| **2** | Partner Connected | Partner redeems invitation code in `coupleService.ts` | *"Your person is here! ❤️"* | *"The wait is over. Your little world is officially connected."* | `/(tabs)/home` |
| **3** | Waiting Reminder | Persistent card on Home Screen when invite is pending | *"Waiting for your person 💌"* | *"Share code ABC123 with your partner to start your shared world."* | `/(onboarding)/pair` |
| **4** | Partner Started Game | Host creates game session in `gameSessionService.ts` | *"Game Night! 🎮"* | *"{hostName} wants to play {gameTitle}! Are you ready?"* | `/game?gameId=...&sessionId=...` |
| **5** | Partner Joined | Partner enters active session in `gameSessionService.ts` | *"Partner joined! 💕"* | *"{partnerName} joined! Let's see who knows who best."* | `/game?gameId=...&sessionId=...` |
| **6** | Your Turn | Turn switches to current user in turn-based games | *"Your Turn! ⏳"* | *"It's your turn in {gameTitle}. Make your move!"* | `/game?gameId=...&sessionId=...` |
| **7** | Partner Answered | Partner submits double-blind secret answer | *"Partner answered! 💭"* | *"{partnerName} submitted their answer! Your turn to guess."* | `/game?gameId=...&sessionId=...` |
| **8** | Game Completed | Both players complete rounds or game finishes | *"Match Finished! 🎉"* | *"Your match in {gameTitle} has finished. Check the results!"* | `/game?gameId=...&sessionId=...` |
| **9** | Rematch Requested | Player taps rematch in `gameSessionService.ts` | *"Rematch requested! 🔥"* | *"{partnerName} wants a rematch in {gameTitle}! Ready?"* | `/game?gameId=...&sessionId=...` |

---

## 5. DEDICATED NOTIFICATION SETTINGS UI

A full-featured, branded settings screen has been added at `src/app/settings/notifications.tsx` and linked from Profile (`src/app/(tabs)/profile.tsx`):

1. **Master Toggle:** Switch all notifications on/off with single tap.
2. **Category Toggles:**
   - Important Couple Activity (pairing, connection)
   - Game Invitations & Turns
   - Daily Couple Challenges
   - Couple Milestones & XP Progression
   - Romantic Reminders
   - Cheesy Love Notes
3. **Opt-In Intimate Toggles (Strictly Disabled by Default):**
   - **Flirty Notes:** Tagged with `OPT-IN` badge.
   - **Playful Double-Meaning:** Tagged with `CHEEKY` badge.
4. **Frequency Selector:** Segmented 4-way grid (Off, Light, Normal, Frequent).
5. **Quiet Hours Customizer:** Toggle, quiet start time (`21:00`, `22:00`, `23:00`), quiet end time (`07:00`, `08:00`, `09:00`).
6. **Lock-Screen Privacy:** Discreet notification previews toggle.
7. **Delivery Pipeline Status Card:** Live transparency report detailing that In-App and Local Channels are active, while FCM remote server push is Spark Free-Tier compliant.
8. **Live Test Button:** "Test Sample Romantic Reminder" triggers an immediate formatted notification preview so testers can verify how love notes look on their device.

---

## 6. SPARK COMPLIANCE & ZERO-BILLING GUARANTEE

1. **$0.00 Cost Invariant:** No Cloud Functions, Cloud Tasks, or paid external APIs have been added. All scheduling logic runs client-side on Android via `expo-notifications`.
2. **Safe Token Storage:** Client tokens are saved to Firestore `/users/{uid}/fcmTokens` via atomic `arrayUnion`.
3. **No Embedded Secrets:** No private keys (`service-account.json` or FCM server keys) are present in the app binary or repository.
4. **No Simulated Partner Actions:** All partner actions originate from real user interactions over Firestore.
5. **Status Classification:** Remote server push is officially classified in app diagnostics as `NOT CONFIGURED`, providing full transparency to testers that remote push requires a backend server or Blaze upgrade.

---

## 7. AUTOMATED QUALITY GATES & VERIFICATION

### Jest Unit & Integration Test Suite (`npm test`)
```
Test Suites: 7 passed, 7 total
Tests:       93 passed, 93 total
Snapshots:   0 total
Time:        4.689 s
```
- `src/__tests__/unit/notifications.test.ts`: **18 passed** (Catalogue count >= 120, categories, opt-in filtering, token formatting, discreet previews, quiet hours, scheduling intervals, deduplication, deep links).
- `src/__tests__/unit/engagement.test.ts`: **18 passed**.
- `src/__tests__/unit/gameRules.test.ts`: **28 passed**.
- `src/__tests__/unit/pairingAndValidation.test.ts`: **11 passed**.
- `src/__tests__/integration/gameSessionService.test.ts`: **5 passed**.
- `src/__tests__/security/securityRules.test.ts`: **6 passed**.
- `src/__tests__/unit/sparkCompatibility.test.ts`: **7 passed**.

### TypeScript Static Typecheck (`npx tsc --noEmit`)
- **0 errors.** All types, parameters, overloads, and routing definitions typecheck cleanly.

### Code Style & Linter (`npx expo lint`)
- **0 errors, 0 warnings.**

### Dependency & Configuration Health (`npx expo-doctor`)
- **20/20 checks passed.** Configuration, plugins, Android channels, and SDK 58 package compatibility fully validated.
