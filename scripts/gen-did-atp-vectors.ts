/**
 * did:atp — W3C CG conformance test-vector generator.
 *
 * Emits a deterministic set of known-answer vectors for the did:atp DID method
 * (docs/specs/did-atp/index.html) so independent implementers can conform their
 * own code against fixed inputs/outputs. The vectors are produced by reusing
 * the PRODUCTION ATP SDK (packages/sdk) — the same code the spec's Proof of
 * Concept exercises — so the published vectors cannot drift from the reference
 * implementation.
 *
 * Coverage:
 *   - root identifiers (did:atp:<domain>)
 *   - path identifiers (e1_/pq1_ binding fingerprints) with their OKP/AKP JWKs
 *     and RFC 7638 thumbprints
 *   - pairwise (per-peer, unlinkable) identifiers (p_<hex> pseudonym segment)
 *   - invalid identifiers that MUST NOT parse
 *
 * Determinism: every keypair is derived from a fixed, labelled seed (no random
 * inputs, no timestamps), so re-running the generator is a no-op. ML-DSA-65 and
 * Ed25519 key generation are deterministic functions of a 32-byte seed.
 *
 * Usage (from the repository root):
 *   npx tsx scripts/gen-did-atp-vectors.ts          # write the vectors file
 *   npx tsx scripts/gen-did-atp-vectors.ts --check   # fail if out of date
 */
import { writeFileSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import * as ed25519 from '@noble/ed25519';
import { ml_dsa65 } from '@noble/post-quantum/ml-dsa.js';
import { sha256, sha512 } from '@noble/hashes/sha2.js';

import { CryptoUtils } from '../packages/sdk/src/utils/crypto.js';
import { DidAtp } from '../packages/sdk/src/utils/did.js';

// @noble/ed25519 v2 needs its SHA-512 hook wired before sync key derivation.
ed25519.etc.sha512Sync = (...m) => sha512(ed25519.etc.concatBytes(...m));

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_PATH = resolve(HERE, '../docs/specs/did-atp/test-vectors.json');

const hex = (b: Uint8Array): string => Buffer.from(b).toString('hex');

/** Deterministic 32-byte seed from a label (nothing-up-my-sleeve). */
function seed(label: string): Uint8Array {
  return sha256(new TextEncoder().encode(`atp-vectors:v1:${label}`));
}

/** Deterministic hybrid keypair (Ed25519 + ML-DSA-65) from a single label. */
async function hybridFromLabel(label: string) {
  const edSecret = seed(`${label}:ed25519`);
  const edPublic = await ed25519.getPublicKey(edSecret);
  const ml = ml_dsa65.keygen(seed(`${label}:ml-dsa-65`));
  return { edPublic, mlPublic: ml.publicKey };
}

interface PathVector {
  description: string;
  domain: string;
  path: string[];
  ed25519PublicKeyHex: string;
  mlDsa65PublicKeyHex: string;
  ed25519Jwk: Record<string, string>;
  mlDsa65Jwk: Record<string, string>;
  e1: string;
  pq1: string;
  did: string;
}

async function pathVector(description: string, domain: string, path: string[]): Promise<PathVector> {
  const { edPublic, mlPublic } = await hybridFromLabel(`${domain}|${path.join('/')}`);
  const ed25519Jwk = CryptoUtils.ed25519PublicKeyToJwk(edPublic) as unknown as Record<string, string>;
  const mlDsa65Jwk = CryptoUtils.mlDsa65PublicKeyToJwk(mlPublic) as unknown as Record<string, string>;
  const e1 = CryptoUtils.e1Fingerprint(edPublic);
  const pq1 = CryptoUtils.pq1Fingerprint(mlPublic);
  const did = DidAtp.fromPublicKeys(domain, path, edPublic, mlPublic);

  // Self-check: the produced DID parses back to these exact components.
  const parsed = DidAtp.parse(did);
  if (!parsed || parsed.e1 !== e1 || parsed.pq1 !== pq1 || parsed.domain !== domain) {
    throw new Error(`generator self-check failed for ${did}`);
  }

  return {
    description,
    domain,
    path,
    ed25519PublicKeyHex: hex(edPublic),
    mlDsa65PublicKeyHex: hex(mlPublic),
    ed25519Jwk,
    mlDsa65Jwk,
    e1,
    pq1,
    did,
  };
}

interface PairwiseVector {
  description: string;
  domain: string;
  masterSecretHex: string;
  peerId: string;
  saltHex?: string;
  peerSegment: string;
  did: string;
}

async function pairwiseVector(
  description: string,
  domain: string,
  masterSecret: Uint8Array,
  peerId: string,
  salt?: Uint8Array
): Promise<PairwiseVector> {
  const { did, peerSegment } = await DidAtp.generatePairwise(domain, masterSecret, peerId, { salt });
  return {
    description,
    domain,
    masterSecretHex: hex(masterSecret),
    peerId,
    ...(salt ? { saltHex: hex(salt) } : {}),
    peerSegment,
    did,
  };
}

async function build(): Promise<unknown> {
  // Fixed master secret for pairwise vectors — identical to the SDK/shared KAT.
  const master = new Uint8Array(32).fill(9);

  // Build a couple of path vectors, then derive two invalid identifiers from a
  // real one (swapped binding order; missing the pq1_ segment) so the negative
  // vectors are meaningful rather than obviously malformed strings.
  const billing = await pathVector('single path segment', 'agents.example.com', ['billing']);
  const nested = await pathVector('multi-segment path', 'agents.example.com', ['org', 'finance', 'payouts']);

  const invalidIdentifiers = [
    { description: 'uppercase domain (must be lowercase)', value: 'did:atp:Agents.Example.com' },
    { description: 'path DID missing the pq1_ binding segment', value: `did:atp:${billing.domain}:billing:${billing.e1}` },
    { description: 'e1_/pq1_ binding segments in the wrong order', value: `did:atp:${billing.domain}:billing:${billing.pq1}:${billing.e1}` },
    { description: 'truncated binding fingerprints', value: 'did:atp:agents.example.com:billing:e1_short:pq1_short' },
    { description: 'not a did:atp identifier', value: 'did:web:agents.example.com:billing' },
  ];
  // Confirm each invalid vector genuinely fails to parse before publishing it.
  for (const v of invalidIdentifiers) {
    if (DidAtp.parse(v.value) !== null) {
      throw new Error(`invalid-vector self-check failed (parsed unexpectedly): ${v.value}`);
    }
  }

  return {
    $comment:
      'GENERATED FILE — do not edit by hand. Regenerate with ' +
      '`npx tsx scripts/gen-did-atp-vectors.ts`. Deterministic known-answer ' +
      'vectors for the did:atp DID method.',
    spec: 'did:atp DID Method (ATP Community Group)',
    specPath: 'docs/specs/did-atp/index.html',
    generator: 'scripts/gen-did-atp-vectors.ts',
    primitives: {
      thumbprintLength: 43,
      ed25519PublicKeyBytes: 32,
      mlDsa65PublicKeyBytes: 1952,
      pairwiseDerivation: 'HKDF-SHA256, info="atp-pairwise:v1:<label>:<peerId>"',
    },
    rootIdentifiers: [
      { description: 'root did:atp (domain only)', domain: 'agents.example.com', did: DidAtp.rootDid('agents.example.com') },
    ],
    pathIdentifiers: [billing, nested],
    pairwiseIdentifiers: [
      await pairwiseVector('pinned KAT: master=0x09*32, peer A', 'agents.example.com', master, 'did:example:relying-party-1'),
      await pairwiseVector('different peer (unlinkable)', 'agents.example.com', master, 'did:example:relying-party-2'),
      await pairwiseVector('explicit salt rotates the derivation', 'agents.example.com', master, 'did:example:relying-party-1', new Uint8Array([1, 2, 3])),
    ],
    invalidIdentifiers,
  };
}

async function main(): Promise<void> {
  const vectors = await build();
  const serialized = `${JSON.stringify(vectors, null, 2)}\n`;
  const check = process.argv.includes('--check');

  if (check) {
    let current = '';
    try {
      current = readFileSync(OUT_PATH, 'utf8');
    } catch {
      console.error(`did:atp vectors missing at ${OUT_PATH}; run the generator.`);
      process.exit(1);
    }
    if (current !== serialized) {
      console.error('did:atp test-vectors.json is out of date — run `npx tsx scripts/gen-did-atp-vectors.ts`.');
      process.exit(1);
    }
    console.log('did:atp test vectors are up to date.');
    return;
  }

  writeFileSync(OUT_PATH, serialized);
  console.log(`Wrote ${OUT_PATH}`);
}

main().catch((err) => {
  console.error(`\n${err instanceof Error ? (err.stack ?? err.message) : String(err)}`);
  process.exit(1);
});
