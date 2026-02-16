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

// Color palette matching SnakeScene - enhanced neon cyberpunk theme
const COLORS = {
  bgDark: '#050510',
  bgMid: '#0a0a1a',
  gridLine: '#1a1a3e',
  gridAccent: '#2a2a6e',
  snakeHead: '#00ffaa',
  snakeBody: '#00dd88',
  snakeTail: '#00aa66',
  snakeHighlight: '#88ffcc',
  snakeEye: '#ffffff',
  snakePupil: '#000000',
  snakeGlow: '#00ff88',
  food: '#ff2266',
  foodCore: '#ffaacc',
  foodGlow: '#ff4488',
  gameOverOverlay: 'rgba(0, 0, 0, 0.7)',
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
}

function drawCanvas2D(canvas: HTMLCanvasElement, gameState: GameState): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  initCanvas2DEffects();
  frameCount++;
  const hueOffset = (frameCount * 0.5) % 360;

  const width = GRID_SIZE * CELL_SIZE;
  const height = GRID_SIZE * CELL_SIZE;

  // Detect food eaten (snake got longer)
  if (gameState.snake.length > lastSnakeLength && lastSnakeLength > 0) {
    const head = gameState.snake[0];
    const headX = head.x * CELL_SIZE + CELL_SIZE / 2;
    const headY = head.y * CELL_SIZE + CELL_SIZE / 2;
    spawnBurstParticles(headX, headY, hueOffset);
    chromaticIntensity = 1.0;
    energyFieldPulse = 1.0;
    // Spawn extra lightning on food eat
    spawnLightningBetweenSegments(gameState.snake, hueOffset);
  }
  lastSnakeLength = gameState.snake.length;

  // Spawn periodic lightning between segments
  lightningTimer++;
  if (lightningTimer >= 8 && gameState.snake.length > 1 && !gameState.gameOver) {
    lightningTimer = 0;
    spawnLightningBetweenSegments(gameState.snake, hueOffset);
  }

  // Detect game over transition
  if (gameState.gameOver && !wasGameOver) {
    screenShakeIntensity = 15;
    chromaticIntensity = 2.0;
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

  // Deep space background
  ctx.fillStyle = COLORS.bgDark;
  ctx.fillRect(0, 0, width, height);

  // Draw nebula clouds
  for (const cloud of nebulaClouds) {
    cloud.x += cloud.driftX;
    cloud.y += cloud.driftY;
    cloud.pulsePhase += cloud.pulseSpeed;

    if (cloud.x < -cloud.radius) cloud.x = width + cloud.radius;
    if (cloud.x > width + cloud.radius) cloud.x = -cloud.radius;
    if (cloud.y < -cloud.radius) cloud.y = height + cloud.radius;
    if (cloud.y > height + cloud.radius) cloud.y = -cloud.radius;

    const pulseAlpha = cloud.alpha * (0.7 + Math.sin(cloud.pulsePhase) * 0.3);
    const nebulaColor = hslToRgb(cloud.hue / 360, 0.6, 0.3);

    const layers = 4;
    for (let i = layers; i > 0; i--) {
      const layerRadius = cloud.radius * (i / layers);
      const layerAlpha = pulseAlpha * (1 - i / (layers + 1)) * 0.6;
      ctx.fillStyle = nebulaColor;
      ctx.globalAlpha = layerAlpha;
      ctx.beginPath();
      ctx.arc(cloud.x, cloud.y, layerRadius, 0, Math.PI * 2);
      ctx.fill();
    }

    const coreColor = hslToRgb(cloud.hue / 360, 0.8, 0.5);
    ctx.fillStyle = coreColor;
    ctx.globalAlpha = pulseAlpha * 0.4;
    ctx.beginPath();
    ctx.arc(cloud.x, cloud.y, cloud.radius * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Draw cosmic vortex
  const centerX = width / 2;
  const centerY = height / 2;
  vortexPulse += 0.03;
  const globalPulse = 0.8 + Math.sin(vortexPulse) * 0.2;

  // Outer glow
  const outerGlowColor = hslToRgb(280 / 360, 0.7, 0.3);
  ctx.fillStyle = outerGlowColor;
  ctx.globalAlpha = 0.08 * globalPulse;
  ctx.beginPath();
  ctx.arc(centerX, centerY, 120, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.05 * globalPulse;
  ctx.beginPath();
  ctx.arc(centerX, centerY, 140, 0, Math.PI * 2);
  ctx.fill();

  // Draw orbiting particles
  for (const particle of vortexParticles) {
    particle.angle += particle.speed;
    particle.radius = particle.baseRadius + Math.sin(particle.angle * 3) * 8;
    particle.hue = (particle.hue + 0.5) % 360;

    const px = centerX + Math.cos(particle.angle) * particle.radius;
    const py = centerY + Math.sin(particle.angle) * particle.radius;
    const particleColor = hslToRgb(particle.hue / 360, 0.8, 0.6);

    // Trail
    const trailAngle = particle.angle - 0.3;
    const trailX = centerX + Math.cos(trailAngle) * particle.radius;
    const trailY = centerY + Math.sin(trailAngle) * particle.radius;
    ctx.strokeStyle = particleColor;
    ctx.lineWidth = particle.size * 0.8;
    ctx.globalAlpha = particle.alpha * 0.3 * globalPulse;
    ctx.beginPath();
    ctx.moveTo(trailX, trailY);
    ctx.lineTo(px, py);
    ctx.stroke();

    // Particle
    ctx.fillStyle = particleColor;
    ctx.globalAlpha = particle.alpha * globalPulse;
    ctx.beginPath();
    ctx.arc(px, py, particle.size, 0, Math.PI * 2);
    ctx.fill();

    // Bright core
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = particle.alpha * 0.5 * globalPulse;
    ctx.beginPath();
    ctx.arc(px, py, particle.size * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw rotating rings
  for (const ring of vortexRings) {
    ring.rotationOffset += ring.rotationSpeed;
    ring.pulsePhase += 0.02;

    const ringPulse = 0.7 + Math.sin(ring.pulsePhase) * 0.3;
    const adjustedRadius = ring.baseRadius * (0.95 + ringPulse * 0.1);
    const ringColor = hslToRgb(ring.hue / 360, 0.8, 0.5);

    const segments = 6;
    const arcLength = (Math.PI * 2) / segments * 0.7;

    for (let i = 0; i < segments; i++) {
      const startAngle = ring.rotationOffset + (i * Math.PI * 2) / segments;
      const endAngle = startAngle + arcLength;
      const segmentAlpha = 0.15 + Math.sin(startAngle + frameCount * 0.02) * 0.1;

      ctx.strokeStyle = ringColor;
      ctx.lineWidth = ring.thickness;
      ctx.globalAlpha = segmentAlpha * ringPulse * globalPulse;
      ctx.beginPath();
      ctx.arc(centerX, centerY, adjustedRadius, startAngle, endAngle);
      ctx.stroke();
    }
  }

  // Central dark core
  ctx.fillStyle = '#000000';
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.arc(centerX, centerY, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.arc(centerX, centerY, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.4;
  ctx.beginPath();
  ctx.arc(centerX, centerY, 25, 0, Math.PI * 2);
  ctx.fill();

  // Accretion ring
  const accretionHue = (frameCount * 2) % 360;
  const accretionColor = hslToRgb(accretionHue / 360, 1, 0.6);
  ctx.strokeStyle = accretionColor;
  ctx.lineWidth = 2;
  ctx.globalAlpha = 0.4 * globalPulse;
  ctx.beginPath();
  ctx.arc(centerX, centerY, 14, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.3 * globalPulse;
  ctx.beginPath();
  ctx.arc(centerX, centerY, 13, 0, Math.PI * 2);
  ctx.stroke();

  // Gravitational lensing streaks
  for (let i = 0; i < 4; i++) {
    const streakAngle = (i * Math.PI * 2) / 4 + frameCount * 0.01;
    const streakHue = (accretionHue + i * 60) % 360;
    const streakColor = hslToRgb(streakHue / 360, 0.9, 0.7);

    const innerRadius = 20;
    const outerRadius = 35 + Math.sin(frameCount * 0.05 + i) * 10;

    const x1 = centerX + Math.cos(streakAngle) * innerRadius;
    const y1 = centerY + Math.sin(streakAngle) * innerRadius;
    const x2 = centerX + Math.cos(streakAngle + 0.2) * outerRadius;
    const y2 = centerY + Math.sin(streakAngle + 0.2) * outerRadius;

    ctx.strokeStyle = streakColor;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.15 * globalPulse;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.2 * globalPulse;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Draw aurora waves
  for (const aurora of auroraWaves) {
    aurora.phase += aurora.speed;

    const shiftedHue = (aurora.hue + Math.sin(aurora.phase * 0.5) * 20) % 360;
    const auroraColor = hslToRgb(shiftedHue / 360, 0.7, 0.5);

    ctx.fillStyle = auroraColor;
    ctx.globalAlpha = 0.06;
    const step = 4;
    for (let x = 0; x < width; x += step) {
      const wave1 = Math.sin(x * 0.02 + aurora.phase) * aurora.amplitude;
      const wave2 = Math.sin(x * 0.035 + aurora.phase * 1.3) * aurora.amplitude * 0.5;
      const wave3 = Math.sin(x * 0.01 + aurora.phase * 0.7) * aurora.amplitude * 0.3;
      const yOffset = wave1 + wave2 + wave3;
      const segmentY = aurora.y + yOffset;
      const thickness = aurora.thickness * (0.7 + Math.sin(x * 0.05 + aurora.phase) * 0.3);
      ctx.fillRect(x, segmentY - thickness / 2, step + 1, thickness);
    }
  }
  ctx.globalAlpha = 1;

  // Radial gradient effect in center
  const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width * 0.6);
  gradient.addColorStop(0, 'rgba(10, 10, 26, 0.2)');
  gradient.addColorStop(1, 'rgba(5, 5, 16, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Main grid lines
  ctx.strokeStyle = COLORS.gridLine;
  ctx.globalAlpha = 0.2;
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

  // Accent lines every 5 cells
  ctx.strokeStyle = COLORS.gridAccent;
  ctx.globalAlpha = 0.25;
  for (let i = 0; i <= GRID_SIZE; i += 5) {
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

  // Food with enhanced glow
  const foodX = gameState.food.x * CELL_SIZE + CELL_SIZE / 2;
  const foodY = gameState.food.y * CELL_SIZE + CELL_SIZE / 2;

  // Multi-layer glow
  ctx.fillStyle = COLORS.foodGlow;
  ctx.globalAlpha = 0.2;
  ctx.beginPath();
  ctx.arc(foodX, foodY, CELL_SIZE / 2 + 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.4;
  ctx.beginPath();
  ctx.arc(foodX, foodY, CELL_SIZE / 2 + 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = COLORS.food;
  ctx.beginPath();
  ctx.arc(foodX, foodY, CELL_SIZE / 2, 0, Math.PI * 2);
  ctx.fill();

  // Bright core highlight
  ctx.fillStyle = COLORS.foodCore;
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.arc(foodX - 2, foodY - 2, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Snake with rainbow effects
  const snake = gameState.snake;
  const snakeLen = snake.length;

  // Draw trailing rainbow glow first
  for (let i = snakeLen - 1; i >= 0; i--) {
    const segment = snake[i];
    const centerX = segment.x * CELL_SIZE + CELL_SIZE / 2;
    const centerY = segment.y * CELL_SIZE + CELL_SIZE / 2;
    const t = snakeLen > 1 ? i / (snakeLen - 1) : 1;
    const glowAlpha = 0.2 * t;
    const glowSize = (CELL_SIZE / 2 + 4) * (0.5 + t * 0.5);

    const segmentHue = (hueOffset + (i * 15)) % 360;
    ctx.fillStyle = hslToRgb(segmentHue / 360, 0.9, 0.6);
    ctx.globalAlpha = glowAlpha;
    ctx.beginPath();
    ctx.arc(centerX, centerY, glowSize, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Draw snake segments with rainbow gradient
  for (let i = snakeLen - 1; i >= 0; i--) {
    const segment = snake[i];
    const centerX = segment.x * CELL_SIZE + CELL_SIZE / 2;
    const centerY = segment.y * CELL_SIZE + CELL_SIZE / 2;

    const t = snakeLen > 1 ? i / (snakeLen - 1) : 1;
    const radius = (CELL_SIZE / 2 - 1) * (0.85 + t * 0.15);

    if (i === 0) {
      // Dynamic head color
      const headHue = (hueOffset + 120) % 360;
      const headColor = hslToRgb(headHue / 360, 0.9, 0.55);

      // Outer plasma corona
      const coronaHue = (hueOffset + 90) % 360;
      const coronaColor = hslToRgb(coronaHue / 360, 1, 0.6);
      ctx.fillStyle = coronaColor;
      ctx.globalAlpha = 0.15 + Math.sin(frameCount * 0.2) * 0.05;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 10, 0, Math.PI * 2);
      ctx.fill();

      // Head glow
      ctx.fillStyle = headColor;
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 5, 0, Math.PI * 2);
      ctx.fill();

      // Head base
      ctx.globalAlpha = 1;
      ctx.fillStyle = headColor;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 1, 0, Math.PI * 2);
      ctx.fill();

      // Plasma core effect - swirling inner energy
      const coreRadius = radius * 0.6;
      const plasmaPhase = frameCount * 0.15;
      for (let p = 0; p < 3; p++) {
        const plasmaAngle = plasmaPhase + (p * Math.PI * 2) / 3;
        const plasmaX = centerX + Math.cos(plasmaAngle) * coreRadius * 0.4;
        const plasmaY = centerY + Math.sin(plasmaAngle) * coreRadius * 0.4;
        const plasmaHue = (headHue + 40 + p * 20) % 360;
        ctx.fillStyle = hslToRgb(plasmaHue / 360, 1, 0.7);
        ctx.globalAlpha = 0.5 + Math.sin(plasmaPhase + p) * 0.2;
        ctx.beginPath();
        ctx.arc(plasmaX, plasmaY, coreRadius * 0.35, 0, Math.PI * 2);
        ctx.fill();
      }

      // Head highlight
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc(centerX - 2, centerY - 2, radius * 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Eyes
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
      const eyeForward = 3;

      const leftEyeX = centerX + perpX * eyeOffset + dx * eyeForward;
      const leftEyeY = centerY + perpY * eyeOffset + dy * eyeForward;
      ctx.fillStyle = COLORS.snakeEye;
      ctx.beginPath();
      ctx.arc(leftEyeX, leftEyeY, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = COLORS.snakePupil;
      ctx.beginPath();
      ctx.arc(leftEyeX + dx, leftEyeY + dy, 1.5, 0, Math.PI * 2);
      ctx.fill();

      const rightEyeX = centerX - perpX * eyeOffset + dx * eyeForward;
      const rightEyeY = centerY - perpY * eyeOffset + dy * eyeForward;
      ctx.fillStyle = COLORS.snakeEye;
      ctx.beginPath();
      ctx.arc(rightEyeX, rightEyeY, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = COLORS.snakePupil;
      ctx.beginPath();
      ctx.arc(rightEyeX + dx, rightEyeY + dy, 1.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Body segment with rainbow color
      const segmentHue = (hueOffset + (i * 15)) % 360;
      const segmentColor = hslToRgb(segmentHue / 360, 0.8, 0.5);

      // Body glow
      ctx.fillStyle = segmentColor;
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 2, 0, Math.PI * 2);
      ctx.fill();

      // Body segment
      ctx.globalAlpha = 1;
      ctx.fillStyle = segmentColor;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();

      // Highlight on segment
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 0.25 * t;
      ctx.beginPath();
      ctx.arc(centerX - 1, centerY - 1, radius * 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  // Draw energy field around snake
  if (energyFieldPulse > 0 || true) {
    const baseIntensity = 0.08 + energyFieldPulse * 0.3;
    const pulseOffset = Math.sin(frameCount * 0.1) * 0.03;
    const fieldAlpha = Math.min(0.4, baseIntensity + pulseOffset);

    for (let i = 0; i < snake.length; i++) {
      const seg = snake[i];
      const cx = seg.x * CELL_SIZE + CELL_SIZE / 2;
      const cy = seg.y * CELL_SIZE + CELL_SIZE / 2;
      const fieldRadius = CELL_SIZE * (0.8 + energyFieldPulse * 0.6) + Math.sin(frameCount * 0.15 + i * 0.5) * 3;
      const segmentHue = (hueOffset + i * 15) % 360;
      const fieldColor = hslToRgb(segmentHue / 360, 0.7, 0.5);

      ctx.fillStyle = fieldColor;
      ctx.globalAlpha = fieldAlpha * 0.3;
      ctx.beginPath();
      ctx.arc(cx, cy, fieldRadius + 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = fieldAlpha * 0.5;
      ctx.beginPath();
      ctx.arc(cx, cy, fieldRadius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // Draw lightning bolts between segments
  for (const bolt of lightningBolts) {
    const boltColor = hslToRgb(bolt.hue / 360, 1, 0.7);
    const coreColor = '#ffffff';

    // Outer glow
    ctx.strokeStyle = boltColor;
    ctx.lineWidth = 6;
    ctx.globalAlpha = bolt.life * bolt.intensity * 0.3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(bolt.segments[0].x, bolt.segments[0].y);
    for (let i = 1; i < bolt.segments.length; i++) {
      ctx.lineTo(bolt.segments[i].x, bolt.segments[i].y);
    }
    ctx.stroke();

    // Main bolt
    ctx.strokeStyle = boltColor;
    ctx.lineWidth = 3;
    ctx.globalAlpha = bolt.life * bolt.intensity * 0.7;
    ctx.beginPath();
    ctx.moveTo(bolt.segments[0].x, bolt.segments[0].y);
    for (let i = 1; i < bolt.segments.length; i++) {
      ctx.lineTo(bolt.segments[i].x, bolt.segments[i].y);
    }
    ctx.stroke();

    // White-hot core
    ctx.strokeStyle = coreColor;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = bolt.life * bolt.intensity * 0.9;
    ctx.beginPath();
    ctx.moveTo(bolt.segments[0].x, bolt.segments[0].y);
    for (let i = 1; i < bolt.segments.length; i++) {
      ctx.lineTo(bolt.segments[i].x, bolt.segments[i].y);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Draw scanline effect (subtle CRT aesthetic)
  const scanGradient = ctx.createLinearGradient(0, scanlineY - 15, 0, scanlineY + 15);
  scanGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
  scanGradient.addColorStop(0.4, 'rgba(200, 255, 255, 0.04)');
  scanGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.08)');
  scanGradient.addColorStop(0.6, 'rgba(200, 255, 255, 0.04)');
  scanGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = scanGradient;
  ctx.fillRect(0, scanlineY - 15, width, 30);

  // Draw burst particles
  for (const p of burstParticles) {
    const burstColor = hslToRgb(p.hue / 360, 1, 0.6);

    // Draw trail
    for (let i = 0; i < p.trail.length; i++) {
      const t = p.trail[i];
      const trailAlpha = p.life * 0.5 * (1 - i / p.trail.length);
      const trailSize = p.size * p.life * (1 - i / p.trail.length);
      ctx.fillStyle = burstColor;
      ctx.globalAlpha = trailAlpha;
      ctx.beginPath();
      ctx.arc(t.x, t.y, trailSize, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw particle
    ctx.fillStyle = burstColor;
    ctx.globalAlpha = p.life * 0.8;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = p.life * 0.9;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Draw chromatic aberration effect
  if (chromaticIntensity > 0) {
    const offset = chromaticIntensity * 3;
    for (let i = 0; i < snake.length; i++) {
      const seg = snake[i];
      const cx = seg.x * CELL_SIZE + CELL_SIZE / 2;
      const cy = seg.y * CELL_SIZE + CELL_SIZE / 2;
      const t = snakeLen > 1 ? i / (snakeLen - 1) : 1;
      const radius = (CELL_SIZE / 2 - 1) * (0.85 + t * 0.15);
      const alpha = chromaticIntensity * 0.4 * (i === 0 ? 1 : 0.6);

      // Red channel - offset left
      ctx.fillStyle = '#ff0000';
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(cx - offset, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      // Blue channel - offset right
      ctx.fillStyle = '#0000ff';
      ctx.beginPath();
      ctx.arc(cx + offset, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      // Cyan channel - offset up
      ctx.fillStyle = '#00ffff';
      ctx.globalAlpha = alpha * 0.5;
      ctx.beginPath();
      ctx.arc(cx, cy - offset * 0.7, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // Game over overlay
  if (gameState.gameOver) {
    ctx.fillStyle = COLORS.gameOverOverlay;
    ctx.fillRect(0, 0, width, height);

    // Border glow effect
    ctx.strokeStyle = '#ff3366';
    ctx.lineWidth = 4;
    ctx.globalAlpha = 0.5;
    ctx.strokeRect(2, 2, width - 4, height - 4);
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
