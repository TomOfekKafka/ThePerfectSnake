/**
 * Core game types - shared across all game modules
 */

export interface Position {
  x: number;
  y: number;
}

export type PowerUpType = 'SPEED_BOOST' | 'INVINCIBILITY' | 'SCORE_MULTIPLIER' | 'MAGNET';

export interface PowerUp {
  position: Position;
  type: PowerUpType;
  spawnTime: number;
  duration: number;
}

export interface ActivePowerUp {
  type: PowerUpType;
  endTime: number;
}

export interface PortalPair {
  a: Position;
  b: Position;
  spawnTick: number;
  cooldown: number;
}

export interface Wormhole {
  entry: Position;
  exit: Position;
  spawnTick: number;
  lifetime: number;
  used: boolean;
}

export interface BonusFood {
  position: Position;
  spawnTick: number;
  lifetime: number;
}

export interface CashItem {
  position: Position;
  spawnTick: number;
  lifetime: number;
  value: number;
}

export interface FlagFood {
  position: Position;
  spawnTick: number;
  lifetime: number;
}

export interface FakeFood {
  position: Position;
  spawnTick: number;
  lifetime: number;
  mimicIndex: number;
}

export interface PhantomSnake {
  segments: Position[];
  direction: Direction;
  active: boolean;
  stealCount: number;
  moveTimer: number;
  spawnCooldown: number;
}

export interface PoliceChaseState {
  segments: Position[];
  direction: Direction;
  active: boolean;
  moveTimer: number;
  spawnCooldown: number;
  caughtFlash: number;
}

export interface Obstacle {
  position: Position;
  spawnTick: number;
  variant: number;
}

export interface GameState {
  snake: Position[];
  food: Position;
  direction: Direction;
  gameOver: boolean;
  gameStarted: boolean;
  score: number;
  foodEaten: number;
  powerUp: PowerUp | null;
  activePowerUps: ActivePowerUp[];
  tickCount: number;
  portalPair: PortalPair | null;
  lastPortalDespawn: number;
  wormhole: Wormhole | null;
  lastWormholeDespawn: number;
  phantom: PhantomSnake;
  bonusFood: BonusFood | null;
  flagFood: FlagFood | null;
  cashItems: CashItem[];
  totalCash: number;
  fakeFoods: FakeFood[];
  police: PoliceChaseState;
  obstacles: Obstacle[];
  immortalActive: boolean;
  immortalProgress: number;
  immortalCharges: number;
  immortalRechargeProgress: number;
  deathReason: DeathReason;
}

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export interface RivalSnakeState {
  segments: Position[];
  direction: Direction;
  active: boolean;
  growPending: number;
  moveTimer: number;
  spawnCooldown: number;
  foodEaten: number;
}

export type DeathReason = 'wall' | 'self' | 'rival' | 'obstacle' | null;

export const OPPOSITE_DIRECTIONS: Record<Direction, Direction> = {
  UP: 'DOWN',
  DOWN: 'UP',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT'
};
