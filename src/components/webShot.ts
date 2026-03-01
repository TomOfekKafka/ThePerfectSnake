import Phaser from 'phaser';

interface WebStrandParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  anchorX: number;
  anchorY: number;
}

interface WebSplatParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  isNode: boolean;
  rotation: number;
  rotSpeed: number;
}

interface WebShotStyle {
  name: string;
  webColor: number;
  coreColor: number;
  glowColor: number;
  strandColor: number;
}

const WEB_STYLES: WebShotStyle[] = [
  { name: 'THWIP!', webColor: 0xeeeeee, coreColor: 0xffffff, glowColor: 0xccccdd, strandColor: 0xdddddd },
  { name: 'WEB SHOT!', webColor: 0xddddee, coreColor: 0xffffff, glowColor: 0xaabbcc, strandColor: 0xccccdd },
  { name: 'GOTCHA!', webColor: 0xeeeeff, coreColor: 0xffffff, glowColor: 0xbbbbdd, strandColor: 0xddddee },
  { name: 'SNARED!', webColor: 0xdddddd, coreColor: 0xffeeff, glowColor: 0xccbbcc, strandColor: 0xcccccc },
  { name: 'WEBBED!', webColor: 0xeeddee, coreColor: 0xffffff, glowColor: 0xddbbdd, strandColor: 0xddccdd },
  { name: 'SPLAT!', webColor: 0xeeeedd, coreColor: 0xffffee, glowColor: 0xccccbb, strandColor: 0xddddcc },
  { name: 'WRAPPED!', webColor: 0xddeeff, coreColor: 0xeeffff, glowColor: 0xbbccdd, strandColor: 0xccdded },
  { name: 'STICKIED!', webColor: 0xffeedd, coreColor: 0xffffff, glowColor: 0xddccbb, strandColor: 0xeeddcc },
];

export interface WebBolt {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  targetX: number;
  targetY: number;
  progress: number;
  life: number;
  maxLife: number;
  width: number;
  style: WebShotStyle;
  hitTarget: boolean;
  splatParticles: WebSplatParticle[];
  trail: WebStrandParticle[];
  impactFlash: number;
  wobblePhase: number;
  scale: number;
}

export interface WebShotLabel {
  text: string;
  x: number;
  y: number;
  startY: number;
  age: number;
  maxAge: number;
  color: number;
}

export interface WebShotState {
  bolts: WebBolt[];
  cooldown: number;
  chargeLevel: number;
  autoFireTimer: number;
  labels: WebShotLabel[];
  nextStyleIndex: number;
}

const MAX_BOLTS = 4;
const BOLT_SPEED = 0.04;
const BOLT_LIFE = 1.2;
const MAX_SPLAT_PARTICLES = 50;
const SPLAT_PARTICLES_PER_HIT = 16;
const AUTO_FIRE_INTERVAL = 50;
const COOLDOWN_FRAMES = 10;
const MAX_TRAIL = 40;
const TRAIL_SPAWN_RATE = 3;
const MAX_LABELS = 3;
const LABEL_LIFETIME = 90;

const WEB_WHITE = 0xffffff;
const WEB_SILVER = 0xdddddd;
const WEB_GHOST = 0xbbbbcc;

export function createWebShotState(): WebShotState {
  return {
    bolts: [],
    cooldown: 0,
    chargeLevel: 0,
    autoFireTimer: 0,
    labels: [],
    nextStyleIndex: 0,
  };
}

function pickStyle(state: WebShotState): WebShotStyle {
  const style = WEB_STYLES[state.nextStyleIndex % WEB_STYLES.length];
  state.nextStyleIndex++;
  return style;
}

