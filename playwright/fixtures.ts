import { test as base } from '@playwright/test';
import { FlawCreatePage } from '../pages/flawCreate';
import { FlawEditPage } from '../pages/flawEdit';
import { FlawSearchPage } from '../pages/flawSearch';

interface Fixtures {
  flawCreatePage: FlawCreatePage;
  flawEditPage: FlawEditPage;
  flawSearchPage: FlawSearchPage;
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
  flawSearchPage: async ({ page }, use) => {
    const flawSearchPage = new FlawSearchPage(page);
    await flawSearchPage.gotoSearchPage();

    await use(flawSearchPage);
  },
});

export { expect } from '@playwright/test';
