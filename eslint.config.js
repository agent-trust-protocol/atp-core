import typescriptEslint from '@typescript-eslint/eslint-plugin';
import typescriptParser from '@typescript-eslint/parser';
import js from '@eslint/js';

const nodeGlobals = {
  process: 'readonly',
  console: 'readonly',
  Buffer: 'readonly',
  __dirname: 'readonly',
  __filename: 'readonly',
  module: 'readonly',
  require: 'readonly',
  exports: 'readonly',
  global: 'readonly',
  setTimeout: 'readonly',
  clearTimeout: 'readonly',
  setInterval: 'readonly',
  clearInterval: 'readonly',
  setImmediate: 'readonly',
  clearImmediate: 'readonly',
  URL: 'readonly',
  URLSearchParams: 'readonly',
  fetch: 'readonly',
  Headers: 'readonly',
  Request: 'readonly',
  Response: 'readonly',
  FormData: 'readonly',
  Blob: 'readonly',
  AbortController: 'readonly',
  AbortSignal: 'readonly',
  TextEncoder: 'readonly',
  TextDecoder: 'readonly',
  crypto: 'readonly',
  performance: 'readonly',
  Event: 'readonly',
  EventTarget: 'readonly',
  localStorage: 'readonly',
  sessionStorage: 'readonly',
  location: 'readonly',
  window: 'readonly',
  document: 'readonly',
  navigator: 'readonly',
  MutationObserver: 'readonly',
  IntersectionObserver: 'readonly',
  ResizeObserver: 'readonly',
  queueMicrotask: 'readonly',
  structuredClone: 'readonly',
  Promise: 'readonly',
  Map: 'readonly',
  Set: 'readonly',
  WeakMap: 'readonly',
  WeakSet: 'readonly',
  Symbol: 'readonly',
  Proxy: 'readonly',
  Reflect: 'readonly',
  Error: 'readonly',
  TypeError: 'readonly',
  RangeError: 'readonly',
  ReferenceError: 'readonly',
  SyntaxError: 'readonly',
  URIError: 'readonly',
  EvalError: 'readonly',
  parseInt: 'readonly',
  parseFloat: 'readonly',
  isNaN: 'readonly',
  isFinite: 'readonly',
  decodeURI: 'readonly',
  decodeURIComponent: 'readonly',
  encodeURI: 'readonly',
  encodeURIComponent: 'readonly',
  JSON: 'readonly',
  Math: 'readonly',
  Date: 'readonly',
  Array: 'readonly',
  Object: 'readonly',
  String: 'readonly',
  Number: 'readonly',
  Boolean: 'readonly',
  RegExp: 'readonly',
  Function: 'readonly',
  Infinity: 'readonly',
  NaN: 'readonly',
  undefined: 'readonly',
  null: 'readonly',
  true: 'readonly',
  false: 'readonly',
  globalThis: 'readonly'
};

export default [
  {
    ignores: [
      'src/workflow-engine/**',
      'node_modules/**',
      'dist/**',
      'coverage/**',
      '.next/**',
      'packages/*/dist/**',
      'packages/*/node_modules/**',
      'packages/*/coverage/**',
      'packages/create-atp-agent/dashboard/**',
      'packages/*/test-*.js',
      'packages/*/test-*.mjs',
      '**/*.js',
      '**/*.mjs',
      '**/*.cjs'
    ]
  },
  // TypeScript files in packages/
  {
    files: ['packages/**/*.ts', 'packages/**/*.tsx', 'src/**/*.ts', 'src/**/*.tsx'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module'
      },
      globals: nodeGlobals
    },
    plugins: {
      '@typescript-eslint': typescriptEslint
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-non-null-assertion': 'warn',
      'no-console': 'off',
      'no-debugger': 'error',
      'no-empty': 'warn',
      'no-undef': 'off',
      'prefer-const': 'error',
      'no-var': 'error',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-new-func': 'error'
    }
  },
  // Relax rules for test files
  {
    files: ['**/*.test.ts', '**/*.spec.ts', '**/__tests__/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-empty': 'off'
    }
  }
];
