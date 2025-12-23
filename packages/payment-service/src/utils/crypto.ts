/**
 * Cryptographic utilities
 */

import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';

export class CryptoUtils {
  /**
   * Generate a unique ID
   */
  static generateId(prefix?: string): string {
    const id = uuidv4();
    return prefix ? `${prefix}_${id}` : id;
  }

  /**
   * Hash data using SHA-256
   */
  static hash(data: string): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Create a simple signature (MVP - would use proper cryptography in production)
   */
  static sign(data: string, key?: string): string {
    const hmac = crypto.createHmac('sha256', key || 'atp-payment-service-mvp');
    return hmac.update(data).digest('hex');
  }

  /**
   * Verify a signature
   */
  static verify(data: string, signature: string, key?: string): boolean {
    const expectedSignature = this.sign(data, key);
    return signature === expectedSignature;
  }
}
