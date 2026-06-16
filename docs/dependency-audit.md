# Dependency Vulnerability Audit

_Generated 2026-06-15. Report only — no dependency versions were changed as part of
this audit. Use it to plan remediation._

## How to reproduce

```bash
npm audit                 # root app (the deployed Next.js project)
npm audit --package-lock-only --prefix <package-dir>   # any sub-package
```

## Reconciling the "178" GitHub number

GitHub Dependabot reports **178 alerts** on the default branch. That figure
aggregates **every lockfile in the monorepo** (12 of them) and counts alerts
per-manifest/per-advisory. `npm audit` run per lockfile totals **~61**, and the
**root app is 21**. None of this is caused by application code — it is all
dependency versions. Numbers below are from `npm audit`.

## Severity summary (by lockfile)

| Lockfile | critical | high | moderate | total |
|---|---|---|---|---|
| `.` (root Next.js app) | 1 | 12 | 8 | 21 |
| `packages/sdk` | 1 | 9 | 3 | 13 |
| `packages/openclaw-atp` | 1 | 7 | 1 | 9 |
| `packages/shared` | 0 | 0 | 5 | 5 |
| `examples/advanced-agents` | 1 | 1 | 2 | 4 |
| `scripts/tests/test-sdk` | 0 | 1 | 2 | 3 |
| `scripts/tests/test-atp-sdk` | 0 | 1 | 2 | 3 |
| `examples/simple-agent` | 0 | 0 | 1 (+1 low) | 2 |
| `examples/demo-workflow` | 0 | 0 | 0 (+1 low) | 1 |
| `packages/atp-profiles`, `packages/create-atp-agent`, `examples/quick-start` | 0 | 0 | 0 | 0 |

## Root app (deployed) — detail

**Critical (1)**
- `handlebars` — transitive; **auto-fixable** (`npm audit fix`).

**High (12)** — auto-fixable unless noted:
- Direct deps: `axios`, `better-auth`, `eslint-config-next`, `kysely`.
- `next` (DIRECT) — **BREAKING: requires `next@16`** (currently `^14`). Not safe to
  auto-fix; this is a major framework upgrade.
- Transitive: `@next/eslint-plugin-next`, `defu`, `fast-xml-builder`,
  `fast-xml-parser`, `flatted`, `glob`, `picomatch`.

**Moderate (8)** — auto-fixable unless noted:
- Direct: `resend`, `ws`; `postcss` (DIRECT) — **BREAKING** major bump.
- Transitive: `@aws-sdk/xml-builder`, `brace-expansion`, `follow-redirects`,
  `svix`, `uuid`.

~17 of the 21 root advisories are clearable with a non-breaking `npm audit fix`.

## Recommended remediation order

1. **Non-breaking pass first** — run `npm audit fix` (no `--force`) at the root and
   in each sub-package lockfile. This clears the critical (`handlebars`) and the
   large majority of highs/moderates with semver-compatible bumps. Re-run the full
   test gate (`npm test`, `npm run type-check`, `npm run lint`) afterward.
2. **Schedule the breaking bumps separately** — `next@14 → 16` and `postcss` major.
   These need a dedicated, tested effort (Next 14→16 has migration steps and can
   affect build/runtime). Do not bundle with the routine pass.
3. **Never auto-bump crypto libraries** — `@noble/*`, `@noble/post-quantum`,
   `did-jwt`, `jsonwebtoken`. Per project policy ("do not roll your own crypto" /
   don't casually change crypto behavior), review any advisory on these
   individually before upgrading.
4. **Examples/scripts lockfiles** are low priority (not shipped); fix opportunistically
   or consider whether they need committed lockfiles at all.

## Notes

- A `.github/dependabot.yml` was **not** found — adding one would let Dependabot open
  scoped update PRs per lockfile and keep this from re-accumulating.
- This audit changed no `package.json` or lockfile dependency entries.
