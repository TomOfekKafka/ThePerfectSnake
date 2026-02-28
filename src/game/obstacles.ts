import { Position, Obstacle } from './types';
import {
  GRID_SIZE,
  OBSTACLE_SPAWN_INTERVAL,
  OBSTACLE_MAX_ON_BOARD,
  OBSTACLE_MIN_FOOD_EATEN,
  OBSTACLE_PATTERN_CHANCE,
} from './constants';
import { collidesWithSnake, positionsEqual } from './logic';

const isOccupied = (
  pos: Position,
  snake: Position[],
  food: Position,
  obstacles: Obstacle[],
  powerUpPos?: Position
): boolean =>
  collidesWithSnake(pos, snake) ||
  positionsEqual(pos, food) ||
  obstacles.some(o => positionsEqual(o.position, pos)) ||
  (powerUpPos !== undefined && positionsEqual(pos, powerUpPos));

const safeMargin = (pos: Position, snake: Position[]): boolean => {
  if (snake.length === 0) return true;
  const head = snake[0];
  const dx = Math.abs(pos.x - head.x);
  const dy = Math.abs(pos.y - head.y);
  return dx + dy >= 3;
};

const randomFreePosition = (
  snake: Position[],
  food: Position,
  obstacles: Obstacle[],
  powerUpPos?: Position
): Position | null => {
  for (let attempt = 0; attempt < 60; attempt++) {
    const pos = {
      x: 1 + Math.floor(Math.random() * (GRID_SIZE - 2)),
      y: 1 + Math.floor(Math.random() * (GRID_SIZE - 2)),
    };
    if (!isOccupied(pos, snake, food, obstacles, powerUpPos) && safeMargin(pos, snake)) {
      return pos;
    }
  }
  return null;
};

const generatePattern = (
  origin: Position,
  snake: Position[],
  food: Position,
  obstacles: Obstacle[],
  powerUpPos?: Position
): Position[] => {
  const patterns: Position[][] = [
    [{ x: 0, y: 0 }, { x: 1, y: 0 }],
    [{ x: 0, y: 0 }, { x: 0, y: 1 }],
    [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }],
    [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }],
    [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }],
    [{ x: 0, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }],
    [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }],
    [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 }],
  ];

  const pattern = patterns[Math.floor(Math.random() * patterns.length)];
  const positions = pattern.map(d => ({ x: origin.x + d.x, y: origin.y + d.y }));

  const allValid = positions.every(p =>
    p.x >= 1 && p.x < GRID_SIZE - 1 &&
    p.y >= 1 && p.y < GRID_SIZE - 1 &&
    !isOccupied(p, snake, food, obstacles, powerUpPos) &&
    safeMargin(p, snake)
  );

  return allValid ? positions : [origin];
};

export const shouldSpawnObstacles = (
  obstacles: Obstacle[],
  foodEaten: number,
  lastSpawnFood: number
): boolean =>
  foodEaten >= OBSTACLE_MIN_FOOD_EATEN &&
  obstacles.length < OBSTACLE_MAX_ON_BOARD &&
  foodEaten - lastSpawnFood >= OBSTACLE_SPAWN_INTERVAL;

export const spawnObstacles = (
  obstacles: Obstacle[],
  snake: Position[],
  food: Position,
  tickCount: number,
  powerUpPos?: Position
): Obstacle[] => {
  const origin = randomFreePosition(snake, food, obstacles, powerUpPos);
  if (!origin) return obstacles;

  const usePattern = Math.random() < OBSTACLE_PATTERN_CHANCE;
  const positions = usePattern
    ? generatePattern(origin, snake, food, obstacles, powerUpPos)
    : [origin];

  const remaining = OBSTACLE_MAX_ON_BOARD - obstacles.length;
  const toAdd = positions.slice(0, remaining);

  const newObstacles = toAdd.map(pos => ({
    position: pos,
    spawnTick: tickCount,
    variant: Math.floor(Math.random() * 4),
  }));

  return [...obstacles, ...newObstacles];
};

export const collidesWithObstacle = (pos: Position, obstacles: Obstacle[]): boolean =>
  obstacles.some(o => positionsEqual(pos, o.position));
