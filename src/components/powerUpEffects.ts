import Phaser from 'phaser';
import { PowerUpType, ActivePowerUp, PowerUp, Position } from '../game/types';

type DrawTextFn = (g: Phaser.GameObjects.Graphics, text: string, x: number, y: number, size: number, color: number, alpha: number) => void;

interface GhostTrailSegment {
  x: number;
  y: number;
  alpha: number;
  scale: number;
  age: number;
}

interface FreezeIcicle {
  x: number;
  y: number;
  angle: number;
  length: number;
  alpha: number;
  shimmerPhase: number;
}

interface FreezeSnowflake {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  rotation: number;
  rotSpeed: number;
}

interface ShockwaveRing {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  life: number;
  color: number;
  width: number;
}

interface ShockwaveDebris {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  color: number;
  rotation: number;
}

interface PowerUpOrb {
  x: number;
  y: number;
  type: PowerUpType;
  pulsePhase: number;
  orbitAngle: number;
  sparkles: { angle: number; dist: number; speed: number; size: number }[];
}

export interface PowerUpEffectsState {
  ghostTrail: GhostTrailSegment[];
  ghostPulse: number;
  ghostActive: boolean;
  freezeIcicles: FreezeIcicle[];
  freezeSnowflakes: FreezeSnowflake[];
  freezeActive: boolean;
  freezeFlash: number;
  shockwaveRings: ShockwaveRing[];
  shockwaveDebris: ShockwaveDebris[];
  shockwaveFlash: number;
  powerUpOrb: PowerUpOrb | null;
  activeGlow: { type: PowerUpType; intensity: number }[];
}

const GHOST_TRAIL_MAX = 30;
const FREEZE_ICICLE_MAX = 12;
const FREEZE_SNOWFLAKE_MAX = 40;
const SHOCKWAVE_RING_MAX = 5;
const SHOCKWAVE_DEBRIS_MAX = 30;

const GHOST_COLOR = 0x66ddff;
const GHOST_GLOW = 0x3399cc;
const FREEZE_COLOR = 0x88ccff;
const FREEZE_ICE = 0xaaddff;
const FREEZE_WHITE = 0xeeffff;
const SHOCKWAVE_CORE = 0xff6622;
const SHOCKWAVE_RING_COLOR = 0xff9944;
const SHOCKWAVE_SPARK = 0xffcc44;

const POWERUP_COLORS: Record<PowerUpType, { core: number; glow: number; accent: number }> = {
  SPEED_BOOST: { core: 0xffaa22, glow: 0xff6600, accent: 0xffdd44 },
  INVINCIBILITY: { core: 0xffdd44, glow: 0xffaa00, accent: 0xffffff },
  SCORE_MULTIPLIER: { core: 0x44ff88, glow: 0x22cc55, accent: 0xaaffcc },
  MAGNET: { core: 0xff44aa, glow: 0xcc2288, accent: 0xff88cc },
  GHOST_MODE: { core: GHOST_COLOR, glow: GHOST_GLOW, accent: 0xaaeeff },
  FREEZE_TIME: { core: FREEZE_COLOR, glow: 0x4488cc, accent: FREEZE_WHITE },
  SHOCKWAVE: { core: SHOCKWAVE_CORE, glow: 0xcc4400, accent: SHOCKWAVE_SPARK },
};

export function createPowerUpEffectsState(): PowerUpEffectsState {
  return {
    ghostTrail: [],
    ghostPulse: 0,
    ghostActive: false,
    freezeIcicles: [],
    freezeSnowflakes: [],
    freezeActive: false,
    freezeFlash: 0,
    shockwaveRings: [],
    shockwaveDebris: [],
    shockwaveFlash: 0,
    powerUpOrb: null,
    activeGlow: [],
  };
}

