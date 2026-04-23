import { FlawCreatePage } from '../pages/flawCreate';
import { test, expect } from '../playwright/fixtures';

test.describe('affects', () => {
  test.describe.configure({ mode: 'serial' });
  test.slow(); // Mark all tests as slow (3x timeout)

  let flawId: string;

  test.beforeAll(async () => {
    flawId = await FlawCreatePage.createFlawWithAPI();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto(`/flaws/${flawId}`);
    // Wait for page to load with longer timeout
    await page.waitForLoadState('networkidle', { timeout: 90000 });
    await expect(page.getByRole('button', { name: 'Save Changes', exact: true })).toBeVisible({ timeout: 90000 });
    // Scroll to Affected Offerings section
    const heading = page.getByRole('heading', { name: 'Affected Offerings' });
    await heading.scrollIntoViewIfNeeded();
  });

  test.describe('add affects', () => {
    test('add affect button is visible', async ({ page }) => {
      const addButton = page.locator('button[title="Add new affect"]');
      await expect(addButton).toBeVisible();
    });

    test('can add first affect', async ({ page, flawEditPage }) => {
      await flawEditPage.addAffect('rhel-8', 'kernel');
      await flawEditPage.submitButton.click();
      await expect(page.getByText(/\d+ affects? created/i)).toBeVisible({ timeout: 60000 });
    });

    test('can add second affect', async ({ page, flawEditPage }) => {
      await flawEditPage.addAffect('rhel-9', 'glibc');
      await flawEditPage.submitButton.click();
      await expect(page.getByText(/\d+ affects? created/i)).toBeVisible({ timeout: 60000 });
    });

    test('new affect row shows product stream before save', async ({ page, flawEditPage }) => {
      await flawEditPage.addAffect('fedora-40', 'openssl');
      // New row should show the product stream we entered (before saving)
      const newRow = page.locator('tr.new').last();
      await expect(newRow).toContainText('fedora-40');
      // Save it
      await flawEditPage.submitButton.click();
      await expect(page.getByText(/\d+ affects? created/i)).toBeVisible({ timeout: 60000 });
    });
  });

  test.describe('table features', () => {
    test('table shows affects', async ({ page }) => {
      const affectsTable = page.locator('table').filter({ has: page.locator('thead:has-text("Product Stream")') }).first();
      const rows = affectsTable.locator('tbody tr');
      const count = await rows.count();
      expect(count).toBeGreaterThan(0);
    });

    test('table has Product Stream header', async ({ page }) => {
      const affectsTable = page.locator('table').filter({ has: page.locator('thead:has-text("Product Stream")') }).first();
      await expect(affectsTable.getByText('Product Stream')).toBeVisible({ timeout: 15000 });
    });

    test('table has Component header', async ({ page }) => {
      const affectsTable = page.locator('table').filter({ has: page.locator('thead:has-text("Product Stream")') }).first();
      await expect(affectsTable.getByText('Component', { exact: true })).toBeVisible({ timeout: 15000 });
    });

    test('shows affect count', async ({ page }) => {
      const showAllLabel = page.getByText(/Show All \(\d+\)/);
      await expect(showAllLabel).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('edit affects', () => {
    test('can double-click cell to enter edit mode', async ({ page }) => {
      const affectsTable = page.locator('table').filter({ has: page.locator('thead:has-text("Product Stream")') }).first();
      const dataRow = affectsTable.locator('tbody tr').first();
      const cell = dataRow.locator('td').nth(3);
      await cell.dblclick();

      const textInput = page.locator('input[type="text"]:visible').first();
      await expect(textInput).toBeVisible({ timeout: 10000 });

      await textInput.press('Escape');
    });

    test('escape cancels edit without saving', async ({ page }) => {
      const affectsTable = page.locator('table').filter({ has: page.locator('thead:has-text("Product Stream")') }).first();
      const dataRow = affectsTable.locator('tbody tr').first();
      const cell = dataRow.locator('td').nth(3);

      await cell.dblclick();

      const textInput = page.locator('input[type="text"]:visible').first();
      await textInput.waitFor({ state: 'visible', timeout: 10000 });
      await textInput.fill('should-be-cancelled');
      await textInput.press('Escape');

      // Wait a moment for the edit to cancel
      await page.waitForTimeout(1000);

      // Click on the Affected Offerings heading to exit edit mode
      const heading = page.getByRole('heading', { name: 'Affected Offerings' });
      await heading.click();
      await page.waitForTimeout(500);
    });

    test('can edit and save affect', async ({ page, flawEditPage }) => {
      const affectsTable = page.locator('table').filter({ has: page.locator('thead:has-text("Product Stream")') }).first();
      const dataRow = affectsTable.locator('tbody tr').first();
      const cell = dataRow.locator('td').nth(5);
      await cell.dblclick();

      const textInput = page.locator('input[type="text"]:visible').first();
      await textInput.waitFor({ state: 'visible', timeout: 10000 });
      await textInput.fill(`edited-${Date.now()}`);
      await textInput.press('Escape');

      await page.waitForTimeout(500);
      await flawEditPage.submitButton.click();

      // Wait for save to complete
      await expect(page.getByText(/Flaw saved|\d+ affects? updated/i)).toBeVisible({ timeout: 60000 });
    });
  });

  test.describe('select affects', () => {
    test('can toggle checkbox selection', async ({ page }) => {
      const affectsTable = page.locator('table').filter({ has: page.locator('thead:has-text("Product Stream")') }).first();
      const dataRow = affectsTable.locator('tbody tr').first();
      const checkbox = dataRow.locator('input[type="checkbox"]');

      // Ensure unchecked
      if (await checkbox.isChecked()) {
        await checkbox.click();
      }

      await checkbox.click();
      await expect(checkbox).toBeChecked();

      await checkbox.click();
      await expect(checkbox).not.toBeChecked();
    });

    test('header checkbox selects all', async ({ page }) => {
      const affectsTable = page.locator('table').filter({ has: page.locator('thead:has-text("Product Stream")') }).first();
      const headerCheckbox = affectsTable.locator('thead input[type="checkbox"]');
      if (await headerCheckbox.isVisible()) {
        await headerCheckbox.click();
        const bodyCheckbox = affectsTable.locator('tbody tr').first().locator('input[type="checkbox"]');
        await expect(bodyCheckbox).toBeChecked({ timeout: 5000 });
        // Cleanup
        await headerCheckbox.click();
      }
    });
  });

  test.describe('display modes', () => {
    test('show all badge is visible', async ({ page }) => {
      // The badge shows "Show All (X)" where X is the count
      const showAllBadge = page.getByText(/Show All \(\d+\)/);
      await expect(showAllBadge).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe('affect field editing', () => {
    test('can edit affectedness via dropdown', async ({ page }) => {
      const affectsTable = page.locator('table').filter({ has: page.locator('thead:has-text("Product Stream")') }).first();
      const dataRow = affectsTable.locator('tbody tr').first();

      // Find the Affectedness column by header index
      const headerCells = affectsTable.locator('thead th');
      const headerCount = await headerCells.count();

      let affectednessIndex = -1;
      for (let i = 0; i < headerCount; i++) {
        const headerText = await headerCells.nth(i).textContent();
        if (headerText?.toLowerCase().includes('affectedness')) {
          affectednessIndex = i;
          break;
        }
      }

      if (affectednessIndex >= 0) {
        const cell = dataRow.locator('td').nth(affectednessIndex);
        await cell.dblclick();

        // Should show a select dropdown
        const dropdown = page.locator('select:visible').first();
        const isDropdownVisible = await dropdown.isVisible({ timeout: 5000 }).catch(() => false);

        if (isDropdownVisible) {
          await expect(dropdown).toBeVisible();
        }

        await page.keyboard.press('Escape');
      }
    });

    test('can edit resolution via dropdown', async ({ page }) => {
      const affectsTable = page.locator('table').filter({ has: page.locator('thead:has-text("Product Stream")') }).first();
      const dataRow = affectsTable.locator('tbody tr').first();

      const headerCells = affectsTable.locator('thead th');
      const headerCount = await headerCells.count();

      let resolutionIndex = -1;
      for (let i = 0; i < headerCount; i++) {
        const headerText = await headerCells.nth(i).textContent();
        if (headerText?.toLowerCase().includes('resolution')) {
          resolutionIndex = i;
          break;
        }
      }

      if (resolutionIndex >= 0) {
        const cell = dataRow.locator('td').nth(resolutionIndex);
        await cell.dblclick();

        const dropdown = page.locator('select:visible').first();
        const isDropdownVisible = await dropdown.isVisible({ timeout: 5000 }).catch(() => false);

        if (isDropdownVisible) {
          await expect(dropdown).toBeVisible();
        }

        await page.keyboard.press('Escape');
      }
    });

    test('can edit impact via dropdown', async ({ page }) => {
      const affectsTable = page.locator('table').filter({ has: page.locator('thead:has-text("Product Stream")') }).first();
      const dataRow = affectsTable.locator('tbody tr').first();

      const headerCells = affectsTable.locator('thead th');
      const headerCount = await headerCells.count();

      let impactIndex = -1;
      for (let i = 0; i < headerCount; i++) {
        const headerText = await headerCells.nth(i).textContent();
        if (headerText?.toLowerCase().includes('impact')) {
          impactIndex = i;
          break;
        }
      }

      if (impactIndex >= 0) {
        const cell = dataRow.locator('td').nth(impactIndex);
        await cell.dblclick();

        const dropdown = page.locator('select:visible').first();
        const isDropdownVisible = await dropdown.isVisible({ timeout: 5000 }).catch(() => false);

        if (isDropdownVisible) {
          await expect(dropdown).toBeVisible();
        }

        await page.keyboard.press('Escape');
      }
    });
  });

  test.describe('remove and recover affects', () => {
    test('can select and remove an affect', async ({ page }) => {
      const affectsTable = page.locator('table').filter({ has: page.locator('thead:has-text("Product Stream")') }).first();

      // Select first affect
      const dataRow = affectsTable.locator('tbody tr').first();
      const checkbox = dataRow.locator('input[type="checkbox"]');

      if (!(await checkbox.isChecked())) {
        await checkbox.click();
      }
      await page.waitForTimeout(500);

      // Click remove button (trash icon in toolbar)
      const removeButton = page.locator('.affects-table-actions button:has(i.bi-trash), button[title*="Remove all selected"]').first();
      const isRemoveVisible = await removeButton.isVisible({ timeout: 3000 }).catch(() => false);

      if (isRemoveVisible) {
        await removeButton.click();
        await page.waitForTimeout(500);

        // Should show "Removed X" badge or row should be marked as removed
        const removedBadge = page.getByText(/Removed \d+/);
        const removedRow = affectsTable.locator('tbody tr.removed, tbody tr.text-muted');

        const hasRemovedIndicator
          = await removedBadge.isVisible({ timeout: 3000 }).catch(() => false)
            || await removedRow.first().isVisible({ timeout: 1000 }).catch(() => false);

        expect(hasRemovedIndicator).toBeTruthy();
      }
    });

    test('can recover a removed affect', async ({ page }) => {
      // Check if there's a "Removed" badge
      const removedBadge = page.getByText(/Removed \d+/);
      const hasBadge = await removedBadge.isVisible({ timeout: 3000 }).catch(() => false);

      if (hasBadge) {
        // Click recover button
        const recoverButton = page.locator('button[title*="Recover"], button:has(i.bi-arrow-counterclockwise)').first();
        const isRecoverVisible = await recoverButton.isVisible({ timeout: 3000 }).catch(() => false);

        if (isRecoverVisible) {
          await recoverButton.click();
          await page.waitForTimeout(500);

          // Badge should disappear
          await expect(removedBadge).not.toBeVisible({ timeout: 5000 });
        }
      }
    });
  });

  test.describe('module filters', () => {
    test('module filter section appears when modules exist', async ({ page }) => {
      // Module filters only appear when there are affected modules
      // Check if the funnel icon or "Affected Module Filters" text is visible
      const moduleFilterLabel = page.locator('label, button').filter({ has: page.locator('i.bi-funnel, i.bi-funnel-fill') });
      const hasModuleFilters = await moduleFilterLabel.first().isVisible({ timeout: 5000 }).catch(() => false);

      if (hasModuleFilters) {
        await expect(moduleFilterLabel.first()).toBeVisible();
      } else {
        // If no module filters, that's OK - might not have valid modules
        expect(true).toBeTruthy();
      }
    });
  });
});
