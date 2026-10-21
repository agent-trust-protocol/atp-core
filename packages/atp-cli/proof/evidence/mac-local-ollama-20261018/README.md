# Developer-Mac local-model attempts: sanitized evidence

Sanitized evidence for part 1 of [`../RESULTS.md`](../RESULTS.md). There is one JSON file per
claim, built from field allowlists, with loopback URLs and local filesystem paths redacted.

Every file has:

- `evidence_class`: either `original-artifact` (a run-time file that still exists; its SHA-256
  is in `original_artifact`) or `session-log-recovery` (verbatim run output captured in the
  operator's local session log; the original result file was in a temporary directory that was
  later wiped).
- `sources`: session ID, log line (0-based), timestamp, tool_use_id and the SHA-256 of the
  privately held raw record. `private_record` paths refer to the operator's private recovery
  folder, which is **not** in this repository.
- `runner_recovered_source_sha256` / `server_recovered_source_sha256`, where applicable: hashes
  of the harness scripts rebuilt from the session log. These scripts are private, contain
  test-only credentials, and have not been re-executed since recovery.

These files contain no Studio source, raw session logs, keys, passphrases or credentials.
Integrity: `SHA256SUMS`.
