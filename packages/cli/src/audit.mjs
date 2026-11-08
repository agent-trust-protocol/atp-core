// Local audit trail: one JSON object per line in ~/.atp/audit.jsonl.
//
// Each entry carries `prev` (the previous entry's hash) and `hash` (SHA-256 of
// the entry's canonical JSON without hash/sig fields). When a local identity
// exists, `sig` is an Ed25519 signature over `hash` and `signer` is the signing
// public key.
//
// What this proves: an unsigned chain only detects accidental corruption or a
// careless edit; anyone who can write the file can recompute every hash. A
// signed chain additionally detects edits by anyone without the identity's
// secret key. Neither prevents deleting the file or truncating its tail.
import { appendFileSync, closeSync, existsSync, openSync, readFileSync, statSync, unlinkSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { ensureHome, paths } from './home.mjs';
import { signWithIdentity, verifyIdentitySignature } from './identity.mjs';

const GENESIS = 'genesis';

function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value).sort().map((k) => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

/** SHA-256 over the record itself; signature metadata (did, signer, sig) and the hash are excluded. */
export function entryHash(entry) {
  const { hash, sig, signer, did, ...body } = entry;
  return createHash('sha256').update(canonical(body)).digest('hex');
}

function sleep(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

/** Exclusive lock so concurrent hook processes cannot fork the chain. */
async function withLock(fn) {
  ensureHome();
  const lock = paths.auditLock();
  const deadline = Date.now() + 5000;
  let fd;
  for (;;) {
    try {
      fd = openSync(lock, 'wx', 0o600);
      break;
    } catch (error) {
      if (error.code !== 'EEXIST') throw error;
      try {
        if (Date.now() - statSync(lock).mtimeMs > 10000) unlinkSync(lock); // stale lock from a crashed process
      } catch { /* raced with another process */ }
      if (Date.now() > deadline) throw new Error('timed out waiting for the audit lock');
      sleep(25);
    }
  }
  try {
    return await fn();
  } finally {
    closeSync(fd);
    try { unlinkSync(lock); } catch { /* already gone */ }
  }
}

export function readEntries() {
  const file = paths.audit();
  if (!existsSync(file)) return [];
  return readFileSync(file, 'utf8').split('\n').filter(Boolean).map((line, index) => {
    try {
      return JSON.parse(line);
    } catch {
      return { __invalid: true, line: index + 1 };
    }
  });
}

function lastHash() {
  const entries = readEntries();
  const last = entries[entries.length - 1];
  return last && !last.__invalid ? last.hash : GENESIS;
}

/**
 * Append a decision record under the lock, signing its hash with the local
 * identity when one exists. Returns the stored entry.
 */
export async function recordDecision(record) {
  return withLock(async () => {
    const entry = { v: 1, ts: new Date().toISOString(), ...record, prev: lastHash() };
    entry.hash = entryHash(entry);
    const signature = await signWithIdentity(entry.hash);
    if (signature) {
      entry.did = signature.did;
      entry.signer = signature.signer;
      entry.sig = signature.sig;
    }
    appendFileSync(paths.audit(), `${JSON.stringify(entry)}\n`, { mode: 0o600 });
    return entry;
  });
}

/** Verify the whole chain and every signature. */
export async function verifyAudit() {
  const entries = readEntries();
  const problems = [];
  let prev = GENESIS;
  let signed = 0;
  for (const [index, entry] of entries.entries()) {
    const line = index + 1;
    if (entry.__invalid) { problems.push(`line ${line}: not valid JSON`); prev = null; continue; }
    if (prev !== null && entry.prev !== prev) problems.push(`line ${line}: chain broken (prev does not match line ${line - 1})`);
    if (entryHash(entry) !== entry.hash) problems.push(`line ${line}: content does not match its hash`);
    if (entry.sig) {
      if (await verifyIdentitySignature(entry.hash, entry.signer, entry.sig)) signed += 1;
      else problems.push(`line ${line}: invalid signature`);
    }
    prev = entry.hash;
  }
  return { ok: problems.length === 0, entries: entries.length, signed, unsigned: entries.length - signed, problems };
}
