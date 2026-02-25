import Phaser from 'phaser';
import { THEME } from './gameTheme';

export interface WarpStar {
  x: number;
  y: number;
  z: number;
  prevX: number;
  prevY: number;
  speed: number;
  brightness: number;
}

export interface NebulaBlob {
  x: number;
  y: number;
  radius: number;
  color: number;
  alpha: number;
  pulsePhase: number;
  pulseSpeed: number;
  driftX: number;
  driftY: number;
}

export interface CosmicDust {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: number;
}

export interface SpaceBackgroundState {
  warpStars: WarpStar[];
  nebulae: NebulaBlob[];
  dust: CosmicDust[];
  warpSpeed: number;
  frameCount: number;
}

const NUM_WARP_STARS = 60;
const NUM_NEBULAE = 5;
const NUM_DUST = 25;
const CENTER_X = 200;
const CENTER_Y = 200;

const NEBULA_COLORS = THEME.nebula;

const DUST_COLORS: number[] = [...THEME.dust];

export function createSpaceBackgroundState(): SpaceBackgroundState {
  return {
    warpStars: [],
    nebulae: [],
    dust: [],
    warpSpeed: 1.0,
    frameCount: 0,
  };
}

export function createWarpStar(width: number, height: number): WarpStar {
  const x = (Math.random() - 0.5) * width * 2;
  const y = (Math.random() - 0.5) * height * 2;
  const z = Math.random() * 400 + 10;
  return {
    x,
    y,
    z,
    prevX: x / z * 200 + width / 2,
    prevY: y / z * 200 + height / 2,
    speed: 1.5 + Math.random() * 2.5,
    brightness: 0.4 + Math.random() * 0.6,
  };
}

function resetWarpStar(star: WarpStar, width: number, height: number): void {
  star.x = (Math.random() - 0.5) * width * 2;
  star.y = (Math.random() - 0.5) * height * 2;
  star.z = 350 + Math.random() * 50;
  star.prevX = star.x / star.z * 200 + width / 2;
  star.prevY = star.y / star.z * 200 + height / 2;
}

export function createNebulaBlob(width: number, height: number): NebulaBlob {
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    radius: 40 + Math.random() * 60,
    color: NEBULA_COLORS[Math.floor(Math.random() * NEBULA_COLORS.length)],
    alpha: 0.04 + Math.random() * 0.06,
    pulsePhase: Math.random() * Math.PI * 2,
    pulseSpeed: 0.008 + Math.random() * 0.012,
    driftX: (Math.random() - 0.5) * 0.15,
    driftY: (Math.random() - 0.5) * 0.15,
  };
}

function createCosmicDust(width: number, height: number): CosmicDust {
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.3,
    size: 0.5 + Math.random() * 1.5,
    alpha: 0.15 + Math.random() * 0.25,
    color: DUST_COLORS[Math.floor(Math.random() * DUST_COLORS.length)],
  };
}

export function initSpaceBackground(
  state: SpaceBackgroundState,
  width: number,
  height: number
): void {
  state.warpStars = [];
  for (let i = 0; i < NUM_WARP_STARS; i++) {
    state.warpStars.push(createWarpStar(width, height));
  }
  state.nebulae = [];
  for (let i = 0; i < NUM_NEBULAE; i++) {
    state.nebulae.push(createNebulaBlob(width, height));
  }
  state.dust = [];
  for (let i = 0; i < NUM_DUST; i++) {
    state.dust.push(createCosmicDust(width, height));
  }
}

export function updateWarpStars(
  state: SpaceBackgroundState,
  width: number,
  height: number
): void {
  for (const star of state.warpStars) {
    const screenX = star.x / star.z * 200 + CENTER_X;
    const screenY = star.y / star.z * 200 + CENTER_Y;
    star.prevX = screenX;
    star.prevY = screenY;

    star.z -= star.speed * state.warpSpeed;

    if (star.z <= 1 || screenX < -50 || screenX > width + 50 || screenY < -50 || screenY > height + 50) {
      resetWarpStar(star, width, height);
    }
  }
}

