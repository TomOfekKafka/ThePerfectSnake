import { describe, it, expect } from 'vitest';
import {
  createNuclearBlastState,
  spawnNuclearBlast,
  updateNuclearBlasts,
} from '../components/nuclearBlast';

describe('nuclearBlast', () => {
  describe('createNuclearBlastState', () => {
    it('creates empty state', () => {
      const state = createNuclearBlastState();
      expect(state.blasts).toEqual([]);
      expect(state.falloutPool).toEqual([]);
    });
  });

  describe('spawnNuclearBlast', () => {
    it('adds a blast at the given position', () => {
      const state = createNuclearBlastState();
      spawnNuclearBlast(state, 100, 200);
      expect(state.blasts.length).toBe(1);
      const blast = state.blasts[0];
      expect(blast.fireball.x).toBe(100);
      expect(blast.fireball.y).toBe(200);
      expect(blast.fireball.life).toBe(1);
      expect(blast.fireball.radius).toBe(3);
    });

    it('creates mushroom cloud at blast position', () => {
      const state = createNuclearBlastState();
      spawnNuclearBlast(state, 50, 80);
      const mc = state.blasts[0].mushroom;
      expect(mc.x).toBe(50);
      expect(mc.y).toBe(80);
      expect(mc.life).toBe(1);
      expect(mc.stemHeight).toBe(0);
      expect(mc.capRadius).toBe(0);
    });

    it('creates blast rings', () => {
      const state = createNuclearBlastState();
      spawnNuclearBlast(state, 100, 100);
      expect(state.blasts[0].rings.length).toBe(2);
      for (const ring of state.blasts[0].rings) {
        expect(ring.life).toBe(1);
        expect(ring.radius).toBeGreaterThan(0);
      }
    });

    it('creates heat lines radiating outward', () => {
      const state = createNuclearBlastState();
      spawnNuclearBlast(state, 100, 100);
      expect(state.blasts[0].heatLines.length).toBe(8);
      for (const hl of state.blasts[0].heatLines) {
        expect(hl.length).toBe(0);
        expect(hl.life).toBe(1);
        expect(hl.speed).toBeGreaterThan(0);
      }
    });

    it('sets initial flash alpha', () => {
      const state = createNuclearBlastState();
      spawnNuclearBlast(state, 100, 100);
      expect(state.blasts[0].flashAlpha).toBe(0.6);
    });

    it('caps blasts at max limit', () => {
      const state = createNuclearBlastState();
      spawnNuclearBlast(state, 10, 10);
      spawnNuclearBlast(state, 20, 20);
      spawnNuclearBlast(state, 30, 30);
      expect(state.blasts.length).toBeLessThanOrEqual(2);
    });

    it('moves overflow fallout to pool when capping', () => {
      const state = createNuclearBlastState();
      spawnNuclearBlast(state, 10, 10);
      state.blasts[0].fallout.push({
        x: 10, y: 10, vx: 1, vy: -1, size: 2, life: 0.5, hue: 20,
      });
      spawnNuclearBlast(state, 20, 20);
      spawnNuclearBlast(state, 30, 30);
      expect(state.falloutPool.length).toBeGreaterThan(0);
    });
  });

  describe('updateNuclearBlasts', () => {
    it('expands fireball radius over updates', () => {
      const state = createNuclearBlastState();
      spawnNuclearBlast(state, 100, 100);
      const initialRadius = state.blasts[0].fireball.radius;
      updateNuclearBlasts(state);
      expect(state.blasts[0].fireball.radius).toBeGreaterThan(initialRadius);
    });

    it('grows mushroom cloud stem over updates', () => {
      const state = createNuclearBlastState();
      spawnNuclearBlast(state, 100, 100);
      updateNuclearBlasts(state);
      expect(state.blasts[0].mushroom.stemHeight).toBeGreaterThan(0);
    });

    it('expands blast rings', () => {
      const state = createNuclearBlastState();
      spawnNuclearBlast(state, 100, 100);
      const initialRadius = state.blasts[0].rings[0].radius;
      updateNuclearBlasts(state);
      expect(state.blasts[0].rings[0].radius).toBeGreaterThan(initialRadius);
    });

    it('decays fireball life', () => {
      const state = createNuclearBlastState();
      spawnNuclearBlast(state, 100, 100);
      updateNuclearBlasts(state);
      expect(state.blasts[0].fireball.life).toBeLessThan(1);
    });

    it('decays flash alpha', () => {
      const state = createNuclearBlastState();
      spawnNuclearBlast(state, 100, 100);
      updateNuclearBlasts(state);
      expect(state.blasts[0].flashAlpha).toBeLessThan(0.6);
    });

    it('spawns fallout particles during fireball phase', () => {
      const state = createNuclearBlastState();
      spawnNuclearBlast(state, 100, 100);
      for (let i = 0; i < 5; i++) {
        updateNuclearBlasts(state);
      }
      expect(state.blasts[0].fallout.length).toBeGreaterThan(0);
    });

    it('extends heat lines over updates', () => {
      const state = createNuclearBlastState();
      spawnNuclearBlast(state, 100, 100);
      updateNuclearBlasts(state);
      expect(state.blasts[0].heatLines[0].length).toBeGreaterThan(0);
    });

    it('removes fully decayed blasts', () => {
      const state = createNuclearBlastState();
      spawnNuclearBlast(state, 100, 100);
      for (let i = 0; i < 200; i++) {
        updateNuclearBlasts(state);
      }
      expect(state.blasts.length).toBe(0);
    });

    it('updates fallout pool particles', () => {
      const state = createNuclearBlastState();
      state.falloutPool.push({
        x: 100, y: 100, vx: 1, vy: -1, size: 2, life: 0.5, hue: 20,
      });
      const initialY = state.falloutPool[0].y;
      updateNuclearBlasts(state);
      expect(state.falloutPool[0].y).not.toBe(initialY);
    });

    it('removes dead fallout pool particles', () => {
      const state = createNuclearBlastState();
      state.falloutPool.push({
        x: 100, y: 100, vx: 1, vy: -1, size: 2, life: 0.01, hue: 20,
      });
      updateNuclearBlasts(state);
      expect(state.falloutPool.length).toBe(0);
    });
  });
});
