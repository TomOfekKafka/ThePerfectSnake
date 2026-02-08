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

interface ShockWave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  life: number;
  color: number;
}

interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  length: number;
  brightness: number;
  life: number;
}

interface WarpLine {
  x: number;
  y: number;
  angle: number;
  speed: number;
  length: number;
  color: number;
  alpha: number;
  life: number;
}

interface EnergyRing {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: number;
  life: number;
  thickness: number;
}

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  brightness: number;
}

interface EnergyOrb {
  angle: number;
  distance: number;
  speed: number;
  size: number;
  color: number;
}

interface PlasmaWave {
  y: number;
  speed: number;
  amplitude: number;
  frequency: number;
  color: number;
  alpha: number;
}

const CELL_SIZE = 20;
const GRID_SIZE = 20;

// Color palette - electric neon theme
const COLORS = {
  bgDark: 0x030308,
  bgMid: 0x080815,
  bgGrid: 0x12122a,
  snakeHead: 0x00ffcc,
  snakeHeadGlow: 0x00ffff,
  snakeHeadCore: 0xaaffff,
  snakeBody: 0x00ff88,
  snakeTail: 0x00aa44,
  snakeConnector: 0x00dd66,
  food: 0xff0066,
  foodGlow: 0xff3388,
  foodCore: 0xffffff,
  foodOrbit: 0xff88aa,
  gameOverOverlay: 0x000000,
  gameOverRed: 0xff0033,
  // Rainbow colors for shimmer effect
  rainbow: [0xff0000, 0xff8800, 0xffff00, 0x00ff00, 0x0088ff, 0x8800ff, 0xff00ff],
  // Trail colors
  trailGlow: 0x00ffaa,
  // Electric colors
  electric: [0x00ffff, 0x00ccff, 0x0099ff, 0x00ffcc],
  // Plasma wave colors
  plasma: [0x440066, 0x660044, 0x330066, 0x220044],
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
  private energyOrbs: EnergyOrb[] = [];
  private plasmaWaves: PlasmaWave[] = [];
  private shockWaves: ShockWave[] = [];
  private shootingStars: ShootingStar[] = [];
  private warpLines: WarpLine[] = [];
  private energyRings: EnergyRing[] = [];

  // Previous state for detecting food eaten
  private prevFoodPos: Position | null = null;
  private prevSnakeLength = 0;
  private prevHeadPos: Position | null = null;

  // Screen shake for game over
  private shakeIntensity = 0;
  private shakeDecay = 0.9;

  // Direction tracking for warp effect
  private moveDirection: { dx: number; dy: number } = { dx: 1, dy: 0 };

  constructor() {
    super({ key: 'SnakeScene' });
  }

  create(): void {
    this.graphics = this.add.graphics();
    this.initStars();
    this.initEnergyOrbs();
    this.initPlasmaWaves();

    if (this.currentState) {
      this.needsRedraw = true;
    }
  }

  private initStars(): void {
    const width = GRID_SIZE * CELL_SIZE;
    const height = GRID_SIZE * CELL_SIZE;

    // Create starfield with more density variation
    for (let i = 0; i < 80; i++) {
      this.stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2 + 0.3,
        speed: Math.random() * 0.4 + 0.1,
        brightness: Math.random(),
      });
    }
  }

  private initEnergyOrbs(): void {
    // Orbiting energy particles around food
    for (let i = 0; i < 4; i++) {
      this.energyOrbs.push({
        angle: (i / 4) * Math.PI * 2,
        distance: 12 + Math.random() * 4,
        speed: 0.08 + Math.random() * 0.04,
        size: 2 + Math.random(),
        color: COLORS.rainbow[i % COLORS.rainbow.length],
      });
    }
  }

  private initPlasmaWaves(): void {
    // Background plasma waves
    for (let i = 0; i < 3; i++) {
      this.plasmaWaves.push({
        y: (i + 1) * (GRID_SIZE * CELL_SIZE) / 4,
        speed: 0.3 + Math.random() * 0.2,
        amplitude: 20 + Math.random() * 15,
        frequency: 0.02 + Math.random() * 0.01,
        color: COLORS.plasma[i % COLORS.plasma.length],
        alpha: 0.15 + Math.random() * 0.1,
      });
    }
  }

  updateGameState(state: GameState): void {
    // Detect if food was eaten (snake grew)
    if (this.currentState && state.snake.length > this.prevSnakeLength) {
      this.spawnFoodExplosion(this.prevFoodPos || state.food);
      this.spawnEnergyRings(this.prevFoodPos || state.food);
    }

    // Trigger screen shake on game over
    if (state.gameOver && this.currentState && !this.currentState.gameOver) {
      this.shakeIntensity = 8;
    }

    // Track movement direction for warp effect
    if (state.snake.length > 0 && this.prevHeadPos) {
      const head = state.snake[0];
      const dx = head.x - this.prevHeadPos.x;
      const dy = head.y - this.prevHeadPos.y;
      if (dx !== 0 || dy !== 0) {
        this.moveDirection = { dx, dy };
        // Spawn warp lines when moving
        if (!state.gameOver) {
          this.spawnWarpLines(head);
        }
      }
    }

    this.prevFoodPos = state.food;
    this.prevSnakeLength = state.snake.length;
    this.prevHeadPos = state.snake.length > 0 ? { ...state.snake[0] } : null;
    this.currentState = state;
    this.needsRedraw = true;
  }

  private spawnFoodExplosion(pos: Position): void {
    const centerX = pos.x * CELL_SIZE + CELL_SIZE / 2;
    const centerY = pos.y * CELL_SIZE + CELL_SIZE / 2;

    // Spawn burst of particles - more particles for dramatic effect
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2 + Math.random() * 0.5;
      const speed = 2.5 + Math.random() * 4;
      this.foodParticles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 35,
        maxLife: 35,
        color: COLORS.rainbow[i % COLORS.rainbow.length],
        size: 3 + Math.random() * 3,
      });
    }

    // Spawn shockwave effect
    this.shockWaves.push({
      x: centerX,
      y: centerY,
      radius: 5,
      maxRadius: 70,
      life: 25,
      color: COLORS.food,
    });
  }

  private spawnEnergyRings(pos: Position): void {
    const centerX = pos.x * CELL_SIZE + CELL_SIZE / 2;
    const centerY = pos.y * CELL_SIZE + CELL_SIZE / 2;

    // Spawn multiple expanding energy rings
    for (let i = 0; i < 3; i++) {
      this.energyRings.push({
        x: centerX,
        y: centerY,
        radius: 5 + i * 8,
        maxRadius: 80 + i * 20,
        color: COLORS.rainbow[i * 2],
        life: 30 - i * 5,
        thickness: 3 - i * 0.5,
      });
    }
  }

  private spawnWarpLines(head: Position): void {
    if (this.warpLines.length > 30) return; // Limit warp lines

    const centerX = head.x * CELL_SIZE + CELL_SIZE / 2;
    const centerY = head.y * CELL_SIZE + CELL_SIZE / 2;

    // Calculate base angle from movement direction (opposite to movement = trailing behind)
    const baseAngle = Math.atan2(-this.moveDirection.dy, -this.moveDirection.dx);

    // Spawn warp lines behind the snake head
    for (let i = 0; i < 3; i++) {
      const spreadAngle = (Math.random() - 0.5) * 0.8; // Spread angle
      const angle = baseAngle + spreadAngle;
      const distance = 10 + Math.random() * 15;

      this.warpLines.push({
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
        angle: angle,
        speed: 4 + Math.random() * 3,
        length: 15 + Math.random() * 20,
        color: COLORS.electric[Math.floor(Math.random() * COLORS.electric.length)],
        alpha: 0.6 + Math.random() * 0.4,
        life: 15 + Math.random() * 10,
      });
    }
  }

  private spawnShootingStar(): void {
    if (this.shootingStars.length >= 3) return;

    const width = GRID_SIZE * CELL_SIZE;
    const height = GRID_SIZE * CELL_SIZE;

    // Start from edges
    const side = Math.floor(Math.random() * 2);
    let x: number, y: number, vx: number, vy: number;

    if (side === 0) {
      // From top
      x = Math.random() * width;
      y = -10;
      vx = (Math.random() - 0.5) * 3;
      vy = 4 + Math.random() * 3;
    } else {
      // From left
      x = -10;
      y = Math.random() * height * 0.5;
      vx = 4 + Math.random() * 3;
      vy = 2 + Math.random() * 2;
    }

    this.shootingStars.push({
      x, y, vx, vy,
      length: 15 + Math.random() * 15,
      brightness: 0.7 + Math.random() * 0.3,
      life: 60,
    });
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

    // Update energy orbs (orbit around food)
    for (const orb of this.energyOrbs) {
      orb.angle += orb.speed;
    }

    // Update screen shake
    if (this.shakeIntensity > 0.1) {
      this.shakeIntensity *= this.shakeDecay;
    } else {
      this.shakeIntensity = 0;
    }

    // Update shockwaves
    for (let i = this.shockWaves.length - 1; i >= 0; i--) {
      const sw = this.shockWaves[i];
      sw.radius += (sw.maxRadius - sw.radius) * 0.15;
      sw.life--;
      if (sw.life <= 0) {
        this.shockWaves.splice(i, 1);
      }
    }

    // Update shooting stars
    for (let i = this.shootingStars.length - 1; i >= 0; i--) {
      const ss = this.shootingStars[i];
      ss.x += ss.vx;
      ss.y += ss.vy;
      ss.life--;
      if (ss.life <= 0 || ss.x > GRID_SIZE * CELL_SIZE + 50 || ss.y > GRID_SIZE * CELL_SIZE + 50) {
        this.shootingStars.splice(i, 1);
      }
    }

    // Randomly spawn shooting stars
    if (Math.random() < 0.02) {
      this.spawnShootingStar();
    }

    // Update warp lines
    for (let i = this.warpLines.length - 1; i >= 0; i--) {
      const wl = this.warpLines[i];
      wl.x += Math.cos(wl.angle) * wl.speed;
      wl.y += Math.sin(wl.angle) * wl.speed;
      wl.life--;
      wl.alpha *= 0.92;
      if (wl.life <= 0 || wl.alpha < 0.05) {
        this.warpLines.splice(i, 1);
      }
    }

    // Update energy rings
    for (let i = this.energyRings.length - 1; i >= 0; i--) {
      const er = this.energyRings[i];
      er.radius += (er.maxRadius - er.radius) * 0.12;
      er.life--;
      if (er.life <= 0) {
        this.energyRings.splice(i, 1);
      }
    }
  }

  update(): void {
    this.frameCount++;
    this.updateParticles();

    // Redraw every frame for animations
    if (!this.currentState) return;

    const shouldAnimate = !this.currentState.gameOver || this.shakeIntensity > 0;
    if (!this.needsRedraw && !shouldAnimate && this.foodParticles.length === 0) return;
    this.needsRedraw = false;

    const g = this.graphics;
    g.clear();

    const width = this.scale.width;
    const height = this.scale.height;

    // Apply screen shake offset
    const shakeX = this.shakeIntensity > 0 ? (Math.random() - 0.5) * this.shakeIntensity * 2 : 0;
    const shakeY = this.shakeIntensity > 0 ? (Math.random() - 0.5) * this.shakeIntensity * 2 : 0;

    // Deep space background with gradient effect
    g.fillStyle(COLORS.bgDark, 1);
    g.fillRect(0, 0, width, height);

    // Subtle radial gradient overlay (center lighter)
    g.fillStyle(COLORS.bgMid, 0.3);
    g.fillCircle(width / 2, height / 2, width * 0.6);

    // Draw plasma waves in background
    this.drawPlasmaWaves(g, width, shakeX, shakeY);

    // Draw twinkling stars
    this.drawStars(g, shakeX, shakeY);

    // Subtle grid pattern with glow
    this.drawGrid(g, width, height, shakeX, shakeY);

    // Draw warp lines (behind everything else game-related)
    this.drawWarpLines(g, shakeX, shakeY);

    // Draw trail particles (behind snake)
    this.drawTrailParticles(g, shakeX, shakeY);

    // Draw food with enhanced pulsing glow effect
    this.drawFood(g, shakeX, shakeY);

    // Draw food explosion particles and energy rings
    this.drawFoodParticles(g, shakeX, shakeY);
    this.drawEnergyRings(g, shakeX, shakeY);

    // Draw snake with rainbow shimmer and electric effects
    this.drawSnake(g, shakeX, shakeY);

    // Neon border glow (only when game is active)
    if (!this.currentState.gameOver) {
      this.drawNeonBorder(g, width, height);
    }

    // Game over overlay
    if (this.currentState.gameOver) {
      this.drawGameOverEffect(g, width, height);
    }
  }

  private drawPlasmaWaves(g: Phaser.GameObjects.Graphics, width: number, shakeX: number, shakeY: number): void {
    for (const wave of this.plasmaWaves) {
      g.lineStyle(8, wave.color, wave.alpha);
      g.beginPath();

      for (let x = 0; x <= width; x += 4) {
        const y = wave.y + Math.sin((x * wave.frequency) + this.frameCount * wave.speed * 0.1) * wave.amplitude;
        if (x === 0) {
          g.moveTo(x + shakeX, y + shakeY);
        } else {
          g.lineTo(x + shakeX, y + shakeY);
        }
      }
      g.strokePath();
    }
  }

  private drawStars(g: Phaser.GameObjects.Graphics, shakeX: number, shakeY: number): void {
    for (const star of this.stars) {
      const alpha = star.brightness * 0.8;
      const x = star.x + shakeX;
      const y = star.y + shakeY;

      g.fillStyle(0xffffff, alpha);
      g.fillCircle(x, y, star.size);

      // Some stars have a subtle colored halo
      if (star.size > 1.2) {
        const haloColor = COLORS.rainbow[Math.floor(star.x) % COLORS.rainbow.length];
        g.fillStyle(haloColor, alpha * 0.3);
        g.fillCircle(x, y, star.size + 2);
      }
    }

    // Draw shooting stars
    for (const ss of this.shootingStars) {
      const alpha = (ss.life / 60) * ss.brightness;
      const tailX = ss.x - ss.vx * (ss.length / 5);
      const tailY = ss.y - ss.vy * (ss.length / 5);

      // Glowing trail
      g.lineStyle(3, 0xffffff, alpha * 0.3);
      g.lineBetween(ss.x + shakeX, ss.y + shakeY, tailX + shakeX, tailY + shakeY);

      g.lineStyle(2, 0xffffff, alpha * 0.6);
      g.lineBetween(ss.x + shakeX, ss.y + shakeY, tailX + shakeX, tailY + shakeY);

      // Bright head
      g.fillStyle(0xffffff, alpha);
      g.fillCircle(ss.x + shakeX, ss.y + shakeY, 2);

      // Color tint
      g.fillStyle(0x88ccff, alpha * 0.5);
      g.fillCircle(ss.x + shakeX, ss.y + shakeY, 3);
    }
  }

  private drawGrid(g: Phaser.GameObjects.Graphics, width: number, height: number, shakeX: number, shakeY: number): void {
    // Draw grid with subtle glow at intersections
    g.lineStyle(1, COLORS.bgGrid, 0.25);
    for (let i = 0; i <= GRID_SIZE; i++) {
      g.lineBetween(i * CELL_SIZE + shakeX, shakeY, i * CELL_SIZE + shakeX, height + shakeY);
      g.lineBetween(shakeX, i * CELL_SIZE + shakeY, width + shakeX, i * CELL_SIZE + shakeY);
    }

    // Animated glow at corners with pulsing
    const pulse = Math.sin(this.frameCount * 0.05) * 0.03 + 0.07;
    for (let x = 0; x <= GRID_SIZE; x += 5) {
      for (let y = 0; y <= GRID_SIZE; y += 5) {
        g.fillStyle(0x00ffff, pulse);
        g.fillCircle(x * CELL_SIZE + shakeX, y * CELL_SIZE + shakeY, 4);
      }
    }
  }

  private drawTrailParticles(g: Phaser.GameObjects.Graphics, shakeX: number, shakeY: number): void {
    for (const p of this.trailParticles) {
      const alpha = (p.life / p.maxLife) * 0.7;
      const size = p.size * (p.life / p.maxLife);

      // Outer glow
      g.fillStyle(p.color, alpha * 0.3);
      g.fillCircle(p.x + shakeX, p.y + shakeY, size + 2);

      // Core
      g.fillStyle(p.color, alpha);
      g.fillCircle(p.x + shakeX, p.y + shakeY, size);
    }
  }

  private drawFoodParticles(g: Phaser.GameObjects.Graphics, shakeX: number, shakeY: number): void {
    for (const p of this.foodParticles) {
      const alpha = p.life / p.maxLife;
      const size = p.size * alpha;
      const x = p.x + shakeX;
      const y = p.y + shakeY;

      // Outer glow
      g.fillStyle(p.color, alpha * 0.3);
      g.fillCircle(x, y, size + 3);

      // Core
      g.fillStyle(p.color, alpha);
      g.fillCircle(x, y, size);

      // Bright center
      g.fillStyle(0xffffff, alpha * 0.9);
      g.fillCircle(x, y, size * 0.3);
    }

    // Draw shockwaves
    for (const sw of this.shockWaves) {
      const alpha = (sw.life / 25) * 0.6;
      const x = sw.x + shakeX;
      const y = sw.y + shakeY;

      // Multiple expanding rings
      g.lineStyle(3, sw.color, alpha * 0.4);
      g.strokeCircle(x, y, sw.radius);

      g.lineStyle(2, 0xffffff, alpha * 0.6);
      g.strokeCircle(x, y, sw.radius * 0.7);

      g.lineStyle(1, sw.color, alpha * 0.8);
      g.strokeCircle(x, y, sw.radius * 0.4);
    }
  }

  private drawWarpLines(g: Phaser.GameObjects.Graphics, shakeX: number, shakeY: number): void {
    for (const wl of this.warpLines) {
      const alpha = wl.alpha;
      const startX = wl.x + shakeX;
      const startY = wl.y + shakeY;
      const endX = startX + Math.cos(wl.angle) * wl.length;
      const endY = startY + Math.sin(wl.angle) * wl.length;

      // Outer glow
      g.lineStyle(4, wl.color, alpha * 0.2);
      g.lineBetween(startX, startY, endX, endY);

      // Core line
      g.lineStyle(2, wl.color, alpha * 0.6);
      g.lineBetween(startX, startY, endX, endY);

      // Bright center
      g.lineStyle(1, 0xffffff, alpha * 0.8);
      g.lineBetween(startX, startY, endX, endY);

      // Head glow
      g.fillStyle(0xffffff, alpha * 0.9);
      g.fillCircle(startX, startY, 2);
    }
  }

  private drawEnergyRings(g: Phaser.GameObjects.Graphics, shakeX: number, shakeY: number): void {
    for (const er of this.energyRings) {
      const alpha = (er.life / 30) * 0.7;
      const x = er.x + shakeX;
      const y = er.y + shakeY;

      // Outer glow
      g.lineStyle(er.thickness + 2, er.color, alpha * 0.2);
      g.strokeCircle(x, y, er.radius + 2);

      // Main ring
      g.lineStyle(er.thickness, er.color, alpha * 0.5);
      g.strokeCircle(x, y, er.radius);

      // Inner bright edge
      g.lineStyle(1, 0xffffff, alpha * 0.7);
      g.strokeCircle(x, y, er.radius - 1);
    }
  }

  private drawFood(g: Phaser.GameObjects.Graphics, shakeX: number, shakeY: number): void {
    if (!this.currentState) return;

    const food = this.currentState.food;
    const centerX = food.x * CELL_SIZE + CELL_SIZE / 2 + shakeX;
    const centerY = food.y * CELL_SIZE + CELL_SIZE / 2 + shakeY;

    // Multi-layer pulsing animation
    const pulse1 = Math.sin(this.frameCount * 0.12) * 0.3 + 0.7;
    const pulse2 = Math.sin(this.frameCount * 0.08 + 1) * 0.2 + 0.8;
    const pulse3 = Math.sin(this.frameCount * 0.2) * 0.15 + 0.85;

    // Outer corona glow (larger, more dramatic)
    g.fillStyle(COLORS.food, 0.08 * pulse2);
    g.fillCircle(centerX, centerY, 24 * pulse2);

    g.fillStyle(COLORS.food, 0.12 * pulse2);
    g.fillCircle(centerX, centerY, 18 * pulse2);

    // Draw orbiting energy orbs
    for (const orb of this.energyOrbs) {
      const orbX = centerX + Math.cos(orb.angle) * orb.distance;
      const orbY = centerY + Math.sin(orb.angle) * orb.distance;

      // Orb glow
      g.fillStyle(orb.color, 0.4);
      g.fillCircle(orbX, orbY, orb.size + 2);

      // Orb core
      g.fillStyle(orb.color, 0.9);
      g.fillCircle(orbX, orbY, orb.size);

      // Orb shine
      g.fillStyle(0xffffff, 0.6);
      g.fillCircle(orbX - orb.size * 0.3, orbY - orb.size * 0.3, orb.size * 0.4);
    }

    // Rainbow ring effect (rotating)
    const ringRadius = 14 * pulse1;
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 + this.frameCount * 0.05;
      const rx = centerX + Math.cos(angle) * ringRadius * 0.5;
      const ry = centerY + Math.sin(angle) * ringRadius * 0.5;
      g.fillStyle(COLORS.rainbow[i], 0.35 * pulse1);
      g.fillCircle(rx, ry, 3);
    }

    // Main glow layers
    g.fillStyle(COLORS.food, 0.18 * pulse1);
    g.fillCircle(centerX, centerY, 14 * pulse1);

    g.fillStyle(COLORS.foodGlow, 0.45 * pulse1);
    g.fillCircle(centerX, centerY, 10 * pulse1);

    // Core with gradient effect
    g.fillStyle(COLORS.food, 1);
    g.fillCircle(centerX, centerY, 6);

    // Inner bright spot
    g.fillStyle(COLORS.foodCore, 0.95 * pulse3);
    g.fillCircle(centerX, centerY, 3.5);

    // Sparkle highlights (two for more shimmer)
    const sparkleOffset = Math.sin(this.frameCount * 0.1) * 2;
    g.fillStyle(0xffffff, 0.8);
    g.fillCircle(centerX - 2 + sparkleOffset, centerY - 2, 1.5);

    const sparkleOffset2 = Math.cos(this.frameCount * 0.15) * 1.5;
    g.fillStyle(0xffffff, 0.5);
    g.fillCircle(centerX + 1 + sparkleOffset2, centerY + 1, 1);
  }

  private drawSnake(g: Phaser.GameObjects.Graphics, shakeX: number, shakeY: number): void {
    if (!this.currentState) return;

    const snake = this.currentState.snake;
    const segmentCount = snake.length;

    // Spawn trail particles from tail
    if (segmentCount > 0 && !this.currentState.gameOver) {
      const tail = snake[snake.length - 1];
      const tailX = tail.x * CELL_SIZE + CELL_SIZE / 2;
      const tailY = tail.y * CELL_SIZE + CELL_SIZE / 2;
      if (this.frameCount % 2 === 0) {
        this.spawnTrailParticle(tailX, tailY, COLORS.trailGlow);
      }
    }

    // First pass: Draw segment connectors (smooth body connections)
    if (segmentCount > 1) {
      for (let i = 0; i < segmentCount - 1; i++) {
        const current = snake[i];
        const next = snake[i + 1];
        const progress = segmentCount > 1 ? i / (segmentCount - 1) : 0;

        const cx = current.x * CELL_SIZE + CELL_SIZE / 2 + shakeX;
        const cy = current.y * CELL_SIZE + CELL_SIZE / 2 + shakeY;
        const nx = next.x * CELL_SIZE + CELL_SIZE / 2 + shakeX;
        const ny = next.y * CELL_SIZE + CELL_SIZE / 2 + shakeY;

        const connectorColor = this.lerpColor(COLORS.snakeBody, COLORS.snakeTail, progress);
        const connectorSize = CELL_SIZE - 4 - progress * 3;

        // Draw connecting line between segments
        g.fillStyle(connectorColor, 0.9);
        g.lineStyle(connectorSize * 0.7, connectorColor, 0.9);
        g.lineBetween(cx, cy, nx, ny);

        // Lightning arc effect between segments (only near head, every few frames)
        if (i < 3 && !this.currentState.gameOver && (this.frameCount + i * 7) % 4 === 0) {
          this.drawLightningArc(g, cx, cy, nx, ny, 0.3);
        }
      }
    }

    // Second pass: Draw body segments from tail to head (so head renders on top)
    for (let i = segmentCount - 1; i >= 0; i--) {
      const segment = snake[i];
      const x = segment.x * CELL_SIZE + shakeX;
      const y = segment.y * CELL_SIZE + shakeY;
      const centerX = x + CELL_SIZE / 2;
      const centerY = y + CELL_SIZE / 2;

      const isHead = i === 0;
      const progress = segmentCount > 1 ? i / (segmentCount - 1) : 0;

      if (isHead) {
        // Head with enhanced electric glow effect
        const headPulse = Math.sin(this.frameCount * 0.1) * 0.2 + 0.8;
        const electricPulse = Math.sin(this.frameCount * 0.25) * 0.5 + 0.5;

        // Electric aura (outermost)
        if (!this.currentState.gameOver) {
          const electricColor = COLORS.electric[Math.floor(this.frameCount * 0.2) % COLORS.electric.length];
          g.fillStyle(electricColor, 0.1 * electricPulse);
          g.fillCircle(centerX, centerY, 22);
        }

        // Outer glow layers
        g.fillStyle(COLORS.snakeHeadGlow, 0.12 * headPulse);
        g.fillCircle(centerX, centerY, 18);

        g.fillStyle(COLORS.snakeHeadGlow, 0.25 * headPulse);
        g.fillCircle(centerX, centerY, 14);

        g.fillStyle(COLORS.snakeHeadGlow, 0.4 * headPulse);
        g.fillCircle(centerX, centerY, 11);

        // Main head
        g.fillStyle(COLORS.snakeHead, 1);
        g.fillRoundedRect(x + 1, y + 1, CELL_SIZE - 2, CELL_SIZE - 2, 6);

        // Inner bright core
        g.fillStyle(COLORS.snakeHeadCore, 0.3);
        g.fillRoundedRect(x + 4, y + 4, CELL_SIZE - 8, CELL_SIZE - 8, 3);

        // Shiny highlight
        g.fillStyle(0xffffff, 0.4);
        g.fillRoundedRect(x + 3, y + 3, 8, 5, 3);

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

        // Outer glow for body segments
        g.fillStyle(baseColor, 0.25);
        g.fillCircle(centerX, centerY, size / 2 + 3);

        // Main body segment
        g.fillStyle(baseColor, 1);
        g.fillRoundedRect(x + offset, y + offset, size, size, 5);

        // Rainbow shimmer overlay (more vibrant)
        g.fillStyle(shimmerColor, 0.2);
        g.fillRoundedRect(x + offset, y + offset, size, size, 5);

        // Subtle highlight on each segment
        g.fillStyle(0xffffff, 0.2);
        g.fillRoundedRect(x + offset + 2, y + offset + 1, size / 2 - 2, size / 3, 2);
      }
    }
  }

  private drawEyes(g: Phaser.GameObjects.Graphics, cx: number, cy: number): void {
    const eyeSize = 3.5;

    // Position eyes based on movement direction
    const dx = this.moveDirection.dx;
    const dy = this.moveDirection.dy;

    // Calculate eye positions based on direction
    let eye1X: number, eye1Y: number, eye2X: number, eye2Y: number;
    let pupilOffsetX: number, pupilOffsetY: number;

    if (dx !== 0) {
      // Moving horizontally
      const forward = dx > 0 ? 3 : -3;
      eye1X = cx + forward;
      eye1Y = cy - 4;
      eye2X = cx + forward;
      eye2Y = cy + 4;
      pupilOffsetX = dx * 1.2;
      pupilOffsetY = 0;
    } else {
      // Moving vertically
      const forward = dy > 0 ? 3 : -3;
      eye1X = cx - 4;
      eye1Y = cy + forward;
      eye2X = cx + 4;
      eye2Y = cy + forward;
      pupilOffsetX = 0;
      pupilOffsetY = dy * 1.2;
    }

    // Eye glow
    g.fillStyle(0x00ffff, 0.3);
    g.fillCircle(eye1X, eye1Y, eyeSize + 1);
    g.fillCircle(eye2X, eye2Y, eyeSize + 1);

    // Eye whites
    g.fillStyle(0xffffff, 1);
    g.fillCircle(eye1X, eye1Y, eyeSize);
    g.fillCircle(eye2X, eye2Y, eyeSize);

    // Pupils looking in movement direction
    g.fillStyle(0x000000, 1);
    g.fillCircle(eye1X + pupilOffsetX, eye1Y + pupilOffsetY, 1.8);
    g.fillCircle(eye2X + pupilOffsetX, eye2Y + pupilOffsetY, 1.8);

    // Eye shine
    g.fillStyle(0xffffff, 0.8);
    g.fillCircle(eye1X - 1, eye1Y - 1, 1);
    g.fillCircle(eye2X - 1, eye2Y - 1, 1);

    // Direction indicator - chevron in front of head
    if (!this.currentState?.gameOver) {
      const chevronDist = 14;
      const chevronX = cx + dx * chevronDist;
      const chevronY = cy + dy * chevronDist;
      const pulse = Math.sin(this.frameCount * 0.15) * 0.3 + 0.7;

      g.fillStyle(0x00ffcc, 0.4 * pulse);
      g.beginPath();

      if (dx > 0) {
        // Right
        g.moveTo(chevronX, chevronY - 6);
        g.lineTo(chevronX + 5, chevronY);
        g.lineTo(chevronX, chevronY + 6);
      } else if (dx < 0) {
        // Left
        g.moveTo(chevronX, chevronY - 6);
        g.lineTo(chevronX - 5, chevronY);
        g.lineTo(chevronX, chevronY + 6);
      } else if (dy > 0) {
        // Down
        g.moveTo(chevronX - 6, chevronY);
        g.lineTo(chevronX, chevronY + 5);
        g.lineTo(chevronX + 6, chevronY);
      } else {
        // Up
        g.moveTo(chevronX - 6, chevronY);
        g.lineTo(chevronX, chevronY - 5);
        g.lineTo(chevronX + 6, chevronY);
      }

      g.closePath();
      g.fillPath();
    }
  }

  private drawGameOverEffect(g: Phaser.GameObjects.Graphics, width: number, height: number): void {
    // Animated dark overlay with pulse
    const pulse = Math.sin(this.frameCount * 0.08) * 0.1 + 0.65;
    g.fillStyle(COLORS.gameOverOverlay, pulse);
    g.fillRect(0, 0, width, height);

    // Red radial gradient from center
    const centerPulse = Math.sin(this.frameCount * 0.12) * 0.05 + 0.15;
    g.fillStyle(COLORS.gameOverRed, centerPulse);
    g.fillCircle(width / 2, height / 2, width * 0.4);

    // Red vignette effect with animation (more layers)
    for (let i = 0; i < 12; i++) {
      const intensity = (12 - i) / 12;
      const offset = i * 4;
      const lineWidth = 3 + (12 - i) * 0.3;
      g.lineStyle(lineWidth, COLORS.gameOverRed, 0.1 * intensity);
      g.strokeRect(offset, offset, width - offset * 2, height - offset * 2);
    }

    // Animated corner glows (larger, more intense)
    const cornerGlow = Math.sin(this.frameCount * 0.15) * 0.15 + 0.25;
    g.fillStyle(COLORS.gameOverRed, cornerGlow);
    g.fillCircle(0, 0, 60);
    g.fillCircle(width, 0, 60);
    g.fillCircle(0, height, 60);
    g.fillCircle(width, height, 60);

    // Edge glow effect
    const edgeGlow = Math.sin(this.frameCount * 0.1 + 1) * 0.08 + 0.12;
    g.fillStyle(COLORS.gameOverRed, edgeGlow);
    g.fillCircle(width / 2, 0, 50);
    g.fillCircle(width / 2, height, 50);
    g.fillCircle(0, height / 2, 50);
    g.fillCircle(width, height / 2, 50);
  }

  private drawLightningArc(g: Phaser.GameObjects.Graphics, x1: number, y1: number, x2: number, y2: number, alpha: number): void {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const segments = 3;

    g.lineStyle(1, 0x00ffff, alpha);
    g.beginPath();
    g.moveTo(x1, y1);

    for (let i = 1; i < segments; i++) {
      const t = i / segments;
      const midX = x1 + dx * t + (Math.random() - 0.5) * 8;
      const midY = y1 + dy * t + (Math.random() - 0.5) * 8;
      g.lineTo(midX, midY);
    }
    g.lineTo(x2, y2);
    g.strokePath();
  }

  private drawNeonBorder(g: Phaser.GameObjects.Graphics, width: number, height: number): void {
    const pulse = Math.sin(this.frameCount * 0.08) * 0.3 + 0.7;
    const colors = [0x00ffcc, 0x00ff88, 0x00ccff];
    const colorIndex = Math.floor(this.frameCount * 0.02) % colors.length;
    const borderColor = colors[colorIndex];

    // Outer glow
    g.lineStyle(6, borderColor, 0.08 * pulse);
    g.strokeRect(2, 2, width - 4, height - 4);

    g.lineStyle(4, borderColor, 0.15 * pulse);
    g.strokeRect(3, 3, width - 6, height - 6);

    g.lineStyle(2, borderColor, 0.3 * pulse);
    g.strokeRect(4, 4, width - 8, height - 8);

    // Corner accent glows
    const cornerSize = 15;
    g.fillStyle(borderColor, 0.2 * pulse);
    g.fillCircle(cornerSize, cornerSize, 8);
    g.fillCircle(width - cornerSize, cornerSize, 8);
    g.fillCircle(cornerSize, height - cornerSize, 8);
    g.fillCircle(width - cornerSize, height - cornerSize, 8);
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
