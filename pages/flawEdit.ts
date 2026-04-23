import type { Locator, Page } from '@playwright/test';
import { FlawCreatePage } from './flawCreate';
import { faker } from '@faker-js/faker';
import { getFlawFromAPI, sleep } from 'playwright/helpers';

export type CommentType = 'public' | 'private' | 'internal';
export type Affectedness = 'NEW' | 'AFFECTED' | 'NOTAFFECTED' | '';
export type Resolution = 'FIX' | 'DEFER' | 'WONTFIX' | 'OOSS' | 'DELEGATED' | 'WONTREPORT' | '';
export type AffectImpact = 'LOW' | 'MODERATE' | 'IMPORTANT' | 'CRITICAL' | '';

export interface AffectData {
  module?: string;
  component?: string;
  affectedness?: Affectedness;
  resolution?: Resolution;
  impact?: AffectImpact;
}

export class FlawEditPage extends FlawCreatePage {
  readonly createJiraTaskButton: Locator;
  readonly jiraLink: Locator;

  readonly publicCommentButton: Locator;
  readonly publicCommentTab: Locator;
  readonly publicCommentBox: Locator;
  readonly savePublicCommentBox: Locator;

  readonly privateCommentButton: Locator;
  readonly privateCommentTab: Locator;
  readonly privateCommentBox: Locator;
  readonly savePrivateCommentBox: Locator;

  readonly internalCommentButton: Locator;
  readonly internalCommentTab: Locator;
  readonly internalCommentBox: Locator;
  readonly saveInternalCommentBox: Locator;

  // Affects section
  readonly affectsSection: Locator;
  readonly affectsTable: Locator;
  readonly affectRows: Locator;
  readonly addNewAffectButton: Locator;
  readonly noAffectsMessage: Locator;

  // Affect row actions
  readonly editAffectButton: Locator;
  readonly removeAffectButton: Locator;
  readonly commitEditButton: Locator;
  readonly cancelEditButton: Locator;
  readonly recoverAffectButton: Locator;
  readonly revertChangesButton: Locator;

  // Bulk affect actions
  readonly manageTrackersButton: Locator;
  readonly editSelectedButton: Locator;
  readonly removeSelectedButton: Locator;
  readonly commitAllButton: Locator;
  readonly cancelAllButton: Locator;
  readonly revertAllButton: Locator;
  readonly recoverAllButton: Locator;

  // Affect badges/filters
  readonly showAllAffectsBadge: Locator;
  readonly selectedAffectsBadge: Locator;
  readonly editingAffectsBadge: Locator;
  readonly modifiedAffectsBadge: Locator;
  readonly removedAffectsBadge: Locator;
  readonly addedAffectsBadge: Locator;

  // Module filters
  readonly moduleFiltersToggle: Locator;
  readonly clearModuleFiltersButton: Locator;

  // Legacy locators (kept for compatibility)
  readonly addAffectButton: Locator;
  readonly affectModuleBox: Locator;
  readonly affectComponentBox: Locator;
  readonly affectAffectednessBox: Locator;
  readonly affectResolutionBox: Locator;
  readonly affectImpactBox: Locator;
  readonly affectCommitButton: Locator;

