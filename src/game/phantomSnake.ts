import { Position, Direction, CardinalDirection, isCardinal } from './types';
import { GRID_SIZE } from './constants';
import { positionsEqual, collidesWithSnake, isInBounds } from './logic';

export interface PhantomSnakeState {
  segments: Position[];
  direction: Direction;
  active: boolean;
  stealCount: number;
  moveTimer: number;
  spawnCooldown: number;
}

const PHANTOM_LENGTH = 5;
const PHANTOM_MOVE_EVERY = 2;
const PHANTOM_SPAWN_AFTER_FOOD = 3;
const PHANTOM_RESPAWN_COOLDOWN = 8;

export const createPhantomSnakeState = (): PhantomSnakeState => ({
  segments: [],
  direction: 'LEFT',
  active: false,
  stealCount: 0,
  moveTimer: 0,
  spawnCooldown: 0,
});

const manhattanDistance = (a: Position, b: Position): number =>
  Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

const choosePhantomDirection = (
  head: Position,
  food: Position,
  currentDir: Direction,
  segments: Position[]
): Direction => {
  const dx = food.x - head.x;
  const dy = food.y - head.y;

  const candidates: { dir: Direction; score: number }[] = [];

  const dirs: CardinalDirection[] = ['UP', 'DOWN', 'LEFT', 'RIGHT'];
  const moves: Record<CardinalDirection, Position> = {
    UP: { x: head.x, y: head.y - 1 },
    DOWN: { x: head.x, y: head.y + 1 },
    LEFT: { x: head.x - 1, y: head.y },
    RIGHT: { x: head.x + 1, y: head.y },
  };

  const opposite: Record<CardinalDirection, Direction> = {
    UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT',
  };

  for (const dir of dirs) {
    if (isCardinal(currentDir) && dir === opposite[currentDir] && segments.length > 1) continue;

    const next = moves[dir];
    if (!isInBounds(next)) continue;
    if (collidesWithSnake(next, segments.slice(0, -1))) continue;

    const dist = manhattanDistance(next, food);
    const alignBonus = dir === currentDir ? -0.5 : 0;
    candidates.push({ dir, score: dist + alignBonus });
  }

  if (candidates.length === 0) return currentDir;

  candidates.sort((a, b) => a.score - b.score);

  if (candidates.length > 1 && Math.random() < 0.15) {
    return candidates[1].dir;
  }

  return candidates[0].dir;
};

const spawnPhantomSnake = (
  playerSnake: Position[],
  food: Position
): Pick<PhantomSnakeState, 'segments' | 'direction' | 'active'> => {
  const corners: Position[] = [
    { x: 1, y: 1 },
    { x: GRID_SIZE - 2, y: 1 },
    { x: 1, y: GRID_SIZE - 2 },
    { x: GRID_SIZE - 2, y: GRID_SIZE - 2 },
  ];

  const playerHead = playerSnake[0];
  const ranked = corners
    .map(c => ({ pos: c, dist: manhattanDistance(c, playerHead) }))
    .sort((a, b) => b.dist - a.dist);

  const spawnHead = ranked[0].pos;

  const segments: Position[] = [];
  const dirToCenter: CardinalDirection =
    spawnHead.x < GRID_SIZE / 2
      ? (spawnHead.y < GRID_SIZE / 2 ? 'DOWN' : 'UP')
      : (spawnHead.y < GRID_SIZE / 2 ? 'DOWN' : 'UP');

  const tailOffset: Record<CardinalDirection, Position> = {
    UP: { x: 0, y: 1 },
    DOWN: { x: 0, y: -1 },
    LEFT: { x: 1, y: 0 },
    RIGHT: { x: -1, y: 0 },
  };
  const offset = tailOffset[dirToCenter];

  for (let i = 0; i < PHANTOM_LENGTH; i++) {
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
    for (let i = 1; i < PHANTOM_LENGTH; i++) {
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

export interface PhantomTickResult {
  phantom: PhantomSnakeState;
  foodStolen: boolean;
}

export const tickPhantom = (
  phantom: PhantomSnakeState,
  food: Position,
  playerSnake: Position[],
  foodEaten: number,
  gameOver: boolean
): PhantomTickResult => {
  if (gameOver) {
    return {
      phantom: { ...phantom, active: false, segments: [] },
      foodStolen: false,
    };
  }

  if (!phantom.active) {
    if (foodEaten >= PHANTOM_SPAWN_AFTER_FOOD && phantom.spawnCooldown <= 0) {
      const spawn = spawnPhantomSnake(playerSnake, food);
      return {
        phantom: {
          ...phantom,
          ...spawn,
          moveTimer: 0,
          spawnCooldown: 0,
        },
        foodStolen: false,
      };
    }
    return {
      phantom: {
        ...phantom,
        spawnCooldown: Math.max(0, phantom.spawnCooldown - 1),
      },
      foodStolen: false,
    };
  }

  const nextTimer = phantom.moveTimer + 1;
  if (nextTimer < PHANTOM_MOVE_EVERY) {
    return {
      phantom: { ...phantom, moveTimer: nextTimer },
      foodStolen: false,
    };
  }

  const head = phantom.segments[0];
  const dir = choosePhantomDirection(head, food, phantom.direction, phantom.segments);

  const moves: Record<CardinalDirection, Position> = {
    UP: { x: head.x, y: head.y - 1 },
    DOWN: { x: head.x, y: head.y + 1 },
    LEFT: { x: head.x - 1, y: head.y },
    RIGHT: { x: head.x + 1, y: head.y },
  };

  const cardinalDir = dir as CardinalDirection;
  const newHead = moves[cardinalDir];

  if (!isInBounds(newHead) || collidesWithSnake(newHead, phantom.segments.slice(0, -1))) {
    return {
      phantom: {
        ...phantom,
        active: false,
        segments: [],
        spawnCooldown: PHANTOM_RESPAWN_COOLDOWN,
      },
      foodStolen: false,
    };
  }

  const newSegments = [newHead, ...phantom.segments];
  newSegments.pop();

  const stoleFood = positionsEqual(newHead, food);

  if (stoleFood) {
    return {
      phantom: {
        ...phantom,
        segments: [],
        active: false,
        direction: dir,
        stealCount: phantom.stealCount + 1,
        moveTimer: 0,
        spawnCooldown: PHANTOM_RESPAWN_COOLDOWN,
      },
      foodStolen: true,
    };
  }

  return {
    phantom: {
      ...phantom,
      segments: newSegments,
      direction: dir,
      moveTimer: 0,
    },
    foodStolen: false,
  };
};
