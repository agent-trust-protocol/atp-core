# Identifier and SDK release completion checkpoint

2026-11-08. Baseline: merged ATP Core commit
`0fadfa4de0a2c7b7235bf8fa51696b67dd2d2703` (PR #217).

## Completed locally / in GitHub

- did-atp 0.2.0 workflow validation passed:
  https://github.com/agent-trust-protocol/atp-core/actions/runs/42519461727
- Actual publishing was attempted from the same main commit; package install,
  build, all six tests, packaging, and provenance generation succeeded. npm
  rejected the final PUT with E404 (resource missing or no permission):
  https://github.com/agent-trust-protocol/atp-core/actions/runs/42519642604
- The npm package already exists as 0.1.1. The precise publisher configuration
  mismatch is not verified: npm's website repeatedly challenged the available
  cloud browser. No npm settings or publishing permissions were modified.
- SDK 6.0.0 candidate adopts the canonical path parser and retains root DIDs,
  nonempty fragments, pairwise paths, and null-on-invalid SDK behavior. A major
  version records the stricter redirect, mapping, fetch-stream, and deadline
  contracts introduced since published SDK 5.0.0. Migration notes are included.

## Candidate testing is not registry verification

The SDK candidate pins did-atp 0.2.0. Its lock integrity was computed from the
actual locally packed 0.2.0 tarball and matches the failed publisher's package
SHA-1 (`99ef08b98f39c11f4a67fac699e7bd4c9863e7d4`).

Expected SHA-512 integrity:

```
sha512-Nhsma1kS/t/6b6zhm9jxkE2ET9wwvfcCSUP79Im+uL3vawXd8p+yGKN/fETmk7b0Ktcsiu/djCBXfSdGOiASWg==
```

The local tarball was added to npm's content cache, then the candidate's SDK
lockfile was installed offline with lifecycle scripts disabled. SDK TypeScript
build passed, 31 suites / 762 tests passed, and all six offline examples passed
on Node 24. The earlier focused parser/equivalence run separately passed five
suites / 62 tests. Counts overlap. This demonstrates the candidate's code and
lockfile work together; it does not demonstrate an npm registry release.

The release PR must stay draft/unmerged until did-atp 0.2.0 exists on the
registry, its integrity matches, and fresh registry-backed checks pass. An
ordinary CI install may fail while the dependency is unpublished; cached green
checks would still not substitute for direct registry verification. SDK-02,
publication, and release completion remain open.

## Owner-side publishing configuration to verify

In npm's package settings, inspect Trusted Publisher for
`@atpdeveloper/did-atp`. The workflow requires these exact identifiers:

| Field | Value |
| --- | --- |
| Provider | GitHub Actions |
| Organization/user | `agent-trust-protocol` |
| Repository | `atp-core` |
| Workflow filename | `npm-publish-did-atp.yml` (filename only) |
| Environment | `npm-publish` |
| Operation | Direct `npm publish` must be permitted |

This is a verification checklist, not a claim about the current configuration.
Changing publisher access requires an owner-authorized action. No access token
should be pasted into chat. npm documents these fields and direct-publish
permissions at https://docs.npmjs.com/trusted-publishers/ .

## Completion sequence after that blocker is resolved

1. Retry the failed did-atp publish job, or dispatch the same workflow on main
   with version 0.2.0 and dry_run false. Confirm that version is still unpublished
   before any retry.
2. Query the registry for 0.2.0 and verify the actual integrity above, provenance,
   and new exports in a clean installation. Investigate any digest difference
   before updating the SDK lockfile or proceeding.
3. Rerun registry-backed SDK 6.0.0 install/build/tests/examples and SDK-02 clean
   package checks; move the release PR out of draft only when those pass.
4. Review/merge the SDK release PR and require main checks to pass. Run the SDK
   workflow for 6.0.0 in dry-run mode, then publish using the existing trusted
   publishing workflow.
5. Verify registry-installed SDK 6.0.0 and did-atp 0.2.0, including the protected
   Node subpath, parser compatibility, and the offline examples. Record registry
   integrity/provenance and final workflow URLs before calling the release done.

Broader independent interoperability, lifecycle/recovery, privacy, and method
comparison work in the specialization report is separate from this release.
