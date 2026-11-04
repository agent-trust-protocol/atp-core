import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { atpE1Fingerprint, atpPq1Fingerprint, buildAtpV2Did } from '../dist/index.js';

const vectors = JSON.parse(readFileSync(new URL('../../../docs/specs/did-atp/test-vectors.json', import.meta.url), 'utf8'));

test('public known-answer DID vectors match both hybrid binding key fingerprints', () => {
  for (const vector of vectors.pathIdentifiers) {
    const ed = Buffer.from(vector.ed25519PublicKeyHex, 'hex');
    const pq = Buffer.from(vector.mlDsa65PublicKeyHex, 'hex');
    assert.equal(atpE1Fingerprint(ed), vector.e1);
    assert.equal(atpPq1Fingerprint(pq), vector.pq1);
    assert.equal(buildAtpV2Did(vector.domain, vector.path, ed, pq), vector.did);
  }
});

test('rejects invalid key sizes, domains, and ambiguous path segments', () => {
  const ed = Buffer.alloc(32);
  const pq = Buffer.alloc(1952);
  assert.throws(() => atpE1Fingerprint(Buffer.alloc(31)), /32 bytes/);
  assert.throws(() => atpPq1Fingerprint(Buffer.alloc(1951)), /1952 bytes/);
  assert.throws(() => buildAtpV2Did('BAD.DOMAIN', ['agent'], ed, pq), /Invalid did:atp domain/);
  assert.throws(() => buildAtpV2Did('example.com', [], ed, pq), /at least one path segment/);
  assert.throws(() => buildAtpV2Did('example.com', ['e1_' + 'a'.repeat(43)], ed, pq), /ambiguous/);
});
