import Phaser from 'phaser';

export interface SudokuCell {
  value: number;
  solved: boolean;
  solveAlpha: number;
  flashTimer: number;
}

export interface SudokuRowFlash {
  index: number;
  type: 'row' | 'col';
  alpha: number;
}

export interface SudokuState {
  grid: SudokuCell[][];
  visited: boolean[][];
  rowFlashes: SudokuRowFlash[];
  solvedRows: boolean[];
  solvedCols: boolean[];
  totalSolved: number;
  pulsePhase: number;
}

const SUDOKU_GRID = 20;
const BLOCK_SIZE = 4;

function generateSudokuNumbers(): number[][] {
  const grid: number[][] = [];
  for (let row = 0; row < SUDOKU_GRID; row++) {
    grid[row] = [];
    for (let col = 0; col < SUDOKU_GRID; col++) {
      const blockRow = Math.floor(row / BLOCK_SIZE);
      const blockCol = Math.floor(col / BLOCK_SIZE);
      const inBlockRow = row % BLOCK_SIZE;
      const inBlockCol = col % BLOCK_SIZE;
      const val = ((blockRow * BLOCK_SIZE + inBlockRow + blockCol * 2 + inBlockCol) % 9) + 1;
      grid[row][col] = val;
    }
  }
  return grid;
}

export function createSudokuState(): SudokuState {
  const numbers = generateSudokuNumbers();
  const grid: SudokuCell[][] = [];
  const visited: boolean[][] = [];

  for (let r = 0; r < SUDOKU_GRID; r++) {
    grid[r] = [];
    visited[r] = [];
    for (let c = 0; c < SUDOKU_GRID; c++) {
      grid[r][c] = {
        value: numbers[r][c],
        solved: false,
        solveAlpha: 0,
        flashTimer: 0,
      };
      visited[r][c] = false;
    }
  }

  return {
    grid,
    visited,
    rowFlashes: [],
    solvedRows: new Array(SUDOKU_GRID).fill(false),
    solvedCols: new Array(SUDOKU_GRID).fill(false),
    totalSolved: 0,
    pulsePhase: 0,
  };
}

export function updateSudokuVisited(
  state: SudokuState,
  snake: { x: number; y: number }[]
): SudokuState {
  let changed = false;
  const visited = state.visited.map(row => [...row]);
  const grid = state.grid.map(row => row.map(cell => ({ ...cell })));
  let totalSolved = state.totalSolved;

  for (const seg of snake) {
    const r = seg.y;
    const c = seg.x;
    if (r >= 0 && r < SUDOKU_GRID && c >= 0 && c < SUDOKU_GRID && !visited[r][c]) {
      visited[r][c] = true;
      grid[r][c].solved = true;
      grid[r][c].flashTimer = 1.0;
      totalSolved++;
      changed = true;
    }
  }

  if (!changed) return state;

  return { ...state, grid, visited, totalSolved };
}

function checkLineCompletion(
  visited: boolean[][],
  solvedRows: boolean[],
  solvedCols: boolean[]
): { newFlashes: SudokuRowFlash[]; solvedRows: boolean[]; solvedCols: boolean[] } {
  const newFlashes: SudokuRowFlash[] = [];
  const updatedRows = [...solvedRows];
  const updatedCols = [...solvedCols];

  for (let r = 0; r < SUDOKU_GRID; r++) {
    if (updatedRows[r]) continue;
    const complete = visited[r].every(v => v);
    if (complete) {
      updatedRows[r] = true;
      newFlashes.push({ index: r, type: 'row', alpha: 1.0 });
    }
  }

  for (let c = 0; c < SUDOKU_GRID; c++) {
    if (updatedCols[c]) continue;
    let complete = true;
    for (let r = 0; r < SUDOKU_GRID; r++) {
      if (!visited[r][c]) { complete = false; break; }
    }
    if (complete) {
      updatedCols[c] = true;
      newFlashes.push({ index: c, type: 'col', alpha: 1.0 });
    }
  }

  return { newFlashes, solvedRows: updatedRows, solvedCols: updatedCols };
}

export function updateSudokuEffects(state: SudokuState): SudokuState {
  const grid = state.grid.map(row => row.map(cell => {
    const solveAlpha = cell.solved
      ? Math.min(1, cell.solveAlpha + 0.05)
      : cell.solveAlpha;
    const flashTimer = Math.max(0, cell.flashTimer - 0.03);
    return { ...cell, solveAlpha, flashTimer };
  }));

  const rowFlashes = state.rowFlashes
    .map(f => ({ ...f, alpha: f.alpha - 0.02 }))
    .filter(f => f.alpha > 0);

  const { newFlashes, solvedRows, solvedCols } =
    checkLineCompletion(state.visited, state.solvedRows, state.solvedCols);

  return {
    ...state,
    grid,
    rowFlashes: [...rowFlashes, ...newFlashes],
    solvedRows,
    solvedCols,
    pulsePhase: state.pulsePhase + 0.04,
  };
}

