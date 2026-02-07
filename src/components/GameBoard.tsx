import { useEffect, useRef } from 'react';
import './GameBoard.css';

interface Position {
  x: number;
  y: number;
}

interface GameState {
  snake: Position[];
  food: Position;
  direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
  gameOver: boolean;
}

interface GameBoardProps {
  gameState: GameState;
  gridSize: number;
}

const CELL_SIZE = 20;

// Enhanced color palette with more vibrant neon colors
const COLORS = {
  bgDark: '#050510',
  bgMid: '#0a0a1a',
  bgLight: '#0f0f2a',
  gridLine: 'rgba(40, 80, 120, 0.15)',
  snakeHead: '#00ffaa',
  snakeHeadGlow: 'rgba(0, 255, 170, 0.8)',
  snakeBody: '#00dd88',
  snakeBodyGlow: 'rgba(0, 221, 136, 0.5)',
  snakeTail: '#00aa66',
  food: '#ff2266',
  foodGlow: 'rgba(255, 34, 102, 0.9)',
  foodCore: '#ff66aa',
  foodRing: '#ff0055',
  gameOverOverlay: 'rgba(5, 5, 16, 0.9)',
  gameOverText: '#ff2266',
  particle: '#00ffcc',
  star: 'rgba(100, 150, 255, 0.8)',
};

// Particle system for trail effects
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: number;
}

// Store particles and effects state
const particles: Particle[] = [];
let lastSnakeHead: Position | null = null;
let foodEatFlash = 0;
let lastScore = 0;
let gameOverTime = 0;
let stars: { x: number; y: number; size: number; speed: number; brightness: number }[] = [];
let starsInitialized = false;

function initStars(width: number, height: number) {
  if (starsInitialized && stars.length > 0) return;
  stars = [];
  for (let i = 0; i < 50; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.5 + 0.5,
      speed: Math.random() * 0.3 + 0.1,
      brightness: Math.random() * 0.5 + 0.3,
    });
  }
  starsInitialized = true;
}

function updateStars(height: number) {
  for (const star of stars) {
    star.y += star.speed;
    if (star.y > height) {
      star.y = 0;
      star.x = Math.random() * height;
    }
    star.brightness = 0.3 + Math.sin(performance.now() * 0.002 + star.x) * 0.2;
  }
}

