import { useEffect, useRef } from 'react';
import type { Position } from '../game/types';
import { CELL_SIZE } from '../game/constants';
import './GameBoard.css';

interface GameBoardState {
  snake: Position[];
  food: Position;
}

interface GameBoardProps {
  gameState: GameBoardState;
  gridSize: number;
  gameOver?: boolean;
}

// Color palette for neon snake game
const COLORS = {
  background: '#0a0a0f',
  gridLine: 'rgba(0, 255, 136, 0.08)',
  snakeHead: '#00ff88',
  snakeHeadGlow: 'rgba(0, 255, 136, 0.6)',
  snakeBody: '#00cc6a',
  snakeBodyGlow: 'rgba(0, 204, 106, 0.4)',
  snakeTail: '#009950',
  food: '#ff0066',
  foodGlow: 'rgba(255, 0, 102, 0.7)',
  foodCore: '#ff3388',
};

// Particle system for background ambiance
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  hue: number;
}

// Trail particle for snake movement
interface TrailParticle {
  x: number;
  y: number;
  alpha: number;
  size: number;
  hue: number;
}

// Electric arc particle around snake head
interface ArcParticle {
  angle: number;
  length: number;
  width: number;
  speed: number;
  branches: number;
}

// Shockwave effect when eating food
interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
}

// Lightning bolt point
interface LightningPoint {
  x: number;
  y: number;
}

// Sparkle for food effect
interface Sparkle {
  angle: number;
  distance: number;
  size: number;
  speed: number;
}

// Death explosion particle
interface DeathParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  hue: number;
  life: number;
}

// Glitch effect state
interface GlitchState {
  active: boolean;
  intensity: number;
  slices: { y: number; height: number; offset: number }[];
}

// Screen shake state
interface ShakeState {
  active: boolean;
  intensity: number;
  offsetX: number;
  offsetY: number;
}

const NUM_BG_PARTICLES = 30;
const NUM_SPARKLES = 6;
const NUM_ARC_PARTICLES = 8;
const NUM_DEATH_PARTICLES = 50;

// Initialize background particles
function createBackgroundParticles(width: number, height: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < NUM_BG_PARTICLES; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      size: Math.random() * 2 + 1,
      alpha: Math.random() * 0.3 + 0.1,
      hue: Math.random() * 60 + 120, // Green to cyan range
    });
  }
  return particles;
}

// Initialize food sparkles
function createSparkles(): Sparkle[] {
  const sparkles: Sparkle[] = [];
  for (let i = 0; i < NUM_SPARKLES; i++) {
    sparkles.push({
      angle: (i / NUM_SPARKLES) * Math.PI * 2,
      distance: 8 + Math.random() * 4,
      size: 1.5 + Math.random(),
      speed: 0.5 + Math.random() * 0.5,
    });
  }
  return sparkles;
}

// Initialize electric arc particles around snake head
function createArcParticles(): ArcParticle[] {
  const arcs: ArcParticle[] = [];
  for (let i = 0; i < NUM_ARC_PARTICLES; i++) {
    arcs.push({
      angle: (i / NUM_ARC_PARTICLES) * Math.PI * 2,
      length: 12 + Math.random() * 8,
      width: 1 + Math.random() * 1.5,
      speed: 2 + Math.random() * 3,
      branches: Math.floor(Math.random() * 3) + 1,
    });
  }
  return arcs;
}

// Create death explosion particles from a position
function createDeathParticles(x: number, y: number): DeathParticle[] {
  const particles: DeathParticle[] = [];
  for (let i = 0; i < NUM_DEATH_PARTICLES; i++) {
    const angle = (i / NUM_DEATH_PARTICLES) * Math.PI * 2 + Math.random() * 0.5;
    const speed = 3 + Math.random() * 8;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 3 + Math.random() * 6,
      alpha: 1,
      hue: Math.random() < 0.5 ? 0 + Math.random() * 30 : 150 + Math.random() * 30, // Red or green
      life: 1,
    });
  }
  return particles;
}

// Create random glitch slices
function createGlitchSlices(height: number): { y: number; height: number; offset: number }[] {
  const slices: { y: number; height: number; offset: number }[] = [];
  const numSlices = 5 + Math.floor(Math.random() * 5);
  for (let i = 0; i < numSlices; i++) {
    slices.push({
      y: Math.random() * height,
      height: 2 + Math.random() * 20,
      offset: (Math.random() - 0.5) * 30,
    });
  }
  return slices;
}