export function fireWebShot(
  state: WebShotState,
  headX: number,
  headY: number,
  foodX: number,
  foodY: number
): boolean {
  if (state.cooldown > 0) return false;
  if (state.bolts.length >= MAX_BOLTS) {
    state.bolts.shift();
  }

  const style = pickStyle(state);

  state.bolts.push({
    startX: headX,
    startY: headY,
    endX: headX,
    endY: headY,
    targetX: foodX,
    targetY: foodY,
    progress: 0,
    life: 1,
    maxLife: BOLT_LIFE,
    width: 5 + Math.random() * 2,
    style,
    hitTarget: false,
    splatParticles: [],
    trail: [],
    impactFlash: 0,
    wobblePhase: Math.random() * Math.PI * 2,
    scale: 0.5 + Math.random() * 0.5,
  });

  spawnWebLabel(state, style, headX, headY);
  state.cooldown = COOLDOWN_FRAMES;
  state.chargeLevel = 0;
  return true;
}

function spawnWebLabel(
  state: WebShotState,
  style: WebShotStyle,
  x: number,
  y: number
): void {
  if (state.labels.length >= MAX_LABELS) {
    state.labels.shift();
  }
  state.labels.push({
    text: style.name,
    x,
    y: y - 14,
    startY: y - 14,
    age: 0,
    maxAge: LABEL_LIFETIME,
    color: WEB_WHITE,
  });
}

export function updateWebShots(
  state: WebShotState,
  headX: number,
  headY: number,
  foodX: number,
  foodY: number,
  gameStarted: boolean,
  gameOver: boolean
): boolean {
  let hitThisFrame = false;

  if (state.cooldown > 0) state.cooldown--;

  if (gameStarted && !gameOver) {
    state.chargeLevel = Math.min(1, state.chargeLevel + 0.012);
    state.autoFireTimer++;
    if (state.autoFireTimer >= AUTO_FIRE_INTERVAL) {
      state.autoFireTimer = 0;
      fireWebShot(state, headX, headY, foodX, foodY);
    }
  }

  for (let i = state.bolts.length - 1; i >= 0; i--) {
    const bolt = state.bolts[i];

    bolt.wobblePhase += 0.12;

    if (!bolt.hitTarget) {
      bolt.progress = Math.min(1, bolt.progress + BOLT_SPEED);

      const dx = bolt.targetX - bolt.startX;
      const dy = bolt.targetY - bolt.startY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const nx = dist > 0 ? -dy / dist : 0;
      const ny = dist > 0 ? dx / dist : 0;

      const arcHeight = Math.sin(bolt.progress * Math.PI) * 8;
      const wobble = Math.sin(bolt.wobblePhase + bolt.progress * 4) * 6 * Math.sin(bolt.progress * Math.PI);

      const baseX = bolt.startX + dx * bolt.progress;
      const baseY = bolt.startY + dy * bolt.progress;
      bolt.endX = baseX + nx * wobble;
      bolt.endY = baseY + ny * wobble - arcHeight;

      bolt.scale = 0.6 + Math.sin(bolt.progress * Math.PI) * 0.4;

      spawnTrailStrands(bolt);

      const tdx = bolt.endX - bolt.targetX;
      const tdy = bolt.endY - bolt.targetY;
      const tdist = Math.sqrt(tdx * tdx + tdy * tdy);

      if (tdist < 12 || bolt.progress >= 1) {
        bolt.hitTarget = true;
        bolt.impactFlash = 1.0;
        bolt.endX = bolt.targetX;
        bolt.endY = bolt.targetY;
        hitThisFrame = true;
        spawnWebSplat(bolt);
      }
    }

    if (bolt.hitTarget) {
      bolt.endX = bolt.targetX;
      bolt.endY = bolt.targetY;
      bolt.life -= 0.03;
      bolt.impactFlash *= 0.88;
      bolt.scale *= 0.96;
    }

    updateSplatParticles(bolt);
    updateTrailStrands(bolt);

    if (bolt.life <= 0 && bolt.splatParticles.length === 0 && bolt.trail.length === 0) {
      state.bolts.splice(i, 1);
    }
  }

  for (let i = state.labels.length - 1; i >= 0; i--) {
    const label = state.labels[i];
    label.age++;
    label.y = label.startY - label.age * 0.4;
    if (label.age >= label.maxAge) {
      state.labels.splice(i, 1);
    }
  }

  return hitThisFrame;
}