function drawBackground(ctx: CanvasRenderingContext2D, width: number, height: number, time: number) {
  // Create animated gradient background
  const gradientShift = Math.sin(time * 0.0005) * 0.1;
  const gradient = ctx.createRadialGradient(
    width / 2, height / 2, 0,
    width / 2, height / 2, width * 0.8
  );
  gradient.addColorStop(0, COLORS.bgLight);
  gradient.addColorStop(0.5 + gradientShift, COLORS.bgMid);
  gradient.addColorStop(1, COLORS.bgDark);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Initialize and update stars
  initStars(width, height);
  updateStars(height);

  // Draw animated stars
  for (const star of stars) {
    const twinkle = star.brightness + Math.sin(time * 0.003 + star.x * star.y) * 0.2;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(150, 180, 255, ${twinkle})`;
    ctx.fill();
  }

  // Draw subtle animated grid
  const gridPulse = 0.1 + Math.sin(time * 0.001) * 0.05;
  ctx.strokeStyle = `rgba(40, 80, 120, ${gridPulse})`;
  ctx.lineWidth = 0.5;

  for (let x = 0; x <= width; x += CELL_SIZE) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += CELL_SIZE) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

function spawnParticles(x: number, y: number, count: number, hueBase: number) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 2 + 1;
    particles.push({
      x: x * CELL_SIZE + CELL_SIZE / 2,
      y: y * CELL_SIZE + CELL_SIZE / 2,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 1,
      maxLife: 1,
      size: Math.random() * 3 + 2,
      hue: hueBase + Math.random() * 30 - 15,
    });
  }
}

function updateAndDrawParticles(ctx: CanvasRenderingContext2D) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.95;
    p.vy *= 0.95;
    p.life -= 0.02;

    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }

    const alpha = p.life;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
    ctx.fillStyle = `hsla(${p.hue}, 100%, 70%, ${alpha})`;
    ctx.fill();
  }
}

function getDirectionAngle(direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'): number {
  switch (direction) {
    case 'UP': return -Math.PI / 2;
    case 'DOWN': return Math.PI / 2;
    case 'LEFT': return Math.PI;
    case 'RIGHT': return 0;
  }
}

function drawSnakeHead(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT',
  time: number
) {
  const centerX = x * CELL_SIZE + CELL_SIZE / 2;
  const centerY = y * CELL_SIZE + CELL_SIZE / 2;
  const radius = (CELL_SIZE - 2) / 2;
  const angle = getDirectionAngle(direction);

  // Animated glow effect
  const glowPulse = 12 + Math.sin(time * 0.01) * 3;
  const glow = ctx.createRadialGradient(centerX, centerY, radius * 0.3, centerX, centerY, radius + glowPulse);
  glow.addColorStop(0, COLORS.snakeHeadGlow);
  glow.addColorStop(0.5, 'rgba(0, 255, 170, 0.3)');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(centerX - radius - glowPulse, centerY - radius - glowPulse,
               (radius + glowPulse) * 2, (radius + glowPulse) * 2);

  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(angle);

  // Draw head shape (slightly elongated)
  ctx.beginPath();
  ctx.ellipse(2, 0, radius + 2, radius - 1, 0, 0, Math.PI * 2);

  // Gradient fill
  const headGradient = ctx.createRadialGradient(-3, -3, 0, 0, 0, radius);
  headGradient.addColorStop(0, '#aaffdd');
  headGradient.addColorStop(0.3, COLORS.snakeHead);
  headGradient.addColorStop(1, '#008855');
  ctx.fillStyle = headGradient;
  ctx.fill();

  // Draw tongue (animated)
  const tongueWave = Math.sin(time * 0.02) * 2;
  ctx.strokeStyle = '#ff4466';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(radius, 0);
  ctx.lineTo(radius + 6, tongueWave);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(radius + 6, tongueWave);
  ctx.lineTo(radius + 10, tongueWave - 3);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(radius + 6, tongueWave);
  ctx.lineTo(radius + 10, tongueWave + 3);
  ctx.stroke();

  // Draw eyes
  const eyeOffsetX = 2;
  const eyeOffsetY = 5;

  // Eye whites
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.ellipse(eyeOffsetX, -eyeOffsetY, 4, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(eyeOffsetX, eyeOffsetY, 4, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Pupils (look in movement direction)
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(eyeOffsetX + 1.5, -eyeOffsetY, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(eyeOffsetX + 1.5, eyeOffsetY, 2, 0, Math.PI * 2);
  ctx.fill();

  // Eye shine
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.beginPath();
  ctx.arc(eyeOffsetX, -eyeOffsetY - 1, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(eyeOffsetX, eyeOffsetY - 1, 1, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawSnakeBody(
  ctx: CanvasRenderingContext2D,
  segments: Position[],
  time: number
) {
  if (segments.length < 2) return;

  // Draw connected body segments with rainbow effect
  for (let i = 1; i < segments.length; i++) {
    const segment = segments[i];
    const prevSegment = segments[i - 1];
    const progress = i / segments.length;

    const centerX = segment.x * CELL_SIZE + CELL_SIZE / 2;
    const centerY = segment.y * CELL_SIZE + CELL_SIZE / 2;
    const prevCenterX = prevSegment.x * CELL_SIZE + CELL_SIZE / 2;
    const prevCenterY = prevSegment.y * CELL_SIZE + CELL_SIZE / 2;

    // Calculate radius (tapers toward tail)
    const baseRadius = (CELL_SIZE - 4) / 2;
    const taperFactor = 1 - progress * 0.4;
    const radius = baseRadius * taperFactor;

    // Rainbow hue that shifts over time and position
    const hue = (160 + progress * 60 + time * 0.02) % 360;
    const saturation = 80 - progress * 20;
    const lightness = 55 - progress * 15;

    // Draw glow
    const glowRadius = radius + 6 - progress * 4;
    const glow = ctx.createRadialGradient(centerX, centerY, radius * 0.3, centerX, centerY, glowRadius);
    glow.addColorStop(0, `hsla(${hue}, ${saturation}%, ${lightness}%, 0.6)`);
    glow.addColorStop(1, 'transparent');
    ctx.fillStyle = glow;
    ctx.fillRect(centerX - glowRadius, centerY - glowRadius, glowRadius * 2, glowRadius * 2);

    // Draw connector between segments (if close enough)
    const dx = centerX - prevCenterX;
    const dy = centerY - prevCenterY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < CELL_SIZE * 1.5) {
      const prevRadius = baseRadius * (1 - (i - 1) / segments.length * 0.4);
      ctx.beginPath();
      ctx.lineWidth = Math.min(radius, prevRadius) * 1.8;
      ctx.lineCap = 'round';
      ctx.strokeStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      ctx.moveTo(prevCenterX, prevCenterY);
      ctx.lineTo(centerX, centerY);
      ctx.stroke();
    }

    // Draw segment circle
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);

    // Gradient fill
    const segGradient = ctx.createRadialGradient(
      centerX - radius * 0.3, centerY - radius * 0.3, 0,
      centerX, centerY, radius
    );
    segGradient.addColorStop(0, `hsl(${hue}, ${saturation}%, ${lightness + 30}%)`);
    segGradient.addColorStop(0.4, `hsl(${hue}, ${saturation}%, ${lightness}%)`);
    segGradient.addColorStop(1, `hsl(${hue}, ${saturation - 10}%, ${lightness - 20}%)`);

    ctx.fillStyle = segGradient;
    ctx.fill();

    // Add shine
    ctx.beginPath();
    ctx.arc(centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fill();
  }
}

function drawFood(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
  const centerX = x * CELL_SIZE + CELL_SIZE / 2;
  const centerY = y * CELL_SIZE + CELL_SIZE / 2;

  // Multi-layer pulsing effect
  const pulse1 = Math.sin(time * 0.006) * 0.15 + 0.85;
  const pulse2 = Math.sin(time * 0.004 + 1) * 0.1 + 0.9;
  const radius = ((CELL_SIZE - 2) / 2) * pulse1;

  // Outer glow rings (multiple layers)
  for (let ring = 3; ring >= 1; ring--) {
    const ringSize = 12 + ring * 8 + Math.sin(time * 0.005 + ring) * 4;
    const ringAlpha = 0.3 - ring * 0.08;
    const outerGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, ringSize);
    outerGlow.addColorStop(0, `rgba(255, 34, 102, ${ringAlpha})`);
    outerGlow.addColorStop(0.6, `rgba(255, 0, 85, ${ringAlpha * 0.5})`);
    outerGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = outerGlow;
    ctx.beginPath();
    ctx.arc(centerX, centerY, ringSize, 0, Math.PI * 2);
    ctx.fill();
  }

  // Orbiting particles
  const orbitRadius = radius + 10;
  for (let i = 0; i < 6; i++) {
    const angle = time * 0.003 + (i * Math.PI * 2) / 6;
    const orbitX = centerX + Math.cos(angle) * orbitRadius;
    const orbitY = centerY + Math.sin(angle) * orbitRadius * pulse2;
    const particleSize = 2 + Math.sin(time * 0.01 + i * 2) * 1;

    ctx.beginPath();
    ctx.arc(orbitX, orbitY, particleSize, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 150, 200, ${0.6 + Math.sin(time * 0.008 + i) * 0.4})`;
    ctx.fill();
  }

  // Main food body with enhanced gradient
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);

  const foodGradient = ctx.createRadialGradient(
    centerX - radius * 0.4, centerY - radius * 0.4, 0,
    centerX, centerY, radius
  );
  foodGradient.addColorStop(0, '#ffffff');
  foodGradient.addColorStop(0.2, '#ffaacc');
  foodGradient.addColorStop(0.5, COLORS.foodCore);
  foodGradient.addColorStop(1, COLORS.food);

  ctx.fillStyle = foodGradient;
  ctx.fill();

  // Inner shine
  ctx.beginPath();
  ctx.arc(centerX - radius * 0.3, centerY - radius * 0.3, radius * 0.35, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
  ctx.fill();

  // Sparkle cross effect
  const sparkleSize = 4 + Math.sin(time * 0.015) * 2;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';

  // Vertical line
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - sparkleSize);
  ctx.lineTo(centerX, centerY + sparkleSize);
  ctx.stroke();

  // Horizontal line
  ctx.beginPath();
  ctx.moveTo(centerX - sparkleSize, centerY);
  ctx.lineTo(centerX + sparkleSize, centerY);
  ctx.stroke();
}

