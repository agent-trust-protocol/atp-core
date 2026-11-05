// Locations of ATP CLI state. ATP_HOME overrides ~/.atp (used by tests and for
// running several isolated identities on one machine).
import { mkdirSync, readFileSync, writeFileSync, renameSync, chmodSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

export function atpHome() {
  return process.env.ATP_HOME || join(homedir(), '.atp');
}

export const paths = {
  settings: () => join(atpHome(), 'settings.json'),
  identity: () => join(atpHome(), 'identity.json'),
  audit: () => join(atpHome(), 'audit.jsonl'),
  auditLock: () => join(atpHome(), 'audit.lock'),
  history: () => join(atpHome(), 'history'),
  hermesConfig: () => join(atpHome(), 'hermes-hook.json'),
};

export function ensureHome() {
  mkdirSync(atpHome(), { recursive: true, mode: 0o700 });
}

export function readJson(file, fallback = undefined) {
  if (!existsSync(file)) return fallback;
  return JSON.parse(readFileSync(file, 'utf8'));
}

/** Atomically write JSON (temp file + rename) with the given file mode. */
export function writeJson(file, value, mode = 0o644) {
  mkdirSync(dirname(file), { recursive: true });
  const tmp = `${file}.${process.pid}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(value, null, 2)}\n`, { mode });
  chmodSync(tmp, mode);
  renameSync(tmp, file);
}
