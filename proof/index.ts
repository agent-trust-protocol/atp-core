/**
 * did:atp — runnable reference proof of concept.
 *
 * This is the runnable proof referenced by the did:atp DID method
 * specification (docs/specs/did-atp/index.html, §Proof of Concept). It
 * demonstrates the hybrid, quantum-safe construction end to end, using:
 *
 *   - @noble/post-quantum's `ml_dsa65` (FIPS 204 final, ML-DSA-65 = category 3)
 *   - @noble/ed25519 (classical binding, byte-identical to did:wba's e1_)
 *
 * and it reuses the production ATP SDK implementation (packages/sdk) for the
 * identifier syntax, DID-Document construction, dual proofs, and resolution —
 * so the proof validates the *real* code, not a parallel re-implementation.
 *
 * Every claim below is asserted; the process exits non-zero on any failure.
 *
 * Run it with:   npx tsx proof/index.ts
 * (from the repository root).
 *
 * What it proves (mirrors the spec's bullet list):
 *   1. ML-DSA-65 keys and signatures at exact FIPS 204 sizes
 *      (1952-byte public key, 3309-byte signature).
 *   2. A hybrid did:atp identifier whose classical (e1_) view is a
 *      syntactically valid did:wba identifier.
 *   3. Dual-binding resolution: both e1_ and pq1_ fingerprints are recomputed
 *      from the DID Document and both signatures (eddsa-jcs-2022 + ML-DSA-65
 *      JWS) are verified.
 *   4. Defense in depth: a forged classical (Ed25519) signature is caught
 *      because the post-quantum (ML-DSA-65) binding fails.
 *   5. A method-agnostic trust credential is verified over a did:atp subject
 *      and a did:web subject, with tampering detected.
 */

import * as ed25519 from '@noble/ed25519';
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js';
import { sha512 } from '@noble/hashes/sha2.js';
import canonicalize from 'canonicalize';

// Reuse the production SDK implementation under test.
import {
  CryptoUtils,
  ML_DSA_65_PUBLIC_KEY_BYTES,
  ML_DSA_65_SIGNATURE_BYTES,
  ED25519_PUBLIC_KEY_BYTES,
} from '../packages/sdk/src/utils/crypto.js';
import { DidAtp } from '../packages/sdk/src/utils/did.js';
import { DidAtpDocument } from '../packages/sdk/src/utils/did-document.js';
import { DidAtpResolver } from '../packages/sdk/src/utils/resolver.js';
import type { AtpDidDocument } from '../packages/sdk/src/types.js';

// @noble/ed25519 v2 needs its SHA-512 hook wired before sync sign/verify.
ed25519.etc.sha512Sync = (...m) => sha512(ed25519.etc.concatBytes(...m));

// ---------------------------------------------------------------------------
// Tiny assertion harness (no test runner needed).
// ---------------------------------------------------------------------------
let checks = 0;
function assert(cond: unknown, message: string): asserts cond {
  checks += 1;
  if (!cond) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
  console.log(`  ok  ${message}`);
}
function assertEqual<T>(actual: T, expected: T, message: string): void {
  assert(actual === expected, `${message} (got ${String(actual)}, expected ${String(expected)})`);
}
function section(title: string): void {
  console.log(`\n=== ${title} ===`);
}

