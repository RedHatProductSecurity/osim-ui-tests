import { test as setup } from '@playwright/test';
import { authenticate, saveStorage } from '../playwright/helpers';

/**
 * Authenticate with the OSIDB API and save the tokens in the local storage
 *
 * References:
 *  - https://github.com/RedHatProductSecurity/osim/blob/main/src/stores/SettingsStore.ts
 *  - https://github.com/RedHatProductSecurity/osim/blob/main/src/stores/UserStore.ts
 */
setup('authenticate', async ({ baseURL }) => {
  const { refresh } = await authenticate();
  await saveStorage({
    origins: [
      {
        origin: baseURL ?? process.env.OSIM_URL,
        localStorage: [
          {
            name: 'UserStore',
            value: JSON.stringify({ refresh, jiraUsername: process.env.JIRA_USERNAME }),
          },
          {
            name: 'OSIM::USER-SETTINGS',
            value: JSON.stringify({
              jiraApiKey: process.env.JIRA_API_KEY,
              bugzillaApiKey: process.env.BUGZILLA_API_KEY,
              showNotifications: false,
              affectsPerPage: 10,
              trackersPerPage: 10,
            }),
          },
        ],
      },
    ],
  });
});
