import Phaser from 'phaser';
import { SolidSegment } from './solidSnake';

export type FaceDirection = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'UP_LEFT' | 'UP_RIGHT' | 'DOWN_LEFT' | 'DOWN_RIGHT';

export interface FaceState {
  blinkTimer: number;
  isBlinking: boolean;
  mouthOpen: number;
  lastFoodEaten: number;
}

export function createFaceState(): FaceState {
  return {
    blinkTimer: 0,
    isBlinking: false,
    mouthOpen: 0,
    lastFoodEaten: 0,
  };
}

export function updateFaceState(
  state: FaceState,
  frameCount: number,
  foodEaten: number
): FaceState {
  const blinkTimer = state.blinkTimer + 1;
  const blinkCycle = blinkTimer > 120 + Math.sin(frameCount * 0.01) * 40;
  const isBlinking = blinkCycle && blinkTimer < 128 + Math.sin(frameCount * 0.01) * 40;
  const resetBlink = blinkTimer > 132 + Math.sin(frameCount * 0.01) * 40;

  const justAte = foodEaten > state.lastFoodEaten;
  const mouthTarget = justAte ? 1.0 : 0;
  const mouthOpen = state.mouthOpen + (mouthTarget - state.mouthOpen) * 0.15;

  return {
    blinkTimer: resetBlink ? 0 : blinkTimer,
    isBlinking,
    mouthOpen: Math.max(0, mouthOpen - 0.04),
    lastFoodEaten: foodEaten,
  };
}

const SQRT2_INV = 1 / Math.sqrt(2);

function directionOffset(dir: FaceDirection): { dx: number; dy: number } {
  switch (dir) {
    case 'UP': return { dx: 0, dy: -1 };
    case 'DOWN': return { dx: 0, dy: 1 };
    case 'LEFT': return { dx: -1, dy: 0 };
    case 'RIGHT': return { dx: 1, dy: 0 };
    case 'UP_LEFT': return { dx: -SQRT2_INV, dy: -SQRT2_INV };
    case 'UP_RIGHT': return { dx: SQRT2_INV, dy: -SQRT2_INV };
    case 'DOWN_LEFT': return { dx: -SQRT2_INV, dy: SQRT2_INV };
    case 'DOWN_RIGHT': return { dx: SQRT2_INV, dy: SQRT2_INV };
  }
}

export function computePupilOffset(dir: FaceDirection): { px: number; py: number } {
  const d = directionOffset(dir);
  return { px: d.dx * 0.25, py: d.dy * 0.25 };
}

export function drawSnakeFace(
  g: Phaser.GameObjects.Graphics,
  seg: SolidSegment,
  headSize: number,
  frameCount: number,
  direction: FaceDirection,
  faceState: FaceState
): void {
  drawLightningBolt(g, seg, headSize, frameCount);
  drawEyes(g, seg, headSize, frameCount, direction, faceState);
  drawMouth(g, seg, headSize, direction, faceState);
}

function drawLightningBolt(
  g: Phaser.GameObjects.Graphics,
  seg: SolidSegment,
  headSize: number,
  frameCount: number
): void {
  const boltH = headSize * 0.55;
  const boltW = headSize * 0.28;
  const boltX = seg.cx - boltW * 0.3;
  const boltY = seg.cy - headSize / 2 - boltH * 0.45;
  const bob = Math.sin(frameCount * 0.06) * 0.8;
  const pulse = 0.8 + Math.sin(frameCount * 0.1) * 0.2;

  g.fillStyle(0xffd700, 0.15 * pulse);
  g.fillCircle(boltX + boltW * 0.3, boltY + bob + boltH * 0.4, boltH * 0.5);

  const s = boltH / 5;
  const x0 = boltX;
  const y0 = boltY + bob;

  g.fillStyle(0xffd700, 0.9 * pulse);
  g.fillTriangle(
    x0 + boltW * 0.3, y0,
    x0 + boltW, y0 + s * 2,
    x0 + boltW * 0.15, y0 + s * 2
  );
  g.fillTriangle(
    x0 + boltW * 0.8, y0 + s * 1.7,
    x0 + boltW * 0.5, y0 + s * 3.5,
    x0, y0 + s * 1.7
  );
  g.fillTriangle(
    x0 + boltW * 0.45, y0 + s * 3,
    x0 + boltW * 0.2, y0 + s * 5,
    x0 - boltW * 0.05, y0 + s * 3
  );

  g.fillStyle(0xffee88, 0.5 * pulse);
  g.fillTriangle(
    x0 + boltW * 0.35, y0 + s * 0.3,
    x0 + boltW * 0.7, y0 + s * 1.8,
    x0 + boltW * 0.25, y0 + s * 1.8
  );
}

