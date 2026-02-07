import { useEffect, useRef } from 'react';
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

const CELL_SIZE = 20;

// Neon color palette
const COLORS = {
  background: '#0a0a0f',
  gridLine: '#1a1a2e',
  snakeHead: '#00ff88',
  snakeTail: '#004d29',
  snakeGlow: '#00ff88',
  food: '#ff0066',
  foodGlow: '#ff0066',
  gameOverOverlay: 'rgba(10, 10, 15, 0.85)',
  gameOverText: '#ff0066',
};

export function GameBoard({ gameState, gridSize }: GameBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = (timestamp: number) => {
      timeRef.current = timestamp;

      // Clear canvas with dark background
      ctx.fillStyle = COLORS.background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw subtle grid pattern
      ctx.strokeStyle = COLORS.gridLine;
      ctx.lineWidth = 0.5;
      for (let i = 0; i <= gridSize; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE, 0);
        ctx.lineTo(i * CELL_SIZE, canvas.height);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * CELL_SIZE);
        ctx.lineTo(canvas.width, i * CELL_SIZE);
        ctx.stroke();
      }

      // Draw snake with gradient and glow effect
      const snakeLength = gameState.snake.length;

      gameState.snake.forEach((segment, index) => {
        const isHead = index === 0;
        const progress = snakeLength > 1 ? index / (snakeLength - 1) : 0;

        const x = segment.x * CELL_SIZE;
        const y = segment.y * CELL_SIZE;
        const size = CELL_SIZE - 2;
        const centerX = x + CELL_SIZE / 2;
        const centerY = y + CELL_SIZE / 2;

        // Glow effect (stronger for head)
        const glowIntensity = isHead ? 15 : 8 - progress * 5;
        ctx.shadowColor = COLORS.snakeGlow;
        ctx.shadowBlur = glowIntensity;

        // Gradient color from head to tail
        const r = Math.round(0 + progress * 0);
        const g = Math.round(255 - progress * 180);
        const b = Math.round(136 - progress * 95);
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;

        if (isHead) {
          // Draw head as rounded rectangle
          const radius = 6;
          ctx.beginPath();
          ctx.roundRect(x + 1, y + 1, size, size, radius);
          ctx.fill();

          // Reset shadow for eyes
          ctx.shadowBlur = 0;

          // Draw eyes based on snake direction
          const eyeSize = 3;
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

          // Draw glowing eyes
          ctx.fillStyle = '#ffffff';
          ctx.shadowColor = '#ffffff';
          ctx.shadowBlur = 4;
          ctx.beginPath();
          ctx.arc(eye1X, eye1Y, eyeSize, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(eye2X, eye2Y, eyeSize, 0, Math.PI * 2);
          ctx.fill();

          // Pupils
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#000000';
          ctx.beginPath();
          ctx.arc(eye1X, eye1Y, 1.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(eye2X, eye2Y, 1.5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Draw body segment as rounded rectangle
          const radius = 4;
          ctx.beginPath();
          ctx.roundRect(x + 1, y + 1, size, size, radius);
          ctx.fill();
        }
      });

      // Reset shadow
      ctx.shadowBlur = 0;

      // Draw pulsing, glowing food
      const foodX = gameState.food.x * CELL_SIZE + CELL_SIZE / 2;
      const foodY = gameState.food.y * CELL_SIZE + CELL_SIZE / 2;
      const pulseScale = 1 + Math.sin(timestamp / 200) * 0.15;
      const foodRadius = (CELL_SIZE / 2 - 2) * pulseScale;

      // Outer glow
      const glowRadius = foodRadius + 8 + Math.sin(timestamp / 150) * 3;
      const gradient = ctx.createRadialGradient(
        foodX, foodY, foodRadius * 0.5,
        foodX, foodY, glowRadius
      );
      gradient.addColorStop(0, 'rgba(255, 0, 102, 0.8)');
      gradient.addColorStop(0.5, 'rgba(255, 0, 102, 0.3)');
      gradient.addColorStop(1, 'rgba(255, 0, 102, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(foodX, foodY, glowRadius, 0, Math.PI * 2);
      ctx.fill();

      // Food core
      ctx.shadowColor = COLORS.foodGlow;
      ctx.shadowBlur = 15;
      ctx.fillStyle = COLORS.food;
      ctx.beginPath();
      ctx.arc(foodX, foodY, foodRadius, 0, Math.PI * 2);
      ctx.fill();

      // Inner highlight
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.arc(foodX - foodRadius * 0.3, foodY - foodRadius * 0.3, foodRadius * 0.3, 0, Math.PI * 2);
      ctx.fill();

      // Game over overlay
      if (gameState.gameOver) {
        ctx.fillStyle = COLORS.gameOverOverlay;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Glitchy game over text effect
        ctx.font = 'bold 28px monospace';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const text = 'GAME OVER';
        const textX = canvas.width / 2;
        const textY = canvas.height / 2;

        // Chromatic aberration effect
        ctx.fillStyle = 'rgba(0, 255, 255, 0.7)';
        ctx.fillText(text, textX - 2, textY);
        ctx.fillStyle = 'rgba(255, 0, 255, 0.7)';
        ctx.fillText(text, textX + 2, textY);

        // Main text with glow
        ctx.shadowColor = COLORS.gameOverText;
        ctx.shadowBlur = 20;
        ctx.fillStyle = COLORS.gameOverText;
        ctx.fillText(text, textX, textY);
        ctx.shadowBlur = 0;
      }

      // Continue animation loop for pulsing food
      animationFrameRef.current = requestAnimationFrame(render);
    };

    animationFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameState, gridSize]);

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
