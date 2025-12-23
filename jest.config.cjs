/** @type {import('jest').Config} */
module.exports = {
  // Basic configuration
  preset: 'ts-jest/presets/default-esm',
  extensionsToTreatAsEsm: ['.ts'],
  testEnvironment: 'node',
  verbose: true,
  
  // Test discovery
  roots: ['<rootDir>/packages'],
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)'
  ],
  
  // Module resolution
  moduleNameMapper: {
    '^@atp/(.*)$': '<rootDir>/packages/$1/src',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  
  // Transform configuration for ESM
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        module: 'esnext',
        target: 'es2020',
        moduleResolution: 'node',
        allowSyntheticDefaultImports: true,
        esModuleInterop: true
      }
    }]
  },
  
  // Module file extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // Coverage configuration
  collectCoverage: false, // Disable by default for performance
  collectCoverageFrom: [
    'packages/*/src/**/*.{ts,tsx}',
    '!packages/*/src/**/*.d.ts',
    '!packages/*/src/**/__tests__/**',
    '!packages/*/src/**/*.test.{ts,tsx}',
    '!packages/*/src/**/*.spec.{ts,tsx}'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Performance and cleanup configuration
  maxWorkers: '50%', // Use half of available cores
  maxConcurrency: 5,
  
  // Handle async operations and cleanup - KEY FIXES FOR THE 5%
  openHandlesTimeout: 2000, // Increased from default 1000ms
  testTimeout: 10000, // 10 seconds timeout for individual tests
  forceExit: true, // Force exit after tests complete (fixes "did not exit" issue)
  
  // Setup and teardown
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  
  // Clear mocks between tests
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  
  // Error handling
  errorOnDeprecated: true,
  
  // Module paths
  moduleDirectories: ['node_modules', '<rootDir>'],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/coverage/',
    '\\.d\\.ts$'
  ],
  
  // Transform ignore patterns - allow transformation of ESM modules
  transformIgnorePatterns: [
    'node_modules/(?!(@noble|@atp)/)'
  ],
  
  // Global setup for crypto polyfills
  globals: {
    'ts-jest': {
      useESM: true
    }
  },
  
  // Detect open handles in development (disable in CI for performance)
  detectOpenHandles: process.env.CI !== 'true',
  
  // Bail on first failure in CI
  bail: process.env.CI === 'true' ? 1 : 0,
  
  // Notification settings (disabled - requires node-notifier)
  notify: false,
  notifyMode: 'failure-change'
};