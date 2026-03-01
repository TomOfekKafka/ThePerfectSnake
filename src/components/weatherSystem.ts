import Phaser from 'phaser';
import { THEME } from './gameTheme';

export type WeatherType = 'clear' | 'rain' | 'storm' | 'snow' | 'sandstorm' | 'aurora';

const WEATHER_THRESHOLDS: { type: WeatherType; minFood: number }[] = [
  { type: 'clear', minFood: 0 },
  { type: 'rain', minFood: 3 },
  { type: 'storm', minFood: 7 },
  { type: 'snow', minFood: 12 },
  { type: 'sandstorm', minFood: 18 },
  { type: 'aurora', minFood: 25 },
];

export function getWeatherForProgress(foodEaten: number): WeatherType {
  let result: WeatherType = 'clear';
  for (const threshold of WEATHER_THRESHOLDS) {
    if (foodEaten >= threshold.minFood) {
      result = threshold.type;
    }
  }
  return result;
}

export interface RainDrop {
  x: number;
  y: number;
  speed: number;
  length: number;
  alpha: number;
  windOffset: number;
}

export interface LightningFlash {
  life: number;
  intensity: number;
  x: number;
  branches: { x1: number; y1: number; x2: number; y2: number; alpha: number }[];
}

export interface SnowParticle {
  x: number;
  y: number;
  speed: number;
  size: number;
  alpha: number;
  wobblePhase: number;
  wobbleSpeed: number;
}

export interface SandParticle {
  x: number;
  y: number;
  speed: number;
  size: number;
  alpha: number;
  drift: number;
}

export interface AuroraWaveW {
  y: number;
  phase: number;
  speed: number;
  hue: number;
  thickness: number;
  amplitude: number;
}

export interface WeatherState {
  currentWeather: WeatherType;
  transitionProgress: number;
  rainDrops: RainDrop[];
  lightning: LightningFlash[];
  weatherSnow: SnowParticle[];
  sandParticles: SandParticle[];
  auroraWaves: AuroraWaveW[];
  windStrength: number;
  thunderTimer: number;
  overlayAlpha: number;
}

const MAX_RAIN = 60;
const MAX_LIGHTNING = 2;
const MAX_WEATHER_SNOW = 40;
const MAX_SAND = 50;
const NUM_AURORA_W = 5;

export function createWeatherState(): WeatherState {
  return {
    currentWeather: 'clear',
    transitionProgress: 0,
    rainDrops: [],
    lightning: [],
    weatherSnow: [],
    sandParticles: [],
    auroraWaves: [],
    windStrength: 0,
    thunderTimer: 0,
    overlayAlpha: 0,
  };
}

export function initAuroraWaves(state: WeatherState, height: number): void {
  state.auroraWaves = [];
  for (let i = 0; i < NUM_AURORA_W; i++) {
    state.auroraWaves.push({
      y: height * 0.15 + i * (height * 0.12),
      phase: (i / NUM_AURORA_W) * Math.PI * 2,
      speed: 0.008 + i * 0.003,
      hue: 120 + i * 30,
      thickness: 8 + i * 3,
      amplitude: 15 + i * 5,
    });
  }
}

function spawnRainDrop(width: number, windStrength: number): RainDrop {
  return {
    x: Math.random() * (width + 40) - 20,
    y: -10 - Math.random() * 40,
    speed: 4 + Math.random() * 3,
    length: 8 + Math.random() * 12,
    alpha: 0.2 + Math.random() * 0.4,
    windOffset: windStrength * (0.5 + Math.random() * 0.5),
  };
}

function spawnWeatherSnow(width: number): SnowParticle {
  return {
    x: Math.random() * width,
    y: -10 - Math.random() * 20,
    speed: 0.5 + Math.random() * 1.0,
    size: 1.5 + Math.random() * 3,
    alpha: 0.3 + Math.random() * 0.5,
    wobblePhase: Math.random() * Math.PI * 2,
    wobbleSpeed: 0.02 + Math.random() * 0.03,
  };
}

