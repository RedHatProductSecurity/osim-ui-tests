import { FlawCreatePage, type FlawType } from '../pages/flawCreate';
import { test, expect } from '../playwright/fixtures';

test.describe('flaw list', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Loaded')).toBeVisible();
  });

  test('redirect to flaw page on click', async ({ page }) => {
    await page.locator('td:nth-child(1)').first().click();

    await expect(page).toHaveURL(/flaws\/\w+/);
  });

  test('filter by owner', async ({ page }) => {
    await page.locator('label').filter({ hasText: 'My Issues' }).check();
    await expect(page.getByText('Loaded')).toBeVisible();

    const owners = await Promise.all((await page.locator('tr td:nth-child(6)').all()).map(async owner => await owner.innerText()));

    expect(owners).toEqual(Array(owners.length).fill(process.env.JIRA_USERNAME));
  });

  test.describe('sort flaws', () => {
    test.beforeEach(async ({ page }) => {
      await expect.soft(page.getByText('Loaded')).toBeVisible();
    });

    ['id', 'impact', 'created', 'title', 'state', 'owner'].forEach((column) => {
      test(`sort by ${column}`, async ({ page }) => {
        // This column is sorted in descending order by default.
        if (column !== 'created') {
          await page.locator(`th:has-text("${column}")`).click();
          await expect.soft(page.getByText('Loaded')).toBeVisible();
        }
        const firstItem = await page.locator('td:nth-child(1)').first().innerText();

        await page.locator(`th:has-text("${column}")`).click();
        await expect.soft(page.getByText('Loaded')).toBeVisible();

        expect.soft(await page.locator('td:nth-child(1)').first().innerText()).not.toEqual(firstItem);

        // Avoid running further if there were soft assertion failures.
        expect(test.info().errors).toHaveLength(0);
      });
    });
  });
});

test.describe('flaw creation', () => {
  (['embargoed', 'public'] as const).forEach((type: FlawType) => {
    test(`create ${type} flaw`, async ({ page, flawCreatePage }) => {
      test.slow();
      await flawCreatePage.createFlaw({ type, full: true });

      await expect.soft(page.getByText('Flaw created')).toBeVisible();
      await expect(page).toHaveURL(/flaws\/(?!new)\w+/);
    });
  });
  // TODO: Add tests for specific fields and special cases.
});

test.describe('flaw edition', () => {
  let flawId: string;
  test.beforeAll(async () => {
    flawId = await FlawCreatePage.createFlawWithAPI();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto(`/flaws/${flawId}`);
  });

  test('can add a comment', async ({ page, flawEditPage }) => {
    await flawEditPage.addPublicComment();

    await expect(page.getByText('Public comment saved.')).toBeVisible();
  });

  test('can change the title', async ({ page, flawEditPage }) => {
    const title = await flawEditPage.titleBox.locator('span', { hasNotText: 'Title' }).innerText();
    await flawEditPage.fillTextBox(flawEditPage.titleBox, title + ' edited');
    await flawEditPage.submitButton.click();

    await expect(page.getByText('Flaw saved')).toBeVisible();
  });
});