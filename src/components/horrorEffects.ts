import Phaser from 'phaser';
import { heartBeatScale } from './cleanEffects';

export interface HorrorVein {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  thickness: number;
  pulseOffset: number;
  branches: { x1: number; y1: number; x2: number; y2: number; thickness: number }[];
}

export interface ShadowTendril {
  baseX: number;
  baseY: number;
  angle: number;
  length: number;
  maxLength: number;
  segments: number;
  wobblePhase: number;
  wobbleSpeed: number;
  alpha: number;
  edge: 'top' | 'bottom' | 'left' | 'right';
}

export interface IchorDrip {
  x: number;
  y: number;
  size: number;
  alpha: number;
  age: number;
  wobblePhase: number;
}

export interface HorrorEffectsState {
  veins: HorrorVein[];
  tendrils: ShadowTendril[];
  ichorDrips: IchorDrip[];
  glitchTimer: number;
  glitchActive: boolean;
  glitchIntensity: number;
}

const MAX_VEINS = 12;
const MAX_TENDRILS = 8;
const MAX_ICHOR_DRIPS = 30;
const ICHOR_DRIP_FADE_RATE = 0.004;
const TENDRIL_SEGMENTS = 6;
const VEIN_COLOR = 0x3a0000;
const VEIN_GLOW_COLOR = 0x660000;
const TENDRIL_COLOR = 0x0a0008;
const ICHOR_COLOR = 0x1a3a0a;
const ICHOR_DARK = 0x0d1f05;

export function createHorrorEffectsState(): HorrorEffectsState {
  return {
    veins: [],
    tendrils: [],
    ichorDrips: [],
    glitchTimer: 0,
    glitchActive: false,
    glitchIntensity: 0,
  };
}

export function generateVeinBranches(
  x1: number, y1: number, x2: number, y2: number, thickness: number
): { x1: number; y1: number; x2: number; y2: number; thickness: number }[] {
  const branches: { x1: number; y1: number; x2: number; y2: number; thickness: number }[] = [];
  const count = 1 + Math.floor(Math.random() * 2);
  for (let i = 0; i < count; i++) {
    const t = 0.3 + Math.random() * 0.5;
    const bx = x1 + (x2 - x1) * t;
    const by = y1 + (y2 - y1) * t;
    const angle = Math.atan2(y2 - y1, x2 - x1) + (Math.random() - 0.5) * 1.2;
    const len = 15 + Math.random() * 30;
    branches.push({
      x1: bx,
      y1: by,
      x2: bx + Math.cos(angle) * len,
      y2: by + Math.sin(angle) * len,
      thickness: thickness * 0.5,
    });
  }
  return branches;
}

export function initVeins(state: HorrorEffectsState, width: number, height: number): void {
  state.veins = [];
  for (let i = 0; i < MAX_VEINS; i++) {
    const edge = Math.floor(Math.random() * 4);
    let x1: number, y1: number, x2: number, y2: number;

    if (edge === 0) {
      x1 = Math.random() * width; y1 = 0;
      x2 = x1 + (Math.random() - 0.5) * 80; y2 = 30 + Math.random() * 60;
    } else if (edge === 1) {
      x1 = Math.random() * width; y1 = height;
      x2 = x1 + (Math.random() - 0.5) * 80; y2 = height - 30 - Math.random() * 60;
    } else if (edge === 2) {
      x1 = 0; y1 = Math.random() * height;
      x2 = 30 + Math.random() * 60; y2 = y1 + (Math.random() - 0.5) * 80;
    } else {
      x1 = width; y1 = Math.random() * height;
      x2 = width - 30 - Math.random() * 60; y2 = y1 + (Math.random() - 0.5) * 80;
    }

    const thickness = 1 + Math.random() * 2;
    state.veins.push({
      x1, y1, x2, y2,
      thickness,
      pulseOffset: Math.random() * Math.PI * 2,
      branches: generateVeinBranches(x1, y1, x2, y2, thickness),
    });
  }
}

