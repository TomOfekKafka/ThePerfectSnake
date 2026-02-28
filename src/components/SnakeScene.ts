import Phaser from 'phaser';
import {
  createCleanEffectsState,
  initMotes,
  updateMotes,
  updateRipples,
  updateGlowTrail,
  spawnRipple,
  spawnTears,
  spawnBlood,
  updateTears,
  updateBlood,
  initSnowflakes,
  updateSnowflakes,
  updateSnowballs,
  spawnDramaRings,
  updateDramaRings,
  dramaShakeOffset,
  drawDramaRings,
  drawSnowflakes,
  drawSnowballs,
  drawMotes,
  drawRipples,
  drawGlowTrail,
  drawCleanVignette,
  drawCleanHUD,
  drawTears,
  drawBlood,
  spawnBloodPuddle,
  updateBloodPuddles,
  drawBloodPuddles,
  initRedFog,
  updateRedFog,
  drawRedFog,
  initFoodOrbits,
  updateFoodOrbits,
  drawFoodOrbits,
  recolorFoodOrbits,
  triggerScreenShake,
  CLEAN_COLORS,
  CleanEffectsState,
} from './cleanEffects';
import {
  createHorrorEffectsState,
  initVeins,
  initTendrils,
  updateTendrils,
  updateGlitch,
  spawnIchorDrip,
  updateIchorDrips,
  drawVeins,
  drawTendrils,
  drawIchorDrips,
  drawGlitchGrid,
  HorrorEffectsState,
} from './horrorEffects';
import {
  drawVariedFood,
  drawGrid3D,
} from './depth3d';
import { pickFoodType, FoodType } from './foodVariety';
import { drawSolidSnake } from './solidSnake';
import { computeSnoutTip, getDirectionVectors } from './dragonHead';
import {
  FaceState,
  FaceDirection,
  createFaceState,
  updateFaceState,
} from './snakeFace';
import {
  createDragonBreathState,
  updateDragonBreath,
  drawDragonBreath,
  DragonBreathState,
} from './dragonBreath';
import {
  createMathParticlesState,
  initMathSymbols,
  initMathWaves,
  updateScoreBursts,
  spawnScoreBurst,
  drawScoreBursts,
  MathParticlesState,
} from './mathParticles';
import {
  createSpaceBackgroundState,
  initSpaceBackground,
  updateSpaceBackground,
  drawSpaceBackground,
  SpaceBackgroundState,
} from './spaceBackground';
import {
  createPulseGlowState,
  spawnPulseGlow,
  updatePulseGlows,
  drawPulseGlows,
  PulseGlowState,
} from './pulseGlow';
import {
  createNuclearBlastState,
  spawnNuclearBlast,
  updateNuclearBlasts,
  drawNuclearBlasts,
  NuclearBlastState,
} from './nuclearBlast';
import {
  createComboStreakState,
  triggerCombo,
  updateComboStreak,
  drawComboStreak,
  ComboStreakState,
} from './comboStreak';
import {
  createPortalEffectsState,
  PortalEffectsState,
} from './portalEffects';
import {
  createWallBorderState,
  updateWallBorder,
  drawWallBorder,
  WallBorderState,
} from './wallBorder';
import {
  createWizardEffectsState,
  spawnWandSparkles,
  updateWandSparkles,
  drawWandSparkles,
  updateSnitchWings,
  drawSnitchWings,
  spawnSpellText,
  updateSpellTexts,
  drawSpellTexts,
  WizardEffectsState,
} from './wizardEffects';
import {
  createHogwartsBackground,
  HogwartsBackgroundState,
} from './hogwartsBackground';
import {
  createPatronusTrailState,
  updatePatronusTrail,
  drawPatronusTrail,
  PatronusTrailState,
} from './patronusTrail';
import {
  createLaserBeamState,
  updateLaserBeams,
  drawTargetingLine,
  drawLaserBeams,
  fireLaser,
  LaserBeamState,
} from './laserBeam';
import {
  createFlagDisplayState,
  advanceFlag,
  drawFlagFood,
  drawCountryLabel,
  FlagDisplayState,
} from './countryFlags';
import {
  createCountryMapState,
  updateCountryMap,
  drawCountryMap,
  CountryMapState,
} from './countryMaps';
import {
  createCosmicCrownState,
  initCrownStars,
  initCrownBeam,
  updateCosmicCrown,
  spawnStarBurst,
  drawCrownStars,
  drawCrownBeam,
  drawStarBursts,
  CosmicCrownState,
} from './cosmicCrownEffects';
import {
  createPinballState,
  shouldActivatePinball,
  activatePinball,
  updatePinball,
  checkBumperCollision,
  triggerBumperHit,
  drawPinballBumpers,
  drawPinballFlippers,
  drawPinballLanes,
  drawPinballHitEffects,
  drawPinballBanner,
  drawPinballScorePopups,
  PinballState,
} from './pinballEffects';
import {
  computeBounceDirection,
} from '../game/pinball';
import {
  createHugeHeadState,
  updateHugeHead,
  triggerChomp,
  HugeHeadState,
} from './hugeHead';
import {
  createWeatherState,
  updateWeather,
  drawWeather,
  drawWeatherIndicator,
  WeatherState,
} from './weatherSystem';
import {
  computeEfficiency,
  EfficiencySnapshot,
  gradeToLabel,
} from '../game/efficiencyMeter';
import {
  createOptimizationState,
  updateOptimizationEffects,
  spawnCodeParticle,
  spawnGradePulse,
  drawOptimizationMeter,
  drawCodeParticles,
  OptimizationState,
} from './optimizationEffects';
import {
  UpgradeState,
  createUpgradeState,
  tickUpgrades,
  selectUpgrade,
} from '../game/upgrades';
import {
  UpgradeHudState,
  createUpgradeHudState,
  updateUpgradeHud,
  drawUpgradeChoicePanel,
  drawOwnedUpgradesBar,
} from './upgradeHud';
import {
  SudokuState,
  createSudokuState,
  updateSudokuVisited,
  updateSudokuEffects,
  resetSudokuVisited,
  drawSudokuGrid,
} from './sudokuGrid';
import {
  PoliceVisualsState,
  createPoliceVisualsState,
  updatePoliceVisuals,
  drawPoliceVisuals,
} from './policeVisuals';
import {
  SciFiState,
  createSciFiState,
  initDataStreams,
  updateSciFi,
  spawnShieldRing,
  drawSciFiGrid,
  drawShieldRings,
  drawHoloFood,
  drawSnakeEnergyField,
  drawCornerHUD,
} from './sciFiEffects';
import {
  ElectricStormState,
  createElectricStormState,
  updateElectricStorm,
  drawElectricStorm,
  triggerElectricBurst,
} from './electricStorm';
import {
  TitleScreenState,
  createTitleScreenState,
  initTitleScreen,
  updateTitleScreen,
  drawTitleScreen,
} from './titleScreen';
import {
  DeathCinematicState,
  createDeathCinematicState,
  triggerDeathCinematic,
  updateDeathCinematic,
  drawDeathCinematic,
} from './deathCinematic';
import {
  MilestoneState,
  createMilestoneState,
  checkMilestone,
  updateMilestones,
  drawMilestones,
  resetMilestones,
} from './milestones';
import {
  SpeedLinesState,
  createSpeedLinesState,
  updateSpeedLines,
  triggerSpeedBoost,
  drawSpeedLines,
} from './speedLines';

function dirToFaceDirection(dx: number, dy: number): FaceDirection {
  if (Math.abs(dx) >= Math.abs(dy)) {
    return dx >= 0 ? 'RIGHT' : 'LEFT';
  }
  return dy >= 0 ? 'DOWN' : 'UP';
}

interface Position {
  x: number;
  y: number;
}

interface FlagFoodData {
  position: Position;
  spawnTick: number;
  lifetime: number;
}

interface PoliceData {
  segments: { x: number; y: number }[];
  active: boolean;
  caughtFlash: number;
}

interface GameState {
  snake: Position[];
  food: Position;
  gameOver: boolean;
  gameStarted?: boolean;
  score?: number;
  foodEaten?: number;
  tickCount?: number;
  flagFood?: FlagFoodData | null;
  police?: PoliceData;
  deathReason?: 'wall' | 'self' | 'rival' | null;
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
const NUM_SPIRITS_PER_EDGE = 2;
const MAX_FLAME_PARTICLES = 60;
const MAX_COMET_TRAIL_LENGTH = 30;
const MAX_ETHEREAL_PARTICLES = 50;
const NUM_BEES = 8;
const BEE_SPAWN_CHANCE = 0.02;

// Comet trail segment - stores historical snake positions for smooth trail rendering
interface CometTrailSegment {
  x: number;
  y: number;
  alpha: number;
  size: number;
  hue: number;
}

// Ethereal trail particle - luminous particles that drift away from trail
interface EtherealParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  hue: number;
  brightness: number;
  pulsePhase: number;
}

// Thrown food animation - food launched onto screen with arc trajectory
interface ThrownFood {
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  x: number;
  y: number;
  progress: number; // 0 to 1
  rotation: number;
  rotationSpeed: number;
  trail: { x: number; y: number; alpha: number; rotation: number }[];
  landed: boolean;
  landingParticles: { x: number; y: number; vx: number; vy: number; life: number; size: number }[];
  impactRings: { radius: number; alpha: number }[];
}

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

// Guardian spirit - ethereal protectors at edges
interface GuardianSpirit {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  size: number;
  phase: number;
  speed: number;
  haloPhase: number;
  orbPhase: number;
  edge: 'top' | 'bottom' | 'left' | 'right';
  targetAlpha: number;
  currentAlpha: number;
  hue: number;
  orbs: { angle: number; distance: number; size: number; speed: number }[];
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

// Mystical bee - glowing magical creatures that swarm around food
interface MysticalBee {
  x: number;
  y: number;
  vx: number;
  vy: number;
  targetX: number;
  targetY: number;
  wingPhase: number;
  wingSpeed: number;
  size: number;
  hue: number;
  glowIntensity: number;
  bobPhase: number;
  bobSpeed: number;
  trail: { x: number; y: number; alpha: number }[];
  state: 'flying' | 'hovering' | 'attracted';
  sparkleTimer: number;
}

// Rival snake - spectral AI nemesis that competes for food
interface RivalSnake {
  segments: { x: number; y: number }[];
  direction: { dx: number; dy: number };
  targetX: number;
  targetY: number;
  moveTimer: number;
  moveInterval: number;
  pulsePhase: number;
  glowIntensity: number;
  hue: number;
  trail: { x: number; y: number; alpha: number }[];
  energyTrail: { x: number; y: number; alpha: number; size: number }[];
  state: 'hunting' | 'fleeing' | 'circling';
  aggression: number;
  nearMissTimer: number;
  electricArcs: { x1: number; y1: number; x2: number; y2: number; life: number }[];
}

const RIVAL_SNAKE_LENGTH = 10;
const RIVAL_MOVE_INTERVAL = 8;

// Armageddon Chaos effect types
interface GroundFissure {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  width: number;
  glowIntensity: number;
  pulsePhase: number;
}

interface FireRainParticle {
  x: number;
  y: number;
  vy: number;
  size: number;
  alpha: number;
  hue: number;
  trail: { x: number; y: number; alpha: number }[];
}

interface ChaosExplosion {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  life: number;
  rings: { radius: number; alpha: number }[];
  debris: { x: number; y: number; vx: number; vy: number; size: number; alpha: number }[];
}

interface ApocalypticSkull {
  x: number;
  y: number;
  size: number;
  alpha: number;
  rotation: number;
  pulsePhase: number;
}

const NUM_FISSURES = 6;
const MAX_FIRE_RAIN = 30;
const MAX_CHAOS_EXPLOSIONS = 3;
const NUM_SKULLS = 4;

import { pickDeathMessage, pickDeathReason } from '../game/deathMessages';
import { THEME } from './gameTheme';

const COLORS = {
  bgDark: THEME.bg.deep,
  bgMid: THEME.bg.mid,
  gridLine: THEME.grid.line,
  gridAccent: THEME.grid.accent,
  snakeHead: THEME.snake.head,
  snakeBody: THEME.snake.body,
  snakeTail: THEME.snake.tail,
  snakeHighlight: THEME.snake.highlight,
  snakeScale: THEME.snake.body,
  snakeEye: THEME.snake.eye,
  snakePupil: THEME.snake.pupil,
  snakeGlow: THEME.snake.glow,
  food: THEME.food.body,
  foodCore: THEME.food.core,
  foodGlow: THEME.food.glow,
  foodParticle: THEME.food.particle,
  star: THEME.effects.mote,
  gameOverOverlay: THEME.gameOver.overlay,
  gameOverText: THEME.gameOver.text,
  plasma1: THEME.bg.accent,
  plasma2: THEME.bg.light,
  plasma3: THEME.bg.mid,
  screenFlash: THEME.food.glow,
  noirWhite: THEME.hud.text,
  noirGray: THEME.hud.textDim,
  noirDark: THEME.bg.mid,
  spotlight: THEME.food.glow,
  chaosRed: THEME.effects.trail,
  chaosOrange: THEME.food.glow,
  chaosYellow: THEME.food.body,
  lavaGlow: THEME.effects.trail,
  ashGray: THEME.hud.textDim,
  bloodRed: THEME.snake.edge,
  hellfire: THEME.food.glow,
  pumpkinOrange: THEME.food.body,
  ghostWhite: THEME.hud.text,
  witchPurple: THEME.bg.accent,
  spiderBlack: THEME.bg.deep,
  candyCorn1: THEME.food.core,
  candyCorn2: THEME.food.glow,
  candyCorn3: THEME.hud.text,
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
  private energyFieldPulse = 0;
  private foodBurstParticles: { x: number; y: number; vx: number; vy: number; life: number; size: number; hue: number; trail: { x: number; y: number }[] }[] = [];
  private chromaticIntensity = 0;
  // Film noir effects
  private venetianPhase = 0;
  private spotlightX = 0;
  private spotlightY = 0;
  private smokeParticles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number; life: number }[] = [];
  private guardianSpirits: GuardianSpirit[] = [];
  // Burning flame particles trailing behind snake
  private flameParticles: FlameParticle[] = [];
  // Comet trail system - historical positions for smooth ribbon trail
  private cometTrail: CometTrailSegment[] = [];
  // Ethereal particles that drift away from the trail
  private etherealParticles: EtherealParticle[] = [];
  // Track last few head positions for smooth interpolation
  private headHistory: { x: number; y: number; time: number }[] = [];
  // Thrown food animation system
  private thrownFood: ThrownFood | null = null;
  private lastFoodPos: Position | null = null;
  // Mystical bees swarming around
  private bees: MysticalBee[] = [];
  // Rival snake - spectral AI nemesis
  private rivalSnake: RivalSnake | null = null;
  // Game over display
  private deathMessage = '';
  private deathReasonText = '';
  private gameOverRevealProgress = 0;
  private gameOverScoreAnimPhase = 0;
  private hudPulsePhase = 0;
  private lastHudScore = 0;
  private scoreFlashIntensity = 0;
  // Armageddon Chaos effects
  private groundFissures: GroundFissure[] = [];
  private fireRainParticles: FireRainParticle[] = [];
  private chaosExplosions: ChaosExplosion[] = [];
  private apocalypticSkulls: ApocalypticSkull[] = [];
  private armageddonPulse = 0;
  private chaosIntensity = 0;
  private cleanEffects: CleanEffectsState = createCleanEffectsState();
  private horrorEffects: HorrorEffectsState = createHorrorEffectsState();
  private mathParticles: MathParticlesState = createMathParticlesState();
  private spaceBackground: SpaceBackgroundState = createSpaceBackgroundState();
  private dragonBreath: DragonBreathState = createDragonBreathState();
  private pulseGlow: PulseGlowState = createPulseGlowState();
  private nuclearBlast: NuclearBlastState = createNuclearBlastState();
  private comboStreak: ComboStreakState = createComboStreakState();
  private portalEffects: PortalEffectsState = createPortalEffectsState();
  private lastPortalPair: { a: { x: number; y: number }; b: { x: number; y: number } } | null = null;
  private faceState: FaceState = createFaceState();
  private snakeDirection: FaceDirection = 'RIGHT';
  private hugeHead: HugeHeadState = createHugeHeadState();
  private wizardEffects: WizardEffectsState = createWizardEffectsState();
  private hogwartsBackground: HogwartsBackgroundState = createHogwartsBackground(GRID_SIZE * CELL_SIZE, GRID_SIZE * CELL_SIZE);
  private patronusTrail: PatronusTrailState = createPatronusTrailState();
  private laserBeam: LaserBeamState = createLaserBeamState();
  private flagDisplay: FlagDisplayState = createFlagDisplayState();
  private countryMap: CountryMapState = createCountryMapState();
  private cosmicCrown: CosmicCrownState = createCosmicCrownState();
  private weather: WeatherState = createWeatherState();
  private optimization: OptimizationState = createOptimizationState();
  private lastEfficiency: EfficiencySnapshot = { grade: 'D', ratio: 0, streak: 0, perfectStreak: false };
  private efficiencyStreak = 0;
  private upgradeState: UpgradeState = createUpgradeState();
  private upgradeHud: UpgradeHudState = createUpgradeHudState();
  private lastFoodEaten = 0;
  private upgradeKeyHandler: ((e: KeyboardEvent) => void) | null = null;
  private sudoku: SudokuState = createSudokuState();
  private policeVisuals: PoliceVisualsState = createPoliceVisualsState();
  private lastPoliceCaughtFlash = 0;
  private sciFi: SciFiState = createSciFiState();
  private electricStorm: ElectricStormState = createElectricStormState();
  private deathCinematic: DeathCinematicState = createDeathCinematicState();
  private deathDelayFrames = 0;
  private deathDelayActive = false;

