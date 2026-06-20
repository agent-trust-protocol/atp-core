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
];

const requested = process.argv.slice(2).map(Number).filter((n) => !Number.isNaN(n));
const items = requested.length ? ITEMS.filter((i) => requested.includes(i.id)) : ITEMS;

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
    // jest exits non-zero when a suite fails; the JSON report is still written.
  }
  const r = JSON.parse(readFileSync(outFile, 'utf8'));
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
