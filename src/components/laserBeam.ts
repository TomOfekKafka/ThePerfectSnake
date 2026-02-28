import Phaser from 'phaser';

interface FireTrailParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  hue: number;
}

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
  impactParticles: KissImpactParticle[];
  fireTrail: FireTrailParticle[];
  impactFlash: number;
  wobblePhase: number;
  scale: number;
}

interface KissImpactParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  hue: number;
  trail: boolean;
  isHeart: boolean;
  rotation: number;
  rotSpeed: number;
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
const KISS_SPEED = 0.04;
const KISS_LIFE = 1.0;
const MAX_IMPACT_PARTICLES = 50;
const IMPACT_PARTICLES_PER_HIT = 16;
const AUTO_FIRE_INTERVAL = 50;
const COOLDOWN_FRAMES = 8;
const MAX_FIRE_TRAIL = 40;
const FIRE_SPAWN_RATE = 3;

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

  const hue = 320 + Math.random() * 40;

  state.beams.push({
    startX: headX,
    startY: headY,
    endX: headX,
    endY: headY,
    targetX: foodX,
    targetY: foodY,
    progress: 0,
    life: 1,
    maxLife: KISS_LIFE,
    width: 8 + Math.random() * 4,
    hue,
    hitTarget: false,
    impactParticles: [],
    fireTrail: [],
    impactFlash: 0,
    wobblePhase: Math.random() * Math.PI * 2,
    scale: 0.5 + Math.random() * 0.5,
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

  state.targetLine.flickerPhase += 0.08;
  if (state.cooldown > 0) state.cooldown--;

  if (gameStarted && !gameOver) {
    state.chargeLevel = Math.min(1, state.chargeLevel + 0.015);
    state.autoFireTimer++;
    if (state.autoFireTimer >= AUTO_FIRE_INTERVAL) {
      state.autoFireTimer = 0;
      fireLaser(state, headX, headY, foodX, foodY);
    }
  }

  for (let i = state.beams.length - 1; i >= 0; i--) {
    const beam = state.beams[i];

    beam.wobblePhase += 0.12;

    if (!beam.hitTarget) {
      beam.progress = Math.min(1, beam.progress + KISS_SPEED);

      const wobbleAmp = 20 * Math.sin(beam.progress * Math.PI);
      const dx = beam.targetX - beam.startX;
      const dy = beam.targetY - beam.startY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const nx = dist > 0 ? -dy / dist : 0;
      const ny = dist > 0 ? dx / dist : 0;
      const wobbleOffset = Math.sin(beam.wobblePhase + beam.progress * 4) * wobbleAmp;

      const baseX = beam.startX + dx * beam.progress;
      const baseY = beam.startY + dy * beam.progress;
      beam.endX = baseX + nx * wobbleOffset;
      beam.endY = baseY + ny * wobbleOffset - Math.sin(beam.progress * Math.PI) * 15;

      beam.scale = 0.6 + Math.sin(beam.progress * Math.PI) * 0.4;

      spawnFireTrailParticles(beam);

      const tdx = beam.endX - beam.targetX;
      const tdy = beam.endY - beam.targetY;
      const tdist = Math.sqrt(tdx * tdx + tdy * tdy);

      if (tdist < 12 || beam.progress >= 1) {
        beam.hitTarget = true;
        beam.impactFlash = 1.0;
        beam.endX = beam.targetX;
        beam.endY = beam.targetY;
        hitThisFrame = true;
        spawnKissImpactParticles(beam);
        spawnFireImpactParticles(beam);
      }
    }

    if (beam.hitTarget) {
      beam.endX = beam.targetX;
      beam.endY = beam.targetY;
      beam.life -= 0.03;
      beam.impactFlash *= 0.9;
      beam.scale *= 0.97;
    }

    for (let j = beam.impactParticles.length - 1; j >= 0; j--) {
      const p = beam.impactParticles[j];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.95;
      p.vy *= 0.95;
      if (p.trail) {
        p.vy -= 0.06;
      }
      p.rotation += p.rotSpeed;
      p.life -= 0.025;
      if (p.life <= 0) {
        beam.impactParticles.splice(j, 1);
      }
    }

    for (let j = beam.fireTrail.length - 1; j >= 0; j--) {
      const f = beam.fireTrail[j];
      f.x += f.vx;
      f.y += f.vy;
      f.vy -= 0.02;
      f.vx *= 0.96;
      f.size *= 0.97;
      f.life -= 0.04;
      if (f.life <= 0 || f.size < 0.3) {
        beam.fireTrail.splice(j, 1);
      }
    }

    if (beam.life <= 0 && beam.impactParticles.length === 0 && beam.fireTrail.length === 0) {
      state.beams.splice(i, 1);
    }
  }

  return hitThisFrame;
}

function spawnKissImpactParticles(beam: LaserBeam): void {
  while (beam.impactParticles.length + IMPACT_PARTICLES_PER_HIT > MAX_IMPACT_PARTICLES) {
    beam.impactParticles.shift();
  }

  for (let i = 0; i < IMPACT_PARTICLES_PER_HIT; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 4;
    const isTrail = i < 5;
    const isHeart = i < 8;
    beam.impactParticles.push({
      x: beam.targetX,
      y: beam.targetY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - (isTrail ? 1.5 : 0),
      size: isHeart ? 3 + Math.random() * 4 : 1.5 + Math.random() * 2,
      life: 1,
      maxLife: 1,
      hue: 320 + Math.random() * 40,
      trail: isTrail,
      isHeart,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.15,
    });
  }
}

function spawnFireTrailParticles(beam: LaserBeam): void {
  for (let i = 0; i < FIRE_SPAWN_RATE; i++) {
    if (beam.fireTrail.length >= MAX_FIRE_TRAIL) {
      beam.fireTrail.shift();
    }
    const spread = (Math.random() - 0.5) * 2.5;
    const life = 0.4 + Math.random() * 0.35;
    beam.fireTrail.push({
      x: beam.endX + (Math.random() - 0.5) * 6,
      y: beam.endY + (Math.random() - 0.5) * 6,
      vx: spread,
      vy: -(0.5 + Math.random() * 1.2),
      size: 2 + Math.random() * 3.5,
      life,
      maxLife: life,
      hue: 10 + Math.random() * 35,
    });
  }
}

function spawnFireImpactParticles(beam: LaserBeam): void {
  const count = 10;
  for (let i = 0; i < count; i++) {
    if (beam.fireTrail.length >= MAX_FIRE_TRAIL) {
      beam.fireTrail.shift();
    }
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 4;
    const life = 0.5 + Math.random() * 0.4;
    beam.fireTrail.push({
      x: beam.targetX,
      y: beam.targetY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.5,
      size: 2.5 + Math.random() * 3,
      life,
      maxLife: life,
      hue: 5 + Math.random() * 45,
    });
  }
}

function hslToHex(h: number, s: number, l: number): number {
  const hNorm = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hNorm / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;

  if (hNorm < 60) { r = c; g = x; }
  else if (hNorm < 120) { r = x; g = c; }
  else if (hNorm < 180) { g = c; b = x; }
  else if (hNorm < 240) { g = x; b = c; }
  else if (hNorm < 300) { r = x; b = c; }
  else { r = c; b = x; }

  const ri = Math.round((r + m) * 255);
  const gi = Math.round((g + m) * 255);
  const bi = Math.round((b + m) * 255);
  return (ri << 16) | (gi << 8) | bi;
}

function drawHeart(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  size: number,
  color: number,
  alpha: number
): void {
  g.fillStyle(color, alpha);
  g.beginPath();

  const s = size;
  const topY = cy - s * 0.3;

  g.moveTo(cx, cy + s * 0.6);
  g.lineTo(cx - s * 0.55, topY);

  const cp1x = cx - s * 0.55;
  const cp1y = topY - s * 0.6;
  const cp2x = cx;
  const cp2y = topY - s * 0.45;

  const steps = 8;
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const tt = 1 - t;
    const px = tt * tt * (cx - s * 0.55) + 2 * tt * t * cp1x + t * t * cx;
    const py = tt * tt * topY + 2 * tt * t * cp1y + t * t * cp2y;
    g.lineTo(px, py);
  }

  const cp3x = cx;
  const cp3y = topY - s * 0.45;
  const cp4x = cx + s * 0.55;
  const cp4y = topY - s * 0.6;

  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const tt = 1 - t;
    const px = tt * tt * cx + 2 * tt * t * cp3x + t * t * (cx + s * 0.55);
    const py = tt * tt * cp2y + 2 * tt * t * cp4y + t * t * topY;
    g.lineTo(px, py);
  }

  g.lineTo(cx, cy + s * 0.6);
  g.fillPath();
}

