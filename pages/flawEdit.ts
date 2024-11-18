import type { Locator, Page } from '@playwright/test';
import { FlawCreatePage } from './flawCreate';
import { faker } from '@faker-js/faker';

export class FlawEditPage extends FlawCreatePage {
  public readonly publicCommentButton: Locator;
  public readonly publicCommentBox: Locator;
  public readonly savePublicCommentBox: Locator;

  constructor(page: Page) {
    super(page);
    this.publicCommentButton = this.page.getByRole('button', { name: 'Add Public Comment' });
    this.publicCommentBox = this.page.locator('label').filter({ hasText: 'New Public Comment' });
    this.savePublicCommentBox = this.page.getByRole('button', { name: 'Save Public Comment' });
    this.submitButton = page.getByRole('button', { name: 'Save Changes', exact: true });
  }

  async addPublicComment() {
    await this.publicCommentButton.click();
    await this.fillTextArea(this.publicCommentBox, faker.hacker.phrase());
    await this.savePublicCommentBox.click();
  }
}
