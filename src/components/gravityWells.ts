import { THEME } from './gameTheme';

export interface GravityParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  orbitRadius: number;
  size: number;
  alpha: number;
  life: number;
  color: number;
}

export interface GravityWell {
  x: number;
  y: number;
  strength: number;
  radius: number;
  maxRadius: number;
  phase: number;
  life: number;
  maxLife: number;
  particles: GravityParticle[];
  ringRotation: number;
  pulsePhase: number;
  fadeIn: number;
}

export interface GravityWellsState {
  wells: GravityWell[];
  spawnTimer: number;
  fieldLines: FieldLine[];
}

interface FieldLine {
  x: number;
  y: number;
  angle: number;
  length: number;
  alpha: number;
  speed: number;
  wellIndex: number;
}

const MAX_WELLS = 2;
const MAX_PARTICLES_PER_WELL = 30;
const MAX_FIELD_LINES = 24;
const WELL_MIN_LIFE = 200;
const WELL_MAX_LIFE = 400;
const SPAWN_INTERVAL = 180;
const GRAVITY_STRENGTH = 0.08;
const PULL_RADIUS = 120;

const WELL_COLORS = [0x8844ff, 0x6622dd, 0xaa66ff, 0x5511cc];
const ACCRETION_COLORS = [0xcc88ff, 0x9955ee, 0x7733cc, 0xbb77ff, 0x00ccff];

export function createGravityWellsState(): GravityWellsState {
  return {
    wells: [],
    spawnTimer: 60,
    fieldLines: [],
  };
}

function spawnAccretionParticle(well: GravityWell): GravityParticle {
  const angle = Math.random() * Math.PI * 2;
  const orbitRadius = well.radius * (0.5 + Math.random() * 1.5);
  return {
    x: well.x + Math.cos(angle) * orbitRadius,
    y: well.y + Math.sin(angle) * orbitRadius,
    vx: 0,
    vy: 0,
    angle,
    orbitRadius,
    size: 1 + Math.random() * 2.5,
    alpha: 0.4 + Math.random() * 0.5,
    life: 0.6 + Math.random() * 0.4,
    color: ACCRETION_COLORS[Math.floor(Math.random() * ACCRETION_COLORS.length)],
  };
}

export function spawnGravityWell(
  state: GravityWellsState,
  boardWidth: number,
  boardHeight: number
): void {
  if (state.wells.length >= MAX_WELLS) return;

  const margin = 40;
  const x = margin + Math.random() * (boardWidth - margin * 2);
  const y = margin + Math.random() * (boardHeight - margin * 2);
  const life = WELL_MIN_LIFE + Math.random() * (WELL_MAX_LIFE - WELL_MIN_LIFE);

  const well: GravityWell = {
    x,
    y,
    strength: GRAVITY_STRENGTH,
    radius: 8,
    maxRadius: PULL_RADIUS,
    phase: 0,
    life,
    maxLife: life,
    particles: [],
    ringRotation: 0,
    pulsePhase: Math.random() * Math.PI * 2,
    fadeIn: 0,
  };

  for (let i = 0; i < 12; i++) {
    well.particles.push(spawnAccretionParticle(well));
  }

  state.wells.push(well);
}

function spawnFieldLines(state: GravityWellsState, wellIndex: number, well: GravityWell): void {
  const linesForWell = state.fieldLines.filter(l => l.wellIndex === wellIndex).length;
  if (linesForWell >= 12) return;

  const angle = Math.random() * Math.PI * 2;
  const dist = well.maxRadius * (0.3 + Math.random() * 0.7);

  state.fieldLines.push({
    x: well.x + Math.cos(angle) * dist,
    y: well.y + Math.sin(angle) * dist,
    angle,
    length: 10 + Math.random() * 20,
    alpha: 0.15 + Math.random() * 0.2,
    speed: 0.5 + Math.random() * 1.5,
    wellIndex,
  });
}

