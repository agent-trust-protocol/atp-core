# Bounded Chinook SQL proof (2026-10-20): sanitized evidence

Sanitized evidence for part 0 of [`../RESULTS.md`](../RESULTS.md). Every file is built from field
allowlists, with loopback URLs and local filesystem paths redacted.

- `L-*.json` — one bounded run of the existing agent on a locally installed Ollama model. Each
  file records the selection mode (`autonomous` or `harness-coerced`, with its exact meaning), the
  model digest, the structured tool calls the model emitted, the ATP results, the new receipt and
  audit events, the SQL-callback count, the audit-chain status and the Chinook hashes. It also
  carries `rawSha256`, the hash of the privately held raw output, and the instructions disclosure.
- `M2-enforcement-matrix.json` — the 14-check no-model enforcement matrix on the same harness.

Studio source, raw logs, harness handshakes and keys are not included. Per-run secrets were
generated in memory and never written. Integrity: `SHA256SUMS`.
