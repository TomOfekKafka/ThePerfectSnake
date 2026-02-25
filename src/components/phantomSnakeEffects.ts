import Phaser from 'phaser';

interface Position {
  x: number;
  y: number;
}

interface PhantomTrailParticle {
  x: number;
  y: number;
  alpha: number;
  size: number;
}

export interface PhantomVisualState {
  trail: PhantomTrailParticle[];
  stealFlashAlpha: number;
  spawnAnimation: number;
  lastHeadPos: Position | null;
}

export const createPhantomVisualState = (): PhantomVisualState => ({
  trail: [],
  stealFlashAlpha: 0,
  spawnAnimation: 0,
  lastHeadPos: null,
});

const MAX_PHANTOM_TRAIL = 20;

export const updatePhantomVisuals = (
  state: PhantomVisualState,
  segments: Position[],
  cellSize: number,
  active: boolean,
  foodStolen: boolean
): void => {
  if (active && segments.length > 0) {
    const head = segments[0];
    const hx = head.x * cellSize + cellSize / 2;
    const hy = head.y * cellSize + cellSize / 2;

    state.trail.unshift({
      x: hx + (Math.random() - 0.5) * 6,
      y: hy + (Math.random() - 0.5) * 6,
      alpha: 0.5,
      size: 4 + Math.random() * 3,
    });

    if (state.trail.length > MAX_PHANTOM_TRAIL) {
      state.trail.length = MAX_PHANTOM_TRAIL;
    }

    if (!state.lastHeadPos || state.lastHeadPos.x !== head.x || state.lastHeadPos.y !== head.y) {
      state.spawnAnimation = Math.min(1, state.spawnAnimation + 0.15);
    }
    state.lastHeadPos = { x: head.x, y: head.y };
  } else {
    state.spawnAnimation *= 0.9;
    state.lastHeadPos = null;
  }

  for (const p of state.trail) {
    p.alpha *= 0.88;
    p.size *= 0.96;
  }
  state.trail = state.trail.filter(p => p.alpha > 0.02);

  if (foodStolen) {
    state.stealFlashAlpha = 1.0;
  }
  state.stealFlashAlpha *= 0.92;
};

const hslToHex = (h: number, s: number, l: number): number => {
  h = ((h % 360) + 360) % 360;
  s /= 100;
  l /= 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  const ri = Math.round((r + m) * 255);
  const gi = Math.round((g + m) * 255);
  const bi = Math.round((b + m) * 255);
  return (ri << 16) | (gi << 8) | bi;
};

export const drawPhantomSnake = (
  g: Phaser.GameObjects.Graphics,
  segments: Position[],
  cellSize: number,
  frameCount: number,
  visualState: PhantomVisualState
): void => {
  if (segments.length === 0) return;

  const baseHue = 270;
  const pulse = 0.6 + Math.sin(frameCount * 0.08) * 0.2;
  const opacity = pulse * Math.min(1, visualState.spawnAnimation);

  for (const p of visualState.trail) {
    g.fillStyle(hslToHex(baseHue + 20, 60, 60), p.alpha * 0.4);
    g.fillCircle(p.x, p.y, p.size);
  }

  for (let i = segments.length - 1; i >= 0; i--) {
    const seg = segments[i];
    const px = seg.x * cellSize + cellSize / 2;
    const py = seg.y * cellSize + cellSize / 2;
    const t = segments.length > 1 ? i / (segments.length - 1) : 0;
    const segPulse = opacity * (0.8 + Math.sin(frameCount * 0.1 + i * 0.5) * 0.2);
    const baseSize = cellSize * 0.42 * (1 - t * 0.3);

    g.fillStyle(hslToHex(baseHue - 10, 50, 30), 0.12 * segPulse);
    g.fillCircle(px, py, baseSize * 2.5);

    g.fillStyle(hslToHex(baseHue, 70, 45), 0.25 * segPulse);
    g.fillCircle(px, py, baseSize * 1.5);

    g.fillStyle(hslToHex(baseHue + 15, 80, 60), 0.4 * segPulse);
    g.fillCircle(px, py, baseSize);

    g.fillStyle(hslToHex(baseHue + 40, 50, 85), 0.3 * segPulse);
    g.fillCircle(px, py, baseSize * 0.35);
  }

  const head = segments[0];
  const hx = head.x * cellSize + cellSize / 2;
  const hy = head.y * cellSize + cellSize / 2;
  const headSize = cellSize * 0.48;

  g.fillStyle(hslToHex(baseHue, 90, 70), 0.5 * opacity);
  g.fillCircle(hx, hy, headSize);

  const eyeOffset = cellSize * 0.15;
  const eyeSize = 2.5;
  g.fillStyle(0xff3366, 0.7 * opacity);
  g.fillCircle(hx - eyeOffset, hy - eyeOffset * 0.5, eyeSize);
  g.fillCircle(hx + eyeOffset, hy - eyeOffset * 0.5, eyeSize);
  g.fillStyle(0xffffff, 0.9 * opacity);
  g.fillCircle(hx - eyeOffset, hy - eyeOffset * 0.5, eyeSize * 0.4);
  g.fillCircle(hx + eyeOffset, hy - eyeOffset * 0.5, eyeSize * 0.4);

  if (visualState.stealFlashAlpha > 0.05) {
    const flashRadius = cellSize * 2 * (1.2 - visualState.stealFlashAlpha * 0.2);
    g.fillStyle(hslToHex(baseHue, 80, 70), visualState.stealFlashAlpha * 0.3);
    g.fillCircle(hx, hy, flashRadius);

    g.lineStyle(2, hslToHex(baseHue, 90, 80), visualState.stealFlashAlpha * 0.5);
    g.strokeCircle(hx, hy, flashRadius * 1.3);
  }
};

export const drawPhantomStealWarning = (
  g: Phaser.GameObjects.Graphics,
  foodX: number,
  foodY: number,
  cellSize: number,
  stealFlashAlpha: number,
  frameCount: number
): void => {
  if (stealFlashAlpha < 0.05) return;

  const waveRadius = cellSize * 3 * (1 - stealFlashAlpha * 0.5);
  g.lineStyle(2, hslToHex(270, 80, 70), stealFlashAlpha * 0.4);
  g.strokeCircle(foodX, foodY, waveRadius);

  const numSparkles = 6;
  for (let i = 0; i < numSparkles; i++) {
    const angle = (i / numSparkles) * Math.PI * 2 + frameCount * 0.1;
    const dist = cellSize * 1.5 * (1 - stealFlashAlpha * 0.3);
    const sx = foodX + Math.cos(angle) * dist;
    const sy = foodY + Math.sin(angle) * dist;
    g.fillStyle(hslToHex(270, 70, 80), stealFlashAlpha * 0.5);
    g.fillCircle(sx, sy, 2);
  }
};
