export interface CleanRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  thickness: number;
}

export interface FloatingMote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  pulsePhase: number;
}

export interface SnakeGlowTrail {
  x: number;
  y: number;
  alpha: number;
  size: number;
}

export interface TearDrop {
  x: number;
  y: number;
  vy: number;
  size: number;
  alpha: number;
  wobblePhase: number;
}

export interface BloodSplatter {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  life: number;
  splashed: boolean;
  splashRadius: number;
}

export interface Snowflake {
  x: number;
  y: number;
  vy: number;
  vx: number;
  size: number;
  alpha: number;
  wobblePhase: number;
  wobbleSpeed: number;
}

export const CLEAN_COLORS = {
  bgDark: 0x0d1f2d,
  bgMid: 0x1a3a4a,
  bgLight: 0x2a5a6a,

  gridLine: 0x1e4a5e,
  gridAccent: 0x2e6a7e,

  snakeHead: 0xcc2936,
  snakeBody: 0x228b22,
  snakeTail: 0x1a6b1a,
  snakeGlow: 0xff6b6b,

  food: 0xffd700,
  foodCore: 0xffec8b,
  foodGlow: 0xffa500,

  ripple: 0xffd700,
  mote: 0xe8e8e8,

  text: 0xe2e8f0,
  textDim: 0x94a3b8,

  blood: 0xdc2626,
  bloodDark: 0x991b1b,
  tear: 0x60a5fa,
  tearHighlight: 0x93c5fd,

  snow: 0xffffff,
  snowGlow: 0xe8f4ff,
};

const MAX_RIPPLES = 5;
const MAX_MOTES = 20;
const MAX_TRAIL_LENGTH = 15;
const MAX_TEARS = 12;
const MAX_BLOOD = 20;
const MAX_SNOWFLAKES = 30;

export function createCleanEffectsState() {
  return {
    ripples: [] as CleanRipple[],
    motes: [] as FloatingMote[],
    glowTrail: [] as SnakeGlowTrail[],
    tears: [] as TearDrop[],
    blood: [] as BloodSplatter[],
    snowflakes: [] as Snowflake[],
    frameCount: 0,
  };
}

export type CleanEffectsState = ReturnType<typeof createCleanEffectsState>;

export function initMotes(state: CleanEffectsState, width: number, height: number): void {
  state.motes = [];
  for (let i = 0; i < MAX_MOTES; i++) {
    state.motes.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: 1 + Math.random() * 2,
      alpha: 0.1 + Math.random() * 0.2,
      pulsePhase: Math.random() * Math.PI * 2,
    });
  }
}

export function updateMotes(state: CleanEffectsState, width: number, height: number): void {
  for (const mote of state.motes) {
    mote.x += mote.vx;
    mote.y += mote.vy;
    mote.pulsePhase += 0.02;

    if (mote.x < 0) mote.x = width;
    if (mote.x > width) mote.x = 0;
    if (mote.y < 0) mote.y = height;
    if (mote.y > height) mote.y = 0;
  }
}

export function spawnRipple(state: CleanEffectsState, x: number, y: number): void {
  if (state.ripples.length >= MAX_RIPPLES) {
    state.ripples.shift();
  }

  state.ripples.push({
    x,
    y,
    radius: 5,
    maxRadius: 60,
    alpha: 0.6,
    thickness: 2,
  });
}

export function updateRipples(state: CleanEffectsState): void {
  for (let i = state.ripples.length - 1; i >= 0; i--) {
    const ripple = state.ripples[i];
    ripple.radius += 2;
    ripple.alpha *= 0.94;
    ripple.thickness *= 0.98;

    if (ripple.alpha < 0.02 || ripple.radius > ripple.maxRadius) {
      state.ripples.splice(i, 1);
    }
  }
}

export function updateGlowTrail(
  state: CleanEffectsState,
  headX: number,
  headY: number
): void {
  state.glowTrail.unshift({
    x: headX,
    y: headY,
    alpha: 0.5,
    size: 12,
  });

  if (state.glowTrail.length > MAX_TRAIL_LENGTH) {
    state.glowTrail.pop();
  }

  for (let i = 0; i < state.glowTrail.length; i++) {
    const t = state.glowTrail[i];
    t.alpha *= 0.85;
    t.size *= 0.95;
  }

  state.glowTrail = state.glowTrail.filter(t => t.alpha > 0.02);
}

