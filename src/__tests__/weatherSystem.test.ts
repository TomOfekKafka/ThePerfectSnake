import { describe, it, expect } from 'vitest';
import {
  getWeatherForProgress,
  createWeatherState,
  updateWeather,
  initAuroraWaves,
} from '../components/weatherSystem';

describe('weatherSystem', () => {
  describe('getWeatherForProgress', () => {
    it('returns clear for 0 food eaten', () => {
      expect(getWeatherForProgress(0)).toBe('clear');
    });

    it('returns clear for 1-2 food eaten', () => {
      expect(getWeatherForProgress(1)).toBe('clear');
      expect(getWeatherForProgress(2)).toBe('clear');
    });

    it('returns rain for 3-6 food eaten', () => {
      expect(getWeatherForProgress(3)).toBe('rain');
      expect(getWeatherForProgress(5)).toBe('rain');
      expect(getWeatherForProgress(6)).toBe('rain');
    });

    it('returns storm for 7-11 food eaten', () => {
      expect(getWeatherForProgress(7)).toBe('storm');
      expect(getWeatherForProgress(10)).toBe('storm');
      expect(getWeatherForProgress(11)).toBe('storm');
    });

    it('returns snow for 12-17 food eaten', () => {
      expect(getWeatherForProgress(12)).toBe('snow');
      expect(getWeatherForProgress(15)).toBe('snow');
      expect(getWeatherForProgress(17)).toBe('snow');
    });

    it('returns sandstorm for 18-24 food eaten', () => {
      expect(getWeatherForProgress(18)).toBe('sandstorm');
      expect(getWeatherForProgress(22)).toBe('sandstorm');
      expect(getWeatherForProgress(24)).toBe('sandstorm');
    });

    it('returns aurora for 25+ food eaten', () => {
      expect(getWeatherForProgress(25)).toBe('aurora');
      expect(getWeatherForProgress(50)).toBe('aurora');
      expect(getWeatherForProgress(100)).toBe('aurora');
    });
  });

  describe('createWeatherState', () => {
    it('creates initial state with clear weather', () => {
      const state = createWeatherState();
      expect(state.currentWeather).toBe('clear');
      expect(state.transitionProgress).toBe(0);
      expect(state.rainDrops).toEqual([]);
      expect(state.lightning).toEqual([]);
      expect(state.weatherSnow).toEqual([]);
      expect(state.sandParticles).toEqual([]);
      expect(state.auroraWaves).toEqual([]);
      expect(state.overlayAlpha).toBe(0);
    });
  });

  describe('updateWeather', () => {
    it('transitions from clear to rain when food threshold reached', () => {
      const state = createWeatherState();
      for (let i = 0; i < 60; i++) {
        updateWeather(state, 5, 400, 400, i);
      }
      expect(state.currentWeather).toBe('rain');
    });

    it('spawns rain drops in rain weather', () => {
      const state = createWeatherState();
      state.currentWeather = 'rain';
      for (let i = 0; i < 10; i++) {
        updateWeather(state, 5, 400, 400, i);
      }
      expect(state.rainDrops.length).toBeGreaterThan(0);
    });

    it('spawns snow particles in snow weather', () => {
      const state = createWeatherState();
      state.currentWeather = 'snow';
      for (let i = 0; i < 10; i++) {
        updateWeather(state, 15, 400, 400, i);
      }
      expect(state.weatherSnow.length).toBeGreaterThan(0);
    });

    it('spawns sand particles in sandstorm weather', () => {
      const state = createWeatherState();
      state.currentWeather = 'sandstorm';
      for (let i = 0; i < 10; i++) {
        updateWeather(state, 20, 400, 400, i);
      }
      expect(state.sandParticles.length).toBeGreaterThan(0);
    });

    it('clears rain when transitioning to snow', () => {
      const state = createWeatherState();
      state.currentWeather = 'snow';
      state.rainDrops = [{ x: 0, y: 0, speed: 1, length: 5, alpha: 1, windOffset: 0 }];
      updateWeather(state, 15, 400, 400, 0);
      expect(state.rainDrops.length).toBe(0);
    });

    it('updates wind strength based on frame count', () => {
      const state = createWeatherState();
      updateWeather(state, 0, 400, 400, 0);
      const wind0 = state.windStrength;
      updateWeather(state, 0, 400, 400, 300);
      expect(state.windStrength).not.toBe(wind0);
    });
  });

  describe('initAuroraWaves', () => {
    it('creates aurora waves for the given height', () => {
      const state = createWeatherState();
      initAuroraWaves(state, 400);
      expect(state.auroraWaves.length).toBe(5);
      for (const wave of state.auroraWaves) {
        expect(wave.y).toBeGreaterThan(0);
        expect(wave.thickness).toBeGreaterThan(0);
        expect(wave.amplitude).toBeGreaterThan(0);
      }
    });
  });

  describe('weather progression cycle', () => {
    it('progresses through all weather types with increasing food', () => {
      const weatherTypes = ['clear', 'rain', 'storm', 'snow', 'sandstorm', 'aurora'];
      const testFoodValues = [0, 4, 8, 14, 20, 30];

      for (let i = 0; i < weatherTypes.length; i++) {
        expect(getWeatherForProgress(testFoodValues[i])).toBe(weatherTypes[i]);
      }
    });
  });
});
