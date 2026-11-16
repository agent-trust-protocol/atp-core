import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { parse } from 'yaml';
import { parseSetupArgs, setupHermes } from '../src/setup.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const bin = join(root, 'bin', 'atp-hermes-hook.mjs');

function sandbox(initial = '# Keep this comment\nmodel:\n  default: test-model\n') {
  const home = realpathSync(mkdtempSync(join(tmpdir(), 'atp setup "quoted" ')));
  const file = join(home, 'profiles', 'atp-pilot', 'config.yaml');
  mkdirSync(join(home, 'profiles', 'atp-pilot'), { recursive: true });
  writeFileSync(file, initial);
  const output = [];
  const calls = [];
  const execute = (command, args, options) => {
    calls.push({ command, args, options });
    if (command === 'hermes') return { status: 0, stdout: 'Hermes test fixture', stderr: '' };
    if (command === 'npm') {
      // Install the actual package files and dependencies without hitting the registry per test.
      const dest = join(args[args.indexOf('--prefix') + 1], 'node_modules', 'atp-hermes-hook');
      mkdirSync(dest, { recursive: true });
      for (const item of ['bin', 'src', 'package.json', 'node_modules']) {
        cpSync(join(root, item), join(dest, item), { recursive: true, filter: (path) => !path.endsWith('/.bin') });
      }
      return { status: 0, stdout: '', stderr: '' };
    }
    const result = spawnSync(command, args, { encoding: 'utf8', ...options });
    if (result.status !== 0) throw new Error(result.stderr);
    return result;
  };
  return { home, file, output, calls, execute, cleanup: () => rmSync(home, { recursive: true, force: true }),
    setup: (options = {}) => setupHermes({ hermesHome: home, ...options }, { execute, output: (line) => output.push(line) }) };
}

test('setup preserves YAML, other hooks and credentials; repeated setup is idempotent', () => {
  const initial = '# Preserve this comment\nmodel:\n  default: test-model\nhooks:\n  pre_tool_call:\n    - command: /my/existing-hook\n      matcher: terminal\n  post_tool_call:\n    - command: /my/observer\n';
  const s = sandbox(initial);
  try {
    writeFileSync(join(s.home, 'profiles', 'atp-pilot', '.env'), 'SECRET=keep-me\n');
    const result = s.setup();
    const yaml = readFileSync(s.file, 'utf8');
    const config = parse(yaml);
    assert.match(yaml, /Preserve this comment/);
    assert.equal(config.model.default, 'test-model');
    assert.equal(config.hooks.pre_tool_call[0].command, '/my/existing-hook');
    assert.equal(config.hooks.post_tool_call[0].command, '/my/observer');
    assert.equal(config.hooks.pre_tool_call[1].fail_closed, true);
    assert.equal(config.hooks.pre_tool_call[1].matcher, '.*');
    assert.equal(readFileSync(result.backup, 'utf8'), initial);
    assert.equal(readFileSync(join(s.home, 'profiles', 'atp-pilot', '.env'), 'utf8'), 'SECRET=keep-me\n');
    const policy = readFileSync(result.policyFile, 'utf8');
    const repeated = s.setup();
    assert.equal(repeated.backup, null);
    assert.equal(readFileSync(s.file, 'utf8'), yaml);
    assert.equal(readFileSync(result.policyFile, 'utf8'), policy);
    assert.equal(s.output.filter((line) => line === 'PASS: fixture read allowed').length, 2);
    assert.ok(s.output.includes('PASS: terminal blocked'));
    assert.ok(s.output.includes('PASS: write blocked'));
    assert.ok(s.output.includes('PASS: execute_code blocked'));
    assert.ok(s.output.includes('PASS: unmapped tool blocked'));
    assert.ok(!s.calls.some(({ args }) => args.includes('--accept-hooks') || args.includes('restart')));
    assert.equal(s.calls[0].options.env.HERMES_HOME, s.home);
  } finally { s.cleanup(); }
});

test('malformed YAML and malformed existing hooks fail before npm or config changes', () => {
  for (const source of ['model: [\n', 'model: a\nmodel: b\n', 'hooks: nope\n', 'hooks:\n  pre_tool_call: nope\n']) {
    const s = sandbox(source);
    try {
      assert.throws(() => s.setup());
      assert.equal(readFileSync(s.file, 'utf8'), source);
      assert.ok(!s.calls.some(({ command }) => command === 'npm'));
    } finally { s.cleanup(); }
  }
});

test('upgrade closes the four-tool matcher gap for execute_code and future tools', () => {
  const s = sandbox();
  try {
    const installed = s.setup();
    const old = parse(readFileSync(s.file, 'utf8'));
    old.hooks.pre_tool_call[0].matcher = '^(read_file|terminal|write_file|patch)$';
    writeFileSync(s.file, JSON.stringify(old));
    s.setup();
    const hooks = parse(readFileSync(s.file, 'utf8')).hooks.pre_tool_call;
    assert.equal(hooks.length, 1);
    for (const tool_name of ['execute_code', 'delegate_task', 'browser_exec', 'future_execution_tool']) {
      assert.ok(new RegExp(hooks[0].matcher).test(tool_name), `${tool_name} must reach ATP`);
      const result = spawnSync(process.execPath, [installed.stableBin, '--config', installed.policyFile], {
        encoding: 'utf8', input: JSON.stringify({ hook_event_name: 'pre_tool_call', tool_name,
          tool_input: { code: 'import subprocess' } }),
      });
      assert.equal(result.status, 2);
      assert.equal(JSON.parse(result.stdout).action, 'block');
      assert.match(JSON.parse(result.stdout).message, /not mapped/);
    }
  } finally { s.cleanup(); }
});

