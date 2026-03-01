import Phaser from 'phaser';

export interface BreathEmber {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  hue: number;
}

export interface DragonBreathState {
  embers: BreathEmber[];
  lastHeadX: number;
  lastHeadY: number;
  headMoving: boolean;
}

const MAX_EMBERS = 35;
const EMBER_SPAWN_RATE = 3;

export function createDragonBreathState(): DragonBreathState {
  return {
    embers: [],
    lastHeadX: -1,
    lastHeadY: -1,
    headMoving: false,
  };
}

export function spawnBreathEmber(
  state: DragonBreathState,
  headX: number,
  headY: number,
  dirX: number,
  dirY: number
): void {
  if (state.embers.length >= MAX_EMBERS) {
    state.embers.shift();
  }

  const spread = (Math.random() - 0.5) * 3;
  const speed = 0.8 + Math.random() * 1.2;
  const life = 0.6 + Math.random() * 0.4;

  state.embers.push({
    x: headX + (Math.random() - 0.5) * 4,
    y: headY + (Math.random() - 0.5) * 4,
    vx: dirX * speed + spread * (dirY !== 0 ? 1 : 0),
    vy: dirY * speed + spread * (dirX !== 0 ? 1 : 0) - 0.3,
    size: 2 + Math.random() * 3,
    life,
    maxLife: life,
    hue: 10 + Math.random() * 35,
  });
}

export function updateDragonBreath(
  state: DragonBreathState,
  headX: number,
  headY: number,
  dirX: number,
  dirY: number
): void {
  const moved = headX !== state.lastHeadX || headY !== state.lastHeadY;
  state.headMoving = moved;

  if (moved || state.embers.length > 0) {
    state.lastHeadX = headX;
    state.lastHeadY = headY;
  }

  if (moved) {
    for (let i = 0; i < EMBER_SPAWN_RATE; i++) {
      spawnBreathEmber(state, headX, headY, dirX, dirY);
    }
  }

  for (let i = state.embers.length - 1; i >= 0; i--) {
    const e = state.embers[i];
    e.x += e.vx;
    e.y += e.vy;
    e.vy -= 0.015;
    e.vx *= 0.97;
    e.size *= 0.98;
    e.life -= 0.03;

    if (e.life <= 0 || e.size < 0.3) {
      state.embers.splice(i, 1);
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

export function drawDragonBreath(
  g: Phaser.GameObjects.Graphics,
  state: DragonBreathState
): void {
  for (const e of state.embers) {
    const lifeRatio = e.life / e.maxLife;
    const outerColor = hslToHex(e.hue, 1.0, 0.3 + lifeRatio * 0.15);
    const coreColor = hslToHex(e.hue + 15, 0.8, 0.55 + lifeRatio * 0.2);

    g.fillStyle(outerColor, lifeRatio * 0.25);
    g.fillCircle(e.x, e.y, e.size * 1.8);

    g.fillStyle(outerColor, lifeRatio * 0.5);
    g.fillCircle(e.x, e.y, e.size * 1.2);

    g.fillStyle(coreColor, lifeRatio * 0.7);
    g.fillCircle(e.x, e.y, e.size * 0.6);
  }
}