export function updatePowerUpEffects(
  state: PowerUpEffectsState,
  snake: Position[],
  cellSize: number,
  activePowerUps: ActivePowerUp[],
  powerUpOnBoard: PowerUp | null,
  frameCount: number
): void {
  const hasGhost = activePowerUps.some(p => p.type === 'GHOST_MODE');
  const hasFreeze = activePowerUps.some(p => p.type === 'FREEZE_TIME');

  state.ghostActive = hasGhost;
  state.freezeActive = hasFreeze;

  if (hasGhost && snake.length > 0) {
    state.ghostPulse += 0.08;
    const head = snake[0];
    const hx = head.x * cellSize + cellSize / 2;
    const hy = head.y * cellSize + cellSize / 2;
    state.ghostTrail.push({
      x: hx,
      y: hy,
      alpha: 0.7,
      scale: 1.0,
      age: 0,
    });
    if (state.ghostTrail.length > GHOST_TRAIL_MAX) {
      state.ghostTrail.splice(0, state.ghostTrail.length - GHOST_TRAIL_MAX);
    }
  }
  for (let i = state.ghostTrail.length - 1; i >= 0; i--) {
    const seg = state.ghostTrail[i];
    seg.age += 1;
    seg.alpha *= 0.92;
    seg.scale *= 0.97;
    if (seg.alpha < 0.02) {
      state.ghostTrail.splice(i, 1);
    }
  }

  if (hasFreeze) {
    if (state.freezeIcicles.length < FREEZE_ICICLE_MAX && Math.random() < 0.15) {
      const gridPx = 20 * cellSize;
      const edge = Math.floor(Math.random() * 4);
      let ix: number, iy: number, angle: number;
      switch (edge) {
        case 0: ix = Math.random() * gridPx; iy = 0; angle = Math.PI / 2 + (Math.random() - 0.5) * 0.3; break;
        case 1: ix = Math.random() * gridPx; iy = gridPx; angle = -Math.PI / 2 + (Math.random() - 0.5) * 0.3; break;
        case 2: ix = 0; iy = Math.random() * gridPx; angle = 0 + (Math.random() - 0.5) * 0.3; break;
        default: ix = gridPx; iy = Math.random() * gridPx; angle = Math.PI + (Math.random() - 0.5) * 0.3; break;
      }
      state.freezeIcicles.push({
        x: ix, y: iy, angle,
        length: 8 + Math.random() * 16,
        alpha: 0.8,
        shimmerPhase: Math.random() * Math.PI * 2,
      });
    }
    if (state.freezeSnowflakes.length < FREEZE_SNOWFLAKE_MAX && Math.random() < 0.3) {
      const gridPx = 20 * cellSize;
      state.freezeSnowflakes.push({
        x: Math.random() * gridPx,
        y: -5,
        vx: (Math.random() - 0.5) * 0.8,
        vy: 0.3 + Math.random() * 0.6,
        size: 1.5 + Math.random() * 3,
        alpha: 0.4 + Math.random() * 0.4,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.05,
      });
    }
  }

  for (let i = state.freezeIcicles.length - 1; i >= 0; i--) {
    const ic = state.freezeIcicles[i];
    ic.shimmerPhase += 0.06;
    if (!hasFreeze) {
      ic.alpha -= 0.03;
      if (ic.alpha <= 0) state.freezeIcicles.splice(i, 1);
    }
  }

  for (let i = state.freezeSnowflakes.length - 1; i >= 0; i--) {
    const sf = state.freezeSnowflakes[i];
    sf.x += sf.vx;
    sf.y += sf.vy;
    sf.rotation += sf.rotSpeed;
    if (!hasFreeze) sf.alpha -= 0.02;
    if (sf.y > 20 * cellSize + 10 || sf.alpha <= 0) {
      state.freezeSnowflakes.splice(i, 1);
    }
  }

  for (let i = state.shockwaveRings.length - 1; i >= 0; i--) {
    const ring = state.shockwaveRings[i];
    ring.radius += 4;
    ring.life -= 0.025;
    ring.width = Math.max(1, ring.width * 0.96);
    if (ring.life <= 0 || ring.radius > ring.maxRadius) {
      state.shockwaveRings.splice(i, 1);
    }
  }

  for (let i = state.shockwaveDebris.length - 1; i >= 0; i--) {
    const d = state.shockwaveDebris[i];
    d.x += d.vx;
    d.y += d.vy;
    d.vy += 0.08;
    d.vx *= 0.98;
    d.life -= 0.02;
    d.rotation += 0.1;
    if (d.life <= 0) state.shockwaveDebris.splice(i, 1);
  }

  if (state.shockwaveFlash > 0) {
    state.shockwaveFlash *= 0.85;
    if (state.shockwaveFlash < 0.01) state.shockwaveFlash = 0;
  }
  if (state.freezeFlash > 0) {
    state.freezeFlash *= 0.9;
    if (state.freezeFlash < 0.01) state.freezeFlash = 0;
  }

  if (powerUpOnBoard) {
    if (!state.powerUpOrb || state.powerUpOrb.type !== powerUpOnBoard.type ||
        state.powerUpOrb.x !== powerUpOnBoard.position.x * cellSize + cellSize / 2 ||
        state.powerUpOrb.y !== powerUpOnBoard.position.y * cellSize + cellSize / 2) {
      const sparkles = [];
      for (let i = 0; i < 6; i++) {
        sparkles.push({
          angle: (Math.PI * 2 / 6) * i,
          dist: 8 + Math.random() * 4,
          speed: 0.02 + Math.random() * 0.02,
          size: 1 + Math.random() * 2,
        });
      }
      state.powerUpOrb = {
        x: powerUpOnBoard.position.x * cellSize + cellSize / 2,
        y: powerUpOnBoard.position.y * cellSize + cellSize / 2,
        type: powerUpOnBoard.type,
        pulsePhase: 0,
        orbitAngle: 0,
        sparkles,
      };
    }
    state.powerUpOrb.pulsePhase += 0.07;
    state.powerUpOrb.orbitAngle += 0.03;
    for (const sp of state.powerUpOrb.sparkles) {
      sp.angle += sp.speed;
    }
  } else {
    state.powerUpOrb = null;
  }

  state.activeGlow = activePowerUps.map(ap => {
    const existing = state.activeGlow.find(g => g.type === ap.type);
    return {
      type: ap.type,
      intensity: existing ? Math.min(1, existing.intensity + 0.02) : 0.3,
    };
  });
}

