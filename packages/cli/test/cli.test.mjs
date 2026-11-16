import assert from 'node:assert/strict';
import { spawn, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const BIN = fileURLToPath(new URL('../bin/atp.mjs', import.meta.url));

function sandbox() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'atp-cli-')));
  const env = { ...process.env, ATP_HOME: join(root, 'atp'), CLAUDE_CONFIG_DIR: join(root, 'claude'), NO_COLOR: '1' };
  delete env.FORCE_COLOR;
  const proj = join(root, 'proj');
  mkdirSync(proj);
  const run = (args, input) => spawnSync(process.execPath, [BIN, ...args], { cwd: proj, env, input, encoding: 'utf8' });
  const json = (args) => JSON.parse(run([...args, '--json']).stdout);
  const hook = (target, payload) => run(['guard', 'hook', target], typeof payload === 'string' ? payload : JSON.stringify(payload));
  return { root, env, proj, run, json, hook, cleanup: () => rmSync(root, { recursive: true, force: true }) };
}

const pre = (tool_name, tool_input = {}, extra = {}) => ({ hook_event_name: 'PreToolUse', tool_name, tool_input, session_id: 's', ...extra });

test('help, version and one-shot modes', () => {
  const s = sandbox();
  try {
    const { version } = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
    assert.equal(s.run(['--version']).stdout.trim(), version);
    assert.match(s.run(['help']).stdout, /guard install claude-code/);
    const viaP = s.run(['-p', '/profile check Bash', '--json']);
    assert.equal(viaP.status, 0);
    assert.equal(JSON.parse(viaP.stdout).decision, 'require_approval');
    assert.equal(s.run(['nonsense']).status, 1);
    assert.equal(s.run(['-p']).status, 2);
  } finally { s.cleanup(); }
});

test('profile check maps Claude Code tools to ATP categories and respects filesystem modes', () => {
  const s = sandbox();
  try {
    const decide = (t, extra = []) => s.json(['profile', 'check', t, ...extra]);
    assert.equal(decide('Read').decision, 'allow');
    assert.equal(decide('Bash').decision, 'require_approval');
    assert.equal(decide('Write').decision, 'deny');
    assert.equal(decide('Write').reason, 'filesystem_write_not_permitted');
    assert.equal(decide('mcp__x__y').decision, 'deny');
    assert.equal(decide('Write', ['--profile', 'dev-mode']).decision, 'allow');
    assert.equal(decide('mcp__x__y', ['--profile', 'dev-mode']).decision, 'require_approval');
    assert.equal(decide('Read', ['--state', 'planning']).decision, 'deny');
  } finally { s.cleanup(); }
});

test('Claude Code hook never returns allow and fails closed', () => {
  const s = sandbox();
  try {
    const read = s.hook('claude-code', pre('Read', { file_path: '/tmp/x' }));
    assert.equal(read.status, 0);
    assert.equal(read.stdout, '', 'ATP allow must defer to Claude Code permissions, not output allow');

    const bash = s.hook('claude-code', pre('Bash', { command: 'ls' }));
    assert.equal(bash.status, 0);
    assert.equal(JSON.parse(bash.stdout).hookSpecificOutput.permissionDecision, 'ask');

    const write = s.hook('claude-code', pre('Write', { file_path: '/tmp/x', content: 'y' }));
    assert.equal(JSON.parse(write.stdout).hookSpecificOutput.permissionDecision, 'deny');

    for (const bad of ['not json', '{}', JSON.stringify({ hook_event_name: 'PostToolUse', tool_name: 'Bash' })]) {
      const result = s.hook('claude-code', bad);
      assert.equal(result.status, 2, bad);
      assert.match(result.stderr, /ATP/);
    }
    for (const decision of ['allow']) {
      for (const tool of ['Read', 'Glob', 'Grep', 'WebFetch', 'WebSearch']) {
        assert.doesNotMatch(s.hook('claude-code', pre(tool)).stdout, new RegExp(`"${decision}"`));
      }
    }
  } finally { s.cleanup(); }
});

