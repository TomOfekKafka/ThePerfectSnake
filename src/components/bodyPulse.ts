import Phaser from 'phaser';
import { getFireColors } from './fireColors';

export interface BodyPulseState {
  phase: number;
  waves: PulseWave[];
  sparks: PulseSpark[];
}

interface PulseWave {
  position: number;
  speed: number;
  intensity: number;
  hueShift: number;
}

interface PulseSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  hue: number;
}

const MAX_WAVES = 4;
const MAX_SPARKS = 30;
const WAVE_SPEED = 0.035;
const SPARK_LIFETIME = 28;

export function createBodyPulseState(): BodyPulseState {
  return {
    phase: 0,
    waves: [
      { position: 0, speed: WAVE_SPEED, intensity: 1.0, hueShift: 0 },
      { position: 0.5, speed: WAVE_SPEED * 0.8, intensity: 0.7, hueShift: 40 },
    ],
    sparks: [],
  };
}

function spawnSpark(
  state: BodyPulseState,
  x: number,
  y: number,
  hue: number
): void {
  if (state.sparks.length >= MAX_SPARKS) {
    state.sparks.shift();
  }
  const angle = Math.random() * Math.PI * 2;
  const speed = 0.3 + Math.random() * 0.8;
  const life = SPARK_LIFETIME * (0.4 + Math.random() * 0.6);
  state.sparks.push({
    x: x + (Math.random() - 0.5) * 6,
    y: y + (Math.random() - 0.5) * 6,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed - 0.3,
    size: 1.0 + Math.random() * 2.0,
    life,
    maxLife: life,
    hue,
  });
}

export function updateBodyPulse(
  state: BodyPulseState,
  snake: { x: number; y: number }[],
  cellSize: number,
  frameCount: number
): void {
  state.phase = frameCount;

  for (const wave of state.waves) {
    wave.position += wave.speed;
    if (wave.position > 1.5) {
      wave.position = -0.3;
      wave.hueShift = Math.random() * 60 - 30;
    }
  }

  if (state.waves.length < MAX_WAVES && frameCount % 90 === 0) {
    state.waves.push({
      position: -0.2,
      speed: WAVE_SPEED * (0.7 + Math.random() * 0.6),
      intensity: 0.5 + Math.random() * 0.5,
      hueShift: Math.random() * 60 - 30,
    });
    if (state.waves.length > MAX_WAVES) {
      state.waves.shift();
    }
  }

  const len = snake.length;
  if (len > 1) {
    for (const wave of state.waves) {
      const segIdx = Math.floor(wave.position * (len - 1));
      if (segIdx >= 0 && segIdx < len && Math.random() < 0.3 * wave.intensity) {
        const seg = snake[segIdx];
        const sx = seg.x * cellSize + cellSize / 2;
        const sy = seg.y * cellSize + cellSize / 2;
        spawnSpark(state, sx, sy, 270 + wave.hueShift);
      }
    }
  }

  for (let i = state.sparks.length - 1; i >= 0; i--) {
    const s = state.sparks[i];
    s.x += s.vx;
    s.y += s.vy;
    s.vx *= 0.95;
    s.vy *= 0.95;
    s.vy -= 0.01;
    s.size *= 0.97;
    s.life--;
    if (s.life <= 0 || s.size < 0.2) {
      state.sparks.splice(i, 1);
    }
  }
}

function waveInfluence(wavePos: number, segProgress: number): number {
  const dist = Math.abs(segProgress - wavePos);
  const width = 0.15;
  if (dist > width) return 0;
  return Math.cos((dist / width) * Math.PI * 0.5);
}

export function drawBodyPulse(
  g: Phaser.GameObjects.Graphics,
  state: BodyPulseState,
  snake: { x: number; y: number }[],
  cellSize: number,
  frameCount: number
): void {
  const len = snake.length;
  if (len < 2) return;

  for (let i = 0; i < len; i++) {
    const seg = snake[i];
    const sx = seg.x * cellSize + cellSize / 2;
    const sy = seg.y * cellSize + cellSize / 2;
    const segProgress = i / (len - 1);

    let totalInfluence = 0;
    let bestHueShift = 0;
    for (const wave of state.waves) {
      const inf = waveInfluence(wave.position, segProgress) * wave.intensity;
      if (inf > totalInfluence) {
        bestHueShift = wave.hueShift;
      }
      totalInfluence = Math.max(totalInfluence, inf);
    }

    if (totalInfluence < 0.01) continue;

    const colors = getFireColors(i, len);
    const pulse = 0.6 + Math.sin(frameCount * 0.12 + segProgress * 8) * 0.4;
    const glowAlpha = totalInfluence * 0.5 * pulse;
    const glowSize = cellSize * (0.7 + totalInfluence * 0.6);

    g.fillStyle(colors.base, glowAlpha * 0.2);
    g.fillCircle(sx, sy, glowSize * 1.6);

    g.fillStyle(colors.highlight, glowAlpha * 0.4);
    g.fillCircle(sx, sy, glowSize);

    const coreAlpha = glowAlpha * 0.6;
    g.fillStyle(0xffeeff, coreAlpha);
    g.fillCircle(sx, sy, glowSize * 0.4);
  }

  for (const s of state.sparks) {
    const t = s.life / s.maxLife;
    const alpha = t * 0.8;

    g.fillStyle(0xcc55ee, alpha * 0.3);
    g.fillCircle(s.x, s.y, s.size * 2.5);

    g.fillStyle(0xeeaaff, alpha * 0.6);
    g.fillCircle(s.x, s.y, s.size * 1.2);

    if (t > 0.3) {
      g.fillStyle(0xffeeff, alpha * 0.4);
      g.fillCircle(s.x, s.y, s.size * 0.4);
    }
  }
}
