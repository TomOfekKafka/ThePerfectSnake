import Phaser from 'phaser';
import { THEME } from './gameTheme';

export interface MilestoneState {
  celebrations: MilestoneCelebration[];
  lastMilestoneScore: number;
  fireworks: Firework[];
  bannerText: string;
  bannerAlpha: number;
  bannerScale: number;
  bannerY: number;
}

interface MilestoneCelebration {
  score: number;
  phase: number;
  rings: CelebrationRing[];
}

interface CelebrationRing {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  color: number;
  thickness: number;
}

interface Firework {
  x: number;
  y: number;
  sparks: FireworkSpark[];
  phase: number;
  color: number;
}

interface FireworkSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  trail: { x: number; y: number; alpha: number }[];
}

const MILESTONES = [50, 100, 150, 200, 300, 500];
const MAX_FIREWORKS = 5;
const SPARKS_PER_FIREWORK = 16;

const MILESTONE_LABELS: Record<number, string> = {
  50: 'NICE',
  100: 'GREAT',
  150: 'AMAZING',
  200: 'LEGENDARY',
  300: 'GODLIKE',
  500: 'TRANSCENDENT',
};

const MILESTONE_COLORS: Record<number, number> = {
  50: THEME.snake.glow,
  100: THEME.food.body,
  150: 0xff6644,
  200: 0xff44ff,
  300: 0x44ffff,
  500: 0xffffff,
};

export function createMilestoneState(): MilestoneState {
  return {
    celebrations: [],
    lastMilestoneScore: 0,
    fireworks: [],
    bannerText: '',
    bannerAlpha: 0,
    bannerScale: 0,
    bannerY: 0,
  };
}

export function checkMilestone(state: MilestoneState, score: number, width: number, height: number): void {
  for (const threshold of MILESTONES) {
    if (score >= threshold && state.lastMilestoneScore < threshold) {
      state.lastMilestoneScore = threshold;
      triggerCelebration(state, threshold, width, height);
    }
  }
}

function triggerCelebration(state: MilestoneState, score: number, width: number, height: number): void {
  const cx = width / 2;
  const cy = height / 2;
  const color = MILESTONE_COLORS[score] || THEME.snake.glow;

  state.celebrations.push({
    score,
    phase: 0,
    rings: [
      { x: cx, y: cy, radius: 5, alpha: 0.9, color, thickness: 4 },
      { x: cx, y: cy, radius: 3, alpha: 0.7, color: 0xffffff, thickness: 2 },
    ],
  });

  state.bannerText = MILESTONE_LABELS[score] || `${score}`;
  state.bannerAlpha = 1;
  state.bannerScale = 2.5;
  state.bannerY = cy - 20;

  const fireworkCount = Math.min(MAX_FIREWORKS, Math.floor(score / 100) + 2);
  for (let i = 0; i < fireworkCount; i++) {
    const fx = 40 + Math.random() * (width - 80);
    const fy = 40 + Math.random() * (height * 0.5);
    spawnFirework(state, fx, fy, color);
  }
}

function spawnFirework(state: MilestoneState, x: number, y: number, color: number): void {
  if (state.fireworks.length >= MAX_FIREWORKS) {
    state.fireworks.shift();
  }

  const sparks: FireworkSpark[] = [];
  for (let i = 0; i < SPARKS_PER_FIREWORK; i++) {
    const angle = (i / SPARKS_PER_FIREWORK) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
    const speed = 2 + Math.random() * 3;
    sparks.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1,
      alpha: 1,
      size: 1.5 + Math.random() * 2,
      trail: [],
    });
  }

  state.fireworks.push({ x, y, sparks, phase: 0, color });
}

