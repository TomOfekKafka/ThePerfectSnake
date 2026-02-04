/**
 * Direction queue manager
 * Handles buffering rapid direction inputs to prevent missed moves
 */

import { useRef, useCallback } from 'react';
import { Direction, OPPOSITE_DIRECTIONS } from './types';
import { MAX_DIRECTION_QUEUE, INITIAL_DIRECTION } from './constants';

export function useDirectionQueue() {
  const currentDirection = useRef<Direction>(INITIAL_DIRECTION);
  const queue = useRef<Direction[]>([]);

  /** Get the effective current direction (last queued or current) */
  const getEffectiveDirection = useCallback((): Direction => {
    return queue.current.length > 0
      ? queue.current[queue.current.length - 1]
      : currentDirection.current;
  }, []);

  /** Try to queue a new direction, returns true if accepted */
  const enqueue = useCallback((direction: Direction): boolean => {
    const effective = getEffectiveDirection();

    // Prevent 180-degree turns
    if (OPPOSITE_DIRECTIONS[direction] === effective) {
      return false;
    }

    // Prevent duplicate
    if (direction === effective) {
      return false;
    }

    // Prevent queue overflow
    if (queue.current.length >= MAX_DIRECTION_QUEUE) {
      return false;
    }

    queue.current.push(direction);
    return true;
  }, [getEffectiveDirection]);

  /** Dequeue and apply next direction, returns the direction to use */
  const dequeue = useCallback((): Direction => {
    if (queue.current.length > 0) {
      currentDirection.current = queue.current.shift()!;
    }
    return currentDirection.current;
  }, []);

  /** Reset to initial state */
  const reset = useCallback(() => {
    currentDirection.current = INITIAL_DIRECTION;
    queue.current = [];
  }, []);

  /** Get current direction without dequeuing */
  const getCurrent = useCallback((): Direction => {
    return currentDirection.current;
  }, []);

  return {
    enqueue,
    dequeue,
    reset,
    getCurrent,
    getEffectiveDirection
  };
}
