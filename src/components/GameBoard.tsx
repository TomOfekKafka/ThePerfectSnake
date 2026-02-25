import { useEffect, useRef, useCallback } from 'react';
import './GameBoard.css';
import type { SnakeScene } from './SnakeScene';
import type { TriviaState } from '../game/trivia';

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
  triviaState?: TriviaState;
  onTriviaAnswer?: (index: number) => void;
}

const CELL_SIZE = 20;
const GRID_SIZE = 20;

// Deep Ocean Bioluminescent Theme Colors
const COLORS = {
  // Ocean depths background
  oceanDeep: '#020812',
  oceanMid: '#041525',
  oceanLight: '#082040',

  // Bioluminescent snake
  snakeGlow: '#00ffaa',
  snakeCore: '#40ffc0',
  snakeHead: '#80ffdd',
  snakeEye: '#ffffff',

  // Food - jellyfish orb
  foodGlow: '#ff6090',
  foodCore: '#ffaacc',
  foodPulse: '#ff80b0',

  // Ambient particles
  planktonBlue: '#4080ff',
  planktonCyan: '#00e0ff',
  planktonGreen: '#40ff80',

  // Game over
  gameOverOverlay: 'rgba(2, 8, 18, 0.92)',

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

// Animation frame counter
let frameCount = 0;

// Floating plankton particles
interface PlanktonParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  hue: number;
  alpha: number;
  pulsePhase: number;
  pulseSpeed: number;
}
let planktonParticles: PlanktonParticle[] = [];
const MAX_PLANKTON = 30;

// Water current effect
let currentPhase = 0;

// Snake trail glow
interface TrailSegment {
  x: number;
  y: number;
  alpha: number;
  size: number;
}
let snakeTrail: TrailSegment[] = [];
const MAX_TRAIL = 20;

// Food pulse animation
let foodPulsePhase = 0;

// Explosion/collection effect
interface CollectionBurst {
  x: number;
  y: number;
  particles: { angle: number; dist: number; alpha: number; size: number }[];
  rings: { radius: number; alpha: number }[];
  life: number;
}
let collectionBursts: CollectionBurst[] = [];

// Screen shake
let screenShakeX = 0;
let screenShakeY = 0;
let screenShakeIntensity = 0;

// State tracking
let lastSnakeLength = 0;
let wasGameOver = false;
let effectsInitialized = false;

// HUD state
let hudPulsePhase = 0;
let lastHudScore = 0;
let scoreFlashIntensity = 0;

// Scoreboard state
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

function initEffects(): void {
  if (effectsInitialized) return;
  effectsInitialized = true;

  const width = GRID_SIZE * CELL_SIZE;
  const height = GRID_SIZE * CELL_SIZE;

  // Initialize plankton particles
  planktonParticles = [];
  for (let i = 0; i < MAX_PLANKTON; i++) {
    spawnPlankton(width, height);
  }
}

function spawnPlankton(width: number, height: number): void {
  if (planktonParticles.length >= MAX_PLANKTON) return;

  const hueOptions = [180, 200, 140, 160]; // Cyan, blue, green variations
  planktonParticles.push({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.3,
    vy: (Math.random() - 0.5) * 0.2 - 0.1, // Slight upward drift
    size: 1 + Math.random() * 2,
    hue: hueOptions[Math.floor(Math.random() * hueOptions.length)],
    alpha: 0.3 + Math.random() * 0.4,
    pulsePhase: Math.random() * Math.PI * 2,
    pulseSpeed: 0.02 + Math.random() * 0.03,
  });
}

