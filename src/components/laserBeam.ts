import Phaser from 'phaser';

export interface LaserParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
}

export interface LaserBeam {
  startX: number;
  startY: number;
  dirX: number;
  dirY: number;
  length: number;
  maxLength: number;
  life: number;
  width: number;
  coreColor: number;
  glowColor: number;
}

export interface LaserImpact {
  x: number;
  y: number;
  radius: number;
  life: number;
}

export interface LaserState {
  beams: LaserBeam[];
  particles: LaserParticle[];
  impacts: LaserImpact[];
  flashAlpha: number;
  chargeLevel: number;
}

const MAX_BEAMS = 4;
const MAX_PARTICLES = 80;
const MAX_IMPACTS = 8;
const BEAM_SPEED = 25;
const BEAM_MAX_LENGTH = 500;

export function createLaserState(): LaserState {
  return {
    beams: [],
    particles: [],
    impacts: [],
    flashAlpha: 0,
    chargeLevel: 0,
  };
}

export function fireLaser(
  state: LaserState,
  headX: number,
  headY: number,
  dirX: number,
  dirY: number
): void {
  while (state.beams.length >= MAX_BEAMS) state.beams.shift();

  state.beams.push({
    startX: headX,
    startY: headY,
    dirX,
    dirY,
    length: 0,
    maxLength: BEAM_MAX_LENGTH,
    life: 1,
    width: 8,
    coreColor: 0xff2244,
    glowColor: 0xff6644,
  });

  state.flashAlpha = 0.4;

  const perpX = -dirY;
  const perpY = dirX;
  for (let i = 0; i < 20; i++) {
    if (state.particles.length >= MAX_PARTICLES) state.particles.shift();
    const spread = (Math.random() - 0.5) * 6;
    state.particles.push({
      x: headX + (Math.random() - 0.5) * 6,
      y: headY + (Math.random() - 0.5) * 6,
      vx: -dirX * (1 + Math.random() * 3) + perpX * spread,
      vy: -dirY * (1 + Math.random() * 3) + perpY * spread,
      size: 1.5 + Math.random() * 3,
      life: 0.5 + Math.random() * 0.5,
    });
  }
}

export function updateLaser(state: LaserState): void {
  state.flashAlpha *= 0.82;
  if (state.flashAlpha < 0.005) state.flashAlpha = 0;

  for (let i = state.beams.length - 1; i >= 0; i--) {
    const beam = state.beams[i];
    if (beam.length < beam.maxLength) {
      beam.length = Math.min(beam.length + BEAM_SPEED, beam.maxLength);
    }
    if (beam.length >= beam.maxLength) {
      beam.life -= 0.04;
    }
    beam.width = 8 * beam.life;
    if (beam.life <= 0) {
      spawnImpact(state, beam);
      state.beams.splice(i, 1);
    }
  }

  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.92;
    p.vy *= 0.92;
    p.size *= 0.96;
    p.life -= 0.03;
    if (p.life <= 0 || p.size < 0.2) state.particles.splice(i, 1);
  }

  for (let i = state.impacts.length - 1; i >= 0; i--) {
    const imp = state.impacts[i];
    imp.radius += 3;
    imp.life -= 0.05;
    if (imp.life <= 0) state.impacts.splice(i, 1);
  }
}

function spawnImpact(state: LaserState, beam: LaserBeam): void {
  if (state.impacts.length >= MAX_IMPACTS) state.impacts.shift();
  const endX = beam.startX + beam.dirX * beam.length;
  const endY = beam.startY + beam.dirY * beam.length;
  state.impacts.push({ x: endX, y: endY, radius: 4, life: 1 });

  for (let i = 0; i < 12; i++) {
    if (state.particles.length >= MAX_PARTICLES) state.particles.shift();
    const angle = (i / 12) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    const speed = 2 + Math.random() * 4;
    state.particles.push({
      x: endX,
      y: endY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 1 + Math.random() * 2.5,
      life: 0.4 + Math.random() * 0.4,
    });
  }
}

export function drawLaser(
  g: Phaser.GameObjects.Graphics,
  state: LaserState,
  width: number,
  height: number,
  frameCount: number
): void {
  if (state.flashAlpha > 0.01) {
    g.fillStyle(0xff2244, state.flashAlpha * 0.15);
    g.fillRect(0, 0, width, height);
  }

  for (const beam of state.beams) {
    const alpha = beam.life;
    const endX = beam.startX + beam.dirX * beam.length;
    const endY = beam.startY + beam.dirY * beam.length;
    const flicker = 1 + Math.sin(frameCount * 0.8) * 0.15;

    g.lineStyle(beam.width * 3 * flicker, beam.glowColor, alpha * 0.12);
    g.lineBetween(beam.startX, beam.startY, endX, endY);

    g.lineStyle(beam.width * 2 * flicker, beam.glowColor, alpha * 0.25);
    g.lineBetween(beam.startX, beam.startY, endX, endY);

    g.lineStyle(beam.width * flicker, beam.coreColor, alpha * 0.7);
    g.lineBetween(beam.startX, beam.startY, endX, endY);

    g.lineStyle(beam.width * 0.4 * flicker, 0xffffff, alpha * 0.9);
    g.lineBetween(beam.startX, beam.startY, endX, endY);

    const tipGlow = 6 + Math.sin(frameCount * 1.2) * 2;
    g.fillStyle(0xffffff, alpha * 0.6);
    g.fillCircle(endX, endY, tipGlow);
    g.fillStyle(beam.coreColor, alpha * 0.3);
    g.fillCircle(endX, endY, tipGlow * 2);

    g.fillStyle(0xffffff, alpha * 0.5);
    g.fillCircle(beam.startX, beam.startY, 4 * flicker);
    g.fillStyle(beam.coreColor, alpha * 0.3);
    g.fillCircle(beam.startX, beam.startY, 8 * flicker);
  }

  for (const p of state.particles) {
    const alpha = Math.min(1, p.life * 1.5);
    g.fillStyle(0xff4422, alpha * 0.3);
    g.fillCircle(p.x, p.y, p.size * 1.5);
    g.fillStyle(0xff8866, alpha * 0.6);
    g.fillCircle(p.x, p.y, p.size * 0.8);
    g.fillStyle(0xffccaa, alpha * 0.8);
    g.fillCircle(p.x, p.y, p.size * 0.3);
  }

  for (const imp of state.impacts) {
    const alpha = imp.life;
    g.lineStyle(3 * alpha, 0xff4422, alpha * 0.5);
    g.strokeCircle(imp.x, imp.y, imp.radius);
    g.lineStyle(1.5 * alpha, 0xffaa66, alpha * 0.7);
    g.strokeCircle(imp.x, imp.y, imp.radius * 0.6);
    g.fillStyle(0xffffff, alpha * 0.3);
    g.fillCircle(imp.x, imp.y, 3 * alpha);
  }
}
