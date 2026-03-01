import { test, expect } from '@playwright/test';

test('Verify main dashboard', async ({ page }) => {
  await page.goto('http://localhost:5000/#/');
  await expect(page).toHaveTitle(/The Council/);
  await expect(page.getByText('Multi-Perspective Engine')).toBeVisible();
  await page.screenshot({ path: 'verification/main-dashboard.png' });
});

test('Verify navigation to Intelligence Command Center', async ({ page }) => {
  await page.goto('http://localhost:5000/#/');

  // Wait for header to be visible
  await expect(page.getByText('Automation')).toBeVisible();

  // Click automation link
  await page.click('text=Automation');

  // Verify new page content
  await expect(page.getByText('Intelligence Command Center')).toBeVisible({ timeout: 10000 });
  await page.screenshot({ path: 'verification/automation-dashboard.png' });
});

test('Verify navigation to Quality Oracle', async ({ page }) => {
  await page.goto('http://localhost:5000/#/');
  await page.click('text=Quality');
  await expect(page.getByText('Quality Oracle')).toBeVisible();
  await page.screenshot({ path: 'verification/quality-dashboard.png' });
});

test('Verify navigation to Analytics', async ({ page }) => {
  await page.goto('http://localhost:5000/#/');
  await page.click('text=Analytics');
  await expect(page.getByText('Intelligence Metrics')).toBeVisible();
  await page.screenshot({ path: 'verification/analytics-dashboard.png' });
});

test('Verify Intelligence Feed rendering', async ({ page }) => {
  await page.goto('http://localhost:5000/#/features');
  await expect(page.getByText('Intelligence Feed')).toBeVisible();
  // Check for the mock suggestion added in useEffect
  await expect(page.getByText('Security Vulnerability Alert')).toBeVisible({ timeout: 5000 });
});
