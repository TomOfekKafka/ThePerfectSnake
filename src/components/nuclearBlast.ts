const MAX_BLASTS = 2;
const MAX_FALLOUT = 20;
const FIREBALL_EXPAND_SPEED = 4;
const MUSHROOM_RISE_SPEED = 1.8;
const RING_EXPAND_SPEED = 3.5;

export interface NuclearFireball {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  life: number;
  phase: number;
}

export interface MushroomCloud {
  x: number;
  y: number;
  stemWidth: number;
  stemHeight: number;
  capRadius: number;
  maxStemHeight: number;
  maxCapRadius: number;
  life: number;
  phase: number;
}

export interface BlastRing {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  thickness: number;
  life: number;
}

export interface FalloutParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  hue: number;
}

export interface HeatLine {
  x: number;
  y: number;
  angle: number;
  length: number;
  maxLength: number;
  life: number;
  speed: number;
}

export interface NuclearBlast {
  fireball: NuclearFireball;
  mushroom: MushroomCloud;
  rings: BlastRing[];
  heatLines: HeatLine[];
  fallout: FalloutParticle[];
  flashAlpha: number;
}

export interface NuclearBlastState {
  blasts: NuclearBlast[];
  falloutPool: FalloutParticle[];
}

export function createNuclearBlastState(): NuclearBlastState {
  return { blasts: [], falloutPool: [] };
}

export function spawnNuclearBlast(
  state: NuclearBlastState,
  x: number,
  y: number
): void {
  if (state.blasts.length >= MAX_BLASTS) {
    const removed = state.blasts.shift()!;
    state.falloutPool = state.falloutPool.concat(removed.fallout);
  }

  const numHeatLines = 8;
  const heatLines: HeatLine[] = [];
  for (let i = 0; i < numHeatLines; i++) {
    const angle = (i / numHeatLines) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
    heatLines.push({
      x,
      y,
      angle,
      length: 0,
      maxLength: 40 + Math.random() * 30,
      life: 1,
      speed: 2.5 + Math.random() * 1.5,
    });
  }

  const blast: NuclearBlast = {
    fireball: {
      x,
      y,
      radius: 3,
      maxRadius: 35,
      life: 1,
      phase: 0,
    },
    mushroom: {
      x,
      y,
      stemWidth: 6,
      stemHeight: 0,
      capRadius: 0,
      maxStemHeight: 40,
      maxCapRadius: 22,
      life: 1,
      phase: 0,
    },
    rings: [
      { x, y, radius: 5, maxRadius: 70, thickness: 4, life: 1 },
      { x, y, radius: 3, maxRadius: 55, thickness: 2.5, life: 1 },
    ],
    heatLines,
    fallout: [],
    flashAlpha: 0.6,
  };

  state.blasts.push(blast);
}

export function updateNuclearBlasts(state: NuclearBlastState): void {
  for (let i = state.blasts.length - 1; i >= 0; i--) {
    const blast = state.blasts[i];
    const alive = updateSingleBlast(blast);
    if (!alive) {
      state.falloutPool = state.falloutPool.concat(blast.fallout);
      state.blasts.splice(i, 1);
    }
  }

  updateFalloutPool(state);
}

function updateSingleBlast(blast: NuclearBlast): boolean {
  const fb = blast.fireball;
  fb.radius = Math.min(fb.radius + FIREBALL_EXPAND_SPEED, fb.maxRadius);
  fb.life -= 0.025;
  fb.phase += 0.15;

  const mc = blast.mushroom;
  mc.stemHeight = Math.min(mc.stemHeight + MUSHROOM_RISE_SPEED, mc.maxStemHeight);
  mc.capRadius = Math.min(mc.capRadius + 1.2, mc.maxCapRadius);
  mc.life -= 0.018;
  mc.phase += 0.1;

  for (let j = blast.rings.length - 1; j >= 0; j--) {
    const ring = blast.rings[j];
    ring.radius = Math.min(ring.radius + RING_EXPAND_SPEED, ring.maxRadius);
    ring.life -= 0.03;
    ring.thickness *= 0.97;
    if (ring.life <= 0) blast.rings.splice(j, 1);
  }

  for (let j = blast.heatLines.length - 1; j >= 0; j--) {
    const hl = blast.heatLines[j];
    hl.length = Math.min(hl.length + hl.speed, hl.maxLength);
    hl.life -= 0.03;
    if (hl.life <= 0) blast.heatLines.splice(j, 1);
  }

  blast.flashAlpha *= 0.88;

  if (fb.life > 0.3 && blast.fallout.length < MAX_FALLOUT) {
    spawnFalloutFromBlast(blast);
  }

  for (let j = blast.fallout.length - 1; j >= 0; j--) {
    const p = blast.fallout[j];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.03;
    p.vx *= 0.99;
    p.life -= 0.015;
    if (p.life <= 0) blast.fallout.splice(j, 1);
  }

  return fb.life > 0 || mc.life > 0 || blast.rings.length > 0 || blast.fallout.length > 0;
}

