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

const FLAG_HP = 5;
const MAX_DAMAGE_PARTICLES = 30;
const MAX_BREAK_PARTICLES = 40;
const BREAK_DURATION = 1.0;

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
}

export function damageFlagLifeBar(state: FlagLifeBarState, x: number, y: number): boolean {
  if (!state.active || state.breaking) return false;

  state.currentHp = Math.max(0, state.currentHp - 1);
  state.hitFlash = 1.0;
  state.shakeOffset = 4;

  spawnDamageParticles(state, x, y);

  if (state.currentHp <= 0) {
    state.breaking = true;
    state.breakProgress = 0;
    spawnBreakParticles(state, x, y);
    return true;
  }
  return false;
}

function spawnDamageParticles(state: FlagLifeBarState, x: number, y: number): void {
  const count = 6;
  for (let i = 0; i < count; i++) {
    if (state.damageParticles.length >= MAX_DAMAGE_PARTICLES) {
      state.damageParticles.shift();
    }
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 3;
    const colors = [0xff66aa, 0xff88cc, 0xffaadd, 0xffd4e8];
    state.damageParticles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1,
      life: 0.8 + Math.random() * 0.4,
      size: 1.5 + Math.random() * 2.5,
      color: colors[Math.floor(Math.random() * colors.length)],
    });
  }
}

function spawnBreakParticles(state: FlagLifeBarState, x: number, y: number): void {
  const count = MAX_BREAK_PARTICLES;
  const colors = [0xff3388, 0xff66aa, 0xff88cc, 0xffaadd, 0xffd4e8, 0xff44aa];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 6;
    state.breakParticles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 2,
      life: 0.6 + Math.random() * 0.6,
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

  for (let i = state.damageParticles.length - 1; i >= 0; i--) {
    const p = state.damageParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.08;
    p.vx *= 0.96;
    p.life -= 0.04;
    if (p.life <= 0) {
      state.damageParticles.splice(i, 1);
    }
  }

  for (let i = state.breakParticles.length - 1; i >= 0; i--) {
    const p = state.breakParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.1;
    p.vx *= 0.97;
    p.rotation += p.rotSpeed;
    p.life -= 0.02;
    if (p.life <= 0) {
      state.breakParticles.splice(i, 1);
    }
  }

  if (state.breaking) {
    state.breakProgress = Math.min(BREAK_DURATION, state.breakProgress + 0.03);
    if (state.breakProgress >= BREAK_DURATION && state.breakParticles.length === 0) {
      state.breaking = false;
      state.active = false;
    }
  }
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

  if (!state.active && !state.breaking && state.breakParticles.length === 0) return;

  const barWidth = cellSize * 1.6;
  const barHeight = 5;
  const barY = foodY - cellSize * 1.1;
  const barX = foodX - barWidth / 2;

  const shakeX = state.shakeOffset * (Math.random() - 0.5) * 2;
  const shakeY = state.shakeOffset * (Math.random() - 0.5) * 2;

  if (state.active || state.breaking) {
    const hpRatio = state.currentHp / state.maxHp;

    g.fillStyle(0x000000, 0.7);
    g.fillRoundedRect(barX + shakeX - 1, barY + shakeY - 1, barWidth + 2, barHeight + 2, 2);

    g.fillStyle(0x1a1a2e, 0.9);
    g.fillRoundedRect(barX + shakeX, barY + shakeY, barWidth, barHeight, 2);

    const fillColor = hpRatio > 0.6 ? 0xff66aa : hpRatio > 0.3 ? 0xff3388 : 0xff1166;
    const fillWidth = barWidth * hpRatio;

    g.fillStyle(fillColor, 0.9);
    if (fillWidth > 0) {
      g.fillRoundedRect(barX + shakeX, barY + shakeY, fillWidth, barHeight, 2);
    }

    const glowPulse = 0.3 + Math.sin(frameCount * 0.15) * 0.15;
    g.fillStyle(0xffffff, glowPulse * hpRatio);
    if (fillWidth > 0) {
      g.fillRoundedRect(barX + shakeX, barY + shakeY, fillWidth, barHeight * 0.4, 2);
    }

    if (state.hitFlash > 0.1) {
      g.fillStyle(0xffffff, state.hitFlash * 0.5);
      g.fillRoundedRect(barX + shakeX, barY + shakeY, barWidth, barHeight, 2);
    }

    g.lineStyle(1, 0xffffff, 0.3);
    g.strokeRoundedRect(barX + shakeX, barY + shakeY, barWidth, barHeight, 2);

    for (let i = 1; i < state.maxHp; i++) {
      const notchX = barX + shakeX + (barWidth / state.maxHp) * i;
      g.lineStyle(1, 0x000000, 0.5);
      g.beginPath();
      g.moveTo(notchX, barY + shakeY);
      g.lineTo(notchX, barY + shakeY + barHeight);
      g.strokePath();
    }
  }

  for (const p of state.damageParticles) {
    const alpha = Math.max(0, p.life);
    g.fillStyle(p.color, alpha * 0.5);
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
    g.fillCircle(foodX, foodY, cellSize * 2 * (1 + state.breakProgress * 3));
    g.fillStyle(0xff66aa, flashAlpha * 0.3);
    g.fillCircle(foodX, foodY, cellSize * 3 * (1 + state.breakProgress * 2));
  }
}
