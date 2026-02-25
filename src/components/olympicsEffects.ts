import Phaser from 'phaser';

export interface OlympicRing {
  cx: number;
  cy: number;
  radius: number;
  color: number;
  phase: number;
  shimmerSpeed: number;
}

export interface TorchFlame {
  x: number;
  y: number;
  particles: FlameParticle[];
  glowRadius: number;
  glowPhase: number;
}

interface FlameParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: number;
}

export interface MedalBurst {
  x: number;
  y: number;
  life: number;
  maxLife: number;
  type: 'gold' | 'silver' | 'bronze';
  sparkles: { angle: number; dist: number; speed: number; size: number }[];
}

export interface OlympicsState {
  rings: OlympicRing[];
  torch: TorchFlame;
  medals: MedalBurst[];
  frameCount: number;
  trackLanePhase: number;
}

const RING_COLORS = [
  0x0085c7,
  0x000000,
  0xf4c300,
  0x009f3d,
  0xdf0024,
];

const MEDAL_COLORS: Record<string, number> = {
  gold: 0xffd700,
  silver: 0xc0c0c0,
  bronze: 0xcd7f32,
};

const MAX_FLAME_PARTICLES = 30;
const MAX_MEDALS = 5;

export function createOlympicsState(): OlympicsState {
  return {
    rings: [],
    torch: { x: 0, y: 0, particles: [], glowRadius: 20, glowPhase: 0 },
    medals: [],
    frameCount: 0,
    trackLanePhase: 0,
  };
}

export function initOlympicRings(
  state: OlympicsState,
  width: number,
  _height: number
): void {
  const ringRadius = Math.min(width * 0.045, 18);
  const spacing = ringRadius * 2.3;
  const startX = width / 2 - spacing * 2;
  const topY = ringRadius + 8;
  const bottomY = topY + ringRadius * 0.95;

  state.rings = RING_COLORS.map((color, i) => ({
    cx: startX + i * spacing,
    cy: i % 2 === 0 ? topY : bottomY,
    radius: ringRadius,
    color,
    phase: i * 0.7,
    shimmerSpeed: 0.03 + i * 0.005,
  }));
}

export function initTorch(
  state: OlympicsState,
  width: number,
  _height: number
): void {
  state.torch = {
    x: width - 25,
    y: 35,
    particles: [],
    glowRadius: 18,
    glowPhase: 0,
  };
}

export function updateOlympics(
  state: OlympicsState,
  width: number
): void {
  state.frameCount++;
  state.trackLanePhase += 0.015;

  updateTorchFlame(state.torch, width);
  updateMedalBursts(state.medals);
}

function updateTorchFlame(torch: TorchFlame, _width: number): void {
  torch.glowPhase += 0.08;

  if (torch.particles.length < MAX_FLAME_PARTICLES) {
    torch.particles.push({
      x: torch.x + (Math.random() - 0.5) * 4,
      y: torch.y,
      vx: (Math.random() - 0.5) * 0.8,
      vy: -1.0 - Math.random() * 1.5,
      life: 1,
      maxLife: 1,
      size: 2 + Math.random() * 3,
      hue: Math.random(),
    });
  }

  for (let i = torch.particles.length - 1; i >= 0; i--) {
    const p = torch.particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.04;
    p.size *= 0.97;
    if (p.life <= 0) {
      torch.particles.splice(i, 1);
    }
  }
}

function updateMedalBursts(medals: MedalBurst[]): void {
  for (let i = medals.length - 1; i >= 0; i--) {
    const m = medals[i];
    m.life -= 0.025;
    for (const s of m.sparkles) {
      s.dist += s.speed;
    }
    if (m.life <= 0) {
      medals.splice(i, 1);
    }
  }
}

export function spawnMedalBurst(
  state: OlympicsState,
  x: number,
  y: number,
  foodEaten: number
): void {
  if (state.medals.length >= MAX_MEDALS) {
    state.medals.shift();
  }

  const types: Array<'gold' | 'silver' | 'bronze'> = ['bronze', 'silver', 'gold'];
  const type = types[foodEaten % 3];
  const sparkles = [];
  for (let i = 0; i < 8; i++) {
    sparkles.push({
      angle: (i / 8) * Math.PI * 2,
      dist: 0,
      speed: 0.8 + Math.random() * 0.5,
      size: 1.5 + Math.random() * 2,
    });
  }

  state.medals.push({
    x,
    y,
    life: 1,
    maxLife: 1,
    type,
    sparkles,
  });
}

