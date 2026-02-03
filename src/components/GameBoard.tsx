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

export function GameBoard({ gameState, gridSize }: GameBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with dark background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw subtle grid lines
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.1)';
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

    // Draw snake with neon glow effect
    gameState.snake.forEach((segment, index) => {
      const x = segment.x * CELL_SIZE;
      const y = segment.y * CELL_SIZE;
      const isHead = index === 0;

      // Outer glow
      ctx.shadowColor = isHead ? '#00ffff' : '#00ff88';
      ctx.shadowBlur = isHead ? 20 : 15;

      // Gradient fill for snake segment
      const gradient = ctx.createLinearGradient(x, y, x + CELL_SIZE, y + CELL_SIZE);
      if (isHead) {
        gradient.addColorStop(0, '#00ffff');
        gradient.addColorStop(1, '#00cccc');
      } else {
        gradient.addColorStop(0, '#00ff88');
        gradient.addColorStop(1, '#00cc66');
      }

      ctx.fillStyle = gradient;
      ctx.fillRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2);

      // Inner highlight
      ctx.shadowBlur = 0;
      ctx.fillStyle = isHead ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.2)';
      ctx.fillRect(x + 3, y + 3, CELL_SIZE - 8, CELL_SIZE - 8);
    });

    // Draw food with pulsing glow effect
    const foodX = gameState.food.x * CELL_SIZE;
    const foodY = gameState.food.y * CELL_SIZE;

    // Bright red/pink glow
    ctx.shadowColor = '#ff0066';
    ctx.shadowBlur = 25;

    // Radial gradient for food
    const foodGradient = ctx.createRadialGradient(
      foodX + CELL_SIZE / 2, foodY + CELL_SIZE / 2, 0,
      foodX + CELL_SIZE / 2, foodY + CELL_SIZE / 2, CELL_SIZE / 2
    );
    foodGradient.addColorStop(0, '#ff66aa');
    foodGradient.addColorStop(0.5, '#ff0066');
    foodGradient.addColorStop(1, '#cc0052');

    ctx.fillStyle = foodGradient;
    ctx.beginPath();
    ctx.arc(
      foodX + CELL_SIZE / 2,
      foodY + CELL_SIZE / 2,
      (CELL_SIZE - 2) / 2,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Food highlight
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.arc(
      foodX + CELL_SIZE / 2 - 3,
      foodY + CELL_SIZE / 2 - 3,
      3,
      0,
      Math.PI * 2
    );
    ctx.fill();
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
