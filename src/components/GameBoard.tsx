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

// Color palette - neon cyberpunk theme (matching SnakeScene)
const COLORS = {
  bgDark: '#0a0a1a',
  gridLine: '#1a1a3a',
  snakeHead: '#00ff88',
  snakeBody: '#00cc66',
  snakeTail: '#009944',
  food: '#ff3366',
  foodGlow: '#ff6699',
  gameOverTint: 'rgba(255, 0, 0, 0.2)',
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

  const width = GRID_SIZE * CELL_SIZE;
  const height = GRID_SIZE * CELL_SIZE;

  ctx.save();
  ctx.scale(canvas.width / width, canvas.height / height);

  // Dark background
  ctx.fillStyle = COLORS.bgDark;
  ctx.fillRect(0, 0, width, height);

  // Grid pattern
  ctx.strokeStyle = COLORS.gridLine;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.3;
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

  // Game over tint
  if (gameState.gameOver) {
    ctx.fillStyle = COLORS.gameOverTint;
    ctx.fillRect(0, 0, width, height);
  }

  // Draw food with glow
  const food = gameState.food;
  const foodX = food.x * CELL_SIZE + CELL_SIZE / 2;
  const foodY = food.y * CELL_SIZE + CELL_SIZE / 2;
  const baseRadius = (CELL_SIZE - 2) / 2;

  // Outer glow
  ctx.fillStyle = COLORS.foodGlow;
  ctx.globalAlpha = 0.2;
  ctx.beginPath();
  ctx.arc(foodX, foodY, baseRadius + 4, 0, Math.PI * 2);
  ctx.fill();

  // Mid glow
  ctx.globalAlpha = 0.4;
  ctx.beginPath();
  ctx.arc(foodX, foodY, baseRadius + 2, 0, Math.PI * 2);
  ctx.fill();

  // Core food
  ctx.globalAlpha = 1;
  ctx.fillStyle = COLORS.food;
  ctx.beginPath();
  ctx.arc(foodX, foodY, baseRadius, 0, Math.PI * 2);
  ctx.fill();

  // Inner highlight
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.beginPath();
  ctx.arc(foodX - 2, foodY - 2, baseRadius * 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Draw snake with gradient
  const snake = gameState.snake;
  const snakeLen = snake.length;

  for (let i = snakeLen - 1; i >= 0; i--) {
    const segment = snake[i];
    const isHead = i === 0;
    const progress = snakeLen > 1 ? i / (snakeLen - 1) : 0;

    const x = segment.x * CELL_SIZE;
    const y = segment.y * CELL_SIZE;
    const centerX = x + CELL_SIZE / 2;
    const centerY = y + CELL_SIZE / 2;

    const color = isHead
      ? COLORS.snakeHead
      : lerpColor(COLORS.snakeBody, COLORS.snakeTail, progress);

    // Head glow
    if (isHead && !gameState.gameOver) {
      ctx.fillStyle = COLORS.snakeHead;
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.arc(centerX, centerY, CELL_SIZE / 2 + 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.fillStyle = color;

    if (isHead) {
      // Rounded head
      const radius = 6;
      ctx.beginPath();
      ctx.roundRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2, radius);
      ctx.fill();

      // Eyes
      const eyeSize = 3;
      const eyeOffset = 4;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(centerX - eyeOffset, centerY - 2, eyeSize, 0, Math.PI * 2);
      ctx.arc(centerX + eyeOffset, centerY - 2, eyeSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.arc(centerX - eyeOffset, centerY - 2, eyeSize / 2, 0, Math.PI * 2);
      ctx.arc(centerX + eyeOffset, centerY - 2, eyeSize / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Body with decreasing size
      const sizeFactor = 1 - progress * 0.2;
      const size = (CELL_SIZE - 2) * sizeFactor;
      const offset = (CELL_SIZE - size) / 2;
      ctx.beginPath();
      ctx.roundRect(x + offset, y + offset, size, size, 4);
      ctx.fill();
    }
  }

  ctx.restore();
}

export function GameBoard({ gameState, gridSize }: GameBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
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

    // Calculate zoom for hi-res Phaser rendering
    const logicalSize = gridSize * CELL_SIZE;
    const displaySize = Math.max(window.innerWidth, window.innerHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const phaserZoom = Math.max(1, Math.ceil((displaySize * dpr) / logicalSize));

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
          pixelArt: false,
          scale: {
            zoom: phaserZoom,
          },
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

        // Phaser sets inline width/height styles based on zoom — reset to CSS control
        canvas.style.width = '100%';
        canvas.style.height = '100%';

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

  // Hi-res canvas for Canvas2D fallback: match canvas resolution to display size
  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      if (width === 0 || height === 0) return;

      // Only resize canvas for Canvas2D fallback (Phaser manages its own canvas)
      if (phaserFailedRef.current) {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(width * dpr);
        canvas.height = Math.round(height * dpr);
        drawCanvas2D(canvas, gameState);
      }
    });

    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [gameState]);

  // Push state updates to Phaser scene or Canvas 2D fallback
  useEffect(() => {
    pushState();
  }, [pushState]);

  return (
    <div className="canvas-wrapper" ref={wrapperRef}>
      <canvas
        ref={canvasRef}
        width={gridSize * CELL_SIZE}
        height={gridSize * CELL_SIZE}
      />
    </div>
  );
}
