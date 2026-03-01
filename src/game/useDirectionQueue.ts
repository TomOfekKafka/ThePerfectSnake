/**
 * Direction queue manager
 * Handles buffering rapid direction inputs to prevent missed moves
 */

import { useRef, useCallback } from 'react';
import { Direction, OPPOSITE_DIRECTIONS } from './types';
import { MAX_DIRECTION_QUEUE, INITIAL_DIRECTION } from './constants';

export type EnqueueResult = 'accepted' | 'same_direction' | 'rejected';

export function useDirectionQueue() {
  const currentDirection = useRef<Direction>(INITIAL_DIRECTION);
  const queue = useRef<Direction[]>([]);

  const getEffectiveDirection = useCallback((): Direction => {
    return queue.current.length > 0
      ? queue.current[queue.current.length - 1]
      : currentDirection.current;
  }, []);

  const enqueue = useCallback((direction: Direction): EnqueueResult => {
    const effective = getEffectiveDirection();

    if (OPPOSITE_DIRECTIONS[direction] === effective) {
      return 'rejected';
    }

    if (direction === effective) {
      return 'same_direction';
    }

    if (queue.current.length >= MAX_DIRECTION_QUEUE) {
      return 'rejected';
    }

    queue.current.push(direction);
    return 'accepted';
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
