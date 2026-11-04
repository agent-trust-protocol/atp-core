# ATP protocol adapter support and roadmap

Status: source audit, 2026-10-16. This is not a deployment or interoperability certification.
ATP Core is the open developer foundation. ATP Studio is a separate commercial product;
Core code does not establish Studio support.

## Evidence-based inventory

| Target | Core evidence | Current classification | Studio |
| --- | --- | --- | --- |
| Custom adapters | `packages/sdk/src/protocols/base/adapter.ts` | Extension contract; signing/audit reject until implemented; default verification denies | Requires a reviewed server-owned action adapter |
| MCP | SDK adapter and `packages/protocol-integrations/src/mcp` | Experimental; SDK monitor emits synthetic events and inherits fail-closed security defaults | Full protocol support not established |
| A2A | `packages/protocol-integrations/src/a2a` | Source exists; current specification/version interoperability not established | Planned validation |
| IBM/BeeAI ACP | `packages/protocol-integrations/src/acp` | Legacy integration source; ACP incorporated into A2A | No verified coverage claim |
| ANP (Agent Network Protocol) | `packages/protocol-integrations/src/anp-agent/README.md` | Explicit planned adaptation; directory is a planning document, not an executable ANP adapter | Planned after Core wire and enforcement tests |
| AGP | `packages/protocol-integrations/src/agp` | Source labels Agent Gateway Protocol; not proof of Agent Governance Protocol compatibility | Unverified |
| OpenClaw | `packages/openclaw-atp` | Optional legacy example; review individual modules/tests | Separate integration required |
| LangChain, CrewAI, AutoGPT, ADK | Framework integration targets | Frameworks are not wire protocols; no blanket stable support claim | Planned per-runtime validation |
| WebMCP | Browser tool API | Future candidate; separate from MCP transport | Planned evaluation |
| AG-UI, A2UI | Interaction/rendering targets | Future candidates; UI compatibility does not establish authorization enforcement | Coordinate with Vento Core separately |
| AP2, UCP, x402 | Payment/commerce targets | Future candidates requiring transaction-specific authorization | Planned evaluation |
| SAMP | IETF Internet-Draft | Future candidate; not an approved IETF standard | Planned evaluation |
| Agora | Research protocol target | Future evaluation against an exact specification/version | Unverified |
| TAP, FCP, TDF, OAP, RDF-Agent, X42 | Ambiguous names or descriptions | Require authoritative specification and version before scheduling; do not assume X42 means x402 | Unverified |

## ANP adaptation acceptance criteria

1. Pin the upstream ANP specification and supported version with reproducible wire fixtures.
2. Map ANP identity/authentication and DID resolution to ATP verification without assuming
   ANP DIDs use `did:atp` or trusting self-reported identity, scores or capabilities.
3. Define discovery, message/task, delegation and error mappings without losing issuer,
   principal, audience, action, resource, tenant, expiry or revocation context.
4. Enforce verified current authority immediately before every protected side effect.
   Trust evidence alone never grants permission. Deny missing, invalid or unavailable evidence.
5. Test malformed/forged messages, replay, expiry, revocation, cross-tenant and cross-resource
   substitution, unsupported versions, timeouts, and attempted bypass of the execution gate.
6. Run live interoperability against an independent ANP implementation. Record exact versions,
   fixture results and limitations; then add a Studio server-owned integration with its own tests.

## Promotion and custom integration rules

Use planned → experimental → tested → released labels only with linked evidence. Record the
specification version, package version, CI results and deployment separately. Detection,
registration, a directory name or a universal adapter does not establish support.

Custom adapters must preserve existing runtime permissions and sandboxing. Use canonical ATP
identity/policy/mandate services; never treat incoming `trustScore` or `mandateVerified` as proof.
Provide real signing, trusted verification and persistent audit implementations before claiming
those capabilities. The base adapter intentionally rejects signing/audit and returns unverified.
Initialization/readiness only records lifecycle state, not cryptographic readiness.

Studio's bounded self-trust-read mandate proof and TRQP consumer must not be generalized to
all tools or protocols. Add a server-owned execution boundary and bypass tests per action.

## Specification references

- ANP: https://github.com/agent-network-protocol/AgentNetworkProtocol
- A2A (including IBM ACP incorporation): https://a2a-protocol.org/v1.0.0/
- MCP: https://modelcontextprotocol.io/
- WebMCP: https://developer.chrome.com/docs/ai/webmcp
- SAMP draft: https://datatracker.ietf.org/doc/draft-efstathiou-samp-agent-management/
- x402: https://docs.x402.org/introduction

Candidate listing is a roadmap, not a commitment that each name is a validated standard.
