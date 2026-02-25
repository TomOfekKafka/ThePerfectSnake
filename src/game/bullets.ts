import { Position, Direction } from './types';
import { GRID_SIZE } from './constants';

export interface Bullet {
  position: Position;
  direction: Direction;
  life: number;
}

export const BULLET_MAX_LIFE = 25;
export const BULLET_PHANTOM_KILL_SCORE = 20;

const DIRECTION_VECTORS: Record<Direction, Position> = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

export const createBullet = (head: Position, direction: Direction): Bullet => ({
  position: {
    x: head.x + DIRECTION_VECTORS[direction].x,
    y: head.y + DIRECTION_VECTORS[direction].y,
  },
  direction,
  life: BULLET_MAX_LIFE,
});

export const isBulletAlive = (bullet: Bullet): boolean =>
  bullet.life > 0 &&
  bullet.position.x >= 0 &&
  bullet.position.x < GRID_SIZE &&
  bullet.position.y >= 0 &&
  bullet.position.y < GRID_SIZE;

export const moveBullet = (bullet: Bullet): Bullet => {
  const vec = DIRECTION_VECTORS[bullet.direction];
  return {
    ...bullet,
    position: {
      x: bullet.position.x + vec.x,
      y: bullet.position.y + vec.y,
    },
    life: bullet.life - 1,
  };
};

export interface BulletTickResult {
  bullets: Bullet[];
  phantomHit: boolean;
}

export const tickBullets = (
  bullets: Bullet[],
  phantomSegments: Position[]
): BulletTickResult => {
  let phantomHit = false;
  const moved = bullets.map(moveBullet);
  const surviving: Bullet[] = [];

  for (const bullet of moved) {
    if (!isBulletAlive(bullet)) continue;

    const hitPhantom = phantomSegments.some(
      seg => seg.x === bullet.position.x && seg.y === bullet.position.y
    );

    if (hitPhantom) {
      phantomHit = true;
      continue;
    }

    surviving.push(bullet);
  }

  return { bullets: surviving, phantomHit };
};
