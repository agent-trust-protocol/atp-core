// ATP guard for Hermes Agent's shell pre_tool_call hook, using the published
// atp-hermes-hook decision logic, with each decision written to the ATP audit trail.
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { decide, loadConfig, normalizeConfig } from 'atp-hermes-hook';
import { paths, readJson, writeJson } from './home.mjs';

export const HERMES_MARKER = 'guard hook hermes';
export const HERMES_MATCHER = '^(read_file|terminal|write_file|patch)$';

export function hermesHookCommand() {
  const bin = resolve(fileURLToPath(new URL('../bin/atp.mjs', import.meta.url)));
  return `${JSON.stringify(process.execPath)} ${JSON.stringify(bin)} ${HERMES_MARKER}`;
}

/** Write ~/.atp/hermes-hook.json and return the config.yaml snippet to add to a Hermes profile. */
export function installHermes({ profile, read = [], write = [], onApproval = 'block' }) {
  const file = paths.hermesConfig();
  const config = { profile, onApproval, paths: { read: read.map((p) => resolve(p)), write: write.map((p) => resolve(p)) } };
  normalizeConfig(config); // validate with the package's own rules before writing
  writeJson(file, config, 0o600);
  const snippet = [
    'hooks:',
    '  pre_tool_call:',
    `    - matcher: "${HERMES_MATCHER}"`,
    `      command: ${JSON.stringify(hermesHookCommand())}`,
    '      timeout: 10',
    '      fail_closed: true',
  ].join('\n');
  return { file, config, snippet };
}

export function hermesStatus() {
  const file = paths.hermesConfig();
  return { file, configured: existsSync(file), config: readJson(file, null), command: hermesHookCommand(), matcher: HERMES_MATCHER };
}

/** Decide one Hermes payload with the configured hook. */
export function decideHermes(payload) {
  const config = loadConfig(paths.hermesConfig());
  const directive = decide(config, payload);
  const decision = directive.action === 'block' ? 'deny' : directive.action === 'approve' ? 'require_approval' : 'allow';
  return { directive, decision, profile: config.profileName, exitCode: directive.action === 'block' ? 2 : 0 };
}