  constructor(page: Page) {
    super(page);

    this.createJiraTaskButton = this.page.getByRole('button', { name: 'Create Jira Task' });
    this.jiraLink = this.page.getByRole('link', { name: ' Open in Jira' });

    this.publicCommentTab = this.page.getByRole('button', { name: 'Public Comments', exact: true });
    this.publicCommentButton = this.page.getByRole('button', { name: 'Add Public Comment' });
    this.publicCommentBox = this.page.locator('label').filter({ hasText: 'New Public Comment' });
    this.savePublicCommentBox = this.page.getByRole('button', { name: 'Save Public Comment' });

    this.privateCommentTab = this.page.getByRole('button', { name: 'Private Comments', exact: true });
    this.privateCommentButton = this.page.getByRole('button', { name: 'Add Private Comment' });
    this.privateCommentBox = this.page.locator('label').filter({ hasText: 'New Private Comment' });
    this.savePrivateCommentBox = this.page.getByRole('button', { name: 'Save Private Comment' });

    this.internalCommentTab = this.page.getByRole('button', { name: 'Internal Comments', exact: true });
    this.internalCommentButton = this.page.getByRole('button', { name: 'Add Internal Comment' });
    this.internalCommentBox = this.page.locator('label').filter({ hasText: 'New Internal Comment' });
    this.saveInternalCommentBox = this.page.getByRole('button', { name: 'Save Internal Comment' });

    // Affects section - the div with class osim-affects-section inside the "Affected Offerings" form section
    // Structure: h4 "Affected Offerings" > sibling div.col > FlawAffects (.osim-affects-section)
    this.affectsSection = this.page.locator('.osim-affects-section');
    this.affectsTable = this.page.locator('table.affects-table');
    this.affectRows = this.affectsTable.locator('tbody tr');

    // Add New Affect button - use both title and text selectors
    this.addNewAffectButton = this.page.locator('button[title="Add new affect"], button:has-text("Add New Affect")').first();
    this.noAffectsMessage = this.page.getByText('This flaw has no affects');

    // Affect row action buttons - use title attributes for specificity
    this.editAffectButton = this.page.locator('button[title="Edit affect"]');
    this.removeAffectButton = this.page.locator('button[title="Remove affect"]');
    this.commitEditButton = this.page.locator('button[title="Commit edit"]');
    this.cancelEditButton = this.page.locator('button[title="Cancel edit"]');
    this.recoverAffectButton = this.page.locator('button[title="Recover affect"]');
    this.revertChangesButton = this.page.locator('button[title="Discard changes (Revert)"]');

    // Bulk affect actions in affects-table-actions toolbar
    this.manageTrackersButton = this.page.locator('button.trackers-btn');
    this.editSelectedButton = this.page.locator('button[title="Edit all selected affects"]');
    this.removeSelectedButton = this.page.locator('button[title="Remove all selected affects"]');
    this.commitAllButton = this.page.locator('button[title="Commit changes on all affects being edited"]');
    this.cancelAllButton = this.page.locator('button[title="Cancel changes on all affects being edited"]');
    this.revertAllButton = this.page.locator('button[title="Discard all affect modifications"]');
    this.recoverAllButton = this.page.locator('button[title="Recover all removed affects"]');

    // Affect badges in the affects-toolbar .badges div
    // These show counts like "Show all affects (5)", "Selected 2", "Editing 1", etc.
    this.showAllAffectsBadge = this.page.locator('.affects-toolbar .badges div').filter({ hasText: /Show all affects/ });
    this.selectedAffectsBadge = this.page.locator('.affects-toolbar .badges div').filter({ hasText: /^Selected/ });
    this.editingAffectsBadge = this.page.locator('.affects-toolbar .badges div').filter({ hasText: /^Editing/ });
    this.modifiedAffectsBadge = this.page.locator('.affects-toolbar .badges div').filter({ hasText: /^Modified/ });
    this.removedAffectsBadge = this.page.locator('.affects-toolbar .badges div').filter({ hasText: /^Removed/ });
    this.addedAffectsBadge = this.page.locator('.affects-toolbar .badges div').filter({ hasText: /^Added/ });

    // Module filters - the collapsible section with module buttons
    this.moduleFiltersToggle = this.page.getByText('Affected Module Filters');
    this.clearModuleFiltersButton = this.page.locator('.affect-modules-selection').getByRole('button', { name: 'Clear Filters' });

    // Legacy locators for backwards compatibility
    this.addAffectButton = this.addNewAffectButton;
    this.affectModuleBox = this.affectsTable.locator('tbody tr.editing td').nth(2);
    this.affectComponentBox = this.affectsTable.locator('tbody tr.editing td').nth(3);
    this.affectAffectednessBox = this.affectsTable.locator('tbody tr.editing td').nth(5);
    this.affectResolutionBox = this.affectsTable.locator('tbody tr.editing td').nth(7);
    this.affectImpactBox = this.affectsTable.locator('tbody tr.editing td').nth(8);
    this.affectCommitButton = this.commitEditButton;
    this.submitButton = page.getByRole('button', { name: 'Save Changes', exact: true });
  }