function drawEyes(
  g: Phaser.GameObjects.Graphics,
  seg: SolidSegment,
  headSize: number,
  frameCount: number,
  direction: FaceDirection,
  faceState: FaceState
): void {
  const eyeSpread = headSize * 0.22;
  const eyeY = seg.cy - headSize * 0.02;
  const eyeW = headSize * 0.22;
  const eyeH = faceState.isBlinking ? headSize * 0.03 : headSize * 0.18;

  g.fillStyle(0xffffff, 0.95);
  g.fillRect(seg.cx - eyeSpread - eyeW / 2, eyeY - eyeH / 2, eyeW, eyeH);
  g.fillRect(seg.cx + eyeSpread - eyeW / 2, eyeY - eyeH / 2, eyeW, eyeH);

  if (faceState.isBlinking) return;

  const pupilOffset = computePupilOffset(direction);
  const pupilW = eyeW * 0.5;
  const pupilH = eyeH * 0.65;
  const pupilShiftX = pupilOffset.px * eyeW * 0.4;
  const pupilShiftY = pupilOffset.py * eyeH * 0.3;

  g.fillStyle(0x112211, 0.95);
  g.fillRect(
    seg.cx - eyeSpread - pupilW / 2 + pupilShiftX,
    eyeY - pupilH / 2 + pupilShiftY,
    pupilW, pupilH
  );
  g.fillRect(
    seg.cx + eyeSpread - pupilW / 2 + pupilShiftX,
    eyeY - pupilH / 2 + pupilShiftY,
    pupilW, pupilH
  );

  const glintSize = eyeW * 0.2;
  const glintAlpha = 0.7 + Math.sin(frameCount * 0.12) * 0.2;
  g.fillStyle(0xffffff, glintAlpha);
  g.fillRect(
    seg.cx - eyeSpread - eyeW * 0.22,
    eyeY - eyeH * 0.28,
    glintSize, glintSize
  );
  g.fillRect(
    seg.cx + eyeSpread - eyeW * 0.22,
    eyeY - eyeH * 0.28,
    glintSize, glintSize
  );
}

function drawMouth(
  g: Phaser.GameObjects.Graphics,
  seg: SolidSegment,
  headSize: number,
  direction: FaceDirection,
  faceState: FaceState
): void {
  const mouthW = headSize * 0.3;
  const baseGap = headSize * 0.03;
  const openGap = headSize * 0.12 * faceState.mouthOpen;
  const mouthH = baseGap + openGap;
  const mouthY = seg.cy + headSize * 0.18;

  const d = directionOffset(direction);
  const mouthShiftX = d.dx * headSize * 0.08;

  g.fillStyle(0x331111, 0.8);
  g.fillRect(
    seg.cx - mouthW / 2 + mouthShiftX,
    mouthY - mouthH / 2,
    mouthW,
    mouthH
  );

  if (faceState.mouthOpen < 0.2) {
    const smileW = mouthW * 0.7;
    g.lineStyle(1, 0x88bb88, 0.5);
    g.lineBetween(
      seg.cx - smileW / 2 + mouthShiftX,
      mouthY + 1,
      seg.cx + smileW / 2 + mouthShiftX,
      mouthY + 1
    );
  }
}
