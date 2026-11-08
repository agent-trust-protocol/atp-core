import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { ConfigError, DEFAULT_TOOLS, decide, loadConfig, normalizeConfig } from '../src/index.mjs';

const bin = fileURLToPath(new URL('../bin/atp-hermes-hook.mjs', import.meta.url));

function sandbox() {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'atp-hermes-hook-')));
  const readDir = join(root, 'read');
  const writeDir = join(root, 'write');
  const outside = join(root, 'outside');
  for (const dir of [readDir, writeDir, outside]) mkdirSync(dir);
  writeFileSync(join(readDir, 'notes.txt'), 'readable\n');
  writeFileSync(join(writeDir, 'draft.txt'), 'draft\n');
  writeFileSync(join(outside, 'secret.txt'), 'secret\n');
  return { root, readDir, writeDir, outside, cleanup: () => rmSync(root, { recursive: true, force: true }) };
}

const event = (tool_name, tool_input, cwd) => ({ hook_event_name: 'pre_tool_call', tool_name, tool_input, cwd });

test('defaults: safe-default profile, executing state, block on approval', () => {
  const config = normalizeConfig({});
  assert.equal(config.profileName, 'safe-default');
  assert.equal(config.state, 'executing');
  assert.equal(config.onApproval, 'block');
  assert.deepEqual(Object.keys(config.tools).sort(), Object.keys(DEFAULT_TOOLS).sort());
  assert.deepEqual(config.roots, { read: [], write: [] });
});

test('configuration errors are rejected, never defaulted', () => {
  for (const raw of [
    null, [], { profile: 'typo' }, { state: 'running' }, { onApproval: 'allow' }, { extra: true },
    { tools: { web_search: { category: '' } } },
    { tools: { read_any: { category: 'filesystem', mode: 'read' } } },
    { tools: { terminal: { category: 'shell', pathArg: 'command' } } },
    { paths: { read: ['/definitely/not/a/real/dir'] } },
    { paths: { exec: [] } },
  ]) {
    assert.throws(() => normalizeConfig(raw), ConfigError, JSON.stringify(raw));
  }
});

test('reads are allowed only inside configured roots, following symlinks', () => {
  const s = sandbox();
  try {
    const config = normalizeConfig({ paths: { read: [s.readDir] } });
    assert.deepEqual(decide(config, event('read_file', { path: join(s.readDir, 'notes.txt') })), {});
    assert.deepEqual(decide(config, event('read_file', { path: 'notes.txt' }, s.readDir)), {});
    assert.equal(decide(config, event('read_file', { path: join(s.outside, 'secret.txt') })).action, 'block');
    assert.equal(decide(config, event('read_file', { path: '../outside/secret.txt' }, s.readDir)).action, 'block');
    symlinkSync(join(s.outside, 'secret.txt'), join(s.readDir, 'alias.txt'));
    assert.equal(decide(config, event('read_file', { path: join(s.readDir, 'alias.txt') })).action, 'block');
    assert.equal(decide(config, event('read_file', { path: join(s.readDir, 'missing.txt') })).action, 'block');
    assert.equal(decide(config, event('read_file', { path: 'notes.txt' })).action, 'block', 'relative path without cwd');
    assert.equal(decide(config, event('read_file', {})).action, 'block');
    assert.equal(decide(config, event('read_file', null)).action, 'block');
  } finally { s.cleanup(); }
});

test('no read roots means no reads', () => {
  const s = sandbox();
  try {
    assert.equal(decide(normalizeConfig({}), event('read_file', { path: join(s.readDir, 'notes.txt') })).action, 'block');
  } finally { s.cleanup(); }
});

test('writes need a profile that permits write and a path inside write roots', () => {
  const s = sandbox();
  try {
    const readOnly = normalizeConfig({ paths: { write: [s.writeDir] } });
    const blocked = decide(readOnly, event('write_file', { path: join(s.writeDir, 'draft.txt') }));
    assert.equal(blocked.action, 'block');
    assert.match(blocked.message, /does not permit/);

    const dev = normalizeConfig({ profile: 'dev-mode', paths: { write: [s.writeDir] } });
    assert.deepEqual(decide(dev, event('write_file', { path: join(s.writeDir, 'draft.txt') })), {});
    assert.deepEqual(decide(dev, event('write_file', { path: join(s.writeDir, 'new.txt') })), {}, 'new file in scope');
    assert.equal(decide(dev, event('patch', { path: join(s.outside, 'secret.txt') })).action, 'block');
    assert.equal(decide(dev, event('write_file', { path: join(s.writeDir, 'nested', 'new.txt') })).action, 'block', 'missing parent');
    symlinkSync(join(s.outside, 'created-by-agent.txt'), join(s.writeDir, 'dangling.txt'));
    assert.equal(decide(dev, event('write_file', { path: join(s.writeDir, 'dangling.txt') })).action, 'block', 'dangling symlink');
    assert.deepEqual(decide(dev, event('read_file', { path: join(s.writeDir, 'draft.txt') })), {}, 'write roots are readable');
  } finally { s.cleanup(); }
});