export function triggerShockwave(
  state: PowerUpEffectsState,
  x: number,
  y: number
): void {
  state.shockwaveFlash = 1.0;

  for (let i = 0; i < 3; i++) {
    if (state.shockwaveRings.length < SHOCKWAVE_RING_MAX) {
      state.shockwaveRings.push({
        x, y,
        radius: 5 + i * 8,
        maxRadius: 180 + i * 30,
        life: 1.0,
        color: i === 0 ? SHOCKWAVE_CORE : i === 1 ? SHOCKWAVE_RING_COLOR : SHOCKWAVE_SPARK,
        width: 4 - i,
      });
    }
  }

  for (let i = 0; i < SHOCKWAVE_DEBRIS_MAX; i++) {
    const angle = (Math.PI * 2 / SHOCKWAVE_DEBRIS_MAX) * i + (Math.random() - 0.5) * 0.3;
    const speed = 2 + Math.random() * 4;
    state.shockwaveDebris.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1,
      size: 2 + Math.random() * 3,
      life: 0.7 + Math.random() * 0.3,
      color: [SHOCKWAVE_CORE, SHOCKWAVE_RING_COLOR, SHOCKWAVE_SPARK, 0xff4400][Math.floor(Math.random() * 4)],
      rotation: Math.random() * Math.PI * 2,
    });
  }
}

export function triggerFreezeFlash(state: PowerUpEffectsState): void {
  state.freezeFlash = 1.0;
}

