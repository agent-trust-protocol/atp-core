#!/usr/bin/env node
import { createInterface } from 'node:readline';
import { pathToFileURL } from 'node:url';

export const COMMANDS = Object.freeze({
  help: 'Show supported preview commands',
  status: 'Display local session status',
  agents: 'Describe agent discovery availability',
  connect: 'Explain connection requirements',
  guardian: 'Explain Guardian integration status',
  mandates: 'Explain mandate integration status',
  audit: 'Explain audit integration status',
  exit: 'Leave interactive mode'
});

export function respond(raw) {
  const input = String(raw ?? '').trim();
  const command = input.replace(/^\//, '').toLowerCase();
  if (!command || command === 'help') return Object.entries(COMMANDS).map(([k,v]) => `/${k.padEnd(10)} ${v}`).join('\n');
  if (command === 'exit' || command === 'quit') return null;
  if (command === 'status') return 'ATP CLI preview · local/read-only · no Studio session · no agent credentials loaded';
  if (command === 'agents') return 'Agent discovery is not connected in this preview. No agents have been inspected.';
  if (command === 'connect') return 'Connection planning is not yet implemented. No pairing, identity proof, or authorization has been performed.';
  if (command === 'guardian') return 'Guardian is not connected. No policy decision has been requested or issued.';
  if (command === 'mandates') return 'Mandate management is not connected. No mandate has been created or modified.';
  if (command === 'audit') return 'Audit backend is not connected. No verified audit records have been read.';
  return 'Unsupported preview input. Type /help to see available commands. No action was executed.';
}

export async function main(args = process.argv.slice(2), input = process.stdin, output = process.stdout) {
  if (args.includes('--help') || args.includes('-h')) {
    output.write('ATP CLI interactive preview\nUsage: atp [--help | --version]\nRun atp without arguments in a terminal to start interactive mode.\n');
    return 0;
  }
  if (args.includes('--version')) { output.write('0.0.0-development\n'); return 0; }
  if (args.length) { output.write('Unknown arguments. Use atp --help.\n'); return 2; }
  if (!input.isTTY || !output.isTTY) {
    output.write('Interactive mode requires a TTY. Use atp --help for usage.\n');
    return 2;
  }
  output.write('◆ ATP CLI · Interactive Developer Preview\nRead-only local shell. No identity, mandate, or authorization is implied.\nType /help for commands.\n');
  const rl = createInterface({ input, output, prompt: 'atp ❯ ' });
  rl.prompt();
  for await (const line of rl) {
    const response = respond(line);
    if (response === null) break;
    output.write(response + '\n');
    rl.prompt();
  }
  rl.close();
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().then(code => { process.exitCode = code; }).catch(error => {
    console.error(error);
    process.exitCode = 1;
  });
}
