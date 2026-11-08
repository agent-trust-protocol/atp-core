import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { atpBase64Url, atpJwkThumbprint, parseAtpV2PathDid, isAtpV2PathDid,
  verifyAtpV2KeyBindings, AtpDidParseError, buildAtpV2Did } from '../dist/index.js';

const vectors = JSON.parse(readFileSync(new URL('../../../docs/specs/did-atp/test-vectors.json', import.meta.url), 'utf8'));

test('published vectors parse, rebuild, and bind both keys without changing identifier bytes', () => {
  for (const v of vectors.pathIdentifiers) {
    const ed = Buffer.from(v.ed25519PublicKeyHex, 'hex');
    const pq = Buffer.from(v.mlDsa65PublicKeyHex, 'hex');
    assert.deepEqual(parseAtpV2PathDid(v.did), { domain: v.domain, path: v.path, e1: v.e1, pq1: v.pq1 });
    assert.equal(isAtpV2PathDid(v.did), true);
    assert.equal(buildAtpV2Did(v.domain, v.path, ed, pq), v.did);
    assert.equal(verifyAtpV2KeyBindings(v.did, ed, pq), true);
    const wrongEd = Uint8Array.from(ed); wrongEd[0] ^= 1;
    const wrongPq = Uint8Array.from(pq); wrongPq[0] ^= 1;
    assert.equal(verifyAtpV2KeyBindings(v.did, wrongEd, pq), false);
    assert.equal(verifyAtpV2KeyBindings(v.did, ed, wrongPq), false);
    assert.throws(() => verifyAtpV2KeyBindings(v.did, new Uint8Array(31), pq), /32 bytes/);
  }
});

test('rejects malformed identifiers, downgrade attempts, DID URLs, and ambiguous paths', () => {
  const v = vectors.pathIdentifiers[0];
  const bad = [null, 1, {}, '', v.did + '\n', v.did + '/resource', v.did + '?version=1', v.did + '#key',
    v.did.replace('did:atp:', 'did:web:'), v.did.replace(v.domain, 'BAD.DOMAIN'),
    `did:atp:${v.domain}:${v.e1}:${v.pq1}`, `did:atp:${v.domain}::${v.e1}:${v.pq1}`,
    `did:atp:${v.domain}:agent:${v.e1}`, `did:atp:${v.domain}:agent:${v.pq1}:${v.e1}`,
    `did:atp:${v.domain}:${v.e1}:agent:${v.e1}:${v.pq1}`];
  for (const value of bad) assert.equal(isAtpV2PathDid(value), false, String(value));
  assert.throws(() => parseAtpV2PathDid('did:atp:example.com:agent:bad:bad'),
    error => error instanceof AtpDidParseError && error.code === 'invalid_bindings');
});

test('RFC 8037 known answer is stable with optional metadata and private members', () => {
  const jwk = { crv: 'Ed25519', kty: 'OKP', x: '11qYAYKxCrfVS_7TyWQHOg7hcvPapiMlrwIaaPcHURo' };
  const expected = 'kPrK_qmxVWaYVA9wwBF6Iuo3vVzz7TxHCTwXBygrS4k';
  assert.equal(atpJwkThumbprint(jwk), expected);
  assert.equal(atpJwkThumbprint({ kid: 'changed', d: 'private', use: 'sig', ...jwk }), expected);
  const pq = { alg: 'ML-DSA-65', kty: 'AKP', pub: 'fixture' };
  assert.equal(atpJwkThumbprint({ ...pq, kid: 'ignored' }), atpJwkThumbprint(pq));
  for (const bad of [null, {}, [], { kty: 'toString' }, { kty: 'OKP', crv: 'Ed25519' },
    { kty: 'OKP', crv: 'Ed25519', x: '' }, Object.create(jwk)]) {
    assert.throws(() => atpJwkThumbprint(bad));
  }
});

test('base64url matches Node for all byte values and remainders without global Buffer', () => {
  const inputs = Array.from({ length: 260 }, (_, length) => Uint8Array.from({ length }, (_, i) => i));
  const expected = inputs.map(bytes => Buffer.from(bytes).toString('base64url'));
  const original = globalThis.Buffer;
  try {
    globalThis.Buffer = undefined;
    inputs.forEach((bytes, i) => assert.equal(atpBase64Url(bytes), expected[i]));
    assert.equal(atpJwkThumbprint({ crv: 'Ed25519', kty: 'OKP', x: '11qYAYKxCrfVS_7TyWQHOg7hcvPapiMlrwIaaPcHURo' }),
      'kPrK_qmxVWaYVA9wwBF6Iuo3vVzz7TxHCTwXBygrS4k');
  } finally { globalThis.Buffer = original; }
});
