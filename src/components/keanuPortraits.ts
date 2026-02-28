import Phaser from 'phaser';
import { KeanuCharacter, CountryFlag, getKeanus, getFlags } from './countryFlags';

const PORTRAIT_SIZE = 48;

type RGBA = [number, number, number, number];

function hexToRgb(hex: number): [number, number, number] {
  return [(hex >> 16) & 0xff, (hex >> 8) & 0xff, hex & 0xff];
}

function setPixel(data: Uint8ClampedArray, w: number, x: number, y: number, rgba: RGBA): void {
  if (x < 0 || x >= w || y < 0 || y >= PORTRAIT_SIZE) return;
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const i = (iy * w + ix) * 4;
  const [r, g, b, a] = rgba;
  if (a < 255) {
    const srcA = a / 255;
    const dstA = data[i + 3] / 255;
    const outA = srcA + dstA * (1 - srcA);
    if (outA > 0) {
      data[i] = (r * srcA + data[i] * dstA * (1 - srcA)) / outA;
      data[i + 1] = (g * srcA + data[i + 1] * dstA * (1 - srcA)) / outA;
      data[i + 2] = (b * srcA + data[i + 2] * dstA * (1 - srcA)) / outA;
      data[i + 3] = outA * 255;
    }
  } else {
    data[i] = r;
    data[i + 1] = g;
    data[i + 2] = b;
    data[i + 3] = a;
  }
}

function fillCircle(data: Uint8ClampedArray, w: number, cx: number, cy: number, r: number, rgba: RGBA): void {
  const x0 = Math.max(0, Math.floor(cx - r));
  const x1 = Math.min(w - 1, Math.ceil(cx + r));
  const y0 = Math.max(0, Math.floor(cy - r));
  const y1 = Math.min(PORTRAIT_SIZE - 1, Math.ceil(cy + r));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = x - cx;
      const dy = y - cy;
      if (dx * dx + dy * dy <= r * r) {
        setPixel(data, w, x, y, rgba);
      }
    }
  }
}

function fillRect(data: Uint8ClampedArray, w: number, x: number, y: number, rw: number, rh: number, rgba: RGBA): void {
  for (let py = Math.max(0, Math.floor(y)); py < Math.min(PORTRAIT_SIZE, Math.ceil(y + rh)); py++) {
    for (let px = Math.max(0, Math.floor(x)); px < Math.min(w, Math.ceil(x + rw)); px++) {
      setPixel(data, w, px, py, rgba);
    }
  }
}

function fillEllipse(data: Uint8ClampedArray, w: number, cx: number, cy: number, rx: number, ry: number, rgba: RGBA): void {
  const x0 = Math.max(0, Math.floor(cx - rx));
  const x1 = Math.min(w - 1, Math.ceil(cx + rx));
  const y0 = Math.max(0, Math.floor(cy - ry));
  const y1 = Math.min(PORTRAIT_SIZE - 1, Math.ceil(cy + ry));
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const dx = (x - cx) / rx;
      const dy = (y - cy) / ry;
      if (dx * dx + dy * dy <= 1) {
        setPixel(data, w, x, y, rgba);
      }
    }
  }
}

function drawLine(data: Uint8ClampedArray, w: number, x0: number, y0: number, x1: number, y1: number, rgba: RGBA): void {
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const steps = Math.max(dx, dy, 1);
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = Math.round(x0 + (x1 - x0) * t);
    const y = Math.round(y0 + (y1 - y0) * t);
    setPixel(data, w, x, y, rgba);
  }
}

const SKIN: RGBA = [210, 170, 130, 255];
const SKIN_SHADOW: RGBA = [180, 140, 105, 255];
const SKIN_HIGHLIGHT: RGBA = [230, 195, 160, 255];
const LIP: RGBA = [185, 130, 110, 255];
const NOSE_SHADOW: RGBA = [190, 150, 115, 255];
const WHITE_EYE: RGBA = [240, 240, 240, 255];
const PUPIL: RGBA = [35, 25, 15, 255];
const EYEBROW: RGBA = [40, 30, 20, 255];

