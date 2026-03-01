import Phaser from 'phaser';

export interface ExplosionRing {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  life: number;
  hue: number;
  thickness: number;
}

export interface ExplosionShard {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  rotation: number;
  rotationSpeed: number;
  hue: number;
}

export interface ExplosionSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  hue: number;
}

export interface SameDirectionExplosionState {
  rings: ExplosionRing[];
  shards: ExplosionShard[];
  sparks: ExplosionSpark[];
  flashAlpha: number;
  shakeIntensity: number;
  warningText: string;
  textAlpha: number;
  textScale: number;
  textX: number;
  textY: number;
}

const MAX_RINGS = 6;
const SHARDS_PER_EXPLOSION = 16;
const SPARKS_PER_EXPLOSION = 24;
const MAX_SHARDS = 32;
const MAX_SPARKS = 48;

const WARNING_TEXTS = [
  'THWIP!',
  'WEB BLAST!',
  'WRONG WAY!',
  'ALREADY GOING!',
  'WEB TANGLE!',
  'STICKY!',
  'SPLAT!',
  'WEBBED!',
  'NOPE!',
  'TANGLED!',
];

export function createSameDirectionExplosionState(): SameDirectionExplosionState {
  return {
    rings: [],
    shards: [],
    sparks: [],
    flashAlpha: 0,
    shakeIntensity: 0,
    warningText: '',
    textAlpha: 0,
    textScale: 0,
    textX: 0,
    textY: 0,
  };
}

export function triggerSameDirectionExplosion(
  state: SameDirectionExplosionState,
  headX: number,
  headY: number,
  dirX: number,
  dirY: number
): void {
  const cx = headX + dirX * 10;
  const cy = headY + dirY * 10;

  while (state.rings.length + 3 > MAX_RINGS) state.rings.shift();
  for (let i = 0; i < 3; i++) {
    state.rings.push({
      x: cx + (Math.random() - 0.5) * 8,
      y: cy + (Math.random() - 0.5) * 8,
      radius: 4 + i * 6,
      maxRadius: 60 + i * 30,
      life: 1,
      hue: 200 + i * 20,
      thickness: 4 - i,
    });
  }

  const perpX = -dirY;
  const perpY = dirX;
  while (state.shards.length + SHARDS_PER_EXPLOSION > MAX_SHARDS) state.shards.shift();
  for (let i = 0; i < SHARDS_PER_EXPLOSION; i++) {
    const angle = (i / SHARDS_PER_EXPLOSION) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    const speed = 2 + Math.random() * 5;
    state.shards.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed + dirX * 1.5,
      vy: Math.sin(angle) * speed + dirY * 1.5,
      size: 2 + Math.random() * 4,
      life: 0.8 + Math.random() * 0.4,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.4,
      hue: 210 + Math.random() * 40,
    });
  }

  while (state.sparks.length + SPARKS_PER_EXPLOSION > MAX_SPARKS) state.sparks.shift();
  for (let i = 0; i < SPARKS_PER_EXPLOSION; i++) {
    const spread = (Math.random() - 0.5) * 3;
    const forwardSpeed = 3 + Math.random() * 5;
    state.sparks.push({
      x: cx + (Math.random() - 0.5) * 10,
      y: cy + (Math.random() - 0.5) * 10,
      vx: dirX * forwardSpeed + perpX * spread + (Math.random() - 0.5) * 2,
      vy: dirY * forwardSpeed + perpY * spread + (Math.random() - 0.5) * 2,
      size: 1 + Math.random() * 3,
      life: 0.6 + Math.random() * 0.5,
      hue: 200 + Math.random() * 40,
    });
  }

  state.flashAlpha = 0.5;
  state.shakeIntensity = 8;
  state.warningText = WARNING_TEXTS[Math.floor(Math.random() * WARNING_TEXTS.length)];
  state.textAlpha = 1;
  state.textScale = 3;
  state.textX = cx;
  state.textY = cy - 30;
}

export function updateSameDirectionExplosion(state: SameDirectionExplosionState): void {
  state.flashAlpha *= 0.85;
  if (state.flashAlpha < 0.005) state.flashAlpha = 0;

  state.shakeIntensity *= 0.88;
  if (state.shakeIntensity < 0.3) state.shakeIntensity = 0;

  state.textAlpha *= 0.95;
  state.textScale += (1 - state.textScale) * 0.15;
  state.textY -= 0.5;

  for (let i = state.rings.length - 1; i >= 0; i--) {
    const r = state.rings[i];
    r.radius += (r.maxRadius - r.radius) * 0.12;
    r.life -= 0.035;
    if (r.life <= 0) state.rings.splice(i, 1);
  }

  for (let i = state.shards.length - 1; i >= 0; i--) {
    const s = state.shards[i];
    s.x += s.vx;
    s.y += s.vy;
    s.vx *= 0.95;
    s.vy *= 0.95;
    s.vy += 0.08;
    s.rotation += s.rotationSpeed;
    s.life -= 0.025;
    if (s.life <= 0) state.shards.splice(i, 1);
  }

  for (let i = state.sparks.length - 1; i >= 0; i--) {
    const sp = state.sparks[i];
    sp.x += sp.vx;
    sp.y += sp.vy;
    sp.vx *= 0.93;
    sp.vy *= 0.93;
    sp.size *= 0.97;
    sp.life -= 0.03;
    if (sp.life <= 0 || sp.size < 0.3) state.sparks.splice(i, 1);
  }
}

