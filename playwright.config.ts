import { defineConfig, devices, type Project } from '@playwright/test';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const browsers: Project[] = [
  {
    name: 'firefox',
    use: {
      ...devices['Desktop Firefox'],
      launchOptions: {
        firefoxUserPrefs: {
          'network.negotiate-auth.trusted-uris': '.redhat.com',
        },
      },
    },
  },
  {
    name: 'chromium',
    use: {
      ...devices['Desktop Chrome'],
      launchOptions: {
        args: ['--auth-server-whitelist="*.redhat.com"'],
      },
    },
  },
];

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    storageState: 'playwright/.auth/user.json',
    ignoreHTTPSErrors: true,
    trace: 'on-first-retry',
    baseURL: `https://${process.env.OSIM_URL}`,
  },
  timeout: 60000,
  expect: {
    timeout: 20000,
  },
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    ...browsers.map(browser => ({
      name: browser.name,
      use: {
        ...browser.use,
      },
      dependencies: ['setup'],
    })),
  ],
});
