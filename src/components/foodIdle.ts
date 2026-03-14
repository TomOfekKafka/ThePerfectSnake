import Phaser from 'phaser';

export interface FoodIdleState {
  lastFoodX: number;
  lastFoodY: number;
}

export function createFoodIdle(): FoodIdleState {
  return {
    lastFoodX: 0,
    lastFoodY: 0,
  };
}

export function updateFoodIdle(state: FoodIdleState, foodX: number, foodY: number, _cellSize: number): void {
  state.lastFoodX = foodX;
  state.lastFoodY = foodY;
}

export function getFoodIdleOffset(_state: FoodIdleState): { dx: number; dy: number; scale: number } {
  return { dx: 0, dy: 0, scale: 1 };
}

export function drawFoodIdle(
  _g: Phaser.GameObjects.Graphics,
  _state: FoodIdleState,
  _foodX: number,
  _foodY: number,
  _cellSize: number,
  _frameCount: number
): void {
}