export function drawOlympicRings(
  g: Phaser.GameObjects.Graphics,
  state: OlympicsState
): void {
  for (const ring of state.rings) {
    const shimmer = 0.4 + Math.sin(state.frameCount * ring.shimmerSpeed + ring.phase) * 0.15;

    g.lineStyle(2.5, ring.color, shimmer);
    drawCircleOutline(g, ring.cx, ring.cy, ring.radius);

    g.lineStyle(1, ring.color, shimmer * 0.5);
    drawCircleOutline(g, ring.cx, ring.cy, ring.radius + 1.5);
  }
}

function drawCircleOutline(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  radius: number
): void {
  const segments = 24;
  for (let i = 0; i < segments; i++) {
    const a1 = (i / segments) * Math.PI * 2;
    const a2 = ((i + 1) / segments) * Math.PI * 2;
    g.lineBetween(
      cx + Math.cos(a1) * radius,
      cy + Math.sin(a1) * radius,
      cx + Math.cos(a2) * radius,
      cy + Math.sin(a2) * radius
    );
  }
}

export function drawTorchFlame(
  g: Phaser.GameObjects.Graphics,
  torch: TorchFlame
): void {
  const glowPulse = 0.8 + Math.sin(torch.glowPhase) * 0.2;
  g.fillStyle(0xff6600, 0.08 * glowPulse);
  g.fillCircle(torch.x, torch.y - 5, torch.glowRadius * 1.5);
  g.fillStyle(0xffaa00, 0.12 * glowPulse);
  g.fillCircle(torch.x, torch.y - 5, torch.glowRadius);

  g.fillStyle(0x888888, 0.8);
  g.fillRect(torch.x - 2, torch.y, 4, 18);
  g.fillStyle(0xaaaaaa, 0.6);
  g.fillRect(torch.x - 4, torch.y - 2, 8, 4);

  for (const p of torch.particles) {
    const t = 1 - p.life;
    let color: number;
    if (p.hue < 0.4) {
      color = 0xffdd00;
    } else if (p.hue < 0.7) {
      color = 0xff8800;
    } else {
      color = 0xff4400;
    }
    g.fillStyle(color, p.life * 0.7);
    g.fillCircle(p.x, p.y, p.size * (1 - t * 0.3));
  }

  g.fillStyle(0xffffff, 0.6 * glowPulse);
  g.fillCircle(torch.x, torch.y - 2, 2);
}

export function drawTrackLanes(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  cellSize: number,
  frameCount: number
): void {
  const laneCount = 4;
  const laneSpacing = height / laneCount;

  for (let i = 1; i < laneCount; i++) {
    const y = i * laneSpacing;
    const dashLen = 8;
    const gapLen = 12;
    const offset = (frameCount * 0.3) % (dashLen + gapLen);
    const alpha = 0.08 + Math.sin(frameCount * 0.02 + i) * 0.03;

    g.lineStyle(1, 0xffffff, alpha);
    let x = -offset;
    while (x < width) {
      const x1 = Math.max(0, x);
      const x2 = Math.min(width, x + dashLen);
      if (x2 > x1) {
        g.lineBetween(x1, y, x2, y);
      }
      x += dashLen + gapLen;
    }
  }

  const borderAlpha = 0.06;
  g.lineStyle(2, 0xffffff, borderAlpha);
  g.lineBetween(0, 1, width, 1);
  g.lineBetween(0, height - 1, width, height - 1);
}

export function drawMedalBursts(
  g: Phaser.GameObjects.Graphics,
  state: OlympicsState,
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
  for (const m of state.medals) {
    const alpha = m.life;
    const color = MEDAL_COLORS[m.type];
    const rise = (1 - m.life) * 15;

    g.fillStyle(color, alpha * 0.5);
    g.fillCircle(m.x, m.y - rise, 8);

    g.fillStyle(color, alpha * 0.8);
    g.fillCircle(m.x, m.y - rise, 5);

    g.fillStyle(0xffffff, alpha * 0.4);
    g.fillCircle(m.x - 1.5, m.y - rise - 1.5, 2);

    for (const s of m.sparkles) {
      const sx = m.x + Math.cos(s.angle) * s.dist;
      const sy = m.y - rise + Math.sin(s.angle) * s.dist;
      g.fillStyle(color, alpha * 0.5);
      g.fillCircle(sx, sy, s.size * alpha);
    }

    const label = m.type === 'gold' ? 'GOLD' : m.type === 'silver' ? 'SILVER' : 'BRONZE';
    const textW = label.length * 3.5;
    drawText(g, label, m.x - textW / 2, m.y - rise - 15, 5, color, alpha * 0.9);
  }
}
