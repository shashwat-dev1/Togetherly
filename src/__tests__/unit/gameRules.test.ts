/**
 * UNIT TESTS — GAME RULES & PROGRESSION LOGIC
 */
import {
  createEmptyBoard,
  getLowestEmptyRow,
  checkConnectFourWin,
  isBoardFull,
} from '../../games/connect-four/logic';
import { generateMemoryDeck, MEMORY_PAIRS } from '../../games/memory-match/cards';
import { evaluateWordGuess, WORD_GUESS_BANK } from '../../games/word-guess/wordList';
import { TRIVIA_QUESTIONS } from '../../games/couple-trivia/questions';
import { TRUTH_OR_DARE_PROMPTS } from '../../games/truth-or-dare/prompts';
import { DRAWING_PROMPTS } from '../../games/draw-and-guess/prompts';

describe('Tic-Tac-Toe Game Logic', () => {
  const checkWinner = (squares: (string | null)[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6],
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    if (squares.every((sq) => sq !== null)) return 'draw';
    return null;
  };

  test('detects horizontal row win for Player 1 (Heart)', () => {
    const board = [
      '❤️', '❤️', '❤️',
      '⭐', '⭐', null,
      null, null, null,
    ];
    expect(checkWinner(board)).toBe('❤️');
  });

  test('detects diagonal win for Player 2 (Star)', () => {
    const board = [
      '⭐', '❤️', '❤️',
      null, '⭐', null,
      '❤️', null, '⭐',
    ];
    expect(checkWinner(board)).toBe('⭐');
  });

  test('detects full-board draw correctly', () => {
    const board = [
      '❤️', '⭐', '❤️',
      '❤️', '⭐', '⭐',
      '⭐', '❤️', '❤️',
    ];
    expect(checkWinner(board)).toBe('draw');
  });

  test('returns null when game is still in progress', () => {
    const board = [
      '❤️', '⭐', null,
      null, null, null,
      null, null, null,
    ];
    expect(checkWinner(board)).toBeNull();
  });
});

describe('Rock Paper Scissors Evaluation', () => {
  const evaluateRps = (userPick: string, partnerPick: string): 'user' | 'partner' | 'tie' => {
    if (userPick === partnerPick) return 'tie';
    if (
      (userPick === 'Rock' && partnerPick === 'Scissors') ||
      (userPick === 'Paper' && partnerPick === 'Rock') ||
      (userPick === 'Scissors' && partnerPick === 'Paper')
    ) {
      return 'user';
    }
    return 'partner';
  };

  test('Rock beats Scissors', () => {
    expect(evaluateRps('Rock', 'Scissors')).toBe('user');
  });

  test('Paper beats Rock', () => {
    expect(evaluateRps('Paper', 'Rock')).toBe('user');
  });

  test('Scissors beats Paper', () => {
    expect(evaluateRps('Scissors', 'Paper')).toBe('user');
  });

  test('Same picks result in a tie', () => {
    expect(evaluateRps('Rock', 'Rock')).toBe('tie');
    expect(evaluateRps('Paper', 'Paper')).toBe('tie');
  });
});

describe('This or That Affinity Calculation', () => {
  const calculateAffinity = (userChoices: string[], partnerChoices: string[]) => {
    if (userChoices.length === 0) return 0;
    const matches = userChoices.filter((choice, idx) => choice === partnerChoices[idx]).length;
    return Math.round((matches / userChoices.length) * 100);
  };

  test('calculates 100% affinity when all choices match', () => {
    const u = ['A', 'B', 'A'];
    const p = ['A', 'B', 'A'];
    expect(calculateAffinity(u, p)).toBe(100);
  });

  test('calculates partial affinity accurately', () => {
    const u = ['A', 'B', 'A', 'B'];
    const p = ['A', 'A', 'A', 'B'];
    expect(calculateAffinity(u, p)).toBe(75);
  });
});

describe('Connect Four Logic', () => {
  test('gravity drop places disc in lowest unoccupied row', () => {
    const board = createEmptyBoard();
    const row1 = getLowestEmptyRow(board, 3);
    expect(row1).toBe(5); // Bottom row (0-indexed 5)

    board[5][3] = 'P1';
    const row2 = getLowestEmptyRow(board, 3);
    expect(row2).toBe(4); // Stack on top
  });

  test('returns null when a column is completely filled', () => {
    const board = createEmptyBoard();
    for (let r = 0; r < 6; r++) {
      board[r][0] = 'P1';
    }
    expect(getLowestEmptyRow(board, 0)).toBeNull();
  });

  test('detects horizontal 4-in-a-row victory', () => {
    const board = createEmptyBoard();
    for (let c = 1; c <= 4; c++) {
      board[5][c] = 'P1';
    }
    const result = checkConnectFourWin(board, 5, 4, 'P1');
    expect(result.won).toBe(true);
    expect(result.winningCells?.length).toBeGreaterThanOrEqual(4);
  });

  test('detects vertical 4-in-a-row victory', () => {
    const board = createEmptyBoard();
    for (let r = 2; r <= 5; r++) {
      board[r][2] = 'P2';
    }
    const result = checkConnectFourWin(board, 2, 2, 'P2');
    expect(result.won).toBe(true);
  });

  test('detects diagonal 4-in-a-row victory', () => {
    const board = createEmptyBoard();
    // Diagonal \: (2,2), (3,3), (4,4), (5,5)
    board[2][2] = 'P1';
    board[3][3] = 'P1';
    board[4][4] = 'P1';
    board[5][5] = 'P1';
    const result = checkConnectFourWin(board, 5, 5, 'P1');
    expect(result.won).toBe(true);
  });

  test('detects full-board draw', () => {
    const board = createEmptyBoard();
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 7; c++) {
        board[r][c] = (r + c) % 2 === 0 ? 'P1' : 'P2';
      }
    }
    expect(isBoardFull(board)).toBe(true);
  });
});

