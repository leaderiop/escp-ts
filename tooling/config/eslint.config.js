import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

/**
 * Shared ESLint configuration for @escp packages
 *
 * Usage in package eslint.config.js:
 * ```js
 * import baseConfig from '@escp/config/eslint';
 * export default [...baseConfig];
 * ```
 */
export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      // Allow unused vars starting with underscore (common pattern for destructuring)
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // CommandBuilder and similar static utility classes are intentional
      '@typescript-eslint/no-extraneous-class': 'off',
      // Allow non-null assertions in specific cases
      '@typescript-eslint/no-non-null-assertion': 'warn',
      // Consistent type imports
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      // Allow empty functions (useful for default callbacks)
      '@typescript-eslint/no-empty-function': 'off',
      // Prefer interface over type for object shapes
      '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
    },
  },
  // Prettier must be last to override other formatting rules
  eslintConfigPrettier,
  // Global ignores
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/coverage/**',
      '**/.turbo/**',
    ],
  }
);
