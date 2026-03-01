import { describe, it, expect } from 'vitest';
import {
  spawnSnowballEdge,
  updateSnowballs,
  createCleanEffectsState,
} from '../components/cleanEffects';

describe('spawnSnowballEdge', () => {
  it('creates a snowball with valid properties', () => {
    const ball = spawnSnowballEdge(400, 400);
    expect(ball.size).toBeGreaterThanOrEqual(4);
    expect(ball.size).toBeLessThanOrEqual(7);
    expect(ball.alpha).toBeGreaterThanOrEqual(0.7);
    expect(ball.alpha).toBeLessThanOrEqual(1.0);
    expect(ball.trail).toEqual([]);
    expect(ball.rotation).toBeGreaterThanOrEqual(0);
    expect(ball.rotation).toBeLessThan(Math.PI * 2);
  });

  it('spawns outside the visible area', () => {
    for (let i = 0; i < 50; i++) {
      const ball = spawnSnowballEdge(400, 400);
      const outsideX = ball.x < 0 || ball.x > 400;
      const outsideY = ball.y < 0 || ball.y > 400;
      expect(outsideX || outsideY).toBe(true);
    }
  });

  it('has velocity pointing inward', () => {
    for (let i = 0; i < 100; i++) {
      const ball = spawnSnowballEdge(400, 400);
      if (ball.x < 0) expect(ball.vx).toBeGreaterThan(0);
      if (ball.x > 400) expect(ball.vx).toBeLessThan(0);
      if (ball.y < 0) expect(ball.vy).toBeGreaterThan(0);
      if (ball.y > 400) expect(ball.vy).toBeLessThan(0);
    }
  });
});

describe('updateSnowballs', () => {
  it('moves snowballs by their velocity', () => {
    const state = createCleanEffectsState();
    state.snowballs.push(spawnSnowballEdge(400, 400));
    const startX = state.snowballs[0].x;
    const startY = state.snowballs[0].y;
    const vx = state.snowballs[0].vx;
    const vy = state.snowballs[0].vy;

    updateSnowballs(state, 400, 400);

    expect(state.snowballs[0].x).toBeCloseTo(startX + vx, 5);
    expect(state.snowballs[0].y).toBeCloseTo(startY + vy, 5);
  });

  it('builds a trail behind each snowball', () => {
    const state = createCleanEffectsState();
    state.snowballs.push({
      x: 200, y: 200, vx: 1, vy: 0,
      size: 5, alpha: 1, rotation: 0, rotationSpeed: 0.1, trail: [],
    });

    updateSnowballs(state, 400, 400);
    expect(state.snowballs[0].trail.length).toBe(1);

    updateSnowballs(state, 400, 400);
    expect(state.snowballs[0].trail.length).toBe(2);
  });

  it('limits trail length', () => {
    const state = createCleanEffectsState();
    state.snowballs.push({
      x: 200, y: 200, vx: 1, vy: 0,
      size: 5, alpha: 1, rotation: 0, rotationSpeed: 0.1, trail: [],
    });

    for (let i = 0; i < 20; i++) {
      updateSnowballs(state, 400, 400);
    }
    expect(state.snowballs[0].trail.length).toBeLessThanOrEqual(8);
  });

  it('removes snowballs that leave the screen', () => {
    const state = createCleanEffectsState();
    state.snowballs.push({
      x: -50, y: 200, vx: -1, vy: 0,
      size: 5, alpha: 1, rotation: 0, rotationSpeed: 0.1, trail: [],
    });

    updateSnowballs(state, 400, 400);
    expect(state.snowballs.length).toBe(0);
  });

  it('does not exceed max snowball count', () => {
    const state = createCleanEffectsState();
    for (let i = 0; i < 3; i++) {
      state.snowballs.push({
        x: 200, y: 200, vx: 0.5, vy: 0,
        size: 5, alpha: 1, rotation: 0, rotationSpeed: 0.1, trail: [],
      });
    }

    for (let i = 0; i < 100; i++) {
      updateSnowballs(state, 400, 400);
    }
    expect(state.snowballs.length).toBeLessThanOrEqual(3);
  });

  it('rotates snowballs over time', () => {
    const state = createCleanEffectsState();
    state.snowballs.push({
      x: 200, y: 200, vx: 1, vy: 0,
      size: 5, alpha: 1, rotation: 0, rotationSpeed: 0.1, trail: [],
    });

    const initialRotation = state.snowballs[0].rotation;
    updateSnowballs(state, 400, 400);
    expect(state.snowballs[0].rotation).not.toEqual(initialRotation);
  });
});
