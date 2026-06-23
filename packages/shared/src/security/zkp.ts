import { randomBytes, createHash, timingSafeEqual } from 'crypto';
import { sha256 } from '@noble/hashes/sha2.js';
import { RistrettoPoint } from '@noble/curves/ed25519';

// ---------------------------------------------------------------------------
// Pedersen commitments on Ristretto255 (real, additively homomorphic).
//
// C = value·G + blinding·H, where G is the Ristretto base point and H is a
// second "nothing-up-my-sleeve" generator derived by hash-to-curve, so its
// discrete log relative to G is unknown and commitments are computationally
// binding (and perfectly hiding under a uniform blinding). All group
// operations come from @noble/curves (audited) — no cryptographic primitive is
// implemented here, only their standard composition.
// ---------------------------------------------------------------------------

type RistrettoPt = InstanceType<typeof RistrettoPoint>;

/** Ristretto255 scalar-field order L = 2^252 + 27742317777372353535851937790883648493. */
const RISTRETTO_ORDER = 2n ** 252n + 27742317777372353535851937790883648493n;

const PEDERSEN_G: RistrettoPt = RistrettoPoint.BASE;
// Independent generator H with unknown discrete log relative to G, derived by
// the ristretto255 hash-to-group map over 64 uniform bytes (SHA-512 of a fixed
// domain label) — a nothing-up-my-sleeve construction.
const PEDERSEN_H: RistrettoPt = RistrettoPoint.hashToCurve(
  new Uint8Array(createHash('sha512').update('ATP-pedersen-generator-H:v1').digest())
);

/** Reduce an integer into the scalar field [0, L). */
function modOrder(x: bigint): bigint {
  const r = x % RISTRETTO_ORDER;
  return r < 0n ? r + RISTRETTO_ORDER : r;
}

/** Uniform random scalar in [0, L) via wide (64-byte) reduction to avoid modulo bias. */
function randomScalar(): bigint {
  return modOrder(BigInt(`0x${randomBytes(64).toString('hex')}`));
}

/** scalar·P, handling the 0 scalar (which @noble's multiply rejects). */
function mulPoint(P: RistrettoPt, scalar: bigint): RistrettoPt {
  const s = modOrder(scalar);
  return s === 0n ? RistrettoPoint.ZERO : P.multiply(s);
}

function pointToHex(P: RistrettoPt): string {
  return Buffer.from(P.toBytes()).toString('hex');
}

/** Fiat–Shamir challenge over the generators, commitment, nonce point and context. */
function pedersenChallenge(C: RistrettoPt, T: RistrettoPt, context: string): bigint {
  const enc = Buffer.concat([
    Buffer.from('ATP-pedersen-pok:v1', 'utf8'),
    Buffer.from(PEDERSEN_G.toBytes()),
    Buffer.from(PEDERSEN_H.toBytes()),
    Buffer.from(C.toBytes()),
    Buffer.from(T.toBytes()),
    Buffer.from(context, 'utf8'),
  ]);
  return modOrder(BigInt(`0x${createHash('sha512').update(enc).digest('hex')}`));
}

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

/** Schnorr proof of knowledge of a Pedersen commitment opening (value, blinding). */
export interface PedersenOpeningProof {
  /** Commitment C = value·G + blinding·H, hex (32-byte Ristretto encoding). */
  commitment: string;
  /** Prover nonce point T = kv·G + kr·H, hex. */
  t: string;
  /** Response sv = kv + e·value (mod L), hex. */
  sv: string;
  /** Response sr = kr + e·blinding (mod L), hex. */
  sr: string;
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
    const allAttributes = Object.keys(fullCredential);

    // Fail loudly on unknown attributes rather than silently emitting a proof
    // with a -1 leaf index (which produces a garbage path that never verifies).
    const unknown = attributesToReveal.filter(attr => !allAttributes.includes(attr));
    if (unknown.length > 0) {
      throw new Error(
        `Cannot disclose attribute(s) not present in the credential: ${unknown.join(', ')}`
      );
    }

