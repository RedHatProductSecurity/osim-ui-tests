## Code style
This project uses the recommended rules from [typescript-eslint](https://typescript-eslint.io/) and [Stylistic](https://eslint.style/) to enforce a consistent code style. 

Together with lint-staged and husky, the code style is enforced on every commit.
To check the code style manually, you can run:

```bash
yarn lint # or yarn lint:fix to automatically fix some issues
```

If you are using VSCode, you can install the [ESLint extension](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) to see the errors in the editor. Also here's a configuration for the editor to automatically fix some issues on save:

<details>
<summary>VSCode config</summary>
You can save this configuration on `.vscode/settings.json` file

```jsonc
{
    // Disable the default formatter, use eslint instead
    "prettier.enable": false,
    "editor.formatOnSave": false,
    
    // Auto fix
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": "explicit",
      "source.organizeImports": "never"
    },
  
    // Silent the stylistic rules in you IDE, but still auto fix them
    "eslint.rules.customizations": [
      { "rule": "style/*", "severity": "off", "fixable": true },
      { "rule": "format/*", "severity": "off", "fixable": true },
      { "rule": "*-indent", "severity": "off", "fixable": true },
      { "rule": "*-spacing", "severity": "off", "fixable": true },
      { "rule": "*-spaces", "severity": "off", "fixable": true },
      { "rule": "*-order", "severity": "off", "fixable": true },
      { "rule": "*-dangle", "severity": "off", "fixable": true },
      { "rule": "*-newline", "severity": "off", "fixable": true },
      { "rule": "*quotes", "severity": "off", "fixable": true },
      { "rule": "*semi", "severity": "off", "fixable": true },
      { "rule": "*-lines", "severity": "off", "fixable": true },
    ],
  
    // Enable eslint for all supported languages
    "eslint.validate": [
      "javascript",
      "javascriptreact",
      "typescript",
      "typescriptreact",
      "vue",
      "html",
      "markdown",
      "json",
      "jsonc",
      "yaml",
      "toml",
      "xml",
      "gql",
      "graphql",
      "astro",
      "css",
      "less",
      "scss",
      "pcss",
      "postcss"
    ],
    "files.exclude": {
      "**/.git": true,
      "**/.svn": true,
      "**/.hg": true,
      "**/CVS": true,
      "**/.DS_Store": true,
      "**/Thumbs.db": true,
      "**/node_modules": true
    }
}
```

</details>

## Writing tests

Follow the Playwright [best practices](https://playwright.dev/docs/best-practices) when writting tests. Use the UI mode for faster development leveraing the [locator picker](https://playwright.dev/docs/test-ui-mode#pick-locator) to easily find elements on the page.


### Page Object Model

To improve test readability and maintainability, we use the [Page Object Model](https://playwright.dev/docs/pom) pattern. This pattern allows us to encapsulate the logic of the pages in classes, making the tests more readable and easier to maintain.

Page objects are located in the `/pages` directory. Each page object should have a class that represents the page and its methods. The page object should not contain assertions, only methods that interact with the page.
