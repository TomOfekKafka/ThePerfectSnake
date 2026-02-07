import Phaser from 'phaser';

interface Position {
  x: number;
  y: number;
}

interface GameState {
  snake: Position[];
  food: Position;
  gameOver: boolean;
}

const CELL_SIZE = 20;

// Color palette
const COLORS = {
  background: 0x1a1a2e,
  gridLine: 0x16213e,
  snakeHead: 0x00ff88,
  snakeBody: 0x00cc6a,
  snakeTail: 0x009950,
  snakeGlow: 0x00ff88,
  food: 0xff6b6b,
  foodGlow: 0xff4757,
  gameOverOverlay: 0x000000,
};

// Helper to interpolate between two hex colors
function lerpColor(color1: number, color2: number, t: number): number {
  const r1 = (color1 >> 16) & 0xff;
  const g1 = (color1 >> 8) & 0xff;
  const b1 = color1 & 0xff;
  const r2 = (color2 >> 16) & 0xff;
  const g2 = (color2 >> 8) & 0xff;
  const b2 = color2 & 0xff;
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return (r << 16) | (g << 8) | b;
}

export class SnakeScene extends Phaser.Scene {
  private graphics!: Phaser.GameObjects.Graphics;
  private currentState: GameState | null = null;
  private animTime = 0;

  constructor() {
    super({ key: 'SnakeScene' });
  }

  create(): void {
    this.graphics = this.add.graphics();
  }

  updateGameState(state: GameState): void {
    this.currentState = state;
  }

  update(_time: number, delta: number): void {
    this.animTime += delta;

    if (!this.currentState) return;

    // Always redraw for animations
    const g = this.graphics;
    g.clear();

    const width = this.scale.width;
    const height = this.scale.height;

    // Dark background
    g.fillStyle(COLORS.background, 1);
    g.fillRect(0, 0, width, height);

    // Subtle grid pattern
    g.lineStyle(1, COLORS.gridLine, 0.3);
    for (let x = 0; x <= width; x += CELL_SIZE) {
      g.lineBetween(x, 0, x, height);
    }
    for (let y = 0; y <= height; y += CELL_SIZE) {
      g.lineBetween(0, y, width, y);
    }

    // Draw food with pulsing glow effect
    const pulse = Math.sin(this.animTime * 0.005) * 0.3 + 0.7;
    const foodX = this.currentState.food.x * CELL_SIZE + CELL_SIZE / 2;
    const foodY = this.currentState.food.y * CELL_SIZE + CELL_SIZE / 2;

    // Outer glow
    g.fillStyle(COLORS.foodGlow, 0.2 * pulse);
    g.fillCircle(foodX, foodY, CELL_SIZE * 0.8);
    g.fillStyle(COLORS.foodGlow, 0.3 * pulse);
    g.fillCircle(foodX, foodY, CELL_SIZE * 0.6);

    // Food core
    g.fillStyle(COLORS.food, 1);
    g.fillCircle(foodX, foodY, CELL_SIZE * 0.4);

    // Food highlight
    g.fillStyle(0xffffff, 0.4);
    g.fillCircle(foodX - 2, foodY - 2, CELL_SIZE * 0.15);

    // Draw snake with gradient effect
    const snake = this.currentState.snake;
    const snakeLen = snake.length;

    for (let i = snakeLen - 1; i >= 0; i--) {
      const segment = snake[i];
      const x = segment.x * CELL_SIZE;
      const y = segment.y * CELL_SIZE;
      const cx = x + CELL_SIZE / 2;
      const cy = y + CELL_SIZE / 2;

      // Calculate color gradient from head to tail
      const t = snakeLen > 1 ? i / (snakeLen - 1) : 0;
      const isHead = i === 0;

      // Glow effect for head
      if (isHead) {
        g.fillStyle(COLORS.snakeGlow, 0.15);
        g.fillCircle(cx, cy, CELL_SIZE * 0.7);
      }

      // Body segment with gradient color
      const colorValue = isHead ? COLORS.snakeHead : lerpColor(COLORS.snakeBody, COLORS.snakeTail, t);

      // Draw rounded segment
      const radius = isHead ? CELL_SIZE * 0.45 : CELL_SIZE * 0.4 - t * 0.05 * CELL_SIZE;
      g.fillStyle(colorValue, 1);
      g.fillRoundedRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2, radius);

      // Head eyes
      if (isHead) {
        g.fillStyle(0x1a1a2e, 1);
        const eyeOffset = CELL_SIZE * 0.2;
        const eyeSize = CELL_SIZE * 0.12;
        g.fillCircle(cx - eyeOffset, cy - eyeOffset * 0.5, eyeSize);
        g.fillCircle(cx + eyeOffset, cy - eyeOffset * 0.5, eyeSize);

        // Eye highlights
        g.fillStyle(0xffffff, 0.8);
        g.fillCircle(cx - eyeOffset + 1, cy - eyeOffset * 0.5 - 1, eyeSize * 0.4);
        g.fillCircle(cx + eyeOffset + 1, cy - eyeOffset * 0.5 - 1, eyeSize * 0.4);
      }
    }

    // Game over overlay
    if (this.currentState.gameOver) {
      const flash = Math.sin(this.animTime * 0.008) * 0.1 + 0.5;
      g.fillStyle(COLORS.gameOverOverlay, flash);
      g.fillRect(0, 0, width, height);

      // Red vignette effect
      g.fillStyle(0xff0000, 0.1);
      g.fillRect(0, 0, width, 4);
      g.fillRect(0, height - 4, width, 4);
      g.fillRect(0, 0, 4, height);
      g.fillRect(width - 4, 0, 4, height);
    }
  }
}
