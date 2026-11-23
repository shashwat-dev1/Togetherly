# TOGETHERLY — ANDROID RELEASE READINESS & APK BUILD SPECIFICATION

**Application Name:** Togetherly  
**Package Identifier:** `com.togetherly.couples`  
**Current Version:** `1.0.0` (Version Code: `1`)  
**EAS Build Profile:** `pilot` (Build Type: `apk`)  
**Build Target:** Standalone Android Application Package (.apk)  
**Distribution Model:** Private invite-only distribution to 5–6 couples (10–15 users) via direct APK download / Firebase App Distribution  

---

## 1. Standalone Architecture Verification

Togetherly is fully configured as a standalone native Android application that operates independently of local development infrastructure:
- **No Metro Server Dependency:** JavaScript bundle is compiled into the APK assets directory during the build process (`index.android.bundle`).
- **No Expo Go Dependency:** Includes native binary code configured via Expo Continuous Native Generation (CNG) and EAS Build.
- **Embedded Firebase Configuration:** `google-services.json` is linked via `app.config.js`:
  ```javascript
  googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? './google-services.json'
  ```
- **No In-Memory Mock Fallback in Release:** `resolveRuntimeMode()` in [`src/services/firebase/config.ts`](file:///c:/Projects/LDR/src/services/firebase/config.ts) strictly prohibits mock mode when `!__DEV__`.

---

## 2. Configuration & Asset Audit

| Requirement | Configured Value | Status |
| :--- | :--- | :---: |
| **Package Name** | `com.togetherly.couples` in `app.json` | **VERIFIED** |
| **Android Permissions** | `INTERNET`, `VIBRATE`, `ACCESS_NETWORK_STATE` | **VERIFIED** |
| **Adaptive Icon** | `assets/images/android-icon-foreground.png`, background `#FFF8F3` | **VERIFIED** |
| **Splash Screen** | Splash image with `#FFF8F3` background | **VERIFIED** |
| **Edge-to-Edge Display** | `react-native-safe-area-context` on all screens | **VERIFIED** |
| **Orientation** | Portrait-locked (`"orientation": "portrait"`) | **VERIFIED** |
| **Dependencies** | 20/20 dependency checks passed via `npx expo-doctor` | **VERIFIED** |
| **SVG Support** | `react-native-svg` pinned to exact SDK 58 version `15.16.0` | **VERIFIED** |

---

## 3. EAS Build Configuration (`eas.json`)

The project's `eas.json` includes the dedicated `pilot` build profile:
```json
{
  "cli": {
    "version": ">= 18.0.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "pilot": {
      "distribution": "internal",
      "android": {
        "buildType": "apk",
        "gradleCommand": ":app:assembleRelease"
      },
      "env": {
        "EXPO_PUBLIC_APP_ENV": "pilot",
        "EXPO_PUBLIC_FIREBASE_MODE": "production"
      }
    },
    "production": {
      "autoIncrement": true
    }
  }
}
```

---

## 4. Standalone APK Build Instructions

To build the installable release APK:

### Step 1: Ensure EAS CLI is Available
```powershell
npx eas-cli --version
```

### Step 2: Ensure Google Services File is Linked in EAS
Option A (Environment Variable Secret):
```powershell
npx eas-cli env:create --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json
```
Option B (Local Build or Prebuild):
Ensure `google-services.json` is present in the project root `C:\Projects\LDR\google-services.json`.

### Step 3: Trigger the Standalone APK Build
```powershell
npm run build:pilot
# Equivalent to: npx eas-cli build --profile pilot --platform android
```

### Step 4: Download & Distribute APK
EAS Cloud Build outputs a shareable direct URL to the compiled `.apk` file (approx. 45–55 MB). Share this download link directly with the pilot couples via WhatsApp, Telegram, or email.

---

## 5. First-Time Tester Device Installation Guide

Share these simple instructions with your pilot testers:
1. Tap the download link on your Android phone and download `Togetherly.apk`.
2. Tap the downloaded file. When Android displays *"For your security, your phone is not allowed to install unknown apps from this source"*, tap **Settings** and enable **Allow from this source**.
3. Tap **Install** and open **Togetherly**.
4. Register a new account with your email and password.
5. Create or enter your partner's 6-character pairing code to connect your worlds!