function drawMiniHeart(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  size: number,
  color: number,
  alpha: number
): void {
  g.fillStyle(color, alpha);
  const r = size * 0.45;
  g.fillCircle(cx - r * 0.5, cy - r * 0.3, r);
  g.fillCircle(cx + r * 0.5, cy - r * 0.3, r);
  g.fillTriangle(
    cx - r * 1.1, cy,
    cx + r * 1.1, cy,
    cx, cy + r * 1.2
  );
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

  const dx = foodX - headX;
  const dy = foodY - headY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 1) return;

  const nx = dx / dist;
  const ny = dy / dist;

  const chargeGlow = state.chargeLevel;
  const baseAlpha = 0.15 + chargeGlow * 0.2;

  if (chargeGlow > 0.2) {
    const pinkColor = hslToHex(340, 1.0, 0.7);
    g.lineStyle(2, pinkColor, baseAlpha * 0.3);
    g.beginPath();
    g.moveTo(headX, headY);
    g.lineTo(foodX, foodY);
    g.strokePath();
  }

  const heartSpacing = 18;
  const heartCount = Math.floor(dist / heartSpacing);
  for (let i = 0; i < heartCount; i++) {
    const t = (i + 0.5) / heartCount;
    const phase = frameCount * 0.06 + i * 0.5;
    const floatOffset = Math.sin(phase) * 3;

    const hx = headX + nx * dist * t + (-ny) * floatOffset;
    const hy = headY + ny * dist * t + nx * floatOffset;

    const pulse = 0.8 + Math.sin(phase * 1.3) * 0.2;
    const heartSize = (2.5 + chargeGlow * 1.5) * pulse;
    const heartAlpha = baseAlpha * (0.4 + Math.sin(phase) * 0.2);

    const heartColor = hslToHex(340 + Math.sin(phase) * 15, 0.9, 0.6 + chargeGlow * 0.15);
    drawMiniHeart(g, hx, hy, heartSize, heartColor, heartAlpha);
  }

  const reticleSize = 6 + Math.sin(frameCount * 0.1) * 2 + chargeGlow * 4;
  const reticleAlpha = 0.25 + chargeGlow * 0.35;
  const pinkReticle = hslToHex(340, 1.0, 0.65 + chargeGlow * 0.15);

  g.lineStyle(1.5, pinkReticle, reticleAlpha * 0.5);
  g.strokeCircle(foodX, foodY, reticleSize);

  const heartRingCount = 4;
  for (let i = 0; i < heartRingCount; i++) {
    const angle = (i / heartRingCount) * Math.PI * 2 + frameCount * 0.03;
    const rx = foodX + Math.cos(angle) * reticleSize;
    const ry = foodY + Math.sin(angle) * reticleSize;
    drawMiniHeart(g, rx, ry, 2 + chargeGlow * 1.5, pinkReticle, reticleAlpha * 0.7);
  }
}