function hslToHex(h: number, s: number, l: number): number {
  const hMod = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hMod / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (hMod < 60) { r = c; g = x; }
  else if (hMod < 120) { r = x; g = c; }
  else if (hMod < 180) { g = c; b = x; }
  else if (hMod < 240) { g = x; b = c; }
  else if (hMod < 300) { r = x; b = c; }
  else { r = c; b = x; }
  return ((Math.round((r + m) * 255) << 16) |
    (Math.round((g + m) * 255) << 8) |
    Math.round((b + m) * 255));
}

export function drawSameDirectionExplosion(
  g: Phaser.GameObjects.Graphics,
  state: SameDirectionExplosionState,
  width: number,
  height: number
): void {
  if (state.flashAlpha > 0.01) {
    g.fillStyle(0xddddee, state.flashAlpha * 0.2);
    g.fillRect(0, 0, width, height);
    g.fillStyle(0xffffff, state.flashAlpha * 0.1);
    g.fillRect(0, 0, width, height);
  }

  for (const ring of state.rings) {
    const alpha = ring.life * 0.7;

    g.lineStyle(ring.thickness * ring.life + 1, 0xccccdd, alpha * 0.3);
    g.strokeCircle(ring.x, ring.y, ring.radius + 3);

    g.lineStyle(ring.thickness * ring.life * 0.8, 0xeeeeee, alpha * 0.5);
    g.strokeCircle(ring.x, ring.y, ring.radius);

    const spokeCount = 8;
    for (let i = 0; i < spokeCount; i++) {
      const angle = (i / spokeCount) * Math.PI * 2;
      const inner = ring.radius * 0.3;
      const outer = ring.radius;
      g.lineStyle(0.5 * ring.life, 0xdddddd, alpha * 0.25);
      g.lineBetween(
        ring.x + Math.cos(angle) * inner,
        ring.y + Math.sin(angle) * inner,
        ring.x + Math.cos(angle) * outer,
        ring.y + Math.sin(angle) * outer
      );
    }

    g.fillStyle(0xffffff, alpha * 0.12 * ring.life);
    g.fillCircle(ring.x, ring.y, ring.radius * 0.2 * ring.life);
  }

  for (const s of state.shards) {
    const alpha = Math.min(1, s.life * 1.2);
    const sz = s.size * s.life;

    g.fillStyle(0xbbbbcc, alpha * 0.2);
    g.fillCircle(s.x, s.y, sz * 1.5);

    g.fillStyle(0xdddddd, alpha * 0.6);
    g.fillCircle(s.x, s.y, sz * 0.7);

    g.fillStyle(0xffffff, alpha * 0.8);
    g.fillCircle(s.x, s.y, sz * 0.3);

    if (s.life > 0.3) {
      const strandLen = sz * 2.5;
      const angle = s.rotation;
      g.lineStyle(0.5 * s.life, 0xdddddd, alpha * 0.35);
      g.lineBetween(
        s.x, s.y,
        s.x + Math.cos(angle) * strandLen,
        s.y + Math.sin(angle) * strandLen
      );
    }
  }

  for (const sp of state.sparks) {
    const alpha = Math.min(1, sp.life * 1.5);
    const speed = Math.sqrt(sp.vx * sp.vx + sp.vy * sp.vy);
    const strandLen = Math.max(sp.size * 2, speed * 3);
    const angle = Math.atan2(sp.vy, sp.vx);

    g.lineStyle(0.6 * sp.life, 0xdddddd, alpha * 0.4);
    g.lineBetween(
      sp.x - Math.cos(angle) * strandLen,
      sp.y - Math.sin(angle) * strandLen,
      sp.x, sp.y
    );

    g.fillStyle(0xffffff, alpha * 0.6);
    g.fillCircle(sp.x, sp.y, sp.size * 0.5);
  }
}

export function drawExplosionText(
  state: SameDirectionExplosionState,
  drawTextFn: (x: number, y: number, text: string, size: number, color: number, alpha: number) => void
): void {
  if (state.textAlpha < 0.02) return;

  const size = Math.round(16 * state.textScale);
  drawTextFn(state.textX, state.textY, state.warningText, size, 0xffffff, state.textAlpha);
}

export function getExplosionShake(state: SameDirectionExplosionState): { x: number; y: number } {
  if (state.shakeIntensity < 0.3) return { x: 0, y: 0 };
  return {
    x: (Math.random() - 0.5) * state.shakeIntensity,
    y: (Math.random() - 0.5) * state.shakeIntensity,
  };
}
