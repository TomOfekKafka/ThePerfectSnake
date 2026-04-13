import { describe, it, expect } from 'vitest';
import { createEmojiFoodState, advanceEmoji } from '../emojiFood';

describe('emojiFood', () => {
  it('creates state with a valid emoji and glow color', () => {
    const state = createEmojiFoodState();
    expect(state.currentEmoji).toBeTruthy();
    expect(state.currentEmoji.length).toBeGreaterThan(0);
    expect(state.glowColor).toBeGreaterThan(0);
    expect(state.textObject).toBeNull();
  });

  it('advances to a new emoji deterministically by position', () => {
    const state = createEmojiFoodState();
    advanceEmoji(state, 5, 10, 0);
    const first = state.currentEmoji;
    advanceEmoji(state, 5, 10, 100);
    expect(state.currentEmoji).toBe(first);
    advanceEmoji(state, 7, 3, 200);
    const different = state.currentEmoji;
    advanceEmoji(state, 7, 3, 300);
    expect(state.currentEmoji).toBe(different);
  });

  it('produces varied emojis across different positions', () => {
    const state = createEmojiFoodState();
    const seen = new Set<string>();
    for (let i = 0; i < 20; i++) {
      advanceEmoji(state, i, i * 3, 0);
      seen.add(state.currentEmoji);
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it('produces random emojis across multiple states', () => {
    const emojis = new Set<string>();
    for (let i = 0; i < 30; i++) {
      const state = createEmojiFoodState();
      emojis.add(state.currentEmoji);
    }
    expect(emojis.size).toBeGreaterThan(3);
  });
});
