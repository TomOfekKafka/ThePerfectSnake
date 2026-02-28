import Phaser from 'phaser';

interface FireEmber {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  heat: number;
}

interface FireHeart {
  x: number;
  y: number;
  vx: number;
  vy: number;
  scale: number;
  rotation: number;
  rotSpeed: number;
  life: number;
  maxLife: number;
  pulsePhase: number;
  embers: FireEmber[];
}

export interface FireHeartsState {
  hearts: FireHeart[];
}

const MAX_HEARTS = 24;
const HEARTS_PER_BURST = 6;
const HEART_LIFETIME = 70;
const MAX_EMBERS_PER_HEART = 8;

const FIRE_CORE = 0xfff4c2;
const FIRE_INNER = 0xffaa22;
const FIRE_MID = 0xff6600;
const FIRE_OUTER = 0xdd2200;
const HEART_RED = 0xff2244;
const HEART_PINK = 0xff6688;
const HEART_DEEP = 0xcc0033;

export function createFireHeartsState(): FireHeartsState {
  return { hearts: [] };
}

export function spawnFireHearts(
  state: FireHeartsState,
  x: number,
  y: number
): void {
  while (state.hearts.length + HEARTS_PER_BURST > MAX_HEARTS) {
    state.hearts.shift();
  }

  for (let i = 0; i < HEARTS_PER_BURST; i++) {
    const angle = (i / HEARTS_PER_BURST) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    const speed = 1.2 + Math.random() * 2.0;
    const life = HEART_LIFETIME * (0.6 + Math.random() * 0.4);

    state.hearts.push({
      x: x + (Math.random() - 0.5) * 10,
      y: y + (Math.random() - 0.5) * 10,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1.5,
      scale: 0.5 + Math.random() * 0.6,
      rotation: (Math.random() - 0.5) * 0.6,
      rotSpeed: (Math.random() - 0.5) * 0.08,
      life,
      maxLife: life,
      pulsePhase: Math.random() * Math.PI * 2,
      embers: [],
    });
  }
}

function spawnEmber(heart: FireHeart): void {
  if (heart.embers.length >= MAX_EMBERS_PER_HEART) {
    heart.embers.shift();
  }
  const emberLife = 15 + Math.random() * 15;
  heart.embers.push({
    x: heart.x + (Math.random() - 0.5) * 8 * heart.scale,
    y: heart.y + (Math.random() - 0.5) * 8 * heart.scale,
    vx: (Math.random() - 0.5) * 1.2,
    vy: -(0.5 + Math.random() * 1.5),
    size: 1.0 + Math.random() * 2.5,
    life: emberLife,
    maxLife: emberLife,
    heat: 0.5 + Math.random() * 0.5,
  });
}

export function updateFireHearts(state: FireHeartsState): void {
  for (let i = state.hearts.length - 1; i >= 0; i--) {
    const h = state.hearts[i];

    h.x += h.vx;
    h.y += h.vy;
    h.vy -= 0.02;
    h.vx *= 0.97;
    h.vy *= 0.98;
    h.rotation += h.rotSpeed;
    h.rotSpeed *= 0.99;
    h.pulsePhase += 0.15;
    h.life--;

    const t = h.life / h.maxLife;
    if (t > 0.3 && Math.random() < 0.4) {
      spawnEmber(h);
    }

    for (let j = h.embers.length - 1; j >= 0; j--) {
      const e = h.embers[j];
      e.x += e.vx;
      e.y += e.vy;
      e.vx *= 0.95;
      e.vy *= 0.97;
      e.vx += (Math.random() - 0.5) * 0.2;
      e.size *= 0.97;
      e.life--;
      if (e.life <= 0 || e.size < 0.2) {
        h.embers.splice(j, 1);
      }
    }

    if (h.life <= 0) {
      state.hearts.splice(i, 1);
    }
  }
}

function drawHeartShape(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  size: number,
  color: number,
  alpha: number
): void {
  if (alpha < 0.01) return;
  g.fillStyle(color, alpha);

  const r = size * 0.45;
  const topY = cy - size * 0.25;
  g.fillCircle(cx - r * 0.52, topY, r);
  g.fillCircle(cx + r * 0.52, topY, r);

  const triH = size * 0.55;
  const triW = size * 0.92;
  g.fillTriangle(
    cx - triW * 0.5, topY + r * 0.15,
    cx + triW * 0.5, topY + r * 0.15,
    cx, topY + triH + r * 0.1
  );
}

function drawEmbers(
  g: Phaser.GameObjects.Graphics,
  embers: FireEmber[]
): void {
  for (const e of embers) {
    const t = e.life / e.maxLife;
    const alpha = t * e.heat;

    g.fillStyle(FIRE_OUTER, alpha * 0.3);
    g.fillCircle(e.x, e.y, e.size * 2.0);

    g.fillStyle(FIRE_MID, alpha * 0.5);
    g.fillCircle(e.x, e.y, e.size * 1.3);

    g.fillStyle(FIRE_INNER, alpha * 0.7);
    g.fillCircle(e.x, e.y, e.size * 0.7);

    if (t > 0.4) {
      g.fillStyle(FIRE_CORE, alpha * 0.8);
      g.fillCircle(e.x, e.y, e.size * 0.3);
    }
  }
}

export function drawFireHearts(
  g: Phaser.GameObjects.Graphics,
  state: FireHeartsState
): void {
  for (const h of state.hearts) {
    const t = h.life / h.maxLife;
    const pulse = 1.0 + Math.sin(h.pulsePhase) * 0.15;
    const heartSize = (8 + h.scale * 6) * pulse;

    const fadeIn = Math.min(1, (h.maxLife - h.life) / 8);
    const fadeOut = t < 0.3 ? t / 0.3 : 1;
    const alpha = fadeIn * fadeOut;

    drawEmbers(g, h.embers);

    const flameSize = heartSize * (1.2 + Math.sin(h.pulsePhase * 1.3) * 0.15);
    drawHeartShape(g, h.x, h.y - 2, flameSize * 1.4, FIRE_OUTER, alpha * 0.2);
    drawHeartShape(g, h.x, h.y - 1, flameSize * 1.2, FIRE_MID, alpha * 0.3);

    drawHeartShape(g, h.x, h.y, heartSize * 1.15, HEART_DEEP, alpha * 0.6);
    drawHeartShape(g, h.x, h.y, heartSize, HEART_RED, alpha * 0.85);
    drawHeartShape(g, h.x, h.y, heartSize * 0.7, HEART_PINK, alpha * 0.5);

    if (t > 0.2) {
      drawHeartShape(g, h.x, h.y - 1, heartSize * 0.4, FIRE_CORE, alpha * 0.6);
    }

    const glowSize = heartSize * 2.5;
    g.fillStyle(FIRE_MID, alpha * 0.08);
    g.fillCircle(h.x, h.y, glowSize);
  }
}
