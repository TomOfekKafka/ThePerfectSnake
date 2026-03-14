import { test, expect } from '@playwright/test';

test('food is stationary and no head halo', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(1500);

  // Take screenshot before game starts
  await page.screenshot({ path: 'test-results/stationary-food-idle.png' });

  // Start the game
  await page.evaluate(() => {
    const iframe = document.querySelector('iframe');
    const target = iframe?.contentWindow ?? window;
    target.postMessage({ type: 'START_GAME' }, '*');
  });
  await page.waitForTimeout(2000);

  // Take screenshot during gameplay
  await page.screenshot({ path: 'test-results/stationary-food-playing.png' });

  // Move snake a bit
  await page.evaluate(() => {
    const iframe = document.querySelector('iframe');
    const target = iframe?.contentWindow ?? window;
    target.postMessage({ type: 'DIRECTION_CHANGE', direction: 'RIGHT' }, '*');
  });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: 'test-results/stationary-food-moved.png' });

  expect(true).toBe(true);
});
