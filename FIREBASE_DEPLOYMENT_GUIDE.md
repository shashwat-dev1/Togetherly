# Togetherly — Firebase Deployment Guide

**Target Environment:** Production Firebase Project `togetherly-17397`  
**Database Region:** Mumbai, India (`asia-south1`)  
**Package Identifier:** `com.togetherly.couples`  
**Document Version:** 1.0.0  

---

## 1. Overview

This guide provides exact, step-by-step instructions for deploying Cloud Firestore Security Rules, Firestore Composite Indexes, and Cloud Functions to the dedicated Firebase project `togetherly-17397`.

---

## 2. Prerequisites & Tools

Ensure the following tools are available on your development terminal:

1. **Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```
2. **Node.js**: Version 20+ LTS.
3. **Google Account**: Ensure you have Owner or Editor permissions on Firebase project `togetherly-17397`.

---

## 3. Plan Requirements & Cost Breakdown

| Component | Target File | Required Firebase Plan | Expected Pilot Cost (5–6 Couples) |
|---|---|---|---|
| **Firestore Security Rules** | `firestore.rules` | **Spark** (Free) or Blaze | **\$0.00** (Free) |
| **Firestore Indexes** | `firestore.indexes.json` | **Spark** (Free) or Blaze | **\$0.00** (Free) |
| **Cloud Functions** | `functions/src/index.ts` | **Blaze** (Pay-as-you-go) | **\$0.00** (Within Free Tier) |

> [!NOTE]
> **Free Tier Allowances on Blaze Plan:**
> - 2,000,000 Cloud Function invocations / month are 100% free.
> - 400,000 GB-seconds / month computation are 100% free.
> - 50,000 Firestore document reads / day are 100% free.
> - 20,000 Firestore document writes / day are 100% free.
> 
> For 5–6 couples testing over 15 days, total estimated resource consumption is less than 0.5% of the monthly free tier.

---

## 4. Step-by-Step Deployment Protocol

### Step 1: Authenticate with Firebase CLI
Authenticate using the Google account that manages `togetherly-17397`:
```bash
firebase login
```
*(If already logged in, you can verify your active account by running `firebase login:list`).*

---

### Step 2: Set the Active Project Target
Link the working directory to the target project using the preconfigured `.firebaserc`:
```bash
firebase use togetherly-17397
```
Output should confirm:
`Now using project togetherly-17397`

---

### Step 3: Deploy Firestore Security Rules & Indexes
Deploy the database access policies and composite query indexes:
```bash
firebase deploy --only firestore:rules,firestore:indexes
```

#### What this command deploys:
1. **`firestore.rules`**: Restricts document access so that:
   - Users can only read/write their own profile (`/users/{uid}`).
   - Couple members can only access their shared couple record (`/couples/{coupleId}`).
   - Double-blind secret submissions remain strictly inaccessible to the partner before server reveal.
   - Feedback submissions can only be created by authenticated testers.
2. **`firestore.indexes.json`**: Builds composite query indexes for:
   - `gameSessions`: `coupleId ASC, updatedAt DESC`
   - `gameSessions`: `coupleId ASC, status ASC, updatedAt DESC`
   - `invitations`: `code ASC, status ASC, expiresAt ASC`
   - `xpTransactions`: `coupleId ASC, createdAt DESC`

---

### Step 4: Compile TypeScript Cloud Functions
Before deploying functions, compile TypeScript to JavaScript:
```bash
npm --prefix functions run build
```
Verify that `tsc` exits with zero errors and outputs compiled code to `functions/lib/`.

---

### Step 5: Deploy Cloud Functions (Requires Blaze Plan)
Deploy the server-authoritative background functions:
```bash
firebase deploy --only functions
```

#### What this command deploys:
1. **`validateAndApplyAction`**: Validates player moves, checks turns, and scores matches authoritatively.
2. **`onPrivateAnswerWritten`**: Background Firestore trigger executing double-blind simultaneous reveals.
3. **`onNotificationCreated`**: Background trigger dispatching high-priority Android FCM push notifications.

> [!IMPORTANT]
> If your project is currently on the Spark (free) plan, this command will fail with `Billing must be enabled`.
> In that case:
> 1. Visit the [Firebase Console](https://console.firebase.google.com/project/togetherly-17397/usage/details).
> 2. Upgrade to the **Blaze plan** (set a budget alert at \$5.00 for safety).
> 3. Re-run `firebase deploy --only functions`.

---

## 5. Verification & Health Check

### 1. Verify Firestore Rules
- In the [Firebase Console](https://console.firebase.google.com/project/togetherly-17397/firestore/rules), verify that rules version `2` is active and shows the latest timestamp.
- Use the **Rules Playground** to simulate an unauthenticated read to `/couples/sample_id` $\rightarrow$ must return `Denied`.

### 2. Verify Firestore Indexes
- In the [Firebase Console](https://console.firebase.google.com/project/togetherly-17397/firestore/indexes), verify that indexes for `gameSessions`, `invitations`, and `xpTransactions` are marked `Enabled`.

### 3. Verify Cloud Functions
- In the [Firebase Console](https://console.firebase.google.com/project/togetherly-17397/functions), confirm all 3 functions are listed with green checkmarks.
- View Logs tab to ensure healthy cold start.

---

## 6. Rollback Procedures

### Rollback Firestore Security Rules
If a rule update causes unexpected client permission errors:
1. Open [Firebase Console $\rightarrow$ Firestore $\rightarrow$ Rules $\rightarrow$ Release History](https://console.firebase.google.com/project/togetherly-17397/firestore/rules).
2. Click the three dots next to the previous release and click **Roll back**.
3. Alternatively, git checkout the previous rules file and run:
   ```bash
   firebase deploy --only firestore:rules
   ```

### Rollback Cloud Functions
If a deployed function exhibits runtime exceptions:
1. Revert `functions/src/index.ts` to the previous stable commit.
2. Recompile and redeploy:
   ```bash
   npm --prefix functions run build
   firebase deploy --only functions
   ```
3. To delete a faulty function immediately:
   ```bash
   firebase functions:delete <functionName> --region us-central1
   ```