function updateSplatParticles(bolt: WebBolt): void {
  for (let j = bolt.splatParticles.length - 1; j >= 0; j--) {
    const p = bolt.splatParticles[j];
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.92;
    p.vy *= 0.92;
    p.vy += 0.015;
    p.rotation += p.rotSpeed;
    p.life -= 0.02;
    if (p.life <= 0) {
      bolt.splatParticles.splice(j, 1);
    }
  }
}

function updateTrailStrands(bolt: WebBolt): void {
  for (let j = bolt.trail.length - 1; j >= 0; j--) {
    const t = bolt.trail[j];
    t.x += t.vx;
    t.y += t.vy;
    t.vy += 0.01;
    t.vx *= 0.97;
    t.size *= 0.96;
    t.life -= 0.035;
    if (t.life <= 0 || t.size < 0.3) {
      bolt.trail.splice(j, 1);
    }
  }
}

function spawnTrailStrands(bolt: WebBolt): void {
  for (let i = 0; i < TRAIL_SPAWN_RATE; i++) {
    if (bolt.trail.length >= MAX_TRAIL) {
      bolt.trail.shift();
    }
    const spread = (Math.random() - 0.5) * 1.5;
    const life = 0.5 + Math.random() * 0.3;
    bolt.trail.push({
      x: bolt.endX + (Math.random() - 0.5) * 4,
      y: bolt.endY + (Math.random() - 0.5) * 4,
      vx: spread,
      vy: -(0.2 + Math.random() * 0.5),
      size: 1.2 + Math.random() * 2.5,
      life,
      maxLife: life,
      anchorX: bolt.endX,
      anchorY: bolt.endY,
    });
  }
}

function spawnWebSplat(bolt: WebBolt): void {
  while (bolt.splatParticles.length + SPLAT_PARTICLES_PER_HIT > MAX_SPLAT_PARTICLES) {
    bolt.splatParticles.shift();
  }

  for (let i = 0; i < SPLAT_PARTICLES_PER_HIT; i++) {
    const angle = (i / SPLAT_PARTICLES_PER_HIT) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
    const speed = 1.2 + Math.random() * 3.5;
    const isNode = i < 6;
    bolt.splatParticles.push({
      x: bolt.targetX,
      y: bolt.targetY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.8,
      size: isNode ? 2.5 + Math.random() * 2 : 1 + Math.random() * 1.5,
      life: 1,
      maxLife: 1,
      isNode,
      rotation: angle,
      rotSpeed: 0,
    });
  }
}

function drawWebGlob(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  size: number,
  style: WebShotStyle,
  alpha: number,
  frameCount: number
): void {
  const pulse = 1 + Math.sin(frameCount * 0.25) * 0.1;
  const globSize = size * pulse;

  g.fillStyle(style.glowColor, alpha * 0.12);
  g.fillCircle(cx, cy, globSize * 3.5);

  g.fillStyle(style.webColor, alpha * 0.2);
  g.fillCircle(cx, cy, globSize * 2.2);

  g.fillStyle(style.webColor, alpha * 0.7);
  g.fillCircle(cx, cy, globSize);

  g.fillStyle(style.coreColor, alpha * 0.9);
  g.fillCircle(cx, cy, globSize * 0.5);

  const strandCount = 6;
  for (let i = 0; i < strandCount; i++) {
    const angle = frameCount * 0.08 + (i * Math.PI * 2) / strandCount;
    const strandLen = globSize * (1.8 + Math.sin(frameCount * 0.15 + i) * 0.4);
    const ex = cx + Math.cos(angle) * strandLen;
    const ey = cy + Math.sin(angle) * strandLen;

    g.lineStyle(0.8, WEB_SILVER, alpha * 0.5);
    g.lineBetween(cx, cy, ex, ey);

    g.fillStyle(WEB_WHITE, alpha * 0.4);
    g.fillCircle(ex, ey, 1);
  }
}

