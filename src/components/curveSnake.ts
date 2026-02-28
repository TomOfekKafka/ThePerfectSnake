import Phaser from 'phaser';
import { getFireColors } from './fireColors';

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

function buildSplinePoints(
  snake: { x: number; y: number }[],
  cellSize: number,
  frameCount: number
): Vec2[] {
  const len = snake.length;
  if (len === 0) return [];
  if (len === 1) return [gridToPixel(snake[0].x, snake[0].y, cellSize)];

  const centers = snake.map(s => gridToPixel(s.x, s.y, cellSize));

  if (len === 2) {
    const steps = 6;
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

  const stepsPerSegment = 5;
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
      const waveAmp = cellSize * 0.08 * (0.3 + globalProgress * 0.7);
      const waveFreq = 3.5;
      const wavePhase = frameCount * 0.06;
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

function getWidthAtProgress(
  progress: number,
  cellSize: number,
  snakeLen: number
): number {
  const maxWidth = cellSize * 0.72;
  const headWidth = cellSize * 0.65;
  const tailWidth = cellSize * 0.2;

  if (progress < 0.08) {
    const t = progress / 0.08;
    return headWidth + (maxWidth - headWidth) * t;
  }

  const bodyProgress = (progress - 0.08) / 0.92;
  const taperPower = snakeLen < 5 ? 1.0 : 0.7;
  return maxWidth - (maxWidth - tailWidth) * Math.pow(bodyProgress, taperPower);
}

function getNormalAt(points: Vec2[], index: number): Vec2 {
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

function getColorAtProgress(
  progress: number,
  snakeLen: number
): { base: number; highlight: number; edge: number } {
  const segIndex = Math.floor(progress * (snakeLen - 1));
  return getFireColors(Math.min(segIndex, snakeLen - 1), snakeLen);
}

export function drawCurveSnake(
  g: Phaser.GameObjects.Graphics,
  snake: { x: number; y: number }[],
  cellSize: number,
  frameCount: number
): void {
  const len = snake.length;
  if (len === 0) return;

  if (len === 1) {
    const pt = gridToPixel(snake[0].x, snake[0].y, cellSize);
    const colors = getFireColors(0, 1);
    g.fillStyle(0x000000, 0.2);
    g.fillCircle(pt.x + 2, pt.y + 3, cellSize * 0.4);
    g.fillStyle(colors.base, 0.95);
    g.fillCircle(pt.x, pt.y, cellSize * 0.38);
    g.fillStyle(colors.highlight, 0.3);
    g.fillCircle(pt.x - cellSize * 0.08, pt.y - cellSize * 0.08, cellSize * 0.22);
    return;
  }

  const points = buildSplinePoints(snake, cellSize, frameCount);
  if (points.length < 2) return;

  const leftEdge: Vec2[] = [];
  const rightEdge: Vec2[] = [];

  for (let i = 0; i < points.length; i++) {
    const progress = i / (points.length - 1);
    const w = getWidthAtProgress(progress, cellSize, len) / 2;
    const n = getNormalAt(points, i);
    leftEdge.push({ x: points[i].x + n.x * w, y: points[i].y + n.y * w });
    rightEdge.push({ x: points[i].x - n.x * w, y: points[i].y - n.y * w });
  }

  drawBodyShadow(g, points, leftEdge, rightEdge);
  drawBodyFill(g, points, leftEdge, rightEdge, len, frameCount);
  drawBodyHighlights(g, points, cellSize, len, frameCount);
  drawScaleDetails(g, points, cellSize, len, frameCount);
}

function drawBodyShadow(
  g: Phaser.GameObjects.Graphics,
  points: Vec2[],
  leftEdge: Vec2[],
  rightEdge: Vec2[]
): void {
  g.fillStyle(0x000000, 0.2);
  g.beginPath();
  g.moveTo(leftEdge[0].x + 2, leftEdge[0].y + 3);
  for (let i = 1; i < leftEdge.length; i++) {
    g.lineTo(leftEdge[i].x + 2, leftEdge[i].y + 3);
  }
  for (let i = rightEdge.length - 1; i >= 0; i--) {
    g.lineTo(rightEdge[i].x + 2, rightEdge[i].y + 3);
  }
  g.closePath();
  g.fillPath();
}

function drawBodyFill(
  g: Phaser.GameObjects.Graphics,
  points: Vec2[],
  leftEdge: Vec2[],
  rightEdge: Vec2[],
  snakeLen: number,
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
    const colors = getColorAtProgress(midProgress, snakeLen);

    g.lineStyle(2, colors.edge, 0.6);
    g.beginPath();
    g.moveTo(leftEdge[startIdx].x, leftEdge[startIdx].y);
    for (let i = startIdx + 1; i <= endIdx; i++) {
      g.lineTo(leftEdge[i].x, leftEdge[i].y);
    }
    for (let i = endIdx; i >= startIdx; i--) {
      g.lineTo(rightEdge[i].x, rightEdge[i].y);
    }
    g.closePath();
    g.fillStyle(colors.base, 0.92);
    g.fillPath();
    g.strokePath();

    const shimmer = 0.12 + Math.sin(frameCount * 0.04 + midProgress * Math.PI * 2) * 0.06;
    g.beginPath();
    for (let i = startIdx; i <= endIdx; i++) {
      const lp = leftEdge[i];
      const rp = rightEdge[i];
      const mx = lp.x * 0.65 + rp.x * 0.35;
      const my = lp.y * 0.65 + rp.y * 0.35;
      if (i === startIdx) g.moveTo(mx, my);
      else g.lineTo(mx, my);
    }
    for (let i = endIdx; i >= startIdx; i--) {
      const lp = leftEdge[i];
      const rp = rightEdge[i];
      const cx = lp.x * 0.55 + rp.x * 0.45;
      const cy = lp.y * 0.55 + rp.y * 0.45;
      g.lineTo(cx, cy);
    }
    g.closePath();
    g.fillStyle(colors.highlight, shimmer);
    g.fillPath();
  }
}

function drawBodyHighlights(
  g: Phaser.GameObjects.Graphics,
  points: Vec2[],
  cellSize: number,
  snakeLen: number,
  frameCount: number
): void {
  const headPt = points[0];
  const headColors = getColorAtProgress(0, snakeLen);
  const headW = getWidthAtProgress(0, cellSize, snakeLen) / 2;

  g.fillStyle(headColors.highlight, 0.25);
  g.fillCircle(headPt.x, headPt.y, headW * 0.8);

  const specAlpha = 0.15 + Math.sin(frameCount * 0.06) * 0.08;
  g.fillStyle(0xffffff, specAlpha);
  g.fillCircle(headPt.x - headW * 0.15, headPt.y - headW * 0.15, headW * 0.3);
}

function drawScaleDetails(
  g: Phaser.GameObjects.Graphics,
  points: Vec2[],
  cellSize: number,
  snakeLen: number,
  frameCount: number
): void {
  const spacing = Math.max(3, Math.floor(points.length / (snakeLen * 1.5)));

  for (let i = spacing; i < points.length - spacing; i += spacing) {
    const progress = i / (points.length - 1);
    const w = getWidthAtProgress(progress, cellSize, snakeLen) / 2;
    const n = getNormalAt(points, i);
    const pt = points[i];
    const colors = getColorAtProgress(progress, snakeLen);

    const scaleAlpha = 0.08 + Math.sin(frameCount * 0.03 + progress * 6) * 0.04;
    const scaleR = w * 0.35;

    g.lineStyle(1, colors.highlight, scaleAlpha);
    g.strokeCircle(
      pt.x + n.x * w * 0.2,
      pt.y + n.y * w * 0.2,
      scaleR
    );
    g.strokeCircle(
      pt.x - n.x * w * 0.2,
      pt.y - n.y * w * 0.2,
      scaleR
    );
  }
}
