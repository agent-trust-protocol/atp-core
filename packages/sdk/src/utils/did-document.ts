import { base58 } from '@scure/base';
import { sha256 } from '@noble/hashes/sha2.js';
import { CryptoUtils, HybridKeyPair, ED25519_PUBLIC_KEY_BYTES } from './crypto.js';
import { DidAtp } from './did.js';
import { jcsCanonicalize } from './jcs.js';
import {
  AtpDidDocument,
  AtpPqProof,
  DataIntegrityProof,
  VerificationMethod
} from '../types.js';

/**
 * did:atp v2 DID Document layer.
 *
 * The spec (docs/specs/did-atp/index.html, "DID Document Requirements") is a
 * deliberately hybrid, two-mechanism design: the classical binding uses
 * did:wba's `eddsa-jcs-2022` W3C Data Integrity proof, while the post-quantum
 * binding uses an ML-DSA-65 JWS per RFC 9964 — because the finalized W3C
 * quantum-safe cryptosuites stop at ML-DSA-44 and did:atp targets category 3.
 * Verification MUST fail unless BOTH proofs and BOTH path fingerprints check
 * out; a valid classical proof alone is never sufficient.
 */

/** multicodec ed25519-pub varint prefix (0xed 0x01). */
const ED25519_PUB_MULTICODEC = Uint8Array.from([0xed, 0x01]);

const ED25519_VM_FRAGMENT = 'key-ed25519';
const ML_DSA_65_VM_FRAGMENT = 'key-mldsa65';

const DID_CONTEXT = 'https://www.w3.org/ns/did/v1';
const DATA_INTEGRITY_CONTEXT = 'https://w3id.org/security/data-integrity/v2';
const JWK_CONTEXT = 'https://w3id.org/security/jwk/v1';
const MULTIKEY_CONTEXT = 'https://w3id.org/security/multikey/v1';

/** RFC 9964 JOSE algorithm identifier for ML-DSA-65. */
const ML_DSA_65_JOSE_ALG = 'ML-DSA-65';

export class DidAtpDocument {
  /**
   * Encode an Ed25519 public key as a Multikey publicKeyMultibase value:
   * base58btc multibase ('z' prefix) of multicodec ed25519-pub (0xed01)
   * followed by the 32 raw key bytes. Matches did:key Ed25519 encoding.
   */
  static ed25519ToMultibase(publicKey: Uint8Array): string {
    if (publicKey.length !== ED25519_PUBLIC_KEY_BYTES) {
      throw new Error(`Invalid Ed25519 public key length: expected 32 bytes, got ${publicKey.length}`);
    }
    const prefixed = new Uint8Array(ED25519_PUB_MULTICODEC.length + publicKey.length);
    prefixed.set(ED25519_PUB_MULTICODEC, 0);
    prefixed.set(publicKey, ED25519_PUB_MULTICODEC.length);
    return `z${base58.encode(prefixed)}`;
  }

  /**
   * Decode a Multikey publicKeyMultibase value back to the raw 32-byte
   * Ed25519 public key. Throws if the multibase/multicodec prefix is wrong.
   */
  static multibaseToEd25519(publicKeyMultibase: string): Uint8Array {
    if (!publicKeyMultibase.startsWith('z')) {
      throw new Error('publicKeyMultibase must use base58btc multibase ("z" prefix)');
    }
    const decoded = base58.decode(publicKeyMultibase.slice(1));
    if (decoded[0] !== 0xed || decoded[1] !== 0x01) {
      throw new Error('publicKeyMultibase is not multicodec ed25519-pub (0xed01)');
    }
    const key = decoded.slice(2);
    if (key.length !== ED25519_PUBLIC_KEY_BYTES) {
      throw new Error(`Invalid Ed25519 key length in multibase: ${key.length}`);
    }
    return key;
  }

  /**
   * Build and dual-sign the DID Document for a path-type did:atp identifier.
   */
  static async create(
    domain: string,
    path: string[],
    keyPair: HybridKeyPair,
    options: { created?: string; service?: AtpDidDocument['service'] } = {}
  ): Promise<{ did: string; document: AtpDidDocument }> {
    const did = DidAtp.fromPublicKeys(
      domain,
      path,
      keyPair.ed25519.publicKey,
      keyPair.mlDsa65.publicKey
    );

    const classicalVm: VerificationMethod = {
      id: `${did}#${ED25519_VM_FRAGMENT}`,
      type: 'Multikey',
      controller: did,
      publicKeyMultibase: this.ed25519ToMultibase(keyPair.ed25519.publicKey)
    };
    const pqVm: VerificationMethod = {
      id: `${did}#${ML_DSA_65_VM_FRAGMENT}`,
      type: 'JsonWebKey',
      controller: did,
      publicKeyJwk: CryptoUtils.mlDsa65PublicKeyToJwk(keyPair.mlDsa65.publicKey)
    };

    const unsigned: AtpDidDocument = {
      '@context': [DID_CONTEXT, DATA_INTEGRITY_CONTEXT, MULTIKEY_CONTEXT, JWK_CONTEXT],
      id: did,
      verificationMethod: [classicalVm, pqVm],
      authentication: [classicalVm.id, pqVm.id],
      ...(options.service ? { service: options.service } : {})
    };

    const created = options.created ?? new Date().toISOString();
    const proof = await this.signClassicalProof(unsigned, keyPair.ed25519.secretKey, classicalVm.id, created);
    const atpPqProof = this.signPqProof(unsigned, keyPair.mlDsa65.secretKey, pqVm.id, created);

    return { did, document: { ...unsigned, proof, atpPqProof } };
  }

