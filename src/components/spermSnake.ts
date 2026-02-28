import Phaser from 'phaser';

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
        : cellSize * 0.14 * (0.2 + globalProgress * 0.8);
      const waveFreq = 4.5;
      const wavePhase = frameCount * 0.1;
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
  _snakeLen: number
): number {
  const headWidth = cellSize * 0.85;
  const neckWidth = cellSize * 0.35;
  const tailWidth = cellSize * 0.08;

  if (progress < 0.04) {
    const t = progress / 0.04;
    return headWidth * t;
  }
  if (progress < 0.12) {
    return headWidth;
  }
  if (progress < 0.22) {
    const t = (progress - 0.12) / 0.10;
    return headWidth - (headWidth - neckWidth) * t;
  }

  const tailProgress = (progress - 0.22) / 0.78;
  return neckWidth - (neckWidth - tailWidth) * Math.pow(tailProgress, 0.6);
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

function lerpChannel(a: number, b: number, t: number): number {
  return Math.round(a + (b - a) * t);
}

function lerpColor(c1: number, c2: number, t: number): number {
  const r = lerpChannel((c1 >> 16) & 0xff, (c2 >> 16) & 0xff, t);
  const gc = lerpChannel((c1 >> 8) & 0xff, (c2 >> 8) & 0xff, t);
  const b = lerpChannel(c1 & 0xff, c2 & 0xff, t);
  return (Math.min(0xff, r) << 16) | (Math.min(0xff, gc) << 8) | Math.min(0xff, b);
}

const PEARL_WHITE = 0xf0eef5;
const CREAM = 0xe8e0d8;
const TRANSLUCENT_BODY = 0xd8d0c8;
const TAIL_FADE = 0xc0b8b0;

const HIGHLIGHT_BRIGHT = 0xffffff;
const HIGHLIGHT_WARM = 0xfaf0e8;

const EDGE_LIGHT = 0xc8c0b8;
const EDGE_MID = 0xb0a8a0;

function getSpermColors(
  progress: number
): { base: number; highlight: number; edge: number; alpha: number } {
  let base: number;
  let alpha: number;

  if (progress < 0.15) {
    base = lerpColor(PEARL_WHITE, CREAM, progress / 0.15);
    alpha = 0.95;
  } else if (progress < 0.4) {
    base = lerpColor(CREAM, TRANSLUCENT_BODY, (progress - 0.15) / 0.25);
    alpha = 0.88 - (progress - 0.15) * 0.2;
  } else {
    base = lerpColor(TRANSLUCENT_BODY, TAIL_FADE, (progress - 0.4) / 0.6);
    alpha = 0.75 - (progress - 0.4) * 0.55;
  }

  const highlight = progress < 0.3
    ? lerpColor(HIGHLIGHT_BRIGHT, HIGHLIGHT_WARM, progress / 0.3)
    : HIGHLIGHT_WARM;

  const edge = progress < 0.3
    ? lerpColor(EDGE_LIGHT, EDGE_MID, progress / 0.3)
    : EDGE_MID;

  return { base, highlight, edge, alpha: Math.max(0.2, alpha) };
}

export function drawSpermSnake(
  g: Phaser.GameObjects.Graphics,
  snake: { x: number; y: number }[],
  cellSize: number,
  frameCount: number
): void {
  const len = snake.length;
  if (len === 0) return;

  if (len === 1) {
    const pt = gridToPixel(snake[0].x, snake[0].y, cellSize);
    drawSingleCellHead(g, pt, cellSize, frameCount);
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

  drawTailShadow(g, points, leftEdge, rightEdge);
  drawTailFill(g, points, leftEdge, rightEdge, len, frameCount);
  drawHeadGlow(g, points, cellSize, frameCount);
  drawHeadBody(g, points, leftEdge, rightEdge, cellSize, frameCount);
  drawNucleus(g, points, cellSize, frameCount);
}

function drawSingleCellHead(
  g: Phaser.GameObjects.Graphics,
  pt: Vec2,
  cellSize: number,
  frameCount: number
): void {
  const radius = cellSize * 0.45;
  const pulse = 1.0 + Math.sin(frameCount * 0.05) * 0.04;
  const r = radius * pulse;

  g.fillStyle(0x000000, 0.12);
  g.fillCircle(pt.x + 1.5, pt.y + 2, r);

  g.fillStyle(PEARL_WHITE, 0.15);
  g.fillCircle(pt.x, pt.y, r * 1.5);

  g.fillStyle(PEARL_WHITE, 0.95);
  g.fillCircle(pt.x, pt.y, r);

  g.fillStyle(HIGHLIGHT_BRIGHT, 0.35);
  g.fillCircle(pt.x - r * 0.2, pt.y - r * 0.2, r * 0.5);

  g.fillStyle(0xffffff, 0.2);
  g.fillCircle(pt.x - r * 0.25, pt.y - r * 0.3, r * 0.2);

  drawNucleusAt(g, pt.x, pt.y, r * 0.55, frameCount);
}

function drawTailShadow(
  g: Phaser.GameObjects.Graphics,
  _points: Vec2[],
  leftEdge: Vec2[],
  rightEdge: Vec2[]
): void {
  g.fillStyle(0x000000, 0.1);
  g.beginPath();
  g.moveTo(leftEdge[0].x + 1.5, leftEdge[0].y + 2);
  for (let i = 1; i < leftEdge.length; i++) {
    g.lineTo(leftEdge[i].x + 1.5, leftEdge[i].y + 2);
  }
  for (let i = rightEdge.length - 1; i >= 0; i--) {
    g.lineTo(rightEdge[i].x + 1.5, rightEdge[i].y + 2);
  }
  g.closePath();
  g.fillPath();
}

function drawTailFill(
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
    const colors = getSpermColors(midProgress);

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

    if (midProgress < 0.3) {
      g.lineStyle(1, colors.edge, colors.alpha * 0.4);
      g.strokePath();
    }

    const shimmer = 0.08 + Math.sin(frameCount * 0.05 + midProgress * Math.PI * 3) * 0.05;
    g.beginPath();
    for (let i = startIdx; i <= endIdx; i++) {
      const lp = leftEdge[i];
      const rp = rightEdge[i];
      const mx = lp.x * 0.7 + rp.x * 0.3;
      const my = lp.y * 0.7 + rp.y * 0.3;
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
    g.fillStyle(colors.highlight, shimmer * colors.alpha);
    g.fillPath();
  }
}

function drawHeadGlow(
  g: Phaser.GameObjects.Graphics,
  points: Vec2[],
  cellSize: number,
  frameCount: number
): void {
  const headPt = points[0];
  const pulse = 1.0 + Math.sin(frameCount * 0.04) * 0.12;
  const glowRadius = cellSize * 0.7 * pulse;

  g.fillStyle(0xf0e8f0, 0.08);
  g.fillCircle(headPt.x, headPt.y, glowRadius * 1.3);

  g.fillStyle(0xf5eff5, 0.12);
  g.fillCircle(headPt.x, headPt.y, glowRadius);
}

function drawHeadBody(
  g: Phaser.GameObjects.Graphics,
  points: Vec2[],
  leftEdge: Vec2[],
  rightEdge: Vec2[],
  cellSize: number,
  frameCount: number
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

  g.fillStyle(PEARL_WHITE, 0.95);
  g.fillPath();

  g.lineStyle(1, EDGE_LIGHT, 0.4);
  g.strokePath();

  const headPt = points[0];
  const headW = getWidthAtProgress(0, cellSize, 1) / 2;

  g.fillStyle(HIGHLIGHT_BRIGHT, 0.3);
  g.fillCircle(headPt.x - headW * 0.15, headPt.y - headW * 0.15, headW * 0.55);

  const specAlpha = 0.2 + Math.sin(frameCount * 0.06) * 0.1;
  g.fillStyle(0xffffff, specAlpha);
  g.fillCircle(headPt.x - headW * 0.2, headPt.y - headW * 0.25, headW * 0.2);
}

function drawNucleus(
  g: Phaser.GameObjects.Graphics,
  points: Vec2[],
  cellSize: number,
  frameCount: number
): void {
  const headPt = points[0];
  const headW = getWidthAtProgress(0.06, cellSize, 1) / 2;
  const nucleusR = headW * 0.45;

  drawNucleusAt(g, headPt.x, headPt.y, nucleusR, frameCount);
}

function drawNucleusAt(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  radius: number,
  frameCount: number
): void {
  const wobble = Math.sin(frameCount * 0.03) * radius * 0.05;

  g.fillStyle(0xd8d0e0, 0.35);
  g.fillCircle(x + wobble, y + wobble * 0.7, radius);

  g.fillStyle(0xc8c0d5, 0.25);
  g.fillCircle(x + wobble * 0.5, y - wobble * 0.3, radius * 0.6);

  g.fillStyle(0xf0e8f8, 0.15);
  g.fillCircle(x - radius * 0.15, y - radius * 0.15, radius * 0.3);
}
