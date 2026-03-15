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
  const noseWidth = cellSize * 0.08;
  const nozzleWidth = cellSize * 0.35;

  let w: number;
  if (progress < 0.02) {
    w = noseWidth + (bodyWidth - noseWidth) * (progress / 0.02);
  } else if (progress < 0.08) {
    w = bodyWidth;
  } else if (progress < 0.85) {
    w = bodyWidth - (bodyWidth - nozzleWidth) * ((progress - 0.08) / 0.77) * 0.15;
  } else if (progress < 0.92) {
    const t = (progress - 0.85) / 0.07;
    w = bodyWidth * 0.85 - (bodyWidth * 0.85 - nozzleWidth) * t;
  } else {
    const t = (progress - 0.92) / 0.08;
    const flare = nozzleWidth * (1.0 + t * 0.3);
    w = nozzleWidth + (flare - nozzleWidth) * Math.sin(t * Math.PI);
    if (t > 0.7) {
      w *= 1 - (t - 0.7) / 0.3 * 0.6;
    }
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

const M_NOSE = THEME.snake.head;
const M_BODY = THEME.snake.body;
const M_TAIL = THEME.snake.tail;
const M_HIGHLIGHT = THEME.snake.highlight;
const M_EDGE = THEME.snake.edge;
const M_GLOW = THEME.snake.glow;

const MISSILE_WHITE = 0xd8dde3;
const MISSILE_BAND_RED = 0xcc2222;
const MISSILE_BAND_YELLOW = 0xddaa22;
const MISSILE_RIVET = 0x556070;
const MISSILE_PANEL_LINE = 0x3a4858;
const EXHAUST_CORE = 0xffdd44;
const EXHAUST_MID = 0xff6622;
const EXHAUST_OUTER = 0xff3311;

function getMissileColors(
  progress: number
): { base: number; highlight: number; edge: number; alpha: number } {
  let base: number;
  let highlight: number;
  let edge: number;
  let alpha: number;

  if (progress < 0.08) {
    base = lerpColor(M_NOSE, M_BODY, progress / 0.08);
    highlight = M_HIGHLIGHT;
    edge = M_EDGE;
    alpha = 0.97;
  } else if (progress < 0.85) {
    const t = (progress - 0.08) / 0.77;
    base = lerpColor(M_BODY, M_TAIL, t * 0.3);
    highlight = M_HIGHLIGHT;
    edge = M_EDGE;
    alpha = 0.95;
  } else {
    const t = (progress - 0.85) / 0.15;
    base = lerpColor(M_TAIL, M_EDGE, t);
    highlight = lerpColor(M_HIGHLIGHT, M_TAIL, t);
    edge = M_EDGE;
    alpha = 0.92 - t * 0.15;
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
    drawSingleCellMissile(g, pt, cellSize, frameCount, widthMultiplier);
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

  drawMissileBody(g, points, leftEdge, rightEdge, len, frameCount);
  drawPanelLines(g, points, leftEdge, rightEdge, cellSize, frameCount);
  drawWarheadNose(g, points, leftEdge, rightEdge, cellSize, frameCount, widthMultiplier);
  drawWarningBands(g, points, leftEdge, rightEdge, cellSize, frameCount);
  drawTailFins(g, points, leftEdge, rightEdge, cellSize, frameCount);
  drawExhaustFlame(g, points, cellSize, frameCount, widthMultiplier);
  drawTargetingSensor(g, points, cellSize, frameCount, widthMultiplier);
}

function drawSingleCellMissile(
  g: Phaser.GameObjects.Graphics,
  pt: Vec2,
  cellSize: number,
  frameCount: number,
  widthMultiplier = 1.0
): void {
  const radius = cellSize * 0.35 * widthMultiplier;
  g.fillStyle(M_BODY, 0.95);
  g.fillCircle(pt.x, pt.y, radius);
  g.fillStyle(M_NOSE, 0.9);
  g.fillCircle(pt.x, pt.y - radius * 0.3, radius * 0.5);
  g.fillStyle(M_HIGHLIGHT, 0.3);
  g.fillCircle(pt.x - radius * 0.2, pt.y - radius * 0.2, radius * 0.25);
  drawSensorAt(g, pt.x, pt.y, radius, frameCount);
}

function drawMissileBody(
  g: Phaser.GameObjects.Graphics,
  points: Vec2[],
  leftEdge: Vec2[],
  rightEdge: Vec2[],
  _snakeLen: number,
  _frameCount: number
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
    const colors = getMissileColors(midProgress);

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

    g.lineStyle(1, colors.edge, colors.alpha * 0.5);
    g.strokePath();
  }

  for (let i = 0; i < points.length; i++) {
    const progress = i / (points.length - 1);
    if (progress < 0.1 || progress > 0.9) continue;
    const n = getNormalAt(points, i);
    const w = getWidthAtProgress(progress, 1, 1) * 0.5;
    const highlightAlpha = 0.12 + 0.05 * Math.sin(progress * 20);
    g.fillStyle(M_HIGHLIGHT, highlightAlpha);
    const hx = points[i].x + n.x * w * 0.6;
    const hy = points[i].y + n.y * w * 0.6;
    if (i % 2 === 0) {
      g.fillCircle(hx, hy, 0.8);
    }
  }
}

function drawPanelLines(
  g: Phaser.GameObjects.Graphics,
  points: Vec2[],
  leftEdge: Vec2[],
  rightEdge: Vec2[],
  _cellSize: number,
  _frameCount: number
): void {
  const totalPts = points.length;
  if (totalPts < 4) return;

  g.lineStyle(0.5, MISSILE_PANEL_LINE, 0.3);
  g.beginPath();
  g.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < totalPts; i++) {
    g.lineTo(points[i].x, points[i].y);
  }
  g.strokePath();

  const crossStep = Math.max(3, Math.floor(totalPts / 8));
  for (let i = crossStep; i < totalPts - crossStep; i += crossStep) {
    const progress = i / (totalPts - 1);
    if (progress < 0.12 || progress > 0.88) continue;
    g.lineStyle(0.5, MISSILE_PANEL_LINE, 0.25);
    g.lineBetween(leftEdge[i].x, leftEdge[i].y, rightEdge[i].x, rightEdge[i].y);
  }

  const rivetStep = Math.max(4, Math.floor(totalPts / 12));
  for (let i = rivetStep; i < totalPts - rivetStep; i += rivetStep) {
    const progress = i / (totalPts - 1);
    if (progress < 0.12 || progress > 0.88) continue;
    g.fillStyle(MISSILE_RIVET, 0.4);
    g.fillCircle(leftEdge[i].x, leftEdge[i].y, 1.0);
    g.fillCircle(rightEdge[i].x, rightEdge[i].y, 1.0);
  }
}

