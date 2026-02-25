import Phaser from 'phaser';

interface FunFact {
  category: string;
  text: string;
}

const FUN_FACTS: FunFact[] = [
  { category: 'SPACE', text: 'NEUTRON STARS SPIN 716 TIMES PER SECOND' },
  { category: 'SPACE', text: 'SATURN WOULD FLOAT IN A GIANT BATHTUB' },
  { category: 'SPACE', text: 'A DAY ON VENUS IS LONGER THAN ITS YEAR' },
  { category: 'SPACE', text: 'THERE ARE MORE STARS THAN GRAINS OF SAND' },
  { category: 'SPACE', text: 'THE SUN LOSES 4 MILLION TONS PER SECOND' },
  { category: 'OCEAN', text: 'THE OCEAN IS 95 PERCENT UNEXPLORED' },
  { category: 'OCEAN', text: 'JELLYFISH HAVE NO BRAIN HEART OR BLOOD' },
  { category: 'OCEAN', text: 'OCTOPUSES HAVE THREE HEARTS' },
  { category: 'OCEAN', text: 'CORAL REEFS ARE VISIBLE FROM SPACE' },
  { category: 'SCIENCE', text: 'HONEY NEVER SPOILS' },
  { category: 'SCIENCE', text: 'WATER CAN BOIL AND FREEZE AT ONCE' },
  { category: 'SCIENCE', text: 'LIGHT TAKES 8 MINUTES FROM SUN TO EARTH' },
  { category: 'SCIENCE', text: 'GLASS IS ACTUALLY A SLOW LIQUID' },
  { category: 'SCIENCE', text: 'A TEASPOON OF SOIL HAS MORE LIFE THAN PEOPLE ON EARTH' },
  { category: 'ANIMALS', text: 'CROWS CAN RECOGNIZE HUMAN FACES' },
  { category: 'ANIMALS', text: 'DOLPHINS SLEEP WITH ONE EYE OPEN' },
  { category: 'ANIMALS', text: 'A SHRIMP HEART IS IN ITS HEAD' },
  { category: 'ANIMALS', text: 'ELEPHANTS CANT JUMP' },
  { category: 'ANIMALS', text: 'SNAILS CAN SLEEP FOR THREE YEARS' },
  { category: 'ANIMALS', text: 'SLOTHS CAN HOLD BREATH 40 MINUTES' },
  { category: 'HISTORY', text: 'CLEOPATRA LIVED CLOSER TO IPHONES THAN PYRAMIDS' },
  { category: 'HISTORY', text: 'OXFORD UNIVERSITY IS OLDER THAN THE AZTECS' },
  { category: 'HISTORY', text: 'ANCIENT ROMANS USED URINE AS MOUTHWASH' },
  { category: 'HISTORY', text: 'KETCHUP WAS SOLD AS MEDICINE IN THE 1830S' },
  { category: 'BODY', text: 'YOUR NOSE CAN DETECT 1 TRILLION SCENTS' },
  { category: 'BODY', text: 'YOU MAKE 25000 QUARTS OF SPIT IN A LIFETIME' },
  { category: 'BODY', text: 'BONES ARE STRONGER THAN STEEL PER WEIGHT' },
  { category: 'BODY', text: 'YOUR BRAIN USES 20 PERCENT OF YOUR OXYGEN' },
  { category: 'EARTH', text: 'LIGHTNING STRIKES EARTH 100 TIMES PER SECOND' },
  { category: 'EARTH', text: 'THE EARTHS CORE IS AS HOT AS THE SUN' },
  { category: 'EARTH', text: 'RAIN HAS FALLEN ON OTHER PLANETS' },
  { category: 'EARTH', text: 'THERE ARE MOUNTAINS TALLER THAN EVEREST UNDERWATER' },
  { category: 'SNAKES', text: 'SNAKES SMELL WITH THEIR TONGUES' },
  { category: 'SNAKES', text: 'KING COBRA CAN GROW TO 18 FEET' },
  { category: 'SNAKES', text: 'FLYING SNAKES GLIDE 30 FEET THROUGH AIR' },
  { category: 'SNAKES', text: 'ANACONDA CAN WEIGH OVER 550 POUNDS' },
  { category: 'MATH', text: '111111111 X 111111111 = 12345678987654321' },
  { category: 'MATH', text: 'A PIZZA WITH RADIUS Z AND HEIGHT A HAS VOLUME PI Z Z A' },
  { category: 'MATH', text: 'THERE ARE MORE WAYS TO SHUFFLE CARDS THAN ATOMS ON EARTH' },
  { category: 'TECH', text: 'THE FIRST COMPUTER BUG WAS AN ACTUAL BUG' },
  { category: 'TECH', text: 'THE FIRST WEBSITE IS STILL ONLINE' },
  { category: 'TECH', text: 'MORE PEOPLE HAVE PHONES THAN TOILETS' },
];