function spawnFalloutFromBlast(blast: NuclearBlast): void {
  const fb = blast.fireball;
  const angle = Math.random() * Math.PI * 2;
  const dist = fb.radius * (0.5 + Math.random() * 0.5);
  blast.fallout.push({
    x: fb.x + Math.cos(angle) * dist,
    y: fb.y + Math.sin(angle) * dist,
    vx: Math.cos(angle) * (0.5 + Math.random()),
    vy: -1 - Math.random() * 2,
    size: 1.5 + Math.random() * 2.5,
    life: 0.7 + Math.random() * 0.3,
    hue: 15 + Math.random() * 25,
  });
}

function updateFalloutPool(state: NuclearBlastState): void {
  for (let i = state.falloutPool.length - 1; i >= 0; i--) {
    const p = state.falloutPool[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.04;
    p.vx *= 0.98;
    p.life -= 0.02;
    p.size *= 0.995;
    if (p.life <= 0 || p.size < 0.3) {
      state.falloutPool.splice(i, 1);
    }
  }
}

function hslToHex(h: number, s: number, l: number): number {
  const hNorm = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hNorm / 60) % 2) - 1));
  const m = l - c / 2;

  let r = 0, g = 0, b = 0;
  if (hNorm < 60) { r = c; g = x; }
  else if (hNorm < 120) { r = x; g = c; }
  else if (hNorm < 180) { g = c; b = x; }
  else if (hNorm < 240) { g = x; b = c; }
  else if (hNorm < 300) { r = x; b = c; }
  else { r = c; b = x; }

  const ri = Math.round((r + m) * 255);
  const gi = Math.round((g + m) * 255);
  const bi = Math.round((b + m) * 255);
  return (ri << 16) | (gi << 8) | bi;
}

export function drawNuclearBlasts(
  g: Phaser.GameObjects.Graphics,
  state: NuclearBlastState
): void {
  for (const p of state.falloutPool) {
    drawFalloutParticle(g, p);
  }

  for (const blast of state.blasts) {
    drawSingleBlast(g, blast);
  }
}

function drawSingleBlast(g: Phaser.GameObjects.Graphics, blast: NuclearBlast): void {
  if (blast.flashAlpha > 0.02) {
    g.fillStyle(0xffffff, blast.flashAlpha * 0.3);
    g.fillRect(0, 0, 400, 400);
  }

  for (const ring of blast.rings) {
    const alpha = ring.life * 0.7;
    if (alpha < 0.01) continue;
    const color = hslToHex(30, 0.9, 0.5 + ring.life * 0.2);
    g.lineStyle(ring.thickness, color, alpha);
    g.strokeCircle(ring.x, ring.y, ring.radius);
    g.lineStyle(ring.thickness * 0.5, 0xffffff, alpha * 0.5);
    g.strokeCircle(ring.x, ring.y, ring.radius * 0.95);
  }

  for (const hl of blast.heatLines) {
    const alpha = hl.life * 0.5;
    if (alpha < 0.01) continue;
    const endX = hl.x + Math.cos(hl.angle) * hl.length;
    const endY = hl.y + Math.sin(hl.angle) * hl.length;
    const color = hslToHex(20 + (1 - hl.life) * 20, 0.9, 0.6);
    g.lineStyle(1.5, color, alpha);
    g.beginPath();
    g.moveTo(hl.x, hl.y);
    g.lineTo(endX, endY);
    g.strokePath();
  }

  const fb = blast.fireball;
  if (fb.life > 0) {
    drawFireball(g, fb);
  }

  const mc = blast.mushroom;
  if (mc.life > 0 && mc.stemHeight > 2) {
    drawMushroomCloud(g, mc);
  }

  for (const p of blast.fallout) {
    drawFalloutParticle(g, p);
  }
}