function updateEffects(gameState: GameState): void {
  const width = GRID_SIZE * CELL_SIZE;
  const height = GRID_SIZE * CELL_SIZE;

  // Update water current phase
  currentPhase += 0.015;

  // Update food pulse
  foodPulsePhase += 0.08;

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

  // Update plankton
  for (const p of planktonParticles) {
    // Add water current influence
    const currentInfluence = Math.sin(currentPhase + p.y * 0.01) * 0.2;
    p.x += p.vx + currentInfluence;
    p.y += p.vy;
    p.pulsePhase += p.pulseSpeed;

    // Wrap around
    if (p.x < -10) p.x = width + 10;
    if (p.x > width + 10) p.x = -10;
    if (p.y < -10) p.y = height + 10;
    if (p.y > height + 10) p.y = -10;
  }

  // Update snake trail
  if (!gameState.gameOver && gameState.snake.length > 0) {
    const head = gameState.snake[0];
    const headX = head.x * CELL_SIZE + CELL_SIZE / 2;
    const headY = head.y * CELL_SIZE + CELL_SIZE / 2;

    if (frameCount % 2 === 0) {
      snakeTrail.unshift({ x: headX, y: headY, alpha: 0.6, size: CELL_SIZE / 2 });
      if (snakeTrail.length > MAX_TRAIL) snakeTrail.pop();
    }
  }

  // Fade trail
  for (const t of snakeTrail) {
    t.alpha *= 0.92;
    t.size *= 0.97;
  }
  snakeTrail = snakeTrail.filter(t => t.alpha > 0.02);

  // Update collection bursts
  for (let i = collectionBursts.length - 1; i >= 0; i--) {
    const burst = collectionBursts[i];
    burst.life -= 0.03;

    for (const p of burst.particles) {
      p.dist += 2;
      p.alpha *= 0.95;
    }

    for (const r of burst.rings) {
      r.radius += 3;
      r.alpha *= 0.9;
    }

    if (burst.life <= 0) {
      collectionBursts.splice(i, 1);
    }
  }
}

function spawnCollectionBurst(x: number, y: number): void {
  const particles: { angle: number; dist: number; alpha: number; size: number }[] = [];
  for (let i = 0; i < 12; i++) {
    particles.push({
      angle: (i / 12) * Math.PI * 2 + Math.random() * 0.3,
      dist: 0,
      alpha: 1,
      size: 2 + Math.random() * 2,
    });
  }

  collectionBursts.push({
    x,
    y,
    particles,
    rings: [
      { radius: 5, alpha: 1 },
      { radius: 3, alpha: 0.7 },
    ],
    life: 1,
  });

  screenShakeIntensity = 5;
}

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
    // localStorage not available
  }
  cachedHighScores = [];
  highScoresLoaded = true;
  return cachedHighScores;
}

function saveHighScore(score: number): number {
  const highScores = loadHighScores();
  const newEntry: HighScoreEntry = { score, date: Date.now(), rank: 0 };

  let insertIndex = highScores.findIndex(entry => score > entry.score);
  if (insertIndex === -1) insertIndex = highScores.length;

  if (insertIndex < MAX_HIGH_SCORES && score > 0) {
    highScores.splice(insertIndex, 0, newEntry);
    highScores.forEach((entry, i) => { entry.rank = i + 1; });
    cachedHighScores = highScores.slice(0, MAX_HIGH_SCORES);

    try {
      localStorage.setItem('snake_high_scores', JSON.stringify(cachedHighScores));
    } catch {
      // localStorage not available
    }
    return insertIndex + 1;
  }
  return -1;
}

function checkAndSaveHighScore(gameState: GameState): void {
  if (gameState.gameOver && !lastGameOverState) {
    const rank = saveHighScore(gameState.score);
    newHighScoreRank = rank > 0 ? rank : -1;
    scoreboardRevealProgress = 0;
  }
  lastGameOverState = gameState.gameOver;

  if (gameState.gameStarted && !gameState.gameOver) {
    newHighScoreRank = -1;
  }
}

