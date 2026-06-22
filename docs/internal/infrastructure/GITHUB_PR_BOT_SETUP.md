# PR Code Analysis (free & open source)

Automated pull-request code analysis for `atp-core`. This **replaces the old
Recurse ML GitHub App** (a paid third-party trial) with two free, open-source
analyzers that run directly in GitHub Actions — **no API key, no paid plan, no
secret required.**

## What runs

Defined in [`.github/workflows/code-analysis.yml`](../../../.github/workflows/code-analysis.yml).
On every pull request (and on push to `main`, to set the baseline), two
**advisory** jobs run:

| Job | Tool | What it finds | License / cost |
|-----|------|---------------|----------------|
| `Semgrep (OSS)` | [Semgrep OSS](https://github.com/semgrep/semgrep) | Bug patterns, insecure code, leaked secrets, TS/JS anti-patterns (registry rulesets `p/default`, `p/secrets`, `p/typescript`, `p/javascript`) | LGPL, free, no token |
| `CodeQL` | [GitHub CodeQL](https://codeql.github.com/) | Security vulnerabilities & data-flow bugs (SAST) for JavaScript/TypeScript | Free for public repos, no token |

Both jobs are **advisory / non-blocking**: results appear as inline PR
annotations and in the repository **Security → Code scanning** tab, but they do
**not** fail the PR. The merge gate remains the `Lint · Type-check · Test` job in
[`ci.yml`](../../../.github/workflows/ci.yml).

> CodeQL also runs (push-only) inside `production-deploy.yml`; the
> `code-analysis.yml` workflow is what gives **pull requests** their CodeQL pass.

## How to read findings

1. Open the PR → **Files changed**: Semgrep/CodeQL findings show as inline
   annotations on the relevant lines.
2. Repository → **Security → Code scanning**: the full list of open alerts,
   grouped by tool (`semgrep`, CodeQL), with severity and remediation guidance.
3. The two checks (`Code Analysis / Semgrep (OSS)`, `Code Analysis / CodeQL`)
   appear in the PR **Checks** list — green/neutral even when findings exist,
   because they are advisory.

## Making them blocking (optional)

If you later want analysis to gate merges, add the relevant check(s) as
**required status checks** under **Settings → Branches → Branch protection** for
`main`. (Left advisory by default so it never throws a surprise red ✗ on open
PRs.)

## Tuning Semgrep rulesets

Edit the `--config` flags in `code-analysis.yml`. All
[Semgrep registry](https://semgrep.dev/explore) `p/*` packs are free and need no
token. To ignore paths, add a `.semgrepignore` file at the repo root.

---

## ⚠️ One manual step: remove the old Recurse ML app

The workflow above replaces Recurse ML, but Recurse ML was installed as a
**GitHub App** (it was never configured in this repo), so it must be uninstalled
in GitHub's UI — nothing in the repository can stop it from posting its
`recurseml/analysis` status:

1. Go to the org's GitHub App settings:
   **GitHub → Organization → Settings → GitHub Apps** (or
   <https://github.com/settings/installations> for a personal account).
2. Find **Recurse ML** → **Configure**.
3. Either **remove `agent-trust-protocol/atp-core`** from its repository access,
   or **Uninstall** the app entirely.

Once uninstalled, the stale `recurseml/analysis` check stops appearing on PRs.
