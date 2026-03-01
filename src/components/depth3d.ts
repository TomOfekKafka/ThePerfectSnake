import Phaser from 'phaser';
import { FoodType } from './foodVariety';
import { buildSplinePoints, getWidthAtProgress, getNormalAt } from './spermSnake';
import { lerpColor } from './colorUtils';
import { C } from './palette';

const LIGHT_ANGLE = -Math.PI / 4;
const LIGHT_COS = Math.cos(LIGHT_ANGLE);
const LIGHT_SIN = Math.sin(LIGHT_ANGLE);

const SHADOW_COLOR = 0x000000;

export interface Depth3DState {
  foodBob: number;
  foodSpin: number;
  gemPhase: number;
  headPulse: number;
}

export function createDepth3D(): Depth3DState {
  return { foodBob: 0, foodSpin: 0, gemPhase: 0, headPulse: 1 };
}

export function updateDepth3D(state: Depth3DState, frameCount: number): void {
  state.foodBob = Math.sin(frameCount * 0.06) * 3.5;
  state.foodSpin = frameCount * 0.025;
  state.gemPhase = frameCount * 0.04;
  state.headPulse = 0.92 + Math.sin(frameCount * 0.08) * 0.08;
}

export function drawSnake3DShadows(
  g: Phaser.GameObjects.Graphics,
  snake: { x: number; y: number }[],
  cellSize: number,
  frameCount: number,
  widthMultiplier = 1.0
): void {
  if (snake.length < 2) {
    if (snake.length === 1) {
      const cx = snake[0].x * cellSize + cellSize / 2;
      const cy = snake[0].y * cellSize + cellSize / 2;
      drawOvalShadow(g, cx + 3, cy + 5, cellSize * 0.5 * widthMultiplier, cellSize * 0.3 * widthMultiplier, 0.2);
    }
    return;
  }

  const points = buildSplinePoints(snake, cellSize, frameCount);
  if (points.length < 2) return;

  const shadowOffX = 3;
  const shadowOffY = 5;
  const step = Math.max(1, Math.floor(points.length / 25));

  for (let i = points.length - 1; i >= 0; i -= step) {
    const progress = i / (points.length - 1);
    const width = getWidthAtProgress(progress, cellSize, snake.length, widthMultiplier);
    const radius = width / 2;

    const elevation = progress < 0.15 ? 1.5 : 1.0 + (1 - progress) * 0.3;
    const sx = points[i].x + shadowOffX * elevation;
    const sy = points[i].y + shadowOffY * elevation;
    const spread = radius * (1.0 + elevation * 0.15);

    const alpha = 0.18 * (1 - progress * 0.4);
    drawOvalShadow(g, sx, sy, spread, spread * 0.65, alpha);
  }
}

function drawOvalShadow(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  alpha: number
): void {
  g.fillStyle(SHADOW_COLOR, alpha * 0.4);
  g.fillEllipse(cx, cy, rx * 2.4, ry * 2.4);
  g.fillStyle(SHADOW_COLOR, alpha);
  g.fillEllipse(cx, cy, rx * 1.6, ry * 1.6);
}

