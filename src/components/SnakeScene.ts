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
  twinkleOffset: number;
}

interface TrailSegment {
  x: number;
  y: number;
  age: number;
  maxAge: number;
}

interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  life: number;
}

interface Nebula {
  x: number;
  y: number;
  radius: number;
  color: number;
  phase: number;
  speed: number;
}

interface Lightning {
  points: { x: number; y: number }[];
  life: number;
  maxLife: number;
  color: number;
}

const CELL_SIZE = 20;
const GRID_SIZE = 20;
const MAX_PARTICLES = 50;
const NUM_STARS = 40;
const MAX_TRAIL_SEGMENTS = 15;
const NUM_NEBULAS = 4;

// Color palette - cosmic neon theme with plasma effects
const COLORS = {
  bgDark: 0x030308,
  bgLight: 0x0a0a20,
  gridLine: 0x1a1a3a,
  snakeHead: 0x00ffcc,
  snakeBody: 0x00dd99,
  snakeTail: 0x00aa66,
  snakeGlow: 0x00ffcc,
  snakeElectric: 0x88ffff,
  trailColors: [0x00ffcc, 0x00ddff, 0x8866ff, 0xff00ff],
  food: 0xff2266,
  foodGlow: 0xff66aa,
  foodRing: 0xffaa00,
  foodPlasma: 0xff88cc,
  star: 0xffffff,
  gameOverTint: 0xff0000,
  shockwave: 0xff4444,
  particleColors: [0xff3366, 0xff6699, 0xffcc00, 0x00ffcc, 0xffffff],
  nebulaColors: [0x4400aa, 0x0044aa, 0x880066, 0x006688],
  lightning: 0xaaffff,
};

export class SnakeScene extends Phaser.Scene {
  private graphics!: Phaser.GameObjects.Graphics;
  private currentState: GameState | null = null;
  private needsRedraw = false;
  private frameCount = 0;
  private particles: Particle[] = [];
  private lastFoodPos: Position | null = null;
  private lastSnakeLength = 0;
  private stars: Star[] = [];
  private trail: TrailSegment[] = [];
  private lastHeadPos: Position | null = null;
  private shockwave: Shockwave | null = null;
  private wasGameOver = false;
  private nebulas: Nebula[] = [];
  private lightnings: Lightning[] = [];
  private screenShake = 0;
  private lastDirection: { x: number; y: number } = { x: 1, y: 0 };

  constructor() {
    super({ key: 'SnakeScene' });
  }

  create(): void {
    this.graphics = this.add.graphics();
    this.initStars();
    this.initNebulas();

    if (this.currentState) {
      this.needsRedraw = true;
    }
  }

