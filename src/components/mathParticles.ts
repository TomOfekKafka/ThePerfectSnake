import Phaser from 'phaser';

export interface MathSymbol {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  symbolType: number;
  pulsePhase: number;
}

export interface ScoreBurst {
  x: number;
  y: number;
  alpha: number;
  scale: number;
  value: number;
  age: number;
}

export interface MathWave {
  phase: number;
  amplitude: number;
  frequency: number;
  yOffset: number;
  color: number;
  alpha: number;
}

export interface MathParticlesState {
  symbols: MathSymbol[];
  scoreBursts: ScoreBurst[];
  waves: MathWave[];
  frameCount: number;
}

const NUM_SYMBOLS = 15;
const NUM_WAVES = 3;
const BURST_LIFESPAN = 60;
const SYMBOL_COUNT = 8;

export function createMathParticlesState(): MathParticlesState {
  return {
    symbols: [],
    scoreBursts: [],
    waves: [],
    frameCount: 0,
  };
}

export function createMathSymbol(width: number, height: number): MathSymbol {
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
    alpha: 0.06 + Math.random() * 0.08,
    size: 6 + Math.random() * 8,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.015,
    symbolType: Math.floor(Math.random() * SYMBOL_COUNT),
    pulsePhase: Math.random() * Math.PI * 2,
  };
}

export function initMathSymbols(
  state: MathParticlesState,
  width: number,
  height: number
): void {
  state.symbols = [];
  for (let i = 0; i < NUM_SYMBOLS; i++) {
    state.symbols.push(createMathSymbol(width, height));
  }
}

export function initMathWaves(state: MathParticlesState, height: number): void {
  state.waves = [];
  for (let i = 0; i < NUM_WAVES; i++) {
    state.waves.push({
      phase: Math.random() * Math.PI * 2,
      amplitude: 8 + Math.random() * 12,
      frequency: 0.02 + Math.random() * 0.02,
      yOffset: (height / (NUM_WAVES + 1)) * (i + 1),
      color: [0x4488cc, 0x66aadd, 0x5599bb][i],
      alpha: 0.04 + Math.random() * 0.03,
    });
  }
}

export function updateMathSymbols(
  state: MathParticlesState,
  width: number,
  height: number
): void {
  for (const sym of state.symbols) {
    sym.x += sym.vx;
    sym.y += sym.vy;
    sym.rotation += sym.rotationSpeed;
    sym.pulsePhase += 0.03;

    if (sym.x < -20) sym.x = width + 20;
    if (sym.x > width + 20) sym.x = -20;
    if (sym.y < -20) sym.y = height + 20;
    if (sym.y > height + 20) sym.y = -20;
  }
}

export function updateMathWaves(state: MathParticlesState): void {
  for (const wave of state.waves) {
    wave.phase += 0.02;
  }
}

export function updateScoreBursts(state: MathParticlesState): void {
  state.scoreBursts = state.scoreBursts.filter((b) => b.age < BURST_LIFESPAN);
  for (const burst of state.scoreBursts) {
    burst.age++;
    burst.y -= 0.5;
    burst.alpha = Math.max(0, 1 - burst.age / BURST_LIFESPAN);
    burst.scale = 0.5 + (burst.age / BURST_LIFESPAN) * 0.5;
  }
}

export function spawnScoreBurst(
  state: MathParticlesState,
  x: number,
  y: number,
  value: number
): void {
  state.scoreBursts.push({
    x,
    y,
    alpha: 1,
    scale: 0.5,
    value,
    age: 0,
  });
}

function drawPiSymbol(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  size: number,
  color: number,
  alpha: number
): void {
  const t = size * 0.12;
  g.fillStyle(color, alpha);
  g.fillRect(x - size * 0.4, y - size * 0.35, size * 0.8, t);
  g.fillRect(x - size * 0.25, y - size * 0.35, t, size * 0.7);
  g.fillRect(x + size * 0.15, y - size * 0.35, t, size * 0.7);
}

