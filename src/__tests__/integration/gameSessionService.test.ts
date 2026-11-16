/**
 * INTEGRATION TESTS — MULTIPLAYER GAME SESSION ENGINE
 *
 * Verifies full session lifecycle, real-time sync, turn alternation,
 * double-blind simultaneous reveal, rematch, and reconnection.
 */
import { GameSessionService } from '../../services/firebase/gameSessionService';

describe('Multiplayer Session Engine — Integration Suite', () => {
  beforeEach(() => {
    GameSessionService.resetMockStore();
  });

  const coupleId = 'cpl_test_123';
  const playerA = 'usr_alex_1';
  const playerB = 'usr_sam_2';

  test('creates session with status "waiting" and host marked as ready', async () => {
    const session = await GameSessionService.createGameSession({
      coupleId,
      gameId: 'tic-tac-toe',
      hostPlayerId: playerA,
      partnerPlayerId: playerB,
      gameMode: 'turn_based',
    });

    expect(session.id).toBeDefined();
    expect(session.status).toBe('waiting');
    expect(session.readyPlayers).toContain(playerA);
    expect(session.playerIds).toEqual([playerA, playerB]);
    expect(session.currentTurn).toBe(playerA);
  });

  test('joining session transitions status to "active" when both players are ready', async () => {
    const session = await GameSessionService.createGameSession({
      coupleId,
      gameId: 'tic-tac-toe',
      hostPlayerId: playerA,
      partnerPlayerId: playerB,
      gameMode: 'turn_based',
    });

    const activeSession = await GameSessionService.joinGameSession(session.id, playerB);
    expect(activeSession.readyPlayers).toContain(playerA);
    expect(activeSession.readyPlayers).toContain(playerB);
    expect(activeSession.status).toBe('active');
  });

  test('submitting a valid turn updates board state and alternates turn to partner', async () => {
    const session = await GameSessionService.createGameSession({
      coupleId,
      gameId: 'tic-tac-toe',
      hostPlayerId: playerA,
      partnerPlayerId: playerB,
      gameMode: 'turn_based',
    });
    await GameSessionService.joinGameSession(session.id, playerB);

    // Player A moves at cell 0
    const updated = await GameSessionService.submitGameAction(
      session.id,
      playerA,
      'place_mark',
      { index: 0, symbol: '❤️' },
      'idem_key_1'
    );

    expect(updated.gameState.board[0]).toBe('❤️');
    expect(updated.currentTurn).toBe(playerB);
  });

  test('rejects move out of turn for turn-based games', async () => {
    const session = await GameSessionService.createGameSession({
      coupleId,
      gameId: 'tic-tac-toe',
      hostPlayerId: playerA,
      partnerPlayerId: playerB,
      gameMode: 'turn_based',
    });
    await GameSessionService.joinGameSession(session.id, playerB);

    // Player B attempts to move when it is Player A's turn
    await expect(
      GameSessionService.submitGameAction(session.id, playerB, 'place_mark', { index: 1, symbol: '⭐' })
    ).rejects.toThrow('Invalid turn');
  });

  test('double-blind simultaneous submission: hides answer until BOTH submit', async () => {
    const session = await GameSessionService.createGameSession({
      coupleId,
      gameId: 'who-knows-whom',
      hostPlayerId: playerA,
      partnerPlayerId: playerB,
      gameMode: 'simultaneous',
    });
    await GameSessionService.joinGameSession(session.id, playerB);

    // Step 1: Player A submits first
    const resA = await GameSessionService.submitSimultaneousAnswer(session.id, playerA, 1, {
      answer: 'Sushi',
      guessForPartner: 'Pizza',
    });

    expect(resA.bothSubmitted).toBe(false);
    expect(resA.revealedRoundResult).toBeNull();
    expect(resA.session.gameState.waitingForPartner).toBe(true);

    // Step 2: Player B submits second
    const resB = await GameSessionService.submitSimultaneousAnswer(session.id, playerB, 1, {
      answer: 'Pizza',
      guessForPartner: 'Sushi',
    });

    expect(resB.bothSubmitted).toBe(true);
    expect(resB.revealedRoundResult).toBeDefined();
    // Both guessed correctly!
    expect(resB.revealedRoundResult[playerA].correct).toBe(true);
    expect(resB.revealedRoundResult[playerB].correct).toBe(true);
    expect(resB.session.scores[playerA]).toBe(1);
    expect(resB.session.scores[playerB]).toBe(1);
  });

  test('creates linked rematch session and preserves previous session record', async () => {
    const session = await GameSessionService.createGameSession({
      coupleId,
      gameId: 'tic-tac-toe',
      hostPlayerId: playerA,
      partnerPlayerId: playerB,
      gameMode: 'turn_based',
    });

    const rematch = await GameSessionService.requestRematch(session.id, playerA);

    expect(rematch.id).toBeDefined();
    expect(rematch.id).not.toBe(session.id);
    expect(rematch.coupleId).toBe(coupleId);

    const previousUpdated = await GameSessionService.getGameSession(session.id);
    expect(previousUpdated?.rematchSessionId).toBe(rematch.id);
    expect(previousUpdated?.rematchRequestedBy).toBe(playerA);
  });

  test('reconnects to session and restores existing state without reset', async () => {
    const session = await GameSessionService.createGameSession({
      coupleId,
      gameId: 'tic-tac-toe',
      hostPlayerId: playerA,
      partnerPlayerId: playerB,
      gameMode: 'turn_based',
    });
    await GameSessionService.joinGameSession(session.id, playerB);
    await GameSessionService.submitGameAction(session.id, playerA, 'place_mark', { index: 4, symbol: '❤️' });

    // Client reconnects
    const reconnected = await GameSessionService.reconnectToSession(session.id, playerB);
    expect(reconnected.id).toBe(session.id);
    expect(reconnected.gameState.board[4]).toBe('❤️');
    expect(reconnected.status).toBe('active');
  });
});
