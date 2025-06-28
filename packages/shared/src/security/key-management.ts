import { randomBytes, createHash, scrypt } from 'crypto';
import { promisify } from 'util';
import { ATPEncryptionService } from '../encryption.js';

const scryptAsync = promisify(scrypt);

export interface KeyMetadata {
  keyId: string;
  version: number;
  algorithm: string;
  purpose: string;
  createdAt: Date;
  expiresAt?: Date;
  rotatedAt?: Date;
  status: 'active' | 'deprecated' | 'revoked';
}

export interface EncryptionKey {
  keyId: string;
  key: Buffer;
  metadata: KeyMetadata;
}

export interface KeyRotationPolicy {
  maxAge: number; // milliseconds
  rotateBeforeExpiry: number; // milliseconds
  autoRotate: boolean;
  retainOldKeys: number; // number of old keys to keep
}

export interface DerivedKeyParams {
  salt: Buffer;
  iterations: number;
  keyLength: number;
  algorithm: string;
}

export class ATPKeyManager {
  private keys: Map<string, EncryptionKey> = new Map();
  private currentKeys: Map<string, string> = new Map(); // purpose -> keyId
  private rotationPolicies: Map<string, KeyRotationPolicy> = new Map();
  private rotationTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    // Default rotation policies
    this.setRotationPolicy('encryption', {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      rotateBeforeExpiry: 7 * 24 * 60 * 60 * 1000, // 7 days before expiry
      autoRotate: true,
      retainOldKeys: 3
    });

    this.setRotationPolicy('signing', {
      maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
      rotateBeforeExpiry: 14 * 24 * 60 * 60 * 1000, // 14 days before expiry
      autoRotate: true,
      retainOldKeys: 5
    });

