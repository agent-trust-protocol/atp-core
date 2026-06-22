/**
 * Privacy — Selective-Disclosure Conformance Suite (W3C ATP privacy item)
 *
 * Deterministic conformance vectors for Merkle-membership selective disclosure
 * (`ATPZKProofService.createSelectiveDisclosureProof` /
 * `verifySelectiveDisclosureProof` / `credentialMerkleRoot`).
 *
 * Trust model under test: a disclosure reveals only the requested attributes
 * and commits to the full credential via a domain-separated SHA-256 Merkle
 * root. Verification establishes that each disclosed attribute is a member of
 * that root AND (when given) that the root matches the issuer-attested root.
 * The issuer's signature over the root is verified out-of-band (VC service) and
 * is out of scope here. The experimental hash-based range proof is also out of
 * scope (it is not a sound ZK range proof — see `createRangeProof`).
 *
 * The Merkle root is a known-answer (KAT): it is fully determined by the fixed
 * credential below and was computed independently of the implementation.
 */

import { describe, it, expect } from '@jest/globals';
import { ATPZKProofService } from '../zkp.js';

// Fixed credential — 5 attributes (odd count => exercises the orphan/empty
// placeholder path in the Merkle tree). Leaf order = object key order.
const CREDENTIAL = {
  id: 'urn:cred:atp:conformance:1',
  name: 'Ada Lovelace',
  role: 'engineer',
  clearance: 'secret',
  org: 'did:atp:agents.example.com',
} as const;

// Known-answer Merkle root for CREDENTIAL (hex SHA-256), computed independently
// from the documented tree construction (0x00 leaf tag, 0x01 node tag, fixed
// 'ATP-merkle-empty' placeholder for orphans).
const EXPECTED_ROOT =
  '2dbbe21c6d40b712f53521c28442e2944e9751c66144225f480f1fa732fe2a9e';

describe('Selective disclosure — privacy conformance (Merkle membership)', () => {
  const zk = new ATPZKProofService();

  it('credentialMerkleRoot is deterministic and matches the known answer', () => {
    const root = zk.credentialMerkleRoot(CREDENTIAL);
    expect(root).toMatch(/^[0-9a-f]{64}$/);
    expect(root).toBe(EXPECTED_ROOT);
    // determinism: a second computation yields the identical root
    expect(zk.credentialMerkleRoot({ ...CREDENTIAL })).toBe(EXPECTED_ROOT);
  });

  it('a fresh proof commits the credential root and carries one path per revealed attr', () => {
    const proof = zk.createSelectiveDisclosureProof(CREDENTIAL, ['name', 'org']);
    expect(proof.merkleRoot).toBe(EXPECTED_ROOT);
    expect(proof.revealedIndices).toEqual([1, 4]); // name, org positions
    expect(proof.merkleProof).toHaveLength(2);
    expect(Object.keys(proof.disclosedAttributes)).toEqual(['name', 'org']);
  });

  it('verifies a single-attribute disclosure bound to the credential root', () => {
    const proof = zk.createSelectiveDisclosureProof(CREDENTIAL, ['role']);
    expect(zk.verifySelectiveDisclosureProof(proof, EXPECTED_ROOT)).toBe(true);
  });

  it('verifies a multi-attribute disclosure (per-index authentication paths)', () => {
    const proof = zk.createSelectiveDisclosureProof(CREDENTIAL, ['name', 'clearance', 'org']);
    expect(zk.verifySelectiveDisclosureProof(proof, EXPECTED_ROOT)).toBe(true);
  });

  it('verifies the first and last leaf (boundary indices)', () => {
    const first = zk.createSelectiveDisclosureProof(CREDENTIAL, ['id']);
    const last = zk.createSelectiveDisclosureProof(CREDENTIAL, ['org']);
    expect(zk.verifySelectiveDisclosureProof(first, EXPECTED_ROOT)).toBe(true);
    expect(zk.verifySelectiveDisclosureProof(last, EXPECTED_ROOT)).toBe(true);
  });

  it('verifies without an external root (internal binding to the committed root)', () => {
    const proof = zk.createSelectiveDisclosureProof(CREDENTIAL, ['role']);
    expect(zk.verifySelectiveDisclosureProof(proof)).toBe(true);
  });

  it('rejects a tampered disclosed attribute value', () => {
    const proof = zk.createSelectiveDisclosureProof(CREDENTIAL, ['role']);
    proof.disclosedAttributes.role = 'admin';
    expect(zk.verifySelectiveDisclosureProof(proof, EXPECTED_ROOT)).toBe(false);
  });

  it('rejects against the wrong expected (external) root', () => {
    const proof = zk.createSelectiveDisclosureProof(CREDENTIAL, ['role']);
    const wrongRoot = zk.credentialMerkleRoot({ ...CREDENTIAL, role: 'other' });
    expect(wrongRoot).not.toBe(EXPECTED_ROOT);
    expect(zk.verifySelectiveDisclosureProof(proof, wrongRoot)).toBe(false);
  });

  it('rejects a swapped committed root (binding enforced even with no external root)', () => {
    const proof = zk.createSelectiveDisclosureProof(CREDENTIAL, ['role']);
    proof.merkleRoot = zk.credentialMerkleRoot({ ...CREDENTIAL, role: 'other' });
    expect(zk.verifySelectiveDisclosureProof(proof)).toBe(false);
  });

  it('rejects a tampered authentication path', () => {
    const proof = zk.createSelectiveDisclosureProof(CREDENTIAL, ['role']);
    // Flip one hex nibble of the first sibling hash.
    const step = proof.merkleProof[0][0];
    step.hash = (step.hash[0] === '0' ? '1' : '0') + step.hash.slice(1);
    expect(zk.verifySelectiveDisclosureProof(proof, EXPECTED_ROOT)).toBe(false);
  });

  it('does not disclose unrevealed attributes', () => {
    const proof = zk.createSelectiveDisclosureProof(CREDENTIAL, ['role']);
    expect(proof.disclosedAttributes).toEqual({ role: 'engineer' });
    expect(proof.disclosedAttributes).not.toHaveProperty('clearance');
    expect(proof.disclosedAttributes).not.toHaveProperty('name');
  });
});
