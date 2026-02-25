import { Position, BonusFood } from './types';
import { GRID_SIZE, BONUS_FOOD_SPAWN_CHANCE, BONUS_FOOD_LIFETIME, BONUS_FOOD_SHRINK_AMOUNT, BONUS_FOOD_MIN_SNAKE_LENGTH } from './constants';
import { collidesWithSnake, positionsEqual } from './logic';

export const generateBonusFood = (
  snake: Position[],
  food: Position,
  tickCount: number,
  powerUpPos?: Position
): BonusFood => {
  let pos: Position;
  do {
    pos = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (
    collidesWithSnake(pos, snake) ||
    positionsEqual(pos, food) ||
    (powerUpPos && positionsEqual(pos, powerUpPos))
  );
  return { position: pos, spawnTick: tickCount, lifetime: BONUS_FOOD_LIFETIME };
};

export const shouldSpawnBonusFood = (
  bonusFood: BonusFood | null,
  snakeLength: number,
  foodEaten: number
): boolean =>
  bonusFood === null &&
  snakeLength >= BONUS_FOOD_MIN_SNAKE_LENGTH &&
  foodEaten >= 2 &&
  Math.random() < BONUS_FOOD_SPAWN_CHANCE;

export const isBonusFoodExpired = (bonusFood: BonusFood, tickCount: number): boolean =>
  tickCount - bonusFood.spawnTick > bonusFood.lifetime;

export const shrinkSnake = (snake: Position[]): Position[] => {
  const removeCount = Math.min(BONUS_FOOD_SHRINK_AMOUNT, snake.length - 1);
  if (removeCount <= 0) return snake;
  return snake.slice(0, snake.length - removeCount);
};
