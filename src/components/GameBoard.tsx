import { useEffect, useRef, useCallback } from 'react';
import './GameBoard.css';
import type { SnakeScene } from './SnakeScene';

interface Position {
  x: number;
  y: number;
}

interface GameState {
  snake: Position[];
  food: Position;
  gameOver: boolean;
}

interface GameBoardProps {
  gameState: GameState;
  gridSize: number;
}

const CELL_SIZE = 20;

const GRID_SIZE = 20;

// Color palette - Alice in Wonderland theme: magical, whimsical, dreamlike
const COLORS = {
  bgLight: '#1a1525',
  bgPaper: '#231d30',
  gridLine: '#3d2d50',
  gridAccent: '#5a3d70',
  // Cheshire Cat colors (purple/pink)
  snakeHead: '#9b59b6',
  snakeBody: '#8e44ad',
  snakeTail: '#7d3c98',
  snakeHighlight: '#d8a8e8',
  snakeEye: '#f0e68c',
  snakePupil: '#2d2d2d',
  snakeCheek: '#ff69b4',
  // Teacup/food colors
  food: '#f4d03f',
  foodCore: '#ffeaa7',
  foodGlow: '#fff5cc',
  gameOverOverlay: 'rgba(26, 21, 37, 0.95)',
  // Wonderland accent colors
  cardRed: '#e74c3c',
  cardBlack: '#2c3e50',
  roseRed: '#c0392b',
  rosePink: '#ff6b9d',
  teaGold: '#f39c12',
  clockGold: '#d4af37',
  magicPurple: '#9b59b6',
  magicBlue: '#3498db',
  magicPink: '#e056fd',
  magicTeal: '#00cec9',
};

function hslToRgb(h: number, s: number, l: number): string {
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
}

// Animation frame counter for rainbow effect
let frameCount = 0;

// Cheshire Cat ears - pointed, magical cat ears
function drawCatEars(
  ctx: CanvasRenderingContext2D,
  headX: number,
  headY: number,
  dx: number,
  dy: number,
  perpX: number,
  perpY: number,
  frame: number
): void {
  const earOffset = -7;
  const earBaseX = headX - dx * earOffset;
  const earBaseY = headY - dy * earOffset;

  // Animated ear twitch
  const twitch = Math.sin(frame * 0.08) * 0.15;

  // Cheshire Cat colors - purple with pink inner
  const earOuter = '#9b59b6';
  const earInner = '#ff69b4';

  const earSize = 9;
  const earSpread = 6;

  // Left ear
  ctx.save();
  ctx.translate(earBaseX + perpX * earSpread, earBaseY + perpY * earSpread);
  ctx.rotate(Math.atan2(perpY, perpX) + 0.4 + twitch);

  // Outer ear
  ctx.fillStyle = earOuter;
  ctx.beginPath();
  ctx.moveTo(0, earSize);
  ctx.lineTo(-earSize * 0.7, -earSize * 0.3);
  ctx.lineTo(0, -earSize);
  ctx.lineTo(earSize * 0.7, -earSize * 0.3);
  ctx.closePath();
  ctx.fill();

  // Inner ear (pink)
  ctx.fillStyle = earInner;
  ctx.beginPath();
  ctx.moveTo(0, earSize * 0.5);
  ctx.lineTo(-earSize * 0.35, -earSize * 0.1);
  ctx.lineTo(0, -earSize * 0.5);
  ctx.lineTo(earSize * 0.35, -earSize * 0.1);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Right ear
  ctx.save();
  ctx.translate(earBaseX - perpX * earSpread, earBaseY - perpY * earSpread);
  ctx.rotate(Math.atan2(-perpY, -perpX) + 0.4 - twitch);

  // Outer ear
  ctx.fillStyle = earOuter;
  ctx.beginPath();
  ctx.moveTo(0, earSize);
  ctx.lineTo(-earSize * 0.7, -earSize * 0.3);
  ctx.lineTo(0, -earSize);
  ctx.lineTo(earSize * 0.7, -earSize * 0.3);
  ctx.closePath();
  ctx.fill();

  // Inner ear (pink)
  ctx.fillStyle = earInner;
  ctx.beginPath();
  ctx.moveTo(0, earSize * 0.5);
  ctx.lineTo(-earSize * 0.35, -earSize * 0.1);
  ctx.lineTo(0, -earSize * 0.5);
  ctx.lineTo(earSize * 0.35, -earSize * 0.1);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// Cheshire Cat whiskers - magical glowing whiskers
function drawWhiskers(
  ctx: CanvasRenderingContext2D,
  headX: number,
  headY: number,
  dx: number,
  dy: number,
  perpX: number,
  perpY: number,
  frame: number
): void {
  const whiskerBase = 4;
  const whiskerLength = 14;
  const wiggle = Math.sin(frame * 0.12) * 0.1;

  // Magical purple whiskers
  ctx.strokeStyle = '#d8a8e8';
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';

  // Left whiskers (3)
  for (let i = 0; i < 3; i++) {
    const angle = -0.3 + i * 0.3 + wiggle;
    const startX = headX + perpX * whiskerBase + dx * 3;
    const startY = headY + perpY * whiskerBase + dy * 3;
    const endX = startX + perpX * whiskerLength * Math.cos(angle) + Math.cos(angle + Math.PI / 4) * whiskerLength * 0.5;
    const endY = startY + perpY * whiskerLength * Math.cos(angle) + Math.sin(angle + Math.PI / 4) * whiskerLength * 0.5;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(
      startX + perpX * whiskerLength * 0.5,
      startY + perpY * whiskerLength * 0.5,
      endX,
      endY
    );
    ctx.stroke();
  }

  // Right whiskers (3)
  for (let i = 0; i < 3; i++) {
    const angle = -0.3 + i * 0.3 - wiggle;
    const startX = headX - perpX * whiskerBase + dx * 3;
    const startY = headY - perpY * whiskerBase + dy * 3;
    const endX = startX - perpX * whiskerLength * Math.cos(angle) - Math.cos(angle + Math.PI / 4) * whiskerLength * 0.5;
    const endY = startY - perpY * whiskerLength * Math.cos(angle) - Math.sin(angle + Math.PI / 4) * whiskerLength * 0.5;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(
      startX - perpX * whiskerLength * 0.5,
      startY - perpY * whiskerLength * 0.5,
      endX,
      endY
    );
    ctx.stroke();
  }
}

// Cute fangs/teeth shown briefly when eating
let teethShowTimer = 0;
const TEETH_DURATION = 20;

function drawTeeth(
  ctx: CanvasRenderingContext2D,
  headX: number,
  headY: number,
  dx: number,
  dy: number
): void {
  if (teethShowTimer <= 0) return;

  const toothSize = 4 * (teethShowTimer / TEETH_DURATION);
  const mouthX = headX + dx * 6;
  const mouthY = headY + dy * 6;

  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = teethShowTimer / TEETH_DURATION;

  // Left fang
  ctx.beginPath();
  ctx.moveTo(mouthX - 3, mouthY);
  ctx.lineTo(mouthX - 3 + dx * toothSize, mouthY + dy * toothSize + toothSize * 0.5);
  ctx.lineTo(mouthX - 1, mouthY);
  ctx.closePath();
  ctx.fill();

  // Right fang
  ctx.beginPath();
  ctx.moveTo(mouthX + 3, mouthY);
  ctx.lineTo(mouthX + 3 + dx * toothSize, mouthY + dy * toothSize + toothSize * 0.5);
  ctx.lineTo(mouthX + 1, mouthY);
  ctx.closePath();
  ctx.fill();

  ctx.globalAlpha = 1;
}

// Aurora wave state for Canvas 2D
interface Aurora2D {
  y: number;
  phase: number;
  speed: number;
  hue: number;
  thickness: number;
  amplitude: number;
}

interface Nebula2D {
  x: number;
  y: number;
  radius: number;
  hue: number;
  alpha: number;
  driftX: number;
  driftY: number;
  pulsePhase: number;
  pulseSpeed: number;
}

interface VortexRing2D {
  radius: number;
  baseRadius: number;
  rotationOffset: number;
  rotationSpeed: number;
  thickness: number;
  hue: number;
  pulsePhase: number;
}

interface VortexParticle2D {
  angle: number;
  radius: number;
  baseRadius: number;
  speed: number;
  size: number;
  hue: number;
  alpha: number;
}

let auroraWaves: Aurora2D[] = [];
let nebulaClouds: Nebula2D[] = [];
let vortexRings: VortexRing2D[] = [];
let vortexParticles: VortexParticle2D[] = [];
let vortexPulse = 0;
let effectsInitialized = false;

// New dramatic effect state
interface BurstParticle2D {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  size: number;
  hue: number;
  trail: { x: number; y: number }[];
}
let burstParticles: BurstParticle2D[] = [];
let chromaticIntensity = 0;
let energyFieldPulse = 0;
let screenShakeX = 0;
let screenShakeY = 0;
let screenShakeIntensity = 0;
let lastSnakeLength = 0;
let wasGameOver = false;

// Lightning arc state for dramatic snake connections
interface LightningBolt2D {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  segments: { x: number; y: number }[];
  life: number;
  hue: number;
  intensity: number;
}
let lightningBolts: LightningBolt2D[] = [];
let lightningTimer = 0;

// Scanline effect state
let scanlineY = 0;
let scanlineSpeed = 2;

// Film noir specific state
let venetianPhase = 0;
let spotlightX = 200;
let spotlightY = 200;

// Floating star/sparkle state - friendly decorations
interface FloatingStar2D {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  size: number;
  phase: number;
  speed: number;
  twinklePhase: number;
  color: string;
}
let floatingStars: FloatingStar2D[] = [];
let starsInitialized = false;

// Meteor shower state
interface Meteor2D {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  hue: number;
  alpha: number;
  trail: { x: number; y: number }[];
}
let meteors: Meteor2D[] = [];
const NUM_METEORS = 8;

// Death debris state
interface DeathDebris2D {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  hue: number;
  rotation: number;
  rotationSpeed: number;
  life: number;
  type: 'shard' | 'spark' | 'ember';
}
let deathDebris: DeathDebris2D[] = [];
let deathExplosionPhase = 0;

// Food orb particle system - dramatic attraction effect
interface FoodOrbitParticle2D {
  angle: number;
  radius: number;
  speed: number;
  size: number;
  hue: number;
  alpha: number;
  layer: number;
}
let foodOrbitParticles: FoodOrbitParticle2D[] = [];
let foodOrbPhase = 0;
let foodOrbInitialized = false;

// Flame particle system - burning effect trailing behind snake
interface FlameParticle2D {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  hue: number;
  brightness: number;
}
let flameParticles: FlameParticle2D[] = [];
const MAX_FLAME_PARTICLES = 60;

function initFloatingStars(): void {
  if (starsInitialized) return;
  starsInitialized = true;

  const width = GRID_SIZE * CELL_SIZE;
  const height = GRID_SIZE * CELL_SIZE;
  floatingStars = [];

  // Wonderland magical colors
  const starColors = [COLORS.magicPurple, COLORS.magicPink, COLORS.magicBlue, COLORS.teaGold, COLORS.magicTeal];

  // Create floating magical sparkles around the edges
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * Math.PI * 2;
    const dist = Math.max(width, height) * 0.42 + Math.random() * 20;
    const x = width / 2 + Math.cos(angle) * dist;
    const y = height / 2 + Math.sin(angle) * dist;

    floatingStars.push({
      x,
      y,
      baseX: x,
      baseY: y,
      size: 6 + Math.random() * 6,
      phase: Math.random() * Math.PI * 2,
      speed: 0.015 + Math.random() * 0.015,
      twinklePhase: Math.random() * Math.PI * 2,
      color: starColors[i % starColors.length],
    });
  }
}

