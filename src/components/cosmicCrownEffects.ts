import Phaser from 'phaser';

export interface CrownBeam {
  x: number;
  y: number;
  particles: BeamParticle[];
  glowRadius: number;
  glowPhase: number;
}

interface BeamParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: number;
}

export interface StarBurst {
  x: number;
  y: number;
  life: number;
  maxLife: number;
  tier: 'nova' | 'supernova' | 'hypernova';
  rays: { angle: number; dist: number; speed: number; size: number }[];
}

export interface CosmicCrownState {
  beam: CrownBeam;
  bursts: StarBurst[];
  frameCount: number;
  nebulaPhase: number;
}

const BURST_COLORS: Record<string, number> = {
  nova: 0x00ffff,
  supernova: 0xaa66ff,
  hypernova: 0xffd700,
};

const MAX_BEAM_PARTICLES = 30;
const MAX_BURSTS = 5;

export function createCosmicCrownState(): CosmicCrownState {
  return {
    beam: { x: 0, y: 0, particles: [], glowRadius: 20, glowPhase: 0 },
    bursts: [],
    frameCount: 0,
    nebulaPhase: 0,
  };
}

export function initCrownBeam(
  state: CosmicCrownState,
  width: number,
  _height: number
): void {
  state.beam = {
    x: width / 2,
    y: 8,
    particles: [],
    glowRadius: 22,
    glowPhase: 0,
  };
}

export function updateCosmicCrown(
  state: CosmicCrownState,
  width: number
): void {
  state.frameCount++;
  state.nebulaPhase += 0.012;
  updateBeamParticles(state.beam, width);
  updateStarBursts(state.bursts);
}

function updateBeamParticles(beam: CrownBeam, _width: number): void {
  beam.glowPhase += 0.06;

  if (beam.particles.length < MAX_BEAM_PARTICLES) {
    beam.particles.push({
      x: beam.x + (Math.random() - 0.5) * 40,
      y: beam.y + Math.random() * 3,
      vx: (Math.random() - 0.5) * 0.5,
      vy: 0.3 + Math.random() * 0.6,
      life: 1,
      maxLife: 1,
      size: 1 + Math.random() * 2.5,
      hue: Math.random(),
    });
  }

  for (let i = beam.particles.length - 1; i >= 0; i--) {
    const p = beam.particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.035;
    p.size *= 0.98;
    if (p.life <= 0) {
      beam.particles.splice(i, 1);
    }
  }
}

function updateStarBursts(bursts: StarBurst[]): void {
  for (let i = bursts.length - 1; i >= 0; i--) {
    const b = bursts[i];
    b.life -= 0.025;
    for (const r of b.rays) {
      r.dist += r.speed;
    }
    if (b.life <= 0) {
      bursts.splice(i, 1);
    }
  }
}

export function spawnStarBurst(
  state: CosmicCrownState,
  x: number,
  y: number,
  foodEaten: number
): void {
  if (state.bursts.length >= MAX_BURSTS) {
    state.bursts.shift();
  }

  const tiers: Array<'nova' | 'supernova' | 'hypernova'> = ['nova', 'supernova', 'hypernova'];
  const tier = tiers[foodEaten % 3];
  const rayCount = tier === 'hypernova' ? 12 : tier === 'supernova' ? 10 : 8;
  const rays = [];
  for (let i = 0; i < rayCount; i++) {
    rays.push({
      angle: (i / rayCount) * Math.PI * 2,
      dist: 0,
      speed: 1.0 + Math.random() * 0.8,
      size: 1.5 + Math.random() * 2.5,
    });
  }

  state.bursts.push({ x, y, life: 1, maxLife: 1, tier, rays });
}

