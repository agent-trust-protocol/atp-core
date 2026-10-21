# Dependency remediation — #156

All 15 immediate package units have reproducible lockfiles and **zero npm audit
findings in both full and production graphs** at the 2026-10-21 check. See
`dependency-audit.json`. These are dated advisory results, not a guarantee that
packages have no vulnerabilities. The package matrix now blocks all severities.

## Changes and compatibility evidence

- Monitoring: sqlite3 6.0.1 replaces the vulnerable sqlite3 5/tar chain. Native
  SQLite 3.52.0 runs locally; immediate write, latest/history, retention and reopen
  test passes. Fixed a schema-initialization race by awaiting readiness. Full
  monitoring TypeScript build passes. Added native-install CI on Node 20 and 24.
  node-cron 4.2.1 removes its vulnerable uuid dependency; schedule lifecycle tested.
- Jest 30.5.2 / ts-jest 29.4.15 remove old glob/micromatch chains. Root 1,094,
  SDK 584, Shared 284 and OpenClaw 27 tests pass; conformance 510 passes. Updated
  Jest's `--testPathPatterns` spelling in conformance commands.
- Scoped `@istanbuljs/load-nyc-config` → js-yaml 4.3.2 removes argparse/sprintf-js.
  Source uses the supported `.load` API; a real YAML coverage configuration test
  passes. No global YAML override is applied to unrelated consumers.
- SDK/OpenClaw TypeScript ESLint tools upgraded to 8.72.0; vulnerable old globby
  chains removed. minimatch updated within declared compatible ranges.
- Shared's development-only Express parser uses a same-major qs 6.16.0 override.
- Support agent's TypeScript runner updated to tsx 4.23.15. Loader smoke test passes;
  the CLI IPC pipe is prohibited in this environment, so that CLI mode is not
  claimed verified locally.
- Removed unused vulnerable RPC `http-proxy-middleware`; no tracked source imports
  or route behavior use it. Previously removed unused Zendesk/Jest/XML dependencies
  remain removed. Six private services use sibling `file:../shared` links.

## Runtime and release boundaries

Published SDK/CLI first runs pass Node 20/24; Node 18 fails Web Crypto initialization.
Source SDK/CLI/starter requirements now say Node 20+. CI's Node 18 job is explicitly
an unsupported-runtime negative probe: it must observe that exact known error;
other errors still fail. This does not claim Node 18 support or alter published npm
metadata. Package publication and production serving-revision checks require a
separately approved release.

The separate root Next.js website graph is **not** included in the clean 15-package
claim; its existing advisory debt and external Snyk status require their own app
remediation/review. Root conformance tooling was updated for the supported Jest
upgrade, but no website runtime release is performed.
