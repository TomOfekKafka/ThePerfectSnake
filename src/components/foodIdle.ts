import Phaser from 'phaser';

interface IdleSparkle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: number;
}

export interface FoodIdleState {
  breathPhase: number;
  swayPhase: number;
  sparkles: IdleSparkle[];
  auraPhase: number;
  squishPhase: number;
  lastFoodX: number;
  lastFoodY: number;
  spawnTimer: number;
}

const MAX_SPARKLES = 12;
const SPARKLE_COLORS = [0xffffff, 0xffeedd, 0xddccff, 0xaaddff, 0xffddaa, 0xeeffdd];

export function createFoodIdle(): FoodIdleState {
  return {
    breathPhase: 0,
    swayPhase: 0,
    sparkles: [],
    auraPhase: 0,
    squishPhase: 0,
    lastFoodX: 0,
    lastFoodY: 0,
    spawnTimer: 0,
  };
}

function spawnSparkle(state: FoodIdleState, foodX: number, foodY: number, cellSize: number): void {
  if (state.sparkles.length >= MAX_SPARKLES) return;

  const angle = Math.random() * Math.PI * 2;
  const dist = cellSize * (0.3 + Math.random() * 0.5);
  const speed = 0.3 + Math.random() * 0.5;

  state.sparkles.push({
    x: foodX + Math.cos(angle) * dist * 0.3,
    y: foodY + Math.sin(angle) * dist * 0.3,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed - 0.4,
    life: 1,
    maxLife: 30 + Math.random() * 30,
    size: 1 + Math.random() * 2,
    color: SPARKLE_COLORS[Math.floor(Math.random() * SPARKLE_COLORS.length)],
  });
}

export function updateFoodIdle(state: FoodIdleState, foodX: number, foodY: number, cellSize: number): void {
  state.breathPhase += 0.045;
  state.swayPhase += 0.03;
  state.auraPhase += 0.035;
  state.squishPhase += 0.065;

  state.lastFoodX = foodX;
  state.lastFoodY = foodY;

  state.spawnTimer++;
  if (state.spawnTimer >= 6) {
    state.spawnTimer = 0;
    spawnSparkle(state, foodX, foodY, cellSize);
  }

  for (let i = state.sparkles.length - 1; i >= 0; i--) {
    const s = state.sparkles[i];
    s.x += s.vx;
    s.y += s.vy;
    s.vy -= 0.01;
    s.life -= 1 / s.maxLife;
    if (s.life <= 0) {
      state.sparkles.splice(i, 1);
    }
  }
}

export function getFoodIdleOffset(state: FoodIdleState): { dx: number; dy: number; scale: number } {
  const breathScale = 1 + Math.sin(state.breathPhase) * 0.12;
  const swayX = Math.sin(state.swayPhase) * 1.8;
  const swayY = Math.cos(state.swayPhase * 0.7) * 1.2;

  const squishX = 1 + Math.sin(state.squishPhase) * 0.06;
  const squishY = 1 - Math.sin(state.squishPhase) * 0.06;
  const combinedScale = breathScale * ((squishX + squishY) / 2);

  return { dx: swayX, dy: swayY, scale: combinedScale };
}

export function drawFoodIdle(
  g: Phaser.GameObjects.Graphics,
  state: FoodIdleState,
  foodX: number,
  foodY: number,
  cellSize: number,
  frameCount: number
): void {
  const idle = getFoodIdleOffset(state);
  const cx = foodX + idle.dx;
  const cy = foodY + idle.dy;

  const auraRadius = cellSize * (1.2 + Math.sin(state.auraPhase) * 0.4);
  const auraAlpha = 0.06 + Math.sin(state.auraPhase * 1.3) * 0.04;

  g.fillStyle(0xffeedd, auraAlpha);
  g.fillCircle(cx, cy, auraRadius);

  const innerAura = cellSize * (0.85 + Math.sin(state.auraPhase + 1) * 0.25);
  g.fillStyle(0xffddbb, auraAlpha * 1.5);
  g.fillCircle(cx, cy, innerAura);

  const ringRadius = cellSize * (1.0 + Math.sin(state.breathPhase) * 0.3);
  const ringAlpha = 0.08 + Math.sin(state.breathPhase * 0.8) * 0.05;
  g.lineStyle(1.5, 0xffffff, ringAlpha);
  g.strokeCircle(cx, cy, ringRadius);

  const squishX = 1 + Math.sin(state.squishPhase) * 0.06;
  const squishY = 1 - Math.sin(state.squishPhase) * 0.06;
  if (Math.abs(squishX - squishY) > 0.01) {
    const ellipseRadius = cellSize * 0.55;
    g.lineStyle(1, 0xffffff, 0.05);
    g.strokeEllipse(cx, cy, ellipseRadius * 2 * squishX, ellipseRadius * 2 * squishY);
  }

  for (const sparkle of state.sparkles) {
    const alpha = sparkle.life * 0.9;
    const twinkle = 0.5 + Math.sin(frameCount * 0.3 + sparkle.x) * 0.5;

    g.fillStyle(sparkle.color, alpha * twinkle);
    g.fillCircle(sparkle.x, sparkle.y, sparkle.size * sparkle.life);

    if (sparkle.life > 0.5) {
      const crossSize = sparkle.size * sparkle.life * 1.5;
      g.lineStyle(0.5, sparkle.color, alpha * twinkle * 0.5);
      g.lineBetween(
        sparkle.x - crossSize, sparkle.y,
        sparkle.x + crossSize, sparkle.y
      );
      g.lineBetween(
        sparkle.x, sparkle.y - crossSize,
        sparkle.x, sparkle.y + crossSize
      );
    }
  }
}
