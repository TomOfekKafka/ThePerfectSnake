import { describe, it, expect, beforeEach } from 'vitest';
import {
  createHorrorEffectsState,
  initVeins,
  initTendrils,
  updateTendrils,
  updateGlitch,
  spawnIchorDrip,
  updateIchorDrips,
  generateVeinBranches,
  computeTendrilPoints,
  HorrorEffectsState,
} from '../components/horrorEffects';

describe('horrorEffects', () => {
  let state: HorrorEffectsState;

  beforeEach(() => {
    state = createHorrorEffectsState();
  });

  describe('createHorrorEffectsState', () => {
    it('creates empty state with default values', () => {
      expect(state.veins).toEqual([]);
      expect(state.tendrils).toEqual([]);
      expect(state.ichorDrips).toEqual([]);
      expect(state.glitchTimer).toBe(0);
      expect(state.glitchActive).toBe(false);
      expect(state.glitchIntensity).toBe(0);
    });
  });

  describe('initVeins', () => {
    it('creates veins from edges of the board', () => {
      initVeins(state, 400, 400);
      expect(state.veins.length).toBe(12);
      for (const vein of state.veins) {
        expect(vein.thickness).toBeGreaterThan(0);
        expect(vein.branches.length).toBeGreaterThan(0);
        expect(typeof vein.pulseOffset).toBe('number');
      }
    });
  });

  describe('generateVeinBranches', () => {
    it('generates 1-2 branches from a vein segment', () => {
      const branches = generateVeinBranches(0, 0, 100, 100, 2);
      expect(branches.length).toBeGreaterThanOrEqual(1);
      expect(branches.length).toBeLessThanOrEqual(2);
      for (const branch of branches) {
        expect(branch.thickness).toBe(1);
        expect(typeof branch.x1).toBe('number');
        expect(typeof branch.y1).toBe('number');
      }
    });
  });

  describe('initTendrils', () => {
    it('creates tendrils from all four edges', () => {
      initTendrils(state, 400, 400);
      expect(state.tendrils.length).toBe(8);
      const edges = state.tendrils.map(t => t.edge);
      expect(edges.filter(e => e === 'top').length).toBe(2);
      expect(edges.filter(e => e === 'bottom').length).toBe(2);
      expect(edges.filter(e => e === 'left').length).toBe(2);
      expect(edges.filter(e => e === 'right').length).toBe(2);
    });

    it('initializes tendrils with zero length', () => {
      initTendrils(state, 400, 400);
      for (const tendril of state.tendrils) {
        expect(tendril.length).toBe(0);
        expect(tendril.maxLength).toBeGreaterThan(40);
      }
    });
  });

  describe('updateTendrils', () => {
    it('grows tendrils toward their max length over time', () => {
      initTendrils(state, 400, 400);
      const initialLengths = state.tendrils.map(t => t.length);
      for (let i = 0; i < 100; i++) {
        updateTendrils(state, i);
      }
      for (let i = 0; i < state.tendrils.length; i++) {
        expect(state.tendrils[i].length).toBeGreaterThan(initialLengths[i]);
      }
    });

    it('advances wobble phase each update', () => {
      initTendrils(state, 400, 400);
      const initialPhases = state.tendrils.map(t => t.wobblePhase);
      updateTendrils(state, 0);
      for (let i = 0; i < state.tendrils.length; i++) {
        expect(state.tendrils[i].wobblePhase).toBeGreaterThan(initialPhases[i]);
      }
    });
  });

  describe('computeTendrilPoints', () => {
    it('returns correct number of points for a tendril', () => {
      initTendrils(state, 400, 400);
      state.tendrils[0].length = 50;
      const points = computeTendrilPoints(state.tendrils[0]);
      expect(points.length).toBe(state.tendrils[0].segments + 1);
    });

    it('starts from the tendril base position', () => {
      initTendrils(state, 400, 400);
      state.tendrils[0].length = 50;
      const points = computeTendrilPoints(state.tendrils[0]);
      expect(points[0].x).toBeCloseTo(state.tendrils[0].baseX, 0);
      expect(points[0].y).toBeCloseTo(state.tendrils[0].baseY, 0);
    });
  });

  describe('updateGlitch', () => {
    it('increments glitch timer', () => {
      updateGlitch(state);
      expect(state.glitchTimer).toBe(1);
    });

    it('fades glitch intensity when active', () => {
      state.glitchActive = true;
      state.glitchIntensity = 0.5;
      updateGlitch(state);
      expect(state.glitchIntensity).toBeLessThan(0.5);
    });

    it('deactivates glitch when intensity drops below threshold', () => {
      state.glitchActive = true;
      state.glitchIntensity = 0.01;
      updateGlitch(state);
      expect(state.glitchActive).toBe(false);
      expect(state.glitchIntensity).toBe(0);
    });
  });

  describe('spawnIchorDrip', () => {
    it('adds an ichor drip at the specified position', () => {
      spawnIchorDrip(state, 100, 200);
      expect(state.ichorDrips.length).toBe(1);
      expect(state.ichorDrips[0].alpha).toBeGreaterThan(0);
      expect(state.ichorDrips[0].size).toBeGreaterThan(0);
    });

    it('removes oldest drip when at max capacity', () => {
      for (let i = 0; i < 30; i++) {
        spawnIchorDrip(state, i * 10, 100);
      }
      expect(state.ichorDrips.length).toBe(30);
      spawnIchorDrip(state, 500, 500);
      expect(state.ichorDrips.length).toBe(30);
    });
  });

  describe('updateIchorDrips', () => {
    it('fades drips over time', () => {
      spawnIchorDrip(state, 100, 100);
      const initialAlpha = state.ichorDrips[0].alpha;
      updateIchorDrips(state);
      expect(state.ichorDrips[0].alpha).toBeLessThan(initialAlpha);
    });

    it('removes drips when alpha reaches zero', () => {
      spawnIchorDrip(state, 100, 100);
      state.ichorDrips[0].alpha = 0.001;
      updateIchorDrips(state);
      expect(state.ichorDrips.length).toBe(0);
    });

    it('increments age of drips', () => {
      spawnIchorDrip(state, 100, 100);
      updateIchorDrips(state);
      expect(state.ichorDrips[0].age).toBe(1);
    });
  });
});
