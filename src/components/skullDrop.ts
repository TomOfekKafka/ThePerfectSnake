import Phaser from 'phaser';

export interface SkullDropState {
  active: boolean;
  x: number;
  y: number;
  age: number;
  fadeIn: number;
  fadeOut: number;
  scale: number;
  rotation: number;
  soulParticles: SoulParticle[];
}

interface SoulParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  angle: number;
}

const SKULL_LINGER_FRAMES = 120;
const SKULL_FADE_IN_FRAMES = 15;
const SKULL_FADE_OUT_FRAMES = 40;
const MAX_SOUL_PARTICLES = 20;

export function createSkullDropState(): SkullDropState {
  return {
    active: false,
    x: 0,
    y: 0,
    age: 0,
    fadeIn: 0,
    fadeOut: 0,
    scale: 0,
    rotation: 0,
    soulParticles: [],
  };
}

export function triggerSkullDrop(state: SkullDropState, x: number, y: number): void {
  state.active = true;
  state.x = x;
  state.y = y;
  state.age = 0;
  state.fadeIn = 0;
  state.fadeOut = 0;
  state.scale = 2.5;
  state.rotation = (Math.random() - 0.5) * 0.3;
  state.soulParticles = [];
  spawnSoulParticles(state);
}

function spawnSoulParticles(state: SkullDropState): void {
  for (let i = 0; i < MAX_SOUL_PARTICLES; i++) {
    const angle = (i / MAX_SOUL_PARTICLES) * Math.PI * 2;
    const speed = 0.3 + Math.random() * 0.5;
    state.soulParticles.push({
      x: state.x,
      y: state.y,
      vx: Math.cos(angle) * speed,
      vy: -0.5 - Math.random() * 1.0,
      life: 0.6 + Math.random() * 0.4,
      size: 2 + Math.random() * 3,
      angle,
    });
  }
}

export function resetSkullDrop(state: SkullDropState): void {
  state.active = false;
  state.soulParticles = [];
}

export function updateSkullDrop(state: SkullDropState): void {
  if (!state.active) return;

  state.age++;

  if (state.age < SKULL_FADE_IN_FRAMES) {
    state.fadeIn = state.age / SKULL_FADE_IN_FRAMES;
    state.scale = 2.5 - 1.5 * state.fadeIn;
  } else {
    state.fadeIn = 1;
    state.scale = 1.0;
  }

  const lingerEnd = SKULL_FADE_IN_FRAMES + SKULL_LINGER_FRAMES;
  if (state.age > lingerEnd) {
    state.fadeOut = Math.min(1, (state.age - lingerEnd) / SKULL_FADE_OUT_FRAMES);
  }

  if (state.fadeOut >= 1) {
    state.active = false;
    state.soulParticles = [];
    return;
  }

  for (let i = state.soulParticles.length - 1; i >= 0; i--) {
    const p = state.soulParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.98;
    p.vy -= 0.01;
    p.life -= 0.012;
    p.angle += 0.05;
    if (p.life <= 0) {
      state.soulParticles.splice(i, 1);
    }
  }

  if (state.age % 8 === 0 && state.fadeOut === 0 && state.soulParticles.length < MAX_SOUL_PARTICLES) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 8 + Math.random() * 6;
    state.soulParticles.push({
      x: state.x + Math.cos(angle) * dist,
      y: state.y + Math.sin(angle) * dist,
      vx: (Math.random() - 0.5) * 0.4,
      vy: -0.4 - Math.random() * 0.8,
      life: 0.5 + Math.random() * 0.5,
      size: 1.5 + Math.random() * 2.5,
      angle: Math.random() * Math.PI * 2,
    });
  }
}

export function isSkullVisible(state: SkullDropState): boolean {
  return state.active && state.fadeIn > 0;
}

export function drawSkullDrop(
  g: Phaser.GameObjects.Graphics,
  state: SkullDropState,
  cellSize: number,
  frameCount: number
): void {
  if (!state.active) return;

  const alpha = state.fadeIn * (1 - state.fadeOut);
  if (alpha <= 0) return;

  const bob = Math.sin(frameCount * 0.06) * 2;
  const cx = state.x;
  const cy = state.y + bob;
  const s = cellSize * 0.65 * state.scale;

  drawSkullAura(g, cx, cy, s, alpha, frameCount);
  drawSoulParticles(g, state);
  drawSkullShape(g, cx, cy, s, alpha, frameCount);
}

function drawSkullAura(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  size: number,
  alpha: number,
  frameCount: number
): void {
  const pulse = 1.0 + Math.sin(frameCount * 0.08) * 0.15;
  const auraSize = size * 2.8 * pulse;

  g.fillStyle(0x220033, alpha * 0.15);
  g.fillCircle(cx, cy, auraSize);
  g.fillStyle(0x440066, alpha * 0.1);
  g.fillCircle(cx, cy, auraSize * 0.7);
  g.fillStyle(0x660044, alpha * 0.08);
  g.fillCircle(cx, cy, auraSize * 0.5);
}