function updateFloatingStars(): void {
  const width = GRID_SIZE * CELL_SIZE;
  const height = GRID_SIZE * CELL_SIZE;

  for (const star of floatingStars) {
    star.phase += star.speed;
    star.twinklePhase += 0.08;

    // Gentle floating motion
    const floatX = Math.sin(star.phase) * 8;
    const floatY = Math.cos(star.phase * 0.7) * 6;

    star.x = star.baseX + floatX;
    star.y = star.baseY + floatY;

    // Keep stars on screen
    star.x = Math.max(-20, Math.min(width + 20, star.x));
    star.y = Math.max(-20, Math.min(height + 20, star.y));
  }
}

function drawFloatingStar(ctx: CanvasRenderingContext2D, star: FloatingStar2D): void {
  const { x, y, size, twinklePhase, color } = star;

  const twinkle = 0.6 + Math.sin(twinklePhase) * 0.4;
  const scale = 0.9 + Math.sin(twinklePhase * 1.5) * 0.1;
  const starSize = size * scale;

  ctx.save();

  // Outer glow
  ctx.fillStyle = color;
  ctx.globalAlpha = twinkle * 0.3;
  ctx.beginPath();
  ctx.arc(x, y, starSize * 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Draw 4-pointed star shape
  ctx.globalAlpha = twinkle * 0.9;
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? starSize : starSize * 0.4;
    const px = x + Math.cos(angle) * r;
    const py = y + Math.sin(angle) * r;
    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.closePath();
  ctx.fill();

  // White center sparkle
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = twinkle;
  ctx.beginPath();
  ctx.arc(x, y, starSize * 0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function initCanvas2DEffects(): void {
  if (effectsInitialized) return;
  effectsInitialized = true;

  const width = GRID_SIZE * CELL_SIZE;
  const height = GRID_SIZE * CELL_SIZE;

  // Initialize aurora waves
  const auroraHues = [120, 160, 180, 280, 320];
  auroraWaves = [];
  for (let i = 0; i < 5; i++) {
    auroraWaves.push({
      y: height * 0.2 + (height * 0.6 * i) / 5,
      phase: Math.random() * Math.PI * 2,
      speed: 0.008 + Math.random() * 0.006,
      hue: auroraHues[i % auroraHues.length],
      thickness: 25 + Math.random() * 20,
      amplitude: 15 + Math.random() * 25,
    });
  }

  // Initialize nebula clouds
  const nebulaHues = [260, 220, 300, 180, 340, 240];
  nebulaClouds = [];
  for (let i = 0; i < 6; i++) {
    nebulaClouds.push({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 40 + Math.random() * 60,
      hue: nebulaHues[i % nebulaHues.length],
      alpha: 0.04 + Math.random() * 0.04,
      driftX: (Math.random() - 0.5) * 0.15,
      driftY: (Math.random() - 0.5) * 0.15,
      pulsePhase: Math.random() * Math.PI * 2,
      pulseSpeed: 0.01 + Math.random() * 0.01,
    });
  }

  // Initialize vortex rings
  const ringHues = [280, 200, 320, 180, 260];
  vortexRings = [];
  for (let i = 0; i < 5; i++) {
    const baseRadius = 25 + i * 18;
    vortexRings.push({
      radius: baseRadius,
      baseRadius,
      rotationOffset: (i * Math.PI * 2) / 5,
      rotationSpeed: 0.02 - i * 0.003,
      thickness: 2 + (5 - i) * 0.5,
      hue: ringHues[i % ringHues.length],
      pulsePhase: i * 0.5,
    });
  }

  // Initialize vortex particles
  vortexParticles = [];
  for (let i = 0; i < 20; i++) {
    const baseRadius = 20 + Math.random() * 80;
    vortexParticles.push({
      angle: Math.random() * Math.PI * 2,
      radius: baseRadius,
      baseRadius,
      speed: 0.02 + Math.random() * 0.03,
      size: 1 + Math.random() * 2,
      hue: Math.random() * 360,
      alpha: 0.3 + Math.random() * 0.5,
    });
  }

  // Initialize meteors
  initMeteors(width, height);

  // Initialize food orb particles
  initFoodOrbParticles();

  // Initialize floating stars
  initFloatingStars();
}

function initFoodOrbParticles(): void {
  if (foodOrbInitialized) return;
  foodOrbInitialized = true;

  foodOrbitParticles = [];
  // Create 3 layers of orbiting particles
  for (let layer = 0; layer < 3; layer++) {
    const baseRadius = 12 + layer * 8;
    const numParticles = 6 + layer * 2;
    for (let i = 0; i < numParticles; i++) {
      foodOrbitParticles.push({
        angle: (i / numParticles) * Math.PI * 2 + layer * 0.5,
        radius: baseRadius + Math.random() * 4,
        speed: (0.04 + Math.random() * 0.02) * (layer % 2 === 0 ? 1 : -1),
        size: 1.5 + Math.random() * 1.5,
        hue: 340 + Math.random() * 40, // Pink to red range
        alpha: 0.6 + Math.random() * 0.4,
        layer,
      });
    }
  }
}

function spawnFlameParticle(x: number, y: number, intensity: number): void {
  if (flameParticles.length >= MAX_FLAME_PARTICLES) {
    // Remove oldest particle
    flameParticles.shift();
  }

  const angle = Math.random() * Math.PI * 2;
  const speed = 0.3 + Math.random() * 0.6;
  const life = 0.5 + Math.random() * 0.5;

  flameParticles.push({
    x: x + (Math.random() - 0.5) * 6,
    y: y + (Math.random() - 0.5) * 6,
    vx: Math.cos(angle) * speed * 0.3,
    vy: -0.5 - Math.random() * 1.5 * intensity, // Magic sparkles rise upward
    size: 3 + Math.random() * 4 * intensity,
    life,
    maxLife: life,
    hue: 280 + Math.random() * 60, // Purple to pink range (magical Cheshire trail)
    brightness: 0.5 + Math.random() * 0.3,
  });
}

function updateFlameParticles(): void {
  for (let i = flameParticles.length - 1; i >= 0; i--) {
    const p = flameParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy -= 0.02; // Slight upward acceleration (flames rise)
    p.vx *= 0.98; // Horizontal drag
    p.size *= 0.97; // Shrink over time
    p.life -= 0.025;

    if (p.life <= 0 || p.size < 0.5) {
      flameParticles.splice(i, 1);
    }
  }
}

function drawFlameParticles(ctx: CanvasRenderingContext2D): void {
  for (const p of flameParticles) {
    const lifeRatio = p.life / p.maxLife;

    // Magical purple/pink sparkle trail (Cheshire Cat disappearing effect)
    const hue = p.hue - (1 - lifeRatio) * 20;
    const saturation = 70;
    const lightness = 55 + lifeRatio * 15;

    // Outer magical glow
    ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness - 15}%, ${lifeRatio * 0.25})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
    ctx.fill();

    // Mid sparkle
    ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${lifeRatio * 0.5})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 1.3, 0, Math.PI * 2);
    ctx.fill();

    // Bright core (white/pink)
    ctx.fillStyle = `hsla(${hue + 30}, ${saturation - 20}%, ${lightness + 25}%, ${lifeRatio * 0.7})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function initMeteors(width: number, height: number): void {
  meteors = [];
  for (let i = 0; i < NUM_METEORS; i++) {
    spawnMeteor(width, height, true);
  }
}

function spawnMeteor(width: number, height: number, initial: boolean): void {
  if (meteors.length >= NUM_METEORS) return;

  const startX = initial ? Math.random() * width * 1.5 : width + 20 + Math.random() * 40;
  const startY = initial ? Math.random() * height * 0.5 - height * 0.25 : -20 - Math.random() * 40;

  const angle = Math.PI * 0.65 + (Math.random() - 0.5) * 0.4;
  const speed = 1.5 + Math.random() * 2;

  meteors.push({
    x: startX,
    y: startY,
    vx: -Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    size: 2 + Math.random() * 3,
    hue: Math.random() < 0.3 ? 30 + Math.random() * 30 : 180 + Math.random() * 60,
    alpha: 0.6 + Math.random() * 0.4,
    trail: [],
  });
}

function spawnDeathExplosion2D(snake: Position[], hueOffset: number): void {
  deathDebris = [];
  deathExplosionPhase = 1;

  const maxDebris = 24;
  const debrisPerSeg = Math.min(3, Math.floor(maxDebris / snake.length));

  for (let i = 0; i < snake.length; i++) {
    const seg = snake[i];
    const cx = seg.x * CELL_SIZE + CELL_SIZE / 2;
    const cy = seg.y * CELL_SIZE + CELL_SIZE / 2;
    const segHue = (hueOffset + i * 15) % 360;

    for (let j = 0; j < debrisPerSeg; j++) {
      if (deathDebris.length >= maxDebris) break;

      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;
      const types: ('shard' | 'spark' | 'ember')[] = ['shard', 'spark', 'ember'];

      deathDebris.push({
        x: cx + (Math.random() - 0.5) * 8,
        y: cy + (Math.random() - 0.5) * 8,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        size: 3 + Math.random() * 5,
        hue: segHue + (Math.random() - 0.5) * 40,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.4,
        life: 1,
        type: types[Math.floor(Math.random() * types.length)],
      });
    }
  }
}

function spawnBurstParticles(x: number, y: number, hueOffset: number): void {
  burstParticles = [];
  const numParticles = 12;
  for (let i = 0; i < numParticles; i++) {
    const angle = (i / numParticles) * Math.PI * 2 + Math.random() * 0.3;
    const speed = 3 + Math.random() * 4;
    burstParticles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      size: 3 + Math.random() * 4,
      hue: hueOffset + Math.random() * 60,
      trail: [],
    });
  }
}

function generateLightningPath(x1: number, y1: number, x2: number, y2: number, jitter: number): { x: number; y: number }[] {
  const segments: { x: number; y: number }[] = [];
  const numSegments = 4;
  segments.push({ x: x1, y: y1 });

  for (let i = 1; i < numSegments; i++) {
    const t = i / numSegments;
    const baseX = x1 + (x2 - x1) * t;
    const baseY = y1 + (y2 - y1) * t;
    const perpX = -(y2 - y1);
    const perpY = x2 - x1;
    const len = Math.sqrt(perpX * perpX + perpY * perpY);
    const offset = (Math.random() - 0.5) * jitter;
    segments.push({
      x: baseX + (perpX / len) * offset,
      y: baseY + (perpY / len) * offset,
    });
  }
  segments.push({ x: x2, y: y2 });
  return segments;
}

function spawnLightningBetweenSegments(snake: { x: number; y: number }[], hueOffset: number): void {
  if (snake.length < 2) return;

  // Spawn lightning between random consecutive segments
  const maxBolts = Math.min(3, snake.length - 1);
  for (let b = 0; b < maxBolts; b++) {
    const idx = Math.floor(Math.random() * (snake.length - 1));
    const seg1 = snake[idx];
    const seg2 = snake[idx + 1];

    const x1 = seg1.x * CELL_SIZE + CELL_SIZE / 2;
    const y1 = seg1.y * CELL_SIZE + CELL_SIZE / 2;
    const x2 = seg2.x * CELL_SIZE + CELL_SIZE / 2;
    const y2 = seg2.y * CELL_SIZE + CELL_SIZE / 2;

    lightningBolts.push({
      startX: x1,
      startY: y1,
      endX: x2,
      endY: y2,
      segments: generateLightningPath(x1, y1, x2, y2, 8),
      life: 1,
      hue: (hueOffset + idx * 15 + Math.random() * 30) % 360,
      intensity: 0.6 + Math.random() * 0.4,
    });
  }
}

function updateCanvas2DEffects(): void {
  // Update screen shake
  if (screenShakeIntensity > 0) {
    screenShakeX = (Math.random() - 0.5) * screenShakeIntensity;
    screenShakeY = (Math.random() - 0.5) * screenShakeIntensity;
    screenShakeIntensity *= 0.9;
    if (screenShakeIntensity < 0.5) {
      screenShakeIntensity = 0;
      screenShakeX = 0;
      screenShakeY = 0;
    }
  }

  // Decay chromatic aberration
  if (chromaticIntensity > 0) {
    chromaticIntensity *= 0.92;
    if (chromaticIntensity < 0.05) chromaticIntensity = 0;
  }

  // Decay energy field pulse
  if (energyFieldPulse > 0) {
    energyFieldPulse *= 0.95;
    if (energyFieldPulse < 0.05) energyFieldPulse = 0;
  }

  // Update lightning bolts
  for (let i = lightningBolts.length - 1; i >= 0; i--) {
    const bolt = lightningBolts[i];
    bolt.life -= 0.15;
    // Re-jitter the path for flickering effect
    if (bolt.life > 0.3) {
      bolt.segments = generateLightningPath(bolt.startX, bolt.startY, bolt.endX, bolt.endY, 8 * bolt.life);
    }
    if (bolt.life <= 0) {
      lightningBolts.splice(i, 1);
    }
  }

  // Update scanline
  scanlineY += scanlineSpeed;
  if (scanlineY > GRID_SIZE * CELL_SIZE + 20) {
    scanlineY = -20;
  }

  // Update meteors
  const width = GRID_SIZE * CELL_SIZE;
  const height = GRID_SIZE * CELL_SIZE;
  for (let i = meteors.length - 1; i >= 0; i--) {
    const m = meteors[i];
    m.trail.unshift({ x: m.x, y: m.y });
    if (m.trail.length > 12) m.trail.pop();
    m.x += m.vx;
    m.y += m.vy;
    if (m.x < -50 || m.y > height + 50) {
      meteors.splice(i, 1);
      spawnMeteor(width, height, false);
    }
  }

  // Update death debris
  if (deathExplosionPhase > 0) {
    deathExplosionPhase *= 0.95;
    if (deathExplosionPhase < 0.01) deathExplosionPhase = 0;
  }
  for (let i = deathDebris.length - 1; i >= 0; i--) {
    const d = deathDebris[i];
    d.x += d.vx;
    d.y += d.vy;
    d.vy += 0.08;
    d.vx *= 0.99;
    d.rotation += d.rotationSpeed;
    d.life -= 0.015;
    if (d.life <= 0) {
      deathDebris.splice(i, 1);
    }
  }

  // Update burst particles
  for (let i = burstParticles.length - 1; i >= 0; i--) {
    const p = burstParticles[i];
    p.trail.unshift({ x: p.x, y: p.y });
    if (p.trail.length > 6) p.trail.pop();
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.96;
    p.vy *= 0.96;
    p.life -= 0.025;
    if (p.life <= 0) {
      burstParticles.splice(i, 1);
    }
  }

  // Update flame particles
  updateFlameParticles();
}

function drawCanvas2D(canvas: HTMLCanvasElement, gameState: GameState): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  initCanvas2DEffects();
  frameCount++;
  const hueOffset = (frameCount * 0.5) % 360;
  venetianPhase += 0.008;

  const width = GRID_SIZE * CELL_SIZE;
  const height = GRID_SIZE * CELL_SIZE;

  // Track snake head for spotlight
  if (gameState.snake.length > 0) {
    const head = gameState.snake[0];
    const headX = head.x * CELL_SIZE + CELL_SIZE / 2;
    const headY = head.y * CELL_SIZE + CELL_SIZE / 2;
    spotlightX += (headX - spotlightX) * 0.08;
    spotlightY += (headY - spotlightY) * 0.08;
  }

  // Detect food eaten (snake got longer)
  if (gameState.snake.length > lastSnakeLength && lastSnakeLength > 0) {
    const head = gameState.snake[0];
    const headX = head.x * CELL_SIZE + CELL_SIZE / 2;
    const headY = head.y * CELL_SIZE + CELL_SIZE / 2;
    spawnBurstParticles(headX, headY, hueOffset);
    chromaticIntensity = 1.0;
    energyFieldPulse = 1.0;
    spawnLightningBetweenSegments(gameState.snake, hueOffset);
    teethShowTimer = TEETH_DURATION;
  }
  lastSnakeLength = gameState.snake.length;

  // Update teeth timer
  if (teethShowTimer > 0) {
    teethShowTimer--;
  }

  // Spawn periodic lightning between segments
  lightningTimer++;
  if (lightningTimer >= 8 && gameState.snake.length > 1 && !gameState.gameOver) {
    lightningTimer = 0;
    spawnLightningBetweenSegments(gameState.snake, hueOffset);
  }

  // Spawn flame particles along the snake body (every few frames)
  if (frameCount % 2 === 0 && !gameState.gameOver) {
    for (let i = 0; i < gameState.snake.length; i++) {
      const seg = gameState.snake[i];
      const segX = seg.x * CELL_SIZE + CELL_SIZE / 2;
      const segY = seg.y * CELL_SIZE + CELL_SIZE / 2;
      // More flames at head, fewer at tail
      const intensity = 1 - (i / gameState.snake.length) * 0.6;
      if (Math.random() < 0.4 * intensity) {
        spawnFlameParticle(segX, segY, intensity);
      }
    }
  }

  // Detect game over transition
  if (gameState.gameOver && !wasGameOver) {
    screenShakeIntensity = 15;
    chromaticIntensity = 2.0;
    spawnDeathExplosion2D(gameState.snake, hueOffset);
  }
  wasGameOver = gameState.gameOver;

  // Update effects
  updateCanvas2DEffects();

  ctx.save();
  ctx.scale(canvas.width / width, canvas.height / height);

  // Apply screen shake
  if (screenShakeIntensity > 0) {
    ctx.translate(screenShakeX, screenShakeY);
  }

  // Deep wonderland night sky background
  ctx.fillStyle = COLORS.bgLight;
  ctx.fillRect(0, 0, width, height);

  // Magical radial gradient for dreamlike atmosphere
  const wonderGradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width * 0.8);
  wonderGradient.addColorStop(0, 'rgba(75, 45, 100, 0.4)');
  wonderGradient.addColorStop(0.5, 'rgba(45, 30, 65, 0.3)');
  wonderGradient.addColorStop(1, 'rgba(26, 21, 37, 0.5)');
  ctx.fillStyle = wonderGradient;
  ctx.fillRect(0, 0, width, height);

  // Draw playing card suit patterns in corners (subtle background)
  ctx.globalAlpha = 0.08;
  const suitSize = 18;
  const suitColors = [COLORS.cardRed, COLORS.cardBlack, COLORS.cardRed, COLORS.cardBlack];

  // Draw card suits in corners
  for (let corner = 0; corner < 4; corner++) {
    const cx = corner % 2 === 0 ? 25 : width - 25;
    const cy = corner < 2 ? 25 : height - 25;
    ctx.fillStyle = suitColors[corner];

    if (corner === 0) {
      // Heart
      ctx.beginPath();
      ctx.moveTo(cx, cy + suitSize * 0.3);
      ctx.bezierCurveTo(cx - suitSize * 0.5, cy - suitSize * 0.3, cx - suitSize * 0.5, cy + suitSize * 0.1, cx, cy + suitSize * 0.5);
      ctx.bezierCurveTo(cx + suitSize * 0.5, cy + suitSize * 0.1, cx + suitSize * 0.5, cy - suitSize * 0.3, cx, cy + suitSize * 0.3);
      ctx.closePath();
      ctx.fill();
    } else if (corner === 1) {
      // Spade
      ctx.beginPath();
      ctx.moveTo(cx, cy - suitSize * 0.4);
      ctx.bezierCurveTo(cx - suitSize * 0.5, cy + suitSize * 0.1, cx - suitSize * 0.3, cy + suitSize * 0.4, cx, cy + suitSize * 0.2);
      ctx.bezierCurveTo(cx + suitSize * 0.3, cy + suitSize * 0.4, cx + suitSize * 0.5, cy + suitSize * 0.1, cx, cy - suitSize * 0.4);
      ctx.fill();
      ctx.fillRect(cx - 2, cy + suitSize * 0.2, 4, suitSize * 0.25);
    } else if (corner === 2) {
      // Diamond
      ctx.beginPath();
      ctx.moveTo(cx, cy - suitSize * 0.45);
      ctx.lineTo(cx + suitSize * 0.3, cy);
      ctx.lineTo(cx, cy + suitSize * 0.45);
      ctx.lineTo(cx - suitSize * 0.3, cy);
      ctx.closePath();
      ctx.fill();
    } else {
      // Club
      ctx.beginPath();
      ctx.arc(cx, cy - suitSize * 0.15, suitSize * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx - suitSize * 0.2, cy + suitSize * 0.1, suitSize * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + suitSize * 0.2, cy + suitSize * 0.1, suitSize * 0.22, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(cx - 2, cy + suitSize * 0.2, 4, suitSize * 0.25);
    }
  }
  ctx.globalAlpha = 1;

  // Magical checkerboard pattern (like chess in wonderland)
  ctx.globalAlpha = 0.04;
  for (let i = 0; i < GRID_SIZE; i++) {
    for (let j = 0; j < GRID_SIZE; j++) {
      if ((i + j) % 2 === 0) {
        ctx.fillStyle = COLORS.magicPurple;
        ctx.fillRect(i * CELL_SIZE, j * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }
  }
  ctx.globalAlpha = 1;

  // Subtle grid of magical dots
  ctx.fillStyle = COLORS.magicPurple;
  ctx.globalAlpha = 0.15;
  for (let i = 1; i < GRID_SIZE; i++) {
    for (let j = 1; j < GRID_SIZE; j++) {
      ctx.beginPath();
      ctx.arc(i * CELL_SIZE, j * CELL_SIZE, 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  // Draw floating stars in corners
  updateFloatingStars();
  for (const star of floatingStars) {
    drawFloatingStar(ctx, star);
  }

  // Magical Teacup (Alice in Wonderland tea party!)
  const foodX = gameState.food.x * CELL_SIZE + CELL_SIZE / 2;
  const foodY = gameState.food.y * CELL_SIZE + CELL_SIZE / 2;

  // Update food bounce phase
  foodOrbPhase += 0.08;
  const bounce = Math.sin(foodOrbPhase * 2) * 1.5;
  const steamWave = Math.sin(foodOrbPhase * 3);

  // Magical glow under teacup
  ctx.fillStyle = COLORS.teaGold;
  ctx.globalAlpha = 0.15 + Math.sin(foodOrbPhase) * 0.05;
  ctx.beginPath();
  ctx.arc(foodX, foodY + bounce, CELL_SIZE * 0.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Saucer (plate under cup)
  ctx.fillStyle = '#e8d5c4';
  ctx.beginPath();
  ctx.ellipse(foodX, foodY + 6 + bounce, CELL_SIZE / 2 + 3, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d4c4b4';
  ctx.beginPath();
  ctx.ellipse(foodX, foodY + 6 + bounce, CELL_SIZE / 2 + 1, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Teacup body
  const cupGradient = ctx.createLinearGradient(foodX - 8, foodY, foodX + 8, foodY);
  cupGradient.addColorStop(0, '#f5e6d3');
  cupGradient.addColorStop(0.3, '#ffffff');
  cupGradient.addColorStop(0.7, '#ffffff');
  cupGradient.addColorStop(1, '#e8d5c4');
  ctx.fillStyle = cupGradient;
  ctx.beginPath();
  ctx.moveTo(foodX - 7, foodY - 4 + bounce);
  ctx.quadraticCurveTo(foodX - 8, foodY + 5 + bounce, foodX - 5, foodY + 6 + bounce);
  ctx.lineTo(foodX + 5, foodY + 6 + bounce);
  ctx.quadraticCurveTo(foodX + 8, foodY + 5 + bounce, foodX + 7, foodY - 4 + bounce);
  ctx.closePath();
  ctx.fill();

  // Cup rim (gold trim)
  ctx.strokeStyle = COLORS.teaGold;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.ellipse(foodX, foodY - 4 + bounce, 7, 2, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Tea inside the cup
  ctx.fillStyle = '#8b4513';
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.ellipse(foodX, foodY - 3 + bounce, 5, 1.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Cup handle
  ctx.strokeStyle = '#e8d5c4';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(foodX + 9, foodY + bounce, 4, -Math.PI / 2, Math.PI / 2);
  ctx.stroke();

  // Gold decoration on cup (heart or pattern)
  ctx.fillStyle = COLORS.cardRed;
  ctx.globalAlpha = 0.6;
  ctx.beginPath();
  const heartX = foodX - 1;
  const heartY = foodY + 1 + bounce;
  ctx.moveTo(heartX, heartY + 2);
  ctx.bezierCurveTo(heartX - 3, heartY - 1, heartX - 3, heartY + 1, heartX, heartY + 3);
  ctx.bezierCurveTo(heartX + 3, heartY + 1, heartX + 3, heartY - 1, heartX, heartY + 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Steam wisps (magical!)
  ctx.strokeStyle = 'rgba(200, 180, 255, 0.5)';
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const steamX = foodX - 3 + i * 3;
    const steamPhase = foodOrbPhase + i * 0.5;
    ctx.beginPath();
    ctx.moveTo(steamX, foodY - 5 + bounce);
    ctx.quadraticCurveTo(
      steamX + Math.sin(steamPhase * 2) * 3,
      foodY - 10 + bounce,
      steamX + Math.sin(steamPhase * 2 + 1) * 2,
      foodY - 14 + bounce + steamWave
    );
    ctx.stroke();
  }

  // Sparkle highlight on cup
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.arc(foodX - 4, foodY - 2 + bounce, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Draw flame particles behind the snake (burning trail effect)
  drawFlameParticles(ctx);

  // Cheshire Cat snake - magical purple with stripes
  const snake = gameState.snake;
  const snakeLen = snake.length;

  // Draw snake segments (back to front)
  for (let i = snakeLen - 1; i >= 0; i--) {
    const segment = snake[i];
    const centerX = segment.x * CELL_SIZE + CELL_SIZE / 2;
    const centerY = segment.y * CELL_SIZE + CELL_SIZE / 2;

    const t = snakeLen > 1 ? i / (snakeLen - 1) : 1;
    const radius = (CELL_SIZE / 2 - 1) * (0.9 + t * 0.1);

    // Cheshire purple/pink gradient
    const purpleShade = 0.45 + t * 0.1;

    if (i === 0) {
      // Cheshire Cat head - magical purple
      const headGradient = ctx.createRadialGradient(centerX - 2, centerY - 2, 0, centerX, centerY, radius + 2);
      headGradient.addColorStop(0, COLORS.snakeHighlight);
      headGradient.addColorStop(0.5, COLORS.snakeHead);
      headGradient.addColorStop(1, '#7d3c98');
      ctx.fillStyle = headGradient;
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 2, 0, Math.PI * 2);
      ctx.fill();

      // Eyes direction
      const nextSegment = snake[1];
      let dx = 1, dy = 0;
      if (nextSegment) {
        dx = segment.x - nextSegment.x;
        dy = segment.y - nextSegment.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > 0) { dx /= len; dy /= len; }
      }

      const perpX = -dy;
      const perpY = dx;
      const eyeOffset = 4;
      const eyeForward = 2;

      // Cheshire Cat eyes - yellow/gold and mischievous
      const leftEyeX = centerX + perpX * eyeOffset + dx * eyeForward;
      const leftEyeY = centerY + perpY * eyeOffset + dy * eyeForward;
      const rightEyeX = centerX - perpX * eyeOffset + dx * eyeForward;
      const rightEyeY = centerY - perpY * eyeOffset + dy * eyeForward;

      // Glowing yellow eye whites
      ctx.fillStyle = COLORS.snakeEye;
      ctx.shadowColor = COLORS.snakeEye;
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.arc(leftEyeX, leftEyeY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(rightEyeX, rightEyeY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Slit pupils (cat-like)
      ctx.fillStyle = COLORS.snakePupil;
      ctx.beginPath();
      ctx.ellipse(leftEyeX + dx * 1, leftEyeY + dy * 1, 1, 2.5, Math.atan2(dy, dx), 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(rightEyeX + dx * 1, rightEyeY + dy * 1, 1, 2.5, Math.atan2(dy, dx), 0, Math.PI * 2);
      ctx.fill();

      // Eye sparkles
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(leftEyeX - 1, leftEyeY - 1, 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(rightEyeX - 1, rightEyeY - 1, 1, 0, Math.PI * 2);
      ctx.fill();

      // Rosy cheeks (pink)
      ctx.fillStyle = COLORS.snakeCheek;
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.ellipse(centerX + perpX * 6, centerY + perpY * 6, 3, 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(centerX - perpX * 6, centerY - perpY * 6, 3, 2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Cat nose (pink)
      ctx.fillStyle = COLORS.snakeCheek;
      const noseX = centerX + dx * 5;
      const noseY = centerY + dy * 5;
      ctx.beginPath();
      ctx.moveTo(noseX, noseY - 2);
      ctx.lineTo(noseX - 2, noseY + 1);
      ctx.lineTo(noseX + 2, noseY + 1);
      ctx.closePath();
      ctx.fill();

      // FAMOUS CHESHIRE GRIN - big wide smile!
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      const grinWidth = 8;
      const grinY = noseY + 4;
      ctx.beginPath();
      ctx.moveTo(centerX - grinWidth + dx * 3, grinY - perpX * grinWidth * 0.3);
      ctx.quadraticCurveTo(
        centerX + dx * 5,
        grinY + 4,
        centerX + grinWidth + dx * 3,
        grinY + perpX * grinWidth * 0.3
      );
      ctx.stroke();

      // Teeth in the grin
      ctx.fillStyle = '#ffffff';
      for (let tooth = 0; tooth < 5; tooth++) {
        const toothT = (tooth + 0.5) / 5;
        const toothX = centerX - grinWidth + toothT * grinWidth * 2 + dx * 3;
        const toothY = grinY + Math.sin(toothT * Math.PI) * 2;
        ctx.beginPath();
        ctx.arc(toothX, toothY, 1.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw cat features
      drawCatEars(ctx, centerX, centerY, dx, dy, perpX, perpY, frameCount);
      drawWhiskers(ctx, centerX, centerY, dx, dy, perpX, perpY, frameCount);
      drawTeeth(ctx, centerX, centerY, dx, dy);
    } else {
      // Cheshire Cat body - purple with stripes
      const bodyGradient = ctx.createRadialGradient(centerX - 1, centerY - 1, 0, centerX, centerY, radius);
      bodyGradient.addColorStop(0, COLORS.snakeHighlight);
      bodyGradient.addColorStop(0.4, hslToRgb(0.78, 0.5, purpleShade));
      bodyGradient.addColorStop(1, hslToRgb(0.78, 0.55, purpleShade - 0.1));
      ctx.fillStyle = bodyGradient;
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      // Cheshire stripes (alternating darker purple)
      if (i % 2 === 0) {
        ctx.fillStyle = 'rgba(125, 60, 152, 0.3)';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.85, 0, Math.PI * 2);
        ctx.fill();
      }

      // Magical sparkle on each segment
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.arc(centerX - 2, centerY - 2, radius * 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  // Wonderland magical burst particles (when eating food) - playing card suits!
  const wonderBurstColors = [COLORS.magicPurple, COLORS.teaGold, COLORS.magicPink, COLORS.magicBlue, COLORS.cardRed];
  for (let pi = 0; pi < burstParticles.length; pi++) {
    const p = burstParticles[pi];
    const burstColor = wonderBurstColors[pi % wonderBurstColors.length];

    ctx.fillStyle = burstColor;
    ctx.globalAlpha = p.life * 0.8;
    const size = p.size * p.life;

    // Alternate between card suit shapes: hearts, diamonds, stars
    const shapeType = pi % 3;
    if (shapeType === 0) {
      // Heart shape
      ctx.beginPath();
      ctx.moveTo(p.x, p.y + size * 0.3);
      ctx.bezierCurveTo(p.x - size * 0.5, p.y - size * 0.3, p.x - size * 0.5, p.y + size * 0.2, p.x, p.y + size * 0.6);
      ctx.bezierCurveTo(p.x + size * 0.5, p.y + size * 0.2, p.x + size * 0.5, p.y - size * 0.3, p.x, p.y + size * 0.3);
      ctx.fill();
    } else if (shapeType === 1) {
      // Diamond shape
      ctx.beginPath();
      ctx.moveTo(p.x, p.y - size * 0.6);
      ctx.lineTo(p.x + size * 0.4, p.y);
      ctx.lineTo(p.x, p.y + size * 0.6);
      ctx.lineTo(p.x - size * 0.4, p.y);
      ctx.closePath();
      ctx.fill();
    } else {
      // Star shape
      ctx.beginPath();
      for (let j = 0; j < 10; j++) {
        const angle = (j / 10) * Math.PI * 2 - Math.PI / 2;
        const r = j % 2 === 0 ? size : size * 0.4;
        const sx = p.x + Math.cos(angle) * r;
        const sy = p.y + Math.sin(angle) * r;
        if (j === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  // Draw death debris
  if (deathExplosionPhase > 0.7) {
    const flashAlpha = (deathExplosionPhase - 0.7) * 2;
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = flashAlpha * 0.4;
    ctx.fillRect(0, 0, width, height);
    ctx.globalAlpha = 1;
  }

  for (const d of deathDebris) {
    const debrisColor = hslToRgb(d.hue / 360, 0.9, 0.6);
    const alpha = d.life * 0.9;

    if (d.type === 'shard') {
      const size = d.size * d.life;
      const cos = Math.cos(d.rotation);
      const sin = Math.sin(d.rotation);

      const p1x = d.x + cos * size;
      const p1y = d.y + sin * size;
      const p2x = d.x + cos * (-size * 0.5) - sin * (size * 0.7);
      const p2y = d.y + sin * (-size * 0.5) + cos * (size * 0.7);
      const p3x = d.x + cos * (-size * 0.5) - sin * (-size * 0.7);
      const p3y = d.y + sin * (-size * 0.5) + cos * (-size * 0.7);

      // Glow
      ctx.fillStyle = debrisColor;
      ctx.globalAlpha = alpha * 0.4;
      ctx.beginPath();
      ctx.arc(d.x, d.y, size * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Shard
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.moveTo(p1x, p1y);
      ctx.lineTo(p2x, p2y);
      ctx.lineTo(p3x, p3y);
      ctx.closePath();
      ctx.fill();

      // Highlight
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.globalAlpha = alpha * 0.6;
      ctx.beginPath();
      ctx.moveTo(p1x, p1y);
      ctx.lineTo(p2x, p2y);
      ctx.stroke();

    } else if (d.type === 'spark') {
      const sparkLength = d.size * 2 * d.life;

      const vLen = Math.sqrt(d.vx * d.vx + d.vy * d.vy);
      const nx = vLen > 0 ? d.vx / vLen : 1;
      const ny = vLen > 0 ? d.vy / vLen : 0;

      // Glow
      ctx.fillStyle = debrisColor;
      ctx.globalAlpha = alpha * 0.3;
      ctx.beginPath();
      ctx.arc(d.x, d.y, sparkLength * 0.8, 0, Math.PI * 2);
      ctx.fill();

      // Spark line
      ctx.strokeStyle = debrisColor;
      ctx.lineWidth = d.size * 0.6;
      ctx.globalAlpha = alpha * 0.6;
      ctx.beginPath();
      ctx.moveTo(d.x - nx * sparkLength, d.y - ny * sparkLength);
      ctx.lineTo(d.x, d.y);
      ctx.stroke();

      // Bright tip
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = d.size * 0.3;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.moveTo(d.x - nx * sparkLength * 0.3, d.y - ny * sparkLength * 0.3);
      ctx.lineTo(d.x, d.y);
      ctx.stroke();

    } else {
      const emberSize = d.size * d.life;

      // Outer glow
      ctx.fillStyle = debrisColor;
      ctx.globalAlpha = alpha * 0.2;
      ctx.beginPath();
      ctx.arc(d.x, d.y, emberSize * 2, 0, Math.PI * 2);
      ctx.fill();

      // Mid glow
      ctx.globalAlpha = alpha * 0.5;
      ctx.beginPath();
      ctx.arc(d.x, d.y, emberSize * 1.3, 0, Math.PI * 2);
      ctx.fill();

      // Core
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(d.x, d.y, emberSize, 0, Math.PI * 2);
      ctx.fill();

      // Hot center
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = alpha * 0.7;
      ctx.beginPath();
      ctx.arc(d.x, d.y, emberSize * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  // Wonderland game over overlay - "Down the rabbit hole..."
  if (gameState.gameOver) {
    // Dark dreamlike overlay
    ctx.fillStyle = COLORS.gameOverOverlay;
    ctx.fillRect(0, 0, width, height);

    // Spiraling vortex effect (falling down the rabbit hole)
    ctx.globalAlpha = 0.15;
    for (let ring = 0; ring < 5; ring++) {
      const ringRadius = 40 + ring * 35;
      const rotation = frameCount * 0.02 * (ring % 2 === 0 ? 1 : -1);
      ctx.strokeStyle = ring % 2 === 0 ? COLORS.magicPurple : COLORS.magicPink;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, ringRadius, rotation, rotation + Math.PI * 1.5);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Floating card suits around the edges
    ctx.globalAlpha = 0.3;
    const numCards = 8;
    for (let c = 0; c < numCards; c++) {
      const angle = (c / numCards) * Math.PI * 2 + frameCount * 0.01;
      const dist = 160 + Math.sin(frameCount * 0.03 + c) * 20;
      const cx = width / 2 + Math.cos(angle) * dist;
      const cy = height / 2 + Math.sin(angle) * dist;
      const cardSize = 12;

      ctx.fillStyle = c % 2 === 0 ? COLORS.cardRed : COLORS.magicPurple;

      if (c % 4 === 0) {
        // Heart
        ctx.beginPath();
        ctx.moveTo(cx, cy + cardSize * 0.2);
        ctx.bezierCurveTo(cx - cardSize * 0.4, cy - cardSize * 0.2, cx - cardSize * 0.4, cy + cardSize * 0.1, cx, cy + cardSize * 0.4);
        ctx.bezierCurveTo(cx + cardSize * 0.4, cy + cardSize * 0.1, cx + cardSize * 0.4, cy - cardSize * 0.2, cx, cy + cardSize * 0.2);
        ctx.fill();
      } else if (c % 4 === 1) {
        // Diamond
        ctx.beginPath();
        ctx.moveTo(cx, cy - cardSize * 0.4);
        ctx.lineTo(cx + cardSize * 0.25, cy);
        ctx.lineTo(cx, cy + cardSize * 0.4);
        ctx.lineTo(cx - cardSize * 0.25, cy);
        ctx.closePath();
        ctx.fill();
      } else if (c % 4 === 2) {
        // Spade
        ctx.beginPath();
        ctx.moveTo(cx, cy - cardSize * 0.35);
        ctx.bezierCurveTo(cx - cardSize * 0.4, cy + cardSize * 0.05, cx - cardSize * 0.25, cy + cardSize * 0.3, cx, cy + cardSize * 0.15);
        ctx.bezierCurveTo(cx + cardSize * 0.25, cy + cardSize * 0.3, cx + cardSize * 0.4, cy + cardSize * 0.05, cx, cy - cardSize * 0.35);
        ctx.fill();
      } else {
        // Club
        ctx.beginPath();
        ctx.arc(cx, cy - cardSize * 0.12, cardSize * 0.18, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx - cardSize * 0.15, cy + cardSize * 0.08, cardSize * 0.18, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx + cardSize * 0.15, cy + cardSize * 0.08, cardSize * 0.18, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    // "We're all mad here" Cheshire grin in the center (fading in and out)
    const grinAlpha = 0.3 + Math.sin(frameCount * 0.05) * 0.15;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.globalAlpha = grinAlpha;
    ctx.beginPath();
    ctx.moveTo(width / 2 - 50, height / 2);
    ctx.quadraticCurveTo(width / 2, height / 2 + 30, width / 2 + 50, height / 2);
    ctx.stroke();

    // Teeth in the floating grin
    ctx.fillStyle = '#ffffff';
    for (let tooth = 0; tooth < 8; tooth++) {
      const toothT = (tooth + 0.5) / 8;
      const toothX = width / 2 - 45 + toothT * 90;
      const toothY = height / 2 + Math.sin(toothT * Math.PI) * 15;
      ctx.beginPath();
      ctx.arc(toothX, toothY, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

export function GameBoard({ gameState, gridSize }: GameBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<SnakeScene | null>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const phaserFailedRef = useRef(false);
  const initStartedRef = useRef(false);

  const pushState = useCallback(() => {
    if (sceneRef.current) {
      sceneRef.current.updateGameState(gameState);
    } else if (phaserFailedRef.current && canvasRef.current) {
      drawCanvas2D(canvasRef.current, gameState);
    }
  }, [gameState]);

  // Initialize Phaser on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || initStartedRef.current) return;
    initStartedRef.current = true;

    let destroyed = false;

    // Calculate zoom for hi-res Phaser rendering
    const logicalSize = gridSize * CELL_SIZE;
    const displaySize = Math.max(window.innerWidth, window.innerHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const phaserZoom = Math.max(1, Math.ceil((displaySize * dpr) / logicalSize));

    (async () => {
      try {
        const Phaser = await import('phaser');
        const { SnakeScene } = await import('./SnakeScene');

        if (destroyed) return;

        const game = new Phaser.Game({
          type: Phaser.CANVAS,
          canvas: canvas,
          width: gridSize * CELL_SIZE,
          height: gridSize * CELL_SIZE,
          backgroundColor: '#0a0a1a',
          scene: SnakeScene,
          pixelArt: false,
          scale: {
            zoom: phaserZoom,
          },
          input: {
            keyboard: false,
            mouse: false,
            touch: false,
            gamepad: false,
          },
          audio: {
            noAudio: true,
          },
          banner: false,
          fps: {
            target: 30,
          },
        });

        if (destroyed) {
          game.destroy(true);
          return;
        }

        // Phaser sets inline width/height styles based on zoom — reset to CSS control
        canvas.style.width = '100%';
        canvas.style.height = '100%';

        phaserGameRef.current = game;

        // Wait for scene to be ready
        const scene = game.scene.getScene('SnakeScene') as SnakeScene;
        if (scene) {
          sceneRef.current = scene;
          scene.updateGameState(gameState);
        } else {
          // Scene not ready yet, listen for it
          game.events.once('ready', () => {
            if (destroyed) return;
            const s = game.scene.getScene('SnakeScene') as SnakeScene;
            if (s) {
              sceneRef.current = s;
              s.updateGameState(gameState);
            }
          });
        }
      } catch {
        // Phaser failed to load (e.g. jsdom) — fall back to Canvas 2D
        if (!destroyed) {
          phaserFailedRef.current = true;
          drawCanvas2D(canvas, gameState);
        }
      }
    })();

    return () => {
      destroyed = true;
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
      sceneRef.current = null;
      initStartedRef.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hi-res canvas for Canvas2D fallback: match canvas resolution to display size
  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      if (width === 0 || height === 0) return;

      // Only resize canvas for Canvas2D fallback (Phaser manages its own canvas)
      if (phaserFailedRef.current) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        drawCanvas2D(canvas, gameState);
      }
    });

    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [gameState]);

  // Push state updates to Phaser scene or Canvas 2D fallback
  useEffect(() => {
    pushState();
  }, [pushState]);

  return (
    <div className="canvas-wrapper" ref={wrapperRef}>
      <canvas
        ref={canvasRef}
        width={gridSize * CELL_SIZE}
        height={gridSize * CELL_SIZE}
      />
    </div>
  );
}
