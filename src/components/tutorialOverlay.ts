import Phaser from 'phaser';
import { THEME } from './gameTheme';

export interface TutorialOverlayState {
  phase: number;
  alpha: number;
  active: boolean;
  arrowIndex: number;
  arrowTimer: number;
  tipIndex: number;
  tipTimer: number;
  tipFade: number;
  iconPulses: number[];
  snakeDemo: DemoSegment[];
  snakeDemoPhase: number;
  dismissing: boolean;
}

interface DemoSegment {
  x: number;
  y: number;
}

const TIPS = [
  'EAT FOOD TO GROW',
  'AVOID WALLS AND YOURSELF',
  'COLLECT POWER UPS',
  'SHIELDS SAVE YOUR LIFE',
  'WATCH FOR OBSTACLES',
  'FOOD RUNS AWAY FROM YOU',
];

const ARROW_LABELS = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
const ARROW_CYCLE_SPEED = 40;
const TIP_CYCLE_SPEED = 120;
const DEMO_SNAKE_LEN = 8;

export function createTutorialOverlay(): TutorialOverlayState {
  const segments: DemoSegment[] = [];
  for (let i = 0; i < DEMO_SNAKE_LEN; i++) {
    segments.push({ x: 200 - i * 12, y: 190 });
  }
  return {
    phase: 0,
    alpha: 0,
    active: true,
    arrowIndex: 0,
    arrowTimer: 0,
    tipIndex: 0,
    tipTimer: 0,
    tipFade: 1,
    iconPulses: [0, 0, 0, 0],
    snakeDemo: segments,
    snakeDemoPhase: 0,
    dismissing: false,
  };
}

export function updateTutorialOverlay(state: TutorialOverlayState): void {
  if (!state.active) return;

  state.phase += 1;

  if (state.dismissing) {
    state.alpha = Math.max(0, state.alpha - 0.04);
    if (state.alpha <= 0) {
      state.active = false;
    }
    return;
  }

  state.alpha = Math.min(1, state.alpha + 0.03);

  state.arrowTimer++;
  if (state.arrowTimer >= ARROW_CYCLE_SPEED) {
    state.arrowTimer = 0;
    state.iconPulses[state.arrowIndex] = 1;
    state.arrowIndex = (state.arrowIndex + 1) % 4;
  }

  for (let i = 0; i < 4; i++) {
    state.iconPulses[i] = Math.max(0, state.iconPulses[i] - 0.03);
  }

  state.tipTimer++;
  if (state.tipTimer >= TIP_CYCLE_SPEED) {
    state.tipTimer = 0;
    state.tipIndex = (state.tipIndex + 1) % TIPS.length;
    state.tipFade = 0;
  }
  state.tipFade = Math.min(1, state.tipFade + 0.04);

  updateDemoSnake(state);
}

function updateDemoSnake(state: TutorialOverlayState): void {
  state.snakeDemoPhase += 0.04;
  const cx = 200;
  const cy = 195;
  const radius = 35;

  const headAngle = state.snakeDemoPhase;
  const head = state.snakeDemo[0];
  head.x = cx + Math.cos(headAngle) * radius;
  head.y = cy + Math.sin(headAngle) * radius * 0.6;

  for (let i = 1; i < state.snakeDemo.length; i++) {
    const prev = state.snakeDemo[i - 1];
    const seg = state.snakeDemo[i];
    const dx = prev.x - seg.x;
    const dy = prev.y - seg.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 10) {
      const t = 10 / dist;
      seg.x = prev.x - dx * t;
      seg.y = prev.y - dy * t;
    }
  }
}

export function dismissTutorial(state: TutorialOverlayState): void {
  if (state.active && !state.dismissing) {
    state.dismissing = true;
  }
}

export function drawTutorialOverlay(
  state: TutorialOverlayState,
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  frameCount: number,
  drawLetter: (g: Phaser.GameObjects.Graphics, char: string, x: number, y: number, size: number) => void
): void {
  if (!state.active || state.alpha <= 0) return;

  const a = state.alpha;

  drawOverlayBackground(g, width, height, a);
  drawTitle(g, width, frameCount, a, drawLetter);
  drawDemoSnake(g, state, frameCount, a);
  drawArrowKeys(g, width, height, state, frameCount, a);
  drawTip(g, width, height, state, a, drawLetter);
  drawPrompt(g, width, height, frameCount, a, drawLetter);
}

