import { Position, FoodFleeState } from './types';
import { GRID_SIZE, FOOD_FLEE_RANGE, FOOD_FLEE_INTERVAL_BASE, FOOD_FLEE_INTERVAL_MIN } from './constants';
import { collidesWithSnake, isInBounds } from './logic';

interface FleeCandidate {
  pos: Position;
  dist: number;
}

const manhattan = (a: Position, b: Position): number =>
  Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

const FLEE_OFFSETS: Position[] = [
  { x: 1, y: 0 }, { x: -1, y: 0 },
  { x: 0, y: 1 }, { x: 0, y: -1 },
  { x: 1, y: 1 }, { x: -1, y: -1 },
  { x: 1, y: -1 }, { x: -1, y: 1 },
];

const computePanicLevel = (dist: number): number => {
  if (dist > FOOD_FLEE_RANGE) return 0;
  return Math.max(0, 1 - dist / FOOD_FLEE_RANGE);
};

const fleeInterval = (panic: number): number => {
  const range = FOOD_FLEE_INTERVAL_BASE - FOOD_FLEE_INTERVAL_MIN;
  return Math.round(FOOD_FLEE_INTERVAL_BASE - range * panic);
};

const pickFleePosition = (
  food: Position,
  head: Position,
  snake: Position[],
  obstacles: Position[]
): Position | null => {
  const candidates: FleeCandidate[] = [];

  for (const off of FLEE_OFFSETS) {
    const pos = { x: food.x + off.x, y: food.y + off.y };
    if (!isInBounds(pos)) continue;
    if (collidesWithSnake(pos, snake)) continue;
    if (obstacles.some(o => o.x === pos.x && o.y === pos.y)) continue;

    const dist = manhattan(pos, head);
    candidates.push({ pos, dist });
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => b.dist - a.dist);
  const best = candidates[0].dist;
  const topCandidates = candidates.filter(c => c.dist === best);
  return topCandidates[Math.floor(Math.random() * topCandidates.length)].pos;
};

export interface FoodFleeResult {
  food: Position;
  foodFlee: FoodFleeState;
  fled: boolean;
}

export const tickFoodFlee = (
  food: Position,
  fleeState: FoodFleeState,
  head: Position,
  snake: Position[],
  obstacles: Position[],
  tickCount: number
): FoodFleeResult => {
  const dist = manhattan(food, head);
  const panic = computePanicLevel(dist);

  if (panic === 0) {
    return { food, foodFlee: { ...fleeState, panicLevel: 0 }, fled: false };
  }

  const interval = fleeInterval(panic);
  const ticksSinceMove = tickCount - fleeState.lastMoveTick;

  if (ticksSinceMove < interval) {
    return { food, foodFlee: { ...fleeState, panicLevel: panic }, fled: false };
  }

  const newPos = pickFleePosition(food, head, snake, obstacles);
  if (!newPos) {
    return { food, foodFlee: { ...fleeState, panicLevel: panic }, fled: false };
  }

  return {
    food: newPos,
    foodFlee: { lastMoveTick: tickCount, panicLevel: panic },
    fled: true,
  };
};
