# ATP trust demonstration — public rerun material

Author-produced implementation report for AIKR review, 13 November 2026.
This package supplies the previously shared **22 assessment scenarios** as executable source, alongside the original and fresh rerun evidence.

## Results and status

| Run | Suites | Assessment scenarios | Failures / skipped | Provenance |
| --- | --- | --- | --- | --- |
| Original, 12 November | 40 passed | 22/22 passed | 0 / 0 | ATP-authored local assessment |
| Clean rerun, 13 November | 40 passed | 22/22 passed | 0 / 0 | Same contribution workflow; not an independent reviewer |

The suites and assessment scenarios overlap in coverage. They are not 62 independent security guarantees. The new source manifest, scenario decisions/execution counts and controls match the original; suite totals match. Timestamps and TAP timings differ naturally.

**Status: run by the contributor. Independent rerun pending.** This is not W3C certification, adopted conformance or a demonstration of every ATP feature. The original evidence is preserved under `evidence/original-2026-11-12/`; the new evidence is under `evidence/rerun-2026-11-13/`.

## Run it

Use Node.js 24, npm, Git and Bash. No API keys, Docker, paid account, model or external agent runtime is required. Initial setup needs GitHub/npm network access.

From this directory:

```bash
bash setup.sh
node run.mjs source/atp-core
```

`setup.sh` clones ATP Core, checks out **f4ced09aaad2c10fc371fc8e7a0cde642984790f**, and installs three locked dependency sets with lifecycle scripts disabled. It refuses an existing `source/atp-core` directory. After setup, rerun just the node command. This assessment intentionally uses historical dependencies to reproduce the original report, not to recommend that dependency set for production.

The runner checks the source pin and compares its 14 listed source/lock files with Git before running. It writes fresh `results/assessment.json` and five TAP logs, leaving the checked-in evidence folders intact. Use a fresh checkout: this manifest is not a full security attestation of every dependency or every file in a pre-existing checkout.

Expected final summary:

```json
{"upstreamPassed":40,"scenariosPassed":22,"scenarioCount":22,"failures":0}
```

Inspect individual suite exit codes, fail/skip counts, all 22 scenarios and controls in the JSON; a summary alone is insufficient evidence. A nonzero process exit indicates a mismatch or harness error. An early harness error may prevent creation of a complete JSON report: retain stderr and report the run as failed/inconclusive rather than inventing a pass.

The pinned source is old intentionally. The exact rerun here used Node v24.22.1 and npm 11.9.0 on Linux x64. See `provenance.json` for run times, archive/runner hashes and comparison details. It makes no assertion about the current main branch's behavior.

## What the paths cover

- **B01–B04:** published profile evaluator and an upstream host boundary, including an allowed fixed read, held approval-required callback, completed session and unknown tool.
- **H01–H06:** the actual Hermes hook subprocess plus an assessor-owned dispatcher, for fixed read, terminal/write/patch, outside path and unknown tool. **The Hermes runtime is not run.**
- **L01–L12:** a synthetic live-read policy, covering action/resource scope, expiry/future validity, injected status, simulated approval binding and inactive operator. Identity/proof/status/approval inputs are fixtures.
- **Five upstream suites:** 3 boundary, 3 hook, 12 synthetic policy, 12 experimental signed-mandate and 10 signed-request/replay tests. The cryptographic fixtures use SDK source, not a published SDK bundle.

The host-boundary path and the experimental mandate/approval paths are separate. This package does not integrate the signed-mandate fixture into Hermes. Human approval verification is simulated. The future-validity fixture uses its existing `mandate_expired` reason; this does not establish any separately proposed error taxonomy or check ordering.

Two comparison-oracle controls reject a deny-all result and a deny-but-execute result. These are not mutation tests of the upstream implementation. A harmless direct unguarded callback remains callable, demonstrating the mediation assumption. Callback instrumentation is not independent resource-side observation, OS isolation or a proof against every bypass.

## What is not tested

Real Hermes runtime, ARIA/V19 integrations, DNS/key discovery, authenticated remote revocation, durable replay/approval consumption, atomic revocation/execution, durable signed audit/checkpoints, human/organization identity attribution, normative mandate conformance and post-quantum mandate signatures remain outside this result.

## Integrity and original provenance

`run.mjs` and `setup.sh` are byte-identical to the original package. Original report/TAP bytes are retained unchanged. `provenance.json` records the original ZIP digest and the new run. `SHA256SUMS` covers every distributed package file except itself; it is an integrity manifest, not a signature or independent timestamp.

On Linux, check the manifest with `sha256sum -c SHA256SUMS`. On macOS, use `shasum -a 256 -c SHA256SUMS`. Obtain the expected manifest/package reference from a trusted channel if authenticity is at issue.

## Reporting an independent rerun

Open an AIKR issue headed `[trustvisualiser-impl]`, linking the exact package commit. Include your environment, commands, exit code, source pin, JSON/TAP evidence, positive-control results and any differences. Identify yourself as the rerunner. Keep PASS, FAIL, INCONCLUSIVE and NOT RUN distinct. Do not overwrite the contributor's evidence with your results.

The implementation report is separate from `[trustvisualiser]` model proposals. A rerun supports only these bounded cases, not adoption of ATP as a universal trust layer.

## License and attribution

Submitted by Larry Lewis, Chair, W3C Agent Trust Protocol Community Group, as an individual technical contribution. No group consensus or W3C endorsement is asserted. Distributed as ATP Core test material under the repository's Apache-2.0 license; see `LICENSE`. Agent Trust Protocol is a trademark of Sovr INC.
