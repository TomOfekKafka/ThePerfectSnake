/**
 * Pure game logic functions - no React, no side effects
 * Easy to test, easy to reason about
 */

import { Position, Direction, GameState, OPPOSITE_DIRECTIONS, DIRECTION_DELTAS, PowerUp, PowerUpType, ActivePowerUp, RealmPortal, FoodFleeState } from './types';
import { GRID_SIZE, POINTS_PER_FOOD, POWERUP_SPAWN_CHANCE, POWERUP_DESPAWN_TICKS, POWERUP_DURATIONS, POWERUP_TYPES, SCORE_MULTIPLIER_VALUE, BONUS_FOOD_SCORE, FLAG_FOOD_MULTIPLIER, OBSTACLE_MIN_FOOD_EATEN, OBSTACLE_SPAWN_INTERVAL, INITIAL_SHIELDS, MAX_SHIELDS, SHIELD_EARN_INTERVAL, SHIELD_INVULN_TICKS, FOOD_FLEE_RANGE, FOOD_FLEE_INTERVAL_BASE, FOOD_FLEE_INTERVAL_MIN } from './constants';
import { tickPhantom } from './phantomSnake';
import { shouldSpawnBonusFood, generateBonusFood, isBonusFoodExpired, shrinkSnake } from './bonusFood';
import { shouldSpawnFlagFood, generateFlagFood, isFlagFoodExpired } from './flagFood';
import { shouldSpawnCash, generateCashItem, expireCashItems, collectCash } from './cashItems';
import { shouldSpawnFakeFood, generateFakeFood, expireFakeFoods, collectFakeFood, shrinkFromFake } from './fakeFood';
import { tickPolice, POLICE_PENALTY } from './policeChase';
import { FAKE_FOOD_PENALTY } from './constants';
import { shouldSpawnObstacles, spawnObstacles, collidesWithObstacle } from './obstacles';
import { tripleGrowth, tickGrowPending } from './growthBurst';
import { shouldSpawnRealmPortal, generateRealmPortal, isRealmPortalExpired, checkRealmPortalEntry } from './realmPortal';
import { shouldSpawnLegal, generateLegalEntity, expireLegalEntities, moveLegalEntities, collectLegalEntities, LEGAL_SCORE_BONUS } from './legalEntities';

