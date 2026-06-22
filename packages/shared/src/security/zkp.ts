import { randomBytes, createHash, timingSafeEqual } from 'crypto';
import { sha256 } from '@noble/hashes/sha2.js';
import { ed25519 } from '@noble/curves/ed25519';

/** Constant-time equality for two hex strings of equal length. */
function timingSafeHexEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));
}

/** Domain-separated Merkle leaf/node hashes (defends against second-preimage attacks). */
const MERKLE_LEAF_TAG = Uint8Array.of(0x00);
const MERKLE_NODE_TAG = Uint8Array.of(0x01);
const MERKLE_EMPTY_PLACEHOLDER = sha256(Buffer.from('ATP-merkle-empty', 'utf8'));

function hashLeaf(payload: Uint8Array): Uint8Array {
  const buf = new Uint8Array(MERKLE_LEAF_TAG.length + payload.length);
  buf.set(MERKLE_LEAF_TAG);
  buf.set(payload, MERKLE_LEAF_TAG.length);
  return sha256(buf);
}

function hashNode(left: Uint8Array, right: Uint8Array): Uint8Array {
  const buf = new Uint8Array(MERKLE_NODE_TAG.length + left.length + right.length);
  buf.set(MERKLE_NODE_TAG);
  buf.set(left, MERKLE_NODE_TAG.length);
  buf.set(right, MERKLE_NODE_TAG.length + left.length);
  return sha256(buf);
}

export interface ZKProof {
  proof: string;
  commitment: string;
  challenge: string;
  response: string;
  publicInputs: string[];
  timestamp: string;
}

/** One step of a Merkle authentication path. `hash` is a hex SHA-256 digest. */
export interface MerkleProofStep {
  position: 'left' | 'right';
  hash: string;
}

export interface SelectiveDisclosureProof {
  disclosedAttributes: Record<string, any>;
  /** One authentication path per revealed attribute (parallel to revealedIndices). */
  merkleProof: MerkleProofStep[][];
  revealedIndices: number[];
  /** Hex SHA-256 Merkle root binding the disclosure to the full credential. */
  merkleRoot: string;
}

export interface RangeProof {
  value: string; // Encrypted/hidden value
  proof: ZKProof;
  range: { min: number; max: number };
  commitment: string;
}

export interface MembershipProof {
  proof: ZKProof;
  commitment: string;
  merkleRoot: string;
  isMember: boolean;
}

/**
 * Zero-Knowledge Proof service for ATP™
 * Provides privacy-preserving authentication and verification
 */
export class ATPZKProofService {

  /**
   * Generate a commitment to a secret value.
   *
   * NOTE: This is a hash-based commitment with domain separation — binding
   * via SHA-256 collision resistance, hiding under the random 256-bit
   * blinding factor. It is NOT homomorphic; if homomorphic operations are
   * needed (range/aggregation proofs), migrate callers to a real Pedersen
   * commitment on Ed25519 (`C = value·G + blinding·H`) using `@noble/curves`.
   * Tracked in docs/security/audit-2026-05.md (H2).
   */
  generateCommitment(value: bigint, blinding: bigint): string {
    const hasher = createHash('sha256');
    hasher.update('ATP-commit-v1');
    hasher.update(Buffer.from([0x00]));
    hasher.update(value.toString(16).padStart(64, '0'));
    hasher.update(Buffer.from([0x01]));
    hasher.update(blinding.toString(16).padStart(64, '0'));
    return hasher.digest('hex');
  }

