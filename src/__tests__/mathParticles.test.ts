import { describe, it, expect } from 'vitest';
import {
  createMathParticlesState,
  createMathSymbol,
  initMathSymbols,
  initMathWaves,
  updateMathSymbols,
  updateMathWaves,
  updateScoreBursts,
  spawnScoreBurst,
  symbolTypeCount,
} from '../components/mathParticles';

describe('mathParticles', () => {
  describe('createMathParticlesState', () => {
    it('creates empty state', () => {
      const state = createMathParticlesState();
      expect(state.symbols).toEqual([]);
      expect(state.scoreBursts).toEqual([]);
      expect(state.waves).toEqual([]);
      expect(state.frameCount).toBe(0);
    });
  });

  describe('createMathSymbol', () => {
    it('creates a symbol within bounds', () => {
      const sym = createMathSymbol(400, 400);
      expect(sym.x).toBeGreaterThanOrEqual(0);
      expect(sym.x).toBeLessThanOrEqual(400);
      expect(sym.y).toBeGreaterThanOrEqual(0);
      expect(sym.y).toBeLessThanOrEqual(400);
      expect(sym.size).toBeGreaterThan(0);
      expect(sym.alpha).toBeGreaterThan(0);
    });

    it('assigns a valid symbol type', () => {
      const sym = createMathSymbol(400, 400);
      expect(sym.symbolType).toBeGreaterThanOrEqual(0);
      expect(sym.symbolType).toBeLessThan(symbolTypeCount());
    });
  });

  describe('initMathSymbols', () => {
    it('populates symbols array', () => {
      const state = createMathParticlesState();
      initMathSymbols(state, 400, 400);
      expect(state.symbols.length).toBe(15);
    });

    it('creates symbols with varying properties', () => {
      const state = createMathParticlesState();
      initMathSymbols(state, 400, 400);
      const types = new Set(state.symbols.map((s) => s.symbolType));
      expect(types.size).toBeGreaterThan(1);
    });
  });

  describe('initMathWaves', () => {
    it('creates wave entries', () => {
      const state = createMathParticlesState();
      initMathWaves(state, 400);
      expect(state.waves.length).toBe(3);
    });

    it('assigns different y offsets to each wave', () => {
      const state = createMathParticlesState();
      initMathWaves(state, 400);
      const offsets = state.waves.map((w) => w.yOffset);
      const unique = new Set(offsets);
      expect(unique.size).toBe(3);
    });
  });

  describe('updateMathSymbols', () => {
    it('moves symbols by their velocity', () => {
      const state = createMathParticlesState();
      initMathSymbols(state, 400, 400);
      const initialX = state.symbols[0].x;
      const vx = state.symbols[0].vx;
      updateMathSymbols(state, 400, 400);
      expect(state.symbols[0].x).toBeCloseTo(initialX + vx, 5);
    });

    it('wraps symbols around edges', () => {
      const state = createMathParticlesState();
      initMathSymbols(state, 400, 400);
      state.symbols[0].x = 421;
      state.symbols[0].vx = 1;
      updateMathSymbols(state, 400, 400);
      expect(state.symbols[0].x).toBe(-20);
    });

    it('updates rotation', () => {
      const state = createMathParticlesState();
      initMathSymbols(state, 400, 400);
      const initialRot = state.symbols[0].rotation;
      const speed = state.symbols[0].rotationSpeed;
      updateMathSymbols(state, 400, 400);
      expect(state.symbols[0].rotation).toBeCloseTo(initialRot + speed, 5);
    });
  });

  describe('updateMathWaves', () => {
    it('advances wave phase', () => {
      const state = createMathParticlesState();
      initMathWaves(state, 400);
      const initialPhase = state.waves[0].phase;
      updateMathWaves(state);
      expect(state.waves[0].phase).toBeCloseTo(initialPhase + 0.02, 5);
    });
  });

  describe('scoreBursts', () => {
    it('spawns a score burst', () => {
      const state = createMathParticlesState();
      spawnScoreBurst(state, 100, 100, 10);
      expect(state.scoreBursts.length).toBe(1);
      expect(state.scoreBursts[0].value).toBe(10);
      expect(state.scoreBursts[0].x).toBe(100);
    });

    it('updates burst age and alpha', () => {
      const state = createMathParticlesState();
      spawnScoreBurst(state, 100, 100, 10);
      updateScoreBursts(state);
      expect(state.scoreBursts[0].age).toBe(1);
      expect(state.scoreBursts[0].alpha).toBeLessThan(1);
    });

    it('moves burst upward', () => {
      const state = createMathParticlesState();
      spawnScoreBurst(state, 100, 100, 10);
      updateScoreBursts(state);
      expect(state.scoreBursts[0].y).toBeLessThan(100);
    });

    it('removes expired bursts', () => {
      const state = createMathParticlesState();
      spawnScoreBurst(state, 100, 100, 10);
      state.scoreBursts[0].age = 60;
      updateScoreBursts(state);
      expect(state.scoreBursts.length).toBe(0);
    });
  });

  describe('symbolTypeCount', () => {
    it('returns the number of symbol types', () => {
      expect(symbolTypeCount()).toBe(8);
    });
  });
});
