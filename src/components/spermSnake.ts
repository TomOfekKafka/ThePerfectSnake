import Phaser from 'phaser';
import { lerpColor } from './colorUtils';
import { THEME } from './gameTheme';

interface Vec2 {
  x: number;
  y: number;
}

function catmullRom(p0: Vec2, p1: Vec2, p2: Vec2, p3: Vec2, t: number): Vec2 {
  const t2 = t * t;
  const t3 = t2 * t;
  return {
    x: 0.5 * (
      (2 * p1.x) +
      (-p0.x + p2.x) * t +
      (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
      (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
    ),
    y: 0.5 * (
      (2 * p1.y) +
      (-p0.y + p2.y) * t +
      (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
      (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
    ),
  };
}

function gridToPixel(gx: number, gy: number, cellSize: number): Vec2 {
  return {
    x: gx * cellSize + cellSize / 2,
    y: gy * cellSize + cellSize / 2,
  };
}

export function buildSplinePoints(
  snake: { x: number; y: number }[],
  cellSize: number,
  _frameCount: number
): Vec2[] {
  const len = snake.length;
  if (len === 0) return [];
  if (len === 1) return [gridToPixel(snake[0].x, snake[0].y, cellSize)];

  const centers = snake.map(s => gridToPixel(s.x, s.y, cellSize));

  if (len === 2) {
    const steps = 8;
    const result: Vec2[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      result.push({
        x: centers[0].x + (centers[1].x - centers[0].x) * t,
        y: centers[0].y + (centers[1].y - centers[0].y) * t,
      });
    }
    return result;
  }

  const stepsPerSegment = 6;
  const result: Vec2[] = [];

  for (let i = 0; i < len - 1; i++) {
    const p0 = centers[Math.max(0, i - 1)];
    const p1 = centers[i];
    const p2 = centers[Math.min(len - 1, i + 1)];
    const p3 = centers[Math.min(len - 1, i + 2)];

    const startT = i === 0 ? 0 : 1;
    for (let s = startT; s <= stepsPerSegment; s++) {
      const t = s / stepsPerSegment;
      const pt = catmullRom(p0, p1, p2, p3, t);
      result.push(pt);
    }
  }

  return result;
}

export function getWidthAtProgress(
  progress: number,
  cellSize: number,
  _snakeLen: number,
  widthMultiplier = 1.0
): number {
  const bodyWidth = cellSize * 0.55;
  const noseWidth = cellSize * 0.12;
  const tailWidth = cellSize * 0.18;

  let w: number;
  if (progress < 0.04) {
    const t = progress / 0.04;
    w = noseWidth + (bodyWidth - noseWidth) * smoothstep(t);
  } else if (progress < 0.85) {
    w = bodyWidth;
  } else {
    const t = (progress - 0.85) / 0.15;
    w = bodyWidth + (tailWidth - bodyWidth) * smoothstep(t);
  }

  return w * widthMultiplier;
}

function smoothstep(t: number): number {
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

export function getNormalAt(points: Vec2[], index: number): Vec2 {
  let dx: number, dy: number;

  if (index === 0) {
    dx = points[1].x - points[0].x;
    dy = points[1].y - points[0].y;
  } else if (index >= points.length - 1) {
    dx = points[points.length - 1].x - points[points.length - 2].x;
    dy = points[points.length - 1].y - points[points.length - 2].y;
  } else {
    dx = points[index + 1].x - points[index - 1].x;
    dy = points[index + 1].y - points[index - 1].y;
  }

  const mag = Math.sqrt(dx * dx + dy * dy) || 1;
  return { x: -dy / mag, y: dx / mag };
}

const HEAD_COLOR = THEME.snake.head;
const BODY_COLOR = THEME.snake.body;
const TAIL_COLOR = THEME.snake.tail;
const HIGHLIGHT_COLOR = THEME.snake.highlight;
const EDGE_COLOR = THEME.snake.edge;
const GLOW_COLOR = THEME.snake.glow;

function getBodyColor(
  progress: number
): { base: number; highlight: number; edge: number; alpha: number } {
  if (progress < 0.06) {
    const t = progress / 0.06;
    return {
      base: lerpColor(HEAD_COLOR, BODY_COLOR, t),
      highlight: HIGHLIGHT_COLOR,
      edge: EDGE_COLOR,
      alpha: 1.0,
    };
  }
  if (progress < 0.85) {
    const t = (progress - 0.06) / 0.79;
    return {
      base: lerpColor(BODY_COLOR, TAIL_COLOR, t * 0.4),
      highlight: HIGHLIGHT_COLOR,
      edge: EDGE_COLOR,
      alpha: 0.97 - t * 0.05,
    };
  }
  const t = (progress - 0.85) / 0.15;
  return {
    base: lerpColor(TAIL_COLOR, EDGE_COLOR, t * 0.5),
    highlight: lerpColor(HIGHLIGHT_COLOR, TAIL_COLOR, t),
    edge: EDGE_COLOR,
    alpha: 0.92 - t * 0.2,
  };
}

export function drawSpermSnake(
  g: Phaser.GameObjects.Graphics,
  snake: { x: number; y: number }[],
  cellSize: number,
  frameCount: number,
  widthMultiplier = 1.0
): void {
  const len = snake.length;
  if (len === 0) return;

  if (len === 1) {
    const pt = gridToPixel(snake[0].x, snake[0].y, cellSize);
    drawSingleCell(g, pt, cellSize, frameCount, widthMultiplier);
    return;
  }

  const points = buildSplinePoints(snake, cellSize, frameCount);
  if (points.length < 2) return;

  const leftEdge: Vec2[] = [];
  const rightEdge: Vec2[] = [];

  for (let i = 0; i < points.length; i++) {
    const progress = i / (points.length - 1);
    const w = getWidthAtProgress(progress, cellSize, len, widthMultiplier) / 2;
    const n = getNormalAt(points, i);
    leftEdge.push({ x: points[i].x + n.x * w, y: points[i].y + n.y * w });
    rightEdge.push({ x: points[i].x - n.x * w, y: points[i].y - n.y * w });
  }

  drawBody(g, points, leftEdge, rightEdge);
  drawEdgeLines(g, leftEdge, rightEdge);
  drawSpecularStrip(g, points, leftEdge, cellSize);
  drawHeadCap(g, points, leftEdge, rightEdge, cellSize, widthMultiplier);
  drawTailGlow(g, points, cellSize, frameCount, widthMultiplier);
}

function drawSingleCell(
  g: Phaser.GameObjects.Graphics,
  pt: Vec2,
  cellSize: number,
  _frameCount: number,
  widthMultiplier = 1.0
): void {
  const radius = cellSize * 0.35 * widthMultiplier;

  g.fillStyle(EDGE_COLOR, 0.4);
  g.fillCircle(pt.x, pt.y + 1, radius + 1);

  g.fillStyle(BODY_COLOR, 0.97);
  g.fillCircle(pt.x, pt.y, radius);

  g.fillStyle(HEAD_COLOR, 0.85);
  g.fillCircle(pt.x, pt.y - radius * 0.15, radius * 0.65);

  g.fillStyle(HIGHLIGHT_COLOR, 0.25);
  g.fillCircle(pt.x - radius * 0.2, pt.y - radius * 0.25, radius * 0.3);
}

function drawBody(
  g: Phaser.GameObjects.Graphics,
  points: Vec2[],
  leftEdge: Vec2[],
  rightEdge: Vec2[]
): void {
  const segCount = Math.max(1, Math.floor(points.length / 4));

  for (let seg = 0; seg < segCount; seg++) {
    const startIdx = Math.floor((seg / segCount) * points.length);
    const endIdx = Math.min(
      Math.floor(((seg + 1) / segCount) * points.length),
      points.length - 1
    );
    if (startIdx >= endIdx) continue;

    const midProgress = ((startIdx + endIdx) / 2) / (points.length - 1);
    const colors = getBodyColor(midProgress);

    g.beginPath();
    g.moveTo(leftEdge[startIdx].x, leftEdge[startIdx].y);
    for (let i = startIdx + 1; i <= endIdx; i++) {
      g.lineTo(leftEdge[i].x, leftEdge[i].y);
    }
    for (let i = endIdx; i >= startIdx; i--) {
      g.lineTo(rightEdge[i].x, rightEdge[i].y);
    }
    g.closePath();
    g.fillStyle(colors.base, colors.alpha);
    g.fillPath();
  }
}

function drawEdgeLines(
  g: Phaser.GameObjects.Graphics,
  leftEdge: Vec2[],
  rightEdge: Vec2[]
): void {
  g.lineStyle(1.2, EDGE_COLOR, 0.35);

  g.beginPath();
  g.moveTo(leftEdge[0].x, leftEdge[0].y);
  for (let i = 1; i < leftEdge.length; i++) {
    g.lineTo(leftEdge[i].x, leftEdge[i].y);
  }
  g.strokePath();

  g.beginPath();
  g.moveTo(rightEdge[0].x, rightEdge[0].y);
  for (let i = 1; i < rightEdge.length; i++) {
    g.lineTo(rightEdge[i].x, rightEdge[i].y);
  }
  g.strokePath();
}

function drawSpecularStrip(
  g: Phaser.GameObjects.Graphics,
  points: Vec2[],
  leftEdge: Vec2[],
  _cellSize: number
): void {
  const totalPts = points.length;
  if (totalPts < 4) return;

  for (let i = 1; i < totalPts - 1; i += 2) {
    const progress = i / (totalPts - 1);
    if (progress < 0.05 || progress > 0.92) continue;

    const hx = points[i].x + (leftEdge[i].x - points[i].x) * 0.55;
    const hy = points[i].y + (leftEdge[i].y - points[i].y) * 0.55;

    const alpha = 0.18 * (1 - Math.abs(progress - 0.4) * 1.2);
    if (alpha <= 0) continue;

    g.fillStyle(HIGHLIGHT_COLOR, Math.max(0, alpha));
    g.fillCircle(hx, hy, 1.2);
  }
}

function drawHeadCap(
  g: Phaser.GameObjects.Graphics,
  points: Vec2[],
  leftEdge: Vec2[],
  rightEdge: Vec2[],
  cellSize: number,
  _widthMultiplier: number
): void {
  const headEnd = Math.min(Math.floor(points.length * 0.08), points.length - 1);

  g.beginPath();
  g.moveTo(points[0].x, points[0].y);
  for (let i = 1; i <= headEnd; i++) {
    g.lineTo(leftEdge[i].x, leftEdge[i].y);
  }
  for (let i = headEnd; i >= 1; i--) {
    g.lineTo(rightEdge[i].x, rightEdge[i].y);
  }
  g.closePath();

  g.fillStyle(HEAD_COLOR, 0.9);
  g.fillPath();

  g.lineStyle(1.0, EDGE_COLOR, 0.3);
  g.strokePath();

  const tipIdx = Math.min(2, points.length - 1);
  g.fillStyle(HIGHLIGHT_COLOR, 0.35);
  g.fillCircle(
    points[tipIdx].x + (leftEdge[tipIdx].x - points[tipIdx].x) * 0.3,
    points[tipIdx].y + (leftEdge[tipIdx].y - points[tipIdx].y) * 0.3,
    1.8
  );
}

function drawTailGlow(
  g: Phaser.GameObjects.Graphics,
  points: Vec2[],
  cellSize: number,
  frameCount: number,
  _widthMultiplier: number
): void {
  const totalPts = points.length;
  if (totalPts < 3) return;

  const tailPt = points[totalPts - 1];
  const preTail = points[totalPts - 2];
  let dx = tailPt.x - preTail.x;
  let dy = tailPt.y - preTail.y;
  const mag = Math.sqrt(dx * dx + dy * dy) || 1;
  dx /= mag;
  dy /= mag;

  const pulse = 0.3 + Math.sin(frameCount * 0.08) * 0.12;
  const trailLen = cellSize * 0.5;

  g.fillStyle(GLOW_COLOR, pulse * 0.15);
  g.fillCircle(
    tailPt.x + dx * trailLen * 0.3,
    tailPt.y + dy * trailLen * 0.3,
    cellSize * 0.25
  );

  g.fillStyle(GLOW_COLOR, pulse * 0.08);
  g.fillCircle(
    tailPt.x + dx * trailLen * 0.6,
    tailPt.y + dy * trailLen * 0.6,
    cellSize * 0.15
  );
}
