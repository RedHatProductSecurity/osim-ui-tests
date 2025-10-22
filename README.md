# End-to-end Playwright tests for OSIM
This repository contains end-to-end tests for [OSIM](https://github.com/RedHatProductSecurity/osim) using [Playwright](https://playwright.dev/).

## Required environment variables

- `OSIM_URL`: URL of the OSIM instance to test
- `OSIDB_URL`: URL of the OSIDB instance to test
- `JIRA_USERNAME`: Username of the authenticated user in JIRA
- `JIRA_API_KEY`: API key for JIRA (used for API calls during test setup)
- `BUGZILLA_API_KEY`: API key for Bugzilla (used for API calls during test setup)

**Note**: API keys are used for backend API calls during test setup and flaw creation. They are not stored in browser localStorage during tests, as the main OSIM application now stores API keys securely on the backend.

The project uses [dotenv](https://www.npmjs.com/package/dotenv) to load the environment variables from a `.env` file.

## Installation

Clone the repository and install the dependencies:

```bash
git clone git@github.com:RedHatProductSecurity/osim-ui-tests.git
cd osim-ui-tests
yarn install
```

This should download the browser binaries for Playwright, if having problems, you can do it manually by running:

```bash
yarn playwright install
```

## Running the tests

You can run Playwright in [UI mode](https://playwright.dev/docs/test-ui-mode) by running:

```bash
yarn dev
```
This mode allows you to run the tests in a browser and see the results in the Playwright UI. Perfect for development and debugging.

To run the tests in headless mode, you can run:

```bash
yarn test
```

or specify the browser to use:

```bash
yarn test:firefox # see package.json for more options
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### See the [CONTRIBUTING.md](CONTRIBUTING.md) file for more information on how to contribute to this project.
