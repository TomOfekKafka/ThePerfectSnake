import Phaser from 'phaser';
import { FoodType } from './foodVariety';
import { darkenColor } from './depth3d';

interface SliceTrailPoint {
  x: number;
  y: number;
  age: number;
}

interface FruitHalf {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  size: number;
  life: number;
  side: -1 | 1;
  color: number;
  innerColor: number;
}

interface JuiceDrop {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  color: number;
}

interface JuiceSplat {
  x: number;
  y: number;
  radius: number;
  life: number;
  color: number;
}

interface SliceArc {
  points: SliceTrailPoint[];
  life: number;
  color: number;
  glowColor: number;
}

export interface FruitNinjaState {
  sliceArcs: SliceArc[];
  fruitHalves: FruitHalf[];
  juiceDrops: JuiceDrop[];
  juiceSplats: JuiceSplat[];
}

const MAX_SLICE_ARCS = 6;
const MAX_FRUIT_HALVES = 12;
const MAX_JUICE_DROPS = 60;
const MAX_JUICE_SPLATS = 20;
const GRAVITY = 0.35;
const SLICE_TRAIL_LIFETIME = 0.6;
const HALF_LIFETIME = 1.0;

export function createFruitNinjaState(): FruitNinjaState {
  return {
    sliceArcs: [],
    fruitHalves: [],
    juiceDrops: [],
    juiceSplats: [],
  };
}

function generateSliceArc(
  cx: number,
  cy: number,
  radius: number
): SliceTrailPoint[] {
  const points: SliceTrailPoint[] = [];
  const startAngle = Math.random() * Math.PI * 2;
  const arcLength = Math.PI * (0.6 + Math.random() * 0.5);
  const numPoints = 14;
  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    const angle = startAngle + arcLength * t;
    const r = radius * (0.8 + Math.sin(t * Math.PI) * 0.8);
    points.push({
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r,
      age: 0,
    });
  }
  return points;
}

export function spawnFruitNinjaSlice(
  state: FruitNinjaState,
  x: number,
  y: number,
  cellSize: number,
  foodType: FoodType
): void {
  const sliceRadius = cellSize * 1.8;
  const sliceAngle = Math.random() * Math.PI;
  const perpX = Math.cos(sliceAngle + Math.PI / 2);
  const perpY = Math.sin(sliceAngle + Math.PI / 2);

  if (state.sliceArcs.length >= MAX_SLICE_ARCS) {
    state.sliceArcs.shift();
  }
  state.sliceArcs.push({
    points: generateSliceArc(x, y, sliceRadius),
    life: 1.0,
    color: 0xffffff,
    glowColor: foodType.glowColor,
  });

  const splitSpeed = 2.5 + Math.random() * 1.5;
  for (const side of [-1, 1] as const) {
    if (state.fruitHalves.length >= MAX_FRUIT_HALVES) {
      state.fruitHalves.shift();
    }
    state.fruitHalves.push({
      x,
      y,
      vx: perpX * side * splitSpeed + (Math.random() - 0.5) * 1.5,
      vy: perpY * side * splitSpeed - 2.0 - Math.random() * 1.5,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.4,
      size: cellSize * 0.38,
      life: HALF_LIFETIME,
      side,
      color: foodType.bodyColor,
      innerColor: lightenColor(foodType.bodyColor, 0.4),
    });
  }

  const numDrops = 12 + Math.floor(Math.random() * 8);
  for (let i = 0; i < numDrops; i++) {
    if (state.juiceDrops.length >= MAX_JUICE_DROPS) {
      state.juiceDrops.shift();
    }
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 4;
    state.juiceDrops.push({
      x: x + (Math.random() - 0.5) * cellSize * 0.3,
      y: y + (Math.random() - 0.5) * cellSize * 0.3,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.5,
      size: 1.5 + Math.random() * 3,
      life: 0.7 + Math.random() * 0.3,
      color: foodType.bodyColor,
    });
  }

  if (state.juiceSplats.length >= MAX_JUICE_SPLATS) {
    state.juiceSplats.shift();
  }
  state.juiceSplats.push({
    x,
    y,
    radius: cellSize * 0.1,
    life: 1.0,
    color: darkenColor(foodType.bodyColor, 0.6),
  });
}

export function updateFruitNinja(state: FruitNinjaState): void {
  const decayRate = 0.028;

  for (let i = state.sliceArcs.length - 1; i >= 0; i--) {
    const arc = state.sliceArcs[i];
    arc.life -= decayRate * 1.2;
    for (const pt of arc.points) {
      pt.age += 0.05;
    }
    if (arc.life <= 0) {
      state.sliceArcs.splice(i, 1);
    }
  }

  for (let i = state.fruitHalves.length - 1; i >= 0; i--) {
    const h = state.fruitHalves[i];
    h.x += h.vx;
    h.y += h.vy;
    h.vy += GRAVITY;
    h.vx *= 0.99;
    h.rotation += h.rotationSpeed;
    h.life -= decayRate * 0.7;
    if (h.life <= 0) {
      state.fruitHalves.splice(i, 1);
    }
  }

  for (let i = state.juiceDrops.length - 1; i >= 0; i--) {
    const d = state.juiceDrops[i];
    d.x += d.vx;
    d.y += d.vy;
    d.vy += GRAVITY * 0.6;
    d.vx *= 0.97;
    d.life -= decayRate;
    if (d.life <= 0) {
      state.juiceDrops.splice(i, 1);
    }
  }

  for (let i = state.juiceSplats.length - 1; i >= 0; i--) {
    const s = state.juiceSplats[i];
    s.radius += 0.3;
    s.life -= decayRate * 0.4;
    if (s.life <= 0) {
      state.juiceSplats.splice(i, 1);
    }
  }
}

