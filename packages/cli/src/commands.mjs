// Command registry shared by subcommands (`atp profile check Bash`), one-shot
// mode (`atp -p "/profile check Bash"`) and the interactive shell. Every command
// returns { ok, text, data } so `--json` can print `data` unchanged.
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { BUILTIN_PROFILES, evaluateActionWithProfile } from 'atp-profiles';
import { createIdentity, describeIdentity } from './identity.mjs';
import { readEntries, verifyAudit } from './audit.mjs';
import { loadSettings, setUserProfile } from './settings.mjs';
import { CLAUDE_TOOLS, claudeStatus, installClaude, uninstallClaude } from './guard-claude.mjs';
import { hermesStatus, installHermes } from './guard-hermes.mjs';
import { c, decisionBadge, kv } from './ui.mjs';

export const VERSION = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).version;

export const COMMANDS = [
  ['help', 'Show commands'],
  ['status', 'Profile, identity, guards and audit at a glance'],
  ['init [name]', 'Create a starter agent project (runs create-atp-agent)'],
  ['identity create [--name n] [--domain d] [--force]', 'Create a local did:atp identity (hybrid Ed25519 + ML-DSA-65)'],
  ['identity show', 'Show the local identity (public keys only)'],
  ['profile list', 'List built-in ATP profiles'],
  ['profile show <id>', 'Show a profile\'s controls and state policies'],
  ['profile check <tool|category> [--state s] [--profile p]', 'What the active profile decides for an action'],
  ['guard install claude-code [--scope user|project|local]', 'Run ATP before Claude Code tool calls (PreToolUse hook)'],
  ['guard install hermes [--read dir] [--write dir] [--escalate]', 'Configure ATP for Hermes Agent and print the hook to add'],
  ['guard uninstall claude-code [--scope ...]', 'Remove the ATP hook from Claude Code settings'],
  ['guard status', 'Show where ATP guards are installed'],
  ['audit [--limit n]', 'Show recent guard decisions'],
  ['audit verify', 'Verify the audit chain and signatures'],
  ['version', 'Show the CLI version'],
];

const ok = (text, data) => ({ ok: true, text, data });
const fail = (text, data = { error: text }) => ({ ok: false, text: c.red(text), data });

export function parseArgs(tokens) {
  const positional = [];
  const flags = {};
  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];
    if (!token.startsWith('--')) { positional.push(token); continue; }
    const [name, inline] = token.slice(2).split(/=(.*)/s, 2);
    const takesValue = ['name', 'domain', 'state', 'profile', 'scope', 'read', 'write', 'limit'].includes(name);
    const value = takesValue ? (inline ?? tokens[(i += 1)]) : true;
    if (takesValue && (value === undefined || value === '')) throw new Error(`--${name} needs a value`);
    if (name === 'read' || name === 'write') (flags[name] ??= []).push(value);
    else flags[name] = value;
  }
  return { positional, flags };
}

function helpText() {
  const width = Math.max(...COMMANDS.map(([u]) => u.length));
  return [
    `${c.bold('atp')} ${c.dim(`v${VERSION}`)} · Agent Trust Protocol in your terminal`,
    '',
    ...COMMANDS.map(([usage, description]) => `  ${c.cyan(usage.padEnd(width))}  ${description}`),
    '',
    c.dim('In the interactive shell, prefix commands with /, e.g. /profile check Bash. Add --json for machine output.'),
  ].join('\n');
}

function statusData(cwd) {
  const settings = loadSettings(cwd);
  const identity = describeIdentity();
  const claude = ['user', 'project', 'local'].map((scope) => {
    try { return claudeStatus(scope, cwd); } catch (error) { return { scope, installed: false, error: error.message }; }
  });
  const hermes = hermesStatus();
  const entries = readEntries();
  const last = entries[entries.length - 1];
  return { settings, identity, guards: { claudeCode: claude, hermes: { configured: hermes.configured, file: hermes.file } }, audit: { entries: entries.length, last: last ?? null } };
}