export function updateNebulae(
  state: SpaceBackgroundState,
  width: number,
  height: number
): void {
  for (const neb of state.nebulae) {
    neb.x += neb.driftX;
    neb.y += neb.driftY;
    neb.pulsePhase += neb.pulseSpeed;

    if (neb.x < -neb.radius) neb.x = width + neb.radius;
    if (neb.x > width + neb.radius) neb.x = -neb.radius;
    if (neb.y < -neb.radius) neb.y = height + neb.radius;
    if (neb.y > height + neb.radius) neb.y = -neb.radius;
  }
}

export function updateCosmicDust(
  state: SpaceBackgroundState,
  width: number,
  height: number
): void {
  for (const d of state.dust) {
    d.x += d.vx;
    d.y += d.vy;

    if (d.x < 0) d.x = width;
    if (d.x > width) d.x = 0;
    if (d.y < 0) d.y = height;
    if (d.y > height) d.y = 0;
  }
}

export function updateSpaceBackground(
  state: SpaceBackgroundState,
  width: number,
  height: number
): void {
  state.frameCount++;
  updateWarpStars(state, width, height);
  updateNebulae(state, width, height);
  updateCosmicDust(state, width, height);
}

export function drawSpaceBase(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number
): void {
  g.fillStyle(0x030812, 1);
  g.fillRect(0, 0, width, height);

  g.fillStyle(0x0a1628, 0.5);
  g.fillCircle(width / 2, height / 2, width * 0.5);
}

export function drawNebulae(
  g: Phaser.GameObjects.Graphics,
  state: SpaceBackgroundState
): void {
  for (const neb of state.nebulae) {
    const pulse = Math.sin(neb.pulsePhase) * 0.3 + 0.7;
    const alpha = neb.alpha * pulse;

    g.fillStyle(neb.color, alpha * 0.5);
    g.fillCircle(neb.x, neb.y, neb.radius * 1.3);

    g.fillStyle(neb.color, alpha);
    g.fillCircle(neb.x, neb.y, neb.radius * 0.8);

    g.fillStyle(neb.color, alpha * 1.5);
    g.fillCircle(neb.x, neb.y, neb.radius * 0.4);
  }
}

export function drawWarpStars(
  g: Phaser.GameObjects.Graphics,
  state: SpaceBackgroundState
): void {
  for (const star of state.warpStars) {
    const screenX = star.x / star.z * 200 + CENTER_X;
    const screenY = star.y / star.z * 200 + CENTER_Y;

    const depth = 1 - star.z / 400;
    const size = 0.5 + depth * 2.5;
    const alpha = star.brightness * (0.3 + depth * 0.7);

    const dx = screenX - star.prevX;
    const dy = screenY - star.prevY;
    const streakLen = Math.sqrt(dx * dx + dy * dy);

    if (streakLen > 1.5) {
      g.lineStyle(Math.max(0.5, size * 0.7), 0xccddff, alpha * 0.6);
      g.lineBetween(star.prevX, star.prevY, screenX, screenY);
    }

    g.fillStyle(0xeeeeff, alpha);
    g.fillCircle(screenX, screenY, size);

    if (size > 1.5) {
      g.fillStyle(0xffffff, alpha * 0.5);
      g.fillCircle(screenX, screenY, size * 0.5);
    }
  }
}

export function drawCosmicDust(
  g: Phaser.GameObjects.Graphics,
  state: SpaceBackgroundState
): void {
  for (const d of state.dust) {
    const twinkle = 0.6 + Math.sin(state.frameCount * 0.05 + d.x * 0.1) * 0.4;
    g.fillStyle(d.color, d.alpha * twinkle);
    g.fillCircle(d.x, d.y, d.size);
  }
}

export function drawSpaceBackground(
  g: Phaser.GameObjects.Graphics,
  state: SpaceBackgroundState,
  width: number,
  height: number
): void {
  drawSpaceBase(g, width, height);
  drawNebulae(g, state);
  drawWarpStars(g, state);
  drawCosmicDust(g, state);
}
