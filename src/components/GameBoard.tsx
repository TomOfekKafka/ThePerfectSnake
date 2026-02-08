import { useEffect, useRef, useCallback } from 'react';
import './GameBoard.css';
import type { SnakeScene } from './SnakeScene';

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
const GRID_SIZE = 20;

// Color palette - neon cyberpunk theme (matching Phaser scene)
const COLORS = {
  bgDark: '#0a0a1a',
  bgGrid: '#1a1a3a',
  snakeHead: '#00ff88',
  snakeHeadGlow: '#00ffaa',
  snakeBody: '#00cc66',
  snakeTail: '#007733',
  food: '#ff0066',
  foodGlow: '#ff3388',
  foodCore: '#ffffff',
  gameOverOverlay: 'rgba(0, 0, 0, 0.5)',
};

function lerpColor(color1: string, color2: string, t: number): string {
  const c1 = parseInt(color1.slice(1), 16);
  const c2 = parseInt(color2.slice(1), 16);

  const r1 = (c1 >> 16) & 0xff;
  const g1 = (c1 >> 8) & 0xff;
  const b1 = c1 & 0xff;

  const r2 = (c2 >> 16) & 0xff;
  const g2 = (c2 >> 8) & 0xff;
  const b2 = c2 & 0xff;

  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);

  return `rgb(${r}, ${g}, ${b})`;
}

