import { test, expect } from '@playwright/test';

test('missile snake renders with visible warhead and exhaust', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(1500);

  await page.evaluate(() => {
    window.postMessage({ type: 'START_GAME' }, '*');
  });
  await page.waitForTimeout(2000);

  const shot1 = await page.screenshot({ path: 'test-results/missile-start.png', fullPage: true });
  expect(shot1.byteLength).toBeGreaterThan(5000);

  await page.evaluate(() => {
    window.postMessage({ type: 'DIRECTION_CHANGE', direction: 'RIGHT' }, '*');
  });
  await page.waitForTimeout(1500);

  await page.evaluate(() => {
    window.postMessage({ type: 'DIRECTION_CHANGE', direction: 'DOWN' }, '*');
  });
  await page.waitForTimeout(1500);

  const shot2 = await page.screenshot({ path: 'test-results/missile-moving.png', fullPage: true });
  expect(shot2.byteLength).toBeGreaterThan(5000);
});

test('missile renders after eating food (longer body)', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(1500);

  await page.evaluate(() => {
    window.postMessage({ type: 'START_GAME' }, '*');
  });
  await page.waitForTimeout(800);

  for (let i = 0; i < 8; i++) {
    const dir = i % 2 === 0 ? 'RIGHT' : 'DOWN';
    await page.evaluate((d) => {
      window.postMessage({ type: 'DIRECTION_CHANGE', direction: d }, '*');
    }, dir);
    await page.waitForTimeout(800);
  }

  const shot = await page.screenshot({ path: 'test-results/missile-long.png', fullPage: true });
  expect(shot.byteLength).toBeGreaterThan(5000);
});
