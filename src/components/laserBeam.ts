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
  impactFlash: number;
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
  trail: boolean;
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

const MAX_BEAMS = 4;
const BEAM_SPEED = 0.18;
const BEAM_LIFE = 1.0;
const MAX_IMPACT_PARTICLES = 50;
const IMPACT_PARTICLES_PER_HIT = 20;
const AUTO_FIRE_INTERVAL = 40;
const COOLDOWN_FRAMES = 6;

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
    width: 5 + Math.random() * 3,
    hue,
    hitTarget: false,
    impactParticles: [],
    impactFlash: 0,
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
        beam.impactFlash = 1.0;
        hitThisFrame = true;
        spawnImpactParticles(beam);
      }
    }

    if (beam.hitTarget) {
      beam.endX = beam.targetX;
      beam.endY = beam.targetY;
      beam.life -= 0.04;
      beam.impactFlash *= 0.88;
    }

    for (let j = beam.impactParticles.length - 1; j >= 0; j--) {
      const p = beam.impactParticles[j];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.93;
      p.vy *= 0.93;
      if (p.trail) {
        p.vy += 0.08;
      }
      p.life -= 0.03;
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
    const speed = 2.5 + Math.random() * 5;
    const isTrail = i < 6;
    beam.impactParticles.push({
      x: beam.targetX,
      y: beam.targetY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: isTrail ? 2 + Math.random() * 3 : 1.5 + Math.random() * 2,
      life: 1,
      maxLife: 1,
      hue: beam.hue + Math.random() * 50,
      trail: isTrail,
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

  const flicker = 0.2 + Math.sin(state.targetLine.flickerPhase) * 0.08;
  const dashPhase = frameCount * 0.4;

  const dx = foodX - headX;
  const dy = foodY - headY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 1) return;

  const nx = dx / dist;
  const ny = dy / dist;

  const dashLen = 5;
  const gapLen = 5;
  const cycleLen = dashLen + gapLen;
  let traveled = dashPhase % cycleLen;

  const chargeGlow = state.chargeLevel;
  const glowColor = hslToHex(0, 1.0, 0.5 + chargeGlow * 0.3);

  if (chargeGlow > 0.3) {
    g.lineStyle(3, glowColor, flicker * chargeGlow * 0.15);
    g.beginPath();
    g.moveTo(headX, headY);
    g.lineTo(foodX, foodY);
    g.strokePath();
  }

  while (traveled < dist) {
    const segEnd = Math.min(traveled + dashLen, dist);
    const x1 = headX + nx * traveled;
    const y1 = headY + ny * traveled;
    const x2 = headX + nx * segEnd;
    const y2 = headY + ny * segEnd;

    g.lineStyle(1.5, glowColor, flicker * (0.5 + chargeGlow * 0.5));
    g.beginPath();
    g.moveTo(x1, y1);
    g.lineTo(x2, y2);
    g.strokePath();

    traveled += cycleLen;
  }

  const reticleSize = 5 + Math.sin(frameCount * 0.12) * 2 + chargeGlow * 3;
  const reticleAlpha = 0.3 + chargeGlow * 0.4;
  const reticleColor = hslToHex(0, 1.0, 0.55 + chargeGlow * 0.15);

  g.lineStyle(1.5, reticleColor, reticleAlpha);
  g.strokeCircle(foodX, foodY, reticleSize);

  if (chargeGlow > 0.5) {
    g.lineStyle(1, reticleColor, reticleAlpha * 0.4);
    g.strokeCircle(foodX, foodY, reticleSize * 1.5);
  }

  const crossLen = reticleSize + 3;
  g.lineStyle(1.5, reticleColor, reticleAlpha * 0.8);
  g.beginPath();
  g.moveTo(foodX - crossLen, foodY);
  g.lineTo(foodX - reticleSize + 2, foodY);
  g.strokePath();
  g.beginPath();
  g.moveTo(foodX + reticleSize - 2, foodY);
  g.lineTo(foodX + crossLen, foodY);
  g.strokePath();
  g.beginPath();
  g.moveTo(foodX, foodY - crossLen);
  g.lineTo(foodX, foodY - reticleSize + 2);
  g.strokePath();
  g.beginPath();
  g.moveTo(foodX, foodY + reticleSize - 2);
  g.lineTo(foodX, foodY + crossLen);
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
      const wobble = Math.sin(frameCount * 0.7) * 1.0;
      const pulse = 1 + Math.sin(frameCount * 0.4) * 0.15;

      const outerWidth = (beam.width + 8) * lifeRatio * pulse;
      const outerColor = hslToHex(beam.hue, 1.0, 0.25);
      g.lineStyle(outerWidth, outerColor, 0.25 * lifeRatio);
      g.beginPath();
      g.moveTo(beam.startX, beam.startY);
      g.lineTo(beam.endX + wobble, beam.endY + wobble);
      g.strokePath();

      const midWidth = (beam.width + 3) * lifeRatio * pulse;
      const midColor = hslToHex(beam.hue + 10, 1.0, 0.5);
      g.lineStyle(midWidth, midColor, 0.55 * lifeRatio);
      g.beginPath();
      g.moveTo(beam.startX, beam.startY);
      g.lineTo(beam.endX + wobble * 0.4, beam.endY + wobble * 0.4);
      g.strokePath();

      const coreWidth = beam.width * 0.6 * lifeRatio;
      const coreColor = hslToHex(beam.hue + 25, 0.4, 0.92);
      g.lineStyle(coreWidth, coreColor, 0.95 * lifeRatio);
      g.beginPath();
      g.moveTo(beam.startX, beam.startY);
      g.lineTo(beam.endX, beam.endY);
      g.strokePath();

      g.fillStyle(hslToHex(beam.hue, 1.0, 0.75), 0.5 * lifeRatio);
      g.fillCircle(beam.startX, beam.startY, beam.width * 2);
      g.fillStyle(0xffffff, 0.7 * lifeRatio);
      g.fillCircle(beam.startX, beam.startY, beam.width * 0.8);

      if (beam.hitTarget) {
        const flash = beam.impactFlash;
        const impactPulse = 1 + Math.sin(frameCount * 0.8) * 0.4;

        if (flash > 0.05) {
          const flashSize = 25 * flash;
          g.fillStyle(0xffffff, flash * 0.6);
          g.fillCircle(beam.targetX, beam.targetY, flashSize);
        }

        const outerBloom = (16 + beam.width * 2) * lifeRatio * impactPulse;
        g.fillStyle(hslToHex(beam.hue, 1.0, 0.6), 0.4 * lifeRatio);
        g.fillCircle(beam.targetX, beam.targetY, outerBloom);

        const midBloom = outerBloom * 0.55;
        g.fillStyle(hslToHex(beam.hue + 20, 0.9, 0.75), 0.6 * lifeRatio);
        g.fillCircle(beam.targetX, beam.targetY, midBloom);

        const innerBloom = outerBloom * 0.25;
        g.fillStyle(0xffffff, 0.7 * lifeRatio);
        g.fillCircle(beam.targetX, beam.targetY, innerBloom);
      }
    }

    for (const p of beam.impactParticles) {
      const pLife = Math.max(0, p.life / p.maxLife);
      if (pLife < 0.01) continue;

      if (p.trail && pLife > 0.3) {
        const streakLen = Math.sqrt(p.vx * p.vx + p.vy * p.vy) * 3;
        if (streakLen > 0.5) {
          const angle = Math.atan2(p.vy, p.vx);
          const tx = p.x - Math.cos(angle) * streakLen;
          const ty = p.y - Math.sin(angle) * streakLen;
          g.lineStyle(p.size * pLife * 0.6, hslToHex(p.hue, 1.0, 0.6), pLife * 0.4);
          g.beginPath();
          g.moveTo(tx, ty);
          g.lineTo(p.x, p.y);
          g.strokePath();
        }
      }

      const glowSize = p.size * pLife * 1.8;
      g.fillStyle(hslToHex(p.hue, 1.0, 0.45), pLife * 0.4);
      g.fillCircle(p.x, p.y, glowSize);

      const pColor = hslToHex(p.hue, 1.0, 0.6 + pLife * 0.2);
      g.fillStyle(pColor, pLife * 0.8);
      g.fillCircle(p.x, p.y, p.size * pLife);

      if (pLife > 0.5) {
        g.fillStyle(0xffffff, (pLife - 0.5) * 1.4);
        g.fillCircle(p.x, p.y, p.size * pLife * 0.35);
      }
    }
  }
}