function drawSigmaSymbol(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  size: number,
  color: number,
  alpha: number
): void {
  const t = size * 0.12;
  g.fillStyle(color, alpha);
  g.fillRect(x - size * 0.3, y - size * 0.35, size * 0.6, t);
  g.fillRect(x - size * 0.3, y + size * 0.25, size * 0.6, t);
  const steps = 4;
  for (let i = 0; i <= steps; i++) {
    const frac = i / steps;
    const lx = x - size * 0.3 + (frac < 0.5 ? frac * 2 : 2 - frac * 2) * size * 0.25;
    const ly = y - size * 0.35 + frac * size * 0.7;
    g.fillRect(lx, ly, t, t);
  }
}

function drawInfinitySymbol(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  size: number,
  color: number,
  alpha: number
): void {
  g.lineStyle(size * 0.1, color, alpha);
  const steps = 16;
  for (let i = 0; i < steps; i++) {
    const t1 = (i / steps) * Math.PI * 2;
    const t2 = ((i + 1) / steps) * Math.PI * 2;
    const x1 = x + Math.cos(t1) * size * 0.35 / (1 + Math.sin(t1) * Math.sin(t1) * 0.5);
    const y1 = y + Math.sin(t1) * Math.cos(t1) * size * 0.25;
    const x2 = x + Math.cos(t2) * size * 0.35 / (1 + Math.sin(t2) * Math.sin(t2) * 0.5);
    const y2 = y + Math.sin(t2) * Math.cos(t2) * size * 0.25;
    g.lineBetween(x1, y1, x2, y2);
  }
}

function drawPlusMinusSymbol(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  size: number,
  color: number,
  alpha: number
): void {
  const t = size * 0.12;
  g.fillStyle(color, alpha);
  g.fillRect(x - size * 0.3, y - size * 0.1, size * 0.6, t);
  g.fillRect(x - t / 2, y - size * 0.3, t, size * 0.4);
  g.fillRect(x - size * 0.3, y + size * 0.2, size * 0.6, t);
}

function drawIntegralSymbol(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  size: number,
  color: number,
  alpha: number
): void {
  const t = size * 0.1;
  g.fillStyle(color, alpha);
  g.fillCircle(x + size * 0.1, y - size * 0.35, t * 1.2);
  g.fillRect(x - t / 2, y - size * 0.35, t, size * 0.7);
  g.fillCircle(x - size * 0.1, y + size * 0.35, t * 1.2);
}

function drawDeltaSymbol(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  size: number,
  color: number,
  alpha: number
): void {
  const t = size * 0.12;
  g.fillStyle(color, alpha);
  g.fillRect(x - size * 0.3, y + size * 0.25, size * 0.6, t);
  const steps = 6;
  for (let i = 0; i <= steps; i++) {
    const frac = i / steps;
    const lx = x + (0.5 - frac) * size * 0.55;
    const ly = y - size * 0.35 + frac * size * 0.6;
    g.fillRect(lx - t / 2, ly, t, t);
    g.fillRect(x - (0.5 - frac) * size * 0.55 - t / 2, ly, t, t);
  }
}

function drawSqrtSymbol(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  size: number,
  color: number,
  alpha: number
): void {
  const t = size * 0.1;
  g.fillStyle(color, alpha);
  g.fillRect(x - size * 0.4, y + size * 0.05, size * 0.15, t);
  const steps = 4;
  for (let i = 0; i <= steps; i++) {
    const frac = i / steps;
    const lx = x - size * 0.25 + frac * size * 0.2;
    const ly = y + size * 0.05 + frac * size * 0.3;
    g.fillRect(lx, ly, t, t);
  }
  for (let i = 0; i <= steps; i++) {
    const frac = i / steps;
    const lx = x - size * 0.05 + frac * size * 0.15;
    const ly = y + size * 0.35 - frac * size * 0.7;
    g.fillRect(lx, ly, t, t);
  }
  g.fillRect(x + size * 0.1, y - size * 0.35, size * 0.35, t);
}