export function drawPowerUpEffects(
  g: Phaser.GameObjects.Graphics,
  state: PowerUpEffectsState,
  width: number,
  height: number,
  frameCount: number,
  drawText: DrawTextFn,
  activePowerUps: ActivePowerUp[],
  tickCount: number
): void {
  drawGhostTrail(g, state, frameCount);
  drawFreezeEffects(g, state, width, height, frameCount);
  drawShockwaveEffects(g, state, frameCount);
  drawPowerUpOrbOnBoard(g, state, frameCount, drawText);
  drawActivePowerUpHUD(g, state, width, height, frameCount, drawText, activePowerUps, tickCount);
}

function drawGhostTrail(
  g: Phaser.GameObjects.Graphics,
  state: PowerUpEffectsState,
  frameCount: number
): void {
  if (state.ghostTrail.length === 0 && !state.ghostActive) return;

  for (const seg of state.ghostTrail) {
    const shimmer = Math.sin(seg.age * 0.3 + frameCount * 0.1) * 0.15;
    const a = Math.max(0, seg.alpha + shimmer);
    const r = 5 * seg.scale;
    g.fillStyle(GHOST_COLOR, a * 0.3);
    g.fillCircle(seg.x, seg.y, r + 4);
    g.fillStyle(GHOST_GLOW, a * 0.5);
    g.fillCircle(seg.x, seg.y, r + 2);
    g.fillStyle(0xaaeeff, a * 0.7);
    g.fillCircle(seg.x, seg.y, r);
  }

  if (state.ghostActive) {
    const borderAlpha = 0.08 + Math.sin(frameCount * 0.05) * 0.04;
    g.lineStyle(2, GHOST_COLOR, borderAlpha);
    g.strokeRect(0, 0, 400, 400);
    g.lineStyle(1, 0xaaeeff, borderAlpha * 0.5);
    g.strokeRect(2, 2, 396, 396);
  }
}

function drawFreezeEffects(
  g: Phaser.GameObjects.Graphics,
  state: PowerUpEffectsState,
  width: number,
  height: number,
  frameCount: number
): void {
  if (state.freezeFlash > 0) {
    g.fillStyle(FREEZE_ICE, state.freezeFlash * 0.3);
    g.fillRect(0, 0, width, height);
  }

  for (const ic of state.freezeIcicles) {
    const shimmer = Math.sin(ic.shimmerPhase) * 0.2;
    const a = ic.alpha * (0.6 + shimmer);
    const tipX = ic.x + Math.cos(ic.angle) * ic.length;
    const tipY = ic.y + Math.sin(ic.angle) * ic.length;
    const perpX = -Math.sin(ic.angle) * 3;
    const perpY = Math.cos(ic.angle) * 3;

    g.fillStyle(FREEZE_WHITE, a * 0.8);
    g.fillTriangle(
      ic.x + perpX, ic.y + perpY,
      ic.x - perpX, ic.y - perpY,
      tipX, tipY
    );
    g.fillStyle(FREEZE_ICE, a * 0.4);
    g.fillTriangle(
      ic.x + perpX * 1.5, ic.y + perpY * 1.5,
      ic.x - perpX * 1.5, ic.y - perpY * 1.5,
      tipX, tipY
    );
  }

  for (const sf of state.freezeSnowflakes) {
    const a = sf.alpha;
    g.fillStyle(FREEZE_WHITE, a);
    g.fillCircle(sf.x, sf.y, sf.size);
    g.fillStyle(FREEZE_ICE, a * 0.5);
    g.fillCircle(sf.x, sf.y, sf.size * 1.5);

    const arms = 6;
    for (let i = 0; i < arms; i++) {
      const armAngle = sf.rotation + (Math.PI * 2 / arms) * i;
      const ax = sf.x + Math.cos(armAngle) * sf.size * 2;
      const ay = sf.y + Math.sin(armAngle) * sf.size * 2;
      g.lineStyle(0.5, FREEZE_WHITE, a * 0.6);
      g.lineBetween(sf.x, sf.y, ax, ay);
    }
  }

  if (state.freezeActive) {
    const frost = 0.06 + Math.sin(frameCount * 0.03) * 0.02;
    g.fillStyle(FREEZE_ICE, frost);
    g.fillRect(0, 0, width, 6);
    g.fillRect(0, height - 6, width, 6);
    g.fillRect(0, 0, 6, height);
    g.fillRect(width - 6, 0, 6, height);

    const cornerSize = 20 + Math.sin(frameCount * 0.04) * 5;
    g.fillStyle(FREEZE_WHITE, frost * 1.5);
    g.fillTriangle(0, 0, cornerSize, 0, 0, cornerSize);
    g.fillTriangle(width, 0, width - cornerSize, 0, width, cornerSize);
    g.fillTriangle(0, height, cornerSize, height, 0, height - cornerSize);
    g.fillTriangle(width, height, width - cornerSize, height, width, height - cornerSize);
  }
}

