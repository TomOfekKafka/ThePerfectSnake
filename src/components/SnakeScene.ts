import Phaser from 'phaser';
import {
  createCleanEffectsState,
  updateRipples,
  spawnRipple,
  spawnTears,
  spawnBlood,
  updateTears,
  updateBlood,
  dramaShakeOffset,
  drawRipples,
  drawCleanHUD,
  drawTears,
  drawBlood,
  CleanEffectsState,
} from './cleanEffects';
import {
  createDepth3D,
  updateDepth3D,
  drawSnake3DShadows,
  drawSnake3DHighlights,
  Depth3DState,
} from './depth3d';
import { drawSolidSnake } from './solidSnake';
import {
  FaceState,
  FaceDirection,
  createFaceState,
  updateFaceState,
} from './snakeFace';
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
  createKeanuDisplayState,
  advanceKeanu,
  KeanuDisplayState,
} from './countryFlags';
import {
  EmojiFoodState,
  createEmojiFoodState,
  advanceEmoji,
  drawEmojiFood,
  hideEmojiFood,
} from './emojiFood';
import {
  DeathCinematicState,
  createDeathCinematicState,
  triggerDeathCinematic,
  updateDeathCinematic,
  drawDeathCinematic,
} from './deathCinematic';
import {
  OuroborosState,
  createOuroborosState,
  triggerOuroboros,
  updateOuroboros,
  drawOuroboros,
} from './ouroboros';
import {
  ObstacleRenderState,
  createObstacleRenderState,
  updateObstacleEffects,
  drawObstacles,
} from './obstacleRenderer';
import {
  SameDirectionExplosionState,
  createSameDirectionExplosionState,
  triggerSameDirectionExplosion,
  updateSameDirectionExplosion,
  drawSameDirectionExplosion,
} from './sameDirectionExplosion';
import {
  FoodIdleState,
  createFoodIdle,
  updateFoodIdle,
  drawFoodIdle,
  getFoodIdleOffset,
} from './foodIdle';
import {
  TutorialOverlayState,
  createTutorialOverlay,
  updateTutorialOverlay,
} from './tutorialOverlay';
import { pickDeathMessage, pickDeathReason } from '../game/deathMessages';
import {
  DropDeathState,
  createDropDeathState,
  triggerDropDeath,
  updateDropDeath,
  drawDropDeath,
  getDropDeathShake,
} from './dropDeath';
import { THEME } from './gameTheme';
import {
  UpgradeState,
  createUpgradeState,
  tickUpgrades,
  selectUpgrade,
} from '../game/upgrades';
import {
  UpgradeHudState,
  createUpgradeHudState,
} from './upgradeHud';
import {
  PoliceVisualsState,
  createPoliceVisualsState,
  updatePoliceVisuals,
  drawPoliceVisuals,
} from './policeVisuals';
import {
  LaserState,
  createLaserState,
  fireLaser,
  updateLaser,
  drawLaser,
} from './laserBeam';

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

interface ObstacleData {
  position: Position;
  spawnTick: number;
  variant: number;
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
  obstacles?: ObstacleData[];
  deathReason?: 'wall' | 'self' | 'rival' | 'obstacle' | null;
}

const CELL_SIZE = 20;
const GRID_SIZE = 20;

export class SnakeScene extends Phaser.Scene {
  private graphics!: Phaser.GameObjects.Graphics;
  private currentState: GameState | null = null;
  private needsRedraw = false;
  private frameCount = 0;
  private lastHeadPos: Position | null = null;
  private lastSnakeLength = 0;
  private lastHudScore = 0;
  private cleanEffects: CleanEffectsState = createCleanEffectsState();
  private mathParticles: MathParticlesState = createMathParticlesState();
  private spaceBackground: SpaceBackgroundState = createSpaceBackgroundState();
  private faceState: FaceState = createFaceState();
  private snakeDirection: FaceDirection = 'RIGHT';
  private keanuDisplay: KeanuDisplayState = createKeanuDisplayState();
  private emojiFood: EmojiFoodState = createEmojiFoodState();
  private deathCinematic: DeathCinematicState = createDeathCinematicState();
  private ouroboros: OuroborosState = createOuroborosState();
  private deathDelayFrames = 0;
  private deathDelayActive = false;
  private obstacleRender: ObstacleRenderState = createObstacleRenderState();
  private sameDirectionExplosion: SameDirectionExplosionState = createSameDirectionExplosionState();
  private dropDeath: DropDeathState = createDropDeathState();
  private foodIdle: FoodIdleState = createFoodIdle();
  private depth3d: Depth3DState = createDepth3D();
  private tutorialOverlay: TutorialOverlayState = createTutorialOverlay();
  private policeVisuals: PoliceVisualsState = createPoliceVisualsState();
  private lastPoliceCaughtFlash = 0;
  private upgradeState: UpgradeState = createUpgradeState();
  private upgradeHud: UpgradeHudState = createUpgradeHudState();
  private laser: LaserState = createLaserState();
  private lastFoodEaten = 0;
  private snakeWidthMultiplier = 1.0;
  private snakeWidthTarget = 1.0;
  private upgradeKeyHandler: ((e: KeyboardEvent) => void) | null = null;
  private deathMessage = '';
  private deathReasonText = '';
  private gameOverRevealProgress = 0;
  private gameOverScoreAnimPhase = 0;

