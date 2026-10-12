#!/usr/bin/env node
import { readFileSync, realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { BUILTIN_PROFILES, evaluateActionWithProfile } from 'atp-profiles';

// This hook deliberately authorizes one exact, host-selected file and no other
// Hermes operation. It is a small integration example, not a general sandbox.
const allowedFile = realpathSync(new URL('./fixture.txt', import.meta.url));
const toolCategories = Object.freeze({
  read_file: 'filesystem',
  terminal: 'shell',
  write_file: 'filesystem',
  patch: 'filesystem',
});

export function decide(payload) {
  if (!payload || payload.hook_event_name !== 'pre_tool_call' ||
      typeof payload.tool_name !== 'string' ||
      !Object.prototype.hasOwnProperty.call(toolCategories, payload.tool_name)) {
    return { action: 'block', message: 'ATP: unrecognized tool event' };
  }
  const category = toolCategories[payload.tool_name];
  const result = evaluateActionWithProfile(BUILTIN_PROFILES['safe-default'], {
    actionType: category, state: 'executing',
  });
  if (result.allowed !== true || result.decision !== 'allow') {
    return { action: 'block', message: `ATP: ${payload.tool_name} requires a separate approval or is denied` };
  }
  if (payload.tool_name !== 'read_file' ||
      !payload.tool_input || typeof payload.tool_input !== 'object' ||
      typeof payload.tool_input.path !== 'string' ||
      typeof payload.cwd !== 'string') {
    return { action: 'block', message: 'ATP: only the fixed read fixture is permitted' };
  }
  try {
    const requested = resolve(payload.cwd, payload.tool_input.path);
    if (realpathSync(requested) !== allowedFile) throw new Error('outside fixture');
  } catch {
    return { action: 'block', message: 'ATP: read path is outside the fixed fixture' };
  }
  return {}; // Hermes interprets valid empty JSON as no change to this call.
}

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(new URL(import.meta.url))) {
  try {
    const input = readFileSync(0, 'utf8');
    const response = decide(JSON.parse(input));
    process.stdout.write(`${JSON.stringify(response)}\n`);
  } catch {
    process.stdout.write('{"action":"block","message":"ATP: invalid hook input"}\n');
  }
}
