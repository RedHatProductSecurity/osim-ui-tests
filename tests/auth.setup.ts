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
  const { refresh, cookies } = await authenticate();

  // Test fixture: always save refresh token for test environment
  const userStoreData = {
    env: 'test',
    whoami: null,
    jiraUsername: process.env.JIRA_USERNAME || '',
    isLoggedIn: true,
    refresh,
  };

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
      domain: process.env.OSIDB_URL.split('/')[0] || 'localhost',
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
        origin: baseURL ?? process.env.OSIM_URL,
        localStorage: [
          {
            name: 'UserStore',
            value: JSON.stringify(userStoreData),
          },
          {
            name: 'OSIM::USER-SETTINGS',
            value: JSON.stringify({
              showNotifications: false,
              affectsPerPage: 10,
              trackersPerPage: 10,
              isHidingLabels: false,
              privacyNoticeShown: true,
              aiUsageNoticeShown: true,
              unifiedCommentsView: false,
              affectsColumnWidths: [],
              trackersColumnWidths: [],
            }),
          },
        ],
      },
    ],
  });
});
