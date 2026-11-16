# Togetherly — Pilot Tester Feedback Guide

**Audience:** Pilot Testers & Operators  
**Scope:** Closed Pilot Cohort (5–6 Couples)  
**Purpose:** Structured guidance on reporting bugs, sync issues, and feature suggestions  

---

## 1. How to Report an Issue in the App

We have built a dedicated feedback tool directly into the Togetherly app:

1. Open Togetherly on your phone.
2. Tap the **Profile** tab (bottom right).
3. Under **PILOT TESTER FEEDBACK**, tap **"Send Feedback or Report Issue"**.
4. Choose the category that best describes your report.
5. (Optional) Select the specific game you were playing.
6. Type a short description of what happened.
7. Tap **"Send Feedback"**.

That's it! Your report goes directly into our protected pilot issue tracker.

---

## 2. Feedback Categories Explained

| Category | Icon | When to Use |
|---|---|---|
| **Bug** | 🐞 | The app froze, an error message appeared, a button didn't respond, or something crashed. |
| **Sync Issue** | 🔄 | You and your partner saw different things, a move didn't show up on your partner's phone, or the timer froze. |
| **Game Issue** | 🎮 | A game question was confusing, rules were unclear, answers didn't match, or a win was calculated incorrectly. |
| **Suggestion** | 💡 | You have an idea to make something easier to use, faster, or visually more romantic and fun. |
| **Game Idea** | ✨ | A game or activity you and your partner would love to play together in Togetherly! |
| **General** | 💬 | Any other thought, compliment, or general feedback about your experience. |

---

## 3. What to Include in a Good Report

To help us fix issues quickly, try to mention:

1. **Which game was active:** e.g., Connect Four, Who Knows Whom Better?, Tic-Tac-Toe.
2. **What you were doing:** e.g., *"I placed a heart in the center square, but my partner's screen stayed blank."*
3. **What network you were using:** e.g., Home Wi-Fi, 4G, or switching between networks.
4. **Whether it recovered:** e.g., *"Closing and reopening the app fixed it,"* or *"The match was stuck."*

---

## 4. Privacy & Data Security Notice

When you submit feedback, Togetherly collects:
- The category and your written description.
- The game name (if selected).
- Your app version (e.g. `1.0.0-pilot`).
- A timestamp.

Togetherly **never** collects:
- Passwords or credentials.
- Your private answers to relationship questions.
- Chat messages or personal phone data.

---

## 5. For Operators: How to Review Submitted Feedback

Only authorized administrators can access the submitted feedback.

### Viewing Feedback in Firebase Console
1. Open the [Firebase Console](https://console.firebase.google.com/).
2. Navigate to **Build** $\rightarrow$ **Firestore Database**.
3. Select the `pilotFeedback` collection.
4. Each document represents a tester submission, sorted by `createdAt`.
5. Review the `category`, `description`, `gameId`, and `userDisplayName`.
