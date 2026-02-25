import { describe, it, expect } from 'vitest';
import {
  getDefaultCrownConfig,
  computeCrownAlpha,
  computeGemPulse,
  computeGemGlintAlpha,
} from '../components/crownHead';

describe('crownHead', () => {
  describe('getDefaultCrownConfig', () => {
    it('returns valid spike count', () => {
      const config = getDefaultCrownConfig();
      expect(config.spikeCount).toBeGreaterThanOrEqual(2);
      expect(config.spikeCount).toBeLessThanOrEqual(5);
    });

    it('returns positive spike height', () => {
      const config = getDefaultCrownConfig();
      expect(config.spikeHeight).toBeGreaterThan(0);
      expect(config.spikeHeight).toBeLessThan(1);
    });

    it('returns positive gem radius', () => {
      const config = getDefaultCrownConfig();
      expect(config.gemRadius).toBeGreaterThan(0);
      expect(config.gemRadius).toBeLessThan(0.5);
    });

    it('returns positive band height', () => {
      const config = getDefaultCrownConfig();
      expect(config.bandHeight).toBeGreaterThan(0);
      expect(config.bandHeight).toBeLessThan(1);
    });
  });

  describe('computeCrownAlpha', () => {
    it('returns value between 0 and 1', () => {
      for (let frame = 0; frame < 200; frame += 10) {
        const alpha = computeCrownAlpha(frame);
        expect(alpha).toBeGreaterThan(0);
        expect(alpha).toBeLessThanOrEqual(1);
      }
    });

    it('oscillates over time', () => {
      const a1 = computeCrownAlpha(0);
      const a2 = computeCrownAlpha(25);
      expect(a1).not.toEqual(a2);
    });
  });

  describe('computeGemPulse', () => {
    it('returns value between 0 and 1', () => {
      for (let frame = 0; frame < 200; frame += 10) {
        const pulse = computeGemPulse(frame);
        expect(pulse).toBeGreaterThan(0);
        expect(pulse).toBeLessThanOrEqual(1);
      }
    });

    it('oscillates over time', () => {
      const p1 = computeGemPulse(0);
      const p2 = computeGemPulse(15);
      expect(p1).not.toEqual(p2);
    });
  });

  describe('computeGemGlintAlpha', () => {
    it('returns value between 0 and 1', () => {
      for (let frame = 0; frame < 200; frame += 10) {
        const alpha = computeGemGlintAlpha(frame);
        expect(alpha).toBeGreaterThanOrEqual(0);
        expect(alpha).toBeLessThanOrEqual(1);
      }
    });

    it('varies with frame count', () => {
      const a1 = computeGemGlintAlpha(0);
      const a2 = computeGemGlintAlpha(10);
      expect(a1).not.toEqual(a2);
    });
  });
});
