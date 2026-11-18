# Package audit gate

Production dependencies fail on low/moderate/high/critical advisories; the full
dependency tree fails on high/critical advisories. `package-audit.mjs` consumes
npm's version-2 JSON report and follows dependency chains to their source
advisories. npm/network/JSON/graph errors fail the job. No force downgrade or
blanket dependency exclusion is used.

## Temporary withdrawn-advisory exception

On 2026-11-18, GitHub marked GHSA-fc5q-39xc-vjpf withdrawn, while npm continued
returning it for picomatch versions through 4.0.7. There was no patched picomatch
release in the registry during this review. The upstream maintainer disputes
classifying developer-supplied pathological globs as a security vulnerability.
This does not make arbitrary untrusted glob patterns safe.

Sources:
- https://github.com/advisories/GHSA-fc5q-39xc-vjpf
- https://github.com/micromatch/picomatch/pull/235

The exception matches only npm advisory source 1247710, the exact GHSA URL, and
picomatch's package/name. Other findings in the same package and dependency tree
still fail at the original thresholds. Each use is printed in the job log. It
expires at **2026-11-25 00:00 UTC**, at which point the finding blocks again if npm
still returns it. Remove the exception once npm's feed drops the withdrawn entry;
do not extend it without rechecking authoritative status and actual use of
untrusted patterns. Tests cover the exact match, expiry, mixed findings, severity
thresholds, malformed reports and unresolved dependency graphs.

The real libp2p decoder advisory GHSA-rvfr-cqwq-rc4j is not excepted. The audit
logger moves to a coherent Helia HTTP/JSON/strings stack rather than
forcing crypto v5 underneath dependencies expecting crypto v4. A local offline
JSON/string round trip and the standard audit gates must pass before merging.

The upgraded private audit-logger service requires Node 22 or newer. Its package
engine, service Docker files and audit compatibility-test runtime are aligned
with that requirement. Other packages keep their existing runtime requirements.
Helia HTTP 3.1.4, JSON 5.1.1 and strings 5.1.1 preserve createHeliaHTTP and the
local JSON/string APIs while resolving the fixed crypto dependency. No queue
version is forced below its consumer's range.
