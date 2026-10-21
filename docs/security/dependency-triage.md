# Dependency review — #156

All 15 immediate `packages/*/package.json` install units are classified in
`package-inventory.json` and now have lockfiles. Six private services previously
referenced nonexistent public `@atp/shared@^0.1.0`; they now reference `file:../shared`.
Service-local `npm ci` must be run with the sibling packages present. Lockfiles
reproduce resolution; they do not establish native-addon build compatibility.

`dependency-audit.json` contains the dated full/production npm audit counts and
primary advisory links. Counts are affected graph nodes, not unique vulnerabilities.
The root app, nested templates and examples are separate from this 15-package
inventory and are not claimed to be covered by its matrix.

## Applied scoped changes

- SDK, Shared, OpenClaw: compatible lockfile-only `npm audit fix`, without `--force`.
  SDK production graph changed from 3 high affected nodes to zero findings.
- Support agent: removed unused `node-zendesk` (no imports in tracked source).
  Its legacy request/form-data chain accounted for two critical production nodes;
  its new production graph has zero findings. No Zendesk integration is implemented.
- DID: committed reproducible lock and verified known-answer vectors. Removed no
  compatibility constraints merely to make audit output green.
- All 15 graphs now enter blocking critical production and full audit gates. A
  known critical finding is expected to block the new matrix; no exception or
  continue-on-error is used to hide it.

## Unresolved and scoped next actions

| Area | Finding / boundary | Required next step |
| --- | --- | --- |
| Monitoring service | sqlite3 5.x brings vulnerable tar; one critical production node remains | Evaluate sqlite3 6.x with actual native install plus metrics-storage write/read/retention tests; no forced major upgrade in this branch. Keep service release blocked. |
| SDK / Shared / OpenClaw | Remaining high/moderate dev toolchain nodes, including Jest/micromatch/braces, minimatch and parser chains | Review primary advisories in JSON; test scoped overrides or supported toolchain upgrades with full package suites. Some audit recommendations require breaking upgrades or have no compatible fix. No blanket risk acceptance. |
| Shared | fast-xml-parser moderate development advisory requires major upgrade | Removed unused development dependency after source search; no XML parser imports exist in Shared. |
| RPC gateway | Production high findings remain in proxy dependency graph | Evaluate supported http-proxy-middleware upgrade with routing and auth-header regression checks. |
| DID | @types/jest transitively brings high development nodes | Removed unused Jest types; DID tsconfig uses only Node types and vector/build checks pass. |
| Other private services | High/moderate development chains newly visible | Use per-package findings; avoid treating zero critical as zero vulnerabilities. |

## Support verification and release gates

The existing published entry-point check pins SDK 2.2.1, CLI 1.3.3, Profiles 1.1.0
and DID 0.1.1. It installs registry packages into a temporary consumer without
repository imports. Node 24 passed locally. CI now requests Node 18/20/24; added
matrix jobs are not evidence until they pass. Node 18 testing is compatibility
coverage, not a recommendation to deploy an unsupported runtime.

CodeQL/Semgrep alert review and production serving revision checks are still
pending. PR #164 contains separate adapter hardening and PR #166 contains the CLI
preview; neither is silently merged into this branch. Published packages do not
contain the changes in this branch until a separately approved release.
