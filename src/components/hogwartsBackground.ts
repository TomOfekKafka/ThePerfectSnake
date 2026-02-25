import Phaser from 'phaser';

export interface FloatingCandle {
  x: number;
  y: number;
  baseY: number;
  width: number;
  height: number;
  phase: number;
  speed: number;
  brightness: number;
  flickerPhase: number;
}

export interface HogwartsBackgroundState {
  candles: FloatingCandle[];
  stoneHue: number;
}

const MAX_CANDLES = 14;
const CANDLE_FLOAT_AMPLITUDE = 4;

export function createHogwartsBackground(
  width: number,
  height: number
): HogwartsBackgroundState {
  const candles: FloatingCandle[] = [];
  for (let i = 0; i < MAX_CANDLES; i++) {
    candles.push({
      x: 15 + Math.random() * (width - 30),
      y: 10 + Math.random() * (height - 20),
      baseY: 10 + Math.random() * (height - 20),
      width: 2 + Math.random() * 2,
      height: 8 + Math.random() * 8,
      phase: Math.random() * Math.PI * 2,
      speed: 0.01 + Math.random() * 0.015,
      brightness: 0.4 + Math.random() * 0.3,
      flickerPhase: Math.random() * Math.PI * 2,
    });
  }
  return { candles, stoneHue: 0 };
}

export function updateHogwartsBackground(state: HogwartsBackgroundState): void {
  for (const c of state.candles) {
    c.phase += c.speed;
    c.flickerPhase += 0.08 + Math.random() * 0.04;
    c.y = c.baseY + Math.sin(c.phase) * CANDLE_FLOAT_AMPLITUDE;
  }
}

function drawSingleCandle(
  g: Phaser.GameObjects.Graphics,
  c: FloatingCandle
): void {
  const flicker = 0.7 + Math.sin(c.flickerPhase) * 0.2 + Math.sin(c.flickerPhase * 2.3) * 0.1;
  const alpha = c.brightness * flicker * 0.12;

  g.fillStyle(0xffaa33, alpha * 0.6);
  g.fillCircle(c.x, c.y - c.height / 2, 12);

  g.fillStyle(0xffe8c0, alpha * 0.3);
  g.fillCircle(c.x, c.y - c.height / 2, 8);

  g.fillStyle(0xe8d8b0, 0.06);
  g.fillRect(c.x - c.width / 2, c.y - c.height / 2, c.width, c.height);

  g.fillStyle(0xfff5e0, 0.08);
  g.fillRect(c.x - c.width / 2 + 0.5, c.y - c.height / 2, c.width * 0.4, c.height);

  const flameH = 3 + Math.sin(c.flickerPhase * 1.5) * 1.5;
  const flameW = 2 + Math.sin(c.flickerPhase * 2.1) * 0.5;
  const flameY = c.y - c.height / 2 - flameH / 2;

  g.fillStyle(0xff6600, alpha * 2.5);
  g.fillTriangle(
    c.x - flameW, flameY + flameH,
    c.x + flameW, flameY + flameH,
    c.x + Math.sin(c.flickerPhase * 3) * 0.5, flameY - flameH
  );

  g.fillStyle(0xffcc00, alpha * 3);
  g.fillTriangle(
    c.x - flameW * 0.5, flameY + flameH * 0.6,
    c.x + flameW * 0.5, flameY + flameH * 0.6,
    c.x, flameY - flameH * 0.3
  );

  g.fillStyle(0xffffff, alpha * 1.5);
  g.fillCircle(c.x, flameY + flameH * 0.3, 1);
}

export function drawHogwartsGrid(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  cellSize: number,
  gridSize: number,
  frameCount: number
): void {
  const pulse = 0.03 + Math.sin(frameCount * 0.012) * 0.01;

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const isLight = (row + col) % 2 === 0;
      const stoneColor = isLight ? 0x2a2018 : 0x221a12;
      const stoneAlpha = 0.08 + Math.sin(frameCount * 0.008 + row * 0.5 + col * 0.3) * 0.02;
      g.fillStyle(stoneColor, stoneAlpha);
      g.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
    }
  }

  for (let i = 0; i <= gridSize; i++) {
    const pos = i * cellSize;
    const mortar = 0.06 + Math.sin(frameCount * 0.01 + i * 0.7) * 0.015;
    g.lineStyle(1, 0x3a3028, mortar * pulse * 20);
    g.lineBetween(pos, 0, pos, height);
    g.lineBetween(0, pos, width, pos);
  }

  for (let i = 0; i <= gridSize; i += 5) {
    const pos = i * cellSize;
    g.lineStyle(1, 0x4a3828, pulse * 1.2);
    g.lineBetween(pos, 0, pos, height);
    g.lineBetween(0, pos, width, pos);
  }

  const edgeGlow = 0.1 + Math.sin(frameCount * 0.015) * 0.03;
  g.fillStyle(0x000000, edgeGlow);
  g.fillRect(0, 0, width, 6);
  g.fillRect(0, height - 6, width, 6);
  g.fillRect(0, 0, 6, height);
  g.fillRect(width - 6, 0, 6, height);

  g.lineStyle(1, 0x8b7355, 0.08);
  g.strokeRect(0, 0, width, height);
}

export function drawFloatingCandles(
  g: Phaser.GameObjects.Graphics,
  state: HogwartsBackgroundState
): void {
  for (const c of state.candles) {
    drawSingleCandle(g, c);
  }
}

export function getMaxCandles(): number {
  return MAX_CANDLES;
}
