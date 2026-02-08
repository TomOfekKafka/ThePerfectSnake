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

interface FloatingText {
  x: number;
  y: number;
  text: string;
  life: number;
  maxLife: number;
  color: number;
  vy: number;
  scale: number;
}

interface PulseWave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  life: number;
  color: number;
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

interface NebulaNode {
  x: number;
  y: number;
  radius: number;
  color: number;
  phase: number;
  speed: number;
}

interface AuroraWave {
  y: number;
  amplitude: number;
  frequency: number;
  speed: number;
  phase: number;
  colors: number[];
  thickness: number;
}

interface LightningBolt {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  segments: Array<{ x: number; y: number }>;
  life: number;
  maxLife: number;
  color: number;
  intensity: number;
}

interface BodyWake {
  x: number;
  y: number;
  angle: number;
  speed: number;
  life: number;
  maxLife: number;
  color: number;
  size: number;
}

interface HyperTrail {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  color: number;
  life: number;
  maxLife: number;
  width: number;
}

interface PowerSurge {
  x: number;
  y: number;
  angle: number;
  radius: number;
  speed: number;
  life: number;
  maxLife: number;
  color: number;
}

interface CometTrail {
  x: number;
  y: number;
  size: number;
  color: number;
  life: number;
  maxLife: number;
  alpha: number;
}

interface ElectricSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: number;
  size: number;
}

interface GhostImage {
  segments: Array<{ x: number; y: number }>;
  life: number;
  maxLife: number;
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
  // Nebula colors for cosmic background
  nebula: [0x1a0033, 0x330066, 0x000033, 0x003344, 0x220044],
  // Crystal food colors
  crystal: [0xff0066, 0xff3399, 0xff66aa, 0xffaacc, 0xffffff],
  // Aurora colors for northern lights effect
  aurora: [0x00ff88, 0x00ffcc, 0x00ccff, 0x8844ff, 0xff44aa, 0x44ff88],
  // Lightning colors
  lightning: [0x00ffff, 0xaaffff, 0xffffff, 0x88ffff],
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
  private floatingTexts: FloatingText[] = [];
  private pulseWaves: PulseWave[] = [];
  private nebulaNodes: NebulaNode[] = [];
  private auroraWaves: AuroraWave[] = [];
  private lightningBolts: LightningBolt[] = [];
  private bodyWakes: BodyWake[] = [];
  private hyperTrails: HyperTrail[] = [];
  private powerSurges: PowerSurge[] = [];
  private cometTrails: CometTrail[] = [];
  private electricSparks: ElectricSpark[] = [];
  private ghostImages: GhostImage[] = [];

  // Color cycling for dynamic theme
  private colorCycleOffset = 0;

  // Power level (increases with snake length for intensity scaling)
  private powerLevel = 1;

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
    this.initNebulaNodes();
    this.initAuroraWaves();

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

