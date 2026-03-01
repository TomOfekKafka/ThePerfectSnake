import Phaser from 'phaser';

export interface SmokeParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  life: number;
}

export interface NoirRainDrop {
  x: number;
  y: number;
  vy: number;
  length: number;
  alpha: number;
}

export interface NoirEffectsState {
  smoke: SmokeParticle[];
  rain: NoirRainDrop[];
  venetianPhase: number;
  spotlightX: number;
  spotlightY: number;
  filmGrainSeed: number;
}

const NUM_SMOKE = 12;
const NUM_RAIN = 40;
const NOIR_WHITE = 0xe0ddd0;
const NOIR_GRAY = 0x706858;

export function createNoirEffectsState(): NoirEffectsState {
  return {
    smoke: [],
    rain: [],
    venetianPhase: 0,
    spotlightX: 0,
    spotlightY: 0,
    filmGrainSeed: 0,
  };
}

export function initNoirEffects(state: NoirEffectsState, width: number, height: number): void {
  state.smoke = [];
  for (let i = 0; i < NUM_SMOKE; i++) {
    state.smoke.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -0.15 - Math.random() * 0.25,
      size: 30 + Math.random() * 50,
      alpha: 0.02 + Math.random() * 0.03,
      life: 1,
    });
  }

  state.rain = [];
  for (let i = 0; i < NUM_RAIN; i++) {
    state.rain.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vy: 3 + Math.random() * 4,
      length: 8 + Math.random() * 12,
      alpha: 0.08 + Math.random() * 0.12,
    });
  }
}

export function updateNoirEffects(
  state: NoirEffectsState,
  headX: number,
  headY: number,
  width: number,
  height: number
): void {
  state.venetianPhase += 0.003;
  state.filmGrainSeed = Math.random() * 1000;

  state.spotlightX += (headX - state.spotlightX) * 0.08;
  state.spotlightY += (headY - state.spotlightY) * 0.08;

  for (const smoke of state.smoke) {
    smoke.x += smoke.vx;
    smoke.y += smoke.vy;
    smoke.life -= 0.002;
    if (smoke.life <= 0 || smoke.y < -smoke.size) {
      smoke.x = Math.random() * width;
      smoke.y = height + smoke.size;
      smoke.life = 1;
      smoke.size = 30 + Math.random() * 50;
      smoke.alpha = 0.02 + Math.random() * 0.03;
    }
    if (smoke.x < -smoke.size) smoke.x = width + smoke.size;
    if (smoke.x > width + smoke.size) smoke.x = -smoke.size;
  }

  for (const drop of state.rain) {
    drop.y += drop.vy;
    drop.x += 0.8;
    if (drop.y > height) {
      drop.y = -drop.length;
      drop.x = Math.random() * width;
    }
    if (drop.x > width) drop.x = 0;
  }
}

export function drawNoirRain(
  g: Phaser.GameObjects.Graphics,
  state: NoirEffectsState
): void {
  for (const drop of state.rain) {
    g.lineStyle(0.8, NOIR_WHITE, drop.alpha * 0.6);
    g.lineBetween(drop.x, drop.y, drop.x + 2, drop.y + drop.length);
  }
}

export function drawNoirSmoke(
  g: Phaser.GameObjects.Graphics,
  state: NoirEffectsState
): void {
  for (const smoke of state.smoke) {
    const alpha = smoke.alpha * smoke.life * 0.4;
    g.fillStyle(NOIR_GRAY, alpha);
    g.fillCircle(smoke.x, smoke.y, smoke.size * 0.7);
    g.fillStyle(NOIR_WHITE, alpha * 0.3);
    g.fillCircle(smoke.x, smoke.y, smoke.size * 0.35);
  }
}

export function drawNoirSpotlight(
  g: Phaser.GameObjects.Graphics,
  state: NoirEffectsState,
  width: number,
  height: number,
  frameCount: number
): void {
  const cx = state.spotlightX || width / 2;
  const cy = state.spotlightY || height / 2;
  const pulse = 0.9 + Math.sin(frameCount * 0.03) * 0.1;

  g.fillStyle(0x000000, 0.15);
  g.fillRect(0, 0, width, height);

  const layers = 5;
  for (let i = layers; i > 0; i--) {
    const layerRadius = (width * 0.4 + i * 30) * pulse;
    const layerAlpha = 0.18 * (1 - i / (layers + 1));
    g.fillStyle(NOIR_WHITE, layerAlpha);
    g.fillCircle(cx, cy, layerRadius);
  }

  g.fillStyle(NOIR_WHITE, 0.12 * pulse);
  g.fillCircle(cx, cy, width * 0.25);
}

export function drawVenetianBlinds(
  g: Phaser.GameObjects.Graphics,
  state: NoirEffectsState,
  width: number,
  height: number,
  frameCount: number
): void {
  const blindSpacing = 30;
  const blindWidth = 5;
  const waveOffset = Math.sin(state.venetianPhase) * 10;

  for (let y = waveOffset; y < height; y += blindSpacing) {
    const brightness = 0.015 + Math.sin(y * 0.02 + state.venetianPhase * 2) * 0.008;
    g.fillStyle(NOIR_WHITE, brightness);
    g.fillRect(0, y, width, blindWidth);
  }

  const diagonalAlpha = 0.02 + Math.sin(frameCount * 0.02) * 0.005;
  g.fillStyle(0x000000, diagonalAlpha);
  for (let i = -2; i < 6; i++) {
    const x1 = i * 100 + Math.sin(state.venetianPhase) * 20;
    g.beginPath();
    g.moveTo(x1, 0);
    g.lineTo(x1 + 40, 0);
    g.lineTo(x1 + 40 + height * 0.3, height);
    g.lineTo(x1 + height * 0.3, height);
    g.closePath();
    g.fillPath();
  }
}

export function drawFilmGrain(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  seed: number
): void {
  let s = seed;
  const step = 8;
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      s = (s * 16807 + 1) % 2147483647;
      const noise = (s / 2147483647);
      if (noise > 0.8) {
        const grainAlpha = (noise - 0.8) * 0.04;
        g.fillStyle(noise > 0.9 ? 0xffffff : 0x000000, grainAlpha);
        g.fillRect(x, y, step, step);
      }
    }
  }
}

export function drawNoirVignette(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number
): void {
  const layers = 4;
  for (let i = 0; i < layers; i++) {
    const inset = i * 20;
    const alpha = 0.1 * (1 - i / layers);
    g.lineStyle(25, 0x000000, alpha);
    g.strokeRect(inset - 12, inset - 12, width - inset * 2 + 24, height - inset * 2 + 24);
  }

  const borderSize = 2;
  g.fillStyle(0x000000, 0.7);
  g.fillRect(0, 0, width, borderSize);
  g.fillRect(0, height - borderSize, width, borderSize);
  g.fillRect(0, 0, borderSize, height);
  g.fillRect(width - borderSize, 0, borderSize, height);
}
