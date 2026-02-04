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

export function GameBoard({ gameState, gridSize }: GameBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const timeRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const animate = (timestamp: number) => {
      timeRef.current = timestamp;
      render(ctx, gameState, canvas.width, canvas.height, timestamp);
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

function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number) {
  ctx.strokeStyle = COLORS.gridLine;
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

function drawSnakeSegment(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  isHead: boolean,
  index: number,
  totalLength: number
) {
  const centerX = x * CELL_SIZE + CELL_SIZE / 2;
  const centerY = y * CELL_SIZE + CELL_SIZE / 2;
  const radius = (CELL_SIZE - 4) / 2;

  // Calculate color based on position (gradient from head to tail)
  const progress = totalLength > 1 ? index / (totalLength - 1) : 0;

  if (isHead) {
    // Draw head glow
    ctx.shadowColor = COLORS.snakeHeadGlow;
    ctx.shadowBlur = 15;

    // Head is larger and brighter
    const gradient = ctx.createRadialGradient(
      centerX - 2, centerY - 2, 0,
      centerX, centerY, radius + 2
    );
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.3, COLORS.snakeHead);
    gradient.addColorStop(1, COLORS.snakeBody);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(
      x * CELL_SIZE + 1,
      y * CELL_SIZE + 1,
      CELL_SIZE - 2,
      CELL_SIZE - 2,
      6
    );
    ctx.fill();

    // Draw eyes
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#0a0a0f';
    const eyeSize = 3;
    const eyeOffset = 4;
    ctx.beginPath();
    ctx.arc(centerX - eyeOffset, centerY - 2, eyeSize, 0, Math.PI * 2);
    ctx.arc(centerX + eyeOffset, centerY - 2, eyeSize, 0, Math.PI * 2);
    ctx.fill();

    // Eye shine
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(centerX - eyeOffset + 1, centerY - 3, 1.5, 0, Math.PI * 2);
    ctx.arc(centerX + eyeOffset + 1, centerY - 3, 1.5, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Body segments with gradient fade
    const alpha = 1 - (progress * 0.4);
    const hue = 150 - (progress * 20); // Shift from cyan-green to deeper green

    ctx.shadowColor = COLORS.snakeBodyGlow;
    ctx.shadowBlur = 8 - (progress * 5);

    const segmentColor = `hsla(${hue}, 100%, ${55 - progress * 15}%, ${alpha})`;
    ctx.fillStyle = segmentColor;

    ctx.beginPath();
    ctx.roundRect(
      x * CELL_SIZE + 2,
      y * CELL_SIZE + 2,
      CELL_SIZE - 4,
      CELL_SIZE - 4,
      4
    );
    ctx.fill();
  }

  ctx.shadowBlur = 0;
}

function drawFood(
  ctx: CanvasRenderingContext2D,
  food: Position,
  time: number
) {
  const centerX = food.x * CELL_SIZE + CELL_SIZE / 2;
  const centerY = food.y * CELL_SIZE + CELL_SIZE / 2;

  // Pulsing animation
  const pulse = Math.sin(time / 200) * 0.3 + 1;
  const glowPulse = Math.sin(time / 150) * 0.4 + 0.6;

  // Outer glow
  ctx.shadowColor = COLORS.foodGlow;
  ctx.shadowBlur = 20 * glowPulse;

  // Draw multiple layers for intense glow effect
  const baseRadius = (CELL_SIZE - 6) / 2;
  const radius = baseRadius * pulse;

  // Outer ring
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

  // Core
  ctx.shadowBlur = 15;
  const coreGradient = ctx.createRadialGradient(
    centerX - 2, centerY - 2, 0,
    centerX, centerY, radius
  );
  coreGradient.addColorStop(0, '#ffffff');
  coreGradient.addColorStop(0.4, COLORS.foodCore);
  coreGradient.addColorStop(1, COLORS.food);

  ctx.fillStyle = coreGradient;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();

  // Inner shine
  ctx.shadowBlur = 0;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.beginPath();
  ctx.arc(centerX - 3, centerY - 3, radius * 0.25, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 0;
}

function render(
  ctx: CanvasRenderingContext2D,
  state: GameBoardState,
  width: number,
  height: number,
  time: number
) {
  // Clear canvas with dark background
  ctx.fillStyle = COLORS.background;
  ctx.fillRect(0, 0, width, height);

  // Draw subtle grid
  drawGrid(ctx, width, height);

  // Draw snake (back to front so head is on top)
  const snakeLength = state.snake.length;
  for (let i = snakeLength - 1; i >= 0; i--) {
    const segment = state.snake[i];
    drawSnakeSegment(ctx, segment.x, segment.y, i === 0, i, snakeLength);
  }

  // Draw food with animation
  drawFood(ctx, state.food, time);
}
