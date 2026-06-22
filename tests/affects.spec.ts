import { FlawCreatePage } from '../pages/flawCreate';
import { FlawEditPage, AFFECT_COLUMN_MAP } from '../pages/flawEdit';
import { test, expect } from '../playwright/fixtures';

test.describe('affects', () => {
  test.slow();

  // Helper to navigate to flaw and scroll to affects section
  const setupFlawPage = async (page: import('@playwright/test').Page, flawId: string) => {
    await page.goto(`/flaws/${flawId}`);
    await page.waitForLoadState('networkidle', { timeout: 90000 });
    await expect(page.getByRole('button', { name: 'Save Changes', exact: true })).toBeVisible({ timeout: 90000 });
    const heading = page.getByRole('heading', { name: 'Affected Offerings' });
    await heading.scrollIntoViewIfNeeded();
  };

  // Helper to create a flaw with one affect already saved
  const createFlawWithAffect = async (browser: import('@playwright/test').Browser): Promise<string> => {
    const flawId = await FlawCreatePage.createFlawWithAPI();
    const page = await browser.newPage();
    await setupFlawPage(page, flawId);
    const flawEditPage = new FlawEditPage(page);
    await flawEditPage.addAffect({ productStream: 'rhel-8.10.0', module: 'rhel-8', component: 'kernel' });
    await flawEditPage.submitButton.click();
    await expect(page.getByText(/\d+ affects? created/i)).toBeVisible({ timeout: 60000 });
    await page.close();
    return flawId;
  };

  test.describe('add affects', () => {
    let flawId: string;

    test.beforeAll(async () => {
      flawId = await FlawCreatePage.createFlawWithAPI();
    });

    test.beforeEach(async ({ page }) => {
      await setupFlawPage(page, flawId);
    });

    test('can add affect', async ({ page, flawEditPage }) => {
      await flawEditPage.addAffect({ productStream: 'rhel-8.10.0', module: 'rhel-8', component: 'kernel' });
      await flawEditPage.submitButton.click();
      await expect(page.getByText(/\d+ affects? created/i)).toBeVisible({ timeout: 60000 });
    });
  });

  test.describe('table features', () => {
    let flawId: string;

    test.beforeAll(async ({ browser }) => {
      flawId = await createFlawWithAffect(browser);
    });

    test.beforeEach(async ({ page }) => {
      await setupFlawPage(page, flawId);
    });
    test('table has Product Stream header', async ({ page }) => {
      const affectsTable = page.locator('table').filter({ has: page.locator('thead:has-text("Product Stream")') }).first();
      await expect(affectsTable.getByText('Product Stream')).toBeVisible({ timeout: 15000 });
    });

    test('table has Component header', async ({ page }) => {
      const affectsTable = page.locator('table').filter({ has: page.locator('thead:has-text("Product Stream")') }).first();
      await expect(affectsTable.getByText('Component', { exact: true })).toBeVisible({ timeout: 15000 });
    });

    test('shows affect count badge', async ({ page }) => {
      const showAllLabel = page.getByText(/Show All \(\d+\)/);
      await expect(showAllLabel).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('edit affects', () => {
    let flawId: string;

    test.beforeAll(async ({ browser }) => {
      flawId = await createFlawWithAffect(browser);
    });

    test.beforeEach(async ({ page }) => {
      await setupFlawPage(page, flawId);
    });

    test('can edit and save affect', async ({ page, flawEditPage }) => {
      const affectsTable = page.locator('table').filter({ has: page.locator('thead:has-text("Product Stream")') }).first();
      const dataRow = affectsTable.locator('tbody tr').first();
      // TODO: nth() indices break if columns are hidden/reordered via user settings (persisted in browser).
      // Fix requires OSIM to expose data-column-id attributes on cells.
      const cell = dataRow.locator('td').nth(AFFECT_COLUMN_MAP.Component);
      await cell.dblclick();

      const textInput = cell.locator('input[type="text"]');
      await textInput.waitFor({ state: 'visible', timeout: 10000 });
      await textInput.fill(`edited-${Date.now()}`);
      await textInput.press('Enter');

      await expect(dataRow).toHaveClass(/modified/, { timeout: 5000 });
      await flawEditPage.submitButton.click();

      await expect(page.getByText(/Flaw saved|\d+ affects? updated/i)).toBeVisible({ timeout: 60000 });
    });
  });

  test.describe('select affects', () => {
    test.describe.configure({ mode: 'serial' });

    let flawId: string;

    test.beforeAll(async ({ browser }) => {
      flawId = await createFlawWithAffect(browser);
    });

    test.beforeEach(async ({ page }) => {
      await setupFlawPage(page, flawId);
    });

    test('can toggle checkbox selection', async ({ page }) => {
      const affectsTable = page.locator('table').filter({ has: page.locator('thead:has-text("Product Stream")') }).first();
      const dataRow = affectsTable.locator('tbody tr').first();
      const checkbox = dataRow.locator('input[type="checkbox"]');

      await checkbox.click();
      await expect(checkbox).toBeChecked();

      await checkbox.click();
      await expect(checkbox).not.toBeChecked();
    });

    test('header checkbox selects all', async ({ page }) => {
      const affectsTable = page.locator('table').filter({ has: page.locator('thead:has-text("Product Stream")') }).first();
      const headerCheckbox = affectsTable.locator('thead input[type="checkbox"]');
      const bodyCheckbox = affectsTable.locator('tbody tr').first().locator('input[type="checkbox"]');

      await expect(headerCheckbox).toBeVisible({ timeout: 10000 });

      await headerCheckbox.click();
      await expect(bodyCheckbox).toBeChecked({ timeout: 5000 });

      await headerCheckbox.click();
      await expect(bodyCheckbox).not.toBeChecked({ timeout: 5000 });
    });
  });

  test.describe('remove and recover affects', () => {
    let flawId: string;

    test.beforeAll(async ({ browser }) => {
      flawId = await createFlawWithAffect(browser);
    });

    test.beforeEach(async ({ page }) => {
      await setupFlawPage(page, flawId);
    });

    test('can remove and recover an affect', async ({ page }) => {
      const affectsTable = page.locator('table').filter({ has: page.locator('thead:has-text("Product Stream")') }).first();
      const dataRow = affectsTable.locator('tbody tr').first();
      const checkbox = dataRow.locator('input[type="checkbox"]');

      await checkbox.click();

      // Remove via toolbar
      const removeButton = page.locator('button[title="Remove selected affects"]');
      await expect(removeButton).toBeVisible({ timeout: 5000 });
      await removeButton.click();

      // Row gets 'removed' class
      await expect(dataRow).toHaveClass(/removed/, { timeout: 5000 });

      // Revert via per-row action
      const revertButton = dataRow.locator('button[title="Revert changes"]');
      await expect(revertButton).toBeVisible({ timeout: 5000 });
      await revertButton.click();

      // Verify 'removed' class is gone
      await expect(dataRow).not.toHaveClass(/removed/, { timeout: 5000 });
    });
  });
});
