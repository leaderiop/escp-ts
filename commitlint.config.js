export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // New feature
        'fix', // Bug fix
        'docs', // Documentation
        'style', // Formatting, no code change
        'refactor', // Code change without feature/fix
        'perf', // Performance improvement
        'test', // Adding tests
        'build', // Build system changes
        'ci', // CI configuration
        'chore', // Other changes
        'revert', // Revert commit
      ],
    ],
    'scope-enum': [1, 'always', ['core', 'jsx', 'preview', 'config', 'examples', 'deps']],
    'subject-case': [2, 'always', 'lower-case'],
  },
};
