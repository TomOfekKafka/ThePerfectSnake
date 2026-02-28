import Phaser from 'phaser';

export interface KeanuCharacter {
  name: string;
  code: string;
  quote: string;
  movie: string;
  suitColor: number;
  hairColor: number;
  accentColor: number;
  glowColor: number;
  accessory: 'sunglasses' | 'beard' | 'guitar' | 'pencil' | 'surfboard' | 'hoodie';
}

export type CountryFlag = KeanuCharacter;

const KEANUS: KeanuCharacter[] = [
  {
    name: 'NEO',
    code: 'NEO',
    quote: 'THERE IS NO SPOON',
    movie: 'THE MATRIX',
    suitColor: 0x111111,
    hairColor: 0x1a1a1a,
    accentColor: 0x00ff41,
    glowColor: 0x00ff41,
    accessory: 'sunglasses',
  },
  {
    name: 'JOHN WICK',
    code: 'WICK',
    quote: 'YEAH I AM THINKING I AM BACK',
    movie: 'JOHN WICK',
    suitColor: 0x1a1a2e,
    hairColor: 0x222222,
    accentColor: 0xff3333,
    glowColor: 0xff2244,
    accessory: 'pencil',
  },
  {
    name: 'TED',
    code: 'TED',
    quote: 'BE EXCELLENT TO EACH OTHER',
    movie: 'BILL AND TED',
    suitColor: 0x2255aa,
    hairColor: 0x3d2b1f,
    accentColor: 0xffdd44,
    glowColor: 0xffdd44,
    accessory: 'guitar',
  },
  {
    name: 'JOHNNY',
    code: 'JNNY',
    quote: 'I WANT ROOM SERVICE',
    movie: 'JOHNNY MNEMONIC',
    suitColor: 0x333344,
    hairColor: 0x1a1a1a,
    accentColor: 0x44ccff,
    glowColor: 0x44ccff,
    accessory: 'hoodie',
  },
  {
    name: 'KEANU',
    code: 'KEANU',
    quote: 'YOU ARE BREATHTAKING',
    movie: 'E3 2019',
    suitColor: 0x2a2a2a,
    hairColor: 0x222222,
    accentColor: 0xff88ff,
    glowColor: 0xff66cc,
    accessory: 'beard',
  },
  {
    name: 'BODHI',
    code: 'SURF',
    quote: 'FEAR CAUSES HESITATION',
    movie: 'POINT BREAK',
    suitColor: 0x1177aa,
    hairColor: 0x3d2b1f,
    accentColor: 0x00ddff,
    glowColor: 0x00ccee,
    accessory: 'surfboard',
  },
];

export const KEANU_COUNT = KEANUS.length;

export const FLAG_COUNT = KEANU_COUNT;

export function pickKeanu(foodEaten: number): KeanuCharacter {
  return KEANUS[foodEaten % KEANUS.length];
}

export const pickFlag = pickKeanu;

export function getKeanus(): readonly KeanuCharacter[] {
  return KEANUS;
}

export const getFlags = getKeanus;

export interface KeanuDisplayState {
  currentKeanu: KeanuCharacter;
  nextIndex: number;
  quotePopup: QuotePopup | null;
}

export type FlagDisplayState = KeanuDisplayState;

export interface QuotePopup {
  text: string;
  movie: string;
  color: number;
  age: number;
  x: number;
  y: number;
}

const QUOTE_POPUP_DURATION = 90;

export function createKeanuDisplayState(): KeanuDisplayState {
  return {
    currentKeanu: KEANUS[0],
    nextIndex: 1,
    quotePopup: null,
  };
}

export const createFlagDisplayState = createKeanuDisplayState;

export function advanceKeanu(state: KeanuDisplayState, x: number, y: number): void {
  state.quotePopup = {
    text: state.currentKeanu.quote,
    movie: state.currentKeanu.movie,
    color: state.currentKeanu.accentColor,
    age: 0,
    x,
    y,
  };
  state.currentKeanu = KEANUS[state.nextIndex % KEANUS.length];
  state.nextIndex++;
}

export function advanceFlag(state: FlagDisplayState): void {
  advanceKeanu(state, 0, 0);
}

