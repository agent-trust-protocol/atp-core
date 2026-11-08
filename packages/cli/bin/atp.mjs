#!/usr/bin/env node
// atp — Agent Trust Protocol in your terminal.
//   atp                         interactive shell (on a terminal)
//   atp <command> [args]        run one command, e.g. atp profile check Bash
//   atp -p "/<command> ..."     one-shot, like the shell's slash commands
//   --json                      print machine-readable output
import { runCommand } from '../src/commands.mjs';
import { runClaudeHook, runHermesHook } from '../src/hook.mjs';
import { runShell } from '../src/shell.mjs';
import { tokenize } from '../src/tokenize.mjs';

async function main(argv) {
  // Hook mode first: this path runs on every guarded tool call and must stay minimal.
  if (argv[0] === 'guard' && argv[1] === 'hook') {
    if (argv[2] === 'claude-code') return runClaudeHook();
    if (argv[2] === 'hermes') return runHermesHook();
    process.stderr.write('ATP: unknown hook target; blocking\n');
    return 2;
  }

  const json = argv.includes('--json');
  let args = argv.filter((a) => a !== '--json');

  if (args[0] === '-p' || args[0] === '--print') {
    if (args.length < 2) { process.stderr.write('usage: atp -p "/command ..."\n'); return 2; }
    try {
      args = tokenize(args[1].replace(/^\//, ''));
    } catch (error) {
      process.stderr.write(`${error.message}\n`);
      return 2;
    }
  }
  if (args[0] === '--version' || args[0] === '-v') args = ['version'];
  if (args[0] === '--help' || args[0] === '-h') args = ['help'];

  if (args.length === 0) {
    if (process.stdin.isTTY && process.stdout.isTTY && !json) return runShell();
    args = ['help'];
  }

  const result = await runCommand(args);
  if (json) process.stdout.write(`${JSON.stringify({ ok: result.ok, ...result.data }, null, 2)}\n`);
  else process.stdout.write(`${result.text}\n`);
  return result.ok ? 0 : 1;
}

main(process.argv.slice(2)).then(
  (code) => { process.exitCode = code; },
  (error) => { process.stderr.write(`atp: ${error.message}\n`); process.exitCode = 2; },
);