function status(cwd) {
  const data = statusData(cwd);
  const guards = [
    ...data.guards.claudeCode.filter((g) => g.installed).map((g) => `claude-code (${g.scope})`),
    ...(data.guards.hermes.configured ? ['hermes'] : []),
  ];
  const text = kv([
    ['profile', `${c.bold(data.settings.profile)} · state ${data.settings.state}`],
    ['settings', data.settings.sources.length ? data.settings.sources.join(', ') : c.dim('defaults (no settings files)')],
    ['identity', data.identity ? data.identity.did : c.dim('none · run identity create')],
    ['guards', guards.length ? guards.join(', ') : c.dim('none · run guard install claude-code')],
    ['audit', data.audit.entries ? `${data.audit.entries} decisions · last ${data.audit.last.decision} ${data.audit.last.tool ?? ''} at ${data.audit.last.ts}` : c.dim('no decisions yet')],
  ]);
  return ok(text, data);
}

function profileCheck(target, flags, cwd) {
  if (!target) return fail('usage: profile check <tool|category> [--state s] [--profile p]');
  const settings = loadSettings(cwd);
  const profileId = flags.profile ?? settings.profile;
  if (!Object.hasOwn(BUILTIN_PROFILES, profileId)) return fail(`unknown profile ${profileId}`);
  const state = flags.state ?? settings.state;
  const mapped = Object.hasOwn(settings.tools, target) ? (settings.tools[target] === null ? undefined : { category: settings.tools[target] }) : CLAUDE_TOOLS[target];
  const category = mapped?.category ?? target;
  const profile = BUILTIN_PROFILES[profileId];
  let result = evaluateActionWithProfile(profile, { actionType: category, state });
  if (result.decision !== 'deny' && mapped?.mode && !(profile.controls?.filesystem?.modes ?? []).includes(mapped.mode)) {
    result = { allowed: false, decision: 'deny', reason: `filesystem_${mapped.mode}_not_permitted` };
  }
  const data = { target, category, profile: profileId, state, ...result };
  const text = `${decisionBadge(result.decision)}  ${c.bold(target)}${category !== target ? c.dim(` → ${category}`) : ''} under ${profileId} (${state})${result.reason ? c.dim(` · ${result.reason}`) : ''}`;
  return ok(text, data);
}

async function guard(positional, flags, cwd) {
  const [action, target] = positional;
  if (action === 'status') {
    const claude = ['user', 'project', 'local'].map((scope) => claudeStatus(scope, cwd));
    const hermes = hermesStatus();
    const text = [
      ...claude.map((g) => `${g.installed ? c.green('●') : c.dim('○')} claude-code ${g.scope.padEnd(7)} ${c.dim(g.file)}`),
      `${hermes.configured ? c.green('●') : c.dim('○')} hermes             ${c.dim(hermes.file)}`,
    ].join('\n');
    return ok(text, { claudeCode: claude, hermes });
  }
  if (action === 'install' && target === 'claude-code') {
    const scope = flags.scope ?? 'user';
    if (flags.profile !== undefined) setUserProfile(flags.profile);
    const result = installClaude(scope, cwd);
    const settings = loadSettings(cwd);
    const preview = ['Bash', 'Read', 'Write', 'Edit', 'WebFetch', 'mcp__server__tool']
      .map((tool) => profileCheck(tool, {}, cwd).data)
      .map((d) => `    ${decisionBadge(d.decision).padEnd(16)} ${d.target}`);
    return ok([
      `${c.green('✓')} ATP now runs before Claude Code tool calls (${scope} settings)`,
      kv([['settings', result.file], ['matches', result.matcher], ['profile', `${settings.profile} · change with: atp guard install claude-code --profile <id>`]]),
      `  With ${settings.profile}, Claude Code will see:`,
      ...preview,
      c.dim('  For everyday coding, dev-mode asks only about unrecognised tools such as MCP; safe-default blocks file writes.'),
      c.dim('ATP only tightens Claude Code: allow defers to its normal permissions, require_approval asks you, deny blocks.'),
      c.dim('Restart Claude Code (or open /hooks) to load the change. A backup was kept as settings.json.atp-backup.'),
    ].join('\n'), result);
  }
  if (action === 'uninstall' && target === 'claude-code') {
    const result = uninstallClaude(flags.scope ?? 'user', cwd);
    return ok(result.removed ? `${c.green('✓')} removed ATP from ${result.file}` : `ATP was not installed in ${result.file}`, result);
  }
  if (action === 'install' && target === 'hermes') {
    const settings = loadSettings(cwd);
    const result = installHermes({ profile: settings.profile, read: flags.read ?? [], write: flags.write ?? [], onApproval: flags.escalate ? 'escalate' : 'block' });
    return ok([
      `${c.green('✓')} wrote ${result.file}`,
      'Add this to your Hermes profile config.yaml, then approve the hook when Hermes asks:',
      '',
      result.snippet,
    ].join('\n'), result);
  }
  return fail('usage: guard install claude-code|hermes · guard uninstall claude-code · guard status');
}

