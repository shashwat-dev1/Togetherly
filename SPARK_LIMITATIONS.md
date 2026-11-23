# TOGETHERLY — FIREBASE SPARK ARCHITECTURAL LIMITATIONS & QUOTA BUDGET

**Project:** Togetherly (`togetherly-17397`, Mumbai `asia-south1`)  
**Pricing Tier:** Firebase Spark Free Plan ($0.00 / month forever)  
**Target Group:** 5–6 Couples (10–15 Users)  

---

## 1. Non-Negotiable Spark Plan Constraints

1. **Zero Billing:** Cloud Billing is disabled; no credit card is associated with the project.
2. **Zero Cloud Functions:** Server-side Node.js Cloud Functions require the Blaze pay-as-you-go plan and are strictly excluded from this architecture.
3. **Client-Driven Business Logic:** All game transitions, pairing validations, and XP progressions execute client-side in TypeScript, constrained by Firestore Security Rules.
4. **No Third-Party Paid Infrastructure:** No Cloud Run, Supabase, Vercel, Render, or paid database servers.

---

## 2. Spark Quota Allocation & Pilot Consumption Model

### 2.1 Daily Spark Limits (Asia-South1)
- **Document Reads:** 50,000 / day
- **Document Writes:** 20,000 / day
- **Document Deletes:** 20,000 / day
- **Simultaneous Connections:** 100 concurrent connections
- **Cloud Storage:** 5 GB total (Togetherly stores zero heavy binaries; only Firestore JSON is used)
- **Network Egress:** 10 GB / month

### 2.2 Expected Consumption for 6 Couples (12 Active Users)
Assuming each couple plays 5 game matches per day, completes 1 daily challenge, and opens the app 4 times daily:

| Operation | Action Details | Writes / Day | Reads / Day |
| :--- | :--- | :---: | :---: |
| **App Launches** | Restore user session + couple profile (12 users × 4 launches) | 12 | 96 |
| **Active Session Polls** | Home screen real-time listener (12 users × 4 launches) | 0 | 48 |
| **Match Sessions** | 6 couples × 5 matches = 30 matches | 30 | 60 |
| **Turn Actions** | 30 matches × ~10 turns average | 300 | 600 |
| **Draw & Guess Strokes** | 6 matches × ~15 batched strokes per match | 90 | 180 |
| **Game Completion** | Scores + Activity item + XP transaction (30 matches × 3 writes) | 90 | 90 |
| **Daily Challenges** | 6 couples × 1 challenge progress update | 6 | 12 |
| **Feedback Reports** | ~3 bug reports / day | 3 | 3 |
| **Daily Total** | — | **~531 writes / day** | **~1,089 reads / day** |
| **Spark Quota** | — | **20,000 / day** | **50,000 / day** |
| **Quota Consumption** | — | **2.65%** | **2.18%** |

**Conclusion:** 6 couples consume less than **3%** of the daily free limits, providing a comfortable 30x safety margin before any quota throttle can occur.

---

## 3. Architectural Mitigations for Spark Constraints

### 3.1 Draw & Guess Coordinate Throttling
- **Risk:** Streaming raw `(x, y)` touch points directly to Firestore on every touch movement would produce 60 writes per second, burning through the 20,000 daily write quota in minutes.
- **Spark Mitigation:** Touch coordinates accumulate locally in an SVG polyline string (`activePoints`). A network write to Firestore occurs **only when the player lifts their finger** (`handleTouchEnd`), committing exactly 1 stroke object.

### 3.2 Double-Blind Answer Privacy
- **Risk:** Turn-based games where players guess secretly (e.g. *Who Knows Whom*, *Rock Paper Scissors*) would normally require a Cloud Function to hold answers in memory until both commit.
- **Spark Mitigation:** Implemented a subcollection `/gameSessions/{id}/privateAnswers/{uid_round}` governed by a Firestore Security Rule. The rule forbids the partner from reading the caller's answer unless a document exists proving the partner has already submitted their own answer for that round.

### 3.3 Duplicate XP Protection
- **Risk:** Without a centralized server, a client retry could accidentally award duplicate XP for the same match.
- **Spark Mitigation:** XP transactions derive a deterministic document ID: `tx_${source}_${referenceId}` (e.g. `tx_game_completion_sess_1732345`). Before applying an award, the client checks if that document already exists; if present, the transaction is skipped.

### 3.4 Push Notifications Without Cloud Functions
- **Constraint:** FCM background push triggers typically run on server webhooks.
- **Spark Adaptation:** Notification payloads are stored in Firestore at `/notifications/{id}`. When the recipient opens the app or while the app is active, client-side listeners deliver in-app alert cards and badges. For terminating notifications without paid cloud infrastructure, testers in the closed pilot are notified via WhatsApp or direct communication.

---

## 4. Quota Exceeded Behavior & Graceful Degradation

If the 50,000 daily read limit or 20,000 daily write limit is ever reached:
1. Firestore throws a `RESOURCE_EXHAUSTED` error.
2. The Togetherly network handler catches this error and surfaces a graceful modal:
   *"Togetherly Free Pilot Limit Reached: Today's community quota has been temporarily reached. Quotas reset automatically at midnight PST (1:30 PM IST). Thank you for testing!"*
3. The app does NOT crash, corrupt local data, or fall back to fake simulation.