function spawnSandParticle(width: number, height: number): SandParticle {
  return {
    x: -10,
    y: Math.random() * height,
    speed: 2 + Math.random() * 3,
    size: 1 + Math.random() * 2,
    alpha: 0.15 + Math.random() * 0.25,
    drift: (Math.random() - 0.5) * 0.5,
  };
}

function generateLightningBranches(
  x: number,
  height: number
): { x1: number; y1: number; x2: number; y2: number; alpha: number }[] {
  const branches: { x1: number; y1: number; x2: number; y2: number; alpha: number }[] = [];
  let curX = x;
  let curY = 0;
  const segments = 4 + Math.floor(Math.random() * 4);
  const segHeight = height * 0.6 / segments;

  for (let i = 0; i < segments; i++) {
    const nextX = curX + (Math.random() - 0.5) * 30;
    const nextY = curY + segHeight + Math.random() * segHeight * 0.5;
    branches.push({
      x1: curX,
      y1: curY,
      x2: nextX,
      y2: nextY,
      alpha: 0.8 - i * 0.1,
    });

    if (Math.random() < 0.4 && i > 0) {
      const branchX = nextX + (Math.random() - 0.5) * 40;
      const branchY = nextY + segHeight * 0.5;
      branches.push({
        x1: nextX,
        y1: nextY,
        x2: branchX,
        y2: branchY,
        alpha: 0.4,
      });
    }

    curX = nextX;
    curY = nextY;
  }
  return branches;
}

export function updateWeather(
  state: WeatherState,
  foodEaten: number,
  width: number,
  height: number,
  frameCount: number
): void {
  const targetWeather = getWeatherForProgress(foodEaten);

  if (targetWeather !== state.currentWeather) {
    state.transitionProgress += 0.02;
    if (state.transitionProgress >= 1) {
      state.currentWeather = targetWeather;
      state.transitionProgress = 0;
      if (targetWeather === 'aurora') {
        initAuroraWaves(state, height);
      }
    }
  }

  state.windStrength = Math.sin(frameCount * 0.005) * 1.5;

  switch (state.currentWeather) {
    case 'rain':
      updateRain(state, width, height);
      break;
    case 'storm':
      updateStorm(state, width, height, frameCount);
      break;
    case 'snow':
      updateWeatherSnowParticles(state, width, height);
      break;
    case 'sandstorm':
      updateSandstorm(state, width, height);
      break;
    case 'aurora':
      updateAurora(state);
      break;
    default:
      fadeClearWeather(state);
      break;
  }
}

function updateRain(state: WeatherState, width: number, height: number): void {
  const targetCount = MAX_RAIN * 0.6;
  while (state.rainDrops.length < targetCount) {
    state.rainDrops.push(spawnRainDrop(width, state.windStrength));
  }

  for (let i = state.rainDrops.length - 1; i >= 0; i--) {
    const drop = state.rainDrops[i];
    drop.y += drop.speed;
    drop.x += drop.windOffset;
    if (drop.y > height + 20) {
      state.rainDrops.splice(i, 1);
    }
  }

  state.overlayAlpha = Math.min(state.overlayAlpha + 0.005, 0.08);
}

function updateStorm(state: WeatherState, width: number, height: number, frameCount: number): void {
  while (state.rainDrops.length < MAX_RAIN) {
    state.rainDrops.push(spawnRainDrop(width, state.windStrength * 2));
  }

  for (let i = state.rainDrops.length - 1; i >= 0; i--) {
    const drop = state.rainDrops[i];
    drop.y += drop.speed * 1.3;
    drop.x += drop.windOffset * 1.5;
    if (drop.y > height + 20 || drop.x > width + 40 || drop.x < -40) {
      state.rainDrops.splice(i, 1);
    }
  }

  state.thunderTimer--;
  if (state.thunderTimer <= 0 && state.lightning.length < MAX_LIGHTNING) {
    if (Math.random() < 0.008) {
      const lx = Math.random() * width;
      state.lightning.push({
        life: 1,
        intensity: 0.7 + Math.random() * 0.3,
        x: lx,
        branches: generateLightningBranches(lx, height),
      });
      state.thunderTimer = 60 + Math.floor(Math.random() * 120);
    }
  }

  for (let i = state.lightning.length - 1; i >= 0; i--) {
    const flash = state.lightning[i];
    flash.life -= 0.08;
    for (const branch of flash.branches) {
      branch.alpha *= 0.9;
    }
    if (flash.life <= 0) {
      state.lightning.splice(i, 1);
    }
  }

  state.overlayAlpha = Math.min(state.overlayAlpha + 0.008, 0.15);
}

