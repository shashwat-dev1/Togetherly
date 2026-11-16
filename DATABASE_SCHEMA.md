# Togetherly — Cloud Firestore Database Schema

## 1. Collections & Document Specifications

### `users/{uid}`
Stores individual user profile and membership pointer.
```typescript
interface UserDocument {
  uid: string;
  email: string | null;
  displayName: string;
  avatarId: string;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  activeCoupleId: string | null;
  accountStatus: 'active' | 'suspended' | 'deleted';
  fcmTokens: string[];
  preferences: {
    notificationsEnabled: boolean;
    soundEnabled: boolean;
    hapticsEnabled: boolean;
    matureContentAllowed: boolean;
    theme: 'light' | 'dark' | 'system';
  };
}
```

---

### `couples/{coupleId}`
Stores shared metadata for the pair.
```typescript
interface CoupleDocument {
  id: string;
  memberIds: [string, string]; // Exactly two users
  members: {
    [uid: string]: {
      displayName: string;
      avatarId: string;
      joinedAt: FirebaseFirestore.Timestamp;
    };
  };
  createdAt: FirebaseFirestore.Timestamp;
  createdBy: string;
  status: 'active' | 'disconnected';
  sharedXP: number;
  coupleLevel: number;
  streakData: {
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: string; // YYYY-MM-DD
  };
  subscriptionSummary: {
    isPlus: boolean;
    tier: 'monthly' | 'annual' | 'lifetime' | 'free';
    purchasedByUid?: string;
    expiresAt?: FirebaseFirestore.Timestamp;
  };
}
```

---

### `couples/{coupleId}/privateData/{uid}`
Secure subcollection for private answers, drafts, and responses before match reveal.
```typescript
interface CouplePrivateData {
  uid: string;
  currentDraftGuesses?: Record<string, any>;
  personalNotes?: string;
  updatedAt: FirebaseFirestore.Timestamp;
}
```

---

### `invitations/{invitationId}`
Used for atomic pairing with rate limits and 48-hour expiration.
```typescript
interface InvitationDocument {
  id: string;
  code: string; // 6-character alphanumeric code
  createdBy: string;
  creatorName: string;
  creatorAvatarId: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  createdAt: FirebaseFirestore.Timestamp;
  expiresAt: FirebaseFirestore.Timestamp;
  claimedBy?: string;
  claimedAt?: FirebaseFirestore.Timestamp;
}
```

---

### `gameSessions/{sessionId}`
Core session object for all games.
```typescript
interface GameSessionDocument {
  id: string;
  coupleId: string;
  gameId: string; // e.g., 'who-knows-whom', 'tic-tac-toe'
  playerIds: [string, string];
  status: 'waiting' | 'ready' | 'active' | 'completed' | 'abandoned' | 'expired';
  gameMode: 'realtime' | 'turn_based' | 'simultaneous';
  currentTurn?: string; // uid of player whose turn it is
  scores: {
    [uid: string]: number;
  };
  gameState: Record<string, any>; // Game-specific state machine
  winnerId: string | 'draw' | null;
  xpAwarded: number;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
  expiresAt: FirebaseFirestore.Timestamp;
}
```

---

### `gameSessions/{sessionId}/actions/{actionId}`
Append-only log of player actions for audit, anti-cheat, and replay.
```typescript
interface GameActionDocument {
  id: string;
  playerId: string;
  actionType: string;
  payload: Record<string, any>;
  serverTimestamp: FirebaseFirestore.Timestamp;
}
```

---

### `dailyChallenges/{challengeId}`
Server-controlled rotating daily challenges.
```typescript
interface DailyChallengeDocument {
  id: string; // format: 'YYYY-MM-DD'
  date: string;
  title: string;
  description: string;
  category: 'quiz' | 'action' | 'game' | 'reflection';
  targetGameId?: string;
  targetCount: number;
  rewardXP: number;
  createdAt: FirebaseFirestore.Timestamp;
}
```

---

### `couples/{coupleId}/dailyChallengeProgress/{date}`
Tracks completion of daily challenges per couple.
```typescript
interface CoupleDailyChallengeProgress {
  date: string;
  completed: boolean;
  completedAt?: FirebaseFirestore.Timestamp;
  progress: number;
  contributions: {
    [uid: string]: number;
  };
}
```

---

### `couples/{coupleId}/achievements/{achievementId}`
Unlocked milestones and trophies.
```typescript
interface CoupleAchievementDocument {
  achievementId: string;
  unlockedAt: FirebaseFirestore.Timestamp;
  unlockedByAction: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}
```

---

### `xpTransactions/{transactionId}`
Immutable audit trail of shared XP gains.
```typescript
interface XpTransactionDocument {
  id: string;
  coupleId: string;
  source: 'game_win' | 'game_completion' | 'daily_challenge' | 'streak_bonus' | 'achievement';
  referenceId: string; // e.g. sessionId or challengeId
  amount: number;
  createdAt: FirebaseFirestore.Timestamp;
  verified: boolean;
}
```

---

## 2. Required Firestore Composite Indexes

1. **gameSessions:** `coupleId` (ASC) + `updatedAt` (DESC)
2. **gameSessions:** `coupleId` (ASC) + `status` (ASC) + `updatedAt` (DESC)
3. **invitations:** `code` (ASC) + `status` (ASC) + `expiresAt` (ASC)
4. **xpTransactions:** `coupleId` (ASC) + `createdAt` (DESC)
5. **notifications:** `recipientId` (ASC) + `readAt` (ASC) + `createdAt` (DESC)

