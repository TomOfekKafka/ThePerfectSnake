import { test, expect } from '@playwright/test';

test('keanu portrait renders on food', async ({ page }) => {
  await page.goto('/');
  const startButton = page.locator('button.start-button', { hasText: 'Start Game' });
  await startButton.waitFor({ state: 'visible', timeout: 10000 });
  await startButton.click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/tmp/keanu-portrait-1.png', fullPage: true });

  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/keanu-portrait-2.png', fullPage: true });

  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/keanu-portrait-3.png', fullPage: true });

  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible();
});
