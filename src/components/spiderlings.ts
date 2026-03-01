import { THEME } from './gameTheme';

export interface Spiderling {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  legPhase: number;
  legSpeed: number;
  life: number;
  maxLife: number;
  angle: number;
  scurryTimer: number;
  scurryDirection: number;
}

const MAX_SPIDERLINGS = 20;
const SPIDERLING_LIFETIME = 180;

export function spawnSpiderlings(
  spiderlings: Spiderling[],
  x: number,
  y: number,
  count: number
): void {
  const toSpawn = Math.min(count, MAX_SPIDERLINGS - spiderlings.length);
  for (let i = 0; i < toSpawn; i++) {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const speed = 2 + Math.random() * 3;
    spiderlings.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 3 + Math.random() * 2,
      legPhase: Math.random() * Math.PI * 2,
      legSpeed: 0.3 + Math.random() * 0.2,
      life: SPIDERLING_LIFETIME + Math.random() * 40,
      maxLife: SPIDERLING_LIFETIME + Math.random() * 40,
      angle,
      scurryTimer: 0,
      scurryDirection: angle,
    });
  }
}

export function updateSpiderlings(spiderlings: Spiderling[]): void {
  for (let i = spiderlings.length - 1; i >= 0; i--) {
    const s = spiderlings[i];

    s.life -= 1;
    s.legPhase += s.legSpeed;
    s.scurryTimer += 1;

    if (s.scurryTimer > 20 + Math.random() * 30) {
      s.scurryTimer = 0;
      s.scurryDirection += (Math.random() - 0.5) * 2;
      const burst = 0.5 + Math.random() * 1;
      s.vx += Math.cos(s.scurryDirection) * burst;
      s.vy += Math.sin(s.scurryDirection) * burst;
    }

    s.vx *= 0.96;
    s.vy *= 0.96;
    s.x += s.vx;
    s.y += s.vy;

    s.angle = Math.atan2(s.vy, s.vx);

    if (s.life <= 0) {
      spiderlings.splice(i, 1);
    }
  }
}

export function drawSpiderlings(
  g: Phaser.GameObjects.Graphics,
  spiderlings: Spiderling[],
  frameCount: number
): void {
  for (const s of spiderlings) {
    const alpha = Math.min(1, s.life / 30);
    const sz = s.size * alpha;
    if (sz < 0.5) continue;

    g.fillStyle(0x000000, 0.2 * alpha);
    g.fillEllipse(s.x + 1, s.y + 1, sz * 2, sz * 1.2);

    const legWave = Math.sin(s.legPhase) * 1.5;
    g.lineStyle(0.8, THEME.food.body, 0.8 * alpha);
    for (let side = -1; side <= 1; side += 2) {
      for (let li = 0; li < 3; li++) {
        const baseAngle = s.angle + side * (0.4 + li * 0.4);
        const legLen = sz * 1.8;
        const midLen = legLen * 0.5;
        const tipWobble = legWave * (li % 2 === 0 ? 1 : -1);

        const midX = s.x + Math.cos(baseAngle) * midLen;
        const midY = s.y + Math.sin(baseAngle) * midLen + tipWobble;
        const tipX = s.x + Math.cos(baseAngle + side * 0.3) * legLen;
        const tipY = s.y + Math.sin(baseAngle + side * 0.3) * legLen + tipWobble * 0.5;

        g.lineBetween(s.x, s.y, midX, midY);
        g.lineBetween(midX, midY, tipX, tipY);
      }
    }

    g.fillStyle(THEME.food.body, 0.9 * alpha);
    g.fillCircle(s.x, s.y, sz * 0.7);
    g.fillCircle(s.x - Math.cos(s.angle) * sz * 0.4, s.y - Math.sin(s.angle) * sz * 0.4, sz * 0.5);

    g.fillStyle(THEME.food.core, 0.7 * alpha);
    g.fillCircle(s.x, s.y, sz * 0.25);

    const eyeOffset = sz * 0.3;
    const eyeAngle = s.angle;
    const perp = eyeAngle + Math.PI / 2;
    g.fillStyle(THEME.food.core, 0.9 * alpha);
    g.fillCircle(
      s.x + Math.cos(eyeAngle) * eyeOffset + Math.cos(perp) * sz * 0.15,
      s.y + Math.sin(eyeAngle) * eyeOffset + Math.sin(perp) * sz * 0.15,
      sz * 0.1
    );
    g.fillCircle(
      s.x + Math.cos(eyeAngle) * eyeOffset - Math.cos(perp) * sz * 0.15,
      s.y + Math.sin(eyeAngle) * eyeOffset - Math.sin(perp) * sz * 0.15,
      sz * 0.1
    );
  }
}