test('profile decisions: deny blocks, require_approval blocks or escalates', () => {
  const blockMode = normalizeConfig({});
  const terminal = event('terminal', { command: 'echo hi' });
  const blocked = decide(blockMode, terminal);
  assert.equal(blocked.action, 'block');
  assert.match(blocked.message, /requires approval/);

  const escalate = normalizeConfig({ onApproval: 'escalate' });
  assert.deepEqual(decide(escalate, terminal), {
    action: 'approve',
    message: 'ATP: terminal requires approval under profile safe-default (control_blocked)',
    rule_key: 'atp:safe-default:terminal',
  });

  const locked = normalizeConfig({ profile: 'enterprise-locked', onApproval: 'escalate' });
  assert.equal(decide(locked, terminal).action, 'block', 'deny is never escalated');

  const planning = normalizeConfig({ state: 'planning', paths: { read: [tmpdir()] } });
  assert.equal(decide(planning, event('read_file', { path: tmpdir() })).action, 'block');
});

test('unknown events, unmapped tools and removed defaults fail closed', () => {
  const config = normalizeConfig({ tools: { terminal: null, web_search: { category: 'network' } } });
  assert.equal(decide(config, event('terminal', { command: 'ls' })).action, 'block');
  assert.equal(decide(config, event('unknown_tool', {})).action, 'block');
  assert.deepEqual(decide(config, event('web_search', { query: 'atp' })), {});
  assert.equal(decide(config, { ...event('web_search', {}), hook_event_name: 'post_tool_call' }).action, 'block');
  assert.equal(decide(config, null).action, 'block');
  assert.equal(decide(config, { hook_event_name: 'pre_tool_call' }).action, 'block');
});

test('loadConfig resolves relative roots against the config file', () => {
  const s = sandbox();
  try {
    const file = join(s.root, 'atp-hermes.json');
    writeFileSync(file, JSON.stringify({ paths: { read: ['read'] } }));
    assert.deepEqual(loadConfig(file).roots.read, [s.readDir]);
    writeFileSync(file, '{not json');
    assert.throws(() => loadConfig(file), ConfigError);
    assert.throws(() => loadConfig(undefined), ConfigError);
  } finally { s.cleanup(); }
});

test('binary: allow exits 0 with {}, every block exits 2 with block JSON', () => {
  const s = sandbox();
  try {
    const file = join(s.root, 'atp-hermes.json');
    writeFileSync(file, JSON.stringify({ paths: { read: [s.readDir] } }));
    const run = (args, input, env = {}) => spawnSync(process.execPath, [bin, ...args], {
      input, encoding: 'utf8', env: { ...process.env, ATP_HERMES_HOOK_CONFIG: '', ...env },
    });

    const allowed = run(['--config', file], JSON.stringify(event('read_file', { path: join(s.readDir, 'notes.txt') })));
    assert.equal(allowed.status, 0);
    assert.deepEqual(JSON.parse(allowed.stdout), {});

    const viaEnv = run([], JSON.stringify(event('read_file', { path: join(s.readDir, 'notes.txt') })), { ATP_HERMES_HOOK_CONFIG: file });
    assert.equal(viaEnv.status, 0);

    for (const [args, input] of [
      [['--config', file], JSON.stringify(event('terminal', { command: 'echo hi' }))],
      [['--config', file], '{bad json'],
      [[], JSON.stringify(event('read_file', { path: join(s.readDir, 'notes.txt') }))],
      [['--config', join(s.root, 'missing.json')], '{}'],
      [['--bogus'], '{}'],
    ]) {
      const result = run(args, input);
      assert.equal(result.status, 2, `${args.join(' ')} ${input}`);
      assert.equal(JSON.parse(result.stdout).action, 'block');
    }

    const check = execFileSync(process.execPath, [bin, '--check', '--config', file], { encoding: 'utf8' });
    assert.equal(JSON.parse(check).profile, 'safe-default');
    assert.equal(run(['--check', '--config', join(s.root, 'missing.json')], '').status, 1);
  } finally { s.cleanup(); }
});
