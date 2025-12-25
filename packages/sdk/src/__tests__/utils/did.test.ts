/**
 * Tests for DIDUtils
 */

import { DIDUtils } from '../../utils/did';
import { CryptoUtils } from '../../utils/crypto';
import { DIDDocument } from '../../types';

// Mock CryptoUtils
jest.mock('../../utils/crypto', () => ({
  CryptoUtils: {
    generateKeyPair: jest.fn(),
    createKeyFingerprint: jest.fn(),
    signData: jest.fn(),
    verifySignature: jest.fn()
  }
}));

describe('DIDUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    (CryptoUtils.generateKeyPair as jest.Mock).mockResolvedValue({
      publicKey: 'a'.repeat(64),
      privateKey: 'b'.repeat(128)
    });
    (CryptoUtils.createKeyFingerprint as jest.Mock).mockReturnValue('fingerprint123');
    (CryptoUtils.signData as jest.Mock).mockResolvedValue('signature123');
    (CryptoUtils.verifySignature as jest.Mock).mockResolvedValue(true);
  });

  describe('generateDID', () => {
    it('should generate a DID with default options', async () => {
      const result = await DIDUtils.generateDID();

      expect(result.did).toBe('did:atp:mainnet:fingerprint123');
      expect(result.document.id).toBe(result.did);
      expect(result.keyPair.publicKey).toBe('a'.repeat(64));
      expect(CryptoUtils.generateKeyPair).toHaveBeenCalled();
    });

    it('should generate DID for testnet', async () => {
      const result = await DIDUtils.generateDID({ network: 'testnet' });

      expect(result.did).toBe('did:atp:testnet:fingerprint123');
    });

    it('should generate DID for local network', async () => {
      const result = await DIDUtils.generateDID({ network: 'local' });

      expect(result.did).toBe('did:atp:local:fingerprint123');
    });

    it('should support custom method', async () => {
      const result = await DIDUtils.generateDID({ method: 'web' });

      expect(result.did).toBe('did:web:mainnet:fingerprint123');
    });

    it('should create valid DID document structure', async () => {
      const result = await DIDUtils.generateDID();

      expect(result.document['@context']).toContain('https://www.w3.org/ns/did/v1');
      expect(result.document.verificationMethod).toHaveLength(1);
      expect(result.document.authentication).toContain(`${result.did}#key-1`);
      expect(result.document.assertionMethod).toContain(`${result.did}#key-1`);
      expect(result.document.keyAgreement).toContain(`${result.did}#key-1`);
    });

    it('should include verification method with correct properties', async () => {
      const result = await DIDUtils.generateDID();
      const vm = result.document.verificationMethod[0];

      expect(vm.id).toBe(`${result.did}#key-1`);
      expect(vm.type).toBe('Ed25519VerificationKey2020');
      expect(vm.controller).toBe(result.did);
      expect(vm.publicKeyMultibase).toBeDefined();
    });
  });

  describe('parseDID', () => {
    it('should parse a valid DID', () => {
      const result = DIDUtils.parseDID('did:atp:mainnet:abc123');

      expect(result).toEqual({
        method: 'atp',
        network: 'mainnet',
        identifier: 'abc123',
        fragment: undefined
      });
    });

    it('should parse DID with fragment', () => {
      const result = DIDUtils.parseDID('did:atp:mainnet:abc123#key-1');

      expect(result).toEqual({
        method: 'atp',
        network: 'mainnet',
        identifier: 'abc123',
        fragment: 'key-1'
      });
    });

    it('should return null for invalid DID', () => {
      expect(DIDUtils.parseDID('invalid')).toBeNull();
      expect(DIDUtils.parseDID('did:invalid')).toBeNull();
      expect(DIDUtils.parseDID('')).toBeNull();
    });

    it('should parse DIDs with different methods', () => {
      const result = DIDUtils.parseDID('did:web:testnet:example');

      expect(result?.method).toBe('web');
      expect(result?.network).toBe('testnet');
    });
  });

  describe('isValidDID', () => {
    it('should return true for valid DIDs', () => {
      expect(DIDUtils.isValidDID('did:atp:mainnet:abc123')).toBe(true);
      expect(DIDUtils.isValidDID('did:web:testnet:example')).toBe(true);
      expect(DIDUtils.isValidDID('did:atp:local:xyz789#key-2')).toBe(true);
    });

    it('should return false for invalid DIDs', () => {
      expect(DIDUtils.isValidDID('invalid')).toBe(false);
      expect(DIDUtils.isValidDID('did:only-two-parts')).toBe(false);
      expect(DIDUtils.isValidDID('')).toBe(false);
    });
  });

  describe('extractPublicKey', () => {
    const mockDocument: DIDDocument = {
      id: 'did:atp:mainnet:test',
      '@context': ['https://www.w3.org/ns/did/v1'],
      verificationMethod: [{
        id: 'did:atp:mainnet:test#key-1',
        type: 'Ed25519VerificationKey2020',
        controller: 'did:atp:mainnet:test',
        publicKeyMultibase: 'z' + Buffer.from('abcd', 'hex').toString('base64url')
      }],
      authentication: ['did:atp:mainnet:test#key-1']
    };

    it('should extract public key from document', () => {
      const result = DIDUtils.extractPublicKey(mockDocument);

      expect(result).toBe('abcd');
    });

    it('should extract public key by specific key ID', () => {
      const result = DIDUtils.extractPublicKey(mockDocument, 'did:atp:mainnet:test#key-1');

      expect(result).toBe('abcd');
    });

    it('should return null for non-existent key ID', () => {
      const result = DIDUtils.extractPublicKey(mockDocument, 'did:atp:mainnet:test#key-99');

      expect(result).toBeNull();
    });

    it('should extract from JWK format', () => {
      const docWithJWK: DIDDocument = {
        id: 'did:atp:mainnet:test',
        '@context': ['https://www.w3.org/ns/did/v1'],
        verificationMethod: [{
          id: 'did:atp:mainnet:test#key-1',
          type: 'Ed25519VerificationKey2020',
          controller: 'did:atp:mainnet:test',
          publicKeyJwk: {
            x: Buffer.from('publickey', 'utf-8').toString('base64url'),
            kty: 'OKP',
            crv: 'Ed25519'
          }
        }],
        authentication: ['did:atp:mainnet:test#key-1']
      };

      const result = DIDUtils.extractPublicKey(docWithJWK);
      expect(result).toBeDefined();
    });
  });

  describe('addVerificationMethod', () => {
    const baseDocument: DIDDocument = {
      id: 'did:atp:mainnet:test',
      '@context': ['https://www.w3.org/ns/did/v1'],
      verificationMethod: [{
        id: 'did:atp:mainnet:test#key-1',
        type: 'Ed25519VerificationKey2020',
        controller: 'did:atp:mainnet:test',
        publicKeyMultibase: 'zABC123'
      }],
      authentication: ['did:atp:mainnet:test#key-1']
    };

    it('should add a new verification method', () => {
      const result = DIDUtils.addVerificationMethod(baseDocument, 'newpublickey123');

      expect(result.verificationMethod).toHaveLength(2);
      expect(result.verificationMethod[1].id).toBe('did:atp:mainnet:test#key-2');
    });

    it('should add to authentication by default', () => {
      const result = DIDUtils.addVerificationMethod(baseDocument, 'newpublickey123');

      expect(result.authentication).toContain('did:atp:mainnet:test#key-2');
    });

    it('should add to specified purposes', () => {
      const result = DIDUtils.addVerificationMethod(
        baseDocument,
        'newpublickey123',
        ['authentication', 'assertionMethod', 'keyAgreement']
      );

      expect(result.authentication).toContain('did:atp:mainnet:test#key-2');
      expect(result.assertionMethod).toContain('did:atp:mainnet:test#key-2');
      expect(result.keyAgreement).toContain('did:atp:mainnet:test#key-2');
    });

    it('should not modify original document', () => {
      const originalLength = baseDocument.verificationMethod.length;
      DIDUtils.addVerificationMethod(baseDocument, 'newpublickey123');

      expect(baseDocument.verificationMethod).toHaveLength(originalLength);
    });
  });

  describe('createResolutionResult', () => {
    const mockDocument: DIDDocument = {
      id: 'did:atp:mainnet:test',
      '@context': ['https://www.w3.org/ns/did/v1'],
      verificationMethod: [],
      authentication: []
    };

    it('should create resolution result with document', () => {
      const result = DIDUtils.createResolutionResult(mockDocument);

      expect(result['@context']).toBe('https://w3id.org/did-resolution/v1');
      expect(result.didDocument).toEqual(mockDocument);
      expect(result.didDocumentMetadata.created).toBeDefined();
      expect(result.didResolutionMetadata.contentType).toBe('application/did+ld+json');
    });

    it('should include custom metadata', () => {
      const result = DIDUtils.createResolutionResult(mockDocument, { version: 1 });

      expect(result.didDocumentMetadata.version).toBe(1);
    });
  });

  describe('signDIDDocument', () => {
    const mockDocument: DIDDocument = {
      id: 'did:atp:mainnet:test',
      '@context': ['https://www.w3.org/ns/did/v1'],
      verificationMethod: [{
        id: 'did:atp:mainnet:test#key-1',
        type: 'Ed25519VerificationKey2020',
        controller: 'did:atp:mainnet:test',
        publicKeyMultibase: 'zABC123'
      }],
      authentication: ['did:atp:mainnet:test#key-1']
    };

    it('should sign document and add proof', async () => {
      const result = await DIDUtils.signDIDDocument(mockDocument, 'privatekey123');

      expect(result.proof).toBeDefined();
      expect(result.proof!.type).toBe('Ed25519Signature2020');
      expect(result.proof!.proofValue).toBe('signature123');
      expect(result.proof!.verificationMethod).toBe('did:atp:mainnet:test#key-1');
    });

    it('should use specified key ID', async () => {
      const result = await DIDUtils.signDIDDocument(
        mockDocument,
        'privatekey123',
        'did:atp:mainnet:test#key-2'
      );

      expect(result.proof!.verificationMethod).toBe('did:atp:mainnet:test#key-2');
    });

    it('should include timestamp in proof', async () => {
      const result = await DIDUtils.signDIDDocument(mockDocument, 'privatekey123');

      expect(result.proof!.created).toBeDefined();
    });
  });

  describe('verifyDIDDocument', () => {
    it('should return false if no proof', async () => {
      const document: DIDDocument = {
        id: 'did:atp:mainnet:test',
        '@context': ['https://www.w3.org/ns/did/v1'],
        verificationMethod: [],
        authentication: []
      };

      const result = await DIDUtils.verifyDIDDocument(document);
      expect(result).toBe(false);
    });

    it('should verify document with valid proof', async () => {
      const document: DIDDocument = {
        id: 'did:atp:mainnet:test',
        '@context': ['https://www.w3.org/ns/did/v1'],
        verificationMethod: [{
          id: 'did:atp:mainnet:test#key-1',
          type: 'Ed25519VerificationKey2020',
          controller: 'did:atp:mainnet:test',
          publicKeyMultibase: 'z' + Buffer.from('abcd', 'hex').toString('base64url')
        }],
        authentication: ['did:atp:mainnet:test#key-1'],
        proof: {
          type: 'Ed25519Signature2020',
          created: '2024-01-01T00:00:00Z',
          verificationMethod: 'did:atp:mainnet:test#key-1',
          proofPurpose: 'assertionMethod',
          proofValue: 'signature123'
        }
      };

      const result = await DIDUtils.verifyDIDDocument(document);
      expect(result).toBe(true);
    });

    it('should return false if signature verification fails', async () => {
      (CryptoUtils.verifySignature as jest.Mock).mockResolvedValue(false);

      const document: DIDDocument = {
        id: 'did:atp:mainnet:test',
        '@context': ['https://www.w3.org/ns/did/v1'],
        verificationMethod: [{
          id: 'did:atp:mainnet:test#key-1',
          type: 'Ed25519VerificationKey2020',
          controller: 'did:atp:mainnet:test',
          publicKeyMultibase: 'z' + Buffer.from('abcd', 'hex').toString('base64url')
        }],
        authentication: ['did:atp:mainnet:test#key-1'],
        proof: {
          type: 'Ed25519Signature2020',
          created: '2024-01-01T00:00:00Z',
          verificationMethod: 'did:atp:mainnet:test#key-1',
          proofPurpose: 'assertionMethod',
          proofValue: 'invalidsig'
        }
      };

      const result = await DIDUtils.verifyDIDDocument(document);
      expect(result).toBe(false);
    });
  });

  describe('createServiceEndpoint', () => {
    it('should create a service endpoint object', () => {
      const result = DIDUtils.createServiceEndpoint(
        'did:atp:test#messaging',
        'MessagingService',
        'https://messaging.example.com'
      );

      expect(result).toEqual({
        id: 'did:atp:test#messaging',
        type: 'MessagingService',
        serviceEndpoint: 'https://messaging.example.com'
      });
    });
  });

  describe('didFromPublicKey', () => {
    it('should generate DID from public key', () => {
      const result = DIDUtils.didFromPublicKey('publickey123');

      expect(result).toBe('did:atp:mainnet:fingerprint123');
      expect(CryptoUtils.createKeyFingerprint).toHaveBeenCalledWith('publickey123');
    });

    it('should support custom network and method', () => {
      const result = DIDUtils.didFromPublicKey('publickey123', {
        network: 'testnet',
        method: 'web'
      });

      expect(result).toBe('did:web:testnet:fingerprint123');
    });
  });

  describe('validateDIDDocument', () => {
    it('should validate a correct DID document', () => {
      const document = {
        id: 'did:atp:mainnet:test',
        '@context': ['https://www.w3.org/ns/did/v1'],
        verificationMethod: [{
          id: 'did:atp:mainnet:test#key-1',
          type: 'Ed25519VerificationKey2020',
          controller: 'did:atp:mainnet:test',
          publicKeyMultibase: 'zABC123'
        }],
        authentication: ['did:atp:mainnet:test#key-1']
      };

      const result = DIDUtils.validateDIDDocument(document);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing id', () => {
      const document = {
        '@context': ['https://www.w3.org/ns/did/v1'],
        verificationMethod: [],
        authentication: []
      };

      const result = DIDUtils.validateDIDDocument(document);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing or invalid id');
    });

    it('should detect missing @context', () => {
      const document = {
        id: 'did:atp:mainnet:test',
        verificationMethod: [],
        authentication: []
      };

      const result = DIDUtils.validateDIDDocument(document);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing or invalid @context');
    });

    it('should detect invalid verification method', () => {
      const document = {
        id: 'did:atp:mainnet:test',
        '@context': ['https://www.w3.org/ns/did/v1'],
        verificationMethod: [{
          id: 'did:atp:mainnet:test#key-1'
          // Missing type, controller, and public key
        }],
        authentication: []
      };

      const result = DIDUtils.validateDIDDocument(document);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('verification method'))).toBe(true);
    });

    it('should detect verification method without public key', () => {
      const document = {
        id: 'did:atp:mainnet:test',
        '@context': ['https://www.w3.org/ns/did/v1'],
        verificationMethod: [{
          id: 'did:atp:mainnet:test#key-1',
          type: 'Ed25519VerificationKey2020',
          controller: 'did:atp:mainnet:test'
          // Missing publicKeyMultibase or publicKeyJwk
        }],
        authentication: ['did:atp:mainnet:test#key-1']
      };

      const result = DIDUtils.validateDIDDocument(document);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Missing public key'))).toBe(true);
    });
  });
});
