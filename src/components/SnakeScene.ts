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

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  brightness: number;
}

const CELL_SIZE = 20;
const GRID_SIZE = 20;

// Color palette - cosmic neon theme
const COLORS = {
  bgDark: 0x050510,
  bgGrid: 0x0f0f2a,
  snakeHead: 0x00ffcc,
  snakeHeadGlow: 0x00ffff,
  snakeBody: 0x00ff88,
  snakeTail: 0x00aa44,
  food: 0xff0066,
  foodGlow: 0xff3388,
  foodCore: 0xffffff,
  gameOverOverlay: 0x000000,
  // Rainbow colors for shimmer effect
  rainbow: [0xff0000, 0xff8800, 0xffff00, 0x00ff00, 0x0088ff, 0x8800ff, 0xff00ff],
  // Trail colors
  trailGlow: 0x00ffaa,
};

export class SnakeScene extends Phaser.Scene {
  private graphics!: Phaser.GameObjects.Graphics;
  private currentState: GameState | null = null;
  private needsRedraw = false;
  private frameCount = 0;

  // Particle systems
  private trailParticles: Particle[] = [];
  private foodParticles: Particle[] = [];
  private stars: Star[] = [];

  // Previous state for detecting food eaten
  private prevFoodPos: Position | null = null;
  private prevSnakeLength = 0;

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
    const width = GRID_SIZE * CELL_SIZE;
    const height = GRID_SIZE * CELL_SIZE;

