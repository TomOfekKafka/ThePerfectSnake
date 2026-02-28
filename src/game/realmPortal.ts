import { Position, RealmPortal } from './types';
import { GRID_SIZE } from './constants';
import { collidesWithSnake, positionsEqual } from './logic';

export const REALM_COUNT = 6;
const REALM_PORTAL_FOOD_INTERVAL = 10;
const REALM_PORTAL_LIFETIME = 120;

export const shouldSpawnRealmPortal = (
  realmPortal: RealmPortal | null,
  foodEaten: number,
  lastRealmTransitionFood: number
): boolean => {
  if (realmPortal) return false;
  if (foodEaten < REALM_PORTAL_FOOD_INTERVAL) return false;
  if (foodEaten - lastRealmTransitionFood < REALM_PORTAL_FOOD_INTERVAL) return false;
  return foodEaten % REALM_PORTAL_FOOD_INTERVAL === 0;
};

export const generateRealmPortal = (
  snake: Position[],
  food: Position,
  tickCount: number,
  currentRealm: number,
  excludePos?: Position
): RealmPortal => {
  let pos: Position;
  let attempts = 0;
  do {
    pos = {
      x: 2 + Math.floor(Math.random() * (GRID_SIZE - 4)),
      y: 2 + Math.floor(Math.random() * (GRID_SIZE - 4)),
    };
    attempts++;
    if (attempts > 200) break;
  } while (
    collidesWithSnake(pos, snake) ||
    positionsEqual(pos, food) ||
    (excludePos && positionsEqual(pos, excludePos))
  );

  const nextRealm = (currentRealm + 1 + Math.floor(Math.random() * (REALM_COUNT - 1))) % REALM_COUNT;

  return {
    position: pos,
    spawnTick: tickCount,
    targetRealm: nextRealm,
  };
};

export const isRealmPortalExpired = (
  portal: RealmPortal,
  tickCount: number
): boolean => tickCount - portal.spawnTick > REALM_PORTAL_LIFETIME;

export const checkRealmPortalEntry = (
  head: Position,
  portal: RealmPortal
): boolean => positionsEqual(head, portal.position);
