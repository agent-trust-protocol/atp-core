import * as ed25519 from '@noble/ed25519';
import { createHash } from 'crypto';
import { sha256 } from '@noble/hashes/sha2.js';
import { initializeCrypto, CryptoAgilityManager, defaultPQCConfig, PQCAlgorithm, verifySignatureCompat } from '@atp/shared';

// Initialize crypto polyfills
initializeCrypto();

/**
 * Byte sizes for the did:atp v2 hybrid key model (FIPS 204 final, ML-DSA-65).
 * The hybrid keypair produced by @atp/shared concatenates the 32-byte Ed25519
 * public key with the 1952-byte ML-DSA-65 public key, so the ML-DSA-65 portion
 * is the tail of the combined `pqcPublicKey`.
 */
const ED25519_PUBLIC_KEY_BYTES = 32;
const ML_DSA_65_PUBLIC_KEY_BYTES = 1952;

/**
 * Default resolution authority for did:atp v2 identifiers minted by this
 * service. did:atp is domain-based (no network segment); the domain is the
 * HTTPS authority that serves the did.json. Override with ATP_DID_DOMAIN.
 */
const DEFAULT_ATP_DID_DOMAIN = 'agents.atp.local';

// One-time guard so we warn (rather than spam) when DIDs are minted under the
// non-resolvable default domain because ATP_DID_DOMAIN is unset.
let warnedMissingDidDomain = false;

