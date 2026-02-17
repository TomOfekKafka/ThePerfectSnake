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

interface PlasmaWave {
  phase: number;
  speed: number;
  amplitude: number;
  wavelength: number;
  hue: number;
}

interface AuroraWave {
  y: number;
  phase: number;
  speed: number;
  hue: number;
  thickness: number;
  amplitude: number;
}

interface NebulaCloud {
  x: number;
  y: number;
  radius: number;
  hue: number;
  alpha: number;
  driftX: number;
  driftY: number;
  pulsePhase: number;
  pulseSpeed: number;
}

interface VortexRing {
  radius: number;
  baseRadius: number;
  rotationOffset: number;
  rotationSpeed: number;
  thickness: number;
  hue: number;
  pulsePhase: number;
}

interface VortexParticle {
  angle: number;
  radius: number;
  baseRadius: number;
  speed: number;
  size: number;
  hue: number;
  alpha: number;
}

interface SnakeAfterimage {
  segments: Position[];
  life: number;
  maxLife: number;
  hueOffset: number;
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

interface SnakeTrailParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  hue: number;
}

interface ShockWave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  life: number;
}

interface LightningBolt {
  points: { x: number; y: number }[];
  life: number;
  maxLife: number;
  hue: number;
}

const CELL_SIZE = 20;
const GRID_SIZE = 20;
const NUM_STARS = 30;
const MAX_FOOD_PARTICLES = 8;
const MAX_TRAIL_PARTICLES = 40;
const MAX_SHOCKWAVES = 3;
const MAX_LIGHTNING_BOLTS = 5;
const MAX_BURST_PARTICLES = 12;
const NUM_PLASMA_WAVES = 3;
const MAX_AFTERIMAGES = 4;
const NUM_AURORA_WAVES = 5;
const NUM_NEBULA_CLOUDS = 6;
const NUM_VORTEX_RINGS = 5;
const NUM_VORTEX_PARTICLES = 20;
const NUM_METEORS = 8;
const MAX_DEATH_DEBRIS = 24;

// Meteor shower types
interface Meteor {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  hue: number;
  alpha: number;
  trail: { x: number; y: number; alpha: number }[];
  life: number;
}

// Death debris particle
interface DeathDebris {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  hue: number;
  rotation: number;
  rotationSpeed: number;
  life: number;
  type: 'shard' | 'spark' | 'ember';
}

// Color palette - enhanced neon cyberpunk theme with plasma colors
const COLORS = {
  bgDark: 0x020208,
  bgMid: 0x080816,
  gridLine: 0x1a1a3e,
  gridAccent: 0x3a3a8e,
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
  plasma1: 0x8800ff,
  plasma2: 0x00aaff,
  plasma3: 0xff0088,
  screenFlash: 0xffffff,
};

export class SnakeScene extends Phaser.Scene {
  private graphics!: Phaser.GameObjects.Graphics;
  private currentState: GameState | null = null;
  private needsRedraw = false;
  private frameCount = 0;
  private stars: Star[] = [];
  private foodParticles: FoodParticle[] = [];
  private trailParticles: SnakeTrailParticle[] = [];
  private shockWaves: ShockWave[] = [];
  private lightningBolts: LightningBolt[] = [];
  private plasmaWaves: PlasmaWave[] = [];
  private snakeAfterimages: SnakeAfterimage[] = [];
  private auroraWaves: AuroraWave[] = [];
  private nebulaClouds: NebulaCloud[] = [];
  private vortexRings: VortexRing[] = [];
  private vortexParticles: VortexParticle[] = [];
  private vortexPulse = 0;
  private meteors: Meteor[] = [];
  private deathDebris: DeathDebris[] = [];
  private deathExplosionPhase = 0;
  private gameOverAlpha = 0;
  private lastHeadPos: Position | null = null;
  private lastSnakeLength = 0;
  private hueOffset = 0;
  private screenFlashAlpha = 0;
  private gameOverGlitchOffset = 0;
  private screenShakeX = 0;
  private screenShakeY = 0;
  private screenShakeIntensity = 0;
  private energyFieldPulse = 0;
  private foodBurstParticles: { x: number; y: number; vx: number; vy: number; life: number; size: number; hue: number; trail: { x: number; y: number }[] }[] = [];
  private chromaticIntensity = 0;

  constructor() {
    super({ key: 'SnakeScene' });
  }