  /**
   * Key rotation per "Method Operations / Update": because both binding-key
   * fingerprints are path segments of the identifier, rotating either key
   * yields a NEW DID — the old DID is never updated in place. This takes the
   * old DID (for its domain and path) and a fresh hybrid keypair, and
   * produces the new DID plus a freshly dual-signed did.json to serve in
   * place of the old one. The old DID simply stops resolving once its
   * did.json is replaced (or is removed entirely — see Deactivate in
   * utils/resolver.ts).
   */
  static async rotate(
    oldDid: string,
    newKeyPair: HybridKeyPair,
    options: { created?: string; service?: AtpDidDocument['service'] } = {}
  ): Promise<{ previousDid: string; did: string; document: AtpDidDocument }> {
    const parsed = DidAtp.parse(oldDid);
    if (!parsed || parsed.type !== 'path') {
      throw new Error(`Cannot rotate: "${oldDid}" is not a valid path-type did:atp identifier`);
    }
    const { did, document } = await this.create(parsed.domain, parsed.path, newKeyPair, options);
    if (did === parsed.did) {
      throw new Error('Rotation requires new key material: the new keypair produces the same DID');
    }
    return { previousDid: parsed.did, did, document };
  }

  /**
   * eddsa-jcs-2022 Data Integrity proof (VC-DI-EdDSA): sign
   * sha256(JCS(proof config)) || sha256(JCS(unsecured document)).
   */
  private static async signClassicalProof(
    unsigned: AtpDidDocument,
    secretKey: Uint8Array,
    verificationMethod: string,
    created: string
  ): Promise<DataIntegrityProof> {
    const config: Omit<DataIntegrityProof, 'proofValue'> = {
      type: 'DataIntegrityProof',
      cryptosuite: 'eddsa-jcs-2022',
      created,
      verificationMethod,
      proofPurpose: 'authentication',
      '@context': unsigned['@context']
    };
    const signature = await CryptoUtils.signEd25519(this.classicalHashData(unsigned, config), secretKey);
    const { '@context': _ctx, ...rest } = config;
    return { ...rest, proofValue: `z${base58.encode(signature)}` };
  }

  private static classicalHashData(
    unsigned: AtpDidDocument,
    config: Omit<DataIntegrityProof, 'proofValue'>
  ): Uint8Array {
    const configHash = sha256(new TextEncoder().encode(jcsCanonicalize(config)));
    const docHash = sha256(new TextEncoder().encode(jcsCanonicalize(unsigned)));
    const data = new Uint8Array(configHash.length + docHash.length);
    data.set(configHash, 0);
    data.set(docHash, configHash.length);
    return data;
  }

  /**
   * Post-quantum integrity signature: a compact RFC 9964 JWS
   * (alg "ML-DSA-65") whose payload is the JCS-canonicalized unsecured
   * document. Stored under `atpPqProof` per the spec's hybrid
   * two-mechanism design (classical Data Integrity + PQ JOSE).
   */
  private static signPqProof(
    unsigned: AtpDidDocument,
    secretKey: Uint8Array,
    verificationMethod: string,
    created: string
  ): AtpPqProof {
    const header = { alg: ML_DSA_65_JOSE_ALG, typ: 'JOSE' };
    const encode = (s: string) => CryptoUtils.base64url(new TextEncoder().encode(s));
    const signingInput = `${encode(JSON.stringify(header))}.${encode(jcsCanonicalize(unsigned))}`;
    const signature = CryptoUtils.signMlDsa65(new TextEncoder().encode(signingInput), secretKey);
    return {
      type: 'AtpPqProof',
      created,
      verificationMethod,
      proofPurpose: 'authentication',
      jws: `${signingInput}.${CryptoUtils.base64url(signature)}`
    };
  }

