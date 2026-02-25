/**
 * Pure game logic functions - no React, no side effects
 * Easy to test, easy to reason about
 */

import { Position, Direction, GameState, OPPOSITE_DIRECTIONS, PowerUp, PowerUpType, ActivePowerUp } from './types';
import { GRID_SIZE, POINTS_PER_FOOD, POWERUP_SPAWN_CHANCE, POWERUP_DESPAWN_TICKS, POWERUP_DURATIONS, POWERUP_TYPES, SCORE_MULTIPLIER_VALUE, BONUS_FOOD_SCORE, FLAG_FOOD_MULTIPLIER } from './constants';
import { tickPhantom } from './phantomSnake';
import { shouldSpawnBonusFood, generateBonusFood, isBonusFoodExpired, shrinkSnake } from './bonusFood';
import { shouldSpawnFlagFood, generateFlagFood, isFlagFoodExpired } from './flagFood';
import { tickRival, playerCollidesWithRival } from './rivalSnake';

/** Check if two positions are equal */
export const positionsEqual = (a: Position, b: Position): boolean =>
  a.x === b.x && a.y === b.y;

/** Check if position is within grid bounds */
export const isInBounds = (pos: Position): boolean =>
  pos.x >= 0 && pos.x < GRID_SIZE && pos.y >= 0 && pos.y < GRID_SIZE;

/** Check if position collides with snake body */
export const collidesWithSnake = (pos: Position, snake: Position[]): boolean =>
  snake.some(segment => positionsEqual(pos, segment));

/** Check if move would cause collision (wall or self) */
export const wouldCollide = (head: Position, snake: Position[]): boolean =>
  !isInBounds(head) || collidesWithSnake(head, snake);

/** Get next head position based on direction */
export const getNextHead = (head: Position, direction: Direction): Position => {
  const moves: Record<Direction, Position> = {
    UP: { x: head.x, y: head.y - 1 },
    DOWN: { x: head.x, y: head.y + 1 },
    LEFT: { x: head.x - 1, y: head.y },
    RIGHT: { x: head.x + 1, y: head.y }
  };
  return moves[direction];
};

/** Check if direction change is valid (not 180-degree turn) */
export const isValidDirectionChange = (
  newDirection: Direction,
  currentDirection: Direction
): boolean => OPPOSITE_DIRECTIONS[newDirection] !== currentDirection;

/** Generate random food position not on snake */
export const generateFood = (snake: Position[], excludePos?: Position): Position => {
  let food: Position;
  do {
    food = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    };
  } while (collidesWithSnake(food, snake) || (excludePos && positionsEqual(food, excludePos)));
  return food;
};

/** Generate a power-up at a random position */
export const generatePowerUp = (snake: Position[], food: Position, tickCount: number): PowerUp => {
  const type = POWERUP_TYPES[Math.floor(Math.random() * POWERUP_TYPES.length)];
  let pos: Position;
  do {
    pos = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    };
  } while (collidesWithSnake(pos, snake) || positionsEqual(pos, food));

  return {
    position: pos,
    type,
    spawnTime: tickCount,
    duration: POWERUP_DURATIONS[type],
  };
};

/** Check if a power-up type is active */
export const hasPowerUp = (activePowerUps: ActivePowerUp[], type: PowerUpType): boolean => {
  return activePowerUps.some(p => p.type === type);
};

/** Update active power-ups, removing expired ones */
export const updateActivePowerUps = (activePowerUps: ActivePowerUp[], tickCount: number): ActivePowerUp[] => {
  return activePowerUps.filter(p => p.endTime > tickCount);
};

/** Activate a power-up */
export const activatePowerUp = (activePowerUps: ActivePowerUp[], type: PowerUpType, tickCount: number): ActivePowerUp[] => {
  const existing = activePowerUps.find(p => p.type === type);
  const duration = POWERUP_DURATIONS[type];

  if (existing) {
    return activePowerUps.map(p =>
      p.type === type ? { ...p, endTime: tickCount + duration } : p
    );
  }

  return [...activePowerUps, { type, endTime: tickCount + duration }];
};

