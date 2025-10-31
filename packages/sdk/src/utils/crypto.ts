import * as ed25519 from '@noble/ed25519';
import { sha256 } from '@noble/hashes/sha256';
import { sha512 } from '@noble/hashes/sha512';
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa';
import { randomBytes as cryptoRandomBytes } from 'crypto';

// Configure @noble/ed25519 to use SHA-512
ed25519.etc.sha512Sync = (...m) => sha512(ed25519.etc.concatBytes(...m));

/**
 * Cryptographic utilities for ATP™ SDK
 * Supports both classical Ed25519 and hybrid quantum-safe (Ed25519 + ML-DSA) cryptography
 */
export interface HybridKeyPair {
  publicKey: string;
  privateKey: string;
  quantumSafe: boolean;
  ed25519PublicKey?: string;
  ed25519PrivateKey?: string;
  mlDsaPublicKey?: string;
  mlDsaPrivateKey?: string;
}

export class CryptoUtils {
  /**
   * Generate a new hybrid quantum-safe key pair (Ed25519 + ML-DSA)
   * This is now the default for quantum-safe security
   */
  static async generateKeyPair(quantumSafe: boolean = true): Promise<HybridKeyPair> {
    // Generate Ed25519 key pair (classical)
    const ed25519PrivateKey = ed25519.utils.randomPrivateKey();
    const ed25519PublicKey = await ed25519.getPublicKey(ed25519PrivateKey);

    if (!quantumSafe) {
      // Legacy mode: Ed25519 only
      return {
        publicKey: Buffer.from(ed25519PublicKey).toString('hex'),
        privateKey: Buffer.from(ed25519PrivateKey).toString('hex'),
        quantumSafe: false
      };
    }

    // Generate ML-DSA key pair (post-quantum)
    const seed = cryptoRandomBytes(32);
    const mlDsaKeyPair = ml_dsa65.keygen(seed);
    
    // Combine keys: Ed25519 public (32) + ML-DSA public (1952) = 1984 bytes
    // Format: [ed25519_public(32)][ml_dsa_public(1952)]
    const combinedPublic = new Uint8Array(32 + mlDsaKeyPair.publicKey.length);
    combinedPublic.set(ed25519PublicKey, 0);
    combinedPublic.set(mlDsaKeyPair.publicKey, 32);

    // Combine private keys: Ed25519 private (32) + ML-DSA private (4000) = 4032 bytes
    const combinedPrivate = new Uint8Array(32 + mlDsaKeyPair.secretKey.length);
    combinedPrivate.set(ed25519PrivateKey, 0);
    combinedPrivate.set(mlDsaKeyPair.secretKey, 32);

    return {
      publicKey: Buffer.from(combinedPublic).toString('hex'),
      privateKey: Buffer.from(combinedPrivate).toString('hex'),
      quantumSafe: true,
      ed25519PublicKey: Buffer.from(ed25519PublicKey).toString('hex'),
      ed25519PrivateKey: Buffer.from(ed25519PrivateKey).toString('hex'),
      mlDsaPublicKey: Buffer.from(mlDsaKeyPair.publicKey).toString('hex'),
      mlDsaPrivateKey: Buffer.from(mlDsaKeyPair.secretKey).toString('hex')
    };
  }

