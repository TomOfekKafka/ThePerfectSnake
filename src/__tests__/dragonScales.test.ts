import { describe, it, expect } from 'vitest';
import {
  computeDragonSegment,
  scaleBaseColor,
  scaleHighlightColor,
  scaleBellyColor,
  drawDragonConnectors,
} from '../components/dragonScales';

describe('dragonScales', () => {
  describe('computeDragonSegment', () => {
    it('computes center position from grid coords', () => {
      const seg = computeDragonSegment(3, 5, 20, 0, 5);
      expect(seg.cx).toBe(3 * 20 + 10);
      expect(seg.cy).toBe(5 * 20 + 10);
    });

    it('marks first segment as head', () => {
      const seg = computeDragonSegment(0, 0, 20, 0, 5);
      expect(seg.isHead).toBe(true);
    });

    it('marks non-first segments as body', () => {
      const seg = computeDragonSegment(0, 0, 20, 2, 5);
      expect(seg.isHead).toBe(false);
    });

    it('head has larger radius than tail', () => {
      const head = computeDragonSegment(0, 0, 20, 0, 5);
      const tail = computeDragonSegment(0, 0, 20, 4, 5);
      expect(head.radius).toBeGreaterThan(tail.radius);
    });

    it('taper is 0 for head and 1 for tail', () => {
      const head = computeDragonSegment(0, 0, 20, 0, 5);
      const tail = computeDragonSegment(0, 0, 20, 4, 5);
      expect(head.taper).toBe(0);
      expect(tail.taper).toBe(1);
    });

    it('handles single segment snake', () => {
      const seg = computeDragonSegment(5, 5, 20, 0, 1);
      expect(seg.taper).toBe(0);
      expect(seg.isHead).toBe(true);
      expect(seg.radius).toBeGreaterThan(0);
    });
  });

  describe('scaleBaseColor', () => {
    it('returns a valid color number', () => {
      const color = scaleBaseColor(0);
      expect(color).toBeGreaterThan(0);
      expect(color).toBeLessThanOrEqual(0xffffff);
    });

    it('head color differs from tail color', () => {
      const headColor = scaleBaseColor(0);
      const tailColor = scaleBaseColor(1);
      expect(headColor).not.toBe(tailColor);
    });
  });

  describe('scaleHighlightColor', () => {
    it('returns brighter values than base', () => {
      const base = scaleBaseColor(0.5);
      const highlight = scaleHighlightColor(0.5);
      expect(highlight).toBeGreaterThan(base);
    });
  });

  describe('scaleBellyColor', () => {
    it('returns a valid warm color', () => {
      const color = scaleBellyColor(0.5);
      expect(color).toBeGreaterThan(0);
      expect(color).toBeLessThanOrEqual(0xffffff);
    });
  });

  describe('drawDragonConnectors', () => {
    it('does nothing with fewer than 2 segments', () => {
      const seg = computeDragonSegment(0, 0, 20, 0, 1);
      // Should not throw
      expect(() => {
        const mockG = {
          lineStyle: () => {},
          lineBetween: () => {},
        } as unknown as import('phaser').GameObjects.Graphics;
        drawDragonConnectors(mockG, [seg]);
      }).not.toThrow();
    });
  });
});
