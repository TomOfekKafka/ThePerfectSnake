import { useEffect, useRef, useState } from 'react';
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
  gridLine: 'rgba(255, 255, 255, 0.03)',
  snakeHead: '#00ff88',
  snakeHeadGlow: 'rgba(0, 255, 136, 0.6)',
  snakeTail: '#0088ff',
  snakeBody: '#00ccff',
  foodCore: '#ff3366',
  foodGlow: 'rgba(255, 51, 102, 0.8)',
  foodOuter: '#ff6699',
  eyeWhite: '#ffffff',
  eyePupil: '#000000',
};

export function GameBoard({ gameState, gridSize }: GameBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [animationFrame, setAnimationFrame] = useState(0);

  // Animation loop for pulsing effects
  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationFrame((f) => (f + 1) % 60);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Draw gradient background
    const bgGradient = ctx.createRadialGradient(
      width / 2, height / 2, 0,
      width / 2, height / 2, width * 0.7
    );
    bgGradient.addColorStop(0, COLORS.bgLight);
    bgGradient.addColorStop(1, COLORS.bgDark);
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Draw subtle grid
    ctx.strokeStyle = COLORS.gridLine;
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

    // Pulsing animation value (0 to 1)
    const pulse = (Math.sin(animationFrame * 0.2) + 1) / 2;

    // Draw food with glow effect
    const foodX = gameState.food.x * CELL_SIZE + CELL_SIZE / 2;
    const foodY = gameState.food.y * CELL_SIZE + CELL_SIZE / 2;
    const foodRadius = (CELL_SIZE / 2 - 2) * (0.85 + pulse * 0.15);

    // Outer glow
    const glowSize = 12 + pulse * 6;
    const foodGlow = ctx.createRadialGradient(
      foodX, foodY, 0,
      foodX, foodY, glowSize
    );
    foodGlow.addColorStop(0, COLORS.foodGlow);
    foodGlow.addColorStop(0.5, 'rgba(255, 51, 102, 0.3)');
    foodGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = foodGlow;
    ctx.fillRect(foodX - glowSize, foodY - glowSize, glowSize * 2, glowSize * 2);

    // Food body
    const foodBodyGradient = ctx.createRadialGradient(
      foodX - 2, foodY - 2, 0,
      foodX, foodY, foodRadius
    );
    foodBodyGradient.addColorStop(0, COLORS.foodOuter);
    foodBodyGradient.addColorStop(0.7, COLORS.foodCore);
    foodBodyGradient.addColorStop(1, '#cc0044');
    ctx.beginPath();
    ctx.arc(foodX, foodY, foodRadius, 0, Math.PI * 2);
    ctx.fillStyle = foodBodyGradient;
    ctx.fill();

    // Food highlight
    ctx.beginPath();
    ctx.arc(foodX - 2, foodY - 2, foodRadius * 0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fill();

    // Draw snake
    const snakeLength = gameState.snake.length;

    gameState.snake.forEach((segment, index) => {
      const x = segment.x * CELL_SIZE + CELL_SIZE / 2;
      const y = segment.y * CELL_SIZE + CELL_SIZE / 2;
      const isHead = index === 0;

      // Calculate segment size (head is bigger, tail tapers)
      const progress = index / Math.max(snakeLength - 1, 1);
      const baseRadius = isHead ? CELL_SIZE / 2 - 1 : CELL_SIZE / 2 - 2;
      const radius = baseRadius * (isHead ? 1 : (1 - progress * 0.3));

      // Glow effect for head
      if (isHead) {
        const headGlow = ctx.createRadialGradient(x, y, 0, x, y, radius + 8);
        headGlow.addColorStop(0, COLORS.snakeHeadGlow);
        headGlow.addColorStop(1, 'transparent');
        ctx.fillStyle = headGlow;
        ctx.fillRect(x - radius - 8, y - radius - 8, (radius + 8) * 2, (radius + 8) * 2);
      }

      // Segment gradient (green head to blue tail)
      const segmentGradient = ctx.createRadialGradient(
        x - radius * 0.3, y - radius * 0.3, 0,
        x, y, radius
      );

      if (isHead) {
        segmentGradient.addColorStop(0, '#66ffbb');
        segmentGradient.addColorStop(0.5, COLORS.snakeHead);
        segmentGradient.addColorStop(1, '#00cc66');
      } else {
        // Interpolate color from body to tail
        const r = Math.round(0 + progress * 0);
        const g = Math.round(204 - progress * 68);
        const b = Math.round(255 - progress * 119);
        segmentGradient.addColorStop(0, `rgb(${r + 50}, ${g + 50}, ${b + 50})`);
        segmentGradient.addColorStop(1, `rgb(${r}, ${g}, ${b})`);
      }

      // Draw segment
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = segmentGradient;
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
        const eyeRadius = radius * 0.25;
        const pupilRadius = eyeRadius * 0.6;

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

        // Draw eyes
        [{ ex: eye1X, ey: eye1Y }, { ex: eye2X, ey: eye2Y }].forEach(({ ex, ey }) => {
          // Eye white
          ctx.beginPath();
          ctx.arc(ex, ey, eyeRadius, 0, Math.PI * 2);
          ctx.fillStyle = COLORS.eyeWhite;
          ctx.fill();

          // Pupil (offset toward direction)
          ctx.beginPath();
          ctx.arc(ex + dx * pupilRadius * 0.3, ey + dy * pupilRadius * 0.3, pupilRadius, 0, Math.PI * 2);
          ctx.fillStyle = COLORS.eyePupil;
          ctx.fill();
        });
      }
    });

    // Game over overlay effect
    if (gameState.gameOver) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(0, 0, width, height);

      // Red vignette
      const vignetteGradient = ctx.createRadialGradient(
        width / 2, height / 2, width * 0.2,
        width / 2, height / 2, width * 0.7
      );
      vignetteGradient.addColorStop(0, 'transparent');
      vignetteGradient.addColorStop(1, 'rgba(255, 0, 0, 0.3)');
      ctx.fillStyle = vignetteGradient;
      ctx.fillRect(0, 0, width, height);
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
