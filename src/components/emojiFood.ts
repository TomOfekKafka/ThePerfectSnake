import Phaser from 'phaser';

const EMOJI_POOL = [
  '\u{1F355}', '\u{1F354}', '\u{1F352}', '\u{1F353}', '\u{1F34E}', '\u{1F34A}', '\u{1F34B}', '\u{1F349}',
  '\u{1F347}', '\u{1F351}', '\u{1F34C}', '\u{1F34D}', '\u{1F95D}', '\u{1F336}', '\u{1F33D}', '\u{1F346}',
  '\u{1F950}', '\u{1F35E}', '\u{1F369}', '\u{1F36A}', '\u{1F370}', '\u{1F382}', '\u{1F36B}', '\u{1F36D}',
  '\u{1F36E}', '\u{1F36F}', '\u{1F37F}', '\u{1F363}', '\u{1F364}', '\u{1F359}', '\u{1F35C}', '\u{1F35D}',
  '\u{1F32E}', '\u{1F32F}', '\u{1F373}', '\u{1F9C0}', '\u{1F37A}', '\u{1F377}', '\u{2615}',
  '\u{1F480}', '\u{1F47B}', '\u{1F47D}', '\u{1F916}', '\u{1F984}', '\u{1F409}', '\u{1F525}', '\u{2B50}',
  '\u{1F4A3}', '\u{1F48E}', '\u{1F451}', '\u{1F3AF}', '\u{1F3B2}', '\u{1F3B5}', '\u{26A1}', '\u{1F308}',
  '\u{1F680}', '\u{1F6F8}', '\u{1F30D}', '\u{1F319}', '\u{2604}', '\u{1F4AB}',
];

const GLOW_COLORS = [
  0xff4444, 0x44ff44, 0x4488ff, 0xffdd44, 0xff44ff, 0x44ffdd,
  0xff8844, 0x8844ff, 0x44ddff, 0xddff44, 0xff4488, 0x88ff44,
];

export interface EmojiFoodState {
  currentEmoji: string;
  glowColor: number;
  textObject: Phaser.GameObjects.Text | null;
}

export function createEmojiFoodState(): EmojiFoodState {
  const idx = Math.floor(Math.random() * EMOJI_POOL.length);
  return {
    currentEmoji: EMOJI_POOL[idx],
    glowColor: GLOW_COLORS[idx % GLOW_COLORS.length],
    textObject: null,
  };
}

export function advanceEmoji(state: EmojiFoodState): void {
  const idx = Math.floor(Math.random() * EMOJI_POOL.length);
  state.currentEmoji = EMOJI_POOL[idx];
  state.glowColor = GLOW_COLORS[idx % GLOW_COLORS.length];
  if (state.textObject) {
    state.textObject.setText(state.currentEmoji);
  }
}

export function drawEmojiFood(
  scene: Phaser.Scene,
  g: Phaser.GameObjects.Graphics,
  state: EmojiFoodState,
  foodX: number,
  foodY: number,
  cellSize: number,
  frameCount: number
): void {
  const hover = Math.sin(frameCount * 0.08) * 3;
  const floatY = foodY + hover;
  const pulse = 1.0 + Math.sin(frameCount * 0.1) * 0.1;
  const displaySize = cellSize * 1.6 * pulse;

  const shadowScale = 1.0 - hover / 20;
  const shadowAlpha = 0.3 * Math.max(0.3, shadowScale);
  g.fillStyle(0x000000, shadowAlpha);
  g.fillEllipse(foodX + 2, foodY + 8, displaySize * 0.5 * shadowScale, displaySize * 0.12 * shadowScale);

  const glowPulse = 0.2 + Math.sin(frameCount * 0.08) * 0.1;
  g.fillStyle(state.glowColor, glowPulse * 0.3);
  g.fillCircle(foodX, floatY, displaySize * 1.1);
  g.fillStyle(state.glowColor, glowPulse);
  g.fillCircle(foodX, floatY, displaySize * 0.7);

  const fontSize = Math.round(displaySize * 0.85);
  if (!state.textObject) {
    state.textObject = scene.add.text(foodX, floatY, state.currentEmoji, {
      fontSize: `${fontSize}px`,
      padding: { x: 2, y: 2 },
    });
    state.textObject.setOrigin(0.5, 0.5);
    state.textObject.setDepth(100);
  }

  state.textObject.setPosition(foodX, floatY);
  state.textObject.setFontSize(fontSize);
  state.textObject.setScale(pulse);
  state.textObject.setVisible(true);

  const spin = Math.sin(frameCount * 0.06) * 8;
  state.textObject.setAngle(spin);

  const angle = frameCount * 0.04;
  const sparkCount = 6;
  for (let i = 0; i < sparkCount; i++) {
    const a = angle + (i / sparkCount) * Math.PI * 2;
    const r = displaySize * 0.55 + Math.sin(frameCount * 0.12 + i) * 4;
    const sx = foodX + Math.cos(a) * r;
    const sy = floatY + Math.sin(a) * r;
    const sparkAlpha = 0.4 + Math.sin(frameCount * 0.15 + i * 1.5) * 0.3;
    g.fillStyle(state.glowColor, sparkAlpha);
    g.fillCircle(sx, sy, 2);
  }

  const ringAlpha = 0.25 + Math.sin(frameCount * 0.1) * 0.15;
  g.lineStyle(2, state.glowColor, ringAlpha);
  const ringRadius = displaySize * 0.7 + Math.sin(frameCount * 0.06) * 3;
  g.strokeCircle(foodX, floatY, ringRadius);
}

export function hideEmojiFood(state: EmojiFoodState): void {
  if (state.textObject) {
    state.textObject.setVisible(false);
  }
}
