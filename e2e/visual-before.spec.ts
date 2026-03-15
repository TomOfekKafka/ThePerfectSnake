import { test } from '@playwright/test';

test('visual snapshot during gameplay', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(1500);
  await page.screenshot({ path: 'test-results/before-idle.png', fullPage: true });

  const canvas = page.locator('canvas');
  await canvas.click();
  await page.waitForTimeout(500);

  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test-results/before-gameplay.png', fullPage: true });
});