const PATH_SEGMENT_RE = /^[A-Za-z0-9._-]+$/;
const DOMAIN_RE = /^(?=.{1,253}(%3[aA]|$))[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*(%3[aA][0-9]{1,5})?$/;

// Enhanced key pair interface for quantum-safe support
export interface QuantumSafeKeyPair {
  // Classical keys (for backward compatibility)
  publicKey: string;
  privateKey: string;
  
  // Quantum-safe keys (optional for hybrid mode)
  pqcPublicKey?: string;
  pqcPrivateKey?: string;
  
  // Algorithm information
  algorithm: PQCAlgorithm;
  isQuantumSafe: boolean;
  hybridMode: boolean;
}

export class CryptoUtils {
  private static cryptoManager = new CryptoAgilityManager(defaultPQCConfig);

  /**
   * Dedicated manager that yields a *real* ML-DSA-65 keypair. The default
   * config's "hybrid" provider pairs Ed25519 with Ed25519 (its signature
   * algorithm is ED25519), so it never produces post-quantum key material.
   * Configuring the manager for CRYSTALS_DILITHIUM with hybridMode off makes
   * getCurrentProvider() return the ML-DSA-65 (Dilithium) provider directly,
   * whose generateKeyPair() emits the 1952-byte FIPS 204 public key required
   * by the did:atp v2 pq1_ binding.
   */
  private static pqcManager = new CryptoAgilityManager({
    signatureAlgorithm: PQCAlgorithm.CRYSTALS_DILITHIUM,
    kemAlgorithm: PQCAlgorithm.CRYSTALS_KYBER,
    hybridMode: false,
    classicalFallback: false,
  });

  // Enhanced quantum-safe key pair generation.
  //
  // Produces a genuine did:atp v2 hybrid keypair: an independent Ed25519
  // classical key (the e1_ binding) and an independent ML-DSA-65 post-quantum
  // key (the pq1_ binding). The combined `pqcPublicKey` is encoded as
  // Ed25519(32 bytes) || ML-DSA-65(1952 bytes) so the post-quantum binding key
  // can be recovered by extractBindingPublicKeys().
  static async generateQuantumSafeKeyPair(quantumSafe: boolean = true): Promise<QuantumSafeKeyPair> {
    if (quantumSafe) {
      // Independent classical Ed25519 keypair.
      const classical = await this.generateKeyPair();
      const edPublic = Buffer.from(classical.publicKey, 'hex');
      const edPrivate = Buffer.from(classical.privateKey, 'hex');

      // Independent post-quantum ML-DSA-65 keypair (real FIPS 204 key material).
      const pqcProvider = await this.pqcManager.getCurrentProvider();
      const pqcPair = await pqcProvider.generateKeyPair();
      const mlPublic = Buffer.from(pqcPair.publicKey.keyData);
      const mlPrivate = Buffer.from(pqcPair.privateKey.keyData);

      return {
        publicKey: classical.publicKey,
        privateKey: classical.privateKey,
        // Combined encoding: classical public/private prefix || ML-DSA-65 key.
        pqcPublicKey: Buffer.concat([edPublic, mlPublic]).toString('hex'),
        pqcPrivateKey: Buffer.concat([edPrivate, mlPrivate]).toString('hex'),
        algorithm: PQCAlgorithm.CRYSTALS_DILITHIUM,
        isQuantumSafe: true,
        hybridMode: true
      };
    } else {
      // Generate classical Ed25519 keys only
      const classicalKeys = await this.generateKeyPair();
      return {
        publicKey: classicalKeys.publicKey,
        privateKey: classicalKeys.privateKey,
        algorithm: PQCAlgorithm.ED25519,
        isQuantumSafe: false,
        hybridMode: false
      };
    }
  }
  
  // Backward compatible method
  static async generateKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
    const privateKeyBytes = ed25519.utils.randomPrivateKey();
    const publicKeyBytes = await ed25519.getPublicKey(privateKeyBytes);
    
    return {
      privateKey: Buffer.from(privateKeyBytes).toString('hex'),
      publicKey: Buffer.from(publicKeyBytes).toString('hex'),
    };
  }

  static async sign(message: string, privateKeyHex: string): Promise<string> {
    const messageBytes = Buffer.from(message, 'utf8');
    const privateKeyBytes = Buffer.from(privateKeyHex, 'hex');
    const signature = await ed25519.sign(messageBytes, privateKeyBytes);
    return Buffer.from(signature).toString('hex');
  }

  static async verify(message: string, signatureHex: string, publicKeyHex: string): Promise<boolean> {
    try {
      const messageBytes = Buffer.from(message, 'utf8');
      const signatureBytes = Buffer.from(signatureHex, 'hex');
      const publicKeyBytes = Buffer.from(publicKeyHex, 'hex');
      return await ed25519.verify(signatureBytes, messageBytes, publicKeyBytes);
    } catch {
      return false;
    }
  }

  /**
   * Backward-compatible verification for the did:atp v2 rollout. Verifies a
   * legacy Ed25519 signature or a v2 post-quantum ML-DSA-65 signature,
   * auto-selecting by signature size. Pass whichever public key(s) the
   * signer's DID Document exposes.
   */
  static async verifyCompat(
    message: string,
    signatureHex: string,
    keys: { ed25519PublicKeyHex?: string; mlDsa65PublicKeyHex?: string }
  ): Promise<boolean> {
    const result = await verifySignatureCompat(message, signatureHex, keys);
    return result.valid;
  }
  
  // Quantum-safe signing with hybrid algorithms
  static async signQuantumSafe(
    message: string, 
    keyPair: QuantumSafeKeyPair
  ): Promise<{ signature: string; isQuantumSafe: boolean }> {
    const messageBytes = Buffer.from(message, 'utf8');
    
    if (keyPair.isQuantumSafe && keyPair.pqcPrivateKey) {
      // Sign with the post-quantum ML-DSA-65 binding. The combined pqcPrivateKey
      // is Ed25519(32 bytes) || ML-DSA-65; strip the classical prefix and use
      // the ML-DSA provider (the default cryptoManager is Ed25519-only and would
      // reject the oversized key).
      const provider = await this.pqcManager.getCurrentProvider();
      const mlDsaPrivateKey = Buffer.from(keyPair.pqcPrivateKey, 'hex').subarray(
        ED25519_PUBLIC_KEY_BYTES
      );
      const privateKey = {
        algorithm: { name: keyPair.algorithm },
        extractable: true,
        type: 'private' as const,
        usages: ['sign'],
        keyData: mlDsaPrivateKey
      };

      const signature = await provider.sign(messageBytes, privateKey);
      return {
        signature: Buffer.from(signature).toString('hex'),
        isQuantumSafe: true
      };
    } else {
      // Fall back to classical Ed25519
      const signature = await this.sign(message, keyPair.privateKey);
      return {
        signature,
        isQuantumSafe: false
      };
    }
  }
  
  // Quantum-safe verification
  static async verifyQuantumSafe(
    message: string, 
    signatureHex: string, 
    keyPair: QuantumSafeKeyPair
  ): Promise<boolean> {
    const messageBytes = Buffer.from(message, 'utf8');
    const signatureBytes = Buffer.from(signatureHex, 'hex');
    
    if (keyPair.isQuantumSafe && keyPair.pqcPublicKey) {
      try {
        // Verify against the post-quantum ML-DSA-65 binding. pqcPublicKey is
        // Ed25519(32 bytes) || ML-DSA-65; strip the classical prefix and use
        // the ML-DSA provider.
        const provider = await this.pqcManager.getCurrentProvider();
        const mlDsaPublicKey = Buffer.from(keyPair.pqcPublicKey, 'hex').subarray(
          ED25519_PUBLIC_KEY_BYTES
        );
        const publicKey = {
          algorithm: { name: keyPair.algorithm },
          extractable: true,
          type: 'public' as const,
          usages: ['verify'],
          keyData: mlDsaPublicKey
        };

        return await provider.verify(messageBytes, signatureBytes, publicKey);
      } catch {
        // Fall back to classical verification
        return this.verify(message, signatureHex, keyPair.publicKey);
      }
    } else {
      // Use classical Ed25519 verification
      return this.verify(message, signatureHex, keyPair.publicKey);
    }
  }

  /**
   * @deprecated Legacy v1 did:atp identifier (`did:atp:<multibase>`). This is
   * NOT the spec-v2 syntax (docs/specs/did-atp/index.html) and is retained only
   * so that pre-existing v1 DIDs and callers continue to resolve during the
   * rollout. New identifiers MUST be produced with {@link generateQuantumSafeDID}
   * (which now emits spec-v2) or {@link buildAtpV2Did}.
   */
  static generateDID(publicKeyHex: string): string {
    const publicKeyBytes = Buffer.from(publicKeyHex, 'hex');
    const multibase = this.encodeMultibase(publicKeyBytes);
    return `did:atp:${multibase}`;
  }

  // ---------------------------------------------------------------------------
  // did:atp v2 identifier construction (spec: docs/specs/did-atp/index.html).
  //
  // A path-type did:atp v2 identifier is:
  //   did:atp:<domain>:<path...>:e1_<thumbprint>:pq1_<thumbprint>
  // where e1_ is the RFC 7638 JWK thumbprint of the Ed25519 binding key and
  // pq1_ is the RFC 7638 JWK thumbprint of the ML-DSA-65 (AKP) binding key.
  //
  // This MUST stay byte-compatible with the SDK's `DidAtp`/`CryptoUtils`
  // (packages/sdk/src/utils) so a DID minted here parses and resolves there.
  // The fingerprint algorithm only uses SHA-256 from @noble/hashes (no new
  // crypto primitives are introduced).
  // ---------------------------------------------------------------------------

  /** base64url without padding (RFC 4648 §5). */
  static base64url(bytes: Uint8Array): string {
    return Buffer.from(bytes).toString('base64url');
  }

  /**
   * RFC 7638 JWK thumbprint: members sorted lexicographically, serialized as
   * JSON with no whitespace, UTF-8 encoded, SHA-256 hashed, base64url encoded.
   */
  static jwkThumbprint(jwk: Record<string, string>): string {
    const sortedKeys = Object.keys(jwk).sort();
    const canonical = JSON.stringify(jwk, sortedKeys);
    const digest = sha256(new TextEncoder().encode(canonical));
    return this.base64url(digest);
  }

  /** Classical key fingerprint: "e1_" + RFC 7638 thumbprint of the Ed25519 JWK. */
  static e1Fingerprint(ed25519PublicKey: Uint8Array): string {
    if (ed25519PublicKey.length !== ED25519_PUBLIC_KEY_BYTES) {
      throw new Error(`Invalid Ed25519 public key length: expected 32 bytes, got ${ed25519PublicKey.length}`);
    }
    const jwk = { crv: 'Ed25519', kty: 'OKP', x: this.base64url(ed25519PublicKey) };
    return `e1_${this.jwkThumbprint(jwk)}`;
  }

  /** Post-quantum key fingerprint: "pq1_" + RFC 7638 thumbprint of the AKP JWK. */
  static pq1Fingerprint(mlDsa65PublicKey: Uint8Array): string {
    if (mlDsa65PublicKey.length !== ML_DSA_65_PUBLIC_KEY_BYTES) {
      throw new Error(`Invalid ML-DSA-65 public key length: expected 1952 bytes, got ${mlDsa65PublicKey.length}`);
    }
    const jwk = { alg: 'ML-DSA-65', kty: 'AKP', pub: this.base64url(mlDsa65PublicKey) };
    return `pq1_${this.jwkThumbprint(jwk)}`;
  }

  /**
   * Build a path-type did:atp v2 identifier from the two raw binding public
   * keys, a resolution domain, and at least one path segment (per the spec
   * ABNF, path-type DIDs require >=1 segment).
   */
  static buildAtpV2Did(
    domain: string,
    path: string[],
    ed25519PublicKey: Uint8Array,
    mlDsa65PublicKey: Uint8Array
  ): string {
    if (!DOMAIN_RE.test(domain)) {
      throw new Error(`Invalid did:atp domain: "${domain}" (lowercase hostname, optional %3A port)`);
    }
    if (!Array.isArray(path) || path.length === 0) {
      throw new Error('A path-type did:atp requires at least one path segment');
    }
    for (const segment of path) {
      if (!PATH_SEGMENT_RE.test(segment)) {
        throw new Error(`Invalid did:atp path segment: "${segment}"`);
      }
    }
    const e1 = this.e1Fingerprint(ed25519PublicKey);
    const pq1 = this.pq1Fingerprint(mlDsa65PublicKey);
    return `did:atp:${domain}:${path.join(':')}:${e1}:${pq1}`;
  }

  /**
   * Split the raw Ed25519 and ML-DSA-65 public keys out of a hybrid keypair.
   * The hybrid `pqcPublicKey` is the @atp/shared combined encoding
   * (Ed25519 32 bytes || ML-DSA-65 1952 bytes); the standalone `publicKey`
   * field already holds the 32-byte Ed25519 key.
   */
  static extractBindingPublicKeys(keyPair: QuantumSafeKeyPair): {
    ed25519PublicKey: Uint8Array;
    mlDsa65PublicKey: Uint8Array;
  } | null {
    if (!keyPair.isQuantumSafe || !keyPair.pqcPublicKey) return null;
    const ed25519PublicKey = new Uint8Array(Buffer.from(keyPair.publicKey, 'hex'));
    const combined = new Uint8Array(Buffer.from(keyPair.pqcPublicKey, 'hex'));
    if (ed25519PublicKey.length !== ED25519_PUBLIC_KEY_BYTES) return null;
    // The combined buffer is Ed25519(32) || ML-DSA-65(1952); take the tail.
    const mlDsa65PublicKey = combined.slice(ED25519_PUBLIC_KEY_BYTES);
    if (mlDsa65PublicKey.length !== ML_DSA_65_PUBLIC_KEY_BYTES) return null;
    return { ed25519PublicKey, mlDsa65PublicKey };
  }

  /**
   * Enhanced DID generation for quantum-safe keys — now emits a spec-v2
   * did:atp identifier (domain + path + e1_ + pq1_ fingerprints). When the
   * keypair is hybrid (Ed25519 + ML-DSA-65), the post-quantum binding is bound
   * into the identifier itself. If only classical key material is available
   * (legacy/classical-only registration), it falls back to the legacy v1
   * identifier so existing flows keep working.
   *
   * @param keyPair the (preferably hybrid) keypair to bind
   * @param options.domain resolution authority (defaults to ATP_DID_DOMAIN env
   *                        var, then DEFAULT_ATP_DID_DOMAIN)
   * @param options.path   path segments (defaults to a single random agent id)
   */
  static generateQuantumSafeDID(
    keyPair: QuantumSafeKeyPair,
    options: {
      domain?: string;
      path?: string[];
      // Optional precomputed binding, so callers that already extracted it
      // (e.g. registerDID, which needs it for the verification methods) don't
      // pay for a second extraction.
      binding?: {
        ed25519PublicKey: Uint8Array;
        mlDsa65PublicKey: Uint8Array;
      } | null;
    } = {}
  ): string {
    const binding = options.binding ?? this.extractBindingPublicKeys(keyPair);
    if (!binding) {
      // Classical-only key material cannot satisfy the dual-binding v2 syntax.
      return this.generateDID(keyPair.publicKey);
    }
    const envDomain = options.domain ?? process.env.ATP_DID_DOMAIN;
    const domain = envDomain ?? DEFAULT_ATP_DID_DOMAIN;
    if (!envDomain && !warnedMissingDidDomain) {
      warnedMissingDidDomain = true;
      console.warn(
        `[ATP][identity] ATP_DID_DOMAIN is not set; minting did:atp identifiers under ` +
          `the non-resolvable default "${DEFAULT_ATP_DID_DOMAIN}". Set ATP_DID_DOMAIN to ` +
          `your HTTPS resolution domain so agent DIDs resolve outside this host.`
      );
    }
    const path = options.path ?? [`agent-${this.randomLabel()}`];
    return this.buildAtpV2Did(domain, path, binding.ed25519PublicKey, binding.mlDsa65PublicKey);
  }

  /** Short URL-safe random label for a default agent path segment. */
  private static randomLabel(): string {
    return Buffer.from(ed25519.utils.randomPrivateKey().slice(0, 8)).toString('hex');
  }

  static encodeMultibase(bytes: Buffer): string {
    const ed25519Prefix = Buffer.from([0xed, 0x01]);
    const prefixedKey = Buffer.concat([ed25519Prefix, bytes]);
    return 'z' + this.base58Encode(prefixedKey);
  }

  static base58Encode(buffer: Buffer): string {
    const alphabet = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let result = '';
    let num = BigInt('0x' + buffer.toString('hex'));
    
    while (num > 0) {
      const remainder = num % 58n;
      num = num / 58n;
      result = alphabet[Number(remainder)] + result;
    }
    
    for (let i = 0; i < buffer.length && buffer[i] === 0; i++) {
      result = '1' + result;
    }
    
    return result;
  }

  static sha256(data: string): string {
    return createHash('sha256').update(data).digest('hex');
  }
}