  private async addPublicComment() {
    await this.publicCommentTab.click();
    await this.publicCommentButton.click();
    await this.fillTextArea(this.publicCommentBox, faker.hacker.phrase());
    await this.savePublicCommentBox.click();
  }

  private async addPrivateComment() {
    await this.privateCommentTab.click();
    await this.privateCommentButton.click();
    await this.fillTextArea(this.privateCommentBox, faker.hacker.phrase());
    await this.savePrivateCommentBox.click();
  }

  private async addInternalComment() {
    await this.internalCommentTab.click();
    await this.internalCommentButton.click();
    await this.fillTextArea(this.internalCommentBox, faker.hacker.phrase());
    await this.saveInternalCommentBox.click();
  }

  async addComment(type: CommentType) {
    switch (type) {
      case 'public':
        await this.addPublicComment();
        break;
      case 'private':
        await this.addPrivateComment();
        break;
      case 'internal':
        await this.addInternalComment();
        break;
    }
  }

  async getAffectCount(): Promise<number> {
    return await this.affectRows.count();
  }

  getAffectRow(index: number): Locator {
    return this.affectRows.nth(index);
  }

  getNewAffectRow(): Locator {
    return this.affectsTable.locator('tbody tr.new').first();
  }

  getEditingAffectRow(): Locator {
    return this.affectsTable.locator('tbody tr.editing').first();
  }

  async waitForAffectsLoaded() {
    // Wait for the "Fetching affects..." text to disappear (if present)
    const loadingText = this.page.getByText('Fetching affects...');
    // First check if loading is visible, then wait for it to disappear
    const isLoading = await loadingText.isVisible().catch(() => false);
    if (isLoading) {
      await loadingText.waitFor({ state: 'hidden', timeout: 60000 });
    }
    // Now wait for either:
    // 1. The Add New Affect button (affects section loaded)
    // 2. Or "This flaw has no affects" message
    await Promise.race([
      this.addNewAffectButton.waitFor({ state: 'visible', timeout: 30000 }),
      this.noAffectsMessage.waitFor({ state: 'visible', timeout: 30000 }),
    ]).catch(() => {
      // One of them should be visible
    });
  }

  async scrollToAffectsSection() {
    // Scroll to the "Affected Offerings" heading
    const heading = this.page.getByRole('heading', { name: 'Affected Offerings' });
    await heading.scrollIntoViewIfNeeded();
  }

  async clickAddNewAffect() {
    // Use title attribute as primary selector, text as fallback
    const addButton = this.page.locator('button[title="Add new affect"], button:has-text("Add New Affect")').first();
    await addButton.click();
    // Wait for editing row to appear
    await this.page.locator('tr.editing').first().waitFor({ state: 'visible', timeout: 10000 });
  }

  async editAffectRow(index: number) {
    const row = this.getAffectRow(index);
    await row.locator('button[title="Edit affect"]').click();
  }

  async removeAffectRow(index: number) {
    const row = this.getAffectRow(index);
    await row.locator('button[title="Remove affect"]').click();
  }

  async recoverAffectRow(index: number) {
    const row = this.getAffectRow(index);
    await row.locator('button[title="Recover affect"]').click();
  }

  async commitAffectRow(index: number) {
    const row = this.getAffectRow(index);
    await row.locator('button[title="Commit edit"]').click();
  }

  async cancelAffectRow(index: number) {
    const row = this.getAffectRow(index);
    await row.locator('button[title="Cancel edit"]').click();
  }

