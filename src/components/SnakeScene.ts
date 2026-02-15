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

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  brightness: number;
}

interface FoodParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

const CELL_SIZE = 20;
const GRID_SIZE = 20;
const NUM_STARS = 30;
const MAX_FOOD_PARTICLES = 8;

// Color palette - enhanced neon cyberpunk theme
const COLORS = {
  bgDark: 0x050510,
  bgMid: 0x0a0a1a,
  gridLine: 0x1a1a3e,
  gridAccent: 0x2a2a6e,
  snakeHead: 0x00ffaa,
  snakeBody: 0x00dd88,
  snakeTail: 0x00aa66,
  snakeHighlight: 0x88ffcc,
  snakeScale: 0x008855,
  snakeEye: 0xffffff,
  snakePupil: 0x000000,
  snakeGlow: 0x00ff88,
  food: 0xff2266,
  foodCore: 0xffaacc,
  foodGlow: 0xff4488,
  foodParticle: 0xff88aa,
  star: 0xffffff,
  gameOverOverlay: 0x000000,
  gameOverText: 0xff3366,
};

export class SnakeScene extends Phaser.Scene {
  private graphics!: Phaser.GameObjects.Graphics;
  private currentState: GameState | null = null;
  private needsRedraw = false;
  private frameCount = 0;
  private stars: Star[] = [];
  private foodParticles: FoodParticle[] = [];
  private gameOverAlpha = 0;

  constructor() {
    super({ key: 'SnakeScene' });
  }

  create(): void {
    this.graphics = this.add.graphics();
    this.initStars();

    if (this.currentState) {
      this.needsRedraw = true;
    }
  }

