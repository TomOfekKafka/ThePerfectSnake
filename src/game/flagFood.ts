import { Position, FlagFood } from './types';
import { GRID_SIZE, FLAG_FOOD_LIFETIME, FLAG_FOOD_INTERVAL } from './constants';
import { collidesWithSnake, positionsEqual } from './logic';

export const shouldSpawnFlagFood = (
  foodEaten: number,
  flagFood: FlagFood | null
): boolean =>
  flagFood === null &&
  foodEaten > 0 &&
  foodEaten % FLAG_FOOD_INTERVAL === 0;

export const generateFlagFood = (
  snake: Position[],
  food: Position,
  tickCount: number,
  excludePos?: Position
): FlagFood => {
  let pos: Position;
  do {
    pos = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (
    collidesWithSnake(pos, snake) ||
    positionsEqual(pos, food) ||
    (excludePos !== undefined && positionsEqual(pos, excludePos))
  );
  return { position: pos, spawnTick: tickCount, lifetime: FLAG_FOOD_LIFETIME };
};

export const isFlagFoodExpired = (flagFood: FlagFood, tickCount: number): boolean =>
  tickCount - flagFood.spawnTick > flagFood.lifetime;
