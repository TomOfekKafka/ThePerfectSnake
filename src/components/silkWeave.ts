import Phaser from 'phaser';

export interface SilkCell {
  woven: boolean;
  weaveAlpha: number;
  flashTimer: number;
  threadAngle: number;
}

export interface SilkRowFlash {
  index: number;
  type: 'row' | 'col';
  alpha: number;
}

export interface SilkState {
  grid: SilkCell[][];
  visited: boolean[][];
  rowFlashes: SilkRowFlash[];
  wovenRows: boolean[];
  wovenCols: boolean[];
  totalWoven: number;
  wavePhase: number;
}

const SILK_GRID = 20;

function generateThreadAngles(): number[][] {
  const angles: number[][] = [];
  for (let r = 0; r < SILK_GRID; r++) {
    angles[r] = [];
    for (let c = 0; c < SILK_GRID; c++) {
      angles[r][c] = ((r * 7 + c * 13) % 360) * (Math.PI / 180);
    }
  }
  return angles;
}

export function createSilkState(): SilkState {
  const angles = generateThreadAngles();
  const grid: SilkCell[][] = [];
  const visited: boolean[][] = [];

  for (let r = 0; r < SILK_GRID; r++) {
    grid[r] = [];
    visited[r] = [];
    for (let c = 0; c < SILK_GRID; c++) {
      grid[r][c] = {
        woven: false,
        weaveAlpha: 0,
        flashTimer: 0,
        threadAngle: angles[r][c],
      };
      visited[r][c] = false;
    }
  }

  return {
    grid,
    visited,
    rowFlashes: [],
    wovenRows: new Array(SILK_GRID).fill(false),
    wovenCols: new Array(SILK_GRID).fill(false),
    totalWoven: 0,
    wavePhase: 0,
  };
}

export function updateSilkVisited(
  state: SilkState,
  snake: { x: number; y: number }[]
): SilkState {
  let changed = false;
  const visited = state.visited.map(row => [...row]);
  const grid = state.grid.map(row => row.map(cell => ({ ...cell })));
  let totalWoven = state.totalWoven;

  for (const seg of snake) {
    const r = seg.y;
    const c = seg.x;
    if (r >= 0 && r < SILK_GRID && c >= 0 && c < SILK_GRID && !visited[r][c]) {
      visited[r][c] = true;
      grid[r][c].woven = true;
      grid[r][c].flashTimer = 1.0;
      totalWoven++;
      changed = true;
    }
  }

  if (!changed) return state;

  return { ...state, grid, visited, totalWoven };
}

function checkLineCompletion(
  visited: boolean[][],
  wovenRows: boolean[],
  wovenCols: boolean[]
): { newFlashes: SilkRowFlash[]; wovenRows: boolean[]; wovenCols: boolean[] } {
  const newFlashes: SilkRowFlash[] = [];
  const updatedRows = [...wovenRows];
  const updatedCols = [...wovenCols];

  for (let r = 0; r < SILK_GRID; r++) {
    if (updatedRows[r]) continue;
    if (visited[r].every(v => v)) {
      updatedRows[r] = true;
      newFlashes.push({ index: r, type: 'row', alpha: 1.0 });
    }
  }

  for (let c = 0; c < SILK_GRID; c++) {
    if (updatedCols[c]) continue;
    let complete = true;
    for (let r = 0; r < SILK_GRID; r++) {
      if (!visited[r][c]) { complete = false; break; }
    }
    if (complete) {
      updatedCols[c] = true;
      newFlashes.push({ index: c, type: 'col', alpha: 1.0 });
    }
  }

  return { newFlashes, wovenRows: updatedRows, wovenCols: updatedCols };
}

export function updateSilkEffects(state: SilkState): SilkState {
  const grid = state.grid.map(row => row.map(cell => {
    const weaveAlpha = cell.woven
      ? Math.min(1, cell.weaveAlpha + 0.05)
      : cell.weaveAlpha;
    const flashTimer = Math.max(0, cell.flashTimer - 0.03);
    return { ...cell, weaveAlpha, flashTimer };
  }));

  const rowFlashes = state.rowFlashes
    .map(f => ({ ...f, alpha: f.alpha - 0.02 }))
    .filter(f => f.alpha > 0);

  const { newFlashes, wovenRows, wovenCols } =
    checkLineCompletion(state.visited, state.wovenRows, state.wovenCols);

  return {
    ...state,
    grid,
    rowFlashes: [...rowFlashes, ...newFlashes],
    wovenRows,
    wovenCols,
    wavePhase: state.wavePhase + 0.04,
  };
}

export function resetSilkVisited(_state: SilkState): SilkState {
  return createSilkState();
}

const THREAD_UNWOVEN = 0x1a2a22;
const SILK_EMERALD = 0x22cc66;
const SILK_VIOLET = 0xaa44dd;
const SILK_MINT = 0x44ddaa;
const SILK_SHIMMER = 0xcc55ee;
const WEAVE_FLASH = 0xddaaff;

function colorLerp(a: number, b: number, t: number): number {
  const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
  const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;
  const rr = Math.round(ar + (br - ar) * t);
  const rg = Math.round(ag + (bg - ag) * t);
  const rb = Math.round(ab + (bb - ab) * t);
  return (rr << 16) | (rg << 8) | rb;
}

