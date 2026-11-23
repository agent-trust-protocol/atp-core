/**
 * Adapter boundary for a pre-existing LangChain-style JS tool.
 * PROTOTYPE ONLY: shape-checks a gate result but cannot independently verify\n * signatures, nonces, mandate state, or bind authorization to invocation input.\n * DO NOT USE TO ENFORCE PRODUCTION TOOLS.\n * Does not import LangChain or hold ATP credentials. The caller must inject an
 * authoritative Guardian gate that performs signed runtime authentication and
 * mandate enforcement through ATP Studio. A string "ALLOW" is NOT sufficient.
 */
export function wrapExistingTool({ name, invoke, requiredScope, guard }) {
  if (typeof name !== 'string' || !/^[a-zA-Z][\w.-]{0,127}$/.test(name) ||
      typeof requiredScope !== 'string' || !/^[a-z][a-z0-9:_-]{0,127}$/.test(requiredScope) ||
      typeof invoke !== 'function' || typeof guard !== 'function') {
    throw new TypeError('Tool name, scope, invoke and Guardian gate are required.');
  }

  return async function guardedInvoke(input, context = {}) {
    // Guard must return a typed, authenticated, action-bound authorization
    // supplied by a trusted boundary. Do not accept a model-generated verdict.
    const result = await guard({
      tool: name,
      requiredScope,
      actionKind: 'tool',
      // Do not pass tool input or sensitive payload to authorization endpoints.
      // A production adapter must bind parameters in the signed request as required.
      context
    });
    if (result?.status !== 'verified' ||
        result?.source !== 'guardian' ||
        result?.decision !== 'ALLOW' ||
        result?.action !== name ||
        result?.requiredScope !== requiredScope ||
        result?.actionKind !== 'tool' ||
        result?.authority !== 'enforced' ||
        result?.executionBound !== true) {
      const reason = typeof result?.reasonCode === 'string' && /^[a-z0-9_]{1,80}$/.test(result.reasonCode)
        ? result.reasonCode : 'authorization_unavailable';
      throw new Error('ATP tool execution blocked: ' + reason);
    }
    return invoke(input);
  };
}

