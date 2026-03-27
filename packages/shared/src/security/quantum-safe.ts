/**
 * Quantum-Safe Signature Module
 * Uses ML-DSA-65 (CRYSTALS-Dilithium) via @noble/post-quantum for real post-quantum signatures.
 */

import { ml_dsa65 } from '@noble/post-quantum/ml-dsa';
import { randomBytes } from 'crypto';

export class QuantumSafeSignature {
  private secretKey: Uint8Array;
  private _publicKey: Uint8Array;

  constructor(privateKey?: string, publicKey?: string) {
    if (privateKey && publicKey) {
      this.secretKey = Buffer.from(privateKey, 'hex');
      this._publicKey = Buffer.from(publicKey, 'hex');
    } else {
      // Generate a fresh ML-DSA-65 key pair
      const seed = randomBytes(32);
      const keyPair = ml_dsa65.keygen(seed);
      this.secretKey = keyPair.secretKey;
      this._publicKey = keyPair.publicKey;
    }
  }

  async sign(message: string): Promise<string> {
    const msgBytes = Buffer.from(message, 'utf8');
    const signature = ml_dsa65.sign(this.secretKey, msgBytes);
    return Buffer.from(signature).toString('hex');
  }

  async verify(message: string, signature: string): Promise<boolean> {
    try {
      const msgBytes = Buffer.from(message, 'utf8');
      const sigBytes = Buffer.from(signature, 'hex');
      return ml_dsa65.verify(this._publicKey, msgBytes, sigBytes);
    } catch {
      return false;
    }
  }

  getPublicKey(): string {
    return Buffer.from(this._publicKey).toString('hex');
  }

  /** Generate a new ML-DSA-65 key pair and return hex-encoded strings. */
  static generateKeyPair(): { privateKey: string; publicKey: string } {
    const seed = randomBytes(32);
    const keyPair = ml_dsa65.keygen(seed);
    return {
      privateKey: Buffer.from(keyPair.secretKey).toString('hex'),
      publicKey: Buffer.from(keyPair.publicKey).toString('hex'),
    };
  }
}

export class AuditLogger {
  constructor(private serviceName: string = 'default') {}

  async log(event: any): Promise<void> {
    console.log(`[AUDIT][${this.serviceName}]`, event);
  }

  async logSecurityEvent(event: any): Promise<void> {
    console.log(`[SECURITY][${this.serviceName}]`, event);
  }

  async logEvent(event: any): Promise<void> {
    console.log(`[EVENT][${this.serviceName}]`, event);
  }
}