function drawShockwaveEffects(
  g: Phaser.GameObjects.Graphics,
  state: PowerUpEffectsState,
  frameCount: number
): void {
  if (state.shockwaveFlash > 0) {
    g.fillStyle(SHOCKWAVE_CORE, state.shockwaveFlash * 0.25);
    g.fillRect(0, 0, 400, 400);
  }

  for (const ring of state.shockwaveRings) {
    g.lineStyle(ring.width, ring.color, ring.life * 0.8);
    g.strokeCircle(ring.x, ring.y, ring.radius);
    g.lineStyle(ring.width * 0.5, 0xffffff, ring.life * 0.3);
    g.strokeCircle(ring.x, ring.y, ring.radius - 2);
  }

  for (const d of state.shockwaveDebris) {
    g.fillStyle(d.color, d.life);
    g.fillCircle(d.x, d.y, d.size);
    g.fillStyle(0xffffff, d.life * 0.4);
    g.fillCircle(d.x, d.y, d.size * 0.5);
  }
}

function drawPowerUpOrbOnBoard(
  g: Phaser.GameObjects.Graphics,
  state: PowerUpEffectsState,
  frameCount: number,
  drawText: DrawTextFn
): void {
  const orb = state.powerUpOrb;
  if (!orb) return;

  const colors = POWERUP_COLORS[orb.type];
  const pulse = Math.sin(orb.pulsePhase) * 0.3 + 0.7;
  const baseRadius = 9;

  g.fillStyle(colors.glow, 0.08 * pulse);
  g.fillCircle(orb.x, orb.y, baseRadius + 18);

  g.fillStyle(colors.glow, 0.15 * pulse);
  g.fillCircle(orb.x, orb.y, baseRadius + 12);

  g.fillStyle(colors.glow, 0.25 * pulse);
  g.fillCircle(orb.x, orb.y, baseRadius + 6);

  g.fillStyle(colors.core, 0.92);
  g.fillCircle(orb.x, orb.y, baseRadius);

  g.fillStyle(colors.accent, 0.6 + pulse * 0.2);
  g.fillCircle(orb.x - 2, orb.y - 2, baseRadius * 0.35);

  for (const sp of orb.sparkles) {
    const sx = orb.x + Math.cos(sp.angle) * (sp.dist + 4);
    const sy = orb.y + Math.sin(sp.angle) * (sp.dist + 4);
    const sparkAlpha = 0.5 + Math.sin(sp.angle * 3 + frameCount * 0.1) * 0.3;
    g.fillStyle(colors.accent, sparkAlpha);
    g.fillCircle(sx, sy, sp.size * 1.2);
  }

  g.lineStyle(2, colors.accent, 0.4 * pulse);
  g.strokeCircle(orb.x, orb.y, baseRadius + 4 + Math.sin(orb.pulsePhase * 0.5) * 2);

  drawPowerUpIcon(g, orb.x, orb.y, orb.type, baseRadius, frameCount);

  const label = POWERUP_LABELS[orb.type];
  const labelY = orb.y - baseRadius - 14 + Math.sin(frameCount * 0.06) * 2;
  const labelAlpha = 0.8 + Math.sin(frameCount * 0.08) * 0.15;

  g.fillStyle(0x000000, 0.5);
  const labelWidth = label.length * 5 + 6;
  g.fillRoundedRect(orb.x - labelWidth / 2, labelY - 2, labelWidth, 10, 3);

  drawText(g, label, orb.x - (label.length * 4.2) / 2, labelY, 7, colors.accent, labelAlpha);
}

