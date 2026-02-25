import Phaser from 'phaser';

export interface WandSparkle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: number;
}

export interface SnitchWing {
  angle: number;
  flapSpeed: number;
  flapPhase: number;
}

export interface SpellText {
  text: string;
  x: number;
  y: number;
  startY: number;
  age: number;
  maxAge: number;
  color: number;
}

export interface WizardEffectsState {
  wandSparkles: WandSparkle[];
  snitchWings: SnitchWing;
  spellTexts: SpellText[];
  nextSpellIndex: number;
  houseIndex: number;
}

const MAX_WAND_SPARKLES = 30;
const SPARKLE_LIFETIME = 40;
const MAX_SPELL_TEXTS = 2;
const SPELL_TEXT_LIFETIME = 160;
const SPELL_FLOAT_SPEED = 0.35;
const SPELL_FADE_IN = 15;
const SPELL_FADE_OUT_START = 120;

const HOUSE_COLORS: { primary: number; secondary: number }[] = [
  { primary: 0xae0001, secondary: 0xd3a625 },
  { primary: 0x1a472a, secondary: 0xaaaaaa },
  { primary: 0x0e1a40, secondary: 0x946b2d },
  { primary: 0xecb939, secondary: 0x372e29 },
];

const SPARKLE_COLORS = [0xffd700, 0xffec80, 0xfff8dc, 0xffe066, 0xfffacd];

const SPELLS: string[] = [
  'LUMOS',
  'EXPECTO PATRONUM',
  'WINGARDIUM LEVIOSA',
  'EXPELLIARMUS',
  'ACCIO',
  'STUPEFY',
  'PROTEGO',
  'RIDDIKULUS',
  'OBLIVIATE',
  'ALOHOMORA',
  'PETRIFICUS TOTALUS',
  'SECTUMSEMPRA',
  'AGUAMENTI',
  'LEVICORPUS',
  'NOXLUMOSIO',
  'SERPENSORTIA',
  'PRIOR INCANTATO',
  'FINITE INCANTATEM',
  'MISCHIEF MANAGED',
  'I SOLEMNLY SWEAR',
];

export function createWizardEffectsState(): WizardEffectsState {
  return {
    wandSparkles: [],
    snitchWings: { angle: 0, flapSpeed: 0.3, flapPhase: 0 },
    spellTexts: [],
    nextSpellIndex: 0,
    houseIndex: 0,
  };
}

export function spawnWandSparkles(
  state: WizardEffectsState,
  x: number,
  y: number,
  count: number
): void {
  for (let i = 0; i < count; i++) {
    if (state.wandSparkles.length >= MAX_WAND_SPARKLES) {
      state.wandSparkles.shift();
    }
    const angle = Math.random() * Math.PI * 2;
    const speed = 0.3 + Math.random() * 0.8;
    const life = SPARKLE_LIFETIME * (0.5 + Math.random() * 0.5);
    state.wandSparkles.push({
      x: x + (Math.random() - 0.5) * 6,
      y: y + (Math.random() - 0.5) * 6,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.3,
      size: 1 + Math.random() * 2.5,
      life,
      maxLife: life,
      color: SPARKLE_COLORS[Math.floor(Math.random() * SPARKLE_COLORS.length)],
    });
  }
}

export function updateWandSparkles(state: WizardEffectsState): void {
  for (let i = state.wandSparkles.length - 1; i >= 0; i--) {
    const s = state.wandSparkles[i];
    s.x += s.vx;
    s.y += s.vy;
    s.vy -= 0.01;
    s.vx *= 0.97;
    s.size *= 0.98;
    s.life--;
    if (s.life <= 0 || s.size < 0.3) {
      state.wandSparkles.splice(i, 1);
    }
  }
}

export function drawWandSparkles(
  g: Phaser.GameObjects.Graphics,
  state: WizardEffectsState
): void {
  for (const s of state.wandSparkles) {
    const alpha = Math.min(1, s.life / s.maxLife * 1.5);
    g.fillStyle(s.color, alpha * 0.3);
    g.fillCircle(s.x, s.y, s.size * 2.5);
    g.fillStyle(s.color, alpha * 0.7);
    g.fillCircle(s.x, s.y, s.size);
    g.fillStyle(0xffffff, alpha * 0.9);
    g.fillCircle(s.x, s.y, s.size * 0.4);
  }
}

export function updateSnitchWings(state: WizardEffectsState): void {
  state.snitchWings.flapPhase += state.snitchWings.flapSpeed;
}

export function drawSnitchWings(
  g: Phaser.GameObjects.Graphics,
  state: WizardEffectsState,
  foodX: number,
  foodY: number,
  cellSize: number
): void {
  const flap = Math.sin(state.snitchWings.flapPhase);
  const wingSpan = cellSize * 0.55;
  const wingH = cellSize * 0.2;
  const flapAngle = flap * 0.5;

  const wingAlpha = 0.6 + Math.abs(flap) * 0.3;

  drawSingleWing(g, foodX - cellSize * 0.45, foodY - 2, wingSpan, wingH, flapAngle, wingAlpha, true);
  drawSingleWing(g, foodX + cellSize * 0.45, foodY - 2, wingSpan, wingH, -flapAngle, wingAlpha, false);
}

