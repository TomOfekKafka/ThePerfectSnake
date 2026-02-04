import { useEffect, useRef, useState, useCallback } from 'react';
import './GameBoard.css';

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

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  type: 'ambient' | 'explosion' | 'trail';
}

const CELL_SIZE = 20;

// Color palette - enhanced with more vibrant colors
const COLORS = {
  bgDark: '#050510',
  bgLight: '#0f0f2a',
  gridLine: 'rgba(100, 200, 255, 0.04)',
  snakeHead: '#00ff88',
  snakeHeadGlow: 'rgba(0, 255, 136, 0.8)',
  snakeTail: '#0066ff',
  snakeBody: '#00ddff',
  foodCore: '#ff2255',
  foodGlow: 'rgba(255, 51, 102, 0.9)',
  foodOuter: '#ff88aa',
  foodRing: '#ffaa00',
  eyeWhite: '#ffffff',
  eyePupil: '#001100',
  particleGreen: '#00ff88',
  particleCyan: '#00ddff',
  particleMagenta: '#ff3388',
  particleGold: '#ffdd00',
};

export function GameBoard({ gameState, gridSize }: GameBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animationFrame, setAnimationFrame] = useState(0);
  const particlesRef = useRef<Particle[]>([]);
  const prevFoodRef = useRef<Position | null>(null);
  const gameOverFrameRef = useRef(0);
  const prevGameOverRef = useRef(false);

  // Create explosion particles at a position
  const createExplosion = useCallback((x: number, y: number, count: number, colors: string[]) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.3;
      const speed = 2 + Math.random() * 3;
      newParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 1,
        size: 3 + Math.random() * 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        type: 'explosion',
      });
    }
    particlesRef.current = [...particlesRef.current, ...newParticles];
  }, []);

  // Initialize ambient particles
  useEffect(() => {
    const width = gridSize * CELL_SIZE;
    const height = gridSize * CELL_SIZE;
    const ambientParticles: Particle[] = [];
    for (let i = 0; i < 30; i++) {
      ambientParticles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        life: Math.random(),
        maxLife: 1,
        size: 1 + Math.random() * 2,
        color: Math.random() > 0.5 ? COLORS.particleCyan : COLORS.particleGreen,
        type: 'ambient',
      });
    }
    particlesRef.current = ambientParticles;
  }, [gridSize]);

  // Detect food eaten and create explosion
  useEffect(() => {
    if (prevFoodRef.current &&
        (prevFoodRef.current.x !== gameState.food.x || prevFoodRef.current.y !== gameState.food.y)) {
      // Food position changed = food was eaten at the old position
      const foodX = prevFoodRef.current.x * CELL_SIZE + CELL_SIZE / 2;
      const foodY = prevFoodRef.current.y * CELL_SIZE + CELL_SIZE / 2;
      createExplosion(foodX, foodY, 16, [COLORS.particleMagenta, COLORS.particleGold, COLORS.foodOuter]);
    }
    prevFoodRef.current = { ...gameState.food };
  }, [gameState.food, createExplosion]);

  // Detect game over and create death explosion
  useEffect(() => {
    if (gameState.gameOver && !prevGameOverRef.current) {
      gameOverFrameRef.current = 0;
      const head = gameState.snake[0];
      if (head) {
        const headX = head.x * CELL_SIZE + CELL_SIZE / 2;
        const headY = head.y * CELL_SIZE + CELL_SIZE / 2;
        createExplosion(headX, headY, 24, [COLORS.particleMagenta, '#ff0000', '#ff6600']);
      }
    }
    prevGameOverRef.current = gameState.gameOver;
  }, [gameState.gameOver, gameState.snake, createExplosion]);

  // Animation loop for pulsing effects
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationFrame((f) => (f + 1) % 360);
      if (gameState.gameOver) {
        gameOverFrameRef.current = Math.min(gameOverFrameRef.current + 1, 60);
      }
    }, 33); // ~30fps for smoother animations
    return () => clearInterval(interval);
  }, [gameState.gameOver]);

  // Update particles
  useEffect(() => {
    const width = gridSize * CELL_SIZE;
    const height = gridSize * CELL_SIZE;

    particlesRef.current = particlesRef.current
      .map((p) => {
        if (p.type === 'ambient') {
          // Ambient particles drift and wrap around
          let newX = p.x + p.vx;
          let newY = p.y + p.vy;
          if (newX < 0) newX = width;
          if (newX > width) newX = 0;
          if (newY < 0) newY = height;
          if (newY > height) newY = 0;
          return {
            ...p,
            x: newX,
            y: newY,
            life: (Math.sin(animationFrame * 0.05 + p.x * 0.01) + 1) / 2,
          };
        } else {
          // Explosion particles decay
          return {
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vx: p.vx * 0.95,
            vy: p.vy * 0.95,
            life: p.life - 0.03,
            size: p.size * 0.97,
          };
        }
      })
      .filter((p) => p.life > 0);
  }, [animationFrame, gridSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Get snake head position for dynamic lighting
    const headX = gameState.snake[0]?.x * CELL_SIZE + CELL_SIZE / 2 || width / 2;
    const headY = gameState.snake[0]?.y * CELL_SIZE + CELL_SIZE / 2 || height / 2;

    // Draw gradient background with dynamic lighting based on snake position
    const bgGradient = ctx.createRadialGradient(
      headX, headY, 0,
      headX, headY, width * 0.8
    );
    bgGradient.addColorStop(0, '#101025');
    bgGradient.addColorStop(0.3, COLORS.bgLight);
    bgGradient.addColorStop(1, COLORS.bgDark);
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Add subtle animated scanlines for retro effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
    for (let y = 0; y < height; y += 4) {
      ctx.fillRect(0, y, width, 2);
    }

    // Draw animated grid with pulsing effect
    const gridPulse = (Math.sin(animationFrame * 0.02) + 1) / 2 * 0.03 + 0.02;
    ctx.strokeStyle = `rgba(100, 200, 255, ${gridPulse})`;
    ctx.lineWidth = 1;
    for (let i = 0; i <= gridSize; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(width, i * CELL_SIZE);
      ctx.stroke();
    }

    // Draw ambient particles (behind everything)
    particlesRef.current.forEach((p) => {
      if (p.type === 'ambient') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color.replace(')', `, ${p.life * 0.4})`).replace('rgb', 'rgba');
        ctx.fill();
      }
    });

    // Pulsing animation values
    const pulse = (Math.sin(animationFrame * 0.1) + 1) / 2;
    const fastPulse = (Math.sin(animationFrame * 0.2) + 1) / 2;

    // Draw food with enhanced glow effect
    const foodX = gameState.food.x * CELL_SIZE + CELL_SIZE / 2;
    const foodY = gameState.food.y * CELL_SIZE + CELL_SIZE / 2;
    const foodRadius = (CELL_SIZE / 2 - 2) * (0.9 + pulse * 0.1);

    // Large outer glow
    const outerGlowSize = 25 + pulse * 10;
    const outerGlow = ctx.createRadialGradient(foodX, foodY, 0, foodX, foodY, outerGlowSize);
    outerGlow.addColorStop(0, 'rgba(255, 51, 102, 0.4)');
    outerGlow.addColorStop(0.4, 'rgba(255, 51, 102, 0.15)');
    outerGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = outerGlow;
    ctx.beginPath();
    ctx.arc(foodX, foodY, outerGlowSize, 0, Math.PI * 2);
    ctx.fill();

    // Rotating orbital rings around food
    ctx.save();
    ctx.translate(foodX, foodY);
    for (let ring = 0; ring < 3; ring++) {
      const ringAngle = animationFrame * 0.03 * (ring % 2 === 0 ? 1 : -1) + (ring * Math.PI / 3);
      const ringRadius = foodRadius + 6 + ring * 4;
      const ringAlpha = 0.4 - ring * 0.1;

      ctx.beginPath();
      ctx.ellipse(0, 0, ringRadius, ringRadius * 0.3, ringAngle, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255, 170, 0, ${ringAlpha})`;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Add orbiting dots on rings
      const dotAngle = animationFrame * 0.08 * (ring % 2 === 0 ? 1 : -1);
      const dotX = Math.cos(dotAngle) * ringRadius;
      const dotY = Math.sin(dotAngle) * ringRadius * 0.3;
      const rotatedX = dotX * Math.cos(ringAngle) - dotY * Math.sin(ringAngle);
      const rotatedY = dotX * Math.sin(ringAngle) + dotY * Math.cos(ringAngle);
      ctx.beginPath();
      ctx.arc(rotatedX, rotatedY, 2, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.particleGold;
      ctx.fill();
    }
    ctx.restore();

    // Food body with enhanced gradient
    const foodBodyGradient = ctx.createRadialGradient(
      foodX - 2, foodY - 2, 0,
      foodX, foodY, foodRadius
    );
    foodBodyGradient.addColorStop(0, '#ffffff');
    foodBodyGradient.addColorStop(0.2, COLORS.foodOuter);
    foodBodyGradient.addColorStop(0.6, COLORS.foodCore);
    foodBodyGradient.addColorStop(1, '#aa0033');
    ctx.beginPath();
    ctx.arc(foodX, foodY, foodRadius, 0, Math.PI * 2);
    ctx.fillStyle = foodBodyGradient;
    ctx.fill();

    // Food inner glow
    ctx.beginPath();
    ctx.arc(foodX, foodY, foodRadius * 0.6, 0, Math.PI * 2);
    const innerGlow = ctx.createRadialGradient(foodX, foodY, 0, foodX, foodY, foodRadius * 0.6);
    innerGlow.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
    innerGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = innerGlow;
    ctx.fill();

    // Food highlight sparkle
    ctx.beginPath();
    ctx.arc(foodX - 3, foodY - 3, foodRadius * 0.25, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + fastPulse * 0.3})`;
    ctx.fill();

    // Draw snake trail effect (glowing path behind snake)
    const snakeLength = gameState.snake.length;
    if (snakeLength > 1) {
      ctx.save();
      ctx.globalAlpha = 0.3;
      for (let i = snakeLength - 1; i >= 1; i--) {
        const segment = gameState.snake[i];
        const prevSegment = gameState.snake[i - 1];
        const x1 = segment.x * CELL_SIZE + CELL_SIZE / 2;
        const y1 = segment.y * CELL_SIZE + CELL_SIZE / 2;
        const x2 = prevSegment.x * CELL_SIZE + CELL_SIZE / 2;
        const y2 = prevSegment.y * CELL_SIZE + CELL_SIZE / 2;

        // Only draw if segments are adjacent (not wrapped)
        const dist = Math.abs(segment.x - prevSegment.x) + Math.abs(segment.y - prevSegment.y);
        if (dist === 1) {
          const trailGradient = ctx.createLinearGradient(x1, y1, x2, y2);
          const alpha = 0.2 * (1 - i / snakeLength);
          trailGradient.addColorStop(0, `rgba(0, 221, 255, ${alpha})`);
          trailGradient.addColorStop(1, `rgba(0, 255, 136, ${alpha * 1.5})`);
          ctx.strokeStyle = trailGradient;
          ctx.lineWidth = 8 * (1 - i / snakeLength * 0.5);
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    // Draw snake segments
    gameState.snake.forEach((segment, index) => {
      const x = segment.x * CELL_SIZE + CELL_SIZE / 2;
      const y = segment.y * CELL_SIZE + CELL_SIZE / 2;
      const isHead = index === 0;

      // Calculate segment size (head is bigger, tail tapers)
      const progress = index / Math.max(snakeLength - 1, 1);
      const baseRadius = isHead ? CELL_SIZE / 2 - 1 : CELL_SIZE / 2 - 2;
      const radius = baseRadius * (isHead ? 1 : (1 - progress * 0.4));

      // Enhanced glow effect for head
      if (isHead) {
        // Outer pulsing glow
        const glowPulse = (Math.sin(animationFrame * 0.15) + 1) / 2;
        const glowRadius = radius + 12 + glowPulse * 6;
        const headOuterGlow = ctx.createRadialGradient(x, y, 0, x, y, glowRadius);
        headOuterGlow.addColorStop(0, 'rgba(0, 255, 136, 0.5)');
        headOuterGlow.addColorStop(0.5, 'rgba(0, 255, 136, 0.15)');
        headOuterGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = headOuterGlow;
        ctx.beginPath();
        ctx.arc(x, y, glowRadius, 0, Math.PI * 2);
        ctx.fill();

        // Inner bright glow
        const headGlow = ctx.createRadialGradient(x, y, 0, x, y, radius + 4);
        headGlow.addColorStop(0, COLORS.snakeHeadGlow);
        headGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = headGlow;
        ctx.beginPath();
        ctx.arc(x, y, radius + 4, 0, Math.PI * 2);
        ctx.fill();
      }

      // Body segment glow
      if (!isHead && index < snakeLength - 1) {
        const bodyGlowAlpha = 0.3 * (1 - progress);
        const bodyGlow = ctx.createRadialGradient(x, y, 0, x, y, radius + 3);
        bodyGlow.addColorStop(0, `rgba(0, 221, 255, ${bodyGlowAlpha})`);
        bodyGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = bodyGlow;
        ctx.beginPath();
        ctx.arc(x, y, radius + 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Segment gradient (green head to blue tail) with enhanced colors
      const segmentGradient = ctx.createRadialGradient(
        x - radius * 0.3, y - radius * 0.3, 0,
        x, y, radius
      );

      if (isHead) {
        segmentGradient.addColorStop(0, '#aaffdd');
        segmentGradient.addColorStop(0.3, '#66ffbb');
        segmentGradient.addColorStop(0.7, COLORS.snakeHead);
        segmentGradient.addColorStop(1, '#00aa55');
      } else {
        // Smooth gradient from cyan body to blue tail
        const hue = 180 + progress * 40; // Cyan to blue
        const saturation = 100;
        const lightness = 60 - progress * 15;
        const highlightL = Math.min(lightness + 20, 80);
        segmentGradient.addColorStop(0, `hsl(${hue}, ${saturation}%, ${highlightL}%)`);
        segmentGradient.addColorStop(0.5, `hsl(${hue}, ${saturation}%, ${lightness}%)`);
        segmentGradient.addColorStop(1, `hsl(${hue}, ${saturation}%, ${lightness - 10}%)`);
      }

      // Draw segment with slight border
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = segmentGradient;
      ctx.fill();

      // Segment highlight
      ctx.beginPath();
      ctx.arc(x - radius * 0.3, y - radius * 0.3, radius * 0.3, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${isHead ? 0.4 : 0.2 * (1 - progress)})`;
      ctx.fill();

      // Draw eyes on head
      if (isHead) {
        // Determine eye position based on direction
        const nextSegment = gameState.snake[1];
        let dx = 0, dy = 0;
        if (nextSegment) {
          dx = segment.x - nextSegment.x;
          dy = segment.y - nextSegment.y;
          // Handle wrapping
          if (dx > 1) dx = -1;
          if (dx < -1) dx = 1;
          if (dy > 1) dy = -1;
          if (dy < -1) dy = 1;
        } else {
          dx = 1; // Default facing right
        }

        const eyeOffset = radius * 0.4;
        const eyeRadius = radius * 0.28;
        const pupilRadius = eyeRadius * 0.55;

        // Position eyes perpendicular to direction
        let eye1X, eye1Y, eye2X, eye2Y;
        if (dx !== 0) {
          // Moving horizontally
          eye1X = x + dx * eyeOffset * 0.5;
          eye1Y = y - eyeOffset;
          eye2X = x + dx * eyeOffset * 0.5;
          eye2Y = y + eyeOffset;
        } else {
          // Moving vertically
          eye1X = x - eyeOffset;
          eye1Y = y + dy * eyeOffset * 0.5;
          eye2X = x + eyeOffset;
          eye2Y = y + dy * eyeOffset * 0.5;
        }

        // Draw eyes with glow
        [{ ex: eye1X, ey: eye1Y }, { ex: eye2X, ey: eye2Y }].forEach(({ ex, ey }) => {
          // Eye glow
          ctx.beginPath();
          ctx.arc(ex, ey, eyeRadius + 2, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.fill();

          // Eye white
          const eyeGradient = ctx.createRadialGradient(ex - 1, ey - 1, 0, ex, ey, eyeRadius);
          eyeGradient.addColorStop(0, '#ffffff');
          eyeGradient.addColorStop(1, '#dddddd');
          ctx.beginPath();
          ctx.arc(ex, ey, eyeRadius, 0, Math.PI * 2);
          ctx.fillStyle = eyeGradient;
          ctx.fill();

          // Pupil (offset toward direction)
          ctx.beginPath();
          ctx.arc(ex + dx * pupilRadius * 0.4, ey + dy * pupilRadius * 0.4, pupilRadius, 0, Math.PI * 2);
          ctx.fillStyle = COLORS.eyePupil;
          ctx.fill();

          // Eye highlight
          ctx.beginPath();
          ctx.arc(ex - pupilRadius * 0.3, ey - pupilRadius * 0.3, pupilRadius * 0.4, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.fill();
        });
      }
    });

    // Draw explosion particles (on top of snake)
    particlesRef.current.forEach((p) => {
      if (p.type === 'explosion') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        gradient.addColorStop(0, p.color);
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.globalAlpha = p.life;
        ctx.fill();
        ctx.globalAlpha = 1;
      }
    });

    // Game over overlay effect with dramatic animation
    if (gameState.gameOver) {
      const deathProgress = Math.min(gameOverFrameRef.current / 30, 1);
      const easeOut = 1 - Math.pow(1 - deathProgress, 3);

      // Expanding shockwave from death point
      const deathHead = gameState.snake[0];
      if (deathHead && deathProgress < 1) {
        const shockX = deathHead.x * CELL_SIZE + CELL_SIZE / 2;
        const shockY = deathHead.y * CELL_SIZE + CELL_SIZE / 2;
        const shockRadius = easeOut * width * 0.8;
        const shockGradient = ctx.createRadialGradient(
          shockX, shockY, shockRadius * 0.8,
          shockX, shockY, shockRadius
        );
        shockGradient.addColorStop(0, 'transparent');
        shockGradient.addColorStop(0.5, `rgba(255, 50, 50, ${0.4 * (1 - deathProgress)})`);
        shockGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = shockGradient;
        ctx.beginPath();
        ctx.arc(shockX, shockY, shockRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Darkening overlay
      ctx.fillStyle = `rgba(0, 0, 0, ${0.6 * easeOut})`;
      ctx.fillRect(0, 0, width, height);

      // Intense red vignette
      const vignetteGradient = ctx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, width * 0.7
      );
      vignetteGradient.addColorStop(0, 'transparent');
      vignetteGradient.addColorStop(0.5, `rgba(80, 0, 0, ${0.3 * easeOut})`);
      vignetteGradient.addColorStop(1, `rgba(150, 0, 0, ${0.5 * easeOut})`);
      ctx.fillStyle = vignetteGradient;
      ctx.fillRect(0, 0, width, height);

      // Chromatic aberration effect (color fringing)
      if (deathProgress > 0.3) {
        const aberrationAmount = (deathProgress - 0.3) * 3;
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = `rgba(255, 0, 0, ${0.05 * aberrationAmount})`;
        ctx.fillRect(2, 0, width, height);
        ctx.fillStyle = `rgba(0, 255, 255, ${0.05 * aberrationAmount})`;
        ctx.fillRect(-2, 0, width, height);
        ctx.globalCompositeOperation = 'source-over';
      }

      // Subtle noise overlay
      if (deathProgress > 0.5) {
        const noiseAlpha = 0.03 * (deathProgress - 0.5) * 2;
        for (let i = 0; i < 50; i++) {
          const nx = Math.random() * width;
          const ny = Math.random() * height;
          ctx.fillStyle = `rgba(255, 255, 255, ${noiseAlpha * Math.random()})`;
          ctx.fillRect(nx, ny, 2, 2);
        }
      }
    }
  }, [gameState, gridSize, animationFrame]);

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
