import { test } from '@playwright/test';

test('silk weave before game start', async ({ page }) => {
  await page.goto('/');
  const startButton = page.locator('button.start-button', { hasText: 'Start Game' });
  await startButton.waitFor({ state: 'visible', timeout: 10000 });
  await page.waitForTimeout(1000);
  await page.screenshot({ path: '/tmp/silk-weave-idle.png', fullPage: true });
});

test('silk weave during gameplay', async ({ page }) => {
  await page.goto('/');
  const startButton = page.locator('button.start-button', { hasText: 'Start Game' });
  await startButton.waitFor({ state: 'visible', timeout: 10000 });
  await startButton.click();
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/tmp/silk-weave-gameplay.png', fullPage: true });
});

test('silk weave after extended play', async ({ page }) => {
  await page.goto('/');
  const startButton = page.locator('button.start-button', { hasText: 'Start Game' });
  await startButton.waitFor({ state: 'visible', timeout: 10000 });
  await startButton.click();
  await page.waitForTimeout(6000);
  await page.screenshot({ path: '/tmp/silk-weave-extended.png', fullPage: true });
});
