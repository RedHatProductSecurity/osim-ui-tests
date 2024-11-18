import { test as base } from '@playwright/test';
import { FlawCreatePage } from '../pages/flawCreate';
import { FlawEditPage } from '../pages/flawEdit';

interface Fixtures {
  flawCreatePage: FlawCreatePage;
  flawEditPage: FlawEditPage;
}

export const test = base.extend<Fixtures>({
  flawCreatePage: async ({ page }, use) => {
    const flawCreatePage = new FlawCreatePage(page);
    await flawCreatePage.goto();

    await use(flawCreatePage);
  },
  flawEditPage: async ({ page }, use) => {
    const flawEditPage = new FlawEditPage(page);

    await use(flawEditPage);
  },
});

export { expect } from '@playwright/test';
