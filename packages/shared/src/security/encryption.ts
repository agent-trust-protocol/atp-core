/**
 * Agent Trust Protocol™
 * Encryption utilities for sensitive data protection
 */

import * as crypto from 'crypto';

export class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private keyLength = 32; // 256 bits
  private ivLength = 16; // 128 bits
  private tagLength = 16; // 128 bits
  private saltLength = 32; // 256 bits

  private encryptionKey: Buffer;

  constructor() {
    // Get encryption key from environment or generate for development
    const key = process.env.ATP_ENCRYPTION_KEY;
    const iv = process.env.ATP_ENCRYPTION_IV;

    if (!key && process.env.NODE_ENV === 'production') {
      throw new Error('ATP_ENCRYPTION_KEY must be set in production environment');
    }

    // Use provided key or generate for development
    this.encryptionKey = key
      ? Buffer.from(key, 'hex')
      : crypto.randomBytes(this.keyLength);
  }

  /**
   * Encrypts sensitive data using AES-256-GCM
   */
  encrypt(plaintext: string): string {
    try {
      // Generate random IV for each encryption
      const iv = crypto.randomBytes(this.ivLength);

      // Create cipher
      const cipher = crypto.createCipheriv(this.algorithm, this.encryptionKey, iv);

      // Encrypt data
      const encrypted = Buffer.concat([
        cipher.update(plaintext, 'utf8'),
        cipher.final()
      ]);

      // Get authentication tag
      const authTag = (cipher as any).getAuthTag();

      // Combine IV, auth tag, and encrypted data
      const combined = Buffer.concat([iv, authTag, encrypted]);

      // Return base64 encoded string
      return combined.toString('base64');
    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  /**
   * Decrypts data encrypted with encrypt() method
   */
  decrypt(encryptedData: string): string {
    try {
      // Decode from base64
      const combined = Buffer.from(encryptedData, 'base64');

      // Extract components
      const iv = combined.slice(0, this.ivLength);
      const authTag = combined.slice(this.ivLength, this.ivLength + this.tagLength);
      const encrypted = combined.slice(this.ivLength + this.tagLength);

      // Create decipher
      const decipher = crypto.createDecipheriv(this.algorithm, this.encryptionKey, iv);
      (decipher as any).setAuthTag(authTag);

      // Decrypt data
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final()
      ]);

      return decrypted.toString('utf8');
    } catch (error) {
      console.error('Decryption failed:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Derives a key from a password using PBKDF2
   */
  deriveKey(password: string, salt?: Buffer): { key: Buffer; salt: Buffer } {
    const useSalt = salt || crypto.randomBytes(this.saltLength);
    const key = crypto.pbkdf2Sync(password, useSalt, 100000, this.keyLength, 'sha256');
    return { key, salt: useSalt };
  }

  /**
   * Encrypts an object by serializing it to JSON first
   */
  encryptObject(obj: any): string {
    const json = JSON.stringify(obj);
    return this.encrypt(json);
  }

  /**
   * Decrypts and parses a JSON object
   */
  decryptObject<T = any>(encryptedData: string): T {
    const json = this.decrypt(encryptedData);
    return JSON.parse(json);
  }

  /**
   * Generates a secure random key
   */
  static generateKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generates a secure random IV
   */
  static generateIV(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Hash sensitive data for comparison without storing plaintext
   */
  static hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Constant-time comparison to prevent timing attacks
   */
  static secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  }
}

// Export singleton instance
export const encryptionService = new EncryptionService();
