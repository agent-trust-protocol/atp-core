import { CryptoUtils } from './crypto.js';
import { DIDDocument, VerificationMethod } from '../types.js';

/**
 * DID utilities for ATP™ SDK
 */
export class DIDUtils {
  /**
   * Generate a new ATP DID
   */
  static async generateDID(options?: {
    network?: 'mainnet' | 'testnet' | 'local';
    method?: string;
  }): Promise<{
    did: string;
    document: DIDDocument;
    keyPair: { publicKey: string; privateKey: string };
  }> {
    const network = options?.network || 'mainnet';
    const method = options?.method || 'atp';

    const keyPair = await CryptoUtils.generateKeyPair();
    const fingerprint = CryptoUtils.createKeyFingerprint(keyPair.publicKey);

    const did = `did:${method}:${network}:${fingerprint}`;

    const document: DIDDocument = {
      id: did,
      '@context': ['https://www.w3.org/ns/did/v1'],
      verificationMethod: [{
        id: `${did}#key-1`,
        type: 'Ed25519VerificationKey2020',
        controller: did,
        publicKeyMultibase: this.encodeMultibase(keyPair.publicKey)
      }],
      authentication: [`${did}#key-1`],
      assertionMethod: [`${did}#key-1`],
      keyAgreement: [`${did}#key-1`]
    };

    return {
      did,
      document,
      keyPair
    };
  }

