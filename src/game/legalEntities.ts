import { Position, LegalEntity, LegalEntityType, CardinalDirection } from './types';
import { GRID_SIZE } from './constants';
import { collidesWithSnake, positionsEqual } from './logic';

const LEGAL_SPAWN_CHANCE = 0.035;
const LEGAL_MAX_ON_BOARD = 3;
const LEGAL_LIFETIME = 120;
const LEGAL_MOVE_INTERVAL = 4;
const LEGAL_MIN_FOOD_EATEN = 2;
export const LEGAL_SCORE_BONUS = 30;

const ENTITY_TYPES: LegalEntityType[] = ['LAWYER', 'JUDGE', 'CORP'];

const CARDINAL_DIRS: CardinalDirection[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];

const CARDINAL_DELTAS: Record<CardinalDirection, { dx: number; dy: number }> = {
  UP: { dx: 0, dy: -1 },
  DOWN: { dx: 0, dy: 1 },
  LEFT: { dx: -1, dy: 0 },
  RIGHT: { dx: 1, dy: 0 },
};

const generateLegalPosition = (
  snake: Position[],
  food: Position,
  existing: LegalEntity[],
  powerUpPos?: Position
): Position => {
  const occupied = existing.map(e => e.position);
  let pos: Position;
  let attempts = 0;
  do {
    pos = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
    attempts++;
  } while (
    attempts < 100 && (
      collidesWithSnake(pos, snake) ||
      positionsEqual(pos, food) ||
      (powerUpPos && positionsEqual(pos, powerUpPos)) ||
      occupied.some(o => positionsEqual(pos, o))
    )
  );
  return pos;
};

export const shouldSpawnLegal = (
  entities: LegalEntity[],
  foodEaten: number
): boolean =>
  foodEaten >= LEGAL_MIN_FOOD_EATEN &&
  entities.length < LEGAL_MAX_ON_BOARD &&
  Math.random() < LEGAL_SPAWN_CHANCE;

export const generateLegalEntity = (
  snake: Position[],
  food: Position,
  existing: LegalEntity[],
  tickCount: number,
  powerUpPos?: Position
): LegalEntity => {
  const position = generateLegalPosition(snake, food, existing, powerUpPos);
  const entityType = ENTITY_TYPES[Math.floor(Math.random() * ENTITY_TYPES.length)];
  const direction = CARDINAL_DIRS[Math.floor(Math.random() * CARDINAL_DIRS.length)];
  return {
    position,
    entityType,
    spawnTick: tickCount,
    lifetime: LEGAL_LIFETIME,
    moveTimer: 0,
    direction,
  };
};

export const expireLegalEntities = (entities: LegalEntity[], tickCount: number): LegalEntity[] =>
  entities.filter(e => tickCount - e.spawnTick <= e.lifetime);

const moveLegalEntity = (entity: LegalEntity): LegalEntity => {
  if (entity.moveTimer < LEGAL_MOVE_INTERVAL) {
    return { ...entity, moveTimer: entity.moveTimer + 1 };
  }

  if (Math.random() < 0.3) {
    const newDir = CARDINAL_DIRS[Math.floor(Math.random() * CARDINAL_DIRS.length)];
    return { ...entity, direction: newDir, moveTimer: 0 };
  }

  const delta = CARDINAL_DELTAS[entity.direction];
  const newX = entity.position.x + delta.dx;
  const newY = entity.position.y + delta.dy;

  if (newX < 0 || newX >= GRID_SIZE || newY < 0 || newY >= GRID_SIZE) {
    const newDir = CARDINAL_DIRS[Math.floor(Math.random() * CARDINAL_DIRS.length)];
    return { ...entity, direction: newDir, moveTimer: 0 };
  }

  return {
    ...entity,
    position: { x: newX, y: newY },
    moveTimer: 0,
  };
};

export const moveLegalEntities = (entities: LegalEntity[]): LegalEntity[] =>
  entities.map(moveLegalEntity);

export const collectLegalEntities = (
  entities: LegalEntity[],
  head: Position
): { remaining: LegalEntity[]; collected: LegalEntity[] } => {
  const collected: LegalEntity[] = [];
  const remaining: LegalEntity[] = [];
  for (const entity of entities) {
    if (positionsEqual(head, entity.position)) {
      collected.push(entity);
    } else {
      remaining.push(entity);
    }
  }
  return { remaining, collected };
};
