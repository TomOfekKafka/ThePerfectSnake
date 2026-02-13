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

// Color palette - electric neon theme (matching Phaser scene)
const COLORS = {
  bgDark: '#030308',
  bgMid: '#080815',
  bgGrid: '#12122a',
  snakeHead: '#00ffcc',
  snakeHeadGlow: '#00ffff',
  snakeHeadCore: '#aaffff',
  snakeBody: '#00ff88',
  snakeTail: '#00aa44',
  snakeConnector: '#00dd66',
  food: '#ff0066',
  foodGlow: '#ff3388',
  foodCore: '#ffffff',
  foodOrbit: '#ff88aa',
  gameOverOverlay: 'rgba(0, 0, 0, 0.65)',
  gameOverRed: '#ff0033',
  // Rainbow colors for shimmer effect
  rainbow: ['#ff0000', '#ff8800', '#ffff00', '#00ff00', '#0088ff', '#8800ff', '#ff00ff'],
  trailGlow: '#00ffaa',
  // Plasma wave colors
  plasma: ['#440066', '#660044', '#330066'],
  // Nebula colors for cosmic background
  nebula: ['#1a0033', '#330066', '#000033', '#003344', '#220044'],
  // Aurora colors
  aurora: ['#00ff88', '#00ffcc', '#00ccff', '#8844ff'],
  // Matrix digital rain colors
  matrixBright: '#00ff00',
  matrixMid: '#00cc00',
  matrixDim: '#008800',
  matrixHead: '#ccffcc',
  // Fire colors for blazing snake effect
  fireWhiteHot: '#ffffff',
  fireYellow: '#ffff44',
  fireOrange: '#ff8800',
  fireRed: '#ff2200',
  fireEmber: '#881100',
  fireGradient: ['#ffffff', '#ffffcc', '#ffff44', '#ffcc00', '#ff8800', '#ff4400', '#ff2200', '#cc1100', '#881100'],
  // Quantum entanglement colors
  quantum: ['#ff00ff', '#00ffff', '#ffff00', '#ff8800', '#00ff88', '#8888ff'],
};

// Static stars for Canvas2D fallback (no animation)
const STARS: Array<{ x: number; y: number; size: number; brightness: number }> = [];
for (let i = 0; i < 60; i++) {
  STARS.push({
    x: Math.random() * GRID_SIZE * CELL_SIZE,
    y: Math.random() * GRID_SIZE * CELL_SIZE,
    size: Math.random() * 1.5 + 0.5,
    brightness: Math.random() * 0.5 + 0.3,
  });
}

// Static shooting stars (decorative)
const SHOOTING_STARS: Array<{ x: number; y: number; angle: number; length: number }> = [
  { x: 50, y: 30, angle: Math.PI * 0.75, length: 25 },
  { x: 320, y: 80, angle: Math.PI * 0.8, length: 20 },
];

// Static warp lines (decorative speed lines)
const WARP_LINES: Array<{ x: number; y: number; angle: number; length: number; color: string }> = [];
for (let i = 0; i < 8; i++) {
  WARP_LINES.push({
    x: 50 + Math.random() * 300,
    y: 50 + Math.random() * 300,
    angle: Math.PI * (0.7 + Math.random() * 0.3),
    length: 20 + Math.random() * 30,
    color: COLORS.rainbow[i % COLORS.rainbow.length],
  });
}

// Static nebula nodes for cosmic background
const NEBULA_NODES: Array<{ x: number; y: number; radius: number; color: string }> = [];
for (let i = 0; i < 6; i++) {
  NEBULA_NODES.push({
    x: Math.random() * GRID_SIZE * CELL_SIZE,
    y: Math.random() * GRID_SIZE * CELL_SIZE,
    radius: 60 + Math.random() * 80,
    color: COLORS.nebula[i % COLORS.nebula.length],
  });
}

// Static Matrix rain drops for Canvas2D fallback
const MATRIX_DROPS: Array<{ x: number; y: number; length: number; brightness: number }> = [];
const MATRIX_COLUMN_WIDTH = 14;
const MATRIX_NUM_COLUMNS = Math.floor((GRID_SIZE * CELL_SIZE) / MATRIX_COLUMN_WIDTH);
for (let i = 0; i < MATRIX_NUM_COLUMNS; i++) {
  MATRIX_DROPS.push({
    x: i * MATRIX_COLUMN_WIDTH + MATRIX_COLUMN_WIDTH / 2,
    y: Math.random() * GRID_SIZE * CELL_SIZE,
    length: 8 + Math.floor(Math.random() * 12),
    brightness: 0.3 + Math.random() * 0.4,
  });
}

// Grid pulse wave state for animated grid effect
interface GridPulse {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  intensity: number;
}
const GRID_PULSES: GridPulse[] = [];
let lastPulseTime = 0;
let lastFoodX = -1;
let lastFoodY = -1;

// Particle explosion system for food consumption
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
  type: 'spark' | 'ember' | 'ring';
}
const PARTICLES: Particle[] = [];
const MAX_PARTICLES = 80;

// Shatter fragments for game over effect
interface ShatterFragment {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  size: number;
  color: string;
  life: number;
}
const SHATTER_FRAGMENTS: ShatterFragment[] = [];
let gameOverTriggered = false;

// Screen shake effect state
interface ScreenShake {
  intensity: number;
  decay: number;
  offsetX: number;
  offsetY: number;
}
const screenShake: ScreenShake = {
  intensity: 0,
  decay: 0.92,
  offsetX: 0,
  offsetY: 0,
};

// Energy discharge effect for dramatic moments
interface EnergyDischarge {
  x: number;
  y: number;
  angle: number;
  length: number;
  life: number;
  color: string;
  branches: Array<{ angle: number; length: number; offset: number }>;
}
const ENERGY_DISCHARGES: EnergyDischarge[] = [];

// Track previous snake length to detect food eaten
let prevSnakeLength = 1;

// TEMPORAL ECHO SYSTEM - Store previous snake positions for afterimage trail
interface TemporalEcho {
  snake: Array<{ x: number; y: number }>;
  timestamp: number;
  alpha: number;
}
const TEMPORAL_ECHOES: TemporalEcho[] = [];
const MAX_ECHOES = 6;
const ECHO_INTERVAL_MS = 50;
let lastEchoTime = 0;

// Dimensional Rift effect around snake head
interface DimensionalRift {
  angle: number;
  radius: number;
  rotationSpeed: number;
  color: string;
  pulsePhase: number;
}
const RIFT_NODES: DimensionalRift[] = [];
const RIFT_NODE_COUNT = 8;

// Initialize rift nodes
for (let i = 0; i < RIFT_NODE_COUNT; i++) {
  RIFT_NODES.push({
    angle: (i / RIFT_NODE_COUNT) * Math.PI * 2,
    radius: 25 + Math.random() * 10,
    rotationSpeed: 0.02 + Math.random() * 0.02,
    color: COLORS.rainbow[i % COLORS.rainbow.length],
    pulsePhase: Math.random() * Math.PI * 2,
  });
}

// Spawn particles at food position
function spawnFoodParticles(x: number, y: number): void {
  const centerX = x * CELL_SIZE + CELL_SIZE / 2;
  const centerY = y * CELL_SIZE + CELL_SIZE / 2;

  // Spark particles - fast, bright
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2 + Math.random() * 0.3;
    const speed = 3 + Math.random() * 4;
    PARTICLES.push({
      x: centerX,
      y: centerY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 3 + Math.random() * 3,
      color: COLORS.rainbow[i % COLORS.rainbow.length],
      life: 1,
      maxLife: 1,
      type: 'spark'
    });
  }

  // Ember particles - slower, glowing
  for (let i = 0; i < 8; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 2;
    PARTICLES.push({
      x: centerX,
      y: centerY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 4 + Math.random() * 4,
      color: COLORS.food,
      life: 1,
      maxLife: 1,
      type: 'ember'
    });
  }

  // Ring particles - expanding circles
  for (let i = 0; i < 3; i++) {
    PARTICLES.push({
      x: centerX,
      y: centerY,
      vx: 0,
      vy: 0,
      size: 5 + i * 8,
      color: i === 0 ? '#ffffff' : COLORS.foodGlow,
      life: 1,
      maxLife: 1,
      type: 'ring'
    });
  }
}

