/**
 * Game constants - single source of truth for game configuration
 */

import { Position, GameState } from './types';

export const GRID_SIZE = 20;
export const CELL_SIZE = 20;
export const GAME_SPEED_MS = 150;
export const MAX_DIRECTION_QUEUE = 3;
export const POINTS_PER_FOOD = 10;

export const INITIAL_SNAKE: Position[] = [{ x: 10, y: 10 }];
export const INITIAL_FOOD: Position = { x: 15, y: 15 };
export const INITIAL_DIRECTION = 'RIGHT' as const;

export const createInitialState = (): GameState => ({
  snake: [...INITIAL_SNAKE],
  food: { ...INITIAL_FOOD },
  direction: INITIAL_DIRECTION,
  gameOver: false,
  gameStarted: false,
  score: 0
});