const CATEGORY_HUES: Record<string, number> = {
  SPACE: 260,
  OCEAN: 200,
  SCIENCE: 50,
  ANIMALS: 120,
  HISTORY: 30,
  BODY: 340,
  EARTH: 160,
  SNAKES: 90,
  MATH: 280,
  TECH: 180,
};

const MAX_ACTIVE_FACTS = 1;
const FACT_LIFETIME = 200;
const FLOAT_SPEED = 0.15;
const FADE_IN_FRAMES = 25;
const FADE_OUT_START = 160;
const TYPEWRITER_SPEED = 2;

const CATEGORY_FONT_SIZE = 6;
const TEXT_FONT_SIZE = 8;
const MAX_LINE_CHARS = 28;
const LINE_SPACING = 3;
const BG_PADDING = 10;
const SHADOW_OFFSET = 1;

export interface ActiveFact {
  text: string;
  category: string;
  x: number;
  y: number;
  startY: number;
  age: number;
  maxAge: number;
  hue: number;
  revealedChars: number;
  lines: string[];
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

export function pickFact(state: FunFactsState): FunFact {
  const fact = FUN_FACTS[state.nextFactIndex % FUN_FACTS.length];
  state.nextFactIndex++;
  return fact;
}

export function wrapText(text: string, maxChars: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let current = '';
  for (const word of words) {
    const candidate = current.length === 0 ? word : `${current} ${word}`;
    if (candidate.length > maxChars && current.length > 0) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current.length > 0) {
    lines.push(current);
  }
  return lines;
}

export function spawnFunFact(
  state: FunFactsState,
  canvasWidth: number,
  _hue: number
): void {
  if (state.activeFacts.length >= MAX_ACTIVE_FACTS) {
    state.activeFacts.shift();
  }
  const fact = pickFact(state);
  const categoryHue = CATEGORY_HUES[fact.category] ?? _hue;
  const lines = wrapText(fact.text, MAX_LINE_CHARS);
  state.activeFacts.push({
    text: fact.text,
    category: fact.category,
    x: canvasWidth / 2,
    y: canvasWidth * 0.78,
    startY: canvasWidth * 0.78,
    age: 0,
    maxAge: FACT_LIFETIME,
    hue: categoryHue,
    revealedChars: 0,
    lines,
  });
}

export function updateFunFacts(state: FunFactsState): void {
  for (const fact of state.activeFacts) {
    fact.age++;
    fact.y = fact.startY - fact.age * FLOAT_SPEED;
    const maxChars = fact.text.length;
    fact.revealedChars = Math.min(maxChars, Math.floor(fact.age * TYPEWRITER_SPEED));
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

function revealedLines(fact: ActiveFact): string[] {
  let charsLeft = fact.revealedChars;
  const result: string[] = [];
  for (const line of fact.lines) {
    if (charsLeft <= 0) break;
    const lineCharsAvailable = Math.min(line.length, charsLeft);
    result.push(line.slice(0, lineCharsAvailable));
    charsLeft -= line.length;
    if (charsLeft > 0) charsLeft--;
  }
  return result;
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
    const alpha = factAlpha(fact) * 0.95;
    if (alpha <= 0) continue;

    const catCharWidth = CATEGORY_FONT_SIZE * 0.7;
    const textCharWidth = TEXT_FONT_SIZE * 0.7;
    const catLabel = `[ ${fact.category} ]`;
    const catWidth = catLabel.length * catCharWidth;

    const visLines = revealedLines(fact);
    const allLineWidths = fact.lines.map(l => l.length * textCharWidth);
    const maxLineWidth = Math.max(...allLineWidths, catWidth);

    const totalTextHeight =
      fact.lines.length * TEXT_FONT_SIZE +
      (fact.lines.length - 1) * LINE_SPACING;

    const catY = fact.y;
    const firstLineY = catY + CATEGORY_FONT_SIZE + 6;

    const bgX = fact.x - maxLineWidth / 2 - BG_PADDING;
    const bgW = maxLineWidth + BG_PADDING * 2;
    const bgY = catY - CATEGORY_FONT_SIZE / 2 - BG_PADDING;
    const bgH = CATEGORY_FONT_SIZE + 6 + totalTextHeight + BG_PADDING * 2;

    const borderColor = hueToColor(fact.hue);

    g.fillStyle(0x000000, alpha * 0.75);
    g.fillRoundedRect(bgX, bgY, bgW, bgH, 4);

    g.lineStyle(2, borderColor, alpha * 0.8);
    g.strokeRoundedRect(bgX, bgY, bgW, bgH, 4);

    const catX = fact.x - catWidth / 2;
    const catColor = hueToColor(fact.hue);
    drawText(g, catLabel, catX + SHADOW_OFFSET, catY + SHADOW_OFFSET, CATEGORY_FONT_SIZE, 0x000000, alpha * 0.5);
    drawText(g, catLabel, catX, catY, CATEGORY_FONT_SIZE, catColor, alpha * 0.9);

    for (let i = 0; i < visLines.length; i++) {
      const line = visLines[i];
      const lineY = firstLineY + i * (TEXT_FONT_SIZE + LINE_SPACING);
      const lineWidth = line.length * textCharWidth;
      const lineX = fact.x - lineWidth / 2;

      drawText(g, line, lineX + SHADOW_OFFSET, lineY + SHADOW_OFFSET, TEXT_FONT_SIZE, 0x000000, alpha * 0.6);
      drawText(g, line, lineX, lineY, TEXT_FONT_SIZE, 0xffffff, alpha);
    }

    if (fact.revealedChars < fact.text.length && fact.age % 6 < 3) {
      const lastLineIdx = visLines.length - 1;
      if (lastLineIdx >= 0) {
        const lastLine = visLines[lastLineIdx];
        const lastLineY = firstLineY + lastLineIdx * (TEXT_FONT_SIZE + LINE_SPACING);
        const lastLineWidth = lastLine.length * textCharWidth;
        const lastLineX = fact.x - lastLineWidth / 2;
        const cursorX = lastLineX + lastLine.length * textCharWidth;
        g.fillStyle(0xffffff, alpha * 0.9);
        g.fillRect(cursorX, lastLineY - TEXT_FONT_SIZE / 2, textCharWidth * 0.6, TEXT_FONT_SIZE);
      }
    }
  }
}

export function hueToColor(hue: number): number {
  const h = ((hue % 360) + 360) % 360;
  const s = 0.7;
  const l = 0.75;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h / 60) % 2 - 1));
  const m = l - c / 2;
  let r = 0, gb = 0, b = 0;
  if (h < 60) { r = c; gb = x; }
  else if (h < 120) { r = x; gb = c; }
  else if (h < 180) { gb = c; b = x; }
  else if (h < 240) { gb = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  const ri = Math.round((r + m) * 255);
  const gi = Math.round((gb + m) * 255);
  const bi = Math.round((b + m) * 255);
  return (ri << 16) | (gi << 8) | bi;
}

export function getFunFacts(): readonly FunFact[] {
  return FUN_FACTS;
}

export function getSnakeFacts(): readonly string[] {
  return FUN_FACTS.filter(f => f.category === 'SNAKES').map(f => f.text);
}
