import { Position, Direction, RivalSnakeState } from './types';
import { GRID_SIZE } from './constants';
import { positionsEqual, isInBounds, collidesWithSnake, getNextHead } from './logic';

export type { RivalSnakeState } from './types';

const RIVAL_INITIAL_LENGTH = 4;
const RIVAL_MOVE_EVERY = 2;
const RIVAL_SPAWN_AFTER_FOOD = 2;
const RIVAL_RESPAWN_COOLDOWN = 10;

export const createRivalSnakeState = (): RivalSnakeState => ({
  segments: [],
  direction: 'LEFT',
  active: false,
  growPending: 0,
  moveTimer: 0,
  spawnCooldown: 0,
  foodEaten: 0,
});

const manhattanDistance = (a: Position, b: Position): number =>
  Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

const chooseRivalDirection = (
  head: Position,
  target: Position,
  currentDir: Direction,
  ownSegments: Position[],
  playerSnake: Position[]
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
    if (collidesWithSnake(next, playerSnake)) continue;

    const dist = manhattanDistance(next, target);
    const alignBonus = dir === currentDir ? -0.3 : 0;
    candidates.push({ dir, score: dist + alignBonus });
  }

  if (candidates.length === 0) return currentDir;

  candidates.sort((a, b) => a.score - b.score);

  if (candidates.length > 1 && Math.random() < 0.2) {
    return candidates[1].dir;
  }

  return candidates[0].dir;
};

const spawnRivalSnake = (
  playerSnake: Position[],
  food: Position
): Pick<RivalSnakeState, 'segments' | 'direction' | 'active'> => {
  const corners: Position[] = [
    { x: 1, y: 1 },
    { x: GRID_SIZE - 2, y: 1 },
    { x: 1, y: GRID_SIZE - 2 },
    { x: GRID_SIZE - 2, y: GRID_SIZE - 2 },
  ];

  const playerHead = playerSnake[0];
  const ranked = corners
    .map(c => ({
      pos: c,
      dist: manhattanDistance(c, playerHead) + manhattanDistance(c, food) * 0.3,
    }))
    .sort((a, b) => b.dist - a.dist);

  const spawnHead = ranked[0].pos;

  const dirToCenter: Direction =
    spawnHead.x < GRID_SIZE / 2
      ? (spawnHead.y < GRID_SIZE / 2 ? 'RIGHT' : 'RIGHT')
      : (spawnHead.y < GRID_SIZE / 2 ? 'LEFT' : 'LEFT');

  const tailOffset: Record<Direction, Position> = {
    UP: { x: 0, y: 1 },
    DOWN: { x: 0, y: -1 },
    LEFT: { x: 1, y: 0 },
    RIGHT: { x: -1, y: 0 },
  };
  const offset = tailOffset[dirToCenter];

  const segments: Position[] = [];
  for (let i = 0; i < RIVAL_INITIAL_LENGTH; i++) {
    const seg = {
      x: spawnHead.x + offset.x * i,
      y: spawnHead.y + offset.y * i,
    };
    if (isInBounds(seg) && !collidesWithSnake(seg, playerSnake)) {
      segments.push(seg);
    }
  }

  if (segments.length < 2) {
    segments.length = 0;
    segments.push(spawnHead);
    for (let i = 1; i < RIVAL_INITIAL_LENGTH; i++) {
      const seg = { x: spawnHead.x + i, y: spawnHead.y };
      if (isInBounds(seg)) segments.push(seg);
    }
  }

  return {
    segments,
    direction: dirToCenter,
    active: segments.length >= 2,
  };
};

export interface RivalTickResult {
  rival: RivalSnakeState;
  foodStolen: boolean;
}

export const tickRival = (
  rival: RivalSnakeState,
  food: Position,
  playerSnake: Position[],
  playerFoodEaten: number,
  gameOver: boolean
): RivalTickResult => {
  if (gameOver) {
    return {
      rival: { ...rival, active: false, segments: [] },
      foodStolen: false,
    };
  }

  if (!rival.active) {
    if (playerFoodEaten >= RIVAL_SPAWN_AFTER_FOOD && rival.spawnCooldown <= 0) {
      const spawn = spawnRivalSnake(playerSnake, food);
      return {
        rival: {
          ...rival,
          ...spawn,
          moveTimer: 0,
          spawnCooldown: 0,
          growPending: 0,
        },
        foodStolen: false,
      };
    }
    return {
      rival: {
        ...rival,
        spawnCooldown: Math.max(0, rival.spawnCooldown - 1),
      },
      foodStolen: false,
    };
  }

  const nextTimer = rival.moveTimer + 1;
  if (nextTimer < RIVAL_MOVE_EVERY) {
    return {
      rival: { ...rival, moveTimer: nextTimer },
      foodStolen: false,
    };
  }

  const head = rival.segments[0];
  const dir = chooseRivalDirection(head, food, rival.direction, rival.segments, playerSnake);
  const newHead = getNextHead(head, dir);

  if (!isInBounds(newHead) || collidesWithSnake(newHead, rival.segments.slice(0, -1))) {
    return {
      rival: {
        ...rival,
        active: false,
        segments: [],
        spawnCooldown: RIVAL_RESPAWN_COOLDOWN,
      },
      foodStolen: false,
    };
  }

  const newSegments = [newHead, ...rival.segments];
  if (rival.growPending > 0) {
    return {
      rival: {
        ...rival,
        segments: newSegments,
        direction: dir,
        moveTimer: 0,
        growPending: rival.growPending - 1,
      },
      foodStolen: false,
    };
  }
  newSegments.pop();

  const stoleFood = positionsEqual(newHead, food);

  if (stoleFood) {
    return {
      rival: {
        ...rival,
        segments: newSegments,
        direction: dir,
        moveTimer: 0,
        foodEaten: rival.foodEaten + 1,
        growPending: 2,
      },
      foodStolen: true,
    };
  }

  return {
    rival: {
      ...rival,
      segments: newSegments,
      direction: dir,
      moveTimer: 0,
    },
    foodStolen: false,
  };
};

export const playerCollidesWithRival = (
  playerHead: Position,
  rivalSegments: Position[]
): boolean => {
  if (rivalSegments.length === 0) return false;
  return collidesWithSnake(playerHead, rivalSegments);
};
