import Phaser from 'phaser';
import { Obstacle } from '../game/types';

export interface ObstacleParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  color: number;
}

export interface ObstacleRenderState {
  particles: ObstacleParticle[];
  spawnFlashes: { x: number; y: number; life: number; radius: number }[];
}

const VARIANT_COLORS: { core: number; glow: number; ring: number }[] = [
  { core: 0xff2244, glow: 0xff4466, ring: 0xff6688 },
  { core: 0xcc11ff, glow: 0xdd44ff, ring: 0xee77ff },
  { core: 0xff6600, glow: 0xff8833, ring: 0xffaa55 },
  { core: 0x00ccff, glow: 0x33ddff, ring: 0x66eeff },
];

export const createObstacleRenderState = (): ObstacleRenderState => ({
  particles: [],
  spawnFlashes: [],
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
      state.spawnFlashes.push({ x: cx, y: cy, life: 1.0, radius: 0 });
    }
  }
};

export const updateObstacleEffects = (
  state: ObstacleRenderState,
  obstacles: Obstacle[],
  cellSize: number
): void => {
  for (const obs of obstacles) {
    if (Math.random() < 0.15) {
      const cx = obs.position.x * cellSize + cellSize / 2;
      const cy = obs.position.y * cellSize + cellSize / 2;
      const colors = VARIANT_COLORS[obs.variant % VARIANT_COLORS.length];
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.3 + Math.random() * 0.5;
      state.particles.push({
        x: cx + (Math.random() - 0.5) * cellSize * 0.6,
        y: cy + (Math.random() - 0.5) * cellSize * 0.6,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.3,
        life: 1.0,
        size: 1 + Math.random() * 2,
        color: colors.glow,
      });
    }
  }

  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.025;
    if (p.life <= 0) {
      state.particles.splice(i, 1);
    }
  }

  for (let i = state.spawnFlashes.length - 1; i >= 0; i--) {
    const f = state.spawnFlashes[i];
    f.life -= 0.03;
    f.radius += 1.5;
    if (f.life <= 0) {
      state.spawnFlashes.splice(i, 1);
    }
  }
};

const drawCrystalSpike = (
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  size: number,
  rotation: number,
  coreColor: number,
  alpha: number
): void => {
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  const tipX = cx + cos * size;
  const tipY = cy + sin * size;
  const perpX = -sin * size * 0.35;
  const perpY = cos * size * 0.35;

  g.fillStyle(coreColor, alpha);
  g.fillTriangle(
    tipX, tipY,
    cx - cos * size * 0.3 + perpX, cy - sin * size * 0.3 + perpY,
    cx - cos * size * 0.3 - perpX, cy - sin * size * 0.3 - perpY
  );
};

export const drawObstacles = (
  g: Phaser.GameObjects.Graphics,
  state: ObstacleRenderState,
  obstacles: Obstacle[],
  cellSize: number,
  frameCount: number
): void => {
  for (const f of state.spawnFlashes) {
    g.fillStyle(0xffffff, f.life * 0.4);
    g.fillCircle(f.x, f.y, f.radius);
    g.lineStyle(2, 0xff4466, f.life * 0.6);
    g.strokeCircle(f.x, f.y, f.radius * 0.7);
  }

  for (const obs of obstacles) {
    const cx = obs.position.x * cellSize + cellSize / 2;
    const cy = obs.position.y * cellSize + cellSize / 2;
    const colors = VARIANT_COLORS[obs.variant % VARIANT_COLORS.length];
    const age = frameCount - obs.spawnTick;
    const spawnScale = Math.min(1, age / 20);
    const pulse = 0.8 + Math.sin(frameCount * 0.08 + obs.position.x * 3 + obs.position.y * 7) * 0.2;
    const halfCell = (cellSize / 2) * spawnScale;

    g.fillStyle(colors.glow, 0.12 * pulse * spawnScale);
    g.fillCircle(cx, cy, halfCell * 2.2);
    g.fillStyle(colors.glow, 0.08 * pulse * spawnScale);
    g.fillCircle(cx, cy, halfCell * 3);

    const warningPulse = (frameCount * 0.04 + obs.variant) % 1;
    const warningRadius = halfCell * 1.2 + warningPulse * halfCell * 1.5;
    const warningAlpha = (1 - warningPulse) * 0.25 * spawnScale;
    g.lineStyle(1.5, colors.ring, warningAlpha);
    g.strokeCircle(cx, cy, warningRadius);

    const spikeCount = 4 + (obs.variant % 2);
    for (let i = 0; i < spikeCount; i++) {
      const angle = (i / spikeCount) * Math.PI * 2 + frameCount * 0.01;
      const spikeSize = halfCell * (0.7 + Math.sin(frameCount * 0.06 + i * 1.5) * 0.15);
      drawCrystalSpike(g, cx, cy, spikeSize * spawnScale, angle, colors.core, 0.85 * spawnScale);
    }

    g.fillStyle(colors.core, 0.9 * spawnScale);
    g.fillCircle(cx, cy, halfCell * 0.35);
    g.fillStyle(0xffffff, 0.6 * pulse * spawnScale);
    g.fillCircle(cx, cy, halfCell * 0.15);

    if (obs.variant % 2 === 0) {
      g.lineStyle(1, colors.ring, 0.3 * spawnScale);
      g.strokeCircle(cx, cy, halfCell * 0.55 + Math.sin(frameCount * 0.1) * 2);
    }
  }

  for (const p of state.particles) {
    g.fillStyle(p.color, p.life * 0.6);
    g.fillCircle(p.x, p.y, p.size * p.life);
  }
};
