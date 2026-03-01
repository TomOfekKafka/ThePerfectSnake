import { describe, it, expect } from 'vitest';
import {
  computeSolidSegment,
  solidBaseColor,
  solidHighlightColor,
  solidEdgeColor,
} from '../components/solidSnake';

describe('solidSnake', () => {
  describe('computeSolidSegment', () => {
    it('computes center position from grid coords', () => {
      const seg = computeSolidSegment(5, 3, 20, 0, 5);
      expect(seg.cx).toBe(5 * 20 + 10);
      expect(seg.cy).toBe(3 * 20 + 10);
    });

    it('marks index 0 as head', () => {
      const seg = computeSolidSegment(0, 0, 20, 0, 5);
      expect(seg.isHead).toBe(true);
    });

    it('marks non-zero index as non-head', () => {
      const seg = computeSolidSegment(0, 0, 20, 2, 5);
      expect(seg.isHead).toBe(false);
    });

    it('head segment is larger than tail', () => {
      const head = computeSolidSegment(0, 0, 20, 0, 5);
      const tail = computeSolidSegment(0, 0, 20, 4, 5);
      expect(head.size).toBeGreaterThan(tail.size);
    });

    it('computes taper as ratio of index to length', () => {
      const seg = computeSolidSegment(0, 0, 20, 2, 5);
      expect(seg.taper).toBeCloseTo(0.5);
    });

    it('handles single-segment snake', () => {
      const seg = computeSolidSegment(0, 0, 20, 0, 1);
      expect(seg.taper).toBe(0);
      expect(seg.isHead).toBe(true);
      expect(seg.size).toBeGreaterThan(0);
    });

    it('computes angle from previous segment', () => {
      const seg = computeSolidSegment(5, 3, 20, 1, 3, 4, 3);
      expect(seg.angle).toBeCloseTo(0);
    });

    it('computes angle going down', () => {
      const seg = computeSolidSegment(3, 5, 20, 1, 3, 3, 4);
      expect(seg.angle).toBeCloseTo(Math.PI / 2);
    });

    it('returns zero angle when no previous segment', () => {
      const seg = computeSolidSegment(3, 3, 20, 0, 3);
      expect(seg.angle).toBe(0);
    });

    it('uses rectangular size based on cellSize', () => {
      const seg = computeSolidSegment(0, 0, 20, 0, 1);
      expect(seg.size).toBeLessThanOrEqual(20);
      expect(seg.size).toBeGreaterThan(10);
    });

    it('head size is proportional to body (no oversized head)', () => {
      const head = computeSolidSegment(0, 0, 20, 0, 5);
      const neck = computeSolidSegment(1, 0, 20, 1, 5, 0, 0);
      const ratio = head.size / neck.size;
      expect(ratio).toBeGreaterThan(0.95);
      expect(ratio).toBeLessThan(1.15);
    });
  });

  describe('solidBaseColor', () => {
    it('returns darker color at tail (taper=1)', () => {
      const tailColor = solidBaseColor(1);
      const headColor = solidBaseColor(0);
      const tailR = (tailColor >> 16) & 0xff;
      const headR = (headColor >> 16) & 0xff;
      expect(headR).toBeGreaterThan(tailR);
    });

    it('returns valid RGB values', () => {
      const color = solidBaseColor(0.5);
      const r = (color >> 16) & 0xff;
      const g = (color >> 8) & 0xff;
      const b = color & 0xff;
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(255);
      expect(g).toBeGreaterThanOrEqual(0);
      expect(g).toBeLessThanOrEqual(255);
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThanOrEqual(255);
    });
  });

  describe('solidHighlightColor', () => {
    it('is brighter than base color at same taper', () => {
      const base = solidBaseColor(0.5);
      const highlight = solidHighlightColor(0.5);
      const baseR = (base >> 16) & 0xff;
      const highlightR = (highlight >> 16) & 0xff;
      expect(highlightR).toBeGreaterThan(baseR);
    });
  });

  describe('solidEdgeColor', () => {
    it('is darker than base color at same taper', () => {
      const base = solidBaseColor(0.5);
      const edge = solidEdgeColor(0.5);
      const baseR = (base >> 16) & 0xff;
      const edgeR = (edge >> 16) & 0xff;
      expect(edgeR).toBeLessThan(baseR);
    });
  });
});