function drawBaseHead(d: Uint8ClampedArray, w: number): void {
  fillEllipse(d, w, 24, 24, 14, 17, SKIN);
  fillEllipse(d, w, 24, 26, 12, 14, SKIN_HIGHLIGHT);
  fillEllipse(d, w, 24, 38, 8, 4, SKIN_SHADOW);
  fillEllipse(d, w, 17, 24, 2, 3, SKIN_SHADOW);
  fillEllipse(d, w, 31, 24, 2, 3, SKIN_SHADOW);
}

function drawEyes(d: Uint8ClampedArray, w: number): void {
  fillEllipse(d, w, 18, 22, 3.5, 2.5, WHITE_EYE);
  fillEllipse(d, w, 30, 22, 3.5, 2.5, WHITE_EYE);
  fillCircle(d, w, 18.5, 22, 1.8, PUPIL);
  fillCircle(d, w, 30.5, 22, 1.8, PUPIL);
  setPixel(d, w, 17, 21, [255, 255, 255, 200]);
  setPixel(d, w, 29, 21, [255, 255, 255, 200]);
  for (let x = 15; x <= 21; x++) setPixel(d, w, x, 19, EYEBROW);
  for (let x = 27; x <= 33; x++) setPixel(d, w, x, 19, EYEBROW);
}

function drawNoseAndMouth(d: Uint8ClampedArray, w: number): void {
  setPixel(d, w, 24, 27, NOSE_SHADOW);
  setPixel(d, w, 23, 28, NOSE_SHADOW);
  setPixel(d, w, 25, 28, NOSE_SHADOW);
  setPixel(d, w, 24, 28, SKIN_SHADOW);
  drawLine(d, w, 20, 32, 28, 32, LIP);
  drawLine(d, w, 21, 33, 27, 33, LIP);
  setPixel(d, w, 24, 31, [195, 140, 120, 200]);
}

function drawHair(d: Uint8ClampedArray, w: number, color: RGBA, long: boolean): void {
  fillEllipse(d, w, 24, 10, 15, 8, color);
  fillRect(d, w, 9, 10, 4, long ? 20 : 14, color);
  fillRect(d, w, 35, 10, 4, long ? 20 : 14, color);
  if (long) {
    fillRect(d, w, 8, 14, 3, 18, color);
    fillRect(d, w, 37, 14, 3, 18, color);
    for (let x = 10; x <= 38; x++) {
      setPixel(d, w, x, 6, color);
      setPixel(d, w, x, 7, color);
    }
  }
  for (let x = 11; x <= 37; x++) {
    setPixel(d, w, x, 8, color);
    setPixel(d, w, x, 9, color);
  }
}

function drawBeard(d: Uint8ClampedArray, w: number, color: RGBA): void {
  fillEllipse(d, w, 24, 35, 9, 7, color);
  fillEllipse(d, w, 24, 30, 10, 4, [color[0], color[1], color[2], 180]);
  fillRect(d, w, 14, 26, 3, 8, [color[0], color[1], color[2], 150]);
  fillRect(d, w, 31, 26, 3, 8, [color[0], color[1], color[2], 150]);
}

function drawSunglasses(d: Uint8ClampedArray, w: number, tint: RGBA): void {
  fillRect(d, w, 14, 20, 9, 5, [20, 20, 20, 240]);
  fillRect(d, w, 25, 20, 9, 5, [20, 20, 20, 240]);
  drawLine(d, w, 23, 22, 25, 22, [60, 60, 60, 255]);
  setPixel(d, w, 16, 21, tint);
  setPixel(d, w, 27, 21, tint);
  drawLine(d, w, 14, 22, 10, 20, [60, 60, 60, 255]);
  drawLine(d, w, 34, 22, 38, 20, [60, 60, 60, 255]);
}

function drawSuit(d: Uint8ClampedArray, w: number, color: RGBA, accent: RGBA): void {
  fillRect(d, w, 12, 38, 24, 10, color);
  const darker: RGBA = [Math.max(0, color[0] - 30), Math.max(0, color[1] - 30), Math.max(0, color[2] - 30), 255];
  fillRect(d, w, 12, 38, 4, 10, darker);
  fillRect(d, w, 32, 38, 4, 10, darker);
  drawLine(d, w, 24, 38, 20, 47, accent);
  drawLine(d, w, 24, 38, 28, 47, accent);
  fillRect(d, w, 23, 38, 2, 10, [240, 240, 240, 80]);
}