export function updateGravityWells(
  state: GravityWellsState,
  boardWidth: number,
  boardHeight: number,
  gameActive: boolean
): void {
  if (gameActive) {
    state.spawnTimer--;
    if (state.spawnTimer <= 0 && state.wells.length < MAX_WELLS) {
      spawnGravityWell(state, boardWidth, boardHeight);
      state.spawnTimer = SPAWN_INTERVAL + Math.random() * 100;
    }
  }

  for (let wi = state.wells.length - 1; wi >= 0; wi--) {
    const well = state.wells[wi];
    well.life--;
    well.phase += 0.03;
    well.ringRotation += 0.015;
    well.pulsePhase += 0.06;
    well.fadeIn = Math.min(1, well.fadeIn + 0.02);

    const lifeRatio = well.life / well.maxLife;
    const fadeOut = well.life < 60 ? well.life / 60 : 1;
    const effectiveStrength = well.strength * well.fadeIn * fadeOut;

    for (const p of well.particles) {
      const dx = well.x - p.x;
      const dy = well.y - p.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 2) {
        const force = effectiveStrength * 2 / Math.max(dist, 10);
        p.vx += (dx / dist) * force;
        p.vy += (dy / dist) * force;
      }

      const tangentX = -dy / Math.max(dist, 1);
      const tangentY = dx / Math.max(dist, 1);
      p.vx += tangentX * 0.15;
      p.vy += tangentY * 0.15;

      p.vx *= 0.96;
      p.vy *= 0.96;
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 0.003;
      p.alpha = Math.max(0, p.life * fadeOut * 0.7);

      if (dist < 5) {
        p.life = 0;
      }
    }

    well.particles = well.particles.filter(p => p.life > 0);

    if (well.particles.length < MAX_PARTICLES_PER_WELL && Math.random() < 0.3) {
      well.particles.push(spawnAccretionParticle(well));
    }

    spawnFieldLines(state, wi, well);

    if (well.life <= 0) {
      state.wells.splice(wi, 1);
      state.fieldLines = state.fieldLines.filter(l => l.wellIndex !== wi);
      for (const l of state.fieldLines) {
        if (l.wellIndex > wi) l.wellIndex--;
      }
    }
  }

  for (let fi = state.fieldLines.length - 1; fi >= 0; fi--) {
    const line = state.fieldLines[fi];
    const well = state.wells[line.wellIndex];
    if (!well) {
      state.fieldLines.splice(fi, 1);
      continue;
    }

    const dx = well.x - line.x;
    const dy = well.y - line.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 3) {
      line.x += (dx / dist) * line.speed;
      line.y += (dy / dist) * line.speed;
      line.angle = Math.atan2(dy, dx);
    }

    if (dist < 10 || line.alpha <= 0) {
      state.fieldLines.splice(fi, 1);
      continue;
    }

    line.alpha *= 0.995;
  }

  if (state.fieldLines.length > MAX_FIELD_LINES) {
    state.fieldLines.splice(0, state.fieldLines.length - MAX_FIELD_LINES);
  }
}

export function applyGravityToPoint(
  state: GravityWellsState,
  px: number,
  py: number
): { dx: number; dy: number } {
  let totalDx = 0;
  let totalDy = 0;

  for (const well of state.wells) {
    const dx = well.x - px;
    const dy = well.y - py;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < well.maxRadius && dist > 5) {
      const fadeOut = well.life < 60 ? well.life / 60 : 1;
      const force = well.strength * well.fadeIn * fadeOut * 40 / (dist * 0.5);
      totalDx += (dx / dist) * force;
      totalDy += (dy / dist) * force;
    }
  }

  return { dx: totalDx, dy: totalDy };
}

export function drawGravityWells(
  g: Phaser.GameObjects.Graphics,
  state: GravityWellsState,
  frameCount: number
): void {
  for (const well of state.wells) {
    const fadeOut = well.life < 60 ? well.life / 60 : 1;
    const alpha = well.fadeIn * fadeOut;
    if (alpha < 0.01) continue;

    const pulse = 0.8 + Math.sin(well.pulsePhase) * 0.2;

    drawFieldLines(g, state, well, alpha);
    drawAccretionDisk(g, well, alpha, pulse, frameCount);
    drawSingularity(g, well, alpha, pulse, frameCount);
    drawGravityRings(g, well, alpha, frameCount);
  }
}

function drawFieldLines(
  g: Phaser.GameObjects.Graphics,
  state: GravityWellsState,
  well: GravityWell,
  alpha: number
): void {
  for (const line of state.fieldLines) {
    if (line.alpha < 0.01) continue;
    const lx = line.x;
    const ly = line.y;
    const endX = lx + Math.cos(line.angle) * line.length;
    const endY = ly + Math.sin(line.angle) * line.length;

    g.lineStyle(1, 0x8855dd, line.alpha * alpha * 0.5);
    g.lineBetween(lx, ly, endX, endY);

    g.fillStyle(0xaa77ff, line.alpha * alpha * 0.6);
    g.fillCircle(lx, ly, 1.5);
  }
}

