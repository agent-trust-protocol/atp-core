// packages/shared/src/crypto/pqc-crypto.ts

import { sha512 } from '@noble/hashes/sha512';
import * as ed25519 from '@noble/ed25519';
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa';
import { ml_kem768 } from '@noble/post-quantum/ml-kem';
import { randomBytes } from 'crypto';

// Custom CryptoKey interface for our implementation
export interface ATPCryptoKey {
  algorithm: { name: string };
  extractable: boolean;
  type: 'private' | 'public';
  usages: string[];
  keyData: Uint8Array;
}

export interface ATPCryptoKeyPair {
  privateKey: ATPCryptoKey;
  publicKey: ATPCryptoKey;
}

// Post-Quantum Algorithm Types
export enum PQCAlgorithm {
  // NIST PQC Winners
  CRYSTALS_KYBER = 'crystals-kyber',    // Key encapsulation
  CRYSTALS_DILITHIUM = 'crystals-dilithium', // Digital signatures
  FALCON = 'falcon',                     // Digital signatures
  SPHINCS_PLUS = 'sphincs+',            // Stateless hash-based signatures

  // Classical (for hybrid mode)
  ED25519 = 'ed25519',
  X25519 = 'x25519',
  AES_256_GCM = 'aes-256-gcm'
}

// Crypto Agility Configuration
export interface CryptoConfig {
  signatureAlgorithm: PQCAlgorithm;
  kemAlgorithm: PQCAlgorithm;
  hybridMode: boolean;
  classicalFallback: boolean;
  algorithmTransitionDate?: Date;
}

// Abstract Crypto Provider Interface
export interface ICryptoProvider {
  generateKeyPair(): Promise<ATPCryptoKeyPair>;
  sign(message: Uint8Array, privateKey: ATPCryptoKey): Promise<Uint8Array>;
  verify(message: Uint8Array, signature: Uint8Array, publicKey: ATPCryptoKey): Promise<boolean>;
  encapsulate(publicKey: ATPCryptoKey): Promise<{ ciphertext: Uint8Array; sharedSecret: Uint8Array }>;
  decapsulate(ciphertext: Uint8Array, privateKey: ATPCryptoKey): Promise<Uint8Array>;
}

// Hybrid Crypto Implementation
export class HybridCryptoProvider implements ICryptoProvider {
  private classicalProvider: ICryptoProvider;
  private pqcProvider: ICryptoProvider;

  constructor(
    private config: CryptoConfig,
    classicalProvider: ICryptoProvider,
    pqcProvider: ICryptoProvider
  ) {
    this.classicalProvider = classicalProvider;
    this.pqcProvider = pqcProvider;
  }

  async generateKeyPair(): Promise<ATPCryptoKeyPair> {
    if (this.config.hybridMode) {
      // Generate both classical and PQC key pairs
      const classicalPair = await this.classicalProvider.generateKeyPair();
      const pqcPair = await this.pqcProvider.generateKeyPair();

      // Combine into hybrid key pair
      return this.combineKeyPairs(classicalPair, pqcPair);
    }

    return this.pqcProvider.generateKeyPair();
  }

  async sign(message: Uint8Array, privateKey: ATPCryptoKey): Promise<Uint8Array> {
    if (this.config.hybridMode) {
      // Sign with both algorithms
      const { classical, pqc } = this.splitHybridKey(privateKey);
      const classicalSig = await this.classicalProvider.sign(message, classical);
      const pqcSig = await this.pqcProvider.sign(message, pqc);

      // Concatenate signatures
      return this.concatenateSignatures(classicalSig, pqcSig);
    }

    return this.pqcProvider.sign(message, privateKey);
  }

  async verify(message: Uint8Array, signature: Uint8Array, publicKey: ATPCryptoKey): Promise<boolean> {
    if (this.config.hybridMode) {
      const { classical, pqc } = this.splitHybridKey(publicKey);
      const { classicalSig, pqcSig } = this.splitHybridSignature(signature);

      // Both signatures must verify
      const classicalValid = await this.classicalProvider.verify(message, classicalSig, classical);
      const pqcValid = await this.pqcProvider.verify(message, pqcSig, pqc);

      return classicalValid && pqcValid;
    }

    return this.pqcProvider.verify(message, signature, publicKey);
  }

