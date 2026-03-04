import Phaser from 'phaser';

export interface FlagLifeBarState {
  maxHp: number;
  currentHp: number;
  active: boolean;
  hitFlash: number;
  shakeOffset: number;
  damageParticles: DamageParticle[];
  breakParticles: BreakParticle[];
  breaking: boolean;
  breakProgress: number;
  lastFlagX: number;
  lastFlagY: number;
  flagWavePhases: number[];
  burningFlags: BurningFlag[];
  fallingFlags: FallingFlag[];
}

interface DamageParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  color: number;
}

interface BreakParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  color: number;
  rotation: number;
  rotSpeed: number;
}

interface BurningFlag {
  index: number;
  progress: number;
  fireParticles: FireParticle[];
}

interface FireParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
}

interface FallingFlag {
  index: number;
  x: number;
  y: number;
  vy: number;
  rotation: number;
  rotSpeed: number;
  alpha: number;
  color: number;
}

const FLAG_HP = 5;
const MAX_DAMAGE_PARTICLES = 30;
const MAX_BREAK_PARTICLES = 40;
const BREAK_DURATION = 1.0;

const FLAG_COLORS = [0xff4466, 0xff6644, 0xffaa22, 0x44cc66, 0x4488ff];
const FLAG_GLOW_COLORS = [0xff6688, 0xff8866, 0xffcc44, 0x66ee88, 0x66aaff];

export function createFlagLifeBarState(): FlagLifeBarState {
  return {
    maxHp: FLAG_HP,
    currentHp: FLAG_HP,
    active: true,
    hitFlash: 0,
    shakeOffset: 0,
    damageParticles: [],
    breakParticles: [],
    breaking: false,
    breakProgress: 0,
    lastFlagX: 0,
    lastFlagY: 0,
    flagWavePhases: Array.from({ length: FLAG_HP }, (_, i) => i * 0.8),
    burningFlags: [],
    fallingFlags: [],
  };
}

export function resetFlagLifeBar(state: FlagLifeBarState): void {
  state.maxHp = FLAG_HP;
  state.currentHp = FLAG_HP;
  state.active = true;
  state.hitFlash = 0;
  state.shakeOffset = 0;
  state.damageParticles = [];
  state.breaking = false;
  state.breakProgress = 0;
  state.burningFlags = [];
  state.fallingFlags = [];
  state.flagWavePhases = Array.from({ length: FLAG_HP }, (_, i) => i * 0.8);
}

export function damageFlagLifeBar(state: FlagLifeBarState, x: number, y: number): boolean {
  if (!state.active || state.breaking) return false;

  state.currentHp = Math.max(0, state.currentHp - 1);
  state.hitFlash = 1.0;
  state.shakeOffset = 6;

  const destroyedIndex = state.currentHp;
  spawnBurningFlag(state, destroyedIndex, x, y);
  spawnDamageParticles(state, x, y);

  if (state.currentHp <= 0) {
    state.breaking = true;
    state.breakProgress = 0;
    spawnBreakParticles(state, x, y);
    return true;
  }
  return false;
}

function spawnBurningFlag(state: FlagLifeBarState, index: number, x: number, y: number): void {
  const fireParticles: FireParticle[] = [];
  for (let i = 0; i < 8; i++) {
    fireParticles.push({
      x: x + (Math.random() - 0.5) * 10,
      y: y - 20 + Math.random() * 5,
      vx: (Math.random() - 0.5) * 2,
      vy: -1 - Math.random() * 2,
      life: 0.6 + Math.random() * 0.5,
      size: 1.5 + Math.random() * 2,
    });
  }
  state.burningFlags.push({ index, progress: 0, fireParticles });

  const flagSpacing = 8;
  const totalWidth = (FLAG_HP - 1) * flagSpacing;
  const flagX = x - totalWidth / 2 + index * flagSpacing;
  const flagY = y - 22;
  state.fallingFlags.push({
    index,
    x: flagX,
    y: flagY,
    vy: 0.3 + Math.random() * 0.5,
    rotation: (Math.random() - 0.5) * 0.3,
    rotSpeed: (Math.random() - 0.5) * 0.15,
    alpha: 1.0,
    color: FLAG_COLORS[index % FLAG_COLORS.length],
  });
}

