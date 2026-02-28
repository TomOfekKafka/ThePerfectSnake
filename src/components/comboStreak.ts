import Phaser from 'phaser';

interface ComboRing {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  age: number;
  maxAge: number;
  color: number;
}

interface ComboText {
  text: string;
  x: number;
  y: number;
  startY: number;
  age: number;
  maxAge: number;
  scale: number;
  color: number;
}

export interface ComboStreakState {
  combo: number;
  lastEatFrame: number;
  comboWindow: number;
  rings: ComboRing[];
  texts: ComboText[];
  flashIntensity: number;
  shakeAmount: number;
}

const COMBO_WINDOW = 300;
const RING_LIFETIME = 40;
const TEXT_LIFETIME = 90;
const MAX_RINGS = 6;
const MAX_TEXTS = 3;

const COMBO_COLORS: number[] = [
  0x44ff88,
  0x44ddff,
  0xffaa44,
  0xff44aa,
  0xaa44ff,
  0xff4444,
];

function comboColor(combo: number): number {
  const idx = Math.min(combo - 1, COMBO_COLORS.length - 1);
  return COMBO_COLORS[Math.max(0, idx)];
}

export function createComboStreakState(): ComboStreakState {
  return {
    combo: 0,
    lastEatFrame: -COMBO_WINDOW,
    comboWindow: COMBO_WINDOW,
    rings: [],
    texts: [],
    flashIntensity: 0,
    shakeAmount: 0,
  };
}

export function triggerCombo(
  state: ComboStreakState,
  x: number,
  y: number,
  frame: number
): void {
  const elapsed = frame - state.lastEatFrame;
  if (elapsed <= state.comboWindow) {
    state.combo++;
  } else {
    state.combo = 1;
  }
  state.lastEatFrame = frame;

  if (state.combo < 2) return;

  const color = comboColor(state.combo);

  state.flashIntensity = Math.min(0.3 + state.combo * 0.05, 0.6);
  state.shakeAmount = 0;

  const ringCount = Math.min(state.combo, 4);
  for (let i = 0; i < ringCount; i++) {
    if (state.rings.length >= MAX_RINGS) state.rings.shift();
    state.rings.push({
      x,
      y,
      radius: 4 + i * 3,
      maxRadius: 30 + state.combo * 8 + i * 15,
      age: -i * 4,
      maxAge: RING_LIFETIME + i * 6,
      color,
    });
  }

  if (state.texts.length >= MAX_TEXTS) state.texts.shift();
  const label =
    state.combo >= 10
      ? `${state.combo}X UNSTOPPABLE`
      : state.combo >= 7
        ? `${state.combo}X RAMPAGE`
        : state.combo >= 5
          ? `${state.combo}X FRENZY`
          : state.combo >= 3
            ? `${state.combo}X COMBO`
            : `${state.combo}X`;

  state.texts.push({
    text: label,
    x,
    y,
    startY: y,
    age: 0,
    maxAge: TEXT_LIFETIME,
    scale: 1.0 + state.combo * 0.15,
    color,
  });
}

export function updateComboStreak(state: ComboStreakState): void {
  state.flashIntensity *= 0.92;
  state.shakeAmount *= 0.9;
  if (state.flashIntensity < 0.01) state.flashIntensity = 0;
  if (state.shakeAmount < 0.05) state.shakeAmount = 0;

  for (const ring of state.rings) {
    ring.age++;
    if (ring.age > 0) {
      const progress = ring.age / ring.maxAge;
      ring.radius = 4 + progress * ring.maxRadius;
    }
  }
  state.rings = state.rings.filter(r => r.age < r.maxAge);

  for (const t of state.texts) {
    t.age++;
    t.y = t.startY - t.age * 0.4;
  }
  state.texts = state.texts.filter(t => t.age < t.maxAge);
}

export function drawComboStreak(
  g: Phaser.GameObjects.Graphics,
  state: ComboStreakState,
  canvasWidth: number,
  canvasHeight: number,
  drawText: (
    g: Phaser.GameObjects.Graphics,
    text: string,
    x: number,
    y: number,
    size: number,
    color: number,
    alpha: number
  ) => void
): void {
  if (state.flashIntensity > 0.01) {
    const color = comboColor(state.combo);
    g.fillStyle(color, state.flashIntensity * 0.15);
    g.fillRect(0, 0, canvasWidth, canvasHeight);
  }

  for (const ring of state.rings) {
    if (ring.age <= 0) continue;
    const progress = ring.age / ring.maxAge;
    const alpha = (1 - progress) * 0.7;
    if (alpha <= 0) continue;
    g.lineStyle(2.5 - progress * 1.5, ring.color, alpha);
    g.strokeCircle(ring.x, ring.y, ring.radius);
  }

  for (const t of state.texts) {
    const fadeIn = Math.min(t.age / 8, 1);
    const fadeOut = t.age > t.maxAge * 0.7
      ? 1 - (t.age - t.maxAge * 0.7) / (t.maxAge * 0.3)
      : 1;
    const alpha = fadeIn * fadeOut;
    if (alpha <= 0) continue;

    const bounce = t.age < 12
      ? 1.0 + Math.sin(t.age * 0.5) * 0.2 * (1 - t.age / 12)
      : 1.0;
    const fontSize = Math.round(8 * t.scale * bounce);
    const charWidth = fontSize * 0.7;
    const textWidth = t.text.length * charWidth;
    const tx = t.x - textWidth / 2;

    drawText(g, t.text, tx + 1, t.y + 1, fontSize, 0x000000, alpha * 0.5);
    drawText(g, t.text, tx, t.y, fontSize, t.color, alpha);
  }

  if (state.combo >= 2) {
    const elapsed = state.rings.length > 0 || state.texts.length > 0 ? 1 : 0;
    if (elapsed > 0) {
      drawComboCounter(g, state, canvasWidth, drawText);
    }
  }
}

function drawComboCounter(
  g: Phaser.GameObjects.Graphics,
  state: ComboStreakState,
  canvasWidth: number,
  drawText: (
    g: Phaser.GameObjects.Graphics,
    text: string,
    x: number,
    y: number,
    size: number,
    color: number,
    alpha: number
  ) => void
): void {
  const color = comboColor(state.combo);
  const label = `STREAK ${state.combo}`;
  const fontSize = 7;
  const charWidth = fontSize * 0.7;
  const labelWidth = label.length * charWidth;
  const x = canvasWidth - labelWidth - 8;
  const y = 26;

  const pulse = 0.7 + Math.sin(Date.now() * 0.005) * 0.15;
  g.fillStyle(0x000000, 0.5 * pulse);
  g.fillRoundedRect(x - 4, y - 5, labelWidth + 8, 12, 3);
  g.lineStyle(1, color, 0.5 * pulse);
  g.strokeRoundedRect(x - 4, y - 5, labelWidth + 8, 12, 3);

  drawText(g, label, x, y, fontSize, color, pulse);
}

export function getCombo(state: ComboStreakState): number {
  return state.combo;
}

export function isComboActive(state: ComboStreakState, frame: number): boolean {
  return frame - state.lastEatFrame <= state.comboWindow && state.combo >= 2;
}
