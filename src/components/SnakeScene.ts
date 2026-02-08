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
const GRID_SIZE = 20;

// Color palette - neon cyberpunk theme
const COLORS = {
  bgDark: 0x0a0a1a,
  bgGrid: 0x1a1a3a,
  snakeHead: 0x00ff88,
  snakeHeadGlow: 0x00ffaa,
  snakeBody: 0x00cc66,
  snakeTail: 0x007733,
  food: 0xff0066,
  foodGlow: 0xff3388,
  foodCore: 0xffffff,
  gameOverOverlay: 0x000000,
};

export class SnakeScene extends Phaser.Scene {
  private graphics!: Phaser.GameObjects.Graphics;
  private currentState: GameState | null = null;
  private needsRedraw = false;
  private frameCount = 0;

  constructor() {
    super({ key: 'SnakeScene' });
  }

  create(): void {
    this.graphics = this.add.graphics();

    if (this.currentState) {
      this.needsRedraw = true;
    }
  }

  updateGameState(state: GameState): void {
    this.currentState = state;
    this.needsRedraw = true;
  }

  update(): void {
    this.frameCount++;

    // Redraw every frame for animations, but only when we have state
    if (!this.currentState) return;

    // Force redraw for food pulse animation
    const shouldAnimate = !this.currentState.gameOver;
    if (!this.needsRedraw && !shouldAnimate) return;
    this.needsRedraw = false;

    const g = this.graphics;
    g.clear();

    const width = this.scale.width;
    const height = this.scale.height;

    // Dark gradient background
    g.fillStyle(COLORS.bgDark, 1);
    g.fillRect(0, 0, width, height);

    // Subtle grid pattern
    g.lineStyle(1, COLORS.bgGrid, 0.3);
    for (let i = 0; i <= GRID_SIZE; i++) {
      g.lineBetween(i * CELL_SIZE, 0, i * CELL_SIZE, height);
      g.lineBetween(0, i * CELL_SIZE, width, i * CELL_SIZE);
    }

    // Draw food with pulsing glow effect
    this.drawFood(g);

    // Draw snake with gradient body
    this.drawSnake(g);

    // Game over overlay
    if (this.currentState.gameOver) {
      this.drawGameOverEffect(g, width, height);
    }
  }

  private drawFood(g: Phaser.GameObjects.Graphics): void {
    if (!this.currentState) return;

    const food = this.currentState.food;
    const centerX = food.x * CELL_SIZE + CELL_SIZE / 2;
    const centerY = food.y * CELL_SIZE + CELL_SIZE / 2;

    // Pulsing animation
    const pulse = Math.sin(this.frameCount * 0.15) * 0.3 + 0.7;
    const glowSize = 12 * pulse;

    // Outer glow
    g.fillStyle(COLORS.food, 0.2 * pulse);
    g.fillCircle(centerX, centerY, glowSize + 4);

    // Middle glow
    g.fillStyle(COLORS.foodGlow, 0.4 * pulse);
    g.fillCircle(centerX, centerY, glowSize);

    // Core
    g.fillStyle(COLORS.food, 1);
    g.fillCircle(centerX, centerY, 6);

    // Bright center
    g.fillStyle(COLORS.foodCore, 0.8);
    g.fillCircle(centerX, centerY, 2);
  }

  private drawSnake(g: Phaser.GameObjects.Graphics): void {
    if (!this.currentState) return;

    const snake = this.currentState.snake;
    const segmentCount = snake.length;

    // Draw body segments from tail to head (so head renders on top)
    for (let i = segmentCount - 1; i >= 0; i--) {
      const segment = snake[i];
      const x = segment.x * CELL_SIZE;
      const y = segment.y * CELL_SIZE;
      const centerX = x + CELL_SIZE / 2;
      const centerY = y + CELL_SIZE / 2;

      const isHead = i === 0;
      const progress = segmentCount > 1 ? i / (segmentCount - 1) : 0;

      if (isHead) {
        // Head with glow effect
        g.fillStyle(COLORS.snakeHeadGlow, 0.3);
        g.fillCircle(centerX, centerY, 12);

        g.fillStyle(COLORS.snakeHead, 1);
        g.fillRoundedRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2, 6);

        // Eyes based on movement direction
        this.drawEyes(g, centerX, centerY);
      } else {
        // Body gradient from bright to dark
        const color = this.lerpColor(COLORS.snakeBody, COLORS.snakeTail, progress);
        const size = CELL_SIZE - 2 - progress * 2;
        const offset = (CELL_SIZE - size) / 2;

        g.fillStyle(color, 1);
        g.fillRoundedRect(x + offset, y + offset, size, size, 4);

        // Subtle highlight on each segment
        g.fillStyle(0xffffff, 0.1);
        g.fillRoundedRect(x + offset + 1, y + offset + 1, size / 2, size / 2, 2);
      }
    }
  }

  private drawEyes(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
    // Draw cute eyes
    const eyeOffset = 4;
    const eyeSize = 3;

    // Eye whites
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - eyeOffset, cy - 2, eyeSize);
    g.fillCircle(cx + eyeOffset, cy - 2, eyeSize);

    // Pupils
    g.fillStyle(0x000000, 1);
    g.fillCircle(cx - eyeOffset, cy - 2, 1.5);
    g.fillCircle(cx + eyeOffset, cy - 2, 1.5);
  }

  private drawGameOverEffect(g: Phaser.GameObjects.Graphics, width: number, height: number): void {
    // Dark overlay
    g.fillStyle(COLORS.gameOverOverlay, 0.5);
    g.fillRect(0, 0, width, height);

    // Red vignette effect around edges
    const gradient = 0xff0000;
    for (let i = 0; i < 5; i++) {
      g.lineStyle(3, gradient, 0.1 * (5 - i));
      g.strokeRect(i * 4, i * 4, width - i * 8, height - i * 8);
    }
  }

  private lerpColor(color1: number, color2: number, t: number): number {
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
}
