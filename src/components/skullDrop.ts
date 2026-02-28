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

  drawKeanuAura(g, cx, cy, s, alpha, frameCount);
  drawSoulParticles(g, state);
  drawKeanuWhoa(g, cx, cy, s, alpha, frameCount);
}

function drawKeanuAura(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  size: number,
  alpha: number,
  frameCount: number
): void {
  const pulse = 1.0 + Math.sin(frameCount * 0.08) * 0.15;
  const auraSize = size * 2.8 * pulse;

  g.fillStyle(0x001122, alpha * 0.15);
  g.fillCircle(cx, cy, auraSize);
  g.fillStyle(0x003366, alpha * 0.1);
  g.fillCircle(cx, cy, auraSize * 0.7);
  g.fillStyle(0x004488, alpha * 0.08);
  g.fillCircle(cx, cy, auraSize * 0.5);
}

function drawSoulParticles(
  g: Phaser.GameObjects.Graphics,
  state: SkullDropState
): void {
  for (const p of state.soulParticles) {
    const a = Math.max(0, p.life);
    g.fillStyle(0x4499cc, a * 0.3);
    g.fillCircle(p.x, p.y, p.size * 1.5);
    g.fillStyle(0x66ccff, a * 0.6);
    g.fillCircle(p.x, p.y, p.size);
    g.fillStyle(0xccddff, a * 0.3);
    g.fillCircle(p.x, p.y, p.size * 0.4);
  }
}

function drawKeanuWhoa(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  size: number,
  alpha: number,
  frameCount: number
): void {
  const s = size;

  g.fillStyle(0xddb896, alpha * 0.95);
  g.fillEllipse(cx, cy - s * 0.1, s * 1.5, s * 1.7);

  g.fillStyle(0xccaa88, alpha * 0.4);
  g.fillEllipse(cx, cy + s * 0.1, s * 1.3, s * 1.3);

  g.fillStyle(0x1a1a1a, alpha);
  g.fillEllipse(cx, cy - s * 0.7, s * 1.8, s * 1.0);
  g.fillRect(cx - s * 0.85, cy - s * 0.5, s * 0.3, s * 1.2);
  g.fillRect(cx + s * 0.55, cy - s * 0.5, s * 0.3, s * 1.2);

  g.fillStyle(0x1a1a1a, alpha * 0.7);
  g.fillEllipse(cx, cy + s * 0.5, s * 1.0, s * 0.5);

  const eyeSpacing = s * 0.35;
  const eyeY = cy - s * 0.15;
  const surprised = 0.8 + Math.sin(frameCount * 0.15) * 0.2;

  g.fillStyle(0xffffff, alpha);
  g.fillEllipse(cx - eyeSpacing, eyeY, s * 0.3, s * 0.35 * surprised);
  g.fillEllipse(cx + eyeSpacing, eyeY, s * 0.3, s * 0.35 * surprised);

  g.fillStyle(0x222222, alpha);
  g.fillCircle(cx - eyeSpacing, eyeY, s * 0.1);
  g.fillCircle(cx + eyeSpacing, eyeY, s * 0.1);

  const glint = 0.5 + Math.sin(frameCount * 0.2) * 0.3;
  g.fillStyle(0xffffff, alpha * glint);
  g.fillCircle(cx - eyeSpacing - s * 0.05, eyeY - s * 0.06, s * 0.04);
  g.fillCircle(cx + eyeSpacing - s * 0.05, eyeY - s * 0.06, s * 0.04);

  g.fillStyle(0x332211, alpha * 0.8);
  g.fillRect(cx - eyeSpacing - s * 0.2, eyeY - s * 0.28, s * 0.4, s * 0.06);
  g.fillRect(cx + eyeSpacing - s * 0.2, eyeY - s * 0.28, s * 0.4, s * 0.06);

  g.fillStyle(0xcc9977, alpha * 0.7);
  g.fillEllipse(cx, cy + s * 0.12, s * 0.12, s * 0.08);

  const mouthOpen = 0.7 + Math.sin(frameCount * 0.1) * 0.15;
  const mouthY = cy + s * 0.35;
  g.fillStyle(0x331111, alpha * 0.9);
  g.fillEllipse(cx, mouthY, s * 0.35, s * 0.25 * mouthOpen);

  g.fillStyle(0x551111, alpha * 0.5);
  g.fillEllipse(cx, mouthY + s * 0.05, s * 0.25, s * 0.12);

  g.lineStyle(1.5, 0x886644, alpha * 0.4);
  g.strokeEllipse(cx, cy - s * 0.1, s * 1.5, s * 1.7);

  g.fillStyle(0xffeedd, alpha * 0.12);
  g.fillEllipse(cx - s * 0.2, cy - s * 0.55, s * 0.5, s * 0.3);

  const whoaScale = 1.0 + Math.sin(frameCount * 0.12) * 0.1;
  const whoaY = cy - s * 1.3;
  const whoaAlpha = alpha * (0.7 + Math.sin(frameCount * 0.08) * 0.3);

  g.fillStyle(0x000000, whoaAlpha * 0.6);
  g.fillRoundedRect(cx - s * 1.2 * whoaScale, whoaY - s * 0.3, s * 2.4 * whoaScale, s * 0.55, 4);
  g.lineStyle(2, 0x66ccff, whoaAlpha * 0.8);
  g.strokeRoundedRect(cx - s * 1.2 * whoaScale, whoaY - s * 0.3, s * 2.4 * whoaScale, s * 0.55, 4);

  g.fillStyle(0x66ccff, whoaAlpha * 0.08);
  g.fillRoundedRect(cx - s * 1.3 * whoaScale, whoaY - s * 0.35, s * 2.6 * whoaScale, s * 0.65, 5);

  const letterSpacing = s * 0.5 * whoaScale;
  const letters = ['W', 'H', 'O', 'A'];
  const startX = cx - letterSpacing * 1.5;

  for (let i = 0; i < letters.length; i++) {
    const lx = startX + i * letterSpacing;
    const ly = whoaY + Math.sin(frameCount * 0.15 + i * 0.8) * 2;
    drawWhoaLetter(g, letters[i], lx, ly, s * 0.18 * whoaScale, whoaAlpha, frameCount, i);
  }
}