function drawFireball(g: Phaser.GameObjects.Graphics, fb: NuclearFireball): void {
  const eased = fb.life * fb.life;

  const outerColor = hslToHex(20, 0.9, 0.3 + eased * 0.2);
  g.fillStyle(outerColor, eased * 0.3);
  g.fillCircle(fb.x, fb.y, fb.radius * 1.4);

  const midColor = hslToHex(30, 1.0, 0.45 + eased * 0.15);
  g.fillStyle(midColor, eased * 0.5);
  g.fillCircle(fb.x, fb.y, fb.radius);

  const coreColor = hslToHex(45, 1.0, 0.7 + eased * 0.15);
  g.fillStyle(coreColor, eased * 0.7);
  g.fillCircle(fb.x, fb.y, fb.radius * 0.6);

  const whiteHot = eased > 0.5 ? (eased - 0.5) * 2 : 0;
  if (whiteHot > 0.01) {
    g.fillStyle(0xffffff, whiteHot * 0.6);
    g.fillCircle(fb.x, fb.y, fb.radius * 0.3);
  }

  const flicker = Math.sin(fb.phase * 3) * 0.15;
  if (eased > 0.2) {
    g.fillStyle(0xffaa00, (eased * 0.25 + flicker));
    g.fillCircle(fb.x, fb.y, fb.radius * 1.1);
  }
}

function drawMushroomCloud(g: Phaser.GameObjects.Graphics, mc: MushroomCloud): void {
  const eased = mc.life * mc.life;
  if (eased < 0.01) return;

  const stemTop = mc.y - mc.stemHeight;
  const halfStem = mc.stemWidth / 2;

  const stemColor = hslToHex(25, 0.6, 0.35);
  g.fillStyle(stemColor, eased * 0.5);
  g.fillRect(mc.x - halfStem, stemTop, mc.stemWidth, mc.stemHeight);

  const stemGlow = hslToHex(35, 0.8, 0.5);
  g.fillStyle(stemGlow, eased * 0.3);
  g.fillRect(mc.x - halfStem * 0.5, stemTop, mc.stemWidth * 0.5, mc.stemHeight);

  if (mc.capRadius > 2) {
    const capColor = hslToHex(20, 0.7, 0.4);
    g.fillStyle(capColor, eased * 0.45);
    g.fillCircle(mc.x, stemTop, mc.capRadius);

    const capHighlight = hslToHex(35, 0.9, 0.55);
    g.fillStyle(capHighlight, eased * 0.3);
    g.fillCircle(mc.x, stemTop - mc.capRadius * 0.2, mc.capRadius * 0.65);

    const innerGlow = hslToHex(45, 1.0, 0.65);
    g.fillStyle(innerGlow, eased * 0.25);
    g.fillCircle(mc.x, stemTop - mc.capRadius * 0.1, mc.capRadius * 0.35);

    const billow = Math.sin(mc.phase * 2) * mc.capRadius * 0.15;
    g.fillStyle(capColor, eased * 0.2);
    g.fillCircle(mc.x - mc.capRadius * 0.5, stemTop + billow, mc.capRadius * 0.4);
    g.fillCircle(mc.x + mc.capRadius * 0.5, stemTop - billow, mc.capRadius * 0.4);
  }
}

function drawFalloutParticle(g: Phaser.GameObjects.Graphics, p: FalloutParticle): void {
  const alpha = p.life * 0.6;
  if (alpha < 0.01) return;

  const glowColor = hslToHex(p.hue, 0.9, 0.5);
  g.fillStyle(glowColor, alpha * 0.4);
  g.fillCircle(p.x, p.y, p.size * 1.5);

  const coreColor = hslToHex(p.hue + 10, 1.0, 0.65);
  g.fillStyle(coreColor, alpha);
  g.fillCircle(p.x, p.y, p.size);
}
