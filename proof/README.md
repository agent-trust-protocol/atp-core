# did:atp — Runnable Reference Proof of Concept

This directory contains the runnable proof referenced by the **did:atp** DID
method specification (`docs/specs/did-atp/index.html`, §Proof of Concept).

`did:atp` is a quantum-safe, hybrid-signature profile extending `did:wba`. A
`did:atp` identifier carries **two** cryptographic bindings:

- a classical **Ed25519** binding (`e1_`), byte-identical to `did:wba`'s, and
- a post-quantum **ML-DSA-65** binding (`pq1_`, FIPS 204 final, security
  category 3), serialized via the finalized JOSE/COSE form for ML-DSA
  (RFC 9964).

The proof demonstrates the design end to end, with **every claim asserted**.
It reuses the **production** ATP SDK (`../packages/sdk`) for the identifier
syntax, DID-Document construction, dual proofs, and resolution, and calls
`@noble/post-quantum`'s `ml_dsa65` and `@noble/ed25519` directly for the
explicit FIPS-204 size checks and the forged-signature defense-in-depth test.
No cryptography is re-implemented here.

## What it proves

1. **Exact FIPS 204 sizes** — ML-DSA-65 public key is exactly **1952 bytes**
   and an ML-DSA-65 signature is exactly **3309 bytes**.
2. **Hybrid identifier, valid `did:wba` classical view** — a hybrid `did:atp`
   identifier whose classical (`e1_`) view, with the `pq1_` segment stripped,
   is a syntactically valid `did:wba` identifier.
3. **Dual-binding resolution** — both the `e1_` and `pq1_` fingerprints are
   recomputed from the DID Document, and both signatures (the
   `eddsa-jcs-2022` Data Integrity proof and the ML-DSA-65 JWS) are verified;
   resolution drives the real resolver via an in-memory HTTPS stub.
4. **Defense in depth** — a forged/tampered DID Document that still carries a
   *valid classical proof* is nonetheless **rejected**, because its
   post-quantum (ML-DSA-65) binding fails. A valid classical proof is never
   sufficient on its own.
5. **Method-agnostic trust credential** — a trust credential is signed by a
   `did:atp` issuer and verified over both a `did:atp` subject and a
   `did:web` subject, and a tampered credential is detected.

## Running it

From the **repository root**:

```bash
npx tsx proof/index.ts
```

This uses the repository's root `node_modules` (which provides
`@noble/ed25519`, `@noble/post-quantum`, `@noble/hashes`, and `@scure/base`)
and imports the SDK directly from `../packages/sdk/src`. On success it prints
each assertion and ends with:

```
ALL CHECKS PASSED (29 assertions).
```

and exits `0`. Any failed assertion prints the failure and exits non-zero.