function drawStarShape(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  points: number
): void {
  const step = Math.PI / points;
  for (let i = 0; i < points * 2; i++) {
    const angle = i * step - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    const nx = cx + Math.cos(angle) * r;
    const ny = cy + Math.sin(angle) * r;
    const nextAngle = (i + 1) * step - Math.PI / 2;
    const nr = (i + 1) % 2 === 0 ? outerR : innerR;
    const nnx = cx + Math.cos(nextAngle) * nr;
    const nny = cy + Math.sin(nextAngle) * nr;
    g.lineBetween(nx, ny, nnx, nny);
  }
}

export function drawCrownBeam(
  g: Phaser.GameObjects.Graphics,
  beam: CrownBeam
): void {
  const glowPulse = 0.7 + Math.sin(beam.glowPhase) * 0.3;

  g.fillStyle(0xaa66ff, 0.04 * glowPulse);
  g.fillCircle(beam.x, beam.y + 10, beam.glowRadius * 2.5);
  g.fillStyle(0x00ffff, 0.06 * glowPulse);
  g.fillCircle(beam.x, beam.y + 10, beam.glowRadius * 1.5);

  for (const p of beam.particles) {
    const t = 1 - p.life;
    let color: number;
    if (p.hue < 0.33) {
      color = 0x00ffff;
    } else if (p.hue < 0.66) {
      color = 0xaa66ff;
    } else {
      color = 0xffd700;
    }
    g.fillStyle(color, p.life * 0.5);
    g.fillCircle(p.x, p.y, p.size * (1 - t * 0.3));
  }
}

export function drawNebulaLines(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  _cellSize: number,
  frameCount: number
): void {
  const lineCount = 3;
  const spacing = height / (lineCount + 1);

  for (let i = 1; i <= lineCount; i++) {
    const baseY = i * spacing;
    const alpha = 0.04 + Math.sin(frameCount * 0.015 + i * 0.8) * 0.02;
    const waveAmp = 3 + Math.sin(frameCount * 0.01 + i) * 2;

    g.lineStyle(1, 0xaa66ff, alpha);
    const segments = 20;
    for (let j = 0; j < segments; j++) {
      const x1 = (j / segments) * width;
      const x2 = ((j + 1) / segments) * width;
      const y1 = baseY + Math.sin(frameCount * 0.02 + j * 0.5 + i) * waveAmp;
      const y2 = baseY + Math.sin(frameCount * 0.02 + (j + 1) * 0.5 + i) * waveAmp;
      g.lineBetween(x1, y1, x2, y2);
    }
  }
}

export function drawStarBursts(
  g: Phaser.GameObjects.Graphics,
  state: CosmicCrownState,
  drawText: (
    g: Phaser.GameObjects.Graphics,
    text: string,
    x: number,
    y: number,
    size: number,
    color: number,
    alpha: number
  ) => void
): void {
  for (const b of state.bursts) {
    const alpha = b.life;
    const color = BURST_COLORS[b.tier];
    const rise = (1 - b.life) * 18;

    g.fillStyle(color, alpha * 0.3);
    g.fillCircle(b.x, b.y - rise, 10);

    g.fillStyle(color, alpha * 0.6);
    g.fillCircle(b.x, b.y - rise, 6);

    g.lineStyle(1, color, alpha * 0.5);
    drawStarShape(g, b.x, b.y - rise, 8 * alpha, 3 * alpha, 4);

    g.fillStyle(0xffffff, alpha * 0.5);
    g.fillCircle(b.x, b.y - rise, 2);

    for (const r of b.rays) {
      const rx = b.x + Math.cos(r.angle) * r.dist;
      const ry = b.y - rise + Math.sin(r.angle) * r.dist;
      g.fillStyle(color, alpha * 0.4);
      g.fillCircle(rx, ry, r.size * alpha);
    }

    const label = b.tier === 'hypernova' ? 'HYPER' : b.tier === 'supernova' ? 'SUPER' : 'NOVA';
    const textW = label.length * 3.5;
    drawText(g, label, b.x - textW / 2, b.y - rise - 18, 5, color, alpha * 0.9);
  }
}
