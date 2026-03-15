import Phaser from 'phaser';

const BOARD_COLS = 10;
const BOARD_ROWS = 20;
const BLOCK_SIZE = 20;
const BOARD_WIDTH = BOARD_COLS * BLOCK_SIZE;
const BOARD_HEIGHT = BOARD_ROWS * BLOCK_SIZE;
const FALL_SPEED = 1.2;
const FAST_FALL_SPEED = 4;
const LOCK_DELAY = 30;
const LINE_CLEAR_FLASH_DURATION = 28;
const MAX_LANDED_BLOCKS = 120;

type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'L' | 'J';

interface Block {
  col: number;
  row: number;
}

const TETROMINO_COLORS: Record<TetrominoType, number> = {
  I: 0x00e8ff,
  O: 0xffdd33,
  T: 0xaa44ff,
  S: 0x44ff66,
  Z: 0xff4444,
  L: 0xff8833,
  J: 0x3388ff,
};

const TETROMINO_SHAPES: Record<TetrominoType, number[][]> = {
  I: [[0, 0], [1, 0], [2, 0], [3, 0]],
  O: [[0, 0], [1, 0], [0, 1], [1, 1]],
  T: [[0, 0], [1, 0], [2, 0], [1, 1]],
  S: [[1, 0], [2, 0], [0, 1], [1, 1]],
  Z: [[0, 0], [1, 0], [1, 1], [2, 1]],
  L: [[0, 0], [1, 0], [2, 0], [2, 1]],
  J: [[0, 0], [1, 0], [2, 0], [0, 1]],
};

const ALL_TYPES: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'L', 'J'];

interface FallingPiece {
  type: TetrominoType;
  blocks: Block[];
  y: number;
  targetRow: number;
  speed: number;
  lockTimer: number;
  landed: boolean;
}

interface LandedBlock {
  col: number;
  row: number;
  color: number;
  alpha: number;
  flash: number;
}

interface LineClearEffect {
  row: number;
  timer: number;
  maxTimer: number;
}

export interface TetrisRainState {
  falling: FallingPiece[];
  landed: LandedBlock[];
  grid: (number | null)[][];
  lineClearEffects: LineClearEffect[];
  offsetX: number;
  offsetY: number;
  spawnQueue: number;
  boardAlpha: number;
}

export function createTetrisRainState(): TetrisRainState {
  const grid: (number | null)[][] = [];
  for (let r = 0; r < BOARD_ROWS; r++) {
    grid.push(new Array(BOARD_COLS).fill(null));
  }
  return {
    falling: [],
    landed: [],
    grid,
    lineClearEffects: [],
    offsetX: 0,
    offsetY: 0,
    spawnQueue: 0,
    boardAlpha: 0.35,
  };
}

function randomType(): TetrominoType {
  return ALL_TYPES[Math.floor(Math.random() * ALL_TYPES.length)];
}

function findLandingRow(grid: (number | null)[][], blocks: Block[]): number {
  let maxRow = 0;
  for (const block of blocks) {
    let row = 0;
    while (row < BOARD_ROWS - 1) {
      const nextRow = row + 1;
      if (grid[nextRow][block.col] !== null) break;
      row = nextRow;
    }
    const offset = row - block.row;
    if (blocks.indexOf(block) === 0 || offset < maxRow) {
      maxRow = offset;
    }
  }
  return maxRow;
}

function spawnPiece(grid: (number | null)[][]): FallingPiece {
  const type = randomType();
  const shape = TETROMINO_SHAPES[type];
  const col = Math.floor(Math.random() * (BOARD_COLS - 3));
  const blocks: Block[] = shape.map(([dc, dr]) => ({ col: col + dc, row: dr }));

  const targetRow = findLandingRow(grid, blocks);

  return {
    type,
    blocks,
    y: -2,
    targetRow,
    speed: FALL_SPEED + Math.random() * 0.5,
    lockTimer: 0,
    landed: false,
  };
}

export function spawnTetrisPiece(state: TetrisRainState, count: number): void {
  state.spawnQueue += count;
}