export function drawWebTargetingLine(
  g: Phaser.GameObjects.Graphics,
  state: WebShotState,
  headX: number,
  headY: number,
  foodX: number,
  foodY: number,
  frameCount: number
): void {
  const dx = foodX - headX;
  const dy = foodY - headY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 1) return;

  const nx = dx / dist;
  const ny = dy / dist;

  const chargeGlow = state.chargeLevel;
  const baseAlpha = 0.08 + chargeGlow * 0.12;

  if (chargeGlow > 0.15) {
    const segments = 16;
    for (let i = 0; i < segments; i++) {
      const t0 = i / segments;
      const t1 = (i + 1) / segments;
      const sag0 = Math.sin(t0 * Math.PI) * (8 + chargeGlow * 6);
      const sag1 = Math.sin(t1 * Math.PI) * (8 + chargeGlow * 6);
      const wave0 = Math.sin(frameCount * 0.06 + t0 * 8) * 2;
      const wave1 = Math.sin(frameCount * 0.06 + t1 * 8) * 2;

      const x0 = headX + dx * t0 + (-ny) * (sag0 + wave0);
      const y0 = headY + dy * t0 + nx * (sag0 + wave0);
      const x1 = headX + dx * t1 + (-ny) * (sag1 + wave1);
      const y1 = headY + dy * t1 + nx * (sag1 + wave1);

      const segAlpha = baseAlpha * (0.4 + Math.sin(frameCount * 0.04 + i * 0.5) * 0.15);
      g.lineStyle(0.8 + chargeGlow * 0.5, WEB_SILVER, segAlpha);
      g.lineBetween(x0, y0, x1, y1);
    }
  }

  const nodeSpacing = 25;
  const nodeCount = Math.floor(dist / nodeSpacing);
  for (let i = 0; i < nodeCount; i++) {
    const t = (i + 0.5) / nodeCount;
    const phase = frameCount * 0.05 + i * 0.8;
    const sag = Math.sin(t * Math.PI) * (6 + chargeGlow * 4);
    const wave = Math.sin(phase) * 1.5;

    const sx = headX + nx * dist * t + (-ny) * (sag + wave);
    const sy = headY + ny * dist * t + nx * (sag + wave);

    const nodePulse = 0.7 + Math.sin(phase * 1.3) * 0.3;
    const nodeSize = (1.2 + chargeGlow * 1.2) * nodePulse;
    const nodeAlpha = baseAlpha * (0.3 + Math.sin(phase) * 0.15);

    g.fillStyle(WEB_WHITE, nodeAlpha);
    g.fillCircle(sx, sy, nodeSize);

    if (chargeGlow > 0.5 && i > 0) {
      const prevT = (i - 0.5) / nodeCount;
      const prevSag = Math.sin(prevT * Math.PI) * (6 + chargeGlow * 4);
      const prevWave = Math.sin(frameCount * 0.05 + (i - 1) * 0.8) * 1.5;
      const px = headX + nx * dist * prevT + (-ny) * (prevSag + prevWave);
      const py = headY + ny * dist * prevT + nx * (prevSag + prevWave);
      g.lineStyle(0.4, WEB_GHOST, nodeAlpha * 0.4);
      g.lineBetween(px, py, sx, sy);
    }
  }

  const reticleSize = 6 + Math.sin(frameCount * 0.08) * 2 + chargeGlow * 3;
  const reticleAlpha = 0.15 + chargeGlow * 0.25;

  drawWebReticle(g, foodX, foodY, reticleSize, reticleAlpha, frameCount);
}

