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
  kind: 'flame' | 'ember' | 'smoke';
}

export interface FireTrailState {
  particles: FireParticle[];
  lastHeadX: number;
  lastHeadY: number;
}

const MAX_FIRE_PARTICLES = 220;
const FLAME_LIFETIME = 42;
const EMBER_LIFETIME = 55;
const SMOKE_LIFETIME = 60;

const FIRE_WHITE = 0xffffff;
const FIRE_CORE = 0xf0eef5;
const FIRE_INNER = 0xe0d8e8;
const FIRE_MID = 0xd0c8d8;
const FIRE_OUTER = 0xc0b8c8;
const FIRE_DEEP = 0xb0a8b8;
const FIRE_SMOKE = 0xa098a8;

export function createFireTrailState(): FireTrailState {
  return {
    particles: [],
    lastHeadX: -1,
    lastHeadY: -1,
  };
}

function pushParticle(state: FireTrailState, p: FireParticle): void {
  if (state.particles.length >= MAX_FIRE_PARTICLES) {
    state.particles.shift();
  }
  state.particles.push(p);
}

function spawnFlame(
  state: FireTrailState,
  x: number,
  y: number,
  intensity: number
): void {
  const spread = 6 * intensity;
  const angle = Math.random() * Math.PI * 2;
  const drift = 0.15 + Math.random() * 0.35;
  const life = FLAME_LIFETIME * (0.4 + Math.random() * 0.6) * intensity;
  pushParticle(state, {
    x: x + (Math.random() - 0.5) * spread,
    y: y + (Math.random() - 0.5) * spread,
    vx: Math.cos(angle) * drift,
    vy: -(0.4 + Math.random() * 0.9) * intensity,
    size: (2.5 + Math.random() * 4.5) * intensity,
    life,
    maxLife: life,
    heat: 0.5 + Math.random() * 0.5,
    kind: 'flame',
  });
}

function spawnEmber(
  state: FireTrailState,
  x: number,
  y: number,
  intensity: number
): void {
  const angle = Math.random() * Math.PI * 2;
  const speed = 0.5 + Math.random() * 1.5;
  const life = EMBER_LIFETIME * (0.3 + Math.random() * 0.7) * intensity;
  pushParticle(state, {
    x: x + (Math.random() - 0.5) * 4,
    y: y + (Math.random() - 0.5) * 4,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed - 0.8 * intensity,
    size: (0.8 + Math.random() * 1.5) * intensity,
    life,
    maxLife: life,
    heat: 0.7 + Math.random() * 0.3,
    kind: 'ember',
  });
}

function spawnSmoke(
  state: FireTrailState,
  x: number,
  y: number,
  intensity: number
): void {
  const life = SMOKE_LIFETIME * (0.5 + Math.random() * 0.5) * intensity;
  pushParticle(state, {
    x: x + (Math.random() - 0.5) * 8,
    y: y + (Math.random() - 0.5) * 6,
    vx: (Math.random() - 0.5) * 0.3,
    vy: -(0.2 + Math.random() * 0.5),
    size: (3 + Math.random() * 5) * intensity,
    life,
    maxLife: life,
    heat: 0.2 + Math.random() * 0.3,
    kind: 'smoke',
  });
}

function spawnFireBurst(
  state: FireTrailState,
  x: number,
  y: number,
  flames: number,
  embers: number,
  smokes: number,
  intensity: number
): void {
  for (let i = 0; i < flames; i++) spawnFlame(state, x, y, intensity);
  for (let i = 0; i < embers; i++) spawnEmber(state, x, y, intensity);
  for (let i = 0; i < smokes; i++) spawnSmoke(state, x, y, intensity);
}

export function updateFireTrail(
  state: FireTrailState,
  headX: number,
  headY: number,
  snake?: { x: number; y: number }[],
  cellSize?: number
): void {
  const moved = headX !== state.lastHeadX || headY !== state.lastHeadY;

  if (moved && state.lastHeadX >= 0 && snake && cellSize) {
    spawnFireBurst(state, headX, headY, 3, 1, 0, 0.9);

    const len = snake.length;
    const step = Math.max(1, Math.floor(len / 10));
    for (let i = 1; i < len; i += step) {
      const seg = snake[i];
      const sx = seg.x * cellSize + cellSize / 2;
      const sy = seg.y * cellSize + cellSize / 2;
      const bodyIntensity = 0.5 + 0.5 * (i / (len - 1));
      spawnFireBurst(state, sx, sy, 2, 1, 0, bodyIntensity);
    }

    const tail = snake[len - 1];
    const tailX = tail.x * cellSize + cellSize / 2;
    const tailY = tail.y * cellSize + cellSize / 2;
    spawnFireBurst(state, tailX, tailY, 3, 2, 1, 1.0);
  } else if (moved && state.lastHeadX >= 0) {
    spawnFireBurst(state, headX, headY, 3, 1, 0, 0.8);
  }

  state.lastHeadX = headX;
  state.lastHeadY = headY;

  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    p.x += p.vx;
    p.y += p.vy;

    if (p.kind === 'flame') {
      p.vx *= 0.93;
      p.vy *= 0.96;
      p.vx += (Math.random() - 0.5) * 0.3;
      p.vy -= 0.02;
      p.size *= 0.97;
    } else if (p.kind === 'ember') {
      p.vx *= 0.97;
      p.vy *= 0.97;
      p.vy -= 0.015;
      p.vx += (Math.random() - 0.5) * 0.15;
      p.size *= 0.985;
    } else {
      p.vx *= 0.96;
      p.vy *= 0.99;
      p.vx += (Math.random() - 0.5) * 0.1;
      p.size *= 1.01;
    }

    p.life--;
    if (p.life <= 0 || (p.kind !== 'smoke' && p.size < 0.2)) {
      state.particles.splice(i, 1);
    }
  }
}