export function updateTetrisRain(state: TetrisRainState): void {
  if (state.spawnQueue > 0 && state.falling.length < 4) {
    state.falling.push(spawnPiece(state.grid));
    state.spawnQueue--;
  }

  for (let i = state.falling.length - 1; i >= 0; i--) {
    const piece = state.falling[i];
    if (piece.landed) continue;

    const maxBlockRow = Math.max(...piece.blocks.map(b => b.row));
    const targetY = piece.targetRow - maxBlockRow + maxBlockRow;

    if (piece.y < piece.targetRow) {
      piece.y += piece.speed;
      if (piece.y >= piece.targetRow) {
        piece.y = piece.targetRow;
      }
    }

    if (piece.y >= piece.targetRow) {
      piece.lockTimer++;
      if (piece.lockTimer >= LOCK_DELAY) {
        piece.landed = true;
        const color = TETROMINO_COLORS[piece.type];
        for (const block of piece.blocks) {
          const row = block.row + piece.targetRow;
          if (row >= 0 && row < BOARD_ROWS && block.col >= 0 && block.col < BOARD_COLS) {
            state.grid[row][block.col] = color;
            state.landed.push({
              col: block.col,
              row,
              color,
              alpha: 0.6,
              flash: 1.0,
            });
          }
        }
        state.falling.splice(i, 1);
        checkLines(state);
      }
    }
  }

  for (let i = state.lineClearEffects.length - 1; i >= 0; i--) {
    const effect = state.lineClearEffects[i];
    effect.timer--;
    if (effect.timer <= 0) {
      state.lineClearEffects.splice(i, 1);
    }
  }

  for (const block of state.landed) {
    block.flash *= 0.92;
    block.alpha = Math.max(0.15, block.alpha - 0.001);
  }

  if (state.landed.length > MAX_LANDED_BLOCKS) {
    state.landed.splice(0, state.landed.length - MAX_LANDED_BLOCKS);
  }
}

function checkLines(state: TetrisRainState): void {
  const fullRows: number[] = [];
  for (let r = BOARD_ROWS - 1; r >= 0; r--) {
    if (state.grid[r].every(cell => cell !== null)) {
      fullRows.push(r);
    }
  }

  if (fullRows.length === 0) return;

  for (const row of fullRows) {
    state.lineClearEffects.push({
      row,
      timer: LINE_CLEAR_FLASH_DURATION,
      maxTimer: LINE_CLEAR_FLASH_DURATION,
    });
  }

  for (const row of fullRows.sort((a, b) => b - a)) {
    state.grid.splice(row, 1);
    state.grid.unshift(new Array(BOARD_COLS).fill(null));
    state.landed = state.landed.filter(b => b.row !== row);
    for (const block of state.landed) {
      if (block.row < row) {
        block.row++;
      }
    }
  }
}

export function drawTetrisRain(
  g: Phaser.GameObjects.Graphics,
  state: TetrisRainState,
  canvasWidth: number,
  canvasHeight: number,
  frameCount: number
): void {
  const ox = (canvasWidth - BOARD_WIDTH) / 2;
  const oy = (canvasHeight - BOARD_HEIGHT) / 2;

  drawTetrisGrid(g, ox, oy, frameCount);
  drawLandedBlocks(g, state, ox, oy, frameCount);
  drawFallingPieces(g, state, ox, oy, frameCount);
  drawLineClearEffects(g, state, ox, oy, canvasWidth);
}

function drawTetrisGrid(
  g: Phaser.GameObjects.Graphics,
  ox: number,
  oy: number,
  frameCount: number
): void {
  const pulse = 0.02 + Math.sin(frameCount * 0.02) * 0.005;
  for (let c = 0; c <= BOARD_COLS; c++) {
    g.lineStyle(0.5, 0x222244, pulse);
    g.lineBetween(ox + c * BLOCK_SIZE, oy, ox + c * BLOCK_SIZE, oy + BOARD_HEIGHT);
  }
  for (let r = 0; r <= BOARD_ROWS; r++) {
    g.lineStyle(0.5, 0x222244, pulse);
    g.lineBetween(ox, oy + r * BLOCK_SIZE, ox + BOARD_WIDTH, oy + r * BLOCK_SIZE);
  }
}