  constructor() {
    super({ key: 'SnakeScene' });
  }

  create(): void {
    this.graphics = this.add.graphics();
    const width = GRID_SIZE * CELL_SIZE;
    const height = GRID_SIZE * CELL_SIZE;
    initMathSymbols(this.mathParticles, width, height);
    initMathWaves(this.mathParticles, height);
    initSpaceBackground(this.spaceBackground, width, height);

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

  update(): void {
    this.frameCount++;
    this.cleanEffects.frameCount = this.frameCount;

    updateTutorialOverlay(this.tutorialOverlay);
    this.snakeWidthMultiplier += (this.snakeWidthTarget - this.snakeWidthMultiplier) * 0.08;

    const width = this.scale.width;
    const height = this.scale.height;

    updateSameDirectionExplosion(this.sameDirectionExplosion);
    updateSpaceBackground(this.spaceBackground, width, height);
    updateRipples(this.cleanEffects);
    updateTears(this.cleanEffects, height);
    updateBlood(this.cleanEffects, height);
    updateScoreBursts(this.mathParticles);
    updateObstacleEffects(
      this.obstacleRender,
      this.currentState?.obstacles || [],
      CELL_SIZE
    );
    updateDepth3D(this.depth3d, this.frameCount);
    updateLaser(this.laser);
    updateOuroboros(this.ouroboros);

    {
      const food = this.currentState?.food;
      const fx = food ? food.x * CELL_SIZE + CELL_SIZE / 2 : 0;
      const fy = food ? food.y * CELL_SIZE + CELL_SIZE / 2 : 0;
      updateFoodIdle(this.foodIdle, fx, fy, CELL_SIZE);
    }

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
    }

    const g = this.graphics;
    g.clear();

    const shake = dramaShakeOffset(this.cleanEffects);
    g.setPosition(shake.x, shake.y);

    drawSpaceBackground(g, this.spaceBackground, width, height);

    if (!this.currentState) return;

    drawRipples(g, this.cleanEffects);

    const food = this.currentState.food;
    const idleOff = getFoodIdleOffset(this.foodIdle);
    const foodX = food.x * CELL_SIZE + CELL_SIZE / 2 + idleOff.dx;
    const foodY = food.y * CELL_SIZE + CELL_SIZE / 2 + idleOff.dy;

    drawFoodIdle(g, this.foodIdle, foodX, foodY, CELL_SIZE, this.frameCount);
    drawEmojiFood(this, g, this.emojiFood, foodX, foodY, CELL_SIZE, this.frameCount);

    drawObstacles(g, this.obstacleRender, this.currentState.obstacles || [], CELL_SIZE, this.frameCount);

    drawSnake3DShadows(g, this.currentState.snake, CELL_SIZE, this.frameCount);
    drawSolidSnake(g, this.currentState.snake, CELL_SIZE, this.frameCount, this.snakeDirection, this.faceState, this.snakeWidthMultiplier);
    drawSnake3DHighlights(g, this.currentState.snake, CELL_SIZE, this.frameCount, this.depth3d.headPulse);

    drawSameDirectionExplosion(g, this.sameDirectionExplosion, width, height);
    drawLaser(g, this.laser, width, height, this.frameCount);
    drawScoreBursts(g, this.mathParticles, this.drawDigit.bind(this));

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

    const score = this.currentState.score || 0;
    const snakeLength = this.currentState.snake.length;
    const foodEaten = this.currentState.foodEaten || 0;
    drawCleanHUD(g, score, snakeLength, width, this.frameCount, this.drawDigit.bind(this), foodEaten);

    if (this.currentState.gameOver) {
      drawOuroboros(g, this.ouroboros, width, height, this.frameCount);
      updateDeathCinematic(this.deathCinematic);
      drawDeathCinematic(this.deathCinematic, g, width, height, this.frameCount);
      updateDropDeath(this.dropDeath);

      const dropShake = getDropDeathShake(this.dropDeath);
      if (dropShake.x !== 0 || dropShake.y !== 0) {
        g.setPosition(g.x + dropShake.x, g.y + dropShake.y);
      }

      drawDropDeath(this.dropDeath, g, width, height, this.frameCount, this.drawText.bind(this));
      drawBlood(g, this.cleanEffects);
      drawTears(g, this.cleanEffects);
    }

    this.needsRedraw = false;
  }

