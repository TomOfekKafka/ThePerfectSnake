import Phaser from 'phaser';

export interface LaserBeam {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  targetX: number;
  targetY: number;
  progress: number;
  life: number;
  maxLife: number;
  width: number;
  hue: number;
  hitTarget: boolean;
  impactParticles: LaserImpactParticle[];
}

interface LaserImpactParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  hue: number;
}

export interface LaserTargetLine {
  active: boolean;
  flickerPhase: number;
}

export interface LaserBeamState {
  beams: LaserBeam[];
  targetLine: LaserTargetLine;
  cooldown: number;
  chargeLevel: number;
  autoFireTimer: number;
}

const MAX_BEAMS = 3;
const BEAM_SPEED = 0.12;
const BEAM_LIFE = 0.8;
const MAX_IMPACT_PARTICLES = 20;
const IMPACT_PARTICLES_PER_HIT = 10;
const AUTO_FIRE_INTERVAL = 45;
const COOLDOWN_FRAMES = 8;

export function createLaserBeamState(): LaserBeamState {
  return {
    beams: [],
    targetLine: { active: true, flickerPhase: 0 },
    cooldown: 0,
    chargeLevel: 0,
    autoFireTimer: 0,
  };
}

export function fireLaser(
  state: LaserBeamState,
  headX: number,
  headY: number,
  foodX: number,
  foodY: number
): boolean {
  if (state.cooldown > 0) return false;
  if (state.beams.length >= MAX_BEAMS) {
    state.beams.shift();
  }

  const hue = 0 + Math.random() * 20;

  state.beams.push({
    startX: headX,
    startY: headY,
    endX: headX,
    endY: headY,
    targetX: foodX,
    targetY: foodY,
    progress: 0,
    life: 1,
    maxLife: BEAM_LIFE,
    width: 3 + Math.random() * 2,
    hue,
    hitTarget: false,
    impactParticles: [],
  });

  state.cooldown = COOLDOWN_FRAMES;
  state.chargeLevel = 0;
  return true;
}

export function updateLaserBeams(
  state: LaserBeamState,
  headX: number,
  headY: number,
  foodX: number,
  foodY: number,
  gameStarted: boolean,
  gameOver: boolean
): boolean {
  let hitThisFrame = false;

  state.targetLine.flickerPhase += 0.15;
  if (state.cooldown > 0) state.cooldown--;

  if (gameStarted && !gameOver) {
    state.chargeLevel = Math.min(1, state.chargeLevel + 0.02);
    state.autoFireTimer++;
    if (state.autoFireTimer >= AUTO_FIRE_INTERVAL) {
      state.autoFireTimer = 0;
      fireLaser(state, headX, headY, foodX, foodY);
    }
  }

  for (let i = state.beams.length - 1; i >= 0; i--) {
    const beam = state.beams[i];

    beam.startX = headX;
    beam.startY = headY;

    if (!beam.hitTarget) {
      beam.progress = Math.min(1, beam.progress + BEAM_SPEED);
      beam.endX = beam.startX + (beam.targetX - beam.startX) * beam.progress;
      beam.endY = beam.startY + (beam.targetY - beam.startY) * beam.progress;

      const dx = beam.endX - beam.targetX;
      const dy = beam.endY - beam.targetY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 6 || beam.progress >= 1) {
        beam.hitTarget = true;
        hitThisFrame = true;
        spawnImpactParticles(beam);
      }
    }

    if (beam.hitTarget) {
      beam.endX = beam.targetX;
      beam.endY = beam.targetY;
      beam.life -= 0.06;
    }

    for (let j = beam.impactParticles.length - 1; j >= 0; j--) {
      const p = beam.impactParticles[j];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.92;
      p.vy *= 0.92;
      p.life -= 0.04;
      if (p.life <= 0) {
        beam.impactParticles.splice(j, 1);
      }
    }

    if (beam.life <= 0 && beam.impactParticles.length === 0) {
      state.beams.splice(i, 1);
    }
  }

  return hitThisFrame;
}

function spawnImpactParticles(beam: LaserBeam): void {
  while (beam.impactParticles.length + IMPACT_PARTICLES_PER_HIT > MAX_IMPACT_PARTICLES) {
    beam.impactParticles.shift();
  }

  for (let i = 0; i < IMPACT_PARTICLES_PER_HIT; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 3;
    beam.impactParticles.push({
      x: beam.targetX,
      y: beam.targetY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 1 + Math.random() * 2.5,
      life: 1,
      maxLife: 1,
      hue: beam.hue + Math.random() * 40,
    });
  }
}

function hslToHex(h: number, s: number, l: number): number {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }

  const ri = Math.round((r + m) * 255);
  const gi = Math.round((g + m) * 255);
  const bi = Math.round((b + m) * 255);
  return (ri << 16) | (gi << 8) | bi;
}