export function initTendrils(state: HorrorEffectsState, width: number, height: number): void {
  state.tendrils = [];
  const edges: ('top' | 'bottom' | 'left' | 'right')[] = ['top', 'bottom', 'left', 'right'];
  const tendrilsPerEdge = MAX_TENDRILS / 4;

  for (const edge of edges) {
    for (let i = 0; i < tendrilsPerEdge; i++) {
      let baseX: number, baseY: number, angle: number;
      if (edge === 'top') {
        baseX = (width / (tendrilsPerEdge + 1)) * (i + 1); baseY = 0;
        angle = Math.PI / 2 + (Math.random() - 0.5) * 0.4;
      } else if (edge === 'bottom') {
        baseX = (width / (tendrilsPerEdge + 1)) * (i + 1); baseY = height;
        angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.4;
      } else if (edge === 'left') {
        baseX = 0; baseY = (height / (tendrilsPerEdge + 1)) * (i + 1);
        angle = 0 + (Math.random() - 0.5) * 0.4;
      } else {
        baseX = width; baseY = (height / (tendrilsPerEdge + 1)) * (i + 1);
        angle = Math.PI + (Math.random() - 0.5) * 0.4;
      }

      state.tendrils.push({
        baseX, baseY, angle,
        length: 0,
        maxLength: 40 + Math.random() * 50,
        segments: TENDRIL_SEGMENTS,
        wobblePhase: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.02 + Math.random() * 0.02,
        alpha: 0.15 + Math.random() * 0.15,
        edge,
      });
    }
  }
}

export function updateTendrils(state: HorrorEffectsState, frameCount: number): void {
  const beatScale = heartBeatScale(frameCount);
  for (const tendril of state.tendrils) {
    tendril.wobblePhase += tendril.wobbleSpeed;
    const targetLength = tendril.maxLength * (0.6 + 0.4 * beatScale);
    tendril.length += (targetLength - tendril.length) * 0.05;
  }
}

export function updateGlitch(state: HorrorEffectsState): void {
  state.glitchTimer++;
  if (!state.glitchActive && Math.random() < 0.003) {
    state.glitchActive = true;
    state.glitchIntensity = 0.3 + Math.random() * 0.4;
    state.glitchTimer = 0;
  }
  if (state.glitchActive) {
    state.glitchIntensity *= 0.92;
    if (state.glitchIntensity < 0.02) {
      state.glitchActive = false;
      state.glitchIntensity = 0;
    }
  }
}

export function spawnIchorDrip(state: HorrorEffectsState, x: number, y: number): void {
  if (state.ichorDrips.length >= MAX_ICHOR_DRIPS) {
    const oldest = state.ichorDrips.reduce((min, d, i, arr) =>
      d.alpha < arr[min].alpha ? i : min, 0);
    state.ichorDrips.splice(oldest, 1);
  }
  state.ichorDrips.push({
    x: x + (Math.random() - 0.5) * 6,
    y: y + (Math.random() - 0.5) * 6,
    size: 2 + Math.random() * 3,
    alpha: 0.5 + Math.random() * 0.3,
    age: 0,
    wobblePhase: Math.random() * Math.PI * 2,
  });
}

export function updateIchorDrips(state: HorrorEffectsState): void {
  for (let i = state.ichorDrips.length - 1; i >= 0; i--) {
    const drip = state.ichorDrips[i];
    drip.age++;
    drip.alpha -= ICHOR_DRIP_FADE_RATE;
    drip.wobblePhase += 0.02;
    drip.size *= 1.001;
    if (drip.alpha <= 0) {
      state.ichorDrips.splice(i, 1);
    }
  }
}

export function drawVeins(
  g: Phaser.GameObjects.Graphics, state: HorrorEffectsState, frameCount: number
): void {
  for (const vein of state.veins) {
    const pulse = 0.4 + 0.6 * heartBeatScale(frameCount + Math.floor(vein.pulseOffset * 10));
    const alpha = 0.15 * pulse;

    g.lineStyle(vein.thickness * 2 * pulse, VEIN_GLOW_COLOR, alpha * 0.4);
    g.lineBetween(vein.x1, vein.y1, vein.x2, vein.y2);

    g.lineStyle(vein.thickness * pulse, VEIN_COLOR, alpha);
    g.lineBetween(vein.x1, vein.y1, vein.x2, vein.y2);

    for (const branch of vein.branches) {
      g.lineStyle(branch.thickness * pulse, VEIN_COLOR, alpha * 0.7);
      g.lineBetween(branch.x1, branch.y1, branch.x2, branch.y2);
    }
  }
}