function drawWebReticle(
  g: Phaser.GameObjects.Graphics,
  x: number,
  y: number,
  size: number,
  alpha: number,
  frameCount: number
): void {
  g.lineStyle(0.8, WEB_SILVER, alpha * 0.4);
  g.strokeCircle(x, y, size);

  const ringCount = 2;
  for (let r = 1; r <= ringCount; r++) {
    const ringSize = size * (r / (ringCount + 1));
    g.lineStyle(0.5, WEB_GHOST, alpha * 0.2);
    g.strokeCircle(x, y, ringSize);
  }

  const spokeCount = 8;
  for (let i = 0; i < spokeCount; i++) {
    const angle = (i / spokeCount) * Math.PI * 2 + frameCount * 0.015;
    const ex = x + Math.cos(angle) * size;
    const ey = y + Math.sin(angle) * size;
    g.lineStyle(0.5, WEB_SILVER, alpha * 0.3);
    g.lineBetween(x, y, ex, ey);
  }

  const orbCount = 3;
  for (let i = 0; i < orbCount; i++) {
    const angle = (i / orbCount) * Math.PI * 2 + frameCount * 0.03;
    const rx = x + Math.cos(angle) * size;
    const ry = y + Math.sin(angle) * size;
    g.fillStyle(WEB_WHITE, alpha * 0.5);
    g.fillCircle(rx, ry, 1.5);
  }
}

function drawTrailStrands(
  g: Phaser.GameObjects.Graphics,
  bolt: WebBolt
): void {
  for (const t of bolt.trail) {
    const lifeRatio = t.life / t.maxLife;
    if (lifeRatio < 0.01) continue;

    g.lineStyle(0.6 * lifeRatio, WEB_SILVER, lifeRatio * 0.25);
    g.lineBetween(t.anchorX, t.anchorY, t.x, t.y);

    g.fillStyle(WEB_WHITE, lifeRatio * 0.35);
    g.fillCircle(t.x, t.y, t.size * 0.6);

    g.fillStyle(WEB_GHOST, lifeRatio * 0.15);
    g.fillCircle(t.x, t.y, t.size * 1.4);
  }
}

export function drawWebBolts(
  g: Phaser.GameObjects.Graphics,
  state: WebShotState,
  frameCount: number
): void {
  for (const bolt of state.bolts) {
    const lifeRatio = Math.max(0, bolt.life);
    if (lifeRatio <= 0 && bolt.splatParticles.length === 0 && bolt.trail.length === 0) continue;

    drawTrailStrands(g, bolt);

    if (lifeRatio > 0 && !bolt.hitTarget) {
      drawWebGlob(g, bolt.endX, bolt.endY, bolt.width * bolt.scale, bolt.style, lifeRatio, frameCount);

      const dx = bolt.targetX - bolt.startX;
      const dy = bolt.targetY - bolt.startY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const tnx = dist > 0 ? -dy / dist : 0;
      const tny = dist > 0 ? dx / dist : 0;

      if (bolt.progress > 0.05) {
        const connectionAlpha = lifeRatio * 0.3;
        g.lineStyle(0.7, WEB_SILVER, connectionAlpha);
        g.lineBetween(bolt.startX, bolt.startY, bolt.endX, bolt.endY);
      }

      const ghostCount = 2;
      for (let t = 0; t < ghostCount; t++) {
        const trailProgress = bolt.progress - (t + 1) * 0.06;
        if (trailProgress <= 0) continue;
        const trailAlpha = (0.25 - t * 0.1) * lifeRatio;
        const trailSize = bolt.width * bolt.scale * (0.4 - t * 0.12);
        const arcH = Math.sin(trailProgress * Math.PI) * 8;
        const wobble = Math.sin(bolt.wobblePhase + trailProgress * 4) * 6 * Math.sin(trailProgress * Math.PI);
        const baseTX = bolt.startX + dx * trailProgress;
        const baseTY = bolt.startY + dy * trailProgress;
        const tx = baseTX + tnx * wobble;
        const ty = baseTY + tny * wobble - arcH;

        g.fillStyle(WEB_SILVER, trailAlpha * 0.3);
        g.fillCircle(tx, ty, trailSize * 1.5);
        g.fillStyle(WEB_WHITE, trailAlpha * 0.5);
        g.fillCircle(tx, ty, trailSize * 0.7);
      }
    }

    if (bolt.hitTarget && lifeRatio > 0) {
      const flash = bolt.impactFlash;

      if (flash > 0.05) {
        const flashSize = 20 * flash;
        g.fillStyle(WEB_WHITE, flash * 0.3);
        g.fillCircle(bolt.targetX, bolt.targetY, flashSize);
      }

      drawWebSplatPattern(g, bolt.targetX, bolt.targetY, lifeRatio, frameCount);
    }

    for (const p of bolt.splatParticles) {
      const pLife = Math.max(0, p.life / p.maxLife);
      if (pLife < 0.01) continue;

      if (p.isNode) {
        g.fillStyle(WEB_SILVER, pLife * 0.15);
        g.fillCircle(p.x, p.y, p.size * pLife * 2);

        g.lineStyle(0.6, WEB_WHITE, pLife * 0.5);
        g.lineBetween(bolt.targetX, bolt.targetY, p.x, p.y);

        g.fillStyle(WEB_WHITE, pLife * 0.7);
        g.fillCircle(p.x, p.y, p.size * pLife * 0.8);
      } else {
        g.lineStyle(0.4 * pLife, WEB_SILVER, pLife * 0.35);
        const endX = p.x + p.vx * 3;
        const endY = p.y + p.vy * 3;
        g.lineBetween(p.x, p.y, endX, endY);

        g.fillStyle(WEB_WHITE, pLife * 0.4);
        g.fillCircle(p.x, p.y, p.size * pLife);
      }
    }
  }
}

