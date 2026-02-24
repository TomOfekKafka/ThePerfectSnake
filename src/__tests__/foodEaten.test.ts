import { describe, it, expect } from 'vitest';
import { tick, createNewGame } from '../game/logic';
import { GameState } from '../game/types';
import { INITIAL_SNAKE, POINTS_PER_FOOD } from '../game/constants';

function createStateWithFoodAhead(): GameState {
  const state = createNewGame([{ x: 5, y: 5 }]);
  return {
    ...state,
    food: { x: 6, y: 5 },
    direction: 'RIGHT',
  };
}

describe('foodEaten counter', () => {
  it('starts at zero in a new game', () => {
    const state = createNewGame(INITIAL_SNAKE);
    expect(state.foodEaten).toBe(0);
  });

  it('increments when snake eats food', () => {
    const state = createStateWithFoodAhead();
    expect(state.foodEaten).toBe(0);

    const next = tick(state, 'RIGHT');
    expect(next.foodEaten).toBe(1);
    expect(next.score).toBe(POINTS_PER_FOOD);
  });

  it('does not increment when snake moves without eating', () => {
    const state = createNewGame([{ x: 5, y: 5 }]);
    const moved = {
      ...state,
      food: { x: 15, y: 15 },
      direction: 'RIGHT' as const,
    };

    const next = tick(moved, 'RIGHT');
    expect(next.foodEaten).toBe(0);
  });

  it('increments multiple times across multiple food eaten', () => {
    let state = createStateWithFoodAhead();

    const after1 = tick(state, 'RIGHT');
    expect(after1.foodEaten).toBe(1);

    const after1WithFood = {
      ...after1,
      food: { x: 7, y: 5 },
    };

    const after2 = tick(after1WithFood, 'RIGHT');
    expect(after2.foodEaten).toBe(2);
  });

  it('preserves foodEaten on game over', () => {
    const state: GameState = {
      ...createNewGame([{ x: 0, y: 0 }]),
      food: { x: 15, y: 15 },
      foodEaten: 5,
      direction: 'LEFT',
    };

    const next = tick(state, 'LEFT');
    expect(next.gameOver).toBe(true);
    expect(next.foodEaten).toBe(5);
  });
});
