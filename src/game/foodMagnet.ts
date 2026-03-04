import { Position, GameState } from './types';
import { GRID_SIZE } from './constants';
import { collidesWithSnake, isInBounds } from './logic';

const MAGNET_PULL_INTERVAL = 2;

const moveToward = (
  from: Position,
  target: Position,
  snake: Position[],
  obstacles: Position[]
): Position => {
  const dx = target.x - from.x;
  const dy = target.y - from.y;

  if (dx === 0 && dy === 0) return from;

  const candidates: { pos: Position; dist: number }[] = [];

  const offsets = [
    { x: Math.sign(dx), y: 0 },
    { x: 0, y: Math.sign(dy) },
    { x: Math.sign(dx), y: Math.sign(dy) },
  ].filter(o => o.x !== 0 || o.y !== 0);

  for (const off of offsets) {
    const pos = { x: from.x + off.x, y: from.y + off.y };
    if (!isInBounds(pos)) continue;
    if (collidesWithSnake(pos, snake)) continue;
    if (obstacles.some(o => o.x === pos.x && o.y === pos.y)) continue;
    const dist = Math.abs(pos.x - target.x) + Math.abs(pos.y - target.y);
    candidates.push({ pos, dist });
  }

  if (candidates.length === 0) return from;
  candidates.sort((a, b) => a.dist - b.dist);
  return candidates[0].pos;
};

export interface FoodMagnetResult {
  food: Position;
  bonusFood: GameState['bonusFood'];
  flagFood: GameState['flagFood'];
  cashItems: GameState['cashItems'];
}

export const tickFoodMagnet = (
  state: GameState,
  tickCount: number
): FoodMagnetResult => {
  const head = state.snake[0];
  const obstacles = state.obstacles.map(o => o.position);

  const shouldPull = tickCount % MAGNET_PULL_INTERVAL === 0;

  const food = shouldPull
    ? moveToward(state.food, head, state.snake, obstacles)
    : state.food;

  const bonusFood = state.bonusFood && shouldPull
    ? { ...state.bonusFood, position: moveToward(state.bonusFood.position, head, state.snake, obstacles) }
    : state.bonusFood;

  const flagFood = state.flagFood && shouldPull
    ? { ...state.flagFood, position: moveToward(state.flagFood.position, head, state.snake, obstacles) }
    : state.flagFood;

  const cashItems = shouldPull
    ? state.cashItems.map(c => ({
        ...c,
        position: moveToward(c.position, head, state.snake, obstacles),
      }))
    : state.cashItems;

  return { food, bonusFood, flagFood, cashItems };
};
