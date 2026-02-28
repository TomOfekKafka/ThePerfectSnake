import { Position } from './types';

export const GROWTH_MIN = 1;
export const GROWTH_MAX = 5;

const GROWTH_WEIGHTS = [
  { value: 1, weight: 30 },
  { value: 2, weight: 30 },
  { value: 3, weight: 20 },
  { value: 4, weight: 12 },
  { value: 5, weight: 8 },
];

const TOTAL_WEIGHT = GROWTH_WEIGHTS.reduce((sum, w) => sum + w.weight, 0);

export const randomGrowth = (): number => {
  let roll = Math.random() * TOTAL_WEIGHT;
  for (const { value, weight } of GROWTH_WEIGHTS) {
    roll -= weight;
    if (roll <= 0) return value;
  }
  return 1;
};

export const tickGrowPending = (
  snake: Position[],
  growPending: number
): { snake: Position[]; growPending: number } => {
  if (growPending <= 0) {
    const trimmed = [...snake];
    trimmed.pop();
    return { snake: trimmed, growPending: 0 };
  }
  return { snake, growPending: growPending - 1 };
};
