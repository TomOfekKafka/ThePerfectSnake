import Phaser from 'phaser';

export interface AuroraBand {
  y: number;
  amplitude: number;
  wavelength: number;
  speed: number;
  phase: number;
  color1: number;
  color2: number;
  alpha: number;
  thickness: number;
}

export interface AuroraShimmer {
  x: number;
  y: number;
  life: number;
  maxLife: number;
  size: number;
  color: number;
  vy: number;
}

export interface NovaFlash {
  x: number;
  y: number;
  life: number;
  maxLife: number;
  radius: number;
  color: number;
  sparkles: { angle: number; dist: number; speed: number; size: number }[];
}

export interface AuroraState {
  bands: AuroraBand[];
  shimmers: AuroraShimmer[];
  novas: NovaFlash[];
  frameCount: number;
}

const AURORA_COLORS: [number, number][] = [
  [0x00ff88, 0x00ccff],
  [0x8844ff, 0xff44aa],
  [0x00ffcc, 0x4488ff],
];

const MAX_SHIMMERS = 40;
const MAX_NOVAS = 5;
const NUM_BANDS = 3;

export function createAuroraState(): AuroraState {
  return {
    bands: [],
    shimmers: [],
    novas: [],
    frameCount: 0,
  };
}

export function initAurora(
  state: AuroraState,
  width: number,
  _height: number
): void {
  state.bands = [];
  for (let i = 0; i < NUM_BANDS; i++) {
    const colors = AURORA_COLORS[i % AURORA_COLORS.length];
    state.bands.push({
      y: 20 + i * 18,
      amplitude: 6 + i * 3,
      wavelength: width * (0.4 + i * 0.15),
      speed: 0.012 + i * 0.004,
      phase: i * 1.2,
      color1: colors[0],
      color2: colors[1],
      alpha: 0.15 - i * 0.03,
      thickness: 10 - i * 2,
    });
  }
}

export function updateAurora(state: AuroraState, width: number): void {
  state.frameCount++;

  for (const band of state.bands) {
    band.phase += band.speed;
  }

  if (state.frameCount % 3 === 0 && state.shimmers.length < MAX_SHIMMERS) {
    const band = state.bands[Math.floor(Math.random() * state.bands.length)];
    if (band) {
      const x = Math.random() * width;
      const waveY = band.y + Math.sin((x / band.wavelength) * Math.PI * 2 + band.phase) * band.amplitude;
      state.shimmers.push({
        x,
        y: waveY,
        life: 1,
        maxLife: 1,
        size: 1 + Math.random() * 2.5,
        color: Math.random() > 0.5 ? band.color1 : band.color2,
        vy: -0.2 - Math.random() * 0.5,
      });
    }
  }

  for (let i = state.shimmers.length - 1; i >= 0; i--) {
    const s = state.shimmers[i];
    s.y += s.vy;
    s.life -= 0.025;
    s.size *= 0.99;
    if (s.life <= 0) {
      state.shimmers.splice(i, 1);
    }
  }

  for (let i = state.novas.length - 1; i >= 0; i--) {
    const n = state.novas[i];
    n.life -= 0.03;
    for (const sp of n.sparkles) {
      sp.dist += sp.speed;
    }
    if (n.life <= 0) {
      state.novas.splice(i, 1);
    }
  }
}

export function spawnNova(
  state: AuroraState,
  x: number,
  y: number,
  foodEaten: number
): void {
  if (state.novas.length >= MAX_NOVAS) {
    state.novas.shift();
  }

  const colorSets = [
    0x00ff88,
    0x8844ff,
    0x00ccff,
    0xff44aa,
    0xffcc00,
  ];
  const color = colorSets[foodEaten % colorSets.length];

  const sparkles = [];
  for (let i = 0; i < 10; i++) {
    sparkles.push({
      angle: (i / 10) * Math.PI * 2,
      dist: 0,
      speed: 1.0 + Math.random() * 0.8,
      size: 1.5 + Math.random() * 2.5,
    });
  }

  state.novas.push({
    x,
    y,
    life: 1,
    maxLife: 1,
    radius: 6 + Math.random() * 4,
    color,
    sparkles,
  });
}

export function drawAuroraBands(
  g: Phaser.GameObjects.Graphics,
  state: AuroraState,
  width: number
): void {
  const segments = 30;
  const segWidth = width / segments;

  for (const band of state.bands) {
    for (let i = 0; i < segments; i++) {
      const x1 = i * segWidth;
      const x2 = (i + 1) * segWidth;
      const t1 = (x1 / band.wavelength) * Math.PI * 2 + band.phase;
      const t2 = (x2 / band.wavelength) * Math.PI * 2 + band.phase;
      const y1 = band.y + Math.sin(t1) * band.amplitude;
      const y2 = band.y + Math.sin(t2) * band.amplitude;

      const blendT = (Math.sin(state.frameCount * 0.02 + i * 0.3) + 1) / 2;
      const color = blendT > 0.5 ? band.color1 : band.color2;
      const waveAlpha = band.alpha * (0.7 + Math.sin(state.frameCount * 0.03 + i * 0.2) * 0.3);

      g.fillStyle(color, waveAlpha * 0.4);
      g.fillRect(x1, Math.min(y1, y2) - band.thickness / 2, segWidth, band.thickness * 1.5);

      g.lineStyle(2, color, waveAlpha);
      g.lineBetween(x1, y1, x2, y2);

      g.lineStyle(1, 0xffffff, waveAlpha * 0.3);
      g.lineBetween(x1, y1 - 1, x2, y2 - 1);
    }
  }
}

export function drawAuroraShimmers(
  g: Phaser.GameObjects.Graphics,
  state: AuroraState
): void {
  for (const s of state.shimmers) {
    g.fillStyle(s.color, s.life * 0.6);
    g.fillCircle(s.x, s.y, s.size);
    g.fillStyle(0xffffff, s.life * 0.3);
    g.fillCircle(s.x, s.y, s.size * 0.4);
  }
}

export function drawNovaFlashes(
  g: Phaser.GameObjects.Graphics,
  state: AuroraState,
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
  for (const n of state.novas) {
    const alpha = n.life;
    const expand = (1 - n.life) * 8;

    g.fillStyle(n.color, alpha * 0.15);
    g.fillCircle(n.x, n.y, n.radius * 3 + expand);

    g.fillStyle(n.color, alpha * 0.4);
    g.fillCircle(n.x, n.y, n.radius * 1.5 + expand * 0.5);

    g.fillStyle(0xffffff, alpha * 0.7);
    g.fillCircle(n.x, n.y, n.radius * 0.6);

    for (const sp of n.sparkles) {
      const sx = n.x + Math.cos(sp.angle) * sp.dist;
      const sy = n.y + Math.sin(sp.angle) * sp.dist;
      g.fillStyle(n.color, alpha * 0.6);
      g.fillCircle(sx, sy, sp.size * alpha);
    }

    const rise = (1 - n.life) * 12;
    drawText(g, 'NOVA', n.x - 8, n.y - rise - 18, 5, n.color, alpha * 0.8);
  }
}
