import Phaser from 'phaser';
import { lerpColor } from './colorUtils';

const GOLD = 0xffd700;
const GOLD_LIGHT = 0xffe066;
const GOLD_DARK = 0xcc8800;
const GOLD_EMBER = 0xff8c00;

const FORMATION_DURATION = 90;
const GLOW_DURATION = 120;
const FADE_DURATION = 60;
const TOTAL_DURATION = FORMATION_DURATION + GLOW_DURATION + FADE_DURATION;

interface OuroborosSegment {
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  currentX: number;
  currentY: number;
  targetAngle: number;
}

interface OuroborosParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: number;
}

export interface OuroborosState {
  active: boolean;
  phase: number;
  segments: OuroborosSegment[];
  centerX: number;
  centerY: number;
  radius: number;
  particles: OuroborosParticle[];
  glowIntensity: number;
}

const MAX_PARTICLES = 60;

export function createOuroborosState(): OuroborosState {
  return {
    active: false,
    phase: 0,
    segments: [],
    centerX: 0,
    centerY: 0,
    radius: 0,
    particles: [],
    glowIntensity: 0,
  };
}

export function triggerOuroboros(
  state: OuroborosState,
  snake: { x: number; y: number }[],
  cellSize: number,
  boardSize: number
): void {
  state.active = true;
  state.phase = 0;
  state.particles = [];
  state.glowIntensity = 0;

  const boardCenter = (boardSize * cellSize) / 2;
  state.centerX = boardCenter;
  state.centerY = boardCenter;

  const segCount = snake.length;
  const minRadius = cellSize * 2.5;
  const circumference = segCount * cellSize * 0.85;
  state.radius = Math.max(minRadius, circumference / (Math.PI * 2));
  state.radius = Math.min(state.radius, boardCenter * 0.7);

  state.segments = snake.map((seg, i) => {
    const angle = (i / segCount) * Math.PI * 2 - Math.PI / 2;
    const startX = seg.x * cellSize + cellSize / 2;
    const startY = seg.y * cellSize + cellSize / 2;
    const targetX = state.centerX + Math.cos(angle) * state.radius;
    const targetY = state.centerY + Math.sin(angle) * state.radius;

    return {
      startX,
      startY,
      targetX,
      targetY,
      currentX: startX,
      currentY: startY,
      targetAngle: angle,
    };
  });
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function spawnOuroborosParticles(state: OuroborosState): void {
  if (state.particles.length >= MAX_PARTICLES) return;

  const count = 2 + Math.floor(Math.random() * 3);
  for (let i = 0; i < count && state.particles.length < MAX_PARTICLES; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = state.radius * (0.8 + Math.random() * 0.4);
    const x = state.centerX + Math.cos(angle) * dist;
    const y = state.centerY + Math.sin(angle) * dist;
    const speed = 0.3 + Math.random() * 0.8;
    const outAngle = Math.atan2(y - state.centerY, x - state.centerX);

    state.particles.push({
      x,
      y,
      vx: Math.cos(outAngle) * speed,
      vy: Math.sin(outAngle) * speed,
      size: 1 + Math.random() * 2.5,
      alpha: 0.6 + Math.random() * 0.4,
      color: Math.random() > 0.5 ? GOLD : GOLD_LIGHT,
    });
  }
}

export function updateOuroboros(state: OuroborosState): void {
  if (!state.active) return;

  state.phase += 1;

  const formationProgress = Math.min(1, state.phase / FORMATION_DURATION);
  const eased = easeInOutCubic(formationProgress);

  for (const seg of state.segments) {
    seg.currentX = seg.startX + (seg.targetX - seg.startX) * eased;
    seg.currentY = seg.startY + (seg.targetY - seg.startY) * eased;
  }

  if (formationProgress >= 0.5) {
    state.glowIntensity = Math.min(1, (formationProgress - 0.5) * 2);
  }

  if (state.phase > FORMATION_DURATION) {
    const glowPhase = state.phase - FORMATION_DURATION;
    state.glowIntensity = 0.7 + Math.sin(glowPhase * 0.06) * 0.3;
  }

  if (state.phase > FORMATION_DURATION && state.phase < FORMATION_DURATION + GLOW_DURATION) {
    spawnOuroborosParticles(state);
  }

  if (state.phase > FORMATION_DURATION + GLOW_DURATION) {
    const fadeProgress = (state.phase - FORMATION_DURATION - GLOW_DURATION) / FADE_DURATION;
    state.glowIntensity = Math.max(0, 1 - fadeProgress);
  }

  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.alpha *= 0.97;
    p.size *= 0.995;
    if (p.alpha < 0.02) {
      state.particles.splice(i, 1);
    }
  }

  if (state.phase > TOTAL_DURATION) {
    state.active = false;
  }
}

