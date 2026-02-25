import Phaser from 'phaser';
import { SolidSegment } from './solidSnake';
import { FaceDirection, FaceState, computePupilOffset } from './snakeFace';

const DRAGON_GREEN_BASE = 0x2a7a3a;
const DRAGON_GREEN_LIGHT = 0x44aa55;
const DRAGON_GREEN_DARK = 0x1a5528;
const DRAGON_BELLY = 0xd4a840;
const DRAGON_HORN = 0x665533;
const DRAGON_HORN_TIP = 0xccbb88;
const DRAGON_EYE_YELLOW = 0xffcc00;
const DRAGON_PUPIL = 0x111100;
const DRAGON_NOSTRIL = 0x442200;

interface DirectionVectors {
  fx: number;
  fy: number;
  rx: number;
  ry: number;
}

export function getDirectionVectors(direction: FaceDirection): DirectionVectors {
  switch (direction) {
    case 'RIGHT': return { fx: 1, fy: 0, rx: 0, ry: 1 };
    case 'LEFT': return { fx: -1, fy: 0, rx: 0, ry: -1 };
    case 'UP': return { fx: 0, fy: -1, rx: 1, ry: 0 };
    case 'DOWN': return { fx: 0, fy: 1, rx: -1, ry: 0 };
  }
}

export function computeSnoutTip(
  cx: number,
  cy: number,
  headSize: number,
  direction: FaceDirection
): { tipX: number; tipY: number } {
  const v = getDirectionVectors(direction);
  const snoutLen = headSize * 0.55;
  return {
    tipX: cx + v.fx * snoutLen,
    tipY: cy + v.fy * snoutLen,
  };
}

export function computeHornPositions(
  cx: number,
  cy: number,
  headSize: number,
  direction: FaceDirection,
  frameCount: number
): { left: { bx: number; by: number; tx: number; ty: number }; right: { bx: number; by: number; tx: number; ty: number } } {
  const v = getDirectionVectors(direction);
  const hornSpread = headSize * 0.35;
  const hornBack = headSize * 0.2;
  const hornHeight = headSize * 0.55;
  const sway = Math.sin(frameCount * 0.04) * 0.5;

  const lbx = cx - v.fx * hornBack + v.rx * hornSpread;
  const lby = cy - v.fy * hornBack + v.ry * hornSpread;
  const ltx = lbx - v.fx * hornHeight * 0.3 + v.rx * hornHeight * 0.5;
  const lty = lby - v.fy * hornHeight * 0.3 + v.ry * hornHeight * 0.5 + sway;

  const rbx = cx - v.fx * hornBack - v.rx * hornSpread;
  const rby = cy - v.fy * hornBack - v.ry * hornSpread;
  const rtx = rbx - v.fx * hornHeight * 0.3 - v.rx * hornHeight * 0.5;
  const rty = rby - v.fy * hornHeight * 0.3 - v.ry * hornHeight * 0.5 + sway;

  return {
    left: { bx: lbx, by: lby, tx: ltx, ty: lty },
    right: { bx: rbx, by: rby, tx: rtx, ty: rty },
  };
}

function drawDragonHorns(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  headSize: number,
  direction: FaceDirection,
  frameCount: number
): void {
  const horns = computeHornPositions(cx, cy, headSize, direction, frameCount);

  const drawHorn = (h: { bx: number; by: number; tx: number; ty: number }) => {
    const v = getDirectionVectors(direction);
    const baseW = headSize * 0.12;

    g.fillStyle(DRAGON_HORN, 0.9);
    g.fillTriangle(
      h.bx + v.rx * baseW, h.by + v.ry * baseW,
      h.bx - v.rx * baseW, h.by - v.ry * baseW,
      h.tx, h.ty
    );

    g.fillStyle(DRAGON_HORN_TIP, 0.8);
    const midX = (h.bx + h.tx) / 2;
    const midY = (h.by + h.ty) / 2;
    g.fillTriangle(
      midX + v.rx * baseW * 0.4, midY + v.ry * baseW * 0.4,
      midX - v.rx * baseW * 0.4, midY - v.ry * baseW * 0.4,
      h.tx, h.ty
    );
  };

  drawHorn(horns.left);
  drawHorn(horns.right);
}