export function updateMilestones(state: MilestoneState): void {
  for (let i = state.celebrations.length - 1; i >= 0; i--) {
    const c = state.celebrations[i];
    c.phase += 0.02;
    for (const ring of c.rings) {
      ring.radius += 2.5;
      ring.alpha *= 0.96;
      ring.thickness *= 0.98;
    }
    c.rings = c.rings.filter(r => r.alpha > 0.01);
    if (c.rings.length === 0) {
      state.celebrations.splice(i, 1);
    }
  }

  for (let i = state.fireworks.length - 1; i >= 0; i--) {
    const fw = state.fireworks[i];
    fw.phase += 0.02;
    for (let j = fw.sparks.length - 1; j >= 0; j--) {
      const s = fw.sparks[j];
      s.trail.unshift({ x: s.x, y: s.y, alpha: s.alpha * 0.5 });
      if (s.trail.length > 6) s.trail.pop();
      for (const t of s.trail) t.alpha *= 0.85;

      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.06;
      s.vx *= 0.98;
      s.alpha *= 0.97;
      if (s.alpha < 0.01) {
        fw.sparks.splice(j, 1);
      }
    }
    if (fw.sparks.length === 0) {
      state.fireworks.splice(i, 1);
    }
  }

  if (state.bannerAlpha > 0) {
    state.bannerAlpha *= 0.985;
    state.bannerScale += (1 - state.bannerScale) * 0.08;
    state.bannerY -= 0.3;
    if (state.bannerAlpha < 0.01) {
      state.bannerAlpha = 0;
    }
  }
}

export function drawMilestones(
  state: MilestoneState,
  g: Phaser.GameObjects.Graphics,
  width: number,
  frameCount: number,
  drawLetter: (g: Phaser.GameObjects.Graphics, char: string, x: number, y: number, size: number) => void
): void {
  for (const c of state.celebrations) {
    for (const ring of c.rings) {
      g.lineStyle(ring.thickness, ring.color, ring.alpha);
      g.strokeCircle(ring.x, ring.y, ring.radius);
    }
  }

  for (const fw of state.fireworks) {
    for (const spark of fw.sparks) {
      for (const t of spark.trail) {
        g.fillStyle(fw.color, t.alpha * 0.3);
        g.fillCircle(t.x, t.y, spark.size * 0.6);
      }
      g.fillStyle(fw.color, spark.alpha);
      g.fillCircle(spark.x, spark.y, spark.size);
      g.fillStyle(0xffffff, spark.alpha * 0.5);
      g.fillCircle(spark.x, spark.y, spark.size * 0.4);
    }
  }

  if (state.bannerAlpha > 0.01) {
    drawBanner(state, g, width, frameCount, drawLetter);
  }
}

function drawBanner(
  state: MilestoneState,
  g: Phaser.GameObjects.Graphics,
  width: number,
  frameCount: number,
  drawLetter: (g: Phaser.GameObjects.Graphics, char: string, x: number, y: number, size: number) => void
): void {
  const text = state.bannerText;
  const baseSize = 20 * state.bannerScale;
  const charWidth = baseSize * 0.7;
  const totalWidth = text.length * charWidth;
  const startX = (width - totalWidth) / 2;
  const y = state.bannerY;

  const glowPulse = 0.5 + Math.sin(frameCount * 0.1) * 0.3;
  g.fillStyle(THEME.food.glow, state.bannerAlpha * glowPulse * 0.2);
  g.fillCircle(width / 2, y + baseSize / 2, totalWidth * 0.6);

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const cx = startX + i * charWidth;
    const wobble = Math.sin(frameCount * 0.08 + i * 0.5) * 2 * state.bannerAlpha;

    g.fillStyle(0x000000, state.bannerAlpha * 0.5);
    drawLetter(g, char, cx + 2, y + wobble + 2, baseSize);

    g.fillStyle(THEME.food.body, state.bannerAlpha);
    drawLetter(g, char, cx, y + wobble, baseSize);

    g.fillStyle(0xffffff, state.bannerAlpha * 0.3);
    drawLetter(g, char, cx, y + wobble - 1, baseSize);
  }
}

export function resetMilestones(state: MilestoneState): void {
  state.lastMilestoneScore = 0;
  state.bannerAlpha = 0;
}