function drawNeoPortrait(d: Uint8ClampedArray, w: number, keanu: CountryFlag): void {
  const [sr, sg, sb] = hexToRgb(keanu.suitColor);
  const [hr, hg, hb] = hexToRgb(keanu.hairColor);
  const [ar, ag, ab] = hexToRgb(keanu.accentColor);
  drawSuit(d, w, [sr, sg, sb, 255], [ar, ag, ab, 255]);
  drawBaseHead(d, w);
  drawHair(d, w, [hr, hg, hb, 255], true);
  drawSunglasses(d, w, [ar, ag, ab, 150]);
  drawNoseAndMouth(d, w);
  for (let i = 0; i < 12; i++) {
    const x = 5 + Math.floor(Math.random() * 38);
    const y = Math.floor(Math.random() * 48);
    setPixel(d, w, x, y, [ar, ag, ab, 60 + Math.floor(Math.random() * 40)]);
    setPixel(d, w, x, y + 1, [ar, ag, ab, 30 + Math.floor(Math.random() * 30)]);
  }
}

function drawWickPortrait(d: Uint8ClampedArray, w: number, keanu: CountryFlag): void {
  const [sr, sg, sb] = hexToRgb(keanu.suitColor);
  const [hr, hg, hb] = hexToRgb(keanu.hairColor);
  const [ar, ag, ab] = hexToRgb(keanu.accentColor);
  drawSuit(d, w, [sr, sg, sb, 255], [ar, ag, ab, 255]);
  drawBaseHead(d, w);
  drawHair(d, w, [hr, hg, hb, 255], true);
  drawBeard(d, w, [hr, hg, hb, 200]);
  drawEyes(d, w);
  drawNoseAndMouth(d, w);
  drawLine(d, w, 38, 35, 42, 20, [230, 200, 50, 255]);
  drawLine(d, w, 42, 20, 43, 18, [100, 100, 100, 255]);
  setPixel(d, w, 43, 17, [200, 50, 50, 200]);
}

function drawTedPortrait(d: Uint8ClampedArray, w: number, keanu: CountryFlag): void {
  const [sr, sg, sb] = hexToRgb(keanu.suitColor);
  const [hr, hg, hb] = hexToRgb(keanu.hairColor);
  const [ar, ag, ab] = hexToRgb(keanu.accentColor);
  drawSuit(d, w, [sr, sg, sb, 255], [ar, ag, ab, 255]);
  drawBaseHead(d, w);
  drawHair(d, w, [hr, hg, hb, 255], false);
  drawEyes(d, w);
  drawNoseAndMouth(d, w);
  drawLine(d, w, 20, 32, 24, 33, [200, 140, 120, 255]);
  drawLine(d, w, 24, 33, 28, 32, [200, 140, 120, 255]);
}

function drawJohnnyPortrait(d: Uint8ClampedArray, w: number, keanu: CountryFlag): void {
  const [sr, sg, sb] = hexToRgb(keanu.suitColor);
  const [hr, hg, hb] = hexToRgb(keanu.hairColor);
  const [ar, ag, ab] = hexToRgb(keanu.accentColor);
  fillRect(d, w, 10, 36, 28, 12, [sr, sg, sb, 255]);
  fillEllipse(d, w, 24, 8, 16, 6, [sr, sg, sb, 200]);
  fillRect(d, w, 8, 8, 32, 6, [sr, sg, sb, 180]);
  drawBaseHead(d, w);
  drawHair(d, w, [hr, hg, hb, 255], true);
  drawEyes(d, w);
  drawNoseAndMouth(d, w);
  drawLine(d, w, 36, 38, 44, 28, [ar, ag, ab, 180]);
  drawLine(d, w, 44, 28, 46, 26, [ar, ag, ab, 140]);
}

