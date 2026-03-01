import Phaser from 'phaser';
import { Obstacle } from '../game/types';

export interface BrickDust {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  color: number;
}

export interface BrickCrumble {
  x: number;
  y: number;
  life: number;
  size: number;
}

export interface ObstacleRenderState {
  dustParticles: BrickDust[];
  crumbles: BrickCrumble[];
  spawnFlashes: { x: number; y: number; life: number }[];
  prevObstacleCount: number;
}

const BRICK_COLORS = [
  { face: 0xcc3322, top: 0xe84444, shadow: 0x881818, mortar: 0x442222, glow: 0xff4422 },
  { face: 0xdd4411, top: 0xff6633, shadow: 0x992200, mortar: 0x441100, glow: 0xff6600 },
  { face: 0xbb2244, top: 0xdd4466, shadow: 0x881133, mortar: 0x440011, glow: 0xff2266 },
  { face: 0xcc4400, top: 0xee6622, shadow: 0x993300, mortar: 0x442200, glow: 0xff5500 },
];

export const createObstacleRenderState = (): ObstacleRenderState => ({
  dustParticles: [],
  crumbles: [],
  spawnFlashes: [],
  prevObstacleCount: 0,
});

export const triggerObstacleSpawnFlash = (
  state: ObstacleRenderState,
  obstacles: Obstacle[],
  cellSize: number
): void => {
  for (const obs of obstacles) {
    const cx = obs.position.x * cellSize + cellSize / 2;
    const cy = obs.position.y * cellSize + cellSize / 2;
    const alreadyFlashed = state.spawnFlashes.some(
      f => Math.abs(f.x - cx) < 1 && Math.abs(f.y - cy) < 1
    );
    if (!alreadyFlashed) {
      state.spawnFlashes.push({ x: cx, y: cy, life: 1.0 });
      for (let i = 0; i < 10; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.8 + Math.random() * 1.8;
        state.dustParticles.push({
          x: cx + (Math.random() - 0.5) * cellSize * 0.4,
          y: cy + (Math.random() - 0.5) * cellSize * 0.4,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.8,
          life: 1.0,
          size: 2 + Math.random() * 3,
          color: Math.random() < 0.5 ? 0xff4422 : 0xffaa44,
        });
      }
    }
  }
};

export const updateObstacleEffects = (
  state: ObstacleRenderState,
  obstacles: Obstacle[],
  cellSize: number
): void => {
  if (obstacles.length > state.prevObstacleCount) {
    triggerObstacleSpawnFlash(state, obstacles, cellSize);
  }
  state.prevObstacleCount = obstacles.length;

  for (const obs of obstacles) {
    if (Math.random() < 0.08) {
      const cx = obs.position.x * cellSize + cellSize / 2;
      const cy = obs.position.y * cellSize + cellSize / 2;
      state.dustParticles.push({
        x: cx + (Math.random() - 0.5) * cellSize * 0.8,
        y: cy - cellSize * 0.3,
        vx: (Math.random() - 0.5) * 0.4,
        vy: -0.3 - Math.random() * 0.5,
        life: 1.0,
        size: 1 + Math.random() * 2,
        color: Math.random() < 0.3 ? 0xff6633 : Math.random() < 0.5 ? 0xff4422 : 0xcc2211,
      });
    }

    if (Math.random() < 0.03) {
      const cx = obs.position.x * cellSize + cellSize / 2;
      const cy = obs.position.y * cellSize + cellSize / 2;
      state.crumbles.push({
        x: cx + (Math.random() - 0.5) * cellSize * 0.7,
        y: cy + (Math.random() - 0.5) * cellSize * 0.7,
        life: 1.0,
        size: 1.5 + Math.random() * 2.5,
      });
    }
  }

  for (let i = state.dustParticles.length - 1; i >= 0; i--) {
    const p = state.dustParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.015;
    p.life -= 0.018;
    if (p.life <= 0) state.dustParticles.splice(i, 1);
  }

  if (state.dustParticles.length > 120) {
    state.dustParticles.splice(0, state.dustParticles.length - 120);
  }

  for (let i = state.crumbles.length - 1; i >= 0; i--) {
    state.crumbles[i].life -= 0.015;
    if (state.crumbles[i].life <= 0) state.crumbles.splice(i, 1);
  }

  for (let i = state.spawnFlashes.length - 1; i >= 0; i--) {
    state.spawnFlashes[i].life -= 0.03;
    if (state.spawnFlashes[i].life <= 0) state.spawnFlashes.splice(i, 1);
  }
};

