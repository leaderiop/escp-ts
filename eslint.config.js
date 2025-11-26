import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strict,
  {
    files: ['src/**/*.ts'],
    rules: {
      // Allow unused vars starting with underscore (common pattern for destructuring)
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // CommandBuilder is a static utility class, this is intentional
      '@typescript-eslint/no-extraneous-class': 'off',
    },
  },
  { ignores: ['dist/**', 'node_modules/**', '**/*.test.ts'] }
);
