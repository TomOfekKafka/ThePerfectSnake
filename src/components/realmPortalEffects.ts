import Phaser from 'phaser';
import { RealmColors } from './realmThemes';

const CELL_SIZE = 20;
const NUM_VORTEX_ARMS = 5;
const NUM_ORBIT_PARTICLES = 8;
const MAX_REALM_WARP_PARTICLES = 24;

interface RealmWarpParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  color: number;
}

export interface RealmPortalEffectsState {
  rotationPhase: number;
  pulsePhase: number;
  warpParticles: RealmWarpParticle[];
  transitionFlash: number;
  transitionColor: number;
  lastRealm: number;
  realmNameAlpha: number;
  realmNameText: string;
}

export const createRealmPortalEffectsState = (): RealmPortalEffectsState => ({
  rotationPhase: 0,
  pulsePhase: 0,
  warpParticles: [],
  transitionFlash: 0,
  transitionColor: 0xffffff,
  lastRealm: 0,
  realmNameAlpha: 0,
  realmNameText: '',
});

export const triggerRealmTransition = (
  state: RealmPortalEffectsState,
  portalX: number,
  portalY: number,
  color: number,
  realmName: string,
): void => {
  state.transitionFlash = 1.0;
  state.transitionColor = color;
  state.realmNameAlpha = 1.0;
  state.realmNameText = realmName;

  for (let i = 0; i < 16; i++) {
    if (state.warpParticles.length >= MAX_REALM_WARP_PARTICLES) {
      state.warpParticles.shift();
    }
    const angle = (i / 16) * Math.PI * 2 + Math.random() * 0.5;
    const speed = 2 + Math.random() * 4;
    state.warpParticles.push({
      x: portalX,
      y: portalY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 3 + Math.random() * 4,
      life: 1,
      color,
    });
  }
};

export const updateRealmPortalEffects = (state: RealmPortalEffectsState): void => {
  state.rotationPhase += 0.04;
  state.pulsePhase += 0.06;

  if (state.transitionFlash > 0) {
    state.transitionFlash -= 0.025;
    if (state.transitionFlash < 0) state.transitionFlash = 0;
  }

  if (state.realmNameAlpha > 0) {
    state.realmNameAlpha -= 0.008;
    if (state.realmNameAlpha < 0) state.realmNameAlpha = 0;
  }

  for (let i = state.warpParticles.length - 1; i >= 0; i--) {
    const p = state.warpParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.94;
    p.vy *= 0.94;
    p.life -= 0.03;
    p.size *= 0.97;
    if (p.life <= 0) {
      state.warpParticles.splice(i, 1);
    }
  }
};

