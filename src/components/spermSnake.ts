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
  frameCount: number
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

      const globalProgress = (i + t) / (len - 1);

      const headRegion = globalProgress < 0.15;
      const waveAmp = headRegion
        ? cellSize * 0.01 * globalProgress / 0.15
        : cellSize * 0.06 * (0.2 + globalProgress * 0.8);
      const waveFreq = 4.5;
      const wavePhase = frameCount * 0.08;
      const wave = Math.sin(globalProgress * Math.PI * waveFreq + wavePhase) * waveAmp;

      const dx = p2.x - p0.x;
      const dy = p2.y - p0.y;
      const mag = Math.sqrt(dx * dx + dy * dy) || 1;
      pt.x += (-dy / mag) * wave;
      pt.y += (dx / mag) * wave;

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
  const headWidth = cellSize * 0.85;
  const neckWidth = cellSize * 0.5;
  const tailWidth = cellSize * 0.15;

  let w: number;
  if (progress < 0.04) {
    const t = progress / 0.04;
    w = headWidth * t;
  } else if (progress < 0.12) {
    w = headWidth;
  } else if (progress < 0.22) {
    const t = (progress - 0.12) / 0.10;
    w = headWidth - (headWidth - neckWidth) * t;
  } else {
    const tailProgress = (progress - 0.22) / 0.78;
    w = neckWidth - (neckWidth - tailWidth) * Math.pow(tailProgress, 0.6);
  }

  return w * widthMultiplier;
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

const S_HIGHLIGHT = THEME.snake.highlight;
const S_HEAD = THEME.snake.head;
const S_GLOW = THEME.snake.glow;
const S_BODY = THEME.snake.body;
const S_TAIL = THEME.snake.tail;
const S_EDGE = THEME.snake.edge;

function getSnakeColors(
  progress: number
): { base: number; highlight: number; edge: number; alpha: number } {
  let base: number;
  let highlight: number;
  let edge: number;
  let alpha: number;

  if (progress < 0.2) {
    base = lerpColor(S_HEAD, S_GLOW, progress / 0.2);
    highlight = S_HIGHLIGHT;
    edge = S_BODY;
    alpha = 0.95;
  } else if (progress < 0.5) {
    const t = (progress - 0.2) / 0.3;
    base = lerpColor(S_GLOW, S_BODY, t);
    highlight = lerpColor(S_HIGHLIGHT, S_HEAD, t);
    edge = lerpColor(S_BODY, S_TAIL, t);
    alpha = 0.92;
  } else if (progress < 0.8) {
    const t = (progress - 0.5) / 0.3;
    base = lerpColor(S_BODY, S_TAIL, t);
    highlight = lerpColor(S_HEAD, S_GLOW, t);
    edge = S_EDGE;
    alpha = 0.85;
  } else {
    const t = (progress - 0.8) / 0.2;
    base = lerpColor(S_TAIL, S_EDGE, t);
    highlight = S_BODY;
    edge = S_EDGE;
    alpha = 0.7 - t * 0.2;
  }

  return { base, highlight, edge, alpha: Math.max(0.25, alpha) };
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
    drawSingleCellHead(g, pt, cellSize, frameCount, widthMultiplier);
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

  drawSnakeBody(g, points, leftEdge, rightEdge, len, frameCount);
  drawSnakeStripes(g, points, leftEdge, rightEdge, cellSize, frameCount);
  drawSnakeHeadShape(g, points, leftEdge, rightEdge, cellSize, frameCount, widthMultiplier);
  drawSnakeEyes(g, points, cellSize, frameCount, widthMultiplier);
}

function drawSingleCellHead(
  g: Phaser.GameObjects.Graphics,
  pt: Vec2,
  cellSize: number,
  frameCount: number,
  widthMultiplier = 1.0
): void {
  const radius = cellSize * 0.45 * widthMultiplier;
  const pulse = 1.0 + Math.sin(frameCount * 0.05) * 0.03;
  const r = radius * pulse;

  g.fillStyle(S_HEAD, 0.95);
  g.fillCircle(pt.x, pt.y, r);

  drawSnakeEyesAt(g, pt.x, pt.y, r, frameCount);
}

function drawSnakeBody(
  g: Phaser.GameObjects.Graphics,
  points: Vec2[],
  leftEdge: Vec2[],
  rightEdge: Vec2[],
  _snakeLen: number,
  frameCount: number
): void {
  const segmentCount = Math.max(1, Math.floor(points.length / 3));

  for (let seg = 0; seg < segmentCount; seg++) {
    const startIdx = Math.floor((seg / segmentCount) * points.length);
    const endIdx = Math.min(
      Math.floor(((seg + 1) / segmentCount) * points.length),
      points.length - 1
    );
    if (startIdx >= endIdx) continue;

    const midProgress = ((startIdx + endIdx) / 2) / (points.length - 1);
    const colors = getSnakeColors(midProgress);

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

    if (midProgress < 0.4) {
      g.lineStyle(1, colors.edge, colors.alpha * 0.4);
      g.strokePath();
    }

  }
}

