import { test, expect } from '@playwright/test';

test('verify frontend renders and navigation works', async ({ page }) => {
  // Go to the dashboard
  await page.goto('http://localhost:5000/#/features');

  // Wait for the loader to disappear
  await page.waitForSelector('text=Loading Council...', { state: 'hidden', timeout: 30000 });

  // Take a screenshot
  await page.screenshot({ path: '/home/jules/verification/dashboard_final.png' });

  // Check for Intelligence Feed
  const feed = page.getByText('Intelligence Feed');
  await expect(feed).toBeVisible({ timeout: 10000 });

  // Check for some feature cards
  const featureCard = page.getByText('Reddit Sniper');
  await expect(featureCard).toBeVisible();

  // Open Command Palette
  await page.keyboard.press('Control+k');
  await expect(page.getByPlaceholder('What should the Council do?')).toBeVisible();
  await page.screenshot({ path: '/home/jules/verification/command_palette.png' });
});
