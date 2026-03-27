import { test } from '@playwright/test';

test('capture emoji food screenshot', async ({ page }) => {
  await page.goto('/');
  const startButton = page.locator('button.start-button', { hasText: 'Start Game' });
  await startButton.waitFor({ state: 'visible', timeout: 10000 });
  await startButton.click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/emoji-food-1.png', fullPage: true });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/emoji-food-2.png', fullPage: true });
});
