/**
 * Pure game logic functions - no React, no side effects
 * Easy to test, easy to reason about
 */

import { Position, Direction, GameState, OPPOSITE_DIRECTIONS, PowerUp, PowerUpType, ActivePowerUp } from './types';
import { GRID_SIZE, POINTS_PER_FOOD, POWERUP_SPAWN_CHANCE, POWERUP_DESPAWN_TICKS, POWERUP_DURATIONS, POWERUP_TYPES, SCORE_MULTIPLIER_VALUE } from './constants';
import { checkTeleport, shouldSpawnPortals, shouldDespawnPortals, generatePortalPair, applyTeleportCooldown, decrementCooldown } from './portals';
import { generateWormhole, shouldSpawnWormhole, shouldDespawnWormhole, checkWormholeTeleport, WORMHOLE_BONUS_POINTS } from './wormhole';
import { tickPhantom } from './phantomSnake';

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

/** Calculate next game state after one tick */
export const tick = (state: GameState, direction: Direction): GameState => {
  if (state.gameOver || !state.gameStarted) {
    return state;
  }

  const tickCount = state.tickCount + 1;
  const head = state.snake[0];
  let newHead = getNextHead(head, direction);

  // Check collision - invincibility protects against self-collision only
  const isInvincible = hasPowerUp(state.activePowerUps, 'INVINCIBILITY');
  const hitWall = !isInBounds(newHead);
  const hitSelf = collidesWithSnake(newHead, state.snake);

  if (hitWall || (hitSelf && !isInvincible)) {
    return { ...state, gameOver: true, tickCount };
  }

  // Check portal teleportation
  let portalPair = state.portalPair;
  let lastPortalDespawn = state.lastPortalDespawn;
  let teleported = false;

  if (portalPair) {
    portalPair = decrementCooldown(portalPair);
    const result = checkTeleport(newHead, portalPair);
    if (result.teleported) {
      newHead = result.newHead;
      portalPair = applyTeleportCooldown(portalPair);
      teleported = true;
    }
  }

  // Check wormhole teleportation (optional - player chooses to enter)
  let wormhole = state.wormhole;
  let lastWormholeDespawn = state.lastWormholeDespawn;
  let wormholeBonus = 0;

  if (wormhole && !teleported) {
    const wormResult = checkWormholeTeleport(newHead, wormhole);
    if (wormResult.teleported) {
      newHead = wormResult.newHead;
      wormhole = { ...wormhole, used: true };
      wormholeBonus = WORMHOLE_BONUS_POINTS;
      teleported = true;
    }
  }

  const newSnake = [newHead, ...state.snake];
  const ateFood = positionsEqual(newHead, state.food);

  // Check power-up collection
  let newPowerUp = state.powerUp;
  let newActivePowerUps = updateActivePowerUps(state.activePowerUps, tickCount);

  if (state.powerUp && positionsEqual(newHead, state.powerUp.position)) {
    newActivePowerUps = activatePowerUp(newActivePowerUps, state.powerUp.type, tickCount);
    newPowerUp = null;
  }

  // Despawn power-up after time limit
  if (newPowerUp && (tickCount - newPowerUp.spawnTime) > POWERUP_DESPAWN_TICKS) {
    newPowerUp = null;
  }

  // Maybe spawn a new power-up
  if (!newPowerUp && Math.random() < POWERUP_SPAWN_CHANCE) {
    newPowerUp = generatePowerUp(newSnake, state.food, tickCount);
  }

  // Portal lifecycle
  if (portalPair && shouldDespawnPortals(portalPair, tickCount)) {
    portalPair = null;
    lastPortalDespawn = tickCount;
  }

  const foodEatenCount = ateFood ? state.foodEaten + 1 : state.foodEaten;

  if (shouldSpawnPortals(portalPair, foodEatenCount, tickCount, lastPortalDespawn)) {
    portalPair = generatePortalPair(newSnake, state.food, tickCount);
  }

  // Wormhole lifecycle
  if (wormhole && shouldDespawnWormhole(wormhole, tickCount)) {
    lastWormholeDespawn = tickCount;
    wormhole = null;
  }

  if (shouldSpawnWormhole(wormhole, foodEatenCount, tickCount, lastWormholeDespawn)) {
    wormhole = generateWormhole(newSnake, state.food, tickCount);
  }

  // Calculate score with multiplier
  const hasMultiplier = hasPowerUp(newActivePowerUps, 'SCORE_MULTIPLIER');
  const baseScore = ateFood ? (hasMultiplier ? POINTS_PER_FOOD * SCORE_MULTIPLIER_VALUE : POINTS_PER_FOOD) : 0;
  const scoreGain = baseScore + wormholeBonus;

  if (ateFood) {
    const newFood = generateFood(newSnake, newPowerUp?.position);
    const phantomResult = tickPhantom(state.phantom, newFood, newSnake, foodEatenCount, false);
    return {
      ...state,
      snake: newSnake,
      food: newFood,
      score: state.score + scoreGain,
      foodEaten: foodEatenCount,
      direction,
      powerUp: newPowerUp,
      activePowerUps: newActivePowerUps,
      tickCount,
      portalPair,
      lastPortalDespawn,
      wormhole,
      lastWormholeDespawn,
      phantom: phantomResult.phantom,
    };
  }

  newSnake.pop();

  const phantomResult = tickPhantom(state.phantom, state.food, newSnake, foodEatenCount, false);
  const finalFood = phantomResult.foodStolen
    ? generateFood(newSnake, newPowerUp?.position)
    : state.food;

  return {
    ...state,
    snake: newSnake,
    food: finalFood,
    score: state.score + wormholeBonus,
    direction,
    powerUp: newPowerUp,
    activePowerUps: newActivePowerUps,
    tickCount,
    portalPair,
    lastPortalDespawn,
    wormhole,
    lastWormholeDespawn,
    phantom: phantomResult.phantom,
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
  };
};
