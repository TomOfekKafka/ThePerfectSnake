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

// Color palette - cosmic neon theme (matching Phaser scene)
const COLORS = {
  bgDark: '#050510',
  bgGrid: '#0f0f2a',
  snakeHead: '#00ffcc',
  snakeHeadGlow: '#00ffff',
  snakeBody: '#00ff88',
  snakeTail: '#00aa44',
  food: '#ff0066',
  foodGlow: '#ff3388',
  foodCore: '#ffffff',
  gameOverOverlay: 'rgba(0, 0, 0, 0.6)',
  // Rainbow colors for shimmer effect
  rainbow: ['#ff0000', '#ff8800', '#ffff00', '#00ff00', '#0088ff', '#8800ff', '#ff00ff'],
  trailGlow: '#00ffaa',
};

// Static stars for Canvas2D fallback (no animation)
const STARS: Array<{ x: number; y: number; size: number; brightness: number }> = [];
for (let i = 0; i < 60; i++) {
  STARS.push({
    x: Math.random() * GRID_SIZE * CELL_SIZE,
    y: Math.random() * GRID_SIZE * CELL_SIZE,
    size: Math.random() * 1.5 + 0.5,
    brightness: Math.random() * 0.5 + 0.3,
  });
}

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

  // Deep space background
  ctx.fillStyle = COLORS.bgDark;
  ctx.fillRect(0, 0, width, height);

  // Draw twinkling stars
  for (const star of STARS) {
    ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness})`;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();

    // Colored halo for larger stars
    if (star.size > 1.2) {
      const haloColor = COLORS.rainbow[Math.floor(star.x) % COLORS.rainbow.length];
      ctx.fillStyle = haloColor;
      ctx.globalAlpha = star.brightness * 0.2;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size + 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  // Subtle grid pattern
  ctx.strokeStyle = COLORS.bgGrid;
  ctx.globalAlpha = 0.2;
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

  // Subtle glow at grid corners
  ctx.fillStyle = '#00ffff';
  for (let x = 0; x <= GRID_SIZE; x += 5) {
    for (let y = 0; y <= GRID_SIZE; y += 5) {
      ctx.globalAlpha = 0.05;
      ctx.beginPath();
      ctx.arc(x * CELL_SIZE, y * CELL_SIZE, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  // Draw food with enhanced glow effect
  const food = gameState.food;
  const foodCenterX = food.x * CELL_SIZE + CELL_SIZE / 2;
  const foodCenterY = food.y * CELL_SIZE + CELL_SIZE / 2;

  // Outer corona glow
  ctx.fillStyle = COLORS.food;
  ctx.globalAlpha = 0.1;
  ctx.beginPath();
  ctx.arc(foodCenterX, foodCenterY, 16, 0, Math.PI * 2);
  ctx.fill();

  // Rainbow ring effect (static for Canvas2D)
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const rx = foodCenterX + Math.cos(angle) * 7;
    const ry = foodCenterY + Math.sin(angle) * 7;
    ctx.fillStyle = COLORS.rainbow[i];
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(rx, ry, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Main glow layers
  ctx.fillStyle = COLORS.food;
  ctx.globalAlpha = 0.15;
  ctx.beginPath();
  ctx.arc(foodCenterX, foodCenterY, 12, 0, Math.PI * 2);
  ctx.fill();

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

  // Inner bright spot
  ctx.fillStyle = COLORS.foodCore;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.arc(foodCenterX, foodCenterY, 3, 0, Math.PI * 2);
  ctx.fill();

  // Sparkle highlight
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.arc(foodCenterX - 2, foodCenterY - 2, 1.5, 0, Math.PI * 2);
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
      // Head glow layers
      ctx.fillStyle = COLORS.snakeHeadGlow;
      ctx.globalAlpha = 0.15;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 16, 0, Math.PI * 2);
      ctx.fill();

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

      // Shiny highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.beginPath();
      ctx.roundRect(x + 3, y + 3, 8, 6, 3);
      ctx.fill();

      // Eye glow
      ctx.fillStyle = '#00ffff';
      ctx.globalAlpha = 0.3;
      const eyeOffset = 4;
      ctx.beginPath();
      ctx.arc(centerX - eyeOffset, centerY - 2, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(centerX + eyeOffset, centerY - 2, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Eyes
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(centerX - eyeOffset, centerY - 2, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(centerX + eyeOffset, centerY - 2, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Pupils
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(centerX - eyeOffset, centerY - 2, 1.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(centerX + eyeOffset, centerY - 2, 1.8, 0, Math.PI * 2);
      ctx.fill();

      // Eye shine
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.beginPath();
      ctx.arc(centerX - eyeOffset - 1, centerY - 3, 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(centerX + eyeOffset - 1, centerY - 3, 1, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Body gradient from bright to dark
      const baseColor = lerpColor(COLORS.snakeBody, COLORS.snakeTail, progress);
      const size = CELL_SIZE - 2 - progress * 3;
      const offset = (CELL_SIZE - size) / 2;

      // Outer glow for body segments
      ctx.fillStyle = baseColor;
      ctx.globalAlpha = 0.2;
      ctx.beginPath();
      ctx.arc(centerX, centerY, size / 2 + 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Main body segment
      ctx.fillStyle = baseColor;
      ctx.beginPath();
      ctx.roundRect(x + offset, y + offset, size, size, 4);
      ctx.fill();

      // Rainbow shimmer overlay (static color based on segment index)
      const shimmerColor = COLORS.rainbow[i % COLORS.rainbow.length];
      ctx.fillStyle = shimmerColor;
      ctx.globalAlpha = 0.15;
      ctx.beginPath();
      ctx.roundRect(x + offset, y + offset, size, size, 4);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Subtle highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.beginPath();
      ctx.roundRect(x + offset + 1, y + offset + 1, size / 2, size / 3, 2);
      ctx.fill();
    }
  }

  // Game over overlay
  if (gameState.gameOver) {
    ctx.fillStyle = COLORS.gameOverOverlay;
    ctx.fillRect(0, 0, width, height);

    // Red vignette with more layers
    ctx.strokeStyle = '#ff0000';
    ctx.lineWidth = 4;
    for (let i = 0; i < 8; i++) {
      const intensity = (8 - i) / 8;
      ctx.globalAlpha = 0.12 * intensity;
      const vOffset = i * 5;
      ctx.strokeRect(vOffset, vOffset, width - vOffset * 2, height - vOffset * 2);
    }

    // Corner glows
    ctx.fillStyle = '#ff0000';
    ctx.globalAlpha = 0.2;
    ctx.beginPath();
    ctx.arc(0, 0, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(width, 0, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, height, 40, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(width, height, 40, 0, Math.PI * 2);
    ctx.fill();

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
