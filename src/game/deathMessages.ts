const DEATH_MESSAGES = [
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

export type DeathMessage = typeof DEATH_MESSAGES[number];

export function pickDeathMessage(): DeathMessage {
  return DEATH_MESSAGES[Math.floor(Math.random() * DEATH_MESSAGES.length)];
}

export function getAllDeathMessages(): readonly string[] {
  return DEATH_MESSAGES;
}
