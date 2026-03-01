/**
 * Main Snake Game Hook
 * Composes all game modules into a single, clean interface
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, Direction } from './types';
import { createInitialState, INITIAL_SNAKE, GAME_SPEED_MS, GRID_SIZE, SPEED_BOOST_MS } from './constants';
import { tick, createNewGame, hasPowerUp, reviveSnake } from './logic';
import { usePostMessage } from './usePostMessage';
import { useKeyboard } from './useKeyboard';
import { useTouch, TapEvent } from './useTouch';
import { useDirectionQueue } from './useDirectionQueue';
import {
  TriviaState,
  createTriviaState,
  activateTrivia,
  submitTriviaAnswer,
  tickTriviaResult,
  isTriviaResultDone,
  finishTrivia,
} from './trivia';

export type { Direction, GameState, Position } from './types';
export { GRID_SIZE } from './constants';

export function useSnakeGame() {
  const [gameState, setGameState] = useState<GameState>(createInitialState);
  const [triviaState, setTriviaState] = useState<TriviaState>(createTriviaState);
  const gameLoopRef = useRef<number>();
  const triviaTimerRef = useRef<number>();
  const directionQueue = useDirectionQueue();
  const sparkCallbackRef = useRef<((direction: Direction) => void) | null>(null);
  const tapCallbackRef = useRef<((event: TapEvent) => void) | null>(null);

  const isEmbedded = typeof window !== 'undefined' && window.parent !== window;

  const resetGame = useCallback(() => {
    directionQueue.reset();
    setGameState(createNewGame(INITIAL_SNAKE));
    setTriviaState(createTriviaState());
  }, [directionQueue]);

  const answerTrivia = useCallback((answerIndex: number) => {
    setTriviaState(prev => {
      if (!prev.active || prev.selectedAnswer !== null) return prev;
      return submitTriviaAnswer(prev, answerIndex);
    });
  }, []);

  const changeDirection = useCallback((direction: Direction) => {
    if (!gameState.gameStarted || gameState.gameOver) return;
    const result = directionQueue.enqueue(direction);
    if (result === 'same_direction' && sparkCallbackRef.current) {
      sparkCallbackRef.current(direction);
    }
  }, [gameState.gameStarted, gameState.gameOver, directionQueue]);

  const onSparkTrigger = useCallback((cb: (direction: Direction) => void) => {
    sparkCallbackRef.current = cb;
  }, []);

  const onTapTrigger = useCallback((cb: (event: TapEvent) => void) => {
    tapCallbackRef.current = cb;
  }, []);

  const handleTap = useCallback((event: TapEvent) => {
    if (tapCallbackRef.current) {
      tapCallbackRef.current(event);
    }
  }, []);

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

  // Touch/swipe + tap-to-turn input (standalone mode only)
  useTouch({
    enabled: !isEmbedded,
    gameStarted: gameState.gameStarted,
    gameOver: gameState.gameOver,
    snakeHead: gameState.snake.length > 0 ? gameState.snake[0] : null,
    currentDirection: gameState.direction,
    onDirectionChange: changeDirection,
    onTap: handleTap
  });

  // Trivia keyboard input (1-4 keys to answer)
  useEffect(() => {
    if (!triviaState.active || triviaState.selectedAnswer !== null) return;

    const handleKey = (e: KeyboardEvent) => {
      const key = e.key;
      if (key >= '1' && key <= '4') {
        e.preventDefault();
        answerTrivia(parseInt(key) - 1);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [triviaState.active, triviaState.selectedAnswer, answerTrivia]);

  // Game loop - intercept game over for trivia
  useEffect(() => {
    if (!gameState.gameStarted || gameState.gameOver) {
      return;
    }

    const runTick = () => {
      const direction = directionQueue.dequeue();
      setGameState(prev => {
        const next = tick(prev, direction);
        if (next.gameOver && !prev.gameOver && !triviaState.used) {
          setTriviaState(prevTrivia => activateTrivia(prevTrivia));
        }
        return next;
      });
    };

    const hasSpeedBoost = hasPowerUp(gameState.activePowerUps, 'SPEED_BOOST');
    const speed = hasSpeedBoost ? SPEED_BOOST_MS : GAME_SPEED_MS;

    gameLoopRef.current = window.setInterval(runTick, speed);

    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [gameState.gameStarted, gameState.gameOver, gameState.activePowerUps, directionQueue, triviaState.used]);

  // Trivia result countdown timer
  useEffect(() => {
    if (!triviaState.active || triviaState.result === null) {
      if (triviaTimerRef.current) {
        clearInterval(triviaTimerRef.current);
        triviaTimerRef.current = undefined;
      }
      return;
    }

    triviaTimerRef.current = window.setInterval(() => {
      setTriviaState(prev => tickTriviaResult(prev));
    }, 1000 / 30);

    return () => {
      if (triviaTimerRef.current) {
        clearInterval(triviaTimerRef.current);
      }
    };
  }, [triviaState.active, triviaState.result]);

  // Handle trivia result completion
  useEffect(() => {
    if (!isTriviaResultDone(triviaState)) return;

    if (triviaState.result === 'correct') {
      setGameState(prev => reviveSnake(prev));
    }
    setTriviaState(prev => finishTrivia(prev));
  }, [triviaState]);

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
    triviaState,
    resetGame,
    changeDirection,
    answerTrivia,
    gridSize: GRID_SIZE,
    isEmbedded,
    onSparkTrigger,
    onTapTrigger
  };
}
