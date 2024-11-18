import { test, expect } from '@playwright/test';

test('can log out', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Current User' }).click();
  await page.getByRole('button', { name: 'Logout' }).click();

  await expect(page).toHaveTitle(/Login/);
});
