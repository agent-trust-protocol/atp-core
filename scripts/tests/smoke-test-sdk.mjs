#!/usr/bin/env node
/**
 * ATP SDK smoke test — confirms the built package loads correctly via both
 * CJS (require) and ESM (import) and that key exports are callable.
 *
 * Run from repo root:
 *   node scripts/tests/smoke-test-sdk.mjs
 *
 * Or after `npm pack` + install into a fresh project:
 *   node scripts/tests/smoke-test-sdk.mjs --from-registry
 */

import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '../..');
const sdkDist = path.join(repoRoot, 'packages/sdk/dist');

let passed = 0;
let failed = 0;

function check(label, fn) {
  try {
    fn();
    console.log(`  ✓ ${label}`);
    passed++;
  } catch (err) {
    console.error(`  ✗ ${label}`);
    console.error(`    ${err.message}`);
    failed++;
  }
}

// ── CJS ────────────────────────────────────────────────────────────────────
console.log('\n[1/3] CJS require');
const require = createRequire(import.meta.url);
let cjs;
check('require dist/index.cjs resolves', () => {
  cjs = require(path.join(sdkDist, 'index.cjs'));
});
check('ATPClient exported as function', () => {
  if (typeof cjs?.ATPClient !== 'function') throw new Error(`got ${typeof cjs?.ATPClient}`);
});
check('Agent exported as function', () => {
  if (typeof cjs?.Agent !== 'function') throw new Error(`got ${typeof cjs?.Agent}`);
});
check('CryptoUtils exported as function', () => {
  if (typeof cjs?.CryptoUtils !== 'function') throw new Error(`got ${typeof cjs?.CryptoUtils}`);
});
check('DIDUtils exported as function', () => {
  if (typeof cjs?.DIDUtils !== 'function') throw new Error(`got ${typeof cjs?.DIDUtils}`);
});
check('JWTUtils exported as function', () => {
  if (typeof cjs?.JWTUtils !== 'function') throw new Error(`got ${typeof cjs?.JWTUtils}`);
});
check('45+ exports present', () => {
  const count = Object.keys(cjs).length;
  if (count < 45) throw new Error(`only ${count} exports`);
});

// ── ESM ────────────────────────────────────────────────────────────────────
console.log('\n[2/3] ESM import');
let esm;
try {
  esm = await import(path.join(sdkDist, 'index.js'));
  console.log('  ✓ import dist/index.js resolves'); passed++;
} catch (err) {
  console.error('  ✗ import dist/index.js resolves');
  console.error(`    ${err.message}`);
  failed++;
}
if (esm) {
  check('ATPClient exported (ESM)', () => {
    if (typeof esm.ATPClient !== 'function') throw new Error(`got ${typeof esm.ATPClient}`);
  });
  check('Agent exported (ESM)', () => {
    if (typeof esm.Agent !== 'function') throw new Error(`got ${typeof esm.Agent}`);
  });
}

// ── Instantiation ──────────────────────────────────────────────────────────
console.log('\n[3/3] Agent instantiation');
check('new Agent({...}) constructs without throwing', () => {
  const { Agent } = cjs;
  const agent = new Agent({
    name: 'smoke-agent',
    version: '1.0.0',
    capabilities: ['read'],
    atpEndpoint: 'http://localhost:3000',
  });
  if (!agent || agent.constructor.name !== 'Agent') {
    throw new Error('unexpected constructor');
  }
});

// ── Test files not in dist ─────────────────────────────────────────────────
console.log('\n[bonus] No test files in dist');
check('dist/__tests__/ directory absent', () => {
  const fs = require('fs');
  const testDir = path.join(sdkDist, '__tests__');
  if (fs.existsSync(testDir)) throw new Error('dist/__tests__/ exists — test files leaked into build');
});

// ── Summary ────────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(42)}`);
if (failed === 0) {
  console.log(`  PASS  ${passed} checks passed, 0 failed`);
} else {
  console.log(`  FAIL  ${passed} passed, ${failed} failed`);
  process.exit(1);
}
