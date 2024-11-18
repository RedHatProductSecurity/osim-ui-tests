import { test, expect } from '@playwright/test';

// Reset storage state for this file to avoid being authenticated
test.use({ storageState: { cookies: [], origins: [] } });

test('can log in', async ({ page, browserName }) => {
  test.skip(browserName === 'chromium', 'This test is not supported in Chromium');
  await page.goto('/');

  await page.getByRole('button', { name: 'Login' }).click();

  await expect(page).toHaveTitle(/Index/);
  await expect(page.getByRole('link', { name: 'OSIM', exact: true })).toHaveText('OSIM');
  await expect(page.getByRole('button', { name: '@redhat.com' })).toBeVisible();
});
