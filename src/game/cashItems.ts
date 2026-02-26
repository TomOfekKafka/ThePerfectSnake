import { Position, CashItem } from './types';
import { GRID_SIZE, CASH_SPAWN_CHANCE, CASH_MAX_ON_BOARD, CASH_LIFETIME, CASH_BASE_VALUE, CASH_HIGH_VALUE, CASH_HIGH_VALUE_CHANCE } from './constants';
import { collidesWithSnake, positionsEqual } from './logic';

const generateCashPosition = (
  snake: Position[],
  food: Position,
  existing: CashItem[],
  powerUpPos?: Position
): Position => {
  const occupied = existing.map(c => c.position);
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

export const shouldSpawnCash = (
  cashItems: CashItem[],
  foodEaten: number
): boolean =>
  foodEaten >= 1 &&
  cashItems.length < CASH_MAX_ON_BOARD &&
  Math.random() < CASH_SPAWN_CHANCE;

export const generateCashItem = (
  snake: Position[],
  food: Position,
  existing: CashItem[],
  tickCount: number,
  powerUpPos?: Position
): CashItem => {
  const position = generateCashPosition(snake, food, existing, powerUpPos);
  const isHighValue = Math.random() < CASH_HIGH_VALUE_CHANCE;
  return {
    position,
    spawnTick: tickCount,
    lifetime: CASH_LIFETIME,
    value: isHighValue ? CASH_HIGH_VALUE : CASH_BASE_VALUE,
  };
};

export const expireCashItems = (items: CashItem[], tickCount: number): CashItem[] =>
  items.filter(c => tickCount - c.spawnTick <= c.lifetime);

export const collectCash = (
  items: CashItem[],
  head: Position
): { remaining: CashItem[]; collected: CashItem[] } => {
  const collected: CashItem[] = [];
  const remaining: CashItem[] = [];
  for (const item of items) {
    if (positionsEqual(head, item.position)) {
      collected.push(item);
    } else {
      remaining.push(item);
    }
  }
  return { remaining, collected };
};
