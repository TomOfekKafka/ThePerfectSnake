import { useEffect, useRef, useCallback } from 'react';
import './GameBoard.css';
import type { SnakeScene } from './SnakeScene';

interface Position {
  x: number;
  y: number;
}

type PowerUpType = 'SPEED_BOOST' | 'INVINCIBILITY' | 'SCORE_MULTIPLIER' | 'MAGNET';

interface PowerUp {
  position: Position;
  type: PowerUpType;
  spawnTime: number;
  duration: number;
}

interface ActivePowerUp {
  type: PowerUpType;
  endTime: number;
}

interface GameState {
  snake: Position[];
  food: Position;
  gameOver: boolean;
  gameStarted: boolean;
  score: number;
  powerUp?: PowerUp | null;
  activePowerUps?: ActivePowerUp[];
  tickCount?: number;
}

interface GameBoardProps {
  gameState: GameState;
  gridSize: number;
}

const CELL_SIZE = 20;

const GRID_SIZE = 20;

// Color palette - ICE CRYSTAL DRAGON theme: frozen arctic, crystalline beauty
const COLORS = {
  bgDark: '#030818',
  bgVolcanic: '#051020',
  gridLine: '#102040',
  gridAccent: '#1a3555',
  // Ice dragon snake colors (crystalline frost)
  snakeHead: '#40e0ff',
  snakeBody: '#20b0d0',
  snakeTail: '#1080a0',
  snakeHighlight: '#80f0ff',
  snakeEye: '#ff4080',
  snakePupil: '#200010',
  snakeHorn: '#e0f8ff',
  // Food - frozen crystal gem
  food: '#00d0ff',
  foodCore: '#e0ffff',
  foodGlow: '#40c0ff',
  gameOverOverlay: 'rgba(3, 8, 24, 0.95)',
  // Ice crystal accent colors
  fireOrange: '#30a0c0',
  fireRed: '#2080a0',
  fireYellow: '#80e0ff',
  lavaRed: '#40c0e0',
  ashGray: '#4a6080',
  smokeBlack: '#081020',
  brimstoneYellow: '#a0e0ff',
  demonPurple: '#0080b0',
  bloodRed: '#006080',
  emberOrange: '#60c0e0',
  // Power-up colors
  powerUpSpeed: '#ffff00',
  powerUpSpeedGlow: '#ffa500',
  powerUpInvincibility: '#00ffff',
  powerUpInvincibilityGlow: '#0088ff',
  powerUpMultiplier: '#ff00ff',
  powerUpMultiplierGlow: '#8800ff',
  powerUpMagnet: '#00ff88',
  powerUpMagnetGlow: '#00ff00',
};

