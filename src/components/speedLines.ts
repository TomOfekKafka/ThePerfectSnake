import Phaser from 'phaser';
import { THEME } from './gameTheme';

interface SpeedLine {
  x: number;
  y: number;
  length: number;
  angle: number;
  life: number;
  maxLife: number;
  width: number;
  brightness: number;
}

interface MotionRing {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  life: number;
  maxLife: number;
}

export interface SpeedLinesState {
  lines: SpeedLine[];
  rings: MotionRing[];
  lastHeadX: number;
  lastHeadY: number;
  dirX: number;
  dirY: number;
  moveCount: number;
}

const MAX_SPEED_LINES = 30;
const MAX_MOTION_RINGS = 4;
const LINE_LIFETIME = 16;
const RING_LIFETIME = 12;

export function createSpeedLinesState(): SpeedLinesState {
  return {
    lines: [],
    rings: [],
    lastHeadX: -1,
    lastHeadY: -1,
    dirX: 1,
    dirY: 0,
    moveCount: 0,
  };
}

function spawnBurstLines(
  state: SpeedLinesState,
  x: number,
  y: number,
  dirX: number,
  dirY: number
): void {
  const backAngle = Math.atan2(-dirY, -dirX);
  const count = 3 + Math.floor(Math.random() * 3);

  for (let i = 0; i < count; i++) {
    if (state.lines.length >= MAX_SPEED_LINES) {
      state.lines.shift();
    }

    const spread = (Math.random() - 0.5) * 1.6;
    const angle = backAngle + spread;
    const offsetDist = 6 + Math.random() * 10;
    const perpAngle = backAngle + Math.PI / 2;
    const perpOffset = (Math.random() - 0.5) * 14;

    const life = LINE_LIFETIME * (0.5 + Math.random() * 0.5);

    state.lines.push({
      x: x + Math.cos(backAngle) * offsetDist + Math.cos(perpAngle) * perpOffset,
      y: y + Math.sin(backAngle) * offsetDist + Math.sin(perpAngle) * perpOffset,
      length: 14 + Math.random() * 20,
      angle,
      life,
      maxLife: life,
      width: 1 + Math.random() * 2,
      brightness: 0.5 + Math.random() * 0.5,
    });
  }
}

function spawnMotionRing(state: SpeedLinesState, x: number, y: number): void {
  if (state.rings.length >= MAX_MOTION_RINGS) {
    state.rings.shift();
  }

  const life = RING_LIFETIME;
  state.rings.push({
    x,
    y,
    radius: 2,
    maxRadius: 16 + Math.random() * 8,
    life,
    maxLife: life,
  });
}

export function updateSpeedLines(
  state: SpeedLinesState,
  headX: number,
  headY: number,
  snake: { x: number; y: number }[],
  cellSize: number
): void {
  const moved = headX !== state.lastHeadX || headY !== state.lastHeadY;

  if (moved && state.lastHeadX >= 0) {
    const dx = headX - state.lastHeadX;
    const dy = headY - state.lastHeadY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 0 && dist < cellSize * 3) {
      state.dirX = dx / dist;
      state.dirY = dy / dist;
    }

    state.moveCount++;
    spawnBurstLines(state, state.lastHeadX, state.lastHeadY, state.dirX, state.dirY);

    if (state.moveCount % 5 === 0) {
      spawnMotionRing(state, state.lastHeadX, state.lastHeadY);
    }

    if (snake.length > 2) {
      const tail = snake[snake.length - 1];
      const prevTail = snake[snake.length - 2];
      const tailX = tail.x * cellSize + cellSize / 2;
      const tailY = tail.y * cellSize + cellSize / 2;
      const ptX = prevTail.x * cellSize + cellSize / 2;
      const ptY = prevTail.y * cellSize + cellSize / 2;
      const tdx = tailX - ptX;
      const tdy = tailY - ptY;
      const tDist = Math.sqrt(tdx * tdx + tdy * tdy);
      if (tDist > 0) {
        spawnBurstLines(state, tailX, tailY, tdx / tDist, tdy / tDist);
      }
    }
  }

  state.lastHeadX = headX;
  state.lastHeadY = headY;

  for (let i = state.lines.length - 1; i >= 0; i--) {
    const line = state.lines[i];
    line.life--;
    if (line.life <= 0) {
      state.lines.splice(i, 1);
    }
  }

  for (let i = state.rings.length - 1; i >= 0; i--) {
    const ring = state.rings[i];
    ring.life--;
    const progress = 1 - ring.life / ring.maxLife;
    ring.radius = 2 + (ring.maxRadius - 2) * easeOut(progress);
    if (ring.life <= 0) {
      state.rings.splice(i, 1);
    }
  }
}

function easeOut(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function drawSpeedLines(
  g: Phaser.GameObjects.Graphics,
  state: SpeedLinesState
): void {
  const glowColor = THEME.snake.glow;
  const highlightColor = THEME.snake.highlight;
  const coreColor = 0xeeeeff;

  for (const line of state.lines) {
    const t = line.life / line.maxLife;
    const alpha = t * line.brightness;
    const endX = line.x + Math.cos(line.angle) * line.length * t;
    const endY = line.y + Math.sin(line.angle) * line.length * t;

    g.lineStyle(line.width * 2.2, glowColor, alpha * 0.12);
    g.lineBetween(line.x, line.y, endX, endY);

    g.lineStyle(line.width * 1.2, highlightColor, alpha * 0.35);
    g.lineBetween(line.x, line.y, endX, endY);

    g.lineStyle(line.width * 0.5, coreColor, alpha * 0.7);
    g.lineBetween(line.x, line.y, endX, endY);
  }

  for (const ring of state.rings) {
    const t = ring.life / ring.maxLife;
    const alpha = t * 0.35;

    g.lineStyle(1.8, glowColor, alpha * 0.25);
    g.strokeCircle(ring.x, ring.y, ring.radius * 1.15);

    g.lineStyle(1.2, highlightColor, alpha * 0.5);
    g.strokeCircle(ring.x, ring.y, ring.radius);

    g.lineStyle(0.6, coreColor, alpha * 0.35);
    g.strokeCircle(ring.x, ring.y, ring.radius * 0.65);
  }
}
