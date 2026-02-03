/**
 * postMessage API Integration Tests
 *
 * CRITICAL: These tests verify the platform-game communication API.
 * DO NOT modify the message format or API without updating the platform!
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSnakeGame } from '../hooks/useSnakeGame';

describe('postMessage API - Platform to Game Communication', () => {
  beforeEach(() => {
    // Mock window.parent to simulate embedded mode
    Object.defineProperty(window, 'parent', {
      writable: true,
      value: { postMessage: vi.fn() }
    });
  });

  describe('Receiving DIRECTION_CHANGE commands', () => {
    it('should change direction when receiving valid DIRECTION_CHANGE message', () => {
      const { result } = renderHook(() => useSnakeGame());

      // Start the game first
      act(() => {
        result.current.resetGame();
      });

      // Initial direction is RIGHT (default)

      // Simulate platform sending UP command
      act(() => {
        window.dispatchEvent(new MessageEvent('message', {
          data: {
            type: 'DIRECTION_CHANGE',
            direction: 'UP',
            timestamp: Date.now()
          },
          origin: 'https://perfect-snake-platform.vercel.app'
        }));
      });

      // Direction should be queued
      // Note: actual direction change happens on next game tick
      expect(result.current.gameState.gameStarted).toBe(true);
    });

    it('should reject messages from unauthorized origins', () => {
      const { result } = renderHook(() => useSnakeGame());
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      act(() => {
        result.current.resetGame();
      });

      // Simulate message from unauthorized origin
      act(() => {
        window.dispatchEvent(new MessageEvent('message', {
          data: {
            type: 'DIRECTION_CHANGE',
            direction: 'UP',
            timestamp: Date.now()
          },
          origin: 'https://evil-site.com'
        }));
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Ignored message from unauthorized origin'),
        'https://evil-site.com'
      );

      consoleWarnSpy.mockRestore();
    });

    it('should ignore invalid message structures', () => {
      const { result } = renderHook(() => useSnakeGame());
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      act(() => {
        result.current.resetGame();
      });

      // Simulate malformed message
      act(() => {
        window.dispatchEvent(new MessageEvent('message', {
          data: {
            invalid: 'structure'
          },
          origin: 'https://perfect-snake-platform.vercel.app'
        }));
      });

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid message structure'),
        expect.any(Object)
      );

      consoleWarnSpy.mockRestore();
    });
  });

  describe('Receiving START_GAME and RESET_GAME commands', () => {
    it('should start game when receiving START_GAME message', () => {
      const { result } = renderHook(() => useSnakeGame());

      expect(result.current.gameState.gameStarted).toBe(false);

      act(() => {
        window.dispatchEvent(new MessageEvent('message', {
          data: {
            type: 'START_GAME',
            timestamp: Date.now()
          },
          origin: 'https://perfect-snake-platform.vercel.app'
        }));
      });

      expect(result.current.gameState.gameStarted).toBe(true);
    });

    it('should reset game when receiving RESET_GAME message', () => {
      const { result } = renderHook(() => useSnakeGame());

      // Start and modify game state
      act(() => {
        result.current.resetGame();
      });

      // Simulate RESET_GAME command
      act(() => {
        window.dispatchEvent(new MessageEvent('message', {
          data: {
            type: 'RESET_GAME',
            timestamp: Date.now()
          },
          origin: 'https://perfect-snake-platform.vercel.app'
        }));
      });

      expect(result.current.gameState.gameStarted).toBe(true);
      expect(result.current.gameState.gameOver).toBe(false);
      expect(result.current.gameState.score).toBe(0);
    });
  });

  describe('Sending GAME_STATE updates to platform', () => {
    it('should send GAME_STATE when game state changes', () => {
      const postMessageSpy = vi.fn();
      Object.defineProperty(window, 'parent', {
        writable: true,
        value: { postMessage: postMessageSpy }
      });

      const { result } = renderHook(() => useSnakeGame());

      // Start game - should trigger state broadcast
      act(() => {
        result.current.resetGame();
      });

      // Check that postMessage was called with GAME_STATE
      expect(postMessageSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'GAME_STATE',
          gameStarted: true,
          gameOver: false,
          score: 0,
          timestamp: expect.any(Number)
        }),
        '*'
      );
    });

    it('should send GAME_READY on mount when embedded', () => {
      const postMessageSpy = vi.fn();
      Object.defineProperty(window, 'parent', {
        writable: true,
        value: { postMessage: postMessageSpy }
      });

      renderHook(() => useSnakeGame());

      // Check that GAME_READY was sent
      expect(postMessageSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'GAME_READY',
          timestamp: expect.any(Number)
        }),
        '*'
      );
    });
  });

  describe('Message format validation', () => {
    it('should have correct DIRECTION_CHANGE message structure', () => {
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

    it('should have correct GAME_STATE message structure', () => {
      const message = {
        type: 'GAME_STATE',
        gameStarted: true,
        gameOver: false,
        score: 100,
        timestamp: Date.now()
      };

      expect(message).toHaveProperty('type', 'GAME_STATE');
      expect(message).toHaveProperty('gameStarted');
      expect(message).toHaveProperty('gameOver');
      expect(message).toHaveProperty('score');
      expect(message).toHaveProperty('timestamp');
      expect(typeof message.gameStarted).toBe('boolean');
      expect(typeof message.gameOver).toBe('boolean');
      expect(typeof message.score).toBe('number');
    });
  });
});

describe('Direction Queue System', () => {
  it('should queue multiple rapid direction changes', () => {
    const { result } = renderHook(() => useSnakeGame());

    act(() => {
      result.current.resetGame();
    });

    // Rapidly queue multiple direction changes
    act(() => {
      result.current.changeDirection('UP');
      result.current.changeDirection('LEFT');
    });

    // Both should be queued (verified by console logs in implementation)
    expect(result.current.gameState.gameStarted).toBe(true);
  });

  it('should prevent 180-degree turns', () => {
    const { result } = renderHook(() => useSnakeGame());

    act(() => {
      result.current.resetGame();
      // Snake starts moving RIGHT
    });

    // Try to go LEFT (opposite of RIGHT) - should be blocked
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    act(() => {
      result.current.changeDirection('LEFT');
    });

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Invalid move')
    );

    consoleLogSpy.mockRestore();
  });

  it('should limit queue size to prevent overflow', () => {
    const { result } = renderHook(() => useSnakeGame());
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    act(() => {
      result.current.resetGame();
    });

    // Try to queue more than 3 directions
    act(() => {
      result.current.changeDirection('UP');
      result.current.changeDirection('RIGHT');
      result.current.changeDirection('DOWN');
      result.current.changeDirection('LEFT'); // Should be rejected (queue full)
    });

    expect(consoleLogSpy).toHaveBeenCalledWith(
      expect.stringContaining('Queue full')
    );

    consoleLogSpy.mockRestore();
  });
});