export const drawRealmPortal = (
  g: Phaser.GameObjects.Graphics,
  gridX: number,
  gridY: number,
  realm: RealmColors,
  state: RealmPortalEffectsState,
  frameCount: number,
): void => {
  const cx = gridX * CELL_SIZE + CELL_SIZE / 2;
  const cy = gridY * CELL_SIZE + CELL_SIZE / 2;
  const pulse = 0.85 + Math.sin(state.pulsePhase) * 0.15;
  const baseRadius = CELL_SIZE * 0.7 * pulse;
  const rotation = state.rotationPhase;

  g.fillStyle(realm.portalCore, 0.06);
  g.fillCircle(cx, cy, baseRadius * 4);
  g.fillStyle(realm.portalCore, 0.04);
  g.fillCircle(cx, cy, baseRadius * 5);

  for (let arm = 0; arm < NUM_VORTEX_ARMS; arm++) {
    const armAngle = rotation + (arm / NUM_VORTEX_ARMS) * Math.PI * 2;
    const steps = 12;
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      const spiralAngle = armAngle + t * Math.PI * 1.5;
      const dist = baseRadius * 0.3 + t * baseRadius * 2;
      const sx = cx + Math.cos(spiralAngle) * dist;
      const sy = cy + Math.sin(spiralAngle) * dist;
      const alpha = (1 - t) * 0.4;
      const size = 1.5 + (1 - t) * 2;
      g.fillStyle(realm.portalRing, alpha);
      g.fillCircle(sx, sy, size);
    }
  }

  for (let i = 0; i < NUM_ORBIT_PARTICLES; i++) {
    const angle = -rotation * 2 + (i / NUM_ORBIT_PARTICLES) * Math.PI * 2;
    const orbitDist = baseRadius * 1.5 + Math.sin(frameCount * 0.05 + i * 2) * baseRadius * 0.3;
    const ox = cx + Math.cos(angle) * orbitDist;
    const oy = cy + Math.sin(angle) * orbitDist;
    const alpha = 0.3 + Math.sin(angle * 2 + frameCount * 0.08) * 0.2;
    g.fillStyle(realm.portalCore, alpha);
    g.fillCircle(ox, oy, 2.5);
    g.fillStyle(0xffffff, alpha * 0.5);
    g.fillCircle(ox, oy, 1);
  }

  g.lineStyle(1.5, realm.portalRing, 0.35 * pulse);
  g.strokeCircle(cx, cy, baseRadius * 1.8);
  g.lineStyle(1, realm.portalCore, 0.25 * pulse);
  g.strokeCircle(cx, cy, baseRadius * 2.2);

  g.fillStyle(realm.portalCore, 0.3 * pulse);
  g.fillCircle(cx, cy, baseRadius);
  g.fillStyle(realm.portalRing, 0.5 * pulse);
  g.fillCircle(cx, cy, baseRadius * 0.5);
  g.fillStyle(0xffffff, 0.6 * pulse);
  g.fillCircle(cx, cy, baseRadius * 0.2);

  for (let i = 0; i < 6; i++) {
    const swirlAngle = -rotation * 2.5 + (i / 6) * Math.PI * 2;
    const swirlDist = baseRadius * 0.4 * (0.4 + Math.sin(frameCount * 0.07 + i) * 0.6);
    const sx = cx + Math.cos(swirlAngle) * swirlDist;
    const sy = cy + Math.sin(swirlAngle) * swirlDist;
    g.fillStyle(0xffffff, 0.5);
    g.fillCircle(sx, sy, 1.5);
  }
};

export const drawRealmWarpParticles = (
  g: Phaser.GameObjects.Graphics,
  state: RealmPortalEffectsState,
): void => {
  for (const p of state.warpParticles) {
    const alpha = p.life * 0.6;
    g.fillStyle(p.color, alpha * 0.3);
    g.fillCircle(p.x, p.y, p.size * 1.8);
    g.fillStyle(0xffffff, alpha);
    g.fillCircle(p.x, p.y, p.size * 0.5);
  }
};

export const drawRealmTransitionFlash = (
  g: Phaser.GameObjects.Graphics,
  state: RealmPortalEffectsState,
  width: number,
  height: number,
): void => {
  if (state.transitionFlash <= 0) return;

  const t = state.transitionFlash;
  g.fillStyle(state.transitionColor, t * 0.5);
  g.fillRect(0, 0, width, height);
  g.fillStyle(0xffffff, t * 0.3);
  g.fillRect(0, 0, width, height);
};

export const drawRealmName = (
  g: Phaser.GameObjects.Graphics,
  state: RealmPortalEffectsState,
  width: number,
  height: number,
  drawText: (g: Phaser.GameObjects.Graphics, text: string, x: number, y: number, size: number, color: number, alpha: number) => void,
): void => {
  if (state.realmNameAlpha <= 0) return;
  const alpha = Math.min(1, state.realmNameAlpha * 2);
  const text = state.realmNameText;
  const textWidth = text.length * 8;
  drawText(g, text, (width - textWidth) / 2, height / 2 - 20, 8, 0xffffff, alpha);
};

export const drawRealmBorderGlow = (
  g: Phaser.GameObjects.Graphics,
  realm: RealmColors,
  width: number,
  height: number,
  frameCount: number,
): void => {
  const pulse = 0.3 + Math.sin(frameCount * 0.02) * 0.15;
  const thickness = 3;

  g.fillStyle(realm.snakeGlow, pulse * 0.12);
  g.fillRect(0, 0, width, thickness);
  g.fillRect(0, height - thickness, width, thickness);
  g.fillRect(0, 0, thickness, height);
  g.fillRect(width - thickness, 0, thickness, height);

  g.fillStyle(realm.snakeGlow, pulse * 0.06);
  g.fillRect(0, 0, width, thickness * 2);
  g.fillRect(0, height - thickness * 2, width, thickness * 2);
  g.fillRect(0, 0, thickness * 2, height);
  g.fillRect(width - thickness * 2, 0, thickness * 2, height);
};
