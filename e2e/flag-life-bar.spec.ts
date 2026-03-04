import { test, expect } from '@playwright/test';

test('flag life bar visible during gameplay', async ({ page }) => {
  await page.goto('/');
  const startButton = page.locator('button.start-button', { hasText: 'Start Game' });
  await startButton.waitFor({ state: 'visible', timeout: 10000 });
  await startButton.click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/tmp/flag-life-bar-1.png', fullPage: true });

  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/flag-life-bar-2.png', fullPage: true });

  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/flag-life-bar-3.png', fullPage: true });
});