function drawKeanuSelfPortrait(d: Uint8ClampedArray, w: number, keanu: CountryFlag): void {
  const [sr, sg, sb] = hexToRgb(keanu.suitColor);
  const [hr, hg, hb] = hexToRgb(keanu.hairColor);
  const [ar, ag, ab] = hexToRgb(keanu.accentColor);
  drawSuit(d, w, [sr, sg, sb, 255], [ar, ag, ab, 255]);
  drawBaseHead(d, w);
  drawHair(d, w, [hr, hg, hb, 255], true);
  drawBeard(d, w, [hr, hg, hb, 220]);
  drawEyes(d, w);
  drawNoseAndMouth(d, w);
  drawLine(d, w, 20, 32, 24, 34, [200, 140, 120, 255]);
  drawLine(d, w, 24, 34, 28, 32, [200, 140, 120, 255]);
}

function drawBodhiPortrait(d: Uint8ClampedArray, w: number, keanu: CountryFlag): void {
  const [sr, sg, sb] = hexToRgb(keanu.suitColor);
  const [hr, hg, hb] = hexToRgb(keanu.hairColor);
  const [ar, ag, ab] = hexToRgb(keanu.accentColor);
  drawSuit(d, w, [sr, sg, sb, 255], [ar, ag, ab, 255]);
  drawBaseHead(d, w);
  drawHair(d, w, [hr, hg, hb, 255], false);
  drawEyes(d, w);
  drawNoseAndMouth(d, w);
  fillEllipse(d, w, 42, 30, 3, 10, [ar, ag, ab, 200]);
  drawLine(d, w, 42, 20, 42, 40, [255, 255, 255, 100]);
}

const PORTRAIT_DRAWERS: Record<string, (d: Uint8ClampedArray, w: number, k: CountryFlag) => void> = {
  NEO: drawNeoPortrait,
  WICK: drawWickPortrait,
  TED: drawTedPortrait,
  JNNY: drawJohnnyPortrait,
  KEANU: drawKeanuSelfPortrait,
  SURF: drawBodhiPortrait,
};

function drawPortraitBorder(d: Uint8ClampedArray, w: number, accent: RGBA): void {
  for (let x = 0; x < w; x++) {
    setPixel(d, w, x, 0, accent);
    setPixel(d, w, x, 1, [accent[0], accent[1], accent[2], 150]);
    setPixel(d, w, x, PORTRAIT_SIZE - 1, accent);
    setPixel(d, w, x, PORTRAIT_SIZE - 2, [accent[0], accent[1], accent[2], 150]);
  }
  for (let y = 0; y < PORTRAIT_SIZE; y++) {
    setPixel(d, w, 0, y, accent);
    setPixel(d, w, 1, y, [accent[0], accent[1], accent[2], 150]);
    setPixel(d, w, w - 1, y, accent);
    setPixel(d, w, w - 2, y, [accent[0], accent[1], accent[2], 150]);
  }
}

function generatePortraitData(keanu: CountryFlag): Uint8ClampedArray {
  const w = PORTRAIT_SIZE;
  const data = new Uint8ClampedArray(w * PORTRAIT_SIZE * 4);
  const [ar, ag, ab] = hexToRgb(keanu.accentColor);
  fillRect(data, w, 0, 0, w, PORTRAIT_SIZE, [10, 8, 15, 255]);
  const drawer = PORTRAIT_DRAWERS[keanu.code];
  if (drawer) {
    drawer(data, w, keanu);
  }
  drawPortraitBorder(data, w, [ar, ag, ab, 255]);
  return data;
}

function textureKeyFor(keanu: CountryFlag): string {
  return `keanu_portrait_${keanu.code}`;
}

export function createPortraitTextures(scene: Phaser.Scene): void {
  const flags = getFlags();
  for (const flag of flags) {
    const key = textureKeyFor(flag);
    if (scene.textures.exists(key)) continue;
    const canvasTexture = scene.textures.createCanvas(key, PORTRAIT_SIZE, PORTRAIT_SIZE);
    if (!canvasTexture) continue;
    const ctx = canvasTexture.getContext();
    const imgData = ctx.createImageData(PORTRAIT_SIZE, PORTRAIT_SIZE);
    const pixels = generatePortraitData(flag);
    imgData.data.set(pixels);
    ctx.putImageData(imgData, 0, 0);
    canvasTexture.refresh();
  }
}

