import { describe, it, expect } from 'vitest';
import {
  createFlagLifeBarState,
  resetFlagLifeBar,
  damageFlagLifeBar,
  updateFlagLifeBar,
} from '../components/flagLifeBar';

describe('flagLifeBar', () => {
  it('creates state with full HP and active', () => {
    const state = createFlagLifeBarState();
    expect(state.currentHp).toBe(5);
    expect(state.maxHp).toBe(5);
    expect(state.active).toBe(true);
    expect(state.flagWavePhases).toHaveLength(5);
  });

  it('damages reduce HP by 1', () => {
    const state = createFlagLifeBarState();
    damageFlagLifeBar(state, 100, 100);
    expect(state.currentHp).toBe(4);
    expect(state.hitFlash).toBeGreaterThan(0);
    expect(state.burningFlags).toHaveLength(1);
    expect(state.fallingFlags).toHaveLength(1);
  });

  it('spawns burning flag at correct index on damage', () => {
    const state = createFlagLifeBarState();
    damageFlagLifeBar(state, 100, 100);
    expect(state.burningFlags[0].index).toBe(4);
    damageFlagLifeBar(state, 100, 100);
    expect(state.burningFlags[1].index).toBe(3);
  });

  it('returns true when last HP is depleted', () => {
    const state = createFlagLifeBarState();
    for (let i = 0; i < 4; i++) {
      const destroyed = damageFlagLifeBar(state, 100, 100);
      expect(destroyed).toBe(false);
    }
    const destroyed = damageFlagLifeBar(state, 100, 100);
    expect(destroyed).toBe(true);
    expect(state.currentHp).toBe(0);
    expect(state.breaking).toBe(true);
  });

  it('does not damage when inactive', () => {
    const state = createFlagLifeBarState();
    state.active = false;
    const result = damageFlagLifeBar(state, 100, 100);
    expect(result).toBe(false);
    expect(state.currentHp).toBe(5);
  });

  it('does not damage when breaking', () => {
    const state = createFlagLifeBarState();
    state.breaking = true;
    const result = damageFlagLifeBar(state, 100, 100);
    expect(result).toBe(false);
  });

  it('reset restores full HP', () => {
    const state = createFlagLifeBarState();
    damageFlagLifeBar(state, 100, 100);
    damageFlagLifeBar(state, 100, 100);
    resetFlagLifeBar(state);
    expect(state.currentHp).toBe(5);
    expect(state.active).toBe(true);
    expect(state.burningFlags).toHaveLength(0);
    expect(state.fallingFlags).toHaveLength(0);
  });

  it('update decays hitFlash and shakeOffset', () => {
    const state = createFlagLifeBarState();
    state.hitFlash = 1.0;
    state.shakeOffset = 6.0;
    updateFlagLifeBar(state);
    expect(state.hitFlash).toBeLessThan(1.0);
    expect(state.shakeOffset).toBeLessThan(6.0);
  });

  it('update advances flag wave phases', () => {
    const state = createFlagLifeBarState();
    const initialPhases = [...state.flagWavePhases];
    updateFlagLifeBar(state);
    for (let i = 0; i < state.flagWavePhases.length; i++) {
      expect(state.flagWavePhases[i]).toBeGreaterThan(initialPhases[i]);
    }
  });

  it('update progresses burning flags and cleans up', () => {
    const state = createFlagLifeBarState();
    damageFlagLifeBar(state, 100, 100);
    expect(state.burningFlags.length).toBeGreaterThan(0);
    for (let i = 0; i < 100; i++) {
      updateFlagLifeBar(state);
    }
    expect(state.burningFlags).toHaveLength(0);
  });

  it('update fades falling flags and removes them', () => {
    const state = createFlagLifeBarState();
    damageFlagLifeBar(state, 100, 100);
    expect(state.fallingFlags.length).toBeGreaterThan(0);
    for (let i = 0; i < 100; i++) {
      updateFlagLifeBar(state);
    }
    expect(state.fallingFlags).toHaveLength(0);
  });

  it('breaking completes and deactivates after enough updates', () => {
    const state = createFlagLifeBarState();
    for (let i = 0; i < 5; i++) {
      damageFlagLifeBar(state, 100, 100);
    }
    expect(state.breaking).toBe(true);
    for (let i = 0; i < 200; i++) {
      updateFlagLifeBar(state);
    }
    expect(state.breaking).toBe(false);
    expect(state.active).toBe(false);
  });
});
