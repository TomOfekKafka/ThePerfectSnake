import { describe, it, expect } from 'vitest';
import { candyCaneSegmentColor, CLEAN_COLORS } from '../components/cleanEffects';

describe('candyCaneSegmentColor', () => {
  it('returns red for index 0', () => {
    const result = candyCaneSegmentColor(0, 2);
    expect(result.fill).toBe(CLEAN_COLORS.candyRed);
    expect(result.glow).toBe(CLEAN_COLORS.candyRedGlow);
  });

  it('returns white for second stripe', () => {
    const result = candyCaneSegmentColor(2, 2);
    expect(result.fill).toBe(CLEAN_COLORS.candyWhite);
    expect(result.glow).toBe(CLEAN_COLORS.candyWhiteGlow);
  });

  it('alternates between red and white stripes', () => {
    const colors = Array.from({ length: 8 }, (_, i) => candyCaneSegmentColor(i, 2));
    expect(colors[0].fill).toBe(CLEAN_COLORS.candyRed);
    expect(colors[1].fill).toBe(CLEAN_COLORS.candyRed);
    expect(colors[2].fill).toBe(CLEAN_COLORS.candyWhite);
    expect(colors[3].fill).toBe(CLEAN_COLORS.candyWhite);
    expect(colors[4].fill).toBe(CLEAN_COLORS.candyRed);
    expect(colors[5].fill).toBe(CLEAN_COLORS.candyRed);
    expect(colors[6].fill).toBe(CLEAN_COLORS.candyWhite);
    expect(colors[7].fill).toBe(CLEAN_COLORS.candyWhite);
  });

  it('respects different stripe widths', () => {
    const width3 = Array.from({ length: 6 }, (_, i) => candyCaneSegmentColor(i, 3));
    expect(width3[0].fill).toBe(CLEAN_COLORS.candyRed);
    expect(width3[1].fill).toBe(CLEAN_COLORS.candyRed);
    expect(width3[2].fill).toBe(CLEAN_COLORS.candyRed);
    expect(width3[3].fill).toBe(CLEAN_COLORS.candyWhite);
    expect(width3[4].fill).toBe(CLEAN_COLORS.candyWhite);
    expect(width3[5].fill).toBe(CLEAN_COLORS.candyWhite);
  });

  it('wraps back to red after a full cycle', () => {
    const result = candyCaneSegmentColor(4, 2);
    expect(result.fill).toBe(CLEAN_COLORS.candyRed);
  });
});
