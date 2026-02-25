import Phaser from 'phaser';
import { FaceDirection } from './snakeFace';
import { getDirectionVectors } from './dragonHead';

const CROWN_GOLD = 0xffd700;
const CROWN_DARK_GOLD = 0xb8860b;
const GEM_RED = 0xe01040;
const GEM_GLOW = 0xff4466;
const GEM_WHITE = 0xffffff;

export interface CrownConfig {
  spikeCount: number;
  spikeHeight: number;
  bandHeight: number;
  gemRadius: number;
}

export function getDefaultCrownConfig(): CrownConfig {
  return {
    spikeCount: 3,
    spikeHeight: 0.35,
    bandHeight: 0.15,
    gemRadius: 0.08,
  };
}

export function computeCrownAlpha(frameCount: number): number {
  return 0.85 + Math.sin(frameCount * 0.06) * 0.1;
}

export function computeGemPulse(frameCount: number): number {
  return 0.7 + Math.sin(frameCount * 0.1) * 0.25;
}

export function computeGemGlintAlpha(frameCount: number): number {
  return 0.4 + Math.sin(frameCount * 0.18) * 0.35;
}

function drawCrownBand(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  headSize: number,
  direction: FaceDirection,
  alpha: number
): void {
  const v = getDirectionVectors(direction);
  const bandW = headSize * 0.7;
  const bandH = headSize * 0.12;
  const bandBack = headSize * 0.2;

  const bx = cx - v.fx * bandBack;
  const by = cy - v.fy * bandBack;

  g.fillStyle(CROWN_DARK_GOLD, alpha * 0.9);
  if (Math.abs(v.fx) > 0) {
    g.fillRect(bx - bandH / 2, by - bandW / 2 - 1, bandH + 2, bandW + 2);
    g.fillStyle(CROWN_GOLD, alpha);
    g.fillRect(bx - bandH / 2, by - bandW / 2, bandH, bandW);
  } else {
    g.fillRect(bx - bandW / 2 - 1, by - bandH / 2, bandW + 2, bandH + 2);
    g.fillStyle(CROWN_GOLD, alpha);
    g.fillRect(bx - bandW / 2, by - bandH / 2, bandW, bandH);
  }
}

function drawCrownSpikes(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  headSize: number,
  direction: FaceDirection,
  config: CrownConfig,
  alpha: number
): void {
  const v = getDirectionVectors(direction);
  const bandBack = headSize * 0.2;
  const bx = cx - v.fx * bandBack;
  const by = cy - v.fy * bandBack;
  const spikeH = headSize * config.spikeHeight;
  const totalSpread = headSize * 0.5;

  for (let i = 0; i < config.spikeCount; i++) {
    const fraction = config.spikeCount === 1
      ? 0
      : (i / (config.spikeCount - 1)) - 0.5;
    const offset = fraction * totalSpread;

    const baseL_x = bx + v.rx * (offset - headSize * 0.06);
    const baseL_y = by + v.ry * (offset - headSize * 0.06);
    const baseR_x = bx + v.rx * (offset + headSize * 0.06);
    const baseR_y = by + v.ry * (offset + headSize * 0.06);

    const tipX = bx + v.rx * offset - v.fx * spikeH;
    const tipY = by + v.ry * offset - v.fy * spikeH;

    g.fillStyle(CROWN_GOLD, alpha);
    g.fillTriangle(baseL_x, baseL_y, baseR_x, baseR_y, tipX, tipY);

    g.fillStyle(GEM_WHITE, alpha * 0.3);
    const midLx = (baseL_x + tipX) / 2;
    const midLy = (baseL_y + tipY) / 2;
    g.fillTriangle(
      baseL_x, baseL_y,
      (baseL_x + baseR_x) / 2, (baseL_y + baseR_y) / 2,
      midLx, midLy
    );
  }
}

function drawCrownGem(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  headSize: number,
  direction: FaceDirection,
  frameCount: number,
  config: CrownConfig
): void {
  const v = getDirectionVectors(direction);
  const bandBack = headSize * 0.2;
  const gx = cx - v.fx * bandBack;
  const gy = cy - v.fy * bandBack;
  const gemR = headSize * config.gemRadius;

  const glowPulse = computeGemPulse(frameCount);
  g.fillStyle(GEM_GLOW, 0.15 * glowPulse);
  g.fillCircle(gx, gy, gemR * 2.5);

  g.fillStyle(GEM_RED, 0.9);
  g.fillCircle(gx, gy, gemR);

  g.fillStyle(GEM_GLOW, 0.4);
  g.fillCircle(gx, gy, gemR * 0.7);

  const glintAlpha = computeGemGlintAlpha(frameCount);
  g.fillStyle(GEM_WHITE, glintAlpha);
  g.fillCircle(gx - gemR * 0.3, gy - gemR * 0.3, gemR * 0.3);
}

export function drawCrown(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  headSize: number,
  direction: FaceDirection,
  frameCount: number
): void {
  const config = getDefaultCrownConfig();
  const alpha = computeCrownAlpha(frameCount);

  drawCrownSpikes(g, cx, cy, headSize, direction, config, alpha);
  drawCrownBand(g, cx, cy, headSize, direction, alpha);
  drawCrownGem(g, cx, cy, headSize, direction, frameCount, config);
}