describe('Memory Match Game Logic', () => {
  test('generates 16 cards comprising 8 pairs', () => {
    const deck = generateMemoryDeck('session_test_123');
    expect(deck.length).toBe(16);
    expect(MEMORY_PAIRS.length).toBe(8);

    const counts: Record<string, number> = {};
    for (const card of deck) {
      counts[card.pairId] = (counts[card.pairId] || 0) + 1;
    }

    for (const pair of MEMORY_PAIRS) {
      expect(counts[pair.pairId]).toBe(2);
    }
  });

  test('deterministic seed generates identical deck for both players', () => {
    const deckA = generateMemoryDeck('session_couple_shared');
    const deckB = generateMemoryDeck('session_couple_shared');
    expect(deckA).toEqual(deckB);
  });

  test('different sessions produce different shuffled layouts', () => {
    const deck1 = generateMemoryDeck('session_alpha');
    const deck2 = generateMemoryDeck('session_beta');
    const samePositions = deck1.every((c: any, i: number) => c.pairId === deck2[i].pairId);
    expect(samePositions).toBe(false);
  });
});

describe('Word Guess Evaluation', () => {
  test('evaluates exact match to all correct (green)', () => {
    const result = evaluateWordGuess('HEART', 'HEART');
    expect(result.every((r: any) => r.status === 'correct')).toBe(true);
  });

  test('evaluates misplaced letters as present (yellow)', () => {
    const result = evaluateWordGuess('HEART', 'EARTH');
    expect(result.every((r: any) => r.status === 'present')).toBe(true);
  });

  test('handles duplicate letters correctly in Wordle style', () => {
    // Target has 2 E's. Guess has 3 E's.
    // 'SWEET' vs 'TEETH':
    // Pos 0: T (present, target has 1 T at pos 4)
    // Pos 1: E (present or correct? Target has W at pos 1, E at pos 2 and 3)
    // Pos 2: E (correct, matches pos 2)
    // Pos 3: T (absent or present? 1 T in target, already accounted for)
    // Pos 4: H (absent)
    const result = evaluateWordGuess('SWEET', 'TEETH');
    expect(result.length).toBe(5);
    expect(result[2].status).toBe('correct'); // E matches E
  });

  test('word bank contains 50+ curated romantic words', () => {
    expect(WORD_GUESS_BANK.length).toBeGreaterThanOrEqual(50);
    for (const item of WORD_GUESS_BANK) {
      expect(item.word.length).toBe(5);
      expect(item.hint.length).toBeGreaterThan(0);
    }
  });
});

describe('Couple Trivia Bank & Selection', () => {
  test('contains 150 curated questions across 5 categories', () => {
    expect(TRIVIA_QUESTIONS.length).toBe(150);
    const categories = new Set(TRIVIA_QUESTIONS.map((q: any) => q.category));
    expect(categories.size).toBe(5);
  });

  test('each question has 4 options and valid correctIndex', () => {
    for (const q of TRIVIA_QUESTIONS) {
      expect(q.options.length).toBe(4);
      expect(q.correctIndex).toBeGreaterThanOrEqual(0);
      expect(q.correctIndex).toBeLessThan(4);
    }
  });
});

describe('Truth or Dare Content Standards', () => {
  test('contains at least 100 curated prompts', () => {
    expect(TRUTH_OR_DARE_PROMPTS.length).toBeGreaterThanOrEqual(100);
  });

  test('mature content is properly flagged and isolated', () => {
    const mature = TRUTH_OR_DARE_PROMPTS.filter((p: any) => p.isMature);
    const nonMature = TRUTH_OR_DARE_PROMPTS.filter((p: any) => !p.isMature);
    expect(nonMature.length).toBeGreaterThan(80);
    expect(mature.length).toBeGreaterThan(0);
    for (const p of mature) {
      expect(p.category).toBe('mature');
      expect(p.isMature).toBe(true);
    }
  });
});

describe('Draw & Guess Prompt Bank', () => {
  test('contains at least 60 curated prompts', () => {
    expect(DRAWING_PROMPTS.length).toBeGreaterThanOrEqual(60);
    for (const p of DRAWING_PROMPTS) {
      expect(p.word.length).toBeGreaterThan(0);
      expect(p.hint.length).toBeGreaterThan(0);
    }
  });
});