function spawnDamageParticles(state: FlagLifeBarState, x: number, y: number): void {
  const count = 8;
  for (let i = 0; i < count; i++) {
    if (state.damageParticles.length >= MAX_DAMAGE_PARTICLES) {
      state.damageParticles.shift();
    }
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 3;
    const colors = [0xff4400, 0xff6622, 0xffaa00, 0xffcc44, 0xff8800];
    state.damageParticles.push({
      x,
      y: y - 18,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.5,
      life: 0.8 + Math.random() * 0.4,
      size: 1.5 + Math.random() * 2.5,
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  }
}

function spawnBreakParticles(state: FlagLifeBarState, x: number, y: number): void {
  const count = MAX_BREAK_PARTICLES;
  const colors = [0xff3333, 0xff6644, 0xffaa22, 0x44cc66, 0x4488ff, 0xffffff];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 7;
    state.breakParticles.push({
      x,
      y: y - 18,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 3,
      life: 0.7 + Math.random() * 0.6,
      size: 2 + Math.random() * 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.3,
    });
  }
}

export function updateFlagLifeBar(state: FlagLifeBarState): void {
  state.hitFlash *= 0.85;
  state.shakeOffset *= 0.8;
  if (state.shakeOffset < 0.3) state.shakeOffset = 0;

  for (let i = 0; i < state.flagWavePhases.length; i++) {
    state.flagWavePhases[i] += 0.12 + i * 0.02;
  }

  for (let i = state.burningFlags.length - 1; i >= 0; i--) {
    const b = state.burningFlags[i];
    b.progress += 0.04;
    for (let j = b.fireParticles.length - 1; j >= 0; j--) {
      const p = b.fireParticles[j];
      p.x += p.vx;
      p.y += p.vy;
      p.vy -= 0.05;
      p.life -= 0.03;
      if (p.life <= 0) b.fireParticles.splice(j, 1);
    }
    if (b.progress > 1.0 && b.fireParticles.length === 0) {
      state.burningFlags.splice(i, 1);
    }
  }

  for (let i = state.fallingFlags.length - 1; i >= 0; i--) {
    const f = state.fallingFlags[i];
    f.y += f.vy;
    f.vy += 0.06;
    f.rotation += f.rotSpeed;
    f.alpha -= 0.015;
    if (f.alpha <= 0) state.fallingFlags.splice(i, 1);
  }

  for (let i = state.damageParticles.length - 1; i >= 0; i--) {
    const p = state.damageParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.08;
    p.vx *= 0.96;
    p.life -= 0.04;
    if (p.life <= 0) state.damageParticles.splice(i, 1);
  }

  for (let i = state.breakParticles.length - 1; i >= 0; i--) {
    const p = state.breakParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.1;
    p.vx *= 0.97;
    p.rotation += p.rotSpeed;
    p.life -= 0.02;
    if (p.life <= 0) state.breakParticles.splice(i, 1);
  }

  if (state.breaking) {
    state.breakProgress = Math.min(BREAK_DURATION, state.breakProgress + 0.03);
    if (state.breakProgress >= BREAK_DURATION && state.breakParticles.length === 0) {
      state.breaking = false;
      state.active = false;
    }
  }
}

function drawFlagPennant(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  color: number,
  glowColor: number,
  wavePhase: number,
  scale: number,
  alpha: number
): void {
  const poleHeight = 22 * scale;
  const flagW = 12 * scale;
  const flagH = 8 * scale;

  g.lineStyle(2, 0xaaaaaa, alpha * 0.9);
  g.beginPath();
  g.moveTo(x, y);
  g.lineTo(x, y - poleHeight);
  g.strokePath();

  g.fillStyle(0xeeeeee, alpha);
  g.fillCircle(x, y - poleHeight, 2.0 * scale);

  const waveAmt = Math.sin(wavePhase) * 3 * scale;
  const waveAmt2 = Math.sin(wavePhase + 1.0) * 2.5 * scale;

  const fx = x + 1.5;
  const fy = y - poleHeight + 2.5 * scale;

  g.fillStyle(glowColor, alpha * 0.35);
  g.fillCircle(fx + flagW / 2, fy + flagH / 2, flagW * 1.4);

  g.fillStyle(color, alpha * 0.9);
  g.beginPath();
  g.moveTo(fx, fy);
  g.lineTo(fx + flagW + waveAmt, fy + flagH * 0.3 + waveAmt2 * 0.5);
  g.lineTo(fx + flagW * 0.8 + waveAmt * 0.7, fy + flagH * 0.6 + waveAmt2 * 0.3);
  g.lineTo(fx + flagW + waveAmt, fy + flagH + waveAmt2);
  g.lineTo(fx, fy + flagH);
  g.closePath();
  g.fillPath();

  g.fillStyle(0xffffff, alpha * 0.35);
  g.beginPath();
  g.moveTo(fx, fy);
  g.lineTo(fx + flagW * 0.5 + waveAmt * 0.5, fy + flagH * 0.15 + waveAmt2 * 0.25);
  g.lineTo(fx + flagW * 0.4 + waveAmt * 0.4, fy + flagH * 0.5 + waveAmt2 * 0.15);
  g.lineTo(fx, fy + flagH * 0.5);
  g.closePath();
  g.fillPath();
}

function drawBurningFlag(
  g: Phaser.GameObjects.Graphics,
  burning: BurningFlag
): void {
  for (const p of burning.fireParticles) {
    const alpha = Math.max(0, p.life);
    g.fillStyle(0xff4400, alpha * 0.3);
    g.fillCircle(p.x, p.y, p.size * 2);
    g.fillStyle(0xff8800, alpha * 0.7);
    g.fillCircle(p.x, p.y, p.size);
    g.fillStyle(0xffcc00, alpha * 0.5);
    g.fillCircle(p.x, p.y, p.size * 0.5);
  }
}

function drawFallingFlagPiece(
  g: Phaser.GameObjects.Graphics,
  falling: FallingFlag
): void {
  if (falling.alpha <= 0) return;
  g.fillStyle(falling.color, falling.alpha * 0.4);
  g.fillCircle(falling.x, falling.y, 4);
  g.fillStyle(falling.color, falling.alpha * 0.7);
  const size = 3;
  g.beginPath();
  g.moveTo(falling.x - size, falling.y - size);
  g.lineTo(falling.x + size, falling.y - size * 0.5);
  g.lineTo(falling.x + size * 0.5, falling.y + size);
  g.lineTo(falling.x - size * 0.5, falling.y + size);
  g.closePath();
  g.fillPath();
}

export function drawFlagLifeBar(
  g: Phaser.GameObjects.Graphics,
  state: FlagLifeBarState,
  foodX: number,
  foodY: number,
  cellSize: number,
  frameCount: number
): void {
  state.lastFlagX = foodX;
  state.lastFlagY = foodY;

  if (!state.active && !state.breaking && state.breakParticles.length === 0
    && state.fallingFlags.length === 0 && state.burningFlags.length === 0) return;

  const shakeX = state.shakeOffset * (Math.random() - 0.5) * 2;
  const shakeY = state.shakeOffset * (Math.random() - 0.5) * 2;

  const flagSpacing = 8;
  const totalWidth = (state.maxHp - 1) * flagSpacing;
  const startX = foodX - totalWidth / 2 + shakeX;
  const baseY = foodY - cellSize * 0.6 + shakeY;

  const burningIndices = new Set(state.burningFlags.map(b => b.index));

  if (state.active || state.breaking) {
    for (let i = 0; i < state.maxHp; i++) {
      const fx = startX + i * flagSpacing;
      const isAlive = i < state.currentHp;
      const isBurning = burningIndices.has(i);

      if (isAlive && !isBurning) {
        const color = FLAG_COLORS[i % FLAG_COLORS.length];
        const glow = FLAG_GLOW_COLORS[i % FLAG_GLOW_COLORS.length];
        const wave = state.flagWavePhases[i] || frameCount * 0.12 + i;
        drawFlagPennant(g, fx, baseY, color, glow, wave, 1.0, 1.0);
      } else if (!isAlive && !isBurning) {
        g.lineStyle(1, 0x444444, 0.4);
        g.beginPath();
        g.moveTo(fx, baseY);
        g.lineTo(fx, baseY - 14);
        g.strokePath();
        g.fillStyle(0x333333, 0.3);
        g.fillCircle(fx, baseY - 14, 1.2);
      }
    }

    if (state.active && !state.breaking) {
      const barWidth = totalWidth + flagSpacing;
      const barHeight = 3;
      const barY = baseY + 3;
      const barX = startX - flagSpacing * 0.5;

      g.fillStyle(0x000000, 0.5);
      g.fillRoundedRect(barX, barY, barWidth, barHeight, 1);

      const hpRatio = state.currentHp / state.maxHp;
      const fillColor = hpRatio > 0.6 ? 0x44cc66 : hpRatio > 0.3 ? 0xffaa22 : 0xff4466;
      const fillWidth = barWidth * hpRatio;

      if (fillWidth > 0) {
        g.fillStyle(fillColor, 0.8);
        g.fillRoundedRect(barX, barY, fillWidth, barHeight, 1);

        const pulse = 0.2 + Math.sin(frameCount * 0.15) * 0.1;
        g.fillStyle(0xffffff, pulse);
        g.fillRoundedRect(barX, barY, fillWidth, barHeight * 0.4, 1);
      }
    }
  }

  for (const b of state.burningFlags) {
    drawBurningFlag(g, b);
  }

  for (const f of state.fallingFlags) {
    drawFallingFlagPiece(g, f);
  }

  for (const p of state.damageParticles) {
    const alpha = Math.max(0, p.life);
    g.fillStyle(p.color, alpha * 0.4);
    g.fillCircle(p.x, p.y, p.size * 1.5);
    g.fillStyle(p.color, alpha);
    g.fillCircle(p.x, p.y, p.size);
  }

  for (const p of state.breakParticles) {
    const alpha = Math.max(0, p.life);
    g.fillStyle(p.color, alpha * 0.3);
    g.fillCircle(p.x, p.y, p.size * 2);
    g.fillStyle(p.color, alpha * 0.8);
    g.fillCircle(p.x, p.y, p.size);
    if (alpha > 0.3) {
      g.fillStyle(0xffffff, (alpha - 0.3) * 0.6);
      g.fillCircle(p.x, p.y, p.size * 0.4);
    }
  }

  if (state.breaking && state.breakProgress < 0.3) {
    const flashAlpha = (0.3 - state.breakProgress) * 2;
    g.fillStyle(0xffffff, flashAlpha * 0.6);
    g.fillCircle(foodX, foodY - cellSize * 0.5, cellSize * 2 * (1 + state.breakProgress * 3));
    g.fillStyle(0xff4400, flashAlpha * 0.3);
    g.fillCircle(foodX, foodY - cellSize * 0.5, cellSize * 3 * (1 + state.breakProgress * 2));
  }

  if (state.hitFlash > 0.1) {
    g.fillStyle(0xffffff, state.hitFlash * 0.3);
    g.fillCircle(foodX, baseY - 7, 15 * state.hitFlash);
  }
}
