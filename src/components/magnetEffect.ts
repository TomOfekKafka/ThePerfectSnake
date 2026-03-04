import { THEME } from './gameTheme';

export interface MagnetParticle {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
  size: number;
  life: number;
  color: number;
}

export interface MagnetBeam {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  width: number;
  phase: number;
}

export interface MagnetEffectState {
  particles: MagnetParticle[];
  beams: MagnetBeam[];
  auraPhase: number;
  active: boolean;
  pulseIntensity: number;
}

const MAX_MAGNET_PARTICLES = 40;
const MAGNET_COLORS = [
  0x00ccff,
  0x4488ff,
  0x66ddff,
  0x22aaee,
  0xaaeeff,
];
const AURA_COLOR = 0x00bbff;

export const createMagnetEffectState = (): MagnetEffectState => ({
  particles: [],
  beams: [],
  auraPhase: 0,
  active: false,
  pulseIntensity: 0,
});

const spawnMagnetParticle = (
  particles: MagnetParticle[],
  sourceX: number,
  sourceY: number,
  targetX: number,
  targetY: number
): void => {
  if (particles.length >= MAX_MAGNET_PARTICLES) return;

  const angle = Math.random() * Math.PI * 2;
  const radius = 8 + Math.random() * 12;

  particles.push({
    x: sourceX + Math.cos(angle) * radius,
    y: sourceY + Math.sin(angle) * radius,
    targetX,
    targetY,
    speed: 1.5 + Math.random() * 2.5,
    size: 1.5 + Math.random() * 2,
    life: 1,
    color: MAGNET_COLORS[Math.floor(Math.random() * MAGNET_COLORS.length)],
  });
};

interface FoodTarget {
  x: number;
  y: number;
}

export const updateMagnetEffect = (
  state: MagnetEffectState,
  active: boolean,
  headX: number,
  headY: number,
  foodTargets: FoodTarget[]
): void => {
  state.active = active;

  if (active) {
    state.pulseIntensity = Math.min(1, state.pulseIntensity + 0.08);
    state.auraPhase += 0.12;

    for (const target of foodTargets) {
      if (Math.random() < 0.4) {
        spawnMagnetParticle(state.particles, target.x, target.y, headX, headY);
      }
    }

    state.beams = foodTargets.map((target, i) => ({
      fromX: headX,
      fromY: headY,
      toX: target.x,
      toY: target.y,
      width: 2,
      phase: state.auraPhase + i * 1.5,
    }));
  } else {
    state.pulseIntensity = Math.max(0, state.pulseIntensity - 0.05);
    state.beams = [];
  }

  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    const dx = p.targetX - p.x;
    const dy = p.targetY - p.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 3) {
      state.particles.splice(i, 1);
      continue;
    }

    const nx = dx / dist;
    const ny = dy / dist;
    p.x += nx * p.speed;
    p.y += ny * p.speed;
    p.life -= 0.015;

    if (p.life <= 0) {
      state.particles.splice(i, 1);
    }
  }
};

const drawLightningSegment = (
  g: Phaser.GameObjects.Graphics,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  segments: number,
  jitter: number,
  alpha: number,
  color: number
): void => {
  g.lineStyle(1.5, color, alpha);
  g.beginPath();
  g.moveTo(x1, y1);

  const dx = x2 - x1;
  const dy = y2 - y1;

  for (let i = 1; i < segments; i++) {
    const t = i / segments;
    const mx = x1 + dx * t + (Math.random() - 0.5) * jitter;
    const my = y1 + dy * t + (Math.random() - 0.5) * jitter;
    g.lineTo(mx, my);
  }

  g.lineTo(x2, y2);
  g.strokePath();
};

export const drawMagnetEffect = (
  g: Phaser.GameObjects.Graphics,
  state: MagnetEffectState,
  headX: number,
  headY: number,
  frameCount: number
): void => {
  if (state.pulseIntensity <= 0) return;

  const intensity = state.pulseIntensity;

  const auraPulse = 0.6 + Math.sin(state.auraPhase) * 0.4;
  const auraRadius = 14 + auraPulse * 8;

  for (let ring = 3; ring > 0; ring--) {
    const r = auraRadius + ring * 5;
    const a = intensity * 0.12 * (1 - ring / 4);
    g.lineStyle(2, AURA_COLOR, a);
    g.strokeCircle(headX, headY, r);
  }

  g.fillStyle(AURA_COLOR, intensity * 0.08 * auraPulse);
  g.fillCircle(headX, headY, auraRadius);

  const fieldLineCount = 8;
  for (let i = 0; i < fieldLineCount; i++) {
    const angle = (i / fieldLineCount) * Math.PI * 2 + state.auraPhase * 0.3;
    const innerR = auraRadius + 2;
    const outerR = auraRadius + 10 + Math.sin(state.auraPhase * 2 + i) * 4;
    const x1 = headX + Math.cos(angle) * innerR;
    const y1 = headY + Math.sin(angle) * innerR;
    const x2 = headX + Math.cos(angle) * outerR;
    const y2 = headY + Math.sin(angle) * outerR;

    g.lineStyle(1, AURA_COLOR, intensity * 0.3 * auraPulse);
    g.beginPath();
    g.moveTo(x1, y1);
    g.lineTo(x2, y2);
    g.strokePath();
  }

  for (const beam of state.beams) {
    const dist = Math.sqrt(
      (beam.toX - beam.fromX) ** 2 + (beam.toY - beam.fromY) ** 2
    );
    const segments = Math.max(4, Math.floor(dist / 10));
    const jitter = 4 + Math.sin(beam.phase) * 2;

    drawLightningSegment(
      g, beam.fromX, beam.fromY, beam.toX, beam.toY,
      segments, jitter, intensity * 0.35, 0x44aaff
    );
    drawLightningSegment(
      g, beam.fromX, beam.fromY, beam.toX, beam.toY,
      segments, jitter * 0.5, intensity * 0.5, 0x88ddff
    );

    const glowAlpha = intensity * 0.15 * (0.7 + Math.sin(beam.phase * 2) * 0.3);
    g.fillStyle(0x00ccff, glowAlpha);
    g.fillCircle(beam.toX, beam.toY, 6);
  }

  for (const p of state.particles) {
    const alpha = p.life * intensity * 0.8;
    g.fillStyle(p.color, alpha * 0.3);
    g.fillCircle(p.x, p.y, p.size + 1.5);
    g.fillStyle(p.color, alpha);
    g.fillCircle(p.x, p.y, p.size);
    g.fillStyle(0xffffff, alpha * 0.6);
    g.fillCircle(p.x, p.y, p.size * 0.4);
  }
};
