# Existing LangChain agent / Studio bridge

Experimental legacy-action bridge, not a completed live authorization proof.
It imports the real Studio SDK and attaches middleware to an existing LangChain
`createAgent` configuration without replacing its tools. Install and build Studio
separately. No Studio implementation, database or credentials belong in Core.

Boundary test reproduction (Node 22+, isolated test checkouts):

```sh
cd packages/atp-cli/proof
npm ci --ignore-scripts
ATP_STUDIO_SOURCE=/absolute/path/to/atp-studio npm test
ATP_STUDIO_SOURCE=/absolute/path/to/atp-studio npm run test:sdk
node preflight.mjs
```

Install Studio's locked dependencies in its own checkout first. The config aliases
only actual Studio source exports; it does not substitute an enforcement client.
The boundary test deliberately simulates Guardian responses and uses LangChain's
deterministic test model. It is excluded from the dependency-free preview tests.

```js
import { AgentActionClient } from '@atp/sdk/runtime';
import { studioToolBoundary } from './langchain-studio-boundary.mjs';
// signer is the existing paired runtime Signer, never an operator credential.
const client = new AgentActionClient({ baseUrl, tenantId, agentDid, signer });
const middleware = studioToolBoundary({ client, agentDid,
  scopes: { inventory_read: 'read', inventory_write: 'write' } });
// Add middleware to the existing createAgent({ model, tools, middleware: [...] }).
```

Use local Ollama only for live model execution. A deterministic LangChain test
model can verify the integration boundary, but does not satisfy the live proof.
Keep LANGSMITH_TRACING disabled and do not configure hosted model providers.
Pair via `pairRuntime` and approve narrow scopes in isolated Studio Review first.

## Known mandate blocker

`withMcpGuard` / `AgentActionClient` use `/v1/agent-authorize`; they do not pass
mandate ID, version, digest, audience or payload digest. With legacy tool mandate
enforcement enabled, those calls receive `mandate_required`. Do not disable that
gate to claim mandate success. Studio's separate `/v1/mandate-agent-action` route
currently dispatches its bounded server-owned trust read. An existing external
LangChain tool requires a reviewed mandate dispatch adapter and argument binding.
An ALLOW on the legacy route is not a mandate dispatch receipt.

Do not attach this experimental bridge to external mutation tools for release.
The live HTTP/PostgreSQL proof, pairing, status transitions, tenant/audience tests,
tool argument tamper tests and zero-side-effect assertions remain mandatory.
