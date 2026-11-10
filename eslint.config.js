export default [
  { ignores: ['client/**'] },
  {
    files: ['**/*.js'],
    rules: {
      'no-unused-vars': ['error', { args: 'none' }],
      'no-unreachable': 'error',
      'no-duplicate-imports': 'error',
    },
  },
];