export function spawnTears(state: CleanEffectsState, x: number, y: number, count: number): void {
  for (let i = 0; i < count; i++) {
    if (state.tears.length >= MAX_TEARS) {
      state.tears.shift();
    }
    state.tears.push({
      x: x + (Math.random() - 0.5) * 20,
      y: y + (Math.random() - 0.5) * 10,
      vy: 0.5 + Math.random() * 1.5,
      size: 3 + Math.random() * 3,
      alpha: 0.7 + Math.random() * 0.3,
      wobblePhase: Math.random() * Math.PI * 2,
    });
  }
}

export function updateTears(state: CleanEffectsState, height: number): void {
  for (let i = state.tears.length - 1; i >= 0; i--) {
    const tear = state.tears[i];
    tear.vy += 0.08;
    tear.y += tear.vy;
    tear.wobblePhase += 0.1;
    tear.x += Math.sin(tear.wobblePhase) * 0.3;
    tear.alpha *= 0.99;

    if (tear.y > height + 10 || tear.alpha < 0.05) {
      state.tears.splice(i, 1);
    }
  }
}

export function spawnBlood(state: CleanEffectsState, x: number, y: number, count: number): void {
  for (let i = 0; i < count; i++) {
    if (state.blood.length >= MAX_BLOOD) {
      state.blood.shift();
    }
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 3;
    state.blood.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1,
      size: 2 + Math.random() * 4,
      alpha: 0.8 + Math.random() * 0.2,
      life: 1.0,
      splashed: false,
      splashRadius: 0,
    });
  }
}

export function updateBlood(state: CleanEffectsState, height: number): void {
  for (let i = state.blood.length - 1; i >= 0; i--) {
    const drop = state.blood[i];

    if (!drop.splashed) {
      drop.vy += 0.15;
      drop.x += drop.vx;
      drop.y += drop.vy;
      drop.vx *= 0.98;

      if (drop.y >= height - 5) {
        drop.splashed = true;
        drop.y = height - 5;
        drop.splashRadius = drop.size * 1.5;
      }
    } else {
      drop.splashRadius += 0.3;
      drop.alpha *= 0.95;
    }

    drop.life -= 0.015;

    if (drop.life <= 0 || drop.alpha < 0.02) {
      state.blood.splice(i, 1);
    }
  }
}

export function initSnowflakes(state: CleanEffectsState, width: number, height: number): void {
  state.snowflakes = [];
  for (let i = 0; i < MAX_SNOWFLAKES; i++) {
    state.snowflakes.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vy: 0.3 + Math.random() * 0.7,
      vx: (Math.random() - 0.5) * 0.2,
      size: 1 + Math.random() * 3,
      alpha: 0.3 + Math.random() * 0.5,
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.02 + Math.random() * 0.03,
    });
  }
}

export function updateSnowflakes(state: CleanEffectsState, width: number, height: number): void {
  for (const flake of state.snowflakes) {
    flake.wobblePhase += flake.wobbleSpeed;
    flake.x += flake.vx + Math.sin(flake.wobblePhase) * 0.5;
    flake.y += flake.vy;

    if (flake.y > height + 10) {
      flake.y = -10;
      flake.x = Math.random() * width;
    }
    if (flake.x < -10) flake.x = width + 10;
    if (flake.x > width + 10) flake.x = -10;
  }
}

export function drawSnowflakes(
  g: Phaser.GameObjects.Graphics,
  state: CleanEffectsState
): void {
  for (const flake of state.snowflakes) {
    g.fillStyle(CLEAN_COLORS.snowGlow, flake.alpha * 0.3);
    g.fillCircle(flake.x, flake.y, flake.size * 2);

    g.fillStyle(CLEAN_COLORS.snow, flake.alpha);
    g.fillCircle(flake.x, flake.y, flake.size);
  }
}

export function drawCleanBackground(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  frameCount: number
): void {
  g.fillStyle(CLEAN_COLORS.bgDark, 1);
  g.fillRect(0, 0, width, height);

  const pulse = 0.5 + Math.sin(frameCount * 0.01) * 0.1;
  g.fillStyle(CLEAN_COLORS.bgMid, pulse * 0.4);
  g.fillCircle(width / 2, height / 2, width * 0.6);
  g.fillStyle(CLEAN_COLORS.bgLight, pulse * 0.2);
  g.fillCircle(width / 2, height / 2, width * 0.3);
}

export function drawCleanGrid(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number,
  cellSize: number,
  gridSize: number,
  frameCount: number
): void {
  const pulse = 0.05 + Math.sin(frameCount * 0.02) * 0.02;
  g.lineStyle(1, CLEAN_COLORS.gridLine, pulse);

  for (let i = 0; i <= gridSize; i++) {
    g.lineBetween(i * cellSize, 0, i * cellSize, height);
    g.lineBetween(0, i * cellSize, width, i * cellSize);
  }

  g.lineStyle(1, CLEAN_COLORS.gridAccent, pulse * 1.5);
  for (let i = 0; i <= gridSize; i += 5) {
    g.lineBetween(i * cellSize, 0, i * cellSize, height);
    g.lineBetween(0, i * cellSize, width, i * cellSize);
  }
}

