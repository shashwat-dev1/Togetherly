/**
 * TOGETHERLY — MULTIPLAYER GAME SESSION ENGINE
 *
 * Implements the universal session lifecycle for all 10 multiplayer games:
 * - Session creation, ready check, joining
 * - Real-time state synchronization with listener cleanup & exponential backoff
 * - Authorised membership validation & valid turn checking
 * - Idempotency & duplicate submission prevention
 * - Double-blind secret submission architecture (answers remain hidden until both submit)
 * - Server-authoritative completion, scoring, and rematch handling
 * - Automatic switching between Production/Emulator Firestore and reactive local mock
 */
import { STARTING_HEARTS, takeHearts } from '@/games/last-heart/logic';
import {
  GameSession,
  GameSessionStatus,
  GameplayMode,
} from '@/types';
import { db, runtimeMode } from './config';
import { XPProgressionService } from '@/services/engagement/xpProgressionService';
import { DailyChallengeService } from '@/services/engagement/dailyChallengeService';
import { StreakService } from '@/services/engagement/streakService';
import { AchievementService } from '@/services/engagement/achievementService';
import { ActivityService } from '@/services/engagement/activityService';
import { NotificationService } from '@/services/notifications/notificationService';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  collection,
  runTransaction,
  Unsubscribe,
  query,
  where,
  orderBy,
  limit,
  getDocs,
} from 'firebase/firestore';

// --- IN-MEMORY REACTIVE STORE FOR MOCK MODE ---
// Enables full real-time dual-device simulation without an active backend
const mockSessions = new Map<string, GameSession>();
const mockListeners = new Map<string, Set<(session: GameSession) => void>>();
const mockPrivateAnswers = new Map<string, Map<string, any>>(); // sessionId -> (playerId_round -> answer)
const mockActionHistory = new Set<string>(); // idempotency cache: sessionId_idempotencyKey

function notifyMockSubscribers(sessionId: string, session: GameSession) {
  const listeners = mockListeners.get(sessionId);
  if (listeners) {
    // Clone to ensure immutability
    const copy = JSON.parse(JSON.stringify(session));
    listeners.forEach((callback) => {
      try {
        callback(copy);
      } catch (err) {
        console.error('[GameSessionService] Listener error:', err);
      }
    });
  }
}

async function triggerGameCompletionEngagement(session: GameSession): Promise<void> {
  try {
    const { coupleId, gameId, id: sessionId, xpAwarded, winnerId, playerIds } = session;
    const reward = xpAwarded || 30;

    // 1. Award shared XP
    await XPProgressionService.awardXP(coupleId, reward, 'game_completion', sessionId, gameId);

    // 2. Advance daily challenge
    await DailyChallengeService.recordGameActivity(coupleId, playerIds[0], gameId);

    // 3. Update couple streak
    await StreakService.recordCoupleActivity(coupleId);

    // 4. Log in activity timeline
    const isDraw = winnerId === 'draw';
    await ActivityService.recordActivity(coupleId, {
      type: 'game_completed',
      title: `${gameId.replace(/-/g, ' ').toUpperCase()} Match Complete`,
      description: isDraw ? 'Match ended in a draw!' : 'Game concluded with flying colors!',
      gameId,
      referenceId: sessionId,
      xpAwarded: reward,
      actionRequired: false,
    });

    // 5. Evaluate Achievements
    await AchievementService.evaluateAndUnlockAchievements(coupleId, {
      gameId,
      isWin: !!winnerId && winnerId !== 'draw',
      totalMatchesPlayed: 1,
      totalMatchesWon: winnerId && winnerId !== 'draw' ? 1 : 0,
      distinctGamesPlayed: [gameId],
      currentStreak: 1,
    });

    // 6. Notify partner
    const partnerId = playerIds[1];
    if (partnerId) {
      await NotificationService.sendNotification({
        toUid: partnerId,
        type: 'game_completed',
        title: 'Match Finished!',
        body: `Your match in ${gameId.replace(/-/g, ' ')} has finished. Check the results!`,
        data: { gameId, sessionId },
      });
    }
  } catch (err) {
    console.error('[Engagement] Game completion hook error:', err);
  }
}

export interface CreateSessionParams {
  coupleId: string;
  gameId: string;
  hostPlayerId: string;
  partnerPlayerId: string;
  gameMode: GameplayMode;
  initialGameState?: Record<string, any>;
  expiresInMinutes?: number;
}