function drawWebSplatPattern(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  life: number,
  frameCount: number
): void {
  const outerR = 18 * life;
  const innerR = 10 * life;

  const spokeCount = 8;
  for (let i = 0; i < spokeCount; i++) {
    const angle = (i / spokeCount) * Math.PI * 2;
    const ex = cx + Math.cos(angle) * outerR;
    const ey = cy + Math.sin(angle) * outerR;
    g.lineStyle(0.7 * life, WEB_SILVER, life * 0.35);
    g.lineBetween(cx, cy, ex, ey);
  }

  const ringCount = 2;
  for (let r = 0; r < ringCount; r++) {
    const radius = innerR + (outerR - innerR) * (r / ringCount);
    const alpha = life * 0.2;
    const segments = 16;
    for (let i = 0; i < segments; i++) {
      const a0 = (i / segments) * Math.PI * 2;
      const a1 = ((i + 1) / segments) * Math.PI * 2;
      const x0 = cx + Math.cos(a0) * radius;
      const y0 = cy + Math.sin(a0) * radius;
      const x1 = cx + Math.cos(a1) * radius;
      const y1 = cy + Math.sin(a1) * radius;
      g.lineStyle(0.5 * life, WEB_GHOST, alpha);
      g.lineBetween(x0, y0, x1, y1);
    }
  }

  g.fillStyle(WEB_WHITE, life * 0.4);
  g.fillCircle(cx, cy, 3 * life);
}

function labelAlpha(label: WebShotLabel): number {
  const fadeIn = 10;
  const fadeOutStart = 60;
  if (label.age < fadeIn) return label.age / fadeIn;
  if (label.age > fadeOutStart) {
    return 1 - (label.age - fadeOutStart) / (label.maxAge - fadeOutStart);
  }
  return 1;
}

export function drawWebLabels(
  g: Phaser.GameObjects.Graphics,
  state: WebShotState,
  drawText: (
    g: Phaser.GameObjects.Graphics,
    text: string,
    x: number,
    y: number,
    size: number,
    color: number,
    alpha: number
  ) => void
): void {
  for (const label of state.labels) {
    const alpha = labelAlpha(label) * 0.95;
    if (alpha <= 0) continue;

    const size = 6;
    const charWidth = size * 0.7;
    const textWidth = label.text.length * charWidth;
    const tx = label.x - textWidth / 2;

    g.fillStyle(0x000000, alpha * 0.25);
    g.fillRect(tx - 3, label.y - size / 2 - 2, textWidth + 6, size + 4);

    g.fillStyle(WEB_GHOST, alpha * 0.1);
    g.fillRect(tx - 4, label.y - size / 2 - 3, textWidth + 8, size + 6);

    drawText(g, label.text, tx, label.y, size, WEB_WHITE, alpha);
  }
}
