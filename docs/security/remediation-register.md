# ATP Core remediation register

SovrLabs SOC 2 Readiness Program, by Sovr Inc. — repository-local evidence index.
This supplements the central cross-product register; it does not claim that an
unlocated external register was updated. Legal entity details remain unverified.

| Issue | Implementation/evidence in this branch | Remaining closure conditions |
| --- | --- | --- |
| SOC2-005 / #168 | Replaced unsupported universal claims in SECURITY.md; claim-to-control matrix in `claims-matrix.md`; package, conformance and boundary checks | Independent reviewer approval; deployed control evidence if claims expand; central register linkage |
| SOC2-003 / #167 | Every workflow action pinned to an upstream-resolved 40-character commit; `action-pins.json`; blocking pin checker; Dependabot continues updates | Reviewer vets action contents/provenance; PR workflow runs; release/deploy workflows require controlled authorized validation, not execution against production |
| #156 | All 15 package folders classified and locked; internal shared links corrected; all-severity audit matrix across all 15; every full/production graph clean; native SQLite and scheduler tests; supported Jest/toolchain upgrades | Independent reviewer approval; root-app/Snyk findings assessed separately; approved package release updates published metadata |
| #160 | Actual Hermes runtime session verified with deterministic local provider; published Node 20/24 pass and explicit negative Node 18 probe; local opt-in diagnostics with consent/disable test; weekly local observation report; action-boundary checks | Independent review of bounded Hermes evidence and diagnostics; hosted production serving revision verification on separately approved release; adoption/failure metrics remain explicitly unobserved |

No issues should auto-close from this branch. No merge, deployment, npm release,
production change, or Studio infrastructure access is part of this work.
