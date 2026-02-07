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
  bgDark: '#0a0a1a',
  bgLight: '#12122a',
  gridLine: 'rgba(50, 50, 100, 0.3)',
  snakeHead: '#00ff88',
  snakeHeadGlow: 'rgba(0, 255, 136, 0.6)',
  snakeBody: '#00cc6a',
  snakeBodyGlow: 'rgba(0, 204, 106, 0.4)',
  snakeTail: '#009952',
  food: '#ff3366',
  foodGlow: 'rgba(255, 51, 102, 0.8)',
  foodCore: '#ff6699',
  gameOverOverlay: 'rgba(10, 10, 26, 0.85)',
  gameOverText: '#ff3366',
};

function drawBackground(ctx: CanvasRenderingContext2D, width: number, height: number) {
  // Create gradient background
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, COLORS.bgDark);
  gradient.addColorStop(0.5, COLORS.bgLight);
  gradient.addColorStop(1, COLORS.bgDark);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Draw subtle grid
  ctx.strokeStyle = COLORS.gridLine;
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
  const progress = index / Math.max(totalLength - 1, 1);
  const baseColor = isHead ? COLORS.snakeHead :
    progress < 0.5 ? COLORS.snakeBody : COLORS.snakeTail;
  const glowColor = isHead ? COLORS.snakeHeadGlow : COLORS.snakeBodyGlow;

  // Draw glow effect
  const glowRadius = isHead ? 12 : 8;
  const glow = ctx.createRadialGradient(centerX, centerY, radius * 0.5, centerX, centerY, radius + glowRadius);
  glow.addColorStop(0, glowColor);
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(centerX - radius - glowRadius, centerY - radius - glowRadius,
               (radius + glowRadius) * 2, (radius + glowRadius) * 2);

  // Draw segment body
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);

  // Create inner gradient for 3D effect
  const innerGradient = ctx.createRadialGradient(
    centerX - radius * 0.3, centerY - radius * 0.3, 0,
    centerX, centerY, radius
  );
  innerGradient.addColorStop(0, '#ffffff');
  innerGradient.addColorStop(0.2, baseColor);
  innerGradient.addColorStop(1, isHead ? '#006644' : '#004433');

  ctx.fillStyle = innerGradient;
  ctx.fill();

  // Draw eyes on the head
  if (isHead) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(centerX - 4, centerY - 2, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX + 4, centerY - 2, 3, 0, Math.PI * 2);
    ctx.fill();

    // Pupils
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(centerX - 4, centerY - 2, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(centerX + 4, centerY - 2, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawFood(ctx: CanvasRenderingContext2D, x: number, y: number, time: number) {
  const centerX = x * CELL_SIZE + CELL_SIZE / 2;
  const centerY = y * CELL_SIZE + CELL_SIZE / 2;

  // Pulsing effect
  const pulse = Math.sin(time * 0.005) * 0.2 + 0.8;
  const radius = ((CELL_SIZE - 4) / 2) * pulse;

  // Draw outer glow (pulsing)
  const glowSize = 15 + Math.sin(time * 0.008) * 5;
  const outerGlow = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, glowSize);
  outerGlow.addColorStop(0, COLORS.foodGlow);
  outerGlow.addColorStop(0.5, 'rgba(255, 51, 102, 0.3)');
  outerGlow.addColorStop(1, 'transparent');
  ctx.fillStyle = outerGlow;
  ctx.fillRect(centerX - glowSize, centerY - glowSize, glowSize * 2, glowSize * 2);

  // Draw food body
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);

  const foodGradient = ctx.createRadialGradient(
    centerX - radius * 0.3, centerY - radius * 0.3, 0,
    centerX, centerY, radius
  );
  foodGradient.addColorStop(0, '#ffffff');
  foodGradient.addColorStop(0.3, COLORS.foodCore);
  foodGradient.addColorStop(1, COLORS.food);

  ctx.fillStyle = foodGradient;
  ctx.fill();

  // Draw sparkle effect
  const sparkleAngle = time * 0.003;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  for (let i = 0; i < 4; i++) {
    const angle = sparkleAngle + (i * Math.PI / 2);
    const sparkleX = centerX + Math.cos(angle) * (radius + 5);
    const sparkleY = centerY + Math.sin(angle) * (radius + 5);
    const sparkleSize = 2 + Math.sin(time * 0.01 + i) * 1;
    ctx.beginPath();
    ctx.arc(sparkleX, sparkleY, sparkleSize, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGameOver(ctx: CanvasRenderingContext2D, width: number, height: number) {
  // Dark overlay
  ctx.fillStyle = COLORS.gameOverOverlay;
  ctx.fillRect(0, 0, width, height);

  // Game over text with glow
  ctx.save();
  ctx.shadowColor = COLORS.gameOverText;
  ctx.shadowBlur = 20;
  ctx.fillStyle = COLORS.gameOverText;
  ctx.font = 'bold 32px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('GAME OVER', width / 2, height / 2);
  ctx.restore();
}

export function GameBoard({ gameState, gridSize }: GameBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;

    const render = () => {
      const time = performance.now();

      // Draw background with grid
      drawBackground(ctx, canvas.width, canvas.height);

      // Draw food with animation
      drawFood(ctx, gameState.food.x, gameState.food.y, time);

      // Draw snake segments (reverse so head is on top)
      const snakeLength = gameState.snake.length;
      for (let i = snakeLength - 1; i >= 0; i--) {
        const segment = gameState.snake[i];
        drawSnakeSegment(ctx, segment.x, segment.y, i === 0, i, snakeLength);
      }

      // Draw game over overlay if needed
      if (gameState.gameOver) {
        drawGameOver(ctx, canvas.width, canvas.height);
      }

      animationRef.current = time;
      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
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
