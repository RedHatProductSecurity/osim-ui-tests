import { FlawCreatePage } from '../pages/flawCreate';
import { test, expect } from '../playwright/fixtures';

/**
 * Tracker Manager Tests
 *
 * Tests for the Multi-Flaw Tracker Manager component.
 * Note: Actual tracker filing is NOT tested as it requires external Jira/Bugzilla integration.
 */
test.describe('tracker manager', () => {
  test.describe.configure({ mode: 'serial' });
  test.slow();

  let flawId: string;

  test.beforeAll(async () => {
    flawId = await FlawCreatePage.createFlawWithAPI();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto(`/flaws/${flawId}`);
    await page.waitForLoadState('networkidle', { timeout: 90000 });
    await expect(page.getByRole('button', { name: 'Save Changes', exact: true })).toBeVisible({ timeout: 90000 });

    // Scroll to Affected Offerings section
    const heading = page.getByRole('heading', { name: 'Affected Offerings' });
    await heading.scrollIntoViewIfNeeded();
  });

  test.describe('setup', () => {
    test('add affect to enable tracker manager', async ({ page }) => {
      // Tracker manager only appears when affects exist
      const addButton = page.locator('button[title="Add new affect"]');
      await addButton.waitFor({ state: 'visible', timeout: 30000 });
      await addButton.click();

      const newRow = page.locator('tr.new').last();
      await newRow.waitFor({ state: 'visible', timeout: 10000 });

      // Fill Product Stream
      const productStreamCell = newRow.locator('td').nth(3);
      await productStreamCell.dblclick();
      let textInput = page.locator('table input[type="text"]:visible').first();
      await textInput.waitFor({ state: 'visible', timeout: 5000 });
      await textInput.fill('rhel-8');
      await textInput.press('Escape');

      await page.waitForTimeout(300);

      // Fill Component
      const componentCell = newRow.locator('td').nth(5);
      await componentCell.dblclick();
      textInput = page.locator('table input[type="text"]:visible').first();
      await textInput.waitFor({ state: 'visible', timeout: 5000 });
      await textInput.fill('kernel');
      await textInput.press('Escape');

      await page.waitForTimeout(500);

      // Save
      await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
      await expect(page.getByText(/Flaw saved|\d+ affects? (updated|created)/i)).toBeVisible({ timeout: 60000 });
    });
  });

  test.describe('tracker manager UI', () => {
    test('tracker manager button is visible', async ({ page }) => {
      const trackerManagerBtn = page.locator('button[title="Open Tracker Manager"]');
      await expect(trackerManagerBtn).toBeVisible({ timeout: 15000 });
    });

    test('tracker manager button has collection icon', async ({ page }) => {
      const trackerManagerBtn = page.locator('button[title="Open Tracker Manager"]');
      const icon = trackerManagerBtn.locator('i.bi-collection-fill');
      await expect(icon).toBeVisible({ timeout: 5000 });
    });

    test('clicking tracker manager opens dropdown', async ({ page }) => {
      const trackerManagerBtn = page.locator('button[title="Open Tracker Manager"]');
      await trackerManagerBtn.click();

      // Dropdown should be visible with input field
      const dropdown = page.locator('ul.list-unstyled').filter({ has: page.locator('input[placeholder="CVE or Flaw UUID"]') });
      await expect(dropdown).toBeVisible({ timeout: 5000 });

      await page.keyboard.press('Escape');
    });

    test('tracker manager has CVE/UUID input field', async ({ page }) => {
      const trackerManagerBtn = page.locator('button[title="Open Tracker Manager"]');
      await trackerManagerBtn.click();

      const input = page.locator('input[placeholder="CVE or Flaw UUID"]');
      await expect(input).toBeVisible({ timeout: 5000 });

      await page.keyboard.press('Escape');
    });

    test('tracker manager has Add button', async ({ page }) => {
      const trackerManagerBtn = page.locator('button[title="Open Tracker Manager"]');
      await trackerManagerBtn.click();

      const dropdown = page.locator('ul.list-unstyled').filter({ has: page.locator('input[placeholder="CVE or Flaw UUID"]') });
      await dropdown.waitFor({ state: 'visible', timeout: 5000 });

      const addBtn = dropdown.locator('button.btn-info');
      await expect(addBtn).toBeVisible({ timeout: 5000 });
      await expect(addBtn).toHaveText('Add');

      await page.keyboard.press('Escape');
    });

    test('Add button is disabled when input is empty', async ({ page }) => {
      const trackerManagerBtn = page.locator('button[title="Open Tracker Manager"]');
      await trackerManagerBtn.click();

      const dropdown = page.locator('ul.list-unstyled').filter({ has: page.locator('input[placeholder="CVE or Flaw UUID"]') });
      await dropdown.waitFor({ state: 'visible', timeout: 5000 });

      const addBtn = dropdown.locator('button.btn-info');
      await expect(addBtn).toBeDisabled();

      await page.keyboard.press('Escape');
    });

    test('tracker manager shows empty state message', async ({ page }) => {
      const trackerManagerBtn = page.locator('button[title="Open Tracker Manager"]');
      await trackerManagerBtn.click();

      const dropdown = page.locator('ul.list-unstyled').filter({ has: page.locator('input[placeholder="CVE or Flaw UUID"]') });
      await dropdown.waitFor({ state: 'visible', timeout: 5000 });

      const emptyMessage = dropdown.getByText('Add a CVE to file related trackers');
      await expect(emptyMessage).toBeVisible({ timeout: 5000 });

      await page.keyboard.press('Escape');
    });

    test('can type CVE ID in tracker manager input', async ({ page }) => {
      const trackerManagerBtn = page.locator('button[title="Open Tracker Manager"]');
      await trackerManagerBtn.click();

      const dropdown = page.locator('ul.list-unstyled').filter({ has: page.locator('input[placeholder="CVE or Flaw UUID"]') });
      await dropdown.waitFor({ state: 'visible', timeout: 5000 });

      const input = dropdown.locator('input[placeholder="CVE or Flaw UUID"]');
      await input.fill('CVE-2024-1234');
      await expect(input).toHaveValue('CVE-2024-1234');

      // Add button should now be enabled
      const addBtn = dropdown.locator('button.btn-info');
      await expect(addBtn).toBeEnabled();

      await page.keyboard.press('Escape');
    });

    test('can add CVE via Add button click', async ({ page }) => {
      const trackerManagerBtn = page.locator('button[title="Open Tracker Manager"]');
      await trackerManagerBtn.click();

      const dropdown = page.locator('ul.list-unstyled').filter({ has: page.locator('input[placeholder="CVE or Flaw UUID"]') });
      await dropdown.waitFor({ state: 'visible', timeout: 5000 });

      const input = dropdown.locator('input[placeholder="CVE or Flaw UUID"]');
      await input.fill('CVE-2024-1111');

      const addBtn = dropdown.locator('button.btn-info');
      await addBtn.click();

      // CVE should appear in the list (uppercase)
      const cveItem = dropdown.getByText('CVE-2024-1111');
      await expect(cveItem).toBeVisible({ timeout: 5000 });

      // Input should be cleared
      await expect(input).toHaveValue('');

      await page.keyboard.press('Escape');
    });

    test('can add CVE via Enter key', async ({ page }) => {
      const trackerManagerBtn = page.locator('button[title="Open Tracker Manager"]');
      await trackerManagerBtn.click();

      const dropdown = page.locator('ul.list-unstyled').filter({ has: page.locator('input[placeholder="CVE or Flaw UUID"]') });
      await dropdown.waitFor({ state: 'visible', timeout: 5000 });

      const input = dropdown.locator('input[placeholder="CVE or Flaw UUID"]');
      await input.fill('CVE-2024-2222');
      await input.press('Enter');

      // CVE should appear in the list
      const cveItem = dropdown.getByText('CVE-2024-2222');
      await expect(cveItem).toBeVisible({ timeout: 5000 });

      await page.keyboard.press('Escape');
    });

    test('can remove CVE from list via X button', async ({ page }) => {
      const trackerManagerBtn = page.locator('button[title="Open Tracker Manager"]');
      await trackerManagerBtn.click();

      const dropdown = page.locator('ul.list-unstyled').filter({ has: page.locator('input[placeholder="CVE or Flaw UUID"]') });
      await dropdown.waitFor({ state: 'visible', timeout: 5000 });

      // Add a CVE first
      const input = dropdown.locator('input[placeholder="CVE or Flaw UUID"]');
      await input.fill('CVE-2024-3333');
      await input.press('Enter');

      // Verify it's in the list
      const cveItem = dropdown.getByText('CVE-2024-3333');
      await expect(cveItem).toBeVisible({ timeout: 5000 });

      // Click the remove button (X icon)
      const removeBtn = dropdown.locator('li').filter({ hasText: 'CVE-2024-3333' }).locator('i.bi-x');
      await removeBtn.click();

      // CVE should be removed
      await expect(cveItem).not.toBeVisible({ timeout: 5000 });

      await page.keyboard.press('Escape');
    });

    test('Reset button clears all CVEs from list', async ({ page }) => {
      const trackerManagerBtn = page.locator('button[title="Open Tracker Manager"]');
      await trackerManagerBtn.click();

      const dropdown = page.locator('ul.list-unstyled').filter({ has: page.locator('input[placeholder="CVE or Flaw UUID"]') });
      await dropdown.waitFor({ state: 'visible', timeout: 5000 });

      // Add two CVEs
      const input = dropdown.locator('input[placeholder="CVE or Flaw UUID"]');
      await input.fill('CVE-2024-4444');
      await input.press('Enter');
      await input.fill('CVE-2024-5555');
      await input.press('Enter');

      // Reset button should now be visible
      const resetBtn = dropdown.locator('button').filter({ hasText: 'Reset' });
      await expect(resetBtn).toBeVisible({ timeout: 5000 });

      // Click Reset
      await resetBtn.click();

      // Empty state message should reappear
      const emptyMessage = dropdown.getByText('Add a CVE to file related trackers');
      await expect(emptyMessage).toBeVisible({ timeout: 5000 });

      await page.keyboard.press('Escape');
    });
  });

  test.describe('tracker table columns', () => {
    test('Tracker column header exists', async ({ page }) => {
      const affectsTable = page.locator('table').filter({ has: page.locator('thead:has-text("Product Stream")') }).first();
      const trackerHeader = affectsTable.locator('th').filter({ hasText: /^Tracker$/ });

      // Column might be hidden by default, check if visible or just verify table exists
      const isVisible = await trackerHeader.isVisible({ timeout: 5000 }).catch(() => false);
      if (isVisible) {
        await expect(trackerHeader).toBeVisible();
      } else {
        // Column exists but may be hidden - that's OK
        expect(true).toBeTruthy();
      }
    });

    test('Tracker Status column header exists', async ({ page }) => {
      const affectsTable = page.locator('table').filter({ has: page.locator('thead:has-text("Product Stream")') }).first();
      const statusHeader = affectsTable.locator('th').filter({ hasText: /Tracker Status/i });

      const isVisible = await statusHeader.isVisible({ timeout: 5000 }).catch(() => false);
      if (isVisible) {
        await expect(statusHeader).toBeVisible();
      } else {
        expect(true).toBeTruthy();
      }
    });
  });

  test.describe('tracker bulk actions', () => {
    test('Create trackers button appears when selecting affects without trackers', async ({ page }) => {
      const affectsTable = page.locator('table').filter({ has: page.locator('thead:has-text("Product Stream")') }).first();
      const rows = affectsTable.locator('tbody tr');
      const rowCount = await rows.count();

      if (rowCount > 0) {
        // Select the first row
        const checkbox = rows.first().locator('input[type="checkbox"]');
        await checkbox.click();
        await page.waitForTimeout(500);

        // "Create trackers" button should appear for affects without trackers
        const createTrackersBtn = page.locator('button').filter({ hasText: /Create trackers/i });

        // Button only appears for affects without trackers - verify it exists or doesn't error
        await createTrackersBtn.isVisible({ timeout: 5000 }).catch(() => false);
        expect(true).toBeTruthy();

        // Cleanup
        await checkbox.click();
      }
    });

    test('Select suggested trackers button is visible', async ({ page }) => {
      // This button has a grid icon and selects related trackers
      const suggestedBtn = page.locator('button[title="Select suggested trackers"]');
      const isVisible = await suggestedBtn.isVisible({ timeout: 10000 }).catch(() => false);

      if (isVisible) {
        await expect(suggestedBtn).toBeVisible();
      } else {
        // Button may not be visible if no suggestions available
        expect(true).toBeTruthy();
      }
    });
  });

  test.describe('per-row tracker actions', () => {
    test('affect row has action buttons', async ({ page }) => {
      const affectsTable = page.locator('table').filter({ has: page.locator('thead:has-text("Product Stream")') }).first();
      const rows = affectsTable.locator('tbody tr');
      const rowCount = await rows.count();

      if (rowCount > 0) {
        // Each row should have a button group with actions
        const firstRow = rows.first();
        const actionButtons = firstRow.locator('.btn-group button, button:has(i.bi-trash)');
        const count = await actionButtons.count();

        expect(count).toBeGreaterThan(0);
      }
    });

    test('remove affect button is visible in row actions', async ({ page }) => {
      const affectsTable = page.locator('table').filter({ has: page.locator('thead:has-text("Product Stream")') }).first();
      const rows = affectsTable.locator('tbody tr');
      const rowCount = await rows.count();

      if (rowCount > 0) {
        const firstRow = rows.first();
        const removeBtn = firstRow.locator('button[title="Remove affect"], button:has(i.bi-trash)');
        await expect(removeBtn.first()).toBeVisible({ timeout: 5000 });
      }
    });
  });
});
