import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { parseDocument } from 'yaml';
import { loadConfig } from './index.mjs';

const MATCHER = '^(read_file|terminal|write_file|patch)$';
const packageRoot = fileURLToPath(new URL('../', import.meta.url));

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', timeout: 120_000, ...options });
  if (result.error || result.status !== 0) {
    throw new Error(`${command} ${args[0] ?? ''} failed: ${result.error?.message ?? result.stderr?.trim() ?? result.status}`);
  }
  return result;
}

function atomicWrite(file, content) {
  const temp = `${file}.${randomUUID()}.tmp`;
  try {
    writeFileSync(temp, content, { mode: 0o600, flag: 'wx' });
    renameSync(temp, file);
  } finally {
    rmSync(temp, { force: true });
  }
}

function readProfile(file) {
  const source = readFileSync(file, 'utf8');
  const doc = parseDocument(source);
  if (doc.errors.length) throw new Error(`Invalid Hermes YAML: ${doc.errors[0].message}`);
  const config = doc.toJS({ maxAliasCount: 100 });
  if (config !== null && (typeof config !== 'object' || Array.isArray(config))) {
    throw new Error('Hermes config.yaml must contain a mapping');
  }
  const hooks = config?.hooks;
  if (hooks != null && (typeof hooks !== 'object' || Array.isArray(hooks))) {
    throw new Error('Existing hooks must be a mapping; no configuration was changed');
  }
  const entries = hooks?.pre_tool_call ?? [];
  if (!Array.isArray(entries) || entries.some((entry) => !entry || typeof entry !== 'object' || Array.isArray(entry))) {
    throw new Error('Existing hooks.pre_tool_call must be a list of mappings');
  }
  return { doc, source, entries };
}

/** Install a fixed local hook, merge it into one Hermes profile, and test its wire contract.
 * The injected runner/package source are for packed-package tests, never CLI options.
 */
