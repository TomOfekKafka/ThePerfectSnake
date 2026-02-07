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
  snakeHeadGlow: '#00ff88',
  snakeTail: '#0088ff',
  food: '#ff0066',
  foodGlow: '#ff0066',
  gameOverTint: 'rgba(255, 0, 50, 0.3)',
};

export function GameBoard({ gameState, gridSize }: GameBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef<number>(0);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      frameRef.current += 1;
      const time = frameRef.current * 0.05;

      // Dark background
      ctx.fillStyle = COLORS.background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw subtle grid
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

      // Draw snake with gradient and glow
      const snakeLength = gameState.snake.length;
      gameState.snake.forEach((segment, index) => {
        const isHead = index === 0;
        const progress = snakeLength > 1 ? index / (snakeLength - 1) : 0;

        const x = segment.x * CELL_SIZE;
        const y = segment.y * CELL_SIZE;
        const size = CELL_SIZE - 2;
        const radius = isHead ? 6 : 4;

        // Interpolate color from head to tail
        const r = Math.round(0 + progress * 0);
        const g = Math.round(255 - progress * (255 - 136));
        const b = Math.round(136 + progress * (255 - 136));
        const segmentColor = `rgb(${r}, ${g}, ${b})`;

        // Glow effect (stronger for head)
        if (isHead) {
          ctx.shadowColor = COLORS.snakeHeadGlow;
          ctx.shadowBlur = 15;
        } else {
          ctx.shadowColor = segmentColor;
          ctx.shadowBlur = 8;
        }

        // Draw rounded rectangle
        ctx.fillStyle = segmentColor;
        ctx.beginPath();
        ctx.roundRect(x + 1, y + 1, size, size, radius);
        ctx.fill();

        // Add shine effect to head
        if (isHead) {
          ctx.shadowBlur = 0;
          const gradient = ctx.createLinearGradient(x, y, x, y + size);
          gradient.addColorStop(0, 'rgba(255, 255, 255, 0.4)');
          gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
          gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = gradient;
          ctx.beginPath();
          ctx.roundRect(x + 1, y + 1, size, size / 2, [radius, radius, 0, 0]);
          ctx.fill();
        }
      });

      // Reset shadow for food
      ctx.shadowBlur = 0;

      // Draw pulsing food with glow
      const foodX = gameState.food.x * CELL_SIZE;
      const foodY = gameState.food.y * CELL_SIZE;
      const pulseScale = 1 + Math.sin(time * 3) * 0.15;
      const foodSize = (CELL_SIZE - 4) * pulseScale;

      // Outer glow
      const glowIntensity = 15 + Math.sin(time * 3) * 8;
      ctx.shadowColor = COLORS.foodGlow;
      ctx.shadowBlur = glowIntensity;

      // Food with radial gradient
      const foodGradient = ctx.createRadialGradient(
        foodX + CELL_SIZE / 2,
        foodY + CELL_SIZE / 2,
        0,
        foodX + CELL_SIZE / 2,
        foodY + CELL_SIZE / 2,
        foodSize / 2
      );
      foodGradient.addColorStop(0, '#ff4488');
      foodGradient.addColorStop(0.7, COLORS.food);
      foodGradient.addColorStop(1, '#cc0044');

      ctx.fillStyle = foodGradient;
      ctx.beginPath();
      ctx.arc(
        foodX + CELL_SIZE / 2,
        foodY + CELL_SIZE / 2,
        foodSize / 2,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Reset shadow
      ctx.shadowBlur = 0;

      // Game over overlay
      if (gameState.gameOver) {
        ctx.fillStyle = COLORS.gameOverTint;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Flicker effect
        if (Math.sin(time * 10) > 0) {
          ctx.fillStyle = 'rgba(255, 0, 50, 0.1)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
      }

      animationRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
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