function drawAccretionDisk(
  g: Phaser.GameObjects.Graphics,
  well: GravityWell,
  alpha: number,
  pulse: number,
  frameCount: number
): void {
  for (const p of well.particles) {
    if (p.alpha < 0.02) continue;
    const dx = p.x - well.x;
    const dy = p.y - well.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const distFactor = Math.min(1, dist / well.maxRadius);

    const trailLen = 3 + distFactor * 5;
    const angle = Math.atan2(dy, dx);
    const tailX = p.x - Math.cos(angle + 0.3) * trailLen;
    const tailY = p.y - Math.sin(angle + 0.3) * trailLen;

    g.lineStyle(p.size * 0.6, p.color, p.alpha * alpha * 0.4);
    g.lineBetween(tailX, tailY, p.x, p.y);

    g.fillStyle(p.color, p.alpha * alpha);
    g.fillCircle(p.x, p.y, p.size * pulse);

    g.fillStyle(0xffffff, p.alpha * alpha * 0.4);
    g.fillCircle(p.x, p.y, p.size * 0.4);
  }
}

function drawSingularity(
  g: Phaser.GameObjects.Graphics,
  well: GravityWell,
  alpha: number,
  pulse: number,
  frameCount: number
): void {
  const coreRadius = 6 * pulse;

  g.fillStyle(0x220044, alpha * 0.3);
  g.fillCircle(well.x, well.y, coreRadius * 4);

  g.fillStyle(0x330066, alpha * 0.4);
  g.fillCircle(well.x, well.y, coreRadius * 2.5);

  g.fillStyle(0x110022, alpha * 0.9);
  g.fillCircle(well.x, well.y, coreRadius);

  const innerPulse = 0.5 + Math.sin(frameCount * 0.15) * 0.3;
  g.fillStyle(0x6633cc, alpha * innerPulse * 0.6);
  g.fillCircle(well.x, well.y, coreRadius * 0.6);

  g.fillStyle(0xccaaff, alpha * 0.3 * pulse);
  g.fillCircle(well.x + coreRadius * 0.2, well.y - coreRadius * 0.2, coreRadius * 0.2);
}

function drawGravityRings(
  g: Phaser.GameObjects.Graphics,
  well: GravityWell,
  alpha: number,
  frameCount: number
): void {
  const ringCount = 3;
  for (let i = 0; i < ringCount; i++) {
    const baseRadius = 15 + i * 20;
    const wobble = Math.sin(well.ringRotation * 2 + i * 1.2) * 4;
    const ringRadius = baseRadius + wobble;
    const ringAlpha = alpha * (0.12 - i * 0.03) * (0.7 + Math.sin(frameCount * 0.05 + i) * 0.3);

    if (ringAlpha < 0.01) continue;

    const color = WELL_COLORS[i % WELL_COLORS.length];
    g.lineStyle(1.5, color, ringAlpha);

    const segments = 24;
    const startAngle = well.ringRotation + i * 0.5;
    for (let s = 0; s < segments; s++) {
      const a1 = startAngle + (s / segments) * Math.PI * 2;
      const a2 = startAngle + ((s + 1) / segments) * Math.PI * 2;
      const gap = Math.sin(a1 * 3 + frameCount * 0.02) * 0.5 + 0.5;
      if (gap < 0.3) continue;

      const x1 = well.x + Math.cos(a1) * ringRadius;
      const y1 = well.y + Math.sin(a1) * ringRadius;
      const x2 = well.x + Math.cos(a2) * ringRadius;
      const y2 = well.y + Math.sin(a2) * ringRadius;

      g.lineStyle(1.5, color, ringAlpha * gap);
      g.lineBetween(x1, y1, x2, y2);
    }
  }

  const distortRadius = 25 + Math.sin(frameCount * 0.08) * 5;
  const distortAlpha = alpha * 0.06;
  g.fillStyle(THEME.effects.trail, distortAlpha);
  g.fillCircle(well.x, well.y, distortRadius);
}