  updateGameState(state: GameState): void {
    if (this.currentState && state.snake.length > this.lastSnakeLength) {
      const head = state.snake[0];
      const headX = head.x * CELL_SIZE + CELL_SIZE / 2;
      const headY = head.y * CELL_SIZE + CELL_SIZE / 2;
      spawnRipple(this.cleanEffects, headX, headY);
      advanceKeanu(this.keanuDisplay, headX, headY);
      advanceEmoji(this.emojiFood, state.food.x, state.food.y, this.frameCount);
      const points = (state.score || 0) - this.lastHudScore;
      spawnScoreBurst(this.mathParticles, headX, headY - CELL_SIZE, points > 0 ? points : 10);
    }
    this.lastSnakeLength = state.snake.length;

    if (state.gameOver && this.currentState && !this.currentState.gameOver) {
      this.deathMessage = pickDeathMessage();
      this.deathReasonText = pickDeathReason(state.deathReason ?? null);
      this.gameOverRevealProgress = 0;
      this.gameOverScoreAnimPhase = 0;
      this.spawnGameOverEffects();
      triggerDropDeath(
        this.dropDeath,
        state.snake,
        CELL_SIZE,
        GRID_SIZE,
        state.score || 0,
        state.snake.length,
        this.deathMessage,
        this.deathReasonText
      );
      triggerDeathCinematic(this.deathCinematic, state.snake, CELL_SIZE);
      if (state.deathReason === 'self') {
        triggerOuroboros(this.ouroboros, state.snake, CELL_SIZE, GRID_SIZE);
      }
      this.deathDelayFrames = 0;
      this.deathDelayActive = true;
    }

    const foodEaten = state.foodEaten || 0;
    if (foodEaten > this.lastFoodEaten) {
      this.upgradeState = tickUpgrades(this.upgradeState, foodEaten);
    }
    this.snakeWidthTarget = foodEaten >= 5 ? 2.0 : 1.0;
    this.lastFoodEaten = foodEaten;

    if (state.gameStarted && !state.gameOver && this.currentState?.gameOver) {
      this.upgradeState = createUpgradeState();
      this.upgradeHud = createUpgradeHudState();
      this.lastFoodEaten = 0;
      this.snakeWidthMultiplier = 1.0;
      this.snakeWidthTarget = 1.0;
      this.deathCinematic = createDeathCinematicState();
      this.ouroboros = createOuroborosState();
      this.dropDeath = createDropDeathState();
      hideEmojiFood(this.emojiFood);
      this.emojiFood = createEmojiFoodState();
      this.deathDelayActive = false;
      this.deathDelayFrames = 0;
    }

    this.currentState = state;
    this.needsRedraw = true;
    if (!state.gameOver) {
      this.gameOverRevealProgress = 0;
      this.gameOverScoreAnimPhase = 0;
    }
  }

  handleSameDirection(direction: string): void {
    if (!this.currentState || this.currentState.gameOver) return;
    const head = this.currentState.snake[0];
    if (!head) return;

    const headX = head.x * CELL_SIZE + CELL_SIZE / 2;
    const headY = head.y * CELL_SIZE + CELL_SIZE / 2;

    const dirMap: Record<string, { x: number; y: number }> = {
      UP: { x: 0, y: -1 },
      DOWN: { x: 0, y: 1 },
      LEFT: { x: -1, y: 0 },
      RIGHT: { x: 1, y: 0 },
    };
    const dir = dirMap[direction] || { x: 0, y: -1 };

    triggerSameDirectionExplosion(this.sameDirectionExplosion, headX, headY, dir.x, dir.y);
    fireLaser(this.laser, headX, headY, dir.x, dir.y);
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

  private drawText(
    _g: Phaser.GameObjects.Graphics,
    _text: string,
    _x: number,
    _y: number,
    _size: number,
    _color: number,
    _alpha: number
  ): void {
    return;
  }

  private drawDigit(_g: Phaser.GameObjects.Graphics, _digit: string, _x: number, _y: number, _size: number): void {
    return;
  }
}
