import { test, expect } from '@playwright/test';
import { loadStorage } from 'playwright/helpers';

interface UserSettings {
  showNotifications: boolean;
  affectsPerPage: number;
  trackersPerPage: number;
  isHidingLabels: boolean;
  privacyNoticeShown: boolean;
  aiUsageNoticeShown: boolean;
  unifiedCommentsView: boolean;
  affectsColumnWidths: number[];
  trackersColumnWidths: number[];
}

// Disable privacy notice shown flag for testing
test.use({
  // eslint-disable-next-line no-empty-pattern
  storageState: async ({ }, use) => {
    const state = await loadStorage();
    const index = state.origins[0].localStorage.findIndex(item => item.name === 'OSIM::USER-SETTINGS');

    const userSettings = JSON.parse(state.origins[0].localStorage[index].value) as UserSettings;
    userSettings.privacyNoticeShown = false;
    state.origins[0].localStorage[index].value = JSON.stringify(userSettings);

    await use(state);
  },
});

test.beforeEach(async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: 'Current User' }).click();
  await page.getByRole('link', { name: 'Settings' }).click();
});

test('load setting page', async ({ page }) => {
  await expect(page).toHaveTitle(/Settings/);
});

test('configure api keys', async ({ page }) => {
  await page.getByLabel('Bugzilla API Key Please').fill(process.env.BUGZILLA_API_KEY);
  await page.getByLabel('JIRA API Key Please').fill(process.env.JIRA_API_KEY);

  await expect(page.getByRole('button', { name: 'Current User' })).toContainText(process.env.JIRA_USERNAME);
});

test('shows privacy notice toast only once', async ({ page }) => {
  await expect(page.getByText('Privacy Notice')).toBeVisible();
  await page.reload();
  await page.waitForLoadState('load');

  await expect(page.getByText('Privacy Notice')).not.toBeVisible();
});
