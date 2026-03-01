import { describe, it, expect } from 'vitest';
import {
  createOlympicsState,
  initOlympicRings,
  initTorch,
  updateOlympics,
  spawnMedalBurst,
} from '../components/olympicsEffects';

describe('olympicsEffects', () => {
  describe('createOlympicsState', () => {
    it('creates empty initial state', () => {
      const state = createOlympicsState();
      expect(state.rings).toEqual([]);
      expect(state.medals).toEqual([]);
      expect(state.frameCount).toBe(0);
      expect(state.torch.particles).toEqual([]);
    });
  });

  describe('initOlympicRings', () => {
    it('creates 5 Olympic rings', () => {
      const state = createOlympicsState();
      initOlympicRings(state, 400, 400);
      expect(state.rings.length).toBe(5);
    });

    it('alternates ring y positions (top/bottom pattern)', () => {
      const state = createOlympicsState();
      initOlympicRings(state, 400, 400);
      expect(state.rings[0].cy).toBeLessThan(state.rings[1].cy);
      expect(state.rings[2].cy).toBeLessThan(state.rings[1].cy);
      expect(state.rings[0].cy).toBeCloseTo(state.rings[2].cy, 1);
    });

    it('assigns distinct colors to each ring', () => {
      const state = createOlympicsState();
      initOlympicRings(state, 400, 400);
      const colors = state.rings.map(r => r.color);
      const unique = new Set(colors);
      expect(unique.size).toBe(5);
    });

    it('positions rings within the width', () => {
      const state = createOlympicsState();
      initOlympicRings(state, 400, 400);
      for (const ring of state.rings) {
        expect(ring.cx).toBeGreaterThan(0);
        expect(ring.cx).toBeLessThan(400);
      }
    });
  });

  describe('initTorch', () => {
    it('positions torch near right side', () => {
      const state = createOlympicsState();
      initTorch(state, 400, 400);
      expect(state.torch.x).toBeGreaterThan(300);
      expect(state.torch.y).toBeGreaterThan(0);
    });
  });

  describe('updateOlympics', () => {
    it('increments frame count', () => {
      const state = createOlympicsState();
      initOlympicRings(state, 400, 400);
      initTorch(state, 400, 400);
      updateOlympics(state, 400);
      expect(state.frameCount).toBe(1);
    });

    it('spawns torch flame particles', () => {
      const state = createOlympicsState();
      initOlympicRings(state, 400, 400);
      initTorch(state, 400, 400);
      for (let i = 0; i < 5; i++) {
        updateOlympics(state, 400);
      }
      expect(state.torch.particles.length).toBeGreaterThan(0);
    });

    it('advances track lane phase', () => {
      const state = createOlympicsState();
      initOlympicRings(state, 400, 400);
      initTorch(state, 400, 400);
      updateOlympics(state, 400);
      expect(state.trackLanePhase).toBeGreaterThan(0);
    });
  });

  describe('spawnMedalBurst', () => {
    it('adds a medal burst', () => {
      const state = createOlympicsState();
      spawnMedalBurst(state, 100, 100, 0);
      expect(state.medals.length).toBe(1);
    });

    it('cycles through bronze, silver, gold', () => {
      const state = createOlympicsState();
      spawnMedalBurst(state, 100, 100, 0);
      expect(state.medals[0].type).toBe('bronze');
      spawnMedalBurst(state, 100, 100, 1);
      expect(state.medals[1].type).toBe('silver');
      spawnMedalBurst(state, 100, 100, 2);
      expect(state.medals[2].type).toBe('gold');
    });

    it('creates sparkle particles', () => {
      const state = createOlympicsState();
      spawnMedalBurst(state, 100, 100, 0);
      expect(state.medals[0].sparkles.length).toBe(8);
    });

    it('limits max medals', () => {
      const state = createOlympicsState();
      for (let i = 0; i < 10; i++) {
        spawnMedalBurst(state, 100, 100, i);
      }
      expect(state.medals.length).toBeLessThanOrEqual(5);
    });

    it('removes expired medals after updates', () => {
      const state = createOlympicsState();
      initOlympicRings(state, 400, 400);
      initTorch(state, 400, 400);
      spawnMedalBurst(state, 100, 100, 0);
      for (let i = 0; i < 100; i++) {
        updateOlympics(state, 400);
      }
      expect(state.medals.length).toBe(0);
    });
  });
});
