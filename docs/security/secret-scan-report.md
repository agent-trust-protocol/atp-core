# Git history secret scan — findings & remediation

**Date:** 2026-06-18
**Tool:** gitleaks v8.21.2 (`gitleaks git . --redact`)
**Scope:** full git history (117 commits scanned)
**Raw count:** 126 matches → triaged below.

This corresponds to Stage 0.2 ("Audit git history for secrets, then rotate") of the
pre-W3C critical-fixes plan.

> ⚠️ Removing a secret from the working tree does **not** un-leak it — anything
> ever committed remains in history. Every item marked **REAL** below must be
> **rotated/revoked at its source**, regardless of any history rewrite.

## Triage

| Finding | Location (history) | Verdict | Action |
|---|---|---|---|
| RSA private keys | `certs/ca-key.pem`, `certs/client-key.pem`, `certs/server-key.pem` | **REAL** PKCS#8 private keys (commits `aa627b8d`, `2ccacce5`, Mar 2026) | Regenerate the CA/server/client key pairs and reissue certs. Already removed from the tree and covered by `.gitignore` (`certs/`, `*.key`, `*.pem`). |
| Grafana admin password | `production/monitoring-stack.yaml` → `admin-password: YWRtaW4xMjM=` (`admin123`) | **REAL** (weak default) | Removed from the tree (now injected via `${GRAFANA_ADMIN_PASSWORD}` / secret manager). Rotate the Grafana admin password anywhere this manifest was applied. |
| Stripe token | `.claude/skills/tech-debt-analyzer/references/debt_categories.md` → `sk_live_abc123xyz789` | **FALSE POSITIVE** — fake value used as a "bad code" example in a skill reference doc | None. |
| GitHub PAT | `atp-core/mcp-config.json` → `YOUR_GITHUB_PERSONAL_ACCESS_TOKEN` | **FALSE POSITIVE** — placeholder | None. |
| `generic-api-key` ×94 / `curl-auth-header` ×18 | mostly `docs/**`, skill templates, guides | **FALSE POSITIVE** — documentation placeholders / example snippets | None. |

## Remediation status

**Done in-repo (this branch):**
- Externalized the Grafana admin password (no secret value in the manifest).
- Verified `.gitignore` blocks `certs/`, `*.key`, `*.pem` so the key material cannot be re-committed.
- Added this report.

**Required human/ops actions (cannot be done from the repo):**
1. **Rotate the TLS key material** — regenerate `ca-key.pem` / `server-key.pem` / `client-key.pem`
   and reissue/redistribute any dependent certificates. Treat the historical keys as compromised.
2. **Rotate the Grafana admin password** on any cluster where the old manifest was applied.
3. **(Optional) History rewrite** — if policy requires scrubbing the key material from history,
   use `git filter-repo` and force-push to a **fresh mirror after taking a backup** (per the
   repo's stated safety rule: do not force-push history rewrites without a backup mirror).
   Rotate first regardless — the rewrite does not substitute for rotation.

## Re-verify

```bash
gitleaks git . --redact   # expect: only the documented false positives remain
```