test('a missing profile is created through Hermes before installing the hook', () => {
  const s = sandbox();
  try {
    rmSync(join(s.home, 'profiles', 'atp-pilot'), { recursive: true });
    const result = setupHermes({ hermesHome: s.home }, {
      execute: (command, args, options) => {
        if (command === 'hermes' && args[0] === 'profile') {
          assert.deepEqual(args, ['profile', 'create', 'atp-pilot']);
          mkdirSync(join(s.home, 'profiles', 'atp-pilot'));
          writeFileSync(s.file, 'model: {}\n');
        }
        return s.execute(command, args, options);
      }, output: () => {},
    });
    assert.equal(parse(readFileSync(result.profileFile, 'utf8')).hooks.pre_tool_call.length, 1);
    assert.ok(s.calls.some(({ args }) => args[0] === 'profile'));
  } finally { s.cleanup(); }
});

test('custom read scope is explicit and an existing ATP policy is never overwritten', () => {
  const s = sandbox();
  try {
    const docs = join(s.home, 'docs');
    mkdirSync(docs);
    const first = s.setup({ read: [docs] });
    const policy = JSON.parse(readFileSync(first.policyFile, 'utf8'));
    assert.deepEqual(policy.paths, { read: [docs], write: [] });
    assert.ok(!s.output.includes('PASS: fixture read allowed'));
    assert.throws(() => s.setup({ read: [s.home] }), /already exists/);
    assert.deepEqual(JSON.parse(readFileSync(first.policyFile, 'utf8')), policy);
    policy.profile = 'dev-mode';
    writeFileSync(first.policyFile, JSON.stringify(policy));
    const before = readFileSync(s.file, 'utf8');
    assert.throws(() => s.setup(), /Self-test failed: terminal blocked/);
    assert.equal(readFileSync(s.file, 'utf8'), before);
  } finally { s.cleanup(); }
});

test('missing Hermes and failed npm never register a hook', () => {
  const s = sandbox();
  try {
    const before = readFileSync(s.file, 'utf8');
    for (const failAt of ['hermes', 'npm']) {
      assert.throws(() => setupHermes({ hermesHome: s.home }, {
        execute: (command, ...args) => {
          if (command === failAt) throw new Error(`${failAt} unavailable`);
          return s.execute(command, ...args);
        }, output: () => {},
      }), /unavailable/);
      assert.equal(readFileSync(s.file, 'utf8'), before);
    }
  } finally { s.cleanup(); }
});

test('configuration edits made during npm installation are not overwritten', () => {
  const s = sandbox();
  try {
    assert.throws(() => setupHermes({ hermesHome: s.home }, {
      execute: (command, ...args) => {
        const result = s.execute(command, ...args);
        if (command === 'npm') writeFileSync(s.file, 'model: edited-during-install\n');
        return result;
      }, output: () => {},
    }), /changed during setup/);
    assert.equal(readFileSync(s.file, 'utf8'), 'model: edited-during-install\n');
  } finally { s.cleanup(); }
});

test('setup rejects traversal and missing flags, reports errors as setup errors rather than hook JSON', () => {
  assert.deepEqual(parseSetupArgs(['--hermes-profile', 'pilot', '--read', '/tmp']), { profile: 'pilot', read: ['/tmp'] });
  for (const args of [['--read'], ['--read', '--hermes-profile'], ['--accept-hooks']]) {
    assert.throws(() => parseSetupArgs(args));
  }
  assert.throws(() => setupHermes({ profile: '../default' }), /Invalid Hermes profile/);
  const result = spawnSync(process.execPath, [bin, 'setup', '--invalid'], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.equal(result.stdout, '');
  assert.match(result.stderr, /setup: Unknown setup option/);
});

test('packed package installs setup and performs actual hook subprocess tests from its persistent copy', () => {
  const s = sandbox();
  try {
    const pack = spawnSync('npm', ['pack', '--json', '--pack-destination', s.home], { cwd: root, encoding: 'utf8' });
    assert.equal(pack.status, 0, pack.stderr);
    const tarball = join(s.home, JSON.parse(pack.stdout)[0].filename);
    const result = setupHermes({ hermesHome: s.home }, {
      packageSource: tarball,
      execute: (command, args, options) => {
        if (command === 'hermes') return s.execute(command, args, options);
        const processResult = spawnSync(command, args, { encoding: 'utf8', timeout: 60_000, ...options });
        assert.equal(processResult.status, 0, processResult.stderr);
        return processResult;
      }, output: (line) => s.output.push(line),
    });
    assert.ok(existsSync(result.stableBin));
    assert.ok(existsSync(join(result.stableBin, '..', '..', 'src', 'setup.mjs')));
    assert.ok(s.output.includes('PASS: fixture read allowed'));
    assert.ok(s.output.includes('PASS: terminal blocked'));
  } finally { s.cleanup(); }
});
