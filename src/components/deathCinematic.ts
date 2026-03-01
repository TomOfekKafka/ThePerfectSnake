import Phaser from 'phaser';
import { THEME } from './gameTheme';

export interface DeathCinematicState {
  active: boolean;
  phase: number;
  slowMoFactor: number;
  zoomLevel: number;
  focusX: number;
  focusY: number;
  flashAlpha: number;
  ghostSegments: GhostSegment[];
  shatterParticles: ShatterParticle[];
  rippleWaves: RippleWave[];
  fadeProgress: number;
}

interface GhostSegment {
  x: number;
  y: number;
  targetY: number;
  alpha: number;
  size: number;
  driftX: number;
  driftSpeed: number;
}

interface ShatterParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  rotSpeed: number;
  alpha: number;
  color: number;
}

interface RippleWave {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  thickness: number;
}

const MAX_SHATTER = 40;
const MAX_GHOSTS = 15;
const MAX_RIPPLES = 5;

export function createDeathCinematicState(): DeathCinematicState {
  return {
    active: false,
    phase: 0,
    slowMoFactor: 1,
    zoomLevel: 1,
    focusX: 0,
    focusY: 0,
    flashAlpha: 0,
    ghostSegments: [],
    shatterParticles: [],
    rippleWaves: [],
    fadeProgress: 0,
  };
}

export function triggerDeathCinematic(
  state: DeathCinematicState,
  snake: { x: number; y: number }[],
  cellSize: number
): void {
  state.active = true;
  state.phase = 0;
  state.slowMoFactor = 0.1;
  state.flashAlpha = 1.0;
  state.fadeProgress = 0;
  state.ghostSegments = [];
  state.shatterParticles = [];
  state.rippleWaves = [];

  if (snake.length === 0) return;

  const head = snake[0];
  state.focusX = head.x * cellSize + cellSize / 2;
  state.focusY = head.y * cellSize + cellSize / 2;

  state.rippleWaves.push({
    x: state.focusX,
    y: state.focusY,
    radius: 5,
    alpha: 0.8,
    thickness: 4,
  });

  const ghostCount = Math.min(MAX_GHOSTS, snake.length);
  for (let i = 0; i < ghostCount; i++) {
    const seg = snake[i];
    const cx = seg.x * cellSize + cellSize / 2;
    const cy = seg.y * cellSize + cellSize / 2;
    state.ghostSegments.push({
      x: cx,
      y: cy,
      targetY: cy - 30 - Math.random() * 40,
      alpha: 0.8 - (i / ghostCount) * 0.4,
      size: (cellSize - 2) * (1 - (i / ghostCount) * 0.3),
      driftX: (Math.random() - 0.5) * 0.8,
      driftSpeed: 0.005 + Math.random() * 0.01,
    });
  }

  for (let i = 0; i < MAX_SHATTER; i++) {
    const srcIdx = Math.floor(Math.random() * snake.length);
    const seg = snake[srcIdx];
    const cx = seg.x * cellSize + cellSize / 2;
    const cy = seg.y * cellSize + cellSize / 2;
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 4;
    const colors = [THEME.snake.head, THEME.snake.body, THEME.snake.glow, THEME.snake.tail];
    state.shatterParticles.push({
      x: cx + (Math.random() - 0.5) * 6,
      y: cy + (Math.random() - 0.5) * 6,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1,
      size: 2 + Math.random() * 4,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.2,
      alpha: 0.8 + Math.random() * 0.2,
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  }
}

export function updateDeathCinematic(state: DeathCinematicState): void {
  if (!state.active) return;

  state.phase += 0.016;
  state.slowMoFactor = Math.min(1, state.slowMoFactor + 0.008);
  state.flashAlpha *= 0.92;
  state.fadeProgress = Math.min(1, state.fadeProgress + 0.012);

  for (const ghost of state.ghostSegments) {
    ghost.y += (ghost.targetY - ghost.y) * ghost.driftSpeed * 3;
    ghost.x += ghost.driftX;
    ghost.alpha *= 0.995;
  }

  for (let i = state.shatterParticles.length - 1; i >= 0; i--) {
    const p = state.shatterParticles[i];
    p.x += p.vx * state.slowMoFactor;
    p.y += p.vy * state.slowMoFactor;
    p.vy += 0.08 * state.slowMoFactor;
    p.rotation += p.rotSpeed * state.slowMoFactor;
    p.alpha *= 0.985;
    if (p.alpha < 0.01) {
      state.shatterParticles.splice(i, 1);
    }
  }

  for (let i = state.rippleWaves.length - 1; i >= 0; i--) {
    const r = state.rippleWaves[i];
    r.radius += 2.5;
    r.alpha *= 0.96;
    r.thickness *= 0.98;
    if (r.alpha < 0.01) {
      state.rippleWaves.splice(i, 1);
    }
  }

  if (state.rippleWaves.length < MAX_RIPPLES && state.phase < 1.5 && Math.random() < 0.04) {
    state.rippleWaves.push({
      x: state.focusX + (Math.random() - 0.5) * 20,
      y: state.focusY + (Math.random() - 0.5) * 20,
      radius: 3,
      alpha: 0.5,
      thickness: 3,
    });
  }

  if (state.phase > 4) {
    state.active = false;
  }
}

export function drawDeathCinematic(
  state: DeathCinematicState,
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  frameCount: number
): void {
  if (!state.active && state.ghostSegments.length === 0) return;

  if (state.flashAlpha > 0.01) {
    g.fillStyle(0xffffff, state.flashAlpha * 0.6);
    g.fillRect(0, 0, width, height);
  }

  for (const ripple of state.rippleWaves) {
    g.lineStyle(ripple.thickness, THEME.snake.glow, ripple.alpha);
    g.strokeCircle(ripple.x, ripple.y, ripple.radius);
  }

  for (const p of state.shatterParticles) {
    g.fillStyle(p.color, p.alpha * 0.3);
    g.fillCircle(p.x, p.y, p.size + 2);
    g.fillStyle(p.color, p.alpha);
    const half = p.size / 2;
    g.fillRect(p.x - half, p.y - half, p.size, p.size);
    g.fillStyle(0xffffff, p.alpha * 0.3);
    g.fillCircle(p.x, p.y, p.size * 0.3);
  }

  for (const ghost of state.ghostSegments) {
    if (ghost.alpha < 0.02) continue;
    const pulse = Math.sin(frameCount * 0.08 + ghost.x * 0.1) * 0.1;
    g.fillStyle(THEME.snake.glow, (ghost.alpha * 0.15 + pulse * 0.05));
    g.fillCircle(ghost.x, ghost.y, ghost.size + 4);
    g.fillStyle(THEME.snake.head, ghost.alpha * 0.5);
    g.fillCircle(ghost.x, ghost.y, ghost.size / 2);
    g.fillStyle(0xffffff, ghost.alpha * 0.2);
    g.fillCircle(ghost.x - ghost.size * 0.15, ghost.y - ghost.size * 0.15, ghost.size * 0.2);
  }
}