async function audit(positional, flags) {
  if (positional[0] === 'verify') {
    const result = await verifyAudit();
    const text = result.ok
      ? `${c.green('✓')} ${result.entries} entries · chain intact · ${result.signed} signed, ${result.unsigned} unsigned`
      : [`${c.red('✗')} audit verification failed`, ...result.problems.map((p) => `  ${p}`)].join('\n');
    return { ok: result.ok, text, data: result };
  }
  const limit = Number(flags.limit ?? 20);
  const entries = readEntries().slice(-Math.max(1, limit));
  if (!entries.length) return ok(c.dim('No decisions recorded yet.'), { entries: [] });
  const text = entries.map((e) => `${c.dim(e.ts ?? '?')}  ${decisionBadge(e.decision)}  ${(e.source ?? '').padEnd(11)} ${e.tool ?? ''}${e.sig ? '' : c.dim('  (unsigned)')}`).join('\n');
  return ok(text, { entries });
}

export async function runCommand(tokens, { cwd = process.cwd() } = {}) {
  const [command, ...rest] = tokens;
  let parsed;
  try {
    parsed = parseArgs(rest);
  } catch (error) {
    return fail(error.message);
  }
  const { positional, flags } = parsed;
  try {
    switch (command) {
      case undefined:
      case 'help':
        return ok(helpText(), { commands: COMMANDS.map(([usage, description]) => ({ usage, description })) });
      case 'version':
        return ok(VERSION, { version: VERSION });
      case 'status':
        return status(cwd);
      case 'identity':
        if (positional[0] === 'create') {
          const identity = await createIdentity({ name: flags.name ?? 'agent', domain: flags.domain ?? 'localhost', force: Boolean(flags.force) });
          return ok([`${c.green('✓')} created ${c.bold(identity.did)}`, kv([['stored', `${identity.file} (${identity.fileMode})`], ['note', 'Secret keys stay in that file; back it up privately. Audit entries are now signed.']])].join('\n'), identity);
        }
        if (positional[0] === 'show' || positional.length === 0) {
          const identity = describeIdentity();
          if (!identity) return ok(c.dim('No identity yet. Run: identity create'), { identity: null });
          return ok(kv([['did', c.bold(identity.did)], ['created', identity.created], ['e1', identity.e1Fingerprint], ['pq1', identity.pq1Fingerprint], ['stored', `${identity.file} (${identity.fileMode}${identity.ownerOnly ? '' : c.red(' · readable by others!')})`]]), identity);
        }
        return fail('usage: identity create | identity show');
      case 'profile':
        if (positional[0] === 'list' || positional.length === 0) {
          const active = loadSettings(cwd).profile;
          const rows = Object.values(BUILTIN_PROFILES).map((p) => `${p.id === active ? c.green('●') : ' '} ${c.bold(p.id.padEnd(18))} ${p.description}`);
          return ok(rows.join('\n'), { active, profiles: Object.keys(BUILTIN_PROFILES) });
        }
        if (positional[0] === 'show') {
          const profile = BUILTIN_PROFILES[positional[1]];
          if (!profile) return fail(`unknown profile ${positional[1] ?? ''}`.trim());
          return ok(JSON.stringify(profile, null, 2), profile);
        }
        if (positional[0] === 'check') return profileCheck(positional[1], flags, cwd);
        return fail('usage: profile list | profile show <id> | profile check <tool|category>');
      case 'guard':
        return await guard(positional, flags, cwd);
      case 'audit':
        return await audit(positional, flags);
      case 'init': {
        const name = positional[0] ?? 'my-agent';
        const result = spawnSync('npm', ['create', 'atp-agent@latest', name], { stdio: 'inherit', cwd });
        return result.status === 0 ? ok(`${c.green('✓')} created ${name}`, { name }) : fail(`create-atp-agent exited with ${result.status}`);
      }
      default:
        return fail(`unknown command: ${command}. Try help.`);
    }
  } catch (error) {
    return fail(error.message);
  }
}