// Generate lightning bolt path between two points
function generateLightningPath(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  segments: number,
  displacement: number
): LightningPoint[] {
  const points: LightningPoint[] = [{ x: startX, y: startY }];

  const dx = endX - startX;
  const dy = endY - startY;

  for (let i = 1; i < segments; i++) {
    const t = i / segments;
    const baseX = startX + dx * t;
    const baseY = startY + dy * t;

    // Add random perpendicular displacement
    const perpX = -dy;
    const perpY = dx;
    const len = Math.sqrt(perpX * perpX + perpY * perpY);
    const normalizedPerpX = len > 0 ? perpX / len : 0;
    const normalizedPerpY = len > 0 ? perpY / len : 0;

    const offset = (Math.random() - 0.5) * displacement * (1 - t * 0.5);

    points.push({
      x: baseX + normalizedPerpX * offset,
      y: baseY + normalizedPerpY * offset,
    });
  }

  points.push({ x: endX, y: endY });
  return points;
}

export function GameBoard({ gameState, gridSize, gameOver = false }: GameBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const timeRef = useRef<number>(0);
  const bgParticlesRef = useRef<Particle[]>([]);
  const trailParticlesRef = useRef<TrailParticle[]>([]);
  const sparklesRef = useRef<Sparkle[]>([]);
  const arcParticlesRef = useRef<ArcParticle[]>([]);
  const shockwavesRef = useRef<Shockwave[]>([]);
  const lastSnakeHeadRef = useRef<Position | null>(null);
  const lastScoreRef = useRef<number>(0);
  const deathParticlesRef = useRef<DeathParticle[]>([]);
  const glitchStateRef = useRef<GlitchState>({ active: false, intensity: 0, slices: [] });
  const shakeStateRef = useRef<ShakeState>({ active: false, intensity: 0, offsetX: 0, offsetY: 0 });
  const gameOverTimeRef = useRef<number>(0);
  const wasGameOverRef = useRef<boolean>(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Initialize particles if needed
    if (bgParticlesRef.current.length === 0) {
      bgParticlesRef.current = createBackgroundParticles(canvas.width, canvas.height);
    }
    if (sparklesRef.current.length === 0) {
      sparklesRef.current = createSparkles();
    }
    if (arcParticlesRef.current.length === 0) {
      arcParticlesRef.current = createArcParticles();
    }

    // Detect game over transition
    if (gameOver && !wasGameOverRef.current) {
      // Game just ended - trigger death effects
      const head = gameState.snake[0];
      const centerX = head.x * CELL_SIZE + CELL_SIZE / 2;
      const centerY = head.y * CELL_SIZE + CELL_SIZE / 2;

      // Create death explosion at snake head
      deathParticlesRef.current = createDeathParticles(centerX, centerY);

      // Activate screen shake
      shakeStateRef.current = { active: true, intensity: 15, offsetX: 0, offsetY: 0 };

      // Activate glitch effect
      glitchStateRef.current = {
        active: true,
        intensity: 1,
        slices: createGlitchSlices(canvas.height),
      };

      // Record game over start time
      gameOverTimeRef.current = timeRef.current;
    }

    // Reset death effects when game restarts
    if (!gameOver && wasGameOverRef.current) {
      deathParticlesRef.current = [];
      glitchStateRef.current = { active: false, intensity: 0, slices: [] };
      shakeStateRef.current = { active: false, intensity: 0, offsetX: 0, offsetY: 0 };
      gameOverTimeRef.current = 0;
    }

    wasGameOverRef.current = gameOver;

    // Detect food eaten (snake length increased = score increased)
    const currentScore = gameState.snake.length;
    if (currentScore > lastScoreRef.current && lastScoreRef.current > 0) {
      // Food was eaten! Create shockwave at food position
      const foodCenterX = gameState.food.x * CELL_SIZE + CELL_SIZE / 2;
      const foodCenterY = gameState.food.y * CELL_SIZE + CELL_SIZE / 2;
      shockwavesRef.current.push({
        x: foodCenterX,
        y: foodCenterY,
        radius: 5,
        maxRadius: 80,
        alpha: 1,
      });
    }
    lastScoreRef.current = currentScore;

    // Add trail particles when snake moves
    const currentHead = gameState.snake[0];
    if (lastSnakeHeadRef.current &&
        (lastSnakeHeadRef.current.x !== currentHead.x ||
         lastSnakeHeadRef.current.y !== currentHead.y)) {
      // Add trail particle at old head position
      const centerX = lastSnakeHeadRef.current.x * CELL_SIZE + CELL_SIZE / 2;
      const centerY = lastSnakeHeadRef.current.y * CELL_SIZE + CELL_SIZE / 2;
      trailParticlesRef.current.push({
        x: centerX + (Math.random() - 0.5) * 6,
        y: centerY + (Math.random() - 0.5) * 6,
        alpha: 0.8,
        size: 4 + Math.random() * 2,
        hue: 150,
      });
      // Keep trail manageable
      if (trailParticlesRef.current.length > 20) {
        trailParticlesRef.current.shift();
      }
    }
    lastSnakeHeadRef.current = { ...currentHead };

    let animationId: number;

    const animate = (timestamp: number) => {
      timeRef.current = timestamp;
      render(
        ctx,
        gameState,
        canvas.width,
        canvas.height,
        timestamp,
        bgParticlesRef.current,
        trailParticlesRef.current,
        sparklesRef.current,
        arcParticlesRef.current,
        shockwavesRef.current,
        deathParticlesRef.current,
        glitchStateRef.current,
        shakeStateRef.current,
        gameOver,
        gameOverTimeRef.current
      );
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    animationRef.current = animationId;

    return () => {
      cancelAnimationFrame(animationId);
    };
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

function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number, time: number) {
  // Animated grid with subtle pulse
  const gridPulse = Math.sin(time / 2000) * 0.02 + 0.08;
  ctx.strokeStyle = `rgba(0, 255, 136, ${gridPulse})`;
  ctx.lineWidth = 1;

  // Vertical lines
  for (let x = 0; x <= width; x += CELL_SIZE) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Horizontal lines
  for (let y = 0; y <= height; y += CELL_SIZE) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
}

// Draw floating background particles
function drawBackgroundParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  width: number,
  height: number,
  time: number
) {
  for (const p of particles) {
    // Update position
    p.x += p.vx;
    p.y += p.vy;

    // Wrap around edges
    if (p.x < 0) p.x = width;
    if (p.x > width) p.x = 0;
    if (p.y < 0) p.y = height;
    if (p.y > height) p.y = 0;

    // Twinkle effect
    const twinkle = Math.sin(time / 500 + p.x + p.y) * 0.15 + 0.85;
    const alpha = p.alpha * twinkle;

    ctx.fillStyle = `hsla(${p.hue}, 100%, 70%, ${alpha})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

// Draw snake trail particles
function drawTrailParticles(
  ctx: CanvasRenderingContext2D,
  particles: TrailParticle[]
) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];

    // Fade out
    p.alpha -= 0.03;
    p.size *= 0.95;

    if (p.alpha <= 0) {
      particles.splice(i, 1);
      continue;
    }

    ctx.fillStyle = `hsla(${p.hue}, 100%, 60%, ${p.alpha})`;
    ctx.shadowColor = `hsla(${p.hue}, 100%, 60%, ${p.alpha})`;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
}

// Draw shockwave effects
function drawShockwaves(
  ctx: CanvasRenderingContext2D,
  shockwaves: Shockwave[]
) {
  for (let i = shockwaves.length - 1; i >= 0; i--) {
    const sw = shockwaves[i];

    // Expand and fade
    sw.radius += 4;
    sw.alpha = 1 - (sw.radius / sw.maxRadius);

    if (sw.radius >= sw.maxRadius) {
      shockwaves.splice(i, 1);
      continue;
    }

    // Draw multiple rings for dramatic effect
    for (let ring = 0; ring < 3; ring++) {
      const ringRadius = sw.radius - ring * 8;
      if (ringRadius <= 0) continue;

      const ringAlpha = sw.alpha * (1 - ring * 0.3);
      const hue = 340 + ring * 20; // Pink to magenta

      ctx.strokeStyle = `hsla(${hue}, 100%, 70%, ${ringAlpha})`;
      ctx.lineWidth = 3 - ring;
      ctx.shadowColor = `hsla(${hue}, 100%, 50%, ${ringAlpha})`;
      ctx.shadowBlur = 15;

      ctx.beginPath();
      ctx.arc(sw.x, sw.y, ringRadius, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Inner flash
    if (sw.alpha > 0.7) {
      const flashGradient = ctx.createRadialGradient(
        sw.x, sw.y, 0,
        sw.x, sw.y, sw.radius * 0.5
      );
      flashGradient.addColorStop(0, `rgba(255, 255, 255, ${sw.alpha * 0.5})`);
      flashGradient.addColorStop(1, 'rgba(255, 100, 200, 0)');
      ctx.fillStyle = flashGradient;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.radius * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.shadowBlur = 0;
}

// Draw lightning bolts between snake segments
function drawLightning(
  ctx: CanvasRenderingContext2D,
  snake: Position[],
  time: number
) {
  if (snake.length < 2) return;

  // Only draw lightning occasionally for flickering effect
  const flicker = Math.sin(time / 30) * Math.sin(time / 47) * Math.sin(time / 23);
  if (flicker < 0.3) return;

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Draw lightning between consecutive segments
  for (let i = 0; i < Math.min(snake.length - 1, 6); i++) {
    const current = snake[i];
    const next = snake[i + 1];

    const startX = current.x * CELL_SIZE + CELL_SIZE / 2;
    const startY = current.y * CELL_SIZE + CELL_SIZE / 2;
    const endX = next.x * CELL_SIZE + CELL_SIZE / 2;
    const endY = next.y * CELL_SIZE + CELL_SIZE / 2;

    // Generate jagged lightning path
    const segments = 4 + Math.floor(Math.random() * 3);
    const displacement = 6 + i * 2;
    const points = generateLightningPath(startX, startY, endX, endY, segments, displacement);

    // Intensity decreases along the snake
    const intensity = 1 - (i / 8);
    const alpha = 0.6 * intensity * (flicker * 0.5 + 0.5);

    // Draw outer glow
    ctx.strokeStyle = `rgba(0, 255, 200, ${alpha * 0.3})`;
    ctx.lineWidth = 6;
    ctx.shadowColor = 'rgba(0, 255, 200, 0.8)';
    ctx.shadowBlur = 15;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let j = 1; j < points.length; j++) {
      ctx.lineTo(points[j].x, points[j].y);
    }
    ctx.stroke();

    // Draw bright core
    ctx.strokeStyle = `rgba(200, 255, 255, ${alpha})`;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 10;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let j = 1; j < points.length; j++) {
      ctx.lineTo(points[j].x, points[j].y);
    }
    ctx.stroke();

    // White hot center
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.8})`;
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let j = 1; j < points.length; j++) {
      ctx.lineTo(points[j].x, points[j].y);
    }
    ctx.stroke();
  }

  ctx.shadowBlur = 0;
}

