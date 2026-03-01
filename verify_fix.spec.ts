import { test, expect } from '@playwright/test';

test('Dashboard should load without Systems Offline error', async ({ page }) => {
  await page.goto('http://localhost:5000/#/automation');

  // Wait for the loader to disappear
  await page.waitForSelector('text=Loading Council...', { state: 'hidden', timeout: 30000 });

  // Take a screenshot to verify
  await page.screenshot({ path: 'verification_dashboard.png', fullPage: true });

  // Check that "Systems Offline" is NOT present
  const offlineText = await page.locator('text=Systems Offline').isVisible();
  expect(offlineText).toBeFalsy();

  // Check that "Intelligence Command Center" or similar is present
  await expect(page.locator('text=Intelligence Command Center')).toBeVisible();
});
