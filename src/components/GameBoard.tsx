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

// Color palette matching SnakeScene
const COLORS = {
  bgDark: '#0a0a1a',
  gridLine: '#2a2a4e',
  snakeHead: '#00ff88',
  snakeBody: '#00cc66',
  snakeTail: '#009944',
  snakeEye: '#ffffff',
  snakePupil: '#000000',
  food: '#ff3366',
  foodGlow: '#ff6699',
  gameOverOverlay: 'rgba(0, 0, 0, 0.6)',
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

  // Subtle grid lines
  ctx.strokeStyle = COLORS.gridLine;
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

  // Food with glow effect
  const foodX = gameState.food.x * CELL_SIZE + CELL_SIZE / 2;
  const foodY = gameState.food.y * CELL_SIZE + CELL_SIZE / 2;

  // Outer glow
  ctx.fillStyle = COLORS.foodGlow;
  ctx.globalAlpha = 0.3;
  ctx.beginPath();
  ctx.arc(foodX, foodY, CELL_SIZE / 2 + 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Food core
  ctx.fillStyle = COLORS.food;
  ctx.beginPath();
  ctx.arc(foodX, foodY, CELL_SIZE / 2 - 2, 0, Math.PI * 2);
  ctx.fill();

  // Snake with gradient
  const snake = gameState.snake;
  const snakeLen = snake.length;

  for (let i = snakeLen - 1; i >= 0; i--) {
    const segment = snake[i];
    const centerX = segment.x * CELL_SIZE + CELL_SIZE / 2;
    const centerY = segment.y * CELL_SIZE + CELL_SIZE / 2;
    const radius = CELL_SIZE / 2 - 1;

    const t = snakeLen > 1 ? i / (snakeLen - 1) : 1;
    const color = lerpColor(COLORS.snakeTail, COLORS.snakeHead, t);

    // Glow for head
    if (i === 0) {
      ctx.fillStyle = COLORS.snakeHead;
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius + 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    // Eyes on head
    if (i === 0) {
      const nextSegment = snake[1];
      let dx = 1, dy = 0;
      if (nextSegment) {
        dx = segment.x - nextSegment.x;
        dy = segment.y - nextSegment.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > 0) { dx /= len; dy /= len; }
      }

      const perpX = -dy;
      const perpY = dx;
      const eyeOffset = 4;
      const eyeForward = 3;

      // Left eye
      const leftEyeX = centerX + perpX * eyeOffset + dx * eyeForward;
      const leftEyeY = centerY + perpY * eyeOffset + dy * eyeForward;
      ctx.fillStyle = COLORS.snakeEye;
      ctx.beginPath();
      ctx.arc(leftEyeX, leftEyeY, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = COLORS.snakePupil;
      ctx.beginPath();
      ctx.arc(leftEyeX + dx, leftEyeY + dy, 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Right eye
      const rightEyeX = centerX - perpX * eyeOffset + dx * eyeForward;
      const rightEyeY = centerY - perpY * eyeOffset + dy * eyeForward;
      ctx.fillStyle = COLORS.snakeEye;
      ctx.beginPath();
      ctx.arc(rightEyeX, rightEyeY, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = COLORS.snakePupil;
      ctx.beginPath();
      ctx.arc(rightEyeX + dx, rightEyeY + dy, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Game over overlay
  if (gameState.gameOver) {
    ctx.fillStyle = COLORS.gameOverOverlay;
    ctx.fillRect(0, 0, width, height);
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
          backgroundColor: '#0a0a1a',
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
