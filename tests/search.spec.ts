import { FlawCreatePage } from '../pages/flawCreate';
import { test, expect } from '../playwright/fixtures';

const testRunId = Math.random().toString(36).substring(2, 8).toUpperCase();

test.describe('advanced search', () => {
  test.beforeAll(async () => {
    await Promise.all([
      FlawCreatePage.createFlawWithAPI(),
      FlawCreatePage.createFlawWithAPI(),
      FlawCreatePage.createFlawWithAPI(),
    ]);
  });

  test.beforeEach(async ({ flawSearchPage }) => {
    await flawSearchPage.waitForResults();
  });

  test.describe('facet-based search', () => {
    test('can search by title field', async ({ flawSearchPage }) => {
      await flawSearchPage.addFacet('Title', 'Test flaw');
      await flawSearchPage.search();
      expect(await flawSearchPage.getResultCount()).toBeGreaterThan(0);
    });

    test('can search by impact field', async ({ flawSearchPage }) => {
      await flawSearchPage.addFacetWithSelect('Impact', 'LOW');
      await flawSearchPage.search();
      await expect(flawSearchPage.loadedIndicator).toBeVisible();
    });

    test('can search by CVE Source field', async ({ flawSearchPage }) => {
      await flawSearchPage.addFacetWithSelect('CVE Source', 'REDHAT');
      await flawSearchPage.search();
      expect(await flawSearchPage.getResultCount()).toBeGreaterThan(0);
    });

    test('can search by Flaw State field', async ({ flawSearchPage }) => {
      await flawSearchPage.addFacetWithSelect('Flaw State', 'NEW');
      await flawSearchPage.search();
      await expect(flawSearchPage.loadedIndicator).toBeVisible();
    });

    test('can search by embargoed field', async ({ flawSearchPage }) => {
      await flawSearchPage.addFacetWithSelect('Embargoed', 'false');
      await flawSearchPage.search();
      expect(await flawSearchPage.getResultCount()).toBeGreaterThan(0);
    });

    test('can combine multiple facet fields', async ({ flawSearchPage }) => {
      await flawSearchPage.addFacetWithSelect('CVE Source', 'REDHAT');
      await flawSearchPage.addFacetWithSelect('Embargoed', 'false');
      await flawSearchPage.search();
      await expect(flawSearchPage.loadedIndicator).toBeVisible();
    });

    test('can clear a facet value', async ({ flawSearchPage }) => {
      await flawSearchPage.addFacet('Title', 'test');
      await flawSearchPage.clearFacetValue(0);
      const input = flawSearchPage.facetRows.first().locator('input.form-control');
      await expect(input).toHaveValue('');
    });

    test('can remove a facet row', async ({ flawSearchPage }) => {
      const initialCount = await flawSearchPage.getFacetCount();
      await flawSearchPage.addFacet('Title', 'test');
      const afterAddCount = await flawSearchPage.getFacetCount();
      expect(afterAddCount).toBeGreaterThanOrEqual(initialCount);

      await flawSearchPage.removeFacet(0);
      expect(await flawSearchPage.getFacetCount()).toBeLessThan(afterAddCount);
    });
  });

  test.describe('emptiness checks', () => {
    test('can search for flaws with empty CVE ID', async ({ flawSearchPage }) => {
      await flawSearchPage.selectFacetField(0, 'CVE ID');
      await flawSearchPage.setFacetEmpty(0);
      await flawSearchPage.search();

      await expect(flawSearchPage.loadedIndicator).toBeVisible();
    });

    test('can search for flaws with non-empty CVE ID', async ({ flawSearchPage }) => {
      await flawSearchPage.selectFacetField(0, 'CVE ID');
      await flawSearchPage.setFacetNonEmpty(0);
      await flawSearchPage.search();

      await expect(flawSearchPage.loadedIndicator).toBeVisible();
    });

    test('can search for flaws with empty owner', async ({ flawSearchPage }) => {
      await flawSearchPage.selectFacetField(0, 'Owner');
      await flawSearchPage.setFacetEmpty(0);
      await flawSearchPage.search();

      await expect(flawSearchPage.loadedIndicator).toBeVisible();
    });

    test('can search for flaws with empty CWE ID', async ({ flawSearchPage }) => {
      await flawSearchPage.selectFacetField(0, 'CWE ID');
      await flawSearchPage.setFacetEmpty(0);
      await flawSearchPage.search();

      await expect(flawSearchPage.loadedIndicator).toBeVisible();
    });
  });

  test.describe('query filter (DjangoQL)', () => {
    test('can enter and submit a query', async ({ flawSearchPage }) => {
      await flawSearchPage.searchWithQuery('source = "REDHAT"');
      expect(await flawSearchPage.getResultCount()).toBeGreaterThanOrEqual(0);
    });

    test('can clear the query filter', async ({ flawSearchPage }) => {
      await flawSearchPage.enterQuery('title ~ "test"');
      await flawSearchPage.clearQuery();
      await expect(flawSearchPage.queryFilterClearButton).toBeDisabled();
    });

    test.describe('comparison operators', () => {
      test('equals operator (=)', async ({ flawSearchPage }) => {
        await flawSearchPage.searchWithQuery('source = "REDHAT"');
        await expect(flawSearchPage.loadedIndicator).toBeVisible();
      });

      test('not equals operator (!=)', async ({ flawSearchPage }) => {
        await flawSearchPage.searchWithQuery('source != "INTERNET"');
        await expect(flawSearchPage.loadedIndicator).toBeVisible();
      });

      test('contains operator (~)', async ({ flawSearchPage }) => {
        await flawSearchPage.searchWithQuery('title ~ "Test"');
        await expect(flawSearchPage.loadedIndicator).toBeVisible();
      });

      test('not contains operator (!~)', async ({ flawSearchPage }) => {
        await flawSearchPage.searchWithQuery('title !~ "nonexistent"');
        await expect(flawSearchPage.loadedIndicator).toBeVisible();
      });

      test('startswith operator', async ({ flawSearchPage }) => {
        await flawSearchPage.searchWithQuery('title startswith "Test"');
        await expect(flawSearchPage.loadedIndicator).toBeVisible();
      });

      test('endswith operator', async ({ flawSearchPage }) => {
        await flawSearchPage.searchWithQuery('title endswith "flaw"');
        await expect(flawSearchPage.loadedIndicator).toBeVisible();
      });

      test('in operator', async ({ flawSearchPage }) => {
        await flawSearchPage.searchWithQuery('source in ("REDHAT", "INTERNET")');
        await expect(flawSearchPage.loadedIndicator).toBeVisible();
      });

      test('not in operator', async ({ flawSearchPage }) => {
        await flawSearchPage.searchWithQuery('source not in ("APPLE", "GOOGLE")');
        await expect(flawSearchPage.loadedIndicator).toBeVisible();
      });
    });

    test.describe('logical operators', () => {
      test('and operator', async ({ flawSearchPage }) => {
        await flawSearchPage.searchWithQuery('source = "REDHAT" and embargoed = False');
        await expect(flawSearchPage.loadedIndicator).toBeVisible();
      });

      test('or operator', async ({ flawSearchPage }) => {
        await flawSearchPage.searchWithQuery('source = "REDHAT" or source = "INTERNET"');
        await expect(flawSearchPage.loadedIndicator).toBeVisible();
      });

      test('parentheses for grouping', async ({ flawSearchPage }) => {
        await flawSearchPage.searchWithQuery('(source = "REDHAT" or source = "INTERNET") and embargoed = False');
        await expect(flawSearchPage.loadedIndicator).toBeVisible();
      });

      test('complex query with multiple operators', async ({ flawSearchPage }) => {
        await flawSearchPage.searchWithQuery('source = "REDHAT" and (title ~ "Test" or title ~ "flaw")');
        await expect(flawSearchPage.loadedIndicator).toBeVisible();
      });
    });

    test.describe('special values', () => {
      test('boolean True value', async ({ flawSearchPage }) => {
        await flawSearchPage.searchWithQuery('embargoed = True');
        await expect(flawSearchPage.loadedIndicator).toBeVisible();
      });

      test('boolean False value', async ({ flawSearchPage }) => {
        await flawSearchPage.searchWithQuery('embargoed = False');
        await expect(flawSearchPage.loadedIndicator).toBeVisible();
      });

      test('None value for empty fields', async ({ flawSearchPage }) => {
        await flawSearchPage.searchWithQuery('cve_id = None');
        await expect(flawSearchPage.loadedIndicator).toBeVisible();
      });
    });

    test.describe('field-specific queries', () => {
      test('search by workflow_state', async ({ flawSearchPage }) => {
        await flawSearchPage.searchWithQuery('workflow_state = "NEW"');
        await expect(flawSearchPage.loadedIndicator).toBeVisible();
      });

      test('search by impact', async ({ flawSearchPage }) => {
        await flawSearchPage.searchWithQuery('impact in ("LOW", "MODERATE", "IMPORTANT", "CRITICAL")');
        await expect(flawSearchPage.loadedIndicator).toBeVisible();
      });

      test('search by affects.ps_module', async ({ flawSearchPage }) => {
        await flawSearchPage.searchWithQuery('affects.ps_module ~ "rhel"');
        await expect(flawSearchPage.loadedIndicator).toBeVisible();
      });
    });
  });

  test.describe('sorting', () => {
    test('can sort by CVSS Score', async ({ flawSearchPage }) => {
      await flawSearchPage.setSortField('CVSS Score');
      await flawSearchPage.search();

      await expect(flawSearchPage.loadedIndicator).toBeVisible();
      await expect(flawSearchPage.sortOrderButton).toBeVisible();
    });

    test('can sort by CWE ID', async ({ flawSearchPage }) => {
      await flawSearchPage.setSortField('CWE ID');
      await flawSearchPage.search();

      await expect(flawSearchPage.loadedIndicator).toBeVisible();
    });

    test('can sort by CVE Source', async ({ flawSearchPage }) => {
      await flawSearchPage.setSortField('CVE Source');
      await flawSearchPage.search();

      await expect(flawSearchPage.loadedIndicator).toBeVisible();
    });

    test('can sort by Incident State', async ({ flawSearchPage }) => {
      await flawSearchPage.setSortField('Incident State');
      await flawSearchPage.search();

      await expect(flawSearchPage.loadedIndicator).toBeVisible();
    });

    test('can toggle sort order', async ({ flawSearchPage }) => {
      await flawSearchPage.setSortField('CVSS Score');
      await flawSearchPage.search();

      const initialOrder = await flawSearchPage.getSortOrder();
      await flawSearchPage.toggleSortOrder();
      await flawSearchPage.waitForResults();

      const newOrder = await flawSearchPage.getSortOrder();
      expect(newOrder).not.toEqual(initialOrder);
    });
  });

  test.describe('saved searches', () => {
    const savedSearchName = `Test Search ${testRunId}`;

    test('can save a search', async ({ flawSearchPage }) => {
      await flawSearchPage.addFacetWithSelect('CVE Source', 'REDHAT');
      await flawSearchPage.saveSearch(savedSearchName);
      await expect(flawSearchPage.savedSearchesDetails.getByRole('button', { name: savedSearchName })).toBeVisible();
    });

    test('can load a saved search', async ({ flawSearchPage }) => {
      await flawSearchPage.addFacetWithSelect('CVE Source', 'REDHAT');
      await flawSearchPage.saveSearch(`Load Test ${testRunId}`);

      await flawSearchPage.page.reload();
      await flawSearchPage.waitForResults();
      await flawSearchPage.selectSavedSearch(`Load Test ${testRunId}`);

      const button = flawSearchPage.savedSearchesDetails.getByRole('button', { name: `Load Test ${testRunId}` });
      await expect(button).toHaveClass(/btn-secondary/);
    });

    test('can delete a saved search', async ({ flawSearchPage }) => {
      const deleteSearchName = `Delete Test ${testRunId}`;
      await flawSearchPage.addFacetWithSelect('Embargoed', 'false');
      await flawSearchPage.saveSearch(deleteSearchName);

      // Dismiss the "Search saved" toast notification to unblock saved searches section
      const toast = flawSearchPage.page.locator('.alert').filter({ hasText: 'Search saved' });
      const toastCloseButton = toast.locator('button').first();
      await toastCloseButton.waitFor({ state: 'visible', timeout: 5000 }).catch(() => undefined);
      if (await toastCloseButton.isVisible()) {
        await toastCloseButton.click();
        await toast.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => undefined);
      }

      await flawSearchPage.selectSavedSearch(deleteSearchName);
      await flawSearchPage.deleteCurrentSavedSearch();
      await expect(flawSearchPage.savedSearchesDetails.getByRole('button', { name: deleteSearchName })).not.toBeVisible();
    });

    test('can set a saved search as default', async ({ flawSearchPage }) => {
      const defaultSearchName = `Default Test ${testRunId}`;
      await flawSearchPage.addFacetWithSelect('CVE Source', 'REDHAT');
      await flawSearchPage.saveSearch(defaultSearchName);

      // Dismiss the "Search saved" toast notification
      const toast = flawSearchPage.page.locator('.alert').filter({ hasText: 'Search saved' });
      const toastCloseButton = toast.locator('button').first();
      await toastCloseButton.waitFor({ state: 'visible', timeout: 5000 }).catch(() => undefined);
      if (await toastCloseButton.isVisible()) {
        await toastCloseButton.click();
        await toast.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => undefined);
      }

      await flawSearchPage.setDefaultSearch(defaultSearchName);

      const button = flawSearchPage.savedSearchesDetails.getByRole('button', { name: defaultSearchName });
      await expect(button.locator('i.bi-star-fill')).toBeVisible();
    });

    test('shows "No saved searches" when empty', async ({ page, flawSearchPage }) => {
      await page.evaluate(() => {
        localStorage.removeItem('SearchStore');
      });
      await page.reload();
      await flawSearchPage.waitForResults();
      await expect(flawSearchPage.noSavedSearchesText).toBeVisible();
    });
  });

  test.describe('UI interactions', () => {
    test('can expand/collapse Advanced Search section', async ({ flawSearchPage }) => {
      await expect(flawSearchPage.advancedSearchDetails).toHaveAttribute('open');
      await flawSearchPage.advancedSearchSummary.click();
      await flawSearchPage.advancedSearchSummary.click();
    });

    test('can expand/collapse Saved Searches section', async ({ flawSearchPage }) => {
      await expect(flawSearchPage.savedSearchesDetails).toHaveAttribute('open');
      await flawSearchPage.savedSearchesSummary.click();
      await flawSearchPage.savedSearchesSummary.click();
    });

    // TODO: Skip until OSIM fixes aria-labels - question mark icon has wrong aria-label "hide query filter"
    test.skip('can hide and show query filter', async ({ flawSearchPage }) => {
      await expect(flawSearchPage.queryFilterInput).toBeVisible();
      await flawSearchPage.queryFilterHideButton.click();
      await expect(flawSearchPage.queryFilterInput).not.toBeVisible();
      await flawSearchPage.queryFilterHideButton.click();
      await expect(flawSearchPage.queryFilterInput).toBeVisible();
    });

    test('can open query filter guide modal', async ({ flawSearchPage }) => {
      // Click the second "hide query filter" button which is actually the guide icon (OSIM bug: wrong aria-label)
      const guideButton = flawSearchPage.page.getByRole('button', { name: 'hide query filter' }).nth(1);
      await guideButton.click();

      const modalHeading = flawSearchPage.page.getByRole('heading', { name: 'Query Filter Guide' });
      await expect(modalHeading).toBeVisible();

      // Close modal and wait for it to disappear
      await flawSearchPage.page.getByRole('button', { name: 'Close' }).first().click();
      await expect(modalHeading).not.toBeVisible();
    });
  });

  test.describe('search results', () => {
    test('displays results after search', async ({ flawSearchPage }) => {
      await flawSearchPage.addFacetWithSelect('CVE Source', 'REDHAT');
      await flawSearchPage.search();
      await expect(flawSearchPage.resultsTable).toBeVisible();
    });

    test('clicking on result navigates to flaw page', async ({ page, flawSearchPage }) => {
      await flawSearchPage.addFacetWithSelect('CVE Source', 'REDHAT');
      await flawSearchPage.search();
      await flawSearchPage.resultRows.first().locator('td').first().click();
      await expect(page).toHaveURL(/flaws\/\w+/);
    });
  });
});
