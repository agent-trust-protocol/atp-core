/**
 * Tests for ZKP (Zero-Knowledge Proof) utilities
 *
 * These tests verify the core ZKP functionality for agent-to-agent authentication
 */

import {
  generatePedersenCommitment,
  generateRandomBlinding,
  generateNonce,
  generateChallengeHash,
  createChallenge,
  isChallengeExpired,
  createTrustLevelProof,
  verifyTrustLevelProof,
  createCredentialProof,
  verifyCredentialProof,
  createIdentityProof,
  verifyIdentityProof,
  createBehaviorCommitment,
  createBehaviorProof,
  verifyBehaviorProof,
  BehaviorMerkleTree
} from '../../utils/zkp.js';
import { ZKProofType } from '../../types.js';
import type { ZKPRequirement, VerifiableCredential, DIDDocument } from '../../types.js';

describe('ZKP Utilities', () => {
  // Test private key for signing (in real use, this would be securely generated)
  const testPrivateKey = 'a'.repeat(64);

  describe('Pedersen Commitments', () => {
    it('should generate consistent commitments for same inputs', () => {
      const value = BigInt(42);
      const blinding = BigInt(123456789);

      const commitment1 = generatePedersenCommitment(value, blinding);
      const commitment2 = generatePedersenCommitment(value, blinding);

      expect(commitment1).toBe(commitment2);
      expect(commitment1).toHaveLength(64); // SHA-256 hex output
    });

    it('should generate different commitments for different values', () => {
      const blinding = BigInt(123456789);

      const commitment1 = generatePedersenCommitment(BigInt(42), blinding);
      const commitment2 = generatePedersenCommitment(BigInt(43), blinding);

      expect(commitment1).not.toBe(commitment2);
    });

    it('should generate different commitments for different blindings', () => {
      const value = BigInt(42);

      const commitment1 = generatePedersenCommitment(value, BigInt(1));
      const commitment2 = generatePedersenCommitment(value, BigInt(2));

      expect(commitment1).not.toBe(commitment2);
    });

    it('should generate cryptographically random blinding factors', () => {
      const blinding1 = generateRandomBlinding();
      const blinding2 = generateRandomBlinding();

      expect(blinding1).not.toBe(blinding2);
      expect(blinding1.toString(16).length).toBeGreaterThan(32);
    });
  });

  describe('Nonce and Challenge Generation', () => {
    it('should generate unique nonces', () => {
      const nonce1 = generateNonce();
      const nonce2 = generateNonce();

      expect(nonce1).not.toBe(nonce2);
      expect(nonce1).toHaveLength(64);
    });

    it('should generate consistent challenge hashes', () => {
      const commitment = 'abc123';
      const publicData = 'test-data';

      const hash1 = generateChallengeHash(commitment, publicData);
      const hash2 = generateChallengeHash(commitment, publicData);

      expect(hash1).toBe(hash2);
    });

    it('should generate different challenges for different inputs', () => {
      const hash1 = generateChallengeHash('commitment1', 'data');
      const hash2 = generateChallengeHash('commitment2', 'data');

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Challenge Creation and Expiration', () => {
    const verifierDid = 'did:atp:verifier123';
    const proverDid = 'did:atp:prover456';
    const requirements: ZKPRequirement[] = [
      { type: ZKProofType.TRUST_LEVEL, params: { minTrustLevel: 0.5 } }
    ];

    it('should create a valid challenge', () => {
      const challenge = createChallenge(verifierDid, proverDid, requirements);

      expect(challenge.id).toMatch(/^challenge-/);
      expect(challenge.verifierDid).toBe(verifierDid);
      expect(challenge.proverDid).toBe(proverDid);
      expect(challenge.proofTypes).toContain(ZKProofType.TRUST_LEVEL);
      expect(challenge.requirements).toHaveLength(1);
      expect(challenge.nonce).toHaveLength(64);
      expect(new Date(challenge.timestamp)).toBeInstanceOf(Date);
      expect(new Date(challenge.expiresAt)).toBeInstanceOf(Date);
    });

    it('should not be expired immediately after creation', () => {
      const challenge = createChallenge(verifierDid, proverDid, requirements);
      expect(isChallengeExpired(challenge)).toBe(false);
    });

    it('should respect custom expiration time', () => {
      const challenge = createChallenge(verifierDid, proverDid, requirements, 1); // 1 minute

      const expiresAt = new Date(challenge.expiresAt);
      const timestamp = new Date(challenge.timestamp);
      const diffMinutes = (expiresAt.getTime() - timestamp.getTime()) / (1000 * 60);

      expect(diffMinutes).toBeCloseTo(1, 0);
    });

    it('should detect expired challenges', () => {
      const challenge = createChallenge(verifierDid, proverDid, requirements);
      // Manually set to expired
      challenge.expiresAt = new Date(Date.now() - 1000).toISOString();

      expect(isChallengeExpired(challenge)).toBe(true);
    });
  });

  describe('Trust Level Proofs', () => {
    it('should create a valid trust level proof when score meets threshold', () => {
      const proof = createTrustLevelProof(0.75, 0.5, testPrivateKey);

      expect(proof.type).toBe(ZKProofType.TRUST_LEVEL);
      expect(proof.commitment).toHaveLength(64);
      expect(proof.challenge).toHaveLength(64);
      expect(proof.response).toBeTruthy();
      expect(proof.publicInputs).toContain('0.5');
      expect(proof.timestamp).toBeTruthy();
    });

    it('should throw when score does not meet threshold', () => {
      expect(() => createTrustLevelProof(0.3, 0.5, testPrivateKey))
        .toThrow('Trust score does not meet minimum requirement');
    });

    it('should verify a valid trust level proof', () => {
      const proof = createTrustLevelProof(0.75, 0.5, testPrivateKey);
      const requirement: ZKPRequirement = {
        type: ZKProofType.TRUST_LEVEL,
        params: { minTrustLevel: 0.5 }
      };

      expect(verifyTrustLevelProof(proof, requirement)).toBe(true);
    });

    it('should reject proof with wrong type', () => {
      const proof = createTrustLevelProof(0.75, 0.5, testPrivateKey);
      proof.type = ZKProofType.IDENTITY; // Wrong type

      const requirement: ZKPRequirement = {
        type: ZKProofType.TRUST_LEVEL,
        params: { minTrustLevel: 0.5 }
      };

      expect(verifyTrustLevelProof(proof, requirement)).toBe(false);
    });
  });

  describe('Credential Proofs', () => {
    const mockCredential: VerifiableCredential = {
      '@context': ['https://www.w3.org/2018/credentials/v1'],
      id: 'urn:uuid:test-credential',
      type: ['VerifiableCredential', 'APIAccessCredential'],
      issuer: 'did:atp:issuer123',
      issuanceDate: new Date().toISOString(),
      credentialSubject: {
        id: 'did:atp:subject456',
        apiLevel: 'premium',
        rateLimit: 1000
      },
      proof: {
        type: 'Ed25519Signature2020',
        proofValue: 'mock-proof'
      }
    };

    it('should create a valid credential proof', () => {
      const proof = createCredentialProof(mockCredential, [], testPrivateKey);

      expect(proof.type).toBe(ZKProofType.CREDENTIAL);
      expect(proof.publicInputs).toContain('APIAccessCredential');
    });

    it('should support selective disclosure', () => {
      const proof = createCredentialProof(mockCredential, ['apiLevel'], testPrivateKey);

      expect(proof.merkleProof).toBeDefined();
      expect(proof.publicInputs).toContain('apiLevel');
    });

    it('should verify credential proof with matching type', () => {
      const proof = createCredentialProof(mockCredential, [], testPrivateKey);
      const requirement: ZKPRequirement = {
        type: ZKProofType.CREDENTIAL,
        params: { credentialType: 'APIAccessCredential' }
      };

      expect(verifyCredentialProof(proof, requirement)).toBe(true);
    });

    it('should reject credential proof with wrong type', () => {
      const proof = createCredentialProof(mockCredential, [], testPrivateKey);
      const requirement: ZKPRequirement = {
        type: ZKProofType.CREDENTIAL,
        params: { credentialType: 'WrongType' }
      };

      expect(verifyCredentialProof(proof, requirement)).toBe(false);
    });
  });

  describe('Identity Proofs', () => {
    const mockDid = 'did:atp:test123';
    const mockDidDocument: DIDDocument = {
      id: mockDid,
      '@context': ['https://www.w3.org/ns/did/v1'],
      verificationMethod: [
        {
          id: `${mockDid}#key-1`,
          type: 'Ed25519VerificationKey2020',
          controller: mockDid,
          publicKeyMultibase: 'z6Mk...'
        }
      ],
      authentication: [`${mockDid}#key-1`]
    };

    it('should create a valid identity proof', () => {
      const proof = createIdentityProof(mockDid, mockDidDocument, testPrivateKey);

      expect(proof.type).toBe(ZKProofType.IDENTITY);
      expect(proof.publicInputs).toContain('did:atp');
    });

    it('should verify ATP DID identity proof', () => {
      const proof = createIdentityProof(mockDid, mockDidDocument, testPrivateKey);

      expect(verifyIdentityProof(proof)).toBe(true);
    });

    it('should verify did:key identity proof', () => {
      const keyDid = 'did:key:test123';
      const keyDidDocument: DIDDocument = {
        ...mockDidDocument,
        id: keyDid
      };

      const proof = createIdentityProof(keyDid, keyDidDocument, testPrivateKey);

      expect(verifyIdentityProof(proof)).toBe(true);
    });
  });

  describe('Behavior Proofs', () => {
    let merkleTree: BehaviorMerkleTree;

    beforeEach(() => {
      merkleTree = new BehaviorMerkleTree();
    });

    it('should create behavior commitments', () => {
      const commitment = createBehaviorCommitment('interaction-1', 'success');

      expect(commitment.interactionId).toBe('interaction-1');
      expect(commitment.commitment).toHaveLength(64);
      expect(commitment.timestamp).toBeTruthy();
    });

    it('should add commitments to merkle tree', () => {
      merkleTree.addCommitment(createBehaviorCommitment('int-1', 'success'));
      merkleTree.addCommitment(createBehaviorCommitment('int-2', 'success'));

      const commitments = merkleTree.getCommitments();
      expect(commitments).toHaveLength(2);
    });

    it('should compute merkle root', () => {
      merkleTree.addCommitment(createBehaviorCommitment('int-1', 'success'));
      merkleTree.addCommitment(createBehaviorCommitment('int-2', 'success'));

      const root = merkleTree.getRoot();
      expect(root).toHaveLength(64);
    });

    it('should return consistent merkle root', () => {
      merkleTree.addCommitment(createBehaviorCommitment('int-1', 'success'));

      const root1 = merkleTree.getRoot();
      const root2 = merkleTree.getRoot();

      expect(root1).toBe(root2);
    });

    it('should filter commitments by time range', () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      merkleTree.addCommitment(createBehaviorCommitment('int-1', 'success'));
      merkleTree.addCommitment(createBehaviorCommitment('int-2', 'success'));

      const inRange = merkleTree.getCommitmentsInRange(
        yesterday.toISOString(),
        tomorrow.toISOString()
      );

      expect(inRange).toHaveLength(2);
    });

    describe('Behavior Proof Generation', () => {
      beforeEach(() => {
        // Add some successful interactions
        for (let i = 0; i < 10; i++) {
          merkleTree.addCommitment(createBehaviorCommitment(`int-${i}`, 'success'));
        }
      });

      it('should create no_violations proof when no violations exist', () => {
        const proof = createBehaviorProof(
          merkleTree,
          { type: 'no_violations' },
          testPrivateKey,
          { successCount: 10, violationCount: 0 }
        );

        expect(proof.type).toBe(ZKProofType.BEHAVIOR);
        expect(proof.claimedValue).toBe(0);
        expect(proof.interactionCount).toBe(10);
      });

      it('should throw when creating no_violations proof with violations', () => {
        expect(() => createBehaviorProof(
          merkleTree,
          { type: 'no_violations' },
          testPrivateKey,
          { successCount: 9, violationCount: 1 }
        )).toThrow('Cannot create no_violations proof with violations present');
      });

      it('should create success_rate proof', () => {
        const proof = createBehaviorProof(
          merkleTree,
          { type: 'success_rate', threshold: 90 },
          testPrivateKey,
          { successCount: 95, violationCount: 5 }
        );

        expect(proof.type).toBe(ZKProofType.BEHAVIOR);
        expect(proof.claimedValue).toBe(95);
      });

      it('should throw when success rate below threshold', () => {
        expect(() => createBehaviorProof(
          merkleTree,
          { type: 'success_rate', threshold: 99 },
          testPrivateKey,
          { successCount: 90, violationCount: 10 }
        )).toThrow('Success rate 90% below threshold 99%');
      });

      it('should create policy_compliance proof', () => {
        const proof = createBehaviorProof(
          merkleTree,
          { type: 'policy_compliance', policyId: 'policy-123' },
          testPrivateKey,
          { successCount: 10, violationCount: 0 }
        );

        expect(proof.type).toBe(ZKProofType.BEHAVIOR);
        expect(proof.claimedValue).toBe(100);
      });
    });

    describe('Behavior Proof Verification', () => {
      it('should verify valid no_violations proof', () => {
        for (let i = 0; i < 5; i++) {
          merkleTree.addCommitment(createBehaviorCommitment(`int-${i}`, 'success'));
        }

        const proof = createBehaviorProof(
          merkleTree,
          { type: 'no_violations' },
          testPrivateKey,
          { successCount: 5, violationCount: 0 }
        );

        expect(verifyBehaviorProof(proof, { type: 'no_violations' })).toBe(true);
      });

      it('should verify valid success_rate proof', () => {
        for (let i = 0; i < 5; i++) {
          merkleTree.addCommitment(createBehaviorCommitment(`int-${i}`, 'success'));
        }

        const proof = createBehaviorProof(
          merkleTree,
          { type: 'success_rate', threshold: 95 },
          testPrivateKey,
          { successCount: 98, violationCount: 2 }
        );

        expect(verifyBehaviorProof(proof, { type: 'success_rate', threshold: 95 })).toBe(true);
      });

      it('should reject proof with wrong type', () => {
        for (let i = 0; i < 5; i++) {
          merkleTree.addCommitment(createBehaviorCommitment(`int-${i}`, 'success'));
        }

        const proof = createBehaviorProof(
          merkleTree,
          { type: 'no_violations' },
          testPrivateKey,
          { successCount: 5, violationCount: 0 }
        );

        // Tamper with the type
        proof.type = ZKProofType.TRUST_LEVEL as any;

        expect(verifyBehaviorProof(proof, { type: 'no_violations' })).toBe(false);
      });
    });
  });

  describe('Merkle Proofs', () => {
    it('should generate valid merkle proofs for commitments', () => {
      const merkleTree = new BehaviorMerkleTree();

      for (let i = 0; i < 8; i++) {
        merkleTree.addCommitment(createBehaviorCommitment(`int-${i}`, 'success'));
      }

      const proof = merkleTree.getMerkleProof(3);
      expect(proof.length).toBeGreaterThan(0);
    });

    it('should throw for invalid index', () => {
      const merkleTree = new BehaviorMerkleTree();
      merkleTree.addCommitment(createBehaviorCommitment('int-1', 'success'));

      expect(() => merkleTree.getMerkleProof(5)).toThrow('Invalid index');
    });
  });
});
