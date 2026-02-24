import { test } from '@playwright/test';

test('capture game screenshot', async ({ page }) => {
  await page.goto('/');
  const startButton = page.locator('button.start-button', { hasText: 'Start Game' });
  await startButton.waitFor({ state: 'visible', timeout: 10000 });
  await startButton.click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/snake-candy-cane.png', fullPage: true });
});
