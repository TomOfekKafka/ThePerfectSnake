import Phaser from 'phaser';
import { SolidSegment } from './solidSnake';
import { FaceDirection, FaceState, computePupilOffset } from './snakeFace';
import { drawCrown } from './crownHead';

const BASE_GREEN = 0x2e8b45;
const LIGHT_GREEN = 0x50c070;
const DARK_GREEN = 0x1a5a2a;
const RIM_GREEN = 0x134420;
const BELLY_GOLD = 0xd4b050;
const HORN_BASE = 0x6b5540;
const HORN_TIP = 0xccbb88;
const EYE_WHITE = 0xf0eecc;
const IRIS_AMBER = 0xffaa00;
const IRIS_DARK = 0xcc7700;
const PUPIL_BLACK = 0x0a0800;
const NOSTRIL_DARK = 0x3a2200;

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
  const snoutLen = headSize * 0.42;
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
  const hornSpread = headSize * 0.28;
  const hornBack = headSize * 0.18;
  const hornHeight = headSize * 0.32;
  const sway = Math.sin(frameCount * 0.04) * 0.3;

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

function drawHorns(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  headSize: number,
  direction: FaceDirection,
  frameCount: number
): void {
  const horns = computeHornPositions(cx, cy, headSize, direction, frameCount);
  const v = getDirectionVectors(direction);

  const drawHorn = (h: { bx: number; by: number; tx: number; ty: number }) => {
    const baseW = headSize * 0.13;

    g.fillStyle(HORN_BASE, 0.92);
    g.fillTriangle(
      h.bx + v.rx * baseW, h.by + v.ry * baseW,
      h.bx - v.rx * baseW, h.by - v.ry * baseW,
      h.tx, h.ty
    );

    g.fillStyle(HORN_TIP, 0.75);
    const midX = (h.bx + h.tx) * 0.45 + h.tx * 0.1;
    const midY = (h.by + h.ty) * 0.45 + h.ty * 0.1;
    g.fillTriangle(
      midX + v.rx * baseW * 0.35, midY + v.ry * baseW * 0.35,
      midX - v.rx * baseW * 0.35, midY - v.ry * baseW * 0.35,
      h.tx, h.ty
    );

    g.fillStyle(0xffffff, 0.15);
    g.fillCircle(h.tx, h.ty, baseW * 0.2);
  };

  drawHorn(horns.left);
  drawHorn(horns.right);
}

function drawHeadShape(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  headSize: number,
  direction: FaceDirection,
  frameCount: number
): void {
  const v = getDirectionVectors(direction);
  const half = headSize / 2;

  g.fillStyle(0xffd700, 0.05);
  g.fillCircle(cx, cy, half + 5);
  g.fillStyle(0xffd700, 0.025);
  g.fillCircle(cx, cy, half + 9);

  g.fillStyle(RIM_GREEN, 0.95);
  g.fillCircle(cx, cy, half + 1.5);

  g.fillStyle(DARK_GREEN, 0.95);
  g.fillCircle(cx, cy, half);

  g.fillStyle(BASE_GREEN, 0.95);
  g.fillCircle(cx, cy, half - 1.5);

  const hlX = cx - v.fx * headSize * 0.06 - v.rx * headSize * 0.08;
  const hlY = cy - v.fy * headSize * 0.06 - v.ry * headSize * 0.08;
  g.fillStyle(LIGHT_GREEN, 0.25);
  g.fillCircle(hlX, hlY, half * 0.55);

  g.fillStyle(0xffffff, 0.06);
  g.fillCircle(hlX, hlY, half * 0.3);

  const bellyX = cx - v.fx * headSize * 0.1;
  const bellyY = cy - v.fy * headSize * 0.1;
  g.fillStyle(BELLY_GOLD, 0.15);
  g.fillCircle(bellyX, bellyY, half * 0.55);

  drawScaleShimmer(g, cx, cy, headSize, direction, frameCount);
}