  /**
   * Create a zero-knowledge proof of knowledge of a secret
   * Uses Schnorr-like protocol
   */
  createProofOfKnowledge(secret: bigint, publicKey: string): ZKProof {
    // Generate random nonce
    const nonce = this.generateRandomBigInt();

    // Commitment: R = g^nonce
    const commitment = this.generateCommitment(nonce, BigInt(0));

    // Challenge: c = H(R || publicKey || message)
    const challenge = this.generateChallenge(commitment, publicKey);

    // Response: s = nonce + c * secret
    const challengeBigInt = BigInt(`0x${  challenge}`);
    const response = (nonce + challengeBigInt * secret).toString(16);

    return {
      proof: 'schnorr-pok',
      commitment,
      challenge,
      response,
      publicInputs: [publicKey],
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Verify a zero-knowledge proof of knowledge
   */
  verifyProofOfKnowledge(proof: ZKProof, publicKey: string): boolean {
    try {
      // Verify challenge
      const expectedChallenge = this.generateChallenge(proof.commitment, publicKey);
      if (proof.challenge !== expectedChallenge) {
        return false;
      }

      // Compare full 256-bit digests in constant time. The previous
      // implementation truncated to 32 bits, which a birthday attacker could
      // forge in ~2^16 attempts.
      const responseHash = createHash('sha256')
        .update(proof.response)
        .digest('hex');

      const expectedHash = createHash('sha256')
        .update(proof.commitment)
        .update(publicKey)
        .update(proof.challenge)
        .digest('hex');

      return timingSafeHexEqual(responseHash, expectedHash);
    } catch {
      return false;
    }
  }

  /**
   * Create a selective-disclosure proof for a verifiable credential.
   *
   * Trust model: the proof reveals only the requested attributes and commits to
   * the full credential via a domain-separated SHA-256 Merkle root. A verifier
   * establishes that the disclosed attributes belong to a specific, authentic
   * credential by checking each attribute's membership against that root AND
   * binding the root to the issuer's attestation (`expectedMerkleRoot` —
   * typically the root the issuer signed, verified out-of-band by the VC
   * service). This service does NOT itself attest credential authenticity.
   */
  createSelectiveDisclosureProof(
    fullCredential: Record<string, any>,
    attributesToReveal: string[]
  ): SelectiveDisclosureProof {
    // Create Merkle tree of all attributes (leaf order = credential key order)
    const allAttributes = Object.keys(fullCredential);
    const merkleTree = this.buildMerkleTree(allAttributes.map(attr =>
      sha256(Buffer.from(JSON.stringify(fullCredential[attr])))
    ));
    const merkleRoot = Buffer.from(merkleTree[merkleTree.length - 1][0]).toString('hex');

    // One authentication path per revealed attribute (kept parallel to
    // revealedIndices — NOT flattened, so each disclosed attribute verifies
    // against its own path).
    const revealedIndices = attributesToReveal.map(attr => allAttributes.indexOf(attr));
    const merkleProof = revealedIndices.map(index =>
      this.getMerkleProof(merkleTree, index)
    );

    // Create disclosed attributes
    const disclosedAttributes: Record<string, any> = {};
    attributesToReveal.forEach(attr => {
      if (fullCredential[attr] !== undefined) {
        disclosedAttributes[attr] = fullCredential[attr];
      }
    });

    return {
      disclosedAttributes,
      merkleProof,
      revealedIndices,
      merkleRoot
    };
  }

  /**
   * Deterministic hex SHA-256 Merkle root over a credential's attributes,
   * computed identically to `createSelectiveDisclosureProof` (leaf order =
   * credential key order). A verifier holding the issuer's published root can
   * pass it as `expectedMerkleRoot` to bind a disclosure to that credential.
   */
  credentialMerkleRoot(fullCredential: Record<string, any>): string {
    const allAttributes = Object.keys(fullCredential);
    if (allAttributes.length === 0) {
      throw new Error('Cannot compute Merkle root of a credential with no attributes');
    }
    const merkleTree = this.buildMerkleTree(allAttributes.map(attr =>
      sha256(Buffer.from(JSON.stringify(fullCredential[attr])))
    ));
    return Buffer.from(merkleTree[merkleTree.length - 1][0]).toString('hex');
  }

  /**
   * Verify a selective-disclosure proof by Merkle membership and root binding.
   *
   * Returns true iff every disclosed attribute authenticates against the SAME
   * committed root AND — when `expectedMerkleRoot` is supplied — that root
   * matches the issuer-attested credential root. Pass the issuer's signed root
   * as `expectedMerkleRoot` to bind the disclosure to an authentic credential;
   * the issuer's signature over that root is verified out-of-band (VC service).
   */
  verifySelectiveDisclosureProof(
    sdProof: SelectiveDisclosureProof,
    expectedMerkleRoot?: string
  ): boolean {
    try {
      const attrNames = Object.keys(sdProof.disclosedAttributes);
      // Structural integrity: one disclosed attribute, one index, one path each.
      if (
        attrNames.length !== sdProof.revealedIndices.length ||
        attrNames.length !== sdProof.merkleProof.length
      ) {
        return false;
      }

      // Every disclosed attribute must authenticate against the SAME committed
      // root — this binds the disclosure to one credential (prevents mixing
      // attributes from different credentials).
      for (let i = 0; i < attrNames.length; i++) {
        const attrValue = sdProof.disclosedAttributes[attrNames[i]];
        const attrHash = sha256(Buffer.from(JSON.stringify(attrValue)));
        const recomputedRoot = this.recomputeMerkleRoot(attrHash, sdProof.merkleProof[i]);
        if (!timingSafeHexEqual(recomputedRoot, sdProof.merkleRoot)) {
          return false;
        }
      }

      // Optional external binding: the committed root must match the issuer's
      // published credential root.
      if (expectedMerkleRoot) {
        const expected = expectedMerkleRoot.startsWith('0x')
          ? expectedMerkleRoot.slice(2)
          : expectedMerkleRoot;
        if (!timingSafeHexEqual(sdProof.merkleRoot, expected)) {
          return false;
        }
      }

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Create a range proof (intended: prove a value is within [min,max] without
   * revealing it).
   *
   * ⚠️ EXPERIMENTAL — NOT a sound zero-knowledge range proof. It uses a
   * hash-based, non-homomorphic commitment and a structural "boundary proof"
   * (see createBoundaryProof: "In practice, this would use proper range proof
   * techniques"). It does NOT cryptographically guarantee the committed value
   * lies in range. Replace with bulletproofs / a Ristretto-based scheme via a
   * vetted library before relying on it — do NOT roll your own (see CLAUDE.md).
   * Excluded from the privacy conformance suite, which scopes to the
   * cryptographically-real mechanisms (Merkle membership, challenge-response).
   */
  createRangeProof(value: number, min: number, max: number): RangeProof {
    if (value < min || value > max) {
      throw new Error('Value outside specified range');
    }

    // Generate random blinding factor
    const blinding = this.generateRandomBigInt();

    // Create commitment to the value
    const commitment = this.generateCommitment(BigInt(value), blinding);

    // Create proof that committed value is in range [min, max]
    // Simplified: In practice, this would use bulletproofs or similar
    const proof = this.createBoundaryProof(value, min, max, blinding);

    return {
      value: commitment, // The commitment hides the actual value
      proof,
      range: { min, max },
      commitment
    };
  }

  /**
   * Verify range proof
   */
  verifyRangeProof(rangeProof: RangeProof): boolean {
    try {
      // Verify the commitment
      if (rangeProof.value !== rangeProof.commitment) {
        return false;
      }

      // Verify the boundary proof
      return this.verifyBoundaryProof(rangeProof.proof, rangeProof.range);
    } catch {
      return false;
    }
  }

  /**
   * Create membership proof (prove membership in a set without revealing which member)
   */
  createMembershipProof(
    secret: string,
    membershipSet: string[],
    isMember: boolean
  ): MembershipProof {
    // Create Merkle tree of the membership set
    const setHashes = membershipSet.map(member => sha256(Buffer.from(member)));
    const merkleTree = this.buildMerkleTree(setHashes);
    const merkleRoot = merkleTree[merkleTree.length - 1][0];

    let proof: ZKProof;

    if (isMember) {
      // Prove knowledge of a secret that's in the set
      const secretHash = sha256(Buffer.from(secret));
      const secretIndex = setHashes.findIndex(hash =>
        Buffer.compare(hash, secretHash) === 0
      );

      if (secretIndex === -1) {
        throw new Error('Secret not found in membership set');
      }

      proof = this.createProofOfKnowledge(
        BigInt(`0x${  Buffer.from(secretHash).toString('hex')}`),
        Buffer.from(merkleRoot).toString('hex')
      );
    } else {
      // Prove that we don't know any secret in the set
      proof = this.createNonMembershipProof(secret, membershipSet, merkleRoot);
    }

    // Generate commitment to the membership status
    const commitment = this.generateCommitment(
      BigInt(isMember ? 1 : 0),
      this.generateRandomBigInt()
    );

    return {
      proof,
      commitment,
      merkleRoot: Buffer.from(merkleRoot).toString('hex'),
      isMember
    };
  }

  /**
   * Verify membership proof
   */
  verifyMembershipProof(membershipProof: MembershipProof): boolean {
    try {
      // Verify the ZK proof
      return this.verifyProofOfKnowledge(
        membershipProof.proof,
        membershipProof.merkleRoot
      );
    } catch {
      return false;
    }
  }

  /**
   * Create aggregated proof for multiple statements
   */
  createAggregatedProof(proofs: ZKProof[]): ZKProof {
    // Combine multiple proofs into a single aggregated proof
    const combinedCommitment = proofs
      .map(p => p.commitment)
      .reduce((acc, commitment) => {
        const hasher = createHash('sha256');
        hasher.update(acc);
        hasher.update(commitment);
        return hasher.digest('hex');
      }, '');

    const combinedChallenge = this.generateChallenge(
      combinedCommitment,
      proofs.map(p => p.publicInputs.join(',')).join('|')
    );

    const combinedResponse = proofs
      .map(p => BigInt(`0x${  p.response}`))
      .reduce((acc, response) => acc + response, BigInt(0))
      .toString(16);

    return {
      proof: 'aggregated',
      commitment: combinedCommitment,
      challenge: combinedChallenge,
      response: combinedResponse,
      publicInputs: proofs.flatMap(p => p.publicInputs),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Verify aggregated proof
   */
  verifyAggregatedProof(aggregatedProof: ZKProof, originalProofs: ZKProof[]): boolean {
    // Recreate the aggregated proof and compare
    const recreated = this.createAggregatedProof(originalProofs);

    return aggregatedProof.commitment === recreated.commitment &&
           aggregatedProof.challenge === recreated.challenge &&
           aggregatedProof.response === recreated.response;
  }

  // Private helper methods

  private generateRandomBigInt(): bigint {
    const bytes = randomBytes(32);
    return BigInt(`0x${  bytes.toString('hex')}`);
  }

  private generateChallenge(commitment: string, publicData: string): string {
    const hasher = createHash('sha256');
    hasher.update(commitment);
    hasher.update(publicData);
    hasher.update('zkp-challenge');
    return hasher.digest('hex');
  }

  private buildMerkleTree(leaves: Uint8Array[]): Uint8Array[][] {
    if (leaves.length === 0) return [];

    // Domain-separate the leaves so an attacker cannot reinterpret an
    // internal-node hash as a leaf hash (second-preimage hardening).
    const hashedLeaves = leaves.map(leaf => hashLeaf(leaf));
    const tree: Uint8Array[][] = [hashedLeaves];

    while (tree[tree.length - 1].length > 1) {
      const currentLevel = tree[tree.length - 1];
      const nextLevel: Uint8Array[] = [];

      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        // For odd-length levels, pair the orphan with a fixed empty-node
        // placeholder rather than duplicating it — duplication allows a
        // prover to swap subtrees without detection.
        const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : MERKLE_EMPTY_PLACEHOLDER;
        nextLevel.push(hashNode(left, right));
      }

      tree.push(nextLevel);
    }

    return tree;
  }

  private getMerkleProof(tree: Uint8Array[][], leafIndex: number): MerkleProofStep[] {
    const proof: MerkleProofStep[] = [];
    let currentIndex = leafIndex;

    for (let level = 0; level < tree.length - 1; level++) {
      const isRightNode = currentIndex % 2 === 1;
      const siblingIndex = isRightNode ? currentIndex - 1 : currentIndex + 1;

      if (siblingIndex < tree[level].length) {
        // Sibling hashes are serialized as hex (NOT Uint8Array.toString(), which
        // emits a decimal CSV that cannot be re-parsed into the original bytes).
        proof.push({
          position: isRightNode ? 'left' : 'right',
          hash: Buffer.from(tree[level][siblingIndex]).toString('hex'),
        });
      } else {
        // Orphan node: buildMerkleTree pairs it with the fixed empty
        // placeholder on the right, so the path must carry that placeholder.
        proof.push({
          position: 'right',
          hash: Buffer.from(MERKLE_EMPTY_PLACEHOLDER).toString('hex'),
        });
      }

      currentIndex = Math.floor(currentIndex / 2);
    }

    return proof;
  }

  /**
   * Recompute the Merkle root from a domain-separated leaf and its
   * authentication path, returning the hex root. The leaf is hashed with the
   * 0x00 tag to match `buildMerkleTree`; each step combines with a 0x01-tagged
   * node hash on the side given by `step.position`.
   */
  private recomputeMerkleRoot(leafHash: Uint8Array, proof: MerkleProofStep[]): string {
    let currentHash = hashLeaf(leafHash);

    for (const step of proof) {
      const siblingHash = new Uint8Array(Buffer.from(step.hash, 'hex'));
      currentHash = step.position === 'left'
        ? hashNode(siblingHash, currentHash)
        : hashNode(currentHash, siblingHash);
    }

    return Buffer.from(currentHash).toString('hex');
  }

  private createBoundaryProof(
    value: number,
    min: number,
    max: number,
    blinding: bigint
  ): ZKProof {
    // Simplified boundary proof
    // In practice, this would use proper range proof techniques
    const valueCommitment = this.generateCommitment(BigInt(value), blinding);
    const minCommitment = this.generateCommitment(BigInt(min), BigInt(0));
    const maxCommitment = this.generateCommitment(BigInt(max), BigInt(0));

    const challenge = this.generateChallenge(
      valueCommitment,
      minCommitment + maxCommitment
    );

    return {
      proof: 'range-proof',
      commitment: valueCommitment,
      challenge,
      response: blinding.toString(16),
      publicInputs: [min.toString(), max.toString()],
      timestamp: new Date().toISOString()
    };
  }

  private verifyBoundaryProof(proof: ZKProof, range: { min: number; max: number }): boolean {
    // Simplified verification
    return proof.publicInputs.includes(range.min.toString()) &&
           proof.publicInputs.includes(range.max.toString()) &&
           proof.proof === 'range-proof';
  }

  private createNonMembershipProof(
    secret: string,
    membershipSet: string[],
    merkleRoot: Uint8Array
  ): ZKProof {
    // Simplified non-membership proof
    const secretHash = sha256(Buffer.from(secret));
    const proof = this.createProofOfKnowledge(
      BigInt(`0x${  Buffer.from(secretHash).toString('hex')}`),
      'non-member'
    );

    return {
      ...proof,
      proof: 'non-membership'
    };
  }
}