/** Wrap position around the grid edges */
export const wrapPosition = (pos: Position): Position => ({
  x: ((pos.x % GRID_SIZE) + GRID_SIZE) % GRID_SIZE,
  y: ((pos.y % GRID_SIZE) + GRID_SIZE) % GRID_SIZE,
});

/** Calculate next game state after one tick */
export const tick = (state: GameState, direction: Direction, immortal = false): GameState => {
  if (state.gameOver || !state.gameStarted) {
    return state;
  }

  const tickCount = state.tickCount + 1;
  const head = state.snake[0];
  let newHead = getNextHead(head, direction);

  if (immortal) {
    newHead = wrapPosition(newHead);
  } else {
    const isInvincible = hasPowerUp(state.activePowerUps, 'INVINCIBILITY');
    const hitWall = !isInBounds(newHead);
    const hitSelf = collidesWithSnake(newHead, state.snake);
    const hitRival = playerCollidesWithRival(newHead, state.rival.segments);

    if (hitWall || (hitSelf && !isInvincible) || (hitRival && !isInvincible)) {
      return { ...state, gameOver: true, tickCount };
    }
  }

  const newSnake = [newHead, ...state.snake];
  const ateFood = positionsEqual(newHead, state.food);

  let newPowerUp = state.powerUp;
  let newActivePowerUps = updateActivePowerUps(state.activePowerUps, tickCount);

  if (state.powerUp && positionsEqual(newHead, state.powerUp.position)) {
    newActivePowerUps = activatePowerUp(newActivePowerUps, state.powerUp.type, tickCount);
    newPowerUp = null;
  }

  if (newPowerUp && (tickCount - newPowerUp.spawnTime) > POWERUP_DESPAWN_TICKS) {
    newPowerUp = null;
  }

  if (!newPowerUp && Math.random() < POWERUP_SPAWN_CHANCE) {
    newPowerUp = generatePowerUp(newSnake, state.food, tickCount);
  }

  let newBonusFood = state.bonusFood;
  if (newBonusFood && isBonusFoodExpired(newBonusFood, tickCount)) {
    newBonusFood = null;
  }

  let newFlagFood = state.flagFood;
  if (newFlagFood && isFlagFoodExpired(newFlagFood, tickCount)) {
    newFlagFood = null;
  }

  const ateBonusFood = newBonusFood !== null && positionsEqual(newHead, newBonusFood.position);
  const ateFlagFood = newFlagFood !== null && positionsEqual(newHead, newFlagFood.position);

  const foodEatenCount = ateFood ? state.foodEaten + 1 : state.foodEaten;

  const hasMultiplier = hasPowerUp(newActivePowerUps, 'SCORE_MULTIPLIER');
  const scoreGain = ateFood ? (hasMultiplier ? POINTS_PER_FOOD * SCORE_MULTIPLIER_VALUE : POINTS_PER_FOOD) : 0;
  const bonusScoreGain = ateBonusFood ? BONUS_FOOD_SCORE : 0;
  const flagScoreGain = ateFlagFood ? POINTS_PER_FOOD * FLAG_FOOD_MULTIPLIER : 0;

  if (ateBonusFood) {
    newBonusFood = null;
  }
  if (ateFlagFood) {
    newFlagFood = null;
  }

  if (ateFood) {
    let resultSnake = newSnake;
    if (ateBonusFood) {
      resultSnake = shrinkSnake(resultSnake);
    }
    const newFood = generateFood(resultSnake, newPowerUp?.position);
    const phantomResult = tickPhantom(state.phantom, newFood, resultSnake, foodEatenCount, false);
    let spawnedFlagFood = newFlagFood;
    if (!spawnedFlagFood && shouldSpawnFlagFood(foodEatenCount, spawnedFlagFood)) {
      spawnedFlagFood = generateFlagFood(resultSnake, newFood, tickCount, newPowerUp?.position);
    }
    const rivalResult = tickRival(state.rival, newFood, resultSnake, foodEatenCount, false);
    const rivalFood = rivalResult.foodStolen
      ? generateFood(resultSnake, newPowerUp?.position)
      : newFood;
    return {
      ...state,
      snake: resultSnake,
      food: rivalFood,
      score: state.score + scoreGain + bonusScoreGain + flagScoreGain,
      foodEaten: foodEatenCount,
      direction,
      powerUp: newPowerUp,
      activePowerUps: newActivePowerUps,
      tickCount,
      portalPair: null,
      lastPortalDespawn: 0,
      wormhole: null,
      lastWormholeDespawn: 0,
      phantom: phantomResult.phantom,
      rival: rivalResult.rival,
      bonusFood: newBonusFood,
      flagFood: spawnedFlagFood,
    };
  }

  newSnake.pop();

  let resultSnake = newSnake;
  if (ateBonusFood) {
    resultSnake = shrinkSnake(resultSnake);
  }

  if (!newBonusFood && shouldSpawnBonusFood(newBonusFood, resultSnake.length, foodEatenCount)) {
    newBonusFood = generateBonusFood(resultSnake, state.food, tickCount, newPowerUp?.position);
  }

  const phantomResult = tickPhantom(state.phantom, state.food, resultSnake, foodEatenCount, false);
  const phantomFood = phantomResult.foodStolen
    ? generateFood(resultSnake, newPowerUp?.position)
    : state.food;

  const rivalResult = tickRival(state.rival, phantomFood, resultSnake, foodEatenCount, false);
  const finalFood = rivalResult.foodStolen
    ? generateFood(resultSnake, newPowerUp?.position)
    : phantomFood;

  return {
    ...state,
    snake: resultSnake,
    food: finalFood,
    score: state.score + bonusScoreGain + flagScoreGain,
    direction,
    powerUp: newPowerUp,
    activePowerUps: newActivePowerUps,
    tickCount,
    portalPair: null,
    lastPortalDespawn: 0,
    wormhole: null,
    lastWormholeDespawn: 0,
    phantom: phantomResult.phantom,
    rival: rivalResult.rival,
    bonusFood: newBonusFood,
    flagFood: newFlagFood,
  };
};

