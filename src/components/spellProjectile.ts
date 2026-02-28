import Phaser from 'phaser';

interface SpellTrailParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: number;
}

interface SpellImpactParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: number;
  isStar: boolean;
  rotation: number;
  rotSpeed: number;
}

interface SpellDefinition {
  name: string;
  color: number;
  glowColor: number;
  coreColor: number;
  trailHue: number;
}

const SPELLS: SpellDefinition[] = [
  { name: 'STUPEFY', color: 0xff2222, glowColor: 0xff4444, coreColor: 0xffaaaa, trailHue: 0 },
  { name: 'EXPELLIARMUS', color: 0xff6633, glowColor: 0xff8855, coreColor: 0xffccaa, trailHue: 20 },
  { name: 'EXPECTO PATRONUM', color: 0xaaccff, glowColor: 0xccddff, coreColor: 0xffffff, trailHue: 210 },
  { name: 'LUMOS', color: 0xffdd44, glowColor: 0xffee88, coreColor: 0xffffee, trailHue: 50 },
  { name: 'AVADA KEDAVRA', color: 0x22ff44, glowColor: 0x44ff66, coreColor: 0xaaffbb, trailHue: 130 },
  { name: 'PROTEGO', color: 0x4488ff, glowColor: 0x6699ff, coreColor: 0xccddff, trailHue: 220 },
  { name: 'SECTUMSEMPRA', color: 0xcc44ff, glowColor: 0xdd66ff, coreColor: 0xeeccff, trailHue: 280 },
  { name: 'PETRIFICUS TOTALUS', color: 0xaaaadd, glowColor: 0xccccee, coreColor: 0xeeeeff, trailHue: 240 },
  { name: 'CRUCIO', color: 0xff0000, glowColor: 0xdd0000, coreColor: 0xff8888, trailHue: 355 },
  { name: 'INCENDIO', color: 0xff8800, glowColor: 0xffaa33, coreColor: 0xffddaa, trailHue: 30 },
  { name: 'AGUAMENTI', color: 0x2288cc, glowColor: 0x44aaee, coreColor: 0xaaddff, trailHue: 200 },
  { name: 'SERPENSORTIA', color: 0x44bb44, glowColor: 0x66dd66, coreColor: 0xbbffbb, trailHue: 120 },
];

export interface SpellBolt {
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
  spell: SpellDefinition;
  hitTarget: boolean;
  impactParticles: SpellImpactParticle[];
  trail: SpellTrailParticle[];
  impactFlash: number;
  wobblePhase: number;
  scale: number;
}

export interface SpellLabel {
  text: string;
  x: number;
  y: number;
  startY: number;
  age: number;
  maxAge: number;
  color: number;
}

export interface SpellProjectileState {
  bolts: SpellBolt[];
  cooldown: number;
  chargeLevel: number;
  autoFireTimer: number;
  labels: SpellLabel[];
  nextSpellIndex: number;
}

const MAX_BOLTS = 4;
const BOLT_SPEED = 0.035;
const BOLT_LIFE = 1.2;
const MAX_IMPACT_PARTICLES = 50;
const IMPACT_PARTICLES_PER_HIT = 14;
const AUTO_FIRE_INTERVAL = 55;
const COOLDOWN_FRAMES = 10;
const MAX_TRAIL = 35;
const TRAIL_SPAWN_RATE = 3;
const MAX_LABELS = 3;
const LABEL_LIFETIME = 90;

export function createSpellProjectileState(): SpellProjectileState {
  return {
    bolts: [],
    cooldown: 0,
    chargeLevel: 0,
    autoFireTimer: 0,
    labels: [],
    nextSpellIndex: 0,
  };
}

function pickSpell(state: SpellProjectileState): SpellDefinition {
  const spell = SPELLS[state.nextSpellIndex % SPELLS.length];
  state.nextSpellIndex++;
  return spell;
}