export function drawFruitNinja(
  g: Phaser.GameObjects.Graphics,
  state: FruitNinjaState,
  frameCount: number
): void {
  drawJuiceSplats(g, state);
  drawJuiceDrops(g, state);
  drawFruitHalves(g, state, frameCount);
  drawSliceArcs(g, state);
}

function drawSliceArcs(
  g: Phaser.GameObjects.Graphics,
  state: FruitNinjaState
): void {
  for (const arc of state.sliceArcs) {
    if (arc.points.length < 2) continue;
    const alpha = arc.life;

    g.lineStyle(6, arc.glowColor, alpha * 0.3);
    drawArcLine(g, arc.points);

    g.lineStyle(3, 0xffffff, alpha * 0.8);
    drawArcLine(g, arc.points);

    g.lineStyle(1.5, 0xffffff, alpha);
    drawArcLine(g, arc.points);
  }
}

function drawArcLine(
  g: Phaser.GameObjects.Graphics,
  points: SliceTrailPoint[]
): void {
  g.beginPath();
  g.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    g.lineTo(points[i].x, points[i].y);
  }
  g.strokePath();
}

function drawFruitHalves(
  g: Phaser.GameObjects.Graphics,
  state: FruitNinjaState,
  frameCount: number
): void {
  for (const h of state.fruitHalves) {
    const alpha = Math.min(1, h.life * 1.5);
    const r = h.size;

    g.fillStyle(0x000000, alpha * 0.25);
    g.fillEllipse(h.x + 2, h.y + 3, r * 1.6, r * 0.8);

    const cos = Math.cos(h.rotation);
    const sin = Math.sin(h.rotation);

    drawHalfCircle(g, h.x, h.y, r, h.color, alpha * 0.95, cos, sin, h.side);

    const flatOffX = -sin * r * 0.05 * h.side;
    const flatOffY = cos * r * 0.05 * h.side;
    drawHalfCircle(g, h.x + flatOffX, h.y + flatOffY, r * 0.92, h.innerColor, alpha * 0.7, cos, sin, h.side);

    const seedCount = 3;
    for (let s = 0; s < seedCount; s++) {
      const seedAngle = h.rotation + (s / seedCount) * Math.PI * h.side;
      const seedDist = r * (0.3 + s * 0.15);
      const sx = h.x + Math.cos(seedAngle) * seedDist * 0.5;
      const sy = h.y + Math.sin(seedAngle) * seedDist * 0.5;
      g.fillStyle(darkenColor(h.color, 0.4), alpha * 0.6);
      g.fillCircle(sx, sy, 1.2);
    }

    const hlAngle = h.rotation - Math.PI / 4;
    const hlX = h.x + Math.cos(hlAngle) * r * 0.25;
    const hlY = h.y + Math.sin(hlAngle) * r * 0.25;
    g.fillStyle(0xffffff, alpha * 0.3);
    g.fillCircle(hlX, hlY, r * 0.15);
  }
}

function drawHalfCircle(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  radius: number,
  color: number,
  alpha: number,
  cos: number,
  sin: number,
  side: -1 | 1
): void {
  g.fillStyle(color, alpha);
  const steps = 10;
  const startAngle = side === 1 ? 0 : Math.PI;
  const endAngle = side === 1 ? Math.PI : Math.PI * 2;

  for (let i = 0; i < steps; i++) {
    const a1 = startAngle + (i / steps) * (endAngle - startAngle);
    const a2 = startAngle + ((i + 1) / steps) * (endAngle - startAngle);

    const x1 = Math.cos(a1) * radius;
    const y1 = Math.sin(a1) * radius;
    const x2 = Math.cos(a2) * radius;
    const y2 = Math.sin(a2) * radius;

    const rx1 = cx + (x1 * cos - y1 * sin);
    const ry1 = cy + (x1 * sin + y1 * cos);
    const rx2 = cx + (x2 * cos - y2 * sin);
    const ry2 = cy + (x2 * sin + y2 * cos);

    g.fillTriangle(cx, cy, rx1, ry1, rx2, ry2);
  }
}

function drawJuiceDrops(
  g: Phaser.GameObjects.Graphics,
  state: FruitNinjaState
): void {
  for (const d of state.juiceDrops) {
    const alpha = Math.min(1, d.life * 2);
    const sz = d.size * Math.min(1, d.life * 1.5);

    g.fillStyle(d.color, alpha * 0.4);
    g.fillCircle(d.x, d.y, sz + 1);

    g.fillStyle(d.color, alpha * 0.9);
    g.fillCircle(d.x, d.y, sz);

    g.fillStyle(0xffffff, alpha * 0.3);
    g.fillCircle(d.x - sz * 0.2, d.y - sz * 0.2, sz * 0.3);
  }
}

function drawJuiceSplats(
  g: Phaser.GameObjects.Graphics,
  state: FruitNinjaState
): void {
  for (const s of state.juiceSplats) {
    const alpha = s.life * 0.35;
    g.fillStyle(s.color, alpha);
    g.fillCircle(s.x, s.y, s.radius);

    g.fillStyle(s.color, alpha * 0.5);
    g.fillCircle(s.x + s.radius * 0.4, s.y - s.radius * 0.3, s.radius * 0.6);
    g.fillCircle(s.x - s.radius * 0.5, s.y + s.radius * 0.2, s.radius * 0.5);
  }
}

function lightenColor(color: number, amount: number): number {
  const r = Math.min(0xff, Math.round(((color >> 16) & 0xff) * (1 + amount)));
  const gr = Math.min(0xff, Math.round(((color >> 8) & 0xff) * (1 + amount)));
  const b = Math.min(0xff, Math.round((color & 0xff) * (1 + amount)));
  return (r << 16) | (gr << 8) | b;
}