  async encapsulate(publicKey: ATPCryptoKey): Promise<{ ciphertext: Uint8Array; sharedSecret: Uint8Array }> {
    if (this.config.hybridMode) {
      const { classical, pqc } = this.splitHybridKey(publicKey);

      // Perform both encapsulations
      const classicalResult = await this.classicalProvider.encapsulate(classical);
      const pqcResult = await this.pqcProvider.encapsulate(pqc);

      // Combine shared secrets using KDF
      const combinedSecret = await this.combineSharedSecrets(
        classicalResult.sharedSecret,
        pqcResult.sharedSecret
      );

      return {
        ciphertext: this.concatenateCiphertexts(classicalResult.ciphertext, pqcResult.ciphertext),
        sharedSecret: combinedSecret
      };
    }

    return this.pqcProvider.encapsulate(publicKey);
  }

  async decapsulate(ciphertext: Uint8Array, privateKey: ATPCryptoKey): Promise<Uint8Array> {
    if (this.config.hybridMode) {
      const { classical, pqc } = this.splitHybridKey(privateKey);
      const { classicalCipher, pqcCipher } = this.splitHybridCiphertext(ciphertext);

      // Decapsulate both
      const classicalSecret = await this.classicalProvider.decapsulate(classicalCipher, classical);
      const pqcSecret = await this.pqcProvider.decapsulate(pqcCipher, pqc);

      // Combine secrets
      return this.combineSharedSecrets(classicalSecret, pqcSecret);
    }

    return this.pqcProvider.decapsulate(ciphertext, privateKey);
  }

  // Helper methods
  private combineKeyPairs(classical: ATPCryptoKeyPair, pqc: ATPCryptoKeyPair): ATPCryptoKeyPair {
    // Combine key pairs into hybrid format by concatenating key data
    const combinedPublicKey = new Uint8Array(classical.publicKey.keyData.length + pqc.publicKey.keyData.length);
    combinedPublicKey.set(classical.publicKey.keyData, 0);
    combinedPublicKey.set(pqc.publicKey.keyData, classical.publicKey.keyData.length);

    const combinedPrivateKey = new Uint8Array(classical.privateKey.keyData.length + pqc.privateKey.keyData.length);
    combinedPrivateKey.set(classical.privateKey.keyData, 0);
    combinedPrivateKey.set(pqc.privateKey.keyData, classical.privateKey.keyData.length);

    return {
      publicKey: {
        algorithm: { name: 'Hybrid' },
        extractable: true,
        type: 'public',
        usages: ['verify'],
        keyData: combinedPublicKey
      },
      privateKey: {
        algorithm: { name: 'Hybrid' },
        extractable: true,
        type: 'private',
        usages: ['sign'],
        keyData: combinedPrivateKey
      }
    };
  }

  private splitHybridKey(key: ATPCryptoKey): { classical: ATPCryptoKey; pqc: ATPCryptoKey } {
    // Split hybrid key into classical and PQC components
    // For Ed25519: 32 bytes public key, 32 bytes private key
    // For Dilithium: larger keys (varies by variant)

    const ed25519KeySize = key.type === 'public' ? 32 : 32;
    const classicalKeyData = key.keyData.slice(0, ed25519KeySize);
    const pqcKeyData = key.keyData.slice(ed25519KeySize);

    return {
      classical: {
        algorithm: { name: 'Ed25519' },
        extractable: true,
        type: key.type,
        usages: key.usages,
        keyData: classicalKeyData
      },
      pqc: {
        algorithm: { name: 'Dilithium' },
        extractable: true,
        type: key.type,
        usages: key.usages,
        keyData: pqcKeyData
      }
    };
  }

