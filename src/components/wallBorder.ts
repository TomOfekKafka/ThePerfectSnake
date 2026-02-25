import Phaser from 'phaser';
import { THEME } from './gameTheme';

export interface WallSpark {
  x: number;
  y: number;
  life: number;
  speed: number;
  angle: number;
}

export interface WallBorderState {
  sparks: WallSpark[];
  pulsePhase: number;
}

const MAX_SPARKS = 12;
const SPARK_SPAWN_RATE = 0.15;
const WALL_THICKNESS = 4;

export const createWallBorderState = (): WallBorderState => ({
  sparks: [],
  pulsePhase: 0,
});

const spawnSpark = (width: number, height: number): WallSpark => {
  const side = Math.floor(Math.random() * 4);
  let x: number, y: number;
  switch (side) {
    case 0: x = Math.random() * width; y = 0; break;
    case 1: x = Math.random() * width; y = height; break;
    case 2: x = 0; y = Math.random() * height; break;
    default: x = width; y = Math.random() * height; break;
  }
  return {
    x, y,
    life: 1,
    speed: 0.3 + Math.random() * 0.5,
    angle: Math.random() * Math.PI * 2,
  };
};

export const updateWallBorder = (state: WallBorderState, width: number, height: number): void => {
  state.pulsePhase += 0.04;

  for (let i = state.sparks.length - 1; i >= 0; i--) {
    const s = state.sparks[i];
    s.life -= 0.025;
    s.x += Math.cos(s.angle) * s.speed;
    s.y += Math.sin(s.angle) * s.speed;
    if (s.life <= 0) {
      state.sparks.splice(i, 1);
    }
  }

  if (state.sparks.length < MAX_SPARKS && Math.random() < SPARK_SPAWN_RATE) {
    state.sparks.push(spawnSpark(width, height));
  }
};

export const drawWallBorder = (
  g: Phaser.GameObjects.Graphics,
  state: WallBorderState,
  width: number,
  height: number,
  frameCount: number
): void => {
  const pulse = 0.6 + Math.sin(state.pulsePhase) * 0.3;
  const dangerColor = THEME.wall.glow;
  const warningColor = THEME.wall.highlight;
  const coreColor = THEME.wall.core;

  g.fillStyle(coreColor, 0.7 * pulse);
  g.fillRect(0, 0, width, WALL_THICKNESS);
  g.fillRect(0, height - WALL_THICKNESS, width, WALL_THICKNESS);
  g.fillRect(0, 0, WALL_THICKNESS, height);
  g.fillRect(width - WALL_THICKNESS, 0, WALL_THICKNESS, height);

  g.fillStyle(dangerColor, 0.4 * pulse);
  g.fillRect(0, 0, width, WALL_THICKNESS + 2);
  g.fillRect(0, height - WALL_THICKNESS - 2, width, WALL_THICKNESS + 2);
  g.fillRect(0, 0, WALL_THICKNESS + 2, height);
  g.fillRect(width - WALL_THICKNESS - 2, 0, WALL_THICKNESS + 2, height);

  const glowAlpha = 0.15 * pulse;
  g.fillStyle(warningColor, glowAlpha);
  g.fillRect(0, 0, width, WALL_THICKNESS + 6);
  g.fillRect(0, height - WALL_THICKNESS - 6, width, WALL_THICKNESS + 6);
  g.fillRect(0, 0, WALL_THICKNESS + 6, height);
  g.fillRect(width - WALL_THICKNESS - 6, 0, WALL_THICKNESS + 6, height);

  const segmentCount = 20;
  const segW = width / segmentCount;
  const segH = height / segmentCount;
  const warnPhase = frameCount * 0.08;

  for (let i = 0; i < segmentCount; i++) {
    const flash = Math.sin(warnPhase + i * 0.6) > 0.3 ? 0.9 : 0.3;
    g.fillStyle(dangerColor, flash * pulse);
    g.fillRect(i * segW, 0, segW * 0.4, WALL_THICKNESS);
    g.fillRect(i * segW, height - WALL_THICKNESS, segW * 0.4, WALL_THICKNESS);
  }
  for (let i = 0; i < segmentCount; i++) {
    const flash = Math.sin(warnPhase + i * 0.6 + 1) > 0.3 ? 0.9 : 0.3;
    g.fillStyle(dangerColor, flash * pulse);
    g.fillRect(0, i * segH, WALL_THICKNESS, segH * 0.4);
    g.fillRect(width - WALL_THICKNESS, i * segH, WALL_THICKNESS, segH * 0.4);
  }

  for (const spark of state.sparks) {
    const alpha = spark.life * 0.8;
    const size = 2 + spark.life * 3;
    g.fillStyle(THEME.wall.spark, alpha);
    g.fillCircle(spark.x, spark.y, size);
    g.fillStyle(0xffffff, alpha * 0.5);
    g.fillCircle(spark.x, spark.y, size * 0.5);
  }

  const cornerSize = 10;
  const cornerAlpha = 0.8 * pulse;
  g.fillStyle(THEME.wall.corner, cornerAlpha);
  g.fillRect(0, 0, cornerSize, cornerSize);
  g.fillRect(width - cornerSize, 0, cornerSize, cornerSize);
  g.fillRect(0, height - cornerSize, cornerSize, cornerSize);
  g.fillRect(width - cornerSize, height - cornerSize, cornerSize, cornerSize);

  g.fillStyle(0xffffff, cornerAlpha * 0.4);
  g.fillRect(1, 1, cornerSize - 2, cornerSize - 2);
  g.fillRect(width - cornerSize + 1, 1, cornerSize - 2, cornerSize - 2);
  g.fillRect(1, height - cornerSize + 1, cornerSize - 2, cornerSize - 2);
  g.fillRect(width - cornerSize + 1, height - cornerSize + 1, cornerSize - 2, cornerSize - 2);
};
