import { describe, it, expect } from 'vitest';
import {
  createComboStreakState,
  triggerCombo,
  updateComboStreak,
  getCombo,
  isComboActive,
} from '../components/comboStreak';

describe('comboStreak', () => {
  describe('createComboStreakState', () => {
    it('creates initial state with zero combo', () => {
      const state = createComboStreakState();
      expect(state.combo).toBe(0);
      expect(state.rings).toEqual([]);
      expect(state.texts).toEqual([]);
      expect(state.flashIntensity).toBe(0);
      expect(state.shakeAmount).toBe(0);
    });
  });

  describe('triggerCombo', () => {
    it('sets combo to 1 on first eat', () => {
      const state = createComboStreakState();
      triggerCombo(state, 100, 100, 10);
      expect(state.combo).toBe(1);
    });

    it('increments combo when eating within window', () => {
      const state = createComboStreakState();
      triggerCombo(state, 100, 100, 10);
      triggerCombo(state, 120, 120, 100);
      expect(state.combo).toBe(2);
    });

    it('resets combo when eating outside window', () => {
      const state = createComboStreakState();
      triggerCombo(state, 100, 100, 10);
      triggerCombo(state, 120, 120, 10 + 301);
      expect(state.combo).toBe(1);
    });

    it('does not spawn visual effects for combo 1', () => {
      const state = createComboStreakState();
      triggerCombo(state, 100, 100, 10);
      expect(state.rings.length).toBe(0);
      expect(state.texts.length).toBe(0);
    });

    it('spawns rings and text for combo 2+', () => {
      const state = createComboStreakState();
      triggerCombo(state, 100, 100, 10);
      triggerCombo(state, 120, 120, 100);
      expect(state.rings.length).toBeGreaterThan(0);
      expect(state.texts.length).toBe(1);
    });

    it('increases ring count with higher combo', () => {
      const state = createComboStreakState();
      triggerCombo(state, 100, 100, 10);
      triggerCombo(state, 100, 100, 20);
      const ringsAt2 = state.rings.length;
      triggerCombo(state, 100, 100, 30);
      expect(state.rings.length).toBeGreaterThanOrEqual(ringsAt2);
    });

    it('builds combo labels progressively', () => {
      const state = createComboStreakState();
      triggerCombo(state, 100, 100, 10);
      triggerCombo(state, 100, 100, 20);
      expect(state.texts[0].text).toBe('2X');

      triggerCombo(state, 100, 100, 30);
      expect(state.texts[1].text).toBe('3X COMBO');

      for (let i = 4; i <= 5; i++) {
        triggerCombo(state, 100, 100, 30 + i * 10);
      }
      const lastText = state.texts[state.texts.length - 1];
      expect(lastText.text).toContain('FRENZY');
    });

    it('caps rings at max limit', () => {
      const state = createComboStreakState();
      for (let i = 0; i < 20; i++) {
        triggerCombo(state, 100, 100, i * 10);
      }
      expect(state.rings.length).toBeLessThanOrEqual(6);
    });

    it('caps texts at max limit', () => {
      const state = createComboStreakState();
      for (let i = 0; i < 20; i++) {
        triggerCombo(state, 100, 100, i * 10);
      }
      expect(state.texts.length).toBeLessThanOrEqual(3);
    });
  });

  describe('updateComboStreak', () => {
    it('decays flash intensity over time', () => {
      const state = createComboStreakState();
      triggerCombo(state, 100, 100, 10);
      triggerCombo(state, 100, 100, 20);
      const initialFlash = state.flashIntensity;
      for (let i = 0; i < 10; i++) updateComboStreak(state);
      expect(state.flashIntensity).toBeLessThan(initialFlash);
    });

    it('removes expired rings', () => {
      const state = createComboStreakState();
      triggerCombo(state, 100, 100, 10);
      triggerCombo(state, 100, 100, 20);
      for (let i = 0; i < 200; i++) updateComboStreak(state);
      expect(state.rings.length).toBe(0);
    });

    it('removes expired texts', () => {
      const state = createComboStreakState();
      triggerCombo(state, 100, 100, 10);
      triggerCombo(state, 100, 100, 20);
      for (let i = 0; i < 200; i++) updateComboStreak(state);
      expect(state.texts.length).toBe(0);
    });

    it('floats text upward', () => {
      const state = createComboStreakState();
      triggerCombo(state, 100, 100, 10);
      triggerCombo(state, 100, 100, 20);
      const initialY = state.texts[0].y;
      for (let i = 0; i < 5; i++) updateComboStreak(state);
      expect(state.texts[0].y).toBeLessThan(initialY);
    });
  });

  describe('getCombo', () => {
    it('returns current combo count', () => {
      const state = createComboStreakState();
      expect(getCombo(state)).toBe(0);
      triggerCombo(state, 100, 100, 10);
      expect(getCombo(state)).toBe(1);
      triggerCombo(state, 100, 100, 20);
      expect(getCombo(state)).toBe(2);
    });
  });

  describe('isComboActive', () => {
    it('returns false when no food eaten', () => {
      const state = createComboStreakState();
      expect(isComboActive(state, 10)).toBe(false);
    });

    it('returns false for single eat (combo 1)', () => {
      const state = createComboStreakState();
      triggerCombo(state, 100, 100, 10);
      expect(isComboActive(state, 15)).toBe(false);
    });

    it('returns true during active combo 2+', () => {
      const state = createComboStreakState();
      triggerCombo(state, 100, 100, 10);
      triggerCombo(state, 100, 100, 20);
      expect(isComboActive(state, 25)).toBe(true);
    });

    it('returns false after combo window expires', () => {
      const state = createComboStreakState();
      triggerCombo(state, 100, 100, 10);
      triggerCombo(state, 100, 100, 20);
      expect(isComboActive(state, 20 + 301)).toBe(false);
    });
  });
});
