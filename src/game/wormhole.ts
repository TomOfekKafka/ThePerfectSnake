import { Position, Wormhole } from './types';
import { GRID_SIZE } from './constants';
import { collidesWithSnake, positionsEqual } from './logic';

const WORMHOLE_MIN_DISTANCE = 8;
const WORMHOLE_LIFETIME = 150;
const WORMHOLE_SPAWN_FOOD_THRESHOLD = 2;
const WORMHOLE_SPAWN_CHANCE = 0.12;
const WORMHOLE_RESPAWN_DELAY = 30;
const WORMHOLE_BONUS_POINTS = 25;

export {
  WORMHOLE_LIFETIME,
  WORMHOLE_SPAWN_FOOD_THRESHOLD,
  WORMHOLE_SPAWN_CHANCE,
  WORMHOLE_RESPAWN_DELAY,
  WORMHOLE_BONUS_POINTS,
};

const manhattanDistance = (a: Position, b: Position): number =>
  Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

const generateWormholePosition = (
  occupied: Position[],
  food: Position
): Position => {
  let pos: Position;
  let attempts = 0;
  do {
    pos = {
      x: 1 + Math.floor(Math.random() * (GRID_SIZE - 2)),
      y: 1 + Math.floor(Math.random() * (GRID_SIZE - 2)),
    };
    attempts++;
    if (attempts > 200) break;
  } while (
    collidesWithSnake(pos, occupied) ||
    positionsEqual(pos, food)
  );
  return pos;
};

export const generateWormhole = (
  snake: Position[],
  food: Position,
  tickCount: number
): Wormhole => {
  const entry = generateWormholePosition(snake, food);
  let exit: Position;
  let attempts = 0;
  do {
    exit = generateWormholePosition([...snake, entry], food);
    attempts++;
    if (attempts > 200) break;
  } while (manhattanDistance(entry, exit) < WORMHOLE_MIN_DISTANCE);

  return {
    entry,
    exit,
    spawnTick: tickCount,
    lifetime: WORMHOLE_LIFETIME,
    used: false,
  };
};

export const shouldSpawnWormhole = (
  wormhole: Wormhole | null,
  foodEaten: number,
  tickCount: number,
  lastWormholeDespawn: number
): boolean => {
  if (wormhole) return false;
  if (foodEaten < WORMHOLE_SPAWN_FOOD_THRESHOLD) return false;
  if (tickCount - lastWormholeDespawn < WORMHOLE_RESPAWN_DELAY) return false;
  return Math.random() < WORMHOLE_SPAWN_CHANCE;
};

export const shouldDespawnWormhole = (
  wormhole: Wormhole,
  tickCount: number
): boolean => {
  return (tickCount - wormhole.spawnTick) > wormhole.lifetime || wormhole.used;
};

export interface WormholeTeleportResult {
  newHead: Position;
  teleported: boolean;
}

export const checkWormholeTeleport = (
  head: Position,
  wormhole: Wormhole
): WormholeTeleportResult => {
  if (wormhole.used) {
    return { newHead: head, teleported: false };
  }

  if (positionsEqual(head, wormhole.entry)) {
    return { newHead: { ...wormhole.exit }, teleported: true };
  }

  if (positionsEqual(head, wormhole.exit)) {
    return { newHead: { ...wormhole.entry }, teleported: true };
  }

  return { newHead: head, teleported: false };
};

export const wormholeRemainingLife = (
  wormhole: Wormhole,
  tickCount: number
): number => {
  const elapsed = tickCount - wormhole.spawnTick;
  return Math.max(0, wormhole.lifetime - elapsed) / wormhole.lifetime;
};