function drawFoodEatFlash(ctx: CanvasRenderingContext2D, width: number, height: number, intensity: number) {
  if (intensity <= 0) return;

  const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width);
  gradient.addColorStop(0, `rgba(255, 100, 150, ${intensity * 0.3})`);
  gradient.addColorStop(0.5, `rgba(255, 50, 100, ${intensity * 0.15})`);
  gradient.addColorStop(1, 'transparent');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

function drawGameOver(ctx: CanvasRenderingContext2D, width: number, height: number, time: number, startTime: number) {
  const elapsed = time - startTime;
  const fadeIn = Math.min(elapsed / 500, 1);

  // Animated dark overlay
  ctx.fillStyle = `rgba(5, 5, 16, ${0.85 * fadeIn})`;
  ctx.fillRect(0, 0, width, height);

  // Screen shake effect (early)
  const shakeIntensity = Math.max(0, 1 - elapsed / 300) * 3;
  const shakeX = Math.sin(elapsed * 0.5) * shakeIntensity;
  const shakeY = Math.cos(elapsed * 0.7) * shakeIntensity;

  ctx.save();
  ctx.translate(shakeX, shakeY);

  // Pulsing glow behind text
  const glowPulse = 30 + Math.sin(time * 0.005) * 10;

  // Game over text with animated effects
  ctx.shadowColor = COLORS.gameOverText;
  ctx.shadowBlur = glowPulse;
  ctx.fillStyle = COLORS.gameOverText;
  ctx.font = 'bold 36px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Scale animation
  const scale = 1 + Math.sin(time * 0.003) * 0.05;
  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.scale(scale * fadeIn, scale * fadeIn);
  ctx.fillText('GAME OVER', 0, 0);
  ctx.restore();

  // Subtitle
  ctx.shadowBlur = 10;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = '16px Arial';
  const subtitleAlpha = Math.min((elapsed - 300) / 500, 1);
  if (subtitleAlpha > 0) {
    ctx.globalAlpha = subtitleAlpha * fadeIn;
    ctx.fillText('Press any key to restart', width / 2, height / 2 + 40);
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

export function GameBoard({ gameState, gridSize }: GameBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const scoreRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const render = () => {
      const time = performance.now();
      const width = canvas.width;
      const height = canvas.height;

      // Detect food eaten (score increased)
      if (scoreRef.current !== lastScore) {
        const head = gameState.snake[0];
        if (head) {
          spawnParticles(head.x, head.y, 15, 340); // Pink particles
        }
        foodEatFlash = 1;
        lastScore = scoreRef.current;
      }

      // Spawn trail particles from snake head movement
      const currentHead = gameState.snake[0];
      if (currentHead && lastSnakeHead &&
          (currentHead.x !== lastSnakeHead.x || currentHead.y !== lastSnakeHead.y)) {
        spawnParticles(lastSnakeHead.x, lastSnakeHead.y, 3, 160); // Green particles
      }
      lastSnakeHead = currentHead ? { ...currentHead } : null;

      // Update food eat flash
      if (foodEatFlash > 0) {
        foodEatFlash -= 0.05;
      }

      // Track game over timing
      if (gameState.gameOver && gameOverTime === 0) {
        gameOverTime = time;
      } else if (!gameState.gameOver) {
        gameOverTime = 0;
      }

      // Draw background with grid and stars
      drawBackground(ctx, width, height, time);

      // Draw food eat flash effect
      drawFoodEatFlash(ctx, width, height, foodEatFlash);

      // Draw and update particles
      updateAndDrawParticles(ctx);

      // Draw food with animation
      drawFood(ctx, gameState.food.x, gameState.food.y, time);

      // Draw snake body (all segments except head)
      drawSnakeBody(ctx, gameState.snake, time);

      // Draw snake head on top
      if (gameState.snake.length > 0) {
        const head = gameState.snake[0];
        drawSnakeHead(ctx, head.x, head.y, gameState.direction, time);
      }

      // Draw game over overlay if needed
      if (gameState.gameOver) {
        drawGameOver(ctx, width, height, time, gameOverTime);
      }

      animationRef.current = time;
      animationId = requestAnimationFrame(render);
    };

    // Reset score tracking when game restarts
    scoreRef.current = 0;
    lastScore = 0;

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [gameState, gridSize]);

  // Track score changes
  useEffect(() => {
    // Access score through the extended gameState if available
    const extendedState = gameState as GameState & { score?: number };
    if (extendedState.score !== undefined) {
      scoreRef.current = extendedState.score;
    }
  }, [gameState]);

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