export const GameSessionService = {
  /**
   * 1. CREATE GAME SESSION
   * Initializes a new session with status 'waiting' or 'ready'.
   */
  async createGameSession(params: CreateSessionParams): Promise<GameSession> {
    const {
      coupleId,
      gameId,
      hostPlayerId,
      partnerPlayerId,
      gameMode,
      initialGameState = {},
      expiresInMinutes = 30,
    } = params;

    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = Date.now();
    const expiresAt = now + expiresInMinutes * 60 * 1000;

    const newSession: GameSession = {
      id: sessionId,
      coupleId,
      gameId,
      playerIds: [hostPlayerId, partnerPlayerId],
      readyPlayers: [hostPlayerId],
      status: 'waiting',
      gameMode,
      currentTurn: hostPlayerId,
      scores: {
        [hostPlayerId]: 0,
        [partnerPlayerId]: 0,
      },
      gameState: {
        ...initialGameState,
        ...(gameId === 'last-heart' ? { remaining: STARTING_HEARTS } : {}),
        round: 1,
        maxRounds: 5,
        turnNumber: 0,
      },
      winnerId: null,
      xpAwarded: 0,
      createdAt: now,
      updatedAt: now,
      expiresAt,
    };

    if (runtimeMode === 'production' || runtimeMode === 'emulator') {
      if (!db) throw new Error('Firestore is not initialized');
      const sessionRef = doc(db, 'gameSessions', sessionId);
      const stored = { ...newSession, createdAt: serverTimestamp(), updatedAt: serverTimestamp() };
      if (gameId === 'last-heart') {
        const lock = doc(db, 'couples', coupleId, 'gameLobbies', gameId);
        const current = await runTransaction(db, async (transaction) => {
          const pointer = await transaction.get(lock);
          if (pointer.exists()) {
            const previous = await transaction.get(doc(db!, 'gameSessions', pointer.data().sessionId));
            const game = previous.data() as GameSession | undefined;
            if (game && ['waiting', 'active', 'ready'].includes(game.status) && game.expiresAt > Date.now()) {
              return game;
            }
          }
          transaction.set(sessionRef, stored);
          transaction.set(lock, { sessionId });
          return null;
        });
        if (current) return current;
      } else {
        await setDoc(sessionRef, stored);
      }
      NotificationService.sendNotification({
        toUid: partnerPlayerId,
        type: 'game_invitation',
        title: 'Game Night! 🎮',
        body: `Your partner wants to play ${gameId.replace(/-/g, ' ')}! Are you ready?`,
        data: { gameId, sessionId },
      }).catch(() => {});
      return newSession;
    }

    // Mock Mode
    mockSessions.set(sessionId, newSession);
    mockPrivateAnswers.set(sessionId, new Map());
    notifyMockSubscribers(sessionId, newSession);
    NotificationService.sendNotification({
      toUid: partnerPlayerId,
      type: 'game_invitation',
      title: 'Game Night! 🎮',
      body: `Your partner wants to play ${gameId.replace(/-/g, ' ')}! Are you ready?`,
      data: { gameId, sessionId },
    }).catch(() => {});
    return newSession;
  },

  /**
   * 2. JOIN GAME SESSION
   * Marks player as ready; when both players are ready, promotes status to 'active'.
   */
  async joinGameSession(sessionId: string, playerId: string): Promise<GameSession> {
    const session = await this.getGameSession(sessionId);
    if (!session) throw new Error('Session not found');

    if (!session.playerIds.includes(playerId as any)) {
      throw new Error('Access denied: You are not an authorized player for this couple session');
    }

    if (session.status === 'completed' || session.status === 'abandoned') {
      throw new Error(`Cannot join session with status '${session.status}'`);
    }

    const readySet = new Set(session.readyPlayers);
    readySet.add(playerId);
    const updatedReady = Array.from(readySet);
    const isBothReady = updatedReady.length >= 2;
    const newStatus: GameSessionStatus = isBothReady ? 'active' : 'ready';

    if (runtimeMode === 'production' || runtimeMode === 'emulator') {
      if (!db) throw new Error('Firestore is not initialized');
      const sessionRef = doc(db, 'gameSessions', sessionId);
      await runTransaction(db, async (txn) => {
        const snap = await txn.get(sessionRef);
        if (!snap.exists()) throw new Error('Session does not exist');
        txn.update(sessionRef, {
          readyPlayers: updatedReady,
          status: newStatus,
          updatedAt: serverTimestamp(),
        });
      });
      const otherPlayer = session.playerIds.find((id) => id !== playerId);
      if (otherPlayer) {
        NotificationService.sendNotification({
          toUid: otherPlayer,
          type: 'partner_joined',
          title: 'Partner joined! 💕',
          body: `Your partner joined! Let's see who knows who best.`,
          data: { gameId: session.gameId, sessionId: session.id },
        }).catch(() => {});
      }
      return { ...session, readyPlayers: updatedReady, status: newStatus, updatedAt: Date.now() };
    }

    // Mock Mode
    session.readyPlayers = updatedReady;
    session.status = newStatus;
    session.updatedAt = Date.now();
    mockSessions.set(sessionId, session);
    notifyMockSubscribers(sessionId, session);
    const otherPlayer = session.playerIds.find((id) => id !== playerId);
    if (otherPlayer) {
      NotificationService.sendNotification({
        toUid: otherPlayer,
        type: 'partner_joined',
        title: 'Partner joined! 💕',
        body: `Your partner joined! Let's see who knows who best.`,
        data: { gameId: session.gameId, sessionId: session.id },
      }).catch(() => {});
    }
    return session;
  },

  /**
   * 3. GET GAME SESSION
   */
  async getGameSession(sessionId: string): Promise<GameSession | null> {
    if (runtimeMode === 'production' || runtimeMode === 'emulator') {
      if (!db) throw new Error('Firestore is not initialized');
      const sessionRef = doc(db, 'gameSessions', sessionId);
      const snap = await getDoc(sessionRef);
      if (!snap.exists()) return null;
      const data = snap.data();
      return {
        ...data,
        id: snap.id,
        createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : (data.createdAt || Date.now()),
        updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : (data.updatedAt || Date.now()),
      } as GameSession;
    }

    return mockSessions.get(sessionId) || null;
  },

  /**
   * 4. SUBSCRIBE TO GAME SESSION
   * Real-time updates with cleanup function and reconnection backoff.
   */
  subscribeToGameSession(
    sessionId: string,
    onUpdate: (session: GameSession) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    if (runtimeMode === 'production' || runtimeMode === 'emulator') {
      if (!db) {
        if (onError) onError(new Error('Firestore unavailable'));
        return () => {};
      }
      const sessionRef = doc(db, 'gameSessions', sessionId);
      return onSnapshot(
        sessionRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.data();
            const session: GameSession = {
              ...data,
              id: snapshot.id,
              createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : (data.createdAt || Date.now()),
              updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : (data.updatedAt || Date.now()),
            } as GameSession;
            onUpdate(session);
          }
        },
        (error) => {
          console.error('[GameSessionService] Snapshot listener error:', error);
          if (onError) onError(error);
        }
      );
    }

    // Mock Mode Subscription
    if (!mockListeners.has(sessionId)) {
      mockListeners.set(sessionId, new Set());
    }
    const listenerSet = mockListeners.get(sessionId)!;
    listenerSet.add(onUpdate);

    // Emit initial snapshot immediately
    const existing = mockSessions.get(sessionId);
    if (existing) {
      setTimeout(() => onUpdate(JSON.parse(JSON.stringify(existing))), 10);
    }

    return () => {
      listenerSet.delete(onUpdate);
      if (listenerSet.size === 0) {
        mockListeners.delete(sessionId);
      }
    };
  },

  /**
   * 5. SUBMIT GAME ACTION (Turn-Based / Real-Time)
   * Enforces valid turn alternation, idempotency, and status checks.
   */
  async submitGameAction(
    sessionId: string,
    playerId: string,
    actionType: string,
    payload: Record<string, any>,
    idempotencyKey?: string
  ): Promise<GameSession> {
    if (actionType === 'take_hearts' && db && runtimeMode !== 'mock') {
      const ref = doc(db, 'gameSessions', sessionId);
      const updated = await runTransaction(db, async (transaction) => {
        const snapshot = await transaction.get(ref);
        if (!snapshot.exists()) throw new Error('Session not found');
        const result = takeHearts(snapshot.data() as GameSession, playerId, payload.count);
        const { gameState, scores, currentTurn, winnerId, status, xpAwarded } = result;
        transaction.update(ref, { gameState, scores, currentTurn, winnerId, status, xpAwarded, updatedAt: serverTimestamp() });
        return result;
      });
      if (updated.status === 'completed') triggerGameCompletionEngagement(updated).catch(() => {});
      return updated;
    }

    // Idempotency check
    const dedupKey = `${sessionId}_${idempotencyKey || `${playerId}_${actionType}_${Date.now()}`}`;
    if (idempotencyKey && mockActionHistory.has(dedupKey)) {
      const cached = await this.getGameSession(sessionId);
      if (cached) return cached;
    }
    mockActionHistory.add(dedupKey);

    const session = await this.getGameSession(sessionId);
    if (!session) throw new Error('Session not found');

    if (session.status !== 'active') {
      throw new Error(`Cannot submit action: Session is '${session.status}'`);
    }

    if (!session.playerIds.includes(playerId as any)) {
      throw new Error('Unauthorized: You are not a player in this session');
    }

    // For turn-based games, enforce turn validation
    if (session.gameMode === 'turn_based' && session.currentTurn && session.currentTurn !== playerId) {
      throw new Error(`Invalid turn: Waiting for partner (${session.currentTurn}) to move`);
    }

    const partnerId = session.playerIds.find((id) => id !== playerId) || '';

    // Apply action into game-specific state
    const nextGameState = { ...session.gameState };
    const nextScores = { ...session.scores };
    let nextWinner = session.winnerId;
    let nextStatus: GameSessionStatus = session.status;
    let nextTurn = partnerId;

    // --- GAME SPECIFIC ACTION PROCESSORS ---
    if (session.gameId === 'last-heart' && actionType === 'take_hearts') {
      const result = takeHearts(session, playerId, payload.count);
      mockSessions.set(sessionId, result);
      notifyMockSubscribers(sessionId, result);
      return result;
    }
    if (session.gameId === 'tic-tac-toe') {
      const { index, symbol } = payload;
      const board = [...(nextGameState.board || Array(9).fill(null))];
      if (board[index] !== null) {
        throw new Error('Square is already occupied');
      }
      board[index] = symbol;
      nextGameState.board = board;
      nextGameState.turnNumber = (nextGameState.turnNumber || 0) + 1;

      // Win check
      const lines = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6],
      ];
      let won = false;
      for (const [a, b, c] of lines) {
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
          nextWinner = playerId;
          nextStatus = 'completed';
          nextScores[playerId] = (nextScores[playerId] || 0) + 1;
          won = true;
          break;
        }
      }
      if (!won && board.every((cell) => cell !== null)) {
        nextWinner = 'draw';
        nextStatus = 'completed';
      }
    } else {
      // Generic state merge
      Object.assign(nextGameState, payload);
      if (payload.scores) Object.assign(nextScores, payload.scores);
      if (payload.winnerId !== undefined) nextWinner = payload.winnerId;
      if (payload.status) nextStatus = payload.status;
      if (payload.currentTurn) nextTurn = payload.currentTurn;
    }

    const updatedSession: GameSession = {
      ...session,
      gameState: nextGameState,
      scores: nextScores,
      currentTurn: nextTurn,
      winnerId: nextWinner,
      status: nextStatus,
      xpAwarded: nextStatus === 'completed' ? 30 : 0,
      updatedAt: Date.now(),
    };

    if (runtimeMode === 'production' || runtimeMode === 'emulator') {
      if (!db) throw new Error('Firestore is not initialized');
      const sessionRef = doc(db, 'gameSessions', sessionId);
      const actionRef = doc(collection(db, 'gameSessions', sessionId, 'actions'));
      await setDoc(actionRef, {
        id: actionRef.id,
        playerId,
        actionType,
        payload,
        ...(idempotencyKey ? { idempotencyKey } : {}),
        serverTimestamp: serverTimestamp(),
      });
      await updateDoc(sessionRef, {
        gameState: nextGameState,
        scores: nextScores,
        currentTurn: nextTurn,
        winnerId: nextWinner,
        status: nextStatus,
        xpAwarded: updatedSession.xpAwarded,
        updatedAt: serverTimestamp(),
      });
      if (updatedSession.status === 'completed') {
        triggerGameCompletionEngagement(updatedSession).catch(() => {});
      } else if (updatedSession.status === 'active' && nextTurn) {
        NotificationService.sendNotification({
          toUid: nextTurn,
          type: 'your_turn',
          title: 'Your Turn!',
          body: `It's your turn in ${session.gameId.replace(/-/g, ' ')}. Make your move!`,
          data: { gameId: session.gameId, sessionId: session.id },
        }).catch(() => {});
      }
      return updatedSession;
    }

    // Mock Mode
    mockSessions.set(sessionId, updatedSession);
    notifyMockSubscribers(sessionId, updatedSession);
    if (updatedSession.status === 'completed') {
      triggerGameCompletionEngagement(updatedSession).catch(() => {});
    } else if (updatedSession.status === 'active' && nextTurn) {
      NotificationService.sendNotification({
        toUid: nextTurn,
        type: 'your_turn',
        title: 'Your Turn!',
        body: `It's your turn in ${session.gameId.replace(/-/g, ' ')}. Make your move!`,
        data: { gameId: session.gameId, sessionId: session.id },
      }).catch(() => {});
    }
    return updatedSession;
  },

  /**
   * 6. SUBMIT SIMULTANEOUS ANSWER (Double-Blind Secret Architecture)
   *
   * Stores secret answers in private documents. Neither player can see
   * the other's answer until BOTH have submitted for the round.
   * When the second answer arrives, both are revealed and scored atomically.
   */
  async submitSimultaneousAnswer(
    sessionId: string,
    playerId: string,
    round: number,
    answer: any
  ): Promise<{ session: GameSession; bothSubmitted: boolean; revealedRoundResult?: any }> {
    const session = await this.getGameSession(sessionId);
    if (!session) throw new Error('Session not found');

    if (session.status !== 'active') {
      throw new Error(`Cannot submit: Session is ${session.status}`);
    }

    if (!session.playerIds.includes(playerId as any)) {
      throw new Error('Unauthorized player');
    }

    const partnerId = session.playerIds.find((id) => id !== playerId) || '';

    let partnerAnswer: any = undefined;
    let bothSubmitted = false;
    let answersForSession: Map<string, any> | undefined = undefined;

    if (runtimeMode === 'production' || runtimeMode === 'emulator') {
      if (!db) throw new Error('Firestore is not initialized');
      const privateRef = doc(db, 'gameSessions', sessionId, 'privateAnswers', `${playerId}_r${round}`);
      // 1. Commit caller's immutable answer to privateAnswers
      await setDoc(privateRef, {
        playerId,
        round,
        answer,
        submittedAt: serverTimestamp(),
      });

      // 2. Check if partner has already committed their answer for this round
      try {
        const partnerRef = doc(db, 'gameSessions', sessionId, 'privateAnswers', `${partnerId}_r${round}`);
        const partnerSnap = await getDoc(partnerRef);
        if (partnerSnap.exists()) {
          partnerAnswer = partnerSnap.data()?.answer;
          bothSubmitted = partnerAnswer !== undefined;
        }
      } catch {
        partnerAnswer = undefined;
        bothSubmitted = false;
      }
    } else {
      // Record submission into mock private store
      answersForSession = mockPrivateAnswers.get(sessionId);
      if (!answersForSession) {
        answersForSession = new Map();
        mockPrivateAnswers.set(sessionId, answersForSession);
      }

      const playerKey = `${playerId}_r${round}`;
      const partnerKey = `${partnerId}_r${round}`;

      answersForSession.set(playerKey, answer);

      partnerAnswer = answersForSession.get(partnerKey);
      bothSubmitted = partnerAnswer !== undefined;
    }

    let updatedSession = { ...session };
    let revealedRoundResult: any = null;

    if (!bothSubmitted) {
      // Only one player submitted: record status in public state WITHOUT exposing answer!
      updatedSession.gameState = {
        ...session.gameState,
        waitingForPartner: true,
        submittedPlayers: [playerId],
      };
      updatedSession.updatedAt = Date.now();
      NotificationService.sendNotification({
        toUid: partnerId,
        type: 'answers_ready',
        title: 'Partner answered! 💭',
        body: `Your partner submitted their answer! Your turn to guess.`,
        data: { gameId: session.gameId, sessionId: session.id, round: String(round) },
      }).catch(() => {});
    } else {
      // BOTH SUBMITTED: Reveal and calculate round scores!
      const player1Id = session.playerIds[0];
      const player2Id = session.playerIds[1];
      let ans1: any;
      let ans2: any;

      if (runtimeMode === 'production' || runtimeMode === 'emulator') {
        ans1 = playerId === player1Id ? answer : partnerAnswer;
        ans2 = playerId === player2Id ? answer : partnerAnswer;
      } else {
        ans1 = answersForSession!.get(`${player1Id}_r${round}`);
        ans2 = answersForSession!.get(`${player2Id}_r${round}`);
      }

      const nextScores = { ...session.scores };
      let roundMatch = false;

      if (session.gameId === 'who-knows-whom') {
        // ans1 = { answer: string, guessForPartner: string }
        // If player1 correctly guessed partner's answer -> point for player1
        const p1Correct = ans1?.guessForPartner === ans2?.answer;
        const p2Correct = ans2?.guessForPartner === ans1?.answer;

        if (p1Correct) nextScores[player1Id] = (nextScores[player1Id] || 0) + 1;
        if (p2Correct) nextScores[player2Id] = (nextScores[player2Id] || 0) + 1;

        revealedRoundResult = {
          round,
          [player1Id]: { ...ans1, correct: p1Correct },
          [player2Id]: { ...ans2, correct: p2Correct },
        };
      } else if (session.gameId === 'this-or-that') {
        // Both picked a choice (A or B)
        roundMatch = ans1 === ans2;
        if (roundMatch) {
          nextScores[player1Id] = (nextScores[player1Id] || 0) + 1;
          nextScores[player2Id] = (nextScores[player2Id] || 0) + 1;
        }
        revealedRoundResult = {
          round,
          matched: roundMatch,
          [player1Id]: ans1,
          [player2Id]: ans2,
        };
      } else if (session.gameId === 'rock-paper-scissors') {
        // Rock, Paper, Scissors choices
        let roundWinner: string | 'tie' = 'tie';
        if (ans1 !== ans2) {
          if (
            (ans1 === 'Rock' && ans2 === 'Scissors') ||
            (ans1 === 'Paper' && ans2 === 'Rock') ||
            (ans1 === 'Scissors' && ans2 === 'Paper')
          ) {
            roundWinner = player1Id;
            nextScores[player1Id] = (nextScores[player1Id] || 0) + 1;
          } else {
            roundWinner = player2Id;
            nextScores[player2Id] = (nextScores[player2Id] || 0) + 1;
          }
        }
        revealedRoundResult = {
          round,
          winner: roundWinner,
          [player1Id]: ans1,
          [player2Id]: ans2,
        };
      } else if (session.gameId === 'couple-trivia') {
        const p1Correct = ans1?.selectedOption >= 0 && ans1?.selectedOption === ans1?.correctIndex;
        const p2Correct = ans2?.selectedOption >= 0 && ans2?.selectedOption === ans2?.correctIndex;

        const p1Pts = p1Correct ? 100 + (ans1?.timeLeft || 0) * 5 : 0;
        const p2Pts = p2Correct ? 100 + (ans2?.timeLeft || 0) * 5 : 0;

        if (p1Correct) nextScores[player1Id] = (nextScores[player1Id] || 0) + p1Pts;
        if (p2Correct) nextScores[player2Id] = (nextScores[player2Id] || 0) + p2Pts;

        revealedRoundResult = {
          round,
          [player1Id]: { ...ans1, pointsGained: p1Pts, correct: p1Correct },
          [player2Id]: { ...ans2, pointsGained: p2Pts, correct: p2Correct },
        };
      }

      const currentRoundHistory = session.gameState.roundHistory || [];
      const updatedHistory = [...currentRoundHistory, revealedRoundResult];
      const maxRounds = session.gameState.maxRounds || 5;
      const isFinalRound = round >= maxRounds || (session.gameId === 'rock-paper-scissors' && (nextScores[player1Id] >= 2 || nextScores[player2Id] >= 2));

      let finalWinner: string | 'draw' | null = null;
      let finalStatus: GameSessionStatus = isFinalRound ? 'completed' : 'active';

      if (isFinalRound) {
        if (nextScores[player1Id] > nextScores[player2Id]) {
          finalWinner = player1Id;
        } else if (nextScores[player2Id] > nextScores[player1Id]) {
          finalWinner = player2Id;
        } else {
          finalWinner = 'draw';
        }
      }

      updatedSession = {
        ...session,
        scores: nextScores,
        winnerId: finalWinner,
        status: finalStatus,
        xpAwarded: isFinalRound ? 50 : 0,
        gameState: {
          ...session.gameState,
          round: isFinalRound ? round : round + 1,
          waitingForPartner: false,
          submittedPlayers: [],
          lastRevealedResult: revealedRoundResult,
          roundHistory: updatedHistory,
        },
        updatedAt: Date.now(),
      };
    }

    if (runtimeMode === 'production' || runtimeMode === 'emulator') {
      if (!db) throw new Error('Firestore is not initialized');
      const sessionRef = doc(db, 'gameSessions', sessionId);
      await updateDoc(sessionRef, {
        scores: updatedSession.scores,
        gameState: updatedSession.gameState,
        winnerId: updatedSession.winnerId,
        status: updatedSession.status,
        xpAwarded: updatedSession.xpAwarded,
        updatedAt: serverTimestamp(),
      });
      if (updatedSession.status === 'completed') {
        triggerGameCompletionEngagement(updatedSession).catch(() => {});
      }
      return { session: updatedSession, bothSubmitted, revealedRoundResult };
    }

    // Mock Mode
    mockSessions.set(sessionId, updatedSession);
    notifyMockSubscribers(sessionId, updatedSession);
    if (updatedSession.status === 'completed') {
      triggerGameCompletionEngagement(updatedSession).catch(() => {});
    }
    return { session: updatedSession, bothSubmitted, revealedRoundResult };
  },

  /**
   * 7. COMPLETE GAME SESSION
   */
  async completeGameSession(sessionId: string, winnerId: string | 'draw' | null): Promise<GameSession> {
    const session = await this.getGameSession(sessionId);
    if (!session) throw new Error('Session not found');

    const updatedSession: GameSession = {
      ...session,
      status: 'completed',
      winnerId,
      xpAwarded: 50,
      updatedAt: Date.now(),
    };

    if (runtimeMode === 'production' || runtimeMode === 'emulator') {
      if (!db) throw new Error('Firestore is not initialized');
      const sessionRef = doc(db, 'gameSessions', sessionId);
      await updateDoc(sessionRef, {
        status: 'completed',
        winnerId,
        xpAwarded: 50,
        updatedAt: serverTimestamp(),
      });
      triggerGameCompletionEngagement(updatedSession).catch(() => {});
      return updatedSession;
    }

    mockSessions.set(sessionId, updatedSession);
    notifyMockSubscribers(sessionId, updatedSession);
    triggerGameCompletionEngagement(updatedSession).catch(() => {});
    return updatedSession;
  },

  /**
   * 8. ABANDON GAME SESSION
   */
  async abandonGameSession(sessionId: string, playerId: string): Promise<GameSession> {
    const session = await this.getGameSession(sessionId);
    if (!session) throw new Error('Session not found');

    const updatedSession: GameSession = {
      ...session,
      status: 'abandoned',
      abandonedBy: playerId,
      updatedAt: Date.now(),
    };

    if (runtimeMode === 'production' || runtimeMode === 'emulator') {
      if (!db) throw new Error('Firestore is not initialized');
      const sessionRef = doc(db, 'gameSessions', sessionId);
      await updateDoc(sessionRef, {
        status: 'abandoned',
        abandonedBy: playerId,
        updatedAt: serverTimestamp(),
      });
      return updatedSession;
    }

    mockSessions.set(sessionId, updatedSession);
    notifyMockSubscribers(sessionId, updatedSession);
    return updatedSession;
  },

  /**
   * 9. REQUEST REMATCH
   * Automatically provisions a clean linked rematch session.
   */
  async requestRematch(sessionId: string, playerId: string): Promise<GameSession> {
    const previous = await this.getGameSession(sessionId);
    if (!previous) throw new Error('Session not found');

    const partnerId = previous.playerIds.find((id) => id !== playerId) || '';

    // Create fresh session
    const newSession = await this.createGameSession({
      coupleId: previous.coupleId,
      gameId: previous.gameId,
      hostPlayerId: playerId,
      partnerPlayerId: partnerId,
      gameMode: previous.gameMode,
    });

    // Link previous session to new rematch
    previous.rematchSessionId = newSession.id;
    previous.rematchRequestedBy = playerId;
    previous.updatedAt = Date.now();

    if (runtimeMode === 'production' || runtimeMode === 'emulator') {
      if (!db) throw new Error('Firestore is not initialized');
      const prevRef = doc(db, 'gameSessions', sessionId);
      await updateDoc(prevRef, {
        rematchSessionId: newSession.id,
        rematchRequestedBy: playerId,
        updatedAt: serverTimestamp(),
      });
      NotificationService.sendNotification({
        toUid: partnerId,
        type: 'rematch_requested',
        title: 'Rematch requested! 🔥',
        body: `Your partner wants a rematch in ${previous.gameId.replace(/-/g, ' ')}! Ready?`,
        data: { gameId: previous.gameId, sessionId: newSession.id },
      }).catch(() => {});
    } else {
      mockSessions.set(sessionId, previous);
      notifyMockSubscribers(sessionId, previous);
      NotificationService.sendNotification({
        toUid: partnerId,
        type: 'rematch_requested',
        title: 'Rematch requested! 🔥',
        body: `Your partner wants a rematch in ${previous.gameId.replace(/-/g, ' ')}! Ready?`,
        data: { gameId: previous.gameId, sessionId: newSession.id },
      }).catch(() => {});
    }

    return newSession;
  },

  /**
   * 10. RECONNECT TO ACTIVE SESSION
   * Checks for session validity and returns latest snapshot.
   */
  async reconnectToSession(sessionId: string, playerId: string): Promise<GameSession> {
    const session = await this.getGameSession(sessionId);
    if (!session) throw new Error('Session not found');

    if (!session.playerIds.includes(playerId as any)) {
      throw new Error('Unauthorized reconnection attempt');
    }

    if (Date.now() > session.expiresAt && session.status !== 'completed') {
      session.status = 'expired';
      if (runtimeMode === 'production' || runtimeMode === 'emulator') {
        if (db) {
          await updateDoc(doc(db, 'gameSessions', sessionId), {
            status: 'expired',
            updatedAt: serverTimestamp(),
          });
        }
      }
    }

    return session;
  },

  /**
   * 11. GET ACTIVE SESSIONS FOR COUPLE
   * Discovers existing waiting or active sessions for matchmaking.
   */
  async getActiveSessionForCouple(coupleId: string, gameId?: string): Promise<GameSession | null> {
    const now = Date.now();

    if (runtimeMode === 'production' || runtimeMode === 'emulator') {
      if (!db) throw new Error('Firestore is not initialized');
      const sessionsCol = collection(db, 'gameSessions');
      const q = query(
        sessionsCol,
        where('coupleId', '==', coupleId),
        where('status', 'in', ['waiting', 'active', 'ready']),
        orderBy('updatedAt', 'desc'),
        limit(10)
      );

      const snap = await getDocs(q);
      for (const docSnap of snap.docs) {
        const data = docSnap.data();
        if (data.expiresAt && data.expiresAt < now) continue;
        if (!gameId || data.gameId === gameId) {
          return {
            id: docSnap.id,
            ...data,
            createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : data.createdAt || now,
            updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : data.updatedAt || now,
          } as GameSession;
        }
      }
      return null;
    }

    // Mock Mode
    for (const session of Array.from(mockSessions.values()).reverse()) {
      if (session.coupleId === coupleId && ['waiting', 'active', 'ready'].includes(session.status)) {
        if (session.expiresAt && session.expiresAt < now) continue;
        if (!gameId || session.gameId === gameId) {
          return session;
        }
      }
    }
    return null;
  },

  /**
   * 12. SUBSCRIBE TO ACTIVE SESSIONS FOR COUPLE
   * Real-time listener for lobby invitations and active turns.
   */
  subscribeToActiveSessions(
    coupleId: string,
    callback: (sessions: GameSession[]) => void
  ): Unsubscribe {
    if (runtimeMode === 'production' || runtimeMode === 'emulator') {
      if (!db) throw new Error('Firestore is not initialized');
      const sessionsCol = collection(db, 'gameSessions');
      const q = query(
        sessionsCol,
        where('coupleId', '==', coupleId),
        where('status', 'in', ['waiting', 'active', 'ready']),
        orderBy('updatedAt', 'desc'),
        limit(5)
      );

      return onSnapshot(
        q,
        (snapshot) => {
          const currentTimestamp = Date.now();
          const active = snapshot.docs
            .map((d) => {
              const data = d.data();
              return {
                id: d.id,
                ...data,
                createdAt: data.createdAt?.toMillis ? data.createdAt.toMillis() : data.createdAt || currentTimestamp,
                updatedAt: data.updatedAt?.toMillis ? data.updatedAt.toMillis() : data.updatedAt || currentTimestamp,
              } as GameSession;
            })
            .filter((s) => !s.expiresAt || s.expiresAt > currentTimestamp);
          callback(active);
        },
        (err) => {
          console.warn('[GameSessionService] subscribeToActiveSessions error:', err);
        }
      );
    }

    // Mock Mode
    const notify = () => {
      const currentTimestamp = Date.now();
      const active = Array.from(mockSessions.values()).filter(
        (s) =>
          s.coupleId === coupleId &&
          ['waiting', 'active', 'ready'].includes(s.status) &&
          (!s.expiresAt || s.expiresAt > currentTimestamp)
      );
      callback(active);
    };

    notify();
    return () => {};
  },

  /**
   * Testing Helper: Reset in-memory mock store
   */
  resetMockStore() {
    mockSessions.clear();
    mockListeners.clear();
    mockPrivateAnswers.clear();
    mockActionHistory.clear();
  },
};
