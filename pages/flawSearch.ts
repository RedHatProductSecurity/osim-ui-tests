import type { Locator, Page } from '@playwright/test';

export class FlawSearchPage {
  // Advanced Search container
  readonly advancedSearchDetails: Locator;
  readonly advancedSearchSummary: Locator;

  // Query Filter
  readonly queryFilterContainer: Locator;
  readonly queryFilterInput: Locator;
  readonly queryFilterClearButton: Locator;
  readonly queryFilterHideButton: Locator;
  readonly queryFilterGuideButton: Locator;
  readonly showQueryFilterButton: Locator;

  // Search facets (field/value pairs)
  readonly facetRows: Locator;
  readonly searchButton: Locator;

  // Sorting
  readonly sortBySelect: Locator;
  readonly sortOrderButton: Locator;

  // Saved Searches
  readonly savedSearchesDetails: Locator;
  readonly savedSearchesSummary: Locator;
  readonly savedSearchButtons: Locator;
  readonly saveSearchButton: Locator;
  readonly updateSearchButton: Locator;
  readonly deleteSearchButton: Locator;
  readonly noSavedSearchesText: Locator;

  // Save Search Modal
  readonly saveSearchModal: Locator;
  readonly searchNameInput: Locator;
  readonly modalSaveButton: Locator;
  readonly modalCloseButton: Locator;

  // Results
  readonly loadedIndicator: Locator;
  readonly resultsTable: Locator;
  readonly resultRows: Locator;

  constructor(public readonly page: Page) {
    // Advanced Search container
    this.advancedSearchDetails = page.locator('details.osim-advanced-search-container').first();
    this.advancedSearchSummary = this.advancedSearchDetails.locator('summary');

    // Query Filter - locate textbox in the main content area (not header search)
    this.queryFilterInput = page.locator('main').getByRole('textbox').first();
    // Container visibility tracked by the textbox (hidden when query filter is collapsed)
    this.queryFilterContainer = this.queryFilterInput;
    this.queryFilterClearButton = page.locator('button[title="Clear query"]');
    this.queryFilterHideButton = page.getByRole('button', { name: 'hide query filter' }).first();
    this.queryFilterGuideButton = page.locator('.query-input button');
    this.showQueryFilterButton = page.getByRole('button', { name: 'Show Query Filter' });

    // Search facets - rows contain field selector (first select) and value input/select
    // Don't filter by input since dropdown fields replace input with a second select
    this.facetRows = page.locator('.input-group').filter({ has: page.locator('select') });
    // Advanced Search button (aria-label distinguishes from header search)
    this.searchButton = page.getByRole('button', { name: 'Advance search button' });

    // Sorting
    this.sortBySelect = page.locator('select.sort-by-select');
    this.sortOrderButton = page.locator('button.sort-by-order');

    // Saved Searches
    this.savedSearchesDetails = page.locator('details.osim-advanced-search-container').nth(1);
    this.savedSearchesSummary = this.savedSearchesDetails.locator('summary');
    this.savedSearchButtons = this.savedSearchesDetails.locator('.container-fluid button');
    this.saveSearchButton = page.getByRole('button', { name: 'Save Search' });
    this.updateSearchButton = page.getByRole('button', { name: 'Update Search' });
    this.deleteSearchButton = page.getByRole('button', { name: 'Delete Search' });
    this.noSavedSearchesText = page.getByText('No saved searches');

    // Save Search Modal
    this.saveSearchModal = page.locator('.modal');
    this.searchNameInput = page.locator('.modal input[placeholder="Search Name"]');
    this.modalSaveButton = page.locator('.modal').getByRole('button', { name: 'Save' });
    this.modalCloseButton = page.locator('.modal').getByRole('button', { name: 'Close' });

    // Results - use partial match to be more flexible
    this.loadedIndicator = page.getByText(/Loaded \d+ of \d+/);
    this.resultsTable = page.locator('table');
    this.resultRows = page.locator('table tbody tr');
  }

  async goto() {
    await this.page.goto('/');
    await this.loadedIndicator.waitFor({ state: 'visible' });
  }

  async gotoSearchPage() {
    await this.page.goto('/search');
    await this.page.waitForLoadState('networkidle');
    // Wait for the search button to be visible (indicates page is ready)
    await this.searchButton.waitFor({ state: 'visible', timeout: 30000 });
  }

  /**
   * Enter a DjangoQL query in the query filter input
   */
  async enterQuery(query: string) {
    await this.queryFilterInput.click();
    await this.queryFilterInput.fill(query);
  }

  /**
   * Clear the query filter input
   */
  async clearQuery() {
    await this.queryFilterClearButton.click();
  }

  /**
   * Submit the search
   */
  async search() {
    await this.searchButton.click();
    await this.loadedIndicator.waitFor({ state: 'visible' });
  }

  /**
   * Enter a query and submit the search
   */
  async searchWithQuery(query: string) {
    await this.enterQuery(query);
    await this.search();
  }

