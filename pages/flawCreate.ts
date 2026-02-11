import type { Locator, Page } from '@playwright/test';
import { faker } from '@faker-js/faker';
import { authenticate, dayjs, osidbBaseUrl } from '../playwright/helpers';

export type FlawType = 'embargoed' | 'public';

export class FlawCreatePage {
  readonly id: string;
  submitButton: Locator;
  // required fields
  readonly titleBox: Locator;
  readonly componentsBox: Locator;
  readonly impactBox: Locator;
  readonly sourceBox: Locator;
  readonly comment0Box: Locator;
  readonly publicDateBox: Locator;
  // optional fields
  readonly embargoedCheckbox: Locator;
  readonly CVEBox: Locator;
  readonly incidentBox: Locator;
  readonly statementBox: Locator;
  readonly mitigationBox: Locator;
  readonly descriptionBox: Locator;
  readonly reviewStatusBox: Locator;
  readonly selfAssingBtn: Locator;
  readonly cvssCalculatorInput: Locator;
  readonly cvssCalculator: Locator;
  constructor(public readonly page: Page) {
    this.id = faker.string.alphanumeric({ length: 5, casing: 'upper' });

    this.titleBox = page.locator('.osim-input').filter({ hasText: 'Title' });
    this.componentsBox = page.locator('label').filter({ hasText: 'Source Component' });
    this.impactBox = page.locator('label').filter({ hasText: 'Impact' });
    this.sourceBox = page.locator('label').filter({ hasText: 'CVE Source' });
    this.comment0Box = page.locator('label').filter({ hasText: 'Comment#0' });
    this.publicDateBox = page.locator('label').filter({ hasText: 'Public Date' });

    this.embargoedCheckbox = page.locator('label').filter({ hasText: 'Embargoed' });
    this.CVEBox = page.locator('label').filter({ hasText: 'CVE ID' });
    this.incidentBox = page.locator('label').filter({ hasText: 'Incident State' });
    this.statementBox = page.locator('label').filter({ hasText: 'Statement' });
    this.mitigationBox = page.locator('label').filter({ hasText: 'Mitigation' });
    this.selfAssingBtn = page.getByRole('button', { name: 'Self Assign' });
    this.descriptionBox = page.locator('label').filter({ hasText: 'Description' });
    this.reviewStatusBox = page.locator('label').filter({ hasText: 'Description' });
    this.cvssCalculatorInput = page.locator('label[role="red-hat-cvss"]');
    this.cvssCalculator = page.locator('.cvss-calculator');

    this.submitButton = page.getByRole('button', { name: 'Create New Flaw' });
  }

  async goto() {
    // Go to index first to let the app fully initialize
    await this.page.goto('/');
    await this.page.waitForSelector('text=Loaded', { timeout: 30000 });

    // Navigate via UI click instead of direct URL to avoid guard timing issues
    await this.page.getByRole('link', { name: 'Create Flaw' }).click();
    await this.page.waitForLoadState('networkidle');

    // If redirected to settings (API keys missing), fill in keys and retry
    if (this.page.url().includes('/settings')) {
      const bugzillaInput = this.page.getByLabel('Bugzilla API Key');
      const jiraInput = this.page.getByLabel('JIRA API Key');

      await bugzillaInput.waitFor({ state: 'visible', timeout: 5000 });

      if (process.env.BUGZILLA_API_KEY) {
        await bugzillaInput.fill(process.env.BUGZILLA_API_KEY);
      }
      if (process.env.JIRA_API_KEY) {
        await jiraInput.fill(process.env.JIRA_API_KEY);
      }

      await this.page.getByRole('button', { name: 'Save Settings' }).click();
      await this.page.waitForTimeout(1000);
      await this.page.getByRole('link', { name: 'Create Flaw' }).click();
    }
  }

  async fillTextBox(locator: Locator, text: string) {
    await this.fillTextArea(locator, text);
    // We need to focus on another element to trigger the validation.
    await this.submitButton.focus();
  }

  async fillTextArea(locator: Locator, text: string) {
    await locator.click();
    await locator.getByRole('textbox').fill(text);
  }

