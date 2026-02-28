import Phaser from 'phaser';

interface WebAnchor {
  x: number;
  y: number;
  age: number;
  maxAge: number;
}

interface WebStrand {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  age: number;
  maxAge: number;
  thickness: number;
}

export interface WebTrailState {
  anchors: WebAnchor[];
  strands: WebStrand[];
  lastHeadX: number;
  lastHeadY: number;
  spawnAccum: number;
}

const MAX_ANCHORS = 40;
const MAX_STRANDS = 80;
const ANCHOR_LIFETIME = 180;
const STRAND_LIFETIME = 160;
const WEB_COLOR = 0xdddddd;
const WEB_GLOW = 0xff2244;

export function createWebTrailState(): WebTrailState {
  return {
    anchors: [],
    strands: [],
    lastHeadX: -1,
    lastHeadY: -1,
    spawnAccum: 0,
  };
}

function spawnWebAt(
  state: WebTrailState,
  x: number,
  y: number
): void {
  if (state.anchors.length >= MAX_ANCHORS) {
    state.anchors.shift();
  }
  state.anchors.push({
    x,
    y,
    age: 0,
    maxAge: ANCHOR_LIFETIME,
  });

  const anchorCount = state.anchors.length;
  if (anchorCount < 2) return;

  const prev = state.anchors[anchorCount - 2];
  if (state.strands.length >= MAX_STRANDS) {
    state.strands.shift();
  }
  state.strands.push({
    x1: prev.x,
    y1: prev.y,
    x2: x,
    y2: y,
    age: 0,
    maxAge: STRAND_LIFETIME,
    thickness: 1 + Math.random() * 0.5,
  });

  const radialCount = 2 + Math.floor(Math.random() * 2);
  for (let i = 0; i < radialCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const length = 8 + Math.random() * 14;
    const ex = x + Math.cos(angle) * length;
    const ey = y + Math.sin(angle) * length;
    if (state.strands.length >= MAX_STRANDS) {
      state.strands.shift();
    }
    state.strands.push({
      x1: x,
      y1: y,
      x2: ex,
      y2: ey,
      age: 0,
      maxAge: STRAND_LIFETIME * (0.6 + Math.random() * 0.4),
      thickness: 0.5 + Math.random() * 0.5,
    });
  }
}

export function updateWebTrail(
  state: WebTrailState,
  snake: { x: number; y: number }[],
  cellSize: number
): void {
  if (snake.length === 0) return;

  const head = snake[0];
  const hx = head.x * cellSize + cellSize / 2;
  const hy = head.y * cellSize + cellSize / 2;

  const moved = hx !== state.lastHeadX || hy !== state.lastHeadY;
  if (moved && state.lastHeadX >= 0) {
    state.spawnAccum++;
    if (state.spawnAccum >= 2) {
      spawnWebAt(state, state.lastHeadX, state.lastHeadY);
      state.spawnAccum = 0;
    }
  }

  state.lastHeadX = hx;
  state.lastHeadY = hy;

  for (let i = state.anchors.length - 1; i >= 0; i--) {
    state.anchors[i].age++;
    if (state.anchors[i].age >= state.anchors[i].maxAge) {
      state.anchors.splice(i, 1);
    }
  }

  for (let i = state.strands.length - 1; i >= 0; i--) {
    state.strands[i].age++;
    if (state.strands[i].age >= state.strands[i].maxAge) {
      state.strands.splice(i, 1);
    }
  }
}

export function drawWebTrail(
  g: Phaser.GameObjects.Graphics,
  state: WebTrailState,
  frameCount: number
): void {
  for (const strand of state.strands) {
    const life = 1 - strand.age / strand.maxAge;
    const shimmer = 0.8 + Math.sin(frameCount * 0.05 + strand.x1 * 0.1) * 0.2;
    const alpha = life * 0.35 * shimmer;

    g.lineStyle(strand.thickness * life + 0.3, WEB_COLOR, alpha);
    g.lineBetween(strand.x1, strand.y1, strand.x2, strand.y2);

    if (life > 0.5) {
      g.lineStyle(strand.thickness * life * 1.8, WEB_GLOW, alpha * 0.12);
      g.lineBetween(strand.x1, strand.y1, strand.x2, strand.y2);
    }
  }

  for (const anchor of state.anchors) {
    const life = 1 - anchor.age / anchor.maxAge;
    if (life < 0.3) continue;

    const pulse = 0.8 + Math.sin(frameCount * 0.08 + anchor.x * 0.2) * 0.2;
    g.fillStyle(WEB_COLOR, life * 0.3 * pulse);
    g.fillCircle(anchor.x, anchor.y, 1.5 * life);

    if (life > 0.6) {
      g.fillStyle(WEB_GLOW, life * 0.08 * pulse);
      g.fillCircle(anchor.x, anchor.y, 4 * life);
    }
  }
}