  private initStars(): void {
    const width = GRID_SIZE * CELL_SIZE;
    const height = GRID_SIZE * CELL_SIZE;
    this.stars = [];
    for (let i = 0; i < NUM_STARS; i++) {
      this.stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: 0.5 + Math.random() * 1.5,
        speed: 0.1 + Math.random() * 0.3,
        twinkleOffset: Math.random() * Math.PI * 2,
      });
    }
  }

  private initNebulas(): void {
    const width = GRID_SIZE * CELL_SIZE;
    const height = GRID_SIZE * CELL_SIZE;
    this.nebulas = [];
    for (let i = 0; i < NUM_NEBULAS; i++) {
      this.nebulas.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 40 + Math.random() * 60,
        color: COLORS.nebulaColors[i % COLORS.nebulaColors.length],
        phase: Math.random() * Math.PI * 2,
        speed: 0.005 + Math.random() * 0.01,
      });
    }
  }

  updateGameState(state: GameState): void {
    // Detect food eaten (snake grew)
    if (this.currentState && state.snake.length > this.lastSnakeLength && this.lastFoodPos) {
      this.spawnParticles(this.lastFoodPos.x, this.lastFoodPos.y);
    }

    // Detect game over for shockwave and screen shake
    if (state.gameOver && !this.wasGameOver && state.snake.length > 0) {
      const head = state.snake[0];
      this.shockwave = {
        x: head.x * CELL_SIZE + CELL_SIZE / 2,
        y: head.y * CELL_SIZE + CELL_SIZE / 2,
        radius: 0,
        maxRadius: GRID_SIZE * CELL_SIZE * 0.7,
        life: 40,
      };
      this.screenShake = 15;
    }
    this.wasGameOver = state.gameOver;

    // Track movement direction for speed lines
    if (state.snake.length > 0 && this.lastHeadPos) {
      const head = state.snake[0];
      const dx = head.x - this.lastHeadPos.x;
      const dy = head.y - this.lastHeadPos.y;
      if (dx !== 0 || dy !== 0) {
        this.lastDirection = { x: dx, y: dy };
      }
    }

    // Update trail with head position
    if (state.snake.length > 0) {
      const head = state.snake[0];
      if (!this.lastHeadPos || head.x !== this.lastHeadPos.x || head.y !== this.lastHeadPos.y) {
        this.trail.unshift({
          x: head.x * CELL_SIZE + CELL_SIZE / 2,
          y: head.y * CELL_SIZE + CELL_SIZE / 2,
          age: 0,
          maxAge: MAX_TRAIL_SEGMENTS,
        });
        if (this.trail.length > MAX_TRAIL_SEGMENTS) {
          this.trail.pop();
        }
        this.lastHeadPos = { x: head.x, y: head.y };
      }
    }

    // Clear trail on game over or reset
    if (state.gameOver || state.snake.length <= 1) {
      this.trail = [];
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

  private drawStars(g: Phaser.GameObjects.Graphics): void {
    for (const star of this.stars) {
      const twinkle = Math.sin(this.frameCount * 0.05 + star.twinkleOffset) * 0.4 + 0.6;
      g.fillStyle(COLORS.star, twinkle * 0.7);
      g.fillCircle(star.x, star.y, star.size * twinkle);
    }
  }

  private drawNebulas(g: Phaser.GameObjects.Graphics): void {
    for (const nebula of this.nebulas) {
      const breathe = Math.sin(this.frameCount * nebula.speed + nebula.phase) * 0.2 + 0.8;
      const radius = nebula.radius * breathe;

      // Draw multiple soft layers for nebula cloud effect
      for (let layer = 3; layer >= 1; layer--) {
        const layerRadius = radius * (layer / 3);
        const alpha = 0.03 / layer;
        g.fillStyle(nebula.color, alpha);
        g.fillCircle(nebula.x, nebula.y, layerRadius);
      }
    }
  }

  private generateLightning(startX: number, startY: number, endX: number, endY: number): Lightning {
    const points: { x: number; y: number }[] = [{ x: startX, y: startY }];
    const segments = 4;
    const dx = (endX - startX) / segments;
    const dy = (endY - startY) / segments;

    for (let i = 1; i < segments; i++) {
      const jitter = 4;
      points.push({
        x: startX + dx * i + (Math.random() - 0.5) * jitter,
        y: startY + dy * i + (Math.random() - 0.5) * jitter,
      });
    }
    points.push({ x: endX, y: endY });

    return {
      points,
      life: 8,
      maxLife: 8,
      color: COLORS.lightning,
    };
  }

  private updateLightnings(): void {
    for (let i = this.lightnings.length - 1; i >= 0; i--) {
      this.lightnings[i].life--;
      if (this.lightnings[i].life <= 0) {
        this.lightnings.splice(i, 1);
      }
    }

    // Spawn new lightning between snake segments occasionally
    if (this.currentState && !this.currentState.gameOver && this.currentState.snake.length > 2) {
      if (this.frameCount % 6 === 0) {
        const snake = this.currentState.snake;
        const idx = Math.floor(Math.random() * (snake.length - 1));
        const seg1 = snake[idx];
        const seg2 = snake[idx + 1];
        const x1 = seg1.x * CELL_SIZE + CELL_SIZE / 2;
        const y1 = seg1.y * CELL_SIZE + CELL_SIZE / 2;
        const x2 = seg2.x * CELL_SIZE + CELL_SIZE / 2;
        const y2 = seg2.y * CELL_SIZE + CELL_SIZE / 2;
        this.lightnings.push(this.generateLightning(x1, y1, x2, y2));
      }
    }
  }

  private drawLightnings(g: Phaser.GameObjects.Graphics): void {
    for (const lightning of this.lightnings) {
      const alpha = (lightning.life / lightning.maxLife) * 0.8;

      // Outer glow
      g.lineStyle(3, lightning.color, alpha * 0.3);
      g.beginPath();
      g.moveTo(lightning.points[0].x, lightning.points[0].y);
      for (let i = 1; i < lightning.points.length; i++) {
        g.lineTo(lightning.points[i].x, lightning.points[i].y);
      }
      g.strokePath();

      // Inner bright line
      g.lineStyle(1, 0xffffff, alpha);
      g.beginPath();
      g.moveTo(lightning.points[0].x, lightning.points[0].y);
      for (let i = 1; i < lightning.points.length; i++) {
        g.lineTo(lightning.points[i].x, lightning.points[i].y);
      }
      g.strokePath();
    }
  }

  private drawSpeedLines(g: Phaser.GameObjects.Graphics): void {
    if (!this.currentState || this.currentState.gameOver || this.currentState.snake.length === 0) return;

    const head = this.currentState.snake[0];
    const centerX = head.x * CELL_SIZE + CELL_SIZE / 2;
    const centerY = head.y * CELL_SIZE + CELL_SIZE / 2;

    // Direction opposite to movement
    const dirX = -this.lastDirection.x;
    const dirY = -this.lastDirection.y;

    // Draw speed lines behind the head
    const numLines = 3;
    for (let i = 0; i < numLines; i++) {
      const offset = (i - (numLines - 1) / 2) * 5;
      const perpX = -dirY;
      const perpY = dirX;

      const startX = centerX + dirX * 12 + perpX * offset;
      const startY = centerY + dirY * 12 + perpY * offset;
      const endX = startX + dirX * (8 + i * 2);
      const endY = startY + dirY * (8 + i * 2);

      const alpha = 0.3 - i * 0.08;
      g.lineStyle(2 - i * 0.5, COLORS.snakeGlow, alpha);
      g.beginPath();
      g.moveTo(startX, startY);
      g.lineTo(endX, endY);
      g.strokePath();
    }
  }

  private drawTrail(g: Phaser.GameObjects.Graphics): void {
    if (this.trail.length < 2) return;

    for (let i = 0; i < this.trail.length; i++) {
      const segment = this.trail[i];
      const progress = i / this.trail.length;
      const alpha = (1 - progress) * 0.5;
      const size = (1 - progress) * 8 + 2;

      // Color shifts through trail colors
      const colorIndex = Math.floor(progress * (COLORS.trailColors.length - 1));
      const color = COLORS.trailColors[Math.min(colorIndex, COLORS.trailColors.length - 1)];

      g.fillStyle(color, alpha);
      g.fillCircle(segment.x, segment.y, size);
    }
  }

  private updateTrail(): void {
    for (const segment of this.trail) {
      segment.age++;
    }
  }

  private drawHexagonFood(g: Phaser.GameObjects.Graphics, foodX: number, foodY: number, baseRadius: number): void {
    const pulse = Math.sin(this.frameCount * 0.12) * 0.25 + 0.75;
    const rotation = this.frameCount * 0.03;

    // Plasma tendrils extending outward
    const numTendrils = 6;
    for (let i = 0; i < numTendrils; i++) {
      const angle = (i / numTendrils) * Math.PI * 2 + this.frameCount * 0.02;
      const tendrilLength = baseRadius + 8 + Math.sin(this.frameCount * 0.15 + i) * 4;
      const endX = foodX + Math.cos(angle) * tendrilLength;
      const endY = foodY + Math.sin(angle) * tendrilLength;

      const midX = foodX + Math.cos(angle) * (baseRadius + 2);
      const midY = foodY + Math.sin(angle) * (baseRadius + 2);

      g.lineStyle(2, COLORS.foodPlasma, 0.4 * pulse);
      g.beginPath();
      g.moveTo(midX, midY);
      g.lineTo(endX, endY);
      g.strokePath();

      // Tendril tip glow
      g.fillStyle(COLORS.foodGlow, 0.5 * pulse);
      g.fillCircle(endX, endY, 2);
    }

    // Outer energy rings
    for (let ring = 3; ring >= 1; ring--) {
      const ringRadius = baseRadius + ring * 4 + Math.sin(this.frameCount * 0.1 + ring) * 2;
      const ringAlpha = (0.15 / ring) * pulse;
      g.lineStyle(1.5, COLORS.foodRing, ringAlpha);
      this.drawHexagon(g, foodX, foodY, ringRadius, rotation + ring * 0.3, true);
    }

    // Glow layers with extra outer bloom
    g.fillStyle(COLORS.foodGlow, 0.08 * pulse);
    g.fillCircle(foodX, foodY, baseRadius + 12);
    g.fillStyle(COLORS.foodGlow, 0.15 * pulse);
    g.fillCircle(foodX, foodY, baseRadius + 6);
    g.fillStyle(COLORS.foodGlow, 0.3 * pulse);
    g.fillCircle(foodX, foodY, baseRadius + 3);

    // Main hexagon food
    g.fillStyle(COLORS.food, 1);
    this.drawHexagon(g, foodX, foodY, baseRadius, rotation, false);

    // Inner highlight hexagon
    g.fillStyle(0xffffff, 0.3);
    this.drawHexagon(g, foodX - 1, foodY - 1, baseRadius * 0.4, rotation, false);

    // Center bright plasma core
    g.fillStyle(0xffffff, 0.8 * pulse);
    g.fillCircle(foodX, foodY, 3);
    g.fillStyle(COLORS.foodPlasma, 0.6);
    g.fillCircle(foodX, foodY, 2);
  }

  private drawHexagon(g: Phaser.GameObjects.Graphics, cx: number, cy: number, radius: number, rotation: number, strokeOnly: boolean): void {
    const points: { x: number; y: number }[] = [];
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + rotation;
      points.push({
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
      });
    }

    if (strokeOnly) {
      g.beginPath();
      g.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        g.lineTo(points[i].x, points[i].y);
      }
      g.closePath();
      g.strokePath();
    } else {
      g.fillPoints(points, true);
    }
  }

  private updateShockwave(): void {
    if (!this.shockwave) return;
    this.shockwave.radius += (this.shockwave.maxRadius / 25);
    this.shockwave.life--;
    if (this.shockwave.life <= 0) {
      this.shockwave = null;
    }
  }

  private drawShockwave(g: Phaser.GameObjects.Graphics): void {
    if (!this.shockwave) return;
    const sw = this.shockwave;
    const alpha = (sw.life / 40) * 0.6;

    // Multiple expanding rings
    for (let i = 0; i < 3; i++) {
      const ringRadius = sw.radius - i * 15;
      if (ringRadius > 0) {
        g.lineStyle(3 - i, COLORS.shockwave, alpha * (1 - i * 0.3));
        g.strokeCircle(sw.x, sw.y, ringRadius);
      }
    }
  }

  update(): void {
    this.frameCount++;

    // Update particles
    this.updateParticles();
    this.updateTrail();
    this.updateShockwave();
    this.updateLightnings();

    // Update screen shake
    if (this.screenShake > 0) {
      this.screenShake--;
    }

    // Animate every frame for smooth effects
    if (this.currentState || this.particles.length > 0 || this.shockwave || this.lightnings.length > 0) {
      this.needsRedraw = true;
    }

    if (!this.needsRedraw || !this.currentState) return;
    this.needsRedraw = false;

    const g = this.graphics;
    g.clear();

    const width = this.scale.width;
    const height = this.scale.height;

    // Apply screen shake offset
    let shakeX = 0;
    let shakeY = 0;
    if (this.screenShake > 0) {
      const intensity = this.screenShake * 0.5;
      shakeX = (Math.random() - 0.5) * intensity;
      shakeY = (Math.random() - 0.5) * intensity;
    }

    // Save and translate for screen shake
    g.save();
    g.translateCanvas(shakeX, shakeY);

    // Deep space background
    g.fillStyle(COLORS.bgDark, 1);
    g.fillRect(-10, -10, width + 20, height + 20);

    // Animated nebula clouds (behind everything)
    this.drawNebulas(g);

    // Animated starfield
    this.drawStars(g);

    // Subtle grid pattern
    g.lineStyle(1, COLORS.gridLine, 0.2);
    for (let i = 0; i <= GRID_SIZE; i++) {
      g.lineBetween(i * CELL_SIZE, 0, i * CELL_SIZE, height);
      g.lineBetween(0, i * CELL_SIZE, width, i * CELL_SIZE);
    }

    // Draw aurora trail behind snake
    if (!this.currentState.gameOver) {
      this.drawTrail(g);
    }

    // Game over red tint overlay
    if (this.currentState.gameOver) {
      g.fillStyle(COLORS.gameOverTint, 0.25);
      g.fillRect(0, 0, width, height);
    }

    // Draw hexagonal food with rotating energy rings
    const food = this.currentState.food;
    const foodX = food.x * CELL_SIZE + CELL_SIZE / 2;
    const foodY = food.y * CELL_SIZE + CELL_SIZE / 2;
    const baseRadius = (CELL_SIZE - 2) / 2;

    this.drawHexagonFood(g, foodX, foodY, baseRadius);

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

      // Draw enhanced glow for head
      if (isHead && !this.currentState.gameOver) {
        const glowPulse = Math.sin(this.frameCount * 0.1) * 0.15 + 0.85;
        g.fillStyle(COLORS.snakeGlow, 0.15 * glowPulse);
        g.fillCircle(centerX, centerY, CELL_SIZE / 2 + 8);
        g.fillStyle(COLORS.snakeGlow, 0.3 * glowPulse);
        g.fillCircle(centerX, centerY, CELL_SIZE / 2 + 4);
      }

      // Draw segment with rounded corners
      if (isHead) {
        // Chromatic aberration effect - offset colored layers
        if (!this.currentState.gameOver) {
          const aberrationOffset = 1.5;
          // Red channel offset
          g.fillStyle(0xff0066, 0.15);
          g.fillRoundedRect(x + 1 - aberrationOffset, y + 1, CELL_SIZE - 2, CELL_SIZE - 2, 6);
          // Blue channel offset
          g.fillStyle(0x0066ff, 0.15);
          g.fillRoundedRect(x + 1 + aberrationOffset, y + 1, CELL_SIZE - 2, CELL_SIZE - 2, 6);
        }

        // Head is a rounded square with eyes
        g.fillStyle(color, 1);
        g.fillRoundedRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2, 6);

        // Eyes with subtle animation - position based on movement direction
        const eyeBlink = Math.sin(this.frameCount * 0.02) > 0.95 ? 0.3 : 1;
        const eyeSize = 3;
        const eyeSpacing = 4;
        // Calculate eye position based on movement direction
        const eyeDirX = this.lastDirection.x * 2;
        const eyeDirY = this.lastDirection.y * 2;
        const eyeCenterX = centerX + eyeDirX;
        const eyeCenterY = centerY + eyeDirY;

        g.fillStyle(0xffffff, eyeBlink);
        g.fillCircle(eyeCenterX - eyeSpacing, eyeCenterY, eyeSize);
        g.fillCircle(eyeCenterX + eyeSpacing, eyeCenterY, eyeSize);
        g.fillStyle(0x000000, eyeBlink);
        // Pupils look in movement direction
        const pupilOffset = 0.8;
        g.fillCircle(eyeCenterX - eyeSpacing + this.lastDirection.x * pupilOffset, eyeCenterY + this.lastDirection.y * pupilOffset, eyeSize / 2);
        g.fillCircle(eyeCenterX + eyeSpacing + this.lastDirection.x * pupilOffset, eyeCenterY + this.lastDirection.y * pupilOffset, eyeSize / 2);
      } else {
        // Body segments with decreasing size toward tail and subtle glow
        const sizeFactor = 1 - progress * 0.2;
        const size = (CELL_SIZE - 2) * sizeFactor;
        const offset = (CELL_SIZE - size) / 2;

        // Subtle body glow
        if (i < 3 && !this.currentState.gameOver) {
          g.fillStyle(COLORS.snakeGlow, 0.1 * (1 - progress));
          g.fillCircle(centerX, centerY, size / 2 + 2);
        }

        g.fillStyle(color, 1);
        g.fillRoundedRect(x + offset, y + offset, size, size, 4);
      }
    }

    // Draw lightning effects between snake segments
    this.drawLightnings(g);

    // Draw speed lines behind the head
    this.drawSpeedLines(g);

    // Draw shockwave effect on game over
    this.drawShockwave(g);

    // Draw particles on top
    this.drawParticles(g);

    // Restore from screen shake transform
    g.restore();
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