  /**
   * Full resolution-time verification per "Method Operations / Resolve":
   * recompute e1_ from VM[0] and pq1_ from VM[1] and require both to match
   * the DID path, then verify the eddsa-jcs-2022 proof AND the ML-DSA-65
   * JWS. Any single failure makes the document invalid — a valid classical
   * proof is never sufficient on its own.
   */
  static async verify(document: AtpDidDocument): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    const parsed = DidAtp.parse(document.id);
    if (!parsed || parsed.type !== 'path') {
      return { valid: false, errors: ['document id is not a valid path-type did:atp identifier'] };
    }

    const classicalVm = document.verificationMethod?.find((vm) => vm.type === 'Multikey');
    const pqVm = document.verificationMethod?.find((vm) => vm.type === 'JsonWebKey');

    let ed25519PublicKey: Uint8Array | null = null;
    if (!classicalVm?.publicKeyMultibase) {
      errors.push('missing Multikey verification method');
    } else {
      try {
        ed25519PublicKey = this.multibaseToEd25519(classicalVm.publicKeyMultibase);
        if (!CryptoUtils.constantTimeEqual(parsed.e1!, CryptoUtils.e1Fingerprint(ed25519PublicKey))) {
          errors.push('e1_ fingerprint does not match the classical verification method');
        }
      } catch (e) {
        errors.push(`invalid publicKeyMultibase: ${(e as Error).message}`);
      }
    }

    let mlDsaPublicKey: Uint8Array | null = null;
    const jwk = pqVm?.publicKeyJwk;
    if (!jwk || jwk.kty !== 'AKP' || jwk.alg !== 'ML-DSA-65' || typeof jwk.pub !== 'string') {
      errors.push('missing or malformed ML-DSA-65 AKP verification method');
    } else {
      mlDsaPublicKey = new Uint8Array(Buffer.from(jwk.pub, 'base64url'));
      if (!CryptoUtils.constantTimeEqual(parsed.pq1!, CryptoUtils.pq1Fingerprint(mlDsaPublicKey))) {
        errors.push('pq1_ fingerprint does not match the post-quantum verification method');
      }
    }

    const { proof, atpPqProof, ...unsigned } = document;

    if (!proof || proof.cryptosuite !== 'eddsa-jcs-2022') {
      errors.push('missing eddsa-jcs-2022 Data Integrity proof');
    } else if (ed25519PublicKey) {
      const ok = await this.verifyClassicalProof(unsigned as AtpDidDocument, proof, ed25519PublicKey);
      if (!ok) errors.push('eddsa-jcs-2022 proof verification failed');
    }

    if (!atpPqProof?.jws) {
      errors.push('missing atpPqProof (RFC 9964 ML-DSA-65 JWS)');
    } else if (mlDsaPublicKey) {
      const ok = this.verifyPqProof(unsigned as AtpDidDocument, atpPqProof, mlDsaPublicKey);
      if (!ok) errors.push('atpPqProof ML-DSA-65 JWS verification failed');
    }

    return { valid: errors.length === 0, errors };
  }

  /** Verify only the classical Data Integrity proof (used by tests/diagnostics). */
  static async verifyClassicalProof(
    unsigned: AtpDidDocument,
    proof: DataIntegrityProof,
    ed25519PublicKey: Uint8Array
  ): Promise<boolean> {
    if (!proof.proofValue?.startsWith('z')) return false;
    let signature: Uint8Array;
    try {
      signature = base58.decode(proof.proofValue.slice(1));
    } catch {
      return false;
    }
    const { proofValue: _pv, ...options } = proof;
    const config = { ...options, '@context': unsigned['@context'] };
    return CryptoUtils.verifyEd25519(
      this.classicalHashData(unsigned, config as Omit<DataIntegrityProof, 'proofValue'>),
      signature,
      ed25519PublicKey
    );
  }

  /** Verify only the post-quantum JWS (used by tests/diagnostics). */
  static verifyPqProof(
    unsigned: AtpDidDocument,
    atpPqProof: AtpPqProof,
    mlDsaPublicKey: Uint8Array
  ): boolean {
    const parts = atpPqProof.jws.split('.');
    if (parts.length !== 3) return false;
    const [headerB64, payloadB64, signatureB64] = parts;
    try {
      const header = JSON.parse(Buffer.from(headerB64, 'base64url').toString('utf8'));
      if (header.alg !== ML_DSA_65_JOSE_ALG) return false;
      const payload = Buffer.from(payloadB64, 'base64url').toString('utf8');
      if (payload !== jcsCanonicalize(unsigned)) return false;
      return CryptoUtils.verifyMlDsa65(
        new TextEncoder().encode(`${headerB64}.${payloadB64}`),
        new Uint8Array(Buffer.from(signatureB64, 'base64url')),
        mlDsaPublicKey
      );
    } catch {
      return false;
    }
  }
}
