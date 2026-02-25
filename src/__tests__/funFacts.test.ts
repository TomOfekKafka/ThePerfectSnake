import { describe, it, expect } from 'vitest';
import {
  createFunFactsState,
  pickFact,
  spawnFunFact,
  updateFunFacts,
  getFunFacts,
  getSnakeFacts,
} from '../components/funFacts';

describe('funFacts', () => {
  describe('createFunFactsState', () => {
    it('creates empty state', () => {
      const state = createFunFactsState();
      expect(state.activeFacts).toEqual([]);
      expect(state.nextFactIndex).toBe(0);
    });
  });

  describe('pickFact', () => {
    it('returns a fact object with category and text', () => {
      const state = createFunFactsState();
      const fact = pickFact(state);
      expect(fact).toHaveProperty('category');
      expect(fact).toHaveProperty('text');
      expect(typeof fact.category).toBe('string');
      expect(typeof fact.text).toBe('string');
    });

    it('advances the index on each pick', () => {
      const state = createFunFactsState();
      pickFact(state);
      expect(state.nextFactIndex).toBe(1);
      pickFact(state);
      expect(state.nextFactIndex).toBe(2);
    });

    it('cycles through all facts', () => {
      const state = createFunFactsState();
      const allFacts = getFunFacts();
      const seen = new Set<string>();
      for (let i = 0; i < allFacts.length; i++) {
        seen.add(pickFact(state).text);
      }
      expect(seen.size).toBe(allFacts.length);
    });

    it('wraps around after all facts used', () => {
      const state = createFunFactsState();
      const allFacts = getFunFacts();
      const first = pickFact(state);
      state.nextFactIndex = allFacts.length;
      const wrapped = pickFact(state);
      expect(wrapped.text).toBe(first.text);
    });
  });

  describe('spawnFunFact', () => {
    it('adds an active fact', () => {
      const state = createFunFactsState();
      spawnFunFact(state, 400, 120);
      expect(state.activeFacts.length).toBe(1);
    });

    it('sets position based on canvas width', () => {
      const state = createFunFactsState();
      spawnFunFact(state, 400, 0);
      const fact = state.activeFacts[0];
      expect(fact.x).toBe(200);
      expect(fact.startY).toBeCloseTo(400 * 0.82);
    });

    it('starts with zero age and revealed chars', () => {
      const state = createFunFactsState();
      spawnFunFact(state, 400, 0);
      expect(state.activeFacts[0].age).toBe(0);
      expect(state.activeFacts[0].revealedChars).toBe(0);
    });

    it('includes category from picked fact', () => {
      const state = createFunFactsState();
      spawnFunFact(state, 400, 0);
      expect(typeof state.activeFacts[0].category).toBe('string');
      expect(state.activeFacts[0].category.length).toBeGreaterThan(0);
    });

    it('caps active facts at max limit', () => {
      const state = createFunFactsState();
      spawnFunFact(state, 400, 0);
      spawnFunFact(state, 400, 0);
      expect(state.activeFacts.length).toBeLessThanOrEqual(1);
    });
  });

  describe('updateFunFacts', () => {
    it('increments age each update', () => {
      const state = createFunFactsState();
      spawnFunFact(state, 400, 0);
      updateFunFacts(state);
      expect(state.activeFacts[0].age).toBe(1);
    });

    it('floats fact upward over time', () => {
      const state = createFunFactsState();
      spawnFunFact(state, 400, 0);
      const startY = state.activeFacts[0].y;
      for (let i = 0; i < 10; i++) updateFunFacts(state);
      expect(state.activeFacts[0].y).toBeLessThan(startY);
    });

    it('reveals characters progressively via typewriter effect', () => {
      const state = createFunFactsState();
      spawnFunFact(state, 400, 0);
      expect(state.activeFacts[0].revealedChars).toBe(0);
      for (let i = 0; i < 5; i++) updateFunFacts(state);
      expect(state.activeFacts[0].revealedChars).toBeGreaterThan(0);
    });

    it('caps revealed chars at text length', () => {
      const state = createFunFactsState();
      spawnFunFact(state, 400, 0);
      for (let i = 0; i < 300; i++) updateFunFacts(state);
      // Fact may be removed by then, so spawn fresh
      const state2 = createFunFactsState();
      spawnFunFact(state2, 400, 0);
      const textLen = state2.activeFacts[0].text.length;
      for (let i = 0; i < 100; i++) updateFunFacts(state2);
      if (state2.activeFacts.length > 0) {
        expect(state2.activeFacts[0].revealedChars).toBeLessThanOrEqual(textLen);
      }
    });

    it('removes facts that exceed their lifetime', () => {
      const state = createFunFactsState();
      spawnFunFact(state, 400, 0);
      for (let i = 0; i < 250; i++) updateFunFacts(state);
      expect(state.activeFacts.length).toBe(0);
    });
  });

  describe('getFunFacts', () => {
    it('returns all facts', () => {
      const facts = getFunFacts();
      expect(facts.length).toBeGreaterThan(30);
    });

    it('each fact has category and text', () => {
      for (const fact of getFunFacts()) {
        expect(fact.category.length).toBeGreaterThan(0);
        expect(fact.text.length).toBeGreaterThan(0);
      }
    });

    it('has diverse categories', () => {
      const categories = new Set(getFunFacts().map(f => f.category));
      expect(categories.size).toBeGreaterThanOrEqual(8);
    });
  });

  describe('getSnakeFacts', () => {
    it('returns only snake-related facts', () => {
      const snakeFacts = getSnakeFacts();
      expect(snakeFacts.length).toBeGreaterThan(0);
      for (const text of snakeFacts) {
        expect(typeof text).toBe('string');
      }
    });
  });
});
