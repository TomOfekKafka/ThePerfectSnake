import { test } from '@playwright/test';

test('snake visibly triples in length after eating food', async ({ page }) => {
  await page.goto('/');

  const startButton = page.locator('button.start-button', { hasText: 'Start Game' });
  await startButton.waitFor({ state: 'visible', timeout: 10000 });

  await page.screenshot({ path: '/tmp/triple-0-before-start.png', fullPage: true });

  await startButton.click();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/tmp/triple-1-just-started.png', fullPage: true });

  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/tmp/triple-2-after-eating.png', fullPage: true });

  await page.waitForTimeout(4000);
  await page.screenshot({ path: '/tmp/triple-3-longer-play.png', fullPage: true });
});
