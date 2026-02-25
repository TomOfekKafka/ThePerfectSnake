import Phaser from 'phaser';

export interface SparkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  hue: number;
  brightness: number;
  trail: { x: number; y: number; alpha: number }[];
}

export interface SparkBurstState {
  particles: SparkParticle[];
  flashAlpha: number;
  flashX: number;
  flashY: number;
}

const MAX_SPARK_PARTICLES = 40;
const SPARKS_PER_BURST = 14;
const TRAIL_LENGTH = 4;

export function createSparkBurstState(): SparkBurstState {
  return {
    particles: [],
    flashAlpha: 0,
    flashX: 0,
    flashY: 0,
  };
}

export function spawnSparkBurst(
  state: SparkBurstState,
  headX: number,
  headY: number,
  dirX: number,
  dirY: number
): void {
  while (state.particles.length + SPARKS_PER_BURST > MAX_SPARK_PARTICLES) {
    state.particles.shift();
  }

  const perpX = -dirY;
  const perpY = dirX;

  for (let i = 0; i < SPARKS_PER_BURST; i++) {
    const spread = (Math.random() - 0.5) * 2.5;
    const forwardSpeed = 2.5 + Math.random() * 3.5;
    const sideSpeed = spread * 1.2;
    const life = 0.5 + Math.random() * 0.5;

    state.particles.push({
      x: headX + dirX * 8 + (Math.random() - 0.5) * 6,
      y: headY + dirY * 8 + (Math.random() - 0.5) * 6,
      vx: dirX * forwardSpeed + perpX * sideSpeed,
      vy: dirY * forwardSpeed + perpY * sideSpeed,
      size: 1.5 + Math.random() * 2.5,
      life,
      maxLife: life,
      hue: 40 + Math.random() * 30,
      brightness: 0.7 + Math.random() * 0.3,
      trail: [],
    });
  }

  state.flashAlpha = 0.6;
  state.flashX = headX + dirX * 10;
  state.flashY = headY + dirY * 10;
}

export function updateSparkBurst(state: SparkBurstState): void {
  state.flashAlpha *= 0.85;
  if (state.flashAlpha < 0.01) state.flashAlpha = 0;

  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];

    p.trail.unshift({ x: p.x, y: p.y, alpha: p.life / p.maxLife });
    if (p.trail.length > TRAIL_LENGTH) p.trail.pop();
    for (const t of p.trail) { t.alpha *= 0.6; }

    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.94;
    p.vy *= 0.94;
    p.size *= 0.97;
    p.life -= 0.04;

    if (p.life <= 0 || p.size < 0.3) {
      state.particles.splice(i, 1);
    }
  }
}

function hslToHex(h: number, s: number, l: number): number {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
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
}

export function drawSparkBurst(
  g: Phaser.GameObjects.Graphics,
  state: SparkBurstState
): void {
  if (state.flashAlpha > 0.01) {
    const flashColor = hslToHex(55, 1.0, 0.8);
    g.fillStyle(flashColor, state.flashAlpha * 0.4);
    g.fillCircle(state.flashX, state.flashY, 18);
    g.fillStyle(flashColor, state.flashAlpha * 0.7);
    g.fillCircle(state.flashX, state.flashY, 8);
  }

  for (const p of state.particles) {
    const lifeRatio = p.life / p.maxLife;

    for (const t of p.trail) {
      const trailColor = hslToHex(p.hue, 0.9, 0.4);
      g.fillStyle(trailColor, t.alpha * 0.3);
      g.fillCircle(t.x, t.y, p.size * 0.6);
    }

    const outerColor = hslToHex(p.hue, 1.0, 0.45 + lifeRatio * 0.1);
    g.fillStyle(outerColor, lifeRatio * 0.5);
    g.fillCircle(p.x, p.y, p.size * 1.6);

    const coreColor = hslToHex(p.hue + 10, 0.8, 0.65 + lifeRatio * 0.2);
    g.fillStyle(coreColor, lifeRatio * 0.85);
    g.fillCircle(p.x, p.y, p.size * 0.8);

    const whiteCore = hslToHex(60, 0.3, 0.9);
    g.fillStyle(whiteCore, lifeRatio * p.brightness);
    g.fillCircle(p.x, p.y, p.size * 0.3);
  }
}
