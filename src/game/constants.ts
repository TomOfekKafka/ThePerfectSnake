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
  GHOST_MODE: 55,
  FREEZE_TIME: 45,
  SHOCKWAVE: 1,
};
export const POWERUP_TYPES: PowerUpType[] = ['SPEED_BOOST', 'INVINCIBILITY', 'SCORE_MULTIPLIER', 'MAGNET', 'GHOST_MODE', 'FREEZE_TIME', 'SHOCKWAVE'];
export const SCORE_MULTIPLIER_VALUE = 3;
export const SPEED_BOOST_MS = 80;

export const BONUS_FOOD_SPAWN_CHANCE = 0.025;
export const BONUS_FOOD_LIFETIME = 80;
export const BONUS_FOOD_SHRINK_AMOUNT = 3;
export const BONUS_FOOD_SCORE = 15;
export const BONUS_FOOD_MIN_SNAKE_LENGTH = 4;

export const FLAG_FOOD_INTERVAL = 5;
export const FLAG_FOOD_LIFETIME = 100;
export const FLAG_FOOD_MULTIPLIER = 5;

export const CASH_SPAWN_CHANCE = 0.12;
export const CASH_MAX_ON_BOARD = 8;
export const CASH_LIFETIME = 60;
export const CASH_BASE_VALUE = 25;
export const CASH_HIGH_VALUE = 100;
export const CASH_HIGH_VALUE_CHANCE = 0.15;

export const FAKE_FOOD_SPAWN_CHANCE = 0.04;
export const FAKE_FOOD_MAX_ON_BOARD = 3;
export const FAKE_FOOD_LIFETIME = 90;
export const FAKE_FOOD_PENALTY = 20;
export const FAKE_FOOD_SHRINK = 2;
export const FAKE_FOOD_MIN_FOOD_EATEN = 3;

export const OBSTACLE_SPAWN_INTERVAL = 3;
export const OBSTACLE_MAX_ON_BOARD = 12;
export const OBSTACLE_MIN_FOOD_EATEN = 2;
export const OBSTACLE_PATTERN_CHANCE = 0.4;

export const createInitialState = (): GameState => ({
  snake: [...INITIAL_SNAKE],
  food: { ...INITIAL_FOOD },
  direction: INITIAL_DIRECTION,
  gameOver: false,
  gameStarted: false,
  score: 0,
  foodEaten: 0,
  powerUp: null,
  activePowerUps: [],
  tickCount: 0,
  portalPair: null,
  lastPortalDespawn: 0,
  wormhole: null,
  lastWormholeDespawn: 0,
  phantom: {
    segments: [],
    direction: 'LEFT',
    active: false,
    stealCount: 0,
    moveTimer: 0,
    spawnCooldown: 0,
  },
  bonusFood: null,
  flagFood: null,
  cashItems: [],
  totalCash: 0,
  fakeFoods: [],
  police: {
    segments: [],
    direction: 'LEFT',
    active: false,
    moveTimer: 0,
    spawnCooldown: 0,
    caughtFlash: 0,
  },
  obstacles: [],
  lastObstacleSpawnFood: 0,
  growPending: 0,
  immortalActive: false,
  immortalProgress: 0,
  immortalCharges: 1,
  immortalRechargeProgress: 0,
  deathReason: null,
});