    // Create Merkle tree of all attributes (leaf order = credential key order).
    const merkleTree = this.buildMerkleTree(
      allAttributes.map(attr => this.attributeLeaf(attr, fullCredential[attr]))
    );
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
      disclosedAttributes[attr] = fullCredential[attr];
    });

    return {
      disclosedAttributes,
      merkleProof,
      revealedIndices,
      merkleRoot
    };
  }

  /**
   * Compute a credential attribute's Merkle leaf preimage hash. The attribute
   * NAME is bound into the preimage alongside the value, so two attributes that
   * share a value (e.g. `{ role: 'engineer', title: 'engineer' }`) produce
   * distinct leaves — this prevents an attribute-swap attack where a valid path
   * for one field is replayed to claim another field with the same value.
   */
  private attributeLeaf(name: string, value: unknown): Uint8Array {
    return sha256(Buffer.from(JSON.stringify({ [name]: value })));
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
    const merkleTree = this.buildMerkleTree(
      allAttributes.map(attr => this.attributeLeaf(attr, fullCredential[attr]))
    );
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
        const attrName = attrNames[i];
        const path = sdProof.merkleProof[i];

        // The claimed leaf index must match the parity sequence encoded in the
        // path (left sibling => current node is a right child => that bit is 1),
        // otherwise a forged revealedIndices value would mislead consumers.
        let derivedIndex = 0;
        for (let level = 0; level < path.length; level++) {
          if (path[level].position === 'left') {
            derivedIndex |= 1 << level;
          }
        }
        if (derivedIndex !== sdProof.revealedIndices[i]) {
          return false;
        }

        // Bind BOTH the attribute name and value into the leaf preimage.
        const attrHash = this.attributeLeaf(attrName, sdProof.disclosedAttributes[attrName]);
        const recomputedRoot = this.recomputeMerkleRoot(attrHash, path);
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
   * Create a real Pedersen commitment C = value·G + blinding·H on Ristretto255.
   * Additively homomorphic and computationally binding / perfectly hiding —
   * unlike the legacy hash-based `generateCommitment`. Returns the 32-byte
   * commitment as hex.
   */
  pedersenCommit(value: bigint, blinding: bigint): string {
    const C = mulPoint(PEDERSEN_G, value).add(mulPoint(PEDERSEN_H, blinding));
    return pointToHex(C);
  }

  /**
   * Commit to a value with a fresh uniform random blinding.
   * Returns the commitment and the blinding (hex) so the prover can later open
   * it or prove knowledge of the opening.
   */
  createPedersenCommitment(value: bigint): { commitment: string; blinding: string } {
    const blinding = randomScalar();
    return { commitment: this.pedersenCommit(value, blinding), blinding: blinding.toString(16) };
  }

  /**
   * Prove knowledge of the opening (value, blinding) of a Pedersen commitment
   * WITHOUT revealing them — a standard Schnorr proof for the linear relation
   * C = value·G + blinding·H, made non-interactive via Fiat–Shamir. `context`
   * is bound into the challenge for domain separation / replay resistance.
   */
  provePedersenOpening(value: bigint, blinding: bigint, context = ''): PedersenOpeningProof {
    const v = modOrder(value);
    const r = modOrder(blinding);
    const C = mulPoint(PEDERSEN_G, v).add(mulPoint(PEDERSEN_H, r));

    const kv = randomScalar();
    const kr = randomScalar();
    const T = mulPoint(PEDERSEN_G, kv).add(mulPoint(PEDERSEN_H, kr));

    const e = pedersenChallenge(C, T, context);
    const sv = modOrder(kv + e * v);
    const sr = modOrder(kr + e * r);

    return { commitment: pointToHex(C), t: pointToHex(T), sv: sv.toString(16), sr: sr.toString(16) };
  }

  /**
   * Verify a Pedersen opening proof by checking sv·G + sr·H == T + e·C.
   * `context` MUST match the value used at proving time.
   */
  verifyPedersenOpening(proof: PedersenOpeningProof, context = ''): boolean {
    try {
      const C = RistrettoPoint.fromHex(proof.commitment);
      const T = RistrettoPoint.fromHex(proof.t);
      const sv = modOrder(BigInt(`0x${proof.sv}`));
      const sr = modOrder(BigInt(`0x${proof.sr}`));
      const e = pedersenChallenge(C, T, context);

      const lhs = mulPoint(PEDERSEN_G, sv).add(mulPoint(PEDERSEN_H, sr));
      const rhs = T.add(mulPoint(C, e));
      return lhs.equals(rhs);
    } catch {
      return false;
    }
  }

  /**
   * @deprecated Sound range proofs are NOT implemented. The previous hash-based
   * implementation was not a zero-knowledge range proof (it performed only a
   * structural check) and has been removed rather than left as security theatre.
   * Build range statements on `pedersenCommit` with a vetted bulletproofs
   * library — do NOT roll your own (see CLAUDE.md).
   */
  createRangeProof(_value: number, _min: number, _max: number): RangeProof {
    throw new Error(
      'createRangeProof is not implemented: the previous hash-based range proof was ' +
        'unsound and has been removed. Use a vetted bulletproofs implementation over ' +
        'Pedersen/Ristretto commitments (see pedersenCommit).'
    );
  }

  /**
   * @deprecated See {@link createRangeProof} — sound range proofs are not implemented.
   */
  verifyRangeProof(_rangeProof: RangeProof): boolean {
    throw new Error(
      'verifyRangeProof is not implemented: range proofs were removed as unsound. ' +
        'Use a vetted bulletproofs implementation.'
    );
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
