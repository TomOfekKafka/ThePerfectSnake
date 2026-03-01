import { Position } from './types';
import { GRID_SIZE } from './constants';
import { collidesWithSnake, positionsEqual } from './logic';

export interface PortalPair {
  a: Position;
  b: Position;
  spawnTick: number;
  cooldown: number;
}

const PORTAL_MIN_DISTANCE = 6;
const PORTAL_DESPAWN_TICKS = 120;
const PORTAL_RESPAWN_DELAY = 20;
const PORTAL_COOLDOWN_TICKS = 3;
const PORTAL_SPAWN_AFTER_FOOD = 3;

export { PORTAL_DESPAWN_TICKS, PORTAL_RESPAWN_DELAY, PORTAL_SPAWN_AFTER_FOOD };

const manhattanDistance = (a: Position, b: Position): number =>
  Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

const generatePortalPosition = (
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

export const generatePortalPair = (
  snake: Position[],
  food: Position,
  tickCount: number
): PortalPair => {
  const a = generatePortalPosition(snake, food);
  let b: Position;
  let attempts = 0;
  do {
    b = generatePortalPosition([...snake, a], food);
    attempts++;
    if (attempts > 200) break;
  } while (manhattanDistance(a, b) < PORTAL_MIN_DISTANCE);

  return { a, b, spawnTick: tickCount, cooldown: 0 };
};

export const shouldSpawnPortals = (
  portalPair: PortalPair | null,
  foodEaten: number,
  tickCount: number,
  lastPortalDespawn: number
): boolean => {
  if (portalPair) return false;
  if (foodEaten < PORTAL_SPAWN_AFTER_FOOD) return false;
  if (tickCount - lastPortalDespawn < PORTAL_RESPAWN_DELAY) return false;
  return true;
};

export const shouldDespawnPortals = (
  portalPair: PortalPair,
  tickCount: number
): boolean => {
  return (tickCount - portalPair.spawnTick) > PORTAL_DESPAWN_TICKS;
};

export interface TeleportResult {
  newHead: Position;
  teleported: boolean;
  exitPortal: 'a' | 'b' | null;
}

export const checkTeleport = (
  head: Position,
  portalPair: PortalPair
): TeleportResult => {
  if (portalPair.cooldown > 0) {
    return { newHead: head, teleported: false, exitPortal: null };
  }

  if (positionsEqual(head, portalPair.a)) {
    return { newHead: { ...portalPair.b }, teleported: true, exitPortal: 'b' };
  }

  if (positionsEqual(head, portalPair.b)) {
    return { newHead: { ...portalPair.a }, teleported: true, exitPortal: 'a' };
  }

  return { newHead: head, teleported: false, exitPortal: null };
};

export const decrementCooldown = (portalPair: PortalPair): PortalPair => {
  if (portalPair.cooldown <= 0) return portalPair;
  return { ...portalPair, cooldown: portalPair.cooldown - 1 };
};

export const applyTeleportCooldown = (portalPair: PortalPair): PortalPair => ({
  ...portalPair,
  cooldown: PORTAL_COOLDOWN_TICKS,
});
