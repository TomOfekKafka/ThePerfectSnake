import { Position } from './types';

const TRIPLE_GROWTH_MIN = 2;

export const tripleGrowth = (currentLength: number): number =>
  Math.max(TRIPLE_GROWTH_MIN, currentLength * 2);

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