// Draw electric arcs emanating from the snake head
function drawElectricArcs(
  ctx: CanvasRenderingContext2D,
  head: Position,
  arcs: ArcParticle[],
  time: number
) {
  const centerX = head.x * CELL_SIZE + CELL_SIZE / 2;
  const centerY = head.y * CELL_SIZE + CELL_SIZE / 2;

  ctx.lineCap = 'round';

  for (const arc of arcs) {
    // Rotate and pulse the arc angle
    const currentAngle = arc.angle + time / 500 * arc.speed;
    const pulseLength = arc.length + Math.sin(time / 100 + arc.angle) * 4;

    // Flicker effect
    const flicker = Math.sin(time / 20 + arc.angle * 5) * 0.5 + 0.5;
    if (flicker < 0.3) continue;

    const alpha = flicker * 0.7;

    // Generate branching lightning from head
    const startX = centerX + Math.cos(currentAngle) * 8;
    const startY = centerY + Math.sin(currentAngle) * 8;
    const endX = centerX + Math.cos(currentAngle) * (8 + pulseLength);
    const endY = centerY + Math.sin(currentAngle) * (8 + pulseLength);

    const points = generateLightningPath(startX, startY, endX, endY, 3, 4);

    // Outer glow
    ctx.strokeStyle = `rgba(0, 255, 180, ${alpha * 0.4})`;
    ctx.lineWidth = arc.width * 3;
    ctx.shadowColor = 'rgba(0, 255, 200, 0.9)';
    ctx.shadowBlur = 12;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let j = 1; j < points.length; j++) {
      ctx.lineTo(points[j].x, points[j].y);
    }
    ctx.stroke();

    // Bright core
    ctx.strokeStyle = `rgba(180, 255, 255, ${alpha})`;
    ctx.lineWidth = arc.width;

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let j = 1; j < points.length; j++) {
      ctx.lineTo(points[j].x, points[j].y);
    }
    ctx.stroke();

    // Draw branches
    for (let b = 0; b < arc.branches; b++) {
      const branchStart = points[Math.floor(points.length / 2)];
      const branchAngle = currentAngle + (Math.random() - 0.5) * 1.5;
      const branchLength = pulseLength * 0.4;
      const branchEndX = branchStart.x + Math.cos(branchAngle) * branchLength;
      const branchEndY = branchStart.y + Math.sin(branchAngle) * branchLength;

      ctx.strokeStyle = `rgba(0, 255, 200, ${alpha * 0.5})`;
      ctx.lineWidth = 1;

      ctx.beginPath();
      ctx.moveTo(branchStart.x, branchStart.y);
      ctx.lineTo(branchEndX, branchEndY);
      ctx.stroke();
    }
  }

  ctx.shadowBlur = 0;
}

