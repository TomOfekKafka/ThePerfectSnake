import Phaser from 'phaser';

export interface DragonSegment {
  cx: number;
  cy: number;
  radius: number;
  taper: number;
  isHead: boolean;
}

export function computeDragonSegment(
  x: number,
  y: number,
  cellSize: number,
  index: number,
  snakeLen: number
): DragonSegment {
  const cx = x * cellSize + cellSize / 2;
  const cy = y * cellSize + cellSize / 2;
  const t = snakeLen > 1 ? index / (snakeLen - 1) : 0;
  const headScale = index === 0 ? 1.15 : 1.0;
  const taperScale = 0.8 + (1 - t) * 0.2;
  const radius = (cellSize / 2 - 1) * taperScale * headScale;
  return { cx, cy, radius, taper: t, isHead: index === 0 };
}

export function scaleBaseColor(taper: number): number {
  const r = Math.round(0x8b + (1 - taper) * 0x44);
  const g = Math.round(0x45 + (1 - taper) * 0x3a);
  const b = Math.round(0x13 + (1 - taper) * 0x0c);
  return (Math.min(0xff, r) << 16) | (Math.min(0xff, g) << 8) | Math.min(0xff, b);
}

export function scaleHighlightColor(taper: number): number {
  const r = Math.round(0xd4 + (1 - taper) * 0x2b);
  const g = Math.round(0x8a + (1 - taper) * 0x35);
  const b = Math.round(0x1a + (1 - taper) * 0x15);
  return (Math.min(0xff, r) << 16) | (Math.min(0xff, g) << 8) | Math.min(0xff, b);
}

export function scaleBellyColor(taper: number): number {
  const r = Math.round(0xda + (1 - taper) * 0x15);
  const g = Math.round(0xb0 + (1 - taper) * 0x20);
  const b = Math.round(0x50 + (1 - taper) * 0x20);
  return (Math.min(0xff, r) << 16) | (Math.min(0xff, g) << 8) | Math.min(0xff, b);
}

const LIGHT_ANGLE = -Math.PI / 4;
const LIGHT_COS = Math.cos(LIGHT_ANGLE);
const LIGHT_SIN = Math.sin(LIGHT_ANGLE);

function drawDragonShadow(g: Phaser.GameObjects.Graphics, seg: DragonSegment): void {
  g.fillStyle(0x000000, 0.2);
  g.fillEllipse(seg.cx + 2, seg.cy + 4, seg.radius * 2.2, seg.radius * 1.3);
}

function drawScalePattern(
  g: Phaser.GameObjects.Graphics,
  seg: DragonSegment,
  frameCount: number
): void {
  const base = scaleBaseColor(seg.taper);
  const highlight = scaleHighlightColor(seg.taper);
  const belly = scaleBellyColor(seg.taper);

  g.fillStyle(base, 0.95);
  g.fillCircle(seg.cx, seg.cy, seg.radius);

  g.fillStyle(belly, 0.4);
  g.fillEllipse(
    seg.cx - LIGHT_COS * seg.radius * 0.15,
    seg.cy - LIGHT_SIN * seg.radius * 0.15,
    seg.radius * 1.2,
    seg.radius * 0.7
  );

  const shimmer = 0.15 + Math.sin(frameCount * 0.05 + seg.taper * Math.PI * 2) * 0.08;
  g.fillStyle(highlight, shimmer);
  g.fillCircle(
    seg.cx + LIGHT_COS * seg.radius * 0.25,
    seg.cy + LIGHT_SIN * seg.radius * 0.25,
    seg.radius * 0.7
  );

  const numScales = 3;
  for (let i = 0; i < numScales; i++) {
    const angle = (i / numScales) * Math.PI * 2 + frameCount * 0.01 + seg.taper * 2;
    const sx = seg.cx + Math.cos(angle) * seg.radius * 0.45;
    const sy = seg.cy + Math.sin(angle) * seg.radius * 0.45;
    const scaleR = seg.radius * 0.25;
    g.lineStyle(1, highlight, 0.2 + shimmer * 0.3);
    g.strokeCircle(sx, sy, scaleR);
  }

  const specPulse = 0.4 + Math.sin(frameCount * 0.07 + seg.taper * Math.PI) * 0.12;
  const specX = seg.cx + LIGHT_COS * seg.radius * 0.35;
  const specY = seg.cy + LIGHT_SIN * seg.radius * 0.35;
  g.fillStyle(0xffffff, specPulse * 0.5);
  g.fillCircle(specX, specY, seg.radius * 0.2);
}

