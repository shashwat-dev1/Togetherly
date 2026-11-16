/**
 * TOGETHERLY — CONNECT FOUR GAME LOGIC
 *
 * 7 columns x 6 rows board.
 * Gravity drop calculation, 4-in-a-row detection in 4 directions,
 * board fullness / draw detection.
 */

export const COLUMNS = 7;
export const ROWS = 6;

export type CellValue = string | null;
export type BoardGrid = CellValue[][]; // ROWS x COLUMNS

export function createEmptyBoard(): BoardGrid {
  return Array.from({ length: ROWS }, () => Array(COLUMNS).fill(null));
}

export function getLowestEmptyRow(board: BoardGrid, col: number): number | null {
  if (col < 0 || col >= COLUMNS) return null;
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r][col] === null) {
      return r;
    }
  }
  return null; // Column is full
}

export function checkConnectFourWin(
  board: BoardGrid,
  lastRow: number,
  lastCol: number,
  playerSymbol: string
): { won: boolean; winningCells?: [number, number][] } {
  const directions: [number, number][] = [
    [0, 1],  // Horizontal
    [1, 0],  // Vertical
    [1, 1],  // Diagonal \
    [1, -1], // Diagonal /
  ];

  for (const [dr, dc] of directions) {
    const matchedCells: [number, number][] = [[lastRow, lastCol]];

    // Check forward along direction
    let r = lastRow + dr;
    let c = lastCol + dc;
    while (r >= 0 && r < ROWS && c >= 0 && c < COLUMNS && board[r][c] === playerSymbol) {
      matchedCells.push([r, c]);
      r += dr;
      c += dc;
    }

    // Check backward along opposite direction
    r = lastRow - dr;
    c = lastCol - dc;
    while (r >= 0 && r < ROWS && c >= 0 && c < COLUMNS && board[r][c] === playerSymbol) {
      matchedCells.push([r, c]);
      r -= dr;
      c -= dc;
    }

    if (matchedCells.length >= 4) {
      return { won: true, winningCells: matchedCells };
    }
  }

  return { won: false };
}

export function isBoardFull(board: BoardGrid): boolean {
  for (let c = 0; c < COLUMNS; c++) {
    if (board[0][c] === null) return false;
  }
  return true;
}