// Draw vignette effect
function drawVignette(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const gradient = ctx.createRadialGradient(
    width / 2, height / 2, width * 0.3,
    width / 2, height / 2, width * 0.8
  );
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
}

// Draw subtle scanlines for CRT effect
function drawScanlines(ctx: CanvasRenderingContext2D, width: number, height: number, time: number) {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
  const offset = (time / 50) % 4;
  for (let y = offset; y < height; y += 4) {
    ctx.fillRect(0, y, width, 2);
  }
}

// Draw death explosion particles
function drawDeathParticles(
  ctx: CanvasRenderingContext2D,
  particles: DeathParticle[]
) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];

    // Update physics
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.96; // Friction
    p.vy *= 0.96;
    p.vy += 0.1; // Gravity
    p.life -= 0.015;
    p.alpha = p.life;
    p.size *= 0.98;

    if (p.life <= 0) {
      particles.splice(i, 1);
      continue;
    }

    // Draw particle with glow
    const lightness = 50 + (1 - p.life) * 30;
    ctx.fillStyle = `hsla(${p.hue}, 100%, ${lightness}%, ${p.alpha})`;
    ctx.shadowColor = `hsla(${p.hue}, 100%, 50%, ${p.alpha})`;
    ctx.shadowBlur = 10;

    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();

    // Draw trailing ember
    if (p.life > 0.3) {
      ctx.fillStyle = `hsla(${p.hue}, 100%, 80%, ${p.alpha * 0.5})`;
      ctx.beginPath();
      ctx.arc(p.x - p.vx * 2, p.y - p.vy * 2, p.size * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.shadowBlur = 0;
}

// Draw glitch/distortion effect
function drawGlitch(
  ctx: CanvasRenderingContext2D,
  glitch: GlitchState,
  width: number,
  height: number,
  time: number
) {
  if (!glitch.active || glitch.intensity <= 0) return;

  // Flicker the glitch randomly
  if (Math.random() > 0.7) {
    // RGB split effect
    const splitOffset = glitch.intensity * 5 * (Math.random() - 0.5);
    ctx.globalCompositeOperation = 'screen';

    // Red channel shift
    ctx.fillStyle = `rgba(255, 0, 0, ${glitch.intensity * 0.15})`;
    ctx.fillRect(splitOffset, 0, width, height);

    // Cyan channel shift
    ctx.fillStyle = `rgba(0, 255, 255, ${glitch.intensity * 0.15})`;
    ctx.fillRect(-splitOffset, 0, width, height);

    ctx.globalCompositeOperation = 'source-over';
  }

  // Draw horizontal glitch slices
  if (Math.random() > 0.5) {
    for (const slice of glitch.slices) {
      const flicker = Math.sin(time / 20 + slice.y) * 0.5 + 0.5;
      if (flicker > 0.6) {
        const offset = slice.offset * glitch.intensity * (Math.random() - 0.5) * 2;
        ctx.drawImage(
          ctx.canvas,
          0, slice.y, width, slice.height,
          offset, slice.y, width, slice.height
        );

        // Add colored line artifacts
        ctx.fillStyle = `rgba(0, 255, 136, ${glitch.intensity * 0.3})`;
        ctx.fillRect(0, slice.y, width, 1);
      }
    }
  }

  // Random noise blocks
  if (Math.random() > 0.8) {
    const numBlocks = Math.floor(glitch.intensity * 10);
    for (let i = 0; i < numBlocks; i++) {
      const bx = Math.random() * width;
      const by = Math.random() * height;
      const bw = 5 + Math.random() * 30;
      const bh = 2 + Math.random() * 10;
      const hue = Math.random() < 0.5 ? 0 : 150;
      ctx.fillStyle = `hsla(${hue}, 100%, 50%, ${glitch.intensity * 0.5})`;
      ctx.fillRect(bx, by, bw, bh);
    }
  }
}

// Draw death fade overlay
function drawDeathOverlay(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  gameOverProgress: number
) {
  if (gameOverProgress <= 0) return;

  // Pulsing red vignette
  const pulseIntensity = Math.sin(gameOverProgress * Math.PI * 2) * 0.1 + 0.3;
  const vignetteAlpha = Math.min(gameOverProgress * 0.5, 0.4) + pulseIntensity * gameOverProgress;

  const gradient = ctx.createRadialGradient(
    width / 2, height / 2, 0,
    width / 2, height / 2, width * 0.8
  );
  gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
  gradient.addColorStop(0.5, `rgba(50, 0, 0, ${vignetteAlpha * 0.3})`);
  gradient.addColorStop(1, `rgba(100, 0, 0, ${vignetteAlpha})`);

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Darkening overlay that increases over time
  const darkAlpha = Math.min(gameOverProgress * 0.3, 0.25);
  ctx.fillStyle = `rgba(0, 0, 0, ${darkAlpha})`;
  ctx.fillRect(0, 0, width, height);
}

function drawSnakeSegment(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  isHead: boolean,
  index: number,
  totalLength: number,
  time: number
) {
  const centerX = x * CELL_SIZE + CELL_SIZE / 2;
  const centerY = y * CELL_SIZE + CELL_SIZE / 2;
  const radius = (CELL_SIZE - 4) / 2;

  // Calculate color based on position (gradient from head to tail)
  const progress = totalLength > 1 ? index / (totalLength - 1) : 0;

  // Wave animation - segments pulse in sequence
  const waveOffset = Math.sin(time / 150 - index * 0.5) * 0.1 + 1;
  const breathe = Math.sin(time / 300) * 0.05 + 1;

  if (isHead) {
    // Draw outer glow ring
    ctx.shadowColor = COLORS.snakeHeadGlow;
    ctx.shadowBlur = 20 + Math.sin(time / 200) * 5;

    // Head breathes slightly
    const headScale = breathe;
    const headSize = (CELL_SIZE - 2) * headScale;
    const headOffset = (CELL_SIZE - headSize) / 2;

    // Head is larger and brighter with enhanced gradient
    const gradient = ctx.createRadialGradient(
      centerX - 2, centerY - 2, 0,
      centerX, centerY, radius + 4
    );
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.2, '#aaffcc');
    gradient.addColorStop(0.4, COLORS.snakeHead);
    gradient.addColorStop(1, COLORS.snakeBody);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(
      x * CELL_SIZE + headOffset,
      y * CELL_SIZE + headOffset,
      headSize,
      headSize,
      6
    );
    ctx.fill();

    // Add inner highlight
    ctx.shadowBlur = 0;
    const highlightGradient = ctx.createRadialGradient(
      centerX - 3, centerY - 3, 0,
      centerX, centerY, radius
    );
    highlightGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
    highlightGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0)');
    highlightGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = highlightGradient;
    ctx.beginPath();
    ctx.roundRect(
      x * CELL_SIZE + headOffset,
      y * CELL_SIZE + headOffset,
      headSize,
      headSize,
      6
    );
    ctx.fill();

    // Draw eyes with glow
    ctx.fillStyle = '#0a0a0f';
    const eyeSize = 3;
    const eyeOffset = 4;
    ctx.beginPath();
    ctx.arc(centerX - eyeOffset, centerY - 2, eyeSize, 0, Math.PI * 2);
    ctx.arc(centerX + eyeOffset, centerY - 2, eyeSize, 0, Math.PI * 2);
    ctx.fill();

    // Eye shine with twinkle
    const eyeTwinkle = Math.sin(time / 100) * 0.3 + 0.7;
    ctx.fillStyle = `rgba(255, 255, 255, ${eyeTwinkle})`;
    ctx.beginPath();
    ctx.arc(centerX - eyeOffset + 1, centerY - 3, 1.5, 0, Math.PI * 2);
    ctx.arc(centerX + eyeOffset + 1, centerY - 3, 1.5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Body segments with wave animation and gradient fade
    const alpha = 1 - (progress * 0.4);
    const hue = 150 - (progress * 30); // More dramatic color shift
    const lightness = 55 - progress * 15;

    // Pulsing glow intensity
    const glowIntensity = (8 - progress * 5) * waveOffset;
    ctx.shadowColor = `hsla(${hue}, 100%, ${lightness}%, 0.6)`;
    ctx.shadowBlur = glowIntensity;

    // Size varies with wave
    const segmentScale = waveOffset * 0.15 + 0.85;
    const segmentSize = (CELL_SIZE - 4) * segmentScale;
    const segmentOffset = (CELL_SIZE - segmentSize) / 2;

    // Main segment
    const segmentColor = `hsla(${hue}, 100%, ${lightness}%, ${alpha})`;
    ctx.fillStyle = segmentColor;

    ctx.beginPath();
    ctx.roundRect(
      x * CELL_SIZE + segmentOffset,
      y * CELL_SIZE + segmentOffset,
      segmentSize,
      segmentSize,
      4
    );
    ctx.fill();

    // Inner highlight on body segments
    ctx.shadowBlur = 0;
    const bodyHighlight = ctx.createRadialGradient(
      centerX - 2, centerY - 2, 0,
      centerX, centerY, radius
    );
    bodyHighlight.addColorStop(0, `rgba(255, 255, 255, ${0.15 * (1 - progress)})`);
    bodyHighlight.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = bodyHighlight;
    ctx.beginPath();
    ctx.roundRect(
      x * CELL_SIZE + segmentOffset,
      y * CELL_SIZE + segmentOffset,
      segmentSize,
      segmentSize,
      4
    );
    ctx.fill();
  }

  ctx.shadowBlur = 0;
}