export function drawSnake3DHighlights(
  g: Phaser.GameObjects.Graphics,
  snake: { x: number; y: number }[],
  cellSize: number,
  frameCount: number,
  headPulse: number
): void {
  if (snake.length < 2) {
    if (snake.length === 1) {
      const cx = snake[0].x * cellSize + cellSize / 2;
      const cy = snake[0].y * cellSize + cellSize / 2;
      drawSpecularDot(g, cx, cy, cellSize * 0.4, 0.5, frameCount);
    }
    return;
  }

  const points = buildSplinePoints(snake, cellSize, frameCount);
  if (points.length < 4) return;

  const step = Math.max(1, Math.floor(points.length / 18));

  for (let i = 0; i < points.length; i += step) {
    const progress = i / (points.length - 1);
    const width = getWidthAtProgress(progress, cellSize, snake.length);
    const radius = width / 2;
    const pt = points[i];

    const normal = getNormalAt(points, i);
    const highlightOffset = radius * 0.35;
    const specX = pt.x + LIGHT_COS * highlightOffset + normal.x * radius * 0.1;
    const specY = pt.y + LIGHT_SIN * highlightOffset + normal.y * radius * 0.1;

    const baseIntensity = progress < 0.2
      ? 0.5 * headPulse
      : 0.3 * (1 - progress * 0.6);

    const shimmer = baseIntensity * (0.85 + Math.sin(frameCount * 0.06 + progress * 8) * 0.15);

    g.fillStyle(C.NOIR.white, shimmer * 0.4);
    g.fillCircle(specX, specY, radius * 0.3);
    g.fillStyle(C.WHITE, shimmer * 0.55);
    g.fillCircle(specX, specY, radius * 0.15);

    if (progress < 0.25) {
      const rimStrength = 0.2 * (1 - progress / 0.25) * headPulse;
      const rimAngle = LIGHT_ANGLE - Math.PI * 0.3;
      const rimX = pt.x + Math.cos(rimAngle) * radius * 0.8;
      const rimY = pt.y + Math.sin(rimAngle) * radius * 0.8;
      g.fillStyle(C.NOIR.silver, rimStrength);
      g.fillCircle(rimX, rimY, radius * 0.25);
    }
  }

  const headPt = points[0];
  const headRadius = getWidthAtProgress(0.06, cellSize, snake.length) / 2;
  const headSpecX = headPt.x + LIGHT_COS * headRadius * 0.3;
  const headSpecY = headPt.y + LIGHT_SIN * headRadius * 0.3;
  const headFlash = 0.3 + Math.sin(frameCount * 0.1) * 0.1;
  g.fillStyle(C.WHITE, headFlash * headPulse);
  g.fillCircle(headSpecX, headSpecY, headRadius * 0.18);
}

function drawSpecularDot(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  radius: number,
  intensity: number,
  frameCount: number
): void {
  const specX = cx + LIGHT_COS * radius * 0.3;
  const specY = cy + LIGHT_SIN * radius * 0.3;
  const pulse = intensity * (0.8 + Math.sin(frameCount * 0.06) * 0.2);
  g.fillStyle(C.WHITE, pulse * 0.5);
  g.fillCircle(specX, specY, radius * 0.2);
}

export function drawFood3DEffect(
  g: Phaser.GameObjects.Graphics,
  foodX: number,
  foodY: number,
  cellSize: number,
  frameCount: number,
  state: Depth3DState
): void {
  const baseRadius = cellSize * 0.5;
  const bobY = foodY + state.foodBob;
  const elevation = 3 + Math.abs(state.foodBob) * 0.5;

  drawOvalShadow(g, foodX + 2, foodY + 6, baseRadius * 0.8, baseRadius * 0.4, 0.25);

  const facetCount = 8;
  for (let i = 0; i < facetCount; i++) {
    const angle = state.foodSpin + (i / facetCount) * Math.PI * 2;
    const dist = baseRadius * 0.45;
    const fx = foodX + Math.cos(angle) * dist;
    const fy = bobY + Math.sin(angle) * dist * 0.55;
    const facetR = baseRadius * 0.35;

    const lightDot = LIGHT_COS * Math.cos(angle) + LIGHT_SIN * Math.sin(angle);
    const brightness = 0.5 + lightDot * 0.5;

    const hue = ((i / facetCount) + state.gemPhase / (Math.PI * 8)) % 1;
    const gemColor = hslToHex(hue, 0.85, brightness * 0.6);

    g.fillStyle(gemColor, 0.55);
    g.fillCircle(fx, fy, facetR);

    if (lightDot > 0.2) {
      g.fillStyle(C.WHITE, lightDot * 0.25);
      g.fillCircle(fx + LIGHT_COS * facetR * 0.2, fy + LIGHT_SIN * facetR * 0.2, facetR * 0.3);
    }
  }

  const pulseR = baseRadius * 1.5 + Math.sin(frameCount * 0.07) * baseRadius * 0.2;
  g.fillStyle(0xff8844, 0.12);
  g.fillCircle(foodX, bobY, pulseR);
}

