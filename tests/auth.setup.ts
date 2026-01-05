import { test as setup } from '@playwright/test';
import { authenticate, saveStorage, saveApiKeysToBackend } from '../playwright/helpers';

// Use http for localhost (CI), https otherwise
const osimUrl = process.env.OSIM_URL || '';
const osimProtocol = osimUrl.startsWith('localhost') || osimUrl.startsWith('127.0.0.1') ? 'http' : 'https';

/**
 * Authenticate with the OSIDB API and save the tokens in the local storage
 *
 * References:
 *  - https://github.com/RedHatProductSecurity/osim/blob/main/src/stores/AuthStore.ts
 *  - https://github.com/RedHatProductSecurity/osim/blob/main/src/stores/UserStore.ts
 */
setup('authenticate', async ({ baseURL }) => {
  const { refresh, cookies } = await authenticate();

  // Save API keys to backend so they're available when OSIM loads
  // Skip in CI (ephemeral OSIDB) as the /osidb/integrations endpoint may not be available
  if (!process.env.CI) {
    const apiKeys: { bugzilla?: string; jira?: string } = {};
    if (process.env.BUGZILLA_API_KEY) {
      apiKeys.bugzilla = process.env.BUGZILLA_API_KEY;
    }
    if (process.env.JIRA_API_KEY) {
      apiKeys.jira = process.env.JIRA_API_KEY;
    }

    if (Object.keys(apiKeys).length > 0) {
      try {
        await saveApiKeysToBackend(apiKeys);
      } catch (error) {
        console.warn('WARNING: Failed to save API keys to backend:', error);
      }
    } else {
      console.warn('WARNING: No API keys found in environment variables (BUGZILLA_API_KEY, JIRA_API_KEY)');
    }
  }

  // Convert cookie strings to cookie objects for Playwright
  const cookieObjects = cookies.map((cookieStr) => {
    const [nameValue, ...attributes] = cookieStr.split(';');
    const [name, value] = nameValue.split('=');
    const cookie: {
      name: string;
      value: string;
      domain: string;
      path: string;
      expires: number;
      httpOnly: boolean;
      secure: boolean;
      sameSite: 'Strict' | 'Lax' | 'None';
    } = {
      name: name.trim(),
      value: value.trim() || '',
      domain: (process.env.OSIDB_URL || 'localhost').split(':')[0],
      path: '/',
      expires: Math.floor(Date.now() / 1000) + 86400, // 24 hours from now
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    };

    // Parse additional cookie attributes
    attributes.forEach((attr) => {
      const [key, val] = attr.split('=');
      const trimmedKey = key.trim().toLowerCase();
      if (trimmedKey === 'domain' && val) cookie.domain = val.trim();
      if (trimmedKey === 'path' && val) cookie.path = val.trim();
      if (trimmedKey === 'httponly') cookie.httpOnly = true;
      if (trimmedKey === 'secure') cookie.secure = true;
      if (trimmedKey === 'samesite' && val) cookie.sameSite = val.trim() as 'Strict' | 'Lax' | 'None';
    });

    return cookie;
  });

  await saveStorage({
    cookies: cookieObjects,
    origins: [
      {
        origin: baseURL ?? `${osimProtocol}://${osimUrl}`,
        localStorage: [
          {
            name: 'AuthStore::isLoggedIn',
            value: 'true',
          },
          {
            name: 'AuthStore::refresh',
            value: refresh,
          },
          // UserStore for user info
          {
            name: 'UserStore',
            value: JSON.stringify({
              env: 'dev',
              whoami: null,
              jiraUsername: process.env.JIRA_USERNAME || '',
            }),
          },
          {
            name: 'OSIM::USER-SETTINGS',
            value: JSON.stringify({
              showNotifications: true,
              affectsPerPage: 10,
              trackersPerPage: 10,
              isHidingLabels: false,
              privacyNoticeShown: true,
              aiUsageNoticeShown: true,
              unifiedCommentsView: false,
              affectsColumnWidths: [],
              trackersColumnWidths: [],
              affectsColumnOrder: [],
              affectsGrouping: false,
              affectsSizing: {},
              affectsVisibility: {},
              toursNotificationShown: ['affects-v2'],
            }),
          },
          {
            // Dev mode fallback: API keys stored separately (not in USER-SETTINGS which gets zod-validated)
            // OSIM reads from this key when the backend /osidb/integrations call fails in dev mode
            name: 'OSIM::DEV-API-KEYS',
            value: JSON.stringify({
              bugzillaApiKey: process.env.BUGZILLA_API_KEY || 'fake-bz-key',
              jiraApiKey: process.env.JIRA_API_KEY || 'fake-jira-key',
            }),
          },
        ],
      },
    ],
  });
});