export function drawEggFood(
  g: Phaser.GameObjects.Graphics,
  foodX: number,
  foodY: number,
  cellSize: number,
  frameCount: number
): void {
  const wobble = Math.sin(frameCount * 0.08) * 1.5;
  const pulse = 1 + Math.sin(frameCount * 0.12) * 0.06;
  const eggW = (cellSize * 0.55) * pulse;
  const eggH = (cellSize * 0.7) * pulse;

  g.fillStyle(0x000000, 0.25);
  g.fillEllipse(foodX + 1, foodY + eggH * 0.35, eggW * 1.4, eggH * 0.3);

  const nestSize = eggW * 1.6;
  const nestAlpha = 0.25 + Math.sin(frameCount * 0.05) * 0.05;
  g.lineStyle(1.5, 0xdddddd, nestAlpha);
  for (let i = 0; i < 5; i++) {
    const angle = (Math.PI * 2 * i) / 5 + frameCount * 0.003;
    const r = nestSize * (0.8 + Math.sin(angle * 3) * 0.2);
    const nx = foodX + Math.cos(angle) * r * 0.5;
    const ny = foodY + eggH * 0.2 + Math.sin(angle) * r * 0.15;
    g.lineBetween(
      foodX + Math.cos(angle - 0.6) * nestSize * 0.5,
      foodY + eggH * 0.2 + Math.sin(angle - 0.6) * nestSize * 0.12,
      nx,
      ny
    );
  }

  const glowPulse = 0.3 + Math.sin(frameCount * 0.1) * 0.15;
  g.fillStyle(THEME.food.glow, glowPulse * 0.08);
  g.fillCircle(foodX, foodY, eggW + 12);
  g.fillStyle(THEME.food.core, glowPulse * 0.12);
  g.fillCircle(foodX, foodY, eggW + 6);

  g.fillStyle(0xf5e6d0, 0.95);
  g.fillEllipse(foodX, foodY + wobble * 0.3, eggW * 2, eggH * 2);

  g.fillStyle(0xfff8f0, 0.4);
  g.fillEllipse(foodX - eggW * 0.25, foodY - eggH * 0.2, eggW * 0.7, eggH * 0.9);

  const speckles = [
    { dx: -0.2, dy: -0.3, sz: 0.12 },
    { dx: 0.15, dy: -0.1, sz: 0.1 },
    { dx: -0.1, dy: 0.2, sz: 0.08 },
    { dx: 0.25, dy: 0.15, sz: 0.09 },
    { dx: -0.3, dy: 0.05, sz: 0.07 },
    { dx: 0.05, dy: -0.35, sz: 0.06 },
    { dx: 0.3, dy: -0.2, sz: 0.08 },
  ];
  for (const sp of speckles) {
    const spAlpha = 0.5 + Math.sin(frameCount * 0.03 + sp.dx * 10) * 0.15;
    g.fillStyle(THEME.food.core, spAlpha);
    g.fillCircle(
      foodX + sp.dx * eggW * 2,
      foodY + sp.dy * eggH * 2 + wobble * 0.3,
      sp.sz * eggW * 2
    );
  }

  const crackPhase = Math.sin(frameCount * 0.06);
  if (crackPhase > 0.3) {
    const crackAlpha = (crackPhase - 0.3) * 0.6;
    g.lineStyle(1, 0x888888, crackAlpha);
    g.lineBetween(
      foodX - eggW * 0.1, foodY - eggH * 0.1,
      foodX + eggW * 0.15, foodY - eggH * 0.25
    );
    g.lineBetween(
      foodX + eggW * 0.15, foodY - eggH * 0.25,
      foodX + eggW * 0.05, foodY - eggH * 0.4
    );
    g.lineBetween(
      foodX + eggW * 0.15, foodY - eggH * 0.25,
      foodX + eggW * 0.3, foodY - eggH * 0.15
    );
  }
}
