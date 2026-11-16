# Togetherly — Closed Pilot Deployment Guide

**Audience:** Pilot Operators, Project Owners, and Lead Engineers  
**Target:** 5–6 Couples (10–12 Testers) on Independent Android Devices  
**Objective:** Deploy a stable, real-time backend and distribute installable standalone Android APKs without public app-store listing.

---

## 1. Firebase Backend Setup (Dedicated Pilot Project)

To support real multiplayer between separate devices across different Wi-Fi and cellular networks, the pilot build must connect to a live Firebase project.

### Step 1.1: Create Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add project**.
3. Name the project `togetherly-pilot` (or similar).
4. (Optional) Disable Google Analytics for this closed pilot or leave enabled.
5. Create the project.

### Step 1.2: Enable Authentication
1. In the Firebase Console sidebar, navigate to **Build** $\rightarrow$ **Authentication**.
2. Click **Get Started**.
3. Under the **Sign-in method** tab, enable **Email/Password**.
4. Leave *Email link (passwordless sign-in)* disabled. Click **Save**.

### Step 1.3: Enable Cloud Firestore
1. Navigate to **Build** $\rightarrow$ **Firestore Database**.
2. Click **Create database**.
3. Select a database location close to your testers (e.g. `asia-south1` or `us-central1`).
4. Choose **Start in production mode** (our repository includes tested, hardened security rules).
5. Click **Create**.

### Step 1.4: Upgrade to Blaze Plan (For Cloud Functions)
> [!IMPORTANT]
> Google Cloud Functions requires the Firebase **Blaze (Pay as you go)** plan for deployment. The free Spark plan does not permit Node.js Cloud Functions.
>
> For 5–6 couples over 15 days, usage will stay well within Google's generous **monthly free tier** (2 million Cloud Function invocations, 50,000 Firestore reads/day, 20,000 Firestore writes/day free).
> Expected cost for the entire pilot is **$0.00**.

1. Click **Upgrade** at the bottom left of the Firebase Console.
2. Select the **Blaze** plan and link your billing account.
3. **Set a Budget Alert:** In Google Cloud Console $\rightarrow$ Billing $\rightarrow$ Budgets & Alerts, create a budget of **$5.00** with 50%, 90%, and 100% threshold email notifications to guarantee no unexpected burn.

### Step 1.5: Register Android App in Firebase
1. In Firebase Console Project Overview, click the **Android** icon.
2. **Android package name:** `com.togetherly.couples` (must match `app.json`).
3. **App nickname:** `Togetherly Pilot`.
4. Click **Register app**.
5. Download `google-services.json` if configuring native builds, or obtain the Web Client credentials from **Project Settings** $\rightarrow$ **General** $\rightarrow$ **Your apps** $\rightarrow$ **SDK setup and configuration (Config)**.

---

## 2. Deploying Security Rules & Cloud Functions

From your local machine in `C:\Projects\LDR`:

### Step 2.1: Log In and Select Project
```bash
# Install Firebase CLI if not already present
npm install -g firebase-tools

# Log in to Firebase
firebase login

# Select your pilot project
firebase use --add
# Choose togetherly-pilot and alias it as 'default' or 'pilot'
```

### Step 2.2: Deploy Firestore Rules and Indexes
```bash
firebase deploy --only firestore:rules,firestore:indexes
```
This applies our tested rules (protecting user data, private simultaneous answers, anti-cheat XP restrictions, and admin-only feedback).

### Step 2.3: Deploy Cloud Functions
```bash
# Build the TypeScript functions first
npm --prefix functions run build

# Deploy Cloud Functions to Firebase
firebase deploy --only functions
```
This activates:
- `validateAndApplyAction`: Turn checker and scoring calculator.
- `onPrivateAnswerWritten`: Atomic simultaneous answer reveal engine.
- `onNotificationCreated`: Multicast push dispatcher.

---

## 3. Configuring the Pilot Environment (`.env`)

Create your `.env` file containing the live Firebase credentials:

```bash
cp .env.example .env
```

Open `.env` and fill in the values from your Firebase Project Settings:

```ini
EXPO_PUBLIC_FIREBASE_MODE=production
EXPO_PUBLIC_APP_ENV=pilot
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy...your-actual-key...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=togetherly-pilot.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=togetherly-pilot
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=togetherly-pilot.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789012
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789012:android:abcdef123456
```

---

## 4. Building the Standalone Android APK

We use Expo Application Services (EAS) to compile a standalone, installable `.apk` file that does **not** require Google Play Store distribution.

### Step 4.1: Install EAS CLI and Authenticate
```bash
npm install -g eas-cli
eas login
```

### Step 4.2: Build the Pilot APK
```bash
eas build --profile pilot --platform android
```
- EAS will bundle the JavaScript, compile native Android binaries, and generate an installable `.apk`.
- When the build finishes (usually 8–15 minutes), EAS provides a direct download URL in the terminal (e.g. `https://expo.dev/artifacts/eas/...apk`).

### Step 4.3: Download the APK
Download the `.apk` file to your computer. Rename it for clear distribution:  
`Togetherly-Pilot-v1.0.0.apk`.

---

## 5. Distributing the APK to Pilot Couples

### Step 5.1: Hosting the APK
Upload `Togetherly-Pilot-v1.0.0.apk` to a private Google Drive folder, Dropbox, or OneDrive. Enable link sharing ("Anyone with the link can view/download").

### Step 5.2: Sending Instructions to Testers
Send this message to each of your 5–6 participating couples:

```text
Hey! We are excited to invite you both to test Togetherly — our private couples game app.

How to get started:
1. Download the app onto your Android phone: [INSERT GOOGLE DRIVE LINK]
2. Open the downloaded file and tap "Install".
   (If your phone asks, allow "Install unknown apps" for your browser or file manager).
3. Partner 1: Open Togetherly, tap "Create Account", and sign up with your email.
4. On the pairing screen, tap "Generate Code" and text the 6-character code to Partner 2.
5. Partner 2: Open Togetherly, create your account, select "I have a code", enter the 6-character code, and tap "Connect".
6. You're paired! Pick a game from the Games tab and start playing together!

If you notice any bug or sync glitch, you can tap "Profile" -> "Send Feedback" anytime. Have fun!
```

---

## 6. Sideloading Troubleshooting for Testers

- **"Blocked by Play Protect" Warning:**  
  Tap **"More details"** $\rightarrow$ **"Install anyway"**. This warning is standard for privately built APKs that are not downloaded from the Google Play Store.
- **"Do you want to install this app from an unknown source?":**  
  Tap **Settings** $\rightarrow$ Toggle **"Allow from this source"** $\rightarrow$ Return and tap **Install**.

---

## 7. Rebuilding for Bug Fixes

When you fix bugs during the pilot:

1. Commit your changes to Git.
2. Increment the version or build number if desired in `app.json`.
3. Run:
   ```bash
   eas build --profile pilot --platform android
   ```
4. Distribute the new APK download link to the pilot cohort. Testers can simply install the new APK over the existing installation to update without losing their account or couple pairing!

