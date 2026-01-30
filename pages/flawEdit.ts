import type { Locator, Page } from '@playwright/test';
import { FlawCreatePage } from './flawCreate';
import { faker } from '@faker-js/faker';
import { getFlawFromAPI, sleep } from 'playwright/helpers';

export type CommentType = 'public' | 'private' | 'internal';

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
  readonly addAffectButton: Locator;
  readonly editAffectButton: Locator;
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

    // New TanStack-based Affects table (uses double-click to edit cells)
    this.addAffectButton = this.page.getByTitle('Add new affect');
    this.editAffectButton = this.page.getByTitle('Edit affect');
    this.affectModuleBox = this.page.locator('tbody tr.new td').nth(1); // Module column
    this.affectComponentBox = this.page.locator('tbody tr.new td').nth(2); // Component column
    this.affectAffectednessBox = this.page.locator('tbody tr.new td').nth(3); // Affectedness column
    this.affectResolutionBox = this.page.locator('tbody tr.new td').nth(4); // Resolution column
    this.affectImpactBox = this.page.locator('tbody tr.new td').nth(5); // Impact column
    this.affectCommitButton = this.page.getByTitle('Commit edit');
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

  async addAffect(stream = 'rhel-8.10.0', module = 'rhel-8', component = 'kernel') {
    await this.addAffectButton.click();

    // New row appears - double-click cells to edit (TanStack table)
    const newRow = this.page.locator('tbody tr.new').first();
    await newRow.waitFor({ state: 'visible' });

    // Helper to get column index by header text
    const getColumnIndex = async (headerText: string) => {
      const headers = this.page.locator('thead th');
      const count = await headers.count();
      for (let i = 0; i < count; i++) {
        const text = await headers.nth(i).textContent();
        if (text?.includes(headerText)) return i;
      }
      throw new Error(`Column "${headerText}" not found`);
    };

    // Edit Product Stream cell (required field)
    const streamIdx = await getColumnIndex('Product Stream');
    const streamCell = newRow.locator('td').nth(streamIdx);
    await streamCell.dblclick();
    await streamCell.locator('input').fill(stream);
    await streamCell.locator('input').press('Enter');

    // Edit Module cell (double-click to enter edit mode)
    const moduleIdx = await getColumnIndex('Module');
    const moduleCell = newRow.locator('td').nth(moduleIdx);
    await moduleCell.dblclick();
    await moduleCell.locator('input').fill(module);
    await moduleCell.locator('input').press('Enter');

    // Edit Component cell
    const componentIdx = await getColumnIndex('Component');
    const componentCell = newRow.locator('td').nth(componentIdx);
    await componentCell.dblclick();
    await componentCell.locator('input').fill(component);
    await componentCell.locator('input').press('Enter');

    // Edit Affectedness cell (dropdown)
    const affectednessIdx = await getColumnIndex('Affectedness');
    const affectednessCell = newRow.locator('td').nth(affectednessIdx);
    await affectednessCell.dblclick();
    await affectednessCell.locator('select').selectOption('AFFECTED');
    await affectednessCell.locator('select').blur();

    // Edit Resolution cell (dropdown)
    const resolutionIdx = await getColumnIndex('Resolution');
    const resolutionCell = newRow.locator('td').nth(resolutionIdx);
    await resolutionCell.dblclick();
    await resolutionCell.locator('select').selectOption('DELEGATED');
    await resolutionCell.locator('select').blur();

    // Edit Impact cell (dropdown)
    const impactIdx = await getColumnIndex('Impact');
    const impactCell = newRow.locator('td').nth(impactIdx);
    await impactCell.dblclick();
    await impactCell.locator('select').selectOption('LOW');
    await impactCell.locator('select').blur();
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