function drawCanvas2D(canvas: HTMLCanvasElement, gameState: GameState): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const width = canvas.width;
  const height = canvas.height;

  // Dark background
  ctx.fillStyle = COLORS.bgDark;
  ctx.fillRect(0, 0, width, height);

  // Subtle grid pattern
  ctx.strokeStyle = COLORS.bgGrid;
  ctx.globalAlpha = 0.3;
  ctx.lineWidth = 1;
  for (let i = 0; i <= GRID_SIZE; i++) {
    ctx.beginPath();
    ctx.moveTo(i * CELL_SIZE, 0);
    ctx.lineTo(i * CELL_SIZE, height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, i * CELL_SIZE);
    ctx.lineTo(width, i * CELL_SIZE);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Draw food with glow effect
  const food = gameState.food;
  const foodCenterX = food.x * CELL_SIZE + CELL_SIZE / 2;
  const foodCenterY = food.y * CELL_SIZE + CELL_SIZE / 2;

  // Outer glow
  ctx.fillStyle = COLORS.food;
  ctx.globalAlpha = 0.2;
  ctx.beginPath();
  ctx.arc(foodCenterX, foodCenterY, 12, 0, Math.PI * 2);
  ctx.fill();

  // Middle glow
  ctx.fillStyle = COLORS.foodGlow;
  ctx.globalAlpha = 0.4;
  ctx.beginPath();
  ctx.arc(foodCenterX, foodCenterY, 9, 0, Math.PI * 2);
  ctx.fill();

  // Core
  ctx.globalAlpha = 1;
  ctx.fillStyle = COLORS.food;
  ctx.beginPath();
  ctx.arc(foodCenterX, foodCenterY, 6, 0, Math.PI * 2);
  ctx.fill();

  // Bright center
  ctx.fillStyle = COLORS.foodCore;
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.arc(foodCenterX, foodCenterY, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Draw snake (from tail to head so head is on top)
  const snake = gameState.snake;
  const segmentCount = snake.length;

  for (let i = segmentCount - 1; i >= 0; i--) {
    const segment = snake[i];
    const x = segment.x * CELL_SIZE;
    const y = segment.y * CELL_SIZE;
    const centerX = x + CELL_SIZE / 2;
    const centerY = y + CELL_SIZE / 2;
    const isHead = i === 0;
    const progress = segmentCount > 1 ? i / (segmentCount - 1) : 0;

    if (isHead) {
      // Head glow
      ctx.fillStyle = COLORS.snakeHeadGlow;
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Head body (rounded rect)
      ctx.fillStyle = COLORS.snakeHead;
      ctx.beginPath();
      ctx.roundRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2, 6);
      ctx.fill();

      // Eyes
      const eyeOffset = 4;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(centerX - eyeOffset, centerY - 2, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(centerX + eyeOffset, centerY - 2, 3, 0, Math.PI * 2);
      ctx.fill();

      // Pupils
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(centerX - eyeOffset, centerY - 2, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(centerX + eyeOffset, centerY - 2, 1.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Body gradient from bright to dark
      const color = lerpColor(COLORS.snakeBody, COLORS.snakeTail, progress);
      const size = CELL_SIZE - 2 - progress * 2;
      const offset = (CELL_SIZE - size) / 2;

      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.roundRect(x + offset, y + offset, size, size, 4);
      ctx.fill();

      // Subtle highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
      ctx.beginPath();
      ctx.roundRect(x + offset + 1, y + offset + 1, size / 2, size / 2, 2);
      ctx.fill();
    }
  }

  // Game over overlay
  if (gameState.gameOver) {
    ctx.fillStyle = COLORS.gameOverOverlay;
    ctx.fillRect(0, 0, width, height);

    // Red vignette
    ctx.strokeStyle = '#ff0000';
    for (let i = 0; i < 5; i++) {
      ctx.globalAlpha = 0.1 * (5 - i);
      ctx.lineWidth = 3;
      ctx.strokeRect(i * 4, i * 4, width - i * 8, height - i * 8);
    }
    ctx.globalAlpha = 1;
  }
}

export function GameBoard({ gameState, gridSize }: GameBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<SnakeScene | null>(null);
  const phaserGameRef = useRef<Phaser.Game | null>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
  const phaserFailedRef = useRef(false);
  const initStartedRef = useRef(false);

  const pushState = useCallback(() => {
    if (sceneRef.current) {
      sceneRef.current.updateGameState(gameState);
    } else if (phaserFailedRef.current && canvasRef.current) {
      drawCanvas2D(canvasRef.current, gameState);
    }
  }, [gameState]);

  // Initialize Phaser on mount
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || initStartedRef.current) return;
    initStartedRef.current = true;

    let destroyed = false;

    (async () => {
      try {
        const Phaser = await import('phaser');
        const { SnakeScene } = await import('./SnakeScene');

        if (destroyed) return;

        const game = new Phaser.Game({
          type: Phaser.CANVAS,
          canvas: canvas,
          width: gridSize * CELL_SIZE,
          height: gridSize * CELL_SIZE,
          backgroundColor: '#ffffff',
          scene: SnakeScene,
          pixelArt: true,
          input: {
            keyboard: false,
            mouse: false,
            touch: false,
            gamepad: false,
          },
          audio: {
            noAudio: true,
          },
          banner: false,
          fps: {
            target: 30,
          },
        });

        if (destroyed) {
          game.destroy(true);
          return;
        }

        phaserGameRef.current = game;

        // Wait for scene to be ready
        const scene = game.scene.getScene('SnakeScene') as SnakeScene;
        if (scene) {
          sceneRef.current = scene;
          scene.updateGameState(gameState);
        } else {
          // Scene not ready yet, listen for it
          game.events.once('ready', () => {
            if (destroyed) return;
            const s = game.scene.getScene('SnakeScene') as SnakeScene;
            if (s) {
              sceneRef.current = s;
              s.updateGameState(gameState);
            }
          });
        }
      } catch {
        // Phaser failed to load (e.g. jsdom) — fall back to Canvas 2D
        if (!destroyed) {
          phaserFailedRef.current = true;
          drawCanvas2D(canvas, gameState);
        }
      }
    })();

    return () => {
      destroyed = true;
      if (phaserGameRef.current) {
        phaserGameRef.current.destroy(true);
        phaserGameRef.current = null;
      }
      sceneRef.current = null;
      initStartedRef.current = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Push state updates to Phaser scene or Canvas 2D fallback
  useEffect(() => {
    pushState();
  }, [pushState]);

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
