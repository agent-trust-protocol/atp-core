# Community Release Guide — uploading ATP v1 to `w3c-cg/atp`

This guide explains what to publish to the W3C Community Group repository
**[`w3c-cg/atp`](https://github.com/w3c-cg/atp)** as the first public version, and
how to push it. It exists because the development session that prepared this
material was scoped to `agent-trust-protocol/atp-core` and could not push to
`w3c-cg/atp` directly.

## Status of the four work items (v1)

All four are implemented and pass the conformance gate
(`npm run conformance` → **510 tests, ALL GREEN**):

| # | Work item | State |
|---|-----------|-------|
| 1 | `did:atp` quantum-safe DID method (Ed25519 + ML-DSA-65) | **Done** — real FIPS 204 sizes, published test vectors, runnable proof |
| 2 | Trust scoring backed by W3C Verifiable Credentials | **Done** — ATP Trust Credential issued + fail-closed verification, VC-backed scoring |
| 3 | Privacy (pairwise DIDs, selective disclosure, ZKP) | **Done** — pairwise + Merkle selective disclosure + server-side Ristretto255; SDK hash-based variants marked experimental |
| 4 | Conformance test suite | **Runner done & green.** Vendor-neutral vectors published for did:atp; vectors for the other items are an open CG packaging decision (see `atp-conformance` spec) |

There are **no v1 blockers.**

## What to publish — two options

`w3c-cg/atp` is a *standards/community* repo. Pick the shape that fits how the CG
wants to consume ATP:

### Option A (recommended) — docs-forward standards repo
Publish the specifications, the runnable proof, the conformance suite, and the
reference SDK; link back to `atp-core` for the full service implementation.

```
spec/            ← contents of docs/specs/ (the 4 ReSpec docs + common/ + index.html + .nojekyll)
proof/           ← runnable did:atp proof of concept
conformance/     ← scripts/conformance.mjs + scripts/gen-did-atp-vectors.ts + published vectors
packages/sdk/    ← reference SDK
packages/shared/ ← crypto, identity (pairwise), trust, security (zkp) — SDK dependency
examples/        ← runnable agent examples
README.md, LICENSE, CONTRIBUTING.md, CODE_OF_CONDUCT.md, SECURITY.md
```

### Option B — full reference-implementation subset
Same as A plus the services the conformance suite exercises end to end:
`packages/identity-service`, `packages/vc-service`, `packages/permission-service`
(policy), `packages/audit-logger` (audit-store integrity). Heavier, but lets a
member stand up a full node. Note the inter-package dependencies (`sdk` → `shared`;
services → `shared`) — keep the workspace config consistent if you trim packages.

In both options, **exclude** the marketing site (`src/`), cloud/enterprise and
unrelated runtime packages (`atp-cloud`, `payment-service`, `monitoring-service`,
`rpc-gateway`, `openclaw-atp`, `protocol-integrations`, `atp-support-agent`),
internal planning/strategy docs under `docs/` (domain/deployment/landing-page
notes), and any `*.env`/secrets.

## Pre-publish hygiene checklist

- [ ] Remove demo/ngrok URLs (e.g. `*.ngrok-free.app`) from any published file.
- [ ] Confirm no secrets/API keys: `git secrets --scan` or
      `grep -rInE '(api[_-]?key|secret|token|password)\s*[:=]' <curated tree>`.
- [ ] `npm install && npm run build && npm test && npm run conformance` pass in the
      curated tree in isolation.
- [ ] `docs/specs/` (or `spec/`) contains `.nojekyll` so GitHub Pages serves ReSpec.
- [ ] Update `docs/specs/common/respec-config.js` `github.repoURL` to
      `https://github.com/w3c-cg/atp` once published.
- [ ] When the CG is formally registered with W3C, switch `specStatus` from
      `"unofficial"` to `"CG-DRAFT"` and add `group: "atp"`.

## Pushing to `w3c-cg/atp`

```bash
git clone https://github.com/w3c-cg/atp.git
cd atp
# copy the curated tree (Option A or B) into this repo, then:
git checkout -b atp-v1
git add -A
git commit -m "ATP v1: did:atp, trust credentials, privacy, conformance + specs"
git push -u origin atp-v1
# open a PR for CG review
```

## Publishing the specs (GitHub Pages)

A workflow (`.github/workflows/pages.yml`) publishes `docs/` to GitHub Pages on
push to `main`. After the first push, enable Pages in the repo settings
(Source: GitHub Actions). The rendered specs landing page will be at
`https://w3c-cg.github.io/atp/specs/` (or `/spec/` if you rename the folder).
