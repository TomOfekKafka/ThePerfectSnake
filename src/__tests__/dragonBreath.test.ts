import { describe, it, expect } from 'vitest';
import {
  createDragonBreathState,
  spawnBreathEmber,
  updateDragonBreath,
} from '../components/dragonBreath';

describe('dragonBreath', () => {
  describe('createDragonBreathState', () => {
    it('creates empty state', () => {
      const state = createDragonBreathState();
      expect(state.embers).toEqual([]);
      expect(state.lastHeadX).toBe(-1);
      expect(state.lastHeadY).toBe(-1);
      expect(state.headMoving).toBe(false);
    });
  });

  describe('spawnBreathEmber', () => {
    it('adds an ember to the state', () => {
      const state = createDragonBreathState();
      spawnBreathEmber(state, 100, 100, 1, 0);
      expect(state.embers.length).toBe(1);
      const e = state.embers[0];
      expect(e.life).toBeGreaterThan(0);
      expect(e.maxLife).toBeGreaterThan(0);
      expect(e.size).toBeGreaterThan(0);
      expect(e.hue).toBeGreaterThanOrEqual(10);
      expect(e.hue).toBeLessThanOrEqual(45);
    });

    it('caps embers at max limit', () => {
      const state = createDragonBreathState();
      for (let i = 0; i < 40; i++) {
        spawnBreathEmber(state, 100, 100, 1, 0);
      }
      expect(state.embers.length).toBeLessThanOrEqual(35);
    });
  });

  describe('updateDragonBreath', () => {
    it('spawns embers when head moves', () => {
      const state = createDragonBreathState();
      updateDragonBreath(state, 100, 100, 1, 0);
      expect(state.headMoving).toBe(true);
      expect(state.embers.length).toBeGreaterThan(0);
    });

    it('does not spawn embers when head stays still', () => {
      const state = createDragonBreathState();
      state.lastHeadX = 100;
      state.lastHeadY = 100;
      updateDragonBreath(state, 100, 100, 1, 0);
      expect(state.headMoving).toBe(false);
      expect(state.embers.length).toBe(0);
    });

    it('decays ember life over updates', () => {
      const state = createDragonBreathState();
      updateDragonBreath(state, 100, 100, 1, 0);
      const initialLife = state.embers[0].life;
      state.lastHeadX = 100;
      state.lastHeadY = 100;
      updateDragonBreath(state, 100, 100, 1, 0);
      expect(state.embers[0].life).toBeLessThan(initialLife);
    });

    it('removes dead embers', () => {
      const state = createDragonBreathState();
      spawnBreathEmber(state, 100, 100, 1, 0);
      state.embers[0].life = 0.01;
      state.embers[0].size = 0.2;
      state.lastHeadX = 100;
      state.lastHeadY = 100;
      updateDragonBreath(state, 100, 100, 1, 0);
      expect(state.embers.length).toBe(0);
    });
  });
});
