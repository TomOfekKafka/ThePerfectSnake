import Phaser from 'phaser';
import { EfficiencyGrade, gradeToColor } from '../game/efficiencyMeter';

interface CodeParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  symbol: string;
  life: number;
  maxLife: number;
  size: number;
  color: number;
  alpha: number;
}

interface GradePulse {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  life: number;
  color: number;
}

export interface OptimizationState {
  particles: CodeParticle[];
  gradePulses: GradePulse[];
  meterGlow: number;
  lastGrade: EfficiencyGrade;
  gradeChangeTimer: number;
  barFillTarget: number;
  barFillCurrent: number;
}

const MAX_CODE_PARTICLES = 20;
const MAX_GRADE_PULSES = 3;

const CODE_SYMBOLS = [
  '{', '}', '()', '=>', '[]', '++', '&&', '||',
  '===', 'fn', '0x', '//', '**', '!=', '<>', '::'
];

export const createOptimizationState = (): OptimizationState => ({
  particles: [],
  gradePulses: [],
  meterGlow: 0,
  lastGrade: 'D',
  gradeChangeTimer: 0,
  barFillTarget: 0,
  barFillCurrent: 0,
});

export const spawnCodeParticle = (
  state: OptimizationState,
  x: number,
  y: number,
  grade: EfficiencyGrade
): void => {
  if (state.particles.length >= MAX_CODE_PARTICLES) {
    state.particles.shift();
  }
  const color = gradeToColor(grade);
  const symbol = CODE_SYMBOLS[Math.floor(Math.random() * CODE_SYMBOLS.length)];
  state.particles.push({
    x,
    y,
    vx: (Math.random() - 0.5) * 1.5,
    vy: -0.5 - Math.random() * 1.5,
    symbol,
    life: 1,
    maxLife: 60 + Math.floor(Math.random() * 40),
    size: 6 + Math.random() * 4,
    color,
    alpha: 0.8,
  });
};

export const spawnGradePulse = (
  state: OptimizationState,
  x: number,
  y: number,
  grade: EfficiencyGrade
): void => {
  if (state.gradePulses.length >= MAX_GRADE_PULSES) {
    state.gradePulses.shift();
  }
  state.gradePulses.push({
    x,
    y,
    radius: 4,
    maxRadius: 30 + (grade === 'S' ? 20 : 0),
    life: 1,
    color: gradeToColor(grade),
  });
};

export const updateOptimizationEffects = (
  state: OptimizationState,
  grade: EfficiencyGrade,
  ratio: number
): void => {
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy -= 0.01;
    p.life -= 1 / p.maxLife;
    p.alpha = p.life * 0.7;
    if (p.life <= 0) {
      state.particles.splice(i, 1);
    }
  }

  for (let i = state.gradePulses.length - 1; i >= 0; i--) {
    const pulse = state.gradePulses[i];
    pulse.radius += (pulse.maxRadius - pulse.radius) * 0.1;
    pulse.life -= 0.03;
    if (pulse.life <= 0) {
      state.gradePulses.splice(i, 1);
    }
  }

  if (grade !== state.lastGrade) {
    state.gradeChangeTimer = 30;
    state.lastGrade = grade;
  }
  if (state.gradeChangeTimer > 0) {
    state.gradeChangeTimer--;
  }

  state.meterGlow *= 0.95;

  const normalizedRatio = Math.min(1, ratio / 10);
  state.barFillTarget = normalizedRatio;
  state.barFillCurrent += (state.barFillTarget - state.barFillCurrent) * 0.08;
};

export const drawOptimizationMeter = (
  g: Phaser.GameObjects.Graphics,
  state: OptimizationState,
  grade: EfficiencyGrade,
  width: number,
  frameCount: number,
  drawDigit: (g: Phaser.GameObjects.Graphics, digit: string, x: number, y: number, size: number) => void
): void => {
  const barWidth = 80;
  const barHeight = 6;
  const barX = (width - barWidth) / 2;
  const barY = 12;

  const gradeColor = gradeToColor(grade);
  const pulse = 0.7 + Math.sin(frameCount * 0.06) * 0.15;

  g.fillStyle(0x0a0a1a, 0.8);
  g.fillRoundedRect(barX - 4, barY - 4, barWidth + 8, barHeight + 8, 4);

  g.lineStyle(1, gradeColor, pulse * 0.5);
  g.strokeRoundedRect(barX - 4, barY - 4, barWidth + 8, barHeight + 8, 4);

  g.fillStyle(0x111122, 0.9);
  g.fillRoundedRect(barX, barY, barWidth, barHeight, 3);

  const fillWidth = barWidth * state.barFillCurrent;
  if (fillWidth > 1) {
    g.fillStyle(gradeColor, pulse * 0.9);
    g.fillRoundedRect(barX, barY, fillWidth, barHeight, 3);

    g.fillStyle(0xffffff, pulse * 0.3);
    g.fillRoundedRect(barX, barY, fillWidth, barHeight / 2, 2);
  }

  const gradeX = barX + barWidth + 10;
  const gradeY = barY + barHeight / 2;
  g.fillStyle(gradeColor, pulse);
  drawDigit(g, grade === 'S' ? '5' : grade === 'A' ? '4' : grade === 'B' ? '8' : grade === 'C' ? '0' : '0', gradeX, gradeY, 10);

  for (const p of state.gradePulses) {
    g.lineStyle(2, p.color, p.life * 0.4);
    g.strokeCircle(p.x, p.y, p.radius);
  }
};

export const drawCodeParticles = (
  g: Phaser.GameObjects.Graphics,
  state: OptimizationState,
  drawLetter: (g: Phaser.GameObjects.Graphics, char: string, x: number, y: number, size: number) => void,
  drawDigit: (g: Phaser.GameObjects.Graphics, digit: string, x: number, y: number, size: number) => void
): void => {
  for (const p of state.particles) {
    g.fillStyle(p.color, p.alpha);
    for (const char of p.symbol) {
      if (char >= '0' && char <= '9') {
        drawDigit(g, char, p.x, p.y, p.size);
      } else {
        drawLetter(g, char, p.x, p.y, p.size);
      }
    }
  }
};
