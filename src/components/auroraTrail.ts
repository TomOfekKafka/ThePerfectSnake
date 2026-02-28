import Phaser from 'phaser';

export interface AuroraWisp {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  life: number;
  maxLife: number;
  hue: number;
  amplitude: number;
  frequency: number;
  phase: number;
  size: number;
}

export interface AuroraTrailState {
  wisps: AuroraWisp[];
  spawnAccumulator: number;
  lastHeadX: number;
  lastHeadY: number;
}

const MAX_WISPS = 120;
const SPAWN_RATE = 3;

export function createAuroraTrailState(): AuroraTrailState {
  return {
    wisps: [],
    spawnAccumulator: 0,
    lastHeadX: -1,
    lastHeadY: -1,
  };
}

export function spawnAuroraWisps(
  state: AuroraTrailState,
  snake: { x: number; y: number }[],
  cellSize: number,
  hueOffset: number
): void {
  if (snake.length === 0) return;

  const head = snake[0];
  const hx = head.x * cellSize + cellSize / 2;
  const hy = head.y * cellSize + cellSize / 2;

  if (hx === state.lastHeadX && hy === state.lastHeadY) return;
  state.lastHeadX = hx;
  state.lastHeadY = hy;

  state.spawnAccumulator += SPAWN_RATE;

  while (state.spawnAccumulator >= 1) {
    state.spawnAccumulator -= 1;

    if (state.wisps.length >= MAX_WISPS) {
      state.wisps.shift();
    }

    const segIdx = Math.floor(Math.random() * Math.min(snake.length, 8));
    const seg = snake[segIdx];
    const sx = seg.x * cellSize + cellSize / 2;
    const sy = seg.y * cellSize + cellSize / 2;

    const life = 0.6 + Math.random() * 0.6;
    state.wisps.push({
      x: sx + (Math.random() - 0.5) * cellSize * 0.8,
      y: sy + (Math.random() - 0.5) * cellSize * 0.8,
      baseX: sx,
      baseY: sy,
      life,
      maxLife: life,
      hue: (hueOffset + segIdx * 35 + Math.random() * 40) % 360,
      amplitude: 3 + Math.random() * 8,
      frequency: 0.03 + Math.random() * 0.04,
      phase: Math.random() * Math.PI * 2,
      size: 2 + Math.random() * 4,
    });
  }
}

export function updateAuroraTrail(state: AuroraTrailState): void {
  for (let i = state.wisps.length - 1; i >= 0; i--) {
    const w = state.wisps[i];
    w.life -= 0.018;
    w.phase += w.frequency;
    w.y -= 0.3;
    w.x += Math.sin(w.phase) * 0.5;

    if (w.life <= 0) {
      state.wisps.splice(i, 1);
    }
  }
}

function hueToHex(hue: number, sat: number, light: number): number {
  const h = ((hue % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = light - c / 2;
  let r = 0, g = 0, b = 0;

  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }

  return (Math.round((r + m) * 255) << 16)
    | (Math.round((g + m) * 255) << 8)
    | Math.round((b + m) * 255);
}

export function drawAuroraTrail(
  g: Phaser.GameObjects.Graphics,
  state: AuroraTrailState,
  frameCount: number
): void {
  for (const w of state.wisps) {
    const t = w.life / w.maxLife;
    const easedAlpha = t * t * (3 - 2 * t);
    const wave = Math.sin(w.phase + frameCount * 0.02);

    const wobbleX = w.x + Math.sin(w.phase) * w.amplitude;
    const wobbleY = w.y + Math.cos(w.phase * 0.7) * w.amplitude * 0.5;

    const outerColor = hueToHex(w.hue, 0.85, 0.55);
    const outerAlpha = easedAlpha * 0.18;
    const outerSize = w.size * 2.5 + wave * 1.5;
    if (outerAlpha > 0.01) {
      g.fillStyle(outerColor, outerAlpha);
      g.fillCircle(wobbleX, wobbleY, outerSize);
    }

    const midColor = hueToHex(w.hue + 15, 0.9, 0.6);
    const midAlpha = easedAlpha * 0.35;
    const midSize = w.size * 1.4 + wave * 0.8;
    if (midAlpha > 0.01) {
      g.fillStyle(midColor, midAlpha);
      g.fillCircle(wobbleX, wobbleY, midSize);
    }

    const coreColor = hueToHex(w.hue + 30, 0.7, 0.8);
    const coreAlpha = easedAlpha * 0.5;
    const coreSize = w.size * 0.6;
    if (coreAlpha > 0.01) {
      g.fillStyle(coreColor, coreAlpha);
      g.fillCircle(wobbleX, wobbleY, coreSize);
    }
  }
}
