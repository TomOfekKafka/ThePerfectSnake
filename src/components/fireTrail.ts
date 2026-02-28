import Phaser from 'phaser';

export interface FireParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  heat: number;
}

export interface FireTrailState {
  particles: FireParticle[];
  lastHeadX: number;
  lastHeadY: number;
}

const MAX_FIRE_PARTICLES = 90;
const PARTICLE_LIFETIME = 38;

const FIRE_CORE = 0xfff4c2;
const FIRE_INNER = 0xffaa22;
const FIRE_MID = 0xff6600;
const FIRE_OUTER = 0xdd2200;
const FIRE_SMOKE = 0x331100;

export function createFireTrailState(): FireTrailState {
  return {
    particles: [],
    lastHeadX: -1,
    lastHeadY: -1,
  };
}

function spawnFireParticles(
  state: FireTrailState,
  x: number,
  y: number,
  count: number,
  intensity: number
): void {
  for (let i = 0; i < count; i++) {
    if (state.particles.length >= MAX_FIRE_PARTICLES) {
      state.particles.shift();
    }
    const spread = 5 * intensity;
    const angle = Math.random() * Math.PI * 2;
    const drift = 0.1 + Math.random() * 0.25;
    const life = PARTICLE_LIFETIME * (0.35 + Math.random() * 0.65) * intensity;
    state.particles.push({
      x: x + (Math.random() - 0.5) * spread,
      y: y + (Math.random() - 0.5) * spread,
      vx: Math.cos(angle) * drift,
      vy: -(0.3 + Math.random() * 0.7) * intensity,
      size: (1.5 + Math.random() * 3.5) * intensity,
      life,
      maxLife: life,
      heat: 0.5 + Math.random() * 0.5,
    });
  }
}

export function updateFireTrail(
  state: FireTrailState,
  headX: number,
  headY: number,
  snake?: { x: number; y: number }[],
  cellSize?: number
): void {
  const moved = headX !== state.lastHeadX || headY !== state.lastHeadY;

  if (moved && state.lastHeadX >= 0) {
    spawnFireParticles(state, state.lastHeadX, state.lastHeadY, 3, 0.7);

    if (snake && cellSize && snake.length > 1) {
      const tail = snake[snake.length - 1];
      const tailX = tail.x * cellSize + cellSize / 2;
      const tailY = tail.y * cellSize + cellSize / 2;
      spawnFireParticles(state, tailX, tailY, 3, 1.0);

      if (snake.length > 3) {
        const midIdx = Math.floor(snake.length * 0.6);
        const mid = snake[midIdx];
        const midX = mid.x * cellSize + cellSize / 2;
        const midY = mid.y * cellSize + cellSize / 2;
        spawnFireParticles(state, midX, midY, 2, 0.5);
      }
    }
  }
  state.lastHeadX = headX;
  state.lastHeadY = headY;

  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.94;
    p.vy *= 0.97;
    p.vx += (Math.random() - 0.5) * 0.25;
    p.size *= 0.975;
    p.life--;
    if (p.life <= 0 || p.size < 0.3) {
      state.particles.splice(i, 1);
    }
  }
}

export function drawFireTrail(
  g: Phaser.GameObjects.Graphics,
  state: FireTrailState
): void {
  for (const p of state.particles) {
    const t = p.life / p.maxLife;
    const alpha = t * p.heat;

    if (t < 0.4) {
      g.fillStyle(FIRE_SMOKE, alpha * 0.1);
      g.fillCircle(p.x, p.y - 1, p.size * 3);
    }

    g.fillStyle(FIRE_OUTER, alpha * 0.25);
    g.fillCircle(p.x, p.y, p.size * 2.2);

    g.fillStyle(FIRE_MID, alpha * 0.4);
    g.fillCircle(p.x, p.y, p.size * 1.4);

    g.fillStyle(FIRE_INNER, alpha * 0.65);
    g.fillCircle(p.x, p.y, p.size * 0.8);

    if (t > 0.3) {
      g.fillStyle(FIRE_CORE, alpha * 0.75);
      g.fillCircle(p.x, p.y, p.size * 0.3);
    }
  }
}