function hslToHex(h: number, s: number, l: number): number {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h * 6) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let gv = 0;
  let b = 0;
  const sector = Math.floor(h * 6) % 6;
  if (sector === 0) { r = c; gv = x; }
  else if (sector === 1) { r = x; gv = c; }
  else if (sector === 2) { gv = c; b = x; }
  else if (sector === 3) { gv = x; b = c; }
  else if (sector === 4) { r = x; b = c; }
  else { r = c; b = x; }
  const ri = Math.min(0xff, Math.round((r + m) * 255));
  const gi = Math.min(0xff, Math.round((gv + m) * 255));
  const bi = Math.min(0xff, Math.round((b + m) * 255));
  return (ri << 16) | (gi << 8) | bi;
}

export interface DepthSegment {
  cx: number;
  cy: number;
  radius: number;
  baseColor: number;
  highlightColor: number;
  isHead: boolean;
}

export function computeSegmentDepth(
  x: number,
  y: number,
  cellSize: number,
  index: number,
  snakeLen: number
): DepthSegment {
  const cx = x * cellSize + cellSize / 2;
  const cy = y * cellSize + cellSize / 2;
  const t = snakeLen > 1 ? index / (snakeLen - 1) : 1;
  const headScale = index === 0 ? 1.1 : 1.0;
  const taperScale = 0.85 + (1 - t) * 0.15;
  const radius = (cellSize / 2 - 1) * taperScale * headScale;
  const greenBase = Math.round(0x44 + (1 - t) * 0x66);
  const greenDark = Math.round(0x22 + (1 - t) * 0x33);
  const baseColor = (greenDark << 16) | (greenBase << 8) | (greenDark >> 1);
  const highlightColor = (greenDark << 16) | (Math.min(0xff, greenBase + 0x40) << 8) | (greenDark >> 1);
  return { cx, cy, radius, baseColor, highlightColor, isHead: index === 0 };
}

export function drawSegmentBody(
  g: Phaser.GameObjects.Graphics,
  seg: DepthSegment,
  frameCount: number
): void {
  g.fillStyle(darkenColor(seg.baseColor, 0.6), 0.9);
  g.fillCircle(seg.cx, seg.cy + 1, seg.radius);
  g.fillStyle(seg.baseColor, 0.95);
  g.fillCircle(seg.cx, seg.cy, seg.radius);
  const midHighlightX = seg.cx + LIGHT_COS * seg.radius * 0.15;
  const midHighlightY = seg.cy + LIGHT_SIN * seg.radius * 0.15;
  g.fillStyle(seg.highlightColor, 0.4);
  g.fillCircle(midHighlightX, midHighlightY, seg.radius * 0.75);
  const specX = seg.cx + LIGHT_COS * seg.radius * 0.35;
  const specY = seg.cy + LIGHT_SIN * seg.radius * 0.35;
  const specPulse = 0.35 + Math.sin(frameCount * 0.08) * 0.1;
  g.fillStyle(0xffffff, specPulse);
  g.fillCircle(specX, specY, seg.radius * 0.25);
  g.fillStyle(0xffffff, specPulse * 0.5);
  g.fillCircle(specX - seg.radius * 0.1, specY - seg.radius * 0.05, seg.radius * 0.12);
}