  async revertAffectRow(index: number) {
    const row = this.getAffectRow(index);
    await row.locator('button[title="Discard changes (Revert)"]').click();
  }

  async selectAffectRow(index: number) {
    const row = this.getAffectRow(index);
    await row.locator('input[type="checkbox"]').click();
  }

  async isAffectRowSelected(index: number): Promise<boolean> {
    const row = this.getAffectRow(index);
    return await row.locator('input[type="checkbox"]').isChecked();
  }

  /**
   * Fill a field in an affect row.
   * Column indices (0-indexed):
   * 0=Checkbox, 1=State, 2=Module, 3=Component, 4=PURL, 5=Affectedness, 6=Justification, 7=Resolution, 8=Impact, 9=CVSS, 10=Trackers, 11=Actions
   */
  async fillAffectField(row: Locator, columnName: string, value: string, isSelect = false) {
    // Map column names to indices
    // 0=Checkbox, 1=State, 2=Module, 3=Component, 4=PURL, 5=Affectedness, 6=Justification, 7=Resolution, 8=Impact
    const columnMap = new Map<string, number>([
      ['Module', 2],
      ['Component', 3],
      ['PURL', 4],
      ['Affectedness', 5],
      ['Justification', 6],
      ['Resolution', 7],
      ['Impact', 8],
    ]);

    const columnIndex = columnMap.get(columnName);
    if (columnIndex === undefined) {
      throw new Error(`Column "${columnName}" not found in mapping`);
    }

    const cell = row.locator('td').nth(columnIndex);

    if (isSelect) {
      const select = cell.locator('select');
      await select.waitFor({ state: 'visible', timeout: 5000 });
      await select.selectOption(value);
    } else {
      const input = cell.locator('input');
      await input.waitFor({ state: 'visible', timeout: 5000 });
      await input.fill(value);
    }
  }

  async addAffect(productStream = 'rhel-8', component = 'kernel') {
    // Scroll to Affected Offerings section first
    const heading = this.page.getByRole('heading', { name: 'Affected Offerings' });
    await heading.scrollIntoViewIfNeeded();

    // Click Add new affect button (icon-only button with title)
    const addButton = this.page.locator('button[title="Add new affect"]');
    await addButton.waitFor({ state: 'visible', timeout: 30000 });
    await addButton.click();

    // Wait for new row to appear (use last() in case there are multiple new rows)
    const newRow = this.page.locator('tr.new').last();
    await newRow.waitFor({ state: 'visible', timeout: 10000 });

    // New table uses inline editing - double-click on cell to edit
    // Column indices: 0=checkbox, 1=Related CVEs, 2=Label, 3=Product Stream, 4=Module, 5=Component

    // Edit Product Stream (column 3) - this is the required ps_update_stream field
    const productStreamCell = newRow.locator('td').nth(3);
    await productStreamCell.dblclick();
    let textInput = this.page.locator('table input[type="text"]:visible').first();
    await textInput.waitFor({ state: 'visible', timeout: 5000 });
    await textInput.fill(productStream);
    await textInput.press('Escape');

    // Wait for input to close
    await this.page.waitForTimeout(300);

    // Edit Component (column 5) - explicitly double-click to edit
    const componentCell = newRow.locator('td').nth(5);
    await componentCell.dblclick();
    textInput = this.page.locator('table input[type="text"]:visible').first();
    await textInput.waitFor({ state: 'visible', timeout: 5000 });
    await textInput.fill(component);
    await textInput.press('Escape');

    // Wait for edit to complete
    await this.page.waitForTimeout(500);
  }