    // Create starfield
    for (let i = 0; i < 60; i++) {
      this.stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 1.5 + 0.5,
        speed: Math.random() * 0.3 + 0.1,
        brightness: Math.random(),
      });
    }
  }

  updateGameState(state: GameState): void {
    // Detect if food was eaten (snake grew)
    if (this.currentState && state.snake.length > this.prevSnakeLength) {
      this.spawnFoodExplosion(this.prevFoodPos || state.food);
    }

    this.prevFoodPos = state.food;
    this.prevSnakeLength = state.snake.length;
    this.currentState = state;
    this.needsRedraw = true;
  }

  private spawnFoodExplosion(pos: Position): void {
    const centerX = pos.x * CELL_SIZE + CELL_SIZE / 2;
    const centerY = pos.y * CELL_SIZE + CELL_SIZE / 2;

    // Spawn burst of particles
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 + Math.random() * 0.5;
      const speed = 2 + Math.random() * 3;
      this.foodParticles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 30,
        maxLife: 30,
        color: COLORS.rainbow[i % COLORS.rainbow.length],
        size: 3 + Math.random() * 2,
      });
    }
  }

  private spawnTrailParticle(x: number, y: number, color: number): void {
    if (this.trailParticles.length > 50) return; // Limit particles

    this.trailParticles.push({
      x: x + (Math.random() - 0.5) * 6,
      y: y + (Math.random() - 0.5) * 6,
      vx: (Math.random() - 0.5) * 0.5,
      vy: (Math.random() - 0.5) * 0.5,
      life: 20,
      maxLife: 20,
      color: color,
      size: 2 + Math.random() * 2,
    });
  }

  private updateParticles(): void {
    // Update trail particles
    for (let i = this.trailParticles.length - 1; i >= 0; i--) {
      const p = this.trailParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life--;
      if (p.life <= 0) {
        this.trailParticles.splice(i, 1);
      }
    }

    // Update food explosion particles
    for (let i = this.foodParticles.length - 1; i >= 0; i--) {
      const p = this.foodParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.95;
      p.vy *= 0.95;
      p.life--;
      if (p.life <= 0) {
        this.foodParticles.splice(i, 1);
      }
    }

    // Update stars (twinkling)
    for (const star of this.stars) {
      star.brightness = Math.sin(this.frameCount * star.speed + star.x) * 0.3 + 0.7;
    }
  }

  update(): void {
    this.frameCount++;
    this.updateParticles();

    // Redraw every frame for animations
    if (!this.currentState) return;

    const shouldAnimate = !this.currentState.gameOver;
    if (!this.needsRedraw && !shouldAnimate && this.foodParticles.length === 0) return;
    this.needsRedraw = false;

    const g = this.graphics;
    g.clear();

    const width = this.scale.width;
    const height = this.scale.height;

    // Deep space background
    g.fillStyle(COLORS.bgDark, 1);
    g.fillRect(0, 0, width, height);

    // Draw twinkling stars
    this.drawStars(g);

    // Subtle grid pattern with glow
    this.drawGrid(g, width, height);

    // Draw trail particles (behind snake)
    this.drawTrailParticles(g);

    // Draw food with enhanced pulsing glow effect
    this.drawFood(g);

    // Draw food explosion particles
    this.drawFoodParticles(g);

    // Draw snake with rainbow shimmer
    this.drawSnake(g);

    // Game over overlay
    if (this.currentState.gameOver) {
      this.drawGameOverEffect(g, width, height);
    }
  }

  private drawStars(g: Phaser.GameObjects.Graphics): void {
    for (const star of this.stars) {
      const alpha = star.brightness * 0.8;
      g.fillStyle(0xffffff, alpha);
      g.fillCircle(star.x, star.y, star.size);

      // Some stars have a subtle colored halo
      if (star.size > 1.2) {
        const haloColor = COLORS.rainbow[Math.floor(star.x) % COLORS.rainbow.length];
        g.fillStyle(haloColor, alpha * 0.2);
        g.fillCircle(star.x, star.y, star.size + 1);
      }
    }
  }

  private drawGrid(g: Phaser.GameObjects.Graphics, width: number, height: number): void {
    // Draw grid with subtle glow at intersections
    g.lineStyle(1, COLORS.bgGrid, 0.2);
    for (let i = 0; i <= GRID_SIZE; i++) {
      g.lineBetween(i * CELL_SIZE, 0, i * CELL_SIZE, height);
      g.lineBetween(0, i * CELL_SIZE, width, i * CELL_SIZE);
    }

    // Subtle glow at corners
    for (let x = 0; x <= GRID_SIZE; x += 5) {
      for (let y = 0; y <= GRID_SIZE; y += 5) {
        g.fillStyle(0x00ffff, 0.05);
        g.fillCircle(x * CELL_SIZE, y * CELL_SIZE, 3);
      }
    }
  }

  private drawTrailParticles(g: Phaser.GameObjects.Graphics): void {
    for (const p of this.trailParticles) {
      const alpha = (p.life / p.maxLife) * 0.6;
      g.fillStyle(p.color, alpha);
      g.fillCircle(p.x, p.y, p.size * (p.life / p.maxLife));
    }
  }

  private drawFoodParticles(g: Phaser.GameObjects.Graphics): void {
    for (const p of this.foodParticles) {
      const alpha = p.life / p.maxLife;
      const size = p.size * alpha;

      // Outer glow
      g.fillStyle(p.color, alpha * 0.3);
      g.fillCircle(p.x, p.y, size + 2);

      // Core
      g.fillStyle(p.color, alpha);
      g.fillCircle(p.x, p.y, size);

      // Bright center
      g.fillStyle(0xffffff, alpha * 0.8);
      g.fillCircle(p.x, p.y, size * 0.3);
    }
  }

  private drawFood(g: Phaser.GameObjects.Graphics): void {
    if (!this.currentState) return;

    const food = this.currentState.food;
    const centerX = food.x * CELL_SIZE + CELL_SIZE / 2;
    const centerY = food.y * CELL_SIZE + CELL_SIZE / 2;

    // Multi-layer pulsing animation
    const pulse1 = Math.sin(this.frameCount * 0.12) * 0.3 + 0.7;
    const pulse2 = Math.sin(this.frameCount * 0.08 + 1) * 0.2 + 0.8;
    const pulse3 = Math.sin(this.frameCount * 0.2) * 0.15 + 0.85;

    // Outer corona glow
    g.fillStyle(COLORS.food, 0.1 * pulse2);
    g.fillCircle(centerX, centerY, 18 * pulse2);

    // Rainbow ring effect (rotating)
    const ringRadius = 14 * pulse1;
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + this.frameCount * 0.05;
      const rx = centerX + Math.cos(angle) * ringRadius * 0.5;
      const ry = centerY + Math.sin(angle) * ringRadius * 0.5;
      g.fillStyle(COLORS.rainbow[i], 0.3 * pulse1);
      g.fillCircle(rx, ry, 3);
    }

    // Main glow layers
    g.fillStyle(COLORS.food, 0.15 * pulse1);
    g.fillCircle(centerX, centerY, 14 * pulse1);

    g.fillStyle(COLORS.foodGlow, 0.4 * pulse1);
    g.fillCircle(centerX, centerY, 10 * pulse1);

    // Core
    g.fillStyle(COLORS.food, 1);
    g.fillCircle(centerX, centerY, 6);

    // Inner bright spot
    g.fillStyle(COLORS.foodCore, 0.9 * pulse3);
    g.fillCircle(centerX, centerY, 3);

    // Sparkle highlight
    const sparkleOffset = Math.sin(this.frameCount * 0.1) * 2;
    g.fillStyle(0xffffff, 0.7);
    g.fillCircle(centerX - 2 + sparkleOffset, centerY - 2, 1.5);
  }

  private drawSnake(g: Phaser.GameObjects.Graphics): void {
    if (!this.currentState) return;

    const snake = this.currentState.snake;
    const segmentCount = snake.length;

    // Spawn trail particles from tail
    if (segmentCount > 0 && !this.currentState.gameOver) {
      const tail = snake[snake.length - 1];
      const tailX = tail.x * CELL_SIZE + CELL_SIZE / 2;
      const tailY = tail.y * CELL_SIZE + CELL_SIZE / 2;
      if (this.frameCount % 3 === 0) {
        this.spawnTrailParticle(tailX, tailY, COLORS.trailGlow);
      }
    }

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
        // Head with enhanced glow effect
        const headPulse = Math.sin(this.frameCount * 0.1) * 0.2 + 0.8;

        // Outer glow layers
        g.fillStyle(COLORS.snakeHeadGlow, 0.15 * headPulse);
        g.fillCircle(centerX, centerY, 16);

        g.fillStyle(COLORS.snakeHeadGlow, 0.3 * headPulse);
        g.fillCircle(centerX, centerY, 12);

        // Main head
        g.fillStyle(COLORS.snakeHead, 1);
        g.fillRoundedRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2, 6);

        // Shiny highlight
        g.fillStyle(0xffffff, 0.3);
        g.fillRoundedRect(x + 3, y + 3, 8, 6, 3);

        // Eyes with direction awareness
        this.drawEyes(g, centerX, centerY);
      } else {
        // Rainbow shimmer effect on body
        const shimmerPhase = (this.frameCount * 0.1 + i * 0.5) % COLORS.rainbow.length;
        const shimmerIndex = Math.floor(shimmerPhase);
        const shimmerT = shimmerPhase - shimmerIndex;
        const shimmerColor = this.lerpColor(
          COLORS.rainbow[shimmerIndex],
          COLORS.rainbow[(shimmerIndex + 1) % COLORS.rainbow.length],
          shimmerT
        );

        // Body gradient from bright to dark with shimmer overlay
        const baseColor = this.lerpColor(COLORS.snakeBody, COLORS.snakeTail, progress);
        const size = CELL_SIZE - 2 - progress * 3;
        const offset = (CELL_SIZE - size) / 2;

        // Outer glow for body segments (subtle)
        g.fillStyle(baseColor, 0.2);
        g.fillCircle(centerX, centerY, size / 2 + 2);

        // Main body segment
        g.fillStyle(baseColor, 1);
        g.fillRoundedRect(x + offset, y + offset, size, size, 4);

        // Rainbow shimmer overlay
        g.fillStyle(shimmerColor, 0.15);
        g.fillRoundedRect(x + offset, y + offset, size, size, 4);

        // Subtle highlight on each segment
        g.fillStyle(0xffffff, 0.15);
        g.fillRoundedRect(x + offset + 1, y + offset + 1, size / 2, size / 3, 2);
      }
    }
  }

  private drawEyes(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
    const eyeOffset = 4;
    const eyeSize = 3.5;

    // Eye glow
    g.fillStyle(0x00ffff, 0.3);
    g.fillCircle(cx - eyeOffset, cy - 2, eyeSize + 1);
    g.fillCircle(cx + eyeOffset, cy - 2, eyeSize + 1);

    // Eye whites
    g.fillStyle(0xffffff, 1);
    g.fillCircle(cx - eyeOffset, cy - 2, eyeSize);
    g.fillCircle(cx + eyeOffset, cy - 2, eyeSize);

    // Pupils with slight animation
    const pupilOffset = Math.sin(this.frameCount * 0.05) * 0.5;
    g.fillStyle(0x000000, 1);
    g.fillCircle(cx - eyeOffset + pupilOffset, cy - 2, 1.8);
    g.fillCircle(cx + eyeOffset + pupilOffset, cy - 2, 1.8);

    // Eye shine
    g.fillStyle(0xffffff, 0.8);
    g.fillCircle(cx - eyeOffset - 1, cy - 3, 1);
    g.fillCircle(cx + eyeOffset - 1, cy - 3, 1);
  }

  private drawGameOverEffect(g: Phaser.GameObjects.Graphics, width: number, height: number): void {
    // Animated dark overlay with pulse
    const pulse = Math.sin(this.frameCount * 0.1) * 0.1 + 0.6;
    g.fillStyle(COLORS.gameOverOverlay, pulse);
    g.fillRect(0, 0, width, height);

    // Red vignette effect with animation
    for (let i = 0; i < 8; i++) {
      const intensity = (8 - i) / 8;
      const offset = i * 5;
      g.lineStyle(4, 0xff0000, 0.12 * intensity);
      g.strokeRect(offset, offset, width - offset * 2, height - offset * 2);
    }

    // Subtle red glow in corners
    const cornerGlow = Math.sin(this.frameCount * 0.15) * 0.1 + 0.2;
    g.fillStyle(0xff0000, cornerGlow);
    g.fillCircle(0, 0, 40);
    g.fillCircle(width, 0, 40);
    g.fillCircle(0, height, 40);
    g.fillCircle(width, height, 40);
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
