import { test } from '@playwright/test';

test('visual snapshot before cleanup', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'test-results/before-cleanup.png', fullPage: true });
});
