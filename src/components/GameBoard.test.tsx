// Visual CSS-only improvements do not require tests per project requirements
// This is a placeholder test file for future rendering logic tests

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { GameBoard } from './GameBoard';
import type { GameState } from '../game/types';

describe('GameBoard', () => {
  it('should render without crashing', () => {
    const mockGameState = {
      snake: [{ x: 10, y: 10 }],
      food: { x: 15, y: 15 },
      direction: 'RIGHT' as const,
      gameStarted: false,
      gameOver: false,
      score: 0,
      foodEaten: 0,
      powerUp: null,
      activePowerUps: [],
      tickCount: 0,
      portalPair: null,
      lastPortalDespawn: 0,
      wormhole: null,
      lastWormholeDespawn: 0,
      phantom: { segments: [], direction: 'RIGHT' as const, active: false, stealCount: 0, moveTimer: 0, spawnCooldown: 0 },
      bonusFood: null,
      flagFood: null,
      cashItems: [],
      totalCash: 0,
      fakeFoods: [],
      police: { segments: [], direction: 'RIGHT' as const, active: false, moveTimer: 0, spawnCooldown: 0, caughtFlash: 0 },
      obstacles: [],
      lastObstacleSpawnFood: 0,
      growPending: 0,
      immortalActive: false,
      immortalProgress: 0,
      immortalCharges: 0,
      immortalRechargeProgress: 0,
      deathReason: null,
      currentRealm: 0,
      realmPortal: null,
      lastRealmTransitionFood: 0,
      rival: { segments: [], direction: 'RIGHT' as const, active: false, growPending: 0, moveTimer: 0, spawnCooldown: 0, foodEaten: 0 },
    } satisfies GameState;

    const { container } = render(<GameBoard gameState={mockGameState} gridSize={20} />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeTruthy();
  });
});
