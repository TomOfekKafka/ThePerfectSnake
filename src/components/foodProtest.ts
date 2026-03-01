export interface ProtestSign {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  life: number;
  scale: number;
  sloganIndex: number;
  stickHeight: number;
  wobblePhase: number;
  wobbleSpeed: number;
}

export interface FoodProtestState {
  signs: ProtestSign[];
}

const MAX_SIGNS = 24;

const SLOGANS = [
  'NO!',
  'UNFAIR!',
  'WHY?!',
  'STOP!',
  'HELP!',
  'RUDE!',
  'HEY!',
  'BOO!',
];

const SIGN_COLORS = [
  0xff4444,
  0xff8844,
  0xffcc44,
  0xff6666,
  0xffaa33,
  0xee5555,
];

const STICK_COLOR = 0x886644;
const SIGN_BG = 0xf0e8d0;
const SIGN_BORDER = 0x443322;

export const createFoodProtestState = (): FoodProtestState => ({
  signs: [],
});

export const spawnProtestSigns = (
  state: FoodProtestState,
  x: number,
  y: number,
  count: number
): void => {
  const signCount = Math.min(count, 8);
  for (let i = 0; i < signCount; i++) {
    if (state.signs.length >= MAX_SIGNS) {
      state.signs.shift();
    }
    const angle = (i / signCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    const speed = 1.2 + Math.random() * 1.8;
    state.signs.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.5,
      rotation: (Math.random() - 0.5) * 0.3,
      rotationSpeed: (Math.random() - 0.5) * 0.12,
      life: 1.0,
      scale: 0.0,
      sloganIndex: Math.floor(Math.random() * SLOGANS.length),
      stickHeight: 8 + Math.random() * 6,
      wobblePhase: Math.random() * Math.PI * 2,
      wobbleSpeed: 0.15 + Math.random() * 0.1,
    });
  }
};

export const updateFoodProtest = (state: FoodProtestState): void => {
  for (let i = state.signs.length - 1; i >= 0; i--) {
    const sign = state.signs[i];
    sign.vy += 0.04;
    sign.x += sign.vx;
    sign.y += sign.vy;
    sign.vx *= 0.985;
    sign.rotation += sign.rotationSpeed;
    sign.wobblePhase += sign.wobbleSpeed;
    sign.rotationSpeed += Math.sin(sign.wobblePhase) * 0.008;
    sign.life -= 0.016;
    sign.scale = Math.min(1.0, sign.scale + 0.15);

    if (sign.life <= 0) {
      state.signs.splice(i, 1);
    }
  }
};

const drawSignText = (
  g: Phaser.GameObjects.Graphics,
  drawLetter: (g: Phaser.GameObjects.Graphics, letter: string, x: number, y: number, size: number) => void,
  text: string,
  cx: number,
  cy: number,
  letterSize: number,
  color: number,
  alpha: number
): void => {
  const spacing = letterSize * 0.55;
  const totalWidth = text.length * spacing;
  let px = cx - totalWidth / 2;
  for (let i = 0; i < text.length; i++) {
    g.fillStyle(color, alpha);
    drawLetter(g, text[i], px, cy, letterSize);
    px += spacing;
  }
};

export const drawFoodProtest = (
  g: Phaser.GameObjects.Graphics,
  state: FoodProtestState,
  drawLetter: (g: Phaser.GameObjects.Graphics, letter: string, x: number, y: number, size: number) => void
): void => {
  for (const sign of state.signs) {
    const alpha = Math.min(1.0, sign.life * 2.5);
    const scale = sign.scale;
    const wobble = Math.sin(sign.wobblePhase) * 3 * sign.life;
    const sx = sign.x + wobble;
    const sy = sign.y;
    const slogan = SLOGANS[sign.sloganIndex];
    const letterSize = 5 * scale;
    const signW = (slogan.length * letterSize * 0.55 + 6) * scale;
    const signH = (letterSize + 6) * scale;
    const stickH = sign.stickHeight * scale;

    g.fillStyle(STICK_COLOR, alpha * 0.8);
    g.fillRect(sx - 0.5, sy, 1, stickH);

    const signCX = sx;
    const signCY = sy - signH / 2;

    g.fillStyle(SIGN_BG, alpha * 0.9);
    g.fillRoundedRect(signCX - signW / 2, signCY - signH / 2, signW, signH, 2);

    g.lineStyle(1, SIGN_BORDER, alpha * 0.6);
    g.strokeRoundedRect(signCX - signW / 2, signCY - signH / 2, signW, signH, 2);

    const textColor = SIGN_COLORS[sign.sloganIndex % SIGN_COLORS.length];
    if (letterSize > 1.5) {
      drawSignText(g, drawLetter, slogan, signCX, signCY, letterSize, textColor, alpha);
    }

    g.fillStyle(textColor, alpha * 0.15);
    g.fillCircle(sx, sy - signH, signW * 0.8);
  }
};
