import baseConfig from './tooling/config/eslint.config.js';

export default [
  ...baseConfig,
  {
    ignores: ['apps/**', 'packages/**', 'tooling/**'],
  },
];