function drawSnakeStripes(
  g: Phaser.GameObjects.Graphics,
  points: Vec2[],
  leftEdge: Vec2[],
  rightEdge: Vec2[],
  _cellSize: number,
  frameCount: number
): void {
  const totalPts = points.length;
  if (totalPts < 4) return;

  const shimmer = 0.15 + Math.sin(frameCount * 0.03) * 0.04;

  g.lineStyle(0.6, S_HIGHLIGHT, shimmer * 0.5);
  g.beginPath();
  g.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < totalPts; i++) {
    g.lineTo(points[i].x, points[i].y);
  }
  g.strokePath();

  const crossStep = Math.max(3, Math.floor(totalPts / 10));
  for (let i = crossStep; i < totalPts; i += crossStep) {
    const progress = i / (totalPts - 1);
    if (progress < 0.1) continue;

    const life = 1 - progress * 0.3;
    g.lineStyle(0.5, S_GLOW, shimmer * life * 0.5);
    g.lineBetween(leftEdge[i].x, leftEdge[i].y, rightEdge[i].x, rightEdge[i].y);
  }
}


function drawSnakeHeadShape(
  g: Phaser.GameObjects.Graphics,
  points: Vec2[],
  leftEdge: Vec2[],
  rightEdge: Vec2[],
  cellSize: number,
  frameCount: number,
  widthMultiplier = 1.0
): void {
  const headEnd = Math.min(
    Math.floor(points.length * 0.18),
    points.length - 1
  );

  g.beginPath();
  g.moveTo(leftEdge[0].x, leftEdge[0].y);
  for (let i = 1; i <= headEnd; i++) {
    g.lineTo(leftEdge[i].x, leftEdge[i].y);
  }
  for (let i = headEnd; i >= 0; i--) {
    g.lineTo(rightEdge[i].x, rightEdge[i].y);
  }
  g.closePath();

  g.fillStyle(S_HEAD, 0.95);
  g.fillPath();

  g.lineStyle(1, S_TAIL, 0.4);
  g.strokePath();

  const headPt = points[0];
  const headW = getWidthAtProgress(0, cellSize, 1, widthMultiplier) / 2;

}

function drawSnakeEyes(
  g: Phaser.GameObjects.Graphics,
  points: Vec2[],
  cellSize: number,
  frameCount: number,
  widthMultiplier = 1.0
): void {
  const headPt = points[0];
  const headW = getWidthAtProgress(0.06, cellSize, 1, widthMultiplier) / 2;
  drawSnakeEyesAt(g, headPt.x, headPt.y, headW, frameCount);
}

function drawSnakeEyesAt(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  headW: number,
  frameCount: number
): void {
  const eyeSpacing = headW * 0.45;
  const eyeW = headW * 0.35;
  const eyeH = headW * 0.5;
  const squint = Math.sin(frameCount * 0.02) * 0.08;

  const leftEyeX = x - eyeSpacing;
  const rightEyeX = x + eyeSpacing;
  const eyeY = y - headW * 0.05;

  g.fillStyle(S_EDGE, 0.9);
  drawAngledEye(g, leftEyeX, eyeY, eyeW + 1.5, eyeH + 1.5, -0.15 + squint);
  drawAngledEye(g, rightEyeX, eyeY, eyeW + 1.5, eyeH + 1.5, 0.15 - squint);

  g.fillStyle(0xffffff, 0.95);
  drawAngledEye(g, leftEyeX, eyeY, eyeW, eyeH, -0.15 + squint);
  drawAngledEye(g, rightEyeX, eyeY, eyeW, eyeH, 0.15 - squint);

  const pupilSize = eyeW * 0.35;
  g.fillStyle(THEME.snake.pupil, 0.9);
  g.fillCircle(leftEyeX + 0.5, eyeY + 0.3, pupilSize);
  g.fillCircle(rightEyeX + 0.5, eyeY + 0.3, pupilSize);

  g.fillStyle(S_HIGHLIGHT, 0.6);
  g.fillCircle(leftEyeX - pupilSize * 0.3, eyeY - pupilSize * 0.3, pupilSize * 0.3);
  g.fillCircle(rightEyeX - pupilSize * 0.3, eyeY - pupilSize * 0.3, pupilSize * 0.3);
}

function drawAngledEye(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  w: number,
  h: number,
  angle: number
): void {
  const steps = 8;
  g.beginPath();
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * Math.PI * 2;
    const px = Math.cos(t) * w;
    const py = Math.sin(t) * h;
    const rx = px * Math.cos(angle) - py * Math.sin(angle);
    const ry = px * Math.sin(angle) + py * Math.cos(angle);
    if (i === 0) g.moveTo(cx + rx, cy + ry);
    else g.lineTo(cx + rx, cy + ry);
  }
  g.closePath();
  g.fillPath();
}
