import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import stylistic from '@stylistic/eslint-plugin'

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,
  stylistic.configs.customize({
    braceStyle:'1tbs',
    commaDangle:'always-multiline',
    indent: 2,
    quotes: 'single',
    semi: true,
  }),
  {
    rules: {
      '@typescript-eslint/restrict-template-expressions': ['error',{ allow: [{ name: 'undefined', from: 'lib' }] }],
    }
  },
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname
      }
    }
  },
  {
    ignores: [
    'eslint.config.mjs',
    'playwright.config.ts',
    'test-results/**/*',
    'playwright-report/**/*'
  ]
}
);