export function updateQuotePopup(state: KeanuDisplayState): void {
  if (!state.quotePopup) return;
  state.quotePopup.age++;
  if (state.quotePopup.age > QUOTE_POPUP_DURATION) {
    state.quotePopup = null;
  }
}

export function drawQuotePopup(
  g: Phaser.GameObjects.Graphics,
  state: KeanuDisplayState,
  frameCount: number,
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
  const popup = state.quotePopup;
  if (!popup) return;

  const progress = popup.age / QUOTE_POPUP_DURATION;
  const fadeIn = Math.min(1, popup.age / 10);
  const fadeOut = Math.max(0, 1 - Math.pow(Math.max(0, progress - 0.7) / 0.3, 2));
  const alpha = fadeIn * fadeOut;
  if (alpha <= 0) return;

  const rise = popup.age * 0.8;
  const cx = popup.x;
  const cy = popup.y - 30 - rise;

  const scale = 0.8 + Math.sin(popup.age * 0.15) * 0.05;
  const textSize = Math.round(4 * scale);

  const quoteWidth = popup.text.length * textSize * 0.75;
  const movieWidth = popup.movie.length * 3 * 0.75;
  const boxWidth = Math.max(quoteWidth, movieWidth) + 16;
  const boxHeight = 22;
  const boxX = cx - boxWidth / 2;
  const boxY = cy - boxHeight / 2;

  g.fillStyle(0x000000, alpha * 0.8);
  g.fillRoundedRect(boxX, boxY, boxWidth, boxHeight, 4);
  g.lineStyle(1.5, popup.color, alpha * 0.7);
  g.strokeRoundedRect(boxX, boxY, boxWidth, boxHeight, 4);

  const glowPulse = 0.1 + Math.sin(frameCount * 0.12) * 0.05;
  g.fillStyle(popup.color, alpha * glowPulse);
  g.fillRoundedRect(boxX - 2, boxY - 2, boxWidth + 4, boxHeight + 4, 5);

  const quoteX = cx - quoteWidth / 2;
  drawText(g, popup.text, quoteX, cy - 4, textSize, popup.color, alpha);

  const movieX = cx - movieWidth / 2;
  drawText(g, popup.movie, movieX, cy + 5, 3, 0xaaaaaa, alpha * 0.7);
}

function drawKeanuHead(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  size: number,
  keanu: CountryFlag,
  frameCount: number
): void {
  const headR = size * 0.35;

  g.fillStyle(0xddb896, 1);
  g.fillCircle(cx, cy, headR);

  g.fillStyle(keanu.hairColor, 1);
  g.fillEllipse(cx, cy - headR * 0.55, headR * 2.2, headR * 1.2);
  g.fillRect(cx - headR * 1.05, cy - headR * 0.3, headR * 0.35, headR * 1.2);
  g.fillRect(cx + headR * 0.7, cy - headR * 0.3, headR * 0.35, headR * 1.2);

  if (keanu.accessory === 'sunglasses') {
    g.fillStyle(0x111111, 0.9);
    g.fillRoundedRect(cx - headR * 0.7, cy - headR * 0.15, headR * 0.55, headR * 0.3, 2);
    g.fillRoundedRect(cx + headR * 0.15, cy - headR * 0.15, headR * 0.55, headR * 0.3, 2);
    g.lineStyle(1, 0x333333, 0.8);
    g.beginPath();
    g.moveTo(cx - headR * 0.15, cy);
    g.lineTo(cx + headR * 0.15, cy);
    g.strokePath();
    const glint = Math.sin(frameCount * 0.12) * 0.3 + 0.3;
    g.fillStyle(keanu.accentColor, glint);
    g.fillCircle(cx - headR * 0.4, cy - headR * 0.05, 1.5);
    g.fillCircle(cx + headR * 0.4, cy - headR * 0.05, 1.5);
  } else {
    g.fillStyle(0x222222, 1);
    g.fillCircle(cx - headR * 0.3, cy, 1.5);
    g.fillCircle(cx + headR * 0.3, cy, 1.5);
  }

  if (keanu.accessory === 'beard') {
    g.fillStyle(keanu.hairColor, 0.7);
    g.fillEllipse(cx, cy + headR * 0.6, headR * 1.2, headR * 0.7);
    g.fillStyle(0xddb896, 1);
    g.fillEllipse(cx, cy + headR * 0.15, headR * 1.0, headR * 0.3);
  }

  const smileCurve = Math.sin(frameCount * 0.05) * 0.5 + 0.5;
  g.lineStyle(1, 0x995533, 0.6);
  g.beginPath();
  g.arc(cx, cy + headR * 0.25, headR * 0.25, 0.1, Math.PI - 0.1, false, smileCurve * 0.1);
  g.strokePath();
}