export function drawMotes(
  g: Phaser.GameObjects.Graphics,
  state: CleanEffectsState
): void {
  for (const mote of state.motes) {
    const pulse = 0.5 + Math.sin(mote.pulsePhase) * 0.5;
    const alpha = mote.alpha * pulse;

    g.fillStyle(CLEAN_COLORS.mote, alpha * 0.3);
    g.fillCircle(mote.x, mote.y, mote.size * 2);
    g.fillStyle(CLEAN_COLORS.mote, alpha);
    g.fillCircle(mote.x, mote.y, mote.size);
  }
}

export function drawRipples(
  g: Phaser.GameObjects.Graphics,
  state: CleanEffectsState
): void {
  for (const ripple of state.ripples) {
    g.lineStyle(ripple.thickness, CLEAN_COLORS.ripple, ripple.alpha);
    g.strokeCircle(ripple.x, ripple.y, ripple.radius);

    g.lineStyle(ripple.thickness * 0.5, 0xffffff, ripple.alpha * 0.5);
    g.strokeCircle(ripple.x, ripple.y, ripple.radius * 0.8);
  }
}

export function drawGlowTrail(
  g: Phaser.GameObjects.Graphics,
  state: CleanEffectsState
): void {
  for (const trail of state.glowTrail) {
    g.fillStyle(CLEAN_COLORS.snakeGlow, trail.alpha * 0.3);
    g.fillCircle(trail.x, trail.y, trail.size);
  }
}

export function drawCleanFood(
  g: Phaser.GameObjects.Graphics,
  foodX: number,
  foodY: number,
  cellSize: number,
  frameCount: number
): void {
  const pulseScale = 1 + Math.sin(frameCount * 0.08) * 0.1;
  const glowPulse = 0.3 + Math.sin(frameCount * 0.06) * 0.15;
  const foodSize = (cellSize / 2 - 2) * pulseScale;

  g.fillStyle(CLEAN_COLORS.foodGlow, glowPulse * 0.3);
  g.fillCircle(foodX, foodY, foodSize + 12);
  g.fillStyle(CLEAN_COLORS.foodGlow, glowPulse * 0.5);
  g.fillCircle(foodX, foodY, foodSize + 6);

  g.fillStyle(CLEAN_COLORS.food, 0.9);
  g.fillCircle(foodX, foodY, foodSize);
  g.fillStyle(CLEAN_COLORS.foodCore, 0.8);
  g.fillCircle(foodX, foodY, foodSize * 0.5);

  g.fillStyle(0xffffff, 0.6);
  g.fillCircle(foodX - foodSize * 0.3, foodY - foodSize * 0.3, foodSize * 0.15);
}

export function drawCleanSnake(
  g: Phaser.GameObjects.Graphics,
  snake: { x: number; y: number }[],
  cellSize: number,
  frameCount: number
): void {
  const snakeLen = snake.length;
  if (snakeLen === 0) return;

  for (let i = snakeLen - 1; i >= 0; i--) {
    const segment = snake[i];
    const centerX = segment.x * cellSize + cellSize / 2;
    const centerY = segment.y * cellSize + cellSize / 2;
    const t = snakeLen > 1 ? i / (snakeLen - 1) : 1;

    const glowAlpha = 0.15 * (1 - t * 0.5);
    const glowSize = (cellSize / 2 + 6) * (0.6 + t * 0.4);
    g.fillStyle(CLEAN_COLORS.snakeGlow, glowAlpha);
    g.fillCircle(centerX, centerY, glowSize);
  }

  for (let i = snakeLen - 1; i >= 0; i--) {
    const segment = snake[i];
    const centerX = segment.x * cellSize + cellSize / 2;
    const centerY = segment.y * cellSize + cellSize / 2;
    const t = snakeLen > 1 ? i / (snakeLen - 1) : 1;
    const radius = (cellSize / 2 - 2) * (0.8 + t * 0.2);

    const r1 = (CLEAN_COLORS.snakeTail >> 16) & 0xff;
    const g1 = (CLEAN_COLORS.snakeTail >> 8) & 0xff;
    const b1 = CLEAN_COLORS.snakeTail & 0xff;
    const r2 = (CLEAN_COLORS.snakeHead >> 16) & 0xff;
    const g2 = (CLEAN_COLORS.snakeHead >> 8) & 0xff;
    const b2 = CLEAN_COLORS.snakeHead & 0xff;

    const r = Math.round(r1 + (r2 - r1) * t);
    const gVal = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    const color = (r << 16) | (gVal << 8) | b;

    g.fillStyle(color, 0.95);
    g.fillCircle(centerX, centerY, radius);

    if (i === 0) {
      const pulse = 0.3 + Math.sin(frameCount * 0.1) * 0.1;
      g.fillStyle(CLEAN_COLORS.snakeGlow, pulse);
      g.fillCircle(centerX, centerY, radius + 4);

      g.fillStyle(CLEAN_COLORS.snakeHead, 1);
      g.fillCircle(centerX, centerY, radius);

      g.fillStyle(0xffffff, 0.7);
      g.fillCircle(centerX - radius * 0.3, centerY - radius * 0.2, radius * 0.15);
    }
  }
}

