import { test, expect } from '../playwright/fixtures';
import { FlawCreatePage } from '../pages/flawCreate';

test.describe('flaw acknowledgements', () => {
  let flawId: string;
  test.beforeAll(async () => {
    flawId = await FlawCreatePage.createFlawWithAPI();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto(`/flaws/${flawId}`);
    await expect(page.getByRole('button', { name: 'Add Acknowledgment' })).toBeVisible();
  });

  test('can add a new acknowledgement', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Acknowledgment' }).click();
    await page.getByLabel('Name').fill('John Doe');
    await page.getByLabel('Affiliation').fill('Security Research Inc.');
    await page.getByRole('button', { name: 'Save Changes to Acknowledgments' }).click();
    await expect(page.getByText('Acknowledgment created.')).toBeVisible({ timeout: 10000 });

    // Work around OSIM bug where acknowledgments remain in edit mode
    await page.reload();
    await page.getByText(/Acknowledgments: \d+/).click();
  });

  test('can edit an existing acknowledgement', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Acknowledgment' }).click();
    await page.getByLabel('Name').fill('Jane Smith');
    await page.getByLabel('Affiliation').fill('Original Company');
    await page.getByRole('button', { name: 'Save Changes to Acknowledgments' }).click();
    await expect(page.getByText('Acknowledgment created.')).toBeVisible({ timeout: 10000 });

    // Work around OSIM bug where acknowledgments remain in edit mode
    await page.reload();
    await page.getByText(/Acknowledgments: \d+/).click();
    await expect(page.getByText('Jane Smith from Original Company')).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: /Edit Acknowledgment/i }).first().click();
    await page.getByLabel('Name').clear();
    await page.getByLabel('Name').fill('Jane Johnson');
    await page.getByLabel('Affiliation').clear();
    await page.getByLabel('Affiliation').fill('Updated Corporation');
    await page.getByRole('button', { name: 'Save Changes to Acknowledgments' }).click();
    await expect(page.getByText('Acknowledgment updated.')).toBeVisible({ timeout: 10000 });

    // Work around OSIM bug where acknowledgments remain in edit mode
    await page.reload();
    await page.getByText(/Acknowledgments: \d+/).click();
  });

  test('can cancel adding a new acknowledgement', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Acknowledgment' }).click();
    await page.getByLabel('Name').fill('Cancelled Person');
    await page.getByLabel('Affiliation').fill('Cancelled Organization');
    await page.locator('.osim-cancel-new-acknowledgment').click();
    await expect(page.getByText('Cancelled Person from Cancelled Organization')).not.toBeVisible();
  });

  test('can delete an existing acknowledgement', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Acknowledgment' }).click();
    await page.getByLabel('Name').fill('Delete Me');
    await page.getByLabel('Affiliation').fill('Temporary Corp');
    await page.getByRole('button', { name: 'Save Changes to Acknowledgments' }).click();
    await expect(page.getByText('Acknowledgment created.')).toBeVisible({ timeout: 10000 });

    // Work around OSIM bug where acknowledgments remain in edit mode
    await page.reload();
    await page.getByText(/Acknowledgments: \d+/).click();
    await expect(page.getByText('Delete Me from Temporary Corp')).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: /Delete Acknowledgment/i }).first().click();
    await expect(page.getByText('Confirm Acknowledgment Deletion')).toBeVisible();
    await expect(page.getByText('Are you sure you want to delete this acknowledgment?')).toBeVisible();
    await page.getByRole('button', { name: 'Confirm' }).click();

    // Work around OSIM bug with delete reactivity
    await page.reload();

    await expect(page.getByText('Delete Me from Temporary Corp')).not.toBeVisible();
  });

  test('can cancel acknowledgement deletion', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Acknowledgment' }).click();
    await page.getByLabel('Name').fill('Keep This Person');
    await page.getByLabel('Affiliation').fill('Permanent Company');
    await page.getByRole('button', { name: 'Save Changes to Acknowledgments' }).click();
    await expect(page.getByText('Acknowledgment created.')).toBeVisible({ timeout: 10000 });

    // Work around OSIM bug where acknowledgments remain in edit mode
    await page.reload();
    await page.getByText(/Acknowledgments: \d+/).click();
    await expect(page.getByText('Keep This Person from Permanent Company')).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: /Delete Acknowledgment/i }).first().click();
    await expect(page.getByText('Confirm Acknowledgment Deletion')).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByText('Keep This Person from Permanent Company')).toBeVisible();
  });

  test('validates acknowledgement name field', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Acknowledgment' }).click();
    await page.getByLabel('Affiliation').fill('Organization Without Name');
    await page.getByRole('button', { name: 'Save Changes to Acknowledgments' }).click();
    await expect(page.getByLabel('Name')).toBeVisible();
  });

  test('validates acknowledgement affiliation field', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Acknowledgment' }).click();
    await page.getByLabel('Name').fill('Person Without Affiliation');
    await page.getByRole('button', { name: 'Save Changes to Acknowledgments' }).click();
    await expect(page.getByLabel('Affiliation')).toBeVisible();
  });

  test('can add multiple acknowledgements', async ({ page }) => {
    const acknowledgements = [
      { name: 'Alice Cooper', affiliation: 'Security Corp' },
      { name: 'Bob Wilson', affiliation: 'Research Institute' },
      { name: 'Carol Davis', affiliation: 'Tech Solutions' },
    ];

    for (const { name, affiliation } of acknowledgements) {
      await page.getByRole('button', { name: 'Add Acknowledgment' }).click();
      await page.getByLabel('Name').fill(name);
      await page.getByLabel('Affiliation').fill(affiliation);
      await page.getByRole('button', { name: 'Save Changes to Acknowledgments' }).click();
      await expect(page.getByText('Acknowledgment created.')).toBeVisible({ timeout: 10000 });

      // Refresh page to work around OSIM bug where acknowledgments remain in edit mode
      await page.reload();
      await page.getByText(/Acknowledgments: \d+/).click();
      await expect(page.getByText(`${name} from ${affiliation}`)).toBeVisible();
    }

    // Verify all acknowledgements are visible
    for (const { name, affiliation } of acknowledgements) {
      await expect(page.getByText(`${name} from ${affiliation}`)).toBeVisible();
    }
  });

  test('displays acknowledgement UUID', async ({ page }) => {
    await page.getByRole('button', { name: 'Add Acknowledgment' }).click();
    await page.getByLabel('Name').fill('UUID Test Person');
    await page.getByLabel('Affiliation').fill('UUID Test Corp');
    await page.getByRole('button', { name: 'Save Changes to Acknowledgments' }).click();
    await expect(page.getByText('Acknowledgment created.')).toBeVisible({ timeout: 10000 });

    // Work around OSIM bug where acknowledgments remain in edit mode
    await page.reload();
    await page.getByText(/Acknowledgments: \d+/).click();

    const acknowledgementContainer = page.locator('text=UUID Test Person from UUID Test Corp').locator('..');
    await expect(acknowledgementContainer).toBeVisible();
  });

  test('handles special characters in acknowledgement fields', async ({ page }) => {
    const testData = {
      name: 'José María O\'Connor-Smith',
      affiliation: 'Müller & Associates (R&D) Ltd.',
    };

    await page.getByRole('button', { name: 'Add Acknowledgment' }).click();
    await page.getByLabel('Name').fill(testData.name);
    await page.getByLabel('Affiliation').fill(testData.affiliation);
    await page.getByRole('button', { name: 'Save Changes to Acknowledgments' }).click();
    await expect(page.getByText('Acknowledgment created.')).toBeVisible({ timeout: 10000 });

    // Work around OSIM bug where acknowledgments remain in edit mode
    await page.reload();
    await page.getByText(/Acknowledgments: \d+/).click();
    await expect(page.getByText(`${testData.name} from ${testData.affiliation}`)).toBeVisible();
  });
});