function drawScaleShimmer(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  headSize: number,
  direction: FaceDirection,
  frameCount: number
): void {
  const v = getDirectionVectors(direction);
  const half = headSize / 2;
  const scaleR = headSize * 0.09;

  for (let ring = 0; ring < 2; ring++) {
    const ringDist = half * (0.3 + ring * 0.28);
    const count = 4 + ring * 2;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + frameCount * 0.008 + ring * 0.5;
      const sx = cx - v.fx * headSize * 0.05 + Math.cos(angle) * ringDist;
      const sy = cy - v.fy * headSize * 0.05 + Math.sin(angle) * ringDist;

      const dist = Math.sqrt((sx - cx) * (sx - cx) + (sy - cy) * (sy - cy));
      if (dist > half - 2) continue;

      const shimmer = 0.06 + Math.sin(frameCount * 0.04 + i * 1.2 + ring * 2.0) * 0.04;
      g.fillStyle(LIGHT_GREEN, shimmer);
      g.fillCircle(sx, sy, scaleR);
      g.fillStyle(DARK_GREEN, shimmer * 0.6);
      g.fillCircle(sx, sy + scaleR * 0.3, scaleR * 0.7);
    }
  }
}

function drawSnout(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  headSize: number,
  direction: FaceDirection,
  frameCount: number
): void {
  const v = getDirectionVectors(direction);
  const breathe = 1.0 + Math.sin(frameCount * 0.08) * 0.012;
  const snoutLen = headSize * 0.38 * breathe;
  const snoutW = headSize * 0.28;

  const tipX = cx + v.fx * snoutLen;
  const tipY = cy + v.fy * snoutLen;

  g.fillStyle(DARK_GREEN, 0.85);
  g.fillCircle(
    cx + v.fx * headSize * 0.12,
    cy + v.fy * headSize * 0.12,
    snoutW * 0.75
  );

  g.fillStyle(BASE_GREEN, 0.9);
  g.fillCircle(
    cx + v.fx * headSize * 0.15,
    cy + v.fy * headSize * 0.15,
    snoutW * 0.65
  );

  g.fillStyle(BASE_GREEN, 0.88);
  g.fillCircle(tipX, tipY, snoutW * 0.42);

  g.fillStyle(DARK_GREEN, 0.3);
  g.fillCircle(tipX, tipY, snoutW * 0.38);

  g.fillStyle(LIGHT_GREEN, 0.18);
  g.fillCircle(
    cx + v.fx * headSize * 0.12 - v.rx * snoutW * 0.15,
    cy + v.fy * headSize * 0.12 - v.ry * snoutW * 0.15,
    snoutW * 0.35
  );

  g.fillStyle(BELLY_GOLD, 0.1);
  g.fillCircle(
    tipX - v.fx * snoutW * 0.1,
    tipY - v.fy * snoutW * 0.1,
    snoutW * 0.3
  );
}

function drawNostrils(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  headSize: number,
  direction: FaceDirection,
  frameCount: number
): void {
  const v = getDirectionVectors(direction);
  const snoutLen = headSize * 0.38;
  const nostrilSpread = headSize * 0.1;
  const nostrilSize = headSize * 0.045;

  const baseX = cx + v.fx * snoutLen;
  const baseY = cy + v.fy * snoutLen;

  const pulse = 1.0 + Math.sin(frameCount * 0.12) * 0.12;

  g.fillStyle(NOSTRIL_DARK, 0.85);
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

  g.fillStyle(0x000000, 0.4);
  g.fillCircle(
    baseX + v.rx * nostrilSpread,
    baseY + v.ry * nostrilSpread,
    nostrilSize * pulse * 0.55
  );
  g.fillCircle(
    baseX - v.rx * nostrilSpread,
    baseY - v.ry * nostrilSpread,
    nostrilSize * pulse * 0.55
  );

  const smokeAlpha = 0.06 + Math.sin(frameCount * 0.06) * 0.03;
  g.fillStyle(0xaaaaaa, smokeAlpha);
  g.fillCircle(
    baseX + v.fx * headSize * 0.08 + v.rx * nostrilSpread * 0.8,
    baseY + v.fy * headSize * 0.08 + v.ry * nostrilSpread * 0.8,
    nostrilSize * 1.8
  );
  g.fillCircle(
    baseX + v.fx * headSize * 0.1 - v.rx * nostrilSpread * 0.8,
    baseY + v.fy * headSize * 0.1 - v.ry * nostrilSpread * 0.8,
    nostrilSize * 1.6
  );
}

