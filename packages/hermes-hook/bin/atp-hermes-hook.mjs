#!/usr/bin/env node
// Hermes Agent shell pre_tool_call hook. Reads one JSON event on stdin and writes
// one JSON directive on stdout. Every failure path blocks and exits with code 2,
// which Hermes treats as a block even when fail_closed is not set.
import { readFileSync } from 'node:fs';
import { decide, loadConfig } from '../src/index.mjs';

const BLOCK_EXIT = 2;
const USAGE = `Usage: atp-hermes-hook --config <file>   (reads a Hermes pre_tool_call event on stdin)
       atp-hermes-hook --check --config <file>
       atp-hermes-hook --version

The configuration file can also be set with ATP_HERMES_HOOK_CONFIG.`;

function emit(directive) {
  process.stdout.write(`${JSON.stringify(directive)}\n`);
  process.exitCode = directive.action === 'block' ? BLOCK_EXIT : 0;
}

function parseArgs(argv) {
  const options = { config: process.env.ATP_HERMES_HOOK_CONFIG, check: false, help: false, version: false };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--config') options.config = argv[(i += 1)];
    else if (arg.startsWith('--config=')) options.config = arg.slice('--config='.length);
    else if (arg === '--check') options.check = true;
    else if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg === '--version') options.version = true;
    else throw new Error(`unknown argument: ${arg}`);
  }
  return options;
}

function main() {
  let options;
  try {
    options = parseArgs(process.argv.slice(2));
  } catch (error) {
    emit({ action: 'block', message: `ATP: hook invocation error: ${error.message}` });
    return;
  }
  if (options.help) {
    process.stdout.write(`${USAGE}\n`);
    return;
  }
  if (options.version) {
    const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
    process.stdout.write(`${pkg.version}\n`);
    return;
  }

  let config;
  try {
    config = loadConfig(options.config);
  } catch (error) {
    if (options.check) {
      process.stderr.write(`atp-hermes-hook: ${error.message}\n`);
      process.exitCode = 1;
    } else {
      emit({ action: 'block', message: `ATP: hook configuration error: ${error.message}` });
    }
    return;
  }

  if (options.check) {
    const summary = {
      profile: config.profileName,
      state: config.state,
      onApproval: config.onApproval,
      tools: config.tools,
      paths: config.roots,
    };
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
    return;
  }

  let payload;
  try {
    payload = JSON.parse(readFileSync(0, 'utf8'));
  } catch {
    emit({ action: 'block', message: 'ATP: invalid hook input' });
    return;
  }
  try {
    emit(decide(config, payload));
  } catch {
    emit({ action: 'block', message: 'ATP: internal hook error' });
  }
}

main();
