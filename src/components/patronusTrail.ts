import Phaser from 'phaser';

export interface PatronusMote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  brightness: number;
}

export interface PatronusTrailState {
  motes: PatronusMote[];
  lastHeadX: number;
  lastHeadY: number;
}

const MAX_MOTES = 35;
const MOTE_LIFETIME = 50;
const PATRONUS_SILVER = 0xc0d8f0;
const PATRONUS_WHITE = 0xe8f0ff;
const PATRONUS_BLUE = 0x88aadd;

export function createPatronusTrailState(): PatronusTrailState {
  return {
    motes: [],
    lastHeadX: -1,
    lastHeadY: -1,
  };
}

export function updatePatronusTrail(
  state: PatronusTrailState,
  headX: number,
  headY: number
): void {
  const moved = headX !== state.lastHeadX || headY !== state.lastHeadY;

  if (moved && state.lastHeadX >= 0) {
    spawnPatronusMotes(state, state.lastHeadX, state.lastHeadY, 2);
  }
  state.lastHeadX = headX;
  state.lastHeadY = headY;

  for (let i = state.motes.length - 1; i >= 0; i--) {
    const m = state.motes[i];
    m.x += m.vx;
    m.y += m.vy;
    m.vy -= 0.015;
    m.vx *= 0.96;
    m.size *= 0.985;
    m.life--;
    if (m.life <= 0 || m.size < 0.2) {
      state.motes.splice(i, 1);
    }
  }
}

function spawnPatronusMotes(
  state: PatronusTrailState,
  x: number,
  y: number,
  count: number
): void {
  for (let i = 0; i < count; i++) {
    if (state.motes.length >= MAX_MOTES) {
      state.motes.shift();
    }
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.2 + Math.random() * 0.5;
    const life = MOTE_LIFETIME * (0.5 + Math.random() * 0.5);
    state.motes.push({
      x: x + (Math.random() - 0.5) * 8,
      y: y + (Math.random() - 0.5) * 8,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 1.5 + Math.random() * 2.5,
      life,
      maxLife: life,
      brightness: 0.5 + Math.random() * 0.5,
    });
  }
}

export function drawPatronusTrail(
  g: Phaser.GameObjects.Graphics,
  state: PatronusTrailState
): void {
  for (const m of state.motes) {
    const t = m.life / m.maxLife;
    const alpha = t * m.brightness;

    g.fillStyle(PATRONUS_BLUE, alpha * 0.15);
    g.fillCircle(m.x, m.y, m.size * 3);

    g.fillStyle(PATRONUS_SILVER, alpha * 0.4);
    g.fillCircle(m.x, m.y, m.size * 1.5);

    g.fillStyle(PATRONUS_WHITE, alpha * 0.7);
    g.fillCircle(m.x, m.y, m.size * 0.6);
  }
}

export function getPatronusColors(): { silver: number; white: number; blue: number } {
  return { silver: PATRONUS_SILVER, white: PATRONUS_WHITE, blue: PATRONUS_BLUE };
}
