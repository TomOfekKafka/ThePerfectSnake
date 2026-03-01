const CELL_SIZE = 20;
const MAX_WARP_PARTICLES = 16;
const NUM_RING_SEGMENTS = 12;
const WARP_FLASH_DURATION = 15;

interface WarpParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  hue: number;
}

interface WarpFlash {
  x: number;
  y: number;
  life: number;
  maxLife: number;
  radius: number;
}

export interface PortalEffectsState {
  warpParticles: WarpParticle[];
  warpFlashes: WarpFlash[];
  rotationPhase: number;
  pulsePhase: number;
}

export const createPortalEffectsState = (): PortalEffectsState => ({
  warpParticles: [],
  warpFlashes: [],
  rotationPhase: 0,
  pulsePhase: 0,
});

export const spawnWarpFlash = (
  state: PortalEffectsState,
  x: number,
  y: number
): void => {
  state.warpFlashes.push({
    x,
    y,
    life: 1,
    maxLife: WARP_FLASH_DURATION,
    radius: CELL_SIZE * 0.5,
  });

  for (let i = 0; i < 8; i++) {
    if (state.warpParticles.length >= MAX_WARP_PARTICLES) {
      state.warpParticles.shift();
    }
    const angle = (i / 8) * Math.PI * 2 + Math.random() * 0.4;
    const speed = 1.5 + Math.random() * 2;
    state.warpParticles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 2 + Math.random() * 3,
      life: 1,
      hue: 180 + Math.random() * 60,
    });
  }
};

export const updatePortalEffects = (state: PortalEffectsState): void => {
  state.rotationPhase += 0.06;
  state.pulsePhase += 0.08;

  for (let i = state.warpParticles.length - 1; i >= 0; i--) {
    const p = state.warpParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.95;
    p.vy *= 0.95;
    p.life -= 0.04;
    p.size *= 0.97;
    if (p.life <= 0) {
      state.warpParticles.splice(i, 1);
    }
  }

  for (let i = state.warpFlashes.length - 1; i >= 0; i--) {
    const f = state.warpFlashes[i];
    f.life -= 1 / f.maxLife;
    f.radius += 2;
    if (f.life <= 0) {
      state.warpFlashes.splice(i, 1);
    }
  }
};

const portalColorA = 0x00ccff;
const portalGlowA = 0x0088ff;
const portalColorB = 0xff6600;
const portalGlowB = 0xff3300;

export const drawPortals = (
  g: Phaser.GameObjects.Graphics,
  portalA: { x: number; y: number } | null,
  portalB: { x: number; y: number } | null,
  state: PortalEffectsState,
  frameCount: number
): void => {
  if (portalA) {
    drawSinglePortal(g, portalA.x, portalA.y, portalColorA, portalGlowA, state, frameCount, 0);
  }
  if (portalB) {
    drawSinglePortal(g, portalB.x, portalB.y, portalColorB, portalGlowB, state, frameCount, Math.PI);
  }

  for (const p of state.warpParticles) {
    const alpha = p.life * 0.7;
    g.fillStyle(0x66eeff, alpha * 0.4);
    g.fillCircle(p.x, p.y, p.size * 1.5);
    g.fillStyle(0xaaddff, alpha);
    g.fillCircle(p.x, p.y, p.size * 0.6);
  }

  for (const f of state.warpFlashes) {
    const alpha = f.life * 0.5;
    g.lineStyle(2, 0xaaddff, alpha);
    g.strokeCircle(f.x, f.y, f.radius);
    g.fillStyle(0x88ccff, alpha * 0.3);
    g.fillCircle(f.x, f.y, f.radius * 0.5 * f.life);
  }
};

const drawSinglePortal = (
  g: Phaser.GameObjects.Graphics,
  gridX: number,
  gridY: number,
  color: number,
  glowColor: number,
  state: PortalEffectsState,
  frameCount: number,
  phaseOffset: number
): void => {
  const cx = gridX * CELL_SIZE + CELL_SIZE / 2;
  const cy = gridY * CELL_SIZE + CELL_SIZE / 2;
  const pulse = 0.8 + Math.sin(state.pulsePhase + phaseOffset) * 0.2;
  const baseRadius = CELL_SIZE * 0.45 * pulse;

  // Outer glow
  g.fillStyle(glowColor, 0.12);
  g.fillCircle(cx, cy, baseRadius * 2.5);
  g.fillStyle(glowColor, 0.08);
  g.fillCircle(cx, cy, baseRadius * 3.2);

  // Rotating ring segments
  const rotation = state.rotationPhase + phaseOffset;
  for (let i = 0; i < NUM_RING_SEGMENTS; i++) {
    const angle = rotation + (i / NUM_RING_SEGMENTS) * Math.PI * 2;
    const segAlpha = 0.3 + Math.sin(angle * 2 + frameCount * 0.1) * 0.2;
    const dist = baseRadius * 1.3;
    const sx = cx + Math.cos(angle) * dist;
    const sy = cy + Math.sin(angle) * dist;
    const segSize = 2 + Math.sin(angle * 3 + frameCount * 0.05) * 1;

    g.fillStyle(color, segAlpha);
    g.fillCircle(sx, sy, segSize);
  }

  // Inner ring
  g.lineStyle(1.5, color, 0.5 * pulse);
  g.strokeCircle(cx, cy, baseRadius * 1.2);

  // Outer ring
  g.lineStyle(1, glowColor, 0.3 * pulse);
  g.strokeCircle(cx, cy, baseRadius * 1.6);

  // Core vortex
  g.fillStyle(glowColor, 0.25 * pulse);
  g.fillCircle(cx, cy, baseRadius);
  g.fillStyle(color, 0.4 * pulse);
  g.fillCircle(cx, cy, baseRadius * 0.6);
  g.fillStyle(0xffffff, 0.5 * pulse);
  g.fillCircle(cx, cy, baseRadius * 0.25);

  // Swirling inner particles
  for (let i = 0; i < 4; i++) {
    const swirlAngle = -rotation * 1.5 + (i / 4) * Math.PI * 2;
    const swirlDist = baseRadius * 0.5 * (0.5 + Math.sin(frameCount * 0.08 + i) * 0.5);
    const sx = cx + Math.cos(swirlAngle) * swirlDist;
    const sy = cy + Math.sin(swirlAngle) * swirlDist;
    g.fillStyle(0xffffff, 0.4);
    g.fillCircle(sx, sy, 1.5);
  }
};
