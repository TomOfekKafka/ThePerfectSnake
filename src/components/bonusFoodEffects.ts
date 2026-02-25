import Phaser from 'phaser';

export interface ShrinkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

export interface BonusFoodEffectsState {
  shrinkParticles: ShrinkParticle[];
  pulsePhase: number;
}

const MAX_SHRINK_PARTICLES = 40;

export const createBonusFoodEffectsState = (): BonusFoodEffectsState => ({
  shrinkParticles: [],
  pulsePhase: 0,
});

export const spawnShrinkBurst = (
  state: BonusFoodEffectsState,
  x: number,
  y: number,
  count: number
): void => {
  for (let i = 0; i < count; i++) {
    if (state.shrinkParticles.length >= MAX_SHRINK_PARTICLES) {
      state.shrinkParticles.shift();
    }
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
    const speed = 1.5 + Math.random() * 2.5;
    state.shrinkParticles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      maxLife: 20 + Math.random() * 15,
      size: 2 + Math.random() * 3,
    });
  }
};

export const updateBonusFoodEffects = (state: BonusFoodEffectsState): void => {
  state.pulsePhase += 0.12;
  for (let i = state.shrinkParticles.length - 1; i >= 0; i--) {
    const p = state.shrinkParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.03;
    p.life -= 1 / p.maxLife;
    if (p.life <= 0) {
      state.shrinkParticles.splice(i, 1);
    }
  }
};

const BONUS_COLOR = 0x00ffcc;
const BONUS_GLOW = 0x00ddaa;
const BONUS_HIGHLIGHT = 0xaaffee;
const SHRINK_PARTICLE_COLOR = 0x00ffcc;

export const drawBonusFood = (
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  cellSize: number,
  frameCount: number
): void => {
  const pulseScale = 1 + Math.sin(frameCount * 0.2) * 0.12;
  const glowPulse = 0.5 + Math.sin(frameCount * 0.15) * 0.3;
  const radius = (cellSize / 2) * pulseScale * 0.85;

  g.fillStyle(BONUS_GLOW, glowPulse * 0.15);
  g.fillCircle(x, y, radius + 14);
  g.fillStyle(BONUS_COLOR, glowPulse * 0.25);
  g.fillCircle(x, y, radius + 8);

  const arrowCount = 4;
  for (let i = 0; i < arrowCount; i++) {
    const angle = (Math.PI * 2 * i) / arrowCount + frameCount * 0.05;
    const dist = radius + 6 + Math.sin(frameCount * 0.15 + i) * 3;
    const ax = x + Math.cos(angle) * dist;
    const ay = y + Math.sin(angle) * dist;
    const inward = angle + Math.PI;
    const arrowLen = 4;
    g.lineStyle(2, BONUS_COLOR, 0.6);
    g.lineBetween(
      ax, ay,
      ax + Math.cos(inward) * arrowLen,
      ay + Math.sin(inward) * arrowLen
    );
  }

  g.fillStyle(BONUS_COLOR, 0.95);
  g.fillCircle(x, y, radius);

  g.fillStyle(BONUS_HIGHLIGHT, 0.6);
  g.fillCircle(x - radius * 0.25, y - radius * 0.25, radius * 0.35);

  const innerRadius = radius * 0.45;
  g.lineStyle(2, 0xffffff, 0.7);
  g.strokeCircle(x, y, innerRadius);

  g.lineStyle(2, 0xffffff, 0.8);
  g.lineBetween(x, y - innerRadius * 0.6, x, y + innerRadius * 0.6);
  g.lineBetween(x - innerRadius * 0.5, y - innerRadius * 0.15, x, y - innerRadius * 0.6);
  g.lineBetween(x + innerRadius * 0.5, y - innerRadius * 0.15, x, y - innerRadius * 0.6);
};

export const drawShrinkParticles = (
  g: Phaser.GameObjects.Graphics,
  state: BonusFoodEffectsState
): void => {
  for (const p of state.shrinkParticles) {
    g.fillStyle(SHRINK_PARTICLE_COLOR, p.life * 0.7);
    g.fillCircle(p.x, p.y, p.size * p.life);
    g.fillStyle(0xffffff, p.life * 0.4);
    g.fillCircle(p.x, p.y, p.size * p.life * 0.4);
  }
};
