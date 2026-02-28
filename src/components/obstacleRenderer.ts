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
  { face: 0xb5451b, top: 0xd4623a, shadow: 0x8a3314, mortar: 0xc9b89e },
  { face: 0xa83232, top: 0xc74848, shadow: 0x7a2020, mortar: 0xbfae95 },
  { face: 0x8b6914, top: 0xb08a2e, shadow: 0x6b4e0c, mortar: 0xc9b89e },
  { face: 0x6b6b6b, top: 0x8a8a8a, shadow: 0x4a4a4a, mortar: 0xaaaaaa },
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
      for (let i = 0; i < 6; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 1.2;
        state.dustParticles.push({
          x: cx + (Math.random() - 0.5) * cellSize * 0.4,
          y: cy + (Math.random() - 0.5) * cellSize * 0.4,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.5,
          life: 1.0,
          size: 1.5 + Math.random() * 2.5,
          color: 0xc9b89e,
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
    if (Math.random() < 0.06) {
      const cx = obs.position.x * cellSize + cellSize / 2;
      const cy = obs.position.y * cellSize + cellSize / 2;
      state.dustParticles.push({
        x: cx + (Math.random() - 0.5) * cellSize * 0.8,
        y: cy + cellSize * 0.3,
        vx: (Math.random() - 0.5) * 0.3,
        vy: 0.2 + Math.random() * 0.4,
        life: 1.0,
        size: 0.8 + Math.random() * 1.5,
        color: Math.random() < 0.5 ? 0xc9b89e : 0xa89070,
      });
    }

    if (Math.random() < 0.02) {
      const cx = obs.position.x * cellSize + cellSize / 2;
      const cy = obs.position.y * cellSize + cellSize / 2;
      state.crumbles.push({
        x: cx + (Math.random() - 0.5) * cellSize * 0.7,
        y: cy + (Math.random() - 0.5) * cellSize * 0.7,
        life: 1.0,
        size: 1 + Math.random() * 2,
      });
    }
  }

  for (let i = state.dustParticles.length - 1; i >= 0; i--) {
    const p = state.dustParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.02;
    p.life -= 0.02;
    if (p.life <= 0) state.dustParticles.splice(i, 1);
  }

  if (state.dustParticles.length > 100) {
    state.dustParticles.splice(0, state.dustParticles.length - 100);
  }

  for (let i = state.crumbles.length - 1; i >= 0; i--) {
    state.crumbles[i].life -= 0.015;
    if (state.crumbles[i].life <= 0) state.crumbles.splice(i, 1);
  }

  for (let i = state.spawnFlashes.length - 1; i >= 0; i--) {
    state.spawnFlashes[i].life -= 0.04;
    if (state.spawnFlashes[i].life <= 0) state.spawnFlashes.splice(i, 1);
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
  const brickW = half * 1.8;
  const brickH = half * 1.4;
  const mortarW = 1.5;

  const pulse = 0.85 + Math.sin(frameCount * 0.05 + cx * 0.3 + cy * 0.7) * 0.15;

  g.fillStyle(0xff4400, 0.06 * pulse * spawnScale);
  g.fillCircle(cx, cy, half * 2.5);
  g.fillStyle(0xff2200, 0.03 * pulse * spawnScale);
  g.fillCircle(cx, cy, half * 3.5);

  const brickX = cx - brickW / 2;
  const brickY = cy - brickH / 2;

  g.fillStyle(colors.mortar, 0.9 * spawnScale);
  g.fillRect(brickX - mortarW, brickY - mortarW, brickW + mortarW * 2, brickH + mortarW * 2);

  g.fillStyle(colors.shadow, 0.95 * spawnScale);
  g.fillRect(brickX + 1, brickY + 1, brickW, brickH);

  g.fillStyle(colors.face, 0.95 * spawnScale);
  g.fillRect(brickX, brickY, brickW, brickH);

  g.fillStyle(colors.top, 0.7 * spawnScale);
  g.fillRect(brickX, brickY, brickW, brickH * 0.25);

  g.fillStyle(0xffffff, 0.12 * spawnScale);
  g.fillRect(brickX + 2, brickY + 1, brickW * 0.3, 1.5);

  g.fillStyle(colors.mortar, 0.5 * spawnScale);
  g.fillRect(brickX + brickW * 0.48, brickY, mortarW, brickH);

  const crackAlpha = 0.25 * spawnScale;
  g.lineStyle(0.8, colors.shadow, crackAlpha);
  const crackSeed = (cx * 7 + cy * 13) % 4;
  if (crackSeed < 1) {
    g.beginPath();
    g.moveTo(brickX + brickW * 0.2, brickY + brickH * 0.3);
    g.lineTo(brickX + brickW * 0.5, brickY + brickH * 0.6);
    g.lineTo(brickX + brickW * 0.45, brickY + brickH * 0.9);
    g.strokePath();
  } else if (crackSeed < 2) {
    g.beginPath();
    g.moveTo(brickX + brickW * 0.7, brickY + brickH * 0.1);
    g.lineTo(brickX + brickW * 0.55, brickY + brickH * 0.5);
    g.strokePath();
  }

  const dangerPulse = (frameCount * 0.03 + variant) % 1;
  const ringRadius = half * 0.9 + dangerPulse * half * 0.8;
  const ringAlpha = (1 - dangerPulse) * 0.15 * spawnScale;
  g.lineStyle(1.2, 0xff4400, ringAlpha);
  g.strokeRect(cx - ringRadius, cy - ringRadius, ringRadius * 2, ringRadius * 2);
};

export const drawObstacles = (
  g: Phaser.GameObjects.Graphics,
  state: ObstacleRenderState,
  obstacles: Obstacle[],
  cellSize: number,
  frameCount: number
): void => {
  for (const f of state.spawnFlashes) {
    g.fillStyle(0xffcc88, f.life * 0.35);
    const fSize = (1 - f.life) * cellSize * 2;
    g.fillRect(f.x - fSize / 2, f.y - fSize / 2, fSize, fSize);
    g.lineStyle(1.5, 0xffaa44, f.life * 0.5);
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
    g.fillStyle(0x8a6040, c.life * 0.6);
    g.fillRect(c.x - c.size / 2, c.y - c.size / 2, c.size, c.size);
  }

  for (const p of state.dustParticles) {
    g.fillStyle(p.color, p.life * 0.5);
    g.fillCircle(p.x, p.y, p.size * p.life);
  }
};
