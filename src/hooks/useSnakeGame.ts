import { useState, useEffect, useRef, useCallback } from 'react';
import { PlatformMessage, GameMessage, Direction } from '../types/messages';

export type { Direction };

interface Position {
  x: number;
  y: number;
}

interface GameState {
  snake: Position[];
  food: Position;
  direction: Direction;
  gameOver: boolean;
  gameStarted: boolean;
  score: number;
}

const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 10, y: 10 }];
const GAME_SPEED = 150;

export function useSnakeGame() {
  const [gameState, setGameState] = useState<GameState>({
    snake: INITIAL_SNAKE,
    food: { x: 15, y: 15 },
    direction: 'RIGHT',
    gameOver: false,
    gameStarted: false,
    score: 0
  });

  const directionRef = useRef<Direction>('RIGHT');
  const directionQueueRef = useRef<Direction[]>([]); // Queue of pending direction changes
  const gameLoopRef = useRef<number>();

  // Detect if game is embedded in platform iframe
  const isEmbedded = window.parent !== window;

  const generateFood = useCallback((snake: Position[]): Position => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE)
      };
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
  }, []);

  const checkCollision = useCallback((head: Position, snake: Position[]): boolean => {
    // Wall collision
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      return true;
    }
    // Self collision
    return snake.some(segment => segment.x === head.x && segment.y === head.y);
  }, []);

  const moveSnake = useCallback(() => {
    setGameState(prev => {
      if (prev.gameOver || !prev.gameStarted) return prev;

      // Process next queued direction if available
      if (directionQueueRef.current.length > 0) {
        const nextDirection = directionQueueRef.current.shift()!;
        directionRef.current = nextDirection;
        console.log('🎮 Applied queued direction:', nextDirection, 'Queue length:', directionQueueRef.current.length);
      }

      const head = prev.snake[0];
      const direction = directionRef.current;

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

      if (checkCollision(newHead, prev.snake)) {
        return { ...prev, gameOver: true };
      }

      const newSnake = [newHead, ...prev.snake];
      const ateFood = newHead.x === prev.food.x && newHead.y === prev.food.y;

      if (ateFood) {
        return {
          ...prev,
          snake: newSnake,
          food: generateFood(newSnake),
          score: prev.score + 10
        };
      } else {
        newSnake.pop();
        return { ...prev, snake: newSnake };
      }
    });
  }, [checkCollision, generateFood]);

  useEffect(() => {
    if (gameState.gameStarted && !gameState.gameOver) {
      gameLoopRef.current = window.setInterval(moveSnake, GAME_SPEED);
      return () => {
        if (gameLoopRef.current) clearInterval(gameLoopRef.current);
      };
    }
  }, [gameState.gameStarted, gameState.gameOver, moveSnake]);

  // Input handling: keyboard for standalone, postMessage for embedded
  useEffect(() => {
    if (!isEmbedded) {
      // Standalone mode: use keyboard controls
      const handleKeyPress = (e: KeyboardEvent) => {
        if (!gameState.gameStarted || gameState.gameOver) {
          if (e.code === 'Space') {
            resetGame();
          }
          return;
        }

        const currentDirection = directionRef.current;

        switch (e.key) {
          case 'ArrowUp':
            if (currentDirection !== 'DOWN') directionRef.current = 'UP';
            break;
          case 'ArrowDown':
            if (currentDirection !== 'UP') directionRef.current = 'DOWN';
            break;
          case 'ArrowLeft':
            if (currentDirection !== 'RIGHT') directionRef.current = 'LEFT';
            break;
          case 'ArrowRight':
            if (currentDirection !== 'LEFT') directionRef.current = 'RIGHT';
            break;
        }
      };

      window.addEventListener('keydown', handleKeyPress);
      return () => window.removeEventListener('keydown', handleKeyPress);
    }

    // Embedded mode: listen for postMessage from platform
    const handleMessage = (event: MessageEvent) => {
      console.log('🎮 Game received message:', { origin: event.origin, data: event.data });

      // Validate origin for security
      const allowedOrigins = [
        'https://perfect-snake-platform.vercel.app',
        'http://localhost:5173',
        'http://localhost:4173'
      ];

      if (!allowedOrigins.includes(event.origin)) {
        console.warn('❌ Ignored message from unauthorized origin:', event.origin);
        return;
      }

      const message = event.data as PlatformMessage;

      // Validate message structure
      if (!message || typeof message !== 'object' || !message.type) {
        console.warn('❌ Invalid message structure:', message);
        return;
      }

      console.log('✅ Processing message:', message.type);

      switch (message.type) {
        case 'DIRECTION_CHANGE':
          console.log('🎮 Changing direction to:', message.direction);
          changeDirection(message.direction);
          break;
        case 'START_GAME':
          console.log('🎮 Starting game');
          if (!gameState.gameStarted) resetGame();
          break;
        case 'RESET_GAME':
          console.log('🎮 Resetting game');
          resetGame();
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isEmbedded, gameState.gameStarted, gameState.gameOver]);

  // Send state updates to platform when embedded
  useEffect(() => {
    if (isEmbedded && window.parent) {
      const stateMessage: GameMessage = {
        type: 'GAME_STATE',
        gameStarted: gameState.gameStarted,
        gameOver: gameState.gameOver,
        score: gameState.score,
        timestamp: Date.now()
      };

      window.parent.postMessage(stateMessage, '*');
    }
  }, [isEmbedded, gameState.gameStarted, gameState.gameOver, gameState.score]);

  // Send ready message on mount when embedded
  useEffect(() => {
    if (isEmbedded && window.parent) {
      const readyMessage: GameMessage = {
        type: 'GAME_READY',
        timestamp: Date.now()
      };

      window.parent.postMessage(readyMessage, '*');
    }
  }, [isEmbedded]);

  const resetGame = () => {
    directionRef.current = 'RIGHT';
    directionQueueRef.current = []; // Clear the queue
    const newSnake = INITIAL_SNAKE;
    setGameState({
      snake: newSnake,
      food: generateFood(newSnake),
      direction: 'RIGHT',
      gameOver: false,
      gameStarted: true,
      score: 0
    });
  };

  const changeDirection = useCallback((newDirection: Direction) => {
    if (!gameState.gameStarted || gameState.gameOver) return;

    // Get the last direction in the queue, or current direction if queue is empty
    const lastQueuedDirection = directionQueueRef.current.length > 0
      ? directionQueueRef.current[directionQueueRef.current.length - 1]
      : directionRef.current;

    // Validate against the last queued direction to prevent 180-degree turns
    const isValidMove =
      (newDirection === 'UP' && lastQueuedDirection !== 'DOWN') ||
      (newDirection === 'DOWN' && lastQueuedDirection !== 'UP') ||
      (newDirection === 'LEFT' && lastQueuedDirection !== 'RIGHT') ||
      (newDirection === 'RIGHT' && lastQueuedDirection !== 'LEFT');

    if (!isValidMove) {
      console.log('❌ Invalid move - would reverse direction');
      return;
    }

    // Don't queue duplicate directions
    if (newDirection === lastQueuedDirection) {
      console.log('⚠️ Duplicate direction ignored');
      return;
    }

    // Limit queue size to 3 to prevent building up too many moves
    if (directionQueueRef.current.length >= 3) {
      console.log('⚠️ Queue full - ignoring input');
      return;
    }

    // Add to queue
    directionQueueRef.current.push(newDirection);
    console.log('✅ Direction queued:', newDirection, 'Queue:', directionQueueRef.current);
  }, [gameState.gameStarted, gameState.gameOver]);

  return {
    gameState,
    resetGame,
    changeDirection,
    gridSize: GRID_SIZE
  };
}