  constructor() {
    super({ key: 'SnakeScene' });
  }

  create(): void {
    this.graphics = this.add.graphics();
    const width = GRID_SIZE * CELL_SIZE;
    const height = GRID_SIZE * CELL_SIZE;
    initMotes(this.cleanEffects, width, height);
    initSnowflakes(this.cleanEffects, width, height);
    initRedFog(this.cleanEffects, width, height);
    initFoodOrbits(this.cleanEffects);
    initVeins(this.horrorEffects, width, height);
    initTendrils(this.horrorEffects, width, height);
    initMathSymbols(this.mathParticles, width, height);
    initMathWaves(this.mathParticles, height);
    initSpaceBackground(this.spaceBackground, width, height);
    initCrownStars(this.cosmicCrown, width, height);
    initCrownBeam(this.cosmicCrown, width, height);
    initDataStreams(this.sciFi, width, height);

    this.upgradeKeyHandler = (e: KeyboardEvent) => {
      if (!this.upgradeState.choice || !this.upgradeState.choice.active) return;
      const key = e.key;
      if (key >= '1' && key <= '3') {
        const idx = parseInt(key) - 1;
        const options = this.upgradeState.choice.options;
        if (idx < options.length) {
          e.preventDefault();
          this.upgradeState = selectUpgrade(this.upgradeState, options[idx]);
          this.upgradeHud.selectedFlash = 1;
        }
      }
    };
    window.addEventListener('keydown', this.upgradeKeyHandler);

    if (this.currentState) {
      this.needsRedraw = true;
    }
  }