  private initNebulaNodes(): void {
    const width = GRID_SIZE * CELL_SIZE;
    const height = GRID_SIZE * CELL_SIZE;

    // Create cosmic nebula cloud nodes
    for (let i = 0; i < 6; i++) {
      this.nebulaNodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 60 + Math.random() * 80,
        color: COLORS.nebula[i % COLORS.nebula.length],
        phase: Math.random() * Math.PI * 2,
        speed: 0.005 + Math.random() * 0.01,
      });
    }
  }

  private initAuroraWaves(): void {
    const height = GRID_SIZE * CELL_SIZE;

    // Create multiple aurora wave layers
    for (let i = 0; i < 4; i++) {
      this.auroraWaves.push({
        y: height * 0.15 + i * height * 0.12,
        amplitude: 25 + Math.random() * 20,
        frequency: 0.008 + Math.random() * 0.004,
        speed: 0.02 + Math.random() * 0.015,
        phase: Math.random() * Math.PI * 2,
        colors: [
          COLORS.aurora[i % COLORS.aurora.length],
          COLORS.aurora[(i + 1) % COLORS.aurora.length],
          COLORS.aurora[(i + 2) % COLORS.aurora.length],
        ],
        thickness: 35 + Math.random() * 25,
      });
    }
  }

  updateGameState(state: GameState): void {
    // Update power level based on snake length (more dramatic effects as snake grows)
    this.powerLevel = Math.min(1 + (state.snake.length - 1) * 0.15, 3);

    // Detect if food was eaten (snake grew)
    if (this.currentState && state.snake.length > this.prevSnakeLength) {
      this.spawnFoodExplosion(this.prevFoodPos || state.food);
      this.spawnEnergyRings(this.prevFoodPos || state.food);
      this.spawnFloatingText(this.prevFoodPos || state.food, '+10');
      this.spawnSpiralBurst(this.prevFoodPos || state.food);
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
          // Spawn pulse wave from head at higher power levels
          if (this.powerLevel >= 1.5 && this.frameCount % 3 === 0) {
            this.spawnPulseWave(head);
          }
          // Spawn hyper trails from snake body
          this.spawnHyperTrails(state.snake);
          // Spawn power surges from head
          if (this.frameCount % 2 === 0) {
            this.spawnPowerSurge(head);
          }
          // Spawn comet trails behind head
          this.spawnCometTrail(head);
          // Spawn electric sparks from head
          if (this.frameCount % 2 === 0) {
            this.spawnElectricSparks(head);
          }
          // Spawn ghost image trail every few frames
          if (this.frameCount % 4 === 0 && state.snake.length > 2) {
            this.spawnGhostImage(state.snake);
          }
          // Spawn lightning arcs between segments at higher power levels
          if (this.frameCount % 5 === 0 && state.snake.length > 3 && this.powerLevel >= 1.3) {
            this.spawnSnakeLightning(state.snake);
          }
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

    // Spawn multiple expanding energy rings (scale with power level)
    const ringCount = Math.min(3 + Math.floor(this.powerLevel), 5);
    for (let i = 0; i < ringCount; i++) {
      this.energyRings.push({
        x: centerX,
        y: centerY,
        radius: 5 + i * 8,
        maxRadius: (80 + i * 20) * this.powerLevel,
        color: COLORS.rainbow[i % COLORS.rainbow.length],
        life: 30 - i * 4,
        thickness: 3 - i * 0.4,
      });
    }
  }

  private spawnFloatingText(pos: Position, text: string): void {
    const centerX = pos.x * CELL_SIZE + CELL_SIZE / 2;
    const centerY = pos.y * CELL_SIZE + CELL_SIZE / 2;

    this.floatingTexts.push({
      x: centerX,
      y: centerY,
      text,
      life: 45,
      maxLife: 45,
      color: 0xffff00,
      vy: -2,
      scale: 1 + this.powerLevel * 0.3,
    });
  }

  private spawnSpiralBurst(pos: Position): void {
    const centerX = pos.x * CELL_SIZE + CELL_SIZE / 2;
    const centerY = pos.y * CELL_SIZE + CELL_SIZE / 2;

    // Spiral particle burst (more particles at higher power levels)
    const particleCount = Math.floor(12 * this.powerLevel);
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 4 + this.frameCount * 0.1;
      const spiralOffset = i * 0.15;
      const speed = 2 + Math.random() * 3 * this.powerLevel;

      this.foodParticles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle + spiralOffset) * speed,
        vy: Math.sin(angle + spiralOffset) * speed,
        life: 40,
        maxLife: 40,
        color: COLORS.rainbow[i % COLORS.rainbow.length],
        size: 2 + Math.random() * 2 * this.powerLevel,
      });
    }
  }

  private spawnPulseWave(head: Position): void {
    if (this.pulseWaves.length > 5) return;

    const centerX = head.x * CELL_SIZE + CELL_SIZE / 2;
    const centerY = head.y * CELL_SIZE + CELL_SIZE / 2;

    this.pulseWaves.push({
      x: centerX,
      y: centerY,
      radius: 5,
      maxRadius: 30 + this.powerLevel * 10,
      life: 15,
      color: COLORS.snakeHeadGlow,
    });
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

  private spawnBodyWake(x: number, y: number, progress: number): void {
    if (this.bodyWakes.length > 40) return; // Limit particles

    // Spawn wake perpendicular to movement direction
    const perpAngle = Math.atan2(-this.moveDirection.dx, this.moveDirection.dy);
    const side = Math.random() > 0.5 ? 1 : -1;
    const angle = perpAngle + (Math.random() - 0.5) * 0.5 + side * Math.PI * 0.3;

    this.bodyWakes.push({
      x: x + (Math.random() - 0.5) * 4,
      y: y + (Math.random() - 0.5) * 4,
      angle: angle,
      speed: 1 + Math.random() * 2,
      life: 15 + Math.random() * 10,
      maxLife: 25,
      color: this.lerpColor(COLORS.snakeBody, COLORS.snakeTail, progress),
      size: 2 + Math.random() * 2 * (1 - progress),
    });
  }

  private spawnHyperTrails(snake: Position[]): void {
    if (this.hyperTrails.length > 60) return; // Limit trails

    // Create trails from every few segments
    const step = Math.max(1, Math.floor(snake.length / 8));
    for (let i = 0; i < snake.length; i += step) {
      const seg = snake[i];
      const progress = i / Math.max(snake.length - 1, 1);

      // Calculate trail direction (opposite of movement)
      const trailLength = 12 + (1 - progress) * 8;
      const prevX = seg.x * CELL_SIZE + CELL_SIZE / 2 - this.moveDirection.dx * trailLength;
      const prevY = seg.y * CELL_SIZE + CELL_SIZE / 2 - this.moveDirection.dy * trailLength;

      this.hyperTrails.push({
        x: seg.x * CELL_SIZE + CELL_SIZE / 2,
        y: seg.y * CELL_SIZE + CELL_SIZE / 2,
        prevX: prevX,
        prevY: prevY,
        color: i === 0 ? COLORS.snakeHeadGlow : COLORS.rainbow[i % COLORS.rainbow.length],
        life: 12,
        maxLife: 12,
        width: i === 0 ? 8 : 4 - progress * 2,
      });
    }
  }

  private spawnPowerSurge(head: Position): void {
    if (this.powerSurges.length > 20) return;

    const centerX = head.x * CELL_SIZE + CELL_SIZE / 2;
    const centerY = head.y * CELL_SIZE + CELL_SIZE / 2;

    // Spawn radial power lines emanating from head
    const surgeCount = Math.min(2 + Math.floor(this.powerLevel), 4);
    for (let i = 0; i < surgeCount; i++) {
      const baseAngle = Math.atan2(this.moveDirection.dy, this.moveDirection.dx);
      const spreadAngle = (i - (surgeCount - 1) / 2) * 0.4;
      const angle = baseAngle + spreadAngle;

      this.powerSurges.push({
        x: centerX,
        y: centerY,
        angle: angle,
        radius: 5,
        speed: 6 + Math.random() * 4,
        life: 10 + Math.random() * 5,
        maxLife: 15,
        color: COLORS.electric[i % COLORS.electric.length],
      });
    }
  }

  private spawnCometTrail(head: Position): void {
    if (this.cometTrails.length > 40) return;

    const centerX = head.x * CELL_SIZE + CELL_SIZE / 2;
    const centerY = head.y * CELL_SIZE + CELL_SIZE / 2;

    // Spawn multiple trail particles in a comet shape
    for (let i = 0; i < 3; i++) {
      const offsetAngle = Math.atan2(-this.moveDirection.dy, -this.moveDirection.dx);
      const spread = (Math.random() - 0.5) * 0.6;
      const distance = 5 + Math.random() * 10;

      this.cometTrails.push({
        x: centerX + Math.cos(offsetAngle + spread) * distance + (Math.random() - 0.5) * 4,
        y: centerY + Math.sin(offsetAngle + spread) * distance + (Math.random() - 0.5) * 4,
        size: 3 + Math.random() * 4 * this.powerLevel,
        color: COLORS.rainbow[Math.floor(Math.random() * COLORS.rainbow.length)],
        life: 20 + Math.random() * 10,
        maxLife: 30,
        alpha: 0.8,
      });
    }
  }

  private spawnElectricSparks(head: Position): void {
    if (this.electricSparks.length > 30) return;

    const centerX = head.x * CELL_SIZE + CELL_SIZE / 2;
    const centerY = head.y * CELL_SIZE + CELL_SIZE / 2;

    // Forward-facing sparks
    const forwardAngle = Math.atan2(this.moveDirection.dy, this.moveDirection.dx);
    const sparkCount = Math.min(2 + Math.floor(this.powerLevel), 4);

    for (let i = 0; i < sparkCount; i++) {
      const spreadAngle = forwardAngle + (Math.random() - 0.5) * 1.2;
      const speed = 3 + Math.random() * 4 * this.powerLevel;

      this.electricSparks.push({
        x: centerX + this.moveDirection.dx * 8,
        y: centerY + this.moveDirection.dy * 8,
        vx: Math.cos(spreadAngle) * speed,
        vy: Math.sin(spreadAngle) * speed,
        life: 12 + Math.random() * 8,
        maxLife: 20,
        color: COLORS.electric[i % COLORS.electric.length],
        size: 2 + Math.random() * 2,
      });
    }
  }

  private spawnGhostImage(snake: Position[]): void {
    if (this.ghostImages.length > 5) return;

    // Create a ghost copy of current snake position
    const ghostSegments = snake.slice(0, Math.min(snake.length, 8)).map(seg => ({
      x: seg.x * CELL_SIZE + CELL_SIZE / 2,
      y: seg.y * CELL_SIZE + CELL_SIZE / 2,
    }));

    this.ghostImages.push({
      segments: ghostSegments,
      life: 15,
      maxLife: 15,
      alpha: 0.3,
    });
  }

  private spawnLightningBolt(x1: number, y1: number, x2: number, y2: number): void {
    if (this.lightningBolts.length > 12) return;

    // Generate jagged lightning path between two points
    const segments: Array<{ x: number; y: number }> = [{ x: x1, y: y1 }];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const numSegs = Math.max(3, Math.floor(dist / 8));

    for (let i = 1; i < numSegs; i++) {
      const t = i / numSegs;
      const jitter = (1 - Math.abs(t - 0.5) * 2) * 12; // More jitter in middle
      const mx = x1 + dx * t + (Math.random() - 0.5) * jitter;
      const my = y1 + dy * t + (Math.random() - 0.5) * jitter;
      segments.push({ x: mx, y: my });
    }
    segments.push({ x: x2, y: y2 });

    this.lightningBolts.push({
      x1, y1, x2, y2,
      segments,
      life: 8 + Math.random() * 6,
      maxLife: 14,
      color: COLORS.lightning[Math.floor(Math.random() * COLORS.lightning.length)],
      intensity: 0.6 + Math.random() * 0.4,
    });
  }

  private spawnSnakeLightning(snake: Position[]): void {
    if (snake.length < 3 || this.lightningBolts.length > 8) return;

    // Spawn lightning arcs between random non-adjacent segments
    const numArcs = Math.min(Math.floor(this.powerLevel), 3);
    for (let n = 0; n < numArcs; n++) {
      const i = Math.floor(Math.random() * (snake.length - 2));
      const j = Math.min(i + 2 + Math.floor(Math.random() * 3), snake.length - 1);

      const seg1 = snake[i];
      const seg2 = snake[j];

      const x1 = seg1.x * CELL_SIZE + CELL_SIZE / 2;
      const y1 = seg1.y * CELL_SIZE + CELL_SIZE / 2;
      const x2 = seg2.x * CELL_SIZE + CELL_SIZE / 2;
      const y2 = seg2.y * CELL_SIZE + CELL_SIZE / 2;

      this.spawnLightningBolt(x1, y1, x2, y2);
    }
  }

  private drawBodyWakes(g: Phaser.GameObjects.Graphics, shakeX: number, shakeY: number): void {
    for (const bw of this.bodyWakes) {
      const alpha = (bw.life / bw.maxLife) * 0.5;
      const size = bw.size * (bw.life / bw.maxLife);
      const x = bw.x + shakeX;
      const y = bw.y + shakeY;

      // Outer glow
      g.fillStyle(bw.color, alpha * 0.3);
      g.fillCircle(x, y, size + 2);

      // Core
      g.fillStyle(bw.color, alpha * 0.7);
      g.fillCircle(x, y, size);
    }
  }

  private drawHyperTrails(g: Phaser.GameObjects.Graphics, shakeX: number, shakeY: number): void {
    for (const ht of this.hyperTrails) {
      const alpha = (ht.life / ht.maxLife);
      const x = ht.x + shakeX;
      const y = ht.y + shakeY;
      const px = ht.prevX + shakeX;
      const py = ht.prevY + shakeY;

      // Outer glow trail
      g.lineStyle(ht.width + 4, ht.color, alpha * 0.15);
      g.lineBetween(x, y, px, py);

      // Middle glow
      g.lineStyle(ht.width + 2, ht.color, alpha * 0.3);
      g.lineBetween(x, y, px, py);

      // Core bright trail
      g.lineStyle(ht.width, 0xffffff, alpha * 0.5);
      g.lineBetween(x, y, px, py);

      // Trail head glow
      g.fillStyle(0xffffff, alpha * 0.7);
      g.fillCircle(x, y, ht.width * 0.5);
    }
  }

  private drawPowerSurges(g: Phaser.GameObjects.Graphics, shakeX: number, shakeY: number): void {
    for (const ps of this.powerSurges) {
      const alpha = (ps.life / ps.maxLife);
      const x = ps.x + shakeX;
      const y = ps.y + shakeY;

      // Outer electric glow
      g.fillStyle(ps.color, alpha * 0.2);
      g.fillCircle(x, y, ps.radius + 4);

      // Core energy ball
      g.fillStyle(ps.color, alpha * 0.5);
      g.fillCircle(x, y, ps.radius);

      // Bright center
      g.fillStyle(0xffffff, alpha * 0.8);
      g.fillCircle(x, y, ps.radius * 0.4);
    }
  }

  private drawCometTrails(g: Phaser.GameObjects.Graphics, shakeX: number, shakeY: number): void {
    for (const ct of this.cometTrails) {
      const alpha = (ct.life / ct.maxLife) * ct.alpha;
      const size = ct.size * (ct.life / ct.maxLife);
      const x = ct.x + shakeX;
      const y = ct.y + shakeY;

      // Outer glow with color
      g.fillStyle(ct.color, alpha * 0.2);
      g.fillCircle(x, y, size + 4);

      // Middle layer
      g.fillStyle(ct.color, alpha * 0.5);
      g.fillCircle(x, y, size + 1);

      // Core bright spot
      g.fillStyle(0xffffff, alpha * 0.9);
      g.fillCircle(x, y, size * 0.4);
    }
  }

  private drawElectricSparks(g: Phaser.GameObjects.Graphics, shakeX: number, shakeY: number): void {
    for (const es of this.electricSparks) {
      const alpha = (es.life / es.maxLife);
      const x = es.x + shakeX;
      const y = es.y + shakeY;
      const size = es.size * alpha;

      // Electric arc effect - draw line from current to previous position
      const prevX = x - es.vx * 2;
      const prevY = y - es.vy * 2;

      // Outer glow trail
      g.lineStyle(size + 2, es.color, alpha * 0.3);
      g.lineBetween(x, y, prevX, prevY);

      // Core bright line
      g.lineStyle(size, 0xffffff, alpha * 0.7);
      g.lineBetween(x, y, prevX, prevY);

      // Spark head
      g.fillStyle(0xffffff, alpha);
      g.fillCircle(x, y, size * 0.8);

      // Color halo
      g.fillStyle(es.color, alpha * 0.5);
      g.fillCircle(x, y, size * 1.5);
    }
  }

  private drawGhostImages(g: Phaser.GameObjects.Graphics, shakeX: number, shakeY: number): void {
    for (const ghost of this.ghostImages) {
      const alpha = (ghost.life / ghost.maxLife) * ghost.alpha;

      // Draw ghost segments
      for (let i = 0; i < ghost.segments.length; i++) {
        const seg = ghost.segments[i];
        const x = seg.x + shakeX;
        const y = seg.y + shakeY;
        const progress = i / Math.max(ghost.segments.length - 1, 1);
        const size = (CELL_SIZE - 4 - progress * 4) / 2;

        // Ghost glow
        const ghostColor = i === 0 ? COLORS.snakeHeadGlow : this.lerpColor(COLORS.snakeBody, COLORS.snakeTail, progress);
        g.fillStyle(ghostColor, alpha * 0.15);
        g.fillCircle(x, y, size + 3);

        // Ghost body
        g.fillStyle(ghostColor, alpha * 0.25);
        g.fillCircle(x, y, size);
      }

      // Connect ghost segments with faint lines
      if (ghost.segments.length > 1) {
        g.lineStyle(3, COLORS.snakeBody, alpha * 0.1);
        for (let i = 0; i < ghost.segments.length - 1; i++) {
          const curr = ghost.segments[i];
          const next = ghost.segments[i + 1];
          g.lineBetween(
            curr.x + shakeX,
            curr.y + shakeY,
            next.x + shakeX,
            next.y + shakeY
          );
        }
      }
    }
  }

  private drawAurora(g: Phaser.GameObjects.Graphics, width: number, shakeX: number, shakeY: number): void {
    for (const wave of this.auroraWaves) {
      const baseY = wave.y + shakeY;

      // Draw multiple layers for each aurora wave (creates depth)
      for (let layer = 0; layer < 3; layer++) {
        const layerOffset = layer * 8;
        const layerAlpha = (0.12 - layer * 0.03) * (0.7 + Math.sin(this.frameCount * 0.03 + layer) * 0.3);
        const color = wave.colors[layer % wave.colors.length];

        // Draw the aurora as a series of vertical gradient strips
        const stripWidth = 6;
        for (let x = 0; x < width; x += stripWidth) {
          const waveOffset = Math.sin((x * wave.frequency) + wave.phase) * wave.amplitude;
          const secondaryWave = Math.sin((x * wave.frequency * 2.3) + wave.phase * 1.7) * (wave.amplitude * 0.4);
          const y = baseY + waveOffset + secondaryWave + layerOffset;

          // Varying height based on position
          const heightVar = Math.sin((x * 0.02) + this.frameCount * 0.02) * 0.4 + 0.6;
          const stripHeight = wave.thickness * heightVar;

          // Draw vertical gradient strip
          g.fillStyle(color, layerAlpha * heightVar);
          g.fillRect(x + shakeX, y - stripHeight * 0.3, stripWidth - 1, stripHeight);

          // Brighter core
          g.fillStyle(0xffffff, layerAlpha * 0.3 * heightVar);
          g.fillRect(x + shakeX + 1, y, stripWidth - 3, stripHeight * 0.3);
        }
      }
    }
  }

  private drawLightningBolts(g: Phaser.GameObjects.Graphics, shakeX: number, shakeY: number): void {
    for (const bolt of this.lightningBolts) {
      const alpha = (bolt.life / bolt.maxLife) * bolt.intensity;

      // Draw the lightning bolt segments
      if (bolt.segments.length < 2) continue;

      // Outer glow (wider, more diffuse)
      g.lineStyle(6, bolt.color, alpha * 0.15);
      g.beginPath();
      g.moveTo(bolt.segments[0].x + shakeX, bolt.segments[0].y + shakeY);
      for (let i = 1; i < bolt.segments.length; i++) {
        g.lineTo(bolt.segments[i].x + shakeX, bolt.segments[i].y + shakeY);
      }
      g.strokePath();

      // Middle glow
      g.lineStyle(3, bolt.color, alpha * 0.4);
      g.beginPath();
      g.moveTo(bolt.segments[0].x + shakeX, bolt.segments[0].y + shakeY);
      for (let i = 1; i < bolt.segments.length; i++) {
        g.lineTo(bolt.segments[i].x + shakeX, bolt.segments[i].y + shakeY);
      }
      g.strokePath();

      // Bright core
      g.lineStyle(1.5, 0xffffff, alpha * 0.9);
      g.beginPath();
      g.moveTo(bolt.segments[0].x + shakeX, bolt.segments[0].y + shakeY);
      for (let i = 1; i < bolt.segments.length; i++) {
        g.lineTo(bolt.segments[i].x + shakeX, bolt.segments[i].y + shakeY);
      }
      g.strokePath();

      // Endpoint glows
      g.fillStyle(0xffffff, alpha * 0.8);
      g.fillCircle(bolt.x1 + shakeX, bolt.y1 + shakeY, 3);
      g.fillCircle(bolt.x2 + shakeX, bolt.y2 + shakeY, 3);

      g.fillStyle(bolt.color, alpha * 0.5);
      g.fillCircle(bolt.x1 + shakeX, bolt.y1 + shakeY, 5);
      g.fillCircle(bolt.x2 + shakeX, bolt.y2 + shakeY, 5);
    }
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

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y += ft.vy;
      ft.vy *= 0.95;
      ft.life--;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // Update pulse waves
    for (let i = this.pulseWaves.length - 1; i >= 0; i--) {
      const pw = this.pulseWaves[i];
      pw.radius += (pw.maxRadius - pw.radius) * 0.2;
      pw.life--;
      if (pw.life <= 0) {
        this.pulseWaves.splice(i, 1);
      }
    }

    // Update body wake particles
    for (let i = this.bodyWakes.length - 1; i >= 0; i--) {
      const bw = this.bodyWakes[i];
      bw.x += Math.cos(bw.angle) * bw.speed;
      bw.y += Math.sin(bw.angle) * bw.speed;
      bw.life--;
      bw.speed *= 0.95;
      if (bw.life <= 0) {
        this.bodyWakes.splice(i, 1);
      }
    }

    // Update nebula nodes (breathing/pulsing motion)
    for (const node of this.nebulaNodes) {
      node.phase += node.speed;
    }

    // Update aurora waves
    for (const wave of this.auroraWaves) {
      wave.phase += wave.speed;
    }

    // Update lightning bolts
    for (let i = this.lightningBolts.length - 1; i >= 0; i--) {
      const bolt = this.lightningBolts[i];
      bolt.life--;
      if (bolt.life <= 0) {
        this.lightningBolts.splice(i, 1);
      }
    }

    // Update hyper trails
    for (let i = this.hyperTrails.length - 1; i >= 0; i--) {
      const ht = this.hyperTrails[i];
      ht.life--;
      if (ht.life <= 0) {
        this.hyperTrails.splice(i, 1);
      }
    }

    // Update power surges
    for (let i = this.powerSurges.length - 1; i >= 0; i--) {
      const ps = this.powerSurges[i];
      ps.x += Math.cos(ps.angle) * ps.speed;
      ps.y += Math.sin(ps.angle) * ps.speed;
      ps.radius += 0.3;
      ps.life--;
      if (ps.life <= 0) {
        this.powerSurges.splice(i, 1);
      }
    }

    // Update comet trails
    for (let i = this.cometTrails.length - 1; i >= 0; i--) {
      const ct = this.cometTrails[i];
      // Drift away from snake head direction
      ct.x += -this.moveDirection.dx * 0.5 + (Math.random() - 0.5) * 0.5;
      ct.y += -this.moveDirection.dy * 0.5 + (Math.random() - 0.5) * 0.5;
      ct.life--;
      ct.alpha *= 0.97;
      if (ct.life <= 0 || ct.alpha < 0.05) {
        this.cometTrails.splice(i, 1);
      }
    }

    // Update electric sparks
    for (let i = this.electricSparks.length - 1; i >= 0; i--) {
      const es = this.electricSparks[i];
      es.x += es.vx;
      es.y += es.vy;
      es.vx *= 0.92;
      es.vy *= 0.92;
      es.life--;
      if (es.life <= 0) {
        this.electricSparks.splice(i, 1);
      }
    }

    // Update ghost images
    for (let i = this.ghostImages.length - 1; i >= 0; i--) {
      const ghost = this.ghostImages[i];
      ghost.life--;
      ghost.alpha *= 0.92;
      if (ghost.life <= 0 || ghost.alpha < 0.02) {
        this.ghostImages.splice(i, 1);
      }
    }

    // Update color cycle offset for dynamic theming
    this.colorCycleOffset += 0.002;
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

    // Draw cosmic nebula effect (deep background)
    this.drawNebula(g, shakeX, shakeY);

    // Draw aurora borealis effect
    this.drawAurora(g, width, shakeX, shakeY);

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

    // Draw pulse waves (behind food and snake)
    this.drawPulseWaves(g, shakeX, shakeY);

    // Draw food explosion particles and energy rings
    this.drawFoodParticles(g, shakeX, shakeY);
    this.drawEnergyRings(g, shakeX, shakeY);

    // Draw ghost images (motion blur effect) - behind everything
    this.drawGhostImages(g, shakeX, shakeY);

    // Draw hyper trails behind the snake
    this.drawHyperTrails(g, shakeX, shakeY);

    // Draw comet trails
    this.drawCometTrails(g, shakeX, shakeY);

    // Draw power surges
    this.drawPowerSurges(g, shakeX, shakeY);

    // Draw electric sparks
    this.drawElectricSparks(g, shakeX, shakeY);

    // Draw snake with rainbow shimmer and electric effects
    this.drawSnake(g, shakeX, shakeY);

    // Draw lightning bolts between snake segments
    this.drawLightningBolts(g, shakeX, shakeY);

    // Draw floating texts (on top of everything)
    this.drawFloatingTexts(g, shakeX, shakeY);

    // Neon border glow (only when game is active)
    if (!this.currentState.gameOver) {
      this.drawNeonBorder(g, width, height);
    }

    // Game over overlay
    if (this.currentState.gameOver) {
      this.drawGameOverEffect(g, width, height);
    }
  }

  private drawNebula(g: Phaser.GameObjects.Graphics, shakeX: number, shakeY: number): void {
    // Draw cosmic nebula clouds with breathing animation
    for (const node of this.nebulaNodes) {
      const breathe = Math.sin(node.phase) * 0.3 + 0.7;
      const radius = node.radius * breathe;
      const x = node.x + shakeX + Math.sin(node.phase * 0.5) * 10;
      const y = node.y + shakeY + Math.cos(node.phase * 0.7) * 8;

      // Multiple layers for soft nebula effect
      g.fillStyle(node.color, 0.04 * breathe);
      g.fillCircle(x, y, radius * 1.5);

      g.fillStyle(node.color, 0.06 * breathe);
      g.fillCircle(x, y, radius);

      g.fillStyle(node.color, 0.08 * breathe);
      g.fillCircle(x, y, radius * 0.6);
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

  private drawFloatingTexts(g: Phaser.GameObjects.Graphics, shakeX: number, shakeY: number): void {
    for (const ft of this.floatingTexts) {
      const alpha = ft.life / ft.maxLife;
      const x = ft.x + shakeX;
      const y = ft.y + shakeY;
      const scale = ft.scale * (0.8 + alpha * 0.4);

      // Draw score text as glowing circles forming "+10"
      // Since Phaser Graphics doesn't have text, we use shapes to suggest the score
      const radius = 3 * scale;

      // Outer glow for the score indicator
      g.fillStyle(ft.color, alpha * 0.3);
      g.fillCircle(x, y, radius * 4);

      // Core bright circle
      g.fillStyle(ft.color, alpha * 0.8);
      g.fillCircle(x, y, radius * 2);

      // Inner white core
      g.fillStyle(0xffffff, alpha);
      g.fillCircle(x, y, radius);

      // Sparkle rays (4 directions)
      g.lineStyle(2 * scale, ft.color, alpha * 0.6);
      const rayLength = radius * 3;
      g.lineBetween(x - rayLength, y, x + rayLength, y);
      g.lineBetween(x, y - rayLength, x, y + rayLength);

      // Diagonal sparkles
      g.lineStyle(1.5 * scale, ft.color, alpha * 0.4);
      const diagLength = rayLength * 0.7;
      g.lineBetween(x - diagLength, y - diagLength, x + diagLength, y + diagLength);
      g.lineBetween(x + diagLength, y - diagLength, x - diagLength, y + diagLength);
    }
  }

  private drawPulseWaves(g: Phaser.GameObjects.Graphics, shakeX: number, shakeY: number): void {
    for (const pw of this.pulseWaves) {
      const alpha = (pw.life / 15) * 0.4;
      const x = pw.x + shakeX;
      const y = pw.y + shakeY;

      // Outer soft glow
      g.lineStyle(4, pw.color, alpha * 0.2);
      g.strokeCircle(x, y, pw.radius + 3);

      // Main wave
      g.lineStyle(2, pw.color, alpha * 0.5);
      g.strokeCircle(x, y, pw.radius);

      // Inner bright edge
      g.lineStyle(1, 0xffffff, alpha * 0.3);
      g.strokeCircle(x, y, pw.radius - 1);
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
    const rotation = this.frameCount * 0.03;

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

    // Crystalline facet effect - rotating hexagon with inner structure
    const crystalSize = 9 * pulse1;
    const facets = 6;

    // Outer crystal glow
    g.fillStyle(COLORS.foodGlow, 0.3 * pulse1);
    g.beginPath();
    for (let i = 0; i < facets; i++) {
      const angle = (i / facets) * Math.PI * 2 + rotation;
      const fx = centerX + Math.cos(angle) * (crystalSize + 3);
      const fy = centerY + Math.sin(angle) * (crystalSize + 3);
      if (i === 0) g.moveTo(fx, fy);
      else g.lineTo(fx, fy);
    }
    g.closePath();
    g.fillPath();

    // Main crystal body
    g.fillStyle(COLORS.food, 0.9);
    g.beginPath();
    for (let i = 0; i < facets; i++) {
      const angle = (i / facets) * Math.PI * 2 + rotation;
      const fx = centerX + Math.cos(angle) * crystalSize;
      const fy = centerY + Math.sin(angle) * crystalSize;
      if (i === 0) g.moveTo(fx, fy);
      else g.lineTo(fx, fy);
    }
    g.closePath();
    g.fillPath();

    // Inner crystal facets (connecting lines to center)
    g.lineStyle(1, COLORS.foodGlow, 0.4 * pulse1);
    for (let i = 0; i < facets; i++) {
      const angle = (i / facets) * Math.PI * 2 + rotation;
      const fx = centerX + Math.cos(angle) * crystalSize;
      const fy = centerY + Math.sin(angle) * crystalSize;
      g.lineBetween(centerX, centerY, fx, fy);
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

    // Inner bright core
    g.fillStyle(COLORS.foodCore, 0.95 * pulse3);
    g.fillCircle(centerX, centerY, 4);

    // Sparkle highlights (animated reflections on crystal facets)
    for (let i = 0; i < 3; i++) {
      const sparkleAngle = rotation + (i / 3) * Math.PI * 2;
      const sparkleR = crystalSize * 0.5;
      const sparkleX = centerX + Math.cos(sparkleAngle) * sparkleR;
      const sparkleY = centerY + Math.sin(sparkleAngle) * sparkleR;
      const sparkleAlpha = (Math.sin(this.frameCount * 0.2 + i * 2) * 0.3 + 0.5);
      g.fillStyle(0xffffff, sparkleAlpha);
      g.fillCircle(sparkleX, sparkleY, 1.5);
    }
  }

  private drawSnake(g: Phaser.GameObjects.Graphics, shakeX: number, shakeY: number): void {
    if (!this.currentState) return;

    const snake = this.currentState.snake;
    const segmentCount = snake.length;

    // Draw body wake particles first (behind snake)
    this.drawBodyWakes(g, shakeX, shakeY);

    // Spawn trail particles from tail
    if (segmentCount > 0 && !this.currentState.gameOver) {
      const tail = snake[snake.length - 1];
      const tailX = tail.x * CELL_SIZE + CELL_SIZE / 2;
      const tailY = tail.y * CELL_SIZE + CELL_SIZE / 2;
      if (this.frameCount % 2 === 0) {
        this.spawnTrailParticle(tailX, tailY, COLORS.trailGlow);
      }

      // Spawn body wake particles from every few segments
      if (this.frameCount % 3 === 0 && segmentCount > 2) {
        for (let i = 1; i < segmentCount; i += 3) {
          const seg = snake[i];
          const segX = seg.x * CELL_SIZE + CELL_SIZE / 2;
          const segY = seg.y * CELL_SIZE + CELL_SIZE / 2;
          this.spawnBodyWake(segX, segY, i / segmentCount);
        }
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

      // Body wave animation - segments undulate perpendicular to movement
      const wavePhase = (this.frameCount * 0.15 + i * 0.8);
      const waveAmplitude = Math.min(i * 0.3, 2.5) * (1 - (i / Math.max(segmentCount, 1)));
      const perpX = -this.moveDirection.dy;
      const perpY = this.moveDirection.dx;
      const waveOffset = Math.sin(wavePhase) * waveAmplitude;

      const x = segment.x * CELL_SIZE + shakeX + perpX * waveOffset;
      const y = segment.y * CELL_SIZE + shakeY + perpY * waveOffset;
      const centerX = x + CELL_SIZE / 2;
      const centerY = y + CELL_SIZE / 2;

      const isHead = i === 0;
      const progress = segmentCount > 1 ? i / (segmentCount - 1) : 0;

      if (isHead) {
        // Head with enhanced electric glow effect (scaled by power level)
        const headPulse = Math.sin(this.frameCount * 0.1) * 0.2 + 0.8;
        const electricPulse = Math.sin(this.frameCount * 0.25) * 0.5 + 0.5;
        const powerGlow = this.powerLevel;

        // Electric aura (outermost) - grows with power level
        if (!this.currentState.gameOver) {
          const electricColor = COLORS.electric[Math.floor(this.frameCount * 0.2) % COLORS.electric.length];
          g.fillStyle(electricColor, 0.08 * electricPulse * powerGlow);
          g.fillCircle(centerX, centerY, 18 + powerGlow * 6);

          // Power corona (extra layer at high power)
          if (powerGlow >= 1.5) {
            const coronaColor = COLORS.rainbow[Math.floor(this.frameCount * 0.15) % COLORS.rainbow.length];
            g.fillStyle(coronaColor, 0.04 * electricPulse * powerGlow);
            g.fillCircle(centerX, centerY, 25 + powerGlow * 8);
          }
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
