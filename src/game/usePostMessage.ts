/**
 * PostMessage communication hook
 *
 * IMPORTANT: This game is origin-agnostic. When embedded, it accepts
 * messages from ANY parent and broadcasts state to ANY parent.
 * The game doesn't need to know WHO is embedding it.
 */

import { useEffect, useCallback } from 'react';
import { Direction } from './types';

export interface GameStateMessage {
  type: 'GAME_STATE';
  gameStarted: boolean;
  gameOver: boolean;
  score: number;
  timestamp: number;
}

export interface GameReadyMessage {
  type: 'GAME_READY';
  timestamp: number;
  embedded: boolean;
}

export interface DirectionCommand {
  type: 'DIRECTION_CHANGE';
  direction: Direction;
  timestamp: number;
}

export interface GameControlCommand {
  type: 'START_GAME' | 'RESET_GAME';
  timestamp: number;
}

type IncomingMessage = DirectionCommand | GameControlCommand;

interface UsePostMessageOptions {
  isEmbedded: boolean;
  onDirectionChange: (direction: Direction) => void;
  onStartGame: () => void;
  onResetGame: () => void;
}

interface GameStateBroadcast {
  gameStarted: boolean;
  gameOver: boolean;
  score: number;
}

const isValidMessage = (data: unknown): data is IncomingMessage => {
  if (!data || typeof data !== 'object') return false;
  const msg = data as Record<string, unknown>;
  return typeof msg.type === 'string' &&
    ['DIRECTION_CHANGE', 'START_GAME', 'RESET_GAME'].includes(msg.type);
};

export function usePostMessage({
  isEmbedded,
  onDirectionChange,
  onStartGame,
  onResetGame
}: UsePostMessageOptions) {

  // Listen for incoming messages from parent
  useEffect(() => {
    if (!isEmbedded) return;

    const handleMessage = (event: MessageEvent) => {
      // Accept messages from any origin - the game is origin-agnostic
      // We validate message STRUCTURE, not origin

      if (!isValidMessage(event.data)) {
        return; // Silently ignore non-game messages
      }

      const message = event.data;

      switch (message.type) {
        case 'DIRECTION_CHANGE':
          onDirectionChange(message.direction);
          break;
        case 'START_GAME':
          onStartGame();
          break;
        case 'RESET_GAME':
          onResetGame();
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [isEmbedded, onDirectionChange, onStartGame, onResetGame]);

  // Broadcast state to parent
  const broadcastState = useCallback((state: GameStateBroadcast) => {
    if (!isEmbedded || !window.parent) return;

    const message: GameStateMessage = {
      type: 'GAME_STATE',
      gameStarted: state.gameStarted,
      gameOver: state.gameOver,
      score: state.score,
      timestamp: Date.now()
    };

    window.parent.postMessage(message, '*');
  }, [isEmbedded]);

  // Broadcast ready message
  const broadcastReady = useCallback(() => {
    if (!isEmbedded || !window.parent) return;

    const message: GameReadyMessage = {
      type: 'GAME_READY',
      timestamp: Date.now(),
      embedded: isEmbedded
    };

    window.parent.postMessage(message, '*');
  }, [isEmbedded]);

  return { broadcastState, broadcastReady };
}
