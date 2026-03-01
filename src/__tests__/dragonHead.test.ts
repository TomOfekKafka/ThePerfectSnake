import { describe, it, expect } from 'vitest';
import {
  getDirectionVectors,
  computeSnoutTip,
  computeHornPositions,
} from '../components/dragonHead';

describe('dragonHead', () => {
  describe('getDirectionVectors', () => {
    it('returns correct vectors for RIGHT', () => {
      const v = getDirectionVectors('RIGHT');
      expect(v.fx).toBe(1);
      expect(v.fy).toBe(0);
      expect(v.rx).toBe(0);
      expect(v.ry).toBe(1);
    });

    it('returns correct vectors for LEFT', () => {
      const v = getDirectionVectors('LEFT');
      expect(v.fx).toBe(-1);
      expect(v.fy).toBe(0);
    });

    it('returns correct vectors for UP', () => {
      const v = getDirectionVectors('UP');
      expect(v.fx).toBe(0);
      expect(v.fy).toBe(-1);
      expect(v.rx).toBe(1);
      expect(v.ry).toBe(0);
    });

    it('returns correct vectors for DOWN', () => {
      const v = getDirectionVectors('DOWN');
      expect(v.fx).toBe(0);
      expect(v.fy).toBe(1);
    });
  });

  describe('computeSnoutTip', () => {
    it('places snout tip ahead of center for RIGHT', () => {
      const tip = computeSnoutTip(100, 100, 20, 'RIGHT');
      expect(tip.tipX).toBeGreaterThan(100);
      expect(tip.tipY).toBe(100);
    });

    it('places snout tip above center for UP', () => {
      const tip = computeSnoutTip(100, 100, 20, 'UP');
      expect(tip.tipX).toBe(100);
      expect(tip.tipY).toBeLessThan(100);
    });

    it('places snout tip below center for DOWN', () => {
      const tip = computeSnoutTip(100, 100, 20, 'DOWN');
      expect(tip.tipX).toBe(100);
      expect(tip.tipY).toBeGreaterThan(100);
    });

    it('places snout tip left of center for LEFT', () => {
      const tip = computeSnoutTip(100, 100, 20, 'LEFT');
      expect(tip.tipX).toBeLessThan(100);
      expect(tip.tipY).toBe(100);
    });

    it('snout distance scales with head size', () => {
      const small = computeSnoutTip(100, 100, 10, 'RIGHT');
      const large = computeSnoutTip(100, 100, 30, 'RIGHT');
      expect(large.tipX - 100).toBeGreaterThan(small.tipX - 100);
    });
  });

  describe('computeHornPositions', () => {
    it('returns two horn positions', () => {
      const horns = computeHornPositions(100, 100, 20, 'RIGHT', 0);
      expect(horns.left).toBeDefined();
      expect(horns.right).toBeDefined();
    });

    it('horns are behind the head center', () => {
      const horns = computeHornPositions(100, 100, 20, 'RIGHT', 0);
      expect(horns.left.bx).toBeLessThan(100);
      expect(horns.right.bx).toBeLessThan(100);
    });

    it('horn tips are spread outward from base', () => {
      const horns = computeHornPositions(100, 100, 20, 'RIGHT', 0);
      expect(Math.abs(horns.left.ty - horns.right.ty)).toBeGreaterThan(0);
    });

    it('horn positions change with direction', () => {
      const right = computeHornPositions(100, 100, 20, 'RIGHT', 0);
      const up = computeHornPositions(100, 100, 20, 'UP', 0);
      expect(right.left.bx).not.toEqual(up.left.bx);
    });
  });
});
