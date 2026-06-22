# PR Code Analysis (free & open source)

Automated pull-request code analysis for `atp-core`. This **replaces the old
Recurse ML GitHub App** (a paid third-party trial) with free, open-source
analysis that runs directly in GitHub — **no API key, no paid plan, no secret
required.** Two complementary engines provide it:

## What runs

| Engine | Source | What it finds | License / cost |
|--------|--------|---------------|----------------|
| `Semgrep (OSS)` | [`.github/workflows/code-analysis.yml`](../../../.github/workflows/code-analysis.yml) | Bug patterns, insecure code, leaked secrets, TS/JS anti-patterns (registry rulesets `p/default`, `p/secrets`, `p/typescript`, `p/javascript`) | LGPL, free, no token |
| `CodeQL` | GitHub **CodeQL default setup** (Settings → Code security → CodeQL analysis) | Security vulnerabilities & data-flow bugs (SAST) for JavaScript/TypeScript | Free for public repos, no token |

**CodeQL is provided by the repo's built-in default setup**, which already scans
pull requests — so it is intentionally **not** duplicated in
`code-analysis.yml`. (GitHub rejects a custom CodeQL workflow upload while
default setup is enabled: *"CodeQL analyses from advanced configurations cannot
be processed when the default setup is enabled."*) The workflow therefore adds
only the piece default setup doesn't cover: **Semgrep OSS**.

Semgrep runs as an **advisory / non-blocking** check on pull requests (and push
to `main` for a baseline): results appear as inline PR annotations and in the
repository **Security → Code scanning** tab, but do **not** fail the PR. The
merge gate remains the `Lint · Type-check · Test` job in
[`ci.yml`](../../../.github/workflows/ci.yml).

> CodeQL is **only** run by default setup. The CodeQL steps that used to live in
> `production-deploy.yml` were removed because they conflict with default setup
> (same "advanced configurations cannot be processed" error). Default setup is
> the single CodeQL path.

### ⚙️ Operator prerequisite — keep CodeQL default setup enabled

This PR does not (and cannot) commit the CodeQL configuration; it lives in repo
**Settings → Code security → CodeQL analysis → Default**. Keep it **enabled** —
that is what gives pull requests their CodeQL coverage. If it is ever turned off,
PRs lose CodeQL entirely (the removed workflow no longer provides a fallback), so
treat leaving it on as a required setting. Do **not** re-add a committed CodeQL
workflow while default setup is enabled — the two cannot coexist.

## Fork PRs

For pull requests from **forks**, the Semgrep *scan* still runs (its findings
appear in the job's Actions log), but the **SARIF upload is skipped** — forked
PRs get a read-only `GITHUB_TOKEN` and cannot write code-scanning results. Such
findings surface in the Security tab once the change lands on `main` (the push
run uploads them). CodeQL default setup applies its own fork handling.

## How to read findings

1. Open the PR → **Files changed**: Semgrep / CodeQL findings show as inline
   annotations on the relevant lines (same-repo PRs).
2. Repository → **Security → Code scanning**: the full list of open alerts,
   grouped by tool (`semgrep`, CodeQL), with severity and remediation guidance.
3. The `Code Analysis / Semgrep (OSS)` check (and the CodeQL check from default
   setup) appear in the PR **Checks** list.

## Making Semgrep blocking (optional)

If you later want Semgrep to gate merges, add the `Code Analysis / Semgrep (OSS)`
check as a **required status check** under **Settings → Branches → Branch
protection** for `main`. The Semgrep job runs on fork PRs too (only its upload is
skipped), so the check is still produced and is safe to require. (Left advisory
by default so it never throws a surprise red ✗ on open PRs.)

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