function drawEye(
  g: Phaser.GameObjects.Graphics,
  ex: number,
  ey: number,
  eyeR: number,
  frameCount: number,
  faceState: FaceState,
  direction: FaceDirection,
  isLeft: boolean
): void {
  if (faceState.isBlinking) {
    g.fillStyle(DARK_GREEN, 0.8);
    g.fillRect(ex - eyeR, ey - eyeR * 0.12, eyeR * 2, eyeR * 0.24);
    g.fillStyle(LIGHT_GREEN, 0.3);
    g.fillRect(ex - eyeR * 0.8, ey - eyeR * 0.06, eyeR * 1.6, eyeR * 0.12);
    return;
  }

  const glowPulse = 0.12 + Math.sin(frameCount * 0.07) * 0.06;
  g.fillStyle(IRIS_AMBER, glowPulse);
  g.fillCircle(ex, ey, eyeR * 1.25);

  g.fillStyle(0x1a1a10, 0.95);
  g.fillCircle(ex, ey, eyeR + 0.5);

  g.fillStyle(EYE_WHITE, 0.95);
  g.fillCircle(ex, ey, eyeR);

  const pupil = computePupilOffset(direction);
  const shiftX = pupil.px * eyeR * 0.35;
  const shiftY = pupil.py * eyeR * 0.35;
  const pupilCx = ex + shiftX;
  const pupilCy = ey + shiftY;

  const irisR = eyeR * 0.72;
  g.fillStyle(IRIS_AMBER, 0.95);
  g.fillCircle(pupilCx, pupilCy, irisR);

  g.fillStyle(IRIS_DARK, 0.5);
  g.fillCircle(pupilCx, pupilCy, irisR * 0.8);

  const irisDetail = 0.2 + Math.sin(frameCount * 0.03) * 0.05;
  g.fillStyle(0xffcc33, irisDetail);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const rx = pupilCx + Math.cos(a) * irisR * 0.55;
    const ry = pupilCy + Math.sin(a) * irisR * 0.55;
    g.fillCircle(rx, ry, irisR * 0.15);
  }

  const slitW = eyeR * 0.18;
  const slitH = eyeR * 1.3;
  g.fillStyle(PUPIL_BLACK, 0.95);
  g.fillCircle(pupilCx, pupilCy - slitH * 0.35, slitW * 0.7);
  g.fillRect(pupilCx - slitW / 2, pupilCy - slitH * 0.35, slitW, slitH * 0.7);
  g.fillCircle(pupilCx, pupilCy + slitH * 0.35, slitW * 0.7);

  const glintAlpha = 0.75 + Math.sin(frameCount * 0.14) * 0.2;
  const glintR = eyeR * 0.2;
  const glintOff = eyeR * 0.3;
  g.fillStyle(0xffffff, glintAlpha);
  g.fillCircle(ex - glintOff * (isLeft ? 0.8 : 1.2), ey - glintOff, glintR);

  g.fillStyle(0xffffff, glintAlpha * 0.5);
  g.fillCircle(ex + glintOff * 0.5, ey + glintOff * 0.6, glintR * 0.5);
}

function drawEyes(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  headSize: number,
  direction: FaceDirection,
  frameCount: number,
  faceState: FaceState
): void {
  const v = getDirectionVectors(direction);
  const eyeSpread = headSize * 0.22;
  const eyeForward = headSize * 0.08;
  const eyeR = headSize * 0.115;

  const lx = cx + v.fx * eyeForward + v.rx * eyeSpread;
  const ly = cy + v.fy * eyeForward + v.ry * eyeSpread;
  const rx = cx + v.fx * eyeForward - v.rx * eyeSpread;
  const ry = cy + v.fy * eyeForward - v.ry * eyeSpread;

  drawEye(g, lx, ly, eyeR, frameCount, faceState, direction, true);
  drawEye(g, rx, ry, eyeR, frameCount, faceState, direction, false);
}