function drawSingleWing(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  span: number,
  height: number,
  flapAngle: number,
  alpha: number,
  isLeft: boolean
): void {
  const dir = isLeft ? -1 : 1;
  const tipX = x + dir * span * Math.cos(flapAngle);
  const tipY = y - span * Math.sin(Math.abs(flapAngle)) * 0.6;

  g.fillStyle(0xffd700, alpha * 0.15);
  g.fillTriangle(x, y - height, tipX, tipY - height * 0.3, x, y + height);

  g.fillStyle(0xffd700, alpha * 0.5);
  g.fillTriangle(x, y - height * 0.5, tipX, tipY, x, y + height * 0.5);

  g.fillStyle(0xffec80, alpha * 0.3);
  g.fillTriangle(x, y - height * 0.3, tipX * 0.6 + x * 0.4, tipY * 0.6 + y * 0.4, x, y + height * 0.1);
}

export function spawnSpellText(
  state: WizardEffectsState,
  canvasWidth: number
): void {
  if (state.spellTexts.length >= MAX_SPELL_TEXTS) {
    state.spellTexts.shift();
  }
  const spell = SPELLS[state.nextSpellIndex % SPELLS.length];
  state.nextSpellIndex++;
  const houseColor = HOUSE_COLORS[state.houseIndex % HOUSE_COLORS.length];
  state.houseIndex++;

  state.spellTexts.push({
    text: spell,
    x: canvasWidth / 2,
    y: canvasWidth * 0.78,
    startY: canvasWidth * 0.78,
    age: 0,
    maxAge: SPELL_TEXT_LIFETIME,
    color: houseColor.secondary,
  });
}

export function updateSpellTexts(state: WizardEffectsState): void {
  for (const st of state.spellTexts) {
    st.age++;
    st.y = st.startY - st.age * SPELL_FLOAT_SPEED;
  }
  state.spellTexts = state.spellTexts.filter(s => s.age < s.maxAge);
}

function spellTextAlpha(spell: SpellText): number {
  if (spell.age < SPELL_FADE_IN) {
    return spell.age / SPELL_FADE_IN;
  }
  if (spell.age > SPELL_FADE_OUT_START) {
    return 1 - (spell.age - SPELL_FADE_OUT_START) / (spell.maxAge - SPELL_FADE_OUT_START);
  }
  return 1;
}

export function drawSpellTexts(
  g: Phaser.GameObjects.Graphics,
  state: WizardEffectsState,
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
  for (const spell of state.spellTexts) {
    const alpha = spellTextAlpha(spell) * 0.9;
    if (alpha <= 0) continue;

    const size = 7;
    const charWidth = size * 0.7;
    const textWidth = spell.text.length * charWidth;
    const tx = spell.x - textWidth / 2;

    g.fillStyle(0x000000, alpha * 0.35);
    g.fillRect(tx - 4, spell.y - size / 2 - 2, textWidth + 8, size + 4);

    drawText(g, spell.text, tx, spell.y, size, spell.color, alpha);
  }
}

export function getHouseColors(
  segmentIndex: number,
  snakeLength: number
): { base: number; highlight: number; edge: number } {
  const houseIdx = Math.floor(segmentIndex / 3) % HOUSE_COLORS.length;
  const house = HOUSE_COLORS[houseIdx];
  const t = snakeLength > 1 ? segmentIndex / (snakeLength - 1) : 0;

  const pr = (house.primary >> 16) & 0xff;
  const pg = (house.primary >> 8) & 0xff;
  const pb = house.primary & 0xff;

  const sr = (house.secondary >> 16) & 0xff;
  const sg = (house.secondary >> 8) & 0xff;
  const sb = house.secondary & 0xff;

  const blend = 0.6 + (1 - t) * 0.4;
  const r = Math.round(pr * blend);
  const gv = Math.round(pg * blend);
  const b = Math.round(pb * blend);

  const hr = Math.round(sr * blend);
  const hg = Math.round(sg * blend);
  const hb = Math.round(sb * blend);

  const er = Math.round(pr * blend * 0.5);
  const eg = Math.round(pg * blend * 0.5);
  const eb = Math.round(pb * blend * 0.5);

  return {
    base: (Math.min(0xff, r) << 16) | (Math.min(0xff, gv) << 8) | Math.min(0xff, b),
    highlight: (Math.min(0xff, hr) << 16) | (Math.min(0xff, hg) << 8) | Math.min(0xff, hb),
    edge: (Math.min(0xff, er) << 16) | (Math.min(0xff, eg) << 8) | Math.min(0xff, eb),
  };
}

export function getSpells(): readonly string[] {
  return SPELLS;
}

export function getHouseColorList(): readonly { primary: number; secondary: number }[] {
  return HOUSE_COLORS;
}