  create(): void {
    this.graphics = this.add.graphics();
    this.initStars();
    this.initPlasmaWaves();
    this.initAuroraWaves();
    this.initNebulaClouds();
    this.initVortex();
    this.initMeteors();

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

  private initPlasmaWaves(): void {
    this.plasmaWaves = [];
    const hues = [280, 200, 320]; // Purple, cyan, magenta
    for (let i = 0; i < NUM_PLASMA_WAVES; i++) {
      this.plasmaWaves.push({
        phase: Math.random() * Math.PI * 2,
        speed: 0.015 + Math.random() * 0.01,
        amplitude: 30 + Math.random() * 20,
        wavelength: 80 + Math.random() * 40,
        hue: hues[i % hues.length],
      });
    }
  }

  private initAuroraWaves(): void {
    this.auroraWaves = [];
    const height = GRID_SIZE * CELL_SIZE;
    // Aurora hues: greens, cyans, magentas, purples
    const auroraHues = [120, 160, 180, 280, 320];
    for (let i = 0; i < NUM_AURORA_WAVES; i++) {
      this.auroraWaves.push({
        y: height * 0.2 + (height * 0.6 * i) / NUM_AURORA_WAVES,
        phase: Math.random() * Math.PI * 2,
        speed: 0.008 + Math.random() * 0.006,
        hue: auroraHues[i % auroraHues.length],
        thickness: 25 + Math.random() * 20,
        amplitude: 15 + Math.random() * 25,
      });
    }
  }

  private initNebulaClouds(): void {
    this.nebulaClouds = [];
    const width = GRID_SIZE * CELL_SIZE;
    const height = GRID_SIZE * CELL_SIZE;
    // Deep space nebula colors: purples, blues, magentas
    const nebulaHues = [260, 220, 300, 180, 340, 240];
    for (let i = 0; i < NUM_NEBULA_CLOUDS; i++) {
      this.nebulaClouds.push({
        x: Math.random() * width,
        y: Math.random() * height,
        radius: 40 + Math.random() * 60,
        hue: nebulaHues[i % nebulaHues.length],
        alpha: 0.04 + Math.random() * 0.04,
        driftX: (Math.random() - 0.5) * 0.15,
        driftY: (Math.random() - 0.5) * 0.15,
        pulsePhase: Math.random() * Math.PI * 2,
        pulseSpeed: 0.01 + Math.random() * 0.01,
      });
    }
  }

  private initVortex(): void {
    this.vortexRings = [];
    this.vortexParticles = [];

    // Create concentric rings with different properties
    const ringHues = [280, 200, 320, 180, 260];
    for (let i = 0; i < NUM_VORTEX_RINGS; i++) {
      const baseRadius = 25 + i * 18;
      this.vortexRings.push({
        radius: baseRadius,
        baseRadius,
        rotationOffset: (i * Math.PI * 2) / NUM_VORTEX_RINGS,
        rotationSpeed: 0.02 - i * 0.003,
        thickness: 2 + (NUM_VORTEX_RINGS - i) * 0.5,
        hue: ringHues[i % ringHues.length],
        pulsePhase: i * 0.5,
      });
    }

    // Create orbiting particles
    for (let i = 0; i < NUM_VORTEX_PARTICLES; i++) {
      const baseRadius = 20 + Math.random() * 80;
      this.vortexParticles.push({
        angle: Math.random() * Math.PI * 2,
        radius: baseRadius,
        baseRadius,
        speed: 0.02 + Math.random() * 0.03,
        size: 1 + Math.random() * 2,
        hue: Math.random() * 360,
        alpha: 0.3 + Math.random() * 0.5,
      });
    }
  }

  private initMeteors(): void {
    this.meteors = [];
    const width = GRID_SIZE * CELL_SIZE;
    const height = GRID_SIZE * CELL_SIZE;
    for (let i = 0; i < NUM_METEORS; i++) {
      this.spawnMeteor(width, height, true);
    }
  }

  private spawnMeteor(width: number, height: number, initial = false): void {
    if (this.meteors.length >= NUM_METEORS) return;

    // Meteors come from top-right and travel to bottom-left
    const startX = initial ? Math.random() * width * 1.5 : width + 20 + Math.random() * 40;
    const startY = initial ? Math.random() * height * 0.5 - height * 0.25 : -20 - Math.random() * 40;

    // Random angle variation (mostly diagonal)
    const angle = Math.PI * 0.65 + (Math.random() - 0.5) * 0.4;
    const speed = 1.5 + Math.random() * 2;

    this.meteors.push({
      x: startX,
      y: startY,
      vx: -Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      size: 2 + Math.random() * 3,
      hue: Math.random() < 0.3 ? 30 + Math.random() * 30 : 180 + Math.random() * 60, // Orange or cyan
      alpha: 0.6 + Math.random() * 0.4,
      trail: [],
      life: 1,
    });
  }

  private updateMeteors(width: number, height: number): void {
    for (let i = this.meteors.length - 1; i >= 0; i--) {
      const m = this.meteors[i];

      // Store trail position
      m.trail.unshift({ x: m.x, y: m.y, alpha: m.alpha });
      if (m.trail.length > 12) m.trail.pop();

      // Update position
      m.x += m.vx;
      m.y += m.vy;

      // Check if meteor is out of bounds
      if (m.x < -50 || m.y > height + 50) {
        this.meteors.splice(i, 1);
        // Spawn a new one
        this.spawnMeteor(width, height, false);
      }
    }
  }

  private spawnDeathExplosion(): void {
    if (!this.currentState) return;

    this.deathDebris = [];
    this.deathExplosionPhase = 1;

    // Spawn debris from each snake segment
    for (let i = 0; i < this.currentState.snake.length; i++) {
      const seg = this.currentState.snake[i];
      const cx = seg.x * CELL_SIZE + CELL_SIZE / 2;
      const cy = seg.y * CELL_SIZE + CELL_SIZE / 2;
      const segHue = (this.hueOffset + i * 15) % 360;

      // Create debris particles per segment (limit total)
      const debrisPerSeg = Math.min(3, Math.floor(MAX_DEATH_DEBRIS / this.currentState.snake.length));
      for (let j = 0; j < debrisPerSeg; j++) {
        if (this.deathDebris.length >= MAX_DEATH_DEBRIS) break;

        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 4;
        const types: ('shard' | 'spark' | 'ember')[] = ['shard', 'spark', 'ember'];

        this.deathDebris.push({
          x: cx + (Math.random() - 0.5) * 8,
          y: cy + (Math.random() - 0.5) * 8,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1,
          size: 3 + Math.random() * 5,
          hue: segHue + (Math.random() - 0.5) * 40,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.4,
          life: 1,
          type: types[Math.floor(Math.random() * types.length)],
        });
      }
    }
  }

  private updateDeathDebris(): void {
    // Decay explosion phase
    if (this.deathExplosionPhase > 0) {
      this.deathExplosionPhase *= 0.95;
      if (this.deathExplosionPhase < 0.01) this.deathExplosionPhase = 0;
    }

    for (let i = this.deathDebris.length - 1; i >= 0; i--) {
      const d = this.deathDebris[i];

      // Update position with gravity
      d.x += d.vx;
      d.y += d.vy;
      d.vy += 0.08; // gravity
      d.vx *= 0.99; // air resistance

      // Update rotation
      d.rotation += d.rotationSpeed;

      // Decay life
      d.life -= 0.015;

      if (d.life <= 0) {
        this.deathDebris.splice(i, 1);
      }
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
    // Update trail particles
    for (let i = this.trailParticles.length - 1; i >= 0; i--) {
      const p = this.trailParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 1 / p.maxLife;
      if (p.life <= 0) {
        this.trailParticles.splice(i, 1);
      }
    }
    // Update shockwaves
    for (let i = this.shockWaves.length - 1; i >= 0; i--) {
      const sw = this.shockWaves[i];
      sw.radius += 3;
      sw.life -= 0.04;
      if (sw.life <= 0 || sw.radius >= sw.maxRadius) {
        this.shockWaves.splice(i, 1);
      }
    }
    // Update lightning bolts
    for (let i = this.lightningBolts.length - 1; i >= 0; i--) {
      const bolt = this.lightningBolts[i];
      bolt.life -= 1 / bolt.maxLife;
      if (bolt.life <= 0) {
        this.lightningBolts.splice(i, 1);
      }
    }
    // Update afterimages
    for (let i = this.snakeAfterimages.length - 1; i >= 0; i--) {
      const ai = this.snakeAfterimages[i];
      ai.life -= 1 / ai.maxLife;
      if (ai.life <= 0) {
        this.snakeAfterimages.splice(i, 1);
      }
    }
    // Decay screen flash
    if (this.screenFlashAlpha > 0) {
      this.screenFlashAlpha -= 0.08;
      if (this.screenFlashAlpha < 0) this.screenFlashAlpha = 0;
    }

    // Update screen shake
    if (this.screenShakeIntensity > 0) {
      this.screenShakeX = (Math.random() - 0.5) * this.screenShakeIntensity;
      this.screenShakeY = (Math.random() - 0.5) * this.screenShakeIntensity;
      this.screenShakeIntensity *= 0.9;
      if (this.screenShakeIntensity < 0.5) {
        this.screenShakeIntensity = 0;
        this.screenShakeX = 0;
        this.screenShakeY = 0;
      }
    }

    // Decay chromatic aberration
    if (this.chromaticIntensity > 0) {
      this.chromaticIntensity *= 0.92;
      if (this.chromaticIntensity < 0.05) this.chromaticIntensity = 0;
    }

    // Decay energy field pulse
    if (this.energyFieldPulse > 0) {
      this.energyFieldPulse *= 0.95;
      if (this.energyFieldPulse < 0.05) this.energyFieldPulse = 0;
    }

    // Update food burst particles
    for (let i = this.foodBurstParticles.length - 1; i >= 0; i--) {
      const p = this.foodBurstParticles[i];
      // Store trail position
      p.trail.unshift({ x: p.x, y: p.y });
      if (p.trail.length > 6) p.trail.pop();
      // Update position
      p.x += p.vx;
      p.y += p.vy;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.life -= 0.025;
      if (p.life <= 0) {
        this.foodBurstParticles.splice(i, 1);
      }
    }
  }

  private spawnTrailParticles(x: number, y: number): void {
    if (this.trailParticles.length >= MAX_TRAIL_PARTICLES) return;
    // Spawn 2-3 particles per movement
    const count = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.2 + Math.random() * 0.4;
      this.trailParticles.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 8,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 25 + Math.random() * 15,
        size: 2 + Math.random() * 3,
        hue: this.hueOffset + Math.random() * 30,
      });
    }
  }

  updateGameState(state: GameState): void {
    // Detect food eaten - snake got longer
    if (this.currentState && state.snake.length > this.lastSnakeLength) {
      const head = state.snake[0];
      const headX = head.x * CELL_SIZE + CELL_SIZE / 2;
      const headY = head.y * CELL_SIZE + CELL_SIZE / 2;
      this.spawnShockWave(headX, headY);
      this.spawnLightningBurst(headX, headY);
      this.spawnFoodBurst(headX, headY);
      this.screenFlashAlpha = 0.6; // Trigger screen flash
      this.chromaticIntensity = 1.0; // Trigger chromatic aberration pulse
      this.energyFieldPulse = 1.0; // Trigger energy field expansion
    }
    this.lastSnakeLength = state.snake.length;

    // Create afterimage when snake moves
    if (this.currentState && state.snake.length > 0) {
      const oldHead = this.currentState.snake[0];
      const newHead = state.snake[0];
      if (oldHead && newHead && (oldHead.x !== newHead.x || oldHead.y !== newHead.y)) {
        this.spawnAfterimage(this.currentState.snake);
      }
    }

    // Detect game over transition
    if (state.gameOver && this.currentState && !this.currentState.gameOver) {
      this.screenShakeIntensity = 15; // Trigger screen shake on death
      this.chromaticIntensity = 2.0; // Strong chromatic aberration on death
      this.spawnDeathExplosion(); // Dramatic death explosion
    }

    this.currentState = state;
    this.needsRedraw = true;
    if (!state.gameOver) {
      this.gameOverAlpha = 0;
      this.gameOverGlitchOffset = 0;
      this.screenShakeIntensity = 0;
    }
  }

  private spawnShockWave(x: number, y: number): void {
    if (this.shockWaves.length >= MAX_SHOCKWAVES) {
      this.shockWaves.shift();
    }
    this.shockWaves.push({
      x,
      y,
      radius: 5,
      maxRadius: CELL_SIZE * 3,
      life: 1,
    });
  }

  private spawnAfterimage(snake: Position[]): void {
    if (this.snakeAfterimages.length >= MAX_AFTERIMAGES) {
      this.snakeAfterimages.shift();
    }
    this.snakeAfterimages.push({
      segments: snake.map(s => ({ x: s.x, y: s.y })),
      life: 1,
      maxLife: 12,
      hueOffset: this.hueOffset,
    });
  }

  private spawnLightningBurst(x: number, y: number): void {
    const numBolts = 3 + Math.floor(Math.random() * 2);
    for (let i = 0; i < numBolts; i++) {
      if (this.lightningBolts.length >= MAX_LIGHTNING_BOLTS) {
        this.lightningBolts.shift();
      }
      const angle = (Math.PI * 2 * i) / numBolts + Math.random() * 0.5;
      const length = 30 + Math.random() * 40;
      const endX = x + Math.cos(angle) * length;
      const endY = y + Math.sin(angle) * length;
      this.lightningBolts.push({
        points: this.generateLightningPath(x, y, endX, endY),
        life: 1,
        maxLife: 15 + Math.random() * 10,
        hue: this.hueOffset + Math.random() * 60,
      });
    }
  }

  private generateLightningPath(x1: number, y1: number, x2: number, y2: number): { x: number; y: number }[] {
    const points: { x: number; y: number }[] = [{ x: x1, y: y1 }];
    const segments = 4 + Math.floor(Math.random() * 3);
    const dx = (x2 - x1) / segments;
    const dy = (y2 - y1) / segments;

    for (let i = 1; i < segments; i++) {
      const jitter = 8;
      points.push({
        x: x1 + dx * i + (Math.random() - 0.5) * jitter,
        y: y1 + dy * i + (Math.random() - 0.5) * jitter,
      });
    }
    points.push({ x: x2, y: y2 });
    return points;
  }

  private spawnFoodBurst(x: number, y: number): void {
    // Clear old particles and spawn new dramatic burst
    this.foodBurstParticles = [];
    const numParticles = MAX_BURST_PARTICLES;
    for (let i = 0; i < numParticles; i++) {
      const angle = (i / numParticles) * Math.PI * 2 + Math.random() * 0.3;
      const speed = 3 + Math.random() * 4;
      this.foodBurstParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        size: 3 + Math.random() * 4,
        hue: this.hueOffset + Math.random() * 60,
        trail: [],
      });
    }
  }

  update(): void {
    this.frameCount++;
    this.hueOffset = (this.hueOffset + 0.5) % 360;
    this.updateParticles();

    // Spawn trail particles when snake moves
    if (this.currentState && this.currentState.snake.length > 0) {
      const head = this.currentState.snake[0];
      const headX = head.x * CELL_SIZE + CELL_SIZE / 2;
      const headY = head.y * CELL_SIZE + CELL_SIZE / 2;
      if (this.lastHeadPos && (this.lastHeadPos.x !== head.x || this.lastHeadPos.y !== head.y)) {
        this.spawnTrailParticles(headX, headY);
      }
      this.lastHeadPos = { x: head.x, y: head.y };
    }

    // Always redraw for animations (stars, particles, pulsing)
    const g = this.graphics;
    g.clear();

    // Apply screen shake offset
    if (this.screenShakeIntensity > 0) {
      g.setPosition(this.screenShakeX, this.screenShakeY);
    } else {
      g.setPosition(0, 0);
    }

    const width = this.scale.width;
    const height = this.scale.height;

    // Deep space background with gradient effect
    g.fillStyle(COLORS.bgDark, 1);
    g.fillRect(0, 0, width, height);

    // Nebula clouds (deepest layer)
    this.drawNebulaClouds(g, width, height);

    // Cosmic vortex in center
    this.drawVortex(g, width, height);

    // Animated plasma waves in background
    this.drawPlasmaWaves(g, width, height);

    // Meteor shower
    this.updateMeteors(width, height);
    this.drawMeteors(g);

    // Aurora borealis waves
    this.drawAuroraWaves(g, width);

    // Radial gradient effect in center (lighter area)
    const centerGradientAlpha = 0.12 + Math.sin(this.frameCount * 0.02) * 0.04;
    g.fillStyle(COLORS.bgMid, centerGradientAlpha);
    g.fillCircle(width / 2, height / 2, width * 0.6);

    // Animated star field
    this.drawStars(g);

    // Grid with pulsing accent lines
    this.drawGrid(g, width, height);

    if (!this.currentState) return;

    // Draw trail particles (behind everything else)
    this.drawTrailParticles(g);

    // Draw shockwaves (behind food and snake)
    this.drawShockWaves(g);

    // Draw snake afterimages (ghost trail)
    this.drawSnakeAfterimages(g);

    // Food with enhanced glow, particles and energy tendrils
    this.drawFood(g);

    // Snake with trail and scale effects
    this.drawSnake(g);

    // Draw energy field around snake (pulsing aura)
    this.drawEnergyField(g);

    // Draw electric arcs between snake segments
    this.drawSnakeElectricity(g);

    // Draw lightning bolts (on top)
    this.drawLightningBolts(g);

    // Draw food burst particles (dramatic on-eat effect)
    this.drawFoodBurst(g);

    // Draw chromatic aberration overlay on snake
    if (this.chromaticIntensity > 0) {
      this.drawChromaticAberration(g);
    }

    // Screen flash effect (on eating food)
    if (this.screenFlashAlpha > 0) {
      g.fillStyle(COLORS.screenFlash, this.screenFlashAlpha * 0.3);
      g.fillRect(0, 0, width, height);
    }

    // Death debris particles
    this.updateDeathDebris();
    this.drawDeathDebris(g);

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

  private drawMeteors(g: Phaser.GameObjects.Graphics): void {
    for (const m of this.meteors) {
      const meteorColor = this.hslToRgb(m.hue / 360, 0.9, 0.6);
      const coreColor = this.hslToRgb(m.hue / 360, 0.6, 0.9);

      // Draw trail (oldest to newest for proper layering)
      for (let i = m.trail.length - 1; i >= 0; i--) {
        const t = m.trail[i];
        const trailProgress = 1 - i / m.trail.length;
        const trailAlpha = t.alpha * trailProgress * 0.4;
        const trailSize = m.size * trailProgress * 0.6;

        g.fillStyle(meteorColor, trailAlpha);
        g.fillCircle(t.x, t.y, trailSize);
      }

      // Outer glow
      g.fillStyle(meteorColor, m.alpha * 0.3);
      g.fillCircle(m.x, m.y, m.size * 2);

      // Main meteor body
      g.fillStyle(meteorColor, m.alpha * 0.8);
      g.fillCircle(m.x, m.y, m.size);

      // Bright core
      g.fillStyle(coreColor, m.alpha);
      g.fillCircle(m.x, m.y, m.size * 0.5);
    }
  }

  private drawDeathDebris(g: Phaser.GameObjects.Graphics): void {
    // Draw explosion flash at the beginning
    if (this.deathExplosionPhase > 0.7) {
      const flashAlpha = (this.deathExplosionPhase - 0.7) * 2;
      g.fillStyle(0xffffff, flashAlpha * 0.4);
      g.fillRect(0, 0, GRID_SIZE * CELL_SIZE, GRID_SIZE * CELL_SIZE);
    }

    for (const d of this.deathDebris) {
      const color = this.hslToRgb(d.hue / 360, 0.9, 0.6);
      const alpha = d.life * 0.9;

      g.save();

      if (d.type === 'shard') {
        // Draw triangular shards
        const cx = d.x;
        const cy = d.y;
        const size = d.size * d.life;

        // Calculate rotated triangle points
        const cos = Math.cos(d.rotation);
        const sin = Math.sin(d.rotation);

        const p1x = cx + cos * size;
        const p1y = cy + sin * size;
        const p2x = cx + cos * (-size * 0.5) - sin * (size * 0.7);
        const p2y = cy + sin * (-size * 0.5) + cos * (size * 0.7);
        const p3x = cx + cos * (-size * 0.5) - sin * (-size * 0.7);
        const p3y = cy + sin * (-size * 0.5) + cos * (-size * 0.7);

        // Glow
        g.fillStyle(color, alpha * 0.4);
        g.fillCircle(cx, cy, size * 1.5);

        // Shard body
        g.fillStyle(color, alpha);
        g.fillTriangle(p1x, p1y, p2x, p2y, p3x, p3y);

        // Highlight edge
        g.lineStyle(1, 0xffffff, alpha * 0.6);
        g.lineBetween(p1x, p1y, p2x, p2y);

      } else if (d.type === 'spark') {
        // Draw elongated spark
        const sparkLength = d.size * 2 * d.life;
        const sparkWidth = d.size * 0.3 * d.life;

        // Direction based on velocity
        const vLen = Math.sqrt(d.vx * d.vx + d.vy * d.vy);
        const nx = vLen > 0 ? d.vx / vLen : 1;
        const ny = vLen > 0 ? d.vy / vLen : 0;

        // Glow
        g.fillStyle(color, alpha * 0.3);
        g.fillCircle(d.x, d.y, sparkLength * 0.8);

        // Spark line
        g.lineStyle(sparkWidth * 2, color, alpha * 0.6);
        g.lineBetween(d.x - nx * sparkLength, d.y - ny * sparkLength, d.x, d.y);

        // Bright tip
        g.lineStyle(sparkWidth, 0xffffff, alpha);
        g.lineBetween(d.x - nx * sparkLength * 0.3, d.y - ny * sparkLength * 0.3, d.x, d.y);

      } else {
        // Ember - glowing circle
        const emberSize = d.size * d.life;

        // Outer glow
        g.fillStyle(color, alpha * 0.2);
        g.fillCircle(d.x, d.y, emberSize * 2);

        // Mid glow
        g.fillStyle(color, alpha * 0.5);
        g.fillCircle(d.x, d.y, emberSize * 1.3);

        // Core
        g.fillStyle(color, alpha);
        g.fillCircle(d.x, d.y, emberSize);

        // Hot center
        g.fillStyle(0xffffff, alpha * 0.7);
        g.fillCircle(d.x, d.y, emberSize * 0.4);
      }

      g.restore();
    }
  }

  private drawNebulaClouds(g: Phaser.GameObjects.Graphics, width: number, height: number): void {
    for (const cloud of this.nebulaClouds) {
      // Update cloud position (slow drift)
      cloud.x += cloud.driftX;
      cloud.y += cloud.driftY;
      cloud.pulsePhase += cloud.pulseSpeed;

      // Wrap around edges
      if (cloud.x < -cloud.radius) cloud.x = width + cloud.radius;
      if (cloud.x > width + cloud.radius) cloud.x = -cloud.radius;
      if (cloud.y < -cloud.radius) cloud.y = height + cloud.radius;
      if (cloud.y > height + cloud.radius) cloud.y = -cloud.radius;

      // Pulsing alpha
      const pulseAlpha = cloud.alpha * (0.7 + Math.sin(cloud.pulsePhase) * 0.3);
      const color = this.hslToRgb(cloud.hue / 360, 0.6, 0.3);

      // Draw multiple concentric layers for soft cloud effect
      const layers = 4;
      for (let i = layers; i > 0; i--) {
        const layerRadius = cloud.radius * (i / layers);
        const layerAlpha = pulseAlpha * (1 - i / (layers + 1)) * 0.6;
        g.fillStyle(color, layerAlpha);
        g.fillCircle(cloud.x, cloud.y, layerRadius);
      }

      // Core glow
      const coreColor = this.hslToRgb(cloud.hue / 360, 0.8, 0.5);
      g.fillStyle(coreColor, pulseAlpha * 0.4);
      g.fillCircle(cloud.x, cloud.y, cloud.radius * 0.3);
    }
  }

  private drawVortex(g: Phaser.GameObjects.Graphics, width: number, height: number): void {
    const centerX = width / 2;
    const centerY = height / 2;

    // Update vortex pulse
    this.vortexPulse += 0.03;
    const globalPulse = 0.8 + Math.sin(this.vortexPulse) * 0.2;

    // Draw outer glow/halo
    const outerGlowColor = this.hslToRgb(280 / 360, 0.7, 0.3);
    g.fillStyle(outerGlowColor, 0.08 * globalPulse);
    g.fillCircle(centerX, centerY, 120);
    g.fillStyle(outerGlowColor, 0.05 * globalPulse);
    g.fillCircle(centerX, centerY, 140);

    // Draw orbiting particles (behind rings)
    for (const particle of this.vortexParticles) {
      // Update particle position - spiral inward slightly then reset
      particle.angle += particle.speed;
      particle.radius = particle.baseRadius + Math.sin(particle.angle * 3) * 8;

      const px = centerX + Math.cos(particle.angle) * particle.radius;
      const py = centerY + Math.sin(particle.angle) * particle.radius;

      // Particle hue shifts over time
      particle.hue = (particle.hue + 0.5) % 360;
      const particleColor = this.hslToRgb(particle.hue / 360, 0.8, 0.6);

      // Draw particle with trail
      const trailAngle = particle.angle - 0.3;
      const trailX = centerX + Math.cos(trailAngle) * particle.radius;
      const trailY = centerY + Math.sin(trailAngle) * particle.radius;

      g.lineStyle(particle.size * 0.8, particleColor, particle.alpha * 0.3 * globalPulse);
      g.lineBetween(trailX, trailY, px, py);

      g.fillStyle(particleColor, particle.alpha * globalPulse);
      g.fillCircle(px, py, particle.size);

      // Bright core
      g.fillStyle(0xffffff, particle.alpha * 0.5 * globalPulse);
      g.fillCircle(px, py, particle.size * 0.4);
    }

    // Draw rotating rings
    for (const ring of this.vortexRings) {
      ring.rotationOffset += ring.rotationSpeed;
      ring.pulsePhase += 0.02;

      const ringPulse = 0.7 + Math.sin(ring.pulsePhase) * 0.3;
      const adjustedRadius = ring.baseRadius * (0.95 + ringPulse * 0.1);

      const ringColor = this.hslToRgb(ring.hue / 360, 0.8, 0.5);

      // Draw ring as series of arc segments with gaps
      const segments = 6;
      const arcLength = (Math.PI * 2) / segments * 0.7;

      for (let i = 0; i < segments; i++) {
        const startAngle = ring.rotationOffset + (i * Math.PI * 2) / segments;
        const endAngle = startAngle + arcLength;

        // Calculate alpha based on segment position for 3D effect
        const segmentAlpha = 0.15 + Math.sin(startAngle + this.frameCount * 0.02) * 0.1;

        g.lineStyle(ring.thickness, ringColor, segmentAlpha * ringPulse * globalPulse);
        g.beginPath();
        g.arc(centerX, centerY, adjustedRadius, startAngle, endAngle, false);
        g.strokePath();
      }

      // Inner glow line
      g.lineStyle(ring.thickness * 0.5, 0xffffff, 0.1 * ringPulse * globalPulse);
      g.beginPath();
      g.arc(centerX, centerY, adjustedRadius - 1, ring.rotationOffset, ring.rotationOffset + Math.PI, false);
      g.strokePath();
    }

    // Central dark core (event horizon)
    g.fillStyle(0x000000, 0.9);
    g.fillCircle(centerX, centerY, 12);
    g.fillStyle(0x000000, 0.7);
    g.fillCircle(centerX, centerY, 18);
    g.fillStyle(0x000000, 0.4);
    g.fillCircle(centerX, centerY, 25);

    // Bright accretion ring at edge of event horizon
    const accretionHue = (this.frameCount * 2) % 360;
    const accretionColor = this.hslToRgb(accretionHue / 360, 1, 0.6);
    g.lineStyle(2, accretionColor, 0.4 * globalPulse);
    g.strokeCircle(centerX, centerY, 14);
    g.lineStyle(1, 0xffffff, 0.3 * globalPulse);
    g.strokeCircle(centerX, centerY, 13);

    // Gravitational lensing effect - distorted light streaks
    const numStreaks = 4;
    for (let i = 0; i < numStreaks; i++) {
      const streakAngle = (i * Math.PI * 2) / numStreaks + this.frameCount * 0.01;
      const streakHue = (accretionHue + i * 60) % 360;
      const streakColor = this.hslToRgb(streakHue / 360, 0.9, 0.7);

      const innerRadius = 20;
      const outerRadius = 35 + Math.sin(this.frameCount * 0.05 + i) * 10;

      const x1 = centerX + Math.cos(streakAngle) * innerRadius;
      const y1 = centerY + Math.sin(streakAngle) * innerRadius;
      const x2 = centerX + Math.cos(streakAngle + 0.2) * outerRadius;
      const y2 = centerY + Math.sin(streakAngle + 0.2) * outerRadius;

      g.lineStyle(3, streakColor, 0.15 * globalPulse);
      g.lineBetween(x1, y1, x2, y2);
      g.lineStyle(1.5, 0xffffff, 0.2 * globalPulse);
      g.lineBetween(x1, y1, x2, y2);
    }
  }

  private drawAuroraWaves(g: Phaser.GameObjects.Graphics, width: number): void {
    for (const aurora of this.auroraWaves) {
      aurora.phase += aurora.speed;

      // Draw multiple ribbon layers for each aurora
      const ribbonLayers = 3;
      for (let layer = 0; layer < ribbonLayers; layer++) {
        const layerOffset = layer * 5;
        const layerAlpha = 0.06 - layer * 0.015;

        // Calculate shifting hue for color variation
        const shiftedHue = (aurora.hue + Math.sin(aurora.phase * 0.5) * 20) % 360;
        const color = this.hslToRgb(shiftedHue / 360, 0.7, 0.5);

        // Draw aurora as a series of connected curves
        g.fillStyle(color, layerAlpha);
        const step = 4;
        for (let x = 0; x < width; x += step) {
          // Multiple sine waves combined for organic movement
          const wave1 = Math.sin(x * 0.02 + aurora.phase) * aurora.amplitude;
          const wave2 = Math.sin(x * 0.035 + aurora.phase * 1.3) * aurora.amplitude * 0.5;
          const wave3 = Math.sin(x * 0.01 + aurora.phase * 0.7) * aurora.amplitude * 0.3;
          const yOffset = wave1 + wave2 + wave3;

          const segmentY = aurora.y + yOffset + layerOffset;
          const thickness = aurora.thickness * (0.7 + Math.sin(x * 0.05 + aurora.phase) * 0.3);

          g.fillRect(x, segmentY - thickness / 2, step + 1, thickness);
        }
      }

      // Add bright core line
      const coreHue = (aurora.hue + 40) % 360;
      const coreColor = this.hslToRgb(coreHue / 360, 0.9, 0.7);
      g.lineStyle(1.5, coreColor, 0.15);
      g.beginPath();
      for (let x = 0; x < width; x += 3) {
        const wave1 = Math.sin(x * 0.02 + aurora.phase) * aurora.amplitude;
        const wave2 = Math.sin(x * 0.035 + aurora.phase * 1.3) * aurora.amplitude * 0.5;
        const y = aurora.y + wave1 + wave2;
        if (x === 0) {
          g.moveTo(x, y);
        } else {
          g.lineTo(x, y);
        }
      }
      g.strokePath();
    }
  }

  private drawPlasmaWaves(g: Phaser.GameObjects.Graphics, width: number, height: number): void {
    for (const wave of this.plasmaWaves) {
      wave.phase += wave.speed;
      const color = this.hslToRgb(wave.hue / 360, 0.7, 0.4);

      // Draw flowing plasma lines
      for (let y = 0; y < height; y += 8) {
        const waveOffset = Math.sin(y / wave.wavelength + wave.phase) * wave.amplitude;
        const intensity = 0.03 + Math.sin(wave.phase + y * 0.01) * 0.02;

        g.fillStyle(color, intensity);
        const x1 = width / 2 + waveOffset - 40;
        const x2 = width / 2 + waveOffset + 40;
        g.fillRect(x1, y, x2 - x1, 2);
      }
    }
  }

  private drawSnakeAfterimages(g: Phaser.GameObjects.Graphics): void {
    for (const ai of this.snakeAfterimages) {
      const alpha = ai.life * 0.25;
      for (let i = 0; i < ai.segments.length; i++) {
        const seg = ai.segments[i];
        const centerX = seg.x * CELL_SIZE + CELL_SIZE / 2;
        const centerY = seg.y * CELL_SIZE + CELL_SIZE / 2;
        const t = ai.segments.length > 1 ? i / (ai.segments.length - 1) : 1;
        const radius = (CELL_SIZE / 2 - 2) * (0.7 + t * 0.2);

        const segmentHue = (ai.hueOffset + i * 15) % 360;
        const color = this.hslToRgb(segmentHue / 360, 0.6, 0.4);

        g.fillStyle(color, alpha * t);
        g.fillCircle(centerX, centerY, radius);
      }
    }
  }

  private drawTrailParticles(g: Phaser.GameObjects.Graphics): void {
    for (const p of this.trailParticles) {
      const color = this.hslToRgb(p.hue / 360, 0.8, 0.6);
      // Outer glow
      g.fillStyle(color, p.life * 0.3);
      g.fillCircle(p.x, p.y, p.size * 1.5 * p.life);
      // Core
      g.fillStyle(color, p.life * 0.7);
      g.fillCircle(p.x, p.y, p.size * p.life);
    }
  }

  private drawShockWaves(g: Phaser.GameObjects.Graphics): void {
    for (const sw of this.shockWaves) {
      const alpha = sw.life * 0.6;
      // Outer ring
      g.lineStyle(3, 0xffffff, alpha * 0.3);
      g.strokeCircle(sw.x, sw.y, sw.radius);
      // Inner bright ring
      g.lineStyle(2, 0x00ffff, alpha * 0.7);
      g.strokeCircle(sw.x, sw.y, sw.radius * 0.8);
      // Core flash
      if (sw.life > 0.8) {
        g.fillStyle(0xffffff, (sw.life - 0.8) * 3);
        g.fillCircle(sw.x, sw.y, sw.radius * 0.3);
      }
    }
  }

  private drawLightningBolts(g: Phaser.GameObjects.Graphics): void {
    for (const bolt of this.lightningBolts) {
      const color = this.hslToRgb(bolt.hue / 360, 0.9, 0.7);
      const alpha = bolt.life;

      // Glow layer
      g.lineStyle(4, color, alpha * 0.3);
      this.drawLightningPath(g, bolt.points);

      // Core layer
      g.lineStyle(2, 0xffffff, alpha * 0.8);
      this.drawLightningPath(g, bolt.points);
    }
  }

  private drawLightningPath(g: Phaser.GameObjects.Graphics, points: { x: number; y: number }[]): void {
    if (points.length < 2) return;
    g.beginPath();
    g.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      g.lineTo(points[i].x, points[i].y);
    }
    g.strokePath();
  }

  private drawSnakeElectricity(g: Phaser.GameObjects.Graphics): void {
    if (!this.currentState) return;
    const snake = this.currentState.snake;
    if (snake.length < 2) return;

    // Draw electric arcs between segments every few frames
    if (this.frameCount % 3 !== 0) return;

    for (let i = 0; i < snake.length - 1; i++) {
      // Only draw arcs occasionally for visual interest
      if (Math.random() > 0.4) continue;

      const seg1 = snake[i];
      const seg2 = snake[i + 1];
      const x1 = seg1.x * CELL_SIZE + CELL_SIZE / 2;
      const y1 = seg1.y * CELL_SIZE + CELL_SIZE / 2;
      const x2 = seg2.x * CELL_SIZE + CELL_SIZE / 2;
      const y2 = seg2.y * CELL_SIZE + CELL_SIZE / 2;

      // Generate a mini lightning arc
      const arcPoints = this.generateLightningPath(x1, y1, x2, y2);
      const arcHue = (this.hueOffset + i * 15) % 360;
      const arcColor = this.hslToRgb(arcHue / 360, 0.9, 0.7);

      // Glow
      g.lineStyle(3, arcColor, 0.4);
      this.drawLightningPath(g, arcPoints);
      // Core
      g.lineStyle(1, 0xffffff, 0.8);
      this.drawLightningPath(g, arcPoints);
    }
  }

  private hslToRgb(h: number, s: number, l: number): number {
    let r: number, g: number, b: number;
    if (s === 0) {
      r = g = b = l;
    } else {
      const hue2rgb = (p: number, q: number, t: number): number => {
        if (t < 0) t += 1;
        if (t > 1) t -= 1;
        if (t < 1 / 6) return p + (q - p) * 6 * t;
        if (t < 1 / 2) return q;
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
        return p;
      };
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1 / 3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1 / 3);
    }
    return (Math.round(r * 255) << 16) | (Math.round(g * 255) << 8) | Math.round(b * 255);
  }

  private drawGrid(g: Phaser.GameObjects.Graphics, width: number, height: number): void {
    // Main grid lines with subtle glow
    g.lineStyle(1, COLORS.gridLine, 0.15);
    for (let i = 0; i <= GRID_SIZE; i++) {
      g.lineBetween(i * CELL_SIZE, 0, i * CELL_SIZE, height);
      g.lineBetween(0, i * CELL_SIZE, width, i * CELL_SIZE);
    }

    // Pulsing accent lines every 5 cells
    const accentPulse = 0.25 + Math.sin(this.frameCount * 0.05) * 0.12;
    g.lineStyle(1.5, COLORS.gridAccent, accentPulse);
    for (let i = 0; i <= GRID_SIZE; i += 5) {
      g.lineBetween(i * CELL_SIZE, 0, i * CELL_SIZE, height);
      g.lineBetween(0, i * CELL_SIZE, width, i * CELL_SIZE);
    }

    // Diagonal accent lines for cyberpunk feel
    const diagPulse = 0.08 + Math.sin(this.frameCount * 0.03 + 1) * 0.04;
    g.lineStyle(1, COLORS.gridAccent, diagPulse);
    // Draw from corners
    g.lineBetween(0, 0, width * 0.15, height * 0.15);
    g.lineBetween(width, 0, width * 0.85, height * 0.15);
    g.lineBetween(0, height, width * 0.15, height * 0.85);
    g.lineBetween(width, height, width * 0.85, height * 0.85);

    // Animated scanning line
    const scanY = (this.frameCount * 2) % (height + 40) - 20;
    const scanAlpha = 0.15 + Math.sin(this.frameCount * 0.1) * 0.05;
    g.lineStyle(2, 0x00ffff, scanAlpha);
    g.lineBetween(0, scanY, width, scanY);
    // Glow around scan line
    g.fillStyle(0x00ffff, scanAlpha * 0.3);
    g.fillRect(0, scanY - 3, width, 6);
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

    // Draw energy tendrils reaching toward snake head
    this.drawEnergyTendrils(g, foodX, foodY);

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

    // Inner plasma swirl
    const swirlAngle = this.frameCount * 0.1;
    for (let i = 0; i < 3; i++) {
      const angle = swirlAngle + (i * Math.PI * 2) / 3;
      const dist = 4 * pulseScale;
      const swirlX = foodX + Math.cos(angle) * dist;
      const swirlY = foodY + Math.sin(angle) * dist;
      g.fillStyle(0xffffff, 0.6);
      g.fillCircle(swirlX, swirlY, 1.5);
    }
  }

  private drawEnergyTendrils(g: Phaser.GameObjects.Graphics, foodX: number, foodY: number): void {
    if (!this.currentState || this.currentState.snake.length === 0) return;

    const head = this.currentState.snake[0];
    const headX = head.x * CELL_SIZE + CELL_SIZE / 2;
    const headY = head.y * CELL_SIZE + CELL_SIZE / 2;

    // Calculate distance to snake head
    const dx = headX - foodX;
    const dy = headY - foodY;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Only draw tendrils when snake is somewhat close
    if (dist > CELL_SIZE * 6) return;

    // Intensity increases as snake gets closer
    const intensity = 1 - dist / (CELL_SIZE * 6);
    const numTendrils = 2 + Math.floor(intensity * 2);

    for (let i = 0; i < numTendrils; i++) {
      // Tendril reaches partway toward the snake
      const reach = 0.3 + intensity * 0.4;
      const targetX = foodX + dx * reach;
      const targetY = foodY + dy * reach;

      // Add some wave offset for each tendril
      const waveOffset = Math.sin(this.frameCount * 0.15 + i * 2) * 10;
      const perpX = -dy / dist;
      const perpY = dx / dist;
      const wavyTargetX = targetX + perpX * waveOffset * (1 - reach);
      const wavyTargetY = targetY + perpY * waveOffset * (1 - reach);

      // Generate tendril path
      const points = this.generateLightningPath(foodX, foodY, wavyTargetX, wavyTargetY);

      // Draw tendril with glow
      g.lineStyle(3, COLORS.foodGlow, intensity * 0.3);
      this.drawLightningPath(g, points);
      g.lineStyle(1.5, COLORS.food, intensity * 0.7);
      this.drawLightningPath(g, points);
      g.lineStyle(1, 0xffffff, intensity * 0.5);
      this.drawLightningPath(g, points);
    }
  }

  private drawSnake(g: Phaser.GameObjects.Graphics): void {
    if (!this.currentState) return;

    const snake = this.currentState.snake;
    const snakeLen = snake.length;

    // Draw trailing glow first (behind snake) with rainbow colors
    for (let i = snakeLen - 1; i >= 0; i--) {
      const segment = snake[i];
      const centerX = segment.x * CELL_SIZE + CELL_SIZE / 2;
      const centerY = segment.y * CELL_SIZE + CELL_SIZE / 2;
      const t = snakeLen > 1 ? i / (snakeLen - 1) : 1;
      const glowAlpha = 0.2 * t;
      const glowSize = (CELL_SIZE / 2 + 4) * (0.5 + t * 0.5);

      // Rainbow glow matching segment color
      const segmentHue = (this.hueOffset + (i * 15)) % 360;
      const glowColor = this.hslToRgb(segmentHue / 360, 0.9, 0.6);
      g.fillStyle(glowColor, glowAlpha);
      g.fillCircle(centerX, centerY, glowSize);
    }

    // Draw snake segments from tail to head with rainbow gradient
    for (let i = snakeLen - 1; i >= 0; i--) {
      const segment = snake[i];
      const centerX = segment.x * CELL_SIZE + CELL_SIZE / 2;
      const centerY = segment.y * CELL_SIZE + CELL_SIZE / 2;

      const t = snakeLen > 1 ? i / (snakeLen - 1) : 1;
      const radius = (CELL_SIZE / 2 - 1) * (0.85 + t * 0.15);

      // Head has special treatment
      if (i === 0) {
        // Dynamic head color cycling through hues
        const headHue = (this.hueOffset + 120) % 360;
        const headColor = this.hslToRgb(headHue / 360, 0.9, 0.55);

        // Head glow
        g.fillStyle(headColor, 0.4);
        g.fillCircle(centerX, centerY, radius + 5);

        // Head base
        g.fillStyle(headColor, 1);
        g.fillCircle(centerX, centerY, radius + 1);

        // Head highlight
        g.fillStyle(0xffffff, 0.5);
        g.fillCircle(centerX - 2, centerY - 2, radius * 0.4);

        this.drawSnakeHead(g, segment, snake[1]);
      } else {
        // Body segment with rainbow gradient based on position
        const segmentHue = (this.hueOffset + (i * 15)) % 360;
        const segmentColor = this.hslToRgb(segmentHue / 360, 0.8, 0.5);

        // Body segment glow
        g.fillStyle(segmentColor, 0.3);
        g.fillCircle(centerX, centerY, radius + 2);

        // Body segment
        g.fillStyle(segmentColor, 1);
        g.fillCircle(centerX, centerY, radius);

        // Highlight on each segment
        g.fillStyle(0xffffff, 0.25 * t);
        g.fillCircle(centerX - 1, centerY - 1, radius * 0.3);
      }
    }

  }

  private drawFoodBurst(g: Phaser.GameObjects.Graphics): void {
    for (const p of this.foodBurstParticles) {
      const color = this.hslToRgb(p.hue / 360, 1, 0.6);

      // Draw trail
      for (let i = 0; i < p.trail.length; i++) {
        const t = p.trail[i];
        const trailAlpha = p.life * 0.5 * (1 - i / p.trail.length);
        const trailSize = p.size * p.life * (1 - i / p.trail.length);
        g.fillStyle(color, trailAlpha);
        g.fillCircle(t.x, t.y, trailSize);
      }

      // Draw particle core with bright center
      g.fillStyle(color, p.life * 0.8);
      g.fillCircle(p.x, p.y, p.size * p.life);
      g.fillStyle(0xffffff, p.life * 0.9);
      g.fillCircle(p.x, p.y, p.size * p.life * 0.4);
    }
  }

  private drawEnergyField(g: Phaser.GameObjects.Graphics): void {
    if (!this.currentState || this.currentState.snake.length === 0) return;

    const snake = this.currentState.snake;
    const baseIntensity = 0.08 + this.energyFieldPulse * 0.3;
    const pulseOffset = Math.sin(this.frameCount * 0.1) * 0.03;
    const alpha = Math.min(0.4, baseIntensity + pulseOffset);

    // Draw energy field around entire snake
    for (let i = 0; i < snake.length; i++) {
      const seg = snake[i];
      const cx = seg.x * CELL_SIZE + CELL_SIZE / 2;
      const cy = seg.y * CELL_SIZE + CELL_SIZE / 2;

      // Larger pulsing field around each segment
      const fieldRadius = CELL_SIZE * (0.8 + this.energyFieldPulse * 0.6) + Math.sin(this.frameCount * 0.15 + i * 0.5) * 3;
      const segmentHue = (this.hueOffset + i * 15) % 360;
      const fieldColor = this.hslToRgb(segmentHue / 360, 0.7, 0.5);

      // Outer glow
      g.fillStyle(fieldColor, alpha * 0.3);
      g.fillCircle(cx, cy, fieldRadius + 4);

      // Inner field
      g.fillStyle(fieldColor, alpha * 0.5);
      g.fillCircle(cx, cy, fieldRadius);
    }

    // Additional connecting energy arcs when pulse is active
    if (this.energyFieldPulse > 0.3 && snake.length > 1) {
      for (let i = 0; i < snake.length - 1; i++) {
        const seg1 = snake[i];
        const seg2 = snake[i + 1];
        const x1 = seg1.x * CELL_SIZE + CELL_SIZE / 2;
        const y1 = seg1.y * CELL_SIZE + CELL_SIZE / 2;
        const x2 = seg2.x * CELL_SIZE + CELL_SIZE / 2;
        const y2 = seg2.y * CELL_SIZE + CELL_SIZE / 2;

        const arcHue = (this.hueOffset + i * 15 + 30) % 360;
        const arcColor = this.hslToRgb(arcHue / 360, 0.9, 0.7);

        g.lineStyle(3, arcColor, this.energyFieldPulse * 0.4);
        g.lineBetween(x1, y1, x2, y2);
        g.lineStyle(1.5, 0xffffff, this.energyFieldPulse * 0.6);
        g.lineBetween(x1, y1, x2, y2);
      }
    }
  }

  private drawChromaticAberration(g: Phaser.GameObjects.Graphics): void {
    if (!this.currentState) return;

    const snake = this.currentState.snake;
    const offset = this.chromaticIntensity * 3;

    // Draw offset colored versions of the snake for RGB split effect
    for (let i = 0; i < snake.length; i++) {
      const seg = snake[i];
      const cx = seg.x * CELL_SIZE + CELL_SIZE / 2;
      const cy = seg.y * CELL_SIZE + CELL_SIZE / 2;
      const t = snake.length > 1 ? i / (snake.length - 1) : 1;
      const radius = (CELL_SIZE / 2 - 1) * (0.85 + t * 0.15);
      const alpha = this.chromaticIntensity * 0.4 * (i === 0 ? 1 : 0.6);

      // Red channel - offset left
      g.fillStyle(0xff0000, alpha);
      g.fillCircle(cx - offset, cy, radius);

      // Blue channel - offset right
      g.fillStyle(0x0000ff, alpha);
      g.fillCircle(cx + offset, cy, radius);

      // Cyan channel - offset up
      g.fillStyle(0x00ffff, alpha * 0.5);
      g.fillCircle(cx, cy - offset * 0.7, radius);
    }
  }

  private drawGameOver(g: Phaser.GameObjects.Graphics, width: number, height: number): void {
    // Animate fade in
    if (this.gameOverAlpha < 0.75) {
      this.gameOverAlpha += 0.04;
    }

    // Glitch effect offset
    this.gameOverGlitchOffset = Math.random() < 0.1 ? (Math.random() - 0.5) * 8 : this.gameOverGlitchOffset * 0.9;

    // Dark overlay
    g.fillStyle(COLORS.gameOverOverlay, this.gameOverAlpha);
    g.fillRect(0, 0, width, height);

    // Scanline effect
    for (let y = 0; y < height; y += 4) {
      g.fillStyle(0x000000, 0.15);
      g.fillRect(0, y, width, 2);
    }

    // Glitch color bars (random horizontal strips)
    if (Math.random() < 0.2) {
      const glitchY = Math.random() * height;
      const glitchHeight = 2 + Math.random() * 6;
      const glitchColor = Math.random() < 0.5 ? 0xff0066 : 0x00ffff;
      g.fillStyle(glitchColor, 0.3);
      g.fillRect(this.gameOverGlitchOffset, glitchY, width, glitchHeight);
    }

    // Pulsing vignette border with glitch
    const vignetteAlpha = 0.4 + Math.sin(this.frameCount * 0.1) * 0.15;
    const borderSize = 5 + Math.sin(this.frameCount * 0.15) * 2;
    g.fillStyle(COLORS.gameOverText, vignetteAlpha * 0.4);
    g.fillRect(this.gameOverGlitchOffset, 0, width, borderSize);
    g.fillRect(this.gameOverGlitchOffset, height - borderSize, width, borderSize);
    g.fillRect(0, 0, borderSize, height);
    g.fillRect(width - borderSize, 0, borderSize, height);

    // Corner flares
    const flareSize = 20 + Math.sin(this.frameCount * 0.08) * 5;
    g.fillStyle(COLORS.gameOverText, vignetteAlpha * 0.6);
    g.fillTriangle(0, 0, flareSize, 0, 0, flareSize);
    g.fillTriangle(width, 0, width - flareSize, 0, width, flareSize);
    g.fillTriangle(0, height, flareSize, height, 0, height - flareSize);
    g.fillTriangle(width, height, width - flareSize, height, width, height - flareSize);
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

    // Draw the royal crown
    this.drawCrown(g, centerX, centerY, dx, dy, perpX, perpY);
  }

  private drawCrown(
    g: Phaser.GameObjects.Graphics,
    headX: number,
    headY: number,
    dx: number,
    dy: number,
    perpX: number,
    perpY: number
  ): void {
    // Crown sits on top/back of the head
    const crownOffset = -8;
    const crownBaseX = headX - dx * crownOffset;
    const crownBaseY = headY - dy * crownOffset;

    // Crown dimensions
    const crownWidth = 14;
    const crownHeight = 10;
    const halfWidth = crownWidth / 2;

    // Animated sparkle
    const sparkle = 0.7 + Math.sin(this.frameCount * 0.15) * 0.3;

    // Calculate crown points based on snake direction
    // The crown base sits perpendicular to movement direction
    const baseLeft = {
      x: crownBaseX + perpX * halfWidth,
      y: crownBaseY + perpY * halfWidth
    };
    const baseRight = {
      x: crownBaseX - perpX * halfWidth,
      y: crownBaseY - perpY * halfWidth
    };

    // Crown points extend opposite to movement direction
    const pointOffset = -dx * crownHeight;
    const pointOffsetY = -dy * crownHeight;

    // Five crown points
    const crownPoints = [
      baseLeft,
      { x: baseLeft.x + pointOffset * 0.4, y: baseLeft.y + pointOffsetY * 0.4 },
      { x: crownBaseX + perpX * (halfWidth * 0.5) + pointOffset * 0.9, y: crownBaseY + perpY * (halfWidth * 0.5) + pointOffsetY * 0.9 },
      { x: crownBaseX + perpX * (halfWidth * 0.25) + pointOffset * 0.5, y: crownBaseY + perpY * (halfWidth * 0.25) + pointOffsetY * 0.5 },
      { x: crownBaseX + pointOffset, y: crownBaseY + pointOffsetY }, // Center point (tallest)
      { x: crownBaseX - perpX * (halfWidth * 0.25) + pointOffset * 0.5, y: crownBaseY - perpY * (halfWidth * 0.25) + pointOffsetY * 0.5 },
      { x: crownBaseX - perpX * (halfWidth * 0.5) + pointOffset * 0.9, y: crownBaseY - perpY * (halfWidth * 0.5) + pointOffsetY * 0.9 },
      { x: baseRight.x + pointOffset * 0.4, y: baseRight.y + pointOffsetY * 0.4 },
      baseRight
    ];

    // Crown glow (golden aura)
    g.fillStyle(0xffd700, 0.3 * sparkle);
    g.fillCircle(crownBaseX + pointOffset * 0.5, crownBaseY + pointOffsetY * 0.5, crownHeight + 4);

    // Crown base (golden)
    g.fillStyle(0xffd700, 1);
    g.beginPath();
    g.moveTo(crownPoints[0].x, crownPoints[0].y);
    for (let i = 1; i < crownPoints.length; i++) {
      g.lineTo(crownPoints[i].x, crownPoints[i].y);
    }
    g.closePath();
    g.fillPath();

    // Crown outline (darker gold)
    g.lineStyle(1.5, 0xb8860b, 1);
    g.beginPath();
    g.moveTo(crownPoints[0].x, crownPoints[0].y);
    for (let i = 1; i < crownPoints.length; i++) {
      g.lineTo(crownPoints[i].x, crownPoints[i].y);
    }
    g.closePath();
    g.strokePath();

    // Crown band (horizontal stripe at base)
    const bandY1 = {
      x: baseLeft.x + pointOffset * 0.15,
      y: baseLeft.y + pointOffsetY * 0.15
    };
    const bandY2 = {
      x: baseRight.x + pointOffset * 0.15,
      y: baseRight.y + pointOffsetY * 0.15
    };
    g.lineStyle(3, 0xdaa520, 1);
    g.lineBetween(bandY1.x, bandY1.y, bandY2.x, bandY2.y);

    // Jewels on crown points
    const jewelPositions = [
      { x: crownBaseX + pointOffset, y: crownBaseY + pointOffsetY, color: 0xff0044, size: 2.5 }, // Center ruby
      { x: crownBaseX + perpX * (halfWidth * 0.5) + pointOffset * 0.9, y: crownBaseY + perpY * (halfWidth * 0.5) + pointOffsetY * 0.9, color: 0x00ff88, size: 2 }, // Emerald
      { x: crownBaseX - perpX * (halfWidth * 0.5) + pointOffset * 0.9, y: crownBaseY - perpY * (halfWidth * 0.5) + pointOffsetY * 0.9, color: 0x4488ff, size: 2 }, // Sapphire
    ];

    for (const jewel of jewelPositions) {
      // Jewel glow
      g.fillStyle(jewel.color, 0.5 * sparkle);
      g.fillCircle(jewel.x, jewel.y, jewel.size + 2);

      // Jewel body
      g.fillStyle(jewel.color, 1);
      g.fillCircle(jewel.x, jewel.y, jewel.size);

      // Jewel highlight
      g.fillStyle(0xffffff, 0.8 * sparkle);
      g.fillCircle(jewel.x - 0.5, jewel.y - 0.5, jewel.size * 0.4);
    }

    // Crown highlight (shiny reflection)
    g.fillStyle(0xffffe0, 0.5 * sparkle);
    g.fillCircle(crownBaseX + perpX * 3 + pointOffset * 0.3, crownBaseY + perpY * 3 + pointOffsetY * 0.3, 2);
  }
}