  private initArmageddonEffects(): void {
    const width = GRID_SIZE * CELL_SIZE;
    const height = GRID_SIZE * CELL_SIZE;

    // Initialize ground fissures - cracks in the earth with lava
    this.groundFissures = [];
    for (let i = 0; i < NUM_FISSURES; i++) {
      const startX = Math.random() * width;
      const startY = Math.random() * height;
      const angle = Math.random() * Math.PI;
      const length = 40 + Math.random() * 80;
      this.groundFissures.push({
        x1: startX,
        y1: startY,
        x2: startX + Math.cos(angle) * length,
        y2: startY + Math.sin(angle) * length,
        width: 2 + Math.random() * 4,
        glowIntensity: 0.5 + Math.random() * 0.5,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }

    // Initialize fire rain
    this.fireRainParticles = [];

    // Initialize chaos explosions
    this.chaosExplosions = [];

    // Initialize apocalyptic skulls floating in background
    this.apocalypticSkulls = [];
    for (let i = 0; i < NUM_SKULLS; i++) {
      this.apocalypticSkulls.push({
        x: 30 + Math.random() * (width - 60),
        y: 30 + Math.random() * (height - 60),
        size: 15 + Math.random() * 10,
        alpha: 0.03 + Math.random() * 0.04,
        rotation: Math.random() * Math.PI * 2,
        pulsePhase: Math.random() * Math.PI * 2,
      });
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

  private updateArmageddonEffects(): void {
    const width = GRID_SIZE * CELL_SIZE;
    const height = GRID_SIZE * CELL_SIZE;

    this.armageddonPulse += 0.04;

    // Update ground fissures - pulsing lava glow
    for (const fissure of this.groundFissures) {
      fissure.pulsePhase += 0.06;
      fissure.glowIntensity = 0.5 + Math.sin(fissure.pulsePhase) * 0.3;
    }

    // Spawn fire rain particles
    if (this.fireRainParticles.length < MAX_FIRE_RAIN && Math.random() < 0.3) {
      const hueVariation = Math.random();
      this.fireRainParticles.push({
        x: Math.random() * width,
        y: -20,
        vy: 2 + Math.random() * 3,
        size: 2 + Math.random() * 4,
        alpha: 0.6 + Math.random() * 0.4,
        hue: hueVariation < 0.6 ? 0 : (hueVariation < 0.85 ? 20 : 40), // Red, orange, yellow
        trail: [],
      });
    }

    // Update fire rain
    for (let i = this.fireRainParticles.length - 1; i >= 0; i--) {
      const p = this.fireRainParticles[i];
      p.trail.unshift({ x: p.x, y: p.y, alpha: p.alpha });
      if (p.trail.length > 6) p.trail.pop();
      for (const t of p.trail) { t.alpha *= 0.7; }

      p.y += p.vy;
      p.x += Math.sin(this.armageddonPulse + p.y * 0.05) * 0.3;
      p.alpha *= 0.995;

      if (p.y > height + 20 || p.alpha < 0.05) {
        this.fireRainParticles.splice(i, 1);
      }
    }

    // Update chaos explosions
    for (let i = this.chaosExplosions.length - 1; i >= 0; i--) {
      const exp = this.chaosExplosions[i];
      exp.radius += 4;
      exp.life -= 0.03;

      for (const ring of exp.rings) {
        ring.radius += 3;
        ring.alpha *= 0.92;
      }
      exp.rings = exp.rings.filter(r => r.alpha > 0.02);

      for (const d of exp.debris) {
        d.x += d.vx;
        d.y += d.vy;
        d.vy += 0.1;
        d.alpha *= 0.96;
      }
      exp.debris = exp.debris.filter(d => d.alpha > 0.02);

      if (exp.life <= 0 && exp.rings.length === 0 && exp.debris.length === 0) {
        this.chaosExplosions.splice(i, 1);
      }
    }

    // Update apocalyptic skulls - slow drift and pulse
    for (const skull of this.apocalypticSkulls) {
      skull.pulsePhase += 0.02;
      skull.rotation += 0.002;
      skull.x += Math.sin(skull.pulsePhase * 0.5) * 0.1;
      skull.y += Math.cos(skull.pulsePhase * 0.3) * 0.1;

      // Keep in bounds
      if (skull.x < 20) skull.x = 20;
      if (skull.x > width - 20) skull.x = width - 20;
      if (skull.y < 20) skull.y = 20;
      if (skull.y > height - 20) skull.y = height - 20;
    }

    // Chaos intensity increases when snake eats or dies
    this.chaosIntensity *= 0.97;
  }

  private spawnChaosExplosion(x: number, y: number): void {
    if (this.chaosExplosions.length >= MAX_CHAOS_EXPLOSIONS) {
      this.chaosExplosions.shift();
    }

    const debris: { x: number; y: number; vx: number; vy: number; size: number; alpha: number }[] = [];
    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 + Math.random() * 0.3;
      const speed = 3 + Math.random() * 5;
      debris.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        size: 2 + Math.random() * 4,
        alpha: 1,
      });
    }

    this.chaosExplosions.push({
      x,
      y,
      radius: 5,
      maxRadius: 80,
      life: 1,
      rings: [
        { radius: 10, alpha: 1 },
        { radius: 5, alpha: 0.8 },
        { radius: 15, alpha: 0.6 },
      ],
      debris,
    });

    this.chaosIntensity = Math.min(1, this.chaosIntensity + 0.5);
  }

  private drawArmageddonBackground(g: Phaser.GameObjects.Graphics, width: number, height: number): void {
    // Spooky Halloween night sky
    const skyPulse = 0.8 + Math.sin(this.armageddonPulse * 0.5) * 0.2;

    // Layer 1: Deep purple-black night base
    g.fillStyle(0x0a0018, 1);
    g.fillRect(0, 0, width, height);

    // Layer 2: Eerie purple glow from below (like fog)
    g.fillStyle(0x200840, 0.3 * skyPulse);
    g.fillRect(0, height * 0.7, width, height * 0.3);

    // Layer 3: Misty purple clouds
    for (let i = 0; i < 4; i++) {
      const cloudY = i * 30 + Math.sin(this.armageddonPulse + i) * 10;
      const cloudAlpha = 0.1 - i * 0.02;
      g.fillStyle(0x301040, cloudAlpha * skyPulse);
      g.fillRect(0, cloudY, width, 40);
    }

    // Draw haunted moon
    this.drawHauntedMoon(g, width);

    // Draw flying bats in background
    this.drawFlyingBats(g, width, height);

    // Draw apocalyptic skulls (very faint, background layer)
    this.drawApocalypticSkulls(g);
  }

  private drawHauntedMoon(g: Phaser.GameObjects.Graphics, width: number): void {
    const moonX = width * 0.8;
    const moonY = 60;
    const moonRadius = 35;
    const moonPulse = 0.9 + Math.sin(this.frameCount * 0.02) * 0.1;

    // Moon glow
    g.fillStyle(0xff8800, 0.1 * moonPulse);
    g.fillCircle(moonX, moonY, moonRadius * 2);
    g.fillStyle(0xffaa00, 0.15 * moonPulse);
    g.fillCircle(moonX, moonY, moonRadius * 1.5);

    // Main moon (orange harvest moon)
    g.fillStyle(0xffaa33, 0.9);
    g.fillCircle(moonX, moonY, moonRadius);

    // Moon craters
    g.fillStyle(0xcc8822, 0.4);
    g.fillCircle(moonX - 10, moonY - 5, 8);
    g.fillCircle(moonX + 12, moonY + 8, 6);
    g.fillCircle(moonX - 5, moonY + 12, 5);
  }

  private drawFlyingBats(g: Phaser.GameObjects.Graphics, width: number, height: number): void {
    const batCount = 6;
    for (let i = 0; i < batCount; i++) {
      const phase = this.frameCount * 0.03 + i * 1.5;
      const batX = ((i * 127 + this.frameCount * 0.5) % (width + 100)) - 50;
      const batY = 40 + i * 20 + Math.sin(phase) * 15;
      const wingPhase = Math.sin(this.frameCount * 0.15 + i * 2);

      // Bat body
      g.fillStyle(0x111122, 0.8);
      g.fillCircle(batX, batY, 4);

      // Bat wings (flapping)
      const wingSpread = 8 + wingPhase * 4;
      g.fillStyle(0x111122, 0.7);

      // Left wing
      g.beginPath();
      g.moveTo(batX - 2, batY);
      g.lineTo(batX - wingSpread, batY - wingPhase * 3);
      g.lineTo(batX - wingSpread * 0.6, batY + 2);
      g.closePath();
      g.fillPath();

      // Right wing
      g.beginPath();
      g.moveTo(batX + 2, batY);
      g.lineTo(batX + wingSpread, batY - wingPhase * 3);
      g.lineTo(batX + wingSpread * 0.6, batY + 2);
      g.closePath();
      g.fillPath();
    }
  }

  private drawGroundFissures(g: Phaser.GameObjects.Graphics): void {
    for (const fissure of this.groundFissures) {
      const pulse = fissure.glowIntensity;

      // Ghostly purple glow underneath
      g.lineStyle(fissure.width * 3, COLORS.lavaGlow, 0.12 * pulse);
      g.lineBetween(fissure.x1, fissure.y1, fissure.x2, fissure.y2);

      // Crack edges (dark purple)
      g.lineStyle(fissure.width + 2, 0x200030, 0.4);
      g.lineBetween(fissure.x1, fissure.y1, fissure.x2, fissure.y2);

      // Ethereal core (bright purple)
      g.lineStyle(fissure.width, COLORS.witchPurple, 0.3 * pulse);
      g.lineBetween(fissure.x1, fissure.y1, fissure.x2, fissure.y2);

      // Ghostly white center
      g.lineStyle(fissure.width * 0.3, COLORS.ghostWhite, 0.2 * pulse);
      g.lineBetween(fissure.x1, fissure.y1, fissure.x2, fissure.y2);
    }
  }

  private drawFireRain(g: Phaser.GameObjects.Graphics): void {
    for (const p of this.fireRainParticles) {
      // Draw ghostly trail
      for (let i = 0; i < p.trail.length; i++) {
        const t = p.trail[i];
        const trailSize = p.size * (1 - i / p.trail.length) * 0.6;
        // Ghostly purple/green trail
        const ghostHue = 0.75 + (p.hue % 60) / 360;
        const trailColor = this.hslToRgb(ghostHue, 0.6, 0.6);
        g.fillStyle(trailColor, t.alpha * 0.3);
        g.fillCircle(t.x, t.y, trailSize);
      }

      // Main spirit particle (ghostly appearance)
      const outerColor = this.hslToRgb(0.8, 0.5, 0.5);
      const coreColor = this.hslToRgb(0.85, 0.3, 0.8);

      g.fillStyle(outerColor, p.alpha * 0.4);
      g.fillCircle(p.x, p.y, p.size * 1.5);

      g.fillStyle(coreColor, p.alpha * 0.6);
      g.fillCircle(p.x, p.y, p.size);

      g.fillStyle(COLORS.ghostWhite, p.alpha * 0.5);
      g.fillCircle(p.x, p.y, p.size * 0.3);
    }
  }

  private drawChaosExplosions(g: Phaser.GameObjects.Graphics): void {
    for (const exp of this.chaosExplosions) {
      // Central flash
      if (exp.life > 0.7) {
        const flashAlpha = (exp.life - 0.7) * 3;
        g.fillStyle(0xffffff, flashAlpha * 0.5);
        g.fillCircle(exp.x, exp.y, exp.radius * 0.5);
        g.fillStyle(COLORS.chaosYellow, flashAlpha * 0.4);
        g.fillCircle(exp.x, exp.y, exp.radius);
      }

      // Expanding rings
      for (const ring of exp.rings) {
        g.lineStyle(4, COLORS.chaosRed, ring.alpha * 0.5);
        g.strokeCircle(exp.x, exp.y, ring.radius);
        g.lineStyle(2, COLORS.chaosOrange, ring.alpha * 0.7);
        g.strokeCircle(exp.x, exp.y, ring.radius);
        g.lineStyle(1, 0xffffff, ring.alpha * 0.4);
        g.strokeCircle(exp.x, exp.y, ring.radius);
      }

      // Flying debris
      for (const d of exp.debris) {
        g.fillStyle(COLORS.chaosOrange, d.alpha * 0.6);
        g.fillCircle(d.x, d.y, d.size * 1.3);
        g.fillStyle(COLORS.chaosYellow, d.alpha * 0.9);
        g.fillCircle(d.x, d.y, d.size);
      }
    }
  }

  private drawApocalypticSkulls(g: Phaser.GameObjects.Graphics): void {
    for (const skull of this.apocalypticSkulls) {
      const pulse = 0.7 + Math.sin(skull.pulsePhase) * 0.3;
      const alpha = skull.alpha * pulse;
      const s = skull.size;

      // Ghostly purple glow
      g.fillStyle(COLORS.witchPurple, alpha * 0.2);
      g.fillCircle(skull.x, skull.y, s * 1.5);

      // Skull outline (bone white)
      g.fillStyle(0xcccccc, alpha * 0.8);
      // Cranium
      g.fillCircle(skull.x, skull.y - s * 0.1, s * 0.8);
      // Jaw
      g.fillRect(skull.x - s * 0.4, skull.y + s * 0.3, s * 0.8, s * 0.4);

      // Eye sockets (glowing green - spooky!)
      g.fillStyle(COLORS.snakeHead, alpha * 1.2);
      g.fillCircle(skull.x - s * 0.25, skull.y - s * 0.1, s * 0.2);
      g.fillCircle(skull.x + s * 0.25, skull.y - s * 0.1, s * 0.2);

      // Nose hole
      g.fillStyle(0x000000, alpha);
      g.fillTriangle(
        skull.x, skull.y + s * 0.1,
        skull.x - s * 0.1, skull.y + s * 0.25,
        skull.x + s * 0.1, skull.y + s * 0.25
      );
    }
  }

  private drawChaosOverlay(g: Phaser.GameObjects.Graphics, width: number, height: number): void {
    if (this.chaosIntensity <= 0) return;

    // Purple tint overlay when chaos is active
    g.fillStyle(COLORS.witchPurple, this.chaosIntensity * 0.1);
    g.fillRect(0, 0, width, height);

    // Pulsing purple vignette edges
    const vignetteAlpha = this.chaosIntensity * 0.25;
    g.lineStyle(80, COLORS.bloodRed, vignetteAlpha);
    g.strokeRect(-40, -40, width + 80, height + 80);
  }

  private initGuardianSpirits(): void {
    this.guardianSpirits = [];
    const width = GRID_SIZE * CELL_SIZE;
    const height = GRID_SIZE * CELL_SIZE;
    const spiritHues = [180, 220, 280, 320];

    const edges: ('top' | 'bottom' | 'left' | 'right')[] = ['top', 'bottom', 'left', 'right'];
    for (let edgeIndex = 0; edgeIndex < edges.length; edgeIndex++) {
      const edge = edges[edgeIndex];
      for (let i = 0; i < NUM_SPIRITS_PER_EDGE; i++) {
        let x = 0, y = 0;
        const offset = (i + 0.5) / NUM_SPIRITS_PER_EDGE;

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

        const orbs: { angle: number; distance: number; size: number; speed: number }[] = [];
        const numOrbs = 3;
        for (let o = 0; o < numOrbs; o++) {
          orbs.push({
            angle: (o / numOrbs) * Math.PI * 2,
            distance: 15 + Math.random() * 10,
            size: 3 + Math.random() * 2,
            speed: 0.03 + Math.random() * 0.02,
          });
        }

        this.guardianSpirits.push({
          x,
          y,
          baseX: x,
          baseY: y,
          size: 20 + Math.random() * 10,
          phase: Math.random() * Math.PI * 2,
          speed: 0.015 + Math.random() * 0.01,
          haloPhase: Math.random() * Math.PI * 2,
          orbPhase: Math.random() * Math.PI * 2,
          edge,
          targetAlpha: 0.4 + Math.random() * 0.2,
          currentAlpha: 0,
          hue: spiritHues[edgeIndex % spiritHues.length] + Math.random() * 30 - 15,
          orbs,
        });
      }
    }
  }

  private initBees(): void {
    this.bees = [];
  }

  private initRivalSnake(): void {
    const width = GRID_SIZE * CELL_SIZE;
    const height = GRID_SIZE * CELL_SIZE;

    const startX = width - 50 - Math.random() * 50;
    const startY = height - 50 - Math.random() * 50;

    const segments: { x: number; y: number }[] = [];
    for (let i = 0; i < RIVAL_SNAKE_LENGTH; i++) {
      segments.push({
        x: startX + i * CELL_SIZE * 0.6,
        y: startY,
      });
    }

    this.rivalSnake = {
      segments,
      direction: { dx: -1, dy: 0 },
      targetX: width / 2,
      targetY: height / 2,
      moveTimer: 0,
      moveInterval: RIVAL_MOVE_INTERVAL,
      pulsePhase: 0,
      glowIntensity: 0.8,
      hue: 200,
      trail: [],
      energyTrail: [],
      state: 'hunting',
      aggression: 0.5,
      nearMissTimer: 0,
      electricArcs: [],
    };
  }

  private updateRivalSnake(): void {
    if (!this.rivalSnake || !this.currentState) return;

    const rs = this.rivalSnake;
    const width = GRID_SIZE * CELL_SIZE;
    const height = GRID_SIZE * CELL_SIZE;

    rs.pulsePhase += 0.1;
    rs.glowIntensity = 0.6 + Math.sin(rs.pulsePhase) * 0.3;

    if (rs.segments.length > 0) {
      rs.trail.unshift({ x: rs.segments[0].x, y: rs.segments[0].y, alpha: 0.7 });
      if (rs.trail.length > 20) rs.trail.pop();

      rs.energyTrail.unshift({
        x: rs.segments[0].x + (Math.random() - 0.5) * 8,
        y: rs.segments[0].y + (Math.random() - 0.5) * 8,
        alpha: 0.8,
        size: 3 + Math.random() * 4
      });
      if (rs.energyTrail.length > 30) rs.energyTrail.pop();
    }

    for (const t of rs.trail) {
      t.alpha *= 0.92;
    }
    rs.trail = rs.trail.filter(t => t.alpha > 0.02);

    for (const e of rs.energyTrail) {
      e.alpha *= 0.88;
      e.size *= 0.95;
    }
    rs.energyTrail = rs.energyTrail.filter(e => e.alpha > 0.02);

    rs.electricArcs = rs.electricArcs.filter(arc => {
      arc.life -= 0.15;
      return arc.life > 0;
    });

    if (rs.nearMissTimer > 0) rs.nearMissTimer--;

    const playerHead = this.currentState.snake[0];
    const playerX = playerHead.x * CELL_SIZE + CELL_SIZE / 2;
    const playerY = playerHead.y * CELL_SIZE + CELL_SIZE / 2;
    const rivalHead = rs.segments[0];
    const distToPlayer = Math.sqrt(
      Math.pow(playerX - rivalHead.x, 2) + Math.pow(playerY - rivalHead.y, 2)
    );

    if (distToPlayer < 60 && rs.nearMissTimer === 0) {
      rs.nearMissTimer = 30;
      rs.electricArcs.push({
        x1: rivalHead.x,
        y1: rivalHead.y,
        x2: playerX,
        y2: playerY,
        life: 1.0
      });
      rs.aggression = Math.min(1.0, rs.aggression + 0.1);
    }

    rs.moveTimer++;
    if (rs.moveTimer >= rs.moveInterval) {
      rs.moveTimer = 0;

      const foodX = this.currentState.food.x * CELL_SIZE + CELL_SIZE / 2;
      const foodY = this.currentState.food.y * CELL_SIZE + CELL_SIZE / 2;
      const distToFood = Math.sqrt(
        Math.pow(foodX - rivalHead.x, 2) + Math.pow(foodY - rivalHead.y, 2)
      );

      if (distToPlayer < 80) {
        rs.state = 'fleeing';
        const fleeAngle = Math.atan2(rivalHead.y - playerY, rivalHead.x - playerX);
        rs.targetX = rivalHead.x + Math.cos(fleeAngle) * 100;
        rs.targetY = rivalHead.y + Math.sin(fleeAngle) * 100;
      } else if (distToFood < 150 || rs.aggression > 0.7) {
        rs.state = 'hunting';
        rs.targetX = foodX;
        rs.targetY = foodY;
      } else {
        rs.state = 'circling';
        const circleAngle = rs.pulsePhase * 0.3;
        rs.targetX = width / 2 + Math.cos(circleAngle) * 120;
        rs.targetY = height / 2 + Math.sin(circleAngle) * 120;
      }

      rs.targetX = Math.max(30, Math.min(width - 30, rs.targetX));
      rs.targetY = Math.max(30, Math.min(height - 30, rs.targetY));

      const dx = rs.targetX - rivalHead.x;
      const dy = rs.targetY - rivalHead.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 5) {
        const targetDx = dx / dist;
        const targetDy = dy / dist;
        const turnSpeed = rs.state === 'fleeing' ? 0.5 : 0.35;

        rs.direction.dx = rs.direction.dx * (1 - turnSpeed) + targetDx * turnSpeed;
        rs.direction.dy = rs.direction.dy * (1 - turnSpeed) + targetDy * turnSpeed;

        const len = Math.sqrt(rs.direction.dx * rs.direction.dx + rs.direction.dy * rs.direction.dy);
        if (len > 0) {
          rs.direction.dx /= len;
          rs.direction.dy /= len;
        }
      }

      const moveSpeed = rs.state === 'fleeing' ? CELL_SIZE * 0.7 : CELL_SIZE * 0.55;
      const newHead = {
        x: rivalHead.x + rs.direction.dx * moveSpeed,
        y: rivalHead.y + rs.direction.dy * moveSpeed,
      };

      if (newHead.x < 10) newHead.x = width - 10;
      if (newHead.x > width - 10) newHead.x = 10;
      if (newHead.y < 10) newHead.y = height - 10;
      if (newHead.y > height - 10) newHead.y = 10;

      rs.segments.unshift(newHead);
      rs.segments.pop();
    } else {
      const head = rs.segments[0];
      const moveSpeed = CELL_SIZE * 0.5;

      head.x += rs.direction.dx * moveSpeed * 0.06;
      head.y += rs.direction.dy * moveSpeed * 0.06;

      for (let i = 1; i < rs.segments.length; i++) {
        const seg = rs.segments[i];
        const prev = rs.segments[i - 1];
        const pullStrength = 0.18;
        seg.x += (prev.x - seg.x) * pullStrength;
        seg.y += (prev.y - seg.y) * pullStrength;
      }
    }

    if (this.currentState.gameOver) {
      rs.hue = 180;
      rs.glowIntensity *= 0.95;
      rs.state = 'circling';
    } else {
      rs.hue = rs.state === 'hunting' ? 190 : (rs.state === 'fleeing' ? 220 : 200);
      rs.hue += Math.sin(rs.pulsePhase * 0.5) * 10;
    }

    rs.aggression *= 0.998;
  }

  private drawRivalSnake(g: Phaser.GameObjects.Graphics): void {
    if (!this.rivalSnake || this.rivalSnake.segments.length === 0) return;

    const rs = this.rivalSnake;
    const pulse = rs.glowIntensity;

    for (const arc of rs.electricArcs) {
      this.drawElectricArc(g, arc.x1, arc.y1, arc.x2, arc.y2, arc.life);
    }

    for (const e of rs.energyTrail) {
      g.fillStyle(this.hslToHex(rs.hue + 20, 80, 70), e.alpha * 0.6);
      g.fillCircle(e.x, e.y, e.size);
      g.fillStyle(this.hslToHex(rs.hue, 90, 85), e.alpha * 0.3);
      g.fillCircle(e.x, e.y, e.size * 0.5);
    }

    for (let i = 0; i < rs.trail.length; i++) {
      const t = rs.trail[i];
      const trailSize = 5 * (1 - i / rs.trail.length);
      g.fillStyle(this.hslToHex(rs.hue, 80, 55), t.alpha * 0.4);
      g.fillCircle(t.x, t.y, trailSize * 2);
      g.fillStyle(this.hslToHex(rs.hue + 30, 70, 70), t.alpha * 0.2);
      g.fillCircle(t.x, t.y, trailSize);
    }

    g.lineStyle(14, this.hslToHex(rs.hue, 70, 40), 0.2 * pulse);
    g.beginPath();
    g.moveTo(rs.segments[0].x, rs.segments[0].y);
    for (let i = 1; i < rs.segments.length; i++) {
      g.lineTo(rs.segments[i].x, rs.segments[i].y);
    }
    g.strokePath();

    g.lineStyle(8, this.hslToHex(rs.hue, 80, 55), 0.35 * pulse);
    g.beginPath();
    g.moveTo(rs.segments[0].x, rs.segments[0].y);
    for (let i = 1; i < rs.segments.length; i++) {
      g.lineTo(rs.segments[i].x, rs.segments[i].y);
    }
    g.strokePath();

    for (let i = rs.segments.length - 1; i >= 0; i--) {
      const seg = rs.segments[i];
      const t = rs.segments.length > 1 ? i / (rs.segments.length - 1) : 1;
      const segmentPulse = pulse * (0.8 + Math.sin(rs.pulsePhase + i * 0.4) * 0.2);

      const baseSize = 7 + t * 5;
      const size = baseSize * (0.9 + segmentPulse * 0.15);

      g.fillStyle(this.hslToHex(rs.hue - 10, 60, 35), 0.15 * segmentPulse);
      g.fillCircle(seg.x, seg.y, size * 2.8);

      g.fillStyle(this.hslToHex(rs.hue, 75, 50), 0.3 * segmentPulse);
      g.fillCircle(seg.x, seg.y, size * 1.6);

      g.fillStyle(this.hslToHex(rs.hue + 10, 85, 65), 0.6 * segmentPulse);
      g.fillCircle(seg.x, seg.y, size);

      g.fillStyle(this.hslToHex(rs.hue + 40, 60, 90), 0.5 * segmentPulse);
      g.fillCircle(seg.x, seg.y, size * 0.35);

      if (i === 0) {
        const dx = rs.direction.dx;
        const dy = rs.direction.dy;
        const perpX = -dy;
        const perpY = dx;

        g.fillStyle(this.hslToHex(rs.hue, 90, 70), 0.3);
        g.fillCircle(seg.x - dx * 3, seg.y - dy * 3, size * 1.8);

        const eyeOffset = 4;
        const eyeForward = 5;
        const leftEyeX = seg.x + perpX * eyeOffset + dx * eyeForward;
        const leftEyeY = seg.y + perpY * eyeOffset + dy * eyeForward;
        const rightEyeX = seg.x - perpX * eyeOffset + dx * eyeForward;
        const rightEyeY = seg.y - perpY * eyeOffset + dy * eyeForward;

        const eyeColor = rs.state === 'hunting' ? 0xff4444 :
                         rs.state === 'fleeing' ? 0xffff44 : 0x44ffff;

        g.fillStyle(0x000000, 0.9 * segmentPulse);
        g.fillCircle(leftEyeX, leftEyeY, 4);
        g.fillCircle(rightEyeX, rightEyeY, 4);

        g.fillStyle(eyeColor, 0.9 * segmentPulse);
        g.fillCircle(leftEyeX, leftEyeY, 3);
        g.fillCircle(rightEyeX, rightEyeY, 3);

        g.fillStyle(0xffffff, 0.95 * segmentPulse);
        g.fillCircle(leftEyeX + dx, leftEyeY + dy, 1.2);
        g.fillCircle(rightEyeX + dx, rightEyeY + dy, 1.2);

        const hornLength = 8;
        const hornAngle = 0.4;
        g.lineStyle(3, this.hslToHex(rs.hue - 20, 70, 45), 0.8 * segmentPulse);
        g.beginPath();
        g.moveTo(seg.x + perpX * 5, seg.y + perpY * 5);
        g.lineTo(
          seg.x + perpX * 5 + Math.cos(Math.atan2(dy, dx) - hornAngle) * hornLength,
          seg.y + perpY * 5 + Math.sin(Math.atan2(dy, dx) - hornAngle) * hornLength
        );
        g.strokePath();
        g.beginPath();
        g.moveTo(seg.x - perpX * 5, seg.y - perpY * 5);
        g.lineTo(
          seg.x - perpX * 5 + Math.cos(Math.atan2(dy, dx) + hornAngle) * hornLength,
          seg.y - perpY * 5 + Math.sin(Math.atan2(dy, dx) + hornAngle) * hornLength
        );
        g.strokePath();
      }
    }
  }