test('approval requests fail closed in permission modes that may not prompt', () => {
  const s = sandbox();
  const out = (tool, input, mode) => s.hook('claude-code', pre(tool, input, mode === undefined ? {} : { permission_mode: mode }));
  try {
    for (const mode of [undefined, 'default', 'plan', 'acceptEdits']) {
      assert.equal(JSON.parse(out('Bash', { command: 'ls' }, mode).stdout).hookSpecificOutput.permissionDecision, 'ask', String(mode));
    }
    for (const mode of ['auto', 'dontAsk', 'bypassPermissions', 'some-future-mode']) {
      const result = out('Bash', { command: 'ls' }, mode);
      assert.equal(result.status, 0, mode);
      const hso = JSON.parse(result.stdout).hookSpecificOutput;
      assert.equal(hso.permissionDecision, 'deny', mode);
      assert.match(hso.permissionDecisionReason, /approval_unavailable_in_/);
    }
    // Allowed and denied decisions are unaffected by the mode.
    assert.equal(out('Read', { file_path: '/tmp/x' }, 'auto').stdout, '');
    assert.equal(JSON.parse(out('Write', { file_path: '/tmp/x', content: 'y' }, 'auto').stdout).hookSpecificOutput.permissionDecision, 'deny');
    // The signed audit records the fail-closed denial.
    const audit = readFileSync(join(s.env.ATP_HOME, 'audit.jsonl'), 'utf8');
    assert.match(audit, /"decision":"deny"[^\n]*approval_unavailable_in_auto_mode/);
  } finally { s.cleanup(); }
});

test('broken settings block every guarded call', () => {
  const s = sandbox();
  try {
    mkdirSync(join(s.proj, '.atp'));
    writeFileSync(join(s.proj, '.atp', 'settings.json'), '{"profile":"typo"}');
    const result = s.hook('claude-code', pre('Read', {}, { cwd: s.proj }));
    assert.equal(result.status, 2);
    assert.match(result.stderr, /unknown profile/);
  } finally { s.cleanup(); }
});

test('project settings override the user profile and tool map', () => {
  const s = sandbox();
  try {
    mkdirSync(join(s.proj, '.atp'));
    writeFileSync(join(s.proj, '.atp', 'settings.json'), JSON.stringify({ profile: 'dev-mode', tools: { mcp__db__query: 'network' } }));
    assert.equal(s.json(['profile', 'check', 'Write']).decision, 'allow');
    assert.equal(s.json(['profile', 'check', 'mcp__db__query']).category, 'network');
    const hook = s.hook('claude-code', pre('Write', {}, { cwd: s.proj }));
    assert.equal(hook.stdout, '');
  } finally { s.cleanup(); }
});

test('install and uninstall keep other hooks and settings intact', () => {
  const s = sandbox();
  try {
    const file = join(s.env.CLAUDE_CONFIG_DIR, 'settings.json');
    mkdirSync(s.env.CLAUDE_CONFIG_DIR, { recursive: true });
    const other = { matcher: 'Bash', hooks: [{ type: 'command', command: 'my-own-hook.sh' }] };
    writeFileSync(file, JSON.stringify({ model: 'opus', hooks: { PreToolUse: [other] } }));

    assert.equal(s.run(['guard', 'install', 'claude-code']).status, 0);
    assert.equal(s.run(['guard', 'install', 'claude-code']).status, 0, 'idempotent');
    let settings = JSON.parse(readFileSync(file, 'utf8'));
    assert.equal(settings.model, 'opus');
    assert.equal(settings.hooks.PreToolUse.length, 2);
    assert.deepEqual(settings.hooks.PreToolUse[0], other);
    assert.match(settings.hooks.PreToolUse[1].hooks[0].command, /guard hook claude-code$/);
    assert.equal(s.json(['guard', 'status']).claudeCode.find((g) => g.scope === 'user').installed, true);

    assert.equal(s.run(['guard', 'uninstall', 'claude-code']).status, 0);
    settings = JSON.parse(readFileSync(file, 'utf8'));
    assert.deepEqual(settings, { model: 'opus', hooks: { PreToolUse: [other] } });

    assert.equal(s.run(['guard', 'install', 'claude-code', '--scope', 'project', '--profile', 'dev-mode']).status, 0);
    assert.ok(JSON.parse(readFileSync(join(s.proj, '.claude', 'settings.json'), 'utf8')).hooks.PreToolUse.length === 1);
    assert.equal(s.json(['status']).settings.profile, 'dev-mode');
    assert.equal(s.run(['guard', 'install', 'claude-code', '--profile', 'nope']).status, 1);
  } finally { s.cleanup(); }
});