  async addAffectWithoutCommit(module = 'rhel-8', component = 'kernel', options?: Partial<AffectData>) {
    await this.clickAddNewAffect();

    const newRow = this.getEditingAffectRow();

    // Fill Module
    await this.fillAffectField(newRow, 'Module', module);

    // Fill Component
    await this.fillAffectField(newRow, 'Component', component);

    // Fill Affectedness (default to AFFECTED)
    const affectedness = options?.affectedness ?? 'AFFECTED';
    if (affectedness) {
      await this.fillAffectField(newRow, 'Affectedness', affectedness, true);
    }

    // Fill Resolution (default to DELEGATED for AFFECTED)
    const resolution = options?.resolution ?? (affectedness === 'AFFECTED' ? 'DELEGATED' : '');
    if (resolution) {
      await this.fillAffectField(newRow, 'Resolution', resolution, true);
    }

    // Fill Impact (default to LOW)
    const impact = options?.impact ?? 'LOW';
    if (impact) {
      await this.fillAffectField(newRow, 'Impact', impact, true);
    }
  }

  async editAffectFields(index: number, data: Partial<AffectData>) {
    await this.editAffectRow(index);

    const row = this.getEditingAffectRow();

    if (data.module) {
      await this.fillAffectField(row, 'Module', data.module);
    }

    if (data.component) {
      await this.fillAffectField(row, 'Component', data.component);
    }

    if (data.affectedness) {
      await this.fillAffectField(row, 'Affectedness', data.affectedness, true);
    }

    if (data.resolution) {
      await this.fillAffectField(row, 'Resolution', data.resolution, true);
    }

    if (data.impact) {
      await this.fillAffectField(row, 'Impact', data.impact, true);
    }
  }

  async getAffectFieldValue(index: number, columnName: string): Promise<string> {
    const columnMap = new Map<string, number>([
      ['Module', 2],
      ['Component', 3],
      ['PURL', 4],
      ['Affectedness', 5],
      ['Justification', 6],
      ['Resolution', 7],
      ['Impact', 8],
    ]);

    const columnIndex = columnMap.get(columnName);
    if (columnIndex === undefined) {
      throw new Error(`Column "${columnName}" not found in mapping`);
    }

    const row = this.getAffectRow(index);
    const cell = row.locator('td').nth(columnIndex);
    // Get text from span if present (non-editing mode), otherwise cell text
    const span = cell.locator('span').first();
    if (await span.isVisible().catch(() => false)) {
      return (await span.textContent()) ?? '';
    }
    return (await cell.textContent()) ?? '';
  }

  async isAffectRowInState(index: number, state: 'new' | 'modified' | 'removed' | 'editing'): Promise<boolean> {
    const row = this.getAffectRow(index);
    return await row.evaluate((el, s) => el.classList.contains(s), state);
  }

  async filterByModule(moduleName: string) {
    const moduleButton = this.page.locator('.affect-modules-selection .module-btn').filter({ hasText: moduleName });
    await moduleButton.click();
  }

  async clearModuleFilters() {
    const clearBtn = this.page.locator('.affect-modules-selection').getByRole('button', { name: 'Clear Filters' });
    if (await clearBtn.isVisible()) {
      await clearBtn.click();
    }
  }

  async getModuleNames(): Promise<string[]> {
    const buttons = this.page.locator('.affect-modules-selection .module-btn');
    const count = await buttons.count();
    const names: string[] = [];

    for (let i = 0; i < count; i++) {
      const text = await buttons.nth(i).textContent();
      if (text) names.push(text.trim());
    }

    return names;
  }

  /**
   * Polls the API each second until the Jira task key is found.
   * Each attempt waits for the number of seconds equal to the attempt number. (Triangular number)
   * Maximum of 10 attempts or 55 seconds.
   *
   * @throws {Error} If the Jira task key is not found after 10 attempts.
   */
  async waitForJiraTask(uuid: string) {
    // If the flaw already has a Jira task, there is no need to wait for it to be created.
    if (!(await this.createJiraTaskButton.isVisible())) {
      return;
    }

    for (let i = 0; i < 10; i++) {
      const flaw = await getFlawFromAPI(uuid, ['task_key']);
      if (flaw.task_key) {
        await this.page.reload();
        return;
      }
      await sleep(1_000 * (i + 1));
    }
    throw new Error('Jira link not found');
  }
}