function drawOuroborosRing(
  g: Phaser.GameObjects.Graphics,
  state: OuroborosState,
  frameCount: number
): void {
  const segCount = state.segments.length;
  if (segCount === 0) return;

  const formationProgress = Math.min(1, state.phase / FORMATION_DURATION);

  if (formationProgress > 0.3) {
    const ringAlpha = Math.min(0.25, (formationProgress - 0.3) * 0.5) * state.glowIntensity;
    g.lineStyle(state.radius * 0.15, GOLD, ringAlpha * 0.15);
    g.strokeCircle(state.centerX, state.centerY, state.radius);
  }

  for (let i = 0; i < segCount; i++) {
    const seg = state.segments[i];
    const next = state.segments[(i + 1) % segCount];

    const progressAlpha = i === 0 ? 0.95 : 0.9 - (i / segCount) * 0.3;
    const colorProgress = i / segCount;
    const baseColor = lerpColor(GOLD, GOLD_DARK, colorProgress * 0.6);

    const pulse = Math.sin(frameCount * 0.04 + i * 0.3) * 0.1;
    const segSize = 6 + (1 - colorProgress) * 4;

    if (formationProgress > 0.5 && state.glowIntensity > 0.1) {
      g.fillStyle(GOLD_LIGHT, state.glowIntensity * 0.12 + pulse * 0.04);
      g.fillCircle(seg.currentX, seg.currentY, segSize + 4);
    }

    g.fillStyle(baseColor, progressAlpha);
    g.fillCircle(seg.currentX, seg.currentY, segSize);

    const highlightAlpha = 0.25 + pulse * 0.1;
    g.fillStyle(GOLD_LIGHT, highlightAlpha);
    g.fillCircle(
      seg.currentX - segSize * 0.2,
      seg.currentY - segSize * 0.2,
      segSize * 0.35
    );

    if (formationProgress > 0.7) {
      const dx = next.currentX - seg.currentX;
      const dy = next.currentY - seg.currentY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < segSize * 5) {
        g.lineStyle(2.5, baseColor, progressAlpha * 0.6);
        g.lineBetween(seg.currentX, seg.currentY, next.currentX, next.currentY);
      }
    }
  }

  if (segCount > 0 && formationProgress > 0.8) {
    const head = state.segments[0];
    const headSize = 10;
    const headPulse = Math.sin(frameCount * 0.06) * 0.15;

    g.fillStyle(GOLD, 0.15 + headPulse * 0.05);
    g.fillCircle(head.currentX, head.currentY, headSize + 6);
    g.fillStyle(GOLD, 0.95);
    g.fillCircle(head.currentX, head.currentY, headSize);
    g.fillStyle(GOLD_LIGHT, 0.5);
    g.fillCircle(head.currentX - 2, head.currentY - 2, headSize * 0.45);

    const eyeOffset = headSize * 0.3;
    g.fillStyle(0x000000, 0.8);
    g.fillCircle(head.currentX - eyeOffset, head.currentY - eyeOffset, 1.5);
    g.fillCircle(head.currentX + eyeOffset, head.currentY - eyeOffset, 1.5);
  }
}

function drawCenterGlow(
  g: Phaser.GameObjects.Graphics,
  state: OuroborosState,
  frameCount: number
): void {
  if (state.glowIntensity < 0.05) return;

  const pulse = Math.sin(frameCount * 0.03) * 0.2;
  const layers = 5;

  for (let i = layers; i >= 0; i--) {
    const layerRadius = state.radius * (0.3 + (i / layers) * 0.5);
    const layerAlpha = state.glowIntensity * (0.04 - (i / layers) * 0.03) * (1 + pulse);
    g.fillStyle(GOLD, Math.max(0, layerAlpha));
    g.fillCircle(state.centerX, state.centerY, layerRadius);
  }

  const rayCount = 8;
  const rayAlpha = state.glowIntensity * 0.06;
  for (let i = 0; i < rayCount; i++) {
    const angle = (i / rayCount) * Math.PI * 2 + frameCount * 0.005;
    const innerR = state.radius * 0.3;
    const outerR = state.radius * (0.9 + pulse * 0.15);

    g.lineStyle(1.5, GOLD_LIGHT, rayAlpha);
    g.lineBetween(
      state.centerX + Math.cos(angle) * innerR,
      state.centerY + Math.sin(angle) * innerR,
      state.centerX + Math.cos(angle) * outerR,
      state.centerY + Math.sin(angle) * outerR
    );
  }
}

function drawOuroborosParticles(
  g: Phaser.GameObjects.Graphics,
  state: OuroborosState
): void {
  for (const p of state.particles) {
    g.fillStyle(p.color, p.alpha * 0.3);
    g.fillCircle(p.x, p.y, p.size + 1);
    g.fillStyle(p.color, p.alpha);
    g.fillCircle(p.x, p.y, p.size);
  }
}

export function drawOuroboros(
  g: Phaser.GameObjects.Graphics,
  state: OuroborosState,
  _width: number,
  _height: number,
  frameCount: number
): void {
  if (!state.active && state.particles.length === 0) return;

  drawCenterGlow(g, state, frameCount);
  drawOuroborosRing(g, state, frameCount);
  drawOuroborosParticles(g, state);
}
