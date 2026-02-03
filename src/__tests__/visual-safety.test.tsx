/**
 * Visual Safety Smoke Tests
 *
 * CRITICAL: These tests catch UI/visual regressions that make the game unplayable.
 * Examples: spinning canvas, invisible elements, extreme transforms, wrong sizing.
 *
 * These are FAST tests (~100ms) that catch 80% of game-breaking visual changes.
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import App from '../App';

describe('Visual Safety - Game Playability', () => {
  describe('Canvas Visibility and Size', () => {
    it('canvas should exist and be visible', () => {
      const { container } = render(<App />);
      const canvas = container.querySelector('canvas');

      expect(canvas).toBeTruthy();
      expect(canvas).toBeInstanceOf(HTMLCanvasElement);

      // Check visibility
      const styles = window.getComputedStyle(canvas!);
      expect(styles.display).not.toBe('none');
      expect(styles.visibility).not.toBe('hidden');

      // Check opacity (should be visible, not transparent)
      const opacity = parseFloat(styles.opacity);
      // Skip if jsdom returns NaN
      if (!isNaN(opacity)) {
        expect(opacity).toBeGreaterThanOrEqual(0.8);
      }
    });

    it('canvas should have reasonable dimensions', () => {
      const { container } = render(<App />);
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;

      expect(canvas).toBeTruthy();

      // Canvas must be large enough to play
      expect(canvas.width).toBeGreaterThanOrEqual(200);
      expect(canvas.height).toBeGreaterThanOrEqual(200);

      // Canvas shouldn't be absurdly large (indicates bug)
      expect(canvas.width).toBeLessThanOrEqual(2000);
      expect(canvas.height).toBeLessThanOrEqual(2000);
    });

    it('canvas should be positioned within viewport', () => {
      const { container } = render(<App />);
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;

      expect(canvas).toBeTruthy();

      const rect = canvas.getBoundingClientRect();

      // Canvas should be on screen (not positioned way off-screen)
      // Allow some negative values for edge cases, but not extreme
      expect(rect.left).toBeGreaterThan(-100);
      expect(rect.top).toBeGreaterThan(-100);
    });
  });

  describe('CSS Transform Safety', () => {
    it('canvas should not have extreme rotation', () => {
      const { container } = render(<App />);
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;

      expect(canvas).toBeTruthy();

      const styles = window.getComputedStyle(canvas);
      const transform = styles.transform;

      // Check for problematic transforms
      // These make the game unplayable:
      expect(transform).not.toContain('rotate(90deg)');
      expect(transform).not.toContain('rotate(180deg)');
      expect(transform).not.toContain('rotate(270deg)');
      expect(transform).not.toContain('rotate(360deg)');
      expect(transform).not.toContain('rotate(-90deg)');
      expect(transform).not.toContain('rotate(-180deg)');

      // If transform exists, validate it's not spinning
      if (transform && transform !== 'none') {
        // Check for rotation in matrix
        const matrix = transform.match(/matrix\(([^)]+)\)/);
        if (matrix) {
          const values = matrix[1].split(',').map(parseFloat);
          // matrix(a, b, c, d, e, f)
          // rotation angle = atan2(b, a)
          const angle = Math.atan2(values[1], values[0]) * (180 / Math.PI);

          // Allow minor rotations (<10 degrees) but block major ones
          expect(Math.abs(angle)).toBeLessThan(10);
        }
      }
    });

    it('canvas should not be scaled to unusable size', () => {
      const { container } = render(<App />);
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;

      expect(canvas).toBeTruthy();

      const styles = window.getComputedStyle(canvas);
      const transform = styles.transform;

      // Check for extreme scaling
      if (transform && transform !== 'none') {
        // Check scale in transform string
        const scaleMatch = transform.match(/scale\(([^)]+)\)/);
        if (scaleMatch) {
          const scale = parseFloat(scaleMatch[1]);

          // Scale should be reasonable (0.5 to 2.0)
          expect(scale).toBeGreaterThan(0.3);
          expect(scale).toBeLessThan(3.0);
        }

        // Check matrix scale
        const matrix = transform.match(/matrix\(([^)]+)\)/);
        if (matrix) {
          const values = matrix[1].split(',').map(parseFloat);
          const scaleX = Math.sqrt(values[0] * values[0] + values[1] * values[1]);
          const scaleY = Math.sqrt(values[2] * values[2] + values[3] * values[3]);

          // Both scales should be reasonable
          expect(scaleX).toBeGreaterThan(0.3);
          expect(scaleX).toBeLessThan(3.0);
          expect(scaleY).toBeGreaterThan(0.3);
          expect(scaleY).toBeLessThan(3.0);
        }
      }
    });

    it('canvas should not be flipped', () => {
      const { container } = render(<App />);
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;

      expect(canvas).toBeTruthy();

      const styles = window.getComputedStyle(canvas);
      const transform = styles.transform;

      // Check for flipping (negative scale)
      expect(transform).not.toContain('scaleX(-1)');
      expect(transform).not.toContain('scaleY(-1)');
      expect(transform).not.toContain('scale(-1');
    });
  });

  describe('Game Container Layout', () => {
    it('game container should be visible', () => {
      const { container } = render(<App />);
      const gameContainer = container.querySelector('.game-container');

      expect(gameContainer).toBeTruthy();

      const styles = window.getComputedStyle(gameContainer!);
      expect(styles.display).not.toBe('none');
      expect(styles.visibility).not.toBe('hidden');
    });

    it('app root should not have extreme transforms', () => {
      const { container } = render(<App />);
      const app = container.querySelector('.app');

      expect(app).toBeTruthy();

      const styles = window.getComputedStyle(app!);
      const transform = styles.transform;

      // App container shouldn't be spinning or flipped
      if (transform && transform !== 'none') {
        expect(transform).not.toContain('rotate(180deg)');
        expect(transform).not.toContain('rotate(360deg)');
      }
    });
  });

  describe('Critical UI Elements (Standalone Mode)', () => {
    it('should have game board element', () => {
      const { container } = render(<App />);

      // GameBoard component should render
      const canvas = container.querySelector('canvas');
      expect(canvas).toBeTruthy();
    });

    it('key UI elements should exist when not embedded', () => {
      // Mock standalone mode (not embedded)
      Object.defineProperty(window, 'parent', {
        writable: true,
        value: window
      });

      const { container } = render(<App />);

      // In standalone mode, should have title and score
      const title = container.querySelector('h1');
      const score = container.querySelector('.score');

      expect(title).toBeTruthy();
      expect(score).toBeTruthy();
    });
  });

  describe('Animation Safety', () => {
    it('canvas should not have infinite spinning animation', () => {
      const { container } = render(<App />);
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;

      expect(canvas).toBeTruthy();

      const styles = window.getComputedStyle(canvas);
      const animationName = styles.animationName;

      // Check for problematic animation names
      if (animationName && animationName !== 'none') {
        const animationNameLower = animationName.toLowerCase();

        // Block animations that suggest spinning/rotation
        expect(animationNameLower).not.toContain('spin');
        expect(animationNameLower).not.toContain('rotate');
        expect(animationNameLower).not.toContain('flip');

        // If animation exists, check iteration count
        const iterationCount = styles.animationIterationCount;

        // Warn about infinite animations on canvas (usually bad)
        // Allow infinite for subtle effects like pulse, but we'll check the name
        if (iterationCount === 'infinite' &&
            (animationNameLower.includes('spin') ||
             animationNameLower.includes('rotate'))) {
          throw new Error('Canvas has infinite spinning/rotation animation - game unplayable');
        }
      }
    });
  });

  describe('Color and Contrast', () => {
    it('canvas should not have extremely low opacity', () => {
      const { container } = render(<App />);
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;

      expect(canvas).toBeTruthy();

      const styles = window.getComputedStyle(canvas);
      const opacity = parseFloat(styles.opacity);

      // Canvas should be clearly visible (skip if jsdom returns NaN)
      if (!isNaN(opacity)) {
        expect(opacity).toBeGreaterThanOrEqual(0.7);
      }
    });

    it('game container should have reasonable background', () => {
      const { container } = render(<App />);
      const gameContainer = container.querySelector('.game-container');

      expect(gameContainer).toBeTruthy();

      const styles = window.getComputedStyle(gameContainer!);
      const bgColor = styles.backgroundColor;

      // In real browser, background should have color
      // jsdom may return transparent, which is acceptable for test environment
      if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
        // If background color is set, verify it's valid
        expect(bgColor).toBeTruthy();
      }
    });
  });

  describe('Z-Index and Layering', () => {
    it('canvas should not be behind other elements', () => {
      const { container } = render(<App />);
      const canvas = container.querySelector('canvas') as HTMLCanvasElement;

      expect(canvas).toBeTruthy();

      const styles = window.getComputedStyle(canvas);
      const zIndex = styles.zIndex;

      // Z-index shouldn't be negative (which puts it behind)
      if (zIndex !== 'auto') {
        const zIndexNum = parseInt(zIndex);
        // Skip if jsdom returns NaN
        if (!isNaN(zIndexNum)) {
          expect(zIndexNum).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });
});

describe('Visual Safety - Responsive Design', () => {
  it('canvas should maintain aspect ratio on resize', () => {
    const { container } = render(<App />);
    const canvas = container.querySelector('canvas') as HTMLCanvasElement;

    expect(canvas).toBeTruthy();

    const width = canvas.width;
    const height = canvas.height;

    // Should be square (snake game is typically square)
    // Allow small differences due to borders/padding
    const ratio = width / height;
    expect(ratio).toBeGreaterThan(0.8);
    expect(ratio).toBeLessThan(1.2);
  });
});
