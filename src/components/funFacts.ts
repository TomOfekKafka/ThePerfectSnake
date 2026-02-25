import Phaser from 'phaser';

const SNAKE_FACTS: string[] = [
  'SNAKES SMELL WITH TONGUES',
  'COBRAS SPIT 6 FEET',
  'SNAKES HAVE NO EYELIDS',
  'BOAS CRUSH WITH 90 PSI',
  'VIPERS SENSE HEAT',
  'PYTHONS GO A YEAR NO FOOD',
  'SNAKES HEAR VIBRATIONS',
  'KING COBRA IS 18 FEET',
  'SNAKES SHED SKIN WHOLE',
  'ANACONDA WEIGHS 550 LBS',
  'CORN SNAKES CLIMB WALLS',
  'SIDEWINDERS CROSS DUNES',
  'MAMBAS RUN 12 MPH',
  'SEA SNAKES DIVE DEEP',
  'RATTLES SHAKE 60 PER SEC',
  'SNAKE BONES BEND NOT BREAK',
  'FLYING SNAKES GLIDE 30 FT',
  'COBRAS DANCE TO MOTION',
  'SNAKES GROW FOREVER',
  'BLIND SNAKES EAT ANTS',
  'PYTHONS HAVE 100 TEETH',
  'VENOM IS JUST SPIT',
  'BOAS GIVE LIVE BIRTH',
  'SNAKES EXISTED 130M YEARS',
];

const MAX_ACTIVE_FACTS = 2;
const FACT_LIFETIME = 180;
const FLOAT_SPEED = 0.3;
const FADE_IN_FRAMES = 20;
const FADE_OUT_START = 140;

export interface ActiveFact {
  text: string;
  x: number;
  y: number;
  startY: number;
  age: number;
  maxAge: number;
  hue: number;
}

export interface FunFactsState {
  activeFacts: ActiveFact[];
  nextFactIndex: number;
}

export function createFunFactsState(): FunFactsState {
  return {
    activeFacts: [],
    nextFactIndex: 0,
  };
}

export function pickFact(state: FunFactsState): string {
  const fact = SNAKE_FACTS[state.nextFactIndex % SNAKE_FACTS.length];
  state.nextFactIndex++;
  return fact;
}

export function spawnFunFact(
  state: FunFactsState,
  canvasWidth: number,
  hue: number
): void {
  if (state.activeFacts.length >= MAX_ACTIVE_FACTS) {
    state.activeFacts.shift();
  }
  const text = pickFact(state);
  state.activeFacts.push({
    text,
    x: canvasWidth / 2,
    y: canvasWidth * 0.78,
    startY: canvasWidth * 0.78,
    age: 0,
    maxAge: FACT_LIFETIME,
    hue,
  });
}

export function updateFunFacts(state: FunFactsState): void {
  for (const fact of state.activeFacts) {
    fact.age++;
    fact.y = fact.startY - fact.age * FLOAT_SPEED;
  }
  state.activeFacts = state.activeFacts.filter(f => f.age < f.maxAge);
}

function factAlpha(fact: ActiveFact): number {
  if (fact.age < FADE_IN_FRAMES) {
    return fact.age / FADE_IN_FRAMES;
  }
  if (fact.age > FADE_OUT_START) {
    return 1 - (fact.age - FADE_OUT_START) / (fact.maxAge - FADE_OUT_START);
  }
  return 1;
}

export function drawFunFacts(
  g: Phaser.GameObjects.Graphics,
  state: FunFactsState,
  drawText: (
    g: Phaser.GameObjects.Graphics,
    text: string,
    x: number,
    y: number,
    size: number,
    color: number,
    alpha: number
  ) => void
): void {
  for (const fact of state.activeFacts) {
    const alpha = factAlpha(fact) * 0.85;
    if (alpha <= 0) continue;

    const size = 6;
    const charWidth = size * 0.6;
    const textWidth = fact.text.length * charWidth;
    const tx = fact.x - textWidth / 2;

    const color = hueToColor(fact.hue);
    const bgAlpha = alpha * 0.3;
    g.fillStyle(0x000000, bgAlpha);
    g.fillRect(tx - 4, fact.y - size / 2 - 2, textWidth + 8, size + 4);

    drawText(g, fact.text, tx, fact.y, size, color, alpha);
  }
}

function hueToColor(hue: number): number {
  const h = ((hue % 360) + 360) % 360;
  const s = 0.7;
  const l = 0.75;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  const ri = Math.round((r + m) * 255);
  const gi = Math.round((g + m) * 255);
  const bi = Math.round((b + m) * 255);
  return (ri << 16) | (gi << 8) | bi;
}

export function getSnakeFacts(): readonly string[] {
  return SNAKE_FACTS;
}