const drawHazardStripes = (
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  size: number,
  frameCount: number,
  alpha: number
): void => {
  const stripeW = size * 0.18;
  const offset = (frameCount * 0.3) % (stripeW * 2);
  const halfSize = size / 2;

  for (let i = -4; i <= 4; i++) {
    const sx = i * stripeW * 2 + offset;
    if (sx > halfSize || sx + stripeW < -halfSize) continue;
    const clampedX = Math.max(-halfSize, sx);
    const clampedW = Math.min(halfSize, sx + stripeW) - clampedX;
    if (clampedW <= 0) continue;
    g.fillStyle(0x000000, alpha * 0.7);
    g.fillRect(cx + clampedX, cy - halfSize, clampedW, size);
  }
};

const drawSingleBrick = (
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  cellSize: number,
  variant: number,
  frameCount: number,
  spawnScale: number
): void => {
  const colors = BRICK_COLORS[variant % BRICK_COLORS.length];
  const half = (cellSize / 2) * spawnScale;
  const brickSize = half * 1.9;

  const pulse = 0.7 + Math.sin(frameCount * 0.08 + cx * 0.3 + cy * 0.7) * 0.3;
  const fastPulse = 0.5 + Math.sin(frameCount * 0.15 + variant * 2) * 0.5;

  g.fillStyle(colors.glow, 0.12 * pulse * spawnScale);
  g.fillCircle(cx, cy, half * 4);
  g.fillStyle(colors.glow, 0.08 * pulse * spawnScale);
  g.fillCircle(cx, cy, half * 5.5);
  g.fillStyle(0xff0000, 0.04 * fastPulse * spawnScale);
  g.fillCircle(cx, cy, half * 7);

  const brickX = cx - brickSize / 2;
  const brickY = cy - brickSize / 2;

  g.fillStyle(colors.shadow, 0.95 * spawnScale);
  g.fillRect(brickX - 1, brickY - 1, brickSize + 2, brickSize + 2);

  g.fillStyle(colors.face, 0.95 * spawnScale);
  g.fillRect(brickX, brickY, brickSize, brickSize);

  drawHazardStripes(g, cx, cy, brickSize, frameCount, 0.25 * spawnScale);

  g.fillStyle(colors.top, 0.6 * spawnScale);
  g.fillRect(brickX, brickY, brickSize, brickSize * 0.2);

  g.fillStyle(0xffffff, 0.18 * spawnScale);
  g.fillRect(brickX + 2, brickY + 1, brickSize * 0.35, 2);

  g.fillStyle(colors.mortar, 0.6 * spawnScale);
  g.fillRect(cx - 0.5, brickY, 1, brickSize);
  g.fillRect(brickX, cy - 0.5, brickSize, 1);

  const crackAlpha = 0.35 * spawnScale;
  g.lineStyle(1, colors.shadow, crackAlpha);
  const crackSeed = (cx * 7 + cy * 13) % 4;
  if (crackSeed < 1) {
    g.beginPath();
    g.moveTo(brickX + brickSize * 0.2, brickY + brickSize * 0.3);
    g.lineTo(brickX + brickSize * 0.5, brickY + brickSize * 0.6);
    g.lineTo(brickX + brickSize * 0.45, brickY + brickSize * 0.9);
    g.strokePath();
  } else if (crackSeed < 2) {
    g.beginPath();
    g.moveTo(brickX + brickSize * 0.7, brickY + brickSize * 0.1);
    g.lineTo(brickX + brickSize * 0.55, brickY + brickSize * 0.5);
    g.lineTo(brickX + brickSize * 0.65, brickY + brickSize * 0.85);
    g.strokePath();
  }

  const dangerPulse1 = (frameCount * 0.04 + variant) % 1;
  const ring1 = half * 1.0 + dangerPulse1 * half * 1.5;
  const ringAlpha1 = (1 - dangerPulse1) * 0.3 * spawnScale;
  g.lineStyle(2, colors.glow, ringAlpha1);
  g.strokeRect(cx - ring1, cy - ring1, ring1 * 2, ring1 * 2);

  const dangerPulse2 = (frameCount * 0.04 + variant + 0.5) % 1;
  const ring2 = half * 1.0 + dangerPulse2 * half * 1.5;
  const ringAlpha2 = (1 - dangerPulse2) * 0.2 * spawnScale;
  g.lineStyle(1.5, 0xff0000, ringAlpha2);
  g.strokeRect(cx - ring2, cy - ring2, ring2 * 2, ring2 * 2);

  const cornerSize = half * 0.4;
  const cornerAlpha = 0.5 * pulse * spawnScale;
  g.lineStyle(2, 0xff2200, cornerAlpha);
  g.beginPath();
  g.moveTo(brickX - 3, brickY - 3 + cornerSize);
  g.lineTo(brickX - 3, brickY - 3);
  g.lineTo(brickX - 3 + cornerSize, brickY - 3);
  g.strokePath();
  g.beginPath();
  g.moveTo(brickX + brickSize + 3 - cornerSize, brickY - 3);
  g.lineTo(brickX + brickSize + 3, brickY - 3);
  g.lineTo(brickX + brickSize + 3, brickY - 3 + cornerSize);
  g.strokePath();
  g.beginPath();
  g.moveTo(brickX + brickSize + 3, brickY + brickSize + 3 - cornerSize);
  g.lineTo(brickX + brickSize + 3, brickY + brickSize + 3);
  g.lineTo(brickX + brickSize + 3 - cornerSize, brickY + brickSize + 3);
  g.strokePath();
  g.beginPath();
  g.moveTo(brickX - 3 + cornerSize, brickY + brickSize + 3);
  g.lineTo(brickX - 3, brickY + brickSize + 3);
  g.lineTo(brickX - 3, brickY + brickSize + 3 - cornerSize);
  g.strokePath();
};

