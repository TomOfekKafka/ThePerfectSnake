import { test, expect } from '@playwright/test';

const MEASURE_DURATION_MS = 3000;
const MIN_AVERAGE_FPS = 24;

test('game maintains acceptable FPS after start', async ({ page }) => {
  await page.goto('/');

  // Wait for the game to render and click Start
  const startButton = page.locator('button.start-button', { hasText: 'Start Game' });
  await startButton.waitFor({ state: 'visible', timeout: 10000 });
  await startButton.click();

  // Collect frame timestamps via requestAnimationFrame for MEASURE_DURATION_MS
  const timestamps: number[] = await page.evaluate((duration) => {
    return new Promise<number[]>((resolve) => {
      const frames: number[] = [];
      const start = performance.now();

      function tick(now: number) {
        frames.push(now);
        if (now - start < duration) {
          requestAnimationFrame(tick);
        } else {
          resolve(frames);
        }
      }

      requestAnimationFrame(tick);
    });
  }, MEASURE_DURATION_MS);

  // Compute average FPS from frame deltas
  const deltas: number[] = [];
  for (let i = 1; i < timestamps.length; i++) {
    deltas.push(timestamps[i] - timestamps[i - 1]);
  }

  const avgDelta = deltas.reduce((sum, d) => sum + d, 0) / deltas.length;
  const avgFps = 1000 / avgDelta;

  console.log(`Frames collected: ${timestamps.length}`);
  console.log(`Average frame delta: ${avgDelta.toFixed(2)} ms`);
  console.log(`Average FPS: ${avgFps.toFixed(1)}`);

  expect(avgFps).toBeGreaterThanOrEqual(MIN_AVERAGE_FPS);
});
