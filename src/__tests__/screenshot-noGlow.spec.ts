import { test } from '@playwright/test';

test('screenshot: no snake glow, food stays still', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test-results/no-glow-idle.png' });

  // Start game and take screenshot during gameplay
  await page.evaluate(() => {
    window.postMessage({ type: 'START_GAME' }, '*');
  });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'test-results/no-glow-playing.png' });
});