  async fillCVSSCalculator() {
    await this.cvssCalculatorInput.click();
    for (const metric of ['Attack Vector', 'Attack Complexity', 'Privileges Required', 'User Interaction', 'Scope', 'Confidentiality', 'Integrity', 'Availability']) {
      const scores = this.cvssCalculator.locator('div', { hasText: metric }).last().locator('button').filter({ hasNotText: metric });
      const scoreCount = await scores.count();
      const score = faker.number.int({ min: 1, max: scoreCount - 1 });

      await scores.nth(score).scrollIntoViewIfNeeded();
      await scores.nth(score).click();
    }
  }

  async fillSelect(locator: Locator, text: string) {
    await locator.click();
    await locator.locator('select').selectOption({ label: text });
  }

  async fillRequired(withPublicDate = true) {
    await this.fillTextBox(this.titleBox, 'Test flaw ' + this.id);
    await this.fillTextBox(this.componentsBox, 'e2e');
    await this.fillTextBox(this.componentsBox, this.id);
    await this.fillSelect(this.impactBox, 'LOW');
    await this.fillSelect(this.sourceBox, 'REDHAT');
    await this.fillTextArea(this.comment0Box, faker.hacker.phrase());
    if (withPublicDate) {
      await this.fillTextBox(this.publicDateBox, dayjs().subtract(5, 'minutes').format('YYYY-MM-DD HH:mm'));
    }
  }

  async fillOptional() {
    await this.fillTextBox(this.CVEBox, `CVE-${faker.number.int({ min: 2100, max: 2999 })}-${faker.number.int({ max: 9999 }).toString().padStart(4, '0')}`);
    await this.fillSelect(this.incidentBox, 'Minor Incident Approved');
    await this.fillTextArea(this.statementBox, faker.hacker.phrase());
    await this.fillTextArea(this.mitigationBox, faker.hacker.phrase());
    await this.fillTextArea(this.descriptionBox, faker.hacker.phrase());
    await this.fillSelect(this.reviewStatusBox, 'REQUESTED');
    await this.fillCVSSCalculator();
    await this.selfAssingBtn.click();
  }

  async createFlaw(options: { type: FlawType; full?: boolean }) {
    await this.fillRequired(options.type === 'public');
    if (options.type === 'embargoed') {
      await this.embargoedCheckbox.check();
    }
    if (options.full) {
      await this.fillOptional();
    }
    await this.submitButton.click();
  }

  static async createFlawWithAPI(options: { embargoed?: boolean } = {}): Promise<string> {
    const { access } = await authenticate();
    const { embargoed = false } = options;

    const flawId = faker.string.alphanumeric({ length: 5, casing: 'upper' });
    const flaw: Record<string, unknown> = {
      impact: '',
      components: ['e2e', flawId],
      title: 'Test flaw ' + flawId,
      classification: {
        workflow: 'DEFAULT',
        state: 'NEW',
      },
      comment_zero: faker.hacker.phrase(),
      source: 'REDHAT',
      embargoed,
      reported_dt: dayjs().utc().format('YYYY-MM-DDTHH:mm:ss.SSS[Z]'),
      // Set owner so "My Issues" filter works in CI
      owner: process.env.JIRA_USERNAME || '',
    };

    // Only set unembargo_dt for public flaws
    if (!embargoed) {
      flaw.unembargo_dt = dayjs().utc().subtract(5, 'minutes').format('YYYY-MM-DDTHH:mm:ss.SSS[Z]');
    }

    const resp = await fetch(`${osidbBaseUrl()}/osidb/api/v1/flaws`, {
      headers: {
        'Authorization': 'Bearer ' + access,
        'bugzilla-api-key': process.env.BUGZILLA_API_KEY || '',
        'content-type': 'application/json',
        'jira-api-key': process.env.JIRA_API_KEY || '',
      },
      body: JSON.stringify(flaw),
      method: 'POST',
    });

    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`Failed to create flaw: ${resp.status} ${resp.statusText} - ${text}`);
    }

    const data = await resp.json() as { uuid: string };
    if (!data.uuid) {
      throw new Error(`Flaw creation returned no UUID: ${JSON.stringify(data)}`);
    }

    return data.uuid;
  }
}
