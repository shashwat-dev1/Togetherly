/**
 * UNIT TESTS — GAME RULES & PROGRESSION LOGIC
 */
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

