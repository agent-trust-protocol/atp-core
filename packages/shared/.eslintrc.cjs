module.exports = {
  extends: '../../.eslintrc.cjs',
  env: {
    node: true,
    jest: true
  },
  overrides: [
    {
      files: ['**/__tests__/**/*', '**/*.test.ts', '**/*.spec.ts'],
      env: {
        jest: true,
        node: true
      },
      globals: {
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        jest: 'readonly'
      },
      rules: {
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        'no-undef': 'off'
      }
    }
  ]
};
