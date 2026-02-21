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

// Color palette - NEON SYNTHWAVE theme: retro 80s arcade, hot neon glow
const COLORS = {
  bgDark: '#0a0015',
  bgVolcanic: '#120020',
  gridLine: '#2a1040',
  gridAccent: '#4a2060',
  // Neon snake colors (hot pink to electric cyan gradient)
  snakeHead: '#ff0080',
  snakeBody: '#ff00ff',
  snakeTail: '#8000ff',
  snakeHighlight: '#ff80c0',
  snakeEye: '#00ffff',
  snakePupil: '#001020',
  snakeHorn: '#ff40ff',
  // Food - pulsing neon orb
  food: '#00ff88',
  foodCore: '#80ffcc',
  foodGlow: '#00ff44',
  gameOverOverlay: 'rgba(10, 0, 20, 0.92)',
  // Synthwave accent colors
  fireOrange: '#ff6600',
  fireRed: '#ff0066',
  fireYellow: '#ffff00',
  lavaRed: '#ff0044',
  ashGray: '#604080',
  smokeBlack: '#100818',
  brimstoneYellow: '#ffcc00',
  demonPurple: '#aa00ff',
  bloodRed: '#ff0040',
  emberOrange: '#ff8800',
  // Power-up colors
  powerUpSpeed: '#ffff00',
  powerUpSpeedGlow: '#ff8800',
  powerUpInvincibility: '#00ffff',
  powerUpInvincibilityGlow: '#0088ff',
  powerUpMultiplier: '#ff00ff',
  powerUpMultiplierGlow: '#aa00ff',
  powerUpMagnet: '#00ff88',
  powerUpMagnetGlow: '#00ff44',
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

// Draw human hair on head
function drawHumanHair(
  ctx: CanvasRenderingContext2D,
  headX: number,
  headY: number,
  dx: number,
  dy: number,
  perpX: number,
  perpY: number,
  frame: number
): void {
  const hairBaseX = headX - dx * 8;
  const hairBaseY = headY - dy * 8;

  const pulse = 0.8 + Math.sin(frame * 0.1) * 0.2;
  const windSway = Math.sin(frame * 0.08) * 0.15;

  // Hair strands - flowing behind the head
  const numStrands = 7;
  for (let i = 0; i < numStrands; i++) {
    const strandOffset = (i - (numStrands - 1) / 2) * 3;
    const strandX = hairBaseX + perpX * strandOffset;
    const strandY = hairBaseY + perpY * strandOffset;

    // Hair flows opposite to movement direction with wave
    const strandLength = 12 + Math.sin(frame * 0.12 + i) * 3;
    const wave = Math.sin(frame * 0.15 + i * 0.5) * 4;

    const endX = strandX - dx * strandLength + perpX * wave;
    const endY = strandY - dy * strandLength + perpY * wave;

    // Control point for bezier curve
    const ctrlX = strandX - dx * strandLength * 0.6 + perpX * wave * 0.5 + windSway * 5;
    const ctrlY = strandY - dy * strandLength * 0.6 + perpY * wave * 0.5;

    // Hair glow
    ctx.shadowColor = '#ffcc66';
    ctx.shadowBlur = 4 * pulse;

    // Hair strand gradient - blonde/golden with neon tint
    const hairHue = 40 + i * 5;
    ctx.strokeStyle = `hsl(${hairHue}, 80%, ${55 + i * 3}%)`;
    ctx.lineWidth = 2.5 - i * 0.15;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(strandX, strandY);
    ctx.quadraticCurveTo(ctrlX, ctrlY, endX, endY);
    ctx.stroke();
  }

  ctx.shadowBlur = 0;
}

// Draw human arm reaching from body segment
function drawHumanArm(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  perpX: number,
  perpY: number,
  side: number, // 1 for left, -1 for right
  frame: number,
  segmentIndex: number
): void {
  const armPhase = frame * 0.08 + segmentIndex * 0.5;
  const crawlMotion = Math.sin(armPhase) * 0.4;
  const armExtend = 0.6 + crawlMotion * 0.4;

  // Shoulder position
  const shoulderX = x + perpX * side * 6;
  const shoulderY = y + perpY * side * 6;

  // Elbow - bent arm
  const elbowAngle = armPhase + side * 0.3;
  const elbowDist = 8 * armExtend;
  const elbowX = shoulderX + perpX * side * elbowDist + Math.cos(elbowAngle) * 4;
  const elbowY = shoulderY + perpY * side * elbowDist + Math.sin(elbowAngle) * 4 - 2;

  // Hand position - reaching forward/down
  const handDist = 7 * armExtend;
  const handX = elbowX + perpX * side * handDist * 0.5 + Math.cos(elbowAngle + 0.5) * 5;
  const handY = elbowY + perpY * side * handDist * 0.5 + Math.sin(elbowAngle + 0.5) * 5;

  // Skin tone with neon glow
  const skinHue = 25;
  const skinLight = 70;

  // Arm glow
  ctx.shadowColor = '#ff9966';
  ctx.shadowBlur = 5;

  // Upper arm
  ctx.strokeStyle = `hsl(${skinHue}, 50%, ${skinLight}%)`;
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(shoulderX, shoulderY);
  ctx.lineTo(elbowX, elbowY);
  ctx.stroke();

  // Forearm
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(elbowX, elbowY);
  ctx.lineTo(handX, handY);
  ctx.stroke();

  // Hand - simple oval
  ctx.fillStyle = `hsl(${skinHue}, 50%, ${skinLight + 5}%)`;
  ctx.beginPath();
  ctx.ellipse(handX, handY, 3, 2.5, elbowAngle, 0, Math.PI * 2);
  ctx.fill();

  // Fingers - small lines
  for (let f = 0; f < 4; f++) {
    const fingerAngle = elbowAngle - 0.4 + f * 0.25;
    const fingerLen = 2.5;
    ctx.strokeStyle = `hsl(${skinHue}, 45%, ${skinLight + 3}%)`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(handX + Math.cos(fingerAngle - 0.3) * 2, handY + Math.sin(fingerAngle - 0.3) * 2);
    ctx.lineTo(
      handX + Math.cos(fingerAngle) * (2 + fingerLen),
      handY + Math.sin(fingerAngle) * (2 + fingerLen)
    );
    ctx.stroke();
  }

  ctx.shadowBlur = 0;
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

// Scoreboard state - High score tracking
interface HighScoreEntry {
  score: number;
  date: number;
  rank: number;
}

const MAX_HIGH_SCORES = 5;
let cachedHighScores: HighScoreEntry[] = [];
let highScoresLoaded = false;
let newHighScoreRank = -1;
let scoreboardAnimPhase = 0;
let scoreboardRevealProgress = 0;
let lastGameOverState = false;

function loadHighScores(): HighScoreEntry[] {
  if (highScoresLoaded && cachedHighScores.length > 0) {
    return cachedHighScores;
  }
  try {
    const stored = localStorage.getItem('snake_high_scores');
    if (stored) {
      const parsed = JSON.parse(stored) as HighScoreEntry[];
      cachedHighScores = parsed.slice(0, MAX_HIGH_SCORES);
      highScoresLoaded = true;
      return cachedHighScores;
    }
  } catch {
    // localStorage not available or corrupted
  }
  cachedHighScores = [];
  highScoresLoaded = true;
  return cachedHighScores;
}

function saveHighScore(score: number): number {
  const highScores = loadHighScores();
  const newEntry: HighScoreEntry = {
    score,
    date: Date.now(),
    rank: 0
  };

  // Find position for new score
  let insertIndex = highScores.findIndex(entry => score > entry.score);
  if (insertIndex === -1) {
    insertIndex = highScores.length;
  }

  // Only add if it's a high score
  if (insertIndex < MAX_HIGH_SCORES && score > 0) {
    highScores.splice(insertIndex, 0, newEntry);
    // Update ranks
    highScores.forEach((entry, i) => { entry.rank = i + 1; });
    // Keep only top scores
    cachedHighScores = highScores.slice(0, MAX_HIGH_SCORES);

    try {
      localStorage.setItem('snake_high_scores', JSON.stringify(cachedHighScores));
    } catch {
      // localStorage not available
    }

    return insertIndex + 1; // Return rank (1-based)
  }

  return -1; // Not a high score
}

function checkAndSaveHighScore(gameState: GameState): void {
  // Detect transition to game over
  if (gameState.gameOver && !lastGameOverState) {
    const rank = saveHighScore(gameState.score);
    if (rank > 0) {
      newHighScoreRank = rank;
    } else {
      newHighScoreRank = -1;
    }
    scoreboardRevealProgress = 0;
  }
  lastGameOverState = gameState.gameOver;

  // Reset when game starts
  if (gameState.gameStarted && !gameState.gameOver) {
    newHighScoreRank = -1;
  }
}

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

  // Top-left: Score display with neon synthwave effect
  ctx.save();

  // Score panel background - dark with neon border
  const scorePanelWidth = 120;
  const scorePanelHeight = 50;
  const scoreGradient = ctx.createLinearGradient(padding, padding, padding + scorePanelWidth, padding + scorePanelHeight);
  scoreGradient.addColorStop(0, 'rgba(20, 0, 40, 0.85)');
  scoreGradient.addColorStop(0.5, 'rgba(40, 0, 60, 0.75)');
  scoreGradient.addColorStop(1, 'rgba(20, 0, 40, 0.85)');

  // Panel with rounded corners
  ctx.fillStyle = scoreGradient;
  ctx.beginPath();
  ctx.roundRect(padding, padding, scorePanelWidth, scorePanelHeight, 8);
  ctx.fill();

  // Neon magenta border
  ctx.strokeStyle = `rgba(255, 0, 128, ${0.7 + scoreFlashIntensity * 0.3})`;
  ctx.lineWidth = 2;
  ctx.shadowColor = '#ff0080';
  ctx.shadowBlur = 8 + scoreFlashIntensity * 10;
  ctx.stroke();

  // Inner glow when score flashes
  if (scoreFlashIntensity > 0.1) {
    ctx.strokeStyle = `rgba(255, 255, 255, ${scoreFlashIntensity * 0.6})`;
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  ctx.shadowBlur = 0;

  // Score label - cyan
  ctx.font = 'bold 10px monospace';
  ctx.fillStyle = '#00ffff';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('SCORE', padding + 10, padding + 8);

  // Score value with neon glow
  ctx.font = 'bold 22px monospace';
  ctx.shadowColor = '#00ff88';
  ctx.shadowBlur = 8 + scoreFlashIntensity * 12;
  ctx.fillStyle = `rgb(${Math.round(200 + scoreFlashIntensity * 55)}, 255, ${Math.round(136 + scoreFlashIntensity * 119)})`;
  ctx.fillText(String(gameState.score).padStart(5, '0'), padding + 10, padding + 22);
  ctx.shadowBlur = 0;

  // Top-right: Snake length indicator
  const lengthPanelWidth = 80;
  const lengthPanelHeight = 50;
  const lengthX = width - padding - lengthPanelWidth;

  // Length panel background
  const lengthGradient = ctx.createLinearGradient(lengthX, padding, lengthX + lengthPanelWidth, padding + lengthPanelHeight);
  lengthGradient.addColorStop(0, 'rgba(40, 0, 60, 0.85)');
  lengthGradient.addColorStop(0.5, 'rgba(60, 0, 80, 0.75)');
  lengthGradient.addColorStop(1, 'rgba(40, 0, 60, 0.85)');

  ctx.fillStyle = lengthGradient;
  ctx.beginPath();
  ctx.roundRect(lengthX, padding, lengthPanelWidth, lengthPanelHeight, 8);
  ctx.fill();

  // Cyan neon border
  ctx.strokeStyle = 'rgba(0, 255, 255, 0.7)';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#00ffff';
  ctx.shadowBlur = 8;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Length label - magenta
  ctx.font = 'bold 10px monospace';
  ctx.fillStyle = '#ff00ff';
  ctx.textAlign = 'left';
  ctx.fillText('LENGTH', lengthX + 10, padding + 8);

  // Snake length value - yellow neon
  ctx.font = 'bold 22px monospace';
  ctx.shadowColor = '#ffff00';
  ctx.shadowBlur = 6;
  ctx.fillStyle = '#ffff00';
  ctx.fillText(String(gameState.snake.length), lengthX + 10, padding + 22);
  ctx.shadowBlur = 0;

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

// Draw decorative neon corner accents
function drawHUDCornerCrystals(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  pulse: number
): void {
  const cornerSize = 20;
  const offset = 4;

  // Helper to draw neon corner bracket
  const drawNeonCorner = (x: number, y: number, flipX: boolean, flipY: boolean, hue: number) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(flipX ? -1 : 1, flipY ? -1 : 1);

    // Outer glow
    ctx.strokeStyle = `hsla(${hue}, 100%, 60%, ${0.5 * pulse})`;
    ctx.lineWidth = 3;
    ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
    ctx.shadowBlur = 8 * pulse;
    ctx.lineCap = 'round';

    ctx.beginPath();
    ctx.moveTo(0, cornerSize);
    ctx.lineTo(0, 0);
    ctx.lineTo(cornerSize, 0);
    ctx.stroke();

    // Inner bright line
    ctx.strokeStyle = `hsla(${hue}, 100%, 80%, ${0.8 * pulse})`;
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.restore();
  };

  // Bottom-left corner - magenta
  drawNeonCorner(offset, height - offset, false, true, 320);

  // Bottom-right corner - cyan
  drawNeonCorner(width - offset, height - offset, true, true, 180);

  // Top corners subtle
  ctx.globalAlpha = 0.3;
  drawNeonCorner(offset, offset, false, false, 60);
  drawNeonCorner(width - offset, offset, true, false, 280);
  ctx.globalAlpha = 1;
}

// Draw the dramatic scoreboard overlay
function drawScoreboard(
  ctx: CanvasRenderingContext2D,
  gameState: GameState,
  width: number,
  height: number
): void {
  if (!gameState.gameOver) return;

  scoreboardAnimPhase += 0.06;
  scoreboardRevealProgress = Math.min(1, scoreboardRevealProgress + 0.02);

  const highScores = loadHighScores();
  const centerX = width / 2;
  const baseY = height * 0.22;

  // Scoreboard panel dimensions
  const panelWidth = 200;
  const panelHeight = 180;
  const panelX = centerX - panelWidth / 2;
  const panelY = baseY;

  // Slide-in animation
  const slideOffset = (1 - scoreboardRevealProgress) * 50;
  const alphaMultiplier = scoreboardRevealProgress;

  ctx.save();
  ctx.translate(0, -slideOffset);
  ctx.globalAlpha = alphaMultiplier;

  // Panel background - deep purple gradient with glow
  const panelGradient = ctx.createLinearGradient(
    panelX, panelY,
    panelX + panelWidth, panelY + panelHeight
  );
  panelGradient.addColorStop(0, 'rgba(30, 0, 60, 0.95)');
  panelGradient.addColorStop(0.5, 'rgba(50, 0, 80, 0.92)');
  panelGradient.addColorStop(1, 'rgba(30, 0, 60, 0.95)');

  // Outer glow for panel
  ctx.shadowColor = newHighScoreRank > 0 ? '#ffff00' : '#ff00ff';
  ctx.shadowBlur = 20 + Math.sin(scoreboardAnimPhase) * 5;

  ctx.fillStyle = panelGradient;
  ctx.beginPath();
  ctx.roundRect(panelX, panelY, panelWidth, panelHeight, 12);
  ctx.fill();

  // Animated border - cycling neon colors
  const borderHue = newHighScoreRank > 0
    ? (45 + Math.sin(scoreboardAnimPhase * 2) * 15) // Golden pulsing for new high score
    : (280 + Math.sin(scoreboardAnimPhase) * 40);   // Purple to magenta cycle

  ctx.strokeStyle = `hsl(${borderHue}, 100%, 60%)`;
  ctx.lineWidth = 3;
  ctx.shadowColor = `hsl(${borderHue}, 100%, 60%)`;
  ctx.shadowBlur = 12;
  ctx.stroke();

  // Inner border
  ctx.strokeStyle = `hsla(${borderHue}, 100%, 80%, 0.5)`;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Title: "HIGH SCORES" with dramatic glow
  const titleY = panelY + 25;
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Title glow
  ctx.shadowColor = '#00ffff';
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#00ffff';
  ctx.fillText('HIGH SCORES', centerX, titleY);

  // Title underline
  ctx.strokeStyle = 'rgba(0, 255, 255, 0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(panelX + 30, titleY + 12);
  ctx.lineTo(panelX + panelWidth - 30, titleY + 12);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Score entries
  const entryStartY = titleY + 30;
  const entryHeight = 24;

  if (highScores.length === 0) {
    // No scores yet message
    ctx.font = '10px monospace';
    ctx.fillStyle = 'rgba(150, 150, 200, 0.8)';
    ctx.fillText('No scores yet', centerX, entryStartY + 40);
    ctx.fillText('Be the first!', centerX, entryStartY + 55);
  } else {
    for (let i = 0; i < Math.min(highScores.length, 5); i++) {
      const entry = highScores[i];
      const entryY = entryStartY + i * entryHeight;
      const isNewScore = newHighScoreRank === i + 1;

      // Staggered reveal animation
      const entryDelay = i * 0.15;
      const entryProgress = Math.max(0, Math.min(1, (scoreboardRevealProgress - entryDelay) * 2));
      if (entryProgress <= 0) continue;

      ctx.globalAlpha = alphaMultiplier * entryProgress;

      // Row highlight for new high score
      if (isNewScore) {
        const flashIntensity = 0.3 + Math.sin(scoreboardAnimPhase * 3) * 0.2;
        ctx.fillStyle = `rgba(255, 255, 0, ${flashIntensity})`;
        ctx.beginPath();
        ctx.roundRect(panelX + 10, entryY - 8, panelWidth - 20, entryHeight - 2, 4);
        ctx.fill();
      }

      // Rank number with medal colors
      const rankColors = ['#ffd700', '#c0c0c0', '#cd7f32', '#ff00ff', '#00ffff'];
      const rankColor = rankColors[i] || '#888888';

      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'left';
      ctx.shadowColor = rankColor;
      ctx.shadowBlur = isNewScore ? 8 : 4;
      ctx.fillStyle = rankColor;
      ctx.fillText(`${i + 1}.`, panelX + 20, entryY);
      ctx.shadowBlur = 0;

      // Score value
      ctx.font = isNewScore ? 'bold 13px monospace' : '12px monospace';
      ctx.textAlign = 'right';
      ctx.fillStyle = isNewScore ? '#ffffff' : '#ddddff';

      if (isNewScore) {
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 6;
      }
      ctx.fillText(String(entry.score).padStart(5, '0'), panelX + panelWidth - 20, entryY);
      ctx.shadowBlur = 0;

      // "NEW!" badge for new high score
      if (isNewScore) {
        const badgePulse = 0.8 + Math.sin(scoreboardAnimPhase * 4) * 0.2;
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = `rgba(255, 255, 0, ${badgePulse})`;
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur = 6;
        ctx.fillText('NEW!', panelX + 65, entryY);
        ctx.shadowBlur = 0;
      }
    }
  }

  ctx.globalAlpha = alphaMultiplier;

  // Current score display at bottom
  const currentScoreY = panelY + panelHeight - 20;
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(200, 200, 255, 0.8)';
  ctx.fillText('YOUR SCORE', centerX, currentScoreY - 12);

  // Big current score with glow
  ctx.font = 'bold 16px monospace';
  ctx.shadowColor = newHighScoreRank > 0 ? '#ffff00' : '#00ff88';
  ctx.shadowBlur = 10;
  ctx.fillStyle = newHighScoreRank > 0 ? '#ffff00' : '#00ff88';
  ctx.fillText(String(gameState.score).padStart(5, '0'), centerX, currentScoreY + 2);
  ctx.shadowBlur = 0;

  // Decorative corner triangles
  const cornerSize = 8;
  ctx.fillStyle = `hsla(${borderHue}, 100%, 60%, 0.6)`;

  // Top-left
  ctx.beginPath();
  ctx.moveTo(panelX, panelY);
  ctx.lineTo(panelX + cornerSize, panelY);
  ctx.lineTo(panelX, panelY + cornerSize);
  ctx.closePath();
  ctx.fill();

  // Top-right
  ctx.beginPath();
  ctx.moveTo(panelX + panelWidth, panelY);
  ctx.lineTo(panelX + panelWidth - cornerSize, panelY);
  ctx.lineTo(panelX + panelWidth, panelY + cornerSize);
  ctx.closePath();
  ctx.fill();

  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(panelX, panelY + panelHeight);
  ctx.lineTo(panelX + cornerSize, panelY + panelHeight);
  ctx.lineTo(panelX, panelY + panelHeight - cornerSize);
  ctx.closePath();
  ctx.fill();

  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(panelX + panelWidth, panelY + panelHeight);
  ctx.lineTo(panelX + panelWidth - cornerSize, panelY + panelHeight);
  ctx.lineTo(panelX + panelWidth, panelY + panelHeight - cornerSize);
  ctx.closePath();
  ctx.fill();

  // Sparkle particles for new high score
  if (newHighScoreRank > 0) {
    const numSparkles = 8;
    for (let s = 0; s < numSparkles; s++) {
      const sparkleAngle = (s / numSparkles) * Math.PI * 2 + scoreboardAnimPhase;
      const sparkleRadius = 100 + Math.sin(scoreboardAnimPhase * 2 + s) * 15;
      const sparkleX = centerX + Math.cos(sparkleAngle) * sparkleRadius;
      const sparkleY = panelY + panelHeight / 2 + Math.sin(sparkleAngle) * sparkleRadius * 0.5;
      const sparkleSize = 2 + Math.sin(scoreboardAnimPhase * 3 + s * 2) * 1;
      const sparkleAlpha = 0.5 + Math.sin(scoreboardAnimPhase * 4 + s) * 0.3;

      ctx.fillStyle = `rgba(255, 255, 100, ${sparkleAlpha})`;
      ctx.beginPath();
      ctx.arc(sparkleX, sparkleY, sparkleSize, 0, Math.PI * 2);
      ctx.fill();

      // Star shape
      ctx.strokeStyle = `rgba(255, 200, 0, ${sparkleAlpha * 0.5})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sparkleX - 4, sparkleY);
      ctx.lineTo(sparkleX + 4, sparkleY);
      ctx.moveTo(sparkleX, sparkleY - 4);
      ctx.lineTo(sparkleX, sparkleY + 4);
      ctx.stroke();
    }
  }

  ctx.restore();
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

  // Synthwave sunset gradient background
  const sunsetGradient = ctx.createLinearGradient(0, 0, 0, height);
  sunsetGradient.addColorStop(0, '#0a0015');
  sunsetGradient.addColorStop(0.3, '#1a0030');
  sunsetGradient.addColorStop(0.5, '#2a0050');
  sunsetGradient.addColorStop(0.7, '#400060');
  sunsetGradient.addColorStop(0.85, '#600040');
  sunsetGradient.addColorStop(1, '#200020');
  ctx.fillStyle = sunsetGradient;
  ctx.fillRect(0, 0, width, height);

  // Synthwave sun at horizon
  const sunY = height * 0.75;
  const sunRadius = 60;
  const sunPulse = 0.9 + Math.sin(lavaPhase * 0.5) * 0.1;

  // Sun outer glow
  const sunGlow = ctx.createRadialGradient(width / 2, sunY, 0, width / 2, sunY, sunRadius * 2);
  sunGlow.addColorStop(0, 'rgba(255, 100, 0, 0.4)');
  sunGlow.addColorStop(0.5, 'rgba(255, 0, 100, 0.2)');
  sunGlow.addColorStop(1, 'rgba(150, 0, 150, 0)');
  ctx.fillStyle = sunGlow;
  ctx.beginPath();
  ctx.arc(width / 2, sunY, sunRadius * 2 * sunPulse, 0, Math.PI * 2);
  ctx.fill();

  // Sun body with horizontal scan lines
  ctx.save();
  ctx.beginPath();
  ctx.arc(width / 2, sunY, sunRadius * sunPulse, 0, Math.PI * 2);
  ctx.clip();

  const sunBodyGrad = ctx.createLinearGradient(0, sunY - sunRadius, 0, sunY + sunRadius);
  sunBodyGrad.addColorStop(0, '#ffff00');
  sunBodyGrad.addColorStop(0.3, '#ff8800');
  sunBodyGrad.addColorStop(0.6, '#ff0066');
  sunBodyGrad.addColorStop(1, '#aa0066');
  ctx.fillStyle = sunBodyGrad;
  ctx.fillRect(width / 2 - sunRadius, sunY - sunRadius, sunRadius * 2, sunRadius * 2);

  // Sun scan lines
  ctx.fillStyle = 'rgba(10, 0, 20, 0.4)';
  for (let line = 0; line < 8; line++) {
    const lineY = sunY - sunRadius + line * (sunRadius * 2 / 8) + 5;
    const lineHeight = 3 + line * 0.5;
    ctx.fillRect(width / 2 - sunRadius, lineY, sunRadius * 2, lineHeight);
  }
  ctx.restore();

  // Neon perspective grid
  ctx.strokeStyle = '#ff00ff';
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.4;

  // Horizontal grid lines (perspective)
  const horizonY = height * 0.65;
  for (let i = 0; i < 15; i++) {
    const t = i / 14;
    const y = horizonY + (height - horizonY) * Math.pow(t, 1.5);
    const alpha = 0.2 + t * 0.4;
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = i % 3 === 0 ? '#ff00ff' : '#8800aa';
    ctx.lineWidth = i % 3 === 0 ? 1.5 : 0.8;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // Vertical grid lines (perspective convergence)
  const vanishX = width / 2;
  ctx.globalAlpha = 0.35;
  for (let i = -8; i <= 8; i++) {
    const bottomX = vanishX + i * 30;
    ctx.strokeStyle = Math.abs(i) % 2 === 0 ? '#00ffff' : '#0088aa';
    ctx.lineWidth = Math.abs(i) % 2 === 0 ? 1.2 : 0.6;
    ctx.beginPath();
    ctx.moveTo(vanishX, horizonY);
    ctx.lineTo(bottomX, height);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Draw neon floating particles (stars/pixels)
  for (const ash of ashParticles) {
    ctx.save();
    ctx.translate(ash.x, ash.y);
    ctx.rotate(ash.rotation);
    ctx.globalAlpha = ash.alpha * 0.9;

    // Random neon colors for each particle
    const hue = (ash.x * 0.5 + ash.y * 0.3 + frameCount * 0.5) % 360;
    ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
    ctx.shadowBlur = 6;
    ctx.fillStyle = `hsl(${hue}, 100%, 70%)`;

    // Draw small diamond shape
    const s = ash.size * 0.6;
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(s * 0.6, 0);
    ctx.lineTo(0, s);
    ctx.lineTo(-s * 0.6, 0);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.restore();
  }
  ctx.globalAlpha = 1;

  // Draw neon shooting stars with rainbow trails
  for (const m of meteors) {
    // Trail with gradient colors
    for (let i = 0; i < m.trail.length; i++) {
      const t = m.trail[i];
      const trailAlpha = (1 - i / m.trail.length) * 0.7;
      const trailSize = m.size * (1 - i / m.trail.length) * 0.8;
      const trailHue = (frameCount * 2 + i * 20) % 360;

      ctx.fillStyle = `hsla(${trailHue}, 100%, 50%, ${trailAlpha * 0.4})`;
      ctx.beginPath();
      ctx.arc(t.x, t.y, trailSize * 1.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `hsla(${trailHue}, 100%, 70%, ${trailAlpha * 0.7})`;
      ctx.beginPath();
      ctx.arc(t.x, t.y, trailSize, 0, Math.PI * 2);
      ctx.fill();
    }

    // Shooting star core with glow
    const starHue = (frameCount * 3 + m.x) % 360;
    ctx.shadowColor = `hsl(${starHue}, 100%, 60%)`;
    ctx.shadowBlur = 10;
    ctx.fillStyle = `hsl(${starHue}, 100%, 80%)`;
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
    ctx.fill();

    // White hot center
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(m.x, m.y, m.size * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }
  ctx.globalAlpha = 1;

  // Draw electric lightning fractures
  for (const crack of screenCracks) {
    // Outer glow - hot pink
    ctx.strokeStyle = 'rgba(255, 0, 128, 0.8)';
    ctx.lineWidth = 4;
    ctx.globalAlpha = crack.life * 0.4;
    ctx.shadowColor = '#ff0080';
    ctx.shadowBlur = 10;

    ctx.beginPath();
    ctx.moveTo(crack.segments[0].x, crack.segments[0].y);
    for (let i = 1; i < crack.segments.length; i++) {
      ctx.lineTo(crack.segments[i].x, crack.segments[i].y);
    }
    ctx.stroke();

    // Inner core - bright cyan
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.95)';
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = crack.life * 0.9;
    ctx.stroke();

    ctx.shadowBlur = 0;
  }
  ctx.globalAlpha = 1;

  // Draw comet trail (glowing frost ribbon behind snake)
  drawCometTrail(ctx);

  // Draw ethereal particles (frost crystals drifting)
  drawEtherealParticles(ctx);

  // Draw ghost snake (spectral guide to food)
  drawGhostSnake(ctx, gameState);

  // Draw neon trail particles
  for (const p of flameParticles) {
    const lifeRatio = p.life / p.maxLife;

    // Cycling neon hue based on particle position
    const hue = (p.hue + frameCount * 2) % 360;
    const saturation = 100;
    const lightness = 55 + lifeRatio * 20;

    // Outer neon glow
    ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
    ctx.shadowBlur = 8 * lifeRatio;
    ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness - 20}%, ${lifeRatio * 0.4})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
    ctx.fill();

    // Core neon particle
    ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, ${lifeRatio * 0.7})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();

    // White hot center
    ctx.fillStyle = `rgba(255, 255, 255, ${lifeRatio * 0.9})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
  }

  // Draw neon shockwave bursts
  for (const exp of explosions) {
    // Outer neon ring - magenta
    ctx.strokeStyle = 'rgba(255, 0, 255, 0.8)';
    ctx.lineWidth = 4 * exp.life;
    ctx.globalAlpha = exp.life * 0.6;
    ctx.shadowColor = '#ff00ff';
    ctx.shadowBlur = 15 * exp.life;
    ctx.beginPath();
    ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2);
    ctx.stroke();

    // Inner ring - cyan
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.9)';
    ctx.lineWidth = 2 * exp.life;
    ctx.globalAlpha = exp.life * 0.7;
    ctx.shadowColor = '#00ffff';
    ctx.beginPath();
    ctx.arc(exp.x, exp.y, exp.radius * 0.6, 0, Math.PI * 2);
    ctx.stroke();

    ctx.shadowBlur = 0;

    // Neon particle burst
    for (const particle of exp.particles) {
      const px = exp.x + Math.cos(particle.angle) * particle.dist;
      const py = exp.y + Math.sin(particle.angle) * particle.dist;
      const pSize = particle.size * exp.life;
      const particleHue = (particle.hue + frameCount * 3) % 360;

      // Particle glow
      ctx.fillStyle = `hsla(${particleHue}, 100%, 50%, ${exp.life * 0.5})`;
      ctx.beginPath();
      ctx.arc(px, py, pSize * 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Particle core
      ctx.fillStyle = `hsla(${particleHue}, 100%, 70%, ${exp.life * 0.8})`;
      ctx.globalAlpha = exp.life * 0.9;
      ctx.beginPath();
      ctx.arc(px, py, pSize, 0, Math.PI * 2);
      ctx.fill();

      // Hot center
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = exp.life * 0.7;
      ctx.beginPath();
      ctx.arc(px, py, pSize * 0.35, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  // Draw food - pulsing neon power orb
  const foodX = gameState.food.x * CELL_SIZE + CELL_SIZE / 2;
  const foodY = gameState.food.y * CELL_SIZE + CELL_SIZE / 2;

  // Pulsing animation
  const foodPulse = 0.8 + Math.sin(foodFirePhase * 1.5) * 0.2;
  const foodHue = (frameCount * 2) % 360;

  // Rotating neon rings around food
  for (let ring = 0; ring < 3; ring++) {
    const ringRadius = (CELL_SIZE * 0.6 + ring * 5) * foodPulse;
    const ringRotation = foodFirePhase * (ring % 2 === 0 ? 1 : -1) * 0.8;

    ctx.strokeStyle = ring === 0 ? '#00ff88' : ring === 1 ? '#00ffcc' : '#00ffff';
    ctx.lineWidth = 2.5 - ring * 0.5;
    ctx.globalAlpha = (0.8 - ring * 0.2) * foodPulse;

    ctx.beginPath();
    ctx.arc(foodX, foodY, ringRadius, ringRotation, ringRotation + Math.PI * 1.2);
    ctx.stroke();

    // Second arc opposite side
    ctx.beginPath();
    ctx.arc(foodX, foodY, ringRadius, ringRotation + Math.PI, ringRotation + Math.PI * 2.2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Outer neon glow
  ctx.shadowColor = '#00ff88';
  ctx.shadowBlur = 20 * foodPulse;
  const gemGlow = ctx.createRadialGradient(foodX, foodY, 0, foodX, foodY, CELL_SIZE * 1.2);
  gemGlow.addColorStop(0, 'rgba(0, 255, 136, 0.9)');
  gemGlow.addColorStop(0.3, 'rgba(0, 255, 200, 0.6)');
  gemGlow.addColorStop(0.6, 'rgba(0, 200, 255, 0.3)');
  gemGlow.addColorStop(1, 'rgba(0, 100, 150, 0)');
  ctx.fillStyle = gemGlow;
  ctx.beginPath();
  ctx.arc(foodX, foodY, CELL_SIZE * foodPulse, 0, Math.PI * 2);
  ctx.fill();

  // Inner core - bright neon green
  ctx.fillStyle = '#00ff88';
  ctx.beginPath();
  ctx.arc(foodX, foodY, CELL_SIZE * 0.35 * foodPulse, 0, Math.PI * 2);
  ctx.fill();

  // Hot white center
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(foodX, foodY, CELL_SIZE * 0.15 * foodPulse, 0, Math.PI * 2);
  ctx.fill();

  // Sparkle effect
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = 0.8 * foodPulse;
  const sparkleAngle = foodFirePhase * 2;
  for (let i = 0; i < 4; i++) {
    const angle = sparkleAngle + (i * Math.PI / 2);
    const dist = CELL_SIZE * 0.45 * foodPulse;
    const sx = foodX + Math.cos(angle) * dist;
    const sy = foodY + Math.sin(angle) * dist;
    ctx.beginPath();
    ctx.arc(sx, sy, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;

  // Draw tail orbs (behind the snake)
  drawTailOrbs(ctx, gameState);

  // Draw human snake - a crawling humanoid figure
  const snake = gameState.snake;
  const snakeLen = snake.length;

  // First pass: Draw arms (behind body)
  for (let i = snakeLen - 1; i >= 1; i--) {
    const segment = snake[i];
    const prevSegment = snake[i - 1];
    const centerX = segment.x * CELL_SIZE + CELL_SIZE / 2;
    const centerY = segment.y * CELL_SIZE + CELL_SIZE / 2;

    // Calculate direction
    let dx = prevSegment.x - segment.x;
    let dy = prevSegment.y - segment.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 0) { dx /= len; dy /= len; }
    const perpX = -dy;
    const perpY = dx;

    // Draw arms on every other segment (alternating sides create crawling motion)
    if (i % 2 === 0) {
      drawHumanArm(ctx, centerX, centerY, perpX, perpY, 1, frameCount, i);
    } else {
      drawHumanArm(ctx, centerX, centerY, perpX, perpY, -1, frameCount, i);
    }
  }

  // Second pass: Draw body segments (back to front)
  for (let i = snakeLen - 1; i >= 0; i--) {
    const segment = snake[i];
    const centerX = segment.x * CELL_SIZE + CELL_SIZE / 2;
    const centerY = segment.y * CELL_SIZE + CELL_SIZE / 2;

    const t = snakeLen > 1 ? i / (snakeLen - 1) : 1;

    // Calculate direction for this segment
    let dx = 1, dy = 0;
    if (i === 0 && snake[1]) {
      dx = segment.x - snake[1].x;
      dy = segment.y - snake[1].y;
    } else if (i > 0) {
      dx = snake[i - 1].x - segment.x;
      dy = snake[i - 1].y - segment.y;
    }
    const dirLen = Math.sqrt(dx * dx + dy * dy);
    if (dirLen > 0) { dx /= dirLen; dy /= dirLen; }
    const perpX = -dy;
    const perpY = dx;

    // Skin tone with slight variation
    const skinHue = 25;
    const skinSat = 45;
    const skinLight = 68 - t * 8;

    if (i === 0) {
      // HUMAN HEAD
      const headRadius = CELL_SIZE / 2 + 2;

      // Head glow (warm skin tone)
      ctx.shadowColor = '#ffaa77';
      ctx.shadowBlur = 10;

      // Head shape - slightly oval
      const headGradient = ctx.createRadialGradient(
        centerX - 2, centerY - 2, 0,
        centerX, centerY, headRadius + 3
      );
      headGradient.addColorStop(0, `hsl(${skinHue}, ${skinSat + 10}%, ${skinLight + 15}%)`);
      headGradient.addColorStop(0.5, `hsl(${skinHue}, ${skinSat}%, ${skinLight + 5}%)`);
      headGradient.addColorStop(1, `hsl(${skinHue}, ${skinSat - 5}%, ${skinLight - 10}%)`);
      ctx.fillStyle = headGradient;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, headRadius + 1, headRadius, Math.atan2(dy, dx), 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Face features
      const eyeOffset = 4;
      const eyeForward = 3;
      const leftEyeX = centerX + perpX * eyeOffset + dx * eyeForward;
      const leftEyeY = centerY + perpY * eyeOffset + dy * eyeForward;
      const rightEyeX = centerX - perpX * eyeOffset + dx * eyeForward;
      const rightEyeY = centerY - perpY * eyeOffset + dy * eyeForward;

      // Eye whites
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(leftEyeX, leftEyeY, 3.5, 2.5, Math.atan2(dy, dx), 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(rightEyeX, rightEyeY, 3.5, 2.5, Math.atan2(dy, dx), 0, Math.PI * 2);
      ctx.fill();

      // Irises - blue/green with glow
      const irisColor = `hsl(${200 + Math.sin(frameCount * 0.05) * 20}, 70%, 45%)`;
      ctx.fillStyle = irisColor;
      ctx.shadowColor = irisColor;
      ctx.shadowBlur = 4;
      ctx.beginPath();
      ctx.arc(leftEyeX + dx * 0.8, leftEyeY + dy * 0.8, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(rightEyeX + dx * 0.8, rightEyeY + dy * 0.8, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Pupils
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(leftEyeX + dx * 1, leftEyeY + dy * 1, 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(rightEyeX + dx * 1, rightEyeY + dy * 1, 1, 0, Math.PI * 2);
      ctx.fill();

      // Eye glints
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(leftEyeX + dx * 0.3 - 0.5, leftEyeY + dy * 0.3 - 0.5, 0.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(rightEyeX + dx * 0.3 - 0.5, rightEyeY + dy * 0.3 - 0.5, 0.8, 0, Math.PI * 2);
      ctx.fill();

      // Eyebrows (determined expression)
      ctx.strokeStyle = `hsl(30, 40%, 35%)`;
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      const browOffset = -3;
      ctx.beginPath();
      ctx.moveTo(leftEyeX + perpX * 3 + dy * browOffset, leftEyeY + perpY * 3 + (-dx) * browOffset);
      ctx.lineTo(leftEyeX - perpX * 2 + dy * browOffset, leftEyeY - perpY * 2 + (-dx) * browOffset - 1);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(rightEyeX - perpX * 3 + dy * browOffset, rightEyeY - perpY * 3 + (-dx) * browOffset);
      ctx.lineTo(rightEyeX + perpX * 2 + dy * browOffset, rightEyeY + perpY * 2 + (-dx) * browOffset - 1);
      ctx.stroke();

      // Nose (simple)
      const noseX = centerX + dx * 5;
      const noseY = centerY + dy * 5;
      ctx.fillStyle = `hsl(${skinHue}, ${skinSat - 5}%, ${skinLight - 5}%)`;
      ctx.beginPath();
      ctx.ellipse(noseX, noseY, 1.5, 1, Math.atan2(dy, dx), 0, Math.PI * 2);
      ctx.fill();

      // Mouth (slight smile or neutral)
      const mouthX = centerX + dx * 7;
      const mouthY = centerY + dy * 7;
      ctx.strokeStyle = `hsl(0, 50%, 45%)`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(mouthX, mouthY, 3, 0.2, Math.PI - 0.2);
      ctx.stroke();

      // Draw hair
      drawHumanHair(ctx, centerX, centerY, dx, dy, perpX, perpY, frameCount);

      // Ear (on one side)
      const earX = centerX - perpX * (headRadius - 1);
      const earY = centerY - perpY * (headRadius - 1);
      ctx.fillStyle = `hsl(${skinHue}, ${skinSat}%, ${skinLight}%)`;
      ctx.beginPath();
      ctx.ellipse(earX, earY, 2, 3, Math.atan2(perpY, perpX), 0, Math.PI * 2);
      ctx.fill();

    } else {
      // HUMAN BODY SEGMENTS - torso-like shapes
      const bodyWidth = (CELL_SIZE / 2 - 1) * (0.85 + t * 0.15);
      const bodyLength = CELL_SIZE / 2 + 1;

      // Body glow
      ctx.shadowColor = '#ffaa77';
      ctx.shadowBlur = 6;

      // Torso segment with clothing (shirt)
      const clothingHue = 220; // Blue shirt
      const clothingSat = 60;
      const clothingLight = 45 + (1 - t) * 15;

      // Body shape (oval oriented along movement)
      const bodyGradient = ctx.createRadialGradient(
        centerX - dx * 2, centerY - dy * 2, 0,
        centerX, centerY, bodyWidth + 3
      );
      bodyGradient.addColorStop(0, `hsl(${clothingHue}, ${clothingSat}%, ${clothingLight + 15}%)`);
      bodyGradient.addColorStop(0.6, `hsl(${clothingHue}, ${clothingSat}%, ${clothingLight}%)`);
      bodyGradient.addColorStop(1, `hsl(${clothingHue}, ${clothingSat - 10}%, ${clothingLight - 15}%)`);
      ctx.fillStyle = bodyGradient;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, bodyLength, bodyWidth, Math.atan2(dy, dx), 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Shirt collar/neckline hint on first body segment
      if (i === 1) {
        ctx.strokeStyle = `hsl(${clothingHue}, ${clothingSat - 10}%, ${clothingLight - 20}%)`;
        ctx.lineWidth = 1.5;
        const collarX = centerX + dx * (bodyLength - 3);
        const collarY = centerY + dy * (bodyLength - 3);
        ctx.beginPath();
        ctx.arc(collarX, collarY, 4, Math.atan2(dy, dx) - 0.8, Math.atan2(dy, dx) + 0.8);
        ctx.stroke();
      }

      // Shirt wrinkle details
      if (i % 3 === 0) {
        ctx.strokeStyle = `hsla(${clothingHue}, ${clothingSat - 15}%, ${clothingLight - 10}%, 0.4)`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(centerX + perpX * bodyWidth * 0.3, centerY + perpY * bodyWidth * 0.3);
        ctx.lineTo(centerX - perpX * bodyWidth * 0.3, centerY - perpY * bodyWidth * 0.3);
        ctx.stroke();
      }

      // Highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.ellipse(centerX - dx * 2 - 1, centerY - dy * 2 - 1, bodyLength * 0.3, bodyWidth * 0.2, Math.atan2(dy, dx), 0, Math.PI * 2);
      ctx.fill();
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

  // Game over overlay - Synthwave glitch effect
  if (gameState.gameOver) {
    // Dark purple overlay
    ctx.fillStyle = COLORS.gameOverOverlay;
    ctx.fillRect(0, 0, width, height);

    // Neon rotating rings
    ctx.globalAlpha = 0.4;
    for (let ring = 0; ring < 5; ring++) {
      const ringRadius = 35 + ring * 28;
      const rotation = frameCount * 0.04 * (ring % 2 === 0 ? 1 : -1);
      const ringHue = (frameCount * 2 + ring * 60) % 360;

      ctx.strokeStyle = `hsl(${ringHue}, 100%, 60%)`;
      ctx.lineWidth = 3;
      ctx.shadowColor = `hsl(${ringHue}, 100%, 60%)`;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, ringRadius, rotation, rotation + Math.PI * 1.4);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;

    // Orbiting neon particles
    ctx.globalAlpha = 0.7;
    const numParticles = 16;
    for (let e = 0; e < numParticles; e++) {
      const angle = (e / numParticles) * Math.PI * 2 + frameCount * 0.025;
      const dist = 130 + Math.sin(frameCount * 0.06 + e * 0.5) * 25;
      const ex = width / 2 + Math.cos(angle) * dist;
      const ey = height / 2 + Math.sin(angle) * dist;
      const particleHue = (e * 22.5 + frameCount * 3) % 360;

      ctx.shadowColor = `hsl(${particleHue}, 100%, 60%)`;
      ctx.shadowBlur = 8;
      ctx.fillStyle = `hsl(${particleHue}, 100%, 70%)`;
      ctx.beginPath();
      ctx.arc(ex, ey, 4, 0, Math.PI * 2);
      ctx.fill();

      // Particle core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(ex, ey, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;

    // Glitch X symbol in center
    const glitchPulse = 0.6 + Math.sin(frameCount * 0.08) * 0.4;
    const centerX = width / 2;
    const centerY = height / 2;
    const xSize = 35;

    // Glitch offset
    const glitchX = Math.random() > 0.9 ? (Math.random() - 0.5) * 6 : 0;
    const glitchY = Math.random() > 0.9 ? (Math.random() - 0.5) * 6 : 0;

    // X glow
    ctx.strokeStyle = '#ff0080';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.globalAlpha = glitchPulse * 0.5;
    ctx.shadowColor = '#ff0080';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.moveTo(centerX - xSize + glitchX, centerY - xSize + glitchY);
    ctx.lineTo(centerX + xSize + glitchX, centerY + xSize + glitchY);
    ctx.moveTo(centerX + xSize + glitchX, centerY - xSize + glitchY);
    ctx.lineTo(centerX - xSize + glitchX, centerY + xSize + glitchY);
    ctx.stroke();

    // X core - bright cyan
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.globalAlpha = glitchPulse;
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 15;
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;

    // Draw the dramatic scoreboard
    drawScoreboard(ctx, gameState, width, height);
  }

  // Check and save high scores
  checkAndSaveHighScore(gameState);

  // CRT SCANLINE EFFECT - Retro arcade feel
  // Horizontal scan lines
  ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
  for (let y = 0; y < height; y += 3) {
    ctx.fillRect(0, y, width, 1);
  }

  // Subtle screen flicker
  if (Math.random() > 0.97) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.02)';
    ctx.fillRect(0, 0, width, height);
  }

  // Vignette effect (darker corners)
  const vignetteGradient = ctx.createRadialGradient(
    width / 2, height / 2, width * 0.3,
    width / 2, height / 2, width * 0.8
  );
  vignetteGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignetteGradient.addColorStop(0.7, 'rgba(0, 0, 0, 0.15)');
  vignetteGradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
  ctx.fillStyle = vignetteGradient;
  ctx.fillRect(0, 0, width, height);

  // Chromatic aberration on edges (subtle RGB shift)
  ctx.globalCompositeOperation = 'lighter';
  ctx.globalAlpha = 0.015;

  // Red channel shift
  ctx.fillStyle = '#ff0000';
  ctx.fillRect(2, 0, width, height);

  // Blue channel shift
  ctx.fillStyle = '#0000ff';
  ctx.fillRect(-2, 0, width, height);

  ctx.globalCompositeOperation = 'source-over';
  ctx.globalAlpha = 1;

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
