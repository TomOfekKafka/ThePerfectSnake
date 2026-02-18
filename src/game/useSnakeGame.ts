/**
 * Main Snake Game Hook
 * Composes all game modules into a single, clean interface
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Direction } from './types';
import { createInitialState, INITIAL_SNAKE, GAME_SPEED_MS, GRID_SIZE, SPEED_BOOST_MS } from './constants';
import { tick, createNewGame, hasPowerUp } from './logic';
import { usePostMessage } from './usePostMessage';
import { useKeyboard } from './useKeyboard';
import { useTouch } from './useTouch';
import { useDirectionQueue } from './useDirectionQueue';

export type { Direction, GameState, Position } from './types';
export { GRID_SIZE } from './constants';

export function useSnakeGame() {
  const [gameState, setGameState] = useState<GameState>(createInitialState);
  const gameLoopRef = useRef<number>();
  const directionQueue = useDirectionQueue();

  // Detect embedded mode (in iframe)
  const isEmbedded = typeof window !== 'undefined' && window.parent !== window;

  // Game actions
  const resetGame = useCallback(() => {
    directionQueue.reset();
    setGameState(createNewGame(INITIAL_SNAKE));
  }, [directionQueue]);

  const changeDirection = useCallback((direction: Direction) => {
    if (!gameState.gameStarted || gameState.gameOver) return;
    directionQueue.enqueue(direction);
  }, [gameState.gameStarted, gameState.gameOver, directionQueue]);

  // PostMessage communication (origin-agnostic)
  const { broadcastState, broadcastReady } = usePostMessage({
    isEmbedded,
    onDirectionChange: changeDirection,
    onStartGame: resetGame,
    onResetGame: resetGame
  });

  // Keyboard input (standalone mode only)
  useKeyboard({
    enabled: !isEmbedded,
    gameStarted: gameState.gameStarted,
    gameOver: gameState.gameOver,
    onDirectionChange: changeDirection,
    onStartOrReset: resetGame
  });

  // Touch/swipe input (standalone mode only)
  useTouch({
    enabled: !isEmbedded,
    gameStarted: gameState.gameStarted,
    gameOver: gameState.gameOver,
    onDirectionChange: changeDirection
  });

  // Game loop
  useEffect(() => {
    if (!gameState.gameStarted || gameState.gameOver) {
      return;
    }

    const runTick = () => {
      const direction = directionQueue.dequeue();
      setGameState(prev => tick(prev, direction));
    };

    const hasSpeedBoost = hasPowerUp(gameState.activePowerUps, 'SPEED_BOOST');
    const speed = hasSpeedBoost ? SPEED_BOOST_MS : GAME_SPEED_MS;

    gameLoopRef.current = window.setInterval(runTick, speed);

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [gameState.gameStarted, gameState.gameOver, gameState.activePowerUps, directionQueue]);

  // Broadcast state changes to parent
  useEffect(() => {
    broadcastState({
      gameStarted: gameState.gameStarted,
      gameOver: gameState.gameOver,
      score: gameState.score
    });
  }, [gameState.gameStarted, gameState.gameOver, gameState.score, broadcastState]);

  // Broadcast ready on mount
  useEffect(() => {
    broadcastReady();
  }, [broadcastReady]);

  return {
    gameState,
    resetGame,
    changeDirection,
    gridSize: GRID_SIZE,
    isEmbedded
  };
}
