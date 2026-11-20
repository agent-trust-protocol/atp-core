// Read-only local diagnostics. Never executes tools, installs hooks or contacts a registry.
import { fileURLToPath } from 'node:url';
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { loadSettings } from './settings.mjs';
import { claudeStatus, hookCommand } from './guard-claude.mjs';
import { paths } from './home.mjs';
import { loadConfig } from 'atp-hermes-hook';
function packageVersion(name) {
  let dir = dirname(fileURLToPath(import.meta.resolve(name)));
  for (;;) {
    const file = join(dir, 'package.json');
    if (existsSync(file)) {
      const p = JSON.parse(readFileSync(file, 'utf8'));
      if (p.name === name) return p.version;
    }
    const parent = dirname(dir);
    if (parent === dir) throw new Error('Package metadata unavailable');
    dir = parent;
  }
}
export function doctor({ cwd = process.cwd() } = {}) {
  const checks = [];
  const add = (id, status, message, next = null) => checks.push({ id, status, message, next });
  add('node', Number(process.versions.node.split('.')[0]) >= 20 ? 'pass' : 'fail', `Node ${process.versions.node}`, 'Use Node 20 or newer.');
  for (const [name, major, minor] of [['atp-sdk', 6, 0], ['atp-profiles', 3, 0], ['atp-hermes-hook', 0, 2]]) {
    try {
      const version = packageVersion(name);
      const parts = version.split('.').map(Number);
      const compatible = parts[0] === major && parts[1] >= minor && (name !== 'atp-hermes-hook' || parts[1] > 2 || parts[2] >= 1);
      add(name, compatible ? 'pass' : 'fail', `${name} ${version}`, compatible ? null : 'Update the CLI and rerun doctor.');
    } catch { add(name, 'fail', `${name}: package metadata unavailable`, 'Reinstall the CLI and rerun doctor.'); }
  }
  try { const s = loadSettings(cwd); add('settings', 'pass', `Profile ${s.profile}; state ${s.state}`); }
  catch { add('settings', 'fail', 'ATP settings are invalid or unreadable.', 'Check user and project .atp/settings.json using atp profile list.'); }
  let installed = false;
  for (const scope of ['user', 'project', 'local']) {
    try {
      const s = claudeStatus(scope, cwd);
      if (s.installed) {
        installed = true;
        const current = s.commands.every(c => c === hookCommand());
        add(`claude-${scope}`, current ? 'warn' : 'fail', current ? `Claude ${scope}: ATP command registered; matcher and live execution unverified.` : `Claude ${scope}: registered command differs from this CLI.`, `Run atp guard install claude-code --scope ${scope}, restart Claude Code, then test an allowed and blocked action.`);
      }
    } catch { add(`claude-${scope}`, 'fail', `Claude ${scope} settings are invalid or unreadable.`, 'Repair the settings JSON before installing a guard.'); }
  }
  if (existsSync(paths.hermesConfig())) {
    installed = true;
    try {
      loadConfig(paths.hermesConfig());
      add('hermes', 'warn', 'CLI Hermes policy is valid; profile YAML, consent, restart and live enforcement are unverified.', 'Follow examples/hermes-hook: confirm matcher .* and fail_closed, then test read, terminal and execute_code.');
    } catch { add('hermes', 'fail', 'CLI Hermes policy is invalid or unreadable.', 'Review ~/.atp/hermes-hook.json (or ATP_HOME) before reinstalling.'); }
  }
  if (!installed) add('guards', 'warn', 'No CLI-managed guard found. A standalone Hermes installation may exist separately.', 'For Hermes, follow the atp-hermes-hook setup walkthrough; for Claude, run atp guard install claude-code.');
  add('live-enforcement', 'unverified', 'No live tool call was performed. Configuration checks do not prove protection.', 'In a disposable test profile, confirm one allowed read and blocked terminal, write and alternate execution calls.');
  const ok = !checks.some(c => c.status === 'fail');
  return { ok, data: { checks, liveEnforcement: 'unverified', readOnly: true }, text: ['ATP doctor — local checks', ...checks.map(c => `${c.status.toUpperCase()}  ${c.message}${c.next ? `\n  Next: ${c.next}` : ''}`), 'No files changed. No network requests.'].join('\n') };
}