function drawOverlayBackground(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  alpha: number
): void {
  g.fillStyle(0x050510, 0.85 * alpha);
  g.fillRect(0, 0, width, height);

  g.lineStyle(2, THEME.snake.glow, 0.3 * alpha);
  const margin = 15;
  g.strokeRoundedRect(margin, margin, width - margin * 2, height - margin * 2, 10);

  g.lineStyle(1, THEME.effects.ripple, 0.15 * alpha);
  g.strokeRoundedRect(margin + 3, margin + 3, width - margin * 2 - 6, height - margin * 2 - 6, 8);
}

function drawTitle(
  g: Phaser.GameObjects.Graphics,
  width: number,
  frameCount: number,
  alpha: number,
  drawLetter: (g: Phaser.GameObjects.Graphics, char: string, x: number, y: number, size: number) => void
): void {
  const title = 'HOW TO PLAY';
  const size = 16;
  const charW = size * 0.7;
  const totalW = title.length * charW;
  const startX = (width - totalW) / 2;
  const y = 50;

  const glowPulse = 0.3 + Math.sin(frameCount * 0.04) * 0.15;
  g.fillStyle(THEME.snake.glow, glowPulse * alpha);
  g.fillRoundedRect(startX - 10, y - size / 2 - 6, totalW + 20, size + 12, 6);

  g.fillStyle(THEME.hud.text, alpha);
  for (let i = 0; i < title.length; i++) {
    drawLetter(g, title[i], startX + i * charW, y, size);
  }

  g.fillStyle(THEME.snake.highlight, 0.3 * alpha);
  for (let i = 0; i < title.length; i++) {
    drawLetter(g, title[i], startX + i * charW, y - 1, size);
  }
}

function drawDemoSnake(
  g: Phaser.GameObjects.Graphics,
  state: TutorialOverlayState,
  frameCount: number,
  alpha: number
): void {
  const len = state.snakeDemo.length;

  for (let i = len - 1; i >= 0; i--) {
    const seg = state.snakeDemo[i];
    const t = i / (len - 1);
    const size = 5 + (1 - t) * 4;
    const segAlpha = (0.5 + (1 - t) * 0.5) * alpha;

    const shimmer = Math.sin(frameCount * 0.06 + i * 0.4) * 0.1;

    g.fillStyle(THEME.snake.glow, (0.15 + shimmer * 0.1) * alpha);
    g.fillCircle(seg.x, seg.y, size + 3);

    const color = i === 0 ? THEME.snake.head : THEME.snake.body;
    g.fillStyle(color, segAlpha);
    g.fillCircle(seg.x, seg.y, size);

    g.fillStyle(THEME.snake.highlight, segAlpha * 0.3);
    g.fillCircle(seg.x - size * 0.2, seg.y - size * 0.2, size * 0.3);
  }

  const head = state.snakeDemo[0];
  const next = state.snakeDemo[1];
  if (head && next) {
    const dx = head.x - next.x;
    const dy = head.y - next.y;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    const nx = dx / d;
    const ny = dy / d;
    const px = -ny;
    const py = nx;

    g.fillStyle(THEME.snake.eye, alpha);
    g.fillCircle(head.x + nx * 3 + px * 2.5, head.y + ny * 3 + py * 2.5, 1.5);
    g.fillCircle(head.x + nx * 3 - px * 2.5, head.y + ny * 3 - py * 2.5, 1.5);
    g.fillStyle(0x111111, alpha);
    g.fillCircle(head.x + nx * 3.5 + px * 2.5, head.y + ny * 3.5 + py * 2.5, 0.7);
    g.fillCircle(head.x + nx * 3.5 - px * 2.5, head.y + ny * 3.5 - py * 2.5, 0.7);
  }

  drawDemoFood(g, state, frameCount, alpha);
}