  private drawElectricArc(g: Phaser.GameObjects.Graphics, x1: number, y1: number, x2: number, y2: number, life: number): void {
    const segments = 6;
    const dx = (x2 - x1) / segments;
    const dy = (y2 - y1) / segments;
    const jitter = 15 * life;

    g.lineStyle(4, 0x00ffff, 0.2 * life);
    g.beginPath();
    g.moveTo(x1, y1);
    for (let i = 1; i < segments; i++) {
      const jx = (Math.random() - 0.5) * jitter;
      const jy = (Math.random() - 0.5) * jitter;
      g.lineTo(x1 + dx * i + jx, y1 + dy * i + jy);
    }
    g.lineTo(x2, y2);
    g.strokePath();

    g.lineStyle(2, 0x88ffff, 0.5 * life);
    g.beginPath();
    g.moveTo(x1, y1);
    for (let i = 1; i < segments; i++) {
      const jx = (Math.random() - 0.5) * jitter * 0.5;
      const jy = (Math.random() - 0.5) * jitter * 0.5;
      g.lineTo(x1 + dx * i + jx, y1 + dy * i + jy);
    }
    g.lineTo(x2, y2);
    g.strokePath();

    g.lineStyle(1, 0xffffff, 0.8 * life);
    g.beginPath();
    g.moveTo(x1, y1);
    g.lineTo(x2, y2);
    g.strokePath();
  }

  private spawnBee(): void {
    if (this.bees.length >= NUM_BEES) return;

    const width = GRID_SIZE * CELL_SIZE;
    const height = GRID_SIZE * CELL_SIZE;

    // Spawn from random edge
    const edge = Math.floor(Math.random() * 4);
    let x: number, y: number;

    switch (edge) {
      case 0: // top
        x = Math.random() * width;
        y = -20;
        break;
      case 1: // right
        x = width + 20;
        y = Math.random() * height;
        break;
      case 2: // bottom
        x = Math.random() * width;
        y = height + 20;
        break;
      default: // left
        x = -20;
        y = Math.random() * height;
        break;
    }

    // Random target inside the play area
    const targetX = 50 + Math.random() * (width - 100);
    const targetY = 50 + Math.random() * (height - 100);

    this.bees.push({
      x,
      y,
      vx: 0,
      vy: 0,
      targetX,
      targetY,
      wingPhase: Math.random() * Math.PI * 2,
      wingSpeed: 0.4 + Math.random() * 0.2,
      size: 6 + Math.random() * 3,
      hue: 0 + Math.random() * 20, // Crimson/red volcanic color
      glowIntensity: 0.5 + Math.random() * 0.5,
      bobPhase: Math.random() * Math.PI * 2,
      bobSpeed: 0.08 + Math.random() * 0.04,
      trail: [],
      state: 'flying',
      sparkleTimer: 0,
    });
  }