export function setupHermes({ profile = 'atp-pilot', hermesHome = process.env.HERMES_HOME || join(homedir(), '.hermes'), read = [] } = {}, {
  execute = run, packageSource, output = console.log,
} = {}) {
  if (process.platform === 'win32') throw new Error('Run setup in WSL; native Windows setup is not supported yet');
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(profile)) throw new Error('Invalid Hermes profile name');
  const home = resolve(hermesHome);
  const profileDir = profile === 'default' ? home : join(home, 'profiles', profile);
  const profileFile = join(profileDir, 'config.yaml');
  const installDir = join(home, 'agent-hooks', 'atp');
  const policyFile = join(installDir, 'atp-hermes.json');
  // Hermes profile resolution and creation must use the same root as our file edits.
  const hermesEnv = { ...process.env, HERMES_HOME: home };
  const hermes = (args) => execute('hermes', args, { env: hermesEnv });
  hermes(['--version']);
  for (const path of read) {
    if (!existsSync(resolve(path))) throw new Error(`Read scope does not exist: ${path}`);
  }
  if (existsSync(policyFile)) {
    loadConfig(policyFile); // Keep a valid existing policy; never silently broaden it.
    if (read.length) throw new Error(`An ATP policy already exists at ${policyFile}; edit its read scope explicitly`);
  }
  if (!existsSync(profileFile)) {
    if (existsSync(profileDir)) throw new Error(`Profile directory exists without config.yaml: ${profileDir}`);
    hermes(['profile', 'create', profile]);
  }
  const before = readProfile(profileFile); // Reject malformed/duplicate YAML before installing.
  const version = JSON.parse(readFileSync(join(packageRoot, 'package.json'), 'utf8')).version;
  mkdirSync(installDir, { recursive: true, mode: 0o700 });
  output(`Installing a fixed local copy of atp-hermes-hook@${version}…`);
  execute('npm', ['install', '--prefix', installDir, '--ignore-scripts', '--save-exact', '--no-fund', '--no-audit',
    packageSource ?? `atp-hermes-hook@${version}`]);
  const stableBin = join(installDir, 'node_modules', 'atp-hermes-hook', 'bin', 'atp-hermes-hook.mjs');
  const fixtureDir = join(installDir, 'test-files');
  mkdirSync(fixtureDir, { recursive: true, mode: 0o700 });
  const fixture = join(fixtureDir, 'atp-setup-fixture.txt');
  if (!existsSync(fixture)) writeFileSync(fixture, 'ATP Hermes read test.\n', { flag: 'wx', mode: 0o600 });
  if (!existsSync(policyFile)) {
    const policy = { profile: 'safe-default', state: 'executing', onApproval: 'block',
      paths: { read: read.length ? read.map((path) => resolve(path)) : [fixtureDir], write: [] } };
    writeFileSync(policyFile, `${JSON.stringify(policy, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
  }
  const config = loadConfig(policyFile);
  execute(process.execPath, [stableBin, '--check', '--config', policyFile]);
  const tests = [
    ['terminal blocked', { tool_name: 'terminal', tool_input: { command: 'echo ATP-test' } }, 2],
    ['write blocked', { tool_name: 'write_file', tool_input: { path: fixture, content: 'must not be written' } }, 2],
  ];
  // The default fixture is the only read scope we can prove without reading a user's files.
  if (config.roots.read.includes(fixtureDir)) {
    tests.unshift(['fixture read allowed', { tool_name: 'read_file', tool_input: { path: fixture } }, 0]);
  }
  for (const [label, payload, expected] of tests) {
    const result = spawnSync(process.execPath, [stableBin, '--config', policyFile], {
      input: JSON.stringify({ hook_event_name: 'pre_tool_call', ...payload }), encoding: 'utf8', timeout: 10_000,
    });
    let directive;
    try { directive = JSON.parse(result.stdout); } catch { /* report below */ }
    if (result.status !== expected || !directive ||
        (expected === 2 ? directive.action !== 'block' : Object.keys(directive).length !== 0)) {
      throw new Error(`Self-test failed: ${label}; Hermes configuration was not changed`);
    }
    output(`PASS: ${label}`);
  }
  const command = [process.execPath, stableBin, '--config', policyFile].map((part) => JSON.stringify(part)).join(' ');
  // Re-read after npm finishes: do not overwrite edits made during installation.
  const current = readProfile(profileFile);
  if (current.source !== before.source) throw new Error('Hermes configuration changed during setup; rerun setup');
  const entry = { matcher: MATCHER, command, timeout: 10, fail_closed: true };
  const entries = current.entries.filter((existing) => existing.command !== command);
  entries.push(entry);
  current.doc.setIn(['hooks', 'pre_tool_call'], entries);
  const updated = current.doc.toString();
  let backup = null;
  if (updated !== current.source) {
    backup = `${profileFile}.before-atp-${randomUUID()}`;
    writeFileSync(backup, current.source, { flag: 'wx', mode: 0o600 });
    atomicWrite(profileFile, updated);
  }
  output(`Configured Hermes profile: ${profile}`);
  if (backup) output(`Backup: ${backup}`);
  output(`Policy: ${policyFile}`);
  output('Scope: read_file, terminal, write_file and patch only. Other tools are outside this matcher.');
  output('Standalone self-tests passed. Live Hermes enforcement is not verified yet.');
  output(`Next: hermes -p ${profile} hooks test pre_tool_call --for-tool terminal`);
  output('Review and approve the local hook when Hermes requests first-use consent.');
  output(`Then: hermes -p ${profile} chat (run setup for this profile first if its provider is not configured).`);
  output('No gateway was restarted and hook consent was not bypassed.');
  return { profileFile, policyFile, stableBin, command, backup };
}

export function parseSetupArgs(args) {
  const options = { read: [] };
  for (let index = 0; index < args.length; index += 1) {
    const flag = args[index];
    if (!['--hermes-profile', '--hermes-home', '--read'].includes(flag)) throw new Error(`Unknown setup option: ${flag}`);
    const value = args[++index];
    if (!value || value.startsWith('--')) throw new Error(`${flag} requires a value`);
    if (flag === '--read') options.read.push(value);
    else options[flag === '--hermes-profile' ? 'profile' : 'hermesHome'] = value;
  }
  return options;
}
