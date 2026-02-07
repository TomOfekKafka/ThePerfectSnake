import { useEffect, useRef, useCallback } from 'react';
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
  type: 'trail' | 'eat' | 'death';
}

interface ScorePopup {
  x: number;
  y: number;
  value: number;
  life: number;
  maxLife: number;
}

const CELL_SIZE = 20;

// Enhanced neon color palette
const COLORS = {
  background: '#0a0a0f',
  gridLine: '#1a1a2e',
  gridPulse: '#2a2a4e',
  snakeHead: '#00ff88',
  snakeTail: '#004d29',
  snakeGlow: '#00ff88',
  snakeHighlight: '#88ffcc',
  food: '#ff0066',
  foodGlow: '#ff0066',
  foodCore: '#ff4488',
  gameOverOverlay: 'rgba(10, 10, 15, 0.9)',
  gameOverText: '#ff0066',
  particleTrail: '#00ff88',
  particleEat: '#ff0066',
  particleDeath: '#ff3333',
};

export function GameBoard({ gameState, gridSize }: GameBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const scorePopupsRef = useRef<ScorePopup[]>([]);
  const prevSnakeLengthRef = useRef<number>(gameState.snake.length);
  const prevFoodPosRef = useRef<Position>({ ...gameState.food });
  const prevGameOverRef = useRef<boolean>(gameState.gameOver);
  const shakeRef = useRef<{ x: number; y: number; intensity: number }>({ x: 0, y: 0, intensity: 0 });

  // Spawn particles for trail effect
  const spawnTrailParticles = useCallback((x: number, y: number) => {
    const count = 2;
    for (let i = 0; i < count; i++) {
      particlesRef.current.push({
        x: x + CELL_SIZE / 2 + (Math.random() - 0.5) * 8,
        y: y + CELL_SIZE / 2 + (Math.random() - 0.5) * 8,
        vx: (Math.random() - 0.5) * 1.5,
        vy: (Math.random() - 0.5) * 1.5,
        life: 1,
        maxLife: 1,
        size: Math.random() * 3 + 2,
        color: COLORS.particleTrail,
        type: 'trail',
      });
    }
  }, []);

  // Spawn explosion particles when eating food
  const spawnEatParticles = useCallback((x: number, y: number) => {
    const count = 20;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = Math.random() * 4 + 2;
      particlesRef.current.push({
        x: x + CELL_SIZE / 2,
        y: y + CELL_SIZE / 2,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 1,
        size: Math.random() * 5 + 3,
        color: Math.random() > 0.5 ? COLORS.particleEat : COLORS.snakeHead,
        type: 'eat',
      });
    }
    // Add screen shake
    shakeRef.current.intensity = 8;
  }, []);

  // Spawn death explosion particles
  const spawnDeathParticles = useCallback((snake: Position[]) => {
    snake.forEach((segment, index) => {
      const delay = index * 50;
      setTimeout(() => {
        const count = 8;
        for (let i = 0; i < count; i++) {
          const angle = (Math.PI * 2 * i) / count;
          const speed = Math.random() * 3 + 1;
          particlesRef.current.push({
            x: segment.x * CELL_SIZE + CELL_SIZE / 2,
            y: segment.y * CELL_SIZE + CELL_SIZE / 2,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            life: 1,
            maxLife: 1,
            size: Math.random() * 4 + 2,
            color: COLORS.particleDeath,
            type: 'death',
          });
        }
      }, delay);
    });
    shakeRef.current.intensity = 15;
  }, []);

  // Spawn score popup
  const spawnScorePopup = useCallback((x: number, y: number, value: number) => {
    scorePopupsRef.current.push({
      x: x + CELL_SIZE / 2,
      y: y + CELL_SIZE / 2,
      value,
      life: 1,
      maxLife: 1,
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Check for food eaten (snake grew)
    if (gameState.snake.length > prevSnakeLengthRef.current) {
      spawnEatParticles(prevFoodPosRef.current.x * CELL_SIZE, prevFoodPosRef.current.y * CELL_SIZE);
      spawnScorePopup(prevFoodPosRef.current.x * CELL_SIZE, prevFoodPosRef.current.y * CELL_SIZE, 10);
    }
    prevSnakeLengthRef.current = gameState.snake.length;
    prevFoodPosRef.current = { ...gameState.food };

    // Check for game over (death)
    if (gameState.gameOver && !prevGameOverRef.current) {
      spawnDeathParticles(gameState.snake);
    }
    prevGameOverRef.current = gameState.gameOver;

    // Spawn trail particles from snake tail
    if (gameState.snake.length > 0 && !gameState.gameOver) {
      const tail = gameState.snake[gameState.snake.length - 1];
      spawnTrailParticles(tail.x * CELL_SIZE, tail.y * CELL_SIZE);
    }

    const render = (timestamp: number) => {
      // Update screen shake
      if (shakeRef.current.intensity > 0) {
        shakeRef.current.x = (Math.random() - 0.5) * shakeRef.current.intensity;
        shakeRef.current.y = (Math.random() - 0.5) * shakeRef.current.intensity;
        shakeRef.current.intensity *= 0.9;
        if (shakeRef.current.intensity < 0.5) {
          shakeRef.current.intensity = 0;
          shakeRef.current.x = 0;
          shakeRef.current.y = 0;
        }
      }

      ctx.save();
      ctx.translate(shakeRef.current.x, shakeRef.current.y);

      // Clear canvas with dark background
      ctx.fillStyle = COLORS.background;
      ctx.fillRect(-10, -10, canvas.width + 20, canvas.height + 20);

      // Draw animated background grid with pulse effect
      const gridPulse = Math.sin(timestamp / 1000) * 0.3 + 0.7;
      ctx.strokeStyle = COLORS.gridLine;
      ctx.lineWidth = 0.5;

      for (let i = 0; i <= gridSize; i++) {
        // Add subtle wave to grid lines
        const waveOffset = Math.sin(timestamp / 500 + i * 0.3) * 0.5;
        ctx.globalAlpha = gridPulse;
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE, 0);
        ctx.lineTo(i * CELL_SIZE + waveOffset, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * CELL_SIZE);
        ctx.lineTo(canvas.width, i * CELL_SIZE + waveOffset);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      // Draw glow around snake head area (light up nearby grid)
      if (gameState.snake.length > 0 && !gameState.gameOver) {
        const head = gameState.snake[0];
        const headX = head.x * CELL_SIZE + CELL_SIZE / 2;
        const headY = head.y * CELL_SIZE + CELL_SIZE / 2;

        const glowGradient = ctx.createRadialGradient(headX, headY, 0, headX, headY, CELL_SIZE * 3);
        glowGradient.addColorStop(0, 'rgba(0, 255, 136, 0.1)');
        glowGradient.addColorStop(1, 'rgba(0, 255, 136, 0)');
        ctx.fillStyle = glowGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // Update and draw particles
      particlesRef.current = particlesRef.current.filter(p => {
        p.life -= p.type === 'trail' ? 0.03 : 0.02;
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.98;
        p.vy *= 0.98;

        if (p.life <= 0) return false;

        const alpha = p.life;
        ctx.globalAlpha = alpha;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 10;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;

        return true;
      });

      // Draw snake with enhanced effects
      const snakeLength = gameState.snake.length;

      // Draw connecting segments (body trail) for smoother look
      if (snakeLength > 1 && !gameState.gameOver) {
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (let i = 1; i < snakeLength; i++) {
          const segment = gameState.snake[i];
          const prevSegment = gameState.snake[i - 1];
          const progress = snakeLength > 1 ? i / (snakeLength - 1) : 0;

          const x1 = prevSegment.x * CELL_SIZE + CELL_SIZE / 2;
          const y1 = prevSegment.y * CELL_SIZE + CELL_SIZE / 2;
          const x2 = segment.x * CELL_SIZE + CELL_SIZE / 2;
          const y2 = segment.y * CELL_SIZE + CELL_SIZE / 2;

          // Skip if segments are too far apart (wrap around)
          if (Math.abs(prevSegment.x - segment.x) <= 1 && Math.abs(prevSegment.y - segment.y) <= 1) {
            const lineWidth = CELL_SIZE - 4 - progress * 6;
            const g = Math.round(255 - progress * 180);
            const b = Math.round(136 - progress * 95);

            ctx.strokeStyle = `rgb(0, ${g}, ${b})`;
            ctx.lineWidth = lineWidth;
            ctx.shadowColor = COLORS.snakeGlow;
            ctx.shadowBlur = 8 - progress * 5;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
          }
        }
        ctx.shadowBlur = 0;
      }

      // Draw snake segments
      gameState.snake.forEach((segment, index) => {
        const isHead = index === 0;
        const progress = snakeLength > 1 ? index / (snakeLength - 1) : 0;

        const x = segment.x * CELL_SIZE;
        const y = segment.y * CELL_SIZE;
        const size = CELL_SIZE - 2;
        const centerX = x + CELL_SIZE / 2;
        const centerY = y + CELL_SIZE / 2;

        // Glow effect (stronger for head)
        const glowIntensity = isHead ? 20 : 10 - progress * 7;
        ctx.shadowColor = COLORS.snakeGlow;
        ctx.shadowBlur = glowIntensity;

        // Gradient color from head to tail
        const g = Math.round(255 - progress * 180);
        const b = Math.round(136 - progress * 95);

        if (isHead) {
          // Draw head with more detail
          const radius = 6;

          // Head gradient
          const headGradient = ctx.createRadialGradient(
            centerX - 3, centerY - 3, 0,
            centerX, centerY, size / 2
          );
          headGradient.addColorStop(0, COLORS.snakeHighlight);
          headGradient.addColorStop(0.5, COLORS.snakeHead);
          headGradient.addColorStop(1, `rgb(0, ${g - 30}, ${b - 20})`);

          ctx.fillStyle = headGradient;
          ctx.beginPath();
          ctx.roundRect(x + 1, y + 1, size, size, radius);
          ctx.fill();

          // Reset shadow for eyes
          ctx.shadowBlur = 0;

          // Draw eyes based on snake direction
          const eyeSize = 4;
          const eyeOffset = 5;
          let eye1X = centerX - eyeOffset;
          let eye1Y = centerY - eyeOffset;
          let eye2X = centerX + eyeOffset;
          let eye2Y = centerY - eyeOffset;

          // Determine direction from head to next segment (if exists)
          if (gameState.snake.length > 1) {
            const next = gameState.snake[1];
            const dx = segment.x - next.x;
            const dy = segment.y - next.y;

            if (dx > 0 || (dx < -1)) { // Moving right (or wrapped)
              eye1X = centerX + 2; eye1Y = centerY - eyeOffset;
              eye2X = centerX + 2; eye2Y = centerY + eyeOffset;
            } else if (dx < 0 || (dx > 1)) { // Moving left (or wrapped)
              eye1X = centerX - 4; eye1Y = centerY - eyeOffset;
              eye2X = centerX - 4; eye2Y = centerY + eyeOffset;
            } else if (dy > 0 || (dy < -1)) { // Moving down (or wrapped)
              eye1X = centerX - eyeOffset; eye1Y = centerY + 2;
              eye2X = centerX + eyeOffset; eye2Y = centerY + 2;
            } else if (dy < 0 || (dy > 1)) { // Moving up (or wrapped)
              eye1X = centerX - eyeOffset; eye1Y = centerY - 4;
              eye2X = centerX + eyeOffset; eye2Y = centerY - 4;
            }
          }

          // Draw glowing eyes with animated blink occasionally
          const blinkCycle = Math.sin(timestamp / 2000);
          const eyeScale = blinkCycle > 0.95 ? 0.3 : 1;

          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.ellipse(eye1X, eye1Y, eyeSize * eyeScale, eyeSize, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.ellipse(eye2X, eye2Y, eyeSize * eyeScale, eyeSize, 0, 0, Math.PI * 2);
          ctx.fill();

          // Pupils with slight movement
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#000000';
          const pupilOffset = Math.sin(timestamp / 300) * 0.5;
          ctx.beginPath();
          ctx.arc(eye1X + pupilOffset, eye1Y, 2, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(eye2X + pupilOffset, eye2Y, 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Draw body segment with gradient
          const segmentGradient = ctx.createRadialGradient(
            centerX - 2, centerY - 2, 0,
            centerX, centerY, size / 2
          );
          segmentGradient.addColorStop(0, `rgb(30, ${g + 30}, ${b + 30})`);
          segmentGradient.addColorStop(1, `rgb(0, ${g}, ${b})`);

          ctx.fillStyle = segmentGradient;
          const radius = 4;
          ctx.beginPath();
          ctx.roundRect(x + 1, y + 1, size, size, radius);
          ctx.fill();
        }
      });

      // Reset shadow
      ctx.shadowBlur = 0;

      // Draw pulsing, glowing food with enhanced effects
      const foodX = gameState.food.x * CELL_SIZE + CELL_SIZE / 2;
      const foodY = gameState.food.y * CELL_SIZE + CELL_SIZE / 2;
      const pulseScale = 1 + Math.sin(timestamp / 200) * 0.2;
      const foodRadius = (CELL_SIZE / 2 - 2) * pulseScale;

      // Rotating ring effect
      const ringCount = 3;
      for (let i = 0; i < ringCount; i++) {
        const ringRadius = foodRadius + 10 + i * 5 + Math.sin(timestamp / 300 + i) * 3;
        const ringAlpha = 0.3 - i * 0.1;
        ctx.strokeStyle = `rgba(255, 0, 102, ${ringAlpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(foodX, foodY, ringRadius,
          timestamp / 500 + i * Math.PI / 3,
          timestamp / 500 + i * Math.PI / 3 + Math.PI);
        ctx.stroke();
      }

      // Outer glow with animation
      const glowRadius = foodRadius + 12 + Math.sin(timestamp / 150) * 4;
      const gradient = ctx.createRadialGradient(
        foodX, foodY, foodRadius * 0.3,
        foodX, foodY, glowRadius
      );
      gradient.addColorStop(0, 'rgba(255, 68, 136, 0.9)');
      gradient.addColorStop(0.4, 'rgba(255, 0, 102, 0.5)');
      gradient.addColorStop(0.7, 'rgba(255, 0, 102, 0.2)');
      gradient.addColorStop(1, 'rgba(255, 0, 102, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(foodX, foodY, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      // Food core with inner gradient
      const coreGradient = ctx.createRadialGradient(
        foodX - foodRadius * 0.3, foodY - foodRadius * 0.3, 0,
        foodX, foodY, foodRadius
      );
      coreGradient.addColorStop(0, '#ff88aa');
      coreGradient.addColorStop(0.5, COLORS.food);
      coreGradient.addColorStop(1, '#cc0044');

      ctx.shadowColor = COLORS.foodGlow;
      ctx.shadowBlur = 20;
      ctx.fillStyle = coreGradient;
      ctx.beginPath();
      ctx.arc(foodX, foodY, foodRadius, 0, Math.PI * 2);
      ctx.fill();

      // Inner highlight (glossy effect)
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.beginPath();
      ctx.ellipse(foodX - foodRadius * 0.3, foodY - foodRadius * 0.3, foodRadius * 0.35, foodRadius * 0.25, -Math.PI / 4, 0, Math.PI * 2);
      ctx.fill();

      // Sparkle effect on food
      const sparkleCount = 4;
      for (let i = 0; i < sparkleCount; i++) {
        const angle = (timestamp / 400 + (Math.PI * 2 * i) / sparkleCount);
        const sparkleX = foodX + Math.cos(angle) * (foodRadius + 5);
        const sparkleY = foodY + Math.sin(angle) * (foodRadius + 5);
        const sparkleAlpha = 0.5 + Math.sin(timestamp / 100 + i) * 0.3;

        ctx.fillStyle = `rgba(255, 255, 255, ${sparkleAlpha})`;
        ctx.beginPath();
        ctx.arc(sparkleX, sparkleY, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Update and draw score popups
      scorePopupsRef.current = scorePopupsRef.current.filter(popup => {
        popup.life -= 0.02;
        popup.y -= 1.5;

        if (popup.life <= 0) return false;

        const alpha = popup.life;
        const scale = 1 + (1 - popup.life) * 0.5;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.font = `bold ${16 * scale}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Glow effect for text
        ctx.shadowColor = COLORS.snakeHead;
        ctx.shadowBlur = 10;
        ctx.fillStyle = COLORS.snakeHead;
        ctx.fillText(`+${popup.value}`, popup.x, popup.y);

        ctx.restore();

        return true;
      });

      // Game over overlay with enhanced effects
      if (gameState.gameOver) {
        // Animated vignette
        const vignetteGradient = ctx.createRadialGradient(
          canvas.width / 2, canvas.height / 2, 0,
          canvas.width / 2, canvas.height / 2, canvas.width / 1.5
        );
        vignetteGradient.addColorStop(0, 'rgba(10, 10, 15, 0.7)');
        vignetteGradient.addColorStop(1, 'rgba(10, 10, 15, 0.95)');
        ctx.fillStyle = vignetteGradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Glitchy game over text effect with animation
        ctx.font = 'bold 32px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const text = 'GAME OVER';
        const textX = canvas.width / 2;
        const textY = canvas.height / 2;

        // Animated glitch offset
        const glitchOffset = Math.sin(timestamp / 50) * 3;

        // Chromatic aberration effect with animation
        ctx.fillStyle = 'rgba(0, 255, 255, 0.8)';
        ctx.fillText(text, textX - 3 + glitchOffset, textY - 1);
        ctx.fillStyle = 'rgba(255, 0, 255, 0.8)';
        ctx.fillText(text, textX + 3 - glitchOffset, textY + 1);

        // Main text with pulsing glow
        const glowPulse = 15 + Math.sin(timestamp / 200) * 10;
        ctx.shadowColor = COLORS.gameOverText;
        ctx.shadowBlur = glowPulse;
        ctx.fillStyle = COLORS.gameOverText;
        ctx.fillText(text, textX, textY);

        // Subtitle
        ctx.shadowBlur = 5;
        ctx.font = 'bold 14px monospace';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillText('Press START to play again', textX, textY + 40);

        ctx.shadowBlur = 0;
      }

      ctx.restore();

      // Continue animation loop for effects
      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState, gridSize, spawnTrailParticles, spawnEatParticles, spawnDeathParticles, spawnScorePopup]);

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
