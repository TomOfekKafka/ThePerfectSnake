import Phaser from 'phaser';

const LIGHT_ANGLE = -Math.PI / 4;
const LIGHT_COS = Math.cos(LIGHT_ANGLE);
const LIGHT_SIN = Math.sin(LIGHT_ANGLE);
const SHADOW_OFFSET_X = 2;
const SHADOW_OFFSET_Y = 3;

export interface PureSegment {
  cx: number;
  cy: number;
  radius: number;
  taper: number;
  isHead: boolean;
}

export function computePureSegment(
  x: number,
  y: number,
  cellSize: number,
  index: number,
  snakeLen: number
): PureSegment {
  const cx = x * cellSize + cellSize / 2;
  const cy = y * cellSize + cellSize / 2;
  const t = snakeLen > 1 ? index / (snakeLen - 1) : 0;
  const headScale = index === 0 ? 1.12 : 1.0;
  const taperScale = 0.82 + (1 - t) * 0.18;
  const radius = (cellSize / 2 - 1) * taperScale * headScale;
  return { cx, cy, radius, taper: t, isHead: index === 0 };
}

export function segmentBaseColor(taper: number): number {
  const r = Math.round(0xcc + (1 - taper) * 0x33);
  const g = Math.round(0xdd + (1 - taper) * 0x22);
  const b = Math.round(0xee + (1 - taper) * 0x11);
  return (Math.min(0xff, r) << 16) | (Math.min(0xff, g) << 8) | Math.min(0xff, b);
}

export function segmentAccentColor(taper: number): number {
  const blue = Math.round(0x88 + (1 - taper) * 0x44);
  const green = Math.round(0xbb + (1 - taper) * 0x22);
  return (0x88 << 16) | (Math.min(0xff, green) << 8) | Math.min(0xff, blue);
}

function drawPureShadow(
  g: Phaser.GameObjects.Graphics,
  seg: PureSegment
): void {
  g.fillStyle(0x000000, 0.18);
  g.fillEllipse(
    seg.cx + SHADOW_OFFSET_X,
    seg.cy + SHADOW_OFFSET_Y + 2,
    seg.radius * 2,
    seg.radius * 1.2
  );
}

function drawPureBody(
  g: Phaser.GameObjects.Graphics,
  seg: PureSegment,
  frameCount: number
): void {
  const base = segmentBaseColor(seg.taper);
  const accent = segmentAccentColor(seg.taper);

  g.fillStyle(base, 0.25);
  g.fillCircle(seg.cx, seg.cy, seg.radius + 2);

  g.fillStyle(base, 0.92);
  g.fillCircle(seg.cx, seg.cy, seg.radius);

  const rimX = seg.cx + LIGHT_COS * seg.radius * 0.2;
  const rimY = seg.cy + LIGHT_SIN * seg.radius * 0.2;
  g.fillStyle(accent, 0.18);
  g.fillCircle(rimX, rimY, seg.radius * 0.8);

  const specPulse = 0.5 + Math.sin(frameCount * 0.06 + seg.taper * Math.PI) * 0.15;
  const specX = seg.cx + LIGHT_COS * seg.radius * 0.35;
  const specY = seg.cy + LIGHT_SIN * seg.radius * 0.35;
  g.fillStyle(0xffffff, specPulse);
  g.fillCircle(specX, specY, seg.radius * 0.3);

  g.fillStyle(0xffffff, specPulse * 0.4);
  g.fillCircle(specX - seg.radius * 0.12, specY + seg.radius * 0.05, seg.radius * 0.14);
}

function drawPureHead(
  g: Phaser.GameObjects.Graphics,
  seg: PureSegment,
  frameCount: number
): void {
  const base = segmentBaseColor(0);

  const breathe = 1.0 + Math.sin(frameCount * 0.08) * 0.03;
  const headR = seg.radius * breathe;

  g.fillStyle(0xaaccee, 0.15);
  g.fillCircle(seg.cx, seg.cy, headR + 4);

  g.fillStyle(base, 0.95);
  g.fillCircle(seg.cx, seg.cy, headR);

  const specX = seg.cx + LIGHT_COS * headR * 0.3;
  const specY = seg.cy + LIGHT_SIN * headR * 0.3;
  const specPulse = 0.55 + Math.sin(frameCount * 0.1) * 0.15;

  g.fillStyle(0xffffff, specPulse);
  g.fillCircle(specX, specY, headR * 0.35);
  g.fillStyle(0xffffff, specPulse * 0.4);
  g.fillCircle(specX - headR * 0.15, specY - headR * 0.08, headR * 0.12);

  const eyeSpread = headR * 0.38;
  const eyeY = seg.cy - headR * 0.08;
  const eyeR = headR * 0.22;

  g.fillStyle(0xf8f8ff, 0.95);
  g.fillCircle(seg.cx - eyeSpread, eyeY, eyeR);
  g.fillCircle(seg.cx + eyeSpread, eyeY, eyeR);

  g.fillStyle(0x334466, 0.9);
  g.fillCircle(seg.cx - eyeSpread, eyeY, eyeR * 0.55);
  g.fillCircle(seg.cx + eyeSpread, eyeY, eyeR * 0.55);

  g.fillStyle(0x112233, 0.95);
  g.fillCircle(seg.cx - eyeSpread, eyeY, eyeR * 0.28);
  g.fillCircle(seg.cx + eyeSpread, eyeY, eyeR * 0.28);

  g.fillStyle(0xffffff, 0.85);
  g.fillCircle(seg.cx - eyeSpread - eyeR * 0.2, eyeY - eyeR * 0.2, eyeR * 0.15);
  g.fillCircle(seg.cx + eyeSpread - eyeR * 0.2, eyeY - eyeR * 0.2, eyeR * 0.15);
}

export function drawPureConnectors(
  g: Phaser.GameObjects.Graphics,
  segments: PureSegment[]
): void {
  if (segments.length < 2) return;
  for (let i = 0; i < segments.length - 1; i++) {
    const a = segments[i];
    const b = segments[i + 1];
    const dx = b.cx - a.cx;
    const dy = b.cy - a.cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1 || dist > a.radius * 4) continue;
    const connW = Math.min(a.radius, b.radius) * 1.4;
    const color = segmentBaseColor((a.taper + b.taper) / 2);
    g.lineStyle(connW, color, 0.7);
    g.lineBetween(a.cx, a.cy, b.cx, b.cy);
  }
}

export function drawPureSnake(
  g: Phaser.GameObjects.Graphics,
  snake: { x: number; y: number }[],
  cellSize: number,
  frameCount: number
): void {
  const len = snake.length;
  if (len === 0) return;

  const segments = snake.map((s, i) => computePureSegment(s.x, s.y, cellSize, i, len));

  for (let i = len - 1; i >= 0; i--) {
    drawPureShadow(g, segments[i]);
  }

  drawPureConnectors(g, segments);

  for (let i = len - 1; i >= 0; i--) {
    if (segments[i].isHead) continue;
    drawPureBody(g, segments[i], frameCount);
  }

  drawPureHead(g, segments[0], frameCount);
}
