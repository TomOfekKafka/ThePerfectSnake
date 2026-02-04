/**
 * Pure game logic functions - no React, no side effects
 * Easy to test, easy to reason about
 */

import { Position, Direction, GameState, OPPOSITE_DIRECTIONS } from './types';
import { GRID_SIZE, POINTS_PER_FOOD } from './constants';

/** Check if two positions are equal */
export const positionsEqual = (a: Position, b: Position): boolean =>
  a.x === b.x && a.y === b.y;

/** Check if position is within grid bounds */
export const isInBounds = (pos: Position): boolean =>
  pos.x >= 0 && pos.x < GRID_SIZE && pos.y >= 0 && pos.y < GRID_SIZE;

/** Check if position collides with snake body */
export const collidesWithSnake = (pos: Position, snake: Position[]): boolean =>
  snake.some(segment => positionsEqual(pos, segment));

/** Check if move would cause collision (wall or self) */
export const wouldCollide = (head: Position, snake: Position[]): boolean =>
  !isInBounds(head) || collidesWithSnake(head, snake);

/** Get next head position based on direction */
export const getNextHead = (head: Position, direction: Direction): Position => {
  const moves: Record<Direction, Position> = {
    UP: { x: head.x, y: head.y - 1 },
    DOWN: { x: head.x, y: head.y + 1 },
    LEFT: { x: head.x - 1, y: head.y },
    RIGHT: { x: head.x + 1, y: head.y }
  };
  return moves[direction];
};

/** Check if direction change is valid (not 180-degree turn) */
export const isValidDirectionChange = (
  newDirection: Direction,
  currentDirection: Direction
): boolean => OPPOSITE_DIRECTIONS[newDirection] !== currentDirection;

/** Generate random food position not on snake */
export const generateFood = (snake: Position[]): Position => {
  let food: Position;
  do {
    food = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE)
    };
  } while (collidesWithSnake(food, snake));
  return food;
};

/** Calculate next game state after one tick */
export const tick = (state: GameState, direction: Direction): GameState => {
  if (state.gameOver || !state.gameStarted) {
    return state;
  }

  const head = state.snake[0];
  const newHead = getNextHead(head, direction);

  if (wouldCollide(newHead, state.snake)) {
    return { ...state, gameOver: true };
  }

  const newSnake = [newHead, ...state.snake];
  const ateFood = positionsEqual(newHead, state.food);

  if (ateFood) {
    return {
      ...state,
      snake: newSnake,
      food: generateFood(newSnake),
      score: state.score + POINTS_PER_FOOD,
      direction
    };
  }

  newSnake.pop();
  return { ...state, snake: newSnake, direction };
};

/** Create a fresh game state for starting/restarting */
export const createNewGame = (initialSnake: Position[]): GameState => ({
  snake: [...initialSnake],
  food: generateFood(initialSnake),
  direction: 'RIGHT',
  gameOver: false,
  gameStarted: true,
  score: 0
});