function updateWeatherSnowParticles(state: WeatherState, width: number, height: number): void {
  state.rainDrops = [];
  state.lightning = [];

  while (state.weatherSnow.length < MAX_WEATHER_SNOW) {
    state.weatherSnow.push(spawnWeatherSnow(width));
  }

  for (let i = state.weatherSnow.length - 1; i >= 0; i--) {
    const flake = state.weatherSnow[i];
    flake.wobblePhase += flake.wobbleSpeed;
    flake.x += Math.sin(flake.wobblePhase) * 0.8 + state.windStrength * 0.3;
    flake.y += flake.speed;
    if (flake.y > height + 10 || flake.x < -20 || flake.x > width + 20) {
      state.weatherSnow.splice(i, 1);
    }
  }

  state.overlayAlpha = Math.max(state.overlayAlpha - 0.005, 0.04);
}

function updateSandstorm(state: WeatherState, width: number, height: number): void {
  state.rainDrops = [];
  state.lightning = [];
  state.weatherSnow = [];

  while (state.sandParticles.length < MAX_SAND) {
    state.sandParticles.push(spawnSandParticle(width, height));
  }

  for (let i = state.sandParticles.length - 1; i >= 0; i--) {
    const p = state.sandParticles[i];
    p.x += p.speed;
    p.y += p.drift;
    if (p.x > width + 20 || p.y < -10 || p.y > height + 10) {
      state.sandParticles.splice(i, 1);
    }
  }

  state.overlayAlpha = Math.min(state.overlayAlpha + 0.005, 0.12);
}

function updateAurora(state: WeatherState): void {
  state.rainDrops = [];
  state.lightning = [];
  state.weatherSnow = [];
  state.sandParticles = [];

  for (const wave of state.auroraWaves) {
    wave.phase += wave.speed;
  }

  state.overlayAlpha = Math.max(state.overlayAlpha - 0.005, 0);
}

function fadeClearWeather(state: WeatherState): void {
  state.overlayAlpha = Math.max(state.overlayAlpha - 0.01, 0);
  if (state.rainDrops.length > 0) {
    state.rainDrops.splice(0, 2);
  }
  if (state.weatherSnow.length > 0) {
    state.weatherSnow.splice(0, 2);
  }
  if (state.sandParticles.length > 0) {
    state.sandParticles.splice(0, 2);
  }
}

export function drawWeather(
  g: Phaser.GameObjects.Graphics,
  state: WeatherState,
  width: number,
  height: number,
  frameCount: number
): void {
  drawRainDrops(g, state);
  drawLightning(g, state);
  drawWeatherSnow(g, state);
  drawSandParticles(g, state);
  drawAuroraEffect(g, state, width, frameCount);
  drawWeatherOverlay(g, state, width, height);
}

function drawRainDrops(g: Phaser.GameObjects.Graphics, state: WeatherState): void {
  for (const drop of state.rainDrops) {
    g.lineStyle(1, 0x6688cc, drop.alpha);
    g.lineBetween(
      drop.x,
      drop.y,
      drop.x + drop.windOffset * 0.3,
      drop.y + drop.length
    );
  }
}

function drawLightning(g: Phaser.GameObjects.Graphics, state: WeatherState): void {
  for (const flash of state.lightning) {
    if (flash.life > 0.5) {
      g.fillStyle(0xffffff, flash.life * flash.intensity * 0.05);
      g.fillRect(0, 0, 400, 400);
    }

    for (const branch of flash.branches) {
      const alpha = branch.alpha * flash.life;
      g.lineStyle(3, 0xffffff, alpha * 0.3);
      g.lineBetween(branch.x1, branch.y1, branch.x2, branch.y2);
      g.lineStyle(1.5, 0xccddff, alpha * 0.8);
      g.lineBetween(branch.x1, branch.y1, branch.x2, branch.y2);
      g.lineStyle(0.5, 0xffffff, alpha);
      g.lineBetween(branch.x1, branch.y1, branch.x2, branch.y2);
    }
  }
}

