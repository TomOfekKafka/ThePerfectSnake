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

const CELL_SIZE = 20;

export class SnakeScene extends Phaser.Scene {
  private graphics!: Phaser.GameObjects.Graphics;
  private currentState: GameState | null = null;
  private needsRedraw = false;

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
    this.currentState = state;
    this.needsRedraw = true;
  }

  update(): void {
    if (!this.needsRedraw || !this.currentState) return;
    this.needsRedraw = false;

    const g = this.graphics;
    g.clear();

    // White background
    g.fillStyle(0xffffff, 1);
    g.fillRect(0, 0, this.scale.width, this.scale.height);

    // Snake
    g.fillStyle(0x5BC2E7, 1);
    for (const segment of this.currentState.snake) {
      g.fillRect(
        segment.x * CELL_SIZE,
        segment.y * CELL_SIZE,
        CELL_SIZE - 1,
        CELL_SIZE - 1
      );
    }

    // Red food
    g.fillStyle(0xff0000, 1);
    g.fillRect(
      this.currentState.food.x * CELL_SIZE,
      this.currentState.food.y * CELL_SIZE,
      CELL_SIZE - 1,
      CELL_SIZE - 1
    );
  }
}