function drawWarheadNose(
  g: Phaser.GameObjects.Graphics,
  points: Vec2[],
  leftEdge: Vec2[],
  rightEdge: Vec2[],
  _cellSize: number,
  _frameCount: number,
  _widthMultiplier = 1.0
): void {
  const headEnd = Math.min(
    Math.floor(points.length * 0.10),
    points.length - 1
  );

  g.beginPath();
  g.moveTo(points[0].x, points[0].y);
  for (let i = 1; i <= headEnd; i++) {
    g.lineTo(leftEdge[i].x, leftEdge[i].y);
  }
  for (let i = headEnd; i >= 1; i--) {
    g.lineTo(rightEdge[i].x, rightEdge[i].y);
  }
  g.closePath();

  g.fillStyle(M_NOSE, 0.95);
  g.fillPath();

  g.lineStyle(1.0, M_EDGE, 0.5);
  g.strokePath();

  const tipIdx = Math.min(2, points.length - 1);
  g.fillStyle(0xff6644, 0.5);
  g.fillCircle(points[0].x, points[0].y, 2.5);
  g.fillStyle(MISSILE_WHITE, 0.6);
  g.fillCircle(
    points[tipIdx].x + (leftEdge[tipIdx].x - points[tipIdx].x) * 0.3,
    points[tipIdx].y + (leftEdge[tipIdx].y - points[tipIdx].y) * 0.3,
    1.5
  );
}