function drawFood(
  ctx: CanvasRenderingContext2D,
  food: Position,
  time: number,
  sparkles: Sparkle[]
) {
  const centerX = food.x * CELL_SIZE + CELL_SIZE / 2;
  const centerY = food.y * CELL_SIZE + CELL_SIZE / 2;

  // Pulsing animation
  const pulse = Math.sin(time / 200) * 0.3 + 1;
  const glowPulse = Math.sin(time / 150) * 0.4 + 0.6;
  const rotation = time / 1000; // Slow rotation

  // Draw orbiting sparkles first (behind the food)
  for (const sparkle of sparkles) {
    const angle = sparkle.angle + time / 500 * sparkle.speed;
    const dist = sparkle.distance + Math.sin(time / 300 + sparkle.angle) * 2;
    const sx = centerX + Math.cos(angle) * dist;
    const sy = centerY + Math.sin(angle) * dist;
    const sparkleAlpha = Math.sin(time / 200 + sparkle.angle * 2) * 0.3 + 0.7;

    ctx.fillStyle = `rgba(255, 200, 255, ${sparkleAlpha})`;
    ctx.shadowColor = 'rgba(255, 100, 200, 0.8)';
    ctx.shadowBlur = 5;
    ctx.beginPath();
    ctx.arc(sx, sy, sparkle.size, 0, Math.PI * 2);
    ctx.fill();
  }

  // Outer glow ring
  ctx.shadowColor = COLORS.foodGlow;
  ctx.shadowBlur = 25 * glowPulse;

  // Draw multiple layers for intense glow effect
  const baseRadius = (CELL_SIZE - 6) / 2;
  const radius = baseRadius * pulse;

  // Outer aura ring
  const auraGradient = ctx.createRadialGradient(
    centerX, centerY, 0,
    centerX, centerY, radius + 8
  );
  auraGradient.addColorStop(0, 'rgba(255, 100, 150, 0.3)');
  auraGradient.addColorStop(0.5, 'rgba(255, 0, 102, 0.1)');
  auraGradient.addColorStop(1, 'rgba(255, 0, 102, 0)');

  ctx.fillStyle = auraGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius + 8, 0, Math.PI * 2);
  ctx.fill();

  // Outer ring with rotation effect
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.rotate(rotation);
  ctx.translate(-centerX, -centerY);

  const outerGradient = ctx.createRadialGradient(
    centerX, centerY, 0,
    centerX, centerY, radius + 4
  );
  outerGradient.addColorStop(0, COLORS.foodCore);
  outerGradient.addColorStop(0.6, COLORS.food);
  outerGradient.addColorStop(1, 'rgba(255, 0, 102, 0)');

  ctx.fillStyle = outerGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius + 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Core with enhanced gradient
  ctx.shadowBlur = 18;
  const coreGradient = ctx.createRadialGradient(
    centerX - 2, centerY - 2, 0,
    centerX, centerY, radius
  );
  coreGradient.addColorStop(0, '#ffffff');
  coreGradient.addColorStop(0.3, '#ffaacc');
  coreGradient.addColorStop(0.5, COLORS.foodCore);
  coreGradient.addColorStop(1, COLORS.food);

  ctx.fillStyle = coreGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();

  // Multiple inner shines for gem-like effect
  ctx.shadowBlur = 0;

  // Main shine
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.beginPath();
  ctx.arc(centerX - 3, centerY - 3, radius * 0.25, 0, Math.PI * 2);
  ctx.fill();

  // Secondary shine
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.beginPath();
  ctx.arc(centerX + 2, centerY - 2, radius * 0.15, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
}