function drawWeatherSnow(g: Phaser.GameObjects.Graphics, state: WeatherState): void {
  for (const flake of state.weatherSnow) {
    g.fillStyle(0xeeeeff, flake.alpha * 0.3);
    g.fillCircle(flake.x, flake.y, flake.size * 1.5);
    g.fillStyle(0xffffff, flake.alpha);
    g.fillCircle(flake.x, flake.y, flake.size);
  }
}

function drawSandParticles(g: Phaser.GameObjects.Graphics, state: WeatherState): void {
  for (const p of state.sandParticles) {
    g.fillStyle(0xd4a556, p.alpha * 0.4);
    g.fillCircle(p.x, p.y, p.size * 2);
    g.fillStyle(0xc4953f, p.alpha);
    g.fillCircle(p.x, p.y, p.size);
  }
}

function drawAuroraEffect(
  g: Phaser.GameObjects.Graphics,
  state: WeatherState,
  width: number,
  frameCount: number
): void {
  for (const wave of state.auroraWaves) {
    const segments = 20;
    const segWidth = width / segments;

    for (let i = 0; i < segments; i++) {
      const x = i * segWidth;
      const waveY = wave.y + Math.sin(wave.phase + i * 0.3) * wave.amplitude;
      const nextWaveY = wave.y + Math.sin(wave.phase + (i + 1) * 0.3) * wave.amplitude;

      const pulse = 0.5 + Math.sin(frameCount * 0.02 + i * 0.2) * 0.3;
      const color = hslToHex(wave.hue + i * 2, 0.7, 0.5);
      const alpha = 0.06 * pulse;

      g.fillStyle(color, alpha);
      g.beginPath();
      g.moveTo(x, waveY - wave.thickness);
      g.lineTo(x + segWidth, nextWaveY - wave.thickness);
      g.lineTo(x + segWidth, nextWaveY + wave.thickness);
      g.lineTo(x, waveY + wave.thickness);
      g.closePath();
      g.fillPath();

      g.fillStyle(color, alpha * 1.5);
      const coreThickness = wave.thickness * 0.3;
      g.beginPath();
      g.moveTo(x, waveY - coreThickness);
      g.lineTo(x + segWidth, nextWaveY - coreThickness);
      g.lineTo(x + segWidth, nextWaveY + coreThickness);
      g.lineTo(x, waveY + coreThickness);
      g.closePath();
      g.fillPath();
    }
  }
}

function drawWeatherOverlay(
  g: Phaser.GameObjects.Graphics,
  state: WeatherState,
  width: number,
  height: number
): void {
  if (state.overlayAlpha <= 0) return;

  let color = 0x000000;
  switch (state.currentWeather) {
    case 'rain':
      color = 0x112233;
      break;
    case 'storm':
      color = 0x0a0a1a;
      break;
    case 'snow':
      color = 0x1a1a2e;
      break;
    case 'sandstorm':
      color = 0x2a1a0a;
      break;
    default:
      color = 0x000000;
      break;
  }
  g.fillStyle(color, state.overlayAlpha);
  g.fillRect(0, 0, width, height);
}

const WEATHER_LABELS: Record<WeatherType, string> = {
  clear: 'CLEAR',
  rain: 'RAIN',
  storm: 'STORM',
  snow: 'SNOW',
  sandstorm: 'SAND',
  aurora: 'AURORA',
};

export function drawWeatherIndicator(
  g: Phaser.GameObjects.Graphics,
  state: WeatherState,
  width: number,
  frameCount: number,
  drawDigitFn: (g: Phaser.GameObjects.Graphics, digit: string, x: number, y: number, size: number) => void
): void {
  const label = WEATHER_LABELS[state.currentWeather];
  const iconX = width / 2;
  const iconY = 8;
  const digitSize = 7;
  const spacing = digitSize * 0.55;
  const totalWidth = label.length * spacing;
  let x = iconX - totalWidth / 2;

  const iconColor = weatherIconColor(state.currentWeather);
  const pulse = 0.6 + Math.sin(frameCount * 0.04) * 0.2;

  drawWeatherIcon(g, state.currentWeather, iconX, iconY + digitSize * 0.45, digitSize * 0.4, frameCount);

  const textY = iconY + digitSize + 3;
  for (let i = 0; i < label.length; i++) {
    g.fillStyle(iconColor, pulse);
    drawDigitFn(g, label[i], x, textY, digitSize);
    x += spacing;
  }
}