export function drawSnakeHead3D(
  g: Phaser.GameObjects.Graphics,
  seg: DepthSegment,
  frameCount: number
): void {
  const pulse = 0.3 + Math.sin(frameCount * 0.12) * 0.1;
  g.fillStyle(0x330000, pulse * 0.5);
  g.fillCircle(seg.cx, seg.cy, seg.radius + 3);
  g.fillStyle(darkenColor(seg.baseColor, 0.5), 0.95);
  g.fillCircle(seg.cx, seg.cy + 1, seg.radius);
  g.fillStyle(seg.baseColor, 1);
  g.fillCircle(seg.cx, seg.cy, seg.radius);
  const specX = seg.cx + LIGHT_COS * seg.radius * 0.3;
  const specY = seg.cy + LIGHT_SIN * seg.radius * 0.3;
  g.fillStyle(seg.highlightColor, 0.5);
  g.fillCircle(specX, specY, seg.radius * 0.6);
  g.fillStyle(0xffffff, 0.45);
  g.fillCircle(specX, specY, seg.radius * 0.22);
}

export function drawSnake3D(
  g: Phaser.GameObjects.Graphics,
  snake: { x: number; y: number }[],
  cellSize: number,
  frameCount: number
): void {
  const len = snake.length;
  if (len === 0) return;
  const segments = snake.map((s, i) => computeSegmentDepth(s.x, s.y, cellSize, i, len));
  for (let i = len - 1; i >= 0; i--) {
    if (segments[i].isHead) continue;
    drawSegmentBody(g, segments[i], frameCount);
  }
  drawSnakeHead3D(g, segments[0], frameCount);
}

export function drawFood3D(
  g: Phaser.GameObjects.Graphics,
  foodX: number,
  foodY: number,
  cellSize: number,
  frameCount: number
): void {
  const hover = Math.sin(frameCount * 0.08) * 3;
  const floatY = foodY + hover;
  const baseRadius = cellSize * 0.35;
  const pulse = 1.0 + Math.sin(frameCount * 0.1) * 0.08;
  const radius = baseRadius * pulse;
  g.fillStyle(0xff8800, 0.2);
  g.fillCircle(foodX, floatY, radius * 2);
  g.fillStyle(0xffaa00, 0.15);
  g.fillCircle(foodX, floatY, radius * 1.5);
  g.fillStyle(0xcc6600, 0.95);
  g.fillCircle(foodX, floatY + 1, radius);
  g.fillStyle(0xff8800, 1);
  g.fillCircle(foodX, floatY, radius);
  const hlX = foodX + LIGHT_COS * radius * 0.3;
  const hlY = floatY + LIGHT_SIN * radius * 0.3;
  g.fillStyle(0xffcc44, 0.6);
  g.fillCircle(hlX, hlY, radius * 0.6);
  g.fillStyle(0xffffff, 0.5);
  g.fillCircle(hlX, hlY, radius * 0.2);
}

function drawFoodShape(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  radius: number,
  color: number,
  alpha: number,
  shape: FoodType['shape'],
  rotation: number
): void {
  switch (shape) {
    case 'diamond':
      g.fillStyle(color, alpha);
      g.fillTriangle(x, y - radius, x + radius, y, x, y + radius);
      g.fillTriangle(x, y - radius, x - radius, y, x, y + radius);
      break;
    case 'star': {
      g.fillStyle(color, alpha);
      const innerR = radius * 0.45;
      for (let i = 0; i < 5; i++) {
        const oa = rotation + (i / 5) * Math.PI * 2 - Math.PI / 2;
        const ia = rotation + ((i + 0.5) / 5) * Math.PI * 2 - Math.PI / 2;
        const na = rotation + ((i + 1) / 5) * Math.PI * 2 - Math.PI / 2;
        g.fillTriangle(
          x + Math.cos(oa) * radius, y + Math.sin(oa) * radius,
          x + Math.cos(ia) * innerR, y + Math.sin(ia) * innerR,
          x, y
        );
        g.fillTriangle(
          x + Math.cos(ia) * innerR, y + Math.sin(ia) * innerR,
          x + Math.cos(na) * radius, y + Math.sin(na) * radius,
          x, y
        );
      }
      break;
    }
    case 'hexagon': {
      g.fillStyle(color, alpha);
      for (let i = 0; i < 6; i++) {
        const a1 = rotation + (i / 6) * Math.PI * 2;
        const a2 = rotation + ((i + 1) / 6) * Math.PI * 2;
        g.fillTriangle(x, y,
          x + Math.cos(a1) * radius, y + Math.sin(a1) * radius,
          x + Math.cos(a2) * radius, y + Math.sin(a2) * radius);
      }
      break;
    }
    case 'crescent':
      g.fillStyle(color, alpha);
      g.fillCircle(x, y, radius);
      g.fillStyle(0x000811, alpha * 0.85);
      g.fillCircle(x + radius * 0.4, y - radius * 0.15, radius * 0.75);
      break;
    default:
      g.fillStyle(color, alpha);
      g.fillCircle(x, y, radius);
  }
}