  /**
   * Sign data with private key (supports both Ed25519-only and hybrid quantum-safe)
   */
  static async signData(data: string | Buffer, privateKey: string, quantumSafe: boolean = true): Promise<string> {
    const dataBuffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
    const privateKeyBuffer = Buffer.from(privateKey, 'hex');

    // Detect if this is a hybrid key (4032 bytes = 32 Ed25519 + 4000 ML-DSA)
    const isHybridKey = privateKeyBuffer.length === 4032 && quantumSafe;

    if (!isHybridKey || privateKeyBuffer.length <= 64) {
      // Ed25519-only signature (32 bytes key, or not hybrid mode)
      const ed25519PrivateKey = privateKeyBuffer.length <= 64 
        ? privateKeyBuffer.slice(0, 32)
        : privateKeyBuffer.slice(0, 32);
      const signature = await ed25519.sign(dataBuffer, ed25519PrivateKey);
      return Buffer.from(signature).toString('hex');
    }

    // Hybrid signature: Ed25519 + ML-DSA
    const ed25519PrivateKey = privateKeyBuffer.slice(0, 32);
    const mlDsaPrivateKey = privateKeyBuffer.slice(32);

    // Sign with both algorithms (ML-DSA uses sign(secretKey, message) order)
    const ed25519Sig = await ed25519.sign(dataBuffer, ed25519PrivateKey);
    const mlDsaSig = ml_dsa65.sign(mlDsaPrivateKey, dataBuffer);

    // Combine signatures: [ed25519_len(2)][ml_dsa_len(2)][ed25519_sig(64)][ml_dsa_sig(3293)]
    const combined = new Uint8Array(4 + ed25519Sig.length + mlDsaSig.length);
    const view = new DataView(combined.buffer);
    view.setUint16(0, ed25519Sig.length, true); // little-endian
    view.setUint16(2, mlDsaSig.length, true);
    combined.set(ed25519Sig, 4);
    combined.set(mlDsaSig, 4 + ed25519Sig.length);

    return Buffer.from(combined).toString('hex');
  }

  /**
   * Verify signature with public key (supports both Ed25519-only and hybrid quantum-safe)
   */
  static async verifySignature(
    data: string | Buffer,
    signature: string,
    publicKey: string,
    quantumSafe: boolean = true
  ): Promise<boolean> {
    try {
      const dataBuffer = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
      const signatureBuffer = Buffer.from(signature, 'hex');
      const publicKeyBuffer = Buffer.from(publicKey, 'hex');

      // Detect if this is a hybrid signature (has length prefix)
      // Hybrid sigs are > 64 bytes (Ed25519) and start with length prefixes
      const isHybridSig = signatureBuffer.length > 100 && quantumSafe;

      // Detect if this is a hybrid public key (1984 bytes = 32 Ed25519 + 1952 ML-DSA)
      const isHybridKey = publicKeyBuffer.length === 1984 && quantumSafe;

      if (!isHybridSig || !isHybridKey || publicKeyBuffer.length <= 64) {
        // Ed25519-only verification
        const ed25519PublicKey = publicKeyBuffer.length <= 64 
          ? publicKeyBuffer.slice(0, 32)
          : publicKeyBuffer.slice(0, 32);
        const ed25519Sig = signatureBuffer.length <= 100 
          ? signatureBuffer.slice(0, 64)
          : signatureBuffer.slice(0, 64);
        return await ed25519.verify(ed25519Sig, dataBuffer, ed25519PublicKey);
      }

      // Hybrid verification: Ed25519 + ML-DSA
      const ed25519PublicKey = publicKeyBuffer.slice(0, 32);
      const mlDsaPublicKey = publicKeyBuffer.slice(32);

      // Extract signatures from combined format
      const view = new DataView(signatureBuffer.buffer);
      const ed25519SigLen = view.getUint16(0, true);
      const mlDsaSigLen = view.getUint16(2, true);
      const ed25519Sig = signatureBuffer.slice(4, 4 + ed25519SigLen);
      const mlDsaSig = signatureBuffer.slice(4 + ed25519SigLen, 4 + ed25519SigLen + mlDsaSigLen);

      // Verify both signatures (ML-DSA uses verify(publicKey, message, signature) order)
      const ed25519Valid = await ed25519.verify(ed25519Sig, dataBuffer, ed25519PublicKey);
      const mlDsaValid = ml_dsa65.verify(mlDsaPublicKey, dataBuffer, mlDsaSig);

      return ed25519Valid && mlDsaValid;
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
    return cryptoRandomBytes(length);
  }

  /**
   * Generate a secure random string
   */
  static randomString(length: number = 32): string {
    return cryptoRandomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
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
