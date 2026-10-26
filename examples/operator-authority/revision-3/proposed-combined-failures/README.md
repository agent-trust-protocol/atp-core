# Proposed combined-failure cases for lab #192

ATP-authored, author-produced proposals; not adopted lab vectors. Apache-2.0 under this repository's
license. No private research, credentials, real identities, or production data are included.

Source: [clarification by @aeoess in #192](https://github.com/Agent-Authority-Conformance/aps-conformance-suite/issues/192#issuecomment-6420938886).

Two proposed scenarios use a read-only grant valid over [0,120000) synthetic milliseconds. Each
permits read at T=0. At T=10000 one scenario revokes the grant and the other makes the source
unavailable. Both then request forbidden writes at T=30000,60000,119000.

| Scenario | Expected write reason | Observation instant | Source attempts | Tool calls |
|---|---|---|---|---|
| Revoked + forbidden write | authority_revoked | actual evaluation instant | 1 per call | 0 |
| Unavailable + forbidden write | authority_not_determined | null | 1 per call | 0 |

Only live_standing_read, exclusive endpoint, P1 is proposed here. The local format deliberately
keeps expected records separate from events fed to the evaluator. It is not the lab schema;
publication/admission requires maintainer review and any required schema conversion, generation,
canonicalization and verifier checks. Frozen revision-3 files must remain unchanged. These two
cases do not propose a new class or new precedence; they exercise the clarification already recorded.

Regenerate from the Core repository root:

```sh
node examples/operator-authority/revision-3/proposed-combined-failures/generate.mjs
node --test examples/operator-authority/revision-3/proposed-combined-failures.test.mjs
```

Serialization is deterministic JSON with a terminal newline, not claimed RFC 8785 JCS. Source
attempts are counted at the supplied callback boundary. Status is in-memory simulation, not a
network service. The runner reads no expected record until evaluation has completed. Tests show
that skipping reads with a scope-first evaluator and collapsing unavailable authority into revocation
are detected. These are local falsification controls, not independent or external-lab verification.

Coverage limits: the in-memory source always reports an observation taken at the call instant, so
these cases cannot tell a correct evaluator from one that substitutes the call instant for the
observation, and they do not combine a stale observation with a revocation. The adapter's own unit
tests cover both; a future lab case would need a source that can return an older observation.

Contribution route reviewed: lab CONTRIBUTING.md distinguishes author-produced candidates from
reviewed corpus changes. An existing-family addition should be coordinated on #192 for a future
revision, with generation and required verifier evidence; the existing corpus is immutable.
No lab PR, comment or email has been sent by this work.
