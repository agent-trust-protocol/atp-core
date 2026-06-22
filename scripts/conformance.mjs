#!/usr/bin/env node
/**
 * W3C ATP conformance runner.
 *
 * Runs the conformance suites for each of the four ATP core items and prints a
 * single, human-readable per-item summary so you can verify the spec surface
 * from the CLI:
 *
 *   npm run conformance            # all four items
 *   npm run conformance -- 1       # just item 1 (did:atp)
 *   npm run conformance -- 3 4     # items 3 and 4
 *
 * Exits non-zero if any item has a failing or empty suite, so it doubles as a
 * release / CI gate.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ITEMS = [
  {
    id: 1,
    name: 'did:atp — create / parse / resolve',
    pattern: '(did-v2|did|operations|resolver)\\.test\\.ts$',
  },
  {
    id: 2,
    name: 'Hybrid signatures — Ed25519 + ML-DSA-65',
    pattern: '(crypto-v2|crypto|verify-compat)\\.test\\.ts$',
  },
  {
    id: 3,
    name: 'Policy Assertion Engine — allow/deny, deny-by-default',
    pattern: '(policy-conformance|policy-evaluator-conformance)\\.test\\.ts$',
  },
  {
    id: 4,
    name: 'Audit Store / Trust Registry — integrity + tamper detection',
    pattern: '(audit-conformance|trust-conformance|trust-scoring-conformance|trust)\\.test\\.ts$',
  },
  {
    id: 5,
    name: 'Privacy — selective disclosure (Merkle membership)',
    pattern: '(zkp-conformance|selective-disclosure)\\.test\\.ts$',
  },
];

const requested = process.argv.slice(2).map(Number).filter((n) => !Number.isNaN(n));
const items = requested.length ? ITEMS.filter((i) => requested.includes(i.id)) : ITEMS;

// Never let the gate pass vacuously: an unknown/typo'd item ID must fail loudly
// rather than run zero tests and report "ALL GREEN".
if (requested.length) {
  const validIds = new Set(ITEMS.map((i) => i.id));
  const unknown = requested.filter((id) => !validIds.has(id));
  if (unknown.length) {
    console.error(
      `Unknown conformance item id(s): ${unknown.join(', ')}. ` +
      `Valid ids: ${ITEMS.map((i) => i.id).join(', ')}.`
    );
    process.exit(2);
  }
}
if (items.length === 0) {
  console.error('No conformance items selected — nothing to run.');
  process.exit(2);
}

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

function runItem(item) {
  const outFile = join(mkdtempSync(join(tmpdir(), 'atp-conf-')), 'results.json');
  try {
    execFileSync(
      'npx',
      [
        'jest',
        '--config', 'jest.config.cjs',
        '--runInBand',
        '--silent',
        '--ci',
        '--json',
        `--outputFile=${outFile}`,
        '--testPathPattern', item.pattern,
      ],
      { stdio: ['ignore', 'ignore', 'ignore'] }
    );
  } catch {
    // jest exits non-zero when a suite fails; the JSON report is still written,
    // so we fall through and read it below. If jest instead failed to START
    // (bad config, module resolution error, …) no report exists — the read
    // below is guarded to surface a readable diagnostic rather than an ENOENT.
  }
  let r;
  try {
    r = JSON.parse(readFileSync(outFile, 'utf8'));
  } catch {
    console.error(
      `\n  [${item.id}] jest did not produce a JSON report — it likely failed to start.\n` +
      `  Re-run to see the error:\n` +
      `    npx jest --config jest.config.cjs --testPathPattern "${item.pattern}"\n`
    );
    process.exit(1);
  }
  return {
    suites: r.numTotalTestSuites,
    passed: r.numPassedTests,
    failed: r.numFailedTests,
    total: r.numTotalTests,
    ok: r.numFailedTests === 0 && r.numTotalTests > 0,
  };
}

console.log(`\n${BOLD}Agent Trust Protocol — W3C conformance${RESET}\n`);

let allOk = true;
let grandTotal = 0;
for (const item of items) {
  process.stdout.write(`  ${DIM}[${item.id}]${RESET} ${item.name} … `);
  const res = runItem(item);
  grandTotal += res.passed;
  if (res.ok) {
    console.log(`${GREEN}PASS${RESET} ${DIM}(${res.passed} tests, ${res.suites} suites)${RESET}`);
  } else {
    allOk = false;
    const reason = res.total === 0 ? 'no tests matched' : `${res.failed} failing`;
    console.log(`${RED}FAIL${RESET} ${DIM}(${reason})${RESET}`);
  }
}

console.log(
  `\n  ${allOk ? GREEN + 'ALL GREEN' : RED + 'FAILURES PRESENT'}${RESET} ` +
    `${DIM}— ${grandTotal} tests passed across ${items.length} item(s)${RESET}\n`
);

process.exit(allOk ? 0 : 1);
