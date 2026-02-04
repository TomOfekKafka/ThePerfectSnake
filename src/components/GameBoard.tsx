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

// Color palette
const COLORS = {
  background: '#0a0a0f',
  gridLine: 'rgba(40, 45, 60, 0.3)',
  snakeHead: '#00ff88',
  snakeHeadGlow: 'rgba(0, 255, 136, 0.6)',
  snakeBody: '#00cc6a',
  snakeBodyEnd: '#008855',
  food: '#ff3366',
  foodGlow: 'rgba(255, 51, 102, 0.7)',
  foodInner: '#ff6699',
};

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export function GameBoard({ gameState, gridSize }: GameBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const canvasWidth = gridSize * CELL_SIZE;
    const canvasHeight = gridSize * CELL_SIZE;

    let animationFrame = animationRef.current;

    const render = () => {
      animationFrame++;
      animationRef.current = animationFrame;

      // Clear with dark background
      ctx.fillStyle = COLORS.background;
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // Draw subtle grid
      ctx.strokeStyle = COLORS.gridLine;
      ctx.lineWidth = 1;
      for (let i = 0; i <= gridSize; i++) {
        ctx.beginPath();
        ctx.moveTo(i * CELL_SIZE, 0);
        ctx.lineTo(i * CELL_SIZE, canvasHeight);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(0, i * CELL_SIZE);
        ctx.lineTo(canvasWidth, i * CELL_SIZE);
        ctx.stroke();
      }

      // Draw snake with gradient and glow
      const snakeLength = gameState.snake.length;
      gameState.snake.forEach((segment, index) => {
        const x = segment.x * CELL_SIZE;
        const y = segment.y * CELL_SIZE;
        const isHead = index === 0;
        const progress = snakeLength > 1 ? index / (snakeLength - 1) : 0;

        // Calculate segment color (gradient from head to tail)
        const r = Math.round(0 + progress * 0);
        const g = Math.round(204 - progress * 100);
        const b = Math.round(106 - progress * 50);

        if (isHead) {
          // Glow effect for head
          const glowSize = 8 + Math.sin(animationFrame * 0.1) * 2;
          const gradient = ctx.createRadialGradient(
            x + CELL_SIZE / 2,
            y + CELL_SIZE / 2,
            0,
            x + CELL_SIZE / 2,
            y + CELL_SIZE / 2,
            CELL_SIZE / 2 + glowSize
          );
          gradient.addColorStop(0, COLORS.snakeHeadGlow);
          gradient.addColorStop(1, 'transparent');
          ctx.fillStyle = gradient;
          ctx.fillRect(
            x - glowSize,
            y - glowSize,
            CELL_SIZE + glowSize * 2,
            CELL_SIZE + glowSize * 2
          );

          // Head with brighter color
          ctx.fillStyle = COLORS.snakeHead;
          drawRoundedRect(ctx, x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2, 4);
          ctx.fill();

          // Eyes
          ctx.fillStyle = COLORS.background;
          const eyeSize = 3;
          const eyeOffset = 5;
          ctx.beginPath();
          ctx.arc(x + eyeOffset, y + CELL_SIZE / 2, eyeSize, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(
            x + CELL_SIZE - eyeOffset,
            y + CELL_SIZE / 2,
            eyeSize,
            0,
            Math.PI * 2
          );
          ctx.fill();
        } else {
          // Body segment with gradient color
          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          drawRoundedRect(ctx, x + 2, y + 2, CELL_SIZE - 4, CELL_SIZE - 4, 3);
          ctx.fill();
        }
      });

      // Draw food with pulsing glow
      const foodX = gameState.food.x * CELL_SIZE;
      const foodY = gameState.food.y * CELL_SIZE;
      const pulse = Math.sin(animationFrame * 0.15) * 0.3 + 0.7;
      const glowRadius = 12 + Math.sin(animationFrame * 0.1) * 4;

      // Outer glow
      const foodGlow = ctx.createRadialGradient(
        foodX + CELL_SIZE / 2,
        foodY + CELL_SIZE / 2,
        0,
        foodX + CELL_SIZE / 2,
        foodY + CELL_SIZE / 2,
        glowRadius
      );
      foodGlow.addColorStop(0, COLORS.foodGlow);
      foodGlow.addColorStop(1, 'transparent');
      ctx.fillStyle = foodGlow;
      ctx.fillRect(
        foodX - glowRadius,
        foodY - glowRadius,
        CELL_SIZE + glowRadius * 2,
        CELL_SIZE + glowRadius * 2
      );

      // Food body
      ctx.fillStyle = COLORS.food;
      ctx.globalAlpha = pulse;
      ctx.beginPath();
      ctx.arc(
        foodX + CELL_SIZE / 2,
        foodY + CELL_SIZE / 2,
        (CELL_SIZE - 4) / 2,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.globalAlpha = 1;

      // Inner highlight
      ctx.fillStyle = COLORS.foodInner;
      ctx.beginPath();
      ctx.arc(
        foodX + CELL_SIZE / 2 - 2,
        foodY + CELL_SIZE / 2 - 2,
        3,
        0,
        Math.PI * 2
      );
      ctx.fill();
    };

    render();

    // Animate at 60fps for smooth glow effects
    const intervalId = setInterval(render, 1000 / 60);

    return () => {
      clearInterval(intervalId);
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