  private concatenateSignatures(classical: Uint8Array, pqc: Uint8Array): Uint8Array {
    const result = new Uint8Array(classical.length + pqc.length + 4);
    const view = new DataView(result.buffer);

    // Store lengths for parsing
    view.setUint16(0, classical.length);
    view.setUint16(2, pqc.length);

    // Copy signatures
    result.set(classical, 4);
    result.set(pqc, 4 + classical.length);

    return result;
  }

  private splitHybridSignature(signature: Uint8Array): { classicalSig: Uint8Array; pqcSig: Uint8Array } {
    const view = new DataView(signature.buffer);
    const classicalLen = view.getUint16(0);
    const pqcLen = view.getUint16(2);

    return {
      classicalSig: signature.slice(4, 4 + classicalLen),
      pqcSig: signature.slice(4 + classicalLen)
    };
  }

  private concatenateCiphertexts(classical: Uint8Array, pqc: Uint8Array): Uint8Array {
    // Similar to signature concatenation
    return this.concatenateSignatures(classical, pqc);
  }

  private splitHybridCiphertext(ciphertext: Uint8Array): { classicalCipher: Uint8Array; pqcCipher: Uint8Array } {
    // Similar to signature splitting
    const result = this.splitHybridSignature(ciphertext);
    return {
      classicalCipher: result.classicalSig,
      pqcCipher: result.pqcSig
    };
  }

  private async combineSharedSecrets(classical: Uint8Array, pqc: Uint8Array): Promise<Uint8Array> {
    // Use KDF to combine secrets
    const combined = new Uint8Array(classical.length + pqc.length);
    combined.set(classical, 0);
    combined.set(pqc, classical.length);

    // Apply SHA-512 as KDF
    return sha512(combined);
  }
}

// Crypto Agility Manager
export class CryptoAgilityManager {
  private providers: Map<PQCAlgorithm, ICryptoProvider> = new Map();
  private currentConfig: CryptoConfig;

  constructor(initialConfig: CryptoConfig) {
    this.currentConfig = initialConfig;
    this.initializeProviders();
  }

  private initializeProviders(): void {
    // Register all supported providers
    const ed25519Provider = new Ed25519Provider();
    this.providers.set(PQCAlgorithm.ED25519, ed25519Provider);
    this.providers.set(PQCAlgorithm.X25519, ed25519Provider); // Use Ed25519 for X25519 too
    this.providers.set(PQCAlgorithm.CRYSTALS_DILITHIUM, new DilithiumProvider());
    this.providers.set(PQCAlgorithm.CRYSTALS_KYBER, new KyberProvider());
  }

  async getCurrentProvider(): Promise<ICryptoProvider> {
    const signatureProvider = this.providers.get(this.currentConfig.signatureAlgorithm);
    const kemProvider = this.providers.get(this.currentConfig.kemAlgorithm);

    if (!signatureProvider || !kemProvider) {
      throw new Error('Required crypto providers not available');
    }

    if (this.currentConfig.hybridMode) {
      const classicalSig = this.providers.get(PQCAlgorithm.ED25519)!;
      const classicalKem = this.providers.get(PQCAlgorithm.X25519)!;

      return new HybridCryptoProvider(
        this.currentConfig,
        classicalSig, // For now, using signature provider as classical
        signatureProvider // PQC provider
      );
    }

    return signatureProvider;
  }

  async transitionToAlgorithm(newAlgorithm: PQCAlgorithm, options?: {
    gracePeriod?: number;
    hybridTransition?: boolean;
  }): Promise<void> {
    if (options?.hybridTransition) {
      // First transition to hybrid mode
      this.currentConfig.hybridMode = true;
      this.currentConfig.signatureAlgorithm = newAlgorithm;

      // After grace period, disable hybrid mode
      if (options.gracePeriod) {
        setTimeout(() => {
          this.currentConfig.hybridMode = false;
        }, options.gracePeriod);
      }
    } else {
      // Direct transition
      this.currentConfig.signatureAlgorithm = newAlgorithm;
    }
  }