export function computeTendrilPoints(
  tendril: ShadowTendril
): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  const segLen = tendril.length / tendril.segments;

  for (let s = 0; s <= tendril.segments; s++) {
    const t = s / tendril.segments;
    const wobble = Math.sin(tendril.wobblePhase + t * 4) * 8 * t;
    const perpAngle = tendril.angle + Math.PI / 2;
    const dist = segLen * s;
    const px = tendril.baseX + Math.cos(tendril.angle) * dist + Math.cos(perpAngle) * wobble;
    const py = tendril.baseY + Math.sin(tendril.angle) * dist + Math.sin(perpAngle) * wobble;
    points.push({ x: px, y: py });
  }
  return points;
}

export function drawTendrils(
  g: Phaser.GameObjects.Graphics, state: HorrorEffectsState
): void {
  for (const tendril of state.tendrils) {
    if (tendril.length < 2) continue;
    const points = computeTendrilPoints(tendril);

    for (let s = 0; s < points.length - 1; s++) {
      const t = s / (points.length - 1);
      const thickness = 4 * (1 - t * 0.7);
      const alpha = tendril.alpha * (1 - t * 0.6);

      g.lineStyle(thickness + 2, TENDRIL_COLOR, alpha * 0.3);
      g.lineBetween(points[s].x, points[s].y, points[s + 1].x, points[s + 1].y);

      g.lineStyle(thickness, TENDRIL_COLOR, alpha);
      g.lineBetween(points[s].x, points[s].y, points[s + 1].x, points[s + 1].y);
    }

    const tip = points[points.length - 1];
    const tipAlpha = tendril.alpha * 0.3;
    g.fillStyle(TENDRIL_COLOR, tipAlpha);
    g.fillCircle(tip.x, tip.y, 3);
  }
}

export function drawIchorDrips(
  g: Phaser.GameObjects.Graphics, state: HorrorEffectsState
): void {
  for (const drip of state.ichorDrips) {
    const wobble = Math.sin(drip.wobblePhase) * 0.5;
    const effectiveSize = drip.size + wobble;

    g.fillStyle(ICHOR_DARK, drip.alpha * 0.3);
    g.fillCircle(drip.x, drip.y, effectiveSize * 1.8);

    g.fillStyle(ICHOR_COLOR, drip.alpha * 0.6);
    g.fillCircle(drip.x, drip.y, effectiveSize);

    g.fillStyle(0x2a5a12, drip.alpha * 0.3);
    g.fillCircle(drip.x - effectiveSize * 0.2, drip.y - effectiveSize * 0.2, effectiveSize * 0.3);
  }
}

export function drawGlitchGrid(
  g: Phaser.GameObjects.Graphics,
  state: HorrorEffectsState,
  width: number,
  height: number,
  cellSize: number,
  gridSize: number,
  frameCount: number
): void {
  if (!state.glitchActive) return;

  const intensity = state.glitchIntensity;
  const numGlitchLines = Math.floor(intensity * 6);

  for (let i = 0; i < numGlitchLines; i++) {
    const isHorizontal = Math.random() > 0.5;
    const pos = Math.floor(Math.random() * gridSize) * cellSize;
    const offset = (Math.random() - 0.5) * intensity * 10;
    const glitchAlpha = intensity * 0.4;

    g.lineStyle(2, 0x440000, glitchAlpha);
    if (isHorizontal) {
      g.lineBetween(0, pos + offset, width, pos + offset);
    } else {
      g.lineBetween(pos + offset, 0, pos + offset, height);
    }
  }

  const scanY = (frameCount * 3 + Math.random() * 10) % height;
  g.fillStyle(0x330000, intensity * 0.15);
  g.fillRect(0, scanY, width, 2);

  if (intensity > 0.3) {
    const blockX = Math.random() * width;
    const blockY = Math.random() * height;
    const blockW = 10 + Math.random() * 30;
    const blockH = 2 + Math.random() * 8;
    g.fillStyle(0x220000, intensity * 0.2);
    g.fillRect(blockX, blockY, blockW, blockH);
  }
}