function drawDragonSnout(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  headSize: number,
  direction: FaceDirection,
  frameCount: number
): void {
  const v = getDirectionVectors(direction);
  const half = headSize / 2;
  const snoutLen = headSize * 0.55;
  const snoutW = headSize * 0.38;
  const breathe = 1.0 + Math.sin(frameCount * 0.08) * 0.015;

  const tipX = cx + v.fx * snoutLen * breathe;
  const tipY = cy + v.fy * snoutLen * breathe;

  g.fillStyle(DRAGON_GREEN_DARK, 0.85);
  g.fillTriangle(
    cx + v.rx * half * 0.7, cy + v.ry * half * 0.7,
    cx - v.rx * half * 0.7, cy - v.ry * half * 0.7,
    tipX, tipY
  );

  g.fillStyle(DRAGON_GREEN_BASE, 0.9);
  g.fillTriangle(
    cx + v.rx * snoutW, cy + v.ry * snoutW,
    cx - v.rx * snoutW, cy - v.ry * snoutW,
    tipX, tipY
  );

  g.fillStyle(DRAGON_GREEN_LIGHT, 0.35);
  g.fillTriangle(
    cx + v.rx * snoutW * 0.3, cy + v.ry * snoutW * 0.3,
    cx - v.rx * snoutW * 0.5, cy - v.ry * snoutW * 0.5,
    tipX + v.rx * 1, tipY + v.ry * 1
  );
}

function drawDragonNostrils(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  headSize: number,
  direction: FaceDirection,
  frameCount: number
): void {
  const v = getDirectionVectors(direction);
  const snoutLen = headSize * 0.42;
  const nostrilSpread = headSize * 0.12;
  const nostrilSize = headSize * 0.06;

  const baseX = cx + v.fx * snoutLen;
  const baseY = cy + v.fy * snoutLen;

  const pulse = 1.0 + Math.sin(frameCount * 0.12) * 0.15;

  g.fillStyle(DRAGON_NOSTRIL, 0.8);
  g.fillCircle(
    baseX + v.rx * nostrilSpread,
    baseY + v.ry * nostrilSpread,
    nostrilSize * pulse
  );
  g.fillCircle(
    baseX - v.rx * nostrilSpread,
    baseY - v.ry * nostrilSpread,
    nostrilSize * pulse
  );

  const smokeAlpha = 0.08 + Math.sin(frameCount * 0.06) * 0.04;
  g.fillStyle(0x888888, smokeAlpha);
  g.fillCircle(
    baseX + v.fx * headSize * 0.12 + v.rx * nostrilSpread,
    baseY + v.fy * headSize * 0.12 + v.ry * nostrilSpread,
    nostrilSize * 1.5
  );
  g.fillCircle(
    baseX + v.fx * headSize * 0.12 - v.rx * nostrilSpread,
    baseY + v.fy * headSize * 0.12 - v.ry * nostrilSpread,
    nostrilSize * 1.5
  );
}

function drawDragonEyes(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  headSize: number,
  direction: FaceDirection,
  frameCount: number,
  faceState: FaceState
): void {
  const v = getDirectionVectors(direction);
  const eyeSpread = headSize * 0.23;
  const eyeForward = headSize * 0.05;
  const eyeW = headSize * 0.2;
  const eyeH = faceState.isBlinking ? headSize * 0.03 : headSize * 0.18;

  const lx = cx + v.fx * eyeForward + v.rx * eyeSpread;
  const ly = cy + v.fy * eyeForward + v.ry * eyeSpread;
  const rx = cx + v.fx * eyeForward - v.rx * eyeSpread;
  const ry = cy + v.fy * eyeForward - v.ry * eyeSpread;

  const glowPulse = 0.15 + Math.sin(frameCount * 0.08) * 0.08;
  g.fillStyle(DRAGON_EYE_YELLOW, glowPulse);
  g.fillCircle(lx, ly, eyeW * 0.8);
  g.fillCircle(rx, ry, eyeW * 0.8);

  g.fillStyle(DRAGON_EYE_YELLOW, 0.95);
  g.fillRect(lx - eyeW / 2, ly - eyeH / 2, eyeW, eyeH);
  g.fillRect(rx - eyeW / 2, ry - eyeH / 2, eyeW, eyeH);

  if (faceState.isBlinking) return;

  const pupil = computePupilOffset(direction);
  const slitW = eyeW * 0.2;
  const slitH = eyeH * 0.9;
  const shiftX = pupil.px * eyeW * 0.3;
  const shiftY = pupil.py * eyeH * 0.25;

  g.fillStyle(DRAGON_PUPIL, 0.95);
  g.fillRect(lx - slitW / 2 + shiftX, ly - slitH / 2 + shiftY, slitW, slitH);
  g.fillRect(rx - slitW / 2 + shiftX, ry - slitH / 2 + shiftY, slitW, slitH);

  const glintSize = eyeW * 0.15;
  const glintAlpha = 0.7 + Math.sin(frameCount * 0.14) * 0.25;
  g.fillStyle(0xffffff, glintAlpha);
  g.fillRect(lx - eyeW * 0.25, ly - eyeH * 0.3, glintSize, glintSize);
  g.fillRect(rx - eyeW * 0.25, ry - eyeH * 0.3, glintSize, glintSize);
}