  // Algorithm negotiation for interoperability
  async negotiateAlgorithms(peerCapabilities: PQCAlgorithm[]): Promise<CryptoConfig> {
    // Find best common algorithm
    const ourCapabilities = Array.from(this.providers.keys());
    const common = ourCapabilities.filter(alg => peerCapabilities.includes(alg));

    if (common.length === 0 && this.currentConfig.classicalFallback) {
      // Fall back to classical algorithms
      return {
        signatureAlgorithm: PQCAlgorithm.ED25519,
        kemAlgorithm: PQCAlgorithm.X25519,
        hybridMode: false,
        classicalFallback: true
      };
    }

    // Prefer PQC algorithms
    const pqcAlgorithms = common.filter(alg =>
      alg !== PQCAlgorithm.ED25519 &&
      alg !== PQCAlgorithm.X25519 &&
      alg !== PQCAlgorithm.AES_256_GCM
    );

    if (pqcAlgorithms.length > 0) {
      return {
        signatureAlgorithm: pqcAlgorithms[0],
        kemAlgorithm: pqcAlgorithms[0],
        hybridMode: this.currentConfig.hybridMode,
        classicalFallback: false
      };
    }

    throw new Error('No compatible algorithms found');
  }
}

// Ed25519 Implementation using @noble/ed25519
class Ed25519Provider implements ICryptoProvider {
  async generateKeyPair(): Promise<ATPCryptoKeyPair> {
    const privateKey = ed25519.utils.randomPrivateKey();
    const publicKey = await ed25519.getPublicKeyAsync(privateKey);

    // Convert to CryptoKey format for consistency
    return {
      privateKey: await this.createCryptoKey(privateKey, 'private'),
      publicKey: await this.createCryptoKey(publicKey, 'public')
    };
  }

  async sign(message: Uint8Array, privateKey: ATPCryptoKey): Promise<Uint8Array> {
    const privKeyBytes = await this.extractKeyBytes(privateKey);
    return await ed25519.signAsync(message, privKeyBytes);
  }

  async verify(message: Uint8Array, signature: Uint8Array, publicKey: ATPCryptoKey): Promise<boolean> {
    try {
      const pubKeyBytes = await this.extractKeyBytes(publicKey);
      return await ed25519.verifyAsync(signature, message, pubKeyBytes);
    } catch {
      return false;
    }
  }

  async encapsulate(publicKey: ATPCryptoKey): Promise<{ ciphertext: Uint8Array; sharedSecret: Uint8Array }> {
    // For Ed25519, we'll use ECDH-like operation
    const ephemeralPriv = ed25519.utils.randomPrivateKey();
    const ephemeralPub = await ed25519.getPublicKeyAsync(ephemeralPriv);
    const pubKeyBytes = await this.extractKeyBytes(publicKey);

    // Simple shared secret derivation (in production, use proper KDF)
    const sharedSecret = sha512(new Uint8Array([...ephemeralPriv, ...pubKeyBytes]));

    return {
      ciphertext: ephemeralPub,
      sharedSecret: sharedSecret.slice(0, 32) // Use first 32 bytes
    };
  }

  async decapsulate(ciphertext: Uint8Array, privateKey: ATPCryptoKey): Promise<Uint8Array> {
    const privKeyBytes = await this.extractKeyBytes(privateKey);

    // Derive shared secret
    const sharedSecret = sha512(new Uint8Array([...privKeyBytes, ...ciphertext]));
    return sharedSecret.slice(0, 32);
  }

  private async createCryptoKey(keyBytes: Uint8Array, type: 'private' | 'public'): Promise<ATPCryptoKey> {
    // Store raw bytes in a custom CryptoKey-like object
    return {
      algorithm: { name: 'Ed25519' },
      extractable: true,
      type,
      usages: type === 'private' ? ['sign'] : ['verify'],
      keyData: keyBytes
    };
  }

  private async extractKeyBytes(key: ATPCryptoKey): Promise<Uint8Array> {
    if (!key.keyData) {
      throw new Error('Invalid key format');
    }
    return key.keyData;
  }
}

