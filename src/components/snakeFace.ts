import Phaser from 'phaser';
import { SolidSegment } from './solidSnake';

export type FaceDirection = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

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

function directionOffset(dir: FaceDirection): { dx: number; dy: number } {
  switch (dir) {
    case 'UP': return { dx: 0, dy: -1 };
    case 'DOWN': return { dx: 0, dy: 1 };
    case 'LEFT': return { dx: -1, dy: 0 };
    case 'RIGHT': return { dx: 1, dy: 0 };
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
  drawCrown(g, seg, headSize, frameCount);
  drawEyes(g, seg, headSize, frameCount, direction, faceState);
  drawMouth(g, seg, headSize, direction, faceState);
}

function drawCrown(
  g: Phaser.GameObjects.Graphics,
  seg: SolidSegment,
  headSize: number,
  frameCount: number
): void {
  const crownW = headSize * 0.7;
  const crownH = headSize * 0.22;
  const crownX = seg.cx - crownW / 2;
  const crownY = seg.cy - headSize / 2 - crownH * 0.7;
  const bob = Math.sin(frameCount * 0.06) * 1.0;

  g.fillStyle(0xffd700, 0.9);
  g.fillRect(crownX, crownY + bob, crownW, crownH);

  const peakCount = 3;
  const peakW = crownW / peakCount;
  const peakH = crownH * 0.6;
  for (let i = 0; i < peakCount; i++) {
    const px = crownX + peakW * i + peakW / 2;
    const py = crownY + bob - peakH;
    g.fillStyle(0xffd700, 0.9);
    g.fillTriangle(
      px - peakW * 0.35, crownY + bob,
      px + peakW * 0.35, crownY + bob,
      px, py
    );
  }

  g.fillStyle(0xffee88, 0.5);
  g.fillRect(crownX + 1, crownY + bob + 1, crownW - 2, crownH * 0.35);

  const gemSize = headSize * 0.06;
  const gemColors = [0xff4444, 0x44aaff, 0xff4444];
  for (let i = 0; i < 3; i++) {
    const gx = crownX + crownW * (0.2 + i * 0.3);
    const gy = crownY + bob + crownH * 0.55;
    g.fillStyle(gemColors[i], 0.85);
    g.fillRect(gx - gemSize / 2, gy - gemSize / 2, gemSize, gemSize);
  }
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

  const isHorizontal = direction === 'LEFT' || direction === 'RIGHT';
  const mouthShiftX = isHorizontal
    ? (direction === 'RIGHT' ? headSize * 0.08 : -headSize * 0.08)
    : 0;

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