function drawBlock(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  color: number,
  alpha: number,
  flash: number
): void {
  const size = BLOCK_SIZE - 1;

  g.fillStyle(color, alpha * 0.3);
  g.fillRect(x - 1, y - 1, size + 2, size + 2);

  g.fillStyle(color, alpha * 0.7 + flash * 0.3);
  g.fillRect(x, y, size, size);

  const r = (color >> 16) & 0xff;
  const gv = (color >> 8) & 0xff;
  const b = color & 0xff;
  const lighter = ((Math.min(255, r + 60) << 16) | (Math.min(255, gv + 60) << 8) | Math.min(255, b + 60));
  g.fillStyle(lighter, alpha * 0.4 + flash * 0.3);
  g.fillRect(x + 1, y + 1, size - 2, 2);
  g.fillRect(x + 1, y + 1, 2, size - 2);

  const darker = (((r >> 1) << 16) | ((gv >> 1) << 8) | (b >> 1));
  g.fillStyle(darker, alpha * 0.5);
  g.fillRect(x + size - 2, y + 1, 2, size - 1);
  g.fillRect(x + 1, y + size - 2, size - 1, 2);
}

function drawLandedBlocks(
  g: Phaser.GameObjects.Graphics,
  state: TetrisRainState,
  ox: number,
  oy: number,
  frameCount: number
): void {
  for (const block of state.landed) {
    const x = ox + block.col * BLOCK_SIZE;
    const y = oy + block.row * BLOCK_SIZE;
    drawBlock(g, x, y, block.color, block.alpha, block.flash);
  }
}

function drawFallingPieces(
  g: Phaser.GameObjects.Graphics,
  state: TetrisRainState,
  ox: number,
  oy: number,
  frameCount: number
): void {
  for (const piece of state.falling) {
    const color = TETROMINO_COLORS[piece.type];

    const ghostAlpha = 0.08 + Math.sin(frameCount * 0.1) * 0.03;
    for (const block of piece.blocks) {
      const gx = ox + block.col * BLOCK_SIZE;
      const gy = oy + (block.row + piece.targetRow) * BLOCK_SIZE;
      g.fillStyle(color, ghostAlpha);
      g.fillRect(gx, gy, BLOCK_SIZE - 1, BLOCK_SIZE - 1);
    }

    for (const block of piece.blocks) {
      const x = ox + block.col * BLOCK_SIZE;
      const y = oy + (block.row + piece.y) * BLOCK_SIZE;
      const lockProgress = piece.lockTimer / LOCK_DELAY;
      drawBlock(g, x, y, color, 0.5 + lockProgress * 0.3, lockProgress);
    }
  }
}

function drawLineClearEffects(
  g: Phaser.GameObjects.Graphics,
  state: TetrisRainState,
  ox: number,
  oy: number,
  canvasWidth: number
): void {
  for (const effect of state.lineClearEffects) {
    const progress = effect.timer / effect.maxTimer;
    const y = oy + effect.row * BLOCK_SIZE;

    g.fillStyle(0xffffff, progress * 0.6);
    g.fillRect(ox, y, BOARD_WIDTH, BLOCK_SIZE);

    const expandWidth = BOARD_WIDTH + (1 - progress) * canvasWidth * 0.3;
    const expandX = ox - (expandWidth - BOARD_WIDTH) / 2;
    g.fillStyle(0x00e8ff, progress * 0.15);
    g.fillRect(expandX, y - 2, expandWidth, BLOCK_SIZE + 4);

    if (progress > 0.5) {
      const sparkCount = 3;
      for (let i = 0; i < sparkCount; i++) {
        const sx = ox + Math.random() * BOARD_WIDTH;
        const sy = y + Math.random() * BLOCK_SIZE;
        g.fillStyle(0xffffff, progress * 0.8);
        g.fillCircle(sx, sy, 1 + Math.random() * 2);
      }
    }
  }
}