const POWERUP_LABELS: Record<PowerUpType, string> = {
  SPEED_BOOST: 'SPEED',
  INVINCIBILITY: 'SHIELD',
  SCORE_MULTIPLIER: 'X3',
  MAGNET: 'MAGNET',
  GHOST_MODE: 'GHOST',
  FREEZE_TIME: 'FREEZE',
  SHOCKWAVE: 'BLAST',
};

function drawPowerUpIcon(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  type: PowerUpType,
  radius: number,
  frameCount: number
): void {
  const s = radius * 0.5;
  switch (type) {
    case 'SPEED_BOOST': {
      g.lineStyle(1.5, 0xffffff, 0.9);
      g.lineBetween(x - s * 0.6, y, x + s * 0.1, y - s * 0.7);
      g.lineBetween(x + s * 0.1, y - s * 0.7, x - s * 0.2, y);
      g.lineBetween(x - s * 0.2, y, x + s * 0.6, y + s * 0.7);
      const spark = Math.sin(frameCount * 0.2) * 0.3;
      g.fillStyle(0xffff88, 0.7 + spark);
      g.fillCircle(x + s * 0.6, y + s * 0.7, s * 0.2);
      break;
    }
    case 'INVINCIBILITY': {
      g.fillStyle(0xffffff, 0.8);
      g.fillTriangle(
        x, y - s * 0.8,
        x - s * 0.7, y - s * 0.2,
        x + s * 0.7, y - s * 0.2
      );
      g.fillRect(x - s * 0.7, y - s * 0.2, s * 1.4, s * 0.7);
      g.fillTriangle(
        x - s * 0.7, y + s * 0.5,
        x + s * 0.7, y + s * 0.5,
        x, y + s * 0.9
      );
      g.fillStyle(POWERUP_COLORS.INVINCIBILITY.core, 0.7);
      g.fillCircle(x, y + s * 0.1, s * 0.25);
      break;
    }
    case 'SCORE_MULTIPLIER': {
      g.lineStyle(1.8, 0xffffff, 0.9);
      g.lineBetween(x - s * 0.5, y - s * 0.5, x + s * 0.5, y + s * 0.5);
      g.lineBetween(x + s * 0.5, y - s * 0.5, x - s * 0.5, y + s * 0.5);
      const flash = Math.sin(frameCount * 0.12) * 0.2;
      g.fillStyle(0xffffff, 0.6 + flash);
      g.fillCircle(x, y, s * 0.15);
      break;
    }
    case 'MAGNET': {
      g.lineStyle(1.5, 0xffffff, 0.85);
      g.beginPath();
      g.arc(x, y - s * 0.1, s * 0.5, Math.PI, 0, false);
      g.strokePath();
      g.fillStyle(0xff4444, 0.8);
      g.fillRect(x - s * 0.5 - s * 0.15, y - s * 0.1, s * 0.3, s * 0.7);
      g.fillStyle(0x4444ff, 0.8);
      g.fillRect(x + s * 0.5 - s * 0.15, y - s * 0.1, s * 0.3, s * 0.7);
      break;
    }
    case 'GHOST_MODE': {
      g.fillStyle(0xffffff, 0.8);
      g.fillCircle(x, y - s * 0.3, s * 0.8);
      g.fillRect(x - s * 0.7, y - s * 0.3, s * 1.4, s * 1.2);
      const wave = Math.sin(frameCount * 0.15) * 1.5;
      for (let i = 0; i < 3; i++) {
        const bx = x - s * 0.5 + i * s * 0.5;
        g.fillCircle(bx, y + s * 0.9 + wave, s * 0.3);
      }
      g.fillStyle(0x222244, 0.9);
      g.fillCircle(x - s * 0.25, y - s * 0.4, s * 0.15);
      g.fillCircle(x + s * 0.25, y - s * 0.4, s * 0.15);
      break;
    }
    case 'FREEZE_TIME': {
      g.lineStyle(1.2, 0xffffff, 0.9);
      for (let i = 0; i < 6; i++) {
        const a = (Math.PI * 2 / 6) * i;
        g.lineBetween(x, y, x + Math.cos(a) * s, y + Math.sin(a) * s);
        const branchAngle = 0.5;
        const mid = s * 0.6;
        const mx = x + Math.cos(a) * mid;
        const my = y + Math.sin(a) * mid;
        g.lineBetween(mx, my, mx + Math.cos(a + branchAngle) * s * 0.3, my + Math.sin(a + branchAngle) * s * 0.3);
        g.lineBetween(mx, my, mx + Math.cos(a - branchAngle) * s * 0.3, my + Math.sin(a - branchAngle) * s * 0.3);
      }
      break;
    }
    case 'SHOCKWAVE': {
      const rings = 3;
      for (let i = 0; i < rings; i++) {
        const r = s * 0.3 * (i + 1);
        const a = 0.9 - i * 0.25;
        g.lineStyle(1, [0xff4400, 0xff8800, 0xffcc00][i], a);
        g.strokeCircle(x, y, r);
      }
      g.fillStyle(0xffffff, 0.9);
      g.fillCircle(x, y, s * 0.2);
      break;
    }
  }
}

