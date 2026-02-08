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

// Color palette - electric neon theme (matching Phaser scene)
const COLORS = {
  bgDark: '#030308',
  bgMid: '#080815',
  bgGrid: '#12122a',
  snakeHead: '#00ffcc',
  snakeHeadGlow: '#00ffff',
  snakeHeadCore: '#aaffff',
  snakeBody: '#00ff88',
  snakeTail: '#00aa44',
  snakeConnector: '#00dd66',
  food: '#ff0066',
  foodGlow: '#ff3388',
  foodCore: '#ffffff',
  foodOrbit: '#ff88aa',
  gameOverOverlay: 'rgba(0, 0, 0, 0.65)',
  gameOverRed: '#ff0033',
  // Rainbow colors for shimmer effect
  rainbow: ['#ff0000', '#ff8800', '#ffff00', '#00ff00', '#0088ff', '#8800ff', '#ff00ff'],
  trailGlow: '#00ffaa',
  // Plasma wave colors
  plasma: ['#440066', '#660044', '#330066'],
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

// Static shooting stars (decorative)
const SHOOTING_STARS: Array<{ x: number; y: number; angle: number; length: number }> = [
  { x: 50, y: 30, angle: Math.PI * 0.75, length: 25 },
  { x: 320, y: 80, angle: Math.PI * 0.8, length: 20 },
];

// Static warp lines (decorative speed lines)
const WARP_LINES: Array<{ x: number; y: number; angle: number; length: number; color: string }> = [];
for (let i = 0; i < 8; i++) {
  WARP_LINES.push({
    x: 50 + Math.random() * 300,
    y: 50 + Math.random() * 300,
    angle: Math.PI * (0.7 + Math.random() * 0.3),
    length: 20 + Math.random() * 30,
    color: COLORS.rainbow[i % COLORS.rainbow.length],
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

  // Subtle radial gradient overlay (center lighter)
  const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width * 0.7);
  gradient.addColorStop(0, 'rgba(8, 8, 21, 0.4)');
  gradient.addColorStop(1, 'rgba(3, 3, 8, 0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Draw plasma waves (static for Canvas2D)
  ctx.globalAlpha = 0.12;
  for (let i = 0; i < 3; i++) {
    ctx.strokeStyle = COLORS.plasma[i];
    ctx.lineWidth = 6;
    ctx.beginPath();
    const waveY = (i + 1) * height / 4;
    for (let x = 0; x <= width; x += 4) {
      const y = waveY + Math.sin(x * 0.03 + i) * 20;
      if (x === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

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
      ctx.globalAlpha = star.brightness * 0.3;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size + 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  // Draw shooting stars (decorative streaks)
  for (const ss of SHOOTING_STARS) {
    const tailX = ss.x + Math.cos(ss.angle) * ss.length;
    const tailY = ss.y + Math.sin(ss.angle) * ss.length;

    // Gradient trail
    const grad = ctx.createLinearGradient(ss.x, ss.y, tailX, tailY);
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
    grad.addColorStop(1, 'rgba(136, 204, 255, 0)');

    ctx.strokeStyle = grad;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ss.x, ss.y);
    ctx.lineTo(tailX, tailY);
    ctx.stroke();

    // Bright head
    ctx.fillStyle = '#ffffff';
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(ss.x, ss.y, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Draw warp lines (decorative speed effect)
  for (const wl of WARP_LINES) {
    const endX = wl.x + Math.cos(wl.angle) * wl.length;
    const endY = wl.y + Math.sin(wl.angle) * wl.length;

    // Gradient warp trail
    const warpGrad = ctx.createLinearGradient(wl.x, wl.y, endX, endY);
    warpGrad.addColorStop(0, wl.color);
    warpGrad.addColorStop(1, 'rgba(0, 255, 204, 0)');

    ctx.strokeStyle = warpGrad;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.moveTo(wl.x, wl.y);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Head glow
    ctx.fillStyle = wl.color;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(wl.x, wl.y, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Subtle grid pattern
  ctx.strokeStyle = COLORS.bgGrid;
  ctx.globalAlpha = 0.25;
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

  // Animated glow at grid corners
  ctx.fillStyle = '#00ffff';
  for (let x = 0; x <= GRID_SIZE; x += 5) {
    for (let y = 0; y <= GRID_SIZE; y += 5) {
      ctx.globalAlpha = 0.07;
      ctx.beginPath();
      ctx.arc(x * CELL_SIZE, y * CELL_SIZE, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  // Draw food with enhanced glow effect
  const food = gameState.food;
  const foodCenterX = food.x * CELL_SIZE + CELL_SIZE / 2;
  const foodCenterY = food.y * CELL_SIZE + CELL_SIZE / 2;

  // Energy rings around food (static)
  for (let i = 0; i < 3; i++) {
    const ringRadius = 20 + i * 12;
    ctx.strokeStyle = COLORS.rainbow[i * 2];
    ctx.lineWidth = 2 - i * 0.5;
    ctx.globalAlpha = 0.15 - i * 0.04;
    ctx.beginPath();
    ctx.arc(foodCenterX, foodCenterY, ringRadius, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Outer corona glow (larger, more dramatic)
  ctx.fillStyle = COLORS.food;
  ctx.globalAlpha = 0.08;
  ctx.beginPath();
  ctx.arc(foodCenterX, foodCenterY, 22, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 0.12;
  ctx.beginPath();
  ctx.arc(foodCenterX, foodCenterY, 16, 0, Math.PI * 2);
  ctx.fill();

  // Orbiting energy orbs (static positions for Canvas2D)
  for (let i = 0; i < 4; i++) {
    const angle = (i / 4) * Math.PI * 2;
    const orbX = foodCenterX + Math.cos(angle) * 13;
    const orbY = foodCenterY + Math.sin(angle) * 13;

    // Orb glow
    ctx.fillStyle = COLORS.rainbow[i];
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.arc(orbX, orbY, 4, 0, Math.PI * 2);
    ctx.fill();

    // Orb core
    ctx.globalAlpha = 0.9;
    ctx.beginPath();
    ctx.arc(orbX, orbY, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Rainbow ring effect (static for Canvas2D)
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const rx = foodCenterX + Math.cos(angle) * 7;
    const ry = foodCenterY + Math.sin(angle) * 7;
    ctx.fillStyle = COLORS.rainbow[i];
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.arc(rx, ry, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Main glow layers
  ctx.fillStyle = COLORS.food;
  ctx.globalAlpha = 0.18;
  ctx.beginPath();
  ctx.arc(foodCenterX, foodCenterY, 12, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = COLORS.foodGlow;
  ctx.globalAlpha = 0.45;
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
  ctx.globalAlpha = 0.95;
  ctx.beginPath();
  ctx.arc(foodCenterX, foodCenterY, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // Sparkle highlights
  ctx.fillStyle = '#ffffff';
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.arc(foodCenterX - 2, foodCenterY - 2, 1.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.arc(foodCenterX + 1, foodCenterY + 1, 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Draw snake (from tail to head so head is on top)
  const snake = gameState.snake;
  const segmentCount = snake.length;

  // First pass: Draw segment connectors (smooth body connections)
  if (segmentCount > 1) {
    for (let i = 0; i < segmentCount - 1; i++) {
      const current = snake[i];
      const next = snake[i + 1];
      const progress = segmentCount > 1 ? i / (segmentCount - 1) : 0;

      const cx = current.x * CELL_SIZE + CELL_SIZE / 2;
      const cy = current.y * CELL_SIZE + CELL_SIZE / 2;
      const nx = next.x * CELL_SIZE + CELL_SIZE / 2;
      const ny = next.y * CELL_SIZE + CELL_SIZE / 2;

      const connectorColor = lerpColor(COLORS.snakeBody, COLORS.snakeTail, progress);
      const connectorSize = CELL_SIZE - 4 - progress * 3;

      // Draw connecting line between segments
      ctx.strokeStyle = connectorColor;
      ctx.lineWidth = connectorSize * 0.7;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(nx, ny);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  // Second pass: Draw body segments from tail to head
  for (let i = segmentCount - 1; i >= 0; i--) {
    const segment = snake[i];
    const x = segment.x * CELL_SIZE;
    const y = segment.y * CELL_SIZE;
    const centerX = x + CELL_SIZE / 2;
    const centerY = y + CELL_SIZE / 2;
    const isHead = i === 0;
    const progress = segmentCount > 1 ? i / (segmentCount - 1) : 0;

    if (isHead) {
      // Electric aura (outermost)
      if (!gameState.gameOver) {
        ctx.fillStyle = '#00ccff';
        ctx.globalAlpha = 0.1;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 22, 0, Math.PI * 2);
        ctx.fill();
      }

      // Head glow layers (more layers)
      ctx.fillStyle = COLORS.snakeHeadGlow;
      ctx.globalAlpha = 0.12;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 18, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 0.25;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 14, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 11, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Head body (rounded rect)
      ctx.fillStyle = COLORS.snakeHead;
      ctx.beginPath();
      ctx.roundRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2, 6);
      ctx.fill();

      // Inner bright core
      ctx.fillStyle = COLORS.snakeHeadCore;
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.roundRect(x + 4, y + 4, CELL_SIZE - 8, CELL_SIZE - 8, 3);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Shiny highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      ctx.roundRect(x + 3, y + 3, 8, 5, 3);
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
      ctx.globalAlpha = 0.25;
      ctx.beginPath();
      ctx.arc(centerX, centerY, size / 2 + 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Main body segment
      ctx.fillStyle = baseColor;
      ctx.beginPath();
      ctx.roundRect(x + offset, y + offset, size, size, 5);
      ctx.fill();

      // Rainbow shimmer overlay (static color based on segment index)
      const shimmerColor = COLORS.rainbow[i % COLORS.rainbow.length];
      ctx.fillStyle = shimmerColor;
      ctx.globalAlpha = 0.2;
      ctx.beginPath();
      ctx.roundRect(x + offset, y + offset, size, size, 5);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Subtle highlight
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.roundRect(x + offset + 2, y + offset + 1, size / 2 - 2, size / 3, 2);
      ctx.fill();
    }
  }

  // Neon border glow (only when game is active)
  if (!gameState.gameOver) {
    const borderColor = '#00ffcc';

    // Outer glow layers
    ctx.strokeStyle = borderColor;
    ctx.globalAlpha = 0.08;
    ctx.lineWidth = 6;
    ctx.strokeRect(2, 2, width - 4, height - 4);

    ctx.globalAlpha = 0.15;
    ctx.lineWidth = 4;
    ctx.strokeRect(3, 3, width - 6, height - 6);

    ctx.globalAlpha = 0.3;
    ctx.lineWidth = 2;
    ctx.strokeRect(4, 4, width - 8, height - 8);

    // Corner accent glows
    const cornerSize = 15;
    ctx.fillStyle = borderColor;
    ctx.globalAlpha = 0.2;
    ctx.beginPath();
    ctx.arc(cornerSize, cornerSize, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(width - cornerSize, cornerSize, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cornerSize, height - cornerSize, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(width - cornerSize, height - cornerSize, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Game over overlay
  if (gameState.gameOver) {
    ctx.fillStyle = COLORS.gameOverOverlay;
    ctx.fillRect(0, 0, width, height);

    // Red radial gradient from center
    ctx.fillStyle = COLORS.gameOverRed;
    ctx.globalAlpha = 0.15;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, width * 0.4, 0, Math.PI * 2);
    ctx.fill();

    // Red vignette with more layers
    ctx.strokeStyle = COLORS.gameOverRed;
    for (let i = 0; i < 12; i++) {
      const intensity = (12 - i) / 12;
      const lineWidth = 3 + (12 - i) * 0.3;
      ctx.lineWidth = lineWidth;
      ctx.globalAlpha = 0.1 * intensity;
      const vOffset = i * 4;
      ctx.strokeRect(vOffset, vOffset, width - vOffset * 2, height - vOffset * 2);
    }

    // Corner glows (larger, more intense)
    ctx.fillStyle = COLORS.gameOverRed;
    ctx.globalAlpha = 0.25;
    ctx.beginPath();
    ctx.arc(0, 0, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(width, 0, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, height, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(width, height, 60, 0, Math.PI * 2);
    ctx.fill();

    // Edge glows
    ctx.globalAlpha = 0.12;
    ctx.beginPath();
    ctx.arc(width / 2, 0, 50, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(width / 2, height, 50, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(0, height / 2, 50, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(width, height / 2, 50, 0, Math.PI * 2);
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
