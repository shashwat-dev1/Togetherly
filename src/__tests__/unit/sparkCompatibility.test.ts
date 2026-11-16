/**
 * SPARK COMPATIBILITY & IDEMPOTENCY TEST SUITE
 *
 * Verifies that all game and progression operations execute reliably
 * and idempotently without requiring Cloud Functions or paid backend services.
 */
import { GameSessionService } from '@/services/firebase/gameSessionService';
import { XPProgressionService } from '@/services/engagement/xpProgressionService';
import { FeedbackService } from '@/services/feedback/feedbackService';

describe('Firebase Spark-Only Compatibility & Idempotency', () => {
  beforeEach(() => {
    GameSessionService.resetMockStore();
    XPProgressionService.clearMockStore();
    FeedbackService.clearMockSubmissions();
  });

  const coupleId = 'cpl_spark_test_123';
  const playerA = 'usr_alex_spark';
  const playerB = 'usr_sam_spark';

  describe('1. XP Award Idempotency (Spark Plan Protection)', () => {
    test('awards XP once and prevents duplicate awards for identical referenceId', async () => {
      const referenceId = 'session_match_999';

      // First call: Should award 30 XP
      const firstResult = await XPProgressionService.awardXP(
        coupleId,
        30,
        'game_completion',
        referenceId,
        'tic-tac-toe'
      );

      expect(firstResult.newXP).toBeGreaterThanOrEqual(30);

      const xpAfterFirst = firstResult.newXP;

      // Second call with same referenceId (e.g. network retry or duplicate trigger)
      const secondResult = await XPProgressionService.awardXP(
        coupleId,
        30,
        'game_completion',
        referenceId,
        'tic-tac-toe'
      );

      // Should return existing XP without adding another 30 XP!
      expect(secondResult.newXP).toBe(xpAfterFirst);
    });

    test('rejects zero or negative XP awards', async () => {
      await expect(
        XPProgressionService.awardXP(coupleId, 0, 'daily_challenge', 'ch_1')
      ).rejects.toThrow('XP award amount must be greater than zero');

      await expect(
        XPProgressionService.awardXP(coupleId, -50, 'game_completion', 'sess_1')
      ).rejects.toThrow('XP award amount must be greater than zero');
    });
  });

  describe('2. Spark Simultaneous Double-Blind Reveal Protocol', () => {
    test('Partner A answer remains hidden until Partner B submits (Who Knows Whom Better?)', async () => {
      const session = await GameSessionService.createGameSession({
        coupleId,
        gameId: 'who-knows-whom',
        hostPlayerId: playerA,
        partnerPlayerId: playerB,
        gameMode: 'simultaneous',
      });
      await GameSessionService.joinGameSession(session.id, playerB);

      // 1. Partner A submits
      const resA = await GameSessionService.submitSimultaneousAnswer(
        session.id,
        playerA,
        1,
        { answer: 'Pasta', guessForPartner: 'Pizza' }
      );

      expect(resA.bothSubmitted).toBe(false);
      expect(resA.revealedRoundResult).toBeFalsy();
      expect(resA.session.gameState.waitingForPartner).toBe(true);

      // 2. Partner B submits
      const resB = await GameSessionService.submitSimultaneousAnswer(
        session.id,
        playerB,
        1,
        { answer: 'Pizza', guessForPartner: 'Pasta' }
      );

      expect(resB.bothSubmitted).toBe(true);
      expect(resB.revealedRoundResult).toBeDefined();
      expect(resB.revealedRoundResult[playerA].correct).toBe(true); // Alex guessed Pizza, Sam answered Pizza
      expect(resB.revealedRoundResult[playerB].correct).toBe(true); // Sam guessed Pasta, Alex answered Pasta
      expect(resB.session.scores[playerA]).toBe(1);
      expect(resB.session.scores[playerB]).toBe(1);
    });

    test('Spark simultaneous reveal works for This or That preferences', async () => {
      const session = await GameSessionService.createGameSession({
        coupleId,
        gameId: 'this-or-that',
        hostPlayerId: playerA,
        partnerPlayerId: playerB,
        gameMode: 'simultaneous',
      });
      await GameSessionService.joinGameSession(session.id, playerB);

      // Player A picks "Option A"
      await GameSessionService.submitSimultaneousAnswer(session.id, playerA, 1, 'Option A');

      // Player B picks "Option A" (Mutual pick)
      const resB = await GameSessionService.submitSimultaneousAnswer(session.id, playerB, 1, 'Option A');

      expect(resB.bothSubmitted).toBe(true);
      expect(resB.revealedRoundResult.matched).toBe(true);
      expect(resB.session.scores[playerA]).toBe(1);
      expect(resB.session.scores[playerB]).toBe(1);
    });

    test('Spark simultaneous reveal works for Rock Paper Scissors', async () => {
      const session = await GameSessionService.createGameSession({
        coupleId,
        gameId: 'rock-paper-scissors',
        hostPlayerId: playerA,
        partnerPlayerId: playerB,
        gameMode: 'simultaneous',
      });
      await GameSessionService.joinGameSession(session.id, playerB);

      // Player A picks Rock
      await GameSessionService.submitSimultaneousAnswer(session.id, playerA, 1, 'Rock');

      // Player B picks Scissors -> Player A wins round
      const resB = await GameSessionService.submitSimultaneousAnswer(session.id, playerB, 1, 'Scissors');

      expect(resB.bothSubmitted).toBe(true);
      expect(resB.revealedRoundResult.winner).toBe(playerA);
      expect(resB.session.scores[playerA]).toBe(1);
      expect(resB.session.scores[playerB]).toBe(0);
    });
  });

  describe('3. Spark Turn-Based Operations & Move Validation', () => {
    test('enforces alternating turns in Tic-Tac-Toe', async () => {
      const session = await GameSessionService.createGameSession({
        coupleId,
        gameId: 'tic-tac-toe',
        hostPlayerId: playerA,
        partnerPlayerId: playerB,
        gameMode: 'turn_based',
      });
      await GameSessionService.joinGameSession(session.id, playerB);

      // Player A moves (index 4)
      const updated1 = await GameSessionService.submitGameAction(session.id, playerA, 'place_mark', {
        index: 4,
        symbol: '❌',
      });

      expect(updated1.currentTurn).toBe(playerB);

      // Player A tries to move again out of turn -> rejected
      await expect(
        GameSessionService.submitGameAction(session.id, playerA, 'place_mark', {
          index: 0,
          symbol: '❌',
        })
      ).rejects.toThrow('Invalid turn');

      // Player B moves (index 0) -> accepted
      const updated2 = await GameSessionService.submitGameAction(session.id, playerB, 'place_mark', {
        index: 0,
        symbol: '⭕',
      });

      expect(updated2.currentTurn).toBe(playerA);
    });
  });

  describe('4. Spark In-App Feedback Submission', () => {
    test('successfully stores in-app feedback without Cloud Functions', async () => {
      const submission = await FeedbackService.submitFeedback({
        userId: playerA,
        userDisplayName: 'Alex',
        coupleId,
        category: 'sync_problem',
        description: 'Notice slight delay when revealing Round 3.',
        gameId: 'who-knows-whom',
      });

      expect(submission.id).toBeDefined();
      expect(submission.category).toBe('sync_problem');
      expect(submission.appVersion).toBe('1.0.0-pilot');
    });
  });
});
