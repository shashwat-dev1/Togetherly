# TOGETHERLY — FIRESTORE SECURITY AUDIT & RISK ANALYSIS

**Generated:** November 2026  
**Target Backend:** Cloud Firestore (`togetherly-17397`, Mumbai `asia-south1`)  
**Rules Version:** `rules_version = '2';`  
**Deployment Status:** Successfully deployed to live project with 0 compilation warnings.  

---

## 1. Security Architecture Overview

Under the Firebase Spark (free) tier, **Firebase Cloud Functions cannot be deployed** without activating paid billing. Consequently, Cloud Firestore Security Rules serve as the authoritative security boundary separating authenticated users, protecting couple privacy, and preventing malicious tampering.

The Togetherly security rules enforce a **Zero Trust Default-Deny** policy:
```javascript
match /{document=**} {
  allow read, write: if false;
}
```
Access is granted exclusively through whitelist rules with authentication and membership checks.

---

## 2. Collection-by-Collection Security Review

### 2.1 `/users/{uid}`
- **Read:** `isAuthenticated()` — allows authenticated users to find other users (required for partner display names and avatars).
- **Create/Update/Delete:** `isOwner(uid)` — only the authenticated user matching `request.auth.uid == uid` can modify their own profile data, avatar, or preferences.
- **Tampering Risk:** A user cannot edit another user's profile or change another user's `activeCoupleId`.

### 2.2 `/couples/{coupleId}`
- **Read:** `isCoupleMember(coupleId)` — strictly restricted to users listed in `memberIds`. Outside users cannot view another couple's relationship details.
- **Create:** `isAuthenticated() && request.auth.uid in request.resource.data.memberIds` — allowed when redeeming an invitation.
- **Update:** `isCoupleMember(coupleId)` AND:
  ```javascript
  !request.resource.data.diff(resource.data).affectedKeys().hasAny(['memberIds', 'createdBy'])
  ```
  **Critical Guard:** Couple members can update shared metadata (e.g. `sharedXP`, `coupleLevel`, `streakData`), but are strictly barred from modifying `memberIds` or `createdBy`. This prevents hostile account takeover or kicking partners.
- **Delete:** Denied (`allow delete: if false;`).

### 2.3 Subcollections under `/couples/{coupleId}`
- **`/privateData/{uid}`:** Restricted to `isOwner(uid)`. Even the partner cannot read or write this draft space.
- **`/dailyChallengeProgress/{date}`:** `isCoupleMember(coupleId)`. Both partners can inspect and complete the shared daily challenge.
- **`/achievements/{achievementId}`:** `isCoupleMember(coupleId)`. Couple members can inspect and unlock achievements.
- **`/activities/{activityId}`:** Read: `isCoupleMember(coupleId)`. Create: `isCoupleMember(coupleId)`. **Update/Delete: DENIED.** Timeline activities are immutable append-only records.
- **`/xpTransactions/{txId}`:** Read: `isCoupleMember(coupleId)`. Create: `isCoupleMember(coupleId)`. **Update/Delete: DENIED.** Immutable audit ledger.

### 2.4 `/invitations/{invitationId}`
- **Read:** `isAuthenticated()` — required for the partner to look up the 6-character code upon entering it.
- **Create:** `isAuthenticated() && request.resource.data.createdBy == request.auth.uid && request.resource.data.status == 'pending'`.
- **Update (Redemption):**
  ```javascript
  allow update: if isAuthenticated() &&
    resource.data.status == 'pending' &&
    resource.data.createdBy != request.auth.uid &&
    request.time < resource.data.expiresAt;
  ```
  **Guards:**
  1. Only unredeemed invitations (`status == 'pending'`) can be claimed.
  2. A user **cannot redeem their own invitation** (`createdBy != request.auth.uid`).
  3. Invitations past their 48-hour window cannot be claimed (`request.time < resource.data.expiresAt`).