import { tickFoodMagnet } from './foodMagnet';

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
  const delta = DIRECTION_DELTAS[direction];
  return { x: head.x + delta.dx, y: head.y + delta.dy };
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

  const isGhostMode = hasPowerUp(state.activePowerUps, 'GHOST_MODE');

  const shieldCooldownActive = (tickCount - state.shieldHitTick) < SHIELD_INVULN_TICKS;

  if (immortal || isGhostMode) {
    newHead = wrapPosition(newHead);
  } else if (shieldCooldownActive) {
    newHead = wrapPosition(newHead);
  } else {
    const isInvincible = hasPowerUp(state.activePowerUps, 'INVINCIBILITY');
    const hitWall = !isInBounds(newHead);

    const willEat = positionsEqual(newHead, state.food);
    const bodyForCollision = willEat
      ? state.snake
      : state.snake.slice(0, -1);
    const hitSelf = collidesWithSnake(newHead, bodyForCollision);

    const hitObstacle = collidesWithObstacle(newHead, state.obstacles);

    const wouldDie = hitWall || (hitSelf && !isInvincible) || (hitObstacle && !isInvincible);

    if (wouldDie && state.shields > 0) {
      const safeHead = wrapPosition(newHead);
      return {
        ...state,
        snake: [safeHead, ...state.snake.slice(0, -1)],
        shields: state.shields - 1,
        shieldHitTick: tickCount,
        tickCount,
        direction,
      };
    }

    if (wouldDie) {
      const deathReason = hitWall ? 'wall' as const : hitObstacle ? 'obstacle' as const : 'self' as const;
      return { ...state, gameOver: true, tickCount, deathReason };
    }
  }

  const newSnake = [newHead, ...state.snake];
  const ateFood = positionsEqual(newHead, state.food);

  let newPowerUp = state.powerUp;
  let newActivePowerUps = updateActivePowerUps(state.activePowerUps, tickCount);

  let shockwaveTriggered = false;
  if (state.powerUp && positionsEqual(newHead, state.powerUp.position)) {
    if (state.powerUp.type === 'SHOCKWAVE') {
      shockwaveTriggered = true;
    }
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

  const earnedShield = ateFood && foodEatenCount > 0 && foodEatenCount % SHIELD_EARN_INTERVAL === 0;
  const newShields = Math.min(MAX_SHIELDS, state.shields + (earnedShield ? 1 : 0));

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

  let cashItems = expireCashItems(state.cashItems, tickCount);
  const cashResult = collectCash(cashItems, newHead);
  cashItems = cashResult.remaining;
  const cashGain = cashResult.collected.reduce((sum, c) => sum + c.value, 0);

  if (shouldSpawnCash(cashItems, foodEatenCount)) {
    cashItems = [...cashItems, generateCashItem(newSnake, state.food, cashItems, tickCount, newPowerUp?.position)];
  }

  let fakeFoods = expireFakeFoods(state.fakeFoods, tickCount);
  const fakeResult = collectFakeFood(fakeFoods, newHead);
  fakeFoods = fakeResult.remaining;
  const ateFakeFood = fakeResult.eaten !== null;
  const fakePenalty = ateFakeFood ? FAKE_FOOD_PENALTY : 0;

  if (shouldSpawnFakeFood(fakeFoods, foodEatenCount)) {
    fakeFoods = [...fakeFoods, generateFakeFood(newSnake, state.food, fakeFoods, tickCount, newPowerUp?.position)];
  }

  let legalEntities = moveLegalEntities(expireLegalEntities(state.legalEntities, tickCount));
  const legalResult = collectLegalEntities(legalEntities, newHead);
  legalEntities = legalResult.remaining;
  const legalGain = legalResult.collected.length * LEGAL_SCORE_BONUS;

  if (shouldSpawnLegal(legalEntities, foodEatenCount)) {
    legalEntities = [...legalEntities, generateLegalEntity(newSnake, state.food, legalEntities, tickCount, newPowerUp?.position)];
  }

  if (ateFood) {
    const growth = tripleGrowth(state.snake.length);
    let resultSnake = newSnake;
    if (ateBonusFood) {
      resultSnake = shrinkSnake(resultSnake);
    }
    if (ateFakeFood) {
      resultSnake = shrinkFromFake(resultSnake);
    }
    const newFood = generateFood(resultSnake, newPowerUp?.position);
    const isFrozen = hasPowerUp(newActivePowerUps, 'FREEZE_TIME');
    const phantomResult = isFrozen
      ? { phantom: state.phantom, foodStolen: false }
      : tickPhantom(state.phantom, newFood, resultSnake, foodEatenCount, false);
    let spawnedFlagFood = newFlagFood;
    if (!spawnedFlagFood && shouldSpawnFlagFood(foodEatenCount, spawnedFlagFood)) {
      spawnedFlagFood = generateFlagFood(resultSnake, newFood, tickCount, newPowerUp?.position);
    }
    const isInvincibleNow = hasPowerUp(newActivePowerUps, 'INVINCIBILITY') || immortal;
    const policeResult = isFrozen
      ? { police: state.police, caughtPlayer: false }
      : tickPolice(state.police, resultSnake, foodEatenCount, false, isInvincibleNow);
    const policePenalty = policeResult.caughtPlayer ? POLICE_PENALTY : 0;

    let newObstacles = shockwaveTriggered ? [] : state.obstacles;
    let newLastObstacleSpawnFood = shockwaveTriggered ? foodEatenCount : state.lastObstacleSpawnFood;
    if (!shockwaveTriggered && shouldSpawnObstacles(newObstacles, foodEatenCount, newLastObstacleSpawnFood)) {
      newObstacles = spawnObstacles(newObstacles, resultSnake, newFood, tickCount, newPowerUp?.position);
      newLastObstacleSpawnFood = foodEatenCount;
    }

    const shockwavePhantom = shockwaveTriggered
      ? { ...phantomResult.phantom, active: false, segments: [], spawnCooldown: 15 }
      : phantomResult.phantom;
    const shockwavePolice = shockwaveTriggered
      ? { ...policeResult.police, active: false, segments: [], spawnCooldown: 15 }
      : policeResult.police;

    let realmPortal = state.realmPortal;
    let currentRealm = state.currentRealm;
    let lastRealmTransitionFood = state.lastRealmTransitionFood;

    if (realmPortal && isRealmPortalExpired(realmPortal, tickCount)) {
      realmPortal = null;
    }
    if (realmPortal && checkRealmPortalEntry(newHead, realmPortal)) {
      currentRealm = realmPortal.targetRealm;
      lastRealmTransitionFood = foodEatenCount;
      realmPortal = null;
    }
    if (!realmPortal && shouldSpawnRealmPortal(null, foodEatenCount, lastRealmTransitionFood)) {
      realmPortal = generateRealmPortal(resultSnake, newFood, tickCount, currentRealm, newPowerUp?.position);
    }

    return {
      ...state,
      snake: resultSnake,
      food: newFood,
      score: Math.max(0, state.score + scoreGain + bonusScoreGain + flagScoreGain + cashGain + legalGain - fakePenalty - policePenalty),
      foodEaten: foodEatenCount,
      direction,
      powerUp: newPowerUp,
      activePowerUps: newActivePowerUps,
      tickCount,
      portalPair: null,
      lastPortalDespawn: 0,
      wormhole: null,
      lastWormholeDespawn: 0,
      phantom: shockwavePhantom,
      bonusFood: newBonusFood,
      flagFood: spawnedFlagFood,
      cashItems,
      totalCash: state.totalCash + cashGain,
      fakeFoods: shockwaveTriggered ? [] : fakeFoods,
      police: shockwavePolice,
      obstacles: newObstacles,
      lastObstacleSpawnFood: newLastObstacleSpawnFood,
      legalEntities: shockwaveTriggered ? [] : legalEntities,
      growPending: growth - 1,
      shields: newShields,
      shieldHitTick: state.shieldHitTick,
      currentRealm,
      realmPortal,
      lastRealmTransitionFood,
      foodFlee: { lastMoveTick: tickCount, panicLevel: 0 },
    };
  }

  const growResult = tickGrowPending(newSnake, state.growPending);
  const afterGrowSnake = growResult.snake;

  let resultSnake = afterGrowSnake;
  if (ateBonusFood) {
    resultSnake = shrinkSnake(resultSnake);
  }
  if (ateFakeFood) {
    resultSnake = shrinkFromFake(resultSnake);
  }

  if (!newBonusFood && shouldSpawnBonusFood(newBonusFood, resultSnake.length, foodEatenCount)) {
    newBonusFood = generateBonusFood(resultSnake, state.food, tickCount, newPowerUp?.position);
  }

  const isFrozen = hasPowerUp(newActivePowerUps, 'FREEZE_TIME');
  const phantomResult = isFrozen
    ? { phantom: state.phantom, foodStolen: false }
    : tickPhantom(state.phantom, state.food, resultSnake, foodEatenCount, false);
  const phantomFood = phantomResult.foodStolen
    ? generateFood(resultSnake, newPowerUp?.position)
    : state.food;

  const isMagnetActive = hasPowerUp(newActivePowerUps, 'MAGNET');

  const obstaclePositions = (shockwaveTriggered ? [] : state.obstacles).map(o => o.position);
  const fleeResult = { food: phantomFood, foodFlee: state.foodFlee, fled: false };

  let finalFood = fleeResult.food;
  let finalFoodFlee = fleeResult.foodFlee;
  let magnetBonusFood = newBonusFood;
  let magnetFlagFood = newFlagFood;
  let magnetCashItems = shockwaveTriggered ? [] as typeof cashItems : cashItems;

  if (isMagnetActive) {
    const magnetState = {
      ...state,
      food: finalFood,
      bonusFood: magnetBonusFood,
      flagFood: magnetFlagFood,
      cashItems: magnetCashItems,
      snake: resultSnake,
      obstacles: shockwaveTriggered ? [] : state.obstacles,
    };
    const magnetResult = tickFoodMagnet(magnetState, tickCount);
    finalFood = magnetResult.food;
    magnetBonusFood = magnetResult.bonusFood;
    magnetFlagFood = magnetResult.flagFood;
    magnetCashItems = magnetResult.cashItems;
    finalFoodFlee = { lastMoveTick: tickCount, panicLevel: 0 };
  }

  const isInvincibleNow = hasPowerUp(newActivePowerUps, 'INVINCIBILITY') || immortal;
  const policeResult = isFrozen
    ? { police: state.police, caughtPlayer: false }
    : tickPolice(state.police, resultSnake, foodEatenCount, false, isInvincibleNow);
  const policePenalty = policeResult.caughtPlayer ? POLICE_PENALTY : 0;

  let finalObstacles = shockwaveTriggered ? [] : state.obstacles;
  let finalLastObstacleSpawnFood = shockwaveTriggered ? state.foodEaten : state.lastObstacleSpawnFood;

  const shockwavePhantom = shockwaveTriggered
    ? { ...phantomResult.phantom, active: false, segments: [], spawnCooldown: 15 }
    : phantomResult.phantom;
  const shockwavePolice = shockwaveTriggered
    ? { ...policeResult.police, active: false, segments: [], spawnCooldown: 15 }
    : policeResult.police;

  let realmPortal = state.realmPortal;
  let currentRealm = state.currentRealm;
  let lastRealmTransitionFood = state.lastRealmTransitionFood;

  if (realmPortal && isRealmPortalExpired(realmPortal, tickCount)) {
    realmPortal = null;
  }
  if (realmPortal && checkRealmPortalEntry(newHead, realmPortal)) {
    currentRealm = realmPortal.targetRealm;
    lastRealmTransitionFood = foodEatenCount;
    realmPortal = null;
  }
  if (!realmPortal && shouldSpawnRealmPortal(null, foodEatenCount, lastRealmTransitionFood)) {
    realmPortal = generateRealmPortal(resultSnake, finalFood, tickCount, currentRealm, newPowerUp?.position);
  }

  return {
    ...state,
    snake: resultSnake,
    food: finalFood,
    foodFlee: finalFoodFlee,
    score: Math.max(0, state.score + bonusScoreGain + flagScoreGain + cashGain + legalGain - fakePenalty - policePenalty),
    direction,
    powerUp: newPowerUp,
    activePowerUps: newActivePowerUps,
    tickCount,
    portalPair: null,
    lastPortalDespawn: 0,
    wormhole: null,
    lastWormholeDespawn: 0,
    phantom: shockwavePhantom,
    bonusFood: magnetBonusFood,
    flagFood: magnetFlagFood,
    cashItems: shockwaveTriggered ? [] : magnetCashItems,
    totalCash: state.totalCash + cashGain,
    fakeFoods: shockwaveTriggered ? [] : fakeFoods,
    police: shockwavePolice,
    obstacles: finalObstacles,
    lastObstacleSpawnFood: finalLastObstacleSpawnFood,
    legalEntities: shockwaveTriggered ? [] : legalEntities,
    growPending: growResult.growPending,
    shields: newShields,
    shieldHitTick: state.shieldHitTick,
    currentRealm,
    realmPortal,
    lastRealmTransitionFood,
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
  legalEntities: [],
  growPending: 0,
  immortalActive: false,
  immortalProgress: 0,
  immortalCharges: 1,
  immortalRechargeProgress: 0,
  shields: INITIAL_SHIELDS,
  shieldHitTick: -100,
  deathReason: null,
  currentRealm: 0,
  realmPortal: null,
  lastRealmTransitionFood: 0,
  rival: {
    segments: [],
    direction: 'LEFT' as const,
    active: false,
    growPending: 0,
    moveTimer: 0,
    spawnCooldown: 0,
    foodEaten: 0,
  },
  foodFlee: {
    lastMoveTick: 0,
    panicLevel: 0,
  },
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
    bonusFood: null,
    flagFood: null,
    cashItems: [],
    fakeFoods: [],
    obstacles: [],
    lastObstacleSpawnFood: 0,
    growPending: 0,
    immortalActive: false,
    immortalProgress: 0,
    deathReason: null,
    realmPortal: null,
    foodFlee: { lastMoveTick: 0, panicLevel: 0 },
  };
};
