import { describe, it, expect } from 'vitest';
import {
  computeSegmentDepth,
  darkenColor,
} from '../components/depth3d';

describe('depth3d', () => {
  describe('computeSegmentDepth', () => {
    it('computes center position from grid coordinates', () => {
      const seg = computeSegmentDepth(5, 3, 20, 0, 5);
      expect(seg.cx).toBe(5 * 20 + 10);
      expect(seg.cy).toBe(3 * 20 + 10);
    });

    it('marks the first segment as head', () => {
      const head = computeSegmentDepth(0, 0, 20, 0, 5);
      expect(head.isHead).toBe(true);
    });

    it('marks non-first segments as not head', () => {
      const body = computeSegmentDepth(0, 0, 20, 1, 5);
      expect(body.isHead).toBe(false);
    });

    it('gives head a larger radius than body', () => {
      const head = computeSegmentDepth(0, 0, 20, 0, 5);
      const body = computeSegmentDepth(0, 0, 20, 1, 5);
      expect(head.radius).toBeGreaterThan(body.radius);
    });

    it('tapers radius toward the tail', () => {
      const mid = computeSegmentDepth(0, 0, 20, 2, 10);
      const tail = computeSegmentDepth(0, 0, 20, 9, 10);
      expect(mid.radius).toBeGreaterThan(tail.radius);
    });

    it('produces valid colors', () => {
      const seg = computeSegmentDepth(5, 5, 20, 0, 3);
      expect(seg.baseColor).toBeGreaterThan(0);
      expect(seg.highlightColor).toBeGreaterThan(0);
      expect(seg.highlightColor).not.toBe(seg.baseColor);
    });

    it('handles single-segment snake', () => {
      const seg = computeSegmentDepth(10, 10, 20, 0, 1);
      expect(seg.isHead).toBe(true);
      expect(seg.radius).toBeGreaterThan(0);
    });
  });

  describe('darkenColor', () => {
    it('darkens a color by factor', () => {
      const white = 0xffffff;
      const darkened = darkenColor(white, 0.5);
      const r = (darkened >> 16) & 0xff;
      const g = (darkened >> 8) & 0xff;
      const b = darkened & 0xff;
      expect(r).toBe(128);
      expect(g).toBe(128);
      expect(b).toBe(128);
    });

    it('returns black when factor is 0', () => {
      expect(darkenColor(0xff8844, 0)).toBe(0x000000);
    });

    it('preserves color when factor is 1', () => {
      const color = 0xaabbcc;
      expect(darkenColor(color, 1)).toBe(color);
    });

    it('handles pure red correctly', () => {
      const result = darkenColor(0xff0000, 0.5);
      expect(result).toBe(0x800000);
    });

    it('handles pure green correctly', () => {
      const result = darkenColor(0x00ff00, 0.5);
      expect(result).toBe(0x008000);
    });

    it('handles pure blue correctly', () => {
      const result = darkenColor(0x0000ff, 0.5);
      expect(result).toBe(0x000080);
    });
  });
});