export const drawObstacles = (
  g: Phaser.GameObjects.Graphics,
  state: ObstacleRenderState,
  obstacles: Obstacle[],
  cellSize: number,
  frameCount: number
): void => {
  for (const f of state.spawnFlashes) {
    const fSize = (1 - f.life) * cellSize * 3;
    g.fillStyle(0xff4422, f.life * 0.25);
    g.fillCircle(f.x, f.y, fSize * 0.6);
    g.fillStyle(0xffcc88, f.life * 0.4);
    const innerSize = (1 - f.life) * cellSize * 1.5;
    g.fillRect(f.x - innerSize / 2, f.y - innerSize / 2, innerSize, innerSize);
    g.lineStyle(2, 0xff6644, f.life * 0.6);
    g.strokeRect(f.x - fSize / 2, f.y - fSize / 2, fSize, fSize);
  }

  for (const obs of obstacles) {
    const cx = obs.position.x * cellSize + cellSize / 2;
    const cy = obs.position.y * cellSize + cellSize / 2;
    const age = frameCount - obs.spawnTick;
    const spawnScale = Math.min(1, age / 15);

    drawSingleBrick(g, cx, cy, cellSize, obs.variant, frameCount, spawnScale);
  }

  for (const c of state.crumbles) {
    g.fillStyle(0xcc3322, c.life * 0.7);
    g.fillRect(c.x - c.size / 2, c.y - c.size / 2, c.size, c.size);
  }

  for (const p of state.dustParticles) {
    g.fillStyle(p.color, p.life * 0.6);
    g.fillCircle(p.x, p.y, p.size * p.life);
  }
};
