/** Experimental legacy-action bridge. Mandate dispatch is a separate release gate. */
import { createMiddleware } from 'langchain';
import { withMcpGuard } from '@atp/sdk';

/** Attach to an existing LangChain createAgent middleware array; never rewrite its tools. */
export function studioToolBoundary({ client, agentDid, scopes }) {
  const allowed = new Map(Object.entries(scopes));
  if (!agentDid || !allowed.size || [...allowed.values()].some(s => !['read', 'write', 'invoke', 'export'].includes(s))) {
    throw new TypeError('An agent DID and explicit tool scopes are required.');
  }
  return createMiddleware({
    name: 'ATPStudioToolBoundary',
    wrapToolCall: async (request, handler) => {
      const toolName = request.toolCall.name;
      const requiredScope = allowed.get(toolName);
      if (!requiredScope) throw new Error('ATP: tool has no operator-configured scope.');
      return withMcpGuard(client, { agentDid, toolName, requiredScope }, handler)(request);
    },
  });
}