test('identity is created owner-only and never prints secret keys', () => {
  const s = sandbox();
  try {
    const created = s.json(['identity', 'create', '--name', 'ci/agent']);
    assert.match(created.did, /^did:atp:localhost:ci:agent:e1_[A-Za-z0-9_-]+:pq1_[A-Za-z0-9_-]+$/);
    assert.equal(statSync(created.file).mode & 0o777, 0o600);
    assert.equal(statSync(s.env.ATP_HOME).mode & 0o777, 0o700);
    const secret = JSON.parse(readFileSync(created.file, 'utf8')).ed25519.secretKey;
    for (const out of [s.run(['identity', 'show']).stdout, s.run(['identity', 'show', '--json']).stdout, s.run(['status', '--json']).stdout]) {
      assert.ok(!out.includes(secret), 'secret key leaked');
    }
    assert.equal(s.run(['identity', 'create']).status, 1, 'refuses to overwrite');
    assert.equal(s.run(['identity', 'create', '--force']).status, 0);
  } finally { s.cleanup(); }
});

test('audit chain is signed, verifiable and detects tampering', () => {
  const s = sandbox();
  try {
    s.hook('claude-code', pre('Read'));
    s.json(['identity', 'create']);
    s.hook('claude-code', pre('Bash', { command: 'ls' }));
    s.hook('claude-code', pre('Write'));
    const verified = s.json(['audit', 'verify']);
    assert.deepEqual([verified.ok, verified.entries, verified.signed, verified.unsigned], [true, 3, 2, 1]);
    assert.equal(s.json(['audit']).entries.length, 3);

    const file = join(s.env.ATP_HOME, 'audit.jsonl');
    const lines = readFileSync(file, 'utf8').trim().split('\n');
    const edited = JSON.parse(lines[2]);
    edited.decision = 'allow';
    writeFileSync(file, [lines[0], lines[1], JSON.stringify(edited)].join('\n') + '\n');
    const broken = s.json(['audit', 'verify']);
    assert.equal(broken.ok, false);
    assert.match(broken.problems.join(' '), /line 3: content does not match its hash/);

    writeFileSync(file, [lines[0], lines[2]].join('\n') + '\n');
    assert.match(s.json(['audit', 'verify']).problems.join(' '), /line 2: chain broken/);
  } finally { s.cleanup(); }
});

test('parallel hook calls do not fork the audit chain', async () => {
  const s = sandbox();
  try {
    s.json(['identity', 'create']);
    const runs = Array.from({ length: 12 }, (_, i) => new Promise((resolve) => {
      const child = spawn(process.execPath, [BIN, 'guard', 'hook', 'claude-code'], { cwd: s.proj, env: s.env });
      child.stdin.end(JSON.stringify(pre(i % 2 ? 'Read' : 'Bash', { command: `echo ${i}` })));
      child.on('close', resolve);
    }));
    const codes = await Promise.all(runs);
    assert.deepEqual(codes, Array(12).fill(0));
    const verified = s.json(['audit', 'verify']);
    assert.deepEqual([verified.ok, verified.entries, verified.signed], [true, 12, 12]);
  } finally { s.cleanup(); }
});

test('Hermes guard uses atp-hermes-hook decisions, audits them and blocks with exit 2', () => {
  const s = sandbox();
  try {
    const docs = join(s.proj, 'docs');
    mkdirSync(docs);
    writeFileSync(join(docs, 'a.txt'), 'ok');
    const installed = s.json(['guard', 'install', 'hermes', '--read', docs]);
    assert.match(installed.snippet, /guard hook hermes/);
    assert.match(installed.snippet, /fail_closed: true/);
    const event = (tool_name, tool_input) => ({ hook_event_name: 'pre_tool_call', tool_name, tool_input, cwd: s.proj });
    const read = s.hook('hermes', event('read_file', { path: join(docs, 'a.txt') }));
    assert.equal(read.status, 0);
    assert.deepEqual(JSON.parse(read.stdout), {});
    const terminal = s.hook('hermes', event('terminal', { command: 'id' }));
    assert.equal(terminal.status, 2);
    assert.equal(JSON.parse(terminal.stdout).action, 'block');
    assert.equal(s.hook('hermes', 'garbage').status, 2);
    const sources = s.json(['audit']).entries.map((e) => `${e.source}:${e.decision}`);
    assert.deepEqual(sources, ['hermes:allow', 'hermes:deny']);
  } finally { s.cleanup(); }
});

