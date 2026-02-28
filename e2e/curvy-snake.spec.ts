import { test, expect } from '@playwright/test';

test('curvy snake is visually rendered', async ({ page }) => {
  await page.goto('/');

  const startButton = page.locator('button.start-button', { hasText: 'Start Game' });
  await startButton.waitFor({ state: 'visible', timeout: 10000 });
  await startButton.click();

  await page.waitForTimeout(1500);
  await page.screenshot({ path: '/tmp/curvy-snake-01-start.png', fullPage: true });

  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(800);
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(800);
  await page.keyboard.press('ArrowUp');
  await page.waitForTimeout(800);
  await page.screenshot({ path: '/tmp/curvy-snake-02-turning.png', fullPage: true });

  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(600);
  await page.keyboard.press('ArrowDown');
  await page.waitForTimeout(600);
  await page.keyboard.press('ArrowLeft');
  await page.waitForTimeout(600);
  await page.screenshot({ path: '/tmp/curvy-snake-03-longer.png', fullPage: true });
});
