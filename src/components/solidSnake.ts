import Phaser from 'phaser';
import { FaceDirection, FaceState } from './snakeFace';
import { getHouseColors } from './wizardEffects';
import { drawCurveSnake } from './curveSnake';

export interface SolidSegment {
  cx: number;
  cy: number;
  size: number;
  taper: number;
  isHead: boolean;
  angle: number;
  index: number;
  snakeLen: number;
}

export function computeSolidSegment(
  x: number,
  y: number,
  cellSize: number,
  index: number,
  snakeLen: number,
  prevX?: number,
  prevY?: number
): SolidSegment {
  const cx = x * cellSize + cellSize / 2;
  const cy = y * cellSize + cellSize / 2;
  const t = snakeLen > 1 ? index / (snakeLen - 1) : 0;
  const headScale = index === 0 ? 1.0 : 1.0;
  const taperScale = 0.82 + (1 - t) * 0.18;
  const size = (cellSize - 2) * taperScale * headScale;
  const angle = computeSegmentAngle(x, y, prevX, prevY);
  return { cx, cy, size, taper: t, isHead: index === 0, angle, index, snakeLen };
}

function computeSegmentAngle(
  x: number,
  y: number,
  prevX?: number,
  prevY?: number
): number {
  if (prevX === undefined || prevY === undefined) return 0;
  const dx = x - prevX;
  const dy = y - prevY;
  if (dx === 0 && dy === 0) return 0;
  return Math.atan2(dy, dx);
}

export function solidBaseColor(taper: number): number {
  const r = Math.round(0x55 + (1 - taper) * 0x2a);
  const g = Math.round(0x65 + (1 - taper) * 0x30);
  const b = Math.round(0x55 + (1 - taper) * 0x2a);
  return (Math.min(0xff, r) << 16) | (Math.min(0xff, g) << 8) | Math.min(0xff, b);
}

export function solidHighlightColor(taper: number): number {
  const r = Math.round(0x88 + (1 - taper) * 0x33);
  const g = Math.round(0x99 + (1 - taper) * 0x44);
  const b = Math.round(0x88 + (1 - taper) * 0x33);
  return (Math.min(0xff, r) << 16) | (Math.min(0xff, g) << 8) | Math.min(0xff, b);
}

export function solidEdgeColor(taper: number): number {
  const r = Math.round(0x33 + (1 - taper) * 0x15);
  const g = Math.round(0x40 + (1 - taper) * 0x1a);
  const b = Math.round(0x33 + (1 - taper) * 0x15);
  return (Math.min(0xff, r) << 16) | (Math.min(0xff, g) << 8) | Math.min(0xff, b);
}

function drawSolidShadow(g: Phaser.GameObjects.Graphics, seg: SolidSegment): void {
  const half = seg.size / 2;
  g.fillStyle(0x000000, 0.25);
  g.fillRect(seg.cx - half + 2, seg.cy - half + 3, seg.size, seg.size);
}

function drawSolidBody(
  g: Phaser.GameObjects.Graphics,
  seg: SolidSegment,
  frameCount: number
): void {
  const half = seg.size / 2;
  const house = getHouseColors(seg.index, seg.snakeLen);
  const base = house.base;
  const highlight = house.highlight;
  const edge = house.edge;
  const bevel = Math.max(2, seg.size * 0.12);

  g.fillStyle(edge, 0.95);
  g.fillRect(seg.cx - half, seg.cy - half, seg.size, seg.size);

  g.fillStyle(base, 0.95);
  g.fillRect(seg.cx - half + bevel, seg.cy - half + bevel, seg.size - bevel * 2, seg.size - bevel * 2);

  g.fillStyle(highlight, 0.3);
  g.fillRect(seg.cx - half + bevel, seg.cy - half + bevel, seg.size - bevel * 2, bevel);

  g.fillStyle(highlight, 0.2);
  g.fillRect(seg.cx - half + bevel, seg.cy - half + bevel, bevel, seg.size - bevel * 2);

  const shimmer = 0.12 + Math.sin(frameCount * 0.04 + seg.taper * Math.PI * 2) * 0.06;
  g.fillStyle(0xffffff, shimmer);
  const specSize = seg.size * 0.2;
  g.fillRect(seg.cx - half + bevel + 1, seg.cy - half + bevel + 1, specSize, specSize);
}

