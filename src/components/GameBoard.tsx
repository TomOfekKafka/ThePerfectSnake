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
  snakeBody: '#00cc6a',
  snakeTail: '#008844',
  snakeGlow: '#00ff88',
  food: '#ff0066',
  foodGlow: '#ff0066',
};

export function GameBoard({ gameState, gridSize }: GameBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas with dark background
    ctx.fillStyle = COLORS.background;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw subtle grid lines
    ctx.strokeStyle = COLORS.gridLine;
    ctx.lineWidth = 1;
    for (let i = 0; i <= gridSize; i++) {
      // Vertical lines
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, canvas.height);
      ctx.stroke();
      // Horizontal lines
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(canvas.width, i * CELL_SIZE);
      ctx.stroke();
    }

    // Draw snake with neon glow effect
    const snakeLength = gameState.snake.length;
    gameState.snake.forEach((segment, index) => {
      // Calculate color gradient from head to tail
      const ratio = index / Math.max(snakeLength - 1, 1);

      // Interpolate between head and tail colors
      const r = Math.round(0 + (0 - 0) * ratio);
      const g = Math.round(255 - (255 - 136) * ratio);
      const b = Math.round(136 - (136 - 68) * ratio);
      const segmentColor = `rgb(${r}, ${g}, ${b})`;

      // Draw glow (stronger for head)
      const glowIntensity = index === 0 ? 15 : 8;
      ctx.shadowColor = COLORS.snakeGlow;
      ctx.shadowBlur = glowIntensity;

      // Draw segment with rounded corners
      ctx.fillStyle = segmentColor;
      const x = segment.x * CELL_SIZE + 1;
      const y = segment.y * CELL_SIZE + 1;
      const size = CELL_SIZE - 2;
      const radius = index === 0 ? 6 : 4; // Rounder head

      ctx.beginPath();
      ctx.roundRect(x, y, size, size, radius);
      ctx.fill();

      // Add highlight to head
      if (index === 0) {
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.roundRect(x + 2, y + 2, size / 2 - 2, size / 2 - 2, 3);
        ctx.fill();
      }
    });

    // Reset shadow for food
    ctx.shadowColor = COLORS.foodGlow;
    ctx.shadowBlur = 20;

    // Draw food with pulsing glow effect
    ctx.fillStyle = COLORS.food;
    const foodX = gameState.food.x * CELL_SIZE + CELL_SIZE / 2;
    const foodY = gameState.food.y * CELL_SIZE + CELL_SIZE / 2;
    const foodRadius = (CELL_SIZE - 4) / 2;

    // Draw circular food
    ctx.beginPath();
    ctx.arc(foodX, foodY, foodRadius, 0, Math.PI * 2);
    ctx.fill();

    // Add inner highlight
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(foodX - 2, foodY - 2, foodRadius / 3, 0, Math.PI * 2);
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
