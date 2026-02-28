import Phaser from 'phaser';

interface PoliceSegment {
  x: number;
  y: number;
}

interface SirenParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: number;
  size: number;
}

interface CaughtFlash {
  intensity: number;
  x: number;
  y: number;
}

export interface PoliceVisualsState {
  sirenPhase: number;
  sirenParticles: SirenParticle[];
  trail: { x: number; y: number; alpha: number }[];
  caughtFlash: CaughtFlash | null;
  lastSegments: PoliceSegment[];
  pulsePhase: number;
}

export const createPoliceVisualsState = (): PoliceVisualsState => ({
  sirenPhase: 0,
  sirenParticles: [],
  trail: [],
  caughtFlash: null,
  lastSegments: [],
  pulsePhase: 0,
});

const SIREN_SPEED = 0.15;
const MAX_SIREN_PARTICLES = 40;
const MAX_TRAIL = 30;

const hslToHex = (h: number, s: number, l: number): number => {
  h = h / 360;
  s = s / 100;
  l = l / 100;
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return (Math.round(r * 255) << 16) | (Math.round(g * 255) << 8) | Math.round(b * 255);
};

const spawnSirenParticle = (
  state: PoliceVisualsState,
  x: number,
  y: number,
  isRed: boolean
): void => {
  if (state.sirenParticles.length >= MAX_SIREN_PARTICLES) return;
  const angle = Math.random() * Math.PI * 2;
  const speed = 0.5 + Math.random() * 1.5;
  state.sirenParticles.push({
    x,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    life: 1,
    color: isRed ? 0xcc44ee : 0x22dd88,
    size: 2 + Math.random() * 2,
  });
};

export const updatePoliceVisuals = (
  state: PoliceVisualsState,
  segments: PoliceSegment[],
  cellSize: number,
  active: boolean,
  caughtPlayer: boolean
): PoliceVisualsState => {
  const next = { ...state };
  next.sirenPhase = state.sirenPhase + SIREN_SPEED;
  next.pulsePhase = state.pulsePhase + 0.08;

  if (active && segments.length > 0) {
    const head = segments[0];
    const hx = head.x * cellSize + cellSize / 2;
    const hy = head.y * cellSize + cellSize / 2;

    next.trail = [{ x: hx, y: hy, alpha: 1 }, ...state.trail]
      .slice(0, MAX_TRAIL)
      .map((t, i) => ({ ...t, alpha: 1 - i / MAX_TRAIL }));

    const isRed = Math.sin(next.sirenPhase) > 0;
    if (Math.random() < 0.4) {
      spawnSirenParticle(next, hx + (Math.random() - 0.5) * 8, hy - 6, isRed);
    }

    next.lastSegments = segments;
  } else {
    next.trail = state.trail
      .map(t => ({ ...t, alpha: t.alpha - 0.05 }))
      .filter(t => t.alpha > 0);
    if (!active) {
      next.lastSegments = [];
    }
  }

  next.sirenParticles = state.sirenParticles
    .map(p => ({
      ...p,
      x: p.x + p.vx,
      y: p.y + p.vy,
      life: p.life - 0.03,
      size: p.size * 0.97,
    }))
    .filter(p => p.life > 0);

  if (caughtPlayer && segments.length > 0) {
    const head = segments[0];
    next.caughtFlash = {
      intensity: 1,
      x: head.x * cellSize + cellSize / 2,
      y: head.y * cellSize + cellSize / 2,
    };
  } else if (state.caughtFlash) {
    const newIntensity = state.caughtFlash.intensity - 0.04;
    next.caughtFlash = newIntensity > 0
      ? { ...state.caughtFlash, intensity: newIntensity }
      : null;
  }

  return next;
};

const drawPoliceBody = (
  g: Phaser.GameObjects.Graphics,
  segments: PoliceSegment[],
  cellSize: number,
  sirenPhase: number,
  pulsePhase: number
): void => {
  if (segments.length === 0) return;

  const pulse = 0.8 + Math.sin(pulsePhase) * 0.2;

  for (let i = segments.length - 1; i >= 0; i--) {
    const seg = segments[i];
    const px = seg.x * cellSize + cellSize / 2;
    const py = seg.y * cellSize + cellSize / 2;
    const t = segments.length > 1 ? i / (segments.length - 1) : 1;
    const baseSize = (cellSize / 2 - 1) * (0.6 + t * 0.4);
    const size = baseSize * pulse;

    g.fillStyle(0x0d1a11, 0.3 * pulse);
    g.fillCircle(px, py, size * 2.2);

    g.fillStyle(0x142218, 0.7 * pulse);
    g.fillCircle(px, py, size * 1.4);

    g.fillStyle(0x1e3322, 0.9 * pulse);
    g.fillCircle(px, py, size);

    if (i === 0) {
      const isRedPhase = Math.sin(sirenPhase) > 0;

      g.fillStyle(0x223333, 0.95);
      g.fillCircle(px, py, size * 1.2);

      const lightColor = isRedPhase ? 0xcc44ee : 0x22dd88;
      const lightGlow = isRedPhase ? 0xdd66ff : 0x44eeaa;
      const lightAlpha = 0.6 + Math.abs(Math.sin(sirenPhase)) * 0.4;

      g.fillStyle(lightGlow, lightAlpha * 0.3);
      g.fillCircle(px, py - size * 0.3, size * 2.5);

      g.fillStyle(lightColor, lightAlpha);
      g.fillCircle(px - size * 0.5, py - size * 0.5, size * 0.4);
      g.fillStyle(isRedPhase ? 0x22dd88 : 0xcc44ee, lightAlpha * 0.7);
      g.fillCircle(px + size * 0.5, py - size * 0.5, size * 0.4);

      g.fillStyle(0xffffff, 0.9);
      g.fillCircle(px, py - size * 0.5, size * 0.15);

      drawPoliceEyes(g, px, py, size, segments);
    }
  }
};

