import Phaser from 'phaser';
import { FoodType } from './foodVariety';

const SHADOW_OFFSET_X = 3;
const SHADOW_OFFSET_Y = 4;
const SHADOW_COLOR = 0x000000;
const LIGHT_ANGLE = -Math.PI / 4;
const LIGHT_COS = Math.cos(LIGHT_ANGLE);
const LIGHT_SIN = Math.sin(LIGHT_ANGLE);

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

export function drawSegmentShadow(
  g: Phaser.GameObjects.Graphics,
  seg: DepthSegment
): void {
  const shadowX = seg.cx + SHADOW_OFFSET_X;
  const shadowY = seg.cy + SHADOW_OFFSET_Y;
  const shadowRadius = seg.radius * 1.05;

  g.fillStyle(SHADOW_COLOR, 0.35);
  g.fillEllipse(shadowX, shadowY + 2, shadowRadius * 2, shadowRadius * 1.3);
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
  g.fillStyle(0xffffff, 0.25);
  g.fillCircle(specX - seg.radius * 0.15, specY - seg.radius * 0.08, seg.radius * 0.1);

  const eyeSpread = seg.radius * 0.4;
  const eyeY = seg.cy - seg.radius * 0.1;
  const eyeRadius = seg.radius * 0.24;

  g.fillStyle(0xdddddd, 0.95);
  g.fillCircle(seg.cx - eyeSpread, eyeY, eyeRadius);
  g.fillCircle(seg.cx + eyeSpread, eyeY, eyeRadius);

  g.fillStyle(0xcc0000, 0.9);
  g.fillCircle(seg.cx - eyeSpread, eyeY, eyeRadius * 0.6);
  g.fillCircle(seg.cx + eyeSpread, eyeY, eyeRadius * 0.6);

  g.fillStyle(0x000000, 0.95);
  g.fillCircle(seg.cx - eyeSpread, eyeY, eyeRadius * 0.3);
  g.fillCircle(seg.cx + eyeSpread, eyeY, eyeRadius * 0.3);

  g.fillStyle(0xffffff, 0.8);
  g.fillCircle(seg.cx - eyeSpread - eyeRadius * 0.2, eyeY - eyeRadius * 0.2, eyeRadius * 0.15);
  g.fillCircle(seg.cx + eyeSpread - eyeRadius * 0.2, eyeY - eyeRadius * 0.2, eyeRadius * 0.15);
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
    drawSegmentShadow(g, segments[i]);
  }

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

  const shadowScale = 1.0 - hover / 20;
  const shadowAlpha = 0.25 * Math.max(0.3, shadowScale);
  g.fillStyle(SHADOW_COLOR, shadowAlpha);
  g.fillEllipse(foodX + 2, foodY + 5, radius * 2 * shadowScale, radius * 0.8 * shadowScale);

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
  g.fillStyle(0xffffff, 0.3);
  g.fillCircle(hlX - radius * 0.15, hlY - radius * 0.1, radius * 0.1);
}

function drawDiamondShape(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  radius: number,
  color: number,
  alpha: number
): void {
  g.fillStyle(color, alpha);
  g.fillTriangle(x, y - radius, x + radius, y, x, y + radius);
  g.fillTriangle(x, y - radius, x - radius, y, x, y + radius);
}

function drawStarShape(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  radius: number,
  color: number,
  alpha: number,
  rotation: number
): void {
  g.fillStyle(color, alpha);
  const points = 5;
  const innerRadius = radius * 0.45;
  for (let i = 0; i < points; i++) {
    const outerAngle = rotation + (i / points) * Math.PI * 2 - Math.PI / 2;
    const nextAngle = rotation + ((i + 1) / points) * Math.PI * 2 - Math.PI / 2;
    const innerAngle = rotation + ((i + 0.5) / points) * Math.PI * 2 - Math.PI / 2;
    const ox = x + Math.cos(outerAngle) * radius;
    const oy = y + Math.sin(outerAngle) * radius;
    const ix = x + Math.cos(innerAngle) * innerRadius;
    const iy = y + Math.sin(innerAngle) * innerRadius;
    const nx = x + Math.cos(nextAngle) * radius;
    const ny = y + Math.sin(nextAngle) * radius;
    g.fillTriangle(ox, oy, ix, iy, x, y);
    g.fillTriangle(ix, iy, nx, ny, x, y);
  }
}

function drawHexagonShape(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  radius: number,
  color: number,
  alpha: number,
  rotation: number
): void {
  g.fillStyle(color, alpha);
  for (let i = 0; i < 6; i++) {
    const a1 = rotation + (i / 6) * Math.PI * 2;
    const a2 = rotation + ((i + 1) / 6) * Math.PI * 2;
    g.fillTriangle(
      x, y,
      x + Math.cos(a1) * radius, y + Math.sin(a1) * radius,
      x + Math.cos(a2) * radius, y + Math.sin(a2) * radius
    );
  }
}

function drawCrescentShape(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  radius: number,
  color: number,
  alpha: number
): void {
  g.fillStyle(color, alpha);
  g.fillCircle(x, y, radius);
  g.fillStyle(0x000811, alpha * 0.85);
  g.fillCircle(x + radius * 0.4, y - radius * 0.15, radius * 0.75);
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
      drawDiamondShape(g, x, y, radius, color, alpha);
      break;
    case 'star':
      drawStarShape(g, x, y, radius, color, alpha, rotation);
      break;
    case 'hexagon':
      drawHexagonShape(g, x, y, radius, color, alpha, rotation);
      break;
    case 'crescent':
      drawCrescentShape(g, x, y, radius, color, alpha);
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

  const shadowScale = 1.0 - hover / 20;
  const shadowAlpha = 0.25 * Math.max(0.3, shadowScale);
  g.fillStyle(SHADOW_COLOR, shadowAlpha);
  g.fillEllipse(foodX + 2, foodY + 5, radius * 2 * shadowScale, radius * 0.8 * shadowScale);

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
  g.fillStyle(0xffffff, 0.25);
  g.fillCircle(hlX - radius * 0.15, hlY - radius * 0.1, radius * 0.1);
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

    const distFromCenterV = Math.abs(pos - centerX) / maxDist;
    const alphaV = basePulse * (1.0 - distFromCenterV * 0.6);
    g.lineStyle(1, 0x1e4a5e, alphaV);
    g.lineBetween(pos, 0, pos, height);

    const distFromCenterH = Math.abs(pos - centerY) / maxDist;
    const alphaH = basePulse * (1.0 - distFromCenterH * 0.6);
    g.lineStyle(1, 0x1e4a5e, alphaH);
    g.lineBetween(0, pos, width, pos);
  }

  for (let i = 0; i <= gridSize; i += 5) {
    const pos = i * cellSize;
    const dist = Math.abs(pos - centerX) / maxDist;
    const alpha = basePulse * 1.5 * (1.0 - dist * 0.5);
    g.lineStyle(1, 0x2e6a7e, alpha);
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