function drawDemoFood(
  g: Phaser.GameObjects.Graphics,
  state: TutorialOverlayState,
  frameCount: number,
  alpha: number
): void {
  const cx = 200;
  const cy = 195;
  const foodAngle = state.snakeDemoPhase + Math.PI;
  const foodX = cx + Math.cos(foodAngle) * 55;
  const foodY = cy + Math.sin(foodAngle) * 35;
  const pulse = 4 + Math.sin(frameCount * 0.08) * 1;

  g.fillStyle(THEME.food.glow, 0.2 * alpha);
  g.fillCircle(foodX, foodY, pulse + 4);
  g.fillStyle(THEME.food.body, 0.9 * alpha);
  g.fillCircle(foodX, foodY, pulse);
  g.fillStyle(THEME.food.core, 0.7 * alpha);
  g.fillCircle(foodX - 1, foodY - 1, pulse * 0.5);
}

function drawArrowKeys(
  g: Phaser.GameObjects.Graphics,
  width: number,
  _height: number,
  state: TutorialOverlayState,
  frameCount: number,
  alpha: number
): void {
  const cx = width / 2;
  const baseY = 272;
  const keySize = 22;
  const gap = 4;

  const positions = [
    { x: cx, y: baseY - keySize - gap, label: 'U', arrow: [0, -1] },
    { x: cx, y: baseY + gap, label: 'D', arrow: [0, 1] },
    { x: cx - keySize - gap, y: baseY + gap, label: 'L', arrow: [-1, 0] },
    { x: cx + keySize + gap, y: baseY + gap, label: 'R', arrow: [1, 0] },
  ];

  for (let i = 0; i < positions.length; i++) {
    const pos = positions[i];
    const pulse = state.iconPulses[i];
    const isActive = state.arrowIndex === i;
    const highlight = isActive ? 0.6 + Math.sin(frameCount * 0.1) * 0.2 : 0.15;

    const kx = pos.x - keySize / 2;
    const ky = pos.y - keySize / 2;

    if (pulse > 0) {
      g.fillStyle(THEME.snake.glow, pulse * 0.3 * alpha);
      g.fillRoundedRect(kx - 3, ky - 3, keySize + 6, keySize + 6, 6);
    }

    g.fillStyle(isActive ? 0x1a1a3a : 0x0e0e1e, (0.8 + highlight * 0.2) * alpha);
    g.fillRoundedRect(kx, ky, keySize, keySize, 4);

    const borderColor = isActive ? THEME.snake.glow : THEME.wall.glow;
    g.lineStyle(1.5, borderColor, highlight * alpha);
    g.strokeRoundedRect(kx, ky, keySize, keySize, 4);

    drawArrowGlyph(g, pos.x, pos.y, pos.arrow[0], pos.arrow[1], 6, isActive ? THEME.hud.text : THEME.hud.textDim, alpha * (0.5 + highlight));
  }

  drawArrowLabel(g, cx, baseY + keySize + gap + 18, 'ARROW KEYS', alpha, THEME.hud.textDim);
}

function drawArrowGlyph(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  dx: number,
  dy: number,
  size: number,
  color: number,
  alpha: number
): void {
  g.fillStyle(color, alpha);

  const tipX = cx + dx * size;
  const tipY = cy + dy * size;
  const baseX = cx - dx * size * 0.3;
  const baseY = cy - dy * size * 0.3;

  const px = -dy;
  const py = dx;

  g.fillTriangle(
    tipX, tipY,
    baseX + px * size * 0.5, baseY + py * size * 0.5,
    baseX - px * size * 0.5, baseY - py * size * 0.5
  );
}

function drawArrowLabel(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  y: number,
  text: string,
  alpha: number,
  color: number
): void {
  const charW = 5;
  const totalW = text.length * charW;
  const startX = cx - totalW / 2;

  g.fillStyle(color, 0.6 * alpha);
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const x = startX + i * charW;
    drawMicroChar(g, ch, x, y, 4);
  }
}