function drawKeanuBody(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  size: number,
  keanu: CountryFlag,
  frameCount: number
): void {
  const bodyW = size * 0.55;
  const bodyH = size * 0.5;
  const bodyTop = cy + size * 0.15;

  g.fillStyle(keanu.suitColor, 1);
  g.fillRoundedRect(cx - bodyW / 2, bodyTop, bodyW, bodyH, 3);

  const lapelAlpha = 0.3 + Math.sin(frameCount * 0.08) * 0.1;
  g.lineStyle(1, keanu.accentColor, lapelAlpha);
  g.beginPath();
  g.moveTo(cx, bodyTop + 2);
  g.lineTo(cx - bodyW * 0.25, bodyTop + bodyH * 0.5);
  g.moveTo(cx, bodyTop + 2);
  g.lineTo(cx + bodyW * 0.25, bodyTop + bodyH * 0.5);
  g.strokePath();
}

function drawAccessory(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  size: number,
  keanu: CountryFlag,
  frameCount: number
): void {
  const swing = Math.sin(frameCount * 0.06) * 0.15;

  switch (keanu.accessory) {
    case 'pencil': {
      const px = cx + size * 0.45;
      const py = cy - size * 0.1;
      const angle = -0.3 + swing;
      const cosA = Math.cos(angle);
      const sinA = Math.sin(angle);
      const len = size * 0.5;
      const tipX = px + cosA * len;
      const tipY = py + sinA * len;
      g.lineStyle(2, 0xeecc44, 1);
      g.beginPath();
      g.moveTo(px, py);
      g.lineTo(tipX, tipY);
      g.strokePath();
      g.fillStyle(0x333333, 1);
      g.fillCircle(tipX, tipY, 1.5);
      break;
    }
    case 'guitar': {
      const gx = cx - size * 0.5;
      const gy = cy + size * 0.1;
      const tilt = swing * 2;
      g.lineStyle(2, 0x8b4513, 1);
      g.beginPath();
      g.moveTo(gx - size * 0.15, gy - size * 0.35 + tilt * 8);
      g.lineTo(gx + size * 0.05, gy + size * 0.15 + tilt * 3);
      g.strokePath();
      g.fillStyle(0xcd853f, 1);
      g.fillEllipse(gx + size * 0.05, gy + size * 0.2, size * 0.2, size * 0.15);
      g.fillStyle(0x222222, 0.5);
      g.fillCircle(gx + size * 0.05, gy + size * 0.2, size * 0.04);
      break;
    }
    case 'surfboard': {
      const sx = cx + size * 0.4;
      const sy = cy - size * 0.2;
      g.fillStyle(0x44bbdd, 0.8);
      g.fillEllipse(sx, sy, size * 0.1, size * 0.5);
      g.lineStyle(1, 0xffffff, 0.5);
      g.beginPath();
      g.moveTo(sx, sy - size * 0.2);
      g.lineTo(sx, sy + size * 0.2);
      g.strokePath();
      break;
    }
    case 'hoodie': {
      g.fillStyle(0x444455, 0.4);
      g.fillEllipse(cx, cy - size * 0.35, size * 0.55, size * 0.25);
      break;
    }
    default:
      break;
  }
}

