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

  it('advances to a new emoji', () => {
    const state = createEmojiFoodState();
    const first = state.currentEmoji;
    const seen = new Set<string>();
    seen.add(first);
    for (let i = 0; i < 20; i++) {
      advanceEmoji(state);
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