function drawBrow(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  headSize: number,
  direction: FaceDirection
): void {
  const v = getDirectionVectors(direction);
  const eyeSpread = headSize * 0.25;
  const browForward = headSize * 0.14;
  const browLen = headSize * 0.16;

  const lx = cx + v.fx * browForward + v.rx * eyeSpread;
  const ly = cy + v.fy * browForward + v.ry * eyeSpread;
  const rx = cx + v.fx * browForward - v.rx * eyeSpread;
  const ry = cy + v.fy * browForward - v.ry * eyeSpread;

  g.lineStyle(2.5, RIM_GREEN, 0.65);
  g.lineBetween(
    lx - v.rx * browLen * 0.2, ly - v.ry * browLen * 0.2,
    lx + v.rx * browLen, ly + v.ry * browLen
  );
  g.lineBetween(
    rx + v.rx * browLen * 0.2, ry + v.ry * browLen * 0.2,
    rx - v.rx * browLen, ry - v.ry * browLen
  );
}

function drawMouth(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  headSize: number,
  direction: FaceDirection,
  faceState: FaceState
): void {
  const v = getDirectionVectors(direction);
  const mouthForward = headSize * 0.3;
  const mouthW = headSize * 0.22;
  const openAmount = faceState.mouthOpen;

  const mx = cx + v.fx * mouthForward;
  const my = cy + v.fy * mouthForward;

  if (openAmount > 0.15) {
    const gapH = headSize * 0.08 * openAmount;
    g.fillStyle(0x2a0000, 0.85);
    g.fillCircle(mx, my, mouthW * 0.5);

    g.fillStyle(0x440000, 0.6);
    g.fillCircle(mx, my, mouthW * 0.35);

    const fangSize = headSize * 0.055;
    g.fillStyle(0xeeeedd, 0.92);
    g.fillTriangle(
      mx + v.rx * mouthW * 0.35, my + v.ry * mouthW * 0.35,
      mx + v.rx * mouthW * 0.35 + v.fx * fangSize * 1.2, my + v.ry * mouthW * 0.35 + v.fy * fangSize * 1.2,
      mx + v.rx * mouthW * 0.15 + v.fx * fangSize * 0.3, my + v.ry * mouthW * 0.15 + v.fy * fangSize * 0.3
    );
    g.fillTriangle(
      mx - v.rx * mouthW * 0.35, my - v.ry * mouthW * 0.35,
      mx - v.rx * mouthW * 0.35 + v.fx * fangSize * 1.2, my - v.ry * mouthW * 0.35 + v.fy * fangSize * 1.2,
      mx - v.rx * mouthW * 0.15 + v.fx * fangSize * 0.3, my - v.ry * mouthW * 0.15 + v.fy * fangSize * 0.3
    );
  } else {
    g.lineStyle(1.5, DARK_GREEN, 0.45);
    const smileW = mouthW * 0.8;
    g.lineBetween(
      mx + v.rx * smileW, my + v.ry * smileW,
      mx - v.rx * smileW, my - v.ry * smileW
    );
    g.lineStyle(1, LIGHT_GREEN, 0.15);
    g.lineBetween(
      mx + v.rx * smileW * 0.7, my + v.ry * smileW * 0.7 + v.fy * 1,
      mx - v.rx * smileW * 0.7, my - v.ry * smileW * 0.7 + v.fy * 1
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

  drawHorns(g, seg.cx, seg.cy, headSize, direction, frameCount);

  drawHeadShape(g, seg.cx, seg.cy, headSize, direction, frameCount);

  if (biteAngle !== undefined) {
    drawBitingJaw(g, seg.cx, seg.cy, headSize, direction, biteAngle, frameCount);
  } else {
    drawSnout(g, seg.cx, seg.cy, headSize, direction, frameCount);
    drawMouth(g, seg.cx, seg.cy, headSize, direction, faceState);
  }

  drawBrow(g, seg.cx, seg.cy, headSize, direction);
  drawEyes(g, seg.cx, seg.cy, headSize, direction, frameCount, faceState);
  drawNostrils(g, seg.cx, seg.cy, headSize, direction, frameCount);
  drawCrown(g, seg.cx, seg.cy, headSize, direction, frameCount);
}
