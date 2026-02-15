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

// Color palette
const COLORS = {
  bgDark: 0x0a0a1a,
  bgLight: 0x1a1a2e,
  gridLine: 0x2a2a4e,
  snakeHead: 0x00ff88,
  snakeBody: 0x00cc66,
  snakeTail: 0x009944,
  snakeEye: 0xffffff,
  snakePupil: 0x000000,
  food: 0xff3366,
  foodGlow: 0xff6699,
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

    if (!this.needsRedraw || !this.currentState) return;
    this.needsRedraw = false;

    const g = this.graphics;
    g.clear();

    const width = this.scale.width;
    const height = this.scale.height;

    // Dark gradient background
    g.fillStyle(COLORS.bgDark, 1);
    g.fillRect(0, 0, width, height);

    // Subtle grid lines
    g.lineStyle(1, COLORS.gridLine, 0.3);
    for (let i = 0; i <= GRID_SIZE; i++) {
      g.lineBetween(i * CELL_SIZE, 0, i * CELL_SIZE, height);
      g.lineBetween(0, i * CELL_SIZE, width, i * CELL_SIZE);
    }

    // Food with glow effect
    const food = this.currentState.food;
    const foodX = food.x * CELL_SIZE + CELL_SIZE / 2;
    const foodY = food.y * CELL_SIZE + CELL_SIZE / 2;
    const pulseScale = 1 + Math.sin(this.frameCount * 0.15) * 0.15;

    // Outer glow
    g.fillStyle(COLORS.foodGlow, 0.2);
    g.fillCircle(foodX, foodY, (CELL_SIZE / 2 + 4) * pulseScale);
    g.fillStyle(COLORS.foodGlow, 0.3);
    g.fillCircle(foodX, foodY, (CELL_SIZE / 2 + 2) * pulseScale);

    // Food core
    g.fillStyle(COLORS.food, 1);
    g.fillCircle(foodX, foodY, (CELL_SIZE / 2 - 2) * pulseScale);

    // Snake body with gradient effect
    const snake = this.currentState.snake;
    const snakeLen = snake.length;

    for (let i = snakeLen - 1; i >= 0; i--) {
      const segment = snake[i];
      const x = segment.x * CELL_SIZE;
      const y = segment.y * CELL_SIZE;

      // Color gradient from head to tail
      const t = snakeLen > 1 ? i / (snakeLen - 1) : 1;
      const color = this.lerpColor(COLORS.snakeTail, COLORS.snakeHead, t);

      // Draw segment with rounded appearance
      const centerX = x + CELL_SIZE / 2;
      const centerY = y + CELL_SIZE / 2;
      const radius = CELL_SIZE / 2 - 1;

      // Outer glow for head
      if (i === 0) {
        g.fillStyle(COLORS.snakeHead, 0.3);
        g.fillCircle(centerX, centerY, radius + 3);
      }

      g.fillStyle(color, 1);
      g.fillCircle(centerX, centerY, radius);

      // Draw eyes on head
      if (i === 0 && snakeLen > 0) {
        this.drawSnakeHead(g, segment, snake[1]);
      }
    }

    // Game over overlay
    if (this.currentState.gameOver) {
      g.fillStyle(COLORS.gameOverOverlay, 0.6);
      g.fillRect(0, 0, width, height);
    }
  }

  private drawSnakeHead(
    g: Phaser.GameObjects.Graphics,
    head: Position,
    nextSegment: Position | undefined
  ): void {
    const centerX = head.x * CELL_SIZE + CELL_SIZE / 2;
    const centerY = head.y * CELL_SIZE + CELL_SIZE / 2;

    // Determine direction for eye placement
    let dx = 1, dy = 0;
    if (nextSegment) {
      dx = head.x - nextSegment.x;
      dy = head.y - nextSegment.y;
      // Normalize
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 0) {
        dx /= len;
        dy /= len;
      }
    }

    // Perpendicular for eye offset
    const perpX = -dy;
    const perpY = dx;

    const eyeOffset = 4;
    const eyeForward = 3;
    const eyeRadius = 3;
    const pupilRadius = 1.5;

    // Left eye
    const leftEyeX = centerX + perpX * eyeOffset + dx * eyeForward;
    const leftEyeY = centerY + perpY * eyeOffset + dy * eyeForward;
    g.fillStyle(COLORS.snakeEye, 1);
    g.fillCircle(leftEyeX, leftEyeY, eyeRadius);
    g.fillStyle(COLORS.snakePupil, 1);
    g.fillCircle(leftEyeX + dx * 1, leftEyeY + dy * 1, pupilRadius);

    // Right eye
    const rightEyeX = centerX - perpX * eyeOffset + dx * eyeForward;
    const rightEyeY = centerY - perpY * eyeOffset + dy * eyeForward;
    g.fillStyle(COLORS.snakeEye, 1);
    g.fillCircle(rightEyeX, rightEyeY, eyeRadius);
    g.fillStyle(COLORS.snakePupil, 1);
    g.fillCircle(rightEyeX + dx * 1, rightEyeY + dy * 1, pupilRadius);
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