function drawMatrixRain(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  size: number,
  color: number,
  frameCount: number
): void {
  const count = 6;
  for (let i = 0; i < count; i++) {
    const xOff = (i - count / 2) * (size * 0.3);
    const yBase = ((frameCount * 2 + i * 37) % (size * 2.5)) - size * 1.2;
    const alpha = 0.15 + Math.sin(frameCount * 0.1 + i) * 0.1;
    g.fillStyle(color, alpha);
    g.fillRect(cx + xOff, cy + yBase, 2, 4);
    g.fillStyle(color, alpha * 0.5);
    g.fillRect(cx + xOff, cy + yBase + 6, 2, 3);
  }
}

export function drawFlagFood(
  g: Phaser.GameObjects.Graphics,
  flag: CountryFlag,
  foodX: number,
  foodY: number,
  cellSize: number,
  frameCount: number
): void {
  const hover = Math.sin(frameCount * 0.08) * 3;
  const floatY = foodY + hover;
  const size = cellSize * 1.4;
  const pulse = 1.0 + Math.sin(frameCount * 0.1) * 0.05;

  const shadowScale = 1.0 - hover / 20;
  const shadowAlpha = 0.3 * Math.max(0.3, shadowScale);
  g.fillStyle(0x000000, shadowAlpha);
  g.fillEllipse(foodX + 2, foodY + 6, size * 0.7 * shadowScale, size * 0.15 * shadowScale);

  const glowPulse = 0.1 + Math.sin(frameCount * 0.08) * 0.06;
  g.fillStyle(flag.glowColor, glowPulse);
  g.fillCircle(foodX, floatY, size * pulse * 0.8);
  g.fillStyle(flag.glowColor, glowPulse * 0.4);
  g.fillCircle(foodX, floatY, size * pulse * 1.1);

  drawMatrixRain(g, foodX, floatY, size, flag.accentColor, frameCount);

  drawKeanuBody(g, foodX, floatY, size, flag, frameCount);
  drawKeanuHead(g, foodX, floatY - size * 0.2, size, flag, frameCount);
  drawAccessory(g, foodX, floatY, size, flag, frameCount);

  const ringAlpha = 0.15 + Math.sin(frameCount * 0.12) * 0.08;
  g.lineStyle(1, flag.accentColor, ringAlpha);
  const ringRadius = size * 0.7 + Math.sin(frameCount * 0.06) * 3;
  g.strokeCircle(foodX, floatY, ringRadius);

  const specAlpha = 0.2 + Math.sin(frameCount * 0.15) * 0.1;
  g.fillStyle(0xffffff, specAlpha);
  g.fillCircle(foodX - size * 0.2, floatY - size * 0.35, 1.5);
}

export function drawKeanuLabel(
  g: Phaser.GameObjects.Graphics,
  keanu: KeanuCharacter,
  foodX: number,
  foodY: number,
  cellSize: number,
  frameCount: number,
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
  const hover = Math.sin(frameCount * 0.08) * 3;
  const floatY = foodY + hover;
  const labelY = floatY - cellSize * 1.2;

  const nameCharW = 5 * 0.7;
  const nameWidth = keanu.name.length * nameCharW;
  const nameX = foodX - nameWidth / 2;

  const bgAlpha = 0.7 + Math.sin(frameCount * 0.06) * 0.1;
  const nameBgW = nameWidth + 12;
  g.fillStyle(0x000000, bgAlpha * 0.8);
  g.fillRoundedRect(foodX - nameBgW / 2, labelY - 6, nameBgW, 20, 4);
  g.lineStyle(1.5, keanu.accentColor, bgAlpha * 0.6);
  g.strokeRoundedRect(foodX - nameBgW / 2, labelY - 6, nameBgW, 20, 4);

  const glowPulse = 0.08 + Math.sin(frameCount * 0.1) * 0.04;
  g.fillStyle(keanu.accentColor, glowPulse);
  g.fillRoundedRect(foodX - nameBgW / 2 - 2, labelY - 8, nameBgW + 4, 24, 5);

  drawText(g, keanu.name, nameX, labelY, 5, keanu.accentColor, bgAlpha);

  const movieCharW = 3 * 0.7;
  const movieWidth = keanu.movie.length * movieCharW;
  const movieX = foodX - movieWidth / 2;
  drawText(g, keanu.movie, movieX, labelY + 8, 3, 0x888888, bgAlpha * 0.6);
}

export const drawCountryLabel = drawKeanuLabel;
