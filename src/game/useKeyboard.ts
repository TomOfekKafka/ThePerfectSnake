/**
 * Keyboard input hook for standalone mode
 * Supports diagonal movement via simultaneous arrow key presses
 */

import { useEffect, useRef } from 'react';
import { Direction } from './types';

type ArrowKey = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight';

const ARROW_KEYS = new Set<string>(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);

const resolveDirection = (keys: Set<ArrowKey>): Direction | null => {
  const up = keys.has('ArrowUp');
  const down = keys.has('ArrowDown');
  const left = keys.has('ArrowLeft');
  const right = keys.has('ArrowRight');

  const vertical = up && !down ? 'UP' : down && !up ? 'DOWN' : null;
  const horizontal = left && !right ? 'LEFT' : right && !left ? 'RIGHT' : null;

  if (vertical && horizontal) {
    return `${vertical}_${horizontal}` as Direction;
  }
  return vertical ?? horizontal ?? null;
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
  const pressedArrows = useRef(new Set<ArrowKey>());
  const lastSentDirection = useRef<Direction | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const sendDirection = () => {
      const dir = resolveDirection(pressedArrows.current);
      if (dir && dir !== lastSentDirection.current && gameStarted && !gameOver) {
        lastSentDirection.current = dir;
        onDirectionChange(dir);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        if (!gameStarted || gameOver) {
          e.preventDefault();
          onStartOrReset();
        }
        return;
      }

      if (ARROW_KEYS.has(e.key)) {
        e.preventDefault();
        pressedArrows.current.add(e.key as ArrowKey);
        sendDirection();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (ARROW_KEYS.has(e.key)) {
        pressedArrows.current.delete(e.key as ArrowKey);
        lastSentDirection.current = null;
        sendDirection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      pressedArrows.current.clear();
    };
  }, [enabled, gameStarted, gameOver, onDirectionChange, onStartOrReset]);
}