const POWERUP_COLORS: Record<PowerUpType, { main: string; glow: string; symbol: string }> = {
  SPEED_BOOST: { main: '#ffff00', glow: '#ffa500', symbol: '⚡' },
  INVINCIBILITY: { main: '#00ffff', glow: '#0088ff', symbol: '🛡' },
  SCORE_MULTIPLIER: { main: '#ff00ff', glow: '#8800ff', symbol: '×3' },
  MAGNET: { main: '#00ff88', glow: '#00ff00', symbol: '◎' },
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

// Ice crystal spikes on the dragon head
function drawIceCrystals(
  ctx: CanvasRenderingContext2D,
  headX: number,
  headY: number,
  dx: number,
  dy: number,
  perpX: number,
  perpY: number,
  frame: number
): void {
  const crystalOffset = -6;
  const crystalBaseX = headX - dx * crystalOffset;
  const crystalBaseY = headY - dy * crystalOffset;

  // Crystal shimmer animation
  const shimmer = 0.7 + Math.sin(frame * 0.12) * 0.3;

  const crystalSize = 12;
  const crystalSpread = 5;

  // Left ice crystal
  ctx.save();
  ctx.translate(crystalBaseX + perpX * crystalSpread, crystalBaseY + perpY * crystalSpread);
  ctx.rotate(Math.atan2(perpY, perpX) + 0.4);

  // Crystal body - translucent ice
  ctx.fillStyle = 'rgba(200, 240, 255, 0.8)';
  ctx.beginPath();
  ctx.moveTo(0, crystalSize * 0.3);
  ctx.lineTo(-crystalSize * 0.25, 0);
  ctx.lineTo(-crystalSize * 0.15, -crystalSize * 0.6);
  ctx.lineTo(0, -crystalSize);
  ctx.lineTo(crystalSize * 0.15, -crystalSize * 0.6);
  ctx.lineTo(crystalSize * 0.25, 0);
  ctx.closePath();
  ctx.fill();

  // Crystal highlight
  ctx.fillStyle = `rgba(255, 255, 255, ${shimmer * 0.9})`;
  ctx.beginPath();
  ctx.moveTo(-crystalSize * 0.1, -crystalSize * 0.3);
  ctx.lineTo(0, -crystalSize * 0.8);
  ctx.lineTo(crystalSize * 0.05, -crystalSize * 0.3);
  ctx.closePath();
  ctx.fill();

  // Crystal glow
  ctx.fillStyle = `rgba(100, 200, 255, ${shimmer * 0.4})`;
  ctx.beginPath();
  ctx.arc(0, -crystalSize * 0.4, crystalSize * 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Right ice crystal
  ctx.save();
  ctx.translate(crystalBaseX - perpX * crystalSpread, crystalBaseY - perpY * crystalSpread);
  ctx.rotate(Math.atan2(-perpY, -perpX) + 0.4);

  ctx.fillStyle = 'rgba(200, 240, 255, 0.8)';
  ctx.beginPath();
  ctx.moveTo(0, crystalSize * 0.3);
  ctx.lineTo(-crystalSize * 0.25, 0);
  ctx.lineTo(-crystalSize * 0.15, -crystalSize * 0.6);
  ctx.lineTo(0, -crystalSize);
  ctx.lineTo(crystalSize * 0.15, -crystalSize * 0.6);
  ctx.lineTo(crystalSize * 0.25, 0);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = `rgba(255, 255, 255, ${shimmer * 0.9})`;
  ctx.beginPath();
  ctx.moveTo(-crystalSize * 0.1, -crystalSize * 0.3);
  ctx.lineTo(0, -crystalSize * 0.8);
  ctx.lineTo(crystalSize * 0.05, -crystalSize * 0.3);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = `rgba(100, 200, 255, ${shimmer * 0.4})`;
  ctx.beginPath();
  ctx.arc(0, -crystalSize * 0.4, crystalSize * 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Center crown crystal
  ctx.save();
  ctx.translate(crystalBaseX, crystalBaseY);
  ctx.rotate(Math.atan2(dy, dx) + Math.PI);

  const centerSize = crystalSize * 1.2;
  ctx.fillStyle = 'rgba(180, 230, 255, 0.85)';
  ctx.beginPath();
  ctx.moveTo(0, centerSize * 0.2);
  ctx.lineTo(-centerSize * 0.2, 0);
  ctx.lineTo(-centerSize * 0.1, -centerSize * 0.7);
  ctx.lineTo(0, -centerSize);
  ctx.lineTo(centerSize * 0.1, -centerSize * 0.7);
  ctx.lineTo(centerSize * 0.2, 0);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = `rgba(255, 255, 255, ${shimmer})`;
  ctx.beginPath();
  ctx.moveTo(0, -centerSize * 0.5);
  ctx.lineTo(-centerSize * 0.05, -centerSize * 0.8);
  ctx.lineTo(0, -centerSize * 0.95);
  ctx.lineTo(centerSize * 0.05, -centerSize * 0.8);
  ctx.closePath();
  ctx.fill();
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

// Power-up visual state
interface PowerUpParticle2D {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  hue: number;
  angle: number;
}
let powerUpParticles: PowerUpParticle2D[] = [];
const MAX_POWERUP_PARTICLES = 30;
let powerUpPhase = 0;

// Power-up collection burst state
interface PowerUpBurst2D {
  x: number;
  y: number;
  type: PowerUpType;
  particles: { angle: number; dist: number; size: number; alpha: number }[];
  rings: { radius: number; alpha: number }[];
  life: number;
}
let powerUpBursts: PowerUpBurst2D[] = [];

// Active power-up indicator state
let activePowerUpPulse = 0;

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

// Ghost snake - spectral AI companion that guides player to food
interface GhostSnake2D {
  segments: { x: number; y: number }[];
  direction: { dx: number; dy: number };
  targetX: number;
  targetY: number;
  moveTimer: number;
  moveInterval: number;
  pulsePhase: number;
  glowIntensity: number;
  hue: number;
  trail: { x: number; y: number; alpha: number }[];
  nearFood: boolean;
  foodProximity: number;
  orbitAngle: number;
  guidingBeam: { x: number; y: number; alpha: number }[];
}
let ghostSnake: GhostSnake2D | null = null;
const GHOST_SNAKE_LENGTH = 8;
const GHOST_MOVE_INTERVAL = 10;

// Tail orbs state - two mystical energy orbs that orbit the snake's tail
interface TailOrb2D {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  angle: number;
  orbitRadius: number;
  orbitSpeed: number;
  size: number;
  hue: number;
  pulsePhase: number;
  trail: { x: number; y: number; alpha: number; size: number }[];
  sparkles: { x: number; y: number; vx: number; vy: number; life: number; size: number; hue: number }[];
}
let tailOrbs: TailOrb2D[] = [];
let tailOrbsInitialized = false;

function initTailOrbs(): void {
  if (tailOrbsInitialized) return;
  tailOrbsInitialized = true;

  // Create two orbs with complementary colors and opposite orbit phases
  tailOrbs = [
    {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      angle: 0,
      orbitRadius: 18,
      orbitSpeed: 0.08,
      size: 6,
      hue: 280, // Purple
      pulsePhase: 0,
      trail: [],
      sparkles: [],
    },
    {
      x: 0,
      y: 0,
      targetX: 0,
      targetY: 0,
      angle: Math.PI, // Opposite side
      orbitRadius: 18,
      orbitSpeed: 0.08,
      size: 6,
      hue: 180, // Cyan
      pulsePhase: Math.PI,
      trail: [],
      sparkles: [],
    },
  ];
}

function updateTailOrbs(gameState: GameState): void {
  if (!tailOrbsInitialized) {
    initTailOrbs();
  }

  if (gameState.gameOver) {
    // Fade out and disperse orbs on game over
    for (const orb of tailOrbs) {
      orb.orbitRadius += 2;
      orb.size *= 0.95;
      for (const t of orb.trail) {
        t.alpha *= 0.85;
      }
      orb.trail = orb.trail.filter(t => t.alpha > 0.02);
      for (let i = orb.sparkles.length - 1; i >= 0; i--) {
        const s = orb.sparkles[i];
        s.x += s.vx;
        s.y += s.vy;
        s.life -= 0.05;
        if (s.life <= 0) orb.sparkles.splice(i, 1);
      }
    }
    return;
  }

  const snake = gameState.snake;
  if (snake.length < 1) return;

  // Get tail position
  const tail = snake[snake.length - 1];
  const tailX = tail.x * CELL_SIZE + CELL_SIZE / 2;
  const tailY = tail.y * CELL_SIZE + CELL_SIZE / 2;

  // Get direction from second-to-last to tail (or use default)
  let tailDx = 0, tailDy = 1;
  if (snake.length >= 2) {
    const prev = snake[snake.length - 2];
    tailDx = tail.x - prev.x;
    tailDy = tail.y - prev.y;
    const len = Math.sqrt(tailDx * tailDx + tailDy * tailDy);
    if (len > 0) {
      tailDx /= len;
      tailDy /= len;
    }
  }

  // Position orbs behind the tail in the direction the tail is trailing
  const orbBaseX = tailX + tailDx * 12;
  const orbBaseY = tailY + tailDy * 12;

  for (const orb of tailOrbs) {
    // Update orbit angle
    orb.angle += orb.orbitSpeed;
    orb.pulsePhase += 0.1;

    // Calculate target position (orbiting around the tail)
    orb.targetX = orbBaseX + Math.cos(orb.angle) * orb.orbitRadius;
    orb.targetY = orbBaseY + Math.sin(orb.angle) * orb.orbitRadius;

    // Smooth follow
    orb.x += (orb.targetX - orb.x) * 0.15;
    orb.y += (orb.targetY - orb.y) * 0.15;

    // Pulsing size
    const basePulse = 0.85 + Math.sin(orb.pulsePhase) * 0.15;
    orb.size = 6 * basePulse;

    // Add trail segment
    if (frameCount % 2 === 0) {
      orb.trail.unshift({
        x: orb.x,
        y: orb.y,
        alpha: 0.8,
        size: orb.size * 0.7,
      });
      if (orb.trail.length > 12) orb.trail.pop();
    }

    // Fade trail
    for (const t of orb.trail) {
      t.alpha *= 0.88;
      t.size *= 0.95;
    }
    orb.trail = orb.trail.filter(t => t.alpha > 0.02);

    // Spawn sparkles occasionally
    if (Math.random() < 0.15) {
      const sparkleAngle = Math.random() * Math.PI * 2;
      const sparkleSpeed = 0.5 + Math.random() * 1;
      orb.sparkles.push({
        x: orb.x,
        y: orb.y,
        vx: Math.cos(sparkleAngle) * sparkleSpeed,
        vy: Math.sin(sparkleAngle) * sparkleSpeed - 0.5,
        life: 1,
        size: 1.5 + Math.random() * 1.5,
        hue: orb.hue + (Math.random() - 0.5) * 30,
      });
    }

    // Update sparkles
    for (let i = orb.sparkles.length - 1; i >= 0; i--) {
      const s = orb.sparkles[i];
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 0.02; // Gentle gravity
      s.life -= 0.04;
      s.size *= 0.97;
      if (s.life <= 0 || s.size < 0.3) {
        orb.sparkles.splice(i, 1);
      }
    }

    // Limit sparkles
    while (orb.sparkles.length > 15) {
      orb.sparkles.shift();
    }
  }
}

function drawTailOrbs(ctx: CanvasRenderingContext2D, gameState: GameState): void {
  if (gameState.snake.length < 1) return;

  for (const orb of tailOrbs) {
    if (orb.size < 0.5) continue;

    const pulse = 0.8 + Math.sin(orb.pulsePhase) * 0.2;

    // Draw trail first (behind the orb)
    for (let i = orb.trail.length - 1; i >= 0; i--) {
      const t = orb.trail[i];
      const progress = i / orb.trail.length;

      // Outer glow
      ctx.fillStyle = `hsla(${orb.hue}, 70%, 50%, ${t.alpha * 0.2})`;
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.size * 2, 0, Math.PI * 2);
      ctx.fill();

      // Core trail
      ctx.fillStyle = `hsla(${orb.hue}, 80%, 60%, ${t.alpha * 0.5 * (1 - progress)})`;
      ctx.beginPath();
      ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw sparkles
    for (const s of orb.sparkles) {
      const sparkleAlpha = s.life * 0.8;

      // Sparkle glow
      ctx.fillStyle = `hsla(${s.hue}, 90%, 70%, ${sparkleAlpha * 0.3})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size * 2, 0, Math.PI * 2);
      ctx.fill();

      // Sparkle core
      ctx.fillStyle = `hsla(${s.hue}, 100%, 80%, ${sparkleAlpha})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
      ctx.fill();

      // Bright center
      ctx.fillStyle = `rgba(255, 255, 255, ${sparkleAlpha * 0.8})`;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.size * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // Outer ethereal glow
    const glowSize = orb.size * 3 * pulse;
    ctx.fillStyle = `hsla(${orb.hue}, 60%, 40%, ${0.15 * pulse})`;
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, glowSize, 0, Math.PI * 2);
    ctx.fill();

    // Mid glow
    ctx.fillStyle = `hsla(${orb.hue}, 70%, 55%, ${0.25 * pulse})`;
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, orb.size * 2 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Main orb body
    const orbGradient = ctx.createRadialGradient(
      orb.x - orb.size * 0.3, orb.y - orb.size * 0.3, 0,
      orb.x, orb.y, orb.size * 1.2
    );
    orbGradient.addColorStop(0, `hsla(${orb.hue + 30}, 80%, 85%, ${0.95 * pulse})`);
    orbGradient.addColorStop(0.4, `hsla(${orb.hue}, 90%, 65%, ${0.9 * pulse})`);
    orbGradient.addColorStop(1, `hsla(${orb.hue - 20}, 80%, 45%, ${0.7 * pulse})`);
    ctx.fillStyle = orbGradient;
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, orb.size * 1.2, 0, Math.PI * 2);
    ctx.fill();

    // Inner bright core
    ctx.fillStyle = `hsla(${orb.hue + 40}, 70%, 90%, ${0.9 * pulse})`;
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, orb.size * 0.5, 0, Math.PI * 2);
    ctx.fill();

    // White hot center
    ctx.fillStyle = `rgba(255, 255, 255, ${0.7 * pulse})`;
    ctx.beginPath();
    ctx.arc(orb.x, orb.y, orb.size * 0.25, 0, Math.PI * 2);
    ctx.fill();

    // Lens flare effect
    const flareAngle = orb.angle + Math.PI / 4;
    const flareDist = orb.size * 1.5;
    const flareX = orb.x + Math.cos(flareAngle) * flareDist;
    const flareY = orb.y + Math.sin(flareAngle) * flareDist;
    ctx.fillStyle = `hsla(${orb.hue + 60}, 100%, 90%, ${0.3 * pulse})`;
    ctx.beginPath();
    ctx.arc(flareX, flareY, orb.size * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw energy connection between the two orbs
  if (tailOrbs.length >= 2) {
    const orb1 = tailOrbs[0];
    const orb2 = tailOrbs[1];
    const dist = Math.sqrt((orb2.x - orb1.x) ** 2 + (orb2.y - orb1.y) ** 2);

    if (dist > 5 && orb1.size > 0.5 && orb2.size > 0.5) {
      const pulseAlpha = 0.2 + Math.sin(frameCount * 0.1) * 0.1;

      // Gradient connection line
      const gradient = ctx.createLinearGradient(orb1.x, orb1.y, orb2.x, orb2.y);
      gradient.addColorStop(0, `hsla(${orb1.hue}, 80%, 60%, ${pulseAlpha})`);
      gradient.addColorStop(0.5, `hsla(${(orb1.hue + orb2.hue) / 2}, 70%, 70%, ${pulseAlpha * 1.2})`);
      gradient.addColorStop(1, `hsla(${orb2.hue}, 80%, 60%, ${pulseAlpha})`);

      ctx.strokeStyle = gradient;
      ctx.lineWidth = 2 + Math.sin(frameCount * 0.15) * 0.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(orb1.x, orb1.y);
      ctx.lineTo(orb2.x, orb2.y);
      ctx.stroke();

      // Energy particles along the connection
      const numParticles = 3;
      for (let i = 0; i < numParticles; i++) {
        const t = ((frameCount * 0.03 + i / numParticles) % 1);
        const px = orb1.x + (orb2.x - orb1.x) * t;
        const py = orb1.y + (orb2.y - orb1.y) * t;
        const pHue = orb1.hue + (orb2.hue - orb1.hue) * t;
        const pAlpha = Math.sin(t * Math.PI) * 0.6;

        ctx.fillStyle = `hsla(${pHue}, 90%, 75%, ${pAlpha})`;
        ctx.beginPath();
        ctx.arc(px, py, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

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

function initGhostSnake(): void {
  if (ghostSnake) return;

  const width = GRID_SIZE * CELL_SIZE;
  const height = GRID_SIZE * CELL_SIZE;

  const startX = 50 + Math.random() * (width - 100);
  const startY = 50 + Math.random() * (height - 100);

  const segments: { x: number; y: number }[] = [];
  for (let i = 0; i < GHOST_SNAKE_LENGTH; i++) {
    segments.push({
      x: startX - i * CELL_SIZE * 0.6,
      y: startY,
    });
  }

  ghostSnake = {
    segments,
    direction: { dx: 1, dy: 0 },
    targetX: width / 2,
    targetY: height / 2,
    moveTimer: 0,
    moveInterval: GHOST_MOVE_INTERVAL,
    pulsePhase: 0,
    glowIntensity: 0.6,
    hue: 260,
    trail: [],
    nearFood: false,
    foodProximity: 0,
    orbitAngle: 0,
    guidingBeam: [],
  };
}

function updateGhostSnake(gameState: GameState): void {
  if (!ghostSnake) {
    initGhostSnake();
    return;
  }

  const gs = ghostSnake;
  const width = GRID_SIZE * CELL_SIZE;
  const height = GRID_SIZE * CELL_SIZE;

  // Food position
  const foodX = gameState.food.x * CELL_SIZE + CELL_SIZE / 2;
  const foodY = gameState.food.y * CELL_SIZE + CELL_SIZE / 2;
  const head = gs.segments[0];
  const distToFood = Math.sqrt((head.x - foodX) ** 2 + (head.y - foodY) ** 2);

  // Update proximity tracking
  gs.foodProximity = Math.max(0, 1 - distToFood / 150);
  gs.nearFood = distToFood < 50;
  gs.orbitAngle += gs.nearFood ? 0.08 : 0.02;

  // Update visual effects - brighter when near food
  gs.pulsePhase += gs.nearFood ? 0.15 : 0.08;
  gs.glowIntensity = 0.5 + Math.sin(gs.pulsePhase) * 0.2 + gs.foodProximity * 0.4;

  // Add to trail
  if (gs.segments.length > 0) {
    gs.trail.unshift({ x: head.x, y: head.y, alpha: 0.5 + gs.foodProximity * 0.3 });
    if (gs.trail.length > 15) gs.trail.pop();
  }

  // Fade trail
  for (const t of gs.trail) {
    t.alpha *= 0.9;
  }
  gs.trail = gs.trail.filter(t => t.alpha > 0.02);

  // Update guiding beam - luminous connection to food
  if (frameCount % 3 === 0 && !gameState.gameOver) {
    const beamAlpha = 0.3 + gs.foodProximity * 0.5;
    gs.guidingBeam.unshift({ x: head.x, y: head.y, alpha: beamAlpha });
    if (gs.guidingBeam.length > 20) gs.guidingBeam.pop();
  }
  for (const b of gs.guidingBeam) {
    b.alpha *= 0.88;
  }
  gs.guidingBeam = gs.guidingBeam.filter(b => b.alpha > 0.02);

  // Movement logic - ALWAYS target food
  gs.moveTimer++;
  if (gs.moveTimer >= gs.moveInterval) {
    gs.moveTimer = 0;

    if (gs.nearFood) {
      // Orbit around food when close
      const orbitDist = 35 + Math.sin(gs.pulsePhase * 0.5) * 10;
      gs.targetX = foodX + Math.cos(gs.orbitAngle) * orbitDist;
      gs.targetY = foodY + Math.sin(gs.orbitAngle) * orbitDist;
    } else {
      // Head directly toward food
      gs.targetX = foodX;
      gs.targetY = foodY;
    }

    // Calculate direction toward target
    const dx = gs.targetX - head.x;
    const dy = gs.targetY - head.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > 5) {
      const targetDx = dx / dist;
      const targetDy = dy / dist;

      // Faster tracking when far from food
      const trackingSpeed = gs.nearFood ? 0.25 : 0.4;
      gs.direction.dx = gs.direction.dx * (1 - trackingSpeed) + targetDx * trackingSpeed;
      gs.direction.dy = gs.direction.dy * (1 - trackingSpeed) + targetDy * trackingSpeed;

      const len = Math.sqrt(gs.direction.dx * gs.direction.dx + gs.direction.dy * gs.direction.dy);
      if (len > 0) {
        gs.direction.dx /= len;
        gs.direction.dy /= len;
      }
    }

    // Move head - faster when far from food
    const moveSpeed = gs.nearFood ? CELL_SIZE * 0.3 : CELL_SIZE * 0.6;
    const newHead = {
      x: head.x + gs.direction.dx * moveSpeed,
      y: head.y + gs.direction.dy * moveSpeed,
    };

    // Wrap around screen edges
    if (newHead.x < -20) newHead.x = width + 20;
    if (newHead.x > width + 20) newHead.x = -20;
    if (newHead.y < -20) newHead.y = height + 20;
    if (newHead.y > height + 20) newHead.y = -20;

    gs.segments.unshift(newHead);
    gs.segments.pop();
  } else {
    const moveSpeed = gs.nearFood ? CELL_SIZE * 0.3 : CELL_SIZE * 0.5;
    head.x += gs.direction.dx * moveSpeed * 0.05;
    head.y += gs.direction.dy * moveSpeed * 0.05;

    for (let i = 1; i < gs.segments.length; i++) {
      const seg = gs.segments[i];
      const prev = gs.segments[i - 1];
      const pullStrength = 0.15 + gs.foodProximity * 0.1;
      seg.x += (prev.x - seg.x) * pullStrength;
      seg.y += (prev.y - seg.y) * pullStrength;
    }
  }

  // Color shift - golden glow near food, purple when searching
  if (gameState.gameOver) {
    gs.hue = 0;
    gs.glowIntensity *= 0.95;
  } else if (gs.nearFood) {
    gs.hue = 45 + Math.sin(gs.pulsePhase) * 15; // Golden when orbiting food
  } else {
    gs.hue = 260 + Math.sin(gs.pulsePhase * 0.5) * 20 - gs.foodProximity * 80; // Purple->gold gradient
  }
}

function drawGhostSnake(ctx: CanvasRenderingContext2D, gameState: GameState): void {
  if (!ghostSnake || ghostSnake.segments.length === 0) return;

  const gs = ghostSnake;
  const pulse = gs.glowIntensity;
  const head = gs.segments[0];

  // Food position for guiding beam
  const foodX = gameState.food.x * CELL_SIZE + CELL_SIZE / 2;
  const foodY = gameState.food.y * CELL_SIZE + CELL_SIZE / 2;

  // Draw guiding beam - luminous trail pointing to food
  if (gs.guidingBeam.length > 1 && !gameState.gameOver) {
    // Draw ethereal connection line from ghost to food
    const beamAlpha = gs.foodProximity * 0.4;
    if (beamAlpha > 0.05) {
      ctx.strokeStyle = `hsla(${gs.hue}, 80%, 70%, ${beamAlpha})`;
      ctx.lineWidth = 2 + gs.foodProximity * 3;
      ctx.lineCap = 'round';
      ctx.setLineDash([8, 12]);
      ctx.beginPath();
      ctx.moveTo(head.x, head.y);
      ctx.lineTo(foodX, foodY);
      ctx.stroke();
      ctx.setLineDash([]);

      // Pulsing particles along the beam
      const beamDist = Math.sqrt((foodX - head.x) ** 2 + (foodY - head.y) ** 2);
      const numParticles = Math.min(6, Math.floor(beamDist / 30));
      for (let i = 0; i < numParticles; i++) {
        const t = (i + 0.5 + Math.sin(frameCount * 0.1 + i) * 0.3) / numParticles;
        const px = head.x + (foodX - head.x) * t;
        const py = head.y + (foodY - head.y) * t;
        const particleAlpha = beamAlpha * (0.5 + Math.sin(frameCount * 0.15 + i * 2) * 0.5);
        const particleSize = 2 + gs.foodProximity * 2;

        ctx.fillStyle = `hsla(${gs.hue + 20}, 90%, 75%, ${particleAlpha})`;
        ctx.beginPath();
        ctx.arc(px, py, particleSize, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Draw trail first (behind everything)
  for (let i = 0; i < gs.trail.length; i++) {
    const t = gs.trail[i];
    const trailSize = 4 * (1 - i / gs.trail.length) * (1 + gs.foodProximity * 0.5);

    ctx.fillStyle = `hsla(${gs.hue}, 70%, 60%, ${t.alpha * 0.3})`;
    ctx.beginPath();
    ctx.arc(t.x, t.y, trailSize * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw connecting ethereal ribbon between segments
  ctx.strokeStyle = `hsla(${gs.hue}, 60%, 50%, ${0.15 * pulse})`;
  ctx.lineWidth = 12 + gs.foodProximity * 4;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(gs.segments[0].x, gs.segments[0].y);
  for (let i = 1; i < gs.segments.length; i++) {
    ctx.lineTo(gs.segments[i].x, gs.segments[i].y);
  }
  ctx.stroke();

  // Inner ribbon - brighter when near food
  ctx.strokeStyle = `hsla(${gs.hue}, 70%, 65%, ${(0.25 + gs.foodProximity * 0.2) * pulse})`;
  ctx.lineWidth = 6 + gs.foodProximity * 2;
  ctx.stroke();

  // Draw segments from tail to head
  for (let i = gs.segments.length - 1; i >= 0; i--) {
    const seg = gs.segments[i];
    const t = gs.segments.length > 1 ? i / (gs.segments.length - 1) : 1;
    const segmentPulse = pulse * (0.7 + Math.sin(gs.pulsePhase + i * 0.5) * 0.3);

    // Size varies from tail to head - bigger when near food
    const baseSize = 6 + t * 4 + gs.foodProximity * 2;
    const size = baseSize * (0.9 + segmentPulse * 0.2);

    // Outer spectral glow - enhanced near food
    ctx.fillStyle = `hsla(${gs.hue}, 50%, 40%, ${(0.1 + gs.foodProximity * 0.1) * segmentPulse})`;
    ctx.beginPath();
    ctx.arc(seg.x, seg.y, size * 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Mid glow
    ctx.fillStyle = `hsla(${gs.hue}, 60%, 55%, ${(0.2 + gs.foodProximity * 0.15) * segmentPulse})`;
    ctx.beginPath();
    ctx.arc(seg.x, seg.y, size * 1.5, 0, Math.PI * 2);
    ctx.fill();

    // Core
    ctx.fillStyle = `hsla(${gs.hue}, 70%, 70%, ${(0.5 + gs.foodProximity * 0.2) * segmentPulse})`;
    ctx.beginPath();
    ctx.arc(seg.x, seg.y, size, 0, Math.PI * 2);
    ctx.fill();

    // Bright inner core
    ctx.fillStyle = `hsla(${gs.hue + 30}, 50%, 85%, ${(0.4 + gs.foodProximity * 0.3) * segmentPulse})`;
    ctx.beginPath();
    ctx.arc(seg.x, seg.y, size * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Head has special features
    if (i === 0) {
      const dx = gs.direction.dx;
      const dy = gs.direction.dy;
      const perpX = -dy;
      const perpY = dx;

      const eyeOffset = 3;
      const eyeForward = 4;
      const leftEyeX = seg.x + perpX * eyeOffset + dx * eyeForward;
      const leftEyeY = seg.y + perpY * eyeOffset + dy * eyeForward;
      const rightEyeX = seg.x - perpX * eyeOffset + dx * eyeForward;
      const rightEyeY = seg.y - perpY * eyeOffset + dy * eyeForward;

      // Eye glow - more intense near food
      const eyeGlow = gs.nearFood ? 1 : 0.7;
      ctx.fillStyle = `hsla(${gs.hue + 60}, 80%, 80%, ${eyeGlow * segmentPulse})`;
      ctx.shadowColor = `hsl(${gs.hue + 60}, 100%, 70%)`;
      ctx.shadowBlur = 6 + gs.foodProximity * 6;
      ctx.beginPath();
      ctx.arc(leftEyeX, leftEyeY, 2.5 + gs.foodProximity, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(rightEyeX, rightEyeY, 2.5 + gs.foodProximity, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.8 * segmentPulse;
      ctx.beginPath();
      ctx.arc(leftEyeX, leftEyeY, 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(rightEyeX, rightEyeY, 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Draw excitement sparkles when near food
      if (gs.nearFood) {
        const sparkleCount = 4;
        for (let s = 0; s < sparkleCount; s++) {
          const sparkleAngle = gs.orbitAngle * 2 + (s / sparkleCount) * Math.PI * 2;
          const sparkleDist = 12 + Math.sin(frameCount * 0.2 + s) * 4;
          const sparkleX = seg.x + Math.cos(sparkleAngle) * sparkleDist;
          const sparkleY = seg.y + Math.sin(sparkleAngle) * sparkleDist;

          ctx.fillStyle = `hsla(${gs.hue + 40}, 100%, 80%, ${0.6 * pulse})`;
          ctx.beginPath();
          ctx.arc(sparkleX, sparkleY, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }
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

function spawnFrostParticle(x: number, y: number, intensity: number): void {
  if (flameParticles.length >= MAX_FLAME_PARTICLES) {
    flameParticles.shift();
  }

  const angle = Math.random() * Math.PI * 2;
  const speed = 0.2 + Math.random() * 0.4;
  const life = 0.5 + Math.random() * 0.5;

  flameParticles.push({
    x: x + (Math.random() - 0.5) * 6,
    y: y + (Math.random() - 0.5) * 6,
    vx: Math.cos(angle) * speed * 0.5,
    vy: -0.3 - Math.random() * 0.8 * intensity,
    size: 2 + Math.random() * 3 * intensity,
    life,
    maxLife: life,
    hue: 185 + Math.random() * 30, // Cyan to light blue
  });
}

function spawnIceShatter(x: number, y: number): void {
  const particles: { angle: number; dist: number; size: number; hue: number }[] = [];
  const numParticles = 10;
  for (let i = 0; i < numParticles; i++) {
    particles.push({
      angle: (i / numParticles) * Math.PI * 2 + Math.random() * 0.3,
      dist: 0,
      size: 3 + Math.random() * 4,
      hue: 185 + Math.random() * 25, // Ice blue to cyan
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

  screenShakeIntensity = 8;
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

function spawnEtherealParticle(x: number, y: number, _hue: number): void {
  if (etherealParticles.length >= MAX_ETHEREAL_PARTICLES) {
    etherealParticles.shift();
  }

  const angle = Math.random() * Math.PI * 2;
  const speed = 0.2 + Math.random() * 0.4;
  const life = 0.9 + Math.random() * 0.5;

  etherealParticles.push({
    x: x + (Math.random() - 0.5) * 10,
    y: y + (Math.random() - 0.5) * 10,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed - 0.2,
    size: 2 + Math.random() * 3,
    life,
    maxLife: life,
    hue: 190 + Math.random() * 20, // Ice blue range
    brightness: 0.6 + Math.random() * 0.3,
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
    const hue = 190 + Math.sin(frameCount * 0.05) * 15; // Ice blue range
    cometTrail.unshift({
      x: headX,
      y: headY,
      alpha: 1,
      size: CELL_SIZE / 2 + 2,
      hue,
    });

    // Spawn ethereal particles from trail
    if (Math.random() < 0.5) {
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

function spawnFreezeShatter(snake: Position[]): void {
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
      const speed = 2 + Math.random() * 3;

      infernoParticles.push({
        x: cx + (Math.random() - 0.5) * 8,
        y: cy + (Math.random() - 0.5) * 8,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 5,
        life: 1,
        hue: 185 + Math.random() * 30, // Ice blue
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

// HUD state
let hudPulsePhase = 0;
let lastHudScore = 0;
let scoreFlashIntensity = 0;

// Draw the HUD overlay with score, length, and power-up indicators
function drawHUD(
  ctx: CanvasRenderingContext2D,
  gameState: GameState,
  width: number,
  height: number
): void {
  if (!gameState.gameStarted) return;

  hudPulsePhase += 0.08;

  // Detect score change for flash effect
  if (gameState.score > lastHudScore) {
    scoreFlashIntensity = 1;
  }
  lastHudScore = gameState.score;
  scoreFlashIntensity *= 0.92;

  const padding = 12;
  const pulse = Math.sin(hudPulsePhase) * 0.15 + 0.85;

  // Top-left: Score display with ice crystal effect
  ctx.save();

  // Score panel background - frosted glass effect
  const scorePanelWidth = 120;
  const scorePanelHeight = 50;
  const scoreGradient = ctx.createLinearGradient(padding, padding, padding + scorePanelWidth, padding + scorePanelHeight);
  scoreGradient.addColorStop(0, 'rgba(20, 60, 100, 0.7)');
  scoreGradient.addColorStop(0.5, 'rgba(40, 100, 140, 0.5)');
  scoreGradient.addColorStop(1, 'rgba(20, 60, 100, 0.7)');

  // Panel with rounded corners
  ctx.fillStyle = scoreGradient;
  ctx.beginPath();
  ctx.roundRect(padding, padding, scorePanelWidth, scorePanelHeight, 8);
  ctx.fill();

  // Ice crystal border
  ctx.strokeStyle = `rgba(150, 220, 255, ${0.6 + scoreFlashIntensity * 0.4})`;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Inner glow when score flashes
  if (scoreFlashIntensity > 0.1) {
    ctx.strokeStyle = `rgba(255, 255, 255, ${scoreFlashIntensity * 0.5})`;
    ctx.lineWidth = 4;
    ctx.stroke();
  }

  // Score label
  ctx.font = 'bold 10px monospace';
  ctx.fillStyle = 'rgba(150, 200, 230, 0.9)';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('SCORE', padding + 10, padding + 8);

  // Score value with glow
  ctx.font = 'bold 22px monospace';
  const scoreGlow = scoreFlashIntensity * 15;
  if (scoreGlow > 0) {
    ctx.shadowColor = 'rgba(150, 230, 255, 0.9)';
    ctx.shadowBlur = scoreGlow;
  }
  ctx.fillStyle = `rgba(${200 + scoreFlashIntensity * 55}, ${240 + scoreFlashIntensity * 15}, 255, 1)`;
  ctx.fillText(String(gameState.score).padStart(5, '0'), padding + 10, padding + 22);
  ctx.shadowBlur = 0;

  // Top-right: Snake length indicator
  const lengthPanelWidth = 80;
  const lengthPanelHeight = 50;
  const lengthX = width - padding - lengthPanelWidth;

  // Length panel background
  const lengthGradient = ctx.createLinearGradient(lengthX, padding, lengthX + lengthPanelWidth, padding + lengthPanelHeight);
  lengthGradient.addColorStop(0, 'rgba(60, 20, 100, 0.7)');
  lengthGradient.addColorStop(0.5, 'rgba(100, 40, 140, 0.5)');
  lengthGradient.addColorStop(1, 'rgba(60, 20, 100, 0.7)');

  ctx.fillStyle = lengthGradient;
  ctx.beginPath();
  ctx.roundRect(lengthX, padding, lengthPanelWidth, lengthPanelHeight, 8);
  ctx.fill();

  // Ice border
  ctx.strokeStyle = 'rgba(200, 150, 255, 0.6)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Length label with dragon icon
  ctx.font = 'bold 10px monospace';
  ctx.fillStyle = 'rgba(200, 170, 230, 0.9)';
  ctx.textAlign = 'left';
  ctx.fillText('LENGTH', lengthX + 10, padding + 8);

  // Snake length value
  ctx.font = 'bold 22px monospace';
  ctx.fillStyle = 'rgba(230, 200, 255, 1)';
  ctx.fillText(String(gameState.snake.length), lengthX + 10, padding + 22);

  // Draw small snake segments as visual indicator
  const maxVisualSegments = 10;
  const segmentSize = 4;
  const segmentSpacing = 6;
  const segmentsToShow = Math.min(gameState.snake.length, maxVisualSegments);
  for (let i = 0; i < segmentsToShow; i++) {
    const segX = lengthX + 50 + (i % 5) * segmentSpacing;
    const segY = padding + 24 + Math.floor(i / 5) * segmentSpacing;
    const segAlpha = 0.5 + (i / segmentsToShow) * 0.5;
    const segHue = 260 + (i / segmentsToShow) * 40;
    ctx.fillStyle = `hsla(${segHue}, 70%, 60%, ${segAlpha})`;
    ctx.beginPath();
    ctx.arc(segX, segY, segmentSize / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Bottom: Active power-up indicators
  const activePowerUps = gameState.activePowerUps || [];
  if (activePowerUps.length > 0) {
    const powerUpY = height - padding - 40;
    const powerUpSpacing = 70;
    const startX = width / 2 - ((activePowerUps.length - 1) * powerUpSpacing) / 2;

    for (let i = 0; i < activePowerUps.length; i++) {
      const powerUp = activePowerUps[i];
      const px = startX + i * powerUpSpacing;
      const colors = POWERUP_COLORS[powerUp.type];

      // Calculate remaining time (approximate based on tick count)
      const tickCount = gameState.tickCount || 0;
      const remainingTicks = Math.max(0, powerUp.endTime - tickCount);
      const remainingSeconds = Math.ceil(remainingTicks / 10);

      // Power-up panel with pulsing glow
      const puPulse = Math.sin(hudPulsePhase * 2 + i) * 0.2 + 0.8;

      // Outer glow
      ctx.fillStyle = colors.glow;
      ctx.globalAlpha = 0.3 * puPulse;
      ctx.beginPath();
      ctx.arc(px, powerUpY, 25, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Panel background
      const puGradient = ctx.createRadialGradient(px, powerUpY, 0, px, powerUpY, 22);
      puGradient.addColorStop(0, colors.main);
      puGradient.addColorStop(0.6, colors.glow);
      puGradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');

      ctx.fillStyle = puGradient;
      ctx.beginPath();
      ctx.arc(px, powerUpY, 18 * puPulse, 0, Math.PI * 2);
      ctx.fill();

      // Border ring
      ctx.strokeStyle = colors.main;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, powerUpY, 20, 0, Math.PI * 2);
      ctx.stroke();

      // Timer arc (shows remaining time as arc)
      const timerProgress = remainingTicks / 100;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(px, powerUpY, 23, -Math.PI / 2, -Math.PI / 2 + timerProgress * Math.PI * 2);
      ctx.stroke();

      // Power-up symbol
      ctx.font = 'bold 14px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(colors.symbol, px, powerUpY - 1);

      // Timer text
      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = remainingSeconds <= 3 ? '#ff6060' : '#ffffff';
      ctx.fillText(`${remainingSeconds}s`, px, powerUpY + 30);
    }
  }

  // Top center: Game status indicator (subtle)
  if (gameState.gameStarted && !gameState.gameOver) {
    const statusY = padding + 5;
    const statusPulse = Math.sin(hudPulsePhase * 0.5) * 0.3 + 0.7;

    // Subtle pulsing dot to show game is active
    ctx.fillStyle = `rgba(100, 255, 150, ${statusPulse * 0.8})`;
    ctx.beginPath();
    ctx.arc(width / 2, statusY + 5, 4, 0, Math.PI * 2);
    ctx.fill();

    // Outer glow
    ctx.fillStyle = `rgba(100, 255, 150, ${statusPulse * 0.3})`;
    ctx.beginPath();
    ctx.arc(width / 2, statusY + 5, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Corner ice crystal decorations
  drawHUDCornerCrystals(ctx, width, height, pulse);

  ctx.restore();
}

// Draw decorative ice crystals in HUD corners
function drawHUDCornerCrystals(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  pulse: number
): void {
  const crystalSize = 15;
  const offset = 6;

  // Helper to draw a small crystal cluster
  const drawCrystal = (x: number, y: number, angle: number, size: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Crystal body
    ctx.fillStyle = `rgba(150, 220, 255, ${0.4 * pulse})`;
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.lineTo(size * 0.3, 0);
    ctx.lineTo(0, size * 0.3);
    ctx.lineTo(-size * 0.3, 0);
    ctx.closePath();
    ctx.fill();

    // Crystal highlight
    ctx.fillStyle = `rgba(255, 255, 255, ${0.6 * pulse})`;
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.7);
    ctx.lineTo(size * 0.1, -size * 0.2);
    ctx.lineTo(-size * 0.1, -size * 0.2);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  };

  // Bottom-left crystal cluster
  drawCrystal(offset + 5, height - offset - 5, -0.3, crystalSize * 0.7);
  drawCrystal(offset + 15, height - offset - 10, 0.2, crystalSize * 0.5);

  // Bottom-right crystal cluster
  drawCrystal(width - offset - 5, height - offset - 5, 0.3, crystalSize * 0.7);
  drawCrystal(width - offset - 15, height - offset - 10, -0.2, crystalSize * 0.5);
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
    spawnIceShatter(headX, headY);
    spawnScreenCrack(headX, headY);
  }
  lastSnakeLength = gameState.snake.length;

  // Detect game over
  if (gameState.gameOver && !wasGameOver) {
    screenShakeIntensity = 20;
    spawnFreezeShatter(gameState.snake);
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
        spawnFrostParticle(segX, segY, intensity);
      }
    }
  }

  updateArmageddonEffects();
  updateCometTrail(gameState);
  updateEtherealParticles();
  updateGhostSnake(gameState);
  updateTailOrbs(gameState);

  ctx.save();
  ctx.scale(canvas.width / width, canvas.height / height);

  // Apply screen shake
  if (screenShakeIntensity > 0) {
    ctx.translate(screenShakeX, screenShakeY);
  }

  // Frozen arctic background
  ctx.fillStyle = COLORS.bgDark;
  ctx.fillRect(0, 0, width, height);

  // Aurora borealis gradient overlay
  const auroraGradient = ctx.createRadialGradient(width / 2, 0, 0, width / 2, height / 2, width);
  auroraGradient.addColorStop(0, 'rgba(0, 100, 150, 0.25)');
  auroraGradient.addColorStop(0.5, 'rgba(0, 60, 100, 0.15)');
  auroraGradient.addColorStop(1, 'rgba(5, 20, 40, 0.1)');
  ctx.fillStyle = auroraGradient;
  ctx.fillRect(0, 0, width, height);

  // Ice crystal veins in the ground
  ctx.strokeStyle = COLORS.lavaRed;
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = 0.25 + Math.sin(lavaPhase) * 0.08;
  for (let i = 0; i < 4; i++) {
    const startX = (i * width / 3) + Math.sin(lavaPhase + i) * 15;
    ctx.beginPath();
    ctx.moveTo(startX, height);
    let cx = startX, cy = height;
    for (let j = 0; j < 4; j++) {
      cx += (Math.random() - 0.5) * 30 + Math.sin(lavaPhase * 2 + j) * 8;
      cy -= 25 + Math.random() * 15;
      ctx.lineTo(cx, cy);
    }
    ctx.stroke();

    // Glow around ice veins
    ctx.strokeStyle = 'rgba(100, 200, 255, 0.15)';
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.08 + Math.sin(lavaPhase + i) * 0.04;
    ctx.stroke();
    ctx.strokeStyle = COLORS.lavaRed;
    ctx.lineWidth = 1.5;
  }
  ctx.globalAlpha = 1;

  // Draw snowflake particles
  ctx.fillStyle = 'rgba(200, 230, 255, 0.6)';
  for (const ash of ashParticles) {
    ctx.save();
    ctx.translate(ash.x, ash.y);
    ctx.rotate(ash.rotation);
    ctx.globalAlpha = ash.alpha * 0.8;
    // Draw small snowflake shape
    const s = ash.size * 0.5;
    ctx.fillRect(-s, -0.5, s * 2, 1);
    ctx.fillRect(-0.5, -s, 1, s * 2);
    ctx.restore();
  }
  ctx.globalAlpha = 1;

  // Draw falling ice shards with shimmer trails
  for (const m of meteors) {
    // Trail
    for (let i = 0; i < m.trail.length; i++) {
      const t = m.trail[i];
      const trailAlpha = (1 - i / m.trail.length) * 0.5;
      const trailSize = m.size * (1 - i / m.trail.length) * 0.7;

      ctx.fillStyle = 'rgba(100, 180, 220, 0.3)';
      ctx.globalAlpha = trailAlpha * 0.3;
      ctx.beginPath();
      ctx.arc(t.x, t.y, trailSize * 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = 'rgba(180, 230, 255, 0.5)';
      ctx.globalAlpha = trailAlpha * 0.5;
      ctx.beginPath();
      ctx.arc(t.x, t.y, trailSize, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ice shard core
    ctx.fillStyle = 'rgba(200, 240, 255, 0.9)';
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
    ctx.fill();

    // Bright center
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.size * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Draw ice fracture lines
  for (const crack of screenCracks) {
    ctx.strokeStyle = 'rgba(150, 220, 255, 0.7)';
    ctx.lineWidth = 2;
    ctx.globalAlpha = crack.life * 0.5;

    ctx.beginPath();
    ctx.moveTo(crack.segments[0].x, crack.segments[0].y);
    for (let i = 1; i < crack.segments.length; i++) {
      ctx.lineTo(crack.segments[i].x, crack.segments[i].y);
    }
    ctx.stroke();

    // Inner glow - icy white
    ctx.strokeStyle = 'rgba(220, 250, 255, 0.9)';
    ctx.lineWidth = 1;
    ctx.globalAlpha = crack.life * 0.7;
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Draw comet trail (glowing frost ribbon behind snake)
  drawCometTrail(ctx);

  // Draw ethereal particles (frost crystals drifting)
  drawEtherealParticles(ctx);

  // Draw ghost snake (spectral guide to food)
  drawGhostSnake(ctx, gameState);

  // Draw frost particles
  for (const p of flameParticles) {
    const lifeRatio = p.life / p.maxLife;

    const hue = p.hue;
    const saturation = 60;
    const lightness = 60 + lifeRatio * 25;

    // Outer frost glow
    ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness - 15}%, ${lifeRatio * 0.25})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Core frost crystal
    ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${lifeRatio * 0.5})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();

    // Bright ice center
    ctx.fillStyle = `rgba(255, 255, 255, ${lifeRatio * 0.7})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw ice shatter waves
  for (const exp of explosions) {
    // Frost shockwave ring
    ctx.strokeStyle = 'rgba(100, 200, 230, 0.6)';
    ctx.lineWidth = 3 * exp.life;
    ctx.globalAlpha = exp.life * 0.45;
    ctx.beginPath();
    ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2);
    ctx.stroke();

    // Inner crystalline ring
    ctx.strokeStyle = 'rgba(200, 240, 255, 0.8)';
    ctx.lineWidth = 1.5 * exp.life;
    ctx.globalAlpha = exp.life * 0.6;
    ctx.beginPath();
    ctx.arc(exp.x, exp.y, exp.radius * 0.7, 0, Math.PI * 2);
    ctx.stroke();

    // Ice shard particles
    for (const particle of exp.particles) {
      const px = exp.x + Math.cos(particle.angle) * particle.dist;
      const py = exp.y + Math.sin(particle.angle) * particle.dist;
      const pSize = particle.size * exp.life;

      ctx.fillStyle = `hsl(${particle.hue}, 50%, 70%)`;
      ctx.globalAlpha = exp.life * 0.7;
      ctx.beginPath();
      ctx.arc(px, py, pSize, 0, Math.PI * 2);
      ctx.fill();

      // Bright shard center
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.globalAlpha = exp.life * 0.5;
      ctx.beginPath();
      ctx.arc(px, py, pSize * 0.4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  // Draw food - frozen crystal gem
  const foodX = gameState.food.x * CELL_SIZE + CELL_SIZE / 2;
  const foodY = gameState.food.y * CELL_SIZE + CELL_SIZE / 2;

  // Crystalline rings around food
  for (let ring = 0; ring < 3; ring++) {
    const ringRadius = CELL_SIZE * 0.55 + ring * 4;
    const ringAlpha = 0.25 - ring * 0.06;

    ctx.strokeStyle = 'rgba(100, 200, 255, 0.6)';
    ctx.lineWidth = 2 - ring * 0.5;
    ctx.globalAlpha = ringAlpha + Math.sin(foodFirePhase + ring) * 0.08;

    ctx.beginPath();
    // Draw hexagonal crystal shape
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + foodFirePhase * 0.3;
      const shimmer = 1 + Math.sin(angle * 3 + foodFirePhase * 2) * 0.1;
      const rx = foodX + Math.cos(angle) * ringRadius * shimmer;
      const ry = foodY + Math.sin(angle) * ringRadius * shimmer;
      if (i === 0) ctx.moveTo(rx, ry);
      else ctx.lineTo(rx, ry);
    }
    ctx.closePath();
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Crystal gem glow
  const gemGlow = ctx.createRadialGradient(foodX, foodY, 0, foodX, foodY, CELL_SIZE);
  gemGlow.addColorStop(0, 'rgba(200, 250, 255, 0.85)');
  gemGlow.addColorStop(0.3, 'rgba(80, 180, 220, 0.6)');
  gemGlow.addColorStop(0.6, 'rgba(40, 120, 180, 0.3)');
  gemGlow.addColorStop(1, 'rgba(20, 60, 100, 0)');
  ctx.fillStyle = gemGlow;
  ctx.beginPath();
  ctx.arc(foodX, foodY, CELL_SIZE, 0, Math.PI * 2);
  ctx.fill();

  // Crystal gem faceted core
  ctx.fillStyle = COLORS.foodCore;
  ctx.beginPath();
  // Draw diamond shape
  ctx.moveTo(foodX, foodY - CELL_SIZE / 2.5);
  ctx.lineTo(foodX + CELL_SIZE / 3, foodY);
  ctx.lineTo(foodX, foodY + CELL_SIZE / 2.5);
  ctx.lineTo(foodX - CELL_SIZE / 3, foodY);
  ctx.closePath();
  ctx.fill();

  // Bright highlight
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = 0.95;
  ctx.beginPath();
  ctx.arc(foodX - 2, foodY - 3, CELL_SIZE / 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Draw tail orbs (behind the snake)
  drawTailOrbs(ctx, gameState);

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
      drawIceCrystals(ctx, centerX, centerY, dx, dy, perpX, perpY, frameCount);

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

  // Draw HUD overlay (score, length, power-ups)
  drawHUD(ctx, gameState, width, height);

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
