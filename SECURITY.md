# ATP Core security scope and evidence

This repository contains developer packages, examples, a website, and private
service implementations. Source code and test fixtures do not establish that a
control is deployed, covers every route, or is independently audited. ATP Core is
not a SOC 2 attestation. ATP Studio has separate infrastructure and evidence.

See [the claim-to-control matrix](docs/security/claims-matrix.md) for implementation
references, executable checks, limitations, and remaining review requirements.

## Supported boundaries

- `atp-profiles` evaluates explicit action types and lifecycle states and returns
  `allow`, `deny`, or `require_approval`. A runtime must call the evaluator at every
  tool boundary and block both deny and pending approval before execution.
- The SDK and OpenClaw wrapper contain profile integration. Missing action metadata
  can skip profile evaluation; a profile is not an operating-system sandbox.
- DID and signature helpers have reference-vector and conformance tests. Local
  quickstart identities are ephemeral and non-resolvable until configured with
  persistence and a published DID document.
- Authentication, RBAC, rate-limiting, and monitoring implementations exist, but
  universal endpoint coverage and production effectiveness have not been verified.
  Middleware cookie presence alone does not validate a session; protected APIs
  must perform server-side session and authorization checks.
- Protocol adapters vary in maturity. Review the support inventory and open PR
  #164; do not assume universal protocol verification or production readiness.

## Verification

```sh
node scripts/check-action-pins.mjs
npm ci --include=dev --prefix packages/did-atp
npm test --prefix packages/did-atp
npm ci --include=dev --prefix packages/atp-profiles
npm test --prefix packages/atp-profiles
npm ci --include=dev --prefix packages/create-atp-agent
npm test --prefix packages/create-atp-agent
node scripts/verify-published-entry-points.mjs
```

Root conformance requires root development dependencies: `npm ci --include=dev`
then `npm run conformance`. CI audits independently locked package graphs. Passing
unit tests or dependency audits do not establish absence of vulnerabilities.

## Reporting a vulnerability

Use the repository's private security reporting feature if available. Do not put
credentials, personal data, exploit payloads against live systems, or private audit
material in public issues. If private reporting is unavailable, ask a maintainer
for a private reporting channel without including the vulnerability details.

## Deployment responsibilities

Operators must verify authentication and authorization on sensitive endpoints,
configure limits for the deployment topology, manage and rotate keys, enforce tool
boundaries, and retain appropriate audit evidence. External penetration tests,
real-time alert delivery, production Redis operation, and ongoing compliance
reviews require their own evidence; this repository does not certify them.

Last reviewed: 2026-10-21. Independent reviewer approval remains pending in #168.
