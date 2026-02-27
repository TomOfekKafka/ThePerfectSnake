import Phaser from 'phaser';
import { THEME } from './gameTheme';

export interface SpeedLinesState {
  lines: SpeedLine[];
  intensity: number;
  targetIntensity: number;
  direction: { dx: number; dy: number };
  streakFlash: number;
}

interface SpeedLine {
  x: number;
  y: number;
  length: number;
  alpha: number;
  speed: number;
  thickness: number;
}

const MAX_SPEED_LINES = 20;

export function createSpeedLinesState(): SpeedLinesState {
  return {
    lines: [],
    intensity: 0,
    targetIntensity: 0,
    direction: { dx: 1, dy: 0 },
    streakFlash: 0,
  };
}

export function updateSpeedLines(
  state: SpeedLinesState,
  snakeLength: number,
  foodEaten: number,
  headX: number,
  headY: number,
  dirX: number,
  dirY: number,
  width: number,
  height: number,
  gameOver: boolean
): void {
  if (gameOver) {
    state.targetIntensity = 0;
    state.intensity *= 0.9;
    return;
  }

  state.targetIntensity = Math.min(1, (snakeLength - 3) / 20 + foodEaten * 0.02);
  state.intensity += (state.targetIntensity - state.intensity) * 0.05;

  if (dirX !== 0 || dirY !== 0) {
    state.direction.dx = dirX;
    state.direction.dy = dirY;
  }

  state.streakFlash *= 0.9;

  const spawnRate = state.intensity * 0.4;
  if (state.lines.length < MAX_SPEED_LINES && Math.random() < spawnRate) {
    spawnSpeedLine(state, headX, headY, width, height);
  }

  for (let i = state.lines.length - 1; i >= 0; i--) {
    const line = state.lines[i];
    line.x -= state.direction.dx * line.speed;
    line.y -= state.direction.dy * line.speed;
    line.alpha *= 0.95;
    line.length *= 0.99;

    const outOfBounds =
      line.x < -50 || line.x > width + 50 ||
      line.y < -50 || line.y > height + 50;

    if (line.alpha < 0.02 || outOfBounds) {
      state.lines.splice(i, 1);
    }
  }
}

function spawnSpeedLine(
  state: SpeedLinesState,
  headX: number,
  headY: number,
  width: number,
  height: number
): void {
  const perpX = -state.direction.dy;
  const perpY = state.direction.dx;

  const spread = 80 + Math.random() * 120;
  const offset = (Math.random() - 0.5) * spread * 2;

  const behindDist = 30 + Math.random() * 60;
  const x = headX - state.direction.dx * behindDist + perpX * offset;
  const y = headY - state.direction.dy * behindDist + perpY * offset;

  if (x < -20 || x > width + 20 || y < -20 || y > height + 20) return;

  state.lines.push({
    x,
    y,
    length: 15 + Math.random() * 30 * state.intensity,
    alpha: 0.15 + Math.random() * 0.25 * state.intensity,
    speed: 3 + Math.random() * 4,
    thickness: 1 + Math.random() * 1.5,
  });
}

export function triggerSpeedBoost(state: SpeedLinesState): void {
  state.streakFlash = 1;
  state.intensity = Math.min(1, state.intensity + 0.3);
}

export function drawSpeedLines(
  state: SpeedLinesState,
  g: Phaser.GameObjects.Graphics,
  _width: number,
  _height: number
): void {
  if (state.intensity < 0.01) return;

  const dx = state.direction.dx;
  const dy = state.direction.dy;

  for (const line of state.lines) {
    const endX = line.x + dx * line.length;
    const endY = line.y + dy * line.length;

    g.lineStyle(line.thickness + 1, THEME.snake.glow, line.alpha * 0.2);
    g.lineBetween(line.x, line.y, endX, endY);

    g.lineStyle(line.thickness, THEME.snake.highlight, line.alpha);
    g.lineBetween(line.x, line.y, endX, endY);
  }

  if (state.streakFlash > 0.01) {
    g.fillStyle(THEME.snake.glow, state.streakFlash * 0.08);
    g.fillRect(0, 0, _width, _height);
  }
}
