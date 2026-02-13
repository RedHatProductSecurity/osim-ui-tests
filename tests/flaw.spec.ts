import type { CommentType } from 'pages/flawEdit';
import { FlawCreatePage, type FlawType } from '../pages/flawCreate';
import { test, expect } from '../playwright/fixtures';

test.describe('flaw list', () => {
  // Create multiple flaws so list/sort tests have data
  test.beforeAll(async () => {
    // Create 3 flaws for sorting tests to work properly
    await Promise.all([
      FlawCreatePage.createFlawWithAPI(),
      FlawCreatePage.createFlawWithAPI(),
      FlawCreatePage.createFlawWithAPI(),
    ]);
  });

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

    // Only test columns where flaws have unique values (impact/state/owner are same for all test flaws)
    ['id', 'created', 'title'].forEach((column) => {
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

      await expect.soft(page.getByText('Flaw created')).toBeVisible({ timeout: 60_000 });
      await expect(page).toHaveURL(/flaws\/(?!new)\w+/, { timeout: 60_000 });
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

  (['public', 'private'] as const).forEach((type: CommentType) => {
    test(`can add a ${type} comment`, async ({ page, flawEditPage }) => {
      await flawEditPage.addComment(type);
      await expect(page.getByText(new RegExp(`${type} comment saved`, 'i')).first()).toBeVisible();
    });
  });

  test(`can add an internal comment`, async ({ page, flawEditPage }) => {
    // Skip in CI: Internal Comments button is disabled without real Jira integration
    test.skip(!!process.env.CI, 'Internal comments require real Jira integration');

    await flawEditPage.addComment('internal');
    await expect(page.getByText(new RegExp(`internal comment saved`, 'i')).first()).toBeVisible();
  });

  test('jira link opens task in new page', async ({ flawEditPage, context }) => {
    // Skip in CI: Jira link not displayed without valid Jira backend
    test.skip(!!process.env.CI, 'Jira link requires valid Jira backend configuration');
    const jiraLink = flawEditPage.jiraLink;
    await expect(jiraLink).toHaveAttribute('href', /issue/);

    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      jiraLink.click(),
    ]);

    expect(newPage).toBeTruthy();
    await newPage.close();
  });

  test('can change the title', async ({ page, flawEditPage }) => {
    const title = await flawEditPage.titleBox.locator('.osim-editable-text-value').innerText();
    const newTitle = title + ' edited';

    await flawEditPage.fillTextBox(flawEditPage.titleBox, newTitle);
    await flawEditPage.submitButton.click();

    await expect(page.getByText('Flaw saved').first()).toBeVisible();
    await expect(page.getByText(newTitle, { exact: true })).toBeVisible();
  });

  test.describe('affects', () => {
    test('can add an affect', async ({ page, flawEditPage }) => {
      await flawEditPage.addAffect();
      await flawEditPage.submitButton.click();
      await expect(page.getByText(/\d+ affects? created/i).first()).toBeVisible();
    });
  });
});
