import * as ed25519 from '@noble/ed25519';
import { initializeCrypto } from '@atp/shared';

// Initialize crypto polyfills (WebCrypto / getRandomValues for Node).
initializeCrypto();

export class CryptoUtils {
  static async sign(message: string, privateKeyHex: string): Promise<string> {
    const messageBytes = Buffer.from(message, 'utf8');
    const privateKeyBytes = Buffer.from(privateKeyHex, 'hex');
    // Use the async API: it derives SHA-512 via WebCrypto (sha512Async) and so
    // does not depend on ed25519.etc.sha512Sync being initialized on this exact
    // module instance. @noble/ed25519 may be deduplicated into multiple copies
    // across the workspace, and the sync path would otherwise throw
    // "sha512Sync not set" whenever the signing copy differs from the one
    // initializeCrypto() patched. Ed25519 output is identical either way.
    const signature = await ed25519.signAsync(messageBytes, privateKeyBytes);
    return Buffer.from(signature).toString('hex');
  }

  static async verify(message: string, signatureHex: string, publicKeyHex: string): Promise<boolean> {
    try {
      const messageBytes = Buffer.from(message, 'utf8');
      const signatureBytes = Buffer.from(signatureHex, 'hex');
      const publicKeyBytes = Buffer.from(publicKeyHex, 'hex');
      return await ed25519.verifyAsync(signatureBytes, messageBytes, publicKeyBytes);
    } catch {
      return false;
    }
  }
}