function drawWhoaLetter(
  g: Phaser.GameObjects.Graphics,
  letter: string,
  x: number,
  y: number,
  size: number,
  alpha: number,
  frameCount: number,
  index: number
): void {
  const glow = 0.3 + Math.sin(frameCount * 0.1 + index * 1.2) * 0.2;
  g.fillStyle(0x66ccff, alpha * glow);
  g.fillCircle(x, y, size * 2);

  g.lineStyle(2.5, 0xffffff, alpha);
  g.beginPath();

  switch (letter) {
    case 'W':
      g.moveTo(x - size, y - size);
      g.lineTo(x - size * 0.5, y + size);
      g.lineTo(x, y - size * 0.3);
      g.lineTo(x + size * 0.5, y + size);
      g.lineTo(x + size, y - size);
      break;
    case 'H':
      g.moveTo(x - size * 0.7, y - size);
      g.lineTo(x - size * 0.7, y + size);
      g.moveTo(x - size * 0.7, y);
      g.lineTo(x + size * 0.7, y);
      g.moveTo(x + size * 0.7, y - size);
      g.lineTo(x + size * 0.7, y + size);
      break;
    case 'O':
      g.arc(x, y, size * 0.8, 0, Math.PI * 2);
      break;
    case 'A':
      g.moveTo(x - size * 0.7, y + size);
      g.lineTo(x, y - size);
      g.lineTo(x + size * 0.7, y + size);
      g.moveTo(x - size * 0.4, y + size * 0.2);
      g.lineTo(x + size * 0.4, y + size * 0.2);
      break;
  }
  g.strokePath();
}