export function castSpell(
  state: SpellProjectileState,
  headX: number,
  headY: number,
  foodX: number,
  foodY: number
): boolean {
  if (state.cooldown > 0) return false;
  if (state.bolts.length >= MAX_BOLTS) {
    state.bolts.shift();
  }

  const spell = pickSpell(state);

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
    width: 6 + Math.random() * 3,
    spell,
    hitTarget: false,
    impactParticles: [],
    trail: [],
    impactFlash: 0,
    wobblePhase: Math.random() * Math.PI * 2,
    scale: 0.5 + Math.random() * 0.5,
  });

  spawnSpellLabel(state, spell, headX, headY);
  state.cooldown = COOLDOWN_FRAMES;
  state.chargeLevel = 0;
  return true;
}

function spawnSpellLabel(
  state: SpellProjectileState,
  spell: SpellDefinition,
  x: number,
  y: number
): void {
  if (state.labels.length >= MAX_LABELS) {
    state.labels.shift();
  }
  state.labels.push({
    text: spell.name,
    x,
    y: y - 14,
    startY: y - 14,
    age: 0,
    maxAge: LABEL_LIFETIME,
    color: spell.color,
  });
}

export function updateSpellProjectiles(
  state: SpellProjectileState,
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
      castSpell(state, headX, headY, foodX, foodY);
    }
  }

  for (let i = state.bolts.length - 1; i >= 0; i--) {
    const bolt = state.bolts[i];

    bolt.wobblePhase += 0.15;

    if (!bolt.hitTarget) {
      bolt.progress = Math.min(1, bolt.progress + BOLT_SPEED);

      const wobbleAmp = 15 * Math.sin(bolt.progress * Math.PI);
      const dx = bolt.targetX - bolt.startX;
      const dy = bolt.targetY - bolt.startY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const nx = dist > 0 ? -dy / dist : 0;
      const ny = dist > 0 ? dx / dist : 0;
      const wobbleOffset = Math.sin(bolt.wobblePhase + bolt.progress * 5) * wobbleAmp;

      const baseX = bolt.startX + dx * bolt.progress;
      const baseY = bolt.startY + dy * bolt.progress;
      bolt.endX = baseX + nx * wobbleOffset;
      bolt.endY = baseY + ny * wobbleOffset - Math.sin(bolt.progress * Math.PI) * 12;

      bolt.scale = 0.6 + Math.sin(bolt.progress * Math.PI) * 0.4;

      spawnTrailParticles(bolt);

      const tdx = bolt.endX - bolt.targetX;
      const tdy = bolt.endY - bolt.targetY;
      const tdist = Math.sqrt(tdx * tdx + tdy * tdy);

      if (tdist < 12 || bolt.progress >= 1) {
        bolt.hitTarget = true;
        bolt.impactFlash = 1.0;
        bolt.endX = bolt.targetX;
        bolt.endY = bolt.targetY;
        hitThisFrame = true;
        spawnImpactParticles(bolt);
        spawnTrailImpactBurst(bolt);
      }
    }

    if (bolt.hitTarget) {
      bolt.endX = bolt.targetX;
      bolt.endY = bolt.targetY;
      bolt.life -= 0.03;
      bolt.impactFlash *= 0.88;
      bolt.scale *= 0.96;
    }

    updateImpactParticles(bolt);
    updateTrailParticles(bolt);

    if (bolt.life <= 0 && bolt.impactParticles.length === 0 && bolt.trail.length === 0) {
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

function updateImpactParticles(bolt: SpellBolt): void {
  for (let j = bolt.impactParticles.length - 1; j >= 0; j--) {
    const p = bolt.impactParticles[j];
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.94;
    p.vy *= 0.94;
    p.vy += 0.02;
    p.rotation += p.rotSpeed;
    p.life -= 0.025;
    if (p.life <= 0) {
      bolt.impactParticles.splice(j, 1);
    }
  }
}

function updateTrailParticles(bolt: SpellBolt): void {
  for (let j = bolt.trail.length - 1; j >= 0; j--) {
    const t = bolt.trail[j];
    t.x += t.vx;
    t.y += t.vy;
    t.vy -= 0.015;
    t.vx *= 0.96;
    t.size *= 0.97;
    t.life -= 0.04;
    if (t.life <= 0 || t.size < 0.3) {
      bolt.trail.splice(j, 1);
    }
  }
}

function spawnTrailParticles(bolt: SpellBolt): void {
  for (let i = 0; i < TRAIL_SPAWN_RATE; i++) {
    if (bolt.trail.length >= MAX_TRAIL) {
      bolt.trail.shift();
    }
    const spread = (Math.random() - 0.5) * 2;
    const life = 0.4 + Math.random() * 0.3;
    bolt.trail.push({
      x: bolt.endX + (Math.random() - 0.5) * 5,
      y: bolt.endY + (Math.random() - 0.5) * 5,
      vx: spread,
      vy: -(0.3 + Math.random() * 0.8),
      size: 1.5 + Math.random() * 3,
      life,
      maxLife: life,
      color: bolt.spell.glowColor,
    });
  }
}

function spawnImpactParticles(bolt: SpellBolt): void {
  while (bolt.impactParticles.length + IMPACT_PARTICLES_PER_HIT > MAX_IMPACT_PARTICLES) {
    bolt.impactParticles.shift();
  }

  for (let i = 0; i < IMPACT_PARTICLES_PER_HIT; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * 4;
    const isStar = i < 6;
    bolt.impactParticles.push({
      x: bolt.targetX,
      y: bolt.targetY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1,
      size: isStar ? 3 + Math.random() * 3 : 1.5 + Math.random() * 2,
      life: 1,
      maxLife: 1,
      color: isStar ? bolt.spell.coreColor : bolt.spell.glowColor,
      isStar,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.2,
    });
  }
}

function spawnTrailImpactBurst(bolt: SpellBolt): void {
  const count = 8;
  for (let i = 0; i < count; i++) {
    if (bolt.trail.length >= MAX_TRAIL) {
      bolt.trail.shift();
    }
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 3;
    const life = 0.4 + Math.random() * 0.3;
    bolt.trail.push({
      x: bolt.targetX,
      y: bolt.targetY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1,
      size: 2 + Math.random() * 2.5,
      life,
      maxLife: life,
      color: bolt.spell.color,
    });
  }
}

function drawStar4(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  size: number,
  rotation: number,
  color: number,
  alpha: number
): void {
  g.fillStyle(color, alpha);
  const points = 4;
  const outerR = size;
  const innerR = size * 0.35;
  g.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const angle = rotation + (i * Math.PI) / points;
    const r = i % 2 === 0 ? outerR : innerR;
    const px = cx + Math.cos(angle) * r;
    const py = cy + Math.sin(angle) * r;
    if (i === 0) {
      g.moveTo(px, py);
    } else {
      g.lineTo(px, py);
    }
  }
  g.closePath();
  g.fillPath();
}

function drawWandBolt(
  g: Phaser.GameObjects.Graphics,
  cx: number,
  cy: number,
  size: number,
  spell: SpellDefinition,
  alpha: number,
  frameCount: number
): void {
  const pulse = 1 + Math.sin(frameCount * 0.3) * 0.15;
  const boltSize = size * pulse;

  g.fillStyle(spell.color, alpha * 0.15);
  g.fillCircle(cx, cy, boltSize * 3);

  g.fillStyle(spell.glowColor, alpha * 0.3);
  g.fillCircle(cx, cy, boltSize * 2);

  g.fillStyle(spell.color, alpha * 0.8);
  g.fillCircle(cx, cy, boltSize);

  g.fillStyle(spell.coreColor, alpha * 0.9);
  g.fillCircle(cx, cy, boltSize * 0.5);

  g.fillStyle(0xffffff, alpha * 0.7);
  g.fillCircle(cx, cy, boltSize * 0.2);

  const sparkCount = 3;
  for (let i = 0; i < sparkCount; i++) {
    const angle = frameCount * 0.15 + (i * Math.PI * 2) / sparkCount;
    const sparkDist = boltSize * 1.5;
    const sx = cx + Math.cos(angle) * sparkDist;
    const sy = cy + Math.sin(angle) * sparkDist;
    drawStar4(g, sx, sy, boltSize * 0.3, angle * 2, spell.coreColor, alpha * 0.6);
  }
}

export function drawSpellTargetingLine(
  g: Phaser.GameObjects.Graphics,
  state: SpellProjectileState,
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
  const baseAlpha = 0.1 + chargeGlow * 0.15;

  if (chargeGlow > 0.2) {
    g.lineStyle(1.5, 0xffd700, baseAlpha * 0.25);
    g.beginPath();
    g.moveTo(headX, headY);

    const segments = 12;
    for (let i = 1; i <= segments; i++) {
      const t = i / segments;
      const bx = headX + dx * t;
      const by = headY + dy * t;
      const jitter = Math.sin(frameCount * 0.1 + i * 2) * (3 + chargeGlow * 4);
      const px = bx + (-ny) * jitter;
      const py = by + nx * jitter;
      g.lineTo(px, py);
    }
    g.strokePath();
  }

  const sparkSpacing = 20;
  const sparkCount = Math.floor(dist / sparkSpacing);
  for (let i = 0; i < sparkCount; i++) {
    const t = (i + 0.5) / sparkCount;
    const phase = frameCount * 0.08 + i * 0.7;
    const floatOffset = Math.sin(phase) * 2.5;

    const sx = headX + nx * dist * t + (-ny) * floatOffset;
    const sy = headY + ny * dist * t + nx * floatOffset;

    const sparkPulse = 0.6 + Math.sin(phase * 1.5) * 0.4;
    const sparkSize = (1.5 + chargeGlow * 1.5) * sparkPulse;
    const sparkAlpha = baseAlpha * (0.3 + Math.sin(phase) * 0.2);

    drawStar4(g, sx, sy, sparkSize, phase, 0xffd700, sparkAlpha);
  }

  const reticleSize = 5 + Math.sin(frameCount * 0.1) * 2 + chargeGlow * 3;
  const reticleAlpha = 0.2 + chargeGlow * 0.3;

  g.lineStyle(1.2, 0xffd700, reticleAlpha * 0.5);
  g.strokeCircle(foodX, foodY, reticleSize);

  const orbCount = 3;
  for (let i = 0; i < orbCount; i++) {
    const angle = (i / orbCount) * Math.PI * 2 + frameCount * 0.04;
    const rx = foodX + Math.cos(angle) * reticleSize;
    const ry = foodY + Math.sin(angle) * reticleSize;
    drawStar4(g, rx, ry, 2 + chargeGlow, angle * 2, 0xffd700, reticleAlpha * 0.6);
  }
}

function drawTrailParticles(
  g: Phaser.GameObjects.Graphics,
  bolt: SpellBolt
): void {
  for (const t of bolt.trail) {
    const lifeRatio = t.life / t.maxLife;
    if (lifeRatio < 0.01) continue;

    g.fillStyle(t.color, lifeRatio * 0.2);
    g.fillCircle(t.x, t.y, t.size * 1.6);

    g.fillStyle(t.color, lifeRatio * 0.5);
    g.fillCircle(t.x, t.y, t.size);

    g.fillStyle(bolt.spell.coreColor, lifeRatio * 0.6);
    g.fillCircle(t.x, t.y, t.size * 0.4);
  }
}

export function drawSpellBolts(
  g: Phaser.GameObjects.Graphics,
  state: SpellProjectileState,
  frameCount: number
): void {
  for (const bolt of state.bolts) {
    const lifeRatio = Math.max(0, bolt.life);
    if (lifeRatio <= 0 && bolt.impactParticles.length === 0 && bolt.trail.length === 0) continue;

    drawTrailParticles(g, bolt);

    if (lifeRatio > 0 && !bolt.hitTarget) {
      drawWandBolt(g, bolt.endX, bolt.endY, bolt.width * bolt.scale, bolt.spell, lifeRatio, frameCount);

      const dx = bolt.targetX - bolt.startX;
      const dy = bolt.targetY - bolt.startY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const tnx = dist > 0 ? -dy / dist : 0;
      const tny = dist > 0 ? dx / dist : 0;
      const trailCount = 3;
      for (let t = 0; t < trailCount; t++) {
        const trailProgress = bolt.progress - (t + 1) * 0.05;
        if (trailProgress <= 0) continue;
        const trailAlpha = (0.35 - t * 0.1) * lifeRatio;
        const trailSize = bolt.width * bolt.scale * (0.5 - t * 0.12);
        const wobbleAmp = 15 * Math.sin(trailProgress * Math.PI);
        const wobbleOff = Math.sin(bolt.wobblePhase + trailProgress * 5) * wobbleAmp;
        const baseTX = bolt.startX + dx * trailProgress;
        const baseTY = bolt.startY + dy * trailProgress;
        const tx = baseTX + tnx * wobbleOff;
        const ty = baseTY + tny * wobbleOff - Math.sin(trailProgress * Math.PI) * 12;

        g.fillStyle(bolt.spell.glowColor, trailAlpha * 0.4);
        g.fillCircle(tx, ty, trailSize * 1.5);
        g.fillStyle(bolt.spell.color, trailAlpha);
        g.fillCircle(tx, ty, trailSize);
      }
    }

    if (bolt.hitTarget && lifeRatio > 0) {
      const flash = bolt.impactFlash;
      const impactPulse = 1 + Math.sin(frameCount * 0.6) * 0.2;

      if (flash > 0.05) {
        const flashSize = 22 * flash * impactPulse;
        g.fillStyle(bolt.spell.coreColor, flash * 0.4);
        g.fillCircle(bolt.targetX, bolt.targetY, flashSize);
      }

      const outerGlow = (12 + bolt.width) * lifeRatio * impactPulse;
      g.fillStyle(bolt.spell.glowColor, 0.2 * lifeRatio);
      g.fillCircle(bolt.targetX, bolt.targetY, outerGlow);

      g.fillStyle(bolt.spell.color, 0.4 * lifeRatio);
      g.fillCircle(bolt.targetX, bolt.targetY, outerGlow * 0.5);
    }

    for (const p of bolt.impactParticles) {
      const pLife = Math.max(0, p.life / p.maxLife);
      if (pLife < 0.01) continue;

      if (p.isStar) {
        g.fillStyle(p.color, pLife * 0.25);
        g.fillCircle(p.x, p.y, p.size * pLife * 1.8);
        drawStar4(g, p.x, p.y, p.size * pLife, p.rotation, p.color, pLife * 0.85);
      } else {
        g.fillStyle(p.color, pLife * 0.3);
        g.fillCircle(p.x, p.y, p.size * pLife * 1.5);
        g.fillStyle(p.color, pLife * 0.7);
        g.fillCircle(p.x, p.y, p.size * pLife);
        if (pLife > 0.5) {
          g.fillStyle(0xffffff, (pLife - 0.5) * 0.6);
          g.fillCircle(p.x, p.y, p.size * pLife * 0.3);
        }
      }
    }
  }
}

function labelAlpha(label: SpellLabel): number {
  const fadeIn = 10;
  const fadeOutStart = 60;
  if (label.age < fadeIn) return label.age / fadeIn;
  if (label.age > fadeOutStart) {
    return 1 - (label.age - fadeOutStart) / (label.maxAge - fadeOutStart);
  }
  return 1;
}

export function drawSpellLabels(
  g: Phaser.GameObjects.Graphics,
  state: SpellProjectileState,
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

    g.fillStyle(0x000000, alpha * 0.3);
    g.fillRect(tx - 3, label.y - size / 2 - 2, textWidth + 6, size + 4);

    g.fillStyle(label.color, alpha * 0.15);
    g.fillRect(tx - 4, label.y - size / 2 - 3, textWidth + 8, size + 6);

    drawText(g, label.text, tx, label.y, size, label.color, alpha);
  }
}