  private initStars(): void {
    this.stars = [];
    const width = GRID_SIZE * CELL_SIZE;
    const height = GRID_SIZE * CELL_SIZE;
    for (let i = 0; i < NUM_STARS; i++) {
      this.stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: 0.5 + Math.random() * 1.5,
        speed: 0.02 + Math.random() * 0.03,
        brightness: 0.3 + Math.random() * 0.7,
      });
    }
  }

  private spawnFoodParticles(foodX: number, foodY: number): void {
    if (this.foodParticles.length < MAX_FOOD_PARTICLES && Math.random() < 0.15) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.3 + Math.random() * 0.5;
      this.foodParticles.push({
        x: foodX,
        y: foodY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 0.5,
        life: 1,
        maxLife: 40 + Math.random() * 20,
        size: 1 + Math.random() * 2,
      });
    }
  }

  private updateParticles(): void {
    for (let i = this.foodParticles.length - 1; i >= 0; i--) {
      const p = this.foodParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.02;
      p.life -= 1 / p.maxLife;
      if (p.life <= 0) {
        this.foodParticles.splice(i, 1);
      }
    }
  }

  updateGameState(state: GameState): void {
    this.currentState = state;
    this.needsRedraw = true;
    if (!state.gameOver) {
      this.gameOverAlpha = 0;
    }
  }

  update(): void {
    this.frameCount++;
    this.updateParticles();

    // Always redraw for animations (stars, particles, pulsing)
    const g = this.graphics;
    g.clear();

    const width = this.scale.width;
    const height = this.scale.height;

    // Deep space background with gradient effect
    g.fillStyle(COLORS.bgDark, 1);
    g.fillRect(0, 0, width, height);

    // Radial gradient effect in center (lighter area)
    const centerGradientAlpha = 0.15 + Math.sin(this.frameCount * 0.02) * 0.05;
    g.fillStyle(COLORS.bgMid, centerGradientAlpha);
    g.fillCircle(width / 2, height / 2, width * 0.6);

    // Animated star field
    this.drawStars(g);

    // Grid with pulsing accent lines
    this.drawGrid(g, width, height);

    if (!this.currentState) return;

    // Food with enhanced glow and particles
    this.drawFood(g);

    // Snake with trail and scale effects
    this.drawSnake(g);

    // Game over overlay with animation
    if (this.currentState.gameOver) {
      this.drawGameOver(g, width, height);
    }

    this.needsRedraw = false;
  }

  private drawStars(g: Phaser.GameObjects.Graphics): void {
    for (const star of this.stars) {
      const twinkle = 0.5 + Math.sin(this.frameCount * star.speed + star.x) * 0.5;
      const alpha = star.brightness * twinkle * 0.6;
      g.fillStyle(COLORS.star, alpha);
      g.fillCircle(star.x, star.y, star.size);
    }
  }

  private drawGrid(g: Phaser.GameObjects.Graphics, width: number, height: number): void {
    // Main grid lines
    g.lineStyle(1, COLORS.gridLine, 0.2);
    for (let i = 0; i <= GRID_SIZE; i++) {
      g.lineBetween(i * CELL_SIZE, 0, i * CELL_SIZE, height);
      g.lineBetween(0, i * CELL_SIZE, width, i * CELL_SIZE);
    }

    // Pulsing accent lines every 5 cells
    const accentPulse = 0.2 + Math.sin(this.frameCount * 0.05) * 0.1;
    g.lineStyle(1, COLORS.gridAccent, accentPulse);
    for (let i = 0; i <= GRID_SIZE; i += 5) {
      g.lineBetween(i * CELL_SIZE, 0, i * CELL_SIZE, height);
      g.lineBetween(0, i * CELL_SIZE, width, i * CELL_SIZE);
    }
  }

  private drawFood(g: Phaser.GameObjects.Graphics): void {
    if (!this.currentState) return;

    const food = this.currentState.food;
    const foodX = food.x * CELL_SIZE + CELL_SIZE / 2;
    const foodY = food.y * CELL_SIZE + CELL_SIZE / 2;
    const pulseScale = 1 + Math.sin(this.frameCount * 0.15) * 0.12;
    const glowPulse = 0.3 + Math.sin(this.frameCount * 0.1) * 0.15;

    // Spawn particles
    this.spawnFoodParticles(foodX, foodY);

    // Draw particles
    for (const p of this.foodParticles) {
      g.fillStyle(COLORS.foodParticle, p.life * 0.6);
      g.fillCircle(p.x, p.y, p.size * p.life);
    }

    // Multi-layer glow
    g.fillStyle(COLORS.foodGlow, glowPulse * 0.3);
    g.fillCircle(foodX, foodY, (CELL_SIZE / 2 + 8) * pulseScale);
    g.fillStyle(COLORS.foodGlow, glowPulse * 0.5);
    g.fillCircle(foodX, foodY, (CELL_SIZE / 2 + 4) * pulseScale);
    g.fillStyle(COLORS.food, 0.9);
    g.fillCircle(foodX, foodY, (CELL_SIZE / 2) * pulseScale);

    // Bright core highlight
    g.fillStyle(COLORS.foodCore, 0.8);
    g.fillCircle(foodX - 2, foodY - 2, 3 * pulseScale);
  }

  private drawSnake(g: Phaser.GameObjects.Graphics): void {
    if (!this.currentState) return;

    const snake = this.currentState.snake;
    const snakeLen = snake.length;

    // Draw trailing glow first (behind snake)
    for (let i = snakeLen - 1; i >= 0; i--) {
      const segment = snake[i];
      const centerX = segment.x * CELL_SIZE + CELL_SIZE / 2;
      const centerY = segment.y * CELL_SIZE + CELL_SIZE / 2;
      const t = snakeLen > 1 ? i / (snakeLen - 1) : 1;
      const glowAlpha = 0.15 * t;
      const glowSize = (CELL_SIZE / 2 + 4) * (0.5 + t * 0.5);

      g.fillStyle(COLORS.snakeGlow, glowAlpha);
      g.fillCircle(centerX, centerY, glowSize);
    }

    // Draw snake segments from tail to head
    for (let i = snakeLen - 1; i >= 0; i--) {
      const segment = snake[i];
      const centerX = segment.x * CELL_SIZE + CELL_SIZE / 2;
      const centerY = segment.y * CELL_SIZE + CELL_SIZE / 2;

      const t = snakeLen > 1 ? i / (snakeLen - 1) : 1;
      const baseColor = this.lerpColor(COLORS.snakeTail, COLORS.snakeBody, t);
      const radius = (CELL_SIZE / 2 - 1) * (0.85 + t * 0.15);

      // Head has special treatment
      if (i === 0) {
        // Head glow
        g.fillStyle(COLORS.snakeHead, 0.4);
        g.fillCircle(centerX, centerY, radius + 5);

        // Head base
        g.fillStyle(COLORS.snakeHead, 1);
        g.fillCircle(centerX, centerY, radius + 1);

        // Head highlight
        g.fillStyle(COLORS.snakeHighlight, 0.5);
        g.fillCircle(centerX - 2, centerY - 2, radius * 0.4);

        this.drawSnakeHead(g, segment, snake[1]);
      } else {
        // Body segment
        g.fillStyle(baseColor, 1);
        g.fillCircle(centerX, centerY, radius);

        // Scale pattern (subtle darker circles)
        if (i % 2 === 0) {
          g.fillStyle(COLORS.snakeScale, 0.3);
          g.fillCircle(centerX, centerY, radius * 0.5);
        }

        // Highlight on each segment
        g.fillStyle(COLORS.snakeHighlight, 0.2 * t);
        g.fillCircle(centerX - 1, centerY - 1, radius * 0.3);
      }
    }

  }

  private drawGameOver(g: Phaser.GameObjects.Graphics, width: number, height: number): void {
    // Animate fade in
    if (this.gameOverAlpha < 0.7) {
      this.gameOverAlpha += 0.03;
    }

    // Dark overlay
    g.fillStyle(COLORS.gameOverOverlay, this.gameOverAlpha);
    g.fillRect(0, 0, width, height);

    // Pulsing vignette effect
    const vignetteAlpha = 0.3 + Math.sin(this.frameCount * 0.08) * 0.1;
    g.fillStyle(COLORS.gameOverText, vignetteAlpha * 0.2);
    g.fillRect(0, 0, width, 4);
    g.fillRect(0, height - 4, width, 4);
    g.fillRect(0, 0, 4, height);
    g.fillRect(width - 4, 0, 4, height);
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