function drawSimpleHead(
  g: Phaser.GameObjects.Graphics,
  seg: SolidSegment,
  frameCount: number
): void {
  const size = seg.size * 1.08;
  const half = size / 2;
  const house = getHouseColors(seg.index, seg.snakeLen);
  const bevel = Math.max(2, size * 0.12);

  g.fillStyle(house.edge, 0.95);
  g.fillRect(seg.cx - half, seg.cy - half, size, size);

  g.fillStyle(house.base, 0.95);
  g.fillRect(seg.cx - half + bevel, seg.cy - half + bevel, size - bevel * 2, size - bevel * 2);

  g.fillStyle(house.highlight, 0.35);
  g.fillRect(seg.cx - half + bevel, seg.cy - half + bevel, size - bevel * 2, bevel);

  g.fillStyle(house.highlight, 0.25);
  g.fillRect(seg.cx - half + bevel, seg.cy - half + bevel, bevel, size - bevel * 2);

  const shimmer = 0.15 + Math.sin(frameCount * 0.04) * 0.08;
  g.fillStyle(0xffffff, shimmer);
  const specSize = size * 0.22;
  g.fillRect(seg.cx - half + bevel + 1, seg.cy - half + bevel + 1, specSize, specSize);
}

function drawSolidConnectors(
  g: Phaser.GameObjects.Graphics,
  segments: SolidSegment[]
): void {
  if (segments.length < 2) return;
  for (let i = 0; i < segments.length - 1; i++) {
    const a = segments[i];
    const b = segments[i + 1];
    const dx = b.cx - a.cx;
    const dy = b.cy - a.cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1 || dist > a.size * 2) continue;

    const connW = Math.min(a.size, b.size) * 0.65;
    const connHouse = getHouseColors(a.index, a.snakeLen);
    const color = connHouse.base;
    const midX = (a.cx + b.cx) / 2;
    const midY = (a.cy + b.cy) / 2;

    if (Math.abs(dx) > Math.abs(dy)) {
      g.fillStyle(color, 0.85);
      g.fillRect(midX - dist / 2, midY - connW / 2, dist, connW);
    } else {
      g.fillStyle(color, 0.85);
      g.fillRect(midX - connW / 2, midY - dist / 2, connW, dist);
    }
  }
}

function drawArmorPlate(
  g: Phaser.GameObjects.Graphics,
  seg: SolidSegment,
  frameCount: number
): void {
  if (seg.isHead) return;
  const half = seg.size / 2;
  const plateInset = seg.size * 0.25;
  const plateAlpha = 0.08 + Math.sin(frameCount * 0.03 + seg.taper * 4) * 0.04;

  g.lineStyle(1, 0xaaccaa, plateAlpha);
  g.strokeRect(
    seg.cx - half + plateInset,
    seg.cy - half + plateInset,
    seg.size - plateInset * 2,
    seg.size - plateInset * 2
  );

  const crossSize = seg.size * 0.08;
  g.lineStyle(1, 0x99bb99, plateAlpha * 0.7);
  g.lineBetween(seg.cx - crossSize, seg.cy, seg.cx + crossSize, seg.cy);
  g.lineBetween(seg.cx, seg.cy - crossSize, seg.cx, seg.cy + crossSize);
}

export function drawSolidSnake(
  g: Phaser.GameObjects.Graphics,
  snake: { x: number; y: number }[],
  cellSize: number,
  frameCount: number,
  _direction: FaceDirection,
  _faceState: FaceState
): void {
  drawCurveSnake(g, snake, cellSize, frameCount);
}
