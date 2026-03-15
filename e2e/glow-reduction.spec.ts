import { test, expect } from '@playwright/test';

test('glow reduction visual check - gameplay', async ({ page }) => {
  await page.goto('/');
  const canvas = page.locator('canvas');
  await expect(canvas).toBeVisible({ timeout: 15000 });
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'e2e/screenshots/glow-idle.png' });

  const iframe = page.frameLocator('iframe').first();
  const target = iframe.locator('canvas').first();
  const hasiFrame = await target.count() > 0;
  const gameCanvas = hasiFrame ? target : canvas;

  const box = await gameCanvas.boundingBox();
  if (box) {
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  }
  await page.waitForTimeout(500);

  await page.evaluate(() => {
    window.postMessage({ type: 'START_GAME' }, '*');
  });
  await page.waitForTimeout(3000);
  await page.screenshot({ path: 'e2e/screenshots/glow-gameplay.png' });

  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(300);
    await page.keyboard.press('ArrowDown');
    await page.waitForTimeout(300);
  }
  await page.screenshot({ path: 'e2e/screenshots/glow-movement.png' });
});
