# ATP Versioning Policy

How the Agent Trust Protocol™ (ATP) packages in this repository are versioned, released and retired.

Each published package has **its own version** (Lerna independent mode). There is no single repository-wide version. The badges below read live from npm, so they always show the current release.

## Published packages

| Package | Latest on npm | Status | Node.js | Use it for |
| --- | --- | --- | --- | --- |
| [`atp-sdk`](packages/sdk/README.md) | [![npm](https://img.shields.io/npm/v/atp-sdk)](https://www.npmjs.com/package/atp-sdk) | Stable | 20+ | The primary SDK: agent identity, trust utilities and profile decisions |
| [`atp-profiles`](packages/atp-profiles/README.md) | [![npm](https://img.shields.io/npm/v/atp-profiles)](https://www.npmjs.com/package/atp-profiles) | Stable | 18+ | Fail-closed security profiles and the `allow` / `require_approval` / `deny` evaluator |
| [`create-atp-agent`](packages/create-atp-agent/README.md) | [![npm](https://img.shields.io/npm/v/create-atp-agent)](https://www.npmjs.com/package/create-atp-agent) | Stable | 20+ from 1.5.0 | Scaffolding a starter project (`npx create-atp-agent my-agent`) |
| [`@atpdeveloper/did-atp`](packages/did-atp/README.md) | [![npm](https://img.shields.io/npm/v/@atpdeveloper/did-atp)](https://www.npmjs.com/package/@atpdeveloper/did-atp) | Development (0.x) | 18+ declared | Canonical `did:atp` identifier primitives |
| [`@atpdevelopment/openclaw-atp`](packages/openclaw-atp/README.md) | [![npm](https://img.shields.io/npm/v/@atpdevelopment/openclaw-atp)](https://www.npmjs.com/package/@atpdevelopment/openclaw-atp) | Legacy, optional | See package | OpenClaw adapter example. Not recommended for new integrations |

**Start with `atp-sdk`.** It includes the profile evaluator, so most applications need no other package.

The published `@atpdevelopment/openclaw-atp` 1.1.x depends on `atp-sdk@^1.2.4`. In that SDK line, `ATPClient.evaluateActionWithProfile()` returns `allow` when no profile, or an unknown profile, is configured. Use `atp-sdk` 4.x directly for new work.

> The npm package named `atp-core` is **not** an ATP package. It belongs to an unrelated project. Do not install it for ATP.

### Version history at a glance

| Package | Current major | Previous majors |
| --- | --- | --- |
| `atp-sdk` | 4.x: fail-closed profile decisions, Node.js 20+ | 3.x (raw evaluator threw on missing profiles), 2.x and 1.x (no or unknown profile and unrecognized actions returned `allow`) |
| `atp-profiles` | 3.x: missing profiles deny; `dev-mode` requires approval for unknown actions | 2.x (missing profiles threw), 1.x (unrecognized actions allowed) |
| `create-atp-agent` | 1.5.x scaffolds `atp-sdk@^4` | 1.4.x and earlier scaffold older SDKs |

Upgrade notes: [SDK migration guide](packages/sdk/docs/MIGRATION.md), [SDK changelog](packages/sdk/CHANGELOG.md) and the [`atp-profiles` migration section](packages/atp-profiles/README.md#migration).

## Workspace packages (not published)

These are `private` in their `package.json` and are not on npm. They support ATP infrastructure development in this monorepo and may change without notice.

`@atp/audit-logger`, `@atp/identity-service`, `@atp/monitoring-service`, `@atp/permission-service`, `@atp/protocol-integrations`, `@atp/rpc-gateway`, `@atp/session-sync-mcp`, `@atp/shared`, `@atp/support-agent`, `@atp/vc-service`.

The repository root (`atp-ui-modern`) is a legacy Next.js app. The public website is maintained in a separate repository.

## Semantic versioning

Published packages follow [Semantic Versioning 2.0.0](https://semver.org/):

- **Major:** incompatible API or behaviour changes. A stricter security default (for example, a decision that was `allow` becoming `require_approval` or `deny`) and a raised Node.js minimum count as major.
- **Minor:** new, backward-compatible functionality.
- **Patch:** backward-compatible fixes.

Packages at `0.x` may make breaking changes in minor versions.

Release channels: `latest` (`X.Y.Z`) for production, `beta` (`X.Y.Z-beta.N`) and `alpha` (`X.Y.Z-alpha.N`) for pre-releases.

## Releases and tags

- Each release gets a Git tag and a GitHub Release named **`<package>@<version>`**, for example `atp-sdk@4.0.0`, on the commit it was published from.
- Do not use `v*` tags for package releases. Pushing a `v*` tag triggers the `npm-publish.yml` and `production-deploy.yml` workflows.
- The repository-wide releases `v1.0.0` and `v1.2.5` predate per-package versioning and are kept as history.

### Release order

When packages depend on each other, release them in dependency order and refresh lockfiles in between:

1. `atp-profiles`
2. Refresh `packages/sdk/package-lock.json`, then `atp-sdk`
3. `create-atp-agent`, if its template's SDK range changes

Before each publish, run the package's own gates. For the SDK, those are `check-publishable`, the tests, the build, `npm run examples` and `npm pack --dry-run`. Then verify the published result with `scripts/verify-published-entry-points.mjs`.

**Publishing.** Prefer the `npm-publish-*` workflows, which publish from `main` with npm provenance. If you must publish locally, do it from a clean checkout of `main`. Local publishes carry no provenance attestation, so note that in the GitHub Release.

## Deprecation policy

1. Superseded versions stay installable. Mark them with `npm deprecate` and a message naming the replacement version, so installs show an upgrade path instead of breaking.
2. Versions with a security-relevant flaw, such as failing open on policy decisions, say so in the deprecation message.
3. Every breaking release ships migration notes.
4. Before deprecating a version, check published packages that depend on it, so their users are not left with a warning they cannot act on.

## Questions

- [GitHub Discussions](https://github.com/agent-trust-protocol/atp-core/discussions)
- [Issues](https://github.com/agent-trust-protocol/atp-core/issues)
- [Contribution guide](CONTRIBUTING.md)