function drawMicroChar(
  g: Phaser.GameObjects.Graphics,
  ch: string,
  x: number,
  y: number,
  s: number
): void {
  const t = s * 0.3;
  const w = s * 0.6;
  const h = s;
  switch (ch) {
    case 'A':
      g.fillRect(x, y - h / 2, w, t);
      g.fillRect(x, y - h / 2, t, h);
      g.fillRect(x + w - t, y - h / 2, t, h);
      g.fillRect(x, y, w, t);
      break;
    case 'R':
      g.fillRect(x, y - h / 2, w, t);
      g.fillRect(x, y - h / 2, t, h);
      g.fillRect(x + w - t, y - h / 2, t, h / 2);
      g.fillRect(x, y, w, t);
      break;
    case 'O':
      g.fillRect(x, y - h / 2, w, t);
      g.fillRect(x, y - h / 2, t, h);
      g.fillRect(x + w - t, y - h / 2, t, h);
      g.fillRect(x, y + h / 2 - t, w, t);
      break;
    case 'W':
      g.fillRect(x, y - h / 2, t, h);
      g.fillRect(x + w - t, y - h / 2, t, h);
      g.fillRect(x + w / 2 - t / 2, y, t, h / 2);
      g.fillRect(x, y + h / 2 - t, w, t);
      break;
    case 'K':
      g.fillRect(x, y - h / 2, t, h);
      g.fillRect(x + w - t, y - h / 2, t, h / 2);
      g.fillRect(x, y, w, t);
      g.fillRect(x + w - t, y, t, h / 2);
      break;
    case 'E':
      g.fillRect(x, y - h / 2, w, t);
      g.fillRect(x, y - h / 2, t, h);
      g.fillRect(x, y, w * 0.7, t);
      g.fillRect(x, y + h / 2 - t, w, t);
      break;
    case 'Y':
      g.fillRect(x, y - h / 2, t, h / 2);
      g.fillRect(x + w - t, y - h / 2, t, h / 2);
      g.fillRect(x + w / 2 - t / 2, y, t, h / 2);
      break;
    case 'S':
      g.fillRect(x, y - h / 2, w, t);
      g.fillRect(x, y - h / 2, t, h / 2);
      g.fillRect(x, y, w, t);
      g.fillRect(x + w - t, y, t, h / 2);
      g.fillRect(x, y + h / 2 - t, w, t);
      break;
    case ' ':
      break;
    default:
      g.fillRect(x, y, w, t);
      break;
  }
}

function drawTip(
  g: Phaser.GameObjects.Graphics,
  width: number,
  _height: number,
  state: TutorialOverlayState,
  alpha: number,
  drawLetter: (g: Phaser.GameObjects.Graphics, char: string, x: number, y: number, size: number) => void
): void {
  const tip = TIPS[state.tipIndex];
  const size = 8;
  const charW = size * 0.7;
  const totalW = tip.length * charW;
  const startX = (width - totalW) / 2;
  const y = 335;
  const tipAlpha = state.tipFade * alpha;

  const dotY = y + size + 10;
  for (let i = 0; i < TIPS.length; i++) {
    const dotX = width / 2 + (i - (TIPS.length - 1) / 2) * 10;
    const isCurrent = i === state.tipIndex;
    g.fillStyle(isCurrent ? THEME.food.body : THEME.hud.textDim, (isCurrent ? 0.9 : 0.3) * alpha);
    g.fillCircle(dotX, dotY, isCurrent ? 2.5 : 1.5);
  }

  g.fillStyle(THEME.food.body, tipAlpha * 0.8);
  for (let i = 0; i < tip.length; i++) {
    drawLetter(g, tip[i], startX + i * charW, y, size);
  }
}

function drawPrompt(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  frameCount: number,
  alpha: number,
  drawLetter: (g: Phaser.GameObjects.Graphics, char: string, x: number, y: number, size: number) => void
): void {
  const blink = Math.sin(frameCount * 0.06) > 0 ? 1 : 0.3;
  const text = 'PRESS ANY KEY';
  const size = 9;
  const charW = size * 0.7;
  const totalW = text.length * charW;
  const startX = (width - totalW) / 2;
  const y = height - 30;

  g.fillStyle(THEME.food.core, alpha * blink * 0.9);
  for (let i = 0; i < text.length; i++) {
    drawLetter(g, text[i], startX + i * charW, y, size);
  }
}
