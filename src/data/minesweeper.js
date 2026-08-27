export const DIFFICULTIES = {
  beginner: { id: "beginner", label: "Beginner", rows: 9, cols: 9, mines: 10 },
  intermediate: {
    id: "intermediate",
    label: "Intermediate",
    rows: 16,
    cols: 16,
    mines: 40,
  },
  expert: { id: "expert", label: "Expert", rows: 16, cols: 30, mines: 99 },
};

const NEIGHBORS = [
  [-1, -1],
  [-1, 0],
  [-1, 1],
  [0, -1],
  [0, 1],
  [1, -1],
  [1, 0],
  [1, 1],
];

export function createEmptyBoard(rows, cols) {
  return Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      mine: false,
      revealed: false,
      flagged: false,
      adjacent: 0,
      exploded: false,
      wrongFlag: false,
    }))
  );
}

export function cloneBoard(board) {
  return board.map((row) => row.map((cell) => ({ ...cell })));
}

function inBounds(rows, cols, r, c) {
  return r >= 0 && c >= 0 && r < rows && c < cols;
}

export function forEachNeighbor(rows, cols, row, col, fn) {
  for (const [dr, dc] of NEIGHBORS) {
    const r = row + dr;
    const c = col + dc;
    if (inBounds(rows, cols, r, c)) fn(r, c);
  }
}

export function placeMines(board, rows, cols, mineCount, safeRow, safeCol) {
  const next = cloneBoard(board);
  const forbidden = new Set([`${safeRow},${safeCol}`]);
  let placed = 0;
  const maxCells = rows * cols;

  while (placed < mineCount && placed < maxCells - 1) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);
    const key = `${r},${c}`;
    if (forbidden.has(key) || next[r][c].mine) continue;
    next[r][c].mine = true;
    placed += 1;
  }

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (next[r][c].mine) {
        next[r][c].adjacent = 0;
        continue;
      }
      let count = 0;
      forEachNeighbor(rows, cols, r, c, (nr, nc) => {
        if (next[nr][nc].mine) count += 1;
      });
      next[r][c].adjacent = count;
    }
  }

  return next;
}

export function revealFlood(board, rows, cols, startRow, startCol) {
  const next = cloneBoard(board);
  const stack = [[startRow, startCol]];

  while (stack.length) {
    const [row, col] = stack.pop();
    const cell = next[row][col];
    if (cell.revealed || cell.flagged) continue;
    cell.revealed = true;
    if (cell.adjacent !== 0 || cell.mine) continue;
    forEachNeighbor(rows, cols, row, col, (r, c) => {
      const neighbor = next[r][c];
      if (!neighbor.revealed && !neighbor.flagged) stack.push([r, c]);
    });
  }

  return next;
}

export function revealAllMines(board, explodedRow, explodedCol) {
  return board.map((row, r) =>
    row.map((cell, c) => {
      if (cell.flagged && !cell.mine) {
        return { ...cell, revealed: true, wrongFlag: true };
      }
      if (cell.mine) {
        return {
          ...cell,
          revealed: true,
          exploded: r === explodedRow && c === explodedCol,
        };
      }
      return cell;
    })
  );
}

export function flagRemainingMines(board) {
  return board.map((row) =>
    row.map((cell) =>
      cell.mine && !cell.flagged ? { ...cell, flagged: true } : cell
    )
  );
}

export function countFlags(board) {
  return board.reduce(
    (sum, row) => sum + row.filter((cell) => cell.flagged).length,
    0
  );
}

export function hasWon(board) {
  return board.every((row) =>
    row.every((cell) => (cell.mine ? !cell.revealed : cell.revealed))
  );
}

export function formatLcd(value) {
  const n = Math.max(-99, Math.min(999, value));
  if (n < 0) return `-${String(Math.abs(n)).padStart(2, "0")}`;
  return String(n).padStart(3, "0");
}
