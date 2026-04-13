import { test, expect } from '@playwright/test';

test('clean snake body - visible body after turns', async ({ page }) => {
  await page.goto('/');
  const btn = page.locator('button.start-button', { hasText: 'Start Game' });
  await btn.waitFor({ state: 'visible', timeout: 10000 });
  await btn.click();
  await page.waitForTimeout(600);

  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(800);
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(800);
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(800);
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(800);

  await page.screenshot({ path: '/tmp/clean-body-1.png', fullPage: true });
});

test('clean snake body - longer run', async ({ page }) => {
  await page.goto('/');
  const btn = page.locator('button.start-button', { hasText: 'Start Game' });
  await btn.waitFor({ state: 'visible', timeout: 10000 });
  await btn.click();
  await page.waitForTimeout(500);

  const dirs = ['ArrowDown', 'ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowRight'];
  for (const dir of dirs) {
    await page.keyboard.press(dir);
    await page.waitForTimeout(700);
  }

  await page.screenshot({ path: '/tmp/clean-body-2.png', fullPage: true });
});
