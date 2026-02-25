import Phaser from 'phaser';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

interface TapRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  hue: number;
  direction: Direction;
}

interface DirectionArrow {
  direction: Direction;
  alpha: number;
  pulse: number;
}

export interface TapIndicatorState {
  ripples: TapRipple[];
  arrows: DirectionArrow[];
  showArrows: boolean;
  arrowFadeTimer: number;
  lastTapTime: number;
}

const MAX_RIPPLES = 5;
const ARROW_SHOW_DURATION = 180;

const DIRECTION_COLORS: Record<Direction, number> = {
  UP: 0x00ccff,
  DOWN: 0xff6600,
  LEFT: 0xaa44ff,
  RIGHT: 0x44ff88,
};

const DIRECTION_ARROW_OFFSETS: Record<Direction, { dx: number; dy: number }> = {
  UP: { dx: 0, dy: -1 },
  DOWN: { dx: 0, dy: 1 },
  LEFT: { dx: -1, dy: 0 },
  RIGHT: { dx: 1, dy: 0 },
};

export const createTapIndicatorState = (): TapIndicatorState => ({
  ripples: [],
  arrows: [
    { direction: 'UP', alpha: 0, pulse: 0 },
    { direction: 'DOWN', alpha: 0, pulse: Math.PI * 0.5 },
    { direction: 'LEFT', alpha: 0, pulse: Math.PI },
    { direction: 'RIGHT', alpha: 0, pulse: Math.PI * 1.5 },
  ],
  showArrows: true,
  arrowFadeTimer: ARROW_SHOW_DURATION,
  lastTapTime: 0,
});

export const spawnTapRipple = (
  state: TapIndicatorState,
  x: number,
  y: number,
  direction: Direction
): void => {
  if (state.ripples.length >= MAX_RIPPLES) {
    state.ripples.shift();
  }

  state.ripples.push({
    x,
    y,
    radius: 4,
    maxRadius: 50,
    alpha: 1.0,
    hue: 0,
    direction,
  });

  state.showArrows = true;
  state.arrowFadeTimer = ARROW_SHOW_DURATION;
  state.lastTapTime = Date.now();
};

export const updateTapIndicator = (state: TapIndicatorState): void => {
  for (let i = state.ripples.length - 1; i >= 0; i--) {
    const r = state.ripples[i];
    r.radius += 2.5;
    r.alpha *= 0.92;
    if (r.alpha < 0.02 || r.radius > r.maxRadius) {
      state.ripples.splice(i, 1);
    }
  }

  for (const arrow of state.arrows) {
    arrow.pulse += 0.06;
  }

  if (state.arrowFadeTimer > 0) {
    state.arrowFadeTimer--;
  }
};

const drawArrowTriangle = (
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  direction: Direction,
  size: number,
  color: number,
  alpha: number
): void => {
  const offset = DIRECTION_ARROW_OFFSETS[direction];
  const tipX = cx + offset.dx * size;
  const tipY = cy + offset.dy * size;

  const perpX = offset.dy;
  const perpY = -offset.dx;
  const baseSize = size * 0.5;

  const baseX = cx - offset.dx * size * 0.3;
  const baseY = cy - offset.dy * size * 0.3;

  g.fillStyle(color, alpha);
  g.beginPath();
  g.moveTo(tipX, tipY);
  g.lineTo(baseX + perpX * baseSize, baseY + perpY * baseSize);
  g.lineTo(baseX - perpX * baseSize, baseY - perpY * baseSize);
  g.closePath();
  g.fillPath();
};

export const drawTapIndicator = (
  g: Phaser.GameObjects.Graphics,
  state: TapIndicatorState,
  headX: number,
  headY: number,
  cellSize: number,
  currentDirection: Direction,
  gameStarted: boolean,
  gameOver: boolean
): void => {
  if (!gameStarted || gameOver) return;

  for (const r of state.ripples) {
    const color = DIRECTION_COLORS[r.direction];
    const progress = r.radius / r.maxRadius;

    g.lineStyle(2.5 * (1 - progress), color, r.alpha * 0.7);
    g.strokeCircle(r.x, r.y, r.radius);

    g.lineStyle(1.5 * (1 - progress), 0xffffff, r.alpha * 0.4);
    g.strokeCircle(r.x, r.y, r.radius * 0.6);

    const arrowAlpha = r.alpha * 0.8;
    if (arrowAlpha > 0.1) {
      const arrowDist = r.radius * 0.5;
      const offset = DIRECTION_ARROW_OFFSETS[r.direction];
      const arrowX = r.x + offset.dx * arrowDist;
      const arrowY = r.y + offset.dy * arrowDist;
      drawArrowTriangle(g, arrowX, arrowY, r.direction, 6, color, arrowAlpha);
    }
  }

  const fadeAlpha = Math.min(1, state.arrowFadeTimer / 60);
  if (fadeAlpha <= 0) return;

  const arrowDist = cellSize * 2.2;

  for (const arrow of state.arrows) {
    if (arrow.direction === currentDirection) continue;

    const offset = DIRECTION_ARROW_OFFSETS[arrow.direction];
    const ax = headX + offset.dx * arrowDist;
    const ay = headY + offset.dy * arrowDist;

    const pulse = 0.6 + Math.sin(arrow.pulse) * 0.4;
    const color = DIRECTION_COLORS[arrow.direction];
    const baseAlpha = fadeAlpha * 0.35 * pulse;

    g.fillStyle(color, baseAlpha * 0.3);
    g.fillCircle(ax, ay, cellSize * 0.8);

    drawArrowTriangle(g, ax, ay, arrow.direction, cellSize * 0.45, color, baseAlpha);

    g.fillStyle(0xffffff, baseAlpha * 0.5);
    drawArrowTriangle(g, ax, ay, arrow.direction, cellSize * 0.25, 0xffffff, baseAlpha * 0.4);
  }
};
