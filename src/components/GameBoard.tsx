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

// Color palette - PURPLE INFERNO theme: mystical purple flames, dark sorcery
const COLORS = {
  bgDark: '#050510',
  bgVolcanic: '#0a0818',
  gridLine: '#1a1530',
  gridAccent: '#2a2050',
  // Mystical snake colors (purple fire sorcery)
  snakeHead: '#bf40ff',
  snakeBody: '#9932cc',
  snakeTail: '#6b238e',
  snakeHighlight: '#e066ff',
  snakeEye: '#00ffff',
  snakePupil: '#000000',
  snakeHorn: '#1a1a2e',
  // Food - purple energy orb
  food: '#9400d3',
  foodCore: '#e066ff',
  foodGlow: '#8b00ff',
  gameOverOverlay: 'rgba(5, 5, 16, 0.95)',
  // Purple inferno accent colors
  fireOrange: '#9932cc',
  fireRed: '#8b00ff',
  fireYellow: '#e066ff',
  lavaRed: '#bf40ff',
  ashGray: '#3a3a5a',
  smokeBlack: '#0a0a1a',
  brimstoneYellow: '#cc99ff',
  demonPurple: '#6600cc',
  bloodRed: '#4b0082',
  emberOrange: '#ba55d3',
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

// Animation frame counter
let frameCount = 0;

// Demon horns on the snake head
function drawDemonHorns(
  ctx: CanvasRenderingContext2D,
  headX: number,
  headY: number,
  dx: number,
  dy: number,
  perpX: number,
  perpY: number,
  frame: number
): void {
  const hornOffset = -6;
  const hornBaseX = headX - dx * hornOffset;
  const hornBaseY = headY - dy * hornOffset;

  // Animated horn flicker (fire effect)
  const flicker = Math.sin(frame * 0.15) * 0.1;

  const hornSize = 10;
  const hornSpread = 5;

  // Left horn
  ctx.save();
  ctx.translate(hornBaseX + perpX * hornSpread, hornBaseY + perpY * hornSpread);
  ctx.rotate(Math.atan2(perpY, perpX) + 0.5 + flicker);

  // Dark horn base
  ctx.fillStyle = COLORS.snakeHorn;
  ctx.beginPath();
  ctx.moveTo(0, hornSize * 0.4);
  ctx.lineTo(-hornSize * 0.4, -hornSize * 0.2);
  ctx.lineTo(0, -hornSize);
  ctx.lineTo(hornSize * 0.4, -hornSize * 0.2);
  ctx.closePath();
  ctx.fill();

  // Fiery tip
  ctx.fillStyle = COLORS.fireOrange;
  ctx.globalAlpha = 0.6 + Math.sin(frame * 0.2) * 0.3;
  ctx.beginPath();
  ctx.moveTo(0, -hornSize * 0.5);
  ctx.lineTo(-hornSize * 0.2, -hornSize * 0.8);
  ctx.lineTo(0, -hornSize - 3);
  ctx.lineTo(hornSize * 0.2, -hornSize * 0.8);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();

  // Right horn
  ctx.save();
  ctx.translate(hornBaseX - perpX * hornSpread, hornBaseY - perpY * hornSpread);
  ctx.rotate(Math.atan2(-perpY, -perpX) + 0.5 - flicker);

  ctx.fillStyle = COLORS.snakeHorn;
  ctx.beginPath();
  ctx.moveTo(0, hornSize * 0.4);
  ctx.lineTo(-hornSize * 0.4, -hornSize * 0.2);
  ctx.lineTo(0, -hornSize);
  ctx.lineTo(hornSize * 0.4, -hornSize * 0.2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = COLORS.fireOrange;
  ctx.globalAlpha = 0.6 + Math.sin(frame * 0.2 + 1) * 0.3;
  ctx.beginPath();
  ctx.moveTo(0, -hornSize * 0.5);
  ctx.lineTo(-hornSize * 0.2, -hornSize * 0.8);
  ctx.lineTo(0, -hornSize - 3);
  ctx.lineTo(hornSize * 0.2, -hornSize * 0.8);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
}

// Flame effects state
interface FlameParticle2D {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  hue: number;
}
let flameParticles: FlameParticle2D[] = [];
const MAX_FLAME_PARTICLES = 50;

// Meteor shower state
interface Meteor2D {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  trail: { x: number; y: number }[];
}
let meteors: Meteor2D[] = [];
const NUM_METEORS = 6;

// Volcanic ash particles
interface AshParticle2D {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  rotation: number;
  rotationSpeed: number;
}
let ashParticles: AshParticle2D[] = [];
const NUM_ASH = 20;

// Screen crack state for apocalyptic effect
interface ScreenCrack2D {
  x: number;
  y: number;
  segments: { x: number; y: number }[];
  life: number;
}
let screenCracks: ScreenCrack2D[] = [];

// Explosion state for food consumption
interface Explosion2D {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  life: number;
  particles: { angle: number; dist: number; size: number; hue: number }[];
}
let explosions: Explosion2D[] = [];

// Fire ring around food
let foodFirePhase = 0;

// Screen shake
let screenShakeX = 0;
let screenShakeY = 0;
let screenShakeIntensity = 0;

// Tracking state
let lastSnakeLength = 0;
let wasGameOver = false;
let effectsInitialized = false;

// Lava flow state
let lavaPhase = 0;

// Death inferno state
interface InfernoParticle2D {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  hue: number;
}
let infernoParticles: InfernoParticle2D[] = [];

// Comet trail state - smooth glowing ribbon trail
interface CometTrailSegment2D {
  x: number;
  y: number;
  alpha: number;
  size: number;
  hue: number;
}
let cometTrail: CometTrailSegment2D[] = [];
const MAX_COMET_TRAIL_LENGTH = 30;

// Ethereal particle state - luminous drifting particles
interface EtherealParticle2D {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  hue: number;
  brightness: number;
  pulsePhase: number;
}
let etherealParticles: EtherealParticle2D[] = [];
const MAX_ETHEREAL_PARTICLES = 50;

// Thrown food animation state
interface ThrownFood2D {
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  x: number;
  y: number;
  progress: number;
  rotation: number;
  rotationSpeed: number;
  trail: { x: number; y: number; alpha: number }[];
  landed: boolean;
  landingParticles: { x: number; y: number; vx: number; vy: number; life: number; size: number }[];
  impactRings: { radius: number; alpha: number }[];
}
let thrownFood: ThrownFood2D | null = null;
let lastFoodX = -1;
let lastFoodY = -1;

// Mystical bee state for Canvas 2D fallback
interface Bee2D {
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
  wingPhase: number;
  wingSpeed: number;
  size: number;
  hue: number;
  glowIntensity: number;
  bobPhase: number;
  bobSpeed: number;
  trail: { x: number; y: number; alpha: number }[];
  state: 'flying' | 'hovering' | 'attracted';
  sparkleTimer: number;
}
let bees2D: Bee2D[] = [];
const MAX_BEES_2D = 8;
const BEE_SPAWN_CHANCE_2D = 0.02;

function spawnBee2D(): void {
  if (bees2D.length >= MAX_BEES_2D) return;

  const width = GRID_SIZE * CELL_SIZE;
  const height = GRID_SIZE * CELL_SIZE;

  const edge = Math.floor(Math.random() * 4);
  let x: number, y: number;

  switch (edge) {
    case 0:
      x = Math.random() * width;
      y = -20;
      break;
    case 1:
      x = width + 20;
      y = Math.random() * height;
      break;
    case 2:
      x = Math.random() * width;
      y = height + 20;
      break;
    default:
      x = -20;
      y = Math.random() * height;
      break;
  }

  const targetX = 50 + Math.random() * (width - 100);
  const targetY = 50 + Math.random() * (height - 100);

  bees2D.push({
    x,
    y,
    vx: 0,
    vy: 0,
    targetX,
    targetY,
    wingPhase: Math.random() * Math.PI * 2,
    wingSpeed: 0.4 + Math.random() * 0.2,
    size: 6 + Math.random() * 3,
    hue: 40 + Math.random() * 30,
    glowIntensity: 0.5 + Math.random() * 0.5,
    bobPhase: Math.random() * Math.PI * 2,
    bobSpeed: 0.08 + Math.random() * 0.04,
    trail: [],
    state: 'flying',
    sparkleTimer: 0,
  });
}

function updateBees2D(gameState: GameState, frame: number): void {
  const width = GRID_SIZE * CELL_SIZE;
  const height = GRID_SIZE * CELL_SIZE;
  const foodX = gameState.food.x * CELL_SIZE + CELL_SIZE / 2;
  const foodY = gameState.food.y * CELL_SIZE + CELL_SIZE / 2;
  const gameOver = gameState.gameOver;

  if (!gameOver && Math.random() < BEE_SPAWN_CHANCE_2D && bees2D.length < MAX_BEES_2D) {
    spawnBee2D();
  }

  for (let i = bees2D.length - 1; i >= 0; i--) {
    const bee = bees2D[i];

    bee.wingPhase += bee.wingSpeed;
    bee.bobPhase += bee.bobSpeed;
    bee.sparkleTimer += 0.1;

    if (frame % 2 === 0) {
      bee.trail.unshift({ x: bee.x, y: bee.y, alpha: 0.6 });
      if (bee.trail.length > 8) bee.trail.pop();
    }

    for (const t of bee.trail) {
      t.alpha *= 0.85;
    }
    bee.trail = bee.trail.filter(t => t.alpha > 0.05);

    const dxFood = foodX - bee.x;
    const dyFood = foodY - bee.y;
    const distFood = Math.sqrt(dxFood * dxFood + dyFood * dyFood);

    if (distFood < 80) {
      bee.state = 'attracted';
      bee.targetX = foodX + Math.cos(bee.bobPhase * 3) * 30;
      bee.targetY = foodY + Math.sin(bee.bobPhase * 3) * 30;
    } else if (distFood < 150) {
      bee.state = 'hovering';
      const angle = Math.atan2(dyFood, dxFood) + Math.sin(bee.bobPhase) * 0.5;
      bee.targetX = foodX - Math.cos(angle) * 60;
      bee.targetY = foodY - Math.sin(angle) * 60;
    } else {
      bee.state = 'flying';
      if (Math.random() < 0.02) {
        bee.targetX = foodX + (Math.random() - 0.5) * 200;
        bee.targetY = foodY + (Math.random() - 0.5) * 200;
      }
    }

    const dx = bee.targetX - bee.x;
    const dy = bee.targetY - bee.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 1) {
      const speed = bee.state === 'attracted' ? 2.5 : (bee.state === 'hovering' ? 1.5 : 2);
      const ax = (dx / dist) * speed * 0.1;
      const ay = (dy / dist) * speed * 0.1;

      bee.vx += ax;
      bee.vy += ay;
      bee.vy += Math.sin(bee.bobPhase) * 0.05;
    }

    const maxSpeed = bee.state === 'attracted' ? 3 : 2;
    const currentSpeed = Math.sqrt(bee.vx * bee.vx + bee.vy * bee.vy);
    if (currentSpeed > maxSpeed) {
      bee.vx = (bee.vx / currentSpeed) * maxSpeed;
      bee.vy = (bee.vy / currentSpeed) * maxSpeed;
    }

    bee.x += bee.vx;
    bee.y += bee.vy;
    bee.vx *= 0.95;
    bee.vy *= 0.95;

    if (bee.state === 'attracted') {
      bee.glowIntensity = 0.7 + Math.sin(bee.bobPhase * 4) * 0.3;
    } else {
      bee.glowIntensity = 0.5 + Math.sin(bee.bobPhase * 2) * 0.2;
    }

    if (bee.x < -100 || bee.x > width + 100 || bee.y < -100 || bee.y > height + 100) {
      bees2D.splice(i, 1);
    }

    if (gameOver) {
      bee.targetX = bee.x + (Math.random() - 0.5) * 400;
      bee.targetY = bee.y - 200 - Math.random() * 200;
      bee.vx += (Math.random() - 0.5) * 2;
      bee.vy -= 1 + Math.random();
    }
  }
}

function drawBees2D(ctx: CanvasRenderingContext2D): void {
  for (const bee of bees2D) {
    const { x, y, size, wingPhase, hue, glowIntensity, trail, state, sparkleTimer } = bee;

    // Draw trail
    for (let i = 0; i < trail.length; i++) {
      const t = trail[i];
      const trailSize = size * 0.4 * (1 - i / trail.length);
      ctx.fillStyle = `hsla(${hue}, 80%, 60%, ${t.alpha * 0.4})`;
      ctx.beginPath();
      ctx.arc(t.x, t.y, trailSize, 0, Math.PI * 2);
      ctx.fill();
    }

    // Outer glow
    const glowSize = size * 2 * glowIntensity;
    ctx.fillStyle = `hsla(${hue}, 90%, 50%, ${0.2 * glowIntensity})`;
    ctx.beginPath();
    ctx.arc(x, y, glowSize, 0, Math.PI * 2);
    ctx.fill();

    // Mid glow
    ctx.fillStyle = `hsla(${hue}, 85%, 60%, ${0.3 * glowIntensity})`;
    ctx.beginPath();
    ctx.arc(x, y, glowSize * 0.6, 0, Math.PI * 2);
    ctx.fill();

    // Bee body
    const bodyLength = size * 1.2;
    const bodyWidth = size * 0.7;

    // Body shadow
    ctx.fillStyle = `hsla(${hue}, 70%, 30%, 0.5)`;
    ctx.beginPath();
    ctx.ellipse(x, y, bodyLength / 2 + 1, bodyWidth / 2 + 1, 0, 0, Math.PI * 2);
    ctx.fill();

    // Main body (amber/golden)
    ctx.fillStyle = `hsl(${hue}, 90%, 55%)`;
    ctx.beginPath();
    ctx.ellipse(x, y, bodyLength / 2, bodyWidth / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // Dark stripes
    ctx.fillStyle = 'rgba(26, 26, 26, 0.8)';
    ctx.fillRect(x - bodyLength * 0.075, y - bodyWidth / 2, bodyLength * 0.15, bodyWidth);
    ctx.fillRect(x + bodyLength * 0.075, y - bodyWidth / 2, bodyLength * 0.15, bodyWidth);

    // Head
    ctx.fillStyle = `hsl(${hue - 10}, 80%, 40%)`;
    ctx.beginPath();
    ctx.arc(x - bodyLength * 0.4, y, size * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Wings
    const wingAngle = Math.sin(wingPhase) * 0.8;
    const wingSize = size * 0.9;

    // Wing glow
    ctx.fillStyle = `rgba(255, 255, 255, ${0.2 + Math.abs(Math.sin(wingPhase)) * 0.2})`;
    ctx.beginPath();
    ctx.ellipse(x + Math.cos(wingAngle + 0.5) * wingSize * 0.3, y - wingSize * 0.5, wingSize * 0.4, wingSize * 0.2, wingAngle, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + Math.cos(-wingAngle + 0.5) * wingSize * 0.3, y + wingSize * 0.5, wingSize * 0.4, wingSize * 0.2, -wingAngle, 0, Math.PI * 2);
    ctx.fill();

    // Wing bodies
    ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + Math.abs(Math.sin(wingPhase)) * 0.3})`;
    ctx.beginPath();
    ctx.ellipse(x + Math.cos(wingAngle) * wingSize * 0.2, y - wingSize * 0.4, wingSize * 0.3, wingSize * 0.15, wingAngle, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(x + Math.cos(-wingAngle) * wingSize * 0.2, y + wingSize * 0.4, wingSize * 0.3, wingSize * 0.15, -wingAngle, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(x - bodyLength * 0.45, y - size * 0.12, size * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x - bodyLength * 0.45, y + size * 0.12, size * 0.12, 0, Math.PI * 2);
    ctx.fill();

    // Sparkles when attracted
    if (state === 'attracted' && Math.sin(sparkleTimer * 3) > 0.7) {
      const sparkleAngle = sparkleTimer * 2;
      const sparkleDist = size * 1.5;
      const sparkleX = x + Math.cos(sparkleAngle) * sparkleDist;
      const sparkleY = y + Math.sin(sparkleAngle) * sparkleDist;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.beginPath();
      ctx.arc(sparkleX, sparkleY, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `hsla(${hue}, 100%, 80%, 0.6)`;
      ctx.beginPath();
      ctx.arc(sparkleX, sparkleY, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function spawnThrownFood2D(targetGridX: number, targetGridY: number): void {
  const width = GRID_SIZE * CELL_SIZE;
  const height = GRID_SIZE * CELL_SIZE;
  const targetX = targetGridX * CELL_SIZE + CELL_SIZE / 2;
  const targetY = targetGridY * CELL_SIZE + CELL_SIZE / 2;

  const edge = Math.floor(Math.random() * 4);
  let startX: number, startY: number;

  switch (edge) {
    case 0:
      startX = Math.random() * width;
      startY = -40;
      break;
    case 1:
      startX = width + 40;
      startY = Math.random() * height;
      break;
    case 2:
      startX = Math.random() * width;
      startY = height + 40;
      break;
    default:
      startX = -40;
      startY = Math.random() * height;
      break;
  }

  thrownFood = {
    startX,
    startY,
    targetX,
    targetY,
    x: startX,
    y: startY,
    progress: 0,
    rotation: 0,
    rotationSpeed: (Math.random() - 0.5) * 0.6,
    trail: [],
    landed: false,
    landingParticles: [],
    impactRings: [],
  };
}

function updateThrownFood2D(): void {
  if (!thrownFood) return;

  const tf = thrownFood;

  if (!tf.landed) {
    tf.progress += 0.04;

    if (frameCount % 2 === 0) {
      tf.trail.unshift({ x: tf.x, y: tf.y, alpha: 1 });
      if (tf.trail.length > 12) tf.trail.pop();
    }

    for (const t of tf.trail) {
      t.alpha *= 0.85;
    }
    tf.trail = tf.trail.filter(t => t.alpha > 0.05);

    const t = tf.progress;
    const arcHeight = 80;
    const arc = 4 * arcHeight * t * (1 - t);
    tf.x = tf.startX + (tf.targetX - tf.startX) * t;
    tf.y = tf.startY + (tf.targetY - tf.startY) * t - arc;

    tf.rotation += tf.rotationSpeed;

    if (tf.progress >= 1) {
      tf.landed = true;
      tf.x = tf.targetX;
      tf.y = tf.targetY;

      screenShakeIntensity = Math.max(screenShakeIntensity, 6);

      tf.impactRings = [
        { radius: 5, alpha: 1 },
        { radius: 3, alpha: 0.8 },
      ];

      for (let i = 0; i < 10; i++) {
        const angle = (i / 10) * Math.PI * 2 + Math.random() * 0.3;
        const speed = 2 + Math.random() * 3;
        tf.landingParticles.push({
          x: tf.targetX,
          y: tf.targetY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1,
          life: 1,
          size: 2 + Math.random() * 3,
        });
      }
    }
  } else {
    for (const ring of tf.impactRings) {
      ring.radius += 3;
      ring.alpha *= 0.9;
    }
    tf.impactRings = tf.impactRings.filter(r => r.alpha > 0.05);

    for (let i = tf.landingParticles.length - 1; i >= 0; i--) {
      const p = tf.landingParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.15;
      p.vx *= 0.98;
      p.life -= 0.04;
      if (p.life <= 0) {
        tf.landingParticles.splice(i, 1);
      }
    }

    for (const t of tf.trail) {
      t.alpha *= 0.8;
    }
    tf.trail = tf.trail.filter(t => t.alpha > 0.05);

    if (tf.impactRings.length === 0 && tf.landingParticles.length === 0 && tf.trail.length === 0) {
      thrownFood = null;
    }
  }
}

function drawThrownFood2D(ctx: CanvasRenderingContext2D): void {
  if (!thrownFood) return;

  const tf = thrownFood;

  // Draw trail
  for (let i = 0; i < tf.trail.length; i++) {
    const t = tf.trail[i];
    const trailProgress = i / tf.trail.length;
    const trailSize = (CELL_SIZE / 2) * (1 - trailProgress * 0.5) * t.alpha;

    ctx.fillStyle = `rgba(139, 0, 255, ${t.alpha * 0.3})`;
    ctx.beginPath();
    ctx.arc(t.x, t.y, trailSize * 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(148, 0, 211, ${t.alpha * 0.6})`;
    ctx.beginPath();
    ctx.arc(t.x, t.y, trailSize, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw impact rings
  for (const ring of tf.impactRings) {
    ctx.strokeStyle = `rgba(139, 0, 255, ${ring.alpha * 0.5})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(tf.targetX, tf.targetY, ring.radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = `rgba(224, 102, 255, ${ring.alpha * 0.7})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(tf.targetX, tf.targetY, ring.radius, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Draw landing particles
  for (const p of tf.landingParticles) {
    ctx.fillStyle = `rgba(139, 0, 255, ${p.life * 0.6})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 1.3 * p.life, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(224, 102, 255, ${p.life * 0.9})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw the flying food if not landed
  if (!tf.landed) {
    const scale = 0.8 + tf.progress * 0.4;
    const foodSize = (CELL_SIZE / 2) * scale;

    // Motion blur glow
    ctx.fillStyle = 'rgba(139, 0, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(tf.x, tf.y, foodSize * 2, 0, Math.PI * 2);
    ctx.fill();

    // Outer glow
    ctx.fillStyle = 'rgba(224, 102, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(tf.x, tf.y, foodSize * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Main food body
    ctx.fillStyle = COLORS.food;
    ctx.globalAlpha = 0.95;
    ctx.beginPath();
    ctx.arc(tf.x, tf.y, foodSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Spinning highlight
    const highlightAngle = tf.rotation;
    const highlightX = tf.x + Math.cos(highlightAngle) * foodSize * 0.3;
    const highlightY = tf.y + Math.sin(highlightAngle) * foodSize * 0.3;
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(highlightX, highlightY, foodSize * 0.25, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Secondary sparkle
    const sparkleAngle = tf.rotation + Math.PI * 0.7;
    const sparkleX = tf.x + Math.cos(sparkleAngle) * foodSize * 0.4;
    const sparkleY = tf.y + Math.sin(sparkleAngle) * foodSize * 0.4;
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(sparkleX, sparkleY, foodSize * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function initArmageddonEffects(): void {
  if (effectsInitialized) return;
  effectsInitialized = true;

  const width = GRID_SIZE * CELL_SIZE;
  const height = GRID_SIZE * CELL_SIZE;

  // Initialize meteors
  meteors = [];
  for (let i = 0; i < NUM_METEORS; i++) {
    spawnMeteor(width, height, true);
  }

  // Initialize ash particles
  ashParticles = [];
  for (let i = 0; i < NUM_ASH; i++) {
    ashParticles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: 0.2 + Math.random() * 0.3,
      size: 1 + Math.random() * 2,
      alpha: 0.2 + Math.random() * 0.3,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.05,
    });
  }
}

function spawnMeteor(width: number, height: number, initial: boolean): void {
  if (meteors.length >= NUM_METEORS) return;

  const startX = initial ? Math.random() * width * 1.5 : width + 20 + Math.random() * 40;
  const startY = initial ? Math.random() * height * 0.3 - height * 0.2 : -30 - Math.random() * 40;

  const angle = Math.PI * 0.7 + (Math.random() - 0.5) * 0.3;
  const speed = 1.2 + Math.random() * 1.5;

  meteors.push({
    x: startX,
    y: startY,
    vx: -Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    size: 2 + Math.random() * 3,
    trail: [],
  });
}

function spawnFlameParticle(x: number, y: number, intensity: number): void {
  if (flameParticles.length >= MAX_FLAME_PARTICLES) {
    flameParticles.shift();
  }

  const angle = Math.random() * Math.PI * 2;
  const speed = 0.3 + Math.random() * 0.5;
  const life = 0.4 + Math.random() * 0.4;

  flameParticles.push({
    x: x + (Math.random() - 0.5) * 6,
    y: y + (Math.random() - 0.5) * 6,
    vx: Math.cos(angle) * speed * 0.3,
    vy: -0.8 - Math.random() * 1.2 * intensity,
    size: 3 + Math.random() * 4 * intensity,
    life,
    maxLife: life,
    hue: 270 + Math.random() * 40, // Purple to magenta
  });
}

function spawnExplosion(x: number, y: number): void {
  const particles: { angle: number; dist: number; size: number; hue: number }[] = [];
  const numParticles = 10;
  for (let i = 0; i < numParticles; i++) {
    particles.push({
      angle: (i / numParticles) * Math.PI * 2 + Math.random() * 0.3,
      dist: 0,
      size: 3 + Math.random() * 4,
      hue: 260 + Math.random() * 50,
    });
  }

  explosions.push({
    x,
    y,
    radius: 5,
    maxRadius: 60,
    life: 1,
    particles,
  });

  screenShakeIntensity = 10;
}

function spawnScreenCrack(x: number, y: number): void {
  if (screenCracks.length >= 3) {
    screenCracks.shift();
  }

  const segments: { x: number; y: number }[] = [{ x, y }];
  let cx = x, cy = y;
  const numSegments = 4 + Math.floor(Math.random() * 3);

  for (let i = 0; i < numSegments; i++) {
    const angle = Math.random() * Math.PI * 2;
    const dist = 15 + Math.random() * 25;
    cx += Math.cos(angle) * dist;
    cy += Math.sin(angle) * dist;
    segments.push({ x: cx, y: cy });
  }

  screenCracks.push({ x, y, segments, life: 1 });
}

function spawnEtherealParticle(x: number, y: number, hue: number): void {
  if (etherealParticles.length >= MAX_ETHEREAL_PARTICLES) {
    etherealParticles.shift();
  }

  const angle = Math.random() * Math.PI * 2;
  const speed = 0.3 + Math.random() * 0.5;
  const life = 0.8 + Math.random() * 0.4;

  etherealParticles.push({
    x: x + (Math.random() - 0.5) * 10,
    y: y + (Math.random() - 0.5) * 10,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed - 0.3,
    size: 3 + Math.random() * 4,
    life,
    maxLife: life,
    hue: hue + (Math.random() - 0.5) * 30,
    brightness: 0.5 + Math.random() * 0.3,
    pulsePhase: Math.random() * Math.PI * 2,
  });
}

function updateCometTrail(gameState: GameState): void {
  if (gameState.gameOver) {
    // Fade out trail on game over
    for (const seg of cometTrail) {
      seg.alpha *= 0.9;
    }
    cometTrail = cometTrail.filter(s => s.alpha > 0.01);
    return;
  }

  const snake = gameState.snake;
  if (snake.length === 0) return;

  const head = snake[0];
  const headX = head.x * CELL_SIZE + CELL_SIZE / 2;
  const headY = head.y * CELL_SIZE + CELL_SIZE / 2;

  // Add new trail segment at head position
  if (frameCount % 2 === 0) {
    const hue = 270 + Math.sin(frameCount * 0.05) * 20;
    cometTrail.unshift({
      x: headX,
      y: headY,
      alpha: 1,
      size: CELL_SIZE / 2 + 2,
      hue,
    });

    // Spawn ethereal particles from trail
    if (Math.random() < 0.6) {
      spawnEtherealParticle(headX, headY, hue);
    }
  }

  // Limit trail length and fade segments
  while (cometTrail.length > MAX_COMET_TRAIL_LENGTH) {
    cometTrail.pop();
  }

  // Fade all segments
  for (let i = 0; i < cometTrail.length; i++) {
    const fadeRate = 0.06 + (i / cometTrail.length) * 0.04;
    cometTrail[i].alpha -= fadeRate;
    cometTrail[i].size *= 0.97;
  }

  // Remove fully faded segments
  cometTrail = cometTrail.filter(s => s.alpha > 0);
}

function updateEtherealParticles(): void {
  for (let i = etherealParticles.length - 1; i >= 0; i--) {
    const p = etherealParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy -= 0.015;
    p.vx *= 0.98;
    p.size *= 0.985;
    p.life -= 0.02;
    p.pulsePhase += 0.15;

    if (p.life <= 0 || p.size < 0.5) {
      etherealParticles.splice(i, 1);
    }
  }
}

function drawCometTrail(ctx: CanvasRenderingContext2D): void {
  if (cometTrail.length < 2) return;

  // Draw outer glow layer
  for (let i = 0; i < cometTrail.length; i++) {
    const seg = cometTrail[i];
    if (seg.alpha < 0.05) continue;

    const progress = i / cometTrail.length;
    const glowSize = seg.size * (1.5 + progress * 0.5);
    const glowAlpha = seg.alpha * 0.15 * (1 - progress * 0.5);

    // Outer ethereal glow
    ctx.fillStyle = `hsla(${seg.hue}, 60%, 40%, ${glowAlpha})`;
    ctx.beginPath();
    ctx.arc(seg.x, seg.y, glowSize * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Mid glow
    ctx.fillStyle = `hsla(${seg.hue}, 70%, 50%, ${glowAlpha * 1.5})`;
    ctx.beginPath();
    ctx.arc(seg.x, seg.y, glowSize, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw connecting ribbon between segments
  for (let i = 0; i < cometTrail.length - 1; i++) {
    const seg1 = cometTrail[i];
    const seg2 = cometTrail[i + 1];
    if (seg1.alpha < 0.1 || seg2.alpha < 0.1) continue;

    const progress = i / cometTrail.length;
    const ribbonAlpha = Math.min(seg1.alpha, seg2.alpha) * 0.4 * (1 - progress * 0.5);
    const ribbonWidth = (seg1.size + seg2.size) / 2 * 0.6;

    // Ribbon core
    ctx.strokeStyle = `hsla(${seg1.hue}, 80%, 60%, ${ribbonAlpha})`;
    ctx.lineWidth = ribbonWidth;
    ctx.beginPath();
    ctx.moveTo(seg1.x, seg1.y);
    ctx.lineTo(seg2.x, seg2.y);
    ctx.stroke();

    // Bright inner ribbon
    ctx.strokeStyle = `rgba(255, 255, 255, ${ribbonAlpha * 0.6})`;
    ctx.lineWidth = ribbonWidth * 0.4;
    ctx.beginPath();
    ctx.moveTo(seg1.x, seg1.y);
    ctx.lineTo(seg2.x, seg2.y);
    ctx.stroke();
  }

  // Draw core particles at each segment
  for (let i = 0; i < cometTrail.length; i++) {
    const seg = cometTrail[i];
    if (seg.alpha < 0.1) continue;

    const progress = i / cometTrail.length;
    const coreAlpha = seg.alpha * 0.6 * (1 - progress * 0.7);
    const coreSize = seg.size * 0.5 * (1 - progress * 0.3);

    // Core glow
    ctx.fillStyle = `hsla(${seg.hue}, 90%, 70%, ${coreAlpha})`;
    ctx.beginPath();
    ctx.arc(seg.x, seg.y, coreSize, 0, Math.PI * 2);
    ctx.fill();

    // Bright white center
    ctx.fillStyle = `rgba(255, 255, 255, ${coreAlpha * 0.5})`;
    ctx.beginPath();
    ctx.arc(seg.x, seg.y, coreSize * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawEtherealParticles(ctx: CanvasRenderingContext2D): void {
  for (const p of etherealParticles) {
    const lifeRatio = p.life / p.maxLife;
    const pulse = 0.7 + Math.sin(p.pulsePhase) * 0.3;
    const alpha = lifeRatio * pulse;

    // Outer glow
    ctx.fillStyle = `hsla(${p.hue}, 50%, 30%, ${alpha * 0.2})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Mid glow
    ctx.fillStyle = `hsla(${p.hue}, 70%, 50%, ${alpha * 0.4})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Core
    ctx.fillStyle = `hsla(${p.hue}, 90%, 70%, ${alpha * 0.7})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();

    // Bright center
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function spawnInferno(snake: Position[]): void {
  infernoParticles = [];
  const maxParticles = 30;
  const particlesPerSeg = Math.min(4, Math.floor(maxParticles / snake.length));

  for (let i = 0; i < snake.length; i++) {
    const seg = snake[i];
    const cx = seg.x * CELL_SIZE + CELL_SIZE / 2;
    const cy = seg.y * CELL_SIZE + CELL_SIZE / 2;

    for (let j = 0; j < particlesPerSeg; j++) {
      if (infernoParticles.length >= maxParticles) break;

      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 4;

      infernoParticles.push({
        x: cx + (Math.random() - 0.5) * 8,
        y: cy + (Math.random() - 0.5) * 8,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        size: 4 + Math.random() * 6,
        life: 1,
        hue: 260 + Math.random() * 50,
      });
    }
  }
}

function updateArmageddonEffects(): void {
  const width = GRID_SIZE * CELL_SIZE;
  const height = GRID_SIZE * CELL_SIZE;

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

  // Update meteors
  for (let i = meteors.length - 1; i >= 0; i--) {
    const m = meteors[i];
    m.trail.unshift({ x: m.x, y: m.y });
    if (m.trail.length > 10) m.trail.pop();
    m.x += m.vx;
    m.y += m.vy;
    if (m.x < -50 || m.y > height + 50) {
      meteors.splice(i, 1);
      spawnMeteor(width, height, false);
    }
  }

  // Update ash particles
  for (const ash of ashParticles) {
    ash.x += ash.vx;
    ash.y += ash.vy;
    ash.rotation += ash.rotationSpeed;

    if (ash.y > height + 10) {
      ash.y = -10;
      ash.x = Math.random() * width;
    }
    if (ash.x < -10) ash.x = width + 10;
    if (ash.x > width + 10) ash.x = -10;
  }

  // Update flame particles
  for (let i = flameParticles.length - 1; i >= 0; i--) {
    const p = flameParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy -= 0.02;
    p.vx *= 0.98;
    p.size *= 0.97;
    p.life -= 0.03;

    if (p.life <= 0 || p.size < 0.5) {
      flameParticles.splice(i, 1);
    }
  }

  // Update explosions
  for (let i = explosions.length - 1; i >= 0; i--) {
    const exp = explosions[i];
    exp.radius += 4;
    exp.life -= 0.04;

    for (const particle of exp.particles) {
      particle.dist += 3;
    }

    if (exp.life <= 0) {
      explosions.splice(i, 1);
    }
  }

  // Update screen cracks
  for (let i = screenCracks.length - 1; i >= 0; i--) {
    screenCracks[i].life -= 0.008;
    if (screenCracks[i].life <= 0) {
      screenCracks.splice(i, 1);
    }
  }

  // Update inferno particles
  for (let i = infernoParticles.length - 1; i >= 0; i--) {
    const p = infernoParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.1;
    p.vx *= 0.98;
    p.life -= 0.02;

    if (p.life <= 0) {
      infernoParticles.splice(i, 1);
    }
  }

  // Update lava phase
  lavaPhase += 0.02;

  // Update food fire phase
  foodFirePhase += 0.1;
}

function drawCanvas2D(canvas: HTMLCanvasElement, gameState: GameState): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  initArmageddonEffects();
  frameCount++;

  const width = GRID_SIZE * CELL_SIZE;
  const height = GRID_SIZE * CELL_SIZE;

  // Detect food eaten
  if (gameState.snake.length > lastSnakeLength && lastSnakeLength > 0) {
    const head = gameState.snake[0];
    const headX = head.x * CELL_SIZE + CELL_SIZE / 2;
    const headY = head.y * CELL_SIZE + CELL_SIZE / 2;
    spawnExplosion(headX, headY);
    spawnScreenCrack(headX, headY);
  }
  lastSnakeLength = gameState.snake.length;

  // Detect game over
  if (gameState.gameOver && !wasGameOver) {
    screenShakeIntensity = 20;
    spawnInferno(gameState.snake);
  }
  wasGameOver = gameState.gameOver;

  // Spawn flame particles along snake
  if (frameCount % 3 === 0 && !gameState.gameOver) {
    for (let i = 0; i < gameState.snake.length; i++) {
      const seg = gameState.snake[i];
      const segX = seg.x * CELL_SIZE + CELL_SIZE / 2;
      const segY = seg.y * CELL_SIZE + CELL_SIZE / 2;
      const intensity = 1 - (i / gameState.snake.length) * 0.5;
      if (Math.random() < 0.35 * intensity) {
        spawnFlameParticle(segX, segY, intensity);
      }
    }
  }

  updateArmageddonEffects();
  updateCometTrail(gameState);
  updateEtherealParticles();

  ctx.save();
  ctx.scale(canvas.width / width, canvas.height / height);

  // Apply screen shake
  if (screenShakeIntensity > 0) {
    ctx.translate(screenShakeX, screenShakeY);
  }

  // Apocalyptic dark background
  ctx.fillStyle = COLORS.bgDark;
  ctx.fillRect(0, 0, width, height);

  // Volcanic gradient overlay
  const volcanicGradient = ctx.createRadialGradient(width / 2, height, 0, width / 2, height / 2, width);
  volcanicGradient.addColorStop(0, 'rgba(75, 0, 130, 0.3)');
  volcanicGradient.addColorStop(0.5, 'rgba(30, 10, 50, 0.2)');
  volcanicGradient.addColorStop(1, 'rgba(10, 5, 20, 0.1)');
  ctx.fillStyle = volcanicGradient;
  ctx.fillRect(0, 0, width, height);

  // Lava cracks in the ground
  ctx.strokeStyle = COLORS.lavaRed;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.3 + Math.sin(lavaPhase) * 0.1;
  for (let i = 0; i < 4; i++) {
    const startX = (i * width / 3) + Math.sin(lavaPhase + i) * 20;
    ctx.beginPath();
    ctx.moveTo(startX, height);
    let cx = startX, cy = height;
    for (let j = 0; j < 4; j++) {
      cx += (Math.random() - 0.5) * 40 + Math.sin(lavaPhase * 2 + j) * 10;
      cy -= 30 + Math.random() * 20;
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();

    // Glow around lava cracks
    ctx.strokeStyle = COLORS.fireOrange;
    ctx.lineWidth = 4;
    ctx.globalAlpha = 0.1 + Math.sin(lavaPhase + i) * 0.05;
    ctx.stroke();
    ctx.strokeStyle = COLORS.lavaRed;
    ctx.lineWidth = 2;
  }
  ctx.globalAlpha = 1;

  // Draw ash particles
  ctx.fillStyle = COLORS.ashGray;
  for (const ash of ashParticles) {
    ctx.save();
    ctx.translate(ash.x, ash.y);
    ctx.rotate(ash.rotation);
    ctx.globalAlpha = ash.alpha;
    ctx.fillRect(-ash.size / 2, -ash.size / 2, ash.size, ash.size);
    ctx.restore();
  }
  ctx.globalAlpha = 1;

  // Draw meteors with fiery trails
  for (const m of meteors) {
    // Trail
    for (let i = 0; i < m.trail.length; i++) {
      const t = m.trail[i];
      const trailAlpha = (1 - i / m.trail.length) * 0.6;
      const trailSize = m.size * (1 - i / m.trail.length) * 0.8;

      ctx.fillStyle = COLORS.fireOrange;
      ctx.globalAlpha = trailAlpha * 0.3;
      ctx.beginPath();
      ctx.arc(t.x, t.y, trailSize * 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = COLORS.fireYellow;
      ctx.globalAlpha = trailAlpha * 0.5;
      ctx.beginPath();
      ctx.arc(t.x, t.y, trailSize, 0, Math.PI * 2);
      ctx.fill();
    }

    // Meteor core
    ctx.fillStyle = COLORS.fireYellow;
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
    ctx.fill();

    // White hot center
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.7;
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.size * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Draw screen cracks (apocalyptic fissures)
  for (const crack of screenCracks) {
    ctx.strokeStyle = COLORS.fireOrange;
    ctx.lineWidth = 3;
    ctx.globalAlpha = crack.life * 0.6;

    ctx.beginPath();
    ctx.moveTo(crack.segments[0].x, crack.segments[0].y);
    for (let i = 1; i < crack.segments.length; i++) {
      ctx.lineTo(crack.segments[i].x, crack.segments[i].y);
    }
    ctx.stroke();

    // Inner glow
    ctx.strokeStyle = COLORS.fireYellow;
    ctx.lineWidth = 1;
    ctx.globalAlpha = crack.life * 0.8;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Draw comet trail (glowing ribbon behind snake)
  drawCometTrail(ctx);

  // Draw ethereal particles (luminous drifting particles)
  drawEtherealParticles(ctx);

  // Draw flame particles
  for (const p of flameParticles) {
    const lifeRatio = p.life / p.maxLife;

    const hue = p.hue + (1 - lifeRatio) * 10;
    const saturation = 100;
    const lightness = 50 + lifeRatio * 20;

    // Outer glow
    ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness - 20}%, ${lifeRatio * 0.3})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
    ctx.fill();

    // Core flame
    ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${lifeRatio * 0.6})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();

    // Hot center
    ctx.fillStyle = `hsla(${hue + 15}, ${saturation - 20}%, ${lightness + 30}%, ${lifeRatio * 0.8})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw explosions
  for (const exp of explosions) {
    // Shockwave ring
    ctx.strokeStyle = COLORS.fireOrange;
    ctx.lineWidth = 4 * exp.life;
    ctx.globalAlpha = exp.life * 0.5;
    ctx.beginPath();
    ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2);
    ctx.stroke();

    // Inner bright ring
    ctx.strokeStyle = COLORS.fireYellow;
    ctx.lineWidth = 2 * exp.life;
    ctx.globalAlpha = exp.life * 0.7;
    ctx.beginPath();
    ctx.arc(exp.x, exp.y, exp.radius * 0.7, 0, Math.PI * 2);
    ctx.stroke();

    // Explosion particles
    for (const particle of exp.particles) {
      const px = exp.x + Math.cos(particle.angle) * particle.dist;
      const py = exp.y + Math.sin(particle.angle) * particle.dist;
      const pSize = particle.size * exp.life;

      ctx.fillStyle = `hsl(${particle.hue}, 100%, 60%)`;
      ctx.globalAlpha = exp.life * 0.8;
      ctx.beginPath();
      ctx.arc(px, py, pSize, 0, Math.PI * 2);
      ctx.fill();

      // Particle glow
      ctx.fillStyle = COLORS.fireYellow;
      ctx.globalAlpha = exp.life * 0.4;
      ctx.beginPath();
      ctx.arc(px, py, pSize * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  // Draw food - burning meteor/fireball
  const foodX = gameState.food.x * CELL_SIZE + CELL_SIZE / 2;
  const foodY = gameState.food.y * CELL_SIZE + CELL_SIZE / 2;

  // Fire ring around food
  for (let ring = 0; ring < 3; ring++) {
    const ringRadius = CELL_SIZE * 0.6 + ring * 5;
    const ringAlpha = 0.3 - ring * 0.08;

    ctx.strokeStyle = COLORS.fireOrange;
    ctx.lineWidth = 3 - ring;
    ctx.globalAlpha = ringAlpha + Math.sin(foodFirePhase + ring) * 0.1;

    ctx.beginPath();
    for (let a = 0; a < Math.PI * 2; a += 0.2) {
      const wobble = Math.sin(a * 4 + foodFirePhase * 2) * 3;
      const rx = foodX + Math.cos(a) * (ringRadius + wobble);
      const ry = foodY + Math.sin(a) * (ringRadius + wobble);
      if (a === 0) ctx.moveTo(rx, ry);
      else ctx.lineTo(rx, ry);
    }
    ctx.closePath();
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Fireball glow
  const fireGlow = ctx.createRadialGradient(foodX, foodY, 0, foodX, foodY, CELL_SIZE);
  fireGlow.addColorStop(0, 'rgba(224, 102, 255, 0.8)');
  fireGlow.addColorStop(0.3, 'rgba(153, 50, 204, 0.6)');
  fireGlow.addColorStop(0.6, 'rgba(139, 0, 255, 0.3)');
  fireGlow.addColorStop(1, 'rgba(75, 0, 130, 0)');
  ctx.fillStyle = fireGlow;
  ctx.beginPath();
  ctx.arc(foodX, foodY, CELL_SIZE, 0, Math.PI * 2);
  ctx.fill();

  // Fireball core
  ctx.fillStyle = COLORS.foodCore;
  ctx.beginPath();
  ctx.arc(foodX, foodY, CELL_SIZE / 3, 0, Math.PI * 2);
  ctx.fill();

  // White hot center
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.arc(foodX, foodY, CELL_SIZE / 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Draw demon snake
  const snake = gameState.snake;
  const snakeLen = snake.length;

  // Draw snake segments (back to front)
  for (let i = snakeLen - 1; i >= 0; i--) {
    const segment = snake[i];
    const centerX = segment.x * CELL_SIZE + CELL_SIZE / 2;
    const centerY = segment.y * CELL_SIZE + CELL_SIZE / 2;

    const t = snakeLen > 1 ? i / (snakeLen - 1) : 1;
    const radius = (CELL_SIZE / 2 - 1) * (0.9 + t * 0.1);

    // Fire intensity based on position
    const fireIntensity = 0.5 + (1 - t) * 0.5;

    if (i === 0) {
      // Demon head with fiery glow
      const headGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius + 8);
      headGlow.addColorStop(0, COLORS.snakeHead);
      headGlow.addColorStop(0.5, COLORS.snakeBody);
      headGlow.addColorStop(1, 'rgba(139, 0, 0, 0)');
      ctx.fillStyle = headGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 8, 0, Math.PI * 2);
      ctx.fill();

      // Head body
      const headGradient = ctx.createRadialGradient(centerX - 2, centerY - 2, 0, centerX, centerY, radius + 2);
      headGradient.addColorStop(0, COLORS.snakeHighlight);
      headGradient.addColorStop(0.5, COLORS.snakeHead);
      headGradient.addColorStop(1, COLORS.snakeBody);
      ctx.fillStyle = headGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 2, 0, Math.PI * 2);
      ctx.fill();

      // Eye direction
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

      // Demon eyes - glowing yellow
      const leftEyeX = centerX + perpX * eyeOffset + dx * eyeForward;
      const leftEyeY = centerY + perpY * eyeOffset + dy * eyeForward;
      const rightEyeX = centerX - perpX * eyeOffset + dx * eyeForward;
      const rightEyeY = centerY - perpY * eyeOffset + dy * eyeForward;

      // Eye glow
      ctx.fillStyle = COLORS.snakeEye;
      ctx.shadowColor = COLORS.snakeEye;
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(leftEyeX, leftEyeY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(rightEyeX, rightEyeY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Slit pupils
      ctx.fillStyle = COLORS.snakePupil;
      ctx.beginPath();
      ctx.ellipse(leftEyeX + dx, leftEyeY + dy, 1, 2.5, Math.atan2(dy, dx), 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(rightEyeX + dx, rightEyeY + dy, 1, 2.5, Math.atan2(dy, dx), 0, Math.PI * 2);
      ctx.fill();

      // Eye glint
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(leftEyeX - 1, leftEyeY - 1, 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(rightEyeX - 1, rightEyeY - 1, 1, 0, Math.PI * 2);
      ctx.fill();

      // Draw demon horns
      drawDemonHorns(ctx, centerX, centerY, dx, dy, perpX, perpY, frameCount);

      // Menacing mouth
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = 2;
      const mouthY = centerY + dy * 6;
      const mouthX = centerX + dx * 6;
      ctx.beginPath();
      ctx.moveTo(mouthX - 4, mouthY);
      ctx.lineTo(mouthX + 4, mouthY);
      ctx.stroke();

      // Fangs
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(mouthX - 3, mouthY);
      ctx.lineTo(mouthX - 2, mouthY + 3);
      ctx.lineTo(mouthX - 1, mouthY);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(mouthX + 3, mouthY);
      ctx.lineTo(mouthX + 2, mouthY + 3);
      ctx.lineTo(mouthX + 1, mouthY);
      ctx.fill();

    } else {
      // Body segments with fire gradient
      const bodyGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius + 4);
      bodyGlow.addColorStop(0, `rgba(153, 50, 204, ${fireIntensity * 0.3})`);
      bodyGlow.addColorStop(1, 'rgba(75, 0, 130, 0)');
      ctx.fillStyle = bodyGlow;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 4, 0, Math.PI * 2);
      ctx.fill();

      const segHue = 280 - t * 20;
      const bodyGradient = ctx.createRadialGradient(centerX - 1, centerY - 1, 0, centerX, centerY, radius);
      bodyGradient.addColorStop(0, COLORS.snakeHighlight);
      bodyGradient.addColorStop(0.4, hslToRgb(segHue / 360, 0.9, 0.45 + t * 0.1));
      bodyGradient.addColorStop(1, hslToRgb(segHue / 360, 0.85, 0.35 + t * 0.1));
      ctx.fillStyle = bodyGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      // Scale pattern
      if (i % 2 === 0) {
        ctx.fillStyle = 'rgba(75, 0, 130, 0.3)';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * 0.7, 0, Math.PI * 2);
        ctx.fill();
      }

      // Highlight
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.2;
      ctx.beginPath();
      ctx.arc(centerX - 2, centerY - 2, radius * 0.25, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  // Draw inferno particles (game over effect)
  for (const p of infernoParticles) {
    const alpha = p.life * 0.9;
    const pSize = p.size * p.life;

    // Outer glow
    ctx.fillStyle = `hsla(${p.hue}, 100%, 50%, ${alpha * 0.3})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, pSize * 2, 0, Math.PI * 2);
    ctx.fill();

    // Core
    ctx.fillStyle = `hsla(${p.hue}, 100%, 60%, ${alpha * 0.7})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, pSize, 0, Math.PI * 2);
    ctx.fill();

    // Hot center
    ctx.fillStyle = `hsla(${p.hue + 30}, 80%, 80%, ${alpha})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, pSize * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Game over overlay - Apocalyptic end
  if (gameState.gameOver) {
    // Dark hellish overlay
    ctx.fillStyle = COLORS.gameOverOverlay;
    ctx.fillRect(0, 0, width, height);

    // Fiery vortex
    ctx.globalAlpha = 0.2;
    for (let ring = 0; ring < 5; ring++) {
      const ringRadius = 30 + ring * 30;
      const rotation = frameCount * 0.03 * (ring % 2 === 0 ? 1 : -1);
      ctx.strokeStyle = ring % 2 === 0 ? COLORS.fireOrange : COLORS.fireRed;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, ringRadius, rotation, rotation + Math.PI * 1.5);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Falling embers around the edges
    ctx.globalAlpha = 0.5;
    const numEmbers = 12;
    for (let e = 0; e < numEmbers; e++) {
      const angle = (e / numEmbers) * Math.PI * 2 + frameCount * 0.02;
      const dist = 140 + Math.sin(frameCount * 0.05 + e) * 20;
      const ex = width / 2 + Math.cos(angle) * dist;
      const ey = height / 2 + Math.sin(angle) * dist;

      ctx.fillStyle = e % 2 === 0 ? COLORS.fireOrange : COLORS.fireYellow;
      ctx.beginPath();
      ctx.arc(ex, ey, 4, 0, Math.PI * 2);
      ctx.fill();

      // Ember glow
      ctx.fillStyle = COLORS.fireRed;
      ctx.globalAlpha = 0.2;
      ctx.beginPath();
      ctx.arc(ex, ey, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.5;
    }
    ctx.globalAlpha = 1;

    // Skull symbol in center (pulsing)
    const skullAlpha = 0.4 + Math.sin(frameCount * 0.05) * 0.15;
    ctx.strokeStyle = COLORS.fireOrange;
    ctx.lineWidth = 3;
    ctx.globalAlpha = skullAlpha;

    // Simple skull shape
    const skullX = width / 2;
    const skullY = height / 2;
    const skullSize = 30;

    // Skull outline
    ctx.beginPath();
    ctx.arc(skullX, skullY - 5, skullSize, 0, Math.PI * 2);
    ctx.stroke();

    // Eye sockets
    ctx.fillStyle = COLORS.fireRed;
    ctx.beginPath();
    ctx.arc(skullX - 10, skullY - 8, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(skullX + 10, skullY - 8, 6, 0, Math.PI * 2);
    ctx.fill();

    // Nose
    ctx.beginPath();
    ctx.moveTo(skullX, skullY);
    ctx.lineTo(skullX - 4, skullY + 8);
    ctx.lineTo(skullX + 4, skullY + 8);
    ctx.closePath();
    ctx.stroke();

    // Teeth
    ctx.strokeStyle = COLORS.fireOrange;
    ctx.lineWidth = 2;
    for (let tooth = 0; tooth < 5; tooth++) {
      const toothX = skullX - 12 + tooth * 6;
      ctx.beginPath();
      ctx.moveTo(toothX, skullY + 18);
      ctx.lineTo(toothX, skullY + 25);
      ctx.stroke();
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
          backgroundColor: '#0a0505',
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
