// Message types for platform <-> game communication via postMessage

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

// Platform → Game messages
export interface DirectionCommand {
  type: 'DIRECTION_CHANGE';
  direction: Direction;
  timestamp: number;
}

export interface GameControlCommand {
  type: 'START_GAME' | 'RESET_GAME';
  timestamp: number;
}

export type PlatformMessage = DirectionCommand | GameControlCommand;

// Game → Platform messages
export interface GameStateUpdate {
  type: 'GAME_STATE';
  gameStarted: boolean;
  gameOver: boolean;
  score: number;
  timestamp: number;
}

export interface GameReadyMessage {
  type: 'GAME_READY';
  timestamp: number;
}

export type GameMessage = GameStateUpdate | GameReadyMessage;
