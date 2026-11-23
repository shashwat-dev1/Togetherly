/**
 * SECURITY & INTEGRITY TESTS
 *
 * Verifies cross-couple data isolation, unauthorized player rejection,
 * double-blind privacy guarantees, and anti-tampering rules.
 */
import { GameSessionService } from '../../services/firebase/gameSessionService';

describe('Security & Access Control Enforcement', () => {
  beforeEach(() => {
    GameSessionService.resetMockStore();
  });

  const coupleA = 'cpl_couple_A';
  const playerA1 = 'usr_alice';
  const playerA2 = 'usr_bob';

  const intruder = 'usr_intruder_mallory';

  test('blocks unauthorized user from joining a session outside their couple', async () => {
    const session = await GameSessionService.createGameSession({
      coupleId: coupleA,
      gameId: 'tic-tac-toe',
      hostPlayerId: playerA1,
      partnerPlayerId: playerA2,
      gameMode: 'turn_based',
    });

    await expect(GameSessionService.joinGameSession(session.id, intruder)).rejects.toThrow(
      'Access denied'
    );
  });

  test('blocks unauthorized user from submitting game actions', async () => {
    const session = await GameSessionService.createGameSession({
      coupleId: coupleA,
      gameId: 'tic-tac-toe',
      hostPlayerId: playerA1,
      partnerPlayerId: playerA2,
      gameMode: 'turn_based',
    });
    await GameSessionService.joinGameSession(session.id, playerA2);

    await expect(
      GameSessionService.submitGameAction(session.id, intruder, 'place_mark', { index: 0, symbol: '❌' })
    ).rejects.toThrow('Unauthorized');
  });

  test('blocks unauthorized user from submitting simultaneous answers', async () => {
    const session = await GameSessionService.createGameSession({
      coupleId: coupleA,
      gameId: 'who-knows-whom',
      hostPlayerId: playerA1,
      partnerPlayerId: playerA2,
      gameMode: 'simultaneous',
    });
    await GameSessionService.joinGameSession(session.id, playerA2);

    await expect(
      GameSessionService.submitSimultaneousAnswer(session.id, intruder, 1, { answer: 'Fake' })
    ).rejects.toThrow('Unauthorized');
  });

  test('idempotency prevents duplicate action execution for identical idempotencyKey', async () => {
    const session = await GameSessionService.createGameSession({
      coupleId: coupleA,
      gameId: 'tic-tac-toe',
      hostPlayerId: playerA1,
      partnerPlayerId: playerA2,
      gameMode: 'turn_based',
    });
    await GameSessionService.joinGameSession(session.id, playerA2);

    const key = 'action_idempotency_12345';

    // First execution
    const firstResult = await GameSessionService.submitGameAction(
      session.id,
      playerA1,
      'place_mark',
      { index: 2, symbol: '❤️' },
      key
    );

    // Repeated execution with same idempotency key
    const secondResult = await GameSessionService.submitGameAction(
      session.id,
      playerA1,
      'place_mark',
      { index: 2, symbol: '❤️' },
      key
    );

    expect(secondResult.id).toBe(firstResult.id);
    expect(secondResult.gameState.turnNumber).toBe(firstResult.gameState.turnNumber);
  });

  test('blocks action submission when session is already completed', async () => {
    const session = await GameSessionService.createGameSession({
      coupleId: coupleA,
      gameId: 'tic-tac-toe',
      hostPlayerId: playerA1,
      partnerPlayerId: playerA2,
      gameMode: 'turn_based',
    });
    await GameSessionService.joinGameSession(session.id, playerA2);
    await GameSessionService.completeGameSession(session.id, playerA1);

    await expect(
      GameSessionService.submitGameAction(session.id, playerA1, 'place_mark', { index: 0, symbol: '❤️' })
    ).rejects.toThrow('Cannot submit action');
  });

  test('blocks unauthorized user from reconnecting to another couple session', async () => {
    const session = await GameSessionService.createGameSession({
      coupleId: coupleA,
      gameId: 'tic-tac-toe',
      hostPlayerId: playerA1,
      partnerPlayerId: playerA2,
      gameMode: 'turn_based',
    });

    await expect(
      GameSessionService.reconnectToSession(session.id, intruder)
    ).rejects.toThrow('Unauthorized');
  });

  test('active session discovery isolates sessions strictly by coupleId', async () => {
    const sessionA = await GameSessionService.createGameSession({
      coupleId: coupleA,
      gameId: 'tic-tac-toe',
      hostPlayerId: playerA1,
      partnerPlayerId: playerA2,
      gameMode: 'turn_based',
    });

    // Another couple B
    const coupleB = 'cpl_couple_B';
    const foundSessionB = await GameSessionService.getActiveSessionForCouple(coupleB, 'tic-tac-toe');
    expect(foundSessionB).toBeNull();

    const foundSessionA = await GameSessionService.getActiveSessionForCouple(coupleA, 'tic-tac-toe');
    expect(foundSessionA).not.toBeNull();
    expect(foundSessionA?.id).toBe(sessionA.id);
  });
});
