import { Position, FakeFood } from './types';
import {
  GRID_SIZE,
  FAKE_FOOD_SPAWN_CHANCE,
  FAKE_FOOD_MAX_ON_BOARD,
  FAKE_FOOD_LIFETIME,
  FAKE_FOOD_SHRINK,
  FAKE_FOOD_MIN_FOOD_EATEN,
} from './constants';
import { collidesWithSnake, positionsEqual } from './logic';
import { FOOD_TYPE_COUNT } from '../components/foodVariety';

const generateFakeFoodPosition = (
  snake: Position[],
  food: Position,
  existing: FakeFood[],
  powerUpPos?: Position
): Position => {
  const occupied = existing.map(f => f.position);
  let pos: Position;
  let attempts = 0;
  do {
    pos = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
    attempts++;
  } while (
    attempts < 100 && (
      collidesWithSnake(pos, snake) ||
      positionsEqual(pos, food) ||
      (powerUpPos && positionsEqual(pos, powerUpPos)) ||
      occupied.some(o => positionsEqual(pos, o))
    )
  );
  return pos;
};

export const shouldSpawnFakeFood = (
  fakeFoods: FakeFood[],
  foodEaten: number
): boolean =>
  foodEaten >= FAKE_FOOD_MIN_FOOD_EATEN &&
  fakeFoods.length < FAKE_FOOD_MAX_ON_BOARD &&
  Math.random() < FAKE_FOOD_SPAWN_CHANCE;

export const generateFakeFood = (
  snake: Position[],
  food: Position,
  existing: FakeFood[],
  tickCount: number,
  powerUpPos?: Position
): FakeFood => {
  const position = generateFakeFoodPosition(snake, food, existing, powerUpPos);
  return {
    position,
    spawnTick: tickCount,
    lifetime: FAKE_FOOD_LIFETIME,
    mimicIndex: Math.floor(Math.random() * FOOD_TYPE_COUNT),
  };
};

export const expireFakeFoods = (items: FakeFood[], tickCount: number): FakeFood[] =>
  items.filter(f => tickCount - f.spawnTick <= f.lifetime);

export const collectFakeFood = (
  items: FakeFood[],
  head: Position
): { remaining: FakeFood[]; eaten: FakeFood | null } => {
  for (const item of items) {
    if (positionsEqual(head, item.position)) {
      return {
        remaining: items.filter(f => f !== item),
        eaten: item,
      };
    }
  }
  return { remaining: items, eaten: null };
};

export const shrinkFromFake = (snake: Position[]): Position[] => {
  const removeCount = Math.min(FAKE_FOOD_SHRINK, snake.length - 1);
  if (removeCount <= 0) return snake;
  return snake.slice(0, snake.length - removeCount);
};
