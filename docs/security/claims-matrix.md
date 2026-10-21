# Security claim-to-control matrix — SOC2-005 / #168

Review baseline: main at the parent commit of this change, 2026-10-21.
Status describes source inspection, not deployment verification. No independent
reviewer approval or SOC 2 opinion is represented.

| Previous claim | Implementation / check | Finding and supported scope |
| --- | --- | --- |
| All premium routes protected; no authentication bypass | `src/middleware.ts`, `src/lib/api-auth.ts` | Middleware checks cookie presence, including demo token. `checkApiAuth` validates a Better Auth session only where invoked. Universal route coverage and bypass resistance unverified. Inventory and negative route tests required before making this claim. |
| RBAC with organization scoping | `packages/shared/src/security/rbac-system.ts` | Implementation exists; deployment wiring, tenant isolation, and complete negative tests unverified. |
| Secure session handling / timeout | `src/lib/auth.ts`, `src/lib/api-auth.ts` | Session configuration and API validation exist. Effective expiry and revocation across deployed routes unverified. |
| Progressive and endpoint-specific limits | `src/lib/rate-limiter.ts` | Per-process Map with endpoint settings; unknown endpoints pass. Does not prove all endpoints are protected. |
| Distributed Redis / adaptive limits | `packages/shared/src/security/advanced-rate-limiter.ts` | Redis store implementation exists. Website limiter is in memory. Multi-instance and load-adaptive operation not established. |
| Proprietary logic moved to APIs; obfuscation; multi-layer access control | No complete source/build inventory or runtime evidence supplied | Unsupported universal claims removed. Obfuscation is not an authorization control. |
| Comprehensive audit trail and monitoring | `packages/audit-logger`, `packages/shared/src/security/automated-security-audit.ts` | Components exist; automated auditor includes mock dependency data. Coverage, alert delivery, scheduling, retention, and integrity in deployment unverified. |
| Comprehensive penetration testing / all attack classes pass | `packages/shared/src/security/penetration-testing.ts`, `run-security-tests.js`, `test-auth-routes.js` | Scripts and modules are not an independent pentest or execution evidence. Prior green checkmarks and score-based posture assertions removed. Live target testing was not authorized or performed. |
| Four built-in profiles and lifecycle decisions | `packages/atp-profiles/src/{evaluate.ts,profiles}`, `packages/atp-profiles/test/profiles.test.mjs` | Executable package tests check evaluator decisions. Profiles require runtime enforcement and are not an OS sandbox. |
| Adapters enforce before every tool call | `packages/openclaw-atp/src/tools/wrapper.ts`, `src/session/enforce.ts` within that package; `src/__tests__/{wrapper,session-enforce}.test.ts` | Enforcement is conditional on configured metadata. Missing actionType can skip profile checks. Universal MCP/LangChain/runtime coverage not established. |
| Approval workflows require explicit approval | Same wrapper/session sources; `examples/action-boundary/{boundary.mjs,demo.test.mjs}` | Demo blocks pending approval and deny before callbacks; not proof of a deployed human approval system. |
| Cryptography / DID behavior | `packages/did-atp/test/vectors.test.mjs`, SDK `utils/{did-vectors,crypto-v2,verify-compat}.test.ts` | Vector and compatibility checks exist; not external cryptographic certification. |
| Security score proves excellent posture; external reviews occur quarterly | No independent reports or scheduling evidence supplied | Unsupported; removed posture scores and assertions of ongoing organizational controls. |

## Review gates

- [ ] Independent reviewer checks the source references and documentation wording.
- [ ] Route inventory and negative session/tenant-isolation tests substantiate web controls.
- [ ] Deployed monitoring, Redis, key-management and alert evidence captured privately if claimed.
- [ ] Update the SovrLabs central register with the approved PR and reviewer record.

The repository-local register records this work as pending review, not closed.
