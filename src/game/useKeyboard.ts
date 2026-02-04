/**
 * Keyboard input hook for standalone mode
 */

import { useEffect } from 'react';
import { Direction } from './types';

const KEY_TO_DIRECTION: Record<string, Direction> = {
  ArrowUp: 'UP',
  ArrowDown: 'DOWN',
  ArrowLeft: 'LEFT',
  ArrowRight: 'RIGHT'
};

interface UseKeyboardOptions {
  enabled: boolean;
  gameStarted: boolean;
  gameOver: boolean;
  onDirectionChange: (direction: Direction) => void;
  onStartOrReset: () => void;
}

export function useKeyboard({
  enabled,
  gameStarted,
  gameOver,
  onDirectionChange,
  onStartOrReset
}: UseKeyboardOptions) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Space to start or reset
      if (e.code === 'Space') {
        if (!gameStarted || gameOver) {
          e.preventDefault();
          onStartOrReset();
        }
        return;
      }

      // Arrow keys for direction
      const direction = KEY_TO_DIRECTION[e.key];
      if (direction && gameStarted && !gameOver) {
        e.preventDefault();
        onDirectionChange(direction);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enabled, gameStarted, gameOver, onDirectionChange, onStartOrReset]);
}