test('unknown hook targets block', () => {
  const s = sandbox();
  try {
    assert.equal(s.run(['guard', 'hook', 'cursor'], '{}').status, 2);
  } finally { s.cleanup(); }
});

test('interactive shell: welcome panel, slash commands, completion and status line', async () => {
  const s = sandbox();
  const previous = { ATP_HOME: process.env.ATP_HOME, CLAUDE_CONFIG_DIR: process.env.CLAUDE_CONFIG_DIR, NO_COLOR: process.env.NO_COLOR };
  Object.assign(process.env, { ATP_HOME: s.env.ATP_HOME, CLAUDE_CONFIG_DIR: s.env.CLAUDE_CONFIG_DIR, NO_COLOR: '1' });
  try {
    const { PassThrough } = await import('node:stream');
    const { runShell, completer } = await import('../src/shell.mjs');
    assert.ok(completer('/gu')[0].includes('/guard install claude-code'));
    assert.ok(completer('/pro')[0].includes('/profile check'));
    const input = new PassThrough();
    const output = new PassThrough();
    let text = '';
    output.on('data', (chunk) => { text += chunk; });
    const done = runShell({ input, output, cwd: s.proj });
    input.end('/status\n/profile check Bash\nhello\n/guard hook claude-code\n/exit\n');
    assert.equal(await done, 0);
    assert.match(text, /Agent Trust Protocol/);
    assert.match(text, /profile\s+safe-default/);
    assert.match(text, /● ask\s+Bash/);
    assert.match(text, /Commands start with \//);
    assert.match(text, /Run that one from your terminal/);
    assert.match(text, /safe-default · no identity · 0 audited/);
    assert.match(readFileSync(join(s.env.ATP_HOME, 'history'), 'utf8'), /\/profile check Bash/);
  } finally {
    for (const [k, v] of Object.entries(previous)) { if (v === undefined) delete process.env[k]; else process.env[k] = v; }
    s.cleanup();
  }
});

test('the ATP shield logo renders 12 aligned lines with ATP on the badge, and degrades without colour', async () => {
  const { LOGO, LOGO_WIDTH, renderLogo, colorMode } = await import('../src/logo.mjs');
  const { welcome } = await import('../src/shell.mjs');
  const strip = (s) => s.replace(/\u001b\[[0-9;]*m/g, '');
  assert.ok(LOGO.every((row) => row.length === LOGO_WIDTH));
  for (const mode of ['truecolor', '256']) {
    const lines = renderLogo(mode);
    assert.equal(lines.length, LOGO.length / 2);
    assert.ok(lines.every((line) => strip(line).length === LOGO_WIDTH), mode);
    assert.equal(lines.filter((line) => strip(line).includes('ATP')).length, 1, mode);
  }
  assert.equal(renderLogo(null), null);
  assert.equal(colorMode({ NO_COLOR: '1' }, { isTTY: true }), null);
  assert.equal(colorMode({}, { isTTY: false }), null);
  assert.equal(colorMode({ COLORTERM: 'truecolor' }, { isTTY: true }), 'truecolor');
  assert.equal(colorMode({}, { isTTY: true }), '256');
  const wide = strip(welcome('/p', { columns: 100, isTTY: true }, { COLORTERM: 'truecolor' }));
  assert.match(wide, /█.*Agent Trust Protocol™/);
  assert.match(wide, /ATP/);
  const narrow = strip(welcome('/p', { columns: 40, isTTY: true }, {}));
  assert.doesNotMatch(narrow, /█/);
  assert.match(narrow, /Agent Trust Protocol™/);
});
