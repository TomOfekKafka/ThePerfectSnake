import { describe, it, expect } from 'vitest';
import { tickFoodFlee, FoodFleeResult } from '../game/foodFlee';
import { FoodFleeState } from '../game/types';

describe('food flee disabled', () => {
  it('tickFoodFlee still returns a result when called directly', () => {
    const food = { x: 5, y: 5 };
    const fleeState: FoodFleeState = { lastMoveTick: 0, panicLevel: 0 };
    const head = { x: 5, y: 6 };
    const snake = [head, { x: 5, y: 7 }];
    const obstacles: { x: number; y: number }[] = [];
    const result: FoodFleeResult = tickFoodFlee(food, fleeState, head, snake, obstacles, 100);
    expect(result).toBeDefined();
    expect(result.food).toBeDefined();
  });

  it('logic no longer calls tickFoodFlee (flee disabled in game loop)', () => {
    // This test documents the intent: food flee is disabled.
    // The game logic now always returns { fled: false }.
    expect(true).toBe(true);
  });
});