function drawDragonBrow(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  headSize: number,
  direction: FaceDirection
): void {
  const v = getDirectionVectors(direction);
  const eyeSpread = headSize * 0.26;
  const browForward = headSize * 0.12;
  const browLen = headSize * 0.18;

  const lx = cx + v.fx * browForward + v.rx * eyeSpread;
  const ly = cy + v.fy * browForward + v.ry * eyeSpread;
  const rx = cx + v.fx * browForward - v.rx * eyeSpread;
  const ry = cy + v.fy * browForward - v.ry * eyeSpread;

  g.lineStyle(2, DRAGON_GREEN_DARK, 0.7);
  g.lineBetween(
    lx - v.rx * browLen * 0.3, ly - v.ry * browLen * 0.3,
    lx + v.rx * browLen, ly + v.ry * browLen
  );
  g.lineBetween(
    rx + v.rx * browLen * 0.3, ry + v.ry * browLen * 0.3,
    rx - v.rx * browLen, ry - v.ry * browLen
  );
}

function drawScalePattern(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  headSize: number,
  frameCount: number
): void {
  const scaleSize = headSize * 0.1;
  const shimmer = 0.12 + Math.sin(frameCount * 0.05) * 0.06;

  for (let row = -1; row <= 1; row++) {
    for (let col = -1; col <= 1; col++) {
      if (row === 0 && col === 0) continue;
      const sx = cx + col * scaleSize * 1.8;
      const sy = cy + row * scaleSize * 1.8;
      g.fillStyle(DRAGON_GREEN_LIGHT, shimmer);
      g.fillRect(sx - scaleSize * 0.3, sy - scaleSize * 0.3, scaleSize * 0.6, scaleSize * 0.6);
    }
  }
}

function drawDragonMouth(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  headSize: number,
  direction: FaceDirection,
  faceState: FaceState
): void {
  const v = getDirectionVectors(direction);
  const mouthForward = headSize * 0.32;
  const mouthW = headSize * 0.24;
  const openAmount = faceState.mouthOpen;

  const mx = cx + v.fx * mouthForward;
  const my = cy + v.fy * mouthForward;

  if (openAmount > 0.15) {
    const gapH = headSize * 0.08 * openAmount;
    g.fillStyle(0x330000, 0.8);
    g.fillRect(mx - mouthW / 2, my - gapH / 2, mouthW, gapH);

    const fangSize = headSize * 0.06;
    g.fillStyle(0xeeeedd, 0.9);
    g.fillTriangle(
      mx - mouthW * 0.3, my - gapH / 2,
      mx - mouthW * 0.3 - fangSize * 0.3, my + fangSize,
      mx - mouthW * 0.3 + fangSize * 0.3, my + fangSize
    );
    g.fillTriangle(
      mx + mouthW * 0.3, my - gapH / 2,
      mx + mouthW * 0.3 - fangSize * 0.3, my + fangSize,
      mx + mouthW * 0.3 + fangSize * 0.3, my + fangSize
    );
  } else {
    g.lineStyle(1, DRAGON_GREEN_DARK, 0.5);
    g.lineBetween(
      mx - mouthW / 2, my,
      mx + mouthW / 2, my
    );
  }
}

function drawHugeFangs(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  headSize: number,
  direction: FaceDirection,
  biteAngle: number
): void {
  const v = getDirectionVectors(direction);
  const jawForward = headSize * 0.45;
  const jawSpread = headSize * 0.35;
  const fangLen = headSize * 0.4 + Math.abs(biteAngle) * headSize * 0.15;
  const jawOpen = biteAngle * headSize * 0.3;

  const jawCx = cx + v.fx * jawForward;
  const jawCy = cy + v.fy * jawForward;

  const upperY = jawCy - v.ry * jawOpen - v.rx * jawOpen;
  const upperX = jawCx - v.rx * jawOpen + v.ry * jawOpen;
  const lowerY = jawCy + v.ry * jawOpen + v.rx * jawOpen;
  const lowerX = jawCx + v.rx * jawOpen - v.ry * jawOpen;

  for (let f = -1; f <= 1; f += 2) {
    const fangBaseX = upperX + v.rx * jawSpread * 0.5 * f;
    const fangBaseY = upperY + v.ry * jawSpread * 0.5 * f;
    const fangTipX = fangBaseX + v.fx * fangLen * 0.5 + v.ry * fangLen * 0.3 * f;
    const fangTipY = fangBaseY + v.fy * fangLen * 0.5 + v.rx * fangLen * 0.3 * f;

    g.fillStyle(0xffffff, 0.95);
    g.fillTriangle(
      fangBaseX + v.rx * headSize * 0.06 * f, fangBaseY + v.ry * headSize * 0.06 * f,
      fangBaseX - v.rx * headSize * 0.03 * f, fangBaseY - v.ry * headSize * 0.03 * f,
      fangTipX, fangTipY
    );

    g.fillStyle(0xffeecc, 0.6);
    g.fillTriangle(
      fangBaseX, fangBaseY,
      fangBaseX - v.rx * headSize * 0.02 * f, fangBaseY - v.ry * headSize * 0.02 * f,
      fangTipX, fangTipY
    );
  }

  for (let f = -1; f <= 1; f += 2) {
    const fangBaseX = lowerX + v.rx * jawSpread * 0.35 * f;
    const fangBaseY = lowerY + v.ry * jawSpread * 0.35 * f;
    const fangTipX = fangBaseX + v.fx * fangLen * 0.35 - v.ry * fangLen * 0.2 * f;
    const fangTipY = fangBaseY + v.fy * fangLen * 0.35 - v.rx * fangLen * 0.2 * f;

    g.fillStyle(0xeeddcc, 0.9);
    g.fillTriangle(
      fangBaseX + v.rx * headSize * 0.04 * f, fangBaseY + v.ry * headSize * 0.04 * f,
      fangBaseX - v.rx * headSize * 0.02 * f, fangBaseY - v.ry * headSize * 0.02 * f,
      fangTipX, fangTipY
    );
  }
}

