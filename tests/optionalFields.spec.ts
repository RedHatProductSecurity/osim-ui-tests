import { test, expect } from '../playwright/fixtures';
import { FlawCreatePage } from '../pages/flawCreate';
import { faker } from '@faker-js/faker';

test.describe('optional flaw fields', () => {
  let flawId: string;

  test.beforeAll(async () => {
    flawId = await FlawCreatePage.createFlawWithAPI();
  });

  test.beforeEach(async ({ page }) => {
    await page.goto(`/flaws/${flawId}`);
    await expect(page.getByRole('button', { name: 'Save Changes', exact: true })).toBeVisible();
  });

  test.describe('CVE ID', () => {
    test('can add a CVE ID', async ({ page }) => {
      const cveId = `CVE-${faker.number.int({ min: 2100, max: 2999 })}-${faker.number.int({ max: 9999 }).toString().padStart(4, '0')}`;
      const cveIdField = page.locator('label').filter({ hasText: 'CVE ID' });

      await cveIdField.click();
      await cveIdField.getByRole('textbox').fill(cveId);
      await page.getByRole('button', { name: 'Save Changes', exact: true }).click();

      await expect(page.getByText('Flaw saved').first()).toBeVisible();
      await expect(cveIdField.locator('.osim-editable-text-value')).toHaveText(cveId);
    });

    test('validates invalid CVE ID format', async ({ page }) => {
      const cveIdField = page.locator('label').filter({ hasText: 'CVE ID' });

      await cveIdField.click();
      await cveIdField.getByRole('textbox').fill('invalid-cve');
      await page.getByRole('button', { name: 'Save Changes', exact: true }).focus();

      await expect(page.getByText(/CVE ID is invalid/i)).toBeVisible();
    });
  });

  test.describe('CWE ID', () => {
    test('can add a CWE ID', async ({ page }) => {
      const cweId = `CWE-${faker.number.int({ min: 1, max: 999 })}`;
      const cweField = page.locator('.osim-input').filter({ hasText: 'CWE ID' });

      await cweField.click();
      await cweField.getByRole('textbox').fill(cweId);
      await page.getByRole('button', { name: 'Save Changes', exact: true }).click();

      await expect(page.getByText('Flaw saved').first()).toBeVisible();
    });

    test('can clear CWE ID', async ({ page }) => {
      const cweField = page.locator('.osim-input').filter({ hasText: 'CWE ID' });

      // First add a CWE ID
      await cweField.click();
      await cweField.getByRole('textbox').fill('CWE-79');
      await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
      await expect(page.getByText('Flaw saved').first()).toBeVisible();

      // Then clear it
      await cweField.click();
      await cweField.getByRole('textbox').clear();
      await page.getByRole('button', { name: 'Save Changes', exact: true }).click();

      await expect(page.getByText('Flaw saved').first()).toBeVisible();
    });

    test('shows autocomplete suggestions when typing', async ({ page }) => {
      const cweField = page.locator('.osim-input').filter({ hasText: 'CWE ID' });

      await cweField.click();
      const textbox = cweField.getByRole('textbox');
      await textbox.clear();
      // Type slowly to trigger debounced input
      await textbox.pressSequentially('CWE-79', { delay: 100 });

      // Wait for debounce (500ms) + suggestions to load - dropdown renders at page level
      const suggestionsDropdown = page.locator('.menu.dropdown-menu');
      await expect(suggestionsDropdown).toBeVisible({ timeout: 10000 });

      // Verify suggestions contain CWE-79
      await expect(suggestionsDropdown.locator('.item').filter({ hasText: 'CWE-79' })).toBeVisible();
    });

    test('can select CWE from autocomplete suggestions', async ({ page }) => {
      const cweField = page.locator('.osim-input').filter({ hasText: 'CWE ID' });

      await cweField.click();
      const textbox = cweField.getByRole('textbox');
      await textbox.clear();
      // Type slowly to trigger debounced input
      await textbox.pressSequentially('CWE-79', { delay: 100 });

      // Wait for suggestions dropdown to appear - dropdown renders at page level
      const suggestionsDropdown = page.locator('.menu.dropdown-menu');
      await expect(suggestionsDropdown).toBeVisible({ timeout: 10000 });

      // Click the suggestion
      const suggestion = suggestionsDropdown.locator('.item').filter({ hasText: 'CWE-79' }).first();
      await suggestion.click();

      // Verify the field was filled
      await expect(cweField.locator('.osim-editable-text-value')).toHaveText('CWE-79');

      // Save and verify
      await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
      await expect(page.getByText('Flaw saved').first()).toBeVisible();
    });
  });

  test.describe('Incident State', () => {
    // Incident State field is only editable if the flaw already has one set
    // Each test creates its own flaw to avoid workflow transition conflicts
    const incidentStateTransitions = [
      { initial: 'MINOR_INCIDENT_REQUESTED', target: 'Minor Incident Approved' },
      { initial: 'MAJOR_INCIDENT_REQUESTED', target: 'Major Incident Approved' },
    ];

    for (const { initial, target } of incidentStateTransitions) {
      test(`can set ${target}`, async ({ page }) => {
        // Create a fresh flaw with the initial incident state
        const incidentFlawId = await FlawCreatePage.createFlawWithAPI({
          major_incident_state: initial,
        });

        // Navigate to the flaw
        await page.goto(`/flaws/${incidentFlawId}`);
        await expect(page.getByRole('button', { name: 'Save Changes', exact: true })).toBeVisible();

        const incidentField = page.locator('label').filter({ hasText: 'Incident State' });
        const selectElement = incidentField.locator('select');

        await incidentField.click();
        await selectElement.selectOption({ label: target });
        await page.getByRole('button', { name: 'Save Changes', exact: true }).click();

        await expect(page.getByText('Flaw saved').first()).toBeVisible();
      });
    }
  });

  test.describe('Statement', () => {
    test('can add a statement', async ({ page }) => {
      const statement = faker.lorem.paragraph();
      const statementField = page.locator('label').filter({ hasText: 'Statement' });

      await statementField.click();
      await statementField.getByRole('textbox').fill(statement);
      await page.getByRole('button', { name: 'Save Changes', exact: true }).click();

      await expect(page.getByText('Flaw saved').first()).toBeVisible();
    });

    test('can clear statement', async ({ page }) => {
      const statementField = page.locator('label').filter({ hasText: 'Statement' });

      await statementField.click();
      await statementField.getByRole('textbox').clear();
      await page.getByRole('button', { name: 'Save Changes', exact: true }).click();

      await expect(page.getByText('Flaw saved').first()).toBeVisible();
    });
  });

  test.describe('Mitigation', () => {
    test('can add a mitigation', async ({ page }) => {
      const mitigation = faker.lorem.paragraph();
      const mitigationField = page.locator('label').filter({ hasText: 'Mitigation' });

      await mitigationField.click();
      await mitigationField.getByRole('textbox').fill(mitigation);
      await page.getByRole('button', { name: 'Save Changes', exact: true }).click();

      await expect(page.getByText('Flaw saved').first()).toBeVisible();
    });

    test('can clear mitigation', async ({ page }) => {
      const mitigationField = page.locator('label').filter({ hasText: 'Mitigation' });

      // First add a mitigation value
      await mitigationField.click();
      await mitigationField.getByRole('textbox').fill('Temporary mitigation');
      await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
      await expect(page.getByText('Flaw saved').first()).toBeVisible();

      // Then clear it
      await mitigationField.click();
      await mitigationField.getByRole('textbox').clear();
      await page.getByRole('button', { name: 'Save Changes', exact: true }).click();

      await expect(page.getByText('Flaw saved').first()).toBeVisible();
    });
  });

  test.describe('Description', () => {
    test('can add a description', async ({ page }) => {
      const description = faker.lorem.paragraph();
      const descriptionField = page.locator('label').filter({ hasText: 'Description' }).first();

      await descriptionField.click();
      await descriptionField.getByRole('textbox').fill(description);
      await page.getByRole('button', { name: 'Save Changes', exact: true }).click();

      await expect(page.getByText('Flaw saved').first()).toBeVisible();
    });

    test('can set review status', async ({ page }) => {
      const reviewStatuses = ['REQUESTED', 'APPROVED', 'REJECTED'];

      for (const status of reviewStatuses) {
        await page.locator('select.osim-description-required').selectOption(status);
        await page.getByRole('button', { name: 'Save Changes', exact: true }).click();

        await expect(page.getByText('Flaw saved').first()).toBeVisible();
      }
    });
  });

  test.describe('Reported Date', () => {
    test('can set reported date', async ({ page }) => {
      const reportedDateField = page.locator('label').filter({ hasText: 'Reported Date' });

      await reportedDateField.click();
      const dateInput = reportedDateField.getByRole('textbox');
      await dateInput.clear();
      await dateInput.fill('2024-01-15');
      await page.getByRole('button', { name: 'Save Changes', exact: true }).click();

      await expect(page.getByText('Flaw saved').first()).toBeVisible();
    });

    test('can change reported date', async ({ page }) => {
      const reportedDateField = page.locator('label').filter({ hasText: 'Reported Date' });

      // Reported Date is required, so we change it to a different date instead of clearing
      await reportedDateField.click();
      await reportedDateField.getByRole('textbox').fill('2024-01-15');
      await page.getByRole('button', { name: 'Save Changes', exact: true }).click();

      await expect(page.getByText('Flaw saved').first()).toBeVisible();
    });
  });

  test.describe('Owner', () => {
    test('can self-assign as owner', async ({ page }) => {
      const selfAssignBtn = page.getByRole('button', { name: 'Self Assign' });

      if (await selfAssignBtn.isVisible()) {
        await selfAssignBtn.click();
        await page.getByRole('button', { name: 'Save Changes', exact: true }).click();

        await expect(page.getByText('Flaw saved').first()).toBeVisible();
      }
    });

    test('can unassign owner', async ({ page }) => {
      const unassignBtn = page.getByRole('button', { name: 'Unassign' });

      if (await unassignBtn.isVisible()) {
        await unassignBtn.click();
        await page.getByRole('button', { name: 'Save Changes', exact: true }).click();

        await expect(page.getByText('Flaw saved').first()).toBeVisible();
      }
    });
  });

  test.describe('CVSS Calculator', () => {
    test('can set CVSS score via calculator', async ({ page }) => {
      // CVSS label uses role="red-hat-cvss" and text is either 'CVSS' or 'CVSSv3'
      const cvssInput = page.locator('label[role="red-hat-cvss"]');
      await cvssInput.click();

      const cvssCalculator = page.locator('.cvss-calculator');
      await expect(cvssCalculator).toBeVisible();

      // Set each CVSS metric
      const metrics = [
        'Attack Vector',
        'Attack Complexity',
        'Privileges Required',
        'User Interaction',
        'Scope',
        'Confidentiality',
        'Integrity',
        'Availability',
      ];

      for (const metric of metrics) {
        const metricSection = cvssCalculator.locator('div', { hasText: metric }).last();
        const buttons = metricSection.locator('button').filter({ hasNotText: metric });
        const buttonCount = await buttons.count();

        if (buttonCount > 1) {
          await buttons.nth(1).scrollIntoViewIfNeeded();
          await buttons.nth(1).click();
        }
      }

      // CVSS is saved when clicking Save Changes button
      await page.getByRole('button', { name: 'Save Changes', exact: true }).click();

      // Wait for the CVSS-specific success toast
      await expect(page.locator('.osim-toast-container').getByText('Saved CVSS Scores')).toBeVisible({ timeout: 15000 });
    });

    test('can set CVSS score via vector string', async ({ page }) => {
      const cvssVector = 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H';
      const cvssField = page.locator('label[role="red-hat-cvss"]');

      // Click to focus and open calculator
      await cvssField.click();

      // Find the vector input and dispatch a paste event with the CVSS vector
      const vectorInput = cvssField.locator('.vector-input');
      await vectorInput.click();

      // Dispatch paste event directly (CVSS calculator has handlePaste)
      await vectorInput.evaluate((el, vector) => {
        const pasteEvent = new ClipboardEvent('paste', {
          bubbles: true,
          cancelable: true,
          clipboardData: new DataTransfer(),
        });
        pasteEvent.clipboardData?.setData('text', vector);
        el.dispatchEvent(pasteEvent);
      }, cvssVector);

      // Save changes
      await page.getByRole('button', { name: 'Save Changes', exact: true }).click();

      // Wait for the CVSS-specific success toast
      await expect(page.locator('.osim-toast-container').getByText('Saved CVSS Scores')).toBeVisible({ timeout: 15000 });
    });

    test('can clear CVSS score using erase button', async ({ page }) => {
      const cvssField = page.locator('label[role="red-hat-cvss"]');

      // First set a CVSS score if not already set
      await cvssField.click();
      const cvssCalculator = page.locator('.cvss-calculator');
      await expect(cvssCalculator).toBeVisible();

      // Click on first option for each metric to ensure we have a valid score
      const metrics = ['Attack Vector', 'Attack Complexity', 'Privileges Required', 'User Interaction', 'Scope', 'Confidentiality', 'Integrity', 'Availability'];
      for (const metric of metrics) {
        const metricSection = cvssCalculator.locator('div', { hasText: metric }).last();
        const buttons = metricSection.locator('button').filter({ hasNotText: metric });
        if (await buttons.count() > 0) {
          await buttons.first().scrollIntoViewIfNeeded();
          await buttons.first().click();
        }
      }

      // Save the initial score
      await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
      await expect(page.locator('.osim-toast-container').getByText('Saved CVSS Scores')).toBeVisible({ timeout: 15000 });

      // Now clear the CVSS score using the erase button
      const eraseButton = page.locator('.erase-button');
      await eraseButton.click();

      // Save the cleared score
      await page.getByRole('button', { name: 'Save Changes', exact: true }).click();

      // Verify score was deleted
      await expect(page.locator('.osim-toast-container').getByText('CVSS score deleted')).toBeVisible({ timeout: 15000 });
    });
  });

  test.describe('Source', () => {
    const sources = ['REDHAT', 'CUSTOMER', 'RESEARCHER', 'INTERNET'];

    for (const source of sources) {
      test(`can set source to ${source}`, async ({ page }) => {
        const sourceField = page.locator('label').filter({ hasText: 'CVE Source' });
        const selectElement = sourceField.locator('select');

        // First change to a different value to ensure there's always a change
        const currentValue = await selectElement.inputValue();
        if (currentValue === source) {
          const otherSource = sources.find(s => s !== source) ?? 'CUSTOMER';
          await sourceField.click();
          await selectElement.selectOption(otherSource);
          await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
          await expect(page.getByText('Flaw saved').first()).toBeVisible();
        }

        // Now set to target value
        await sourceField.click();
        await selectElement.selectOption(source);
        await page.getByRole('button', { name: 'Save Changes', exact: true }).click();

        await expect(page.getByText('Flaw saved').first()).toBeVisible();
      });
    }
  });

  test.describe('Impact', () => {
    const impacts = ['LOW', 'MODERATE', 'IMPORTANT', 'CRITICAL'];

    for (const impact of impacts) {
      test(`can set impact to ${impact}`, async ({ page }) => {
        // Use .first() to target flaw form's Impact, not the one in Affected Offerings
        const impactField = page.locator('label').filter({ hasText: 'Impact' }).first();
        const selectElement = impactField.locator('select');

        // First change to a different value to ensure there's always a change
        const currentValue = await selectElement.inputValue();
        if (currentValue === impact) {
          const otherImpact = impacts.find(i => i !== impact) ?? 'LOW';
          await impactField.click();
          await selectElement.selectOption(otherImpact);
          await page.getByRole('button', { name: 'Save Changes', exact: true }).click();
          await expect(page.getByText('Flaw saved').first()).toBeVisible();
        }

        // Now set to target value
        await impactField.click();
        await selectElement.selectOption(impact);
        await page.getByRole('button', { name: 'Save Changes', exact: true }).click();

        await expect(page.getByText('Flaw saved').first()).toBeVisible();
      });
    }
  });

  test.describe('Embargoed status', () => {
    let embargoedFlawId: string;

    test.beforeAll(async () => {
      // Create an embargoed flaw specifically for this test
      embargoedFlawId = await FlawCreatePage.createFlawWithAPI({ embargoed: true });
    });

    test('can unembargo an embargoed flaw', async ({ page }) => {
      // Navigate to the embargoed flaw
      await page.goto(`/flaws/${embargoedFlawId}`);
      await expect(page.getByRole('button', { name: 'Save Changes', exact: true })).toBeVisible();

      // For existing flaws, embargo status shows as "Yes/No" text with an "Unembargo" button
      // (no checkbox - that's only for new flaws)
      const embargoedField = page.locator('.osim-embargo-label');

      // Click Unembargo button
      await page.getByRole('button', { name: 'Unembargo' }).click();

      // The field should now show warning state (pending unembargo)
      await expect(embargoedField.locator('.form-control')).toContainText('No');

      // Save changes
      await page.getByRole('button', { name: 'Save Changes', exact: true }).click();

      // Confirmation modal appears for unembargo
      await expect(page.getByText('Set Flaw for Unembargo')).toBeVisible();

      // Type the flaw ID (UUID) to confirm
      await page.getByLabel('Confirm').fill(embargoedFlawId);
      await page.getByRole('button', { name: 'Remove Embargo' }).click();

      await expect(page.getByText('Flaw saved').first()).toBeVisible();
    });
  });
});