export function drawTargetingLine(
  g: Phaser.GameObjects.Graphics,
  state: LaserBeamState,
  headX: number,
  headY: number,
  foodX: number,
  foodY: number,
  frameCount: number
): void {
  if (!state.targetLine.active) return;

  const flicker = 0.15 + Math.sin(state.targetLine.flickerPhase) * 0.05;
  const dashPhase = frameCount * 0.3;

  const dx = foodX - headX;
  const dy = foodY - headY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 1) return;

  const nx = dx / dist;
  const ny = dy / dist;

  const dashLen = 4;
  const gapLen = 6;
  const cycleLen = dashLen + gapLen;
  let traveled = dashPhase % cycleLen;

  const chargeGlow = state.chargeLevel;
  const glowColor = hslToHex(0, 1.0, 0.5 + chargeGlow * 0.2);

  while (traveled < dist) {
    const segEnd = Math.min(traveled + dashLen, dist);
    const x1 = headX + nx * traveled;
    const y1 = headY + ny * traveled;
    const x2 = headX + nx * segEnd;
    const y2 = headY + ny * segEnd;

    g.lineStyle(1, glowColor, flicker * (0.5 + chargeGlow * 0.5));
    g.beginPath();
    g.moveTo(x1, y1);
    g.lineTo(x2, y2);
    g.strokePath();

    traveled += cycleLen;
  }

  const reticleSize = 4 + Math.sin(frameCount * 0.1) * 1.5;
  const reticleAlpha = 0.25 + chargeGlow * 0.25;
  g.lineStyle(1, hslToHex(0, 1.0, 0.6), reticleAlpha);
  g.strokeCircle(foodX, foodY, reticleSize);

  g.lineStyle(1, hslToHex(0, 1.0, 0.6), reticleAlpha * 0.7);
  g.beginPath();
  g.moveTo(foodX - reticleSize - 2, foodY);
  g.lineTo(foodX - reticleSize + 2, foodY);
  g.strokePath();
  g.beginPath();
  g.moveTo(foodX + reticleSize - 2, foodY);
  g.lineTo(foodX + reticleSize + 2, foodY);
  g.strokePath();
  g.beginPath();
  g.moveTo(foodX, foodY - reticleSize - 2);
  g.lineTo(foodX, foodY - reticleSize + 2);
  g.strokePath();
  g.beginPath();
  g.moveTo(foodX, foodY + reticleSize - 2);
  g.lineTo(foodX, foodY + reticleSize + 2);
  g.strokePath();
}

export function drawLaserBeams(
  g: Phaser.GameObjects.Graphics,
  state: LaserBeamState,
  frameCount: number
): void {
  for (const beam of state.beams) {
    const lifeRatio = Math.max(0, beam.life);
    if (lifeRatio <= 0 && beam.impactParticles.length === 0) continue;

    if (lifeRatio > 0) {
      const wobble = Math.sin(frameCount * 0.5) * 0.5;

      const outerWidth = (beam.width + 4) * lifeRatio;
      const outerColor = hslToHex(beam.hue, 1.0, 0.3);
      g.lineStyle(outerWidth, outerColor, 0.2 * lifeRatio);
      g.beginPath();
      g.moveTo(beam.startX, beam.startY);
      g.lineTo(beam.endX + wobble, beam.endY + wobble);
      g.strokePath();

      const midWidth = (beam.width + 1) * lifeRatio;
      const midColor = hslToHex(beam.hue + 10, 1.0, 0.55);
      g.lineStyle(midWidth, midColor, 0.5 * lifeRatio);
      g.beginPath();
      g.moveTo(beam.startX, beam.startY);
      g.lineTo(beam.endX + wobble * 0.5, beam.endY + wobble * 0.5);
      g.strokePath();

      const coreWidth = beam.width * 0.5 * lifeRatio;
      const coreColor = hslToHex(beam.hue + 20, 0.5, 0.9);
      g.lineStyle(coreWidth, coreColor, 0.9 * lifeRatio);
      g.beginPath();
      g.moveTo(beam.startX, beam.startY);
      g.lineTo(beam.endX, beam.endY);
      g.strokePath();

      g.fillStyle(hslToHex(beam.hue, 1.0, 0.8), 0.4 * lifeRatio);
      g.fillCircle(beam.startX, beam.startY, beam.width * 1.5);
      g.fillStyle(hslToHex(beam.hue + 10, 1.0, 0.95), 0.6 * lifeRatio);
      g.fillCircle(beam.startX, beam.startY, beam.width * 0.7);

      if (beam.hitTarget) {
        const impactPulse = 1 + Math.sin(frameCount * 0.6) * 0.3;
        const impactSize = (8 + beam.width) * lifeRatio * impactPulse;
        g.fillStyle(hslToHex(beam.hue, 1.0, 0.7), 0.35 * lifeRatio);
        g.fillCircle(beam.targetX, beam.targetY, impactSize);
        g.fillStyle(hslToHex(beam.hue + 30, 0.8, 0.9), 0.6 * lifeRatio);
        g.fillCircle(beam.targetX, beam.targetY, impactSize * 0.4);
      }
    }

    for (const p of beam.impactParticles) {
      const pLife = Math.max(0, p.life / p.maxLife);
      const pColor = hslToHex(p.hue, 1.0, 0.5 + pLife * 0.3);
      g.fillStyle(pColor, pLife * 0.7);
      g.fillCircle(p.x, p.y, p.size * pLife);

      const coreColor = hslToHex(p.hue + 20, 0.5, 0.9);
      g.fillStyle(coreColor, pLife * 0.9);
      g.fillCircle(p.x, p.y, p.size * pLife * 0.4);
    }
  }
}
