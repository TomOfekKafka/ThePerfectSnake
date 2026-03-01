import { test } from '@playwright/test';

test('capture kiss hearts flying to food', async ({ page }) => {
  await page.goto('/');
  const startButton = page.locator('button.start-button', { hasText: 'Start Game' });
  await startButton.waitFor({ state: 'visible', timeout: 10000 });
  await startButton.click();

  const directions = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp'];
  let dirIndex = 0;

  const interval = setInterval(async () => {
    try {
      await page.keyboard.press(directions[dirIndex % 4]);
      dirIndex++;
    } catch (_) { /* page may close */ }
  }, 400);

  await page.waitForTimeout(1200);
  await page.screenshot({ path: '/tmp/kiss-1.png', fullPage: true });

  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/tmp/kiss-2.png', fullPage: true });

  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/tmp/kiss-3.png', fullPage: true });

  clearInterval(interval);
});
