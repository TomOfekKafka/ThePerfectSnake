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

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: number;
  size: number;
}

const CELL_SIZE = 20;
const GRID_SIZE = 20;
const MAX_PARTICLES = 50;

// Color palette - neon cyberpunk theme
const COLORS = {
  bgDark: 0x0a0a1a,
  bgLight: 0x12122a,
  gridLine: 0x1a1a3a,
  snakeHead: 0x00ff88,
  snakeBody: 0x00cc66,
  snakeTail: 0x009944,
  snakeGlow: 0x00ff88,
  food: 0xff3366,
  foodGlow: 0xff6699,
  gameOverTint: 0xff0000,
  particleColors: [0xff3366, 0xff6699, 0xffcc00, 0xff9933, 0xffffff],
};

export class SnakeScene extends Phaser.Scene {
  private graphics!: Phaser.GameObjects.Graphics;
  private currentState: GameState | null = null;
  private needsRedraw = false;
  private frameCount = 0;
  private particles: Particle[] = [];
  private lastFoodPos: Position | null = null;
  private lastSnakeLength = 0;

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
    // Detect food eaten (snake grew)
    if (this.currentState && state.snake.length > this.lastSnakeLength && this.lastFoodPos) {
      this.spawnParticles(this.lastFoodPos.x, this.lastFoodPos.y);
    }

    this.lastFoodPos = { x: state.food.x, y: state.food.y };
    this.lastSnakeLength = state.snake.length;
    this.currentState = state;
    this.needsRedraw = true;
  }

  private spawnParticles(gridX: number, gridY: number): void {
    const centerX = gridX * CELL_SIZE + CELL_SIZE / 2;
    const centerY = gridY * CELL_SIZE + CELL_SIZE / 2;
    const particleCount = 12;

    for (let i = 0; i < particleCount; i++) {
      if (this.particles.length >= MAX_PARTICLES) {
        this.particles.shift();
      }

      const angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.5;
      const speed = 1.5 + Math.random() * 2;
      const color = COLORS.particleColors[Math.floor(Math.random() * COLORS.particleColors.length)];

      this.particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 30,
        maxLife: 30,
        color,
        size: 2 + Math.random() * 3,
      });
    }
  }

  private updateParticles(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.08; // gravity
      p.vx *= 0.98; // friction
      p.life--;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  private drawParticles(g: Phaser.GameObjects.Graphics): void {
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      const size = p.size * alpha;
      g.fillStyle(p.color, alpha * 0.9);
      g.fillCircle(p.x, p.y, size);
    }
  }

  update(): void {
    this.frameCount++;

    // Update particles
    this.updateParticles();

    // Animate food pulse every frame or if particles exist
    if (this.currentState || this.particles.length > 0) {
      this.needsRedraw = true;
    }

    if (!this.needsRedraw || !this.currentState) return;
    this.needsRedraw = false;

    const g = this.graphics;
    g.clear();

    const width = this.scale.width;
    const height = this.scale.height;

    // Dark gradient background
    g.fillStyle(COLORS.bgDark, 1);
    g.fillRect(0, 0, width, height);

    // Subtle grid pattern
    g.lineStyle(1, COLORS.gridLine, 0.3);
    for (let i = 0; i <= GRID_SIZE; i++) {
      g.lineBetween(i * CELL_SIZE, 0, i * CELL_SIZE, height);
      g.lineBetween(0, i * CELL_SIZE, width, i * CELL_SIZE);
    }

    // Game over red tint overlay
    if (this.currentState.gameOver) {
      g.fillStyle(COLORS.gameOverTint, 0.2);
      g.fillRect(0, 0, width, height);
    }

    // Draw food with pulsing glow effect
    const food = this.currentState.food;
    const pulse = Math.sin(this.frameCount * 0.15) * 0.3 + 0.7;
    const foodX = food.x * CELL_SIZE + CELL_SIZE / 2;
    const foodY = food.y * CELL_SIZE + CELL_SIZE / 2;
    const baseRadius = (CELL_SIZE - 2) / 2;

    // Outer glow
    g.fillStyle(COLORS.foodGlow, 0.2 * pulse);
    g.fillCircle(foodX, foodY, baseRadius + 4);

    // Mid glow
    g.fillStyle(COLORS.foodGlow, 0.4 * pulse);
    g.fillCircle(foodX, foodY, baseRadius + 2);

    // Core food
    g.fillStyle(COLORS.food, 1);
    g.fillCircle(foodX, foodY, baseRadius);

    // Inner highlight
    g.fillStyle(0xffffff, 0.4);
    g.fillCircle(foodX - 2, foodY - 2, baseRadius * 0.3);

    // Draw snake with gradient from head to tail
    const snake = this.currentState.snake;
    const snakeLen = snake.length;

    for (let i = snakeLen - 1; i >= 0; i--) {
      const segment = snake[i];
      const isHead = i === 0;
      const progress = snakeLen > 1 ? i / (snakeLen - 1) : 0;

      const x = segment.x * CELL_SIZE;
      const y = segment.y * CELL_SIZE;
      const centerX = x + CELL_SIZE / 2;
      const centerY = y + CELL_SIZE / 2;

      // Interpolate color from head to tail
      const color = isHead
        ? COLORS.snakeHead
        : this.lerpColor(COLORS.snakeBody, COLORS.snakeTail, progress);

      // Draw glow for head
      if (isHead && !this.currentState.gameOver) {
        g.fillStyle(COLORS.snakeGlow, 0.3);
        g.fillCircle(centerX, centerY, CELL_SIZE / 2 + 3);
      }

      // Draw segment with rounded corners (approximated with circle for head, rounded rect for body)
      if (isHead) {
        // Head is a rounded square with eyes
        g.fillStyle(color, 1);
        g.fillRoundedRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2, 6);

        // Eyes
        const eyeSize = 3;
        const eyeOffset = 4;
        g.fillStyle(0xffffff, 1);
        g.fillCircle(centerX - eyeOffset, centerY - 2, eyeSize);
        g.fillCircle(centerX + eyeOffset, centerY - 2, eyeSize);
        g.fillStyle(0x000000, 1);
        g.fillCircle(centerX - eyeOffset, centerY - 2, eyeSize / 2);
        g.fillCircle(centerX + eyeOffset, centerY - 2, eyeSize / 2);
      } else {
        // Body segments with decreasing size toward tail
        const sizeFactor = 1 - progress * 0.2;
        const size = (CELL_SIZE - 2) * sizeFactor;
        const offset = (CELL_SIZE - size) / 2;
        g.fillStyle(color, 1);
        g.fillRoundedRect(x + offset, y + offset, size, size, 4);
      }
    }

    // Draw particles on top
    this.drawParticles(g);
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