function drawSoulParticles(
  g: Phaser.GameObjects.Graphics,
  state: SkullDropState
): void {
  for (const p of state.soulParticles) {
    const a = Math.max(0, p.life);
    g.fillStyle(0x9944cc, a * 0.3);
    g.fillCircle(p.x, p.y, p.size * 1.5);
    g.fillStyle(0xcc66ff, a * 0.6);
    g.fillCircle(p.x, p.y, p.size);
    g.fillStyle(0xeeccff, a * 0.3);
    g.fillCircle(p.x, p.y, p.size * 0.4);
  }
}

function drawSkullShape(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  size: number,
  alpha: number,
  frameCount: number
): void {
  const s = size;

  // Cranium
  g.fillStyle(0xddccbb, alpha * 0.95);
  g.fillEllipse(cx, cy - s * 0.15, s * 1.7, s * 1.8);

  // Cranium shading
  g.fillStyle(0xccbbaa, alpha * 0.5);
  g.fillEllipse(cx, cy + s * 0.05, s * 1.5, s * 1.4);

  // Jaw / lower part
  g.fillStyle(0xccbbaa, alpha * 0.9);
  g.fillEllipse(cx, cy + s * 0.55, s * 1.2, s * 0.8);

  // Eye sockets - dark voids
  const eyeSpacing = s * 0.38;
  const eyeY = cy - s * 0.1;
  const eyeW = s * 0.45;
  const eyeH = s * 0.5;

  g.fillStyle(0x110011, alpha);
  g.fillEllipse(cx - eyeSpacing, eyeY, eyeW, eyeH);
  g.fillEllipse(cx + eyeSpacing, eyeY, eyeW, eyeH);

  // Glowing red eye cores
  const eyeGlow = 0.6 + Math.sin(frameCount * 0.12) * 0.4;
  const eyeR = s * 0.12;

  g.fillStyle(0xff0000, alpha * eyeGlow * 0.3);
  g.fillCircle(cx - eyeSpacing, eyeY, eyeR * 2.5);
  g.fillCircle(cx + eyeSpacing, eyeY, eyeR * 2.5);

  g.fillStyle(0xff2200, alpha * eyeGlow);
  g.fillCircle(cx - eyeSpacing, eyeY, eyeR);
  g.fillCircle(cx + eyeSpacing, eyeY, eyeR);

  g.fillStyle(0xff8844, alpha * eyeGlow * 0.8);
  g.fillCircle(cx - eyeSpacing, eyeY - eyeR * 0.3, eyeR * 0.5);
  g.fillCircle(cx + eyeSpacing, eyeY - eyeR * 0.3, eyeR * 0.5);

  // Nose cavity
  g.fillStyle(0x221111, alpha * 0.9);
  const noseY = cy + s * 0.2;
  g.fillTriangle(
    cx, noseY + s * 0.15,
    cx - s * 0.12, noseY,
    cx + s * 0.12, noseY
  );

  // Teeth row
  const teethY = cy + s * 0.5;
  const teethW = s * 0.9;
  const toothCount = 6;
  const toothWidth = teethW / toothCount;
  const toothHeight = s * 0.18;

  g.fillStyle(0xeeddcc, alpha * 0.9);
  for (let i = 0; i < toothCount; i++) {
    const tx = cx - teethW / 2 + i * toothWidth + toothWidth * 0.15;
    g.fillRect(tx, teethY - toothHeight / 2, toothWidth * 0.7, toothHeight);
  }

  // Teeth dividers
  g.lineStyle(1, 0x332222, alpha * 0.6);
  for (let i = 1; i < toothCount; i++) {
    const dx = cx - teethW / 2 + i * toothWidth;
    g.beginPath();
    g.moveTo(dx, teethY - toothHeight / 2);
    g.lineTo(dx, teethY + toothHeight / 2);
    g.strokePath();
  }

  // Skull outline
  g.lineStyle(1.5, 0x443333, alpha * 0.5);
  g.strokeEllipse(cx, cy - s * 0.15, s * 1.7, s * 1.8);

  // Cranium highlight
  g.fillStyle(0xffffff, alpha * 0.15);
  g.fillEllipse(cx - s * 0.2, cy - s * 0.55, s * 0.6, s * 0.35);

  // Cheekbone shadows
  g.fillStyle(0x998877, alpha * 0.25);
  g.fillEllipse(cx - s * 0.55, cy + s * 0.15, s * 0.35, s * 0.3);
  g.fillEllipse(cx + s * 0.55, cy + s * 0.15, s * 0.35, s * 0.3);
}
