import { describe, it, expect } from 'vitest';
import {
  createFoodOrbit,
  initFoodOrbits,
  updateFoodOrbits,
  createCleanEffectsState,
} from '../components/cleanEffects';

describe('createFoodOrbit', () => {
  it('distributes angles evenly around the circle', () => {
    const orbit0 = createFoodOrbit(0);
    const orbit3 = createFoodOrbit(3);
    expect(orbit0.angle).toBeCloseTo(0, 5);
    expect(orbit3.angle).toBeCloseTo(Math.PI, 1);
  });

  it('alternates orbit direction via speed sign', () => {
    const even = createFoodOrbit(0);
    const odd = createFoodOrbit(1);
    expect(even.speed).toBeGreaterThan(0);
    expect(odd.speed).toBeLessThan(0);
  });

  it('assigns varying distances', () => {
    const orbit0 = createFoodOrbit(0);
    const orbit1 = createFoodOrbit(1);
    expect(orbit0.distance).not.toEqual(orbit1.distance);
  });

  it('assigns varying sizes', () => {
    const sizes = [0, 1, 2].map(i => createFoodOrbit(i).size);
    const unique = new Set(sizes);
    expect(unique.size).toBeGreaterThan(1);
  });
});

describe('initFoodOrbits', () => {
  it('creates exactly 6 orbits', () => {
    const state = createCleanEffectsState();
    initFoodOrbits(state);
    expect(state.foodOrbits).toHaveLength(6);
  });

  it('each orbit has required properties', () => {
    const state = createCleanEffectsState();
    initFoodOrbits(state);
    for (const orbit of state.foodOrbits) {
      expect(orbit).toHaveProperty('angle');
      expect(orbit).toHaveProperty('distance');
      expect(orbit).toHaveProperty('speed');
      expect(orbit).toHaveProperty('size');
      expect(orbit).toHaveProperty('pulsePhase');
      expect(orbit).toHaveProperty('color');
    }
  });
});

describe('updateFoodOrbits', () => {
  it('advances orbit angles over time', () => {
    const state = createCleanEffectsState();
    initFoodOrbits(state);
    const initialAngles = state.foodOrbits.map(o => o.angle);
    updateFoodOrbits(state);
    for (let i = 0; i < state.foodOrbits.length; i++) {
      expect(state.foodOrbits[i].angle).not.toEqual(initialAngles[i]);
    }
  });

  it('advances pulse phases over time', () => {
    const state = createCleanEffectsState();
    initFoodOrbits(state);
    const initialPhases = state.foodOrbits.map(o => o.pulsePhase);
    updateFoodOrbits(state);
    for (let i = 0; i < state.foodOrbits.length; i++) {
      expect(state.foodOrbits[i].pulsePhase).toBeGreaterThan(initialPhases[i]);
    }
  });

  it('moves counter-clockwise orbits in opposite direction', () => {
    const state = createCleanEffectsState();
    initFoodOrbits(state);
    const ccwOrbit = state.foodOrbits.find(o => o.speed < 0)!;
    const initialAngle = ccwOrbit.angle;
    updateFoodOrbits(state);
    expect(ccwOrbit.angle).toBeLessThan(initialAngle);
  });
});
