import { webcrypto } from 'crypto';
import { sha512 } from '@noble/hashes/sha512';
import * as ed25519 from '@noble/ed25519';

/**
 * Initialize crypto environment for Node.js ES modules compatibility
 * This polyfills the Web Crypto API and sets up required dependencies for @noble/ed25519
 */
export function initializeCrypto(): void {
  // Polyfill crypto.getRandomValues for Node.js compatibility
  if (!(globalThis as any).crypto) {
    (globalThis as any).crypto = webcrypto;
  }

  // Set up SHA-512 sync function for @noble/ed25519
  if (!ed25519.etc.sha512Sync) {
    ed25519.etc.sha512Sync = (...m) => sha512(ed25519.etc.concatBytes(...m));
  }
}

// Auto-initialize when this module is imported
initializeCrypto();