// Spawn shatter effect on game over
function spawnShatterEffect(snakeX: number, snakeY: number): void {
  const centerX = snakeX * CELL_SIZE + CELL_SIZE / 2;
  const centerY = snakeY * CELL_SIZE + CELL_SIZE / 2;

  for (let i = 0; i < 20; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 5;
    SHATTER_FRAGMENTS.push({
      x: centerX + (Math.random() - 0.5) * 40,
      y: centerY + (Math.random() - 0.5) * 40,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.3,
      size: 8 + Math.random() * 15,
      color: Math.random() > 0.5 ? COLORS.snakeHead : COLORS.gameOverRed,
      life: 1
    });
  }

  // Trigger intense screen shake on death
  screenShake.intensity = 20;

  // Spawn dramatic energy discharges across screen
  spawnEnergyDischarges(centerX, centerY, 8);
}

// Trigger screen shake effect
function triggerScreenShake(intensity: number): void {
  screenShake.intensity = Math.max(screenShake.intensity, intensity);
}

// Spawn energy discharge lightning effects
function spawnEnergyDischarges(centerX: number, centerY: number, count: number): void {
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.3;
    const length = 60 + Math.random() * 100;
    const branches: Array<{ angle: number; length: number; offset: number }> = [];

    // Create branching lightning
    const branchCount = 2 + Math.floor(Math.random() * 3);
    for (let b = 0; b < branchCount; b++) {
      branches.push({
        angle: angle + (Math.random() - 0.5) * 1.2,
        length: 20 + Math.random() * 40,
        offset: 0.3 + Math.random() * 0.5,
      });
    }

    ENERGY_DISCHARGES.push({
      x: centerX,
      y: centerY,
      angle,
      length,
      life: 1,
      color: COLORS.rainbow[i % COLORS.rainbow.length],
      branches,
    });
  }
}

function lerpColor(color1: string, color2: string, t: number): string {
  const c1 = parseInt(color1.slice(1), 16);
  const c2 = parseInt(color2.slice(1), 16);

  const r1 = (c1 >> 16) & 0xff;
  const g1 = (c1 >> 8) & 0xff;
  const b1 = c1 & 0xff;

  const r2 = (c2 >> 16) & 0xff;
  const g2 = (c2 >> 8) & 0xff;
  const b2 = c2 & 0xff;

  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);

  return `rgb(${r}, ${g}, ${b})`;
}

