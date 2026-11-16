/**
 * TOGETHERLY — MULTIPLAYER GAME SESSION HOOK
 *
 * Provides real-time reactive binding to an active multiplayer game session
 * with connection status tracking, error handling, and listener cleanup.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { GameSession } from '@/types';
import { GameSessionService } from '@/services/firebase/gameSessionService';

export type ConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'error';

interface UseGameSessionResult {
  session: GameSession | null;
  connectionState: ConnectionState;
  error: string | null;
  submitAction: (actionType: string, payload: Record<string, any>, idempotencyKey?: string) => Promise<void>;
  submitAnswer: (round: number, answer: any) => Promise<void>;
  joinSession: () => Promise<void>;
  requestRematch: () => Promise<GameSession>;
  abandonSession: () => Promise<void>;
  retryConnection: () => void;
}

export function useGameSession(sessionId: string | undefined, currentUserId: string | undefined): UseGameSessionResult {
  const [session, setSession] = useState<GameSession | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>(sessionId ? 'connecting' : 'error');
  const [error, setError] = useState<string | null>(sessionId ? null : 'No session ID provided');

  const retryTimeoutRef = useRef<any>(null);
  const backoffRef = useRef<number>(1000);
  const connectRef = useRef<() => void>(() => {});

  const connect = useCallback(() => {
    if (!sessionId) {
      return () => {};
    }

    const unsubscribe = GameSessionService.subscribeToGameSession(
      sessionId,
      (updatedSession) => {
        setSession(updatedSession);
        setConnectionState('connected');
        setError(null);
        backoffRef.current = 1000; // Reset backoff on success
      },
      (err) => {
        console.warn('[useGameSession] Listener error:', err);
        setConnectionState('reconnecting');
        setError('Connection lost. Reconnecting...');

        // Exponential backoff reconnect
        if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = setTimeout(() => {
          backoffRef.current = Math.min(backoffRef.current * 1.5, 10000);
          connectRef.current();
        }, backoffRef.current);
      }
    );

    return unsubscribe;
  }, [sessionId]);

  useEffect(() => {
    connectRef.current = connect;
    const unsub = connect();
    return () => {
      unsub();
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, [connect]);

  const joinSession = async () => {
    if (!sessionId || !currentUserId) return;
    try {
      const updated = await GameSessionService.joinGameSession(sessionId, currentUserId);
      setSession(updated);
    } catch (err: any) {
      setError(err.message || 'Failed to join session');
    }
  };

  const submitAction = async (actionType: string, payload: Record<string, any>, idempotencyKey?: string) => {
    if (!sessionId || !currentUserId) return;
    try {
      await GameSessionService.submitGameAction(sessionId, currentUserId, actionType, payload, idempotencyKey);
    } catch (err: any) {
      setError(err.message || 'Failed to submit action');
      throw err;
    }
  };

  const submitAnswer = async (round: number, answer: any) => {
    if (!sessionId || !currentUserId) return;
    try {
      const res = await GameSessionService.submitSimultaneousAnswer(sessionId, currentUserId, round, answer);
      setSession(res.session);
    } catch (err: any) {
      setError(err.message || 'Failed to submit answer');
      throw err;
    }
  };

  const requestRematch = async (): Promise<GameSession> => {
    if (!sessionId || !currentUserId) throw new Error('Invalid state');
    try {
      const newSession = await GameSessionService.requestRematch(sessionId, currentUserId);
      return newSession;
    } catch (err: any) {
      setError(err.message || 'Failed to request rematch');
      throw err;
    }
  };

  const abandonSession = async () => {
    if (!sessionId || !currentUserId) return;
    try {
      await GameSessionService.abandonGameSession(sessionId, currentUserId);
    } catch (err: any) {
      setError(err.message || 'Failed to abandon session');
    }
  };

  const retryConnection = () => {
    setConnectionState('connecting');
    setError(null);
    backoffRef.current = 1000;
    connect();
  };

  return {
    session,
    connectionState,
    error,
    submitAction,
    submitAnswer,
    joinSession,
    requestRematch,
    abandonSession,
    retryConnection,
  };
}
