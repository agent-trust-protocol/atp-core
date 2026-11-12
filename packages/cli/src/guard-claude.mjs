// ATP guard for Claude Code's PreToolUse hook.
//
// Safety rule: ATP may only tighten Claude Code, never loosen it. A hook that
// returns permissionDecision "allow" makes Claude Code skip its own permission
// prompt, so an ATP "allow" returns nothing and leaves Claude Code's normal
// permission flow in charge. ATP "require_approval" becomes "ask", ATP "deny"
// becomes "deny", and any error exits 2 (Claude Code blocks the call).
import { existsSync, readFileSync, copyFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BUILTIN_PROFILES, evaluateActionWithProfile } from 'atp-profiles';
import { writeJson } from './home.mjs';

/** Claude Code tool → ATP category (filesystem tools also carry the access mode). */
export const CLAUDE_TOOLS = Object.freeze({
  Bash: { category: 'shell' },
  PowerShell: { category: 'shell' },
  Read: { category: 'filesystem', mode: 'read' },
  Glob: { category: 'filesystem', mode: 'read' },
  Grep: { category: 'filesystem', mode: 'read' },
  Write: { category: 'filesystem', mode: 'write' },
  Edit: { category: 'filesystem', mode: 'write' },
  MultiEdit: { category: 'filesystem', mode: 'write' },
  NotebookEdit: { category: 'filesystem', mode: 'write' },
  WebFetch: { category: 'network' },
  WebSearch: { category: 'network' },
});

/** Tools routed through ATP. MCP tools are included and fall to the profile's unknown-action rule unless mapped. */
export const CLAUDE_MATCHER = `^(${Object.keys(CLAUDE_TOOLS).join('|')}|mcp__.*)$`;
export const HOOK_MARKER = 'guard hook claude-code';

/**
 * Claude Code permission modes in which a hook 'ask' reaches the user as a prompt.
 * In other modes (auto, dontAsk, bypassPermissions, or a mode this version does not
 * know) an 'ask' may be resolved without the user, so ATP fails closed and denies.
 * Observed with Claude Code desktop: auto mode ran hook-'ask' Bash calls with no prompt.
 */
export const PROMPTING_MODES = Object.freeze(new Set(['default', 'plan', 'acceptEdits']));

const MODE_OK = (profile, mode) => !mode || (profile.controls?.filesystem?.modes ?? []).includes(mode);

/**
 * Decide one PreToolUse payload. Returns { decision, reason, category, output, exitCode }.
 * `output` is the JSON to print (or null for "no opinion").
 */
export function decideClaude(payload, settings) {
  const block = (reason) => ({ decision: 'deny', reason, category: null, output: null, exitCode: 2 });
  if (!payload || typeof payload !== 'object' || payload.hook_event_name !== 'PreToolUse' || typeof payload.tool_name !== 'string') {
    return block('ATP: unrecognized hook event');
  }
  const tool = payload.tool_name;
  const override = Object.hasOwn(settings.tools, tool) ? settings.tools[tool] : undefined;
  const mapped = override === undefined ? CLAUDE_TOOLS[tool] : (override === null ? undefined : { category: override });
  const category = mapped?.category ?? tool; // unmapped tools reach the profile as their own name → unknown_action rule
  const profile = BUILTIN_PROFILES[settings.profile];
  let result = evaluateActionWithProfile(profile, { actionType: category, state: settings.state });
  if (result.decision !== 'deny' && mapped?.mode && !MODE_OK(profile, mapped.mode)) {
    result = { allowed: false, decision: 'deny', reason: `filesystem_${mapped.mode}_not_permitted` };
  }
  const mode = payload.permission_mode;
  if (result.decision === 'require_approval' && mode !== undefined && !PROMPTING_MODES.has(mode)) {
    const label = String(mode).replace(/[^A-Za-z]/g, '').slice(0, 32) || 'unknown';
    result = { allowed: false, decision: 'deny', reason: `approval_unavailable_in_${label}_mode` };
  }
  const target = category === tool ? tool : `${tool} → ${category}`;
  const reason = `ATP profile ${settings.profile}: ${target} is ${result.decision.replace('_', ' ')}${result.reason ? ` (${result.reason})` : ''}`;
  if (result.decision === 'allow') return { decision: 'allow', reason, category, output: null, exitCode: 0 };
  const permissionDecision = result.decision === 'require_approval' ? 'ask' : 'deny';
  return {
    decision: result.decision,
    reason,
    category,
    exitCode: 0,
    output: { hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision, permissionDecisionReason: reason } },
  };
}

export function claudeSettingsFile(scope, cwd = process.cwd()) {
  if (scope === 'user') return join(process.env.CLAUDE_CONFIG_DIR || join(homedir(), '.claude'), 'settings.json');
  if (scope === 'project') return join(cwd, '.claude', 'settings.json');
  if (scope === 'local') return join(cwd, '.claude', 'settings.local.json');
  throw new Error('scope must be user, project or local');
}

/** The exact command Claude Code runs: this Node binary and this CLI, by absolute path. */
export function hookCommand() {
  const bin = resolve(fileURLToPath(new URL('../bin/atp.mjs', import.meta.url)));
  return `${JSON.stringify(process.execPath)} ${JSON.stringify(bin)} ${HOOK_MARKER}`;
}

function readSettings(file) {
  if (!existsSync(file)) return {};
  const value = JSON.parse(readFileSync(file, 'utf8'));
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${file} is not a JSON object`);
  return value;
}

function isAtpEntry(entry) {
  return Array.isArray(entry?.hooks) && entry.hooks.some((h) => typeof h?.command === 'string' && h.command.includes(HOOK_MARKER));
}

export function claudeStatus(scope, cwd) {
  const file = claudeSettingsFile(scope, cwd);
  const settings = readSettings(file);
  const entries = (settings.hooks?.PreToolUse ?? []).filter(isAtpEntry);
  return { scope, file, installed: entries.length > 0, commands: entries.flatMap((e) => e.hooks.map((h) => h.command)) };
}

export function installClaude(scope, cwd) {
  const file = claudeSettingsFile(scope, cwd);
  const settings = readSettings(file);
  if (existsSync(file)) copyFileSync(file, `${file}.atp-backup`);
  settings.hooks ??= {};
  if (!Array.isArray(settings.hooks.PreToolUse)) settings.hooks.PreToolUse = [];
  settings.hooks.PreToolUse = settings.hooks.PreToolUse.filter((entry) => !isAtpEntry(entry));
  settings.hooks.PreToolUse.push({ matcher: CLAUDE_MATCHER, hooks: [{ type: 'command', command: hookCommand(), timeout: 10 }] });
  writeJson(file, settings);
  return { file, command: hookCommand(), matcher: CLAUDE_MATCHER };
}

export function uninstallClaude(scope, cwd) {
  const file = claudeSettingsFile(scope, cwd);
  if (!existsSync(file)) return { file, removed: 0 };
  const settings = readSettings(file);
  const before = settings.hooks?.PreToolUse ?? [];
  const kept = before.filter((entry) => !isAtpEntry(entry));
  if (kept.length === before.length) return { file, removed: 0 };
  copyFileSync(file, `${file}.atp-backup`);
  settings.hooks.PreToolUse = kept;
  if (kept.length === 0) delete settings.hooks.PreToolUse;
  if (Object.keys(settings.hooks).length === 0) delete settings.hooks;
  writeJson(file, settings);
  return { file, removed: before.length - kept.length };
}