  private updateBees(): void {
    if (!this.currentState) return;

    const width = GRID_SIZE * CELL_SIZE;
    const height = GRID_SIZE * CELL_SIZE;
    const foodX = this.currentState.food.x * CELL_SIZE + CELL_SIZE / 2;
    const foodY = this.currentState.food.y * CELL_SIZE + CELL_SIZE / 2;
    const gameOver = this.currentState.gameOver;

    // Randomly spawn new bees
    if (!gameOver && Math.random() < BEE_SPAWN_CHANCE && this.bees.length < NUM_BEES) {
      this.spawnBee();
    }

    for (let i = this.bees.length - 1; i >= 0; i--) {
      const bee = this.bees[i];

      // Update wing animation
      bee.wingPhase += bee.wingSpeed;
      bee.bobPhase += bee.bobSpeed;
      bee.sparkleTimer += 0.1;

      // Store trail position
      if (this.frameCount % 2 === 0) {
        bee.trail.unshift({ x: bee.x, y: bee.y, alpha: 0.6 });
        if (bee.trail.length > 8) bee.trail.pop();
      }

      // Fade trail
      for (const t of bee.trail) {
        t.alpha *= 0.85;
      }
      bee.trail = bee.trail.filter(t => t.alpha > 0.05);

      // Bees are attracted to food
      const dxFood = foodX - bee.x;
      const dyFood = foodY - bee.y;
      const distFood = Math.sqrt(dxFood * dxFood + dyFood * dyFood);

      // Determine behavior based on distance to food
      if (distFood < 80) {
        bee.state = 'attracted';
        bee.targetX = foodX + Math.cos(bee.bobPhase * 3) * 30;
        bee.targetY = foodY + Math.sin(bee.bobPhase * 3) * 30;
      } else if (distFood < 150) {
        bee.state = 'hovering';
        // Circle around food loosely
        const angle = Math.atan2(dyFood, dxFood) + Math.sin(bee.bobPhase) * 0.5;
        bee.targetX = foodX - Math.cos(angle) * 60;
        bee.targetY = foodY - Math.sin(angle) * 60;
      } else {
        bee.state = 'flying';
        // Wander towards food with some randomness
        if (Math.random() < 0.02) {
          bee.targetX = foodX + (Math.random() - 0.5) * 200;
          bee.targetY = foodY + (Math.random() - 0.5) * 200;
        }
      }

      // Move towards target with smooth steering
      const dx = bee.targetX - bee.x;
      const dy = bee.targetY - bee.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > 1) {
        const speed = bee.state === 'attracted' ? 2.5 : (bee.state === 'hovering' ? 1.5 : 2);
        const ax = (dx / dist) * speed * 0.1;
        const ay = (dy / dist) * speed * 0.1;

        bee.vx += ax;
        bee.vy += ay;

        // Add bobbing motion
        bee.vy += Math.sin(bee.bobPhase) * 0.05;
      }

      // Limit velocity
      const maxSpeed = bee.state === 'attracted' ? 3 : 2;
      const currentSpeed = Math.sqrt(bee.vx * bee.vx + bee.vy * bee.vy);
      if (currentSpeed > maxSpeed) {
        bee.vx = (bee.vx / currentSpeed) * maxSpeed;
        bee.vy = (bee.vy / currentSpeed) * maxSpeed;
      }

      // Apply velocity with damping
      bee.x += bee.vx;
      bee.y += bee.vy;
      bee.vx *= 0.95;
      bee.vy *= 0.95;

      // Pulsing glow when near food
      if (bee.state === 'attracted') {
        bee.glowIntensity = 0.7 + Math.sin(bee.bobPhase * 4) * 0.3;
      } else {
        bee.glowIntensity = 0.5 + Math.sin(bee.bobPhase * 2) * 0.2;
      }

      // Remove bees that fly too far off screen
      if (bee.x < -100 || bee.x > width + 100 || bee.y < -100 || bee.y > height + 100) {
        this.bees.splice(i, 1);
      }

      // Scatter bees on game over
      if (gameOver) {
        bee.targetX = bee.x + (Math.random() - 0.5) * 400;
        bee.targetY = bee.y - 200 - Math.random() * 200;
        bee.vx += (Math.random() - 0.5) * 2;
        bee.vy -= 1 + Math.random();
      }
    }
  }

  private drawBees(g: Phaser.GameObjects.Graphics): void {
    for (const bee of this.bees) {
      const { x, y, size, wingPhase, hue, glowIntensity, trail, state, sparkleTimer } = bee;

      // Draw trail
      for (let i = 0; i < trail.length; i++) {
        const t = trail[i];
        const trailSize = size * 0.4 * (1 - i / trail.length);
        g.fillStyle(this.hslToHex(hue, 80, 60), t.alpha * 0.4);
        g.fillCircle(t.x, t.y, trailSize);
      }

      // Outer glow
      const glowSize = size * 2 * glowIntensity;
      g.fillStyle(this.hslToHex(hue, 90, 50), 0.2 * glowIntensity);
      g.fillCircle(x, y, glowSize);

      // Mid glow
      g.fillStyle(this.hslToHex(hue, 85, 60), 0.3 * glowIntensity);
      g.fillCircle(x, y, glowSize * 0.6);

      // Bee body - striped pattern
      const bodyLength = size * 1.2;
      const bodyWidth = size * 0.7;

      // Body shadow/glow
      g.fillStyle(this.hslToHex(hue, 70, 30), 0.5);
      g.fillEllipse(x, y, bodyLength + 2, bodyWidth + 2);

      // Main body (amber/golden)
      g.fillStyle(this.hslToHex(hue, 90, 55), 1);
      g.fillEllipse(x, y, bodyLength, bodyWidth);

      // Dark stripes
      g.fillStyle(0x1a1a1a, 0.8);
      g.fillRect(x - bodyLength * 0.15, y - bodyWidth / 2, bodyLength * 0.15, bodyWidth);
      g.fillRect(x + bodyLength * 0.15, y - bodyWidth / 2, bodyLength * 0.15, bodyWidth);

      // Head
      g.fillStyle(this.hslToHex(hue - 10, 80, 40), 1);
      g.fillCircle(x - bodyLength * 0.4, y, size * 0.4);

      // Wings - animated flutter
      const wingAngle = Math.sin(wingPhase) * 0.8;
      const wingSize = size * 0.9;

      // Wing glow (ethereal effect)
      g.fillStyle(0xffffff, 0.2 + Math.abs(Math.sin(wingPhase)) * 0.2);
      g.fillEllipse(x + Math.cos(wingAngle + 0.5) * wingSize * 0.3, y - wingSize * 0.5, wingSize * 0.8, wingSize * 0.4);
      g.fillEllipse(x + Math.cos(-wingAngle + 0.5) * wingSize * 0.3, y + wingSize * 0.5, wingSize * 0.8, wingSize * 0.4);

      // Wing bodies
      g.fillStyle(0xffffff, 0.5 + Math.abs(Math.sin(wingPhase)) * 0.3);
      g.fillEllipse(x + Math.cos(wingAngle) * wingSize * 0.2, y - wingSize * 0.4, wingSize * 0.6, wingSize * 0.3);
      g.fillEllipse(x + Math.cos(-wingAngle) * wingSize * 0.2, y + wingSize * 0.4, wingSize * 0.6, wingSize * 0.3);

      // Eyes
      g.fillStyle(0x000000, 1);
      g.fillCircle(x - bodyLength * 0.45, y - size * 0.12, size * 0.12);
      g.fillCircle(x - bodyLength * 0.45, y + size * 0.12, size * 0.12);

      // Sparkles when attracted to food
      if (state === 'attracted' && Math.sin(sparkleTimer * 3) > 0.7) {
        const sparkleAngle = sparkleTimer * 2;
        const sparkleDist = size * 1.5;
        const sparkleX = x + Math.cos(sparkleAngle) * sparkleDist;
        const sparkleY = y + Math.sin(sparkleAngle) * sparkleDist;

        g.fillStyle(0xffffff, 0.8);
        g.fillCircle(sparkleX, sparkleY, 2);
        g.fillStyle(this.hslToHex(hue, 100, 80), 0.6);
        g.fillCircle(sparkleX, sparkleY, 3);
      }
    }
  }

  // Helper to convert HSL to hex for Phaser
  private hslToHex(h: number, s: number, l: number): number {
    h = h / 360;
    s = s / 100;
    l = l / 100;

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

    return (Math.round(r * 255) << 16) + (Math.round(g * 255) << 8) + Math.round(b * 255);
  }

  private updateGuardianSpirits(): void {
    if (!this.currentState) return;

    const width = GRID_SIZE * CELL_SIZE;
    const height = GRID_SIZE * CELL_SIZE;
    const gameOver = this.currentState.gameOver;
    const snakeHead = this.currentState.snake.length > 0 ? this.currentState.snake[0] : null;

    for (const spirit of this.guardianSpirits) {
      spirit.phase += spirit.speed;
      spirit.haloPhase += 0.04;
      spirit.orbPhase += 0.02;

      for (const orb of spirit.orbs) {
        orb.angle += orb.speed;
      }

      const floatAmount = gameOver ? 20 : 12;
      const waveAmount = 5;
      const wave = Math.sin(spirit.phase) * waveAmount;

      let targetX = spirit.baseX;
      let targetY = spirit.baseY;

      switch (spirit.edge) {
        case 'top':
          targetY = spirit.baseY + floatAmount + wave;
          targetX = spirit.baseX + Math.sin(spirit.phase * 0.7) * 8;
          break;
        case 'bottom':
          targetY = spirit.baseY - floatAmount - wave;
          targetX = spirit.baseX + Math.sin(spirit.phase * 0.7) * 8;
          break;
        case 'left':
          targetX = spirit.baseX + floatAmount + wave;
          targetY = spirit.baseY + Math.sin(spirit.phase * 0.7) * 8;
          break;
        case 'right':
          targetX = spirit.baseX - floatAmount - wave;
          targetY = spirit.baseY + Math.sin(spirit.phase * 0.7) * 8;
          break;
      }

      if (snakeHead && !gameOver) {
        const headX = snakeHead.x * CELL_SIZE + CELL_SIZE / 2;
        const headY = snakeHead.y * CELL_SIZE + CELL_SIZE / 2;
        const dx = spirit.x - headX;
        const dy = spirit.y - headY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 120) {
          const attraction = (120 - dist) / 120 * 15;
          targetX += (dx / dist) * attraction;
          targetY += (dy / dist) * attraction;
        }
      }

      spirit.x += (targetX - spirit.x) * 0.04;
      spirit.y += (targetY - spirit.y) * 0.04;
      spirit.x = Math.max(-50, Math.min(width + 50, spirit.x));
      spirit.y = Math.max(-50, Math.min(height + 50, spirit.y));

      const baseAlpha = gameOver ? 0.8 : spirit.targetAlpha;
      spirit.currentAlpha += (baseAlpha - spirit.currentAlpha) * 0.05;
    }
  }

  private drawGuardianSpirits(g: Phaser.GameObjects.Graphics): void {
    for (const spirit of this.guardianSpirits) {
      if (spirit.currentAlpha < 0.01) continue;

      const { x, y, size, phase, haloPhase, currentAlpha, hue, orbs } = spirit;
      const breathPulse = 1 + Math.sin(phase * 2) * 0.15;
      const coreSize = size * breathPulse;

      const spiritColor = this.hslToHex(hue, 0.7, 0.6);
      const glowColor = this.hslToHex(hue, 0.5, 0.8);
      const haloColor = this.hslToHex(hue, 0.3, 0.9);

      g.fillStyle(glowColor, currentAlpha * 0.1);
      g.fillCircle(x, y, coreSize * 2.5);

      g.fillStyle(glowColor, currentAlpha * 0.15);
      g.fillCircle(x, y, coreSize * 1.8);

      const haloRadius = coreSize * 1.4 + Math.sin(haloPhase) * 3;
      g.lineStyle(2, haloColor, currentAlpha * 0.4);
      g.strokeCircle(x, y, haloRadius);

      const innerHaloRadius = coreSize * 1.1 + Math.sin(haloPhase + 1) * 2;
      g.lineStyle(1.5, haloColor, currentAlpha * 0.3);
      g.strokeCircle(x, y, innerHaloRadius);

      for (const orb of orbs) {
        const orbX = x + Math.cos(orb.angle) * orb.distance;
        const orbY = y + Math.sin(orb.angle) * orb.distance;
        const orbPulse = 1 + Math.sin(phase + orb.angle) * 0.3;

        g.fillStyle(glowColor, currentAlpha * 0.3);
        g.fillCircle(orbX, orbY, orb.size * orbPulse * 1.5);

        g.fillStyle(spiritColor, currentAlpha * 0.8);
        g.fillCircle(orbX, orbY, orb.size * orbPulse);
      }

      g.fillStyle(spiritColor, currentAlpha * 0.9);
      g.fillCircle(x, y, coreSize * 0.5);

      g.fillStyle(0xffffff, currentAlpha * 0.7);
      g.fillCircle(x, y, coreSize * 0.25);

      const sparkleCount = 4;
      for (let i = 0; i < sparkleCount; i++) {
        const sparkleAngle = (i / sparkleCount) * Math.PI * 2 + phase * 0.5;
        const sparkleDist = coreSize * (0.8 + Math.sin(phase * 2 + i) * 0.3);
        const sparkleX = x + Math.cos(sparkleAngle) * sparkleDist;
        const sparkleY = y + Math.sin(sparkleAngle) * sparkleDist;
        const sparkleSize = 1.5 + Math.sin(phase * 3 + i * 2) * 0.5;

        g.fillStyle(0xffffff, currentAlpha * (0.4 + Math.sin(phase * 2 + i) * 0.3));
        g.fillCircle(sparkleX, sparkleY, sparkleSize);
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
    const hues = [0, 15, 30]; // Red/orange volcanic variations
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
    // Aurora hues: volcanic reds, oranges, crimsons
    const auroraHues = [0, 10, 20, 30, 350];
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
    // Volcanic smoke and lava glow colors: reds, oranges, crimsons
    const nebulaHues = [0, 10, 20, 30, 350, 340];
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
    const ringHues = [0, 10, 20, 30, 350];
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
      hue: Math.random() < 0.3 ? 0 + Math.random() * 30 : 20 + Math.random() * 40, // Red or orange volcanic
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
      this.spawnChaosExplosion(headX, headY);
      spawnNuclearBlast(this.nuclearBlast, headX, headY);
      this.screenFlashAlpha = 0.25;
      this.chromaticIntensity = 1.5;
      this.energyFieldPulse = 1.0;
      spawnDramaRings(this.cleanEffects, headX, headY);
      spawnPulseGlow(this.pulseGlow, headX, headY, 1.0, this.hueOffset);
      triggerCombo(this.comboStreak, headX, headY, this.frameCount);
      advanceFlag(this.flagDisplay);
      const foodPx = state.food.x * CELL_SIZE + CELL_SIZE / 2;
      const foodPy = state.food.y * CELL_SIZE + CELL_SIZE / 2;
      fireLaser(this.laserBeam, headX, headY, foodPx, foodPy);
      this.hugeHead = triggerChomp(this.hugeHead);
    }
    this.lastSnakeLength = state.snake.length;

    // Detect food position change - trigger thrown food animation
    const newFood = state.food;
    if (this.lastFoodPos && (newFood.x !== this.lastFoodPos.x || newFood.y !== this.lastFoodPos.y)) {
      this.spawnThrownFood(newFood.x, newFood.y);
    } else if (!this.lastFoodPos && !state.gameOver) {
      // First food spawn
      this.spawnThrownFood(newFood.x, newFood.y);
    }
    this.lastFoodPos = { x: newFood.x, y: newFood.y };

    // Create afterimage when snake moves
    if (this.currentState && state.snake.length > 0) {
      const oldHead = this.currentState.snake[0];
      const newHead = state.snake[0];
      if (oldHead && newHead && (oldHead.x !== newHead.x || oldHead.y !== newHead.y)) {
        this.spawnAfterimage(this.currentState.snake);
      }
    }

    // Detect game over transition - cinematic death with 2-second delay
    if (state.gameOver && this.currentState && !this.currentState.gameOver) {
      this.chromaticIntensity = 3.0;
      this.chaosIntensity = 1.0;
      this.spawnDeathExplosion();
      this.deathMessage = pickDeathMessage();
      this.deathReasonText = pickDeathReason(state.deathReason ?? null);
      this.gameOverRevealProgress = 0;
      this.gameOverScoreAnimPhase = 0;
      this.spawnGameOverEffects();
      for (let i = 0; i < Math.min(3, state.snake.length); i++) {
        const seg = state.snake[Math.floor(i * state.snake.length / 3)];
        setTimeout(() => {
          this.spawnChaosExplosion(
            seg.x * CELL_SIZE + CELL_SIZE / 2,
            seg.y * CELL_SIZE + CELL_SIZE / 2
          );
        }, i * 50);
      }
      triggerDeathCinematic(this.deathCinematic, state.snake, CELL_SIZE);
      this.deathDelayFrames = 0;
      this.deathDelayActive = true;
    }

    const foodEaten = state.foodEaten || 0;
    if (foodEaten > this.lastFoodEaten) {
      this.upgradeState = tickUpgrades(this.upgradeState, foodEaten);
    }
    this.lastFoodEaten = foodEaten;

    if (state.gameStarted && !state.gameOver && this.currentState?.gameOver) {
      this.upgradeState = createUpgradeState();
      this.upgradeHud = createUpgradeHudState();
      this.lastFoodEaten = 0;
      this.sudoku = resetSudokuVisited(this.sudoku);
      this.deathCinematic = createDeathCinematicState();
      this.deathDelayActive = false;
      this.deathDelayFrames = 0;
    }

    this.currentState = state;
    this.needsRedraw = true;
    if (!state.gameOver) {
      this.gameOverAlpha = 0;
      this.gameOverGlitchOffset = 0;
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

  private spawnThrownFood(targetGridX: number, targetGridY: number): void {
    const width = GRID_SIZE * CELL_SIZE;
    const height = GRID_SIZE * CELL_SIZE;
    const targetX = targetGridX * CELL_SIZE + CELL_SIZE / 2;
    const targetY = targetGridY * CELL_SIZE + CELL_SIZE / 2;

    // Choose random edge to throw from
    const edge = Math.floor(Math.random() * 4);
    let startX: number, startY: number;

    switch (edge) {
      case 0: // top
        startX = Math.random() * width;
        startY = -40;
        break;
      case 1: // right
        startX = width + 40;
        startY = Math.random() * height;
        break;
      case 2: // bottom
        startX = Math.random() * width;
        startY = height + 40;
        break;
      default: // left
        startX = -40;
        startY = Math.random() * height;
        break;
    }

    this.thrownFood = {
      startX,
      startY,
      targetX,
      targetY,
      x: startX,
      y: startY,
      progress: 0,
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 0.6,
      trail: [],
      landed: false,
      landingParticles: [],
      impactRings: [],
    };
  }

  private updateThrownFood(): void {
    if (!this.thrownFood) return;

    const tf = this.thrownFood;

    if (!tf.landed) {
      // Update progress
      tf.progress += 0.04;

      // Store trail
      if (this.frameCount % 2 === 0) {
        tf.trail.unshift({ x: tf.x, y: tf.y, alpha: 1, rotation: tf.rotation });
        if (tf.trail.length > 12) tf.trail.pop();
      }

      // Fade trail
      for (const t of tf.trail) {
        t.alpha *= 0.85;
      }
      tf.trail = tf.trail.filter(t => t.alpha > 0.05);

      // Calculate position with parabolic arc
      const t = tf.progress;
      const arcHeight = 80;
      const arc = 4 * arcHeight * t * (1 - t);
      tf.x = tf.startX + (tf.targetX - tf.startX) * t;
      tf.y = tf.startY + (tf.targetY - tf.startY) * t - arc;

      // Rotation
      tf.rotation += tf.rotationSpeed;

      // Check if landed
      if (tf.progress >= 1) {
        tf.landed = true;
        tf.x = tf.targetX;
        tf.y = tf.targetY;

        // Spawn landing effects

        // Impact rings
        tf.impactRings = [
          { radius: 5, alpha: 1 },
          { radius: 3, alpha: 0.8 },
        ];

        // Landing particles
        for (let i = 0; i < 10; i++) {
          const angle = (i / 10) * Math.PI * 2 + Math.random() * 0.3;
          const speed = 2 + Math.random() * 3;
          tf.landingParticles.push({
            x: tf.targetX,
            y: tf.targetY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 1,
            life: 1,
            size: 2 + Math.random() * 3,
          });
        }
      }
    } else {
      // Update landing effects
      for (const ring of tf.impactRings) {
        ring.radius += 3;
        ring.alpha *= 0.9;
      }
      tf.impactRings = tf.impactRings.filter(r => r.alpha > 0.05);

      for (let i = tf.landingParticles.length - 1; i >= 0; i--) {
        const p = tf.landingParticles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15;
        p.vx *= 0.98;
        p.life -= 0.04;
        if (p.life <= 0) {
          tf.landingParticles.splice(i, 1);
        }
      }

      // Fade trail
      for (const t of tf.trail) {
        t.alpha *= 0.8;
      }
      tf.trail = tf.trail.filter(t => t.alpha > 0.05);

      // Clear thrown food when effects are done
      if (tf.impactRings.length === 0 && tf.landingParticles.length === 0 && tf.trail.length === 0) {
        this.thrownFood = null;
      }
    }
  }

  private drawThrownFood(g: Phaser.GameObjects.Graphics): void {
    if (!this.thrownFood) return;

    const tf = this.thrownFood;

    // Draw trail
    for (let i = 0; i < tf.trail.length; i++) {
      const t = tf.trail[i];
      const trailProgress = i / tf.trail.length;
      const trailSize = (CELL_SIZE / 2) * (1 - trailProgress * 0.5) * t.alpha;

      // Trail glow
      g.fillStyle(COLORS.foodGlow, t.alpha * 0.3);
      g.fillCircle(t.x, t.y, trailSize * 1.5);

      // Trail core
      g.fillStyle(COLORS.food, t.alpha * 0.6);
      g.fillCircle(t.x, t.y, trailSize);
    }

    // Draw impact rings
    for (const ring of tf.impactRings) {
      g.lineStyle(3, COLORS.foodGlow, ring.alpha * 0.5);
      g.strokeCircle(tf.targetX, tf.targetY, ring.radius);
      g.lineStyle(1.5, COLORS.noirWhite, ring.alpha * 0.7);
      g.strokeCircle(tf.targetX, tf.targetY, ring.radius);
    }

    // Draw landing particles
    for (const p of tf.landingParticles) {
      g.fillStyle(COLORS.foodGlow, p.life * 0.6);
      g.fillCircle(p.x, p.y, p.size * 1.3 * p.life);
      g.fillStyle(COLORS.noirWhite, p.life * 0.9);
      g.fillCircle(p.x, p.y, p.size * p.life);
    }

    // Draw the flying food if not landed
    if (!tf.landed) {
      const scale = 0.8 + tf.progress * 0.4;
      const foodSize = (CELL_SIZE / 2) * scale;

      // Motion blur glow
      g.fillStyle(COLORS.foodGlow, 0.3);
      g.fillCircle(tf.x, tf.y, foodSize * 2);

      // Outer glow
      g.fillStyle(COLORS.noirWhite, 0.4);
      g.fillCircle(tf.x, tf.y, foodSize * 1.5);

      // Main food body
      g.fillStyle(COLORS.food, 0.95);
      g.fillCircle(tf.x, tf.y, foodSize);

      // Spinning highlight
      const highlightAngle = tf.rotation;
      const highlightX = tf.x + Math.cos(highlightAngle) * foodSize * 0.3;
      const highlightY = tf.y + Math.sin(highlightAngle) * foodSize * 0.3;
      g.fillStyle(0xffffff, 0.9);
      g.fillCircle(highlightX, highlightY, foodSize * 0.25);

      // Secondary sparkle
      const sparkleAngle = tf.rotation + Math.PI * 0.7;
      const sparkleX = tf.x + Math.cos(sparkleAngle) * foodSize * 0.4;
      const sparkleY = tf.y + Math.sin(sparkleAngle) * foodSize * 0.4;
      g.fillStyle(0xffffff, 0.6);
      g.fillCircle(sparkleX, sparkleY, foodSize * 0.15);
    }
  }

  update(): void {
    this.frameCount++;
    this.cleanEffects.frameCount = this.frameCount;

    const width = this.scale.width;
    const height = this.scale.height;

    updateSpaceBackground(this.spaceBackground, width, height);
    updateMotes(this.cleanEffects, width, height);
    updateRipples(this.cleanEffects);
    updateFoodOrbits(this.cleanEffects);
    updateScoreBursts(this.mathParticles);
    updateNuclearBlasts(this.nuclearBlast);
    updateComboStreak(this.comboStreak);
    updateWandSparkles(this.wizardEffects);
    updateSnitchWings(this.wizardEffects);
    updateSpellTexts(this.wizardEffects);
    updateCosmicCrown(this.cosmicCrown, width);
    updateCountryMap(this.countryMap, this.flagDisplay.currentFlag.code, this.frameCount);
    updateWeather(this.weather, this.currentState?.foodEaten || 0, width, height, this.frameCount);
    updateSciFi(this.sciFi, width, height);
    updateElectricStorm(
      this.electricStorm,
      this.currentState?.snake || [],
      CELL_SIZE,
      this.frameCount
    );

    if (this.currentState && this.currentState.gameStarted) {
      const score = this.currentState.score || 0;
      const snakeLen = this.currentState.snake.length;
      const foodEaten = this.currentState.foodEaten || 0;
      const eff = computeEfficiency(score, snakeLen, foodEaten, this.efficiencyStreak);
      if (eff.grade !== this.lastEfficiency.grade && foodEaten > 0) {
        const headSeg = this.currentState.snake[0];
        if (headSeg) {
          const px = headSeg.x * CELL_SIZE + CELL_SIZE / 2;
          const py = headSeg.y * CELL_SIZE + CELL_SIZE / 2;
          spawnGradePulse(this.optimization, px, py, eff.grade);
        }
        this.optimization.meterGlow = 1;
      }
      this.efficiencyStreak = eff.streak;
      this.lastEfficiency = eff;
      updateOptimizationEffects(this.optimization, eff.grade, eff.ratio);
    }

    if (this.currentState && this.currentState.gameStarted && !this.currentState.gameOver) {
      this.sudoku = updateSudokuVisited(this.sudoku, this.currentState.snake);
    }
    this.sudoku = updateSudokuEffects(this.sudoku);

    {
      const police = this.currentState?.police;
      const policeSegments = police?.segments || [];
      const policeActive = police?.active || false;
      const caughtFlash = police?.caughtFlash || 0;
      const justCaught = caughtFlash > this.lastPoliceCaughtFlash && caughtFlash > 0;
      this.lastPoliceCaughtFlash = caughtFlash;
      this.policeVisuals = updatePoliceVisuals(
        this.policeVisuals,
        policeSegments,
        CELL_SIZE,
        policeActive,
        justCaught
      );
    }

    if (this.currentState && this.currentState.snake.length > 0) {
      const head = this.currentState.snake[0];
      const headX = head.x * CELL_SIZE + CELL_SIZE / 2;
      const headY = head.y * CELL_SIZE + CELL_SIZE / 2;

      let dirX = 1;
      let dirY = 0;
      if (this.lastHeadPos) {
        const dx = head.x - this.lastHeadPos.x;
        const dy = head.y - this.lastHeadPos.y;
        if (dx !== 0 || dy !== 0) {
          dirX = dx;
          dirY = dy;
        }
      }
      this.lastHeadPos = { x: head.x, y: head.y };

      this.snakeDirection = dirToFaceDirection(dirX, dirY);
      this.faceState = updateFaceState(
        this.faceState,
        this.frameCount,
        this.currentState.foodEaten || 0
      );

      const headSize = CELL_SIZE - 2;
      const snoutTip = computeSnoutTip(headX, headY, headSize * 1.12, this.snakeDirection);
      const breathVec = getDirectionVectors(this.snakeDirection);
      updateDragonBreath(this.dragonBreath, snoutTip.tipX, snoutTip.tipY, breathVec.fx, breathVec.fy);
      this.hugeHead = updateHugeHead(this.hugeHead, snoutTip.tipX, snoutTip.tipY);
      updatePatronusTrail(this.patronusTrail, headX, headY);

      const foodPos = this.currentState.food;
      const laserFoodX = foodPos.x * CELL_SIZE + CELL_SIZE / 2;
      const laserFoodY = foodPos.y * CELL_SIZE + CELL_SIZE / 2;
      const laserHit = updateLaserBeams(
        this.laserBeam,
        headX, headY,
        laserFoodX, laserFoodY,
        this.currentState.gameStarted !== false,
        this.currentState.gameOver
      );
      if (laserHit) {
        spawnPulseGlow(this.pulseGlow, laserFoodX, laserFoodY, 0.6, this.hueOffset);
        triggerScreenShake(this.cleanEffects, 5);
        this.screenFlashAlpha = Math.max(this.screenFlashAlpha, 0.15);
      }

      if (this.frameCount % 3 === 0) {
        spawnWandSparkles(this.wizardEffects, headX, headY, 1);
      }

      if (this.lastSnakeLength > 0 && this.currentState.snake.length > this.lastSnakeLength) {
        const food = this.currentState.food;
        const foodX = food.x * CELL_SIZE + CELL_SIZE / 2;
        const foodY = food.y * CELL_SIZE + CELL_SIZE / 2;
        spawnRipple(this.cleanEffects, foodX, foodY);
        spawnWandSparkles(this.wizardEffects, foodX, foodY, 8);
        spawnSpellText(this.wizardEffects, width);
        for (let ci = 0; ci < 3; ci++) {
          spawnCodeParticle(this.optimization, headX + (Math.random() - 0.5) * 20, headY - 10, this.lastEfficiency.grade);
        }
        const points = (this.currentState.score || 0) - this.lastHudScore;
        spawnScoreBurst(this.mathParticles, headX, headY - CELL_SIZE, points > 0 ? points : 10);
        spawnStarBurst(this.cosmicCrown, foodX, foodY, this.currentState.foodEaten || 0);
        spawnShieldRing(this.sciFi, foodX, foodY);
        spawnShieldRing(this.sciFi, headX, headY);
        triggerElectricBurst(this.electricStorm, headX, headY, CELL_SIZE * 3);
      }
      this.lastSnakeLength = this.currentState.snake.length;
    }

    const g = this.graphics;
    g.clear();

    const shake = dramaShakeOffset(this.cleanEffects);
    g.setPosition(shake.x, shake.y);

    drawSpaceBackground(g, this.spaceBackground, width, height);
    drawSciFiGrid(g, this.sciFi, width, height, CELL_SIZE, GRID_SIZE);
    drawCrownStars(g, this.cosmicCrown);
    drawCrownBeam(g, this.cosmicCrown.beam);
    drawSudokuGrid(g, this.sudoku, CELL_SIZE, GRID_SIZE, this.frameCount, this.drawDigit.bind(this));
    drawMotes(g, this.cleanEffects);

    if (!this.currentState) return;

    drawRipples(g, this.cleanEffects);

    const food = this.currentState.food;
    const foodX = food.x * CELL_SIZE + CELL_SIZE / 2;
    const foodY = food.y * CELL_SIZE + CELL_SIZE / 2;

    if (this.currentState.snake.length > 0 && !this.currentState.gameOver) {
      const head = this.currentState.snake[0];
      const headPx = head.x * CELL_SIZE + CELL_SIZE / 2;
      const headPy = head.y * CELL_SIZE + CELL_SIZE / 2;
      drawTargetingLine(g, this.laserBeam, headPx, headPy, foodX, foodY, this.frameCount);
    }

    drawFlagFood(g, this.flagDisplay.currentFlag, foodX, foodY, CELL_SIZE, this.frameCount);
    drawCountryLabel(g, this.flagDisplay.currentFlag, foodX, foodY, CELL_SIZE, this.frameCount, this.drawText.bind(this));
    drawSnitchWings(g, this.wizardEffects, foodX, foodY, CELL_SIZE);
    drawFoodOrbits(g, this.cleanEffects, foodX, foodY, CELL_SIZE);
    drawHoloFood(g, this.sciFi, foodX, foodY, CELL_SIZE);

    drawPatronusTrail(g, this.patronusTrail);
    drawSolidSnake(g, this.currentState.snake, CELL_SIZE, this.frameCount, this.snakeDirection, this.faceState, this.hugeHead);
    drawSnakeEnergyField(g, this.sciFi, this.currentState.snake, CELL_SIZE);
    drawElectricStorm(g, this.electricStorm, this.frameCount);
    this.drawDroolDrops(g);
    drawWandSparkles(g, this.wizardEffects);
    drawDragonBreath(g, this.dragonBreath);
    drawLaserBeams(g, this.laserBeam, this.frameCount);
    drawNuclearBlasts(g, this.nuclearBlast);
    drawScoreBursts(g, this.mathParticles, this.drawDigit.bind(this));
    drawStarBursts(g, this.cosmicCrown, this.drawText.bind(this));

    {
      const police = this.currentState.police;
      drawPoliceVisuals(
        g,
        this.policeVisuals,
        police?.segments || [],
        CELL_SIZE,
        police?.active || false
      );
    }

    drawShieldRings(g, this.sciFi);
    drawWeather(g, this.weather, width, height, this.frameCount);
    drawCleanVignette(g, width, height);
    drawCornerHUD(g, this.sciFi, width, height);
    drawSpellTexts(g, this.wizardEffects, this.drawText.bind(this));
    drawComboStreak(g, this.comboStreak, width, height, this.drawText.bind(this));

    const score = this.currentState.score || 0;
    const snakeLength = this.currentState.snake.length;
    const foodEaten = this.currentState.foodEaten || 0;
    drawCleanHUD(g, score, snakeLength, width, this.frameCount, this.drawDigit.bind(this), foodEaten);
    drawWeatherIndicator(g, this.weather, width, this.frameCount, this.drawDigit.bind(this));
    drawCodeParticles(g, this.optimization, this.drawLetter.bind(this), this.drawDigit.bind(this));
    drawOptimizationMeter(g, this.optimization, this.lastEfficiency.grade, width, this.frameCount, this.drawDigit.bind(this));

    if (this.currentState.gameOver) {
      updateDeathCinematic(this.deathCinematic);
      drawDeathCinematic(this.deathCinematic, g, width, height, this.frameCount);

      if (this.deathDelayActive) {
        this.deathDelayFrames++;
        if (this.deathDelayFrames >= 120) {
          this.deathDelayActive = false;
        }
      }

      if (!this.deathDelayActive) {
        this.drawGameOver(g, width, height);
        this.drawGameOverScore(g, width, height);
      }
    }
    this.needsRedraw = false;
  }

  private drawDroolDrops(g: Phaser.GameObjects.Graphics): void {
    for (const drop of this.hugeHead.droolDrops) {
      const alpha = drop.life * 0.6;
      g.fillStyle(0x88ccff, alpha * 0.3);
      g.fillCircle(drop.x, drop.y, drop.size + 1);
      g.fillStyle(0xaaddff, alpha);
      g.fillCircle(drop.x, drop.y, drop.size);
      g.fillStyle(0xffffff, alpha * 0.5);
      g.fillCircle(drop.x - drop.size * 0.2, drop.y - drop.size * 0.3, drop.size * 0.3);
    }
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
      hue: 10 + Math.random() * 30,
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

  // Update comet trail - add new segments and fade old ones
  private updateCometTrail(): void {
    if (!this.currentState || this.currentState.gameOver) {
      // Fade out trail on game over
      for (const seg of this.cometTrail) {
        seg.alpha *= 0.9;
      }
      this.cometTrail = this.cometTrail.filter(s => s.alpha > 0.01);
      return;
    }

    const snake = this.currentState.snake;
    if (snake.length === 0) return;

    const head = snake[0];
    const headX = head.x * CELL_SIZE + CELL_SIZE / 2;
    const headY = head.y * CELL_SIZE + CELL_SIZE / 2;

    // Track head history for smooth interpolation
    this.headHistory.unshift({ x: headX, y: headY, time: this.frameCount });
    if (this.headHistory.length > 10) this.headHistory.pop();

    // Add new trail segment at head position
    if (this.frameCount % 2 === 0) {
      const hue = 270 + Math.sin(this.frameCount * 0.05) * 20;
      this.cometTrail.unshift({
        x: headX,
        y: headY,
        alpha: 1,
        size: CELL_SIZE / 2 + 2,
        hue,
      });

      // Spawn ethereal particles from trail
      if (Math.random() < 0.6) {
        this.spawnEtherealParticle(headX, headY, hue);
      }
    }

    // Limit trail length and fade segments
    while (this.cometTrail.length > MAX_COMET_TRAIL_LENGTH) {
      this.cometTrail.pop();
    }

    // Fade all segments
    for (let i = 0; i < this.cometTrail.length; i++) {
      const fadeRate = 0.06 + (i / this.cometTrail.length) * 0.04;
      this.cometTrail[i].alpha -= fadeRate;
      this.cometTrail[i].size *= 0.97;
    }

    // Remove fully faded segments
    this.cometTrail = this.cometTrail.filter(s => s.alpha > 0);
  }

  // Spawn an ethereal particle that drifts away from the trail
  private spawnEtherealParticle(x: number, y: number, hue: number): void {
    if (this.etherealParticles.length >= MAX_ETHEREAL_PARTICLES) {
      this.etherealParticles.shift();
    }

    const angle = Math.random() * Math.PI * 2;
    const speed = 0.3 + Math.random() * 0.5;
    const life = 0.8 + Math.random() * 0.4;

    this.etherealParticles.push({
      x: x + (Math.random() - 0.5) * 10,
      y: y + (Math.random() - 0.5) * 10,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 0.3,
      size: 3 + Math.random() * 4,
      life,
      maxLife: life,
      hue: hue + (Math.random() - 0.5) * 30,
      brightness: 0.5 + Math.random() * 0.3,
      pulsePhase: Math.random() * Math.PI * 2,
    });
  }

  // Update ethereal particles
  private updateEtherealParticles(): void {
    for (let i = this.etherealParticles.length - 1; i >= 0; i--) {
      const p = this.etherealParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy -= 0.015; // Slight upward drift
      p.vx *= 0.98;
      p.size *= 0.985;
      p.life -= 0.02;
      p.pulsePhase += 0.15;

      if (p.life <= 0 || p.size < 0.5) {
        this.etherealParticles.splice(i, 1);
      }
    }
  }

  // Draw the comet trail - smooth glowing ribbon
  private drawCometTrail(g: Phaser.GameObjects.Graphics): void {
    if (this.cometTrail.length < 2) return;

    // Draw outer glow layer
    for (let i = 0; i < this.cometTrail.length; i++) {
      const seg = this.cometTrail[i];
      if (seg.alpha < 0.05) continue;

      const progress = i / this.cometTrail.length;
      const glowSize = seg.size * (1.5 + progress * 0.5);
      const glowAlpha = seg.alpha * 0.15 * (1 - progress * 0.5);

      // Outer ethereal glow
      const outerColor = this.hslToRgb(seg.hue / 360, 0.6, 0.4);
      g.fillStyle(outerColor, glowAlpha);
      g.fillCircle(seg.x, seg.y, glowSize * 1.5);

      // Mid glow
      const midColor = this.hslToRgb(seg.hue / 360, 0.7, 0.5);
      g.fillStyle(midColor, glowAlpha * 1.5);
      g.fillCircle(seg.x, seg.y, glowSize);
    }

    // Draw connecting ribbon between segments
    if (this.cometTrail.length >= 2) {
      for (let i = 0; i < this.cometTrail.length - 1; i++) {
        const seg1 = this.cometTrail[i];
        const seg2 = this.cometTrail[i + 1];
        if (seg1.alpha < 0.1 || seg2.alpha < 0.1) continue;

        const progress = i / this.cometTrail.length;
        const ribbonAlpha = Math.min(seg1.alpha, seg2.alpha) * 0.4 * (1 - progress * 0.5);
        const ribbonWidth = (seg1.size + seg2.size) / 2 * 0.6;

        // Ribbon core
        const ribbonColor = this.hslToRgb(seg1.hue / 360, 0.8, 0.6);
        g.lineStyle(ribbonWidth, ribbonColor, ribbonAlpha);
        g.lineBetween(seg1.x, seg1.y, seg2.x, seg2.y);

        // Bright inner ribbon
        g.lineStyle(ribbonWidth * 0.4, 0xffffff, ribbonAlpha * 0.6);
        g.lineBetween(seg1.x, seg1.y, seg2.x, seg2.y);
      }
    }

    // Draw core particles at each segment
    for (let i = 0; i < this.cometTrail.length; i++) {
      const seg = this.cometTrail[i];
      if (seg.alpha < 0.1) continue;

      const progress = i / this.cometTrail.length;
      const coreAlpha = seg.alpha * 0.6 * (1 - progress * 0.7);
      const coreSize = seg.size * 0.5 * (1 - progress * 0.3);

      // Core glow
      const coreColor = this.hslToRgb(seg.hue / 360, 0.9, 0.7);
      g.fillStyle(coreColor, coreAlpha);
      g.fillCircle(seg.x, seg.y, coreSize);

      // Bright white center
      g.fillStyle(0xffffff, coreAlpha * 0.5);
      g.fillCircle(seg.x, seg.y, coreSize * 0.4);
    }
  }

  // Draw ethereal particles - luminous drifting particles
  private drawEtherealParticles(g: Phaser.GameObjects.Graphics): void {
    for (const p of this.etherealParticles) {
      const lifeRatio = p.life / p.maxLife;
      const pulse = 0.7 + Math.sin(p.pulsePhase) * 0.3;
      const alpha = lifeRatio * pulse;

      // Outer glow
      const glowColor = this.hslToRgb(p.hue / 360, 0.5, 0.3);
      g.fillStyle(glowColor, alpha * 0.2);
      g.fillCircle(p.x, p.y, p.size * 2.5);

      // Mid glow
      const midColor = this.hslToRgb(p.hue / 360, 0.7, 0.5);
      g.fillStyle(midColor, alpha * 0.4);
      g.fillCircle(p.x, p.y, p.size * 1.5);

      // Core
      const coreColor = this.hslToRgb(p.hue / 360, 0.9, 0.7);
      g.fillStyle(coreColor, alpha * 0.7);
      g.fillCircle(p.x, p.y, p.size);

      // Bright center
      g.fillStyle(0xffffff, alpha * 0.5);
      g.fillCircle(p.x, p.y, p.size * 0.3);
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

  private spawnGameOverEffects(): void {
    if (!this.currentState) return;
    const head = this.currentState.snake[0];
    if (head) {
      const headX = head.x * CELL_SIZE + CELL_SIZE / 2;
      const headY = head.y * CELL_SIZE + CELL_SIZE / 2;
      spawnBlood(this.cleanEffects, headX, headY, 15);
      spawnTears(this.cleanEffects, headX, headY - 10, 6);
    }
  }

  private drawHUD(g: Phaser.GameObjects.Graphics, width: number): void {
    if (!this.currentState || !this.currentState.gameStarted) return;

    this.hudPulsePhase += 0.08;
    const score = this.currentState.score || 0;

    if (score > this.lastHudScore) {
      this.scoreFlashIntensity = 1;
    }
    this.lastHudScore = score;
    this.scoreFlashIntensity *= 0.92;

    const padding = 12;
    const scorePanelWidth = 135;
    const scorePanelHeight = 54;

    // Score panel background - volcanic lava theme
    g.fillStyle(0x150508, 0.9);
    g.fillRoundedRect(padding, padding, scorePanelWidth, scorePanelHeight, 8);

    // Glowing border
    const borderGlow = 0.6 + this.scoreFlashIntensity * 0.4;
    g.lineStyle(2, COLORS.snakeGlow, borderGlow);
    g.strokeRoundedRect(padding, padding, scorePanelWidth, scorePanelHeight, 8);

    // Score label
    this.drawText(g, 'SCORE', padding + 10, padding + 12, 10, COLORS.snakeBody, 0.9);

    // Score value with flash effect
    const scoreColor = this.scoreFlashIntensity > 0.5 ? 0xffffff : COLORS.snakeHead;
    this.drawText(g, String(score).padStart(5, '0'), padding + 10, padding + 32, 18, scoreColor, 1);

    // Outer glow on score when flashing
    if (this.scoreFlashIntensity > 0.1) {
      g.fillStyle(COLORS.snakeGlow, this.scoreFlashIntensity * 0.3);
      g.fillRoundedRect(padding + 5, padding + 20, 100, 28, 4);
    }

    // Length panel on the right
    const lengthPanelWidth = 95;
    const lengthPanelHeight = 54;
    const lengthX = width - padding - lengthPanelWidth;

    g.fillStyle(0x150508, 0.9);
    g.fillRoundedRect(lengthX, padding, lengthPanelWidth, lengthPanelHeight, 8);

    g.lineStyle(2, COLORS.foodGlow, 0.6);
    g.strokeRoundedRect(lengthX, padding, lengthPanelWidth, lengthPanelHeight, 8);

    this.drawText(g, 'LENGTH', lengthX + 10, padding + 12, 10, COLORS.food, 0.9);
    this.drawText(g, String(this.currentState.snake.length), lengthX + 10, padding + 32, 18, COLORS.foodCore, 1);
  }

  private drawText(
    g: Phaser.GameObjects.Graphics,
    text: string,
    x: number,
    y: number,
    size: number,
    color: number,
    alpha: number
  ): void {
    const charWidth = size * 0.7;
    const charHeight = size;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const cx = x + i * charWidth;

      g.fillStyle(color, alpha);

      // Simple pixel-style character rendering
      if (char >= '0' && char <= '9') {
        this.drawDigit(g, char, cx, y, size);
      } else {
        this.drawLetter(g, char, cx, y, size);
      }
    }
  }

  private drawDigit(g: Phaser.GameObjects.Graphics, digit: string, x: number, y: number, size: number): void {
    const w = size * 0.5;
    const h = size;
    const t = size * 0.2;

    // 7-segment style digits
    const segments: Record<string, number[]> = {
      '0': [1, 1, 1, 0, 1, 1, 1],
      '1': [0, 0, 1, 0, 0, 1, 0],
      '2': [1, 0, 1, 1, 1, 0, 1],
      '3': [1, 0, 1, 1, 0, 1, 1],
      '4': [0, 1, 1, 1, 0, 1, 0],
      '5': [1, 1, 0, 1, 0, 1, 1],
      '6': [1, 1, 0, 1, 1, 1, 1],
      '7': [1, 0, 1, 0, 0, 1, 0],
      '8': [1, 1, 1, 1, 1, 1, 1],
      '9': [1, 1, 1, 1, 0, 1, 1],
    };

    const seg = segments[digit] || segments['0'];

    // Top horizontal
    if (seg[0]) g.fillRect(x, y - h / 2, w, t);
    // Top-left vertical
    if (seg[1]) g.fillRect(x - t / 2, y - h / 2, t, h / 2);
    // Top-right vertical
    if (seg[2]) g.fillRect(x + w - t / 2, y - h / 2, t, h / 2);
    // Middle horizontal
    if (seg[3]) g.fillRect(x, y - t / 2, w, t);
    // Bottom-left vertical
    if (seg[4]) g.fillRect(x - t / 2, y, t, h / 2);
    // Bottom-right vertical
    if (seg[5]) g.fillRect(x + w - t / 2, y, t, h / 2);
    // Bottom horizontal
    if (seg[6]) g.fillRect(x, y + h / 2 - t, w, t);
  }

  private drawLetter(g: Phaser.GameObjects.Graphics, letter: string, x: number, y: number, size: number): void {
    const w = size * 0.5;
    const h = size;
    const t = size * 0.2;

    // Simple block letters
    switch (letter.toUpperCase()) {
      case 'S':
        g.fillRect(x, y - h / 2, w, t);
        g.fillRect(x - t / 2, y - h / 2, t, h / 2);
        g.fillRect(x, y - t / 2, w, t);
        g.fillRect(x + w - t / 2, y, t, h / 2);
        g.fillRect(x, y + h / 2 - t, w, t);
        break;
      case 'C':
        g.fillRect(x, y - h / 2, w, t);
        g.fillRect(x - t / 2, y - h / 2, t, h);
        g.fillRect(x, y + h / 2 - t, w, t);
        break;
      case 'O':
        g.fillRect(x, y - h / 2, w, t);
        g.fillRect(x - t / 2, y - h / 2, t, h);
        g.fillRect(x + w - t / 2, y - h / 2, t, h);
        g.fillRect(x, y + h / 2 - t, w, t);
        break;
      case 'R':
        g.fillRect(x, y - h / 2, w, t);
        g.fillRect(x - t / 2, y - h / 2, t, h);
        g.fillRect(x + w - t / 2, y - h / 2, t, h / 2);
        g.fillRect(x, y - t / 2, w, t);
        g.fillRect(x + w / 2, y, t, h / 2);
        break;
      case 'E':
        g.fillRect(x, y - h / 2, w, t);
        g.fillRect(x - t / 2, y - h / 2, t, h);
        g.fillRect(x, y - t / 2, w * 0.7, t);
        g.fillRect(x, y + h / 2 - t, w, t);
        break;
      case 'L':
        g.fillRect(x - t / 2, y - h / 2, t, h);
        g.fillRect(x, y + h / 2 - t, w, t);
        break;
      case 'N':
        g.fillRect(x - t / 2, y - h / 2, t, h);
        g.fillRect(x + w - t / 2, y - h / 2, t, h);
        g.fillRect(x, y - h / 2 + t, w, t);
        break;
      case 'G':
        g.fillRect(x, y - h / 2, w, t);
        g.fillRect(x - t / 2, y - h / 2, t, h);
        g.fillRect(x + w - t / 2, y, t, h / 2);
        g.fillRect(x + w / 2, y - t / 2, w / 2, t);
        g.fillRect(x, y + h / 2 - t, w, t);
        break;
      case 'T':
        g.fillRect(x - t, y - h / 2, w + t * 2, t);
        g.fillRect(x + w / 2 - t / 2, y - h / 2, t, h);
        break;
      case 'H':
        g.fillRect(x - t / 2, y - h / 2, t, h);
        g.fillRect(x + w - t / 2, y - h / 2, t, h);
        g.fillRect(x, y - t / 2, w, t);
        break;
      case 'I':
        g.fillRect(x + w / 2 - t / 2, y - h / 2, t, h);
        break;
      case 'Y':
        g.fillRect(x - t / 2, y - h / 2, t, h / 2);
        g.fillRect(x + w - t / 2, y - h / 2, t, h / 2);
        g.fillRect(x + w / 2 - t / 2, y, t, h / 2);
        break;
      case 'U':
        g.fillRect(x - t / 2, y - h / 2, t, h);
        g.fillRect(x + w - t / 2, y - h / 2, t, h);
        g.fillRect(x, y + h / 2 - t, w, t);
        break;
      case 'W':
        g.fillRect(x - t / 2, y - h / 2, t, h);
        g.fillRect(x + w - t / 2, y - h / 2, t, h);
        g.fillRect(x + w / 2 - t / 2, y, t, h / 2);
        g.fillRect(x, y + h / 2 - t, w, t);
        break;
      case 'A':
        g.fillRect(x, y - h / 2, w, t);
        g.fillRect(x - t / 2, y - h / 2, t, h);
        g.fillRect(x + w - t / 2, y - h / 2, t, h);
        g.fillRect(x, y - t / 2, w, t);
        break;
      case 'B':
        g.fillRect(x, y - h / 2, w, t);
        g.fillRect(x - t / 2, y - h / 2, t, h);
        g.fillRect(x + w - t / 2, y - h / 2, t, h / 2);
        g.fillRect(x, y - t / 2, w, t);
        g.fillRect(x + w - t / 2, y, t, h / 2);
        g.fillRect(x, y + h / 2 - t, w, t);
        break;
      case 'D':
        g.fillRect(x - t / 2, y - h / 2, t, h);
        g.fillRect(x, y - h / 2, w * 0.7, t);
        g.fillRect(x + w - t / 2, y - h / 2 + t, t, h - t * 2);
        g.fillRect(x, y + h / 2 - t, w * 0.7, t);
        break;
      case 'F':
        g.fillRect(x, y - h / 2, w, t);
        g.fillRect(x - t / 2, y - h / 2, t, h);
        g.fillRect(x, y - t / 2, w * 0.7, t);
        break;
      case 'J':
        g.fillRect(x + w - t / 2, y - h / 2, t, h);
        g.fillRect(x, y + h / 2 - t, w, t);
        g.fillRect(x - t / 2, y, t, h / 2);
        break;
      case 'K':
        g.fillRect(x - t / 2, y - h / 2, t, h);
        g.fillRect(x + w - t / 2, y - h / 2, t, h / 2);
        g.fillRect(x, y - t / 2, w, t);
        g.fillRect(x + w - t / 2, y, t, h / 2);
        break;
      case 'M':
        g.fillRect(x - t / 2, y - h / 2, t, h);
        g.fillRect(x + w - t / 2, y - h / 2, t, h);
        g.fillRect(x + w / 2 - t / 2, y - h / 2, t, h / 2);
        g.fillRect(x, y - h / 2, w, t);
        break;
      case 'P':
        g.fillRect(x, y - h / 2, w, t);
        g.fillRect(x - t / 2, y - h / 2, t, h);
        g.fillRect(x + w - t / 2, y - h / 2, t, h / 2);
        g.fillRect(x, y - t / 2, w, t);
        break;
      case 'V':
        g.fillRect(x - t / 2, y - h / 2, t, h * 0.7);
        g.fillRect(x + w - t / 2, y - h / 2, t, h * 0.7);
        g.fillRect(x + w / 2 - t / 2, y + h * 0.2, t, h * 0.3);
        break;
      case 'X':
        g.fillRect(x - t / 2, y - h / 2, t, h / 2);
        g.fillRect(x + w - t / 2, y - h / 2, t, h / 2);
        g.fillRect(x, y - t / 2, w, t);
        g.fillRect(x - t / 2, y, t, h / 2);
        g.fillRect(x + w - t / 2, y, t, h / 2);
        break;
      case 'Z':
        g.fillRect(x, y - h / 2, w, t);
        g.fillRect(x + w - t / 2, y - h / 2, t, h / 2);
        g.fillRect(x, y - t / 2, w, t);
        g.fillRect(x - t / 2, y, t, h / 2);
        g.fillRect(x, y + h / 2 - t, w, t);
        break;
      case '!':
        g.fillRect(x + w / 2 - t / 2, y - h / 2, t, h * 0.6);
        g.fillRect(x + w / 2 - t / 2, y + h / 2 - t * 2, t, t);
        break;
      case '.':
        g.fillRect(x + w / 2 - t / 2, y + h / 2 - t * 2, t, t);
        break;
      case ' ':
        break;
      default:
        g.fillRect(x, y - t / 2, w, t);
        break;
    }
  }

  private drawGameOverScore(g: Phaser.GameObjects.Graphics, width: number, height: number): void {
    if (!this.currentState || !this.currentState.gameOver) return;

    this.gameOverScoreAnimPhase += 0.06;
    this.gameOverRevealProgress = Math.min(1, this.gameOverRevealProgress + 0.025);

    const centerX = width / 2;
    const panelWidth = 220;
    const panelHeight = 170;
    const panelX = centerX - panelWidth / 2;
    const panelY = height * 0.15;
    const slideOffset = (1 - this.gameOverRevealProgress) * 40;
    const alpha = this.gameOverRevealProgress;

    // Panel background
    g.fillStyle(0x150510, 0.92 * alpha);
    g.fillRoundedRect(panelX, panelY - slideOffset, panelWidth, panelHeight, 12);

    // Glowing border with pulsing animation
    const borderPulse = 0.5 + Math.sin(this.gameOverScoreAnimPhase) * 0.3;
    g.lineStyle(3, COLORS.food, borderPulse * alpha);
    g.strokeRoundedRect(panelX, panelY - slideOffset, panelWidth, panelHeight, 12);

    // Flavor message at top
    const messageY = panelY - slideOffset + 20;
    const msgWidth = this.deathMessage.length * 9 * 0.7;
    this.drawText(g, this.deathMessage, centerX - msgWidth / 2, messageY, 9, COLORS.foodGlow, 0.9 * alpha);

    // Divider
    g.lineStyle(1, COLORS.snakeGlow, 0.4 * alpha);
    g.lineBetween(panelX + 20, messageY + 14, panelX + panelWidth - 20, messageY + 14);

    // Death reason - the main attraction, big and pulsing
    const reasonY = panelY - slideOffset + 50;
    const reasonPulse = 0.7 + Math.sin(this.gameOverScoreAnimPhase * 1.5) * 0.3;
    const reasonSize = 11;
    const reasonText = this.deathReasonText || 'UNKNOWN CAUSE';
    const reasonWidth = reasonText.length * reasonSize * 0.7;

    // Glowing backdrop behind the death reason
    g.fillStyle(COLORS.food, 0.08 * reasonPulse * alpha);
    g.fillRoundedRect(centerX - reasonWidth / 2 - 8, reasonY - 5, reasonWidth + 16, reasonSize + 10, 4);

    this.drawText(g, reasonText, centerX - reasonWidth / 2, reasonY, reasonSize, COLORS.food, reasonPulse * alpha);

    // "CAUSE OF DEATH" label above the reason
    const labelText = 'CAUSE OF DEATH';
    const labelSize = 6;
    const labelWidth = labelText.length * labelSize * 0.7;
    this.drawText(g, labelText, centerX - labelWidth / 2, reasonY - 12, labelSize, COLORS.noirGray, 0.7 * alpha);

    // Second divider
    g.lineStyle(1, COLORS.snakeGlow, 0.3 * alpha);
    g.lineBetween(panelX + 20, reasonY + reasonSize + 10, panelX + panelWidth - 20, reasonY + reasonSize + 10);

    // Score section
    const score = this.currentState.score || 0;
    const scoreStr = String(score);
    const scoreY = panelY - slideOffset + 100;

    this.drawText(g, 'FINAL SCORE', centerX - 44, scoreY - 16, 8, COLORS.noirGray, 0.8 * alpha);

    const scorePulse = 0.8 + Math.sin(this.gameOverScoreAnimPhase * 2) * 0.2;
    const scoreWidth = scoreStr.length * 14;
    g.fillStyle(COLORS.snakeGlow, 0.15 * scorePulse * alpha);
    g.fillRoundedRect(centerX - scoreWidth / 2 - 10, scoreY - 6, scoreWidth + 20, 28, 6);
    this.drawText(g, scoreStr.padStart(5, '0'), centerX - scoreWidth / 2, scoreY, 20, COLORS.foodCore, alpha);

    // Snake length stat at bottom
    const snakeLen = this.currentState.snake.length;
    const statY = panelY - slideOffset + panelHeight - 22;
    this.drawText(g, `LENGTH: ${snakeLen}`, centerX - 35, statY, 8, COLORS.noirGray, 0.7 * alpha);
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

    // Don't draw food if it's still being thrown
    if (this.thrownFood && !this.thrownFood.landed) return;

    const food = this.currentState.food;
    const foodX = food.x * CELL_SIZE + CELL_SIZE / 2;
    const foodY = food.y * CELL_SIZE + CELL_SIZE / 2;
    const pulseScale = 1 + Math.sin(this.frameCount * 0.15) * 0.08;
    const glowPulse = 0.4 + Math.sin(this.frameCount * 0.1) * 0.2;

    // Spawn particles (orange/yellow for Halloween)
    this.spawnFoodParticles(foodX, foodY);

    // Draw particles
    for (const p of this.foodParticles) {
      g.fillStyle(COLORS.pumpkinOrange, p.life * 0.4);
      g.fillCircle(p.x, p.y, p.size * p.life);
    }

    // Halloween pumpkin!
    const pumpkinSize = (CELL_SIZE / 2) * pulseScale;

    // Shadow underneath
    g.fillStyle(0x000000, 0.5);
    g.fillEllipse(foodX + 2, foodY + pumpkinSize * 0.8, pumpkinSize * 1.2, pumpkinSize * 0.4);

    // Outer orange glow (candlelight effect)
    g.fillStyle(COLORS.pumpkinOrange, glowPulse * 0.15);
    g.fillCircle(foodX, foodY, pumpkinSize + 12);
    g.fillStyle(COLORS.candyCorn1, glowPulse * 0.2);
    g.fillCircle(foodX, foodY, pumpkinSize + 6);

    // Pumpkin body (slightly squashed circle)
    g.fillStyle(COLORS.pumpkinOrange, 0.95);
    g.fillEllipse(foodX, foodY, pumpkinSize * 1.1, pumpkinSize * 0.9);

    // Pumpkin segments (darker lines)
    g.lineStyle(2, 0xcc4400, 0.5);
    g.lineBetween(foodX, foodY - pumpkinSize * 0.8, foodX, foodY + pumpkinSize * 0.7);
    g.lineStyle(1.5, 0xcc4400, 0.3);
    g.lineBetween(foodX - pumpkinSize * 0.5, foodY - pumpkinSize * 0.5, foodX - pumpkinSize * 0.4, foodY + pumpkinSize * 0.6);
    g.lineBetween(foodX + pumpkinSize * 0.5, foodY - pumpkinSize * 0.5, foodX + pumpkinSize * 0.4, foodY + pumpkinSize * 0.6);

    // Pumpkin stem
    g.fillStyle(0x228822, 0.9);
    g.fillRect(foodX - 2, foodY - pumpkinSize * 0.9 - 4, 4, 6);

    // Jack-o-lantern face - glowing eyes and mouth
    const faceGlow = 0.8 + Math.sin(this.frameCount * 0.12) * 0.2;
    g.fillStyle(COLORS.candyCorn1, faceGlow);

    // Eyes (triangles)
    g.fillTriangle(
      foodX - pumpkinSize * 0.4, foodY - pumpkinSize * 0.1,
      foodX - pumpkinSize * 0.15, foodY - pumpkinSize * 0.1,
      foodX - pumpkinSize * 0.27, foodY - pumpkinSize * 0.35
    );
    g.fillTriangle(
      foodX + pumpkinSize * 0.4, foodY - pumpkinSize * 0.1,
      foodX + pumpkinSize * 0.15, foodY - pumpkinSize * 0.1,
      foodX + pumpkinSize * 0.27, foodY - pumpkinSize * 0.35
    );

    // Mouth (jagged smile)
    g.fillStyle(COLORS.candyCorn1, faceGlow * 0.9);
    g.fillRect(foodX - pumpkinSize * 0.35, foodY + pumpkinSize * 0.15, pumpkinSize * 0.7, pumpkinSize * 0.25);

    // Teeth (dark gaps in mouth)
    g.fillStyle(COLORS.pumpkinOrange, 1);
    g.fillTriangle(
      foodX - pumpkinSize * 0.15, foodY + pumpkinSize * 0.15,
      foodX, foodY + pumpkinSize * 0.15,
      foodX - pumpkinSize * 0.075, foodY + pumpkinSize * 0.3
    );
    g.fillTriangle(
      foodX + pumpkinSize * 0.15, foodY + pumpkinSize * 0.15,
      foodX + pumpkinSize * 0.3, foodY + pumpkinSize * 0.15,
      foodX + pumpkinSize * 0.225, foodY + pumpkinSize * 0.3
    );
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

    // Spooky shadow under snake
    for (let i = snakeLen - 1; i >= 0; i--) {
      const segment = snake[i];
      const centerX = segment.x * CELL_SIZE + CELL_SIZE / 2 + 3;
      const centerY = segment.y * CELL_SIZE + CELL_SIZE / 2 + 3;
      const t = snakeLen > 1 ? i / (snakeLen - 1) : 1;
      const shadowRadius = (CELL_SIZE / 2) * (0.9 + t * 0.1);
      g.fillStyle(0x000000, 0.5 * t);
      g.fillCircle(centerX, centerY, shadowRadius);
    }

    // Draw trailing glow (ghostly green)
    for (let i = snakeLen - 1; i >= 0; i--) {
      const segment = snake[i];
      const centerX = segment.x * CELL_SIZE + CELL_SIZE / 2;
      const centerY = segment.y * CELL_SIZE + CELL_SIZE / 2;
      const t = snakeLen > 1 ? i / (snakeLen - 1) : 1;
      const glowAlpha = 0.2 * t;
      const glowSize = (CELL_SIZE / 2 + 4) * (0.5 + t * 0.5);

      g.fillStyle(COLORS.snakeGlow, glowAlpha);
      g.fillCircle(centerX, centerY, glowSize);
    }

    // Draw snake segments from tail to head with green gradient
    for (let i = snakeLen - 1; i >= 0; i--) {
      const segment = snake[i];
      const centerX = segment.x * CELL_SIZE + CELL_SIZE / 2;
      const centerY = segment.y * CELL_SIZE + CELL_SIZE / 2;

      const t = snakeLen > 1 ? i / (snakeLen - 1) : 1;
      const radius = (CELL_SIZE / 2 - 1) * (0.85 + t * 0.15);

      // Green gradient from tail (dark) to head (bright)
      const brightness = 0.3 + t * 0.4;
      const segmentColor = this.hslToRgb(0.4, 0.9, brightness);

      if (i === 0) {
        // Head: brightest green with eerie glow
        g.fillStyle(COLORS.snakeGlow, 0.4);
        g.fillCircle(centerX, centerY, radius + 8);

        g.fillStyle(COLORS.snakeHead, 1);
        g.fillCircle(centerX, centerY, radius + 1);

        // Slimy highlight
        g.fillStyle(0xaaffcc, 0.6);
        g.fillCircle(centerX - 2, centerY - 2, radius * 0.35);

        this.drawSnakeHead(g, segment, snake[1]);
      } else {
        // Body segment with green tones
        g.fillStyle(COLORS.snakeGlow, 0.15);
        g.fillCircle(centerX, centerY, radius + 2);

        g.fillStyle(segmentColor, 1);
        g.fillCircle(centerX, centerY, radius);

        // Slimy specular highlight
        g.fillStyle(0xaaffcc, 0.15 * t);
        g.fillCircle(centerX - 1, centerY - 1, radius * 0.25);
      }
    }
  }

  private drawFoodBurst(g: Phaser.GameObjects.Graphics): void {
    for (const p of this.foodBurstParticles) {
      // Halloween: orange pumpkin burst
      for (let i = 0; i < p.trail.length; i++) {
        const t = p.trail[i];
        const trailAlpha = p.life * 0.4 * (1 - i / p.trail.length);
        const trailSize = p.size * p.life * (1 - i / p.trail.length);
        g.fillStyle(COLORS.pumpkinOrange, trailAlpha);
        g.fillCircle(t.x, t.y, trailSize);
      }

      g.fillStyle(COLORS.candyCorn1, p.life * 0.7);
      g.fillCircle(p.x, p.y, p.size * p.life);
      g.fillStyle(COLORS.candyCorn3, p.life * 0.9);
      g.fillCircle(p.x, p.y, p.size * p.life * 0.4);
    }
  }

  private drawEnergyField(g: Phaser.GameObjects.Graphics): void {
    if (!this.currentState || this.currentState.snake.length === 0) return;

    const snake = this.currentState.snake;
    const baseIntensity = 0.06 + this.energyFieldPulse * 0.2;
    const pulseOffset = Math.sin(this.frameCount * 0.1) * 0.02;
    const alpha = Math.min(0.3, baseIntensity + pulseOffset);

    // Halloween: ghostly green energy field
    for (let i = 0; i < snake.length; i++) {
      const seg = snake[i];
      const cx = seg.x * CELL_SIZE + CELL_SIZE / 2;
      const cy = seg.y * CELL_SIZE + CELL_SIZE / 2;

      const fieldRadius = CELL_SIZE * (0.8 + this.energyFieldPulse * 0.5) + Math.sin(this.frameCount * 0.15 + i * 0.5) * 2;

      g.fillStyle(COLORS.snakeGlow, alpha * 0.2);
      g.fillCircle(cx, cy, fieldRadius + 4);

      g.fillStyle(COLORS.snakeGlow, alpha * 0.35);
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
    // Volcanic crown: molten gold with ruby gems
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

    // Crown glow (molten orange/red aura)
    g.fillStyle(COLORS.noirWhite, 0.25 * sparkle);
    g.fillCircle(crownBaseX + pointOffset * 0.5, crownBaseY + pointOffsetY * 0.5, crownHeight + 4);

    // Crown base (molten gold)
    g.fillStyle(0xffa500, 1);
    g.beginPath();
    g.moveTo(crownPoints[0].x, crownPoints[0].y);
    for (let i = 1; i < crownPoints.length; i++) {
      g.lineTo(crownPoints[i].x, crownPoints[i].y);
    }
    g.closePath();
    g.fillPath();

    // Crown outline (dark crimson)
    g.lineStyle(1.5, 0x801010, 1);
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
    g.lineStyle(3, 0xcc6600, 1);
    g.lineBetween(bandY1.x, bandY1.y, bandY2.x, bandY2.y);

    // Ruby jewels: glowing red gems
    const jewelPositions = [
      { x: crownBaseX + pointOffset, y: crownBaseY + pointOffsetY, size: 2.5 },
      { x: crownBaseX + perpX * (halfWidth * 0.5) + pointOffset * 0.9, y: crownBaseY + perpY * (halfWidth * 0.5) + pointOffsetY * 0.9, size: 2 },
      { x: crownBaseX - perpX * (halfWidth * 0.5) + pointOffset * 0.9, y: crownBaseY - perpY * (halfWidth * 0.5) + pointOffsetY * 0.9, size: 2 },
    ];

    for (const jewel of jewelPositions) {
      g.fillStyle(0xff4020, 0.5 * sparkle);
      g.fillCircle(jewel.x, jewel.y, jewel.size + 2);

      g.fillStyle(0xff2000, 1);
      g.fillCircle(jewel.x, jewel.y, jewel.size);

      g.fillStyle(0xffff80, 0.9 * sparkle);
      g.fillCircle(jewel.x - 0.5, jewel.y - 0.5, jewel.size * 0.4);
    }

    // Crown highlight (golden gleam)
    g.fillStyle(0xffff80, 0.6 * sparkle);
    g.fillCircle(crownBaseX + perpX * 3 + pointOffset * 0.3, crownBaseY + perpY * 3 + pointOffsetY * 0.3, 2);
  }
}