const drawPoliceEyes = (
  g: Phaser.GameObjects.Graphics,
  px: number,
  py: number,
  size: number,
  segments: PoliceSegment[]
): void => {
  let dx = 0;
  let dy = 0;
  if (segments.length > 1) {
    dx = segments[0].x - segments[1].x;
    dy = segments[0].y - segments[1].y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 0) { dx /= len; dy /= len; }
  }

  const perpX = -dy;
  const perpY = dx;
  const eyeOffset = size * 0.35;
  const eyeForward = size * 0.2;

  const leftX = px + perpX * eyeOffset + dx * eyeForward;
  const leftY = py + perpY * eyeOffset + dy * eyeForward;
  const rightX = px - perpX * eyeOffset + dx * eyeForward;
  const rightY = py - perpY * eyeOffset + dy * eyeForward;

  g.fillStyle(0xffffff, 0.95);
  g.fillCircle(leftX, leftY, size * 0.2);
  g.fillCircle(rightX, rightY, size * 0.2);

  g.fillStyle(0x000000, 0.95);
  g.fillCircle(leftX + dx * 1.2, leftY + dy * 1.2, size * 0.1);
  g.fillCircle(rightX + dx * 1.2, rightY + dy * 1.2, size * 0.1);
};

const drawSirenBeams = (
  g: Phaser.GameObjects.Graphics,
  headX: number,
  headY: number,
  sirenPhase: number,
  cellSize: number
): void => {
  const isRed = Math.sin(sirenPhase) > 0;
  const beamAngle = sirenPhase * 2;
  const beamLen = cellSize * 3;
  const beamAlpha = 0.15 + Math.abs(Math.sin(sirenPhase)) * 0.1;

  const beamColor = isRed ? 0xcc44ee : 0x22dd88;
  g.fillStyle(beamColor, beamAlpha);

  const bx = Math.cos(beamAngle) * beamLen;
  const by = Math.sin(beamAngle) * beamLen;

  g.beginPath();
  g.moveTo(headX - 2, headY - 2);
  g.lineTo(headX + bx - by * 0.3, headY + by + bx * 0.3);
  g.lineTo(headX + bx + by * 0.3, headY + by - bx * 0.3);
  g.closePath();
  g.fillPath();

  g.beginPath();
  g.moveTo(headX + 2, headY + 2);
  g.lineTo(headX - bx - by * 0.3, headY - by + bx * 0.3);
  g.lineTo(headX - bx + by * 0.3, headY - by - bx * 0.3);
  g.closePath();
  g.fillPath();
};

export const drawPoliceVisuals = (
  g: Phaser.GameObjects.Graphics,
  state: PoliceVisualsState,
  segments: PoliceSegment[],
  cellSize: number,
  active: boolean
): void => {
  for (const t of state.trail) {
    g.fillStyle(hslToHex(240, 60, 40), t.alpha * 0.15);
    g.fillCircle(t.x, t.y, 4 * t.alpha);
  }

  for (const p of state.sirenParticles) {
    g.fillStyle(p.color, p.life * 0.6);
    g.fillCircle(p.x, p.y, p.size);
  }

  if (active && segments.length > 0) {
    const head = segments[0];
    const hx = head.x * cellSize + cellSize / 2;
    const hy = head.y * cellSize + cellSize / 2;
    drawSirenBeams(g, hx, hy, state.sirenPhase, cellSize);
  }

  if (active) {
    drawPoliceBody(g, segments, cellSize, state.sirenPhase, state.pulsePhase);
  }

  if (state.caughtFlash) {
    const flash = state.caughtFlash;
    const radius = (1 - flash.intensity) * cellSize * 6 + cellSize * 2;
    const isRed = Math.sin(state.sirenPhase * 3) > 0;
    const flashColor = isRed ? 0xcc44ee : 0x22dd88;
    g.fillStyle(flashColor, flash.intensity * 0.3);
    g.fillCircle(flash.x, flash.y, radius);
    g.fillStyle(0xffffff, flash.intensity * 0.15);
    g.fillCircle(flash.x, flash.y, radius * 0.6);
  }
};