function drawHUD(ctx: CanvasRenderingContext2D, gameState: GameState, width: number, height: number): void {
  if (!gameState.gameStarted) return;

  hudPulsePhase += 0.08;

  if (gameState.score > lastHudScore) {
    scoreFlashIntensity = 1;
  }
  lastHudScore = gameState.score;
  scoreFlashIntensity *= 0.92;

  const padding = 12;

  ctx.save();

  // Score panel - ocean themed
  const scorePanelWidth = 120;
  const scorePanelHeight = 50;
  const scoreGradient = ctx.createLinearGradient(padding, padding, padding + scorePanelWidth, padding + scorePanelHeight);
  scoreGradient.addColorStop(0, 'rgba(4, 21, 40, 0.9)');
  scoreGradient.addColorStop(1, 'rgba(8, 32, 64, 0.85)');

  ctx.fillStyle = scoreGradient;
  ctx.beginPath();
  ctx.roundRect(padding, padding, scorePanelWidth, scorePanelHeight, 8);
  ctx.fill();

  // Bioluminescent border
  ctx.strokeStyle = `rgba(0, 255, 170, ${0.6 + scoreFlashIntensity * 0.4})`;
  ctx.lineWidth = 2;
  ctx.shadowColor = '#00ffaa';
  ctx.shadowBlur = 8 + scoreFlashIntensity * 8;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Score label
  ctx.font = 'bold 10px monospace';
  ctx.fillStyle = '#40ffc0';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('SCORE', padding + 10, padding + 8);

  // Score value
  ctx.font = 'bold 22px monospace';
  ctx.shadowColor = '#00ffaa';
  ctx.shadowBlur = 6 + scoreFlashIntensity * 10;
  ctx.fillStyle = `rgb(${64 + Math.round(scoreFlashIntensity * 191)}, 255, ${192 + Math.round(scoreFlashIntensity * 63)})`;
  ctx.fillText(String(gameState.score).padStart(5, '0'), padding + 10, padding + 22);
  ctx.shadowBlur = 0;

  // Length panel
  const lengthPanelWidth = 80;
  const lengthPanelHeight = 50;
  const lengthX = width - padding - lengthPanelWidth;

  const lengthGradient = ctx.createLinearGradient(lengthX, padding, lengthX + lengthPanelWidth, padding + lengthPanelHeight);
  lengthGradient.addColorStop(0, 'rgba(4, 21, 40, 0.9)');
  lengthGradient.addColorStop(1, 'rgba(8, 32, 64, 0.85)');

  ctx.fillStyle = lengthGradient;
  ctx.beginPath();
  ctx.roundRect(lengthX, padding, lengthPanelWidth, lengthPanelHeight, 8);
  ctx.fill();

  ctx.strokeStyle = 'rgba(0, 224, 255, 0.6)';
  ctx.lineWidth = 2;
  ctx.shadowColor = '#00e0ff';
  ctx.shadowBlur = 8;
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.font = 'bold 10px monospace';
  ctx.fillStyle = '#ff80b0';
  ctx.fillText('LENGTH', lengthX + 10, padding + 8);

  ctx.font = 'bold 22px monospace';
  ctx.shadowColor = '#00e0ff';
  ctx.shadowBlur = 6;
  ctx.fillStyle = '#00e0ff';
  ctx.fillText(String(gameState.snake.length), lengthX + 10, padding + 22);
  ctx.shadowBlur = 0;

  // Active power-ups
  const activePowerUps = gameState.activePowerUps || [];
  if (activePowerUps.length > 0) {
    const powerUpY = height - padding - 40;
    const powerUpSpacing = 70;
    const startX = width / 2 - ((activePowerUps.length - 1) * powerUpSpacing) / 2;

    for (let i = 0; i < activePowerUps.length; i++) {
      const powerUp = activePowerUps[i];
      const px = startX + i * powerUpSpacing;
      const colors = POWERUP_COLORS[powerUp.type];
      const tickCount = gameState.tickCount || 0;
      const remainingTicks = Math.max(0, powerUp.endTime - tickCount);
      const remainingSeconds = Math.ceil(remainingTicks / 10);
      const puPulse = Math.sin(hudPulsePhase * 2 + i) * 0.2 + 0.8;

      ctx.fillStyle = colors.glow;
      ctx.globalAlpha = 0.3 * puPulse;
      ctx.beginPath();
      ctx.arc(px, powerUpY, 25, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      const puGradient = ctx.createRadialGradient(px, powerUpY, 0, px, powerUpY, 22);
      puGradient.addColorStop(0, colors.main);
      puGradient.addColorStop(0.6, colors.glow);
      puGradient.addColorStop(1, 'rgba(0, 0, 0, 0.5)');

      ctx.fillStyle = puGradient;
      ctx.beginPath();
      ctx.arc(px, powerUpY, 18 * puPulse, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = colors.main;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, powerUpY, 20, 0, Math.PI * 2);
      ctx.stroke();

      const timerProgress = remainingTicks / 100;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(px, powerUpY, 23, -Math.PI / 2, -Math.PI / 2 + timerProgress * Math.PI * 2);
      ctx.stroke();

      ctx.font = 'bold 14px monospace';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(colors.symbol, px, powerUpY - 1);

      ctx.font = 'bold 10px monospace';
      ctx.fillStyle = remainingSeconds <= 3 ? '#ff6060' : '#ffffff';
      ctx.fillText(`${remainingSeconds}s`, px, powerUpY + 30);
    }
  }

  ctx.restore();
}

function drawScoreboard(ctx: CanvasRenderingContext2D, gameState: GameState, width: number, height: number): void {
  if (!gameState.gameOver) return;

  scoreboardAnimPhase += 0.06;
  scoreboardRevealProgress = Math.min(1, scoreboardRevealProgress + 0.02);

  const highScores = loadHighScores();
  const centerX = width / 2;
  const baseY = height * 0.22;
  const panelWidth = 200;
  const panelHeight = 180;
  const panelX = centerX - panelWidth / 2;
  const panelY = baseY;
  const slideOffset = (1 - scoreboardRevealProgress) * 50;
  const alphaMultiplier = scoreboardRevealProgress;

  ctx.save();
  ctx.translate(0, -slideOffset);
  ctx.globalAlpha = alphaMultiplier;

  // Panel background - deep ocean
  const panelGradient = ctx.createLinearGradient(panelX, panelY, panelX + panelWidth, panelY + panelHeight);
  panelGradient.addColorStop(0, 'rgba(4, 21, 45, 0.95)');
  panelGradient.addColorStop(0.5, 'rgba(8, 32, 60, 0.92)');
  panelGradient.addColorStop(1, 'rgba(4, 21, 45, 0.95)');

  ctx.shadowColor = newHighScoreRank > 0 ? '#ffcc00' : '#00ffaa';
  ctx.shadowBlur = 20 + Math.sin(scoreboardAnimPhase) * 5;

  ctx.fillStyle = panelGradient;
  ctx.beginPath();
  ctx.roundRect(panelX, panelY, panelWidth, panelHeight, 12);
  ctx.fill();

  const borderHue = newHighScoreRank > 0 ? 45 : (160 + Math.sin(scoreboardAnimPhase) * 20);
  ctx.strokeStyle = `hsl(${borderHue}, 100%, 60%)`;
  ctx.lineWidth = 3;
  ctx.shadowColor = `hsl(${borderHue}, 100%, 60%)`;
  ctx.shadowBlur = 12;
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Title
  const titleY = panelY + 25;
  ctx.font = 'bold 14px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.shadowColor = '#00e0ff';
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#00e0ff';
  ctx.fillText('HIGH SCORES', centerX, titleY);

  ctx.strokeStyle = 'rgba(0, 224, 255, 0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(panelX + 30, titleY + 12);
  ctx.lineTo(panelX + panelWidth - 30, titleY + 12);
  ctx.stroke();
  ctx.shadowBlur = 0;

  const entryStartY = titleY + 30;
  const entryHeight = 24;

  if (highScores.length === 0) {
    ctx.font = '10px monospace';
    ctx.fillStyle = 'rgba(100, 200, 220, 0.8)';
    ctx.fillText('No scores yet', centerX, entryStartY + 40);
    ctx.fillText('Be the first!', centerX, entryStartY + 55);
  } else {
    for (let i = 0; i < Math.min(highScores.length, 5); i++) {
      const entry = highScores[i];
      const entryY = entryStartY + i * entryHeight;
      const isNewScore = newHighScoreRank === i + 1;
      const entryDelay = i * 0.15;
      const entryProgress = Math.max(0, Math.min(1, (scoreboardRevealProgress - entryDelay) * 2));
      if (entryProgress <= 0) continue;

      ctx.globalAlpha = alphaMultiplier * entryProgress;

      if (isNewScore) {
        const flashIntensity = 0.3 + Math.sin(scoreboardAnimPhase * 3) * 0.2;
        ctx.fillStyle = `rgba(255, 204, 0, ${flashIntensity})`;
        ctx.beginPath();
        ctx.roundRect(panelX + 10, entryY - 8, panelWidth - 20, entryHeight - 2, 4);
        ctx.fill();
      }

      const rankColors = ['#ffd700', '#c0c0c0', '#cd7f32', '#00ffaa', '#00e0ff'];
      const rankColor = rankColors[i] || '#888888';

      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'left';
      ctx.shadowColor = rankColor;
      ctx.shadowBlur = isNewScore ? 8 : 4;
      ctx.fillStyle = rankColor;
      ctx.fillText(`${i + 1}.`, panelX + 20, entryY);
      ctx.shadowBlur = 0;

      ctx.font = isNewScore ? 'bold 13px monospace' : '12px monospace';
      ctx.textAlign = 'right';
      ctx.fillStyle = isNewScore ? '#ffffff' : '#aaddff';

      if (isNewScore) {
        ctx.shadowColor = '#ffcc00';
        ctx.shadowBlur = 6;
      }
      ctx.fillText(String(entry.score).padStart(5, '0'), panelX + panelWidth - 20, entryY);
      ctx.shadowBlur = 0;

      if (isNewScore) {
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillStyle = `rgba(255, 204, 0, ${0.8 + Math.sin(scoreboardAnimPhase * 4) * 0.2})`;
        ctx.shadowColor = '#ffcc00';
        ctx.shadowBlur = 6;
        ctx.fillText('NEW!', panelX + 65, entryY);
        ctx.shadowBlur = 0;
      }
    }
  }

  ctx.globalAlpha = alphaMultiplier;

  const currentScoreY = panelY + panelHeight - 20;
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.fillStyle = 'rgba(150, 220, 255, 0.8)';
  ctx.fillText('YOUR SCORE', centerX, currentScoreY - 12);

  ctx.font = 'bold 16px monospace';
  ctx.shadowColor = newHighScoreRank > 0 ? '#ffcc00' : '#00ffaa';
  ctx.shadowBlur = 10;
  ctx.fillStyle = newHighScoreRank > 0 ? '#ffcc00' : '#00ffaa';
  ctx.fillText(String(gameState.score).padStart(5, '0'), centerX, currentScoreY + 2);
  ctx.shadowBlur = 0;

  ctx.restore();
}

function drawCanvas2D(canvas: HTMLCanvasElement, gameState: GameState): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  initEffects();
  frameCount++;

  const width = GRID_SIZE * CELL_SIZE;
  const height = GRID_SIZE * CELL_SIZE;

  // Detect food eaten
  if (gameState.snake.length > lastSnakeLength && lastSnakeLength > 0) {
    const head = gameState.snake[0];
    const headX = head.x * CELL_SIZE + CELL_SIZE / 2;
    const headY = head.y * CELL_SIZE + CELL_SIZE / 2;
    spawnCollectionBurst(headX, headY);
  }
  lastSnakeLength = gameState.snake.length;

  // Detect game over
  if (gameState.gameOver && !wasGameOver) {
    screenShakeIntensity = 15;
    snakeTrail = [];
  }
  wasGameOver = gameState.gameOver;

  updateEffects(gameState);

  ctx.save();
  ctx.scale(canvas.width / width, canvas.height / height);

  // Apply screen shake
  if (screenShakeIntensity > 0) {
    ctx.translate(screenShakeX, screenShakeY);
  }

  // Deep ocean gradient background
  const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
  bgGradient.addColorStop(0, COLORS.oceanDeep);
  bgGradient.addColorStop(0.4, COLORS.oceanMid);
  bgGradient.addColorStop(1, COLORS.oceanLight);
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, width, height);

  // Subtle water caustic effect
  ctx.globalAlpha = 0.03;
  for (let i = 0; i < 5; i++) {
    const waveX = (frameCount * 0.5 + i * 80) % (width + 100) - 50;
    const wavePhase = currentPhase + i * 0.8;
    ctx.fillStyle = '#4080aa';
    ctx.beginPath();
    ctx.moveTo(waveX, 0);
    for (let y = 0; y < height; y += 10) {
      const x = waveX + Math.sin(wavePhase + y * 0.02) * 20;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(waveX + 30, height);
    ctx.lineTo(waveX - 30, height);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // Draw plankton particles
  for (const p of planktonParticles) {
    const pulseAlpha = p.alpha * (0.6 + Math.sin(p.pulsePhase) * 0.4);

    // Outer glow
    ctx.fillStyle = `hsla(${p.hue}, 100%, 60%, ${pulseAlpha * 0.3})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Core
    ctx.fillStyle = `hsla(${p.hue}, 100%, 70%, ${pulseAlpha * 0.8})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw snake trail glow
  for (let i = snakeTrail.length - 1; i >= 0; i--) {
    const t = snakeTrail[i];
    const progress = i / snakeTrail.length;

    ctx.fillStyle = `rgba(0, 255, 170, ${t.alpha * 0.2})`;
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.size * 1.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = `rgba(64, 255, 192, ${t.alpha * 0.4 * (1 - progress)})`;
    ctx.beginPath();
    ctx.arc(t.x, t.y, t.size * 0.8, 0, Math.PI * 2);
    ctx.fill();
  }

  // Draw collection bursts
  for (const burst of collectionBursts) {
    // Rings
    for (const ring of burst.rings) {
      ctx.strokeStyle = `rgba(255, 96, 144, ${ring.alpha * 0.6})`;
      ctx.lineWidth = 3 * burst.life;
      ctx.beginPath();
      ctx.arc(burst.x, burst.y, ring.radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(255, 170, 204, ${ring.alpha * 0.8})`;
      ctx.lineWidth = 1.5 * burst.life;
      ctx.stroke();
    }

    // Particles
    for (const p of burst.particles) {
      const px = burst.x + Math.cos(p.angle) * p.dist;
      const py = burst.y + Math.sin(p.angle) * p.dist;

      ctx.fillStyle = `rgba(255, 128, 176, ${p.alpha * burst.life})`;
      ctx.beginPath();
      ctx.arc(px, py, p.size * burst.life, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Draw food - bioluminescent jellyfish orb
  const foodX = gameState.food.x * CELL_SIZE + CELL_SIZE / 2;
  const foodY = gameState.food.y * CELL_SIZE + CELL_SIZE / 2;
  const foodPulse = 0.8 + Math.sin(foodPulsePhase) * 0.2;

  // Food tendrils (subtle)
  ctx.strokeStyle = `rgba(255, 96, 144, ${0.3 * foodPulse})`;
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 4; i++) {
    const tendrilAngle = (i / 4) * Math.PI * 2 + foodPulsePhase * 0.3;
    const tendrilLength = 12 + Math.sin(foodPulsePhase + i) * 4;
    const endX = foodX + Math.sin(tendrilAngle) * 3;
    const endY = foodY + tendrilLength;

    ctx.beginPath();
    ctx.moveTo(foodX, foodY + CELL_SIZE * 0.3);
    ctx.quadraticCurveTo(endX, foodY + tendrilLength * 0.5, endX, endY);
    ctx.stroke();
  }

  // Outer glow
  ctx.shadowColor = COLORS.foodGlow;
  ctx.shadowBlur = 20 * foodPulse;
  const foodGlow = ctx.createRadialGradient(foodX, foodY, 0, foodX, foodY, CELL_SIZE * 1.2);
  foodGlow.addColorStop(0, `rgba(255, 170, 204, ${0.9 * foodPulse})`);
  foodGlow.addColorStop(0.4, `rgba(255, 96, 144, ${0.6 * foodPulse})`);
  foodGlow.addColorStop(1, 'rgba(255, 64, 120, 0)');
  ctx.fillStyle = foodGlow;
  ctx.beginPath();
  ctx.arc(foodX, foodY, CELL_SIZE * foodPulse, 0, Math.PI * 2);
  ctx.fill();

  // Core
  ctx.fillStyle = COLORS.foodCore;
  ctx.beginPath();
  ctx.arc(foodX, foodY, CELL_SIZE * 0.35 * foodPulse, 0, Math.PI * 2);
  ctx.fill();

  // Highlight
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.arc(foodX - 3, foodY - 3, CELL_SIZE * 0.12, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;

  // Draw snake - bioluminescent sea creature
  const snake = gameState.snake;
  const snakeLen = snake.length;

  for (let i = snakeLen - 1; i >= 0; i--) {
    const segment = snake[i];
    const centerX = segment.x * CELL_SIZE + CELL_SIZE / 2;
    const centerY = segment.y * CELL_SIZE + CELL_SIZE / 2;
    const t = snakeLen > 1 ? i / (snakeLen - 1) : 1;

    // Size tapers from head to tail
    const baseSize = CELL_SIZE / 2 - 1;
    const segmentSize = baseSize * (0.6 + t * 0.4);

    // Pulse effect
    const pulse = 0.9 + Math.sin(frameCount * 0.08 + i * 0.3) * 0.1;

    // Direction for head
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

    // Glow intensity - brighter at head
    const glowIntensity = 0.4 + t * 0.6;

    // Outer glow
    ctx.shadowColor = COLORS.snakeGlow;
    ctx.shadowBlur = 12 * glowIntensity * pulse;

    const segGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, segmentSize * 1.8);
    segGlow.addColorStop(0, `rgba(64, 255, 192, ${0.9 * glowIntensity * pulse})`);
    segGlow.addColorStop(0.5, `rgba(0, 255, 170, ${0.5 * glowIntensity * pulse})`);
    segGlow.addColorStop(1, 'rgba(0, 200, 140, 0)');
    ctx.fillStyle = segGlow;
    ctx.beginPath();
    ctx.arc(centerX, centerY, segmentSize * 1.5 * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Core body
    const bodyGrad = ctx.createRadialGradient(
      centerX - segmentSize * 0.2, centerY - segmentSize * 0.2, 0,
      centerX, centerY, segmentSize + 2
    );
    bodyGrad.addColorStop(0, COLORS.snakeHead);
    bodyGrad.addColorStop(0.6, COLORS.snakeCore);
    bodyGrad.addColorStop(1, COLORS.snakeGlow);
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.arc(centerX, centerY, segmentSize * pulse, 0, Math.PI * 2);
    ctx.fill();

    // Head features
    if (i === 0) {
      const perpX = -dy;
      const perpY = dx;
      const eyeOffset = segmentSize * 0.4;
      const eyeForward = segmentSize * 0.3;

      const leftEyeX = centerX + perpX * eyeOffset + dx * eyeForward;
      const leftEyeY = centerY + perpY * eyeOffset + dy * eyeForward;
      const rightEyeX = centerX - perpX * eyeOffset + dx * eyeForward;
      const rightEyeY = centerY - perpY * eyeOffset + dy * eyeForward;

      // Eye glow
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(leftEyeX, leftEyeY, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(rightEyeX, rightEyeY, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Pupils
      ctx.fillStyle = '#002020';
      ctx.shadowBlur = 0;
      ctx.beginPath();
      ctx.arc(leftEyeX + dx * 0.8, leftEyeY + dy * 0.8, 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(rightEyeX + dx * 0.8, rightEyeY + dy * 0.8, 1, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.shadowBlur = 0;
  }

  // Draw power-up if present
  if (gameState.powerUp) {
    const pu = gameState.powerUp;
    const puX = pu.position.x * CELL_SIZE + CELL_SIZE / 2;
    const puY = pu.position.y * CELL_SIZE + CELL_SIZE / 2;
    const colors = POWERUP_COLORS[pu.type];
    const puPulse = 0.8 + Math.sin(frameCount * 0.1) * 0.2;

    ctx.shadowColor = colors.glow;
    ctx.shadowBlur = 15 * puPulse;

    const puGrad = ctx.createRadialGradient(puX, puY, 0, puX, puY, CELL_SIZE * 0.8);
    puGrad.addColorStop(0, colors.main);
    puGrad.addColorStop(0.6, colors.glow);
    puGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = puGrad;
    ctx.beginPath();
    ctx.arc(puX, puY, CELL_SIZE * 0.7 * puPulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(colors.symbol, puX, puY);
    ctx.shadowBlur = 0;
  }

  // HUD
  drawHUD(ctx, gameState, width, height);

  // Game over overlay
  if (gameState.gameOver) {
    ctx.fillStyle = COLORS.gameOverOverlay;
    ctx.fillRect(0, 0, width, height);

    // Floating particles
    ctx.globalAlpha = 0.5;
    const numParticles = 12;
    for (let p = 0; p < numParticles; p++) {
      const angle = (p / numParticles) * Math.PI * 2 + frameCount * 0.02;
      const dist = 100 + Math.sin(frameCount * 0.04 + p) * 20;
      const px = width / 2 + Math.cos(angle) * dist;
      const py = height / 2 + Math.sin(angle) * dist;
      const pHue = (160 + p * 20) % 360;

      ctx.fillStyle = `hsl(${pHue}, 100%, 70%)`;
      ctx.shadowColor = `hsl(${pHue}, 100%, 60%)`;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(px, py, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;

    // X symbol
    const xPulse = 0.6 + Math.sin(frameCount * 0.06) * 0.4;
    const cX = width / 2;
    const cY = height / 2;
    const xSize = 30;

    ctx.strokeStyle = '#ff6090';
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.globalAlpha = xPulse * 0.5;
    ctx.shadowColor = '#ff6090';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(cX - xSize, cY - xSize);
    ctx.lineTo(cX + xSize, cY + xSize);
    ctx.moveTo(cX + xSize, cY - xSize);
    ctx.lineTo(cX - xSize, cY + xSize);
    ctx.stroke();

    ctx.strokeStyle = '#00ffaa';
    ctx.lineWidth = 2;
    ctx.globalAlpha = xPulse;
    ctx.shadowColor = '#00ffaa';
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;

    drawScoreboard(ctx, gameState, width, height);
  }

  checkAndSaveHighScore(gameState);

  // Subtle vignette
  const vignetteGrad = ctx.createRadialGradient(
    width / 2, height / 2, width * 0.3,
    width / 2, height / 2, width * 0.75
  );
  vignetteGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
  vignetteGrad.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
  ctx.fillStyle = vignetteGrad;
  ctx.fillRect(0, 0, width, height);

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
          backgroundColor: '#020812',
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

        canvas.style.width = '100%';
        canvas.style.height = '100%';

        phaserGameRef.current = game;

        const scene = game.scene.getScene('SnakeScene') as SnakeScene;
        if (scene) {
          sceneRef.current = scene;
          scene.updateGameState(gameState);
        } else {
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

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      if (width === 0 || height === 0) return;

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