    this.setRotationPolicy('audit', {
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
      rotateBeforeExpiry: 30 * 24 * 60 * 60 * 1000, // 30 days before expiry
      autoRotate: true,
      retainOldKeys: 10 // Keep audit keys longer for compliance
    });
  }

  /**
   * Generate a new encryption key
   */
  generateKey(purpose: string, algorithm: string = 'aes-256-gcm'): EncryptionKey {
    const keyId = this.generateKeyId(purpose);
    const keyLength = this.getKeyLength(algorithm);
    const key = randomBytes(keyLength);
    
    const now = new Date();
    const policy = this.rotationPolicies.get(purpose);
    const expiresAt = policy ? new Date(now.getTime() + policy.maxAge) : undefined;

    const metadata: KeyMetadata = {
      keyId,
      version: 1,
      algorithm,
      purpose,
      createdAt: now,
      expiresAt,
      status: 'active'
    };

    const encryptionKey: EncryptionKey = { keyId, key, metadata };
    
    this.keys.set(keyId, encryptionKey);
    this.currentKeys.set(purpose, keyId);

    // Schedule rotation if auto-rotation is enabled
    if (policy?.autoRotate && expiresAt) {
      this.scheduleRotation(purpose, expiresAt, policy.rotateBeforeExpiry);
    }

    return encryptionKey;
  }

  /**
   * Derive a key from a password using PBKDF2/scrypt
   */
  async deriveKey(
    password: string,
    purpose: string,
    params?: Partial<DerivedKeyParams>
  ): Promise<EncryptionKey> {
    const defaultParams: DerivedKeyParams = {
      salt: randomBytes(32),
      iterations: 100000,
      keyLength: 32,
      algorithm: 'scrypt'
    };

    const derivedParams = { ...defaultParams, ...params };
    
    let derivedKey: Buffer;
    
    if (derivedParams.algorithm === 'scrypt') {
      derivedKey = await scryptAsync(password, derivedParams.salt, derivedParams.keyLength) as Buffer;
    } else {
      throw new Error(`Unsupported key derivation algorithm: ${derivedParams.algorithm}`);
    }

    const keyId = this.generateKeyId(purpose);
    const now = new Date();

    const metadata: KeyMetadata = {
      keyId,
      version: 1,
      algorithm: 'aes-256-gcm',
      purpose,
      createdAt: now,
      status: 'active'
    };

    const encryptionKey: EncryptionKey = { keyId, key: derivedKey, metadata };
    
    this.keys.set(keyId, encryptionKey);
    this.currentKeys.set(purpose, keyId);

    return encryptionKey;
  }

  /**
   * Get the current active key for a purpose
   */
  getCurrentKey(purpose: string): EncryptionKey | null {
    const keyId = this.currentKeys.get(purpose);
    if (!keyId) return null;
    
    const key = this.keys.get(keyId);
    if (!key || key.metadata.status !== 'active') return null;
    
    // Check if key is expired
    if (key.metadata.expiresAt && key.metadata.expiresAt < new Date()) {
      this.deprecateKey(keyId);
      return null;
    }
    
    return key;
  }

  /**
   * Get a specific key by ID
   */
  getKey(keyId: string): EncryptionKey | null {
    return this.keys.get(keyId) || null;
  }

  /**
   * Get all keys for a purpose (including deprecated ones for decryption)
   */
  getKeysForPurpose(purpose: string): EncryptionKey[] {
    return Array.from(this.keys.values())
      .filter(key => key.metadata.purpose === purpose)
      .sort((a, b) => b.metadata.createdAt.getTime() - a.metadata.createdAt.getTime());
  }

  /**
   * Rotate a key (create new, deprecate old)
   */
  rotateKey(purpose: string): EncryptionKey {
    const currentKey = this.getCurrentKey(purpose);
    
    if (currentKey) {
      this.deprecateKey(currentKey.keyId);
    }

    // Generate new key with incremented version
    const newKey = this.generateKey(purpose);
    const version = currentKey ? currentKey.metadata.version + 1 : 1;
    newKey.metadata.version = version;

    console.log(`🔄 Key rotated for purpose: ${purpose}, new keyId: ${newKey.keyId}, version: ${version}`);

    // Clean up old keys based on retention policy
    this.cleanupOldKeys(purpose);

    return newKey;
  }

  /**
   * Manually rotate all keys
   */
  rotateAllKeys(): void {
    const purposes = Array.from(this.currentKeys.keys());
    
    for (const purpose of purposes) {
      this.rotateKey(purpose);
    }
  }

  /**
   * Set rotation policy for a purpose
   */
  setRotationPolicy(purpose: string, policy: KeyRotationPolicy): void {
    this.rotationPolicies.set(purpose, policy);
    
    // Reschedule rotation if auto-rotation is enabled
    const currentKey = this.getCurrentKey(purpose);
    if (policy.autoRotate && currentKey?.metadata.expiresAt) {
      this.scheduleRotation(purpose, currentKey.metadata.expiresAt, policy.rotateBeforeExpiry);
    }
  }

  /**
   * Revoke a key (make it unusable)
   */
  revokeKey(keyId: string): boolean {
    const key = this.keys.get(keyId);
    if (!key) return false;

    key.metadata.status = 'revoked';
    
    // If this was the current key, rotate to a new one
    if (this.currentKeys.get(key.metadata.purpose) === keyId) {
      this.rotateKey(key.metadata.purpose);
    }

    console.log(`🚫 Key revoked: ${keyId}`);
    return true;
  }

  /**
   * Export key metadata (without the actual key material)
   */
  exportKeyMetadata(): KeyMetadata[] {
    return Array.from(this.keys.values()).map(key => ({ ...key.metadata }));
  }

  /**
   * Import a key (for key synchronization across services)
   */
  importKey(keyData: { keyId: string; keyHex: string; metadata: KeyMetadata }): void {
    const key = Buffer.from(keyData.keyHex, 'hex');
    const encryptionKey: EncryptionKey = {
      keyId: keyData.keyId,
      key,
      metadata: keyData.metadata
    };

    this.keys.set(keyData.keyId, encryptionKey);
    
    if (encryptionKey.metadata.status === 'active') {
      this.currentKeys.set(encryptionKey.metadata.purpose, keyData.keyId);
    }
  }

  /**
   * Encrypt data with the current key for a purpose
   */
  encrypt(data: string | Buffer, purpose: string): { encrypted: string; keyId: string } | null {
    const key = this.getCurrentKey(purpose);
    if (!key) return null;

    const encrypted = ATPEncryptionService.encryptWithKey(data, key.key);
    
    return {
      encrypted,
      keyId: key.keyId
    };
  }

  /**
   * Decrypt data with a specific key
   */
  decrypt(encryptedData: string, keyId: string): string | null {
    const key = this.getKey(keyId);
    if (!key || key.metadata.status === 'revoked') return null;

    try {
      return ATPEncryptionService.decryptWithKey(encryptedData, key.key);
    } catch (error) {
      console.error(`Failed to decrypt with key ${keyId}:`, error);
      return null;
    }
  }

  /**
   * Generate a unique key ID
   */
  private generateKeyId(purpose: string): string {
    const timestamp = Date.now().toString(36);
    const random = randomBytes(6).toString('hex');
    return `atp_${purpose}_${timestamp}_${random}`;
  }

  /**
   * Get key length for algorithm
   */
  private getKeyLength(algorithm: string): number {
    switch (algorithm) {
      case 'aes-128-gcm': return 16;
      case 'aes-256-gcm': return 32;
      case 'chacha20-poly1305': return 32;
      default: return 32;
    }
  }

  /**
   * Deprecate a key (still usable for decryption but not for new encryption)
   */
  private deprecateKey(keyId: string): void {
    const key = this.keys.get(keyId);
    if (key) {
      key.metadata.status = 'deprecated';
      key.metadata.rotatedAt = new Date();
    }
  }

  /**
   * Schedule automatic key rotation
   */
  private scheduleRotation(purpose: string, expiresAt: Date, rotateBeforeExpiry: number): void {
    // Clear existing timer
    const existingTimer = this.rotationTimers.get(purpose);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    const rotationTime = expiresAt.getTime() - rotateBeforeExpiry;
    const now = Date.now();
    
    if (rotationTime <= now) {
      // Should rotate immediately
      setTimeout(() => this.rotateKey(purpose), 1000);
      return;
    }

    const timer = setTimeout(() => {
      this.rotateKey(purpose);
    }, rotationTime - now);

    this.rotationTimers.set(purpose, timer);
  }

  /**
   * Clean up old keys based on retention policy
   */
  private cleanupOldKeys(purpose: string): void {
    const policy = this.rotationPolicies.get(purpose);
    if (!policy) return;

    const keys = this.getKeysForPurpose(purpose);
    const activeKeys = keys.filter(k => k.metadata.status === 'active');
    const deprecatedKeys = keys.filter(k => k.metadata.status === 'deprecated');

    // Keep only the specified number of deprecated keys
    if (deprecatedKeys.length > policy.retainOldKeys) {
      const keysToDelete = deprecatedKeys
        .sort((a, b) => a.metadata.createdAt.getTime() - b.metadata.createdAt.getTime())
        .slice(0, deprecatedKeys.length - policy.retainOldKeys);

      for (const key of keysToDelete) {
        this.keys.delete(key.keyId);
        console.log(`🗑️  Cleaned up old key: ${key.keyId}`);
      }
    }
  }

  /**
   * Get key rotation status and upcoming rotations
   */
  getRotationStatus(): Array<{
    purpose: string;
    currentKeyId: string;
    version: number;
    expiresAt?: Date;
    needsRotation: boolean;
    daysUntilRotation?: number;
  }> {
    const status: Array<any> = [];

    for (const purpose of this.currentKeys.keys()) {
      const key = this.getCurrentKey(purpose);
      if (!key) continue;

      const policy = this.rotationPolicies.get(purpose);
      const now = new Date();
      
      let needsRotation = false;
      let daysUntilRotation: number | undefined;

      if (key.metadata.expiresAt && policy) {
        const rotationTime = key.metadata.expiresAt.getTime() - policy.rotateBeforeExpiry;
        needsRotation = now.getTime() >= rotationTime;
        
        if (!needsRotation) {
          daysUntilRotation = Math.ceil((rotationTime - now.getTime()) / (24 * 60 * 60 * 1000));
        }
      }

      status.push({
        purpose,
        currentKeyId: key.keyId,
        version: key.metadata.version,
        expiresAt: key.metadata.expiresAt,
        needsRotation,
        daysUntilRotation
      });
    }

    return status;
  }

  /**
   * Cleanup timers when shutting down
   */
  cleanup(): void {
    for (const timer of this.rotationTimers.values()) {
      clearTimeout(timer);
    }
    this.rotationTimers.clear();
  }
}