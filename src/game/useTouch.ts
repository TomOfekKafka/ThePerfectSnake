/**
 * Touch/swipe input hook for mobile standalone mode
 */

import { useEffect, useRef } from 'react';
import { Direction } from './types';

const SWIPE_THRESHOLD = 30;

interface UseTouchOptions {
  enabled: boolean;
  gameStarted: boolean;
  gameOver: boolean;
  onDirectionChange: (direction: Direction) => void;
}

export function useTouch({
  enabled,
  gameStarted,
  gameOver,
  onDirectionChange
}: UseTouchOptions) {
  const touchStart = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!enabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStart.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!gameStarted || gameOver) return;

      const deltaX = e.changedTouches[0].clientX - touchStart.current.x;
      const deltaY = e.changedTouches[0].clientY - touchStart.current.y;

      // Determine swipe direction based on larger axis
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX > SWIPE_THRESHOLD) {
          onDirectionChange('RIGHT');
        } else if (deltaX < -SWIPE_THRESHOLD) {
          onDirectionChange('LEFT');
        }
      } else {
        if (deltaY > SWIPE_THRESHOLD) {
          onDirectionChange('DOWN');
        } else if (deltaY < -SWIPE_THRESHOLD) {
          onDirectionChange('UP');
        }
      }
    };

    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, gameStarted, gameOver, onDirectionChange]);
}
