# Togetherly — Firebase Spark Deployment Guide (100% Free Plan)

**Target Environment:** Firebase Project `togetherly-17397` (Mumbai, India / `asia-south1`)  
**Operating Tier:** Firebase Spark Plan (Free / Zero Billing / Zero Credit Card)  
**Package Identifier:** `com.togetherly.couples`  
**Distribution:** Standalone Android APK (EAS `pilot` profile)  
**Document Version:** 1.0.0  

---

## 1. Overview

This deployment guide covers the zero-cost deployment protocol for Togetherly on the **Firebase Spark (Free) Plan**.

**No Cloud Functions are deployed.**  
**No billing activation is required.**  
**No credit card is required.**  

The entire backend infrastructure consists of Cloud Firestore security rules, composite indexes, and Firebase Authentication running on the free tier.

---

## 2. Prerequisites

1. **Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```
2. **Node.js**: Version 20+ LTS.
3. **EAS CLI** (for building standalone APK):
   ```bash
   npm install -g eas-cli
   ```

---

## 3. Step-by-Step Deployment Protocol

### Step 1: Authenticate with Firebase CLI
```bash
firebase login
```
*(Log in using the Google account that manages `togetherly-17397`).*

---

### Step 2: Select the Target Firebase Project
```bash
firebase use togetherly-17397
```
Output should confirm:
`Now using project togetherly-17397`

---

### Step 3: Deploy Firestore Security Rules & Composite Indexes (100% Free)
Run the dedicated Spark deployment command:
```bash
npm run deploy:spark
```
*(Or manually: `firebase deploy --only firestore:rules,firestore:indexes`)*

#### What this command deploys:
1. **`firestore.rules`**:
   - Enforces user profile isolation by UID (`/users/{uid}`).
   - Enforces couple privacy: only the 2 paired partners can access `/couples/{coupleId}`.
   - Enforces the **Spark Double-Blind Secret Architecture**: Player B cannot read Player A's answer document until Player B's answer doc exists in Firestore.
   - Restricts `/pilotFeedback` to authenticated tester creation.
2. **`firestore.indexes.json`**:
   - Builds composite query indexes for `gameSessions`, `invitations`, and `xpTransactions`.

> [!NOTE]
> Deploying Firestore security rules and composite indexes is **100% free** and supported on the Spark plan without billing.

---

### Step 4: Build Standalone Pilot Android APK
Build the standalone APK for installation on the pilot testers' Android devices:
```bash
npm run build:pilot
# Or directly:
npx eas-cli build --profile pilot --platform android
```

#### What EAS Build does:
- Reads `eas.json` `pilot` profile (`buildType: apk`, `EXPO_PUBLIC_APP_ENV: pilot`, `EXPO_PUBLIC_FIREBASE_MODE: production`).
- Embeds native Android configuration from `google-services.json`.
- Compiles the application without any Cloud Functions dependency.
- Generates a direct `.apk` download URL upon completion.

---

### Step 5: Distribute and Test on Physical Android Devices
1. Download the generated `.apk` file from the EAS build summary link.
2. Transfer the APK to two physical Android phones (Device A and Device B).
3. Follow the procedures in [REALTIME_TEST_PLAN.md](file:///c:/Projects/LDR/REALTIME_TEST_PLAN.md).
4. Record test outcomes in [PILOT_TESTING_CHECKLIST.md](file:///c:/Projects/LDR/PILOT_TESTING_CHECKLIST.md).

---

## 4. Verification in Firebase Console

1. **Verify Security Rules**:
   - Go to [Firebase Console $\rightarrow$ Firestore Database $\rightarrow$ Rules](https://console.firebase.google.com/project/togetherly-17397/firestore/rules).
   - Confirm rules version `2` is active and contains the Spark double-blind reveal rule under `privateAnswers`.
2. **Verify Composite Indexes**:
   - Go to [Firebase Console $\rightarrow$ Firestore Database $\rightarrow$ Indexes](https://console.firebase.google.com/project/togetherly-17397/firestore/indexes).
   - Confirm composite indexes for `gameSessions`, `invitations`, and `xpTransactions` show status **Enabled**.
3. **Verify Authentication**:
   - Go to [Firebase Console $\rightarrow$ Authentication $\rightarrow$ Users](https://console.firebase.google.com/project/togetherly-17397/authentication/users).
   - As pilot testers register, their accounts will appear in the user list.

---

## 5. Rollback Procedures

If a security rule modification needs to be reverted:
1. Open [Firestore Database $\rightarrow$ Rules $\rightarrow$ Release History](https://console.firebase.google.com/project/togetherly-17397/firestore/rules).
2. Click the three dots next to the previous rules release and click **Roll back**.
3. Or redeploy via CLI:
   ```bash
   git checkout HEAD~1 firestore.rules
   npm run deploy:spark
   ```

