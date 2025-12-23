import * as ed25519 from '@noble/ed25519';
import { sha256 } from '@noble/hashes/sha256';
import { sha512 } from '@noble/hashes/sha512';
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa';
import { randomBytes as cryptoRandomBytes, createCipheriv, createDecipheriv } from 'crypto';
import { x25519 } from '@noble/curves/ed25519';
import { hkdf } from '@noble/hashes/hkdf';

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

    // Ensure keys are exactly 32 bytes (Ed25519 standard)
    if (ed25519PrivateKey.length !== 32) {
      throw new Error(`Invalid Ed25519 private key length: expected 32 bytes, got ${ed25519PrivateKey.length}`);
    }
    if (ed25519PublicKey.length !== 32) {
      throw new Error(`Invalid Ed25519 public key length: expected 32 bytes, got ${ed25519PublicKey.length}`);
    }

    if (!quantumSafe) {
      // Legacy mode: Ed25519 only
      const publicKeyHex = Buffer.from(ed25519PublicKey).toString('hex');
      const privateKeyHex = Buffer.from(ed25519PrivateKey).toString('hex');
      
      // Validate hex string lengths (32 bytes = 64 hex characters)
      if (publicKeyHex.length !== 64) {
        throw new Error(`Invalid public key hex length: expected 64 characters, got ${publicKeyHex.length}`);
      }
      if (privateKeyHex.length !== 64) {
        throw new Error(`Invalid private key hex length: expected 64 characters, got ${privateKeyHex.length}`);
      }
      
      return {
        publicKey: publicKeyHex,
        privateKey: privateKeyHex,
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

  /**
   * Generate a unique ID (UUID v4 style)
   */
  static generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Sign data with a private key
   */
  static async sign(data: string, privateKey: string): Promise<string> {
    const messageBytes = Buffer.from(data, 'utf-8');
    const privateKeyBytes = Buffer.from(privateKey, 'hex');

    if (privateKeyBytes.length === 32) {
      // Ed25519 signature
      const signature = await ed25519.sign(messageBytes, privateKeyBytes);
      return Buffer.from(signature).toString('hex');
    } else {
      // Hybrid key - use Ed25519 portion
      const ed25519PrivateKey = privateKeyBytes.slice(0, 32);
      const signature = await ed25519.sign(messageBytes, ed25519PrivateKey);
      return Buffer.from(signature).toString('hex');
    }
  }

  /**
   * Generate an X25519 key pair for key exchange
   */
  static generateX25519KeyPair(): { publicKey: string; privateKey: string } {
    const privateKey = cryptoRandomBytes(32);
    const publicKey = x25519.getPublicKey(privateKey);
    return {
      publicKey: Buffer.from(publicKey).toString('hex'),
      privateKey: Buffer.from(privateKey).toString('hex')
    };
  }

  /**
   * Perform X25519 key exchange to derive a shared secret
   */
  static deriveSharedSecret(privateKey: string, theirPublicKey: string): string {
    const privateKeyBytes = Buffer.from(privateKey, 'hex');
    const publicKeyBytes = Buffer.from(theirPublicKey, 'hex');
    const sharedSecret = x25519.getSharedSecret(privateKeyBytes, publicKeyBytes);
    return Buffer.from(sharedSecret).toString('hex');
  }

  /**
   * Derive an encryption key from a shared secret using HKDF
   */
  static deriveEncryptionKey(sharedSecret: string, info: string = 'atp-encryption'): Buffer {
    const secretBytes = Buffer.from(sharedSecret, 'hex');
    const infoBytes = Buffer.from(info, 'utf8');
    // Use HKDF with SHA-256 to derive a 32-byte key for AES-256
    const derivedKey = hkdf(sha256, secretBytes, undefined, infoBytes, 32);
    return Buffer.from(derivedKey);
  }

  /**
   * Encrypt data using AES-256-GCM
   * Returns: iv (12 bytes) + authTag (16 bytes) + ciphertext, all hex encoded
   */
  static encrypt(plaintext: string | Buffer, key: Buffer): string {
    const iv = cryptoRandomBytes(12); // 96-bit IV for GCM
    const cipher = createCipheriv('aes-256-gcm', key, iv);

    const plaintextBuffer = typeof plaintext === 'string'
      ? Buffer.from(plaintext, 'utf8')
      : plaintext;

    const encrypted = Buffer.concat([
      cipher.update(plaintextBuffer),
      cipher.final()
    ]);

    const authTag = cipher.getAuthTag();

    // Format: iv (12) + authTag (16) + ciphertext
    const combined = Buffer.concat([iv, authTag, encrypted]);
    return combined.toString('hex');
  }

  /**
   * Decrypt data using AES-256-GCM
   * Input format: iv (12 bytes) + authTag (16 bytes) + ciphertext, all hex encoded
   */
  static decrypt(encryptedHex: string, key: Buffer): string {
    const combined = Buffer.from(encryptedHex, 'hex');

    // Extract components
    const iv = combined.slice(0, 12);
    const authTag = combined.slice(12, 28);
    const ciphertext = combined.slice(28);

    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(authTag);

    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final()
    ]);

    return decrypted.toString('utf8');
  }

  /**
   * Encrypt a message for a recipient using their X25519 public key
   * Uses ephemeral key exchange for forward secrecy
   * Returns: ephemeralPublicKey (32 bytes hex) + ':' + encrypted data
   */
  static encryptForRecipient(
    plaintext: string | Buffer,
    recipientPublicKey: string
  ): string {
    // Generate ephemeral key pair for this message (forward secrecy)
    const ephemeral = this.generateX25519KeyPair();

    // Derive shared secret using ECDH
    const sharedSecret = this.deriveSharedSecret(ephemeral.privateKey, recipientPublicKey);

    // Derive encryption key from shared secret
    const encryptionKey = this.deriveEncryptionKey(sharedSecret);

    // Encrypt the message
    const encrypted = this.encrypt(plaintext, encryptionKey);

    // Return ephemeral public key + encrypted data
    return `${ephemeral.publicKey}:${encrypted}`;
  }

  /**
   * Decrypt a message using your X25519 private key
   * Input format: ephemeralPublicKey (32 bytes hex) + ':' + encrypted data
   */
  static decryptFromSender(
    encryptedMessage: string,
    recipientPrivateKey: string
  ): string {
    const colonIndex = encryptedMessage.indexOf(':');
    if (colonIndex === -1) {
      throw new Error('Invalid encrypted message format');
    }

    const ephemeralPublicKey = encryptedMessage.substring(0, colonIndex);
    const encryptedData = encryptedMessage.substring(colonIndex + 1);

    // Derive shared secret using ECDH
    const sharedSecret = this.deriveSharedSecret(recipientPrivateKey, ephemeralPublicKey);

    // Derive encryption key from shared secret
    const encryptionKey = this.deriveEncryptionKey(sharedSecret);

    // Decrypt the message
    return this.decrypt(encryptedData, encryptionKey);
  }
}
