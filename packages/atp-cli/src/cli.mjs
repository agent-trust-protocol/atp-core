#!/usr/bin/env node
import { createInterface } from 'node:readline';
import { describePlan } from './intent.mjs';
import { askModel, providerConfig } from './providers.mjs';
import { inspectCore } from './core-readonly.mjs';
import { pathToFileURL } from 'node:url';

export const COMMANDS = Object.freeze({
  help: 'Show supported preview commands',
  model: 'Show selected LLM provider without a network request',
  ask: 'Ask configured model for read-only assistance (network opt-in for hosted)',
  status: 'Display local session status',
  trust: 'Read local ATP registry trust record for DID',
  grants: 'Read local ATP permission grants for DID',
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
  if (command === 'model') { try { const p = providerConfig(); return `Selected model: ${p.model} (${p.category}). No inference request sent.`; } catch (error) { return `Provider configuration error: ${error.message}`; } }
  if (command === 'ask') return 'Usage: /ask <read-only question>. Model output is untrusted and cannot execute actions.';
  if (command === 'trust' || command === 'grants') return `Usage: /${command} <DID>. Local read-only connection requires ATP_CORE_READ_ONLY=1.`;
  if (command === 'status') return 'ATP CLI preview · local/read-only · no Studio session · no agent credentials loaded';
  if (command === 'agents') return 'Local registry lookup available in interactive mode when ATP_CORE_READ_ONLY=1; no identities are cryptographically verified by registry lookup.';
  if (command === 'connect') return 'Connection planning is not yet implemented. No pairing, identity proof, or authorization has been performed.';
  if (command === 'guardian') return 'Guardian is not connected. No policy decision has been requested or issued.';
  if (command === 'mandates') return 'Mandate management is not connected. No mandate has been created or modified.';
  if (command === 'audit') return 'Audit backend is not connected. No verified audit records have been read.';
  if (input.startsWith('/')) return 'Unknown slash command. Type /help. No action was executed.';
  return describePlan(input);
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
  output.write('◆ ATP CLI · Interactive Developer Preview\nRead-only local shell. No identity, mandate, or authorization is implied.\nType /help or describe an agent trust task.\n');
  const rl = createInterface({ input, output, prompt: 'atp ❯ ' });
  rl.prompt();
  for await (const line of rl) {
    const trimmed = line.trim();
    const lookup = /^\/(agents|trust|grants)(?:\s+(.*))?$/.exec(trimmed);
    if (lookup) {
      try { output.write(await inspectCore(lookup[1], lookup[2]) + '\\n'); }
      catch (error) { output.write('ATP inspection unavailable: ' + error.message + '\\n'); }
      rl.prompt();
      continue;
    }
    if (line.trim().startsWith('/ask ')) {
      const question = line.trim().slice(5).trim();
      try {
        const answer = await askModel(question);
        output.write(`[${answer.category} · ${answer.model} · unverified model response]\n${answer.content}\n`);
      } catch (error) {
        output.write(`Model unavailable: ${error.message}\n`);
      }
      rl.prompt();
      continue;
    }
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