class DilithiumProvider implements ICryptoProvider {
  async generateKeyPair(): Promise<ATPCryptoKeyPair> {
    const keyPair = ml_dsa65.keygen(randomBytes(32));

    return {
      privateKey: await this.createCryptoKey(keyPair.secretKey, 'private'),
      publicKey: await this.createCryptoKey(keyPair.publicKey, 'public')
    };
  }

  async sign(message: Uint8Array, privateKey: ATPCryptoKey): Promise<Uint8Array> {
    const privKeyBytes = await this.extractKeyBytes(privateKey);
    return ml_dsa65.sign(privKeyBytes, message);
  }

  async verify(message: Uint8Array, signature: Uint8Array, publicKey: ATPCryptoKey): Promise<boolean> {
    try {
      const pubKeyBytes = await this.extractKeyBytes(publicKey);
      return ml_dsa65.verify(pubKeyBytes, message, signature);
    } catch {
      return false;
    }
  }

  async encapsulate(publicKey: ATPCryptoKey): Promise<{ ciphertext: Uint8Array; sharedSecret: Uint8Array }> {
    throw new Error('Not applicable for signature algorithms');
  }

  async decapsulate(ciphertext: Uint8Array, privateKey: ATPCryptoKey): Promise<Uint8Array> {
    throw new Error('Not applicable for signature algorithms');
  }

  private async createCryptoKey(keyBytes: Uint8Array, type: 'private' | 'public'): Promise<ATPCryptoKey> {
    return {
      algorithm: { name: 'Dilithium' },
      extractable: true,
      type,
      usages: type === 'private' ? ['sign'] : ['verify'],
      keyData: keyBytes
    };
  }

  private async extractKeyBytes(key: ATPCryptoKey): Promise<Uint8Array> {
    if (!key.keyData) {
      throw new Error('Invalid key format');
    }
    return key.keyData;
  }
}

class KyberProvider implements ICryptoProvider {
  async generateKeyPair(): Promise<ATPCryptoKeyPair> {
    const keyPair = ml_kem768.keygen(randomBytes(64));

    return {
      privateKey: await this.createCryptoKey(keyPair.secretKey, 'private'),
      publicKey: await this.createCryptoKey(keyPair.publicKey, 'public')
    };
  }

  async sign(message: Uint8Array, privateKey: ATPCryptoKey): Promise<Uint8Array> {
    throw new Error('Not applicable for KEM algorithms');
  }

  async verify(message: Uint8Array, signature: Uint8Array, publicKey: ATPCryptoKey): Promise<boolean> {
    throw new Error('Not applicable for KEM algorithms');
  }

  async encapsulate(publicKey: ATPCryptoKey): Promise<{ ciphertext: Uint8Array; sharedSecret: Uint8Array }> {
    const pubKeyBytes = await this.extractKeyBytes(publicKey);
    const result = ml_kem768.encapsulate(pubKeyBytes);

    return {
      ciphertext: result.cipherText,
      sharedSecret: result.sharedSecret
    };
  }

  async decapsulate(ciphertext: Uint8Array, privateKey: ATPCryptoKey): Promise<Uint8Array> {
    const privKeyBytes = await this.extractKeyBytes(privateKey);
    return ml_kem768.decapsulate(ciphertext, privKeyBytes);
  }

  private async createCryptoKey(keyBytes: Uint8Array, type: 'private' | 'public'): Promise<ATPCryptoKey> {
    return {
      algorithm: { name: 'Kyber' },
      extractable: true,
      type,
      usages: type === 'private' ? ['deriveBits'] : ['deriveBits'],
      keyData: keyBytes
    };
  }

  private async extractKeyBytes(key: ATPCryptoKey): Promise<Uint8Array> {
    if (!key.keyData) {
      throw new Error('Invalid key format');
    }
    return key.keyData;
  }
}

// Export default configuration
export const defaultPQCConfig: CryptoConfig = {
  signatureAlgorithm: PQCAlgorithm.ED25519, // Start with classical
  kemAlgorithm: PQCAlgorithm.X25519,
  hybridMode: true, // Enable hybrid by default for transition
  classicalFallback: true,
  algorithmTransitionDate: new Date('2025-12-31') // Example transition date
};
