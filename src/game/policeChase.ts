import { Position, Direction } from './types';
import { GRID_SIZE } from './constants';
import { positionsEqual, isInBounds, collidesWithSnake, getNextHead } from './logic';

export interface PoliceState {
  segments: Position[];
  direction: Direction;
  active: boolean;
  moveTimer: number;
  spawnCooldown: number;
  caughtFlash: number;
}

const POLICE_LENGTH = 3;
const POLICE_MOVE_EVERY = 2;
const POLICE_SPAWN_AFTER_FOOD = 4;
const POLICE_RESPAWN_COOLDOWN = 15;
const POLICE_CATCH_PENALTY = 30;

export const POLICE_PENALTY = POLICE_CATCH_PENALTY;

export const createPoliceState = (): PoliceState => ({
  segments: [],
  direction: 'LEFT',
  active: false,
  moveTimer: 0,
  spawnCooldown: 0,
  caughtFlash: 0,
});

const manhattanDistance = (a: Position, b: Position): number =>
  Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

const choosePoliceDirection = (
  head: Position,
  target: Position,
  currentDir: Direction,
  ownSegments: Position[],
  avoidSegments: Position[],
  fleeing: boolean
): Direction => {
  const dirs: Direction[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
  const opposite: Record<Direction, Direction> = {
    UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT',
  };

  const candidates: { dir: Direction; score: number }[] = [];

  for (const dir of dirs) {
    if (dir === opposite[currentDir] && ownSegments.length > 1) continue;

    const next = getNextHead(head, dir);
    if (!isInBounds(next)) continue;
    if (collidesWithSnake(next, ownSegments.slice(0, -1))) continue;

    const dist = manhattanDistance(next, target);
    const score = fleeing ? -dist : dist;
    const alignBonus = dir === currentDir ? -0.3 : 0;
    candidates.push({ dir, score: score + alignBonus });
  }

  if (candidates.length === 0) return currentDir;

  candidates.sort((a, b) => a.score - b.score);

  if (candidates.length > 1 && Math.random() < 0.15) {
    return candidates[1].dir;
  }

  return candidates[0].dir;
};

const spawnPolice = (
  playerSnake: Position[],
  avoidPositions: Position[]
): Pick<PoliceState, 'segments' | 'direction' | 'active'> => {
  const edges: Position[] = [
    { x: 0, y: Math.floor(GRID_SIZE / 2) },
    { x: GRID_SIZE - 1, y: Math.floor(GRID_SIZE / 2) },
    { x: Math.floor(GRID_SIZE / 2), y: 0 },
    { x: Math.floor(GRID_SIZE / 2), y: GRID_SIZE - 1 },
  ];

  const playerHead = playerSnake[0];
  const ranked = edges
    .map(c => ({
      pos: c,
      dist: manhattanDistance(c, playerHead),
    }))
    .sort((a, b) => b.dist - a.dist);

  const spawnHead = ranked[0].pos;

  const dirToCenter: Direction =
    spawnHead.x === 0 ? 'RIGHT' :
    spawnHead.x === GRID_SIZE - 1 ? 'LEFT' :
    spawnHead.y === 0 ? 'DOWN' : 'UP';

  const tailOffset: Record<Direction, Position> = {
    UP: { x: 0, y: 1 },
    DOWN: { x: 0, y: -1 },
    LEFT: { x: 1, y: 0 },
    RIGHT: { x: -1, y: 0 },
  };
  const offset = tailOffset[dirToCenter];

  const segments: Position[] = [];
  for (let i = 0; i < POLICE_LENGTH; i++) {
    const seg = {
      x: spawnHead.x + offset.x * i,
      y: spawnHead.y + offset.y * i,
    };
    if (isInBounds(seg) && !collidesWithSnake(seg, playerSnake) && !collidesWithSnake(seg, avoidPositions)) {
      segments.push(seg);
    }
  }

  if (segments.length < 2) {
    return { segments: [], direction: dirToCenter, active: false };
  }

  return {
    segments,
    direction: dirToCenter,
    active: true,
  };
};

export interface PoliceTickResult {
  police: PoliceState;
  caughtPlayer: boolean;
}

export const tickPolice = (
  police: PoliceState,
  playerSnake: Position[],
  playerFoodEaten: number,
  gameOver: boolean,
  playerInvincible: boolean
): PoliceTickResult => {
  if (gameOver) {
    return {
      police: { ...police, active: false, segments: [] },
      caughtPlayer: false,
    };
  }

  const caughtFlash = Math.max(0, police.caughtFlash - 1);

  if (!police.active) {
    if (playerFoodEaten >= POLICE_SPAWN_AFTER_FOOD && police.spawnCooldown <= 0) {
      const spawn = spawnPolice(playerSnake, []);
      return {
        police: {
          ...police,
          ...spawn,
          moveTimer: 0,
          spawnCooldown: 0,
          caughtFlash,
        },
        caughtPlayer: false,
      };
    }
    return {
      police: {
        ...police,
        spawnCooldown: Math.max(0, police.spawnCooldown - 1),
        caughtFlash,
      },
      caughtPlayer: false,
    };
  }

  const nextTimer = police.moveTimer + 1;
  if (nextTimer < POLICE_MOVE_EVERY) {
    return {
      police: { ...police, moveTimer: nextTimer, caughtFlash },
      caughtPlayer: false,
    };
  }

  const head = police.segments[0];
  const playerHead = playerSnake[0];
  const fleeing = playerInvincible;
  const dir = choosePoliceDirection(head, playerHead, police.direction, police.segments, playerSnake, fleeing);
  const newHead = getNextHead(head, dir);

  if (!isInBounds(newHead) || collidesWithSnake(newHead, police.segments.slice(0, -1))) {
    return {
      police: {
        ...police,
        active: false,
        segments: [],
        spawnCooldown: POLICE_RESPAWN_COOLDOWN,
        caughtFlash,
      },
      caughtPlayer: false,
    };
  }

  const newSegments = [newHead, ...police.segments];
  newSegments.pop();

  const caught = positionsEqual(newHead, playerHead);

  if (caught && !playerInvincible) {
    return {
      police: {
        ...police,
        segments: [],
        active: false,
        direction: dir,
        moveTimer: 0,
        spawnCooldown: POLICE_RESPAWN_COOLDOWN,
        caughtFlash: 8,
      },
      caughtPlayer: true,
    };
  }

  return {
    police: {
      ...police,
      segments: newSegments,
      direction: dir,
      moveTimer: 0,
      caughtFlash,
    },
    caughtPlayer: false,
  };
};