function drawDragonHead(
  g: Phaser.GameObjects.Graphics,
  seg: DragonSegment,
  frameCount: number
): void {
  const breathe = 1.0 + Math.sin(frameCount * 0.08) * 0.03;
  const headR = seg.radius * breathe;

  g.fillStyle(0xff4400, 0.12);
  g.fillCircle(seg.cx, seg.cy, headR + 5);

  const base = scaleBaseColor(0);
  g.fillStyle(base, 0.97);
  g.fillCircle(seg.cx, seg.cy, headR);

  const highlight = scaleHighlightColor(0);
  g.fillStyle(highlight, 0.3);
  g.fillCircle(
    seg.cx + LIGHT_COS * headR * 0.2,
    seg.cy + LIGHT_SIN * headR * 0.2,
    headR * 0.75
  );

  const specX = seg.cx + LIGHT_COS * headR * 0.3;
  const specY = seg.cy + LIGHT_SIN * headR * 0.3;
  const specPulse = 0.45 + Math.sin(frameCount * 0.1) * 0.15;
  g.fillStyle(0xffffff, specPulse * 0.5);
  g.fillCircle(specX, specY, headR * 0.25);

  const eyeSpread = headR * 0.38;
  const eyeY = seg.cy - headR * 0.1;
  const eyeR = headR * 0.24;

  g.fillStyle(0xfff4d0, 0.95);
  g.fillCircle(seg.cx - eyeSpread, eyeY, eyeR);
  g.fillCircle(seg.cx + eyeSpread, eyeY, eyeR);

  g.fillStyle(0xcc3300, 0.9);
  g.fillCircle(seg.cx - eyeSpread, eyeY, eyeR * 0.55);
  g.fillCircle(seg.cx + eyeSpread, eyeY, eyeR * 0.55);

  const pupilPulse = 0.25 + Math.sin(frameCount * 0.06) * 0.05;
  g.fillStyle(0x110000, 0.95);
  g.fillEllipse(seg.cx - eyeSpread, eyeY, eyeR * pupilPulse, eyeR * 0.55);
  g.fillEllipse(seg.cx + eyeSpread, eyeY, eyeR * pupilPulse, eyeR * 0.55);

  g.fillStyle(0xffeecc, 0.8);
  g.fillCircle(seg.cx - eyeSpread - eyeR * 0.2, eyeY - eyeR * 0.2, eyeR * 0.13);
  g.fillCircle(seg.cx + eyeSpread - eyeR * 0.2, eyeY - eyeR * 0.2, eyeR * 0.13);

  const hornLen = headR * 0.55;
  const hornBaseR = headR * 0.12;
  for (const side of [-1, 1]) {
    const hornX = seg.cx + side * headR * 0.55;
    const hornY = seg.cy - headR * 0.4;
    const tipX = hornX + side * hornLen * 0.4;
    const tipY = hornY - hornLen;

    g.lineStyle(hornBaseR * 2, 0x332200, 0.8);
    g.lineBetween(hornX, hornY, tipX, tipY);
    g.lineStyle(hornBaseR, 0x665533, 0.6);
    g.lineBetween(hornX, hornY, tipX, tipY);
    g.fillStyle(0xffcc66, 0.6);
    g.fillCircle(tipX, tipY, hornBaseR * 0.6);
  }
}

function drawDragonSpines(
  g: Phaser.GameObjects.Graphics,
  segments: DragonSegment[],
  frameCount: number
): void {
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    if (seg.isHead) continue;
    if (i % 2 !== 0) continue;

    const nextSeg = i + 1 < segments.length ? segments[i + 1] : null;
    const prevSeg = i > 0 ? segments[i - 1] : null;

    let angle = -Math.PI / 2;
    if (prevSeg && nextSeg) {
      const dx = prevSeg.cx - nextSeg.cx;
      const dy = prevSeg.cy - nextSeg.cy;
      angle = Math.atan2(dy, dx) + Math.PI / 2;
    }

    const spineLen = seg.radius * (0.3 + (1 - seg.taper) * 0.25);
    const pulse = 1.0 + Math.sin(frameCount * 0.06 + i * 0.4) * 0.1;
    const tipX = seg.cx + Math.cos(angle) * spineLen * pulse;
    const tipY = seg.cy + Math.sin(angle) * spineLen * pulse;

    g.lineStyle(2, 0x993300, 0.5);
    g.lineBetween(seg.cx, seg.cy, tipX, tipY);
    g.fillStyle(0xff6600, 0.4);
    g.fillCircle(tipX, tipY, 1.5);
  }
}

export function drawDragonConnectors(
  g: Phaser.GameObjects.Graphics,
  segments: DragonSegment[]
): void {
  if (segments.length < 2) return;
  for (let i = 0; i < segments.length - 1; i++) {
    const a = segments[i];
    const b = segments[i + 1];
    const dx = b.cx - a.cx;
    const dy = b.cy - a.cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1 || dist > a.radius * 4) continue;
    const connW = Math.min(a.radius, b.radius) * 1.5;
    const color = scaleBaseColor((a.taper + b.taper) / 2);
    g.lineStyle(connW, color, 0.75);
    g.lineBetween(a.cx, a.cy, b.cx, b.cy);
  }
}

export function drawDragonSnake(
  g: Phaser.GameObjects.Graphics,
  snake: { x: number; y: number }[],
  cellSize: number,
  frameCount: number
): void {
  const len = snake.length;
  if (len === 0) return;

  const segments = snake.map((s, i) => computeDragonSegment(s.x, s.y, cellSize, i, len));

  for (let i = len - 1; i >= 0; i--) {
    drawDragonShadow(g, segments[i]);
  }

  drawDragonConnectors(g, segments);

  for (let i = len - 1; i >= 0; i--) {
    if (segments[i].isHead) continue;
    drawScalePattern(g, segments[i], frameCount);
  }

  drawDragonSpines(g, segments, frameCount);
  drawDragonHead(g, segments[0], frameCount);
}
