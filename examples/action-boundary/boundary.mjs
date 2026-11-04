import { BUILTIN_PROFILES, evaluateActionWithProfile } from 'atp-profiles';

// The host owns the tool registry and state. Request data cannot supply a callback,
// approval, trusted score, mandate verdict, or the state used by this gate.
export function createBoundary(tools, profile = BUILTIN_PROFILES['safe-default']) {
  let state = 'executing';
  let sequence = 0;
  const history = [];
  return {
    complete() { state = 'completed'; },
    get history() { return history.map(row => ({ ...row })); },
    async invoke(toolName) {
      const tool = Object.prototype.hasOwnProperty.call(tools, toolName) ? tools[toolName] : undefined;
      const supported = tool && typeof tool.run === 'function' &&
        Object.prototype.hasOwnProperty.call(profile.controls, tool.actionType);
      const result = supported
        ? evaluateActionWithProfile(profile, { actionType: tool.actionType, state })
        : { allowed: false, decision: 'deny', reason: 'unknown_tool' };
      const record = { sequence: ++sequence, tool: toolName, state,
        decision: result.decision, reason: result.reason ?? 'profile_allowed', callbackRan: false };
      // Approval required is held closed; this example implements no approval flow.
      if (result.allowed === true && result.decision === 'allow') {
        try { const value = await tool.run(); record.callbackRan = true;
          history.push({ ...record }); return { ...record, value };
        } catch (error) {
          record.callbackRan = true; record.outcome = 'callback_failed';
          history.push({ ...record }); throw error;
        }
      }
      history.push({ ...record }); return record;
    }
  };
}
