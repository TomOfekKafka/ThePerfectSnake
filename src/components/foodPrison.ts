import Phaser from 'phaser';

const BAR_COLOR = 0x888899;
const BAR_DARK = 0x555566;
const BAR_HIGHLIGHT = 0xaabbcc;
const RIVET_COLOR = 0x999aab;
const CHAIN_COLOR = 0x777788;
const LOCK_COLOR = 0xccaa44;
const LOCK_DARK = 0x886622;

export interface FoodPrisonState {
  clankTimer: number;
  clankIntensity: number;
  rattlePhase: number;
  lockSwing: number;
}

export function createFoodPrisonState(): FoodPrisonState {
  return {
    clankTimer: 0,
    clankIntensity: 0,
    rattlePhase: 0,
    lockSwing: 0,
  };
}

export function updateFoodPrison(state: FoodPrisonState): void {
  state.clankTimer++;
  state.rattlePhase += 0.05;

  if (state.clankTimer % 90 === 0) {
    state.clankIntensity = 1.0;
  }
  if (state.clankIntensity > 0) {
    state.clankIntensity *= 0.92;
    if (state.clankIntensity < 0.01) state.clankIntensity = 0;
  }

  state.lockSwing = Math.sin(state.rattlePhase * 0.7) * 0.15;
}

function drawBar(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y1: number,
  y2: number,
  width: number,
  rattleOffset: number
): void {
  const bx = x + rattleOffset;

  g.fillStyle(BAR_DARK, 0.9);
  g.fillRect(bx - width / 2 + 1, y1, width, y2 - y1);

  g.fillStyle(BAR_COLOR, 0.95);
  g.fillRect(bx - width / 2, y1, width - 1, y2 - y1);

  g.fillStyle(BAR_HIGHLIGHT, 0.3);
  g.fillRect(bx - width / 2, y1, 1, y2 - y1);
}

function drawRivet(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  size: number
): void {
  g.fillStyle(BAR_DARK, 0.8);
  g.fillCircle(x + 0.5, y + 0.5, size);
  g.fillStyle(RIVET_COLOR, 0.9);
  g.fillCircle(x, y, size);
  g.fillStyle(BAR_HIGHLIGHT, 0.4);
  g.fillCircle(x - size * 0.3, y - size * 0.3, size * 0.4);
}

function drawHorizontalBeam(
  g: Phaser.GameObjects.Graphics,
  x1: number,
  x2: number,
  y: number,
  height: number
): void {
  g.fillStyle(BAR_DARK, 0.85);
  g.fillRect(x1, y + 1, x2 - x1, height);

  g.fillStyle(BAR_COLOR, 0.95);
  g.fillRect(x1, y, x2 - x1, height - 1);

  g.fillStyle(BAR_HIGHLIGHT, 0.25);
  g.fillRect(x1, y, x2 - x1, 1);
}

function drawChainLink(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  size: number,
  angle: number
): void {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const hw = size * 0.35;
  const hh = size * 0.6;

  g.lineStyle(1.2, CHAIN_COLOR, 0.8);
  g.strokeEllipse(x + sin * 0.5, y + cos * 0.5, hw * 2, hh * 2);
}

function drawPadlock(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  size: number,
  swing: number
): void {
  const sx = x + Math.sin(swing) * size * 0.5;

  g.lineStyle(1.5, LOCK_DARK, 0.9);
  const shackleW = size * 0.5;
  const shackleH = size * 0.5;
  g.beginPath();
  g.arc(sx, y - size * 0.3, shackleW, Math.PI, 0, false);
  g.strokePath();

  g.fillStyle(LOCK_DARK, 0.9);
  g.fillRect(sx - size * 0.45 + 1, y + 1, size * 0.9, size * 0.7);
  g.fillStyle(LOCK_COLOR, 0.95);
  g.fillRect(sx - size * 0.45, y, size * 0.9, size * 0.7);

  g.fillStyle(LOCK_HIGHLIGHT_COLOR(0.4), 0.4);
  g.fillRect(sx - size * 0.45, y, size * 0.9, 1);

  g.fillStyle(0x333322, 0.9);
  g.fillCircle(sx, y + size * 0.3, size * 0.12);
  g.fillRect(sx - size * 0.04, y + size * 0.3, size * 0.08, size * 0.2);
}

function LOCK_HIGHLIGHT_COLOR(_alpha: number): number {
  return 0xeedd88;
}

export function drawFoodPrison(
  g: Phaser.GameObjects.Graphics,
  state: FoodPrisonState,
  foodX: number,
  foodY: number,
  cellSize: number,
  frameCount: number
): void {
  const cageW = cellSize * 1.6;
  const cageH = cellSize * 1.8;
  const left = foodX - cageW / 2;
  const right = foodX + cageW / 2;
  const top = foodY - cageH / 2;
  const bottom = foodY + cageH / 2;

  const rattleAmt = state.clankIntensity * 2;
  const globalRattle = Math.sin(frameCount * 0.8) * rattleAmt;

  g.fillStyle(0x000000, 0.15);
  g.fillRect(left + 3, bottom + 1, cageW, 3);

  const barCount = 5;
  const barSpacing = cageW / (barCount + 1);
  const barWidth = 2.5;

  drawHorizontalBeam(g, left + globalRattle, right + globalRattle, top, 3);
  drawHorizontalBeam(g, left + globalRattle, right + globalRattle, bottom - 3, 3);

  for (let i = 1; i <= barCount; i++) {
    const bx = left + barSpacing * i;
    const barRattle = Math.sin(frameCount * 0.6 + i * 1.3) * rattleAmt;
    drawBar(g, bx + globalRattle, top, bottom, barWidth, barRattle);

    drawRivet(g, bx + globalRattle + barRattle, top + 1.5, 1.2);
    drawRivet(g, bx + globalRattle + barRattle, bottom - 1.5, 1.2);
  }

  const leftBarX = left + barSpacing + globalRattle;
  const rightBarX = left + barSpacing * barCount + globalRattle;
  const midBeamY = foodY;
  drawHorizontalBeam(g, leftBarX - barWidth, rightBarX + barWidth, midBeamY - 1.5, 2.5);

  const chainLinks = 3;
  const chainStartY = top - 2;
  for (let i = 0; i < chainLinks; i++) {
    const linkY = chainStartY - i * 4;
    const linkAngle = state.lockSwing + i * 0.3;
    drawChainLink(g, foodX + globalRattle, linkY, 3, linkAngle);
  }

  drawPadlock(
    g,
    foodX + globalRattle,
    bottom + 2,
    6,
    state.lockSwing
  );

  if (state.clankIntensity > 0.1) {
    const sparkAlpha = state.clankIntensity * 0.6;
    g.fillStyle(0xffffff, sparkAlpha);
    const sparkX = left + barSpacing * 3 + globalRattle;
    g.fillCircle(sparkX, midBeamY, 1.5 * state.clankIntensity);
    g.fillCircle(sparkX + 2, midBeamY - 2, 1.0 * state.clankIntensity);
  }
}
