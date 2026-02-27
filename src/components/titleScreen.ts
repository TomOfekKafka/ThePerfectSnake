import Phaser from 'phaser';
import { THEME } from './gameTheme';

export interface TitleScreenState {
  phase: number;
  letterReveals: number[];
  titleGlow: number;
  subtitleAlpha: number;
  pulseRings: TitlePulseRing[];
  driftParticles: TitleDriftParticle[];
  snakePreview: TitleSnakeSegment[];
  snakePhase: number;
  ready: boolean;
}

interface TitlePulseRing {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  speed: number;
}

interface TitleDriftParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  hue: number;
  pulsePhase: number;
}

interface TitleSnakeSegment {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
}

const TITLE_TEXT = 'SNAKE';
const MAX_DRIFT_PARTICLES = 30;
const MAX_PULSE_RINGS = 4;
const PREVIEW_SNAKE_LEN = 12;

export function createTitleScreenState(): TitleScreenState {
  return {
    phase: 0,
    letterReveals: TITLE_TEXT.split('').map(() => 0),
    titleGlow: 0,
    subtitleAlpha: 0,
    pulseRings: [],
    driftParticles: [],
    snakePreview: [],
    snakePhase: 0,
    ready: false,
  };
}

export function initTitleScreen(state: TitleScreenState, width: number, height: number): void {
  for (let i = 0; i < MAX_DRIFT_PARTICLES; i++) {
    state.driftParticles.push(spawnDriftParticle(width, height));
  }

  const cx = width / 2;
  const cy = height * 0.65;
  for (let i = 0; i < PREVIEW_SNAKE_LEN; i++) {
    const angle = (i / PREVIEW_SNAKE_LEN) * Math.PI * 2;
    const r = 40 + i * 2;
    state.snakePreview.push({
      x: cx + Math.cos(angle) * r,
      y: cy + Math.sin(angle) * r * 0.5,
      targetX: cx + Math.cos(angle) * r,
      targetY: cy + Math.sin(angle) * r * 0.5,
    });
  }

  state.ready = true;
}

function spawnDriftParticle(width: number, height: number): TitleDriftParticle {
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.3,
    vy: -0.2 - Math.random() * 0.3,
    size: 1 + Math.random() * 2,
    alpha: 0.1 + Math.random() * 0.3,
    hue: Math.random() * 60 + 100,
    pulsePhase: Math.random() * Math.PI * 2,
  };
}

export function updateTitleScreen(state: TitleScreenState, width: number, height: number): void {
  state.phase += 0.02;

  const revealSpeed = 0.03;
  for (let i = 0; i < state.letterReveals.length; i++) {
    const delay = i * 15;
    const progress = Math.max(0, state.phase - delay * 0.02);
    state.letterReveals[i] = Math.min(1, state.letterReveals[i] + revealSpeed * Math.min(1, progress));
  }

  const allRevealed = state.letterReveals.every(r => r >= 0.99);
  if (allRevealed) {
    state.titleGlow = Math.min(1, state.titleGlow + 0.02);
    state.subtitleAlpha = Math.min(1, state.subtitleAlpha + 0.015);
  }

  for (let i = state.driftParticles.length - 1; i >= 0; i--) {
    const p = state.driftParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.pulsePhase += 0.04;
    p.alpha = (0.1 + Math.sin(p.pulsePhase) * 0.15) * Math.min(1, state.phase);

    if (p.y < -10 || p.x < -10 || p.x > width + 10) {
      state.driftParticles[i] = spawnDriftParticle(width, height);
      state.driftParticles[i].y = height + 5;
    }
  }

  if (state.pulseRings.length < MAX_PULSE_RINGS && Math.random() < 0.02 && state.titleGlow > 0.3) {
    state.pulseRings.push({
      x: width / 2,
      y: height * 0.3,
      radius: 10,
      alpha: 0.4,
      speed: 1.5 + Math.random(),
    });
  }

  for (let i = state.pulseRings.length - 1; i >= 0; i--) {
    const ring = state.pulseRings[i];
    ring.radius += ring.speed;
    ring.alpha *= 0.97;
    if (ring.alpha < 0.01) {
      state.pulseRings.splice(i, 1);
    }
  }

  state.snakePhase += 0.03;
  const cx = width / 2;
  const cy = height * 0.65;
  for (let i = 0; i < state.snakePreview.length; i++) {
    const angle = state.snakePhase + (i / state.snakePreview.length) * Math.PI * 2;
    const r = 30 + i * 1.5;
    const seg = state.snakePreview[i];
    seg.targetX = cx + Math.cos(angle) * r;
    seg.targetY = cy + Math.sin(angle) * r * 0.4;
    seg.x += (seg.targetX - seg.x) * 0.1;
    seg.y += (seg.targetY - seg.y) * 0.1;
  }
}