/** Create a fresh game state for starting/restarting */
export const createNewGame = (initialSnake: Position[]): GameState => ({
  snake: [...initialSnake],
  food: generateFood(initialSnake),
  direction: 'RIGHT',
  gameOver: false,
  gameStarted: true,
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
  rival: {
    segments: [],
    direction: 'LEFT',
    active: false,
    growPending: 0,
    moveTimer: 0,
    spawnCooldown: 0,
    foodEaten: 0,
  },
  bonusFood: null,
  flagFood: null,
  immortalActive: false,
  immortalProgress: 0,
  immortalCharges: 1,
  immortalRechargeProgress: 0,
});

/** Revive the snake after a correct trivia answer. Trims half the tail and spawns safe. */
export const reviveSnake = (state: GameState): GameState => {
  const snake = state.snake;
  const keepLength = Math.max(1, Math.floor(snake.length / 2));
  const revived = snake.slice(0, keepLength);
  return {
    ...state,
    snake: revived,
    food: generateFood(revived),
    gameOver: false,
    direction: state.direction,
    powerUp: null,
    activePowerUps: [],
    portalPair: null,
    wormhole: null,
    phantom: {
      ...state.phantom,
      segments: [],
      active: false,
      spawnCooldown: 0,
    },
    rival: {
      ...state.rival,
      segments: [],
      active: false,
      spawnCooldown: 10,
    },
    bonusFood: null,
    flagFood: null,
    immortalActive: false,
    immortalProgress: 0,
  };
};