function drawBitingJaw(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  headSize: number,
  direction: FaceDirection,
  biteAngle: number,
  frameCount: number
): void {
  const v = getDirectionVectors(direction);
  const jawForward = headSize * 0.38;
  const jawW = headSize * 0.5;
  const jawOpen = Math.abs(biteAngle) * headSize * 0.3;

  const jawCx = cx + v.fx * jawForward;
  const jawCy = cy + v.fy * jawForward;

  g.fillStyle(0x882222, 0.7 + Math.abs(biteAngle) * 0.3);
  const mouthW = jawW * (0.8 + Math.abs(biteAngle) * 0.4);
  const mouthH = jawOpen * 2 + headSize * 0.06;
  if (Math.abs(v.fx) > 0) {
    g.fillRect(jawCx - mouthH / 2, jawCy - mouthW / 2, mouthH, mouthW);
  } else {
    g.fillRect(jawCx - mouthW / 2, jawCy - mouthH / 2, mouthW, mouthH);
  }

  const tongueLen = headSize * 0.3 * (0.5 + Math.abs(biteAngle));
  const tongueWave = Math.sin(frameCount * 0.2) * headSize * 0.05;
  const tongueTipX = jawCx + v.fx * tongueLen;
  const tongueTipY = jawCy + v.fy * tongueLen + tongueWave;
  g.fillStyle(0xcc3344, 0.8);
  g.fillTriangle(
    jawCx + v.rx * headSize * 0.06, jawCy + v.ry * headSize * 0.06,
    jawCx - v.rx * headSize * 0.06, jawCy - v.ry * headSize * 0.06,
    tongueTipX, tongueTipY
  );

  drawHugeFangs(g, cx, cy, headSize, direction, biteAngle);
}

export function drawDragonHead(
  g: Phaser.GameObjects.Graphics,
  seg: SolidSegment,
  frameCount: number,
  direction: FaceDirection,
  faceState: FaceState,
  biteAngle?: number
): void {
  const breathe = 1.0 + Math.sin(frameCount * 0.08) * 0.02;
  const headSize = seg.size * breathe;
  const half = headSize / 2;

  g.fillStyle(0xff6600, 0.08);
  g.fillCircle(seg.cx, seg.cy, half + 6);

  g.fillStyle(0xff4400, 0.04);
  g.fillCircle(seg.cx, seg.cy, half + 10);

  drawDragonHorns(g, seg.cx, seg.cy, headSize, direction, frameCount);

  g.fillStyle(DRAGON_GREEN_DARK, 0.95);
  g.fillCircle(seg.cx, seg.cy, half + 1);

  g.fillStyle(DRAGON_GREEN_BASE, 0.95);
  g.fillCircle(seg.cx, seg.cy, half - 1);

  const v = getDirectionVectors(direction);
  g.fillStyle(DRAGON_BELLY, 0.2);
  g.fillCircle(seg.cx - v.fx * headSize * 0.08, seg.cy - v.fy * headSize * 0.08, half * 0.6);

  drawScalePattern(g, seg.cx, seg.cy, headSize, frameCount);

  if (biteAngle !== undefined) {
    drawBitingJaw(g, seg.cx, seg.cy, headSize, direction, biteAngle, frameCount);
  } else {
    drawDragonSnout(g, seg.cx, seg.cy, headSize, direction, frameCount);
    drawDragonMouth(g, seg.cx, seg.cy, headSize, direction, faceState);
  }

  drawDragonBrow(g, seg.cx, seg.cy, headSize, direction);
  drawDragonEyes(g, seg.cx, seg.cy, headSize, direction, frameCount, faceState);
  drawDragonNostrils(g, seg.cx, seg.cy, headSize, direction, frameCount);
}