  /**
   * Get the number of facet rows currently displayed
   */
  async getFacetCount(): Promise<number> {
    return await this.facetRows.count();
  }

  /**
   * Select a field in a specific facet row (0-indexed)
   */
  async selectFacetField(rowIndex: number, fieldName: string) {
    const row = this.facetRows.nth(rowIndex);
    // First select in the row is the field selector
    const select = row.locator('select').first();
    await select.selectOption({ label: fieldName });
  }

  /**
   * Enter a value in a specific facet row (0-indexed)
   */
  async enterFacetValue(rowIndex: number, value: string) {
    const row = this.facetRows.nth(rowIndex);
    const input = row.locator('input').first();
    await input.fill(value);
  }

  /**
   * Select a value from dropdown in a specific facet row (for fields with predefined options)
   */
  async selectFacetValue(rowIndex: number, value: string) {
    const row = this.facetRows.nth(rowIndex);
    // Second select in the row is the value selector (for dropdown fields like Impact, Source)
    const select = row.locator('select').nth(1);
    // Wait for the value dropdown to appear after field selection
    await select.waitFor({ state: 'visible', timeout: 10000 });
    await select.selectOption(value);
  }

  /**
   * Click the "empty" button for a facet (sets value to 'isempty')
   */
  async setFacetEmpty(rowIndex: number) {
    const row = this.facetRows.nth(rowIndex);
    await row.locator('button[title="Empty field search"]').click();
  }

  /**
   * Click the "non-empty" button for a facet (sets value to 'nonempty')
   */
  async setFacetNonEmpty(rowIndex: number) {
    const row = this.facetRows.nth(rowIndex);
    await row.locator('button[title="Non empty field search"]').click();
  }

  /**
   * Clear a facet value
   */
  async clearFacetValue(rowIndex: number) {
    const row = this.facetRows.nth(rowIndex);
    await row.locator('button[title="Clear field"]').click();
  }

  /**
   * Remove a facet row
   */
  async removeFacet(rowIndex: number) {
    const row = this.facetRows.nth(rowIndex);
    await row.locator('button.btn-primary').last().click();
  }

  /**
   * Add a facet with field and value
   */
  async addFacet(fieldName: string, value: string) {
    const facetCount = await this.getFacetCount();
    // The last facet row should be empty (for adding new facets)
    const lastRowIndex = facetCount - 1;
    await this.selectFacetField(lastRowIndex, fieldName);
    await this.enterFacetValue(lastRowIndex, value);
  }

  /**
   * Add a facet with field and select a predefined value
   */
  async addFacetWithSelect(fieldName: string, value: string) {
    const facetCount = await this.getFacetCount();
    const lastRowIndex = facetCount - 1;
    await this.selectFacetField(lastRowIndex, fieldName);
    await this.selectFacetValue(lastRowIndex, value);
  }

  /**
   * Set the sort field
   */
  async setSortField(fieldLabel: string) {
    await this.sortBySelect.selectOption({ label: fieldLabel });
  }

  /**
   * Toggle the sort order (asc/desc)
   */
  async toggleSortOrder() {
    await this.sortOrderButton.click();
  }

  /**
   * Get the current sort order ('asc' or 'desc')
   */
  async getSortOrder(): Promise<'asc' | 'desc'> {
    const icon = this.sortOrderButton.locator('i');
    const hasAscClass = await icon.evaluate(el => el.classList.contains('bi-caret-up-fill'));
    return hasAscClass ? 'asc' : 'desc';
  }

  /**
   * Save the current search with a name
   */
  async saveSearch(name: string) {
    await this.saveSearchButton.click();
    await this.searchNameInput.fill(name);
    await this.modalSaveButton.click();
  }

  /**
   * Select a saved search by name
   */
  async selectSavedSearch(name: string) {
    await this.savedSearchesDetails.getByRole('button', { name }).click();
  }

  /**
   * Delete the currently selected saved search
   */
  async deleteCurrentSavedSearch() {
    await this.deleteSearchButton.click();
  }

  /**
   * Set a saved search as default
   */
  async setDefaultSearch(name: string) {
    const button = this.savedSearchesDetails.getByRole('button', { name });
    await button.locator('i').click();
  }

  /**
   * Get the number of results displayed
   */
  async getResultCount(): Promise<number> {
    return await this.resultRows.count();
  }

  /**
   * Get a specific column value from a result row
   */
  async getResultColumnValue(rowIndex: number, columnIndex: number): Promise<string> {
    const row = this.resultRows.nth(rowIndex);
    const cell = row.locator('td').nth(columnIndex);
    return await cell.innerText();
  }

  /**
   * Check if a specific text appears in the results
   */
  async resultsContainText(text: string): Promise<boolean> {
    const count = await this.resultsTable.getByText(text).count();
    return count > 0;
  }

  /**
   * Wait for search results to load
   */
  async waitForResults() {
    await this.loadedIndicator.waitFor({ state: 'visible' });
  }
}