function drawWarningBands(
  g: Phaser.GameObjects.Graphics,
  points: Vec2[],
  leftEdge: Vec2[],
  rightEdge: Vec2[],
  _cellSize: number,
  frameCount: number
): void {
  const totalPts = points.length;
  if (totalPts < 10) return;

  const bandPositions = [0.12, 0.75];
  const bandWidth = 3;

  for (const bandPos of bandPositions) {
    const centerIdx = Math.floor(bandPos * (totalPts - 1));
    const startIdx = Math.max(0, centerIdx - bandWidth);
    const endIdx = Math.min(totalPts - 1, centerIdx + bandWidth);

    const flash = 0.7 + Math.sin(frameCount * 0.06 + bandPos * 10) * 0.15;

    g.beginPath();
    g.moveTo(leftEdge[startIdx].x, leftEdge[startIdx].y);
    for (let i = startIdx + 1; i <= endIdx; i++) {
      g.lineTo(leftEdge[i].x, leftEdge[i].y);
    }
    for (let i = endIdx; i >= startIdx; i--) {
      g.lineTo(rightEdge[i].x, rightEdge[i].y);
    }
    g.closePath();

    const bandColor = bandPos < 0.5 ? MISSILE_BAND_RED : MISSILE_BAND_YELLOW;
    g.fillStyle(bandColor, flash);
    g.fillPath();
  }
}

function drawTailFins(
  g: Phaser.GameObjects.Graphics,
  points: Vec2[],
  _leftEdge: Vec2[],
  _rightEdge: Vec2[],
  cellSize: number,
  _frameCount: number
): void {
  const totalPts = points.length;
  if (totalPts < 6) return;

  const finIdx = Math.floor(totalPts * 0.88);
  if (finIdx >= totalPts - 1 || finIdx < 1) return;

  const finPt = points[finIdx];
  const n = getNormalAt(points, finIdx);

  let dx = 0;
  let dy = -1;
  if (finIdx < totalPts - 1) {
    dx = points[finIdx + 1].x - points[finIdx].x;
    dy = points[finIdx + 1].y - points[finIdx].y;
    const mag = Math.sqrt(dx * dx + dy * dy) || 1;
    dx /= mag;
    dy /= mag;
  }

  const finLen = cellSize * 0.6;
  const finWidth = cellSize * 0.12;

  g.fillStyle(M_TAIL, 0.9);

  const tipLx = finPt.x + n.x * finLen + dx * finWidth;
  const tipLy = finPt.y + n.y * finLen + dy * finWidth;
  g.fillTriangle(
    finPt.x + n.x * cellSize * 0.15, finPt.y + n.y * cellSize * 0.15,
    tipLx, tipLy,
    finPt.x + dx * finWidth * 2 + n.x * cellSize * 0.05,
    finPt.y + dy * finWidth * 2 + n.y * cellSize * 0.05
  );

  const tipRx = finPt.x - n.x * finLen + dx * finWidth;
  const tipRy = finPt.y - n.y * finLen + dy * finWidth;
  g.fillTriangle(
    finPt.x - n.x * cellSize * 0.15, finPt.y - n.y * cellSize * 0.15,
    tipRx, tipRy,
    finPt.x + dx * finWidth * 2 - n.x * cellSize * 0.05,
    finPt.y + dy * finWidth * 2 - n.y * cellSize * 0.05
  );

  g.lineStyle(0.8, M_EDGE, 0.5);
  g.lineBetween(
    finPt.x + n.x * cellSize * 0.15, finPt.y + n.y * cellSize * 0.15,
    tipLx, tipLy
  );
  g.lineBetween(
    finPt.x - n.x * cellSize * 0.15, finPt.y - n.y * cellSize * 0.15,
    tipRx, tipRy
  );
}

