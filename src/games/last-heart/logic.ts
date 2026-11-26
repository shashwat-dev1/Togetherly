import type { GameSession } from '@/types';

export const STARTING_HEARTS = 15;

export function takeHearts(session: GameSession, playerId: string, count: unknown): GameSession {
  const remaining = session.gameState.remaining;
  if (session.gameId !== 'last-heart' || session.status !== 'active' ||
    session.currentTurn !== playerId || !session.playerIds.includes(playerId)) {
    throw new Error('Wait for your next turn.');
  }
  if (typeof count !== 'number' || !Number.isInteger(count) || count < 1 || count > 3 || count > remaining) {
    throw new Error('Choose between one and three available hearts.');
  }
  const next = remaining - count;
  const won = next === 0;
  return {
    ...session,
    gameState: { ...session.gameState, remaining: next, turnNumber: session.gameState.turnNumber + 1 },
    currentTurn: won ? playerId : session.playerIds.find((uid) => uid !== playerId),
    scores: { ...session.scores, [playerId]: won ? 1 : 0 },
    status: won ? 'completed' : 'active',
    winnerId: won ? playerId : null,
    xpAwarded: won ? 30 : 0,
    updatedAt: Date.now(),
  };
}
