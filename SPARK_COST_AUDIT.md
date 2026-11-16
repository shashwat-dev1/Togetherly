# Togetherly — Firebase Spark Plan & Infrastructure Cost Audit

**Target Environment:** Firebase Project `togetherly-17397` (Mumbai, India / `asia-south1`)  
**Operating Tier:** Firebase Spark Plan (100% Free / Zero Billing / Zero Credit Card)  
**Target Audience:** Closed Pilot (5–6 Couples / 10–15 Users)  
**Document Version:** 1.0.0  
**Audit Date:** November 2026  

---

## 1. Executive Summary & Cost Commitment

Togetherly operates with **\$0.00 monthly infrastructure cost**.

The application architecture has been migrated to run strictly within the limits of the **Firebase Spark Plan**. No credit card has been provided, no billing is enabled, and no paid third-party infrastructure (such as Vercel, Supabase, Render, or AWS) is utilized.

---

## 2. Exhaustive Service-by-Service Audit

| Service / Integration | Spark Compatible? | Free-Tier Limits on Spark | Billing Activation Required? | App Dependency? | Monthly Cost | Can Be Disabled? |
|---|:---:|---|:---:|:---:|:---:|:---:|
| **Firebase Authentication** | ✅ YES | Unlimited Email/Password; 50,000 Monthly Active Users for phone/social. | ❌ NO | **Critical** (User profiles, login, session restoration) | **\$0.00** | No |
| **Cloud Firestore** | ✅ YES | 1 GiB stored data; 50,000 document reads/day; 20,000 document writes/day; 20,000 document deletes/day. | ❌ NO | **Critical** (Real-time multiplayer, couples, game sessions, feedback) | **\$0.00** | No |
| **Firebase Cloud Storage** | ✅ YES | 5 GiB stored data; 1 GB/day download; 20,000 upload ops/day; 50,000 download ops/day. | ❌ NO | **Optional** (Currently not utilized; avatar presets are bundled locally in APK) | **\$0.00** | Yes (Not used) |
| **Firebase Cloud Functions** | ❌ NO | Spark does not support Cloud Functions deployment (requires Blaze plan). | ⚠️ YES (Requires Blaze) | **Zero Dependency** (All server functions migrated to client-side Firestore architecture) | **\$0.00** | Yes (Completely excluded from deployment) |
| **Firebase Cloud Messaging** | ⚠️ Limited | Device registration is free; push notification delivery without a backend server is restricted. | ❌ NO | **Non-Critical** (In-app real-time `onSnapshot` handles all live gameplay sync) | **\$0.00** | Yes |
| **Google Play Billing** | ❌ Excluded | N/A | N/A | **Zero Dependency** (Monetization strictly removed for closed pilot) | **\$0.00** | Yes (Disabled) |
| **AdMob / Advertisements** | ❌ Excluded | N/A | N/A | **Zero Dependency** (No ads in closed pilot) | **\$0.00** | Yes (Disabled) |
| **RevenueCat** | ❌ Excluded | N/A | N/A | **Zero Dependency** (No subscriptions in closed pilot) | **\$0.00** | Yes (Disabled) |
| **Third-Party Hosting (Vercel / Render / Supabase)** | ❌ Excluded | N/A | N/A | **Zero Dependency** (Android APK connects directly to Firebase Cloud) | **\$0.00** | Yes (Not used) |

---

## 3. Capacity & Quota Projections for Closed Pilot

### Tester Cohort Sizing:
- **Couples:** 5–6 couples (10–12 active users).
- **Duration:** 15-day closed pilot period.
- **Estimated Matches per Couple per Day:** 10 matches.

### Daily Firestore Usage vs Spark Quotas:

| Operation | Estimated Daily Consumption (5–6 Couples) | Daily Spark Quota | Quota Utilization % |
|---|---|---|---|
| **Document Reads** | ~1,200 reads / day | 50,000 reads / day | **2.4%** |
| **Document Writes** | ~600 writes / day | 20,000 writes / day | **3.0%** |
| **Document Deletes** | ~0 deletes / day | 20,000 deletes / day | **0.0%** |
| **Data Storage** | ~2.5 MB total database size | 1,024 MB (1 GiB) | **0.24%** |

> [!NOTE]
> Even if all 6 couples play continuously throughout the day, total daily Firestore reads and writes remain well below **5%** of the free daily Spark quotas.
> There is **zero risk** of incurring accidental charges or service shutdown due to quota exhaustion.

---

## 4. Architectural Safeguards Against Accidental Billing

1. **No Credit Card on File**: The Firebase project `togetherly-17397` has never been upgraded to Blaze. Firebase strictly enforces hard stops on Spark if free quotas are exceeded, guaranteeing zero financial liability.
2. **`firebase.json` Hardened**: The `"functions"` deployment block has been removed. Running `firebase deploy` deploys only free Firestore security rules and composite indexes.
3. **Local Assets**: All avatar images, sound assets, and game prompt catalogs are bundled directly inside the standalone Android APK rather than fetched over paid CDNs.
4. **Idempotent Writes**: All XP transactions and game moves employ deterministic IDs to prevent duplicate database writes.