export function resetSudokuVisited(state: SudokuState): SudokuState {
  return createSudokuState();
}

const DIGIT_COLOR_UNSOLVED = 0x1a3a4a;
const DIGIT_COLOR_SOLVED = 0x44ddff;
const FLASH_COLOR = 0x44ddff;
const BLOCK_BORDER_COLOR = 0x2a5a6a;

export function drawSudokuGrid(
  g: Phaser.GameObjects.Graphics,
  state: SudokuState,
  cellSize: number,
  gridSize: number,
  frameCount: number,
  drawDigitFn: (g: Phaser.GameObjects.Graphics, digit: string, x: number, y: number, size: number) => void
): void {
  const pulse = Math.sin(state.pulsePhase) * 0.3 + 0.7;

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const cell = state.grid[r][c];
      const cx = c * cellSize + cellSize / 2;
      const cy = r * cellSize + cellSize / 2;

      if (cell.solved) {
        const solvedAlpha = cell.solveAlpha * 0.12;
        g.fillStyle(DIGIT_COLOR_SOLVED, solvedAlpha);
        g.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
      }

      if (cell.flashTimer > 0) {
        g.fillStyle(FLASH_COLOR, cell.flashTimer * 0.25);
        g.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
      }

      const digitSize = 6;
      if (cell.solved) {
        const alpha = cell.solveAlpha * 0.7 * pulse;
        g.fillStyle(DIGIT_COLOR_SOLVED, alpha);
        drawDigitFn(g, String(cell.value), cx, cy, digitSize);
      } else {
        const unsolvedPulse = 0.08 + Math.sin(frameCount * 0.02 + r * 0.3 + c * 0.5) * 0.03;
        g.fillStyle(DIGIT_COLOR_UNSOLVED, unsolvedPulse);
        drawDigitFn(g, String(cell.value), cx, cy, digitSize);
      }
    }
  }

  for (let i = BLOCK_SIZE; i < gridSize; i += BLOCK_SIZE) {
    const pos = i * cellSize;
    const blockAlpha = 0.06 + Math.sin(frameCount * 0.015 + i) * 0.02;
    g.lineStyle(1, BLOCK_BORDER_COLOR, blockAlpha);
    g.lineBetween(pos, 0, pos, gridSize * cellSize);
    g.lineBetween(0, pos, gridSize * cellSize, pos);
  }

  for (const flash of state.rowFlashes) {
    if (flash.type === 'row') {
      const y = flash.index * cellSize;
      g.fillStyle(FLASH_COLOR, flash.alpha * 0.3);
      g.fillRect(0, y, gridSize * cellSize, cellSize);
      g.lineStyle(2, FLASH_COLOR, flash.alpha * 0.6);
      g.lineBetween(0, y, gridSize * cellSize, y);
      g.lineBetween(0, y + cellSize, gridSize * cellSize, y + cellSize);
    } else {
      const x = flash.index * cellSize;
      g.fillStyle(FLASH_COLOR, flash.alpha * 0.3);
      g.fillRect(x, 0, cellSize, gridSize * cellSize);
      g.lineStyle(2, FLASH_COLOR, flash.alpha * 0.6);
      g.lineBetween(x, 0, x, gridSize * cellSize);
      g.lineBetween(x + cellSize, 0, x + cellSize, gridSize * cellSize);
    }
  }

  const solvedCount = state.totalSolved;
  const totalCells = gridSize * gridSize;
  if (solvedCount > 0 && solvedCount < totalCells) {
    const pct = Math.round((solvedCount / totalCells) * 100);
    const barWidth = 60;
    const barHeight = 4;
    const barX = gridSize * cellSize - barWidth - 6;
    const barY = gridSize * cellSize - barHeight - 6;
    g.fillStyle(0x000000, 0.3);
    g.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);
    g.fillStyle(DIGIT_COLOR_UNSOLVED, 0.3);
    g.fillRect(barX, barY, barWidth, barHeight);
    g.fillStyle(DIGIT_COLOR_SOLVED, 0.5);
    g.fillRect(barX, barY, barWidth * (pct / 100), barHeight);
  }
}
