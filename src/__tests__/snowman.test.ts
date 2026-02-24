import { describe, it, expect } from 'vitest';
import { snowmanMetrics } from '../components/cleanEffects';

describe('snowmanMetrics', () => {
  it('returns body larger than head', () => {
    const m = snowmanMetrics(20, 0);
    expect(m.bodyRadius).toBeGreaterThan(m.headRadius);
  });

  it('positions head above body', () => {
    const m = snowmanMetrics(20, 0);
    expect(m.headY).toBeLessThan(m.bodyY);
  });

  it('scales proportionally with cell size', () => {
    const small = snowmanMetrics(10, 0);
    const large = snowmanMetrics(20, 0);
    const ratio = large.bodyRadius / small.bodyRadius;
    expect(ratio).toBeCloseTo(2, 1);
  });

  it('wobbles over time', () => {
    const a = snowmanMetrics(20, 0);
    const b = snowmanMetrics(20, 50);
    expect(a.wobble).not.toBeCloseTo(b.wobble, 2);
  });

  it('breathes over time', () => {
    const a = snowmanMetrics(20, 0);
    const b = snowmanMetrics(20, 20);
    expect(a.breathe).not.toEqual(b.breathe);
  });

  it('glow pulse stays within reasonable bounds', () => {
    for (let frame = 0; frame < 200; frame++) {
      const m = snowmanMetrics(20, frame);
      expect(m.glowPulse).toBeGreaterThan(0);
      expect(m.glowPulse).toBeLessThan(1);
    }
  });
});