function silkColor(r: number, c: number, phase: number): number {
  const pattern = (r + c) % 3;
  const shimmer = Math.sin(phase + r * 0.5 + c * 0.3) * 0.5 + 0.5;
  if (pattern === 0) return colorLerp(SILK_EMERALD, SILK_SHIMMER, shimmer * 0.4);
  if (pattern === 1) return colorLerp(SILK_VIOLET, SILK_EMERALD, shimmer * 0.3);
  return colorLerp(SILK_MINT, SILK_SHIMMER, shimmer * 0.3);
}

function drawThreadCurve(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  cellSize: number,
  angle: number,
  wave: number
): void {
  const halfCell = cellSize / 2;
  const waveOffset = Math.sin(wave) * 2;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);

  const x1 = cx + cos * halfCell * 0.8;
  const y1 = cy + sin * halfCell * 0.8 + waveOffset;
  const x2 = cx - cos * halfCell * 0.8;
  const y2 = cy - sin * halfCell * 0.8 - waveOffset;
  const cpx = cx + sin * 3 + waveOffset;
  const cpy = cy - cos * 3;

  g.beginPath();
  g.moveTo(x1, y1);
  const steps = 6;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const it = 1 - t;
    const px = it * it * x1 + 2 * it * t * cpx + t * t * x2;
    const py = it * it * y1 + 2 * it * t * cpy + t * t * y2;
    g.lineTo(px, py);
  }
  g.strokePath();
}

function drawWovenFabric(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  cellSize: number,
  color: number,
  alpha: number,
  wave: number
): void {
  const half = cellSize / 2 - 1;
  const waveOff = Math.sin(wave) * 1.5;

  g.fillStyle(color, alpha * 0.25);
  g.fillRect(cx - half, cy - half, half * 2, half * 2);

  g.lineStyle(1, color, alpha * 0.6);
  const spacing = 4;
  for (let offset = -half; offset <= half; offset += spacing) {
    g.lineBetween(
      cx - half, cy + offset + waveOff,
      cx + half, cy + offset - waveOff
    );
  }

  g.lineStyle(1, color, alpha * 0.3);
  for (let offset = -half; offset <= half; offset += spacing) {
    g.lineBetween(
      cx + offset - waveOff, cy - half,
      cx + offset + waveOff, cy + half
    );
  }
}

export function drawSilkWeave(
  g: Phaser.GameObjects.Graphics,
  state: SilkState,
  cellSize: number,
  gridSize: number,
  frameCount: number
): void {
  const wave = state.wavePhase;
  const globalWave = Math.sin(wave) * 0.3 + 0.7;

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const cell = state.grid[r][c];
      const cx = c * cellSize + cellSize / 2;
      const cy = r * cellSize + cellSize / 2;
      const cellWave = wave + r * 0.2 + c * 0.15;

      if (cell.woven) {
        const color = silkColor(r, c, wave);
        const alpha = cell.weaveAlpha * globalWave;
        drawWovenFabric(g, cx, cy, cellSize, color, alpha, cellWave);

        if (cell.flashTimer > 0) {
          g.fillStyle(WEAVE_FLASH, cell.flashTimer * 0.35);
          g.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
        }
      } else {
        const threadAlpha = 0.06 + Math.sin(frameCount * 0.02 + r * 0.3 + c * 0.5) * 0.03;
        g.lineStyle(1, THREAD_UNWOVEN, threadAlpha);
        drawThreadCurve(g, cx, cy, cellSize, cell.threadAngle, cellWave);
      }
    }
  }

  for (const flash of state.rowFlashes) {
    const shimmerColor = SILK_SHIMMER;
    if (flash.type === 'row') {
      const y = flash.index * cellSize;
      g.fillStyle(shimmerColor, flash.alpha * 0.25);
      g.fillRect(0, y, gridSize * cellSize, cellSize);
      g.lineStyle(2, SILK_EMERALD, flash.alpha * 0.5);
      g.lineBetween(0, y, gridSize * cellSize, y);
      g.lineBetween(0, y + cellSize, gridSize * cellSize, y + cellSize);
    } else {
      const x = flash.index * cellSize;
      g.fillStyle(shimmerColor, flash.alpha * 0.25);
      g.fillRect(x, 0, cellSize, gridSize * cellSize);
      g.lineStyle(2, SILK_EMERALD, flash.alpha * 0.5);
      g.lineBetween(x, 0, x, gridSize * cellSize);
      g.lineBetween(x + cellSize, 0, x + cellSize, gridSize * cellSize);
    }
  }

  const wovenCount = state.totalWoven;
  const totalCells = gridSize * gridSize;
  if (wovenCount > 0 && wovenCount < totalCells) {
    const pct = wovenCount / totalCells;
    const barWidth = 60;
    const barHeight = 4;
    const barX = gridSize * cellSize - barWidth - 6;
    const barY = gridSize * cellSize - barHeight - 6;
    g.fillStyle(0x000000, 0.3);
    g.fillRect(barX - 1, barY - 1, barWidth + 2, barHeight + 2);
    g.fillStyle(THREAD_UNWOVEN, 0.3);
    g.fillRect(barX, barY, barWidth, barHeight);

    const barColor = colorLerp(SILK_VIOLET, SILK_EMERALD, pct);
    g.fillStyle(barColor, 0.6);
    g.fillRect(barX, barY, barWidth * pct, barHeight);
  }
}
