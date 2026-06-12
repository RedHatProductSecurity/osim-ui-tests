import type { Locator, Page } from '@playwright/test';
import { FlawCreatePage } from './flawCreate';
import { faker } from '@faker-js/faker';
import { getFlawFromAPI, sleep } from 'playwright/helpers';

export type CommentType = 'public' | 'private' | 'internal';
export type Affectedness = 'NEW' | 'AFFECTED' | 'NOTAFFECTED' | '';
export type Resolution = 'FIX' | 'DEFER' | 'WONTFIX' | 'OOSS' | 'DELEGATED' | 'WONTREPORT' | '';
export type AffectImpact = 'LOW' | 'MODERATE' | 'IMPORTANT' | 'CRITICAL' | '';

export interface AffectData {
  productStream?: string;
  module?: string;
  component?: string;
  purl?: string;
  affectedness?: Affectedness;
  resolution?: Resolution;
  impact?: AffectImpact;
}

/**
 * Column indices for the affects table based on OSIM's columnDefinitions.tsx:
 * 0=Checkbox, 1=Related CVEs, 2=Label, 3=Product Stream, 4=Module, 5=Component,
 * 6=Analyzed Component (PURL), 7=Subpackage PURLs, 8=Affectedness,
 * 9=Not Affected Justification, 10=Resolution, 11=Impact, 12+=CVSS/Trackers/Actions
 */
