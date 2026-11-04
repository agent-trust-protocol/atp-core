# Agent Trust Protocol: Architecture and Implementation Evidence
## Technical whitepaper — Developer Edition, November 2026

**Publisher:** SovrLabs Research & Insights  
**Status:** Public technical overview of ATP Core; not a W3C Community Group report or a certification claim.  
**Scope:** Evidence-based developer-facing capabilities current at publication. This paper is not a replacement for any existing ATP specification or the historical whitepaper.

## Executive summary

Autonomous agents increasingly invoke tools that read files, call services, edit code, and change state. Before a tool executes, an application needs a dependable answer: **may this action run in this context?** Identity alone cannot answer that question. A cryptographic identifier can establish a principal, but the authority to operate on a particular resource must still be evaluated and enforced.

Agent Trust Protocol (ATP) is an open effort to make agent identity, trust evidence, and policy decisions interoperable across frameworks and organizational boundaries. The current ATP Core release offers concrete developer tools for local identity and action-policy evaluation, including reproducible action-boundary examples and an integration example for Hermes Agent.

The longer-term design explores portable delegated mandates, credential status, privacy, and cross-system interoperability. Those designs must not be confused with features demonstrated by the present tool-boundary examples.

## 1. The problem: identity is not authorization

Consider a coding agent with a valid identity and permission to read a source file. An unanticipated terminal invocation is a different action. If a host executes the command without consulting policy at the tool boundary, the agent's identity provides no containment.

A more complete decision requires:

- **Identity:** which principal or agent is requesting an action, and what can be verified about it?
- **Authority:** which principal granted permission for this operation and on which resource?
- **Constraints:** which action categories, paths, domains, session states, and human-approval requirements apply?
- **Enforcement:** is the decision checked before the host invokes the tool?
- **Evidence:** what was requested, decided, attempted, and actually executed?

An authorization check is not effective if a tool can bypass the check. A returned `require_approval` value is not an executable permission.

## 2. ATP's technical layers

| Layer | Purpose | Current evidence |
| --- | --- | --- |
| Identity | Portable `did:atp` primitives and associated cryptographic material | `packages/did-atp/`, SDK examples and draft DID method |
| Trust evidence | Credentials, status, issuer authority, scoring and verification | SDK utilities and evolving Community Group drafts; capability-specific maturity |
| Action policy | Evaluate action category, optional state, trust/authority predicates and controls | Published `atp-profiles` evaluator; local executable tests |
| Enforcement adapter | Map runtime tool names into policy categories and block before dispatch | Action-boundary demo; Hermes pre-tool hook walkthrough |
| Mandates and revocation | Express bounded, revocable, potentially delegated authority | Design and separate implementation/testing work; **not demonstrated** by the local demo |
| Outcomes and audit | Distinguish authorization decisions from actual completed operations | Local example evidence; no general cross-organization signed-outcome guarantee |

The key separation is between a **policy decision** and **the resource that performs the action**.

## 3. Working local enforcement path

```text
Agent or scripted host
         |
         v
Tool request (name, category, target, session state)
         |
         v
Runtime adapter maps tool -> ATP action category
         |
         v
ATP profile evaluator
  +------|--------------------------+
  |      |                          |
ALLOW   REQUIRE_APPROVAL           DENY
  |      |                          |
  v      v                          v
Host invokes     Host pauses       Host never invokes
the permitted    for separate      the forbidden
callback         approval path     callback
```

`atp-profiles` returns `allow`, `require_approval`, or `deny`. Missing and unrecognized actions fail closed under the conservative profiles. The host must uphold these decisions; evaluating a policy without stopping execution is insufficient.

The existing local action-boundary demo permits a fixed read, keeps an approval-requiring shell callback blocked, and denies a further read after the local session is completed. **Session completion is not cryptographic revocation of a signed mandate.**

The Hermes example uses a `pre_tool_call` hook to restrict a narrowly specified read and block disallowed terminal and write operations. The repository distinguishes the hook subprocess walkthrough, a scripted-provider runtime verifier, and testing in a user's own Hermes profile. Those are different assurance levels.

## 4. Developer quick start

Use Node.js 20 or 24 and npm:

