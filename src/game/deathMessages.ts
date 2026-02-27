import { DeathReason } from './types';

const FLAVOR_MESSAGES = [
  'THE SNAKE FALLS',
  'A VALIANT EFFORT',
  'DARKNESS DESCENDS',
  'SILENCE FOLLOWS',
  'THE HUNT ENDS',
  'REST IN PIECES',
  'CURTAIN CALL',
  'FINAL ACT',
  'NO MORE MOVES',
  'FADE TO BLACK',
] as const;

const WALL_REASONS = [
  'SMASHED INTO THE WALL',
  'HIT THE BOUNDARY',
  'CRUSHED AGAINST THE EDGE',
  'WALL COLLISION',
  'NOWHERE LEFT TO GO',
] as const;

const SELF_REASONS = [
  'ATE YOURSELF',
  'SELF-DESTRUCTION',
  'BIT YOUR OWN TAIL',
  'TWISTED INTO A KNOT',
  'CONSUMED BY YOURSELF',
] as const;

const RIVAL_REASONS = [
  'TAKEN DOWN BY THE RIVAL',
  'OUTMANEUVERED',
  'THE RIVAL STRIKES',
  'HEAD-ON COLLISION',
  'RIVAL SNAKE WINS',
] as const;

export type DeathMessage = string;

function pickFrom(arr: readonly string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function pickDeathMessage(): DeathMessage {
  return pickFrom(FLAVOR_MESSAGES);
}

export function pickDeathReason(reason: DeathReason): string {
  switch (reason) {
    case 'wall': return pickFrom(WALL_REASONS);
    case 'self': return pickFrom(SELF_REASONS);
    case 'rival': return pickFrom(RIVAL_REASONS);
    default: return pickFrom(FLAVOR_MESSAGES);
  }
}

export function getAllDeathMessages(): readonly string[] {
  return FLAVOR_MESSAGES;
}