export function getPortraitKey(flag: CountryFlag): string {
  return textureKeyFor(flag);
}

export function drawPortraitFood(
  scene: Phaser.Scene,
  g: Phaser.GameObjects.Graphics,
  flag: CountryFlag,
  foodX: number,
  foodY: number,
  cellSize: number,
  frameCount: number
): void {
  const hover = Math.sin(frameCount * 0.08) * 3;
  const floatY = foodY + hover;
  const size = cellSize * 1.5;
  const pulse = 1.0 + Math.sin(frameCount * 0.1) * 0.08;
  const displaySize = size * pulse;

  const shadowScale = 1.0 - hover / 20;
  const shadowAlpha = 0.3 * Math.max(0.3, shadowScale);
  g.fillStyle(0x000000, shadowAlpha);
  g.fillEllipse(foodX + 2, foodY + 8, size * 0.8 * shadowScale, size * 0.2 * shadowScale);

  const [ar, ag, ab] = hexToRgb(flag.accentColor);
  const glowPulse = 0.15 + Math.sin(frameCount * 0.08) * 0.08;
  g.fillStyle(flag.glowColor, glowPulse);
  g.fillCircle(foodX, floatY, displaySize * 0.85);
  g.fillStyle(flag.glowColor, glowPulse * 0.3);
  g.fillCircle(foodX, floatY, displaySize * 1.2);

  const key = textureKeyFor(flag);
  if (scene.textures.exists(key)) {
    const existing = scene.children.getByName(key) as Phaser.GameObjects.Image | null;
    if (existing) {
      existing.setPosition(foodX, floatY);
      existing.setScale(displaySize / PORTRAIT_SIZE);
      existing.setVisible(true);
      existing.setDepth(100);
    } else {
      const img = scene.add.image(foodX, floatY, key);
      img.setName(key);
      img.setScale(displaySize / PORTRAIT_SIZE);
      img.setDepth(100);
      img.setOrigin(0.5, 0.5);
    }
  }

  const angle = frameCount * 0.04;
  const sparkCount = 8;
  for (let i = 0; i < sparkCount; i++) {
    const a = angle + (i / sparkCount) * Math.PI * 2;
    const r = displaySize * 0.6 + Math.sin(frameCount * 0.12 + i) * 4;
    const sx = foodX + Math.cos(a) * r;
    const sy = floatY + Math.sin(a) * r;
    const sparkAlpha = 0.3 + Math.sin(frameCount * 0.15 + i * 1.5) * 0.2;
    g.fillStyle(flag.accentColor, sparkAlpha);
    g.fillCircle(sx, sy, 1.5);
  }

  const ringAlpha = 0.2 + Math.sin(frameCount * 0.1) * 0.1;
  g.lineStyle(1.5, flag.accentColor, ringAlpha);
  const ringRadius = displaySize * 0.75 + Math.sin(frameCount * 0.06) * 3;
  g.strokeCircle(foodX, floatY, ringRadius);

  const specAlpha = 0.25 + Math.sin(frameCount * 0.15) * 0.12;
  g.fillStyle(Phaser.Display.Color.GetColor(ar, ag, ab), specAlpha);
  g.fillCircle(foodX - displaySize * 0.3, floatY - displaySize * 0.35, 2);

  const cornerGlow = 0.1 + Math.sin(frameCount * 0.07) * 0.05;
  g.fillStyle(flag.glowColor, cornerGlow);
  for (let i = 0; i < 4; i++) {
    const ca = (Math.PI / 4) + (i * Math.PI / 2) + frameCount * 0.02;
    const cr = displaySize * 0.55;
    g.fillCircle(foodX + Math.cos(ca) * cr, floatY + Math.sin(ca) * cr, 2);
  }
}

export function hidePortraitImages(scene: Phaser.Scene): void {
  const flags = getFlags();
  for (const flag of flags) {
    const key = textureKeyFor(flag);
    const existing = scene.children.getByName(key) as Phaser.GameObjects.Image | null;
    if (existing) {
      existing.setVisible(false);
    }
  }
}