export function drawTitleScreen(
  state: TitleScreenState,
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  frameCount: number,
  drawLetter: (g: Phaser.GameObjects.Graphics, char: string, x: number, y: number, size: number) => void
): void {
  if (!state.ready) return;

  for (const p of state.driftParticles) {
    g.fillStyle(THEME.snake.glow, p.alpha);
    g.fillCircle(p.x, p.y, p.size);
  }

  drawPreviewSnake(state, g, frameCount);

  for (const ring of state.pulseRings) {
    g.lineStyle(2, THEME.snake.glow, ring.alpha);
    g.strokeCircle(ring.x, ring.y, ring.radius);
  }

  drawTitleText(state, g, width, height, frameCount, drawLetter);
  drawSubtitle(state, g, width, height, frameCount, drawLetter);
}

function drawPreviewSnake(
  state: TitleScreenState,
  g: Phaser.GameObjects.Graphics,
  frameCount: number
): void {
  const len = state.snakePreview.length;
  const fadeIn = Math.min(1, state.phase * 0.5);

  for (let i = len - 1; i >= 0; i--) {
    const seg = state.snakePreview[i];
    const t = i / (len - 1);
    const size = 6 + (1 - t) * 6;
    const alpha = (0.4 + (1 - t) * 0.5) * fadeIn;

    const shimmer = Math.sin(frameCount * 0.05 + i * 0.3) * 0.15;

    g.fillStyle(0x000000, alpha * 0.3);
    g.fillCircle(seg.x + 2, seg.y + 2, size);

    g.fillStyle(THEME.snake.glow, (alpha * 0.2 + shimmer * 0.1) * fadeIn);
    g.fillCircle(seg.x, seg.y, size + 4);

    const color = i === 0 ? THEME.snake.head : THEME.snake.body;
    g.fillStyle(color, alpha);
    g.fillCircle(seg.x, seg.y, size);

    g.fillStyle(THEME.snake.highlight, alpha * 0.4);
    g.fillCircle(seg.x - size * 0.2, seg.y - size * 0.2, size * 0.35);
  }

  const head = state.snakePreview[0];
  if (head && fadeIn > 0.5) {
    const eyeAlpha = fadeIn;
    const eyeSize = 2;
    const next = state.snakePreview[1];
    const dx = next ? head.x - next.x : 1;
    const dy = next ? head.y - next.y : 0;
    const len2 = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = dx / len2;
    const ny = dy / len2;
    const px = -ny;
    const py = nx;

    g.fillStyle(THEME.snake.eye, eyeAlpha);
    g.fillCircle(head.x + nx * 3 + px * 3, head.y + ny * 3 + py * 3, eyeSize);
    g.fillCircle(head.x + nx * 3 - px * 3, head.y + ny * 3 - py * 3, eyeSize);
    g.fillStyle(0x111111, eyeAlpha);
    g.fillCircle(head.x + nx * 4 + px * 3, head.y + ny * 4 + py * 3, eyeSize * 0.5);
    g.fillCircle(head.x + nx * 4 - px * 3, head.y + ny * 4 - py * 3, eyeSize * 0.5);
  }
}

function drawTitleText(
  state: TitleScreenState,
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  frameCount: number,
  drawLetter: (g: Phaser.GameObjects.Graphics, char: string, x: number, y: number, size: number) => void
): void {
  const titleSize = 32;
  const charWidth = titleSize * 0.7;
  const totalWidth = TITLE_TEXT.length * charWidth;
  const startX = (width - totalWidth) / 2;
  const titleY = height * 0.25;

  for (let i = 0; i < TITLE_TEXT.length; i++) {
    const reveal = state.letterReveals[i];
    if (reveal <= 0) continue;

    const char = TITLE_TEXT[i];
    const cx = startX + i * charWidth;
    const bounce = reveal < 1 ? Math.sin(reveal * Math.PI) * 8 : 0;
    const wobble = Math.sin(frameCount * 0.03 + i * 0.5) * 1.5 * state.titleGlow;

    if (state.titleGlow > 0) {
      const glowPulse = 0.3 + Math.sin(frameCount * 0.04 + i) * 0.15;
      g.fillStyle(THEME.snake.glow, glowPulse * state.titleGlow * reveal);
      g.fillCircle(cx + charWidth / 2, titleY - bounce + wobble + titleSize / 2, titleSize * 0.8);
    }

    const alpha = reveal;
    g.fillStyle(THEME.snake.head, alpha);
    drawLetter(g, char, cx, titleY - bounce + wobble, titleSize);

    g.fillStyle(THEME.snake.highlight, alpha * 0.4);
    drawLetter(g, char, cx, titleY - bounce + wobble - 1, titleSize);
  }
}

function drawSubtitle(
  state: TitleScreenState,
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  frameCount: number,
  drawLetter: (g: Phaser.GameObjects.Graphics, char: string, x: number, y: number, size: number) => void
): void {
  if (state.subtitleAlpha <= 0) return;

  const blink = Math.sin(frameCount * 0.06) > 0 ? 1 : 0.3;
  const text = 'PRESS ANY KEY';
  const size = 10;
  const charWidth = size * 0.7;
  const totalWidth = text.length * charWidth;
  const startX = (width - totalWidth) / 2;
  const y = height * 0.85;
  const alpha = state.subtitleAlpha * blink;

  g.fillStyle(THEME.food.body, alpha);
  for (let i = 0; i < text.length; i++) {
    drawLetter(g, text[i], startX + i * charWidth, y, size);
  }
}