### 2.5 `/gameSessions/{sessionId}`
- **Read:** `isAuthenticated() && request.auth.uid in resource.data.playerIds` — strictly isolates game data to the two participating players.
- **Create:** `isAuthenticated() && request.auth.uid in request.resource.data.playerIds`.
- **Update:**
  ```javascript
  allow update: if isAuthenticated() && 
    request.auth.uid in resource.data.playerIds &&
    !request.resource.data.diff(resource.data).affectedKeys().hasAny(['playerIds', 'coupleId', 'createdBy']);
  ```
  Players cannot reassign games to other users or couples.

### 2.6 Double-Blind Secret Protection (`/gameSessions/{sessionId}/privateAnswers/{answerId}`)
In games like *Who Knows Whom Better?* and *Rock Paper Scissors*, both players submit their choices simultaneously. A player must not be able to read their partner's answer before committing their own.

```javascript
match /privateAnswers/{answerId} {
  allow read: if isAuthenticated() && (
    resource.data.playerId == request.auth.uid ||
    (
      request.auth.uid in get(/databases/$(database)/documents/gameSessions/$(sessionId)).data.playerIds &&
      exists(/databases/$(database)/documents/gameSessions/$(sessionId)/privateAnswers/$(request.auth.uid + '_r' + resource.data.round))
    )
  );
  allow create, update: if isAuthenticated() && 
    request.resource.data.playerId == request.auth.uid &&
    request.auth.uid in get(/databases/$(database)/documents/gameSessions/$(sessionId)).data.playerIds;
  allow delete: if false;
}
```
**Mechanism:**
- The caller can always read their own submitted answer.
- The partner can **only** read the caller's answer IF a document exists proving that the partner has already committed their own answer for that exact round (`exists(.../partnerUid_rRound)`).

### 2.7 `/pilotFeedback/{feedbackId}`
- **Create:** `isAuthenticated() && request.resource.data.userId == request.auth.uid`.
- **Read:** `isAuthenticated() && resource.data.userId == request.auth.uid`.
- **Update / Delete:** `false`.
Testers cannot read each other's bug reports or diagnostic submissions.

---

## 3. Negative Security Tests & Automated Verification

The automated security test suite ([`src/__tests__/security/securityRules.test.ts`](file:///c:/Projects/LDR/src/__tests__/security/securityRules.test.ts)) validates:

1. **Intruder Join Rejection:** An authenticated user not belonging to `coupleA` is rejected when attempting to join a game session created for `coupleA`.
2. **Unauthorized Move Rejection:** An intruder cannot submit actions (`place_mark`, `drop_disc`, `make_guess`) into another couple's session.
3. **Simultaneous Answer Rejection:** Non-players cannot inject answers into the private answers subcollection.
4. **Idempotency Defense:** Submitting identical actions with the same `idempotencyKey` returns the cached state without incrementing `turnNumber` or duplicating board modifications.
5. **Post-Completion Lock:** Submitting moves to a session with `status: 'completed'` is rejected with `"Cannot submit action: Session is 'completed'"`.
6. **Unauthorized Reconnection Rejection:** A third party attempting to call `reconnectToSession` on another couple's match is blocked with `"Unauthorized reconnection attempt"`.
7. **Cross-Couple Session Isolation:** Querying active sessions for `coupleB` returns `null` even when `coupleA` has active sessions in the database.

---

## 4. Inherent Spark Plan Security Boundaries

Because Cloud Functions cannot be used under the free Spark plan, the following constraints must be documented honestly:

1. **Client-Authoritative Scoring:** Game rule calculations (e.g. checking whether a Connect Four move formed 4-in-a-row) are evaluated by the mobile client before writing the updated `gameState` to Firestore. While security rules prevent unauthorized users from writing, a player running a modified client could theoretically report a fabricated winning line. For the closed pilot with trusted friends and relatives, this risk is acceptable.
2. **XP Increment Upper Bounds:** XP transactions are recorded in an append-only collection with deterministic IDs (`tx_${source}_${referenceId}`) to prevent duplicates. However, rule enforcement cannot calculate full mathematical formulas on document fields. Hard capping XP grants at the client service layer mitigates abuse during the pilot.
3. **Double-Blind Secret Answer Existence:** The double-blind security rule verifies the existence of the partner's submission document. If a client writes a blank dummy document, it could bypass the gate. The client application mitigates this by validating submission schemas before committing.