```bash
git clone https://github.com/agent-trust-protocol/atp-core.git
cd atp-core/examples/action-boundary
npm ci --ignore-scripts
npm start
```

Then inspect [the walkthrough](../../examples/action-boundary/README.md) and [Hermes instructions](../../examples/hermes-hook/README.md). This is a local demonstration; no account, hosted ATP service, or model API key is needed.

To add an evaluator to an existing JavaScript application:

```bash
npm install atp-profiles
```

```js
import { BUILTIN_PROFILES, evaluateActionWithProfile } from 'atp-profiles';

const result = evaluateActionWithProfile(BUILTIN_PROFILES['safe-default'], {
  actionType: 'shell',
  state: 'executing'
});

if (result.decision !== 'allow') {
  // Block dispatch; an approval requirement is NOT permission.
  throw new Error(result.reason ?? result.decision);
}
// Invoke only the explicitly permitted tool here.
```

This is an illustrative host-side gate, not a complete production integration. Tool-name normalization, resource-specific restrictions, logging, approval handling, and bypass prevention remain the application's responsibility.

## 5. Where ATP fits among agent protocols

MCP, A2A, ANP, and agent frameworks address various aspects of communicating, discovering capabilities, or invoking tools. ATP is intended to complement those layers with portable identity, evidence, and authorization semantics. Compatibility with a communication protocol must be established by specific adapters and interoperability tests; it cannot be inferred from architectural intent alone.

The relevant W3C Community Group materials are evolving drafts, not approved W3C Standards. Participating in community specification work does not imply W3C endorsement of a SovrLabs product.

## 6. Security boundaries and limitations

A responsible deployment must address:

1. **Complete mediation:** every consequential tool path must traverse the enforcing adapter, including retries and alternate APIs.
2. **Unknown-action handling:** block or explicitly pause tools that cannot be mapped to an approved category.
3. **Resource scoping:** action categories alone do not prove that an arbitrary file path or domain is safe.
4. **Human approval:** `require_approval` demands an external, authenticated approval workflow before execution.
5. **Revocation and races:** a local session-state denial is not a portable signed mandate, remote status lookup, or race-free transaction protocol.
6. **Outcome integrity:** a policy decision is not a signed statement from the protected resource that an operation committed.
7. **Privacy:** avoid placing secrets, prompts, or private customer content in public reports or demo artifacts.

Tests demonstrate only the cases they actually exercise. ATP Core's open-source examples are not a certification, SOC 2 attestation, or guarantee of complete agent containment.

## 7. Evidence and maturity matrix

| Statement | Classification | Supporting artifact |
| --- | --- | --- |
| `atp-profiles` evaluates action categories and states | Implemented/documented | [Profile package](../../packages/atp-profiles/README.md) |
| Local demo demonstrates allowed, blocked, and post-session decisions | Documented executable example | [Action-boundary demo](../../examples/action-boundary/README.md) |
| Hermes hook example enforces a fixed set of before-dispatch decisions | Documented integration with bounded runtime evidence | [Hermes hook](../../examples/hermes-hook/README.md) |
| `did:atp` identity primitives are available | Implemented in dedicated package, see version-specific limits | [DID package](../../packages/did-atp/README.md) |
| Multi-agent portable mandate revocation operates end-to-end in this example | **Not established** | Requires separate integration and evidence |
| All ATP draft claims are fully interoperable or production certified | **Not established** | Draft review and independent testing required |

## 8. How to participate

The next public milestone is a small developer pilot: five independent developers try to protect one agent tool and report the outcome. Maintainer tests and npm downloads do not count as independent pilot participants.

- [Try the five-minute demo](../../examples/action-boundary/README.md)
- [Protect a tool in Hermes](../../examples/hermes-hook/README.md)
- [Join the developer pilot](../launch/developer-pilot.md)
- [Open-source repository](https://github.com/agent-trust-protocol/atp-core)
- [Read the W3C Community Group drafts](https://w3c-cg.github.io/atp/specs/)

**Editorial note:** SovrLabs publishes this overview independently. W3C Community Group drafts are not W3C Standards and are not endorsed by W3C. ATP Studio is a separate commercial product, whose capabilities require deployment-specific verification.
