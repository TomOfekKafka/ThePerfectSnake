import { Direction, Position } from './types';
import { CELL_SIZE } from './constants';

type CardinalOnly = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

interface TapResult {
  direction: Direction;
  quadrant: CardinalOnly;
}

export const getTapDirection = (
  tapX: number,
  tapY: number,
  headPos: Position,
  canvasRect: DOMRect,
  canvasWidth: number,
  canvasHeight: number,
  currentDirection: Direction
): TapResult | null => {
  const scaleX = canvasWidth / canvasRect.width;
  const scaleY = canvasHeight / canvasRect.height;

  const gameX = (tapX - canvasRect.left) * scaleX;
  const gameY = (tapY - canvasRect.top) * scaleY;

  const headPixelX = headPos.x * CELL_SIZE + CELL_SIZE / 2;
  const headPixelY = headPos.y * CELL_SIZE + CELL_SIZE / 2;

  const deltaX = gameX - headPixelX;
  const deltaY = gameY - headPixelY;

  const deadZone = CELL_SIZE;
  if (Math.abs(deltaX) < deadZone && Math.abs(deltaY) < deadZone) {
    return null;
  }

  const direction = resolveQuadrant(deltaX, deltaY, currentDirection);
  return { direction, quadrant: direction as CardinalOnly };
};

const resolveQuadrant = (
  deltaX: number,
  deltaY: number,
  currentDirection: Direction
): Direction => {
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    const primary: Direction = deltaX > 0 ? 'RIGHT' : 'LEFT';
    if (isOpposite(primary, currentDirection)) {
      return deltaY > 0 ? 'DOWN' : 'UP';
    }
    return primary;
  }

  const primary: Direction = deltaY > 0 ? 'DOWN' : 'UP';
  if (isOpposite(primary, currentDirection)) {
    return deltaX > 0 ? 'RIGHT' : 'LEFT';
  }
  return primary;
};

const isOpposite = (a: Direction, b: Direction): boolean => {
  return (
    (a === 'UP' && b === 'DOWN') ||
    (a === 'DOWN' && b === 'UP') ||
    (a === 'LEFT' && b === 'RIGHT') ||
    (a === 'RIGHT' && b === 'LEFT')
  );
};