function render(
  ctx: CanvasRenderingContext2D,
  state: GameBoardState,
  width: number,
  height: number,
  time: number,
  bgParticles: Particle[],
  trailParticles: TrailParticle[],
  sparkles: Sparkle[],
  arcParticles: ArcParticle[],
  shockwaves: Shockwave[],
  deathParticles: DeathParticle[],
  glitch: GlitchState,
  shake: ShakeState,
  gameOver: boolean,
  gameOverStartTime: number
) {
  // Calculate game over progress (0 to 1 over 3 seconds)
  const gameOverProgress = gameOver && gameOverStartTime > 0
    ? Math.min((time - gameOverStartTime) / 3000, 1)
    : 0;

  // Update shake effect
  if (shake.active) {
    shake.intensity *= 0.92; // Decay
    shake.offsetX = (Math.random() - 0.5) * shake.intensity * 2;
    shake.offsetY = (Math.random() - 0.5) * shake.intensity * 2;
    if (shake.intensity < 0.5) {
      shake.active = false;
      shake.offsetX = 0;
      shake.offsetY = 0;
    }
  }

  // Update glitch effect
  if (glitch.active) {
    glitch.intensity *= 0.97; // Slower decay for dramatic effect
    if (glitch.intensity < 0.05) {
      glitch.active = false;
    }
    // Randomly regenerate slices
    if (Math.random() > 0.9) {
      glitch.slices = createGlitchSlices(height);
    }
  }

  // Apply screen shake offset
  ctx.save();
  ctx.translate(shake.offsetX, shake.offsetY);

  // Clear canvas with dark background
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(-shake.offsetX, -shake.offsetY, width + Math.abs(shake.offsetX) * 2, height + Math.abs(shake.offsetY) * 2);

  // Draw floating background particles (behind everything)
  drawBackgroundParticles(ctx, bgParticles, width, height, time);

  // Draw subtle animated grid
  drawGrid(ctx, width, height, time);

  // Draw trail particles (behind snake)
  drawTrailParticles(ctx, trailParticles);

  // Draw shockwave effects (behind snake)
  drawShockwaves(ctx, shockwaves);

  // Draw snake (back to front so head is on top)
  const snakeLength = state.snake.length;
  for (let i = snakeLength - 1; i >= 0; i--) {
    const segment = state.snake[i];
    drawSnakeSegment(ctx, segment.x, segment.y, i === 0, i, snakeLength, time);
  }

  // Draw lightning effects between snake segments
  drawLightning(ctx, state.snake, time);

  // Draw electric arcs from snake head (only if game not over)
  if (!gameOver) {
    drawElectricArcs(ctx, state.snake[0], arcParticles, time);
  }

  // Draw food with animation and sparkles
  drawFood(ctx, state.food, time, sparkles);

  // Draw death explosion particles
  if (deathParticles.length > 0) {
    drawDeathParticles(ctx, deathParticles);
  }

  // Draw post-processing effects
  drawScanlines(ctx, width, height, time);
  drawVignette(ctx, width, height);

  // Draw game over effects
  if (gameOver) {
    drawGlitch(ctx, glitch, width, height, time);
    drawDeathOverlay(ctx, width, height, gameOverProgress);
  }

  ctx.restore();
}
