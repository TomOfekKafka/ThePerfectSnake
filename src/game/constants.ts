/**
 * Game constants - single source of truth for game configuration
 */

import { Position, GameState, PowerUpType } from './types';

export const GRID_SIZE = 20;
export const CELL_SIZE = 20;
export const GAME_SPEED_MS = 150;
export const MAX_DIRECTION_QUEUE = 3;
export const POINTS_PER_FOOD = 10;

export const INITIAL_SNAKE: Position[] = [{ x: 10, y: 10 }];
export const INITIAL_FOOD: Position = { x: 15, y: 15 };
export const INITIAL_DIRECTION = 'RIGHT' as const;

// Power-up configuration
export const POWERUP_SPAWN_CHANCE = 0.03;
export const POWERUP_DESPAWN_TICKS = 100;
export const POWERUP_DURATIONS: Record<PowerUpType, number> = {
  SPEED_BOOST: 50,
  INVINCIBILITY: 40,
  SCORE_MULTIPLIER: 60,
  MAGNET: 45,
};
export const POWERUP_TYPES: PowerUpType[] = ['SPEED_BOOST', 'INVINCIBILITY', 'SCORE_MULTIPLIER', 'MAGNET'];
export const SCORE_MULTIPLIER_VALUE = 3;
export const SPEED_BOOST_MS = 80;

export const createInitialState = (): GameState => ({
  snake: [...INITIAL_SNAKE],
  food: { ...INITIAL_FOOD },
  direction: INITIAL_DIRECTION,
  gameOver: false,
  gameStarted: false,
  score: 0,
  powerUp: null,
  activePowerUps: [],
  tickCount: 0,
});
