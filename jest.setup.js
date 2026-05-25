/**
 * Jest Setup File - Enhanced Configuration
 * Configures global environment for all tests with proper cleanup
 */

// Jest setup file to polyfill Web Crypto API for Node.js
const { webcrypto } = require('crypto');

// Polyfill Web Crypto API for @noble/ed25519
if (!globalThis.crypto) {
  globalThis.crypto = webcrypto;
}

// Ensure getRandomValues is available
if (!globalThis.crypto.getRandomValues) {
  globalThis.crypto.getRandomValues = webcrypto.getRandomValues.bind(webcrypto);
}

// @noble/ed25519 needs etc.sha512Sync configured before any sync code path
// (e.g. getExtendedPublicKey used by `sign`). Several packages depend on this
// indirectly via different module resolutions; configure it on whichever
// instance ends up loaded in the test process so we don't depend on import
// ordering across packages.
try {
  const ed25519 = require('@noble/ed25519');
  const { sha512 } = require('@noble/hashes/sha2.js');
  if (ed25519.etc && !ed25519.etc.sha512Sync) {
    ed25519.etc.sha512Sync = (...m) => sha512(ed25519.etc.concatBytes(...m));
  }
} catch (err) {
  // @noble/ed25519 may not be installed in this workspace; that's fine.
}

// Global test timeout is configured in jest.config.cjs (testTimeout: 10000)

// Store original console methods
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// Setup before each test
beforeEach(() => {
  // Suppress expected warnings and experimental messages
  console.error = ((originalError) => (message) => {
    if (
      typeof message === 'string' && 
      (message.includes('ExperimentalWarning:') || 
       message.includes('DeprecationWarning:') ||
       message.includes('Warning:'))
    ) {
      return; // Suppress these warnings
    }
    originalError(message);
  })(originalConsoleError);
  
  console.warn = ((originalWarn) => (message) => {
    if (typeof message === 'string' && message.includes('Warning:')) {
      return; // Suppress warnings
    }
    originalWarn(message);
  })(originalConsoleWarn);
});

// Cleanup after each test
afterEach(() => {
  // Restore console methods
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Global cleanup after all tests
afterAll(async () => {
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
  
  // Small delay to allow async operations to complete
  await new Promise(resolve => setTimeout(resolve, 100));
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Export test configuration (optional, only if needed elsewhere)
module.exports.testConfig = {
  timeout: 10000,
  cryptoAvailable: !!globalThis.crypto
};