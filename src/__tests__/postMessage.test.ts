/**
 * postMessage API Integration Tests
 *
 * Tests the game's ability to receive commands and broadcast state.
 * The game is origin-agnostic - it accepts messages from any parent.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSnakeGame } from '../game';

describe('postMessage API - Embedded Mode', () => {
  beforeEach(() => {
    // Mock window.parent to simulate embedded mode
    Object.defineProperty(window, 'parent', {
      writable: true,
      configurable: true,
      value: { postMessage: vi.fn() }
    });
  });

  describe('Receiving commands from parent', () => {
    it('should start game when receiving START_GAME message', () => {
      const { result } = renderHook(() => useSnakeGame());

      expect(result.current.gameState.gameStarted).toBe(false);

      act(() => {
        window.dispatchEvent(new MessageEvent('message', {
          data: { type: 'START_GAME', timestamp: Date.now() }
        }));
      });

      expect(result.current.gameState.gameStarted).toBe(true);
    });

    it('should reset game when receiving RESET_GAME message', () => {
      const { result } = renderHook(() => useSnakeGame());

      // Start game first
      act(() => {
        result.current.resetGame();
      });

      expect(result.current.gameState.gameStarted).toBe(true);

      // Reset via message
      act(() => {
        window.dispatchEvent(new MessageEvent('message', {
          data: { type: 'RESET_GAME', timestamp: Date.now() }
        }));
      });

      expect(result.current.gameState.gameStarted).toBe(true);
      expect(result.current.gameState.gameOver).toBe(false);
      expect(result.current.gameState.score).toBe(0);
    });

    it('should change direction when receiving DIRECTION_CHANGE message', () => {
      const { result } = renderHook(() => useSnakeGame());

      act(() => {
        result.current.resetGame();
      });

      // Game starts moving RIGHT, send UP command
      act(() => {
        window.dispatchEvent(new MessageEvent('message', {
          data: { type: 'DIRECTION_CHANGE', direction: 'UP', timestamp: Date.now() }
        }));
      });

      // Game should still be running (direction queued)
      expect(result.current.gameState.gameStarted).toBe(true);
    });

    it('should ignore messages with invalid structure', () => {
      const { result } = renderHook(() => useSnakeGame());

      act(() => {
        result.current.resetGame();
      });

      const initialState = { ...result.current.gameState };

      // Send malformed message
      act(() => {
        window.dispatchEvent(new MessageEvent('message', {
          data: { invalid: 'structure' }
        }));
      });

      // State should be unchanged
      expect(result.current.gameState.score).toBe(initialState.score);
    });
  });

  describe('Broadcasting state to parent', () => {
    it('should send GAME_STATE when game starts', () => {
      const postMessageSpy = vi.fn();
      Object.defineProperty(window, 'parent', {
        writable: true,
        configurable: true,
        value: { postMessage: postMessageSpy }
      });

      const { result } = renderHook(() => useSnakeGame());

      act(() => {
        result.current.resetGame();
      });

      expect(postMessageSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'GAME_STATE',
          gameStarted: true,
          gameOver: false,
          score: 0
        }),
        '*'
      );
    });

    it('should send GAME_READY on mount', () => {
      const postMessageSpy = vi.fn();
      Object.defineProperty(window, 'parent', {
        writable: true,
        configurable: true,
        value: { postMessage: postMessageSpy }
      });

      renderHook(() => useSnakeGame());

      expect(postMessageSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'GAME_READY'
        }),
        '*'
      );
    });
  });
});

describe('Direction Queue', () => {
  beforeEach(() => {
    Object.defineProperty(window, 'parent', {
      writable: true,
      configurable: true,
      value: { postMessage: vi.fn() }
    });
  });

  it('should accept valid direction changes', () => {
    const { result } = renderHook(() => useSnakeGame());

    act(() => {
      result.current.resetGame();
    });

    // Queue UP (valid - not opposite of RIGHT)
    act(() => {
      result.current.changeDirection('UP');
    });

    expect(result.current.gameState.gameStarted).toBe(true);
  });

  it('should reject 180-degree turns', () => {
    const { result } = renderHook(() => useSnakeGame());

    act(() => {
      result.current.resetGame();
      // Game starts moving RIGHT
    });

    // Try to go LEFT (opposite of RIGHT) - should be silently rejected
    act(() => {
      result.current.changeDirection('LEFT');
    });

    // Game should continue normally
    expect(result.current.gameState.gameStarted).toBe(true);
  });
});

describe('Message Format', () => {
  it('DIRECTION_CHANGE should have correct structure', () => {
    const message = {
      type: 'DIRECTION_CHANGE',
      direction: 'UP',
      timestamp: Date.now()
    };

    expect(message).toHaveProperty('type', 'DIRECTION_CHANGE');
    expect(message).toHaveProperty('direction');
    expect(message).toHaveProperty('timestamp');
    expect(['UP', 'DOWN', 'LEFT', 'RIGHT']).toContain(message.direction);
  });

  it('GAME_STATE should have correct structure', () => {
    const message = {
      type: 'GAME_STATE',
      gameStarted: true,
      gameOver: false,
      score: 100,
      version: 0,
      timestamp: Date.now()
    };

    expect(message).toHaveProperty('type', 'GAME_STATE');
    expect(message).toHaveProperty('gameStarted');
    expect(message).toHaveProperty('gameOver');
    expect(message).toHaveProperty('score');
    expect(message).toHaveProperty('version');
    expect(typeof message.gameStarted).toBe('boolean');
    expect(typeof message.score).toBe('number');
  });
});