function drawPhiSymbol(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  size: number,
  color: number,
  alpha: number
): void {
  const t = size * 0.1;
  g.fillStyle(color, alpha);
  g.fillRect(x - t / 2, y - size * 0.4, t, size * 0.8);
  g.lineStyle(t, color, alpha);
  const steps = 12;
  for (let i = 0; i < steps; i++) {
    const a1 = (i / steps) * Math.PI * 2;
    const a2 = ((i + 1) / steps) * Math.PI * 2;
    g.lineBetween(
      x + Math.cos(a1) * size * 0.28,
      y + Math.sin(a1) * size * 0.2,
      x + Math.cos(a2) * size * 0.28,
      y + Math.sin(a2) * size * 0.2
    );
  }
}

type SymbolDrawer = (
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  size: number,
  color: number,
  alpha: number
) => void;

const SYMBOL_DRAWERS: SymbolDrawer[] = [
  drawPiSymbol,
  drawSigmaSymbol,
  drawInfinitySymbol,
  drawPlusMinusSymbol,
  drawIntegralSymbol,
  drawDeltaSymbol,
  drawSqrtSymbol,
  drawPhiSymbol,
];

const SYMBOL_COLORS = [0x6699cc, 0x77aadd, 0x88bbee, 0x5588bb, 0x99ccee];

export function drawMathSymbols(
  g: Phaser.GameObjects.Graphics,
  state: MathParticlesState
): void {
  for (const sym of state.symbols) {
    const pulse = 0.7 + Math.sin(sym.pulsePhase) * 0.3;
    const alpha = sym.alpha * pulse;
    const color = SYMBOL_COLORS[sym.symbolType % SYMBOL_COLORS.length];
    const drawer = SYMBOL_DRAWERS[sym.symbolType % SYMBOL_DRAWERS.length];
    drawer(g, sym.x, sym.y, sym.size, color, alpha);
  }
}

export function drawMathWaves(
  g: Phaser.GameObjects.Graphics,
  state: MathParticlesState,
  width: number
): void {
  for (const wave of state.waves) {
    g.lineStyle(1.5, wave.color, wave.alpha);
    const step = 4;
    for (let px = 0; px < width - step; px += step) {
      const y1 = wave.yOffset + Math.sin(px * wave.frequency + wave.phase) * wave.amplitude;
      const y2 = wave.yOffset + Math.sin((px + step) * wave.frequency + wave.phase) * wave.amplitude;
      g.lineBetween(px, y1, px + step, y2);
    }
  }
}

export function drawScoreBursts(
  g: Phaser.GameObjects.Graphics,
  state: MathParticlesState,
  drawDigit: (g: Phaser.GameObjects.Graphics, digit: string, x: number, y: number, size: number) => void
): void {
  for (const burst of state.scoreBursts) {
    const size = 10 * burst.scale;
    const alpha = burst.alpha * 0.9;
    g.fillStyle(0x88ddff, alpha * 0.3);
    g.fillCircle(burst.x, burst.y, size * 2);

    const label = `+${burst.value}`;
    const digitWidth = size * 0.6;
    const totalWidth = label.length * digitWidth;
    const startX = burst.x - totalWidth / 2 + digitWidth / 2;

    for (let i = 0; i < label.length; i++) {
      const char = label[i];
      const cx = startX + i * digitWidth;
      if (char === '+') {
        const t = size * 0.08;
        g.fillStyle(0xaaddff, alpha);
        g.fillRect(cx - size * 0.15, cx !== cx ? 0 : burst.y - t / 2, size * 0.3, t);
        g.fillRect(cx - t / 2, burst.y - size * 0.15, t, size * 0.3);
      } else {
        drawDigit(g, char, cx, burst.y, size);
      }
    }
  }
}

export function symbolTypeCount(): number {
  return SYMBOL_COUNT;
}