function drawExhaustFlame(
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

  const flicker = 0.7 + Math.sin(frameCount * 0.25) * 0.3;
  const flicker2 = 0.6 + Math.sin(frameCount * 0.4 + 1.5) * 0.4;
  const flameLen = cellSize * (0.8 + flicker * 0.5);
  const flameWidth = cellSize * 0.2;

  const n = getNormalAt(points, totalPts - 1);

  g.fillStyle(EXHAUST_OUTER, 0.25 * flicker);
  g.fillCircle(
    tailPt.x + dx * flameLen * 0.4,
    tailPt.y + dy * flameLen * 0.4,
    flameWidth * 2.5 * flicker2
  );

  g.beginPath();
  g.moveTo(tailPt.x + n.x * flameWidth, tailPt.y + n.y * flameWidth);
  g.lineTo(
    tailPt.x + dx * flameLen * flicker2,
    tailPt.y + dy * flameLen * flicker2
  );
  g.lineTo(tailPt.x - n.x * flameWidth, tailPt.y - n.y * flameWidth);
  g.closePath();
  g.fillStyle(EXHAUST_OUTER, 0.6 * flicker);
  g.fillPath();

  const innerLen = flameLen * 0.65;
  const innerWidth = flameWidth * 0.6;

  g.beginPath();
  g.moveTo(tailPt.x + n.x * innerWidth, tailPt.y + n.y * innerWidth);
  g.lineTo(
    tailPt.x + dx * innerLen * flicker,
    tailPt.y + dy * innerLen * flicker
  );
  g.lineTo(tailPt.x - n.x * innerWidth, tailPt.y - n.y * innerWidth);
  g.closePath();
  g.fillStyle(EXHAUST_MID, 0.7 * flicker);
  g.fillPath();

  const coreLen = flameLen * 0.35;
  const coreWidth = flameWidth * 0.3;

  g.beginPath();
  g.moveTo(tailPt.x + n.x * coreWidth, tailPt.y + n.y * coreWidth);
  g.lineTo(
    tailPt.x + dx * coreLen * flicker2,
    tailPt.y + dy * coreLen * flicker2
  );
  g.lineTo(tailPt.x - n.x * coreWidth, tailPt.y - n.y * coreWidth);
  g.closePath();
  g.fillStyle(EXHAUST_CORE, 0.85);
  g.fillPath();

  g.fillStyle(0xffffff, 0.6 * flicker);
  g.fillCircle(tailPt.x + dx * 2, tailPt.y + dy * 2, coreWidth * 0.8);
}

function drawTargetingSensor(
  g: Phaser.GameObjects.Graphics,
  points: Vec2[],
  cellSize: number,
  frameCount: number,
  widthMultiplier = 1.0
): void {
  const headPt = points[0];
  const sensorIdx = Math.min(Math.floor(points.length * 0.04) + 1, points.length - 1);
  const sensorPt = points[sensorIdx];
  const headW = getWidthAtProgress(0.06, cellSize, 1, widthMultiplier) / 2;
  drawSensorAt(g, sensorPt.x, sensorPt.y, headW, frameCount);
}

function drawSensorAt(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  headW: number,
  frameCount: number
): void {
  const sensorR = headW * 0.35;
  const scanPulse = 0.5 + Math.sin(frameCount * 0.08) * 0.3;

  g.fillStyle(0x112233, 0.9);
  g.fillCircle(x, y, sensorR + 1);

  g.fillStyle(0x003344, 0.95);
  g.fillCircle(x, y, sensorR);

  g.fillStyle(0x00ff88, scanPulse * 0.6);
  g.fillCircle(x, y, sensorR * 0.6);

  g.fillStyle(0x00ffaa, scanPulse * 0.9);
  g.fillCircle(x, y, sensorR * 0.25);

  g.lineStyle(0.5, 0x00ff88, scanPulse * 0.4);
  g.lineBetween(x - sensorR * 0.8, y, x + sensorR * 0.8, y);
  g.lineBetween(x, y - sensorR * 0.8, x, y + sensorR * 0.8);
}