export function drawVariedFood(
  g: Phaser.GameObjects.Graphics,
  foodX: number,
  foodY: number,
  cellSize: number,
  frameCount: number,
  foodType: FoodType
): void {
  const hover = Math.sin(frameCount * 0.08) * 3;
  const floatY = foodY + hover;
  const baseRadius = cellSize * 0.38;
  const pulse = 1.0 + Math.sin(frameCount * 0.1) * 0.08;
  const radius = baseRadius * pulse;
  const rotation = frameCount * 0.02;
  g.fillStyle(foodType.glowColor, 0.18);
  g.fillCircle(foodX, floatY, radius * 2.2);
  g.fillStyle(foodType.glowColor, 0.12);
  g.fillCircle(foodX, floatY, radius * 1.6);
  drawFoodShape(g, foodX, floatY + 1, radius, darkenColor(foodType.bodyColor, 0.7), 0.9, foodType.shape, rotation);
  drawFoodShape(g, foodX, floatY, radius, foodType.bodyColor, 1.0, foodType.shape, rotation);
  const hlX = foodX + LIGHT_COS * radius * 0.3;
  const hlY = floatY + LIGHT_SIN * radius * 0.3;
  g.fillStyle(foodType.highlightColor, 0.55);
  g.fillCircle(hlX, hlY, radius * 0.55);
  g.fillStyle(0xffffff, 0.45);
  g.fillCircle(hlX, hlY, radius * 0.18);
}

export function drawGrid3D(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  cellSize: number,
  gridSize: number,
  frameCount: number
): void {
  const centerX = width / 2;
  const centerY = height / 2;
  const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
  const basePulse = 0.04 + Math.sin(frameCount * 0.015) * 0.015;
  for (let i = 0; i <= gridSize; i++) {
    const pos = i * cellSize;
    const distV = Math.abs(pos - centerX) / maxDist;
    g.lineStyle(1, 0x1e4a5e, basePulse * (1.0 - distV * 0.6));
    g.lineBetween(pos, 0, pos, height);
    const distH = Math.abs(pos - centerY) / maxDist;
    g.lineStyle(1, 0x1e4a5e, basePulse * (1.0 - distH * 0.6));
    g.lineBetween(0, pos, width, pos);
  }
  for (let i = 0; i <= gridSize; i += 5) {
    const pos = i * cellSize;
    const dist = Math.abs(pos - centerX) / maxDist;
    g.lineStyle(1, 0x2e6a7e, basePulse * 1.5 * (1.0 - dist * 0.5));
    g.lineBetween(pos, 0, pos, height);
    g.lineBetween(0, pos, width, pos);
  }
  const edgeFade = 0.06 + Math.sin(frameCount * 0.02) * 0.02;
  g.fillStyle(0x000000, edgeFade);
  g.fillRect(0, 0, width, 8);
  g.fillRect(0, height - 8, width, 8);
  g.fillRect(0, 0, 8, height);
  g.fillRect(width - 8, 0, 8, height);
}

export function darkenColor(color: number, factor: number): number {
  const r = Math.round(((color >> 16) & 0xff) * factor);
  const gr = Math.round(((color >> 8) & 0xff) * factor);
  const b = Math.round((color & 0xff) * factor);
  return (r << 16) | (gr << 8) | b;
}