function drawCanvas2D(canvas: HTMLCanvasElement, gameState: GameState): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;
  const now = Date.now();

  // Detect food eaten (snake grew)
  if (gameState.snake.length > prevSnakeLength && prevSnakeLength > 0) {
    triggerScreenShake(8);
    // Spawn small energy discharge from snake head
    if (gameState.snake.length > 0) {
      const head = gameState.snake[0];
      const headX = head.x * CELL_SIZE + CELL_SIZE / 2;
      const headY = head.y * CELL_SIZE + CELL_SIZE / 2;
      spawnEnergyDischarges(headX, headY, 4);
    }
  }
  prevSnakeLength = gameState.snake.length;

  // Update screen shake
  if (screenShake.intensity > 0.5) {
    screenShake.offsetX = (Math.random() - 0.5) * screenShake.intensity;
    screenShake.offsetY = (Math.random() - 0.5) * screenShake.intensity;
    screenShake.intensity *= screenShake.decay;
  } else {
    screenShake.intensity = 0;
    screenShake.offsetX = 0;
    screenShake.offsetY = 0;
  }

  // Apply screen shake transform
  ctx.save();
  ctx.translate(screenShake.offsetX, screenShake.offsetY);

  // TEMPORAL ECHO SYSTEM - Capture snake positions for afterimage trail
  if (!gameState.gameOver && gameState.snake.length > 0) {
    if (now - lastEchoTime > ECHO_INTERVAL_MS) {
      lastEchoTime = now;
      // Capture current snake position
      TEMPORAL_ECHOES.unshift({
        snake: gameState.snake.map(s => ({ x: s.x, y: s.y })),
        timestamp: now,
        alpha: 1.0,
      });
      // Limit echoes
      while (TEMPORAL_ECHOES.length > MAX_ECHOES) {
        TEMPORAL_ECHOES.pop();
      }
    }
  } else if (gameState.gameOver) {
    // Clear echoes on game over
    TEMPORAL_ECHOES.length = 0;
  }

  // Update echo alphas (fade out over time)
  for (let i = TEMPORAL_ECHOES.length - 1; i >= 0; i--) {
    const echo = TEMPORAL_ECHOES[i];
    const age = now - echo.timestamp;
    echo.alpha = Math.max(0, 1 - age / 400);
    if (echo.alpha <= 0) {
      TEMPORAL_ECHOES.splice(i, 1);
    }
  }

  // Update dimensional rift nodes
  for (const node of RIFT_NODES) {
    node.angle += node.rotationSpeed;
    node.pulsePhase += 0.08;
  }

  // Update grid pulses - spawn from snake head periodically
  if (gameState.snake.length > 0 && !gameState.gameOver) {
    const head = gameState.snake[0];
    const headCenterX = head.x * CELL_SIZE + CELL_SIZE / 2;
    const headCenterY = head.y * CELL_SIZE + CELL_SIZE / 2;

    // Spawn head pulse every 200ms
    if (now - lastPulseTime > 200) {
      lastPulseTime = now;
      GRID_PULSES.push({
        x: headCenterX,
        y: headCenterY,
        radius: 0,
        maxRadius: 120 + gameState.snake.length * 3,
        color: COLORS.snakeHeadGlow,
        intensity: 0.4,
      });
    }

    // Detect food eaten (food position changed)
    if (lastFoodX !== gameState.food.x || lastFoodY !== gameState.food.y) {
      if (lastFoodX >= 0) {
        // Food was eaten at old position - create explosion pulse
        const oldFoodX = lastFoodX * CELL_SIZE + CELL_SIZE / 2;
        const oldFoodY = lastFoodY * CELL_SIZE + CELL_SIZE / 2;
        GRID_PULSES.push({
          x: oldFoodX,
          y: oldFoodY,
          radius: 0,
          maxRadius: 200,
          color: COLORS.food,
          intensity: 0.7,
        });
        // Add rainbow burst pulses
        for (let i = 0; i < 3; i++) {
          GRID_PULSES.push({
            x: oldFoodX,
            y: oldFoodY,
            radius: i * 15,
            maxRadius: 180 - i * 20,
            color: COLORS.rainbow[i * 2],
            intensity: 0.5 - i * 0.1,
          });
        }
        // Spawn particle explosion
        spawnFoodParticles(lastFoodX, lastFoodY);
      }
      lastFoodX = gameState.food.x;
      lastFoodY = gameState.food.y;
    }
  }

  // Handle game over shatter effect
  if (gameState.gameOver && !gameOverTriggered) {
    gameOverTriggered = true;
    if (gameState.snake.length > 0) {
      spawnShatterEffect(gameState.snake[0].x, gameState.snake[0].y);
    }
  } else if (!gameState.gameOver) {
    gameOverTriggered = false;
    SHATTER_FRAGMENTS.length = 0;
  }

  // Update particles
  for (let i = PARTICLES.length - 1; i >= 0; i--) {
    const p = PARTICLES[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.96;
    p.vy *= 0.96;
    p.life -= p.type === 'ring' ? 0.04 : 0.025;
    if (p.type === 'ring') {
      p.size += 4;
    }
    if (p.life <= 0) {
      PARTICLES.splice(i, 1);
    }
  }

  // Limit particles
  while (PARTICLES.length > MAX_PARTICLES) {
    PARTICLES.shift();
  }

  // Update shatter fragments
  for (let i = SHATTER_FRAGMENTS.length - 1; i >= 0; i--) {
    const f = SHATTER_FRAGMENTS[i];
    f.x += f.vx;
    f.y += f.vy;
    f.vy += 0.15; // gravity
    f.rotation += f.rotationSpeed;
    f.life -= 0.012;
    if (f.life <= 0) {
      SHATTER_FRAGMENTS.splice(i, 1);
    }
  }

  // Update pulse animations
  for (let i = GRID_PULSES.length - 1; i >= 0; i--) {
    const pulse = GRID_PULSES[i];
    pulse.radius += 6;
    pulse.intensity *= 0.96;
    if (pulse.radius > pulse.maxRadius || pulse.intensity < 0.02) {
      GRID_PULSES.splice(i, 1);
    }
  }

  // Limit max pulses to prevent performance issues
  while (GRID_PULSES.length > 12) {
    GRID_PULSES.shift();
  }

  // Deep space background
  ctx.fillStyle = COLORS.bgDark;
  ctx.fillRect(0, 0, width, height);

  // Subtle radial gradient overlay (center lighter)
  const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width * 0.7);
  gradient.addColorStop(0, 'rgba(8, 8, 21, 0.4)');
  gradient.addColorStop(1, 'rgba(3, 3, 8, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Draw cosmic nebula clouds
  for (const node of NEBULA_NODES) {
    const grad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, node.radius);
    grad.addColorStop(0, node.color + '20');
    grad.addColorStop(0.5, node.color + '10');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.radius * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw Matrix digital rain effect (static version for Canvas2D fallback)
  const charHeight = 14;
  for (const drop of MATRIX_DROPS) {
    for (let i = 0; i < drop.length; i++) {
      const charY = drop.y - i * charHeight;

      // Skip if off screen
      if (charY < -charHeight || charY > GRID_SIZE * CELL_SIZE + charHeight) continue;

      const fadeProgress = i / drop.length;
      const alpha = drop.brightness * (1 - fadeProgress * 0.8);

      if (i === 0) {
        // Bright head
        ctx.fillStyle = COLORS.matrixHead;
        ctx.globalAlpha = alpha * 1.2;
        ctx.beginPath();
        ctx.arc(drop.x, charY, 4, 0, Math.PI * 2);
        ctx.fill();

        // Glow
        ctx.fillStyle = COLORS.matrixBright;
        ctx.globalAlpha = alpha * 0.5;
        ctx.beginPath();
        ctx.arc(drop.x, charY, 6, 0, Math.PI * 2);
        ctx.fill();
      } else if (i < 3) {
        ctx.fillStyle = COLORS.matrixBright;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.arc(drop.x, charY, 3, 0, Math.PI * 2);
        ctx.fill();
      } else if (i < drop.length * 0.5) {
        ctx.fillStyle = COLORS.matrixMid;
        ctx.globalAlpha = alpha * 0.8;
        ctx.beginPath();
        ctx.arc(drop.x, charY, 2.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = COLORS.matrixDim;
        ctx.globalAlpha = alpha * 0.6;
        ctx.beginPath();
        ctx.arc(drop.x, charY, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.globalAlpha = 1;

  // Draw aurora borealis effect (static version for Canvas2D)
  for (let layer = 0; layer < 3; layer++) {
    const baseY = 40 + layer * 45;
    const auroraColor = COLORS.aurora[layer % COLORS.aurora.length];

    ctx.globalAlpha = 0.08 - layer * 0.02;
    for (let x = 0; x < width; x += 8) {
      const waveOffset = Math.sin(x * 0.015 + layer * 0.5) * 25;
      const stripHeight = 40 + Math.sin(x * 0.02) * 15;

      // Vertical gradient strip
      const auroraGrad = ctx.createLinearGradient(x, baseY + waveOffset, x, baseY + waveOffset + stripHeight);
      auroraGrad.addColorStop(0, 'transparent');
      auroraGrad.addColorStop(0.3, auroraColor);
      auroraGrad.addColorStop(0.7, auroraColor);
      auroraGrad.addColorStop(1, 'transparent');

      ctx.fillStyle = auroraGrad;
      ctx.fillRect(x, baseY + waveOffset, 6, stripHeight);
    }
  }
  ctx.globalAlpha = 1;

  // Draw plasma waves (static for Canvas2D)
  ctx.globalAlpha = 0.12;
  for (let i = 0; i < 3; i++) {
    ctx.strokeStyle = COLORS.plasma[i];
    ctx.lineWidth = 6;
    ctx.beginPath();
    const waveY = (i + 1) * height / 4;
    for (let x = 0; x <= width; x += 4) {
      const y = waveY + Math.sin(x * 0.03 + i) * 20;
      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Draw twinkling stars
  for (const star of STARS) {
    ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();

    // Colored halo for larger stars
    if (star.size > 1.2) {
      const haloColor = COLORS.rainbow[Math.floor(star.x) % COLORS.rainbow.length];
      ctx.fillStyle = haloColor;
      ctx.globalAlpha = star.brightness * 0.3;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size + 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  // Draw shooting stars (decorative streaks)
  for (const ss of SHOOTING_STARS) {
    const tailX = ss.x + Math.cos(ss.angle) * ss.length;
    const tailY = ss.y + Math.sin(ss.angle) * ss.length;

    // Gradient trail
    const grad = ctx.createLinearGradient(ss.x, ss.y, tailX, tailY);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    grad.addColorStop(1, 'rgba(136, 204, 255, 0)');

    ctx.strokeStyle = grad;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ss.x, ss.y);
    ctx.lineTo(tailX, tailY);
    ctx.stroke();

    // Bright head
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(ss.x, ss.y, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Draw warp lines (decorative speed effect)
  for (const wl of WARP_LINES) {
    const endX = wl.x + Math.cos(wl.angle) * wl.length;
    const endY = wl.y + Math.sin(wl.angle) * wl.length;

    // Gradient warp trail
    const warpGrad = ctx.createLinearGradient(wl.x, wl.y, endX, endY);
    warpGrad.addColorStop(0, wl.color);
    warpGrad.addColorStop(1, 'rgba(0, 255, 204, 0)');

    ctx.strokeStyle = warpGrad;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.moveTo(wl.x, wl.y);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Head glow
    ctx.fillStyle = wl.color;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(wl.x, wl.y, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Subtle grid pattern
  ctx.strokeStyle = COLORS.bgGrid;
  ctx.globalAlpha = 0.25;
  ctx.lineWidth = 1;
  for (let i = 0; i <= GRID_SIZE; i++) {
    ctx.beginPath();
    ctx.moveTo(i * CELL_SIZE, 0);
    ctx.lineTo(i * CELL_SIZE, height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * CELL_SIZE);
    ctx.lineTo(width, i * CELL_SIZE);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // PULSE GRID EFFECT - Grid lines that light up with energy waves
  for (const pulse of GRID_PULSES) {
    const innerRadius = Math.max(0, pulse.radius - 20);
    const outerRadius = pulse.radius;

    // Draw pulsing grid lines within the wave band
    for (let i = 0; i <= GRID_SIZE; i++) {
      const lineX = i * CELL_SIZE;
      const lineY = i * CELL_SIZE;

      // Vertical lines
      for (let y = 0; y < height; y += 4) {
        const distToCenter = Math.sqrt((lineX - pulse.x) ** 2 + (y - pulse.y) ** 2);
        if (distToCenter >= innerRadius && distToCenter <= outerRadius) {
          const waveIntensity = 1 - Math.abs(distToCenter - (innerRadius + outerRadius) / 2) / ((outerRadius - innerRadius) / 2);
          const alpha = pulse.intensity * waveIntensity * 0.8;

          ctx.fillStyle = pulse.color;
          ctx.globalAlpha = alpha;
          ctx.fillRect(lineX - 1, y, 2, 3);
        }
      }

      // Horizontal lines
      for (let x = 0; x < width; x += 4) {
        const distToCenter = Math.sqrt((x - pulse.x) ** 2 + (lineY - pulse.y) ** 2);
        if (distToCenter >= innerRadius && distToCenter <= outerRadius) {
          const waveIntensity = 1 - Math.abs(distToCenter - (innerRadius + outerRadius) / 2) / ((outerRadius - innerRadius) / 2);
          const alpha = pulse.intensity * waveIntensity * 0.8;

          ctx.fillStyle = pulse.color;
          ctx.globalAlpha = alpha;
          ctx.fillRect(x, lineY - 1, 3, 2);
        }
      }
    }

    // Draw glowing intersection nodes within the pulse wave
    for (let gx = 0; gx <= GRID_SIZE; gx++) {
      for (let gy = 0; gy <= GRID_SIZE; gy++) {
        const nodeX = gx * CELL_SIZE;
        const nodeY = gy * CELL_SIZE;
        const distToCenter = Math.sqrt((nodeX - pulse.x) ** 2 + (nodeY - pulse.y) ** 2);

        if (distToCenter >= innerRadius && distToCenter <= outerRadius) {
          const waveIntensity = 1 - Math.abs(distToCenter - (innerRadius + outerRadius) / 2) / ((outerRadius - innerRadius) / 2);
          const alpha = pulse.intensity * waveIntensity;

          // Outer glow
          ctx.fillStyle = pulse.color;
          ctx.globalAlpha = alpha * 0.4;
          ctx.beginPath();
          ctx.arc(nodeX, nodeY, 6, 0, Math.PI * 2);
          ctx.fill();

          // Inner bright core
          ctx.fillStyle = '#ffffff';
          ctx.globalAlpha = alpha * 0.8;
          ctx.beginPath();
          ctx.arc(nodeX, nodeY, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }
  ctx.globalAlpha = 1;

  // Animated glow at grid corners
  ctx.fillStyle = '#00ffff';
  for (let x = 0; x <= GRID_SIZE; x += 5) {
    for (let y = 0; y <= GRID_SIZE; y += 5) {
      ctx.globalAlpha = 0.07;
      ctx.beginPath();
      ctx.arc(x * CELL_SIZE, y * CELL_SIZE, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  // Draw food with enhanced glow effect
  const food = gameState.food;
  const foodCenterX = food.x * CELL_SIZE + CELL_SIZE / 2;
  const foodCenterY = food.y * CELL_SIZE + CELL_SIZE / 2;

  // Energy rings around food (static)
  for (let i = 0; i < 3; i++) {
    const ringRadius = 20 + i * 12;
    ctx.strokeStyle = COLORS.rainbow[i * 2];
    ctx.lineWidth = 2 - i * 0.5;
    ctx.globalAlpha = 0.15 - i * 0.04;
    ctx.beginPath();
    ctx.arc(foodCenterX, foodCenterY, ringRadius, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Outer corona glow (larger, more dramatic)
  ctx.fillStyle = COLORS.food;
  ctx.globalAlpha = 0.08;
  ctx.beginPath();
  ctx.arc(foodCenterX, foodCenterY, 22, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 0.12;
  ctx.beginPath();
  ctx.arc(foodCenterX, foodCenterY, 16, 0, Math.PI * 2);
  ctx.fill();

  // Orbiting energy orbs (static positions for Canvas2D)
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    const orbX = foodCenterX + Math.cos(angle) * 13;
    const orbY = foodCenterY + Math.sin(angle) * 13;

    // Orb glow
    ctx.fillStyle = COLORS.rainbow[i];
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.arc(orbX, orbY, 4, 0, Math.PI * 2);
    ctx.fill();

    // Orb core
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(orbX, orbY, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Rainbow ring effect (static for Canvas2D)
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const rx = foodCenterX + Math.cos(angle) * 7;
    const ry = foodCenterY + Math.sin(angle) * 7;
    ctx.fillStyle = COLORS.rainbow[i];
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.arc(rx, ry, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Main glow layers
  ctx.fillStyle = COLORS.food;
  ctx.globalAlpha = 0.18;
  ctx.beginPath();
  ctx.arc(foodCenterX, foodCenterY, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = COLORS.foodGlow;
  ctx.globalAlpha = 0.45;
  ctx.beginPath();
  ctx.arc(foodCenterX, foodCenterY, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Crystalline hexagon effect
  const crystalSize = 9;
  const facets = 6;
  const rotation = 0; // Static rotation for Canvas2D fallback

  // Crystal glow
  ctx.fillStyle = COLORS.foodGlow;
  ctx.globalAlpha = 0.3;
  ctx.beginPath();
  for (let i = 0; i < facets; i++) {
    const angle = (i / facets) * Math.PI * 2 + rotation;
    const fx = foodCenterX + Math.cos(angle) * (crystalSize + 3);
    const fy = foodCenterY + Math.sin(angle) * (crystalSize + 3);
    if (i === 0) ctx.moveTo(fx, fy);
    else ctx.lineTo(fx, fy);
  }
  ctx.closePath();
  ctx.fill();

  // Crystal body
  ctx.fillStyle = COLORS.food;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  for (let i = 0; i < facets; i++) {
    const angle = (i / facets) * Math.PI * 2 + rotation;
    const fx = foodCenterX + Math.cos(angle) * crystalSize;
    const fy = foodCenterY + Math.sin(angle) * crystalSize;
    if (i === 0) ctx.moveTo(fx, fy);
    else ctx.lineTo(fx, fy);
  }
  ctx.closePath();
  ctx.fill();

  // Crystal facet lines
  ctx.strokeStyle = COLORS.foodGlow;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.4;
  for (let i = 0; i < facets; i++) {
    const angle = (i / facets) * Math.PI * 2 + rotation;
    const fx = foodCenterX + Math.cos(angle) * crystalSize;
    const fy = foodCenterY + Math.sin(angle) * crystalSize;
    ctx.beginPath();
    ctx.moveTo(foodCenterX, foodCenterY);
    ctx.lineTo(fx, fy);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Inner bright core
  ctx.fillStyle = COLORS.foodCore;
  ctx.globalAlpha = 0.95;
  ctx.beginPath();
  ctx.arc(foodCenterX, foodCenterY, 4, 0, Math.PI * 2);
  ctx.fill();

  // Sparkle highlights on facets
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 3; i++) {
    const sparkleAngle = rotation + (i / 3) * Math.PI * 2;
    const sparkleR = crystalSize * 0.5;
    const sparkleX = foodCenterX + Math.cos(sparkleAngle) * sparkleR;
    const sparkleY = foodCenterY + Math.sin(sparkleAngle) * sparkleR;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(sparkleX, sparkleY, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Draw particle explosions
  for (const p of PARTICLES) {
    const alpha = p.life;
    if (p.type === 'ring') {
      // Expanding ring
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 3 * alpha;
      ctx.globalAlpha = alpha * 0.6;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.stroke();
    } else if (p.type === 'spark') {
      // Fast bright sparks with trail
      const trailLength = 8 * alpha;
      const grad = ctx.createLinearGradient(
        p.x, p.y,
        p.x - p.vx * trailLength,
        p.y - p.vy * trailLength
      );
      grad.addColorStop(0, p.color);
      grad.addColorStop(1, 'transparent');
      ctx.strokeStyle = grad;
      ctx.lineWidth = p.size * alpha;
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - p.vx * trailLength, p.y - p.vy * trailLength);
      ctx.stroke();

      // Bright core
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = alpha * 0.9;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 0.5 * alpha, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Ember - glowing orb
      ctx.fillStyle = p.color;
      ctx.globalAlpha = alpha * 0.3;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 1.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = alpha * 0.7;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = alpha * 0.9;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  // Draw hyper speed trails behind snake (static version for Canvas2D)
  const snake = gameState.snake;
  const segmentCount = snake.length;

  // Draw comet trail effect behind head (static version)
  if (segmentCount > 0 && !gameState.gameOver) {
    const head = snake[0];
    const headX = head.x * CELL_SIZE + CELL_SIZE / 2;
    const headY = head.y * CELL_SIZE + CELL_SIZE / 2;

    // Draw multiple comet trail particles
    for (let i = 0; i < 8; i++) {
      const angle = Math.PI + (Math.random() - 0.5) * 0.6;
      const distance = 8 + i * 4 + Math.random() * 5;
      const trailX = headX + Math.cos(angle) * distance;
      const trailY = headY + Math.sin(angle) * distance;
      const size = 4 - i * 0.4 + Math.random();
      const alpha = 0.6 - i * 0.07;

      // Outer glow
      ctx.fillStyle = COLORS.rainbow[i % COLORS.rainbow.length];
      ctx.globalAlpha = alpha * 0.3;
      ctx.beginPath();
      ctx.arc(trailX, trailY, size + 3, 0, Math.PI * 2);
      ctx.fill();

      // Core
      ctx.globalAlpha = alpha * 0.7;
      ctx.beginPath();
      ctx.arc(trailX, trailY, size, 0, Math.PI * 2);
      ctx.fill();

      // White center
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = alpha * 0.9;
      ctx.beginPath();
      ctx.arc(trailX, trailY, size * 0.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Draw electric spark effect (static version)
    for (let i = 0; i < 5; i++) {
      const sparkAngle = (Math.random() - 0.5) * 1.5;
      const sparkDist = 12 + Math.random() * 15;
      const sparkX = headX + Math.cos(sparkAngle) * sparkDist;
      const sparkY = headY + Math.sin(sparkAngle) * sparkDist;
      const sparkSize = 2 + Math.random() * 2;

      // Spark glow
      ctx.fillStyle = COLORS.snakeHeadGlow;
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.arc(sparkX, sparkY, sparkSize + 2, 0, Math.PI * 2);
      ctx.fill();

      // Spark core
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.8;
      ctx.beginPath();
      ctx.arc(sparkX, sparkY, sparkSize, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // Draw motion trails for dramatic effect
  if (segmentCount > 0 && !gameState.gameOver) {
    for (let i = 0; i < segmentCount; i += Math.max(1, Math.floor(segmentCount / 6))) {
      const seg = snake[i];
      const progress = i / Math.max(segmentCount - 1, 1);
      const trailColor = i === 0 ? COLORS.snakeHeadGlow : COLORS.rainbow[i % COLORS.rainbow.length];
      const trailWidth = i === 0 ? 6 : 3 - progress * 1.5;

      // Draw trail extending backward (assuming rightward movement as default)
      const segX = seg.x * CELL_SIZE + CELL_SIZE / 2;
      const segY = seg.y * CELL_SIZE + CELL_SIZE / 2;
      const trailLength = 15 + (1 - progress) * 10;

      // Outer glow
      const gradient = ctx.createLinearGradient(segX, segY, segX - trailLength, segY);
      gradient.addColorStop(0, trailColor + '40');
      gradient.addColorStop(1, 'transparent');
      ctx.strokeStyle = gradient;
      ctx.lineWidth = trailWidth + 4;
      ctx.beginPath();
      ctx.moveTo(segX, segY);
      ctx.lineTo(segX - trailLength, segY);
      ctx.stroke();

      // Core trail
      const coreGradient = ctx.createLinearGradient(segX, segY, segX - trailLength, segY);
      coreGradient.addColorStop(0, '#ffffff80');
      coreGradient.addColorStop(1, 'transparent');
      ctx.strokeStyle = coreGradient;
      ctx.lineWidth = trailWidth;
      ctx.beginPath();
      ctx.moveTo(segX, segY);
      ctx.lineTo(segX - trailLength, segY);
      ctx.stroke();
    }
  }

  // TEMPORAL ECHO RENDERING - Draw ghostly afterimages of the snake
  for (let echoIdx = TEMPORAL_ECHOES.length - 1; echoIdx >= 0; echoIdx--) {
    const echo = TEMPORAL_ECHOES[echoIdx];
    if (echo.alpha <= 0) continue;

    const echoSnake = echo.snake;
    const fadeProgress = 1 - echo.alpha;
    const echoColor = COLORS.rainbow[echoIdx % COLORS.rainbow.length];

    // Draw echo segments with chromatic shift
    for (let i = echoSnake.length - 1; i >= 0; i--) {
      const seg = echoSnake[i];
      const segX = seg.x * CELL_SIZE + CELL_SIZE / 2;
      const segY = seg.y * CELL_SIZE + CELL_SIZE / 2;
      const segProgress = echoSnake.length > 1 ? i / (echoSnake.length - 1) : 0;
      const baseSize = CELL_SIZE - 4 - segProgress * 4;

      // Chromatic aberration offset (RGB channel separation)
      const aberrationOffset = (1 - echo.alpha) * 4;

      // Red channel (offset left)
      ctx.fillStyle = '#ff0000';
      ctx.globalAlpha = echo.alpha * 0.15;
      ctx.beginPath();
      ctx.arc(segX - aberrationOffset, segY, baseSize / 2, 0, Math.PI * 2);
      ctx.fill();

      // Blue channel (offset right)
      ctx.fillStyle = '#0088ff';
      ctx.globalAlpha = echo.alpha * 0.15;
      ctx.beginPath();
      ctx.arc(segX + aberrationOffset, segY, baseSize / 2, 0, Math.PI * 2);
      ctx.fill();

      // Main echo body with rainbow tint
      ctx.fillStyle = echoColor;
      ctx.globalAlpha = echo.alpha * 0.25;
      ctx.beginPath();
      ctx.arc(segX, segY, baseSize / 2 + 2, 0, Math.PI * 2);
      ctx.fill();

      // Outer temporal glow
      ctx.fillStyle = '#00ffff';
      ctx.globalAlpha = echo.alpha * 0.08;
      ctx.beginPath();
      ctx.arc(segX, segY, baseSize / 2 + 8, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw temporal distortion rings around echo head
    if (echoSnake.length > 0) {
      const echoHead = echoSnake[0];
      const headX = echoHead.x * CELL_SIZE + CELL_SIZE / 2;
      const headY = echoHead.y * CELL_SIZE + CELL_SIZE / 2;
      const ringRadius = 15 + fadeProgress * 25;

      ctx.strokeStyle = echoColor;
      ctx.lineWidth = 2 * echo.alpha;
      ctx.globalAlpha = echo.alpha * 0.3;
      ctx.beginPath();
      ctx.arc(headX, headY, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;

  // Draw snake (from tail to head so head is on top)

  // First pass: Draw segment connectors (smooth body connections)
  if (segmentCount > 1) {
    for (let i = 0; i < segmentCount - 1; i++) {
      const current = snake[i];
      const next = snake[i + 1];
      const progress = segmentCount > 1 ? i / (segmentCount - 1) : 0;

      const cx = current.x * CELL_SIZE + CELL_SIZE / 2;
      const cy = current.y * CELL_SIZE + CELL_SIZE / 2;
      const nx = next.x * CELL_SIZE + CELL_SIZE / 2;
      const ny = next.y * CELL_SIZE + CELL_SIZE / 2;

      const connectorColor = lerpColor(COLORS.snakeBody, COLORS.snakeTail, progress);
      const connectorSize = CELL_SIZE - 4 - progress * 3;

      // Draw connecting line between segments
      ctx.strokeStyle = connectorColor;
      ctx.lineWidth = connectorSize * 0.7;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(nx, ny);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  // Second pass: Draw body segments from tail to head
  for (let i = segmentCount - 1; i >= 0; i--) {
    const segment = snake[i];
    const x = segment.x * CELL_SIZE;
    const y = segment.y * CELL_SIZE;
    const centerX = x + CELL_SIZE / 2;
    const centerY = y + CELL_SIZE / 2;
    const isHead = i === 0;
    const progress = segmentCount > 1 ? i / (segmentCount - 1) : 0;

    if (isHead) {
      // Calculate power level based on snake length (visual intensity scaling)
      const powerLevel = Math.min(1 + (segmentCount - 1) * 0.15, 3);

      // Electric aura (outermost) - scales with power level
      if (!gameState.gameOver) {
        ctx.fillStyle = '#00ccff';
        ctx.globalAlpha = 0.08 * powerLevel;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 18 + powerLevel * 6, 0, Math.PI * 2);
        ctx.fill();

        // Power corona at high power
        if (powerLevel >= 1.5) {
          ctx.fillStyle = COLORS.rainbow[Math.floor(centerX) % COLORS.rainbow.length];
          ctx.globalAlpha = 0.04 * powerLevel;
          ctx.beginPath();
          ctx.arc(centerX, centerY, 25 + powerLevel * 8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Head glow layers (more layers)
      ctx.fillStyle = COLORS.snakeHeadGlow;
      ctx.globalAlpha = 0.12;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 18, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 0.25;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Head body (rounded rect)
      ctx.fillStyle = COLORS.snakeHead;
      ctx.beginPath();
      ctx.roundRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2, 6);
      ctx.fill();

      // Inner bright core
      ctx.fillStyle = COLORS.snakeHeadCore;
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.roundRect(x + 4, y + 4, CELL_SIZE - 8, CELL_SIZE - 8, 3);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Shiny highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.roundRect(x + 3, y + 3, 8, 5, 3);
      ctx.fill();

      // Prismatic Shield Effect (static version for Canvas2D fallback)
      if (segmentCount >= 3) {
        const shieldIntensity = Math.min((segmentCount - 1) * 0.08, 1);
        const shieldRadius = 35 * powerLevel;
        const nodeCount = 12;

        // Draw rainbow energy nodes orbiting the head
        for (let n = 0; n < nodeCount; n++) {
          const nodeAngle = (n / nodeCount) * Math.PI * 2;
          const nodeX = centerX + Math.cos(nodeAngle) * shieldRadius;
          const nodeY = centerY + Math.sin(nodeAngle) * shieldRadius;
          const nodeColor = COLORS.rainbow[n % COLORS.rainbow.length];

          // Energy beam from center to node
          ctx.strokeStyle = nodeColor;
          ctx.lineWidth = 1;
          ctx.globalAlpha = shieldIntensity * 0.15;
          ctx.beginPath();
          ctx.moveTo(centerX, centerY);
          ctx.lineTo(nodeX, nodeY);
          ctx.stroke();

          // Node glow
          ctx.fillStyle = nodeColor;
          ctx.globalAlpha = shieldIntensity * 0.25;
          ctx.beginPath();
          ctx.arc(nodeX, nodeY, 6, 0, Math.PI * 2);
          ctx.fill();

          // Node core
          ctx.globalAlpha = shieldIntensity * 0.7;
          ctx.beginPath();
          ctx.arc(nodeX, nodeY, 4, 0, Math.PI * 2);
          ctx.fill();

          // Bright center
          ctx.fillStyle = '#ffffff';
          ctx.globalAlpha = shieldIntensity * 0.9;
          ctx.beginPath();
          ctx.arc(nodeX, nodeY, 2, 0, Math.PI * 2);
          ctx.fill();
        }

        // Draw hexagonal shield frame
        if (powerLevel >= 1.3) {
          const hexRadius = shieldRadius;
          const hexSides = 6;

          ctx.strokeStyle = COLORS.snakeHeadGlow;
          ctx.lineWidth = 2;
          ctx.globalAlpha = shieldIntensity * 0.25;
          ctx.beginPath();
          for (let i = 0; i <= hexSides; i++) {
            const angle = (i / hexSides) * Math.PI * 2;
            const hx = centerX + Math.cos(angle) * hexRadius;
            const hy = centerY + Math.sin(angle) * hexRadius;
            if (i === 0) ctx.moveTo(hx, hy);
            else ctx.lineTo(hx, hy);
          }
          ctx.stroke();

          // Vertex energy nodes
          for (let i = 0; i < hexSides; i++) {
            const angle = (i / hexSides) * Math.PI * 2;
            const vertexX = centerX + Math.cos(angle) * hexRadius;
            const vertexY = centerY + Math.sin(angle) * hexRadius;

            ctx.fillStyle = COLORS.rainbow[i % COLORS.rainbow.length];
            ctx.globalAlpha = shieldIntensity * 0.5;
            ctx.beginPath();
            ctx.arc(vertexX, vertexY, 4, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = shieldIntensity * 0.7;
            ctx.beginPath();
            ctx.arc(vertexX, vertexY, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.globalAlpha = 1;
      }

      // DIMENSIONAL VORTEX EFFECT - Swirling temporal distortion around head
      if (!gameState.gameOver && segmentCount >= 2) {
        const vortexIntensity = Math.min((segmentCount - 1) * 0.1, 1);

        // Draw spinning dimensional rift nodes
        for (const node of RIFT_NODES) {
          const pulseRadius = node.radius + Math.sin(node.pulsePhase) * 5;
          const nodeX = centerX + Math.cos(node.angle) * pulseRadius;
          const nodeY = centerY + Math.sin(node.angle) * pulseRadius;

          // Temporal distortion trail (curved arc behind node)
          const trailAngle = node.angle - 0.8;
          const trailX = centerX + Math.cos(trailAngle) * pulseRadius;
          const trailY = centerY + Math.sin(trailAngle) * pulseRadius;

          const trailGrad = ctx.createLinearGradient(trailX, trailY, nodeX, nodeY);
          trailGrad.addColorStop(0, 'transparent');
          trailGrad.addColorStop(1, node.color);
          ctx.strokeStyle = trailGrad;
          ctx.lineWidth = 3;
          ctx.globalAlpha = vortexIntensity * 0.4;
          ctx.beginPath();
          ctx.arc(centerX, centerY, pulseRadius, trailAngle, node.angle);
          ctx.stroke();

          // Node outer glow
          ctx.fillStyle = node.color;
          ctx.globalAlpha = vortexIntensity * 0.2;
          ctx.beginPath();
          ctx.arc(nodeX, nodeY, 8, 0, Math.PI * 2);
          ctx.fill();

          // Node core
          ctx.globalAlpha = vortexIntensity * 0.6;
          ctx.beginPath();
          ctx.arc(nodeX, nodeY, 4, 0, Math.PI * 2);
          ctx.fill();

          // Bright center
          ctx.fillStyle = '#ffffff';
          ctx.globalAlpha = vortexIntensity * 0.9;
          ctx.beginPath();
          ctx.arc(nodeX, nodeY, 2, 0, Math.PI * 2);
          ctx.fill();
        }

        // Central vortex spiral effect
        ctx.strokeStyle = '#00ffff';
        ctx.lineWidth = 2;
        ctx.globalAlpha = vortexIntensity * 0.15;
        ctx.beginPath();
        for (let t = 0; t < Math.PI * 4; t += 0.2) {
          const spiralRadius = 5 + t * 3;
          const spiralAngle = t + now * 0.003;
          const sx = centerX + Math.cos(spiralAngle) * spiralRadius;
          const sy = centerY + Math.sin(spiralAngle) * spiralRadius;
          if (t === 0) ctx.moveTo(sx, sy);
          else ctx.lineTo(sx, sy);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
      }

      // Eye glow
      ctx.fillStyle = '#00ffff';
      ctx.globalAlpha = 0.3;
      const eyeOffset = 4;
      ctx.beginPath();
      ctx.arc(centerX - eyeOffset, centerY - 2, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(centerX + eyeOffset, centerY - 2, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Eyes
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(centerX - eyeOffset, centerY - 2, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(centerX + eyeOffset, centerY - 2, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Pupils
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(centerX - eyeOffset, centerY - 2, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(centerX + eyeOffset, centerY - 2, 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Eye shine
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.beginPath();
      ctx.arc(centerX - eyeOffset - 1, centerY - 3, 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(centerX + eyeOffset - 1, centerY - 3, 1, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Body gradient from bright to dark
      const baseColor = lerpColor(COLORS.snakeBody, COLORS.snakeTail, progress);

      // WAVE ANIMATION: Size pulses along the body like a flowing wave
      const wavePhase = (now * 0.008 + i * 0.5) % (Math.PI * 2);
      const wavePulse = Math.sin(wavePhase) * 0.15 + 1;
      const baseSize = CELL_SIZE - 2 - progress * 3;
      const size = baseSize * wavePulse;
      const offset = (CELL_SIZE - size) / 2;

      // FIRE EFFECT: Calculate fire color based on position (hot near head, cooler at tail)
      const fireIndex = Math.floor(progress * (COLORS.fireGradient.length - 1));
      const fireColor = COLORS.fireGradient[Math.min(fireIndex, COLORS.fireGradient.length - 1)];

      // Outer fire glow for body segments - pulses with wave
      ctx.fillStyle = fireColor;
      ctx.globalAlpha = 0.35 * wavePulse;
      ctx.beginPath();
      ctx.arc(centerX, centerY, size / 2 + 5 + wavePulse * 2, 0, Math.PI * 2);
      ctx.fill();

      // Secondary glow
      ctx.fillStyle = baseColor;
      ctx.globalAlpha = 0.25;
      ctx.beginPath();
      ctx.arc(centerX, centerY, size / 2 + 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Main body segment
      ctx.fillStyle = baseColor;
      ctx.beginPath();
      ctx.roundRect(x + offset, y + offset, size, size, 5);
      ctx.fill();

      // Fire gradient overlay (creates blazing effect)
      ctx.fillStyle = fireColor;
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.roundRect(x + offset, y + offset, size, size, 5);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Rainbow shimmer overlay - wave-based rainbow effect
      const shimmerIndex = Math.floor((i + now * 0.005) % COLORS.rainbow.length);
      const shimmerColor = COLORS.rainbow[shimmerIndex];
      ctx.fillStyle = shimmerColor;
      ctx.globalAlpha = 0.15 + wavePulse * 0.1;
      ctx.beginPath();
      ctx.roundRect(x + offset, y + offset, size, size, 5);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Hot core highlight (brighter near head) - pulses
      const coreIntensity = (1 - progress) * 0.4 * wavePulse;
      if (coreIntensity > 0.1) {
        ctx.fillStyle = COLORS.fireYellow;
        ctx.globalAlpha = coreIntensity;
        ctx.beginPath();
        ctx.roundRect(x + offset + 2, y + offset + 2, size - 4, size - 4, 3);
        ctx.fill();
        ctx.globalAlpha = 1;
      }

      // Subtle highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.roundRect(x + offset + 2, y + offset + 1, size / 2 - 2, size / 3, 2);
      ctx.fill();

      // CHROMATIC ABERRATION SHIMMER - RGB color channel separation for temporal distortion look
      const aberrationAmount = 2 + wavePulse * 1.5;
      const aberrationAlpha = 0.12 * (1 - progress);

      // Cyan channel (offset up-left)
      ctx.fillStyle = '#00ffff';
      ctx.globalAlpha = aberrationAlpha;
      ctx.beginPath();
      ctx.roundRect(x + offset - aberrationAmount, y + offset - aberrationAmount, size, size, 5);
      ctx.fill();

      // Magenta channel (offset down-right)
      ctx.fillStyle = '#ff00ff';
      ctx.globalAlpha = aberrationAlpha * 0.8;
      ctx.beginPath();
      ctx.roundRect(x + offset + aberrationAmount, y + offset + aberrationAmount, size, size, 5);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Energy spark on wave peak (when wavePulse is high)
      if (wavePulse > 1.1 && i % 3 === 0) {
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = (wavePulse - 1) * 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    }
  }

  // QUANTUM ENTANGLEMENT EFFECT - Draw glowing energy threads between non-adjacent segments
  if (segmentCount >= 5 && !gameState.gameOver) {
    const entanglementIntensity = Math.min((segmentCount - 4) * 0.12, 1);

    // Draw quantum threads between every 3rd segment for a web effect
    for (let i = 0; i < segmentCount - 3; i += 2) {
      const seg1 = snake[i];
      const seg2 = snake[Math.min(i + 3, segmentCount - 1)];

      const x1 = seg1.x * CELL_SIZE + CELL_SIZE / 2;
      const y1 = seg1.y * CELL_SIZE + CELL_SIZE / 2;
      const x2 = seg2.x * CELL_SIZE + CELL_SIZE / 2;
      const y2 = seg2.y * CELL_SIZE + CELL_SIZE / 2;

      // Calculate distance - only draw if segments are close enough (not wrapping)
      const dx = x2 - x1;
      const dy = y2 - y1;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < CELL_SIZE * 6) {
        const threadColor = COLORS.quantum[i % COLORS.quantum.length];

        // Outer glow
        ctx.strokeStyle = threadColor;
        ctx.lineWidth = 4;
        ctx.globalAlpha = entanglementIntensity * 0.15;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        // Curved path for more organic look
        const midX = (x1 + x2) / 2 + (Math.random() - 0.5) * 8;
        const midY = (y1 + y2) / 2 + (Math.random() - 0.5) * 8;
        ctx.quadraticCurveTo(midX, midY, x2, y2);
        ctx.stroke();

        // Core thread
        ctx.lineWidth = 2;
        ctx.globalAlpha = entanglementIntensity * 0.4;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.quadraticCurveTo(midX, midY, x2, y2);
        ctx.stroke();

        // Bright inner core
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.globalAlpha = entanglementIntensity * 0.6;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.quadraticCurveTo(midX, midY, x2, y2);
        ctx.stroke();

        // Energy nodes at connection points
        ctx.fillStyle = threadColor;
        ctx.globalAlpha = entanglementIntensity * 0.5;
        ctx.beginPath();
        ctx.arc(x1, y1, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x2, y2, 5, 0, Math.PI * 2);
        ctx.fill();

        // White center for nodes
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = entanglementIntensity * 0.8;
        ctx.beginPath();
        ctx.arc(x1, y1, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x2, y2, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw a central quantum core at the snake's center of mass
    if (segmentCount >= 8) {
      let centerOfMassX = 0;
      let centerOfMassY = 0;
      for (const seg of snake) {
        centerOfMassX += seg.x * CELL_SIZE + CELL_SIZE / 2;
        centerOfMassY += seg.y * CELL_SIZE + CELL_SIZE / 2;
      }
      centerOfMassX /= segmentCount;
      centerOfMassY /= segmentCount;

      // Pulsing quantum core
      const corePulse = 0.7 + Math.sin(Date.now() * 0.003) * 0.3;
      const coreRadius = 12 * entanglementIntensity * corePulse;

      // Outer corona
      for (let ring = 3; ring >= 0; ring--) {
        const ringRadius = coreRadius + ring * 4;
        const ringColor = COLORS.quantum[ring % COLORS.quantum.length];
        ctx.fillStyle = ringColor;
        ctx.globalAlpha = entanglementIntensity * 0.1 * corePulse;
        ctx.beginPath();
        ctx.arc(centerOfMassX, centerOfMassY, ringRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Core glow
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = entanglementIntensity * 0.6 * corePulse;
      ctx.beginPath();
      ctx.arc(centerOfMassX, centerOfMassY, coreRadius * 0.5, 0, Math.PI * 2);
      ctx.fill();

      // Draw energy beams from core to head and tail
      const head = snake[0];
      const tail = snake[segmentCount - 1];
      const headX = head.x * CELL_SIZE + CELL_SIZE / 2;
      const headY = head.y * CELL_SIZE + CELL_SIZE / 2;
      const tailX = tail.x * CELL_SIZE + CELL_SIZE / 2;
      const tailY = tail.y * CELL_SIZE + CELL_SIZE / 2;

      // Beam to head
      const headGrad = ctx.createLinearGradient(centerOfMassX, centerOfMassY, headX, headY);
      headGrad.addColorStop(0, COLORS.quantum[0] + '60');
      headGrad.addColorStop(1, 'transparent');
      ctx.strokeStyle = headGrad;
      ctx.lineWidth = 3;
      ctx.globalAlpha = entanglementIntensity * 0.5;
      ctx.beginPath();
      ctx.moveTo(centerOfMassX, centerOfMassY);
      ctx.lineTo(headX, headY);
      ctx.stroke();

      // Beam to tail
      const tailGrad = ctx.createLinearGradient(centerOfMassX, centerOfMassY, tailX, tailY);
      tailGrad.addColorStop(0, COLORS.quantum[2] + '60');
      tailGrad.addColorStop(1, 'transparent');
      ctx.strokeStyle = tailGrad;
      ctx.globalAlpha = entanglementIntensity * 0.4;
      ctx.beginPath();
      ctx.moveTo(centerOfMassX, centerOfMassY);
      ctx.lineTo(tailX, tailY);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // Neon border glow (only when game is active)
  if (!gameState.gameOver) {
    const borderColor = '#00ffcc';

    // Outer glow layers
    ctx.strokeStyle = borderColor;
    ctx.globalAlpha = 0.08;
    ctx.lineWidth = 6;
    ctx.strokeRect(2, 2, width - 4, height - 4);

    ctx.globalAlpha = 0.15;
    ctx.lineWidth = 4;
    ctx.strokeRect(3, 3, width - 6, height - 6);

    ctx.globalAlpha = 0.3;
    ctx.lineWidth = 2;
    ctx.strokeRect(4, 4, width - 8, height - 8);

    // Corner accent glows
    const cornerSize = 15;
    ctx.fillStyle = borderColor;
    ctx.globalAlpha = 0.2;
    ctx.beginPath();
    ctx.arc(cornerSize, cornerSize, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(width - cornerSize, cornerSize, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cornerSize, height - cornerSize, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(width - cornerSize, height - cornerSize, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Game over overlay with cinematic death effects
  if (gameState.gameOver) {
    // Death ripple effect from snake head position
    if (snake.length > 0) {
      const deathX = snake[0].x * CELL_SIZE + CELL_SIZE / 2;
      const deathY = snake[0].y * CELL_SIZE + CELL_SIZE / 2;

      // Expanding shock rings
      const ringColors = ['#ff0033', '#ff6600', '#ffff00', '#ffffff'];
      for (let r = 0; r < 4; r++) {
        const rippleRadius = 80 + r * 30;
        ctx.strokeStyle = ringColors[r];
        ctx.lineWidth = 4 - r;
        ctx.globalAlpha = 0.4 - r * 0.08;
        ctx.beginPath();
        ctx.arc(deathX, deathY, rippleRadius, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Inner distortion rings
      for (let i = 0; i < 3; i++) {
        const innerRadius = 30 + i * 20;
        ctx.strokeStyle = '#ff0066';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.2;
        ctx.beginPath();
        ctx.arc(deathX, deathY, innerRadius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    // Chromatic aberration effect (color channel shifts)
    ctx.fillStyle = '#ff0000';
    ctx.globalAlpha = 0.06;
    ctx.fillRect(-4, -4, width, height);

    ctx.fillStyle = '#0000ff';
    ctx.globalAlpha = 0.06;
    ctx.fillRect(4, 4, width, height);

    ctx.fillStyle = '#00ffff';
    ctx.globalAlpha = 0.04;
    ctx.fillRect(2, -2, width, height);
    ctx.globalAlpha = 1;

    // Main dark overlay
    ctx.fillStyle = COLORS.gameOverOverlay;
    ctx.fillRect(0, 0, width, height);

    // Red radial gradient from center
    ctx.fillStyle = COLORS.gameOverRed;
    ctx.globalAlpha = 0.15;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, width * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Red vignette with more layers
    ctx.strokeStyle = COLORS.gameOverRed;
    for (let i = 0; i < 12; i++) {
      const intensity = (12 - i) / 12;
      const lineWidth = 3 + (12 - i) * 0.3;
      ctx.lineWidth = lineWidth;
      ctx.globalAlpha = 0.1 * intensity;
      const vOffset = i * 4;
      ctx.strokeRect(vOffset, vOffset, width - vOffset * 2, height - vOffset * 2);
    }

    // Corner glows (larger, more intense)
    ctx.fillStyle = COLORS.gameOverRed;
    ctx.globalAlpha = 0.25;
    ctx.beginPath();
    ctx.arc(0, 0, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(width, 0, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, height, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(width, height, 60, 0, Math.PI * 2);
    ctx.fill();

    // Edge glows
    ctx.globalAlpha = 0.12;
    ctx.beginPath();
    ctx.arc(width / 2, 0, 50, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(width / 2, height, 50, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, height / 2, 50, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(width, height / 2, 50, 0, Math.PI * 2);
    ctx.fill();

    // Death flash overlay (white with red tinge)
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.15;
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#ff0033';
    ctx.globalAlpha = 0.08;
    ctx.fillRect(0, 0, width, height);

    // Draw shatter fragments
    for (const f of SHATTER_FRAGMENTS) {
      ctx.save();
      ctx.translate(f.x, f.y);
      ctx.rotate(f.rotation);

      // Fragment glow
      ctx.fillStyle = f.color;
      ctx.globalAlpha = f.life * 0.4;
      ctx.beginPath();
      ctx.moveTo(0, -f.size);
      ctx.lineTo(f.size * 0.6, f.size * 0.5);
      ctx.lineTo(-f.size * 0.6, f.size * 0.5);
      ctx.closePath();
      ctx.fill();

      // Fragment core
      ctx.globalAlpha = f.life * 0.8;
      ctx.beginPath();
      ctx.moveTo(0, -f.size * 0.7);
      ctx.lineTo(f.size * 0.4, f.size * 0.35);
      ctx.lineTo(-f.size * 0.4, f.size * 0.35);
      ctx.closePath();
      ctx.fill();

      // White edge highlight
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.globalAlpha = f.life * 0.6;
      ctx.beginPath();
      ctx.moveTo(0, -f.size * 0.7);
      ctx.lineTo(f.size * 0.4, f.size * 0.35);
      ctx.stroke();

      ctx.restore();
    }

    // Glitch scanlines effect
    ctx.fillStyle = '#000000';
    for (let y = 0; y < height; y += 4) {
      ctx.globalAlpha = 0.05 + Math.random() * 0.03;
      ctx.fillRect(0, y, width, 1);
    }

    // Random glitch blocks
    for (let i = 0; i < 5; i++) {
      const gx = Math.random() * width;
      const gy = Math.random() * height;
      const gw = 20 + Math.random() * 40;
      const gh = 2 + Math.random() * 6;
      ctx.fillStyle = Math.random() > 0.5 ? '#ff0033' : '#00ffcc';
      ctx.globalAlpha = 0.1 + Math.random() * 0.1;
      ctx.fillRect(gx, gy, gw, gh);
    }

    ctx.globalAlpha = 1;
  }

  // Draw energy discharge lightning effects (always visible during active discharges)
  for (let i = ENERGY_DISCHARGES.length - 1; i >= 0; i--) {
    const discharge = ENERGY_DISCHARGES[i];

    // Draw main lightning bolt with jagged segments
    const segments = 8;
    let prevX = discharge.x;
    let prevY = discharge.y;

    ctx.strokeStyle = discharge.color;
    ctx.lineWidth = 3 * discharge.life;
    ctx.globalAlpha = discharge.life * 0.8;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Outer glow
    ctx.shadowColor = discharge.color;
    ctx.shadowBlur = 15 * discharge.life;

    ctx.beginPath();
    ctx.moveTo(prevX, prevY);

    for (let s = 1; s <= segments; s++) {
      const progress = s / segments;
      const targetX = discharge.x + Math.cos(discharge.angle) * discharge.length * progress;
      const targetY = discharge.y + Math.sin(discharge.angle) * discharge.length * progress;
      const jitter = (1 - progress) * 12 * discharge.life;
      const jitteredX = targetX + (Math.random() - 0.5) * jitter;
      const jitteredY = targetY + (Math.random() - 0.5) * jitter;
      ctx.lineTo(jitteredX, jitteredY);
      prevX = jitteredX;
      prevY = jitteredY;
    }
    ctx.stroke();

    // Draw branches
    for (const branch of discharge.branches) {
      const branchStartX = discharge.x + Math.cos(discharge.angle) * discharge.length * branch.offset;
      const branchStartY = discharge.y + Math.sin(discharge.angle) * discharge.length * branch.offset;

      ctx.lineWidth = 2 * discharge.life;
      ctx.globalAlpha = discharge.life * 0.6;
      ctx.beginPath();
      ctx.moveTo(branchStartX, branchStartY);

      let bx = branchStartX;
      let by = branchStartY;
      const branchSegments = 4;
      for (let bs = 1; bs <= branchSegments; bs++) {
        const bProgress = bs / branchSegments;
        const btx = branchStartX + Math.cos(branch.angle) * branch.length * bProgress;
        const bty = branchStartY + Math.sin(branch.angle) * branch.length * bProgress;
        const bJitter = (1 - bProgress) * 8 * discharge.life;
        bx = btx + (Math.random() - 0.5) * bJitter;
        by = bty + (Math.random() - 0.5) * bJitter;
        ctx.lineTo(bx, by);
      }
      ctx.stroke();
    }

    // White core
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5 * discharge.life;
    ctx.globalAlpha = discharge.life;
    ctx.beginPath();
    ctx.moveTo(discharge.x, discharge.y);
    const endX = discharge.x + Math.cos(discharge.angle) * discharge.length;
    const endY = discharge.y + Math.sin(discharge.angle) * discharge.length;
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Reset shadow
    ctx.shadowBlur = 0;

    // Update discharge
    discharge.life -= 0.06;
    if (discharge.life <= 0) {
      ENERGY_DISCHARGES.splice(i, 1);
    }
  }
  ctx.globalAlpha = 1;

  // Restore from screen shake transform
  ctx.restore();
}

export function GameBoard({ gameState, gridSize }: GameBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
          backgroundColor: '#ffffff',
          scene: SnakeScene,
          pixelArt: true,
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

  // Push state updates to Phaser scene or Canvas 2D fallback
  useEffect(() => {
    pushState();
  }, [pushState]);

  return (
    <div className="canvas-wrapper">
      <canvas
        ref={canvasRef}
        width={gridSize * CELL_SIZE}
        height={gridSize * CELL_SIZE}
      />
    </div>
  );
}