export function drawCleanVignette(
  g: Phaser.GameObjects.Graphics,
  width: number,
  height: number
): void {
  const layers = 4;
  for (let i = 0; i < layers; i++) {
    const inset = i * 25;
    const alpha = 0.08 * (1 - i / layers);
    g.lineStyle(50, 0x000000, alpha);
    g.strokeRect(inset - 25, inset - 25, width - inset * 2 + 50, height - inset * 2 + 50);
  }
}

export function drawTears(
  g: Phaser.GameObjects.Graphics,
  state: CleanEffectsState
): void {
  for (const tear of state.tears) {
    g.fillStyle(CLEAN_COLORS.tear, tear.alpha * 0.3);
    g.fillCircle(tear.x, tear.y, tear.size * 2);

    g.fillStyle(CLEAN_COLORS.tear, tear.alpha);
    g.fillCircle(tear.x, tear.y - tear.size * 0.3, tear.size);
    g.fillCircle(tear.x, tear.y + tear.size * 0.5, tear.size * 0.7);

    g.fillStyle(CLEAN_COLORS.tearHighlight, tear.alpha * 0.6);
    g.fillCircle(tear.x - tear.size * 0.25, tear.y - tear.size * 0.4, tear.size * 0.3);
  }
}

export function drawBlood(
  g: Phaser.GameObjects.Graphics,
  state: CleanEffectsState
): void {
  for (const drop of state.blood) {
    const effectiveAlpha = drop.alpha * drop.life;

    if (drop.splashed) {
      g.fillStyle(CLEAN_COLORS.bloodDark, effectiveAlpha * 0.5);
      g.fillCircle(drop.x, drop.y, drop.splashRadius);
      g.fillStyle(CLEAN_COLORS.blood, effectiveAlpha * 0.7);
      g.fillCircle(drop.x, drop.y, drop.splashRadius * 0.6);
    } else {
      g.fillStyle(CLEAN_COLORS.blood, effectiveAlpha * 0.4);
      g.fillCircle(drop.x, drop.y, drop.size * 2);
      g.fillStyle(CLEAN_COLORS.blood, effectiveAlpha);
      g.fillCircle(drop.x, drop.y, drop.size);
      g.fillStyle(0xffffff, effectiveAlpha * 0.3);
      g.fillCircle(drop.x - drop.size * 0.3, drop.y - drop.size * 0.3, drop.size * 0.25);
    }
  }
}

export function drawCleanHUD(
  g: Phaser.GameObjects.Graphics,
  score: number,
  snakeLength: number,
  width: number,
  frameCount: number,
  drawDigit: (g: Phaser.GameObjects.Graphics, digit: string, x: number, y: number, size: number) => void
): void {
  const padding = 15;
  const digitSize = 12;
  const digitSpacing = digitSize * 0.6;

  const pulse = 0.8 + Math.sin(frameCount * 0.05) * 0.1;

  const scoreStr = String(score).padStart(4, '0');
  let xPos = padding;

  for (let i = 0; i < scoreStr.length; i++) {
    const digit = scoreStr[i];
    g.fillStyle(CLEAN_COLORS.text, pulse);
    drawDigit(g, digit, xPos, padding, digitSize);
    xPos += digitSpacing;
  }

  const lengthStr = String(snakeLength);
  xPos = width - padding - lengthStr.length * digitSpacing;

  for (let i = 0; i < lengthStr.length; i++) {
    const digit = lengthStr[i];
    g.fillStyle(CLEAN_COLORS.textDim, pulse * 0.7);
    drawDigit(g, digit, xPos, padding, digitSize * 0.9);
    xPos += digitSpacing * 0.9;
  }
}