// did:wba identifier syntax: same shape as a did:atp path DID minus the pq1_
// segment. The classical "view" of a did:atp DID MUST be a valid did:wba DID.
const DID_WBA_RE =
  /^did:wba:[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*(%3[aA][0-9]{1,5})?(:[A-Za-z0-9._-]+)+:e1_[A-Za-z0-9_-]{43}$/;

async function main(): Promise<void> {
  console.log('did:atp runnable proof of concept\n=================================');

  // -------------------------------------------------------------------------
  // 1. ML-DSA-65 keys and signatures at exact FIPS 204 sizes.
  // -------------------------------------------------------------------------
  section('1. ML-DSA-65 at exact FIPS 204 sizes');

  const seed = CryptoUtils.randomBytes(32);
  const mlKeys = ml_dsa65.keygen(new Uint8Array(seed));
  assertEqual(
    mlKeys.publicKey.length,
    1952,
    'ML-DSA-65 public key is exactly 1952 bytes (FIPS 204)'
  );
  assertEqual(
    ML_DSA_65_PUBLIC_KEY_BYTES,
    1952,
    'SDK constant ML_DSA_65_PUBLIC_KEY_BYTES = 1952'
  );

  const pqMessage = new TextEncoder().encode('did:atp post-quantum binding test');
  const pqSig = ml_dsa65.sign(pqMessage, mlKeys.secretKey);
  assertEqual(
    pqSig.length,
    3309,
    'ML-DSA-65 signature is exactly 3309 bytes (FIPS 204)'
  );
  assertEqual(
    ML_DSA_65_SIGNATURE_BYTES,
    3309,
    'SDK constant ML_DSA_65_SIGNATURE_BYTES = 3309'
  );
  assert(
    ml_dsa65.verify(pqSig, pqMessage, mlKeys.publicKey),
    'ML-DSA-65 signature verifies against its public key'
  );

  // -------------------------------------------------------------------------
  // 2. A hybrid did:atp identifier whose classical (e1_) view is a
  //    syntactically valid did:wba identifier.
  // -------------------------------------------------------------------------
  section('2. Hybrid did:atp identifier; classical view is valid did:wba');

  const domain = 'agents.example.com';
  const path = ['billing'];
  const { did, keyPair } = await DidAtp.generate(domain, path);
  console.log(`  did = ${did}`);

  const parsed = DidAtp.parse(did);
  assert(parsed !== null, 'did:atp identifier parses');
  assertEqual(parsed!.type, 'path', 'identifier is a path-type DID');
  assertEqual(parsed!.domain, domain, 'parsed domain matches');
  assert(parsed!.e1!.startsWith('e1_'), 'carries a classical e1_ fingerprint');
  assert(parsed!.pq1!.startsWith('pq1_'), 'carries a post-quantum pq1_ fingerprint');

  // Both binding fingerprints are independently recomputable from the keys.
  assert(
    DidAtp.matchesPublicKeys(did, keyPair.ed25519.publicKey, keyPair.mlDsa65.publicKey),
    'both fingerprints recompute from the binding public keys'
  );
  assertEqual(keyPair.ed25519.publicKey.length, ED25519_PUBLIC_KEY_BYTES, 'Ed25519 key is 32 bytes');
  assertEqual(keyPair.mlDsa65.publicKey.length, 1952, 'ML-DSA-65 binding key is 1952 bytes');

  // Strip the pq1_ segment and swap the method prefix: the classical "view" of
  // the hybrid DID must be a syntactically valid did:wba identifier.
  const wbaView = `did:wba:${parsed!.domain}:${parsed!.path.join(':')}:${parsed!.e1}`;
  console.log(`  did:wba view = ${wbaView}`);
  assert(DID_WBA_RE.test(wbaView), 'classical view is a syntactically valid did:wba identifier');

  // -------------------------------------------------------------------------
  // 3. Dual-binding resolution: recompute both fingerprints from the DID
  //    Document and verify both signatures.
  // -------------------------------------------------------------------------
  section('3. Dual-binding resolution (both fingerprints + both proofs)');

  const { document } = await DidAtpDocument.create(domain, path, keyPair, {
    service: [{ id: `${did}#agent`, type: 'AgentService', serviceEndpoint: `https://${domain}/agent` }],
  });
  assertEqual(document.id, did, 'DID Document id equals the DID');
  assert(!!document.proof, 'DID Document carries an eddsa-jcs-2022 classical proof');
  assert(!!document.atpPqProof, 'DID Document carries an ML-DSA-65 JWS post-quantum proof');

  const verifyResult = await DidAtpDocument.verify(document);
  assert(
    verifyResult.valid,
    `DID Document passes full dual-binding verification${verifyResult.errors.length ? ` (${verifyResult.errors.join('; ')})` : ''}`
  );

  // Exercise the resolver: serve the did.json from an in-memory HTTPS stub and
  // resolve the DID through the real resolution path.
  const documentUrl = DidAtpResolver.didToUrl(did);
  console.log(`  resolves from ${documentUrl}`);
  const stubFetch = makeStubFetch({ [documentUrl]: document });
  const resolution = await DidAtpResolver.resolve(did, { fetch: stubFetch });
  assertEqual(resolution.did, did, 'resolver returns the requested DID');
  assertEqual(resolution.documentUrl, documentUrl, 'resolver used the did:wba URL transform');
  assert(resolution.document.atpPqProof !== undefined, 'resolved document retains its PQ proof');

  // -------------------------------------------------------------------------
  // 4. Defense in depth: a forged classical signature is caught by the
  //    post-quantum binding.
  // -------------------------------------------------------------------------
  section('4. Defense in depth (forged classical sig caught by PQ binding)');

  // Adversary scenario: an attacker who can forge Ed25519 (e.g. a future
  // quantum adversary) crafts a tampered DID Document and produces a *valid*
  // classical proof for it, but cannot produce a valid ML-DSA-65 proof.
  const tampered: AtpDidDocument = JSON.parse(JSON.stringify(document));
  // Tamper: point the agent service endpoint at an attacker-controlled host.
  tampered.service![0].serviceEndpoint = 'https://attacker.example/agent';

  // Re-sign ONLY the classical proof with the legitimate Ed25519 key — this
  // stands in for a forged-but-structurally-valid Ed25519 signature. The PQ
  // proof still covers the original (untampered) document, so it now fails.
  const forgedClassical = await DidAtpDocument.create(domain, path, keyPair, {
    service: tampered.service,
    created: document.proof!.created,
  });
  // Splice the attacker's valid classical proof onto the tampered doc while
  // keeping the ORIGINAL post-quantum proof (the attacker can't forge ML-DSA).
  tampered.proof = forgedClassical.document.proof;
  tampered.atpPqProof = document.atpPqProof;

  // The classical proof alone now verifies over the tampered document...
  const { proof: _p, atpPqProof: _pq, ...tamperedUnsigned } = tampered;
  const classicalOnly = await DidAtpDocument.verifyClassicalProof(
    tamperedUnsigned as AtpDidDocument,
    tampered.proof!,
    keyPair.ed25519.publicKey
  );
  assert(classicalOnly, 'forged/tampered document still passes the classical proof alone');

  // ...but full dual-binding verification MUST reject it.
  const tamperedResult = await DidAtpDocument.verify(tampered);
  assert(!tamperedResult.valid, 'full verification REJECTS the tampered document');
  assert(
    tamperedResult.errors.some((e) => e.toLowerCase().includes('ml-dsa-65') || e.toLowerCase().includes('pq')),
    'rejection is attributed to the post-quantum binding failing'
  );
  console.log(`  rejection reason(s): ${tamperedResult.errors.join('; ')}`);

  // And resolution of the tampered document fails too.
  let resolveFailed = false;
  try {
    await DidAtpResolver.resolve(did, { fetch: makeStubFetch({ [documentUrl]: tampered }) });
  } catch (e) {
    resolveFailed = true;
    console.log(`  resolver rejected tampered did.json: ${(e as Error).message}`);
  }
  assert(resolveFailed, 'resolution of the tampered document fails');

  // -------------------------------------------------------------------------
  // 5. A method-agnostic trust credential verified over did:atp and did:web
  //    subjects, with tampering detected.
  // -------------------------------------------------------------------------
  section('5. Method-agnostic trust credential (did:atp and did:web)');

  // The issuer is a did:atp agent; it signs a small JCS-canonicalized trust
  // credential about a subject. The subject's DID method is irrelevant to the
  // credential machinery — it's just a string — which is the point: trust
  // credentials are method-agnostic.
  const issuer = await DidAtp.generate('issuer.example.com', ['authority']);

  for (const subject of [did, 'did:web:partner.example.com:agents:research']) {
    const credential = makeTrustCredential(issuer.did, subject, 'verified');
    const signed = signCredential(credential, issuer.keyPair.mlDsa65.secretKey);

    const ok = verifyCredential(signed, issuer.keyPair.mlDsa65.publicKey);
    assert(ok, `trust credential verifies for subject ${shorten(subject)}`);

    // Tamper with the trust level and confirm the signature no longer holds.
    const tamperedCred = JSON.parse(JSON.stringify(signed));
    tamperedCred.credentialSubject.trustLevel = 'fully-trusted';
    const tamperedOk = verifyCredential(tamperedCred, issuer.keyPair.mlDsa65.publicKey);
    assert(!tamperedOk, `tampered trust credential is rejected for subject ${shorten(subject)}`);
  }

  // -------------------------------------------------------------------------
  console.log(`\n=================================`);
  console.log(`ALL CHECKS PASSED (${checks} assertions).`);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface TrustCredential {
  '@context': string[];
  type: string[];
  issuer: string;
  issuanceDate: string;
  credentialSubject: { id: string; trustLevel: string };
}

interface SignedTrustCredential extends TrustCredential {
  proof: { type: 'AtpPqProof'; alg: 'ML-DSA-65'; signature: string };
}

function makeTrustCredential(issuer: string, subject: string, trustLevel: string): TrustCredential {
  return {
    '@context': ['https://www.w3.org/ns/credentials/v2', 'https://agenttrustprotocol.com/ns/trust/v1'],
    type: ['VerifiableCredential', 'AtpTrustCredential'],
    issuer,
    issuanceDate: '2026-06-22T00:00:00Z',
    credentialSubject: { id: subject, trustLevel },
  };
}

/** Sign the JCS-canonical credential with ML-DSA-65 (method-agnostic over subject). */
function signCredential(credential: TrustCredential, secretKey: Uint8Array): SignedTrustCredential {
  const payload = new TextEncoder().encode(jcs(credential));
  const signature = ml_dsa65.sign(payload, secretKey);
  return { ...credential, proof: { type: 'AtpPqProof', alg: 'ML-DSA-65', signature: CryptoUtils.base64url(signature) } };
}

function verifyCredential(signed: SignedTrustCredential, publicKey: Uint8Array): boolean {
  const { proof, ...credential } = signed;
  if (!proof || proof.alg !== 'ML-DSA-65') return false;
  try {
    const payload = new TextEncoder().encode(jcs(credential));
    const signature = new Uint8Array(Buffer.from(proof.signature, 'base64url'));
    return ml_dsa65.verify(signature, payload, publicKey);
  } catch {
    return false;
  }
}

/**
 * RFC 8785 JSON Canonicalization Scheme via a vetted library (not hand-rolled).
 * Unlike a simple key-sort, this also applies RFC 8785 number serialization and
 * string-escaping rules, so signatures stay interoperable for numeric/Unicode
 * claims (e.g. a trust score) rather than diverging from a conformant signer.
 */
function jcs(value: unknown): string {
  const canonical = canonicalize(value);
  if (canonical === undefined) {
    throw new Error('jcs: value is not JSON-serializable');
  }
  return canonical;
}

function shorten(did: string): string {
  return did.length > 48 ? `${did.slice(0, 45)}...` : did;
}

/** In-memory HTTPS fetch stub that serves did.json documents from a map. */
function makeStubFetch(documents: Record<string, AtpDidDocument>): typeof fetch {
  return (async (input: RequestInfo | URL) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;
    const doc = documents[url];
    if (!doc) {
      return new Response('not found', { status: 404 });
    }
    const body = JSON.stringify(doc);
    return new Response(body, {
      status: 200,
      headers: { 'content-type': 'application/did+json', 'content-length': String(Buffer.byteLength(body)) },
    });
  }) as typeof fetch;
}

main().catch((err) => {
  console.error(`\n${err instanceof Error ? err.stack ?? err.message : String(err)}`);
  process.exit(1);
});
