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
const NUM_MONSTERS_PER_EDGE = 2;
const MAX_FLAME_PARTICLES = 60;

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

// Monster shadow lurking at edges
interface MonsterShadow {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  size: number;
  phase: number;
  speed: number;
  eyePhase: number;
  tentaclePhase: number;
  edge: 'top' | 'bottom' | 'left' | 'right';
  targetAlpha: number;
  currentAlpha: number;
}

// Flame particle for burning effect
interface FlameParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  hue: number;
  brightness: number;
}

// Color palette - PURPLE INFERNO theme: mystical purple flames, dark sorcery
const COLORS = {
  bgDark: 0x050510,
  bgMid: 0x0a0818,
  gridLine: 0x1a1530,
  gridAccent: 0x2a2050,
  snakeHead: 0xbf40ff,
  snakeBody: 0x9932cc,
  snakeTail: 0x6b238e,
  snakeHighlight: 0xe066ff,
  snakeScale: 0x7a3090,
  snakeEye: 0x00ffff,
  snakePupil: 0x000000,
  snakeGlow: 0xba55d3,
  food: 0x9400d3,
  foodCore: 0xe066ff,
  foodGlow: 0x8b00ff,
  foodParticle: 0xcc99ff,
  star: 0xcc99ff,
  gameOverOverlay: 0x050510,
  gameOverText: 0xe066ff,
  plasma1: 0x9932cc,
  plasma2: 0xbf40ff,
  plasma3: 0x6b238e,
  screenFlash: 0xe066ff,
  // Purple inferno specific colors
  noirWhite: 0xe066ff,
  noirGray: 0x6b238e,
  noirDark: 0x1a1530,
  spotlight: 0xcc99ff,
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
  // Film noir effects
  private venetianPhase = 0;
  private spotlightX = 0;
  private spotlightY = 0;
  private smokeParticles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number; life: number }[] = [];
  private monsterShadows: MonsterShadow[] = [];
  // Burning flame particles trailing behind snake
  private flameParticles: FlameParticle[] = [];

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
    this.initSmokeParticles();
    this.initMonsterShadows();

    if (this.currentState) {
      this.needsRedraw = true;
    }
  }

  private initSmokeParticles(): void {
    this.smokeParticles = [];
    const width = GRID_SIZE * CELL_SIZE;
    const height = GRID_SIZE * CELL_SIZE;
    for (let i = 0; i < 12; i++) {
      this.smokeParticles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: -0.1 - Math.random() * 0.2,
        size: 30 + Math.random() * 50,
        alpha: 0.02 + Math.random() * 0.03,
        life: Math.random(),
      });
    }
  }

  private initMonsterShadows(): void {
    this.monsterShadows = [];
    const width = GRID_SIZE * CELL_SIZE;
    const height = GRID_SIZE * CELL_SIZE;

    const edges: ('top' | 'bottom' | 'left' | 'right')[] = ['top', 'bottom', 'left', 'right'];
    for (const edge of edges) {
      for (let i = 0; i < NUM_MONSTERS_PER_EDGE; i++) {
        let x = 0, y = 0;
        const offset = (i + 0.5) / NUM_MONSTERS_PER_EDGE;

        switch (edge) {
          case 'top':
            x = width * offset;
            y = -15;
            break;
          case 'bottom':
            x = width * offset;
            y = height + 15;
            break;
          case 'left':
            x = -15;
            y = height * offset;
            break;
          case 'right':
            x = width + 15;
            y = height * offset;
            break;
        }

        this.monsterShadows.push({
          x,
          y,
          baseX: x,
          baseY: y,
          size: 25 + Math.random() * 15,
          phase: Math.random() * Math.PI * 2,
          speed: 0.02 + Math.random() * 0.015,
          eyePhase: Math.random() * Math.PI * 2,
          tentaclePhase: Math.random() * Math.PI * 2,
          edge,
          targetAlpha: 0.3 + Math.random() * 0.2,
          currentAlpha: 0,
        });
      }
    }
  }

  private updateMonsterShadows(): void {
    if (!this.currentState) return;

    const width = GRID_SIZE * CELL_SIZE;
    const height = GRID_SIZE * CELL_SIZE;
    const gameOver = this.currentState.gameOver;
    const snakeHead = this.currentState.snake.length > 0 ? this.currentState.snake[0] : null;

    for (const monster of this.monsterShadows) {
      monster.phase += monster.speed;
      monster.eyePhase += 0.05;
      monster.tentaclePhase += 0.03;

      const creepAmount = gameOver ? 25 : 8;
      const breathAmount = 3;
      const breath = Math.sin(monster.phase) * breathAmount;

      let targetX = monster.baseX;
      let targetY = monster.baseY;

      switch (monster.edge) {
        case 'top':
          targetY = monster.baseY + creepAmount + breath;
          targetX = monster.baseX + Math.sin(monster.phase * 0.5) * 10;
          break;
        case 'bottom':
          targetY = monster.baseY - creepAmount - breath;
          targetX = monster.baseX + Math.sin(monster.phase * 0.5) * 10;
          break;
        case 'left':
          targetX = monster.baseX + creepAmount + breath;
          targetY = monster.baseY + Math.sin(monster.phase * 0.5) * 10;
          break;
        case 'right':
          targetX = monster.baseX - creepAmount - breath;
          targetY = monster.baseY + Math.sin(monster.phase * 0.5) * 10;
          break;
      }

      // Recoil from snake head
      if (snakeHead && !gameOver) {
        const headX = snakeHead.x * CELL_SIZE + CELL_SIZE / 2;
        const headY = snakeHead.y * CELL_SIZE + CELL_SIZE / 2;
        const dx = monster.x - headX;
        const dy = monster.y - headY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 100) {
          const recoil = (100 - dist) / 100 * 20;
          targetX += (dx / dist) * recoil;
          targetY += (dy / dist) * recoil;
        }
      }

      monster.x += (targetX - monster.x) * 0.05;
      monster.y += (targetY - monster.y) * 0.05;
      monster.x = Math.max(-50, Math.min(width + 50, monster.x));
      monster.y = Math.max(-50, Math.min(height + 50, monster.y));

      const baseAlpha = gameOver ? 0.6 : monster.targetAlpha;
      monster.currentAlpha += (baseAlpha - monster.currentAlpha) * 0.05;
    }
  }

  private drawMonsterShadows(g: Phaser.GameObjects.Graphics): void {
    for (const monster of this.monsterShadows) {
      if (monster.currentAlpha < 0.01) continue;

      const { x, y, size, phase, eyePhase, tentaclePhase, currentAlpha } = monster;
      const bodyPulse = 1 + Math.sin(phase * 2) * 0.1;
      const bodySize = size * bodyPulse;

      // Outer shadow
      g.fillStyle(0x000000, currentAlpha * 0.3);
      g.fillCircle(x, y, bodySize * 1.4);

      // Tentacles
      const numTentacles = 5;
      for (let i = 0; i < numTentacles; i++) {
        const angle = (i / numTentacles) * Math.PI * 2 + tentaclePhase;
        const tentacleLength = bodySize * (0.8 + Math.sin(phase + i) * 0.3);
        const wave = Math.sin(tentaclePhase * 2 + i * 0.7) * 8;

        const startX = x + Math.cos(angle) * bodySize * 0.5;
        const startY = y + Math.sin(angle) * bodySize * 0.5;
        const endX = x + Math.cos(angle + Math.sin(phase) * 0.3) * tentacleLength + wave * 0.3;
        const endY = y + Math.sin(angle + Math.sin(phase) * 0.3) * tentacleLength + wave * 0.3;

        g.lineStyle(4 - i * 0.3, 0x0a0a0a, currentAlpha * 0.7);
        g.lineBetween(startX, startY, endX, endY);

        g.fillStyle(0x1e001e, currentAlpha * 0.5);
        g.fillCircle(endX, endY, 3);
      }

      // Main body blob
      g.fillStyle(0x05050a, currentAlpha * 0.9);
      g.fillCircle(x, y, bodySize * 0.6);

      // Inner dark core
      g.fillStyle(0x000000, currentAlpha);
      g.fillCircle(x, y, bodySize * 0.35);

      // Glowing eyes
      const numEyes = 2 + Math.floor(Math.sin(phase * 0.1) + 1);
      for (let i = 0; i < numEyes; i++) {
        const eyeAngle = (i / numEyes) * Math.PI * 0.8 - Math.PI * 0.4 + Math.sin(eyePhase) * 0.2;
        const eyeDist = bodySize * 0.2;
        const eyeX = x + Math.cos(eyeAngle) * eyeDist;
        const eyeY = y + Math.sin(eyeAngle) * eyeDist - size * 0.1;
        const eyeSize = 3 + Math.sin(eyePhase + i) * 1;

        // Eye glow
        g.fillStyle(0x50002a, currentAlpha * 0.6);
        g.fillCircle(eyeX, eyeY, eyeSize * 2);

        // Eye core - menacing red
        g.fillStyle(0xb4143c, currentAlpha);
        g.fillCircle(eyeX, eyeY, eyeSize);

        // Eye pupil
        g.fillStyle(0x000000, currentAlpha);
        g.fillCircle(eyeX + Math.sin(eyePhase) * 1, eyeY, eyeSize * 0.5);

        // Eye glint
        g.fillStyle(0xff6464, currentAlpha * 0.8);
        g.fillCircle(eyeX - 1, eyeY - 1, eyeSize * 0.25);
      }
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
    const hues = [280, 300, 260]; // Purple variations
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
    const auroraHues = [270, 280, 290, 300, 260];
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
    const nebulaHues = [260, 270, 280, 290, 300, 310];
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
    const ringHues = [270, 280, 290, 300, 260];
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
      hue: Math.random() < 0.3 ? 270 + Math.random() * 40 : 280 + Math.random() * 60, // Purple or magenta
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
    this.venetianPhase += 0.008;
    this.updateParticles();
    this.updateSmokeParticles();
    this.updateFlameParticles();

    // Spawn flame particles along snake every few frames
    if (this.frameCount % 2 === 0) {
      this.spawnFlamesAlongSnake();
    }

    // Spawn trail particles when snake moves
    if (this.currentState && this.currentState.snake.length > 0) {
      const head = this.currentState.snake[0];
      const headX = head.x * CELL_SIZE + CELL_SIZE / 2;
      const headY = head.y * CELL_SIZE + CELL_SIZE / 2;
      if (this.lastHeadPos && (this.lastHeadPos.x !== head.x || this.lastHeadPos.y !== head.y)) {
        this.spawnTrailParticles(headX, headY);
      }
      this.lastHeadPos = { x: head.x, y: head.y };
      // Update spotlight to follow snake head smoothly
      this.spotlightX += (headX - this.spotlightX) * 0.08;
      this.spotlightY += (headY - this.spotlightY) * 0.08;
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

    // Film noir deep black background
    g.fillStyle(COLORS.bgDark, 1);
    g.fillRect(0, 0, width, height);

    // Dramatic spotlight gradient from snake position
    this.drawSpotlight(g, width, height);

    // Smoke/fog atmosphere
    this.drawSmoke(g);

    // Venetian blind light streaks
    this.drawVenetianBlinds(g, width, height);

    // Grid with noir styling
    this.drawGrid(g, width, height);

    // Update and draw monster shadows at the edges
    this.updateMonsterShadows();
    this.drawMonsterShadows(g);

    if (!this.currentState) return;

    // Draw trail particles (behind everything else)
    this.drawTrailParticles(g);

    // Draw shockwaves (behind food and snake)
    this.drawShockWaves(g);

    // Draw snake afterimages (ghost trail)
    this.drawSnakeAfterimages(g);

    // Draw flame particles (burning trail behind snake)
    this.drawFlameParticles(g);

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
    // In film noir mode, stars are subtle distant lights
    for (const star of this.stars) {
      const twinkle = 0.5 + Math.sin(this.frameCount * star.speed + star.x) * 0.5;
      const alpha = star.brightness * twinkle * 0.25;
      g.fillStyle(COLORS.star, alpha);
      g.fillCircle(star.x, star.y, star.size * 0.7);
    }
  }

  private updateSmokeParticles(): void {
    const width = GRID_SIZE * CELL_SIZE;
    const height = GRID_SIZE * CELL_SIZE;
    for (const smoke of this.smokeParticles) {
      smoke.x += smoke.vx;
      smoke.y += smoke.vy;
      smoke.life -= 0.002;
      if (smoke.life <= 0 || smoke.y < -smoke.size) {
        smoke.x = Math.random() * width;
        smoke.y = height + smoke.size;
        smoke.life = 1;
        smoke.size = 30 + Math.random() * 50;
        smoke.alpha = 0.02 + Math.random() * 0.03;
      }
      if (smoke.x < -smoke.size) smoke.x = width + smoke.size;
      if (smoke.x > width + smoke.size) smoke.x = -smoke.size;
    }
  }

  private drawSpotlight(g: Phaser.GameObjects.Graphics, width: number, height: number): void {
    // Create dramatic spotlight effect centered on snake
    const cx = this.spotlightX || width / 2;
    const cy = this.spotlightY || height / 2;
    const pulse = 0.9 + Math.sin(this.frameCount * 0.03) * 0.1;

    // Outer darkness vignette
    g.fillStyle(0x000000, 0.6);
    g.fillRect(0, 0, width, height);

    // Spotlight cone - multiple layers for smooth falloff
    const layers = 4;
    for (let i = layers; i > 0; i--) {
      const layerRadius = (width * 0.4 + i * 30) * pulse;
      const layerAlpha = 0.15 * (1 - i / (layers + 1));
      g.fillStyle(COLORS.spotlight, layerAlpha);
      g.fillCircle(cx, cy, layerRadius);
    }

    // Bright center
    g.fillStyle(COLORS.noirWhite, 0.08 * pulse);
    g.fillCircle(cx, cy, width * 0.25);
  }

  private drawVenetianBlinds(g: Phaser.GameObjects.Graphics, width: number, height: number): void {
    // Horizontal light streaks simulating light through venetian blinds
    const blindSpacing = 25;
    const blindWidth = 8;
    const waveOffset = Math.sin(this.venetianPhase) * 10;

    for (let y = waveOffset; y < height; y += blindSpacing) {
      const brightness = 0.03 + Math.sin(y * 0.02 + this.venetianPhase * 2) * 0.015;
      g.fillStyle(COLORS.noirWhite, brightness);
      g.fillRect(0, y, width, blindWidth);
    }

    // Diagonal shadow bars from window frame
    const diagonalAlpha = 0.04 + Math.sin(this.frameCount * 0.02) * 0.01;
    g.fillStyle(0x000000, diagonalAlpha);
    for (let i = -2; i < 6; i++) {
      const x1 = i * 100 + Math.sin(this.venetianPhase) * 20;
      g.beginPath();
      g.moveTo(x1, 0);
      g.lineTo(x1 + 40, 0);
      g.lineTo(x1 + 40 + height * 0.3, height);
      g.lineTo(x1 + height * 0.3, height);
      g.closePath();
      g.fillPath();
    }
  }

  private drawSmoke(g: Phaser.GameObjects.Graphics): void {
    for (const smoke of this.smokeParticles) {
      const alpha = smoke.alpha * smoke.life;
      g.fillStyle(COLORS.noirGray, alpha);
      g.fillCircle(smoke.x, smoke.y, smoke.size);
      g.fillStyle(COLORS.noirWhite, alpha * 0.3);
      g.fillCircle(smoke.x, smoke.y, smoke.size * 0.5);
    }
  }

  private spawnFlameParticle(x: number, y: number, intensity: number): void {
    if (this.flameParticles.length >= MAX_FLAME_PARTICLES) {
      this.flameParticles.shift();
    }

    const angle = Math.random() * Math.PI * 2;
    const speed = 0.3 + Math.random() * 0.6;
    const life = 0.5 + Math.random() * 0.5;

    this.flameParticles.push({
      x: x + (Math.random() - 0.5) * 6,
      y: y + (Math.random() - 0.5) * 6,
      vx: Math.cos(angle) * speed * 0.3,
      vy: -0.5 - Math.random() * 1.5 * intensity,
      size: 3 + Math.random() * 4 * intensity,
      life,
      maxLife: life,
      hue: 270 + Math.random() * 40,
      brightness: 0.5 + Math.random() * 0.3,
    });
  }

  private updateFlameParticles(): void {
    for (let i = this.flameParticles.length - 1; i >= 0; i--) {
      const p = this.flameParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy -= 0.02;
      p.vx *= 0.98;
      p.size *= 0.97;
      p.life -= 0.025;

      if (p.life <= 0 || p.size < 0.5) {
        this.flameParticles.splice(i, 1);
      }
    }
  }

  private drawFlameParticles(g: Phaser.GameObjects.Graphics): void {
    for (const p of this.flameParticles) {
      const lifeRatio = p.life / p.maxLife;

      // Hue shifts from yellow-orange (high life) to red (low life)
      const hue = p.hue - (1 - lifeRatio) * 15;
      const outerColor = this.hslToRgb(hue / 360, 1, 0.3 + lifeRatio * 0.2);
      const midColor = this.hslToRgb(hue / 360, 1, 0.5 + lifeRatio * 0.2);
      const coreColor = this.hslToRgb((hue + 20) / 360, 0.7, 0.7 + lifeRatio * 0.2);

      // Outer glow
      g.fillStyle(outerColor, lifeRatio * 0.3);
      g.fillCircle(p.x, p.y, p.size * 2);

      // Mid flame
      g.fillStyle(midColor, lifeRatio * 0.6);
      g.fillCircle(p.x, p.y, p.size * 1.3);

      // Core (bright yellow/white)
      g.fillStyle(coreColor, lifeRatio * 0.8);
      g.fillCircle(p.x, p.y, p.size * 0.6);
    }
  }

  private spawnFlamesAlongSnake(): void {
    if (!this.currentState || this.currentState.gameOver) return;

    const snake = this.currentState.snake;
    for (let i = 0; i < snake.length; i++) {
      const seg = snake[i];
      const segX = seg.x * CELL_SIZE + CELL_SIZE / 2;
      const segY = seg.y * CELL_SIZE + CELL_SIZE / 2;
      const intensity = 1 - (i / snake.length) * 0.6;
      if (Math.random() < 0.4 * intensity) {
        this.spawnFlameParticle(segX, segY, intensity);
      }
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
      g.fillStyle(0xffffff, flashAlpha * 0.5);
      g.fillRect(0, 0, GRID_SIZE * CELL_SIZE, GRID_SIZE * CELL_SIZE);
    }

    for (const d of this.deathDebris) {
      // Film noir: grayscale debris
      const brightness = 0.4 + (d.hue % 60) / 100;
      const color = this.hslToRgb(0, 0, brightness);
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
      // Film noir: grayscale trail
      g.fillStyle(COLORS.noirGray, p.life * 0.2);
      g.fillCircle(p.x, p.y, p.size * 1.5 * p.life);
      g.fillStyle(COLORS.noirWhite, p.life * 0.5);
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
      const alpha = bolt.life;

      // Film noir: white lightning
      g.lineStyle(4, COLORS.noirGray, alpha * 0.3);
      this.drawLightningPath(g, bolt.points);

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
      if (Math.random() > 0.4) continue;

      const seg1 = snake[i];
      const seg2 = snake[i + 1];
      const x1 = seg1.x * CELL_SIZE + CELL_SIZE / 2;
      const y1 = seg1.y * CELL_SIZE + CELL_SIZE / 2;
      const x2 = seg2.x * CELL_SIZE + CELL_SIZE / 2;
      const y2 = seg2.y * CELL_SIZE + CELL_SIZE / 2;

      const arcPoints = this.generateLightningPath(x1, y1, x2, y2);

      // Film noir: grayscale arcs
      g.lineStyle(3, COLORS.noirGray, 0.3);
      this.drawLightningPath(g, arcPoints);
      g.lineStyle(1, 0xffffff, 0.7);
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
    // Film noir grid: subtle, dark lines suggesting tile floor or city grid
    g.lineStyle(1, COLORS.gridLine, 0.08);
    for (let i = 0; i <= GRID_SIZE; i++) {
      g.lineBetween(i * CELL_SIZE, 0, i * CELL_SIZE, height);
      g.lineBetween(0, i * CELL_SIZE, width, i * CELL_SIZE);
    }

    // Accent lines every 5 cells - subtle gray
    const accentPulse = 0.12 + Math.sin(this.frameCount * 0.03) * 0.04;
    g.lineStyle(1, COLORS.gridAccent, accentPulse);
    for (let i = 0; i <= GRID_SIZE; i += 5) {
      g.lineBetween(i * CELL_SIZE, 0, i * CELL_SIZE, height);
      g.lineBetween(0, i * CELL_SIZE, width, i * CELL_SIZE);
    }

    // Heavy vignette for dramatic noir look
    this.drawVignette(g, width, height);
  }

  private drawVignette(g: Phaser.GameObjects.Graphics, width: number, height: number): void {
    // Multiple layers of vignette for smooth falloff
    const layers = 5;
    for (let i = 0; i < layers; i++) {
      const inset = i * 30;
      const alpha = 0.15 * (1 - i / layers);
      g.lineStyle(60, 0x000000, alpha);
      g.strokeRect(inset - 30, inset - 30, width - inset * 2 + 60, height - inset * 2 + 60);
    }
  }

  private drawFood(g: Phaser.GameObjects.Graphics): void {
    if (!this.currentState) return;

    const food = this.currentState.food;
    const foodX = food.x * CELL_SIZE + CELL_SIZE / 2;
    const foodY = food.y * CELL_SIZE + CELL_SIZE / 2;
    const pulseScale = 1 + Math.sin(this.frameCount * 0.15) * 0.08;
    const glowPulse = 0.4 + Math.sin(this.frameCount * 0.1) * 0.2;

    // Spawn particles
    this.spawnFoodParticles(foodX, foodY);

    // Draw particles (grayscale)
    for (const p of this.foodParticles) {
      g.fillStyle(COLORS.noirWhite, p.life * 0.4);
      g.fillCircle(p.x, p.y, p.size * p.life);
    }

    // Film noir food: bright white orb like a spotlight or diamond
    // Shadow underneath
    g.fillStyle(0x000000, 0.5);
    g.fillCircle(foodX + 3, foodY + 3, (CELL_SIZE / 2) * pulseScale);

    // Outer ethereal glow
    g.fillStyle(COLORS.noirWhite, glowPulse * 0.2);
    g.fillCircle(foodX, foodY, (CELL_SIZE / 2 + 12) * pulseScale);
    g.fillStyle(COLORS.noirWhite, glowPulse * 0.35);
    g.fillCircle(foodX, foodY, (CELL_SIZE / 2 + 6) * pulseScale);

    // Main food body - brilliant white
    g.fillStyle(COLORS.food, 0.95);
    g.fillCircle(foodX, foodY, (CELL_SIZE / 2) * pulseScale);

    // Film noir sharp highlight - like light on a gem
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(foodX - 3, foodY - 3, 4 * pulseScale);

    // Secondary sparkle
    g.fillStyle(0xffffff, 0.6);
    g.fillCircle(foodX + 2, foodY - 2, 2 * pulseScale);
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

    // Film noir: dramatic shadow under snake
    for (let i = snakeLen - 1; i >= 0; i--) {
      const segment = snake[i];
      const centerX = segment.x * CELL_SIZE + CELL_SIZE / 2 + 3;
      const centerY = segment.y * CELL_SIZE + CELL_SIZE / 2 + 3;
      const t = snakeLen > 1 ? i / (snakeLen - 1) : 1;
      const shadowRadius = (CELL_SIZE / 2) * (0.9 + t * 0.1);
      g.fillStyle(0x000000, 0.4 * t);
      g.fillCircle(centerX, centerY, shadowRadius);
    }

    // Draw trailing glow (noir white/gray)
    for (let i = snakeLen - 1; i >= 0; i--) {
      const segment = snake[i];
      const centerX = segment.x * CELL_SIZE + CELL_SIZE / 2;
      const centerY = segment.y * CELL_SIZE + CELL_SIZE / 2;
      const t = snakeLen > 1 ? i / (snakeLen - 1) : 1;
      const glowAlpha = 0.15 * t;
      const glowSize = (CELL_SIZE / 2 + 4) * (0.5 + t * 0.5);

      g.fillStyle(COLORS.noirWhite, glowAlpha);
      g.fillCircle(centerX, centerY, glowSize);
    }

    // Draw snake segments from tail to head with grayscale gradient
    for (let i = snakeLen - 1; i >= 0; i--) {
      const segment = snake[i];
      const centerX = segment.x * CELL_SIZE + CELL_SIZE / 2;
      const centerY = segment.y * CELL_SIZE + CELL_SIZE / 2;

      const t = snakeLen > 1 ? i / (snakeLen - 1) : 1;
      const radius = (CELL_SIZE / 2 - 1) * (0.85 + t * 0.15);

      // Grayscale gradient from tail (dark) to head (bright)
      const brightness = 0.4 + t * 0.5;
      const segmentColor = this.hslToRgb(0, 0, brightness);

      if (i === 0) {
        // Head: brightest white with dramatic glow
        g.fillStyle(COLORS.noirWhite, 0.5);
        g.fillCircle(centerX, centerY, radius + 6);

        g.fillStyle(COLORS.snakeHead, 1);
        g.fillCircle(centerX, centerY, radius + 1);

        // Film noir head highlight - sharp specular
        g.fillStyle(0xffffff, 0.7);
        g.fillCircle(centerX - 2, centerY - 2, radius * 0.35);

        this.drawSnakeHead(g, segment, snake[1]);
      } else {
        // Body segment with grayscale
        g.fillStyle(COLORS.noirGray, 0.2);
        g.fillCircle(centerX, centerY, radius + 2);

        g.fillStyle(segmentColor, 1);
        g.fillCircle(centerX, centerY, radius);

        // Specular highlight
        g.fillStyle(0xffffff, 0.2 * t);
        g.fillCircle(centerX - 1, centerY - 1, radius * 0.25);
      }
    }
  }

  private drawFoodBurst(g: Phaser.GameObjects.Graphics): void {
    for (const p of this.foodBurstParticles) {
      // Film noir: grayscale burst
      for (let i = 0; i < p.trail.length; i++) {
        const t = p.trail[i];
        const trailAlpha = p.life * 0.4 * (1 - i / p.trail.length);
        const trailSize = p.size * p.life * (1 - i / p.trail.length);
        g.fillStyle(COLORS.noirGray, trailAlpha);
        g.fillCircle(t.x, t.y, trailSize);
      }

      g.fillStyle(COLORS.noirWhite, p.life * 0.7);
      g.fillCircle(p.x, p.y, p.size * p.life);
      g.fillStyle(0xffffff, p.life * 0.9);
      g.fillCircle(p.x, p.y, p.size * p.life * 0.4);
    }
  }

  private drawEnergyField(g: Phaser.GameObjects.Graphics): void {
    if (!this.currentState || this.currentState.snake.length === 0) return;

    const snake = this.currentState.snake;
    const baseIntensity = 0.06 + this.energyFieldPulse * 0.2;
    const pulseOffset = Math.sin(this.frameCount * 0.1) * 0.02;
    const alpha = Math.min(0.3, baseIntensity + pulseOffset);

    // Film noir: subtle grayscale energy field
    for (let i = 0; i < snake.length; i++) {
      const seg = snake[i];
      const cx = seg.x * CELL_SIZE + CELL_SIZE / 2;
      const cy = seg.y * CELL_SIZE + CELL_SIZE / 2;

      const fieldRadius = CELL_SIZE * (0.8 + this.energyFieldPulse * 0.5) + Math.sin(this.frameCount * 0.15 + i * 0.5) * 2;

      g.fillStyle(COLORS.noirWhite, alpha * 0.25);
      g.fillCircle(cx, cy, fieldRadius + 4);

      g.fillStyle(COLORS.noirWhite, alpha * 0.4);
      g.fillCircle(cx, cy, fieldRadius);
    }

    // Connecting lines when pulse is active
    if (this.energyFieldPulse > 0.3 && snake.length > 1) {
      for (let i = 0; i < snake.length - 1; i++) {
        const seg1 = snake[i];
        const seg2 = snake[i + 1];
        const x1 = seg1.x * CELL_SIZE + CELL_SIZE / 2;
        const y1 = seg1.y * CELL_SIZE + CELL_SIZE / 2;
        const x2 = seg2.x * CELL_SIZE + CELL_SIZE / 2;
        const y2 = seg2.y * CELL_SIZE + CELL_SIZE / 2;

        g.lineStyle(3, COLORS.noirGray, this.energyFieldPulse * 0.3);
        g.lineBetween(x1, y1, x2, y2);
        g.lineStyle(1.5, 0xffffff, this.energyFieldPulse * 0.5);
        g.lineBetween(x1, y1, x2, y2);
      }
    }
  }

  private drawChromaticAberration(g: Phaser.GameObjects.Graphics): void {
    if (!this.currentState) return;

    const snake = this.currentState.snake;
    const offset = this.chromaticIntensity * 3;

    // Film noir: grayscale ghosting effect instead of color split
    for (let i = 0; i < snake.length; i++) {
      const seg = snake[i];
      const cx = seg.x * CELL_SIZE + CELL_SIZE / 2;
      const cy = seg.y * CELL_SIZE + CELL_SIZE / 2;
      const t = snake.length > 1 ? i / (snake.length - 1) : 1;
      const radius = (CELL_SIZE / 2 - 1) * (0.85 + t * 0.15);
      const alpha = this.chromaticIntensity * 0.3 * (i === 0 ? 1 : 0.5);

      // Light ghost - offset left
      g.fillStyle(0xffffff, alpha);
      g.fillCircle(cx - offset, cy, radius);

      // Dark ghost - offset right
      g.fillStyle(0x404040, alpha);
      g.fillCircle(cx + offset, cy, radius);
    }
  }

  private drawGameOver(g: Phaser.GameObjects.Graphics, width: number, height: number): void {
    // Film noir game over: dramatic fade to black with spotlight
    if (this.gameOverAlpha < 0.85) {
      this.gameOverAlpha += 0.03;
    }

    // Heavy dark overlay
    g.fillStyle(COLORS.gameOverOverlay, this.gameOverAlpha);
    g.fillRect(0, 0, width, height);

    // Film grain effect (subtle noise lines)
    for (let y = 0; y < height; y += 3) {
      const grainAlpha = 0.05 + Math.random() * 0.05;
      g.fillStyle(Math.random() > 0.5 ? 0xffffff : 0x000000, grainAlpha);
      g.fillRect(0, y, width, 1);
    }

    // Dramatic spotlight in center
    const spotPulse = 0.15 + Math.sin(this.frameCount * 0.05) * 0.05;
    g.fillStyle(COLORS.noirWhite, spotPulse);
    g.fillCircle(width / 2, height / 2, 80);
    g.fillStyle(COLORS.noirWhite, spotPulse * 0.5);
    g.fillCircle(width / 2, height / 2, 120);

    // Noir border: thick black frame
    const borderSize = 8;
    g.fillStyle(0x000000, 0.8);
    g.fillRect(0, 0, width, borderSize);
    g.fillRect(0, height - borderSize, width, borderSize);
    g.fillRect(0, 0, borderSize, height);
    g.fillRect(width - borderSize, 0, borderSize, height);

    // White inner border
    const innerBorder = 2;
    const innerOffset = borderSize;
    g.fillStyle(COLORS.noirWhite, 0.3);
    g.fillRect(innerOffset, innerOffset, width - innerOffset * 2, innerBorder);
    g.fillRect(innerOffset, height - innerOffset - innerBorder, width - innerOffset * 2, innerBorder);
    g.fillRect(innerOffset, innerOffset, innerBorder, height - innerOffset * 2);
    g.fillRect(width - innerOffset - innerBorder, innerOffset, innerBorder, height - innerOffset * 2);
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
    // Film noir crown: silver/platinum with white diamonds
    const crownOffset = -8;
    const crownBaseX = headX - dx * crownOffset;
    const crownBaseY = headY - dy * crownOffset;

    const crownWidth = 14;
    const crownHeight = 10;
    const halfWidth = crownWidth / 2;

    const sparkle = 0.7 + Math.sin(this.frameCount * 0.15) * 0.3;

    const baseLeft = {
      x: crownBaseX + perpX * halfWidth,
      y: crownBaseY + perpY * halfWidth
    };
    const baseRight = {
      x: crownBaseX - perpX * halfWidth,
      y: crownBaseY - perpY * halfWidth
    };

    const pointOffset = -dx * crownHeight;
    const pointOffsetY = -dy * crownHeight;

    const crownPoints = [
      baseLeft,
      { x: baseLeft.x + pointOffset * 0.4, y: baseLeft.y + pointOffsetY * 0.4 },
      { x: crownBaseX + perpX * (halfWidth * 0.5) + pointOffset * 0.9, y: crownBaseY + perpY * (halfWidth * 0.5) + pointOffsetY * 0.9 },
      { x: crownBaseX + perpX * (halfWidth * 0.25) + pointOffset * 0.5, y: crownBaseY + perpY * (halfWidth * 0.25) + pointOffsetY * 0.5 },
      { x: crownBaseX + pointOffset, y: crownBaseY + pointOffsetY },
      { x: crownBaseX - perpX * (halfWidth * 0.25) + pointOffset * 0.5, y: crownBaseY - perpY * (halfWidth * 0.25) + pointOffsetY * 0.5 },
      { x: crownBaseX - perpX * (halfWidth * 0.5) + pointOffset * 0.9, y: crownBaseY - perpY * (halfWidth * 0.5) + pointOffsetY * 0.9 },
      { x: baseRight.x + pointOffset * 0.4, y: baseRight.y + pointOffsetY * 0.4 },
      baseRight
    ];

    // Noir crown glow (silver/white aura)
    g.fillStyle(COLORS.noirWhite, 0.25 * sparkle);
    g.fillCircle(crownBaseX + pointOffset * 0.5, crownBaseY + pointOffsetY * 0.5, crownHeight + 4);

    // Crown base (platinum silver)
    g.fillStyle(0xc0c0c0, 1);
    g.beginPath();
    g.moveTo(crownPoints[0].x, crownPoints[0].y);
    for (let i = 1; i < crownPoints.length; i++) {
      g.lineTo(crownPoints[i].x, crownPoints[i].y);
    }
    g.closePath();
    g.fillPath();

    // Crown outline (dark gray)
    g.lineStyle(1.5, 0x505050, 1);
    g.beginPath();
    g.moveTo(crownPoints[0].x, crownPoints[0].y);
    for (let i = 1; i < crownPoints.length; i++) {
      g.lineTo(crownPoints[i].x, crownPoints[i].y);
    }
    g.closePath();
    g.strokePath();

    // Crown band
    const bandY1 = {
      x: baseLeft.x + pointOffset * 0.15,
      y: baseLeft.y + pointOffsetY * 0.15
    };
    const bandY2 = {
      x: baseRight.x + pointOffset * 0.15,
      y: baseRight.y + pointOffsetY * 0.15
    };
    g.lineStyle(3, 0x808080, 1);
    g.lineBetween(bandY1.x, bandY1.y, bandY2.x, bandY2.y);

    // Noir jewels: white diamonds
    const jewelPositions = [
      { x: crownBaseX + pointOffset, y: crownBaseY + pointOffsetY, size: 2.5 },
      { x: crownBaseX + perpX * (halfWidth * 0.5) + pointOffset * 0.9, y: crownBaseY + perpY * (halfWidth * 0.5) + pointOffsetY * 0.9, size: 2 },
      { x: crownBaseX - perpX * (halfWidth * 0.5) + pointOffset * 0.9, y: crownBaseY - perpY * (halfWidth * 0.5) + pointOffsetY * 0.9, size: 2 },
    ];

    for (const jewel of jewelPositions) {
      g.fillStyle(COLORS.noirWhite, 0.5 * sparkle);
      g.fillCircle(jewel.x, jewel.y, jewel.size + 2);

      g.fillStyle(0xffffff, 1);
      g.fillCircle(jewel.x, jewel.y, jewel.size);

      g.fillStyle(0xffffff, 0.9 * sparkle);
      g.fillCircle(jewel.x - 0.5, jewel.y - 0.5, jewel.size * 0.4);
    }

    // Crown highlight
    g.fillStyle(0xffffff, 0.6 * sparkle);
    g.fillCircle(crownBaseX + perpX * 3 + pointOffset * 0.3, crownBaseY + perpY * 3 + pointOffsetY * 0.3, 2);
  }
}