function drawActivePowerUpHUD(
  g: Phaser.GameObjects.Graphics,
  state: PowerUpEffectsState,
  width: number,
  height: number,
  frameCount: number,
  drawText: DrawTextFn,
  activePowerUps: ActivePowerUp[],
  tickCount: number
): void {
  if (activePowerUps.length === 0) return;

  const barWidth = 90;
  const barHeight = 16;
  const spacing = 20;

  for (let i = 0; i < activePowerUps.length; i++) {
    const ap = activePowerUps[i];
    const colors = POWERUP_COLORS[ap.type];
    const label = POWERUP_LABELS[ap.type];
    const remaining = Math.max(0, ap.endTime - tickCount);
    const duration = getDurationForType(ap.type);
    const ratio = duration > 0 ? remaining / duration : 0;
    const seconds = Math.ceil(remaining / 10);

    const bx = 6;
    const by = height - 22 - i * spacing;
    const pulse = Math.sin(frameCount * 0.08 + i) * 0.12 + 0.88;

    g.fillStyle(0x000000, 0.45);
    g.fillRoundedRect(bx - 2, by - 2, barWidth + 4, barHeight + 4, 4);

    g.fillStyle(colors.core, 0.25 * pulse);
    g.fillRoundedRect(bx, by, barWidth, barHeight, 3);
    g.fillStyle(colors.core, 0.75 * pulse);
    g.fillRoundedRect(bx, by, barWidth * ratio, barHeight, 3);

    g.lineStyle(1, colors.accent, 0.5 * pulse);
    g.strokeRoundedRect(bx, by, barWidth, barHeight, 3);

    g.fillStyle(colors.accent, 0.95);
    g.fillCircle(bx + 8, by + barHeight / 2, 5);
    drawPowerUpIcon(g, bx + 8, by + barHeight / 2, ap.type, 5, frameCount);

    drawText(g, label, bx + 17, by + 3, 7, 0xffffff, 0.95);

    const timeStr = String(seconds);
    const timeColor = seconds <= 3 ? 0xff4444 : colors.accent;
    const timeAlpha = seconds <= 3 ? 0.7 + Math.sin(frameCount * 0.2) * 0.3 : 0.85;
    drawText(g, timeStr, bx + barWidth - timeStr.length * 5 - 4, by + 3, 7, timeColor, timeAlpha);
  }
}

function getDurationForType(type: PowerUpType): number {
  const durations: Record<PowerUpType, number> = {
    SPEED_BOOST: 50,
    INVINCIBILITY: 40,
    SCORE_MULTIPLIER: 60,
    MAGNET: 45,
    GHOST_MODE: 55,
    FREEZE_TIME: 45,
    SHOCKWAVE: 1,
  };
  return durations[type];
}
