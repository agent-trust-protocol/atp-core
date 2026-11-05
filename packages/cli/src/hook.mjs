// Hook entry points invoked by agent runtimes:
//   atp guard hook claude-code   (Claude Code PreToolUse)
//   atp guard hook hermes        (Hermes pre_tool_call)
// They read one JSON event on stdin and must never fail open.
import { readFileSync } from 'node:fs';
import { recordDecision } from './audit.mjs';
import { decideClaude } from './guard-claude.mjs';
import { decideHermes } from './guard-hermes.mjs';
import { loadSettings } from './settings.mjs';

function readStdin() {
  return readFileSync(0, 'utf8');
}

async function audit(record, stderr) {
  try {
    await recordDecision(record);
  } catch (error) {
    stderr.write(`atp: audit write failed: ${error.message}\n`);
  }
}

export async function runClaudeHook({ stdout = process.stdout, stderr = process.stderr, input } = {}) {
  let payload;
  try {
    payload = JSON.parse(input ?? readStdin());
  } catch {
    stderr.write('ATP: invalid hook input; blocking\n');
    return 2;
  }
  let result;
  let settings;
  try {
    settings = loadSettings(typeof payload?.cwd === 'string' ? payload.cwd : process.cwd());
    result = decideClaude(payload, settings);
  } catch (error) {
    stderr.write(`ATP: ${error.message}; blocking\n`);
    return 2;
  }
  await audit({
    source: 'claude-code',
    tool: payload.tool_name ?? null,
    category: result.category,
    decision: result.decision,
    reason: result.reason,
    profile: settings.profile,
    session: typeof payload.session_id === 'string' ? payload.session_id : null,
  }, stderr);
  if (result.exitCode === 2) {
    stderr.write(`${result.reason}\n`);
    return 2;
  }
  if (result.output) stdout.write(`${JSON.stringify(result.output)}\n`);
  return 0;
}

export async function runHermesHook({ stdout = process.stdout, stderr = process.stderr, input } = {}) {
  let payload;
  try {
    payload = JSON.parse(input ?? readStdin());
  } catch {
    stdout.write('{"action":"block","message":"ATP: invalid hook input"}\n');
    return 2;
  }
  let result;
  try {
    result = decideHermes(payload);
  } catch (error) {
    stdout.write(`${JSON.stringify({ action: 'block', message: `ATP: hook configuration error: ${error.message}` })}\n`);
    return 2;
  }
  await audit({
    source: 'hermes',
    tool: typeof payload?.tool_name === 'string' ? payload.tool_name : null,
    decision: result.decision,
    reason: result.directive.message ?? null,
    profile: result.profile,
  }, stderr);
  stdout.write(`${JSON.stringify(result.directive)}\n`);
  return result.exitCode;
}