function drawWeatherIcon(
  g: Phaser.GameObjects.Graphics,
  weather: WeatherType,
  x: number,
  y: number,
  size: number,
  frameCount: number
): void {
  switch (weather) {
    case 'clear': {
      const pulse = 0.7 + Math.sin(frameCount * 0.05) * 0.3;
      g.fillStyle(0xffd700, 0.3 * pulse);
      g.fillCircle(x, y, size * 2);
      g.fillStyle(0xffd700, 0.7 * pulse);
      g.fillCircle(x, y, size);
      break;
    }
    case 'rain': {
      g.fillStyle(0x8899bb, 0.6);
      g.fillCircle(x - size * 0.5, y, size);
      g.fillCircle(x + size * 0.5, y, size);
      g.fillCircle(x, y - size * 0.3, size * 0.8);
      const dropY = y + size * 1.5 + Math.sin(frameCount * 0.15) * size * 0.5;
      g.fillStyle(0x6688cc, 0.6);
      g.fillCircle(x, dropY, size * 0.3);
      break;
    }
    case 'storm': {
      g.fillStyle(0x556688, 0.7);
      g.fillCircle(x - size * 0.5, y, size);
      g.fillCircle(x + size * 0.5, y, size);
      g.fillCircle(x, y - size * 0.3, size * 0.8);
      const flash = Math.sin(frameCount * 0.2) > 0.8 ? 0.8 : 0;
      g.fillStyle(0xffff88, flash);
      g.fillTriangle(x, y + size, x - size * 0.4, y + size * 2, x + size * 0.3, y + size * 1.5);
      break;
    }
    case 'snow': {
      g.fillStyle(0xaabbcc, 0.6);
      g.fillCircle(x - size * 0.5, y, size);
      g.fillCircle(x + size * 0.5, y, size);
      const flakeY = y + size * 1.5 + Math.sin(frameCount * 0.08) * size * 0.3;
      g.fillStyle(0xffffff, 0.7);
      g.fillCircle(x, flakeY, size * 0.4);
      break;
    }
    case 'sandstorm': {
      const wave = Math.sin(frameCount * 0.1) * size;
      g.fillStyle(0xd4a556, 0.5);
      g.fillCircle(x + wave * 0.3, y, size);
      g.fillCircle(x - wave * 0.2, y + size * 0.3, size * 0.7);
      break;
    }
    case 'aurora': {
      const hue1 = (frameCount * 0.5) % 360;
      g.fillStyle(hslToHex(hue1, 0.7, 0.5), 0.4);
      g.fillCircle(x - size, y, size * 0.6);
      g.fillStyle(hslToHex(hue1 + 60, 0.7, 0.5), 0.4);
      g.fillCircle(x, y, size * 0.6);
      g.fillStyle(hslToHex(hue1 + 120, 0.7, 0.5), 0.4);
      g.fillCircle(x + size, y, size * 0.6);
      break;
    }
  }
}

function weatherIconColor(weather: WeatherType): number {
  switch (weather) {
    case 'clear': return 0xffd700;
    case 'rain': return 0x6688cc;
    case 'storm': return 0x8888cc;
    case 'snow': return 0xccddff;
    case 'sandstorm': return 0xd4a556;
    case 'aurora': return 0x44ffaa;
  }
}

function hslToHex(h: number, s: number, l: number): number {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, gv = 0, b = 0;
  if (h < 60) { r = c; gv = x; }
  else if (h < 120) { r = x; gv = c; }
  else if (h < 180) { gv = c; b = x; }
  else if (h < 240) { gv = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  const ri = Math.round((r + m) * 255);
  const gi = Math.round((gv + m) * 255);
  const bi = Math.round((b + m) * 255);
  return (ri << 16) | (gi << 8) | bi;
}
