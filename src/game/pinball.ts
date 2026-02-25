import { Direction, Position } from './types';

export interface PinballBumperConfig {
  gridX: number;
  gridY: number;
}

export function computeBounceDirection(
  headX: number,
  headY: number,
  bumperX: number,
  bumperY: number,
  currentDirection: Direction
): Direction {
  const dx = headX - bumperX;
  const dy = headY - bumperY;

  if (currentDirection === 'UP' || currentDirection === 'DOWN') {
    if (dx > 0) return 'RIGHT';
    if (dx < 0) return 'LEFT';
    return currentDirection === 'UP' ? 'DOWN' : 'UP';
  }

  if (dy > 0) return 'DOWN';
  if (dy < 0) return 'UP';
  return currentDirection === 'LEFT' ? 'RIGHT' : 'LEFT';
}

export function isAdjacentToBumper(
  head: Position,
  bumper: PinballBumperConfig
): boolean {
  const dx = Math.abs(head.x - bumper.gridX);
  const dy = Math.abs(head.y - bumper.gridY);
  return dx <= 1 && dy <= 1 && (dx + dy > 0);
}

export function findNearestBumper(
  head: Position,
  bumpers: PinballBumperConfig[]
): PinballBumperConfig | null {
  let nearest: PinballBumperConfig | null = null;
  let minDist = Infinity;

  for (const b of bumpers) {
    const dx = head.x - b.gridX;
    const dy = head.y - b.gridY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < minDist && dist <= 1.5) {
      minDist = dist;
      nearest = b;
    }
  }

  return nearest;
}

export function getPinballActivationTick(): number {
  return 67;
}