  /**
   * Parse a DID string
   */
  static parseDID(did: string): {
    method: string;
    network: string;
    identifier: string;
    fragment?: string;
  } | null {
    const didRegex = /^did:([^:]+):([^:]+):([^#]+)(?:#(.+))?$/;
    const match = did.match(didRegex);

    if (!match) {
      return null;
    }

    return {
      method: match[1],
      network: match[2],
      identifier: match[3],
      fragment: match[4]
    };
  }

  /**
   * Validate DID format
   */
  static isValidDID(did: string): boolean {
    return this.parseDID(did) !== null;
  }

  /**
   * Extract public key from DID document
   */
  static extractPublicKey(document: DIDDocument, keyId?: string): string | null {
    const targetKeyId = keyId || `${document.id}#key-1`;

    const verificationMethod = document.verificationMethod?.find(
      vm => vm.id === targetKeyId
    );

    if (!verificationMethod) {
      return null;
    }

    if (verificationMethod.publicKeyMultibase) {
      return this.decodeMultibase(verificationMethod.publicKeyMultibase);
    }

    if (verificationMethod.publicKeyJwk) {
      // Convert JWK to hex (simplified)
      const jwk = verificationMethod.publicKeyJwk;
      if (jwk.x) {
        return Buffer.from(jwk.x, 'base64url').toString('hex');
      }
    }

    return null;
  }

  /**
   * Add verification method to DID document
   */
  static addVerificationMethod(
    document: DIDDocument,
    publicKey: string,
    purposes: ('authentication' | 'assertionMethod' | 'keyAgreement' | 'capabilityInvocation' | 'capabilityDelegation')[] = ['authentication']
  ): DIDDocument {
    const keyNumber = document.verificationMethod.length + 1;
    const keyId = `${document.id}#key-${keyNumber}`;

    const verificationMethod: VerificationMethod = {
      id: keyId,
      type: 'Ed25519VerificationKey2020',
      controller: document.id,
      publicKeyMultibase: this.encodeMultibase(publicKey)
    };

    const updatedDocument = { ...document };
    updatedDocument.verificationMethod = [...document.verificationMethod, verificationMethod];

    // Add to specified purposes
    purposes.forEach(purpose => {
      if (!updatedDocument[purpose]) {
        updatedDocument[purpose] = [];
      }
      updatedDocument[purpose]!.push(keyId);
    });

    return updatedDocument;
  }

  /**
   * Create DID resolution result
   */
  static createResolutionResult(
    document: DIDDocument,
    metadata?: any
  ): {
    '@context': string;
    didDocument: DIDDocument;
    didDocumentMetadata: any;
    didResolutionMetadata: any;
  } {
    return {
      '@context': 'https://w3id.org/did-resolution/v1',
      didDocument: document,
      didDocumentMetadata: {
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        ...metadata
      },
      didResolutionMetadata: {
        contentType: 'application/did+ld+json'
      }
    };
  }

  /**
   * Sign DID document
   */
  static async signDIDDocument(
    document: DIDDocument,
    privateKey: string,
    keyId?: string
  ): Promise<DIDDocument> {
    const targetKeyId = keyId || `${document.id}#key-1`;
    const documentJson = JSON.stringify(document, null, 2);
    const signature = await CryptoUtils.signData(documentJson, privateKey);

    // Add proof to document
    const signedDocument = {
      ...document,
      proof: {
        type: 'Ed25519Signature2020',
        created: new Date().toISOString(),
        verificationMethod: targetKeyId,
        proofPurpose: 'assertionMethod',
        proofValue: signature
      }
    };

    return signedDocument;
  }

  /**
   * Verify DID document signature
   */
  static async verifyDIDDocument(document: DIDDocument): Promise<boolean> {
    if (!document.proof) {
      return false;
    }

    const { proof, ...documentWithoutProof } = document;
    const publicKey = this.extractPublicKey(document, proof.verificationMethod);

    if (!publicKey) {
      return false;
    }

    const documentJson = JSON.stringify(documentWithoutProof, null, 2);
    return CryptoUtils.verifySignature(documentJson, proof.proofValue, publicKey);
  }

  /**
   * Create service endpoint
   */
  static createServiceEndpoint(
    id: string,
    type: string,
    serviceEndpoint: string
  ) {
    return {
      id,
      type,
      serviceEndpoint
    };
  }

  /**
   * Encode public key as multibase
   */
  private static encodeMultibase(publicKeyHex: string): string {
    // Simplified multibase encoding (base58btc)
    const publicKeyBuffer = Buffer.from(publicKeyHex, 'hex');
    // In a real implementation, this would use proper multibase encoding
    return `z${  publicKeyBuffer.toString('base64url')}`;
  }

  /**
   * Decode multibase public key
   */
  private static decodeMultibase(multibase: string): string {
    // Simplified multibase decoding
    if (multibase.startsWith('z')) {
      const base64url = multibase.slice(1);
      return Buffer.from(base64url, 'base64url').toString('hex');
    }
    throw new Error('Unsupported multibase encoding');
  }

  /**
   * Generate DID from public key
   */
  static didFromPublicKey(
    publicKey: string,
    options?: {
      network?: string;
      method?: string;
    }
  ): string {
    const network = options?.network || 'mainnet';
    const method = options?.method || 'atp';
    const fingerprint = CryptoUtils.createKeyFingerprint(publicKey);

    return `did:${method}:${network}:${fingerprint}`;
  }

  /**
   * Validate DID document structure
   */
  static validateDIDDocument(document: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!document.id || typeof document.id !== 'string') {
      errors.push('Missing or invalid id');
    }

    if (!document['@context'] || !Array.isArray(document['@context'])) {
      errors.push('Missing or invalid @context');
    }

    if (!document.verificationMethod || !Array.isArray(document.verificationMethod)) {
      errors.push('Missing or invalid verificationMethod');
    }

    if (!document.authentication || !Array.isArray(document.authentication)) {
      errors.push('Missing or invalid authentication');
    }

    // Validate verification methods
    if (document.verificationMethod) {
      document.verificationMethod.forEach((vm: any, index: number) => {
        if (!vm.id || !vm.type || !vm.controller) {
          errors.push(`Invalid verification method at index ${index}`);
        }
        if (!vm.publicKeyMultibase && !vm.publicKeyJwk) {
          errors.push(`Missing public key in verification method at index ${index}`);
        }
      });
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