export const AFFECT_COLUMN_MAP = {
  'Product Stream': 3,
  'Module': 4,
  'Component': 5,
  'PURL': 6,
  'Affectedness': 8,
  'Justification': 9,
  'Resolution': 10,
  'Impact': 11,
} as const;

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

  // Optional field locators
  readonly cweBox: Locator;
  readonly reportedDateBox: Locator;
  readonly unassignButton: Locator;

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

    // Affects section - the div with id "affected-offerings" inside FlawForm
    this.affectsSection = this.page.locator('#affected-offerings');
    this.affectsTable = this.page.locator('#affected-offerings table');
    this.affectRows = this.affectsTable.locator('tbody tr');

    // Add New Affect button - use both title and text selectors
    this.addNewAffectButton = this.page.locator('button[title="Add new affect"], button:has-text("Add New Affect")').first();
    this.noAffectsMessage = this.page.getByText('This flaw has no affects');

    // Affect row action buttons - use title attributes for specificity
    this.editAffectButton = this.page.locator('button[title="Remove affect"]'); // legacy; cells are edited by dblclick in current UI
    this.removeAffectButton = this.page.locator('button[title="Remove affect"]');
    this.commitEditButton = this.page.locator('button[title="Apply changes to selected affects"]');
    this.cancelEditButton = this.page.locator('button[title="Cancel bulk edit"]');
    this.recoverAffectButton = this.page.locator('button[title="Revert changes"]');
    this.revertChangesButton = this.page.locator('button[title="Revert changes"]');

    // Bulk affect actions in affects-table-actions toolbar
    this.manageTrackersButton = this.page.locator('button.trackers-btn');
    this.editSelectedButton = this.page.locator('button[title="Bulk edit selected affects"]');
    this.removeSelectedButton = this.page.locator('button[title="Remove selected affects"]');
    this.commitAllButton = this.page.locator('button[title="Apply changes to selected affects"]');
    this.cancelAllButton = this.page.locator('button[title="Cancel bulk edit"]');
    this.revertAllButton = this.page.locator('button[title="Revert ALL changes"]');
    this.recoverAllButton = this.page.locator('button[title="Revert changes"]');

    // Affect count badge — actual DOM text from PaginationControls.vue: "Show All (N)"
    this.showAllAffectsBadge = this.page.getByText(/Show All \(\d+\)/);
    this.selectedAffectsBadge = this.page.locator('#affected-offerings').getByText(/\d+ Selected/);
    this.editingAffectsBadge = this.page.locator('#affected-offerings').getByText(/Editing/);
    this.modifiedAffectsBadge = this.page.locator('#affected-offerings').getByText(/Modified/);
    this.removedAffectsBadge = this.page.locator('#affected-offerings').getByText(/Removed/);
    this.addedAffectsBadge = this.page.locator('#affected-offerings').getByText(/Added/);

    this.submitButton = page.getByRole('button', { name: 'Save Changes', exact: true });

    // Optional fields
    this.cweBox = page.locator('label').filter({ hasText: 'CWE ID' });
    this.reportedDateBox = page.locator('label').filter({ hasText: 'Reported Date' });
    this.unassignButton = page.getByRole('button', { name: 'Unassign' });
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

  getEditingAffectRow(): Locator {
    return this.affectsTable.locator('tbody tr.new').first();
  }

  async scrollToAffectsSection() {
    // Scroll to the "Affected Offerings" heading
    const heading = this.page.getByRole('heading', { name: 'Affected Offerings' });
    await heading.scrollIntoViewIfNeeded();
  }

  async clickAddNewAffect() {
    await this.scrollToAffectsSection();
    await this.addNewAffectButton.click();
    // Wait for editing row to appear
    await this.affectsTable.locator('tbody tr.new').first().waitFor({ state: 'visible', timeout: 10000 });
  }

  /**
   * Fill a field in an affect row.
   */
  async fillAffectField(row: Locator, columnName: keyof typeof AFFECT_COLUMN_MAP, value: string, isSelect = false) {
    const columnIndex = AFFECT_COLUMN_MAP[columnName];

    const cell = row.locator('td').nth(columnIndex);

    // EditableCell starts in display mode (span); double-click to enter edit mode
    await cell.dblclick();

    if (isSelect) {
      const select = cell.locator('select');
      await select.waitFor({ state: 'visible', timeout: 5000 });
      await select.selectOption(value);
      await select.press('Enter');
    } else {
      const input = cell.locator('input');
      await input.waitFor({ state: 'visible', timeout: 5000 });
      await input.fill(value);
      await input.press('Enter');
    }
  }

  async addAffect(options: AffectData = {}) {
    const {
      productStream = 'rhel-8.10.0',
      module = 'rhel-8',
      component = 'kernel',
      purl,
      affectedness = 'AFFECTED',
      resolution,
      impact = 'LOW',
    } = options;

    await this.clickAddNewAffect();
    const newRow = this.getEditingAffectRow();

    // Fill Product Stream (required)
    await this.fillAffectField(newRow, 'Product Stream', productStream);

    // Fill Module
    await this.fillAffectField(newRow, 'Module', module);

    // Fill Component (required)
    await this.fillAffectField(newRow, 'Component', component);

    // Fill PURL/Analyzed Component (required by OSIDB)
    await this.fillAffectField(newRow, 'PURL', purl ?? `pkg:rpm/redhat/${component}`);

    // Fill Affectedness
    if (affectedness) {
      await this.fillAffectField(newRow, 'Affectedness', affectedness, true);
    }

    // Fill Resolution (default to DELEGATED for AFFECTED)
    const resolvedResolution = resolution ?? (affectedness === 'AFFECTED' ? 'DELEGATED' : '');
    if (resolvedResolution) {
      await this.fillAffectField(newRow, 'Resolution', resolvedResolution, true);
    }

    // Fill Impact
    if (impact) {
      await this.fillAffectField(newRow, 'Impact', impact, true);
    }
  }

  /**
   * Polls the API each second until the Jira task key is found.
   * Each attempt waits for the number of seconds equal to the attempt number. (Triangular number)
   * Maximum of 15 attempts or 120 seconds.
   *
   * @throws {Error} If the Jira task key is not found after 15 attempts.
   */
  async waitForJiraTask(uuid: string) {
    // If the flaw already has a Jira task, there is no need to wait for it to be created.
    if (!(await this.createJiraTaskButton.isVisible())) {
      return;
    }

    // 15 attempts with increasing delay: 1s, 2s, 3s, ... 15s (total max wait: 120s)
    for (let i = 0; i < 15; i++) {
      const flaw = await getFlawFromAPI(uuid, ['task_key']);
      if (flaw.task_key) {
        await this.page.reload();
        return;
      }
      await sleep(1_000 * (i + 1));
    }
    throw new Error('Jira link not found');
  }

  async fillCweId(cweId: string) {
    await this.fillTextBox(this.cweBox, cweId);
  }

  async fillReportedDate(date: string) {
    await this.fillTextBox(this.reportedDateBox, date);
  }

  async selfAssign() {
    if (await this.selfAssingBtn.isVisible()) {
      await this.selfAssingBtn.click();
    }
  }

  async unassign() {
    if (await this.unassignButton.isVisible()) {
      await this.unassignButton.click();
    }
  }
}
