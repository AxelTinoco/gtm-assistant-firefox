const js = require('@eslint/js');
const globals = require('globals');
const prettier = require('eslint-config-prettier');

module.exports = [
  {
    ignores: ['node_modules/**', 'web-ext-artifacts/**', 'dist/**', 'build/**'],
  },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: {
        ...globals.browser,
        ...globals.webextensions,
        browser: 'readonly',
        chrome: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_|^e$' }],
      'no-console': 'off',
      eqeqeq: ['error', 'always'],
      'prefer-const': 'warn',
    },
  },
  {
    files: ['eslint.config.js', '*.config.js', 'scripts/**/*.cjs'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
  },
  prettier,
];
