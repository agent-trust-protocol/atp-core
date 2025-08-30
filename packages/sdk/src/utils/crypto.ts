import * as ed25519 from '@noble/ed25519';
import { sha256 } from '@noble/hashes/sha256';
import { sha512 } from '@noble/hashes/sha512';
import { randomBytes } from 'crypto';

// Configure @noble/ed25519 to use SHA-512
ed25519.etc.sha512Sync = (...m) => sha512(ed25519.etc.concatBytes(...m));

/**
 * Cryptographic utilities for ATP™ SDK
 */
export class CryptoUtils {
  /**
   * Generate a new Ed25519 key pair
   */
  static async generateKeyPair(): Promise<{
    publicKey: string;
    privateKey: string;
  }> {
    const privateKey = ed25519.utils.randomPrivateKey();
    const publicKey = await ed25519.getPublicKey(privateKey);
    
    return {
      publicKey: Buffer.from(publicKey).toString('hex'),
      privateKey: Buffer.from(privateKey).toString('hex')
    };
  }

  /**
   * Sign data with private key
   */
  static async signData(data: string | Buffer, privateKey: string): Promise<string> {
    const dataBuffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
    const privateKeyBuffer = Buffer.from(privateKey, 'hex');
    
    const signature = await ed25519.sign(dataBuffer, privateKeyBuffer);
    return Buffer.from(signature).toString('hex');
  }

  /**
   * Verify signature with public key
   */
  static async verifySignature(
    data: string | Buffer,
    signature: string,
    publicKey: string
  ): Promise<boolean> {
    try {
      const dataBuffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
      const signatureBuffer = Buffer.from(signature, 'hex');
      const publicKeyBuffer = Buffer.from(publicKey, 'hex');
      
      return await ed25519.verify(signatureBuffer, dataBuffer, publicKeyBuffer);
    } catch {
      return false;
    }
  }

  /**
   * Hash data using SHA-256
   */
  static hash(data: string | Buffer): string {
    const dataBuffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
    const hash = sha256(dataBuffer);
    return Buffer.from(hash).toString('hex');
  }

  /**
   * Generate cryptographically secure random bytes
   */
  static randomBytes(length: number): Buffer {
    return randomBytes(length);
  }

  /**
   * Generate a secure random string
   */
  static randomString(length: number = 32): string {
    return randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
  }

  /**
   * Derive key from password using a simple key derivation
   */
  static deriveKey(password: string, salt: string): string {
    const combined = password + salt;
    return this.hash(combined);
  }

  /**
   * Create a fingerprint from public key
   */
  static createKeyFingerprint(publicKey: string): string {
    const hash = this.hash(publicKey);
    // Return first 16 characters for a shorter fingerprint
    return hash.slice(0, 16);
  }

  /**
   * Validate hex string
   */
  static isValidHex(hex: string): boolean {
    return /^[0-9a-fA-F]+$/.test(hex) && hex.length % 2 === 0;
  }

  /**
   * Constant-time string comparison
   */
  static constantTimeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }
}