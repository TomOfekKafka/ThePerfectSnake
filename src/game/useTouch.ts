import { useEffect, useRef } from 'react';
import { Direction, Position } from './types';
import { getTapDirection } from './tapDirection';
import { CELL_SIZE, GRID_SIZE } from './constants';

const SWIPE_THRESHOLD = 30;

export interface TapEvent {
  x: number;
  y: number;
  direction: Direction;
}

interface UseTouchOptions {
  enabled: boolean;
  gameStarted: boolean;
  gameOver: boolean;
  snakeHead: Position | null;
  currentDirection: Direction;
  onDirectionChange: (direction: Direction) => void;
  onTap?: (event: TapEvent) => void;
}

export function useTouch({
  enabled,
  gameStarted,
  gameOver,
  snakeHead,
  currentDirection,
  onDirectionChange,
  onTap
}: UseTouchOptions) {
  const touchStart = useRef({ x: 0, y: 0 });
  const snakeHeadRef = useRef<Position | null>(snakeHead);
  const currentDirectionRef = useRef<Direction>(currentDirection);
  const onTapRef = useRef(onTap);

  snakeHeadRef.current = snakeHead;
  currentDirectionRef.current = currentDirection;
  onTapRef.current = onTap;

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

      const endX = e.changedTouches[0].clientX;
      const endY = e.changedTouches[0].clientY;
      const deltaX = endX - touchStart.current.x;
      const deltaY = endY - touchStart.current.y;

      const isSwipe = Math.abs(deltaX) > SWIPE_THRESHOLD || Math.abs(deltaY) > SWIPE_THRESHOLD;

      if (isSwipe) {
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
        return;
      }

      const head = snakeHeadRef.current;
      if (!head) return;

      const canvas = document.querySelector('canvas');
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const canvasWidth = GRID_SIZE * CELL_SIZE;
      const canvasHeight = GRID_SIZE * CELL_SIZE;

      const result = getTapDirection(
        endX,
        endY,
        head,
        rect,
        canvasWidth,
        canvasHeight,
        currentDirectionRef.current
      );

      if (result) {
        onDirectionChange(result.direction);
        if (onTapRef.current) {
          onTapRef.current({ x: endX, y: endY, direction: result.direction });
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
