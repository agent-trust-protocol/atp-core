import * as ed25519 from '@noble/ed25519';
import { sha256, sha512 } from '@noble/hashes/sha2.js';
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js';
import { randomBytes as cryptoRandomBytes, createCipheriv, createDecipheriv } from 'crypto';
import { x25519 } from '@noble/curves/ed25519';
import { hkdf } from '@noble/hashes/hkdf.js';

// Configure @noble/ed25519 to use SHA-512
ed25519.etc.sha512Sync = (...m) => sha512(ed25519.etc.concatBytes(...m));

/**
 * Cryptographic utilities for ATP™ SDK — did:atp v2 key model.
 *
 * Ed25519 and ML-DSA-65 (FIPS 204 final) are kept as separate keypairs.
 * Key identifiers are RFC 7638 JWK thumbprints with `e1_` / `pq1_` prefixes.
 */

export interface KeyPairBytes {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
}

export interface HybridKeyPair {
  ed25519: KeyPairBytes;
  mlDsa65: KeyPairBytes;
}

/** Ed25519 public JWK (RFC 8037). Contains exactly the RFC 7638 required members. */
export interface Ed25519Jwk {
  crv: 'Ed25519';
  kty: 'OKP';
  x: string;
}

/** ML-DSA-65 public JWK in RFC 9964 AKP form. */
export interface MlDsa65Jwk {
  alg: 'ML-DSA-65';
  kty: 'AKP';
  pub: string;
}

export const ED25519_PUBLIC_KEY_BYTES = 32;
export const ML_DSA_65_PUBLIC_KEY_BYTES = 1952;
export const ML_DSA_65_SIGNATURE_BYTES = 3309;

export class CryptoUtils {
  /**
   * Generate a hybrid key pair: independent Ed25519 and ML-DSA-65 keypairs.
   */
  static async generateHybridKeyPair(): Promise<HybridKeyPair> {
    const edSecretKey = ed25519.utils.randomPrivateKey();
    const edPublicKey = await ed25519.getPublicKey(edSecretKey);

    if (edPublicKey.length !== ED25519_PUBLIC_KEY_BYTES) {
      throw new Error(`Invalid Ed25519 public key length: expected 32 bytes, got ${edPublicKey.length}`);
    }

    const seed = new Uint8Array(cryptoRandomBytes(32));
    const mlDsaKeyPair = ml_dsa65.keygen(seed);

    if (mlDsaKeyPair.publicKey.length !== ML_DSA_65_PUBLIC_KEY_BYTES) {
      throw new Error(`Invalid ML-DSA-65 public key length: expected 1952 bytes, got ${mlDsaKeyPair.publicKey.length}`);
    }

    return {
      ed25519: { publicKey: edPublicKey, secretKey: edSecretKey },
      mlDsa65: { publicKey: mlDsaKeyPair.publicKey, secretKey: mlDsaKeyPair.secretKey }
    };
  }

  /**
   * Base64url encoding without padding (RFC 4648 §5).
   */
  static base64url(bytes: Uint8Array): string {
    return Buffer.from(bytes).toString('base64url');
  }

  /**
   * Build the public JWK for an Ed25519 public key (RFC 8037).
   */
  static ed25519PublicKeyToJwk(publicKey: Uint8Array): Ed25519Jwk {
    if (publicKey.length !== ED25519_PUBLIC_KEY_BYTES) {
      throw new Error(`Invalid Ed25519 public key length: expected 32 bytes, got ${publicKey.length}`);
    }
    return { crv: 'Ed25519', kty: 'OKP', x: this.base64url(publicKey) };
  }

  /**
   * Build the public JWK for an ML-DSA-65 public key (RFC 9964 AKP form).
   */
  static mlDsa65PublicKeyToJwk(publicKey: Uint8Array): MlDsa65Jwk {
    if (publicKey.length !== ML_DSA_65_PUBLIC_KEY_BYTES) {
      throw new Error(`Invalid ML-DSA-65 public key length: expected 1952 bytes, got ${publicKey.length}`);
    }
    return { alg: 'ML-DSA-65', kty: 'AKP', pub: this.base64url(publicKey) };
  }

  /**
   * RFC 7638 JWK thumbprint: members sorted lexicographically, serialized as
   * JSON with no whitespace, UTF-8 encoded, SHA-256 hashed, base64url encoded.
   * The supplied JWK must contain exactly the required members for its key type.
   */
  static jwkThumbprint(jwk: Ed25519Jwk | MlDsa65Jwk | Record<string, string>): string {
    const sortedKeys = Object.keys(jwk).sort();
    const canonical = JSON.stringify(jwk, sortedKeys);
    const digest = sha256(new TextEncoder().encode(canonical));
    return this.base64url(digest);
  }

  /**
   * Classical key fingerprint: "e1_" + RFC 7638 thumbprint of the Ed25519 JWK.
   */
  static e1Fingerprint(ed25519PublicKey: Uint8Array): string {
    return `e1_${this.jwkThumbprint(this.ed25519PublicKeyToJwk(ed25519PublicKey))}`;
  }

  /**
   * Post-quantum key fingerprint: "pq1_" + RFC 7638 thumbprint of the AKP JWK.
   */
  static pq1Fingerprint(mlDsa65PublicKey: Uint8Array): string {
    return `pq1_${this.jwkThumbprint(this.mlDsa65PublicKeyToJwk(mlDsa65PublicKey))}`;
  }

  /**
   * Sign data with an Ed25519 secret key.
   */
  static async signEd25519(data: Uint8Array | string, secretKey: Uint8Array): Promise<Uint8Array> {
    const message = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    return ed25519.sign(message, secretKey);
  }

  /**
   * Verify an Ed25519 signature.
   */
  static async verifyEd25519(
    data: Uint8Array | string,
    signature: Uint8Array,
    publicKey: Uint8Array
  ): Promise<boolean> {
    try {
      const message = typeof data === 'string' ? new TextEncoder().encode(data) : data;
      return await ed25519.verify(signature, message, publicKey);
    } catch {
      return false;
    }
  }

  /**
   * Sign data with an ML-DSA-65 secret key (FIPS 204 final; 3309-byte signature).
   */
  static signMlDsa65(data: Uint8Array | string, secretKey: Uint8Array): Uint8Array {
    const message = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    return ml_dsa65.sign(message, secretKey);
  }

  /**
   * Verify an ML-DSA-65 signature.
   */
  static verifyMlDsa65(
    data: Uint8Array | string,
    signature: Uint8Array,
    publicKey: Uint8Array
  ): boolean {
    try {
      const message = typeof data === 'string' ? new TextEncoder().encode(data) : data;
      return ml_dsa65.verify(signature, message, publicKey);
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
