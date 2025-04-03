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

    this.addAffectButton = this.page.getByRole('button', { name: 'Add New Affect' });
    this.editAffectButton = this.page.getByTitle('Edit affect');
    this.affectModuleBox = this.page.getByRole('cell', { name: /Module\d+/ }).getByRole('textbox');
    this.affectComponentBox = this.page.getByRole('cell', { name: /Component\d+/ }).getByRole('textbox');
    this.affectAffectednessBox = this.page.getByRole('cell', { name: 'NEW', exact: true }).getByRole('combobox');
    this.affectResolutionBox = this.page.locator('td').filter({ hasText: 'DEFER' }).getByRole('combobox');
    this.affectImpactBox = this.page.locator('td').filter({ hasText: 'LOW' }).getByRole('combobox');
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

  async addAffect(module = 'rhel-8', component = 'kernel') {
    await this.addAffectButton.click();

    await this.affectModuleBox.fill(module);
    await this.affectComponentBox.fill(component);

    await this.affectAffectednessBox.selectOption('AFFECTED');
    await this.affectResolutionBox.selectOption('DEFER');
    await this.affectImpactBox.selectOption('LOW');
    await this.affectCommitButton.click();
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
