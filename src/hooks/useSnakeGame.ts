import { useState, useEffect, useCallback, useRef } from 'react';
import { Position, Direction, GameState } from '../types/types';

const GRID_SIZE = 20;
const GAME_SPEED = 100; // milliseconds per tick

const INITIAL_SNAKE: Position[] = [
  { x: 10, y: 10 },
  { x: 10, y: 11 },
  { x: 10, y: 12 },
];

const INITIAL_DIRECTION: Direction = 'UP';

const generateFood = (snake: Position[]): Position => {
  let food: Position;
  do {
    food = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (snake.some(segment => segment.x === food.x && segment.y === food.y));
  return food;
};

export const useSnakeGame = () => {
  const [gameState, setGameState] = useState<GameState>({
    snake: INITIAL_SNAKE,
    food: generateFood(INITIAL_SNAKE),
    direction: INITIAL_DIRECTION,
    score: 0,
    gameOver: false,
    gameStarted: false,
  });

  const directionRef = useRef<Direction>(INITIAL_DIRECTION);

  const resetGame = useCallback(() => {
    const newSnake = INITIAL_SNAKE;
    setGameState({
      snake: newSnake,
      food: generateFood(newSnake),
      direction: INITIAL_DIRECTION,
      score: 0,
      gameOver: false,
      gameStarted: true,
    });
    directionRef.current = INITIAL_DIRECTION;
  }, []);

  const moveSnake = useCallback(() => {
    setGameState(prevState => {
      if (!prevState.gameStarted || prevState.gameOver) return prevState;

      const direction = directionRef.current;
      const head = prevState.snake[0];
      let newHead: Position;

      switch (direction) {
        case 'UP':
          newHead = { x: head.x, y: head.y - 1 };
          break;
        case 'DOWN':
          newHead = { x: head.x, y: head.y + 1 };
          break;
        case 'LEFT':
          newHead = { x: head.x - 1, y: head.y };
          break;
        case 'RIGHT':
          newHead = { x: head.x + 1, y: head.y };
          break;
      }

      // Check wall collision
      if (
        newHead.x < 0 ||
        newHead.x >= GRID_SIZE ||
        newHead.y < 0 ||
        newHead.y >= GRID_SIZE
      ) {
        return { ...prevState, gameOver: true };
      }

      // Check self collision
      if (prevState.snake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
        return { ...prevState, gameOver: true };
      }

      const newSnake = [newHead, ...prevState.snake];

      // Check food collision
      if (newHead.x === prevState.food.x && newHead.y === prevState.food.y) {
        return {
          ...prevState,
          snake: newSnake,
          food: generateFood(newSnake),
          score: prevState.score + 1,
          direction,
        };
      }

      // Remove tail if no food eaten
      newSnake.pop();

      return {
        ...prevState,
        snake: newSnake,
        direction,
      };
    });
  }, []);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault();
        if (!gameState.gameStarted || gameState.gameOver) {
          resetGame();
        }
        return;
      }

      if (!gameState.gameStarted || gameState.gameOver) return;

      const currentDirection = directionRef.current;

      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          if (currentDirection !== 'DOWN') directionRef.current = 'UP';
          break;
        case 'ArrowDown':
          e.preventDefault();
          if (currentDirection !== 'UP') directionRef.current = 'DOWN';
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (currentDirection !== 'RIGHT') directionRef.current = 'LEFT';
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (currentDirection !== 'LEFT') directionRef.current = 'RIGHT';
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [gameState.gameStarted, gameState.gameOver, resetGame]);

  useEffect(() => {
    if (!gameState.gameStarted || gameState.gameOver) return;

    const gameLoop = setInterval(moveSnake, GAME_SPEED);
    return () => clearInterval(gameLoop);
  }, [gameState.gameStarted, gameState.gameOver, moveSnake]);

  return { gameState, resetGame, gridSize: GRID_SIZE };
};
