import { test, expect } from '../playwright/fixtures';
import { FlawCreatePage } from '../pages/flawCreate';

test.describe('flaw references', () => {
  let flawId: string;
  test.beforeAll(async () => {
    flawId = await FlawCreatePage.createFlawWithAPI();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto(`/flaws/${flawId}`);
    await expect(page.getByRole('button', { name: 'Add Reference' })).toBeVisible();
  });

  test('can add a new reference', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Reference' }).click();
    await page.getByLabel('Link URL').fill('https://example.com/security-advisory');
    await page.locator('.osim-cancel-new-reference').locator('..').getByLabel('Description').fill('Test security advisory reference');
    await page.getByLabel('Reference type').selectOption('EXTERNAL');
    await page.getByRole('button', { name: 'Save Changes to References' }).click();
    await expect(page.getByText('Reference created.')).toBeVisible({ timeout: 10000 });
  });

  test('can edit an existing reference', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Reference' }).click();
    await page.getByLabel('Link URL').fill('https://original.com/advisory');
    await page.locator('.osim-cancel-new-reference').locator('..').getByLabel('Description').fill('Original description');
    await page.getByLabel('Reference type').selectOption('UPSTREAM');
    await page.getByRole('button', { name: 'Save Changes to References' }).click();
    await expect(page.getByText('Reference created.')).toBeVisible({ timeout: 10000 });

    // Uncomment lines below to work around OSIM bug where references remain in edit mode
    // await page.reload();
    // await page.getByText(/References: \d+/).click();
    await expect(page.getByText('https://original.com/advisory')).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: /Edit Reference/i }).first().click();
    await page.getByLabel('Link URL').clear();
    await page.getByLabel('Link URL').fill('https://updated.com/advisory');
    // For edit form, find the Description field within the References section
    await page.locator('.osim-editable-list-card').getByLabel('Description').clear();
    await page.locator('.osim-editable-list-card').getByLabel('Description').fill('Updated description');
    await page.getByLabel('Reference type').selectOption('EXTERNAL');
    await page.getByRole('button', { name: 'Save Changes to References' }).click();
    await expect(page.getByText('Reference updated.')).toBeVisible({ timeout: 10000 });
  });

  test('can cancel adding a new reference', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Reference' }).click();
    await page.getByLabel('Link URL').fill('https://cancelled.com/advisory');
    await page.locator('.osim-cancel-new-reference').locator('..').getByLabel('Description').fill('This should be cancelled');
    await page.locator('.osim-cancel-new-reference').click();
    await expect(page.getByText('https://cancelled.com/advisory')).not.toBeVisible();
    await expect(page.getByText('This should be cancelled')).not.toBeVisible();
  });

  test('can delete an existing reference', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Reference' }).click();
    await page.getByLabel('Link URL').fill('https://todelete.com/advisory');
    await page.locator('.osim-cancel-new-reference').locator('..').getByLabel('Description').fill('Reference to be deleted');
    await page.getByLabel('Reference type').selectOption('EXTERNAL');
    await page.getByRole('button', { name: 'Save Changes to References' }).click();
    await expect(page.getByText('Reference created.')).toBeVisible({ timeout: 10000 });

    // Uncomment lines below to work around OSIM bug where references remain in edit mode
    // await page.reload();
    // await page.getByText(/References: \d+/).click();
    await expect(page.getByText('https://todelete.com/advisory')).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: /Delete Reference/i }).first().click();
    await expect(page.getByText('Confirm Reference Deletion')).toBeVisible();
    await expect(page.getByText('Are you sure you want to delete this reference?')).toBeVisible();
    await page.getByRole('button', { name: 'Confirm' }).click();

    // Uncomment line below to work around OSIM bug with delete reactivity
    // await page.reload();

    await expect(page.getByText('https://todelete.com/advisory')).not.toBeVisible();
    await expect(page.getByText('Reference to be deleted')).not.toBeVisible();
  });

  test('can cancel reference deletion', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Reference' }).click();
    await page.getByLabel('Link URL').fill('https://keepthis.com/advisory');
    await page.locator('.osim-cancel-new-reference').locator('..').getByLabel('Description').fill('Reference to keep');
    await page.getByLabel('Reference type').selectOption('UPSTREAM');
    await page.getByRole('button', { name: 'Save Changes to References' }).click();
    await expect(page.getByText('Reference created.')).toBeVisible({ timeout: 10000 });

    // Uncomment lines below to work around OSIM bug where references remain in edit mode
    // await page.reload();
    // await page.getByText(/References: \d+/).click();
    await expect(page.getByText('https://keepthis.com/advisory')).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: /Delete Reference/i }).first().click();
    await expect(page.getByText('Confirm Reference Deletion')).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByText('https://keepthis.com/advisory')).toBeVisible();
    await expect(page.getByText('Reference to keep')).toBeVisible();
  });

  test('validates reference URL field', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Reference' }).click();
    await page.locator('.osim-cancel-new-reference').locator('..').getByLabel('Description').fill('Reference without URL');
    await page.getByRole('button', { name: 'Save Changes to References' }).click();
    await expect(page.getByLabel('Link URL')).toBeVisible();
  });

  test('reference link opens in new tab', async ({ page, context }) => {
    await page.getByRole('button', { name: 'Add Reference' }).click();
    await page.getByLabel('Link URL').fill('https://external.com/security-info');
    await page.locator('.osim-cancel-new-reference').locator('..').getByLabel('Description').fill('External security information');
    await page.getByLabel('Reference type').selectOption('EXTERNAL');
    await page.getByRole('button', { name: 'Save Changes to References' }).click();

    await expect(page.getByText('Reference created.')).toBeVisible({ timeout: 10000 });

    // Uncomment lines below to work around OSIM bug where references remain in edit mode
    // await page.reload();
    // await page.getByText(/References: \d+/).click();

    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('link', { name: 'https://external.com/security-info' }).click(),
    ]);

    expect(newPage).toBeTruthy();
    await newPage.close();
  });

  test('displays different reference type badges correctly', async ({ page }) => {
    const referenceTypes = [
      { type: 'EXTERNAL', label: 'External', url: 'https://external.com' },
      { type: 'UPSTREAM', label: 'Upstream', url: 'https://upstream.com' },
      { type: 'ARTICLE', label: 'Red Hat Security Bulletin (RHSB)', url: 'https://access.redhat.com/security/cve/test' },
    ];

    for (const { type, label, url } of referenceTypes) {
      await page.getByRole('button', { name: 'Add Reference' }).click();
      await page.getByLabel('Link URL').fill(url);
      await page.locator('.osim-cancel-new-reference').locator('..').getByLabel('Description').fill(`${type} reference`);
      await page.getByLabel('Reference type').selectOption(type);
      await page.getByRole('button', { name: 'Save Changes to References' }).click();
      await expect(page.getByText('Reference created.')).toBeVisible({ timeout: 10000 });

      // Uncomment lines below to work around OSIM bug where references remain in edit mode
      // await page.reload();
      // await page.getByText(/References: \d+/).click();
      await expect(page.locator('.badge.rounded-pill').getByText(label)).toBeVisible();
    }
  });
});