function drawFireTrail(
  g: Phaser.GameObjects.Graphics,
  beam: LaserBeam
): void {
  for (const f of beam.fireTrail) {
    const lifeRatio = f.life / f.maxLife;
    if (lifeRatio < 0.01) continue;

    const outerHue = f.hue;
    const outerColor = hslToHex(outerHue, 1.0, 0.3 + lifeRatio * 0.15);
    g.fillStyle(outerColor, lifeRatio * 0.3);
    g.fillCircle(f.x, f.y, f.size * 1.8);

    const midColor = hslToHex(outerHue + 5, 1.0, 0.45);
    g.fillStyle(midColor, lifeRatio * 0.55);
    g.fillCircle(f.x, f.y, f.size * 1.1);

    const coreColor = hslToHex(outerHue + 20, 0.85, 0.6 + lifeRatio * 0.25);
    g.fillStyle(coreColor, lifeRatio * 0.75);
    g.fillCircle(f.x, f.y, f.size * 0.5);

    if (lifeRatio > 0.6) {
      g.fillStyle(0xffffcc, (lifeRatio - 0.6) * 1.5);
      g.fillCircle(f.x, f.y, f.size * 0.25);
    }
  }
}

export function drawLaserBeams(
  g: Phaser.GameObjects.Graphics,
  state: LaserBeamState,
  frameCount: number
): void {
  for (const beam of state.beams) {
    const lifeRatio = Math.max(0, beam.life);
    if (lifeRatio <= 0 && beam.impactParticles.length === 0) continue;

    drawFireTrail(g, beam);

    if (lifeRatio > 0 && !beam.hitTarget) {
      const kissSize = beam.width * beam.scale;
      const pulse = 1 + Math.sin(frameCount * 0.3 + beam.wobblePhase) * 0.15;
      const heartSize = kissSize * pulse;

      const fireGlowHue = 20 + Math.sin(frameCount * 0.15) * 15;
      const fireGlow = hslToHex(fireGlowHue, 1.0, 0.45);
      g.fillStyle(fireGlow, 0.25 * lifeRatio);
      g.fillCircle(beam.endX, beam.endY, heartSize * 2.5);

      const glowColor = hslToHex(beam.hue, 0.8, 0.5);
      g.fillStyle(glowColor, 0.2 * lifeRatio);
      g.fillCircle(beam.endX, beam.endY, heartSize * 2);

      const mainColor = hslToHex(beam.hue, 1.0, 0.55);
      drawHeart(g, beam.endX, beam.endY, heartSize, mainColor, 0.9 * lifeRatio);

      const highlightColor = hslToHex(beam.hue + 15, 0.6, 0.85);
      drawHeart(g, beam.endX - heartSize * 0.1, beam.endY - heartSize * 0.15, heartSize * 0.4, highlightColor, 0.6 * lifeRatio);

      const trailCount = 3;
      const dx = beam.targetX - beam.startX;
      const dy = beam.targetY - beam.startY;
      for (let t = 0; t < trailCount; t++) {
        const trailProgress = beam.progress - (t + 1) * 0.06;
        if (trailProgress <= 0) continue;
        const trailAlpha = 0.3 - t * 0.1;
        const trailSize = heartSize * (0.6 - t * 0.15);

        const baseTX = beam.startX + dx * trailProgress;
        const baseTY = beam.startY + dy * trailProgress;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const tnx = dist > 0 ? -dy / dist : 0;
        const tny = dist > 0 ? dx / dist : 0;
        const wobbleAmp = 20 * Math.sin(trailProgress * Math.PI);
        const wobbleOff = Math.sin(beam.wobblePhase + trailProgress * 4) * wobbleAmp;
        const tx = baseTX + tnx * wobbleOff;
        const ty = baseTY + tny * wobbleOff - Math.sin(trailProgress * Math.PI) * 15;

        const trailColor = hslToHex(beam.hue + 10, 0.8, 0.6);
        drawMiniHeart(g, tx, ty, trailSize, trailColor, trailAlpha * lifeRatio);
      }
    }

    if (beam.hitTarget && lifeRatio > 0) {
      const flash = beam.impactFlash;
      const impactPulse = 1 + Math.sin(frameCount * 0.6) * 0.3;

      if (flash > 0.05) {
        const flashSize = 20 * flash * impactPulse;
        const pinkFlash = hslToHex(340, 0.8, 0.85);
        g.fillStyle(pinkFlash, flash * 0.4);
        g.fillCircle(beam.targetX, beam.targetY, flashSize);
      }

      const outerGlow = (14 + beam.width) * lifeRatio * impactPulse;
      g.fillStyle(hslToHex(beam.hue, 0.9, 0.55), 0.25 * lifeRatio);
      g.fillCircle(beam.targetX, beam.targetY, outerGlow);

      const kissScale = beam.width * lifeRatio * 0.8;
      const mainColor = hslToHex(beam.hue, 1.0, 0.55);
      drawHeart(g, beam.targetX, beam.targetY, kissScale, mainColor, 0.5 * lifeRatio);
    }

    for (const p of beam.impactParticles) {
      const pLife = Math.max(0, p.life / p.maxLife);
      if (pLife < 0.01) continue;

      if (p.isHeart) {
        const heartColor = hslToHex(p.hue, 1.0, 0.6 + pLife * 0.15);
        const heartGlow = hslToHex(p.hue, 0.8, 0.5);
        g.fillStyle(heartGlow, pLife * 0.3);
        g.fillCircle(p.x, p.y, p.size * pLife * 1.5);
        drawMiniHeart(g, p.x, p.y, p.size * pLife, heartColor, pLife * 0.85);
      } else {
        const glowSize = p.size * pLife * 1.6;
        g.fillStyle(hslToHex(p.hue, 1.0, 0.5), pLife * 0.35);
        g.fillCircle(p.x, p.y, glowSize);

        const pColor = hslToHex(p.hue, 1.0, 0.65 + pLife * 0.2);
        g.fillStyle(pColor, pLife * 0.75);
        g.fillCircle(p.x, p.y, p.size * pLife);

        if (pLife > 0.5) {
          g.fillStyle(0xffffff, (pLife - 0.5) * 0.8);
          g.fillCircle(p.x, p.y, p.size * pLife * 0.3);
        }
      }
    }
  }
}
