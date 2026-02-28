import { test, expect } from '@playwright/test';

test('background band is visible on game screen', async ({ page }) => {
  await page.goto('/');
  const startButton = page.locator('button.start-button', { hasText: 'Start Game' });
  await startButton.waitFor({ state: 'visible', timeout: 10000 });
  await startButton.click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/band-visual-1.png', fullPage: true });

  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/band-visual-2.png', fullPage: true });

  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/band-visual-3.png', fullPage: true });
});