function drawFlame(g: Phaser.GameObjects.Graphics, p: FireParticle): void {
  const t = p.life / p.maxLife;
  const alpha = t * p.heat;

  g.fillStyle(FIRE_DEEP, alpha * 0.15);
  g.fillCircle(p.x, p.y, p.size * 2.8);

  g.fillStyle(FIRE_OUTER, alpha * 0.3);
  g.fillCircle(p.x, p.y, p.size * 2.2);

  g.fillStyle(FIRE_MID, alpha * 0.5);
  g.fillCircle(p.x, p.y, p.size * 1.5);

  g.fillStyle(FIRE_INNER, alpha * 0.7);
  g.fillCircle(p.x, p.y, p.size * 0.9);

  if (t > 0.4) {
    g.fillStyle(FIRE_CORE, alpha * 0.8);
    g.fillCircle(p.x, p.y, p.size * 0.4);
  }
  if (t > 0.7) {
    g.fillStyle(FIRE_WHITE, alpha * 0.4);
    g.fillCircle(p.x, p.y, p.size * 0.15);
  }
}

function drawEmber(g: Phaser.GameObjects.Graphics, p: FireParticle): void {
  const t = p.life / p.maxLife;
  const alpha = t * p.heat;

  g.fillStyle(FIRE_INNER, alpha * 0.8);
  g.fillCircle(p.x, p.y, p.size * 1.2);

  g.fillStyle(FIRE_CORE, alpha * 0.9);
  g.fillCircle(p.x, p.y, p.size * 0.5);
}

function drawSmokeParticle(g: Phaser.GameObjects.Graphics, p: FireParticle): void {
  const t = p.life / p.maxLife;
  const alpha = t * 0.08;

  g.fillStyle(FIRE_SMOKE, alpha);
  g.fillCircle(p.x, p.y - 2, p.size * 2);

  g.fillStyle(0x110022, alpha * 0.5);
  g.fillCircle(p.x, p.y - 2, p.size * 1.2);
}

export function drawFireTrail(
  g: Phaser.GameObjects.Graphics,
  state: FireTrailState
): void {
  for (const p of state.particles) {
    if (p.kind === 'smoke') drawSmokeParticle(g, p);
  }
  for (const p of state.particles) {
    if (p.kind === 'flame') drawFlame(g, p);
  }
  for (const p of state.particles) {
    if (p.kind === 'ember') drawEmber(g, p);
  }
}

export function drawFireGlow(
  g: Phaser.GameObjects.Graphics,
  snake: { x: number; y: number }[],
  cellSize: number,
  frameCount: number
): void {
  const len = snake.length;
  if (len === 0) return;

  for (let i = 0; i < len; i++) {
    const seg = snake[i];
    const sx = seg.x * cellSize + cellSize / 2;
    const sy = seg.y * cellSize + cellSize / 2;
    const progress = len > 1 ? i / (len - 1) : 0;

    const pulse = 0.7 + Math.sin(frameCount * 0.08 + progress * 4) * 0.3;
    const glowSize = cellSize * (0.8 + (1 - progress) * 0.4) * pulse;

    const headHeat = 1 - progress;
    const glowColor = headHeat > 0.7 ? FIRE_CORE : headHeat > 0.3 ? FIRE_INNER : FIRE_MID;
    const glowAlpha = (0.06 + headHeat * 0.08) * pulse;

    g.fillStyle(glowColor, glowAlpha);
    g.fillCircle(sx, sy, glowSize);

    if (headHeat > 0.5) {
      g.fillStyle(FIRE_OUTER, glowAlpha * 0.4);
      g.fillCircle(sx, sy, glowSize * 1.4);
    }
  }
}
