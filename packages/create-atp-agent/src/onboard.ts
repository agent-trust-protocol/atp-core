#!/usr/bin/env node
/**
 * ATP - onboard-agent
 * Interactive CLI wizard to onboard an agent with ATP and select a security profile.
 *
 * Usage: npx atp-onboard-agent
 */

import * as readline from 'readline';

const VERSION = '1.0.0';
const CYAN  = '\x1b[36m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BOLD  = '\x1b[1m';
const DIM   = '\x1b[2m';
const RESET = '\x1b[0m';

// ---------------------------------------------------------------------------
// Built-in profiles (mirrored from atp-profiles)
// ---------------------------------------------------------------------------

interface ProfileChoice {
  id: string;
  name: string;
  description: string;
}

const PROFILES: ProfileChoice[] = [
  { id: 'safe-default',      name: 'Safe Default',       description: 'Conservative: limited tools, strong auditing' },
  { id: 'dev-mode',          name: 'Dev Mode',           description: 'Permissive: most tools allowed, minimal restrictions' },
  { id: 'enterprise-locked', name: 'Enterprise Locked',  description: 'Maximum security: strict controls, full audit' },
  { id: 'openclaw-sandbox',  name: 'OpenClaw Sandbox',   description: 'Sandbox for OpenClaw/NemoClaw agents' },
];

const RUNTIMES = ['openclaw', 'mcp', 'langchain', 'custom'] as const;
const ENVIRONMENTS = ['dev', 'staging', 'prod'] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function banner(): void {
  console.log(`\n${CYAN}${BOLD} ATP - Agent Trust Protocol${RESET}`);
  console.log(` ${DIM}Onboard Agent CLI v${VERSION}${RESET}\n`);
}

function ok(msg: string): void {
  console.log(` ${GREEN}\u2713${RESET} ${msg}`);
}

function hint(msg: string): void {
  console.log(` ${YELLOW}\u2192${RESET} ${msg}`);
}

function createRl(): readline.Interface {
  return readline.createInterface({ input: process.stdin, output: process.stdout });
}

async function askInput(prompt: string, fallback = ''): Promise<string> {
  const rl = createRl();
  return new Promise((resolve) => {
    rl.question(` ${prompt} `, (ans) => {
      rl.close();
      resolve(ans.trim() || fallback);
    });
  });
}

async function askChoice<T extends string>(prompt: string, choices: { value: T; label: string }[]): Promise<T> {
  console.log(` ${prompt}`);
  choices.forEach((c, i) => {
    console.log(`   ${DIM}${i + 1})${RESET} ${c.label}`);
  });

  const rl = createRl();
  return new Promise((resolve) => {
    const ask = () => {
      rl.question(`\n  Enter number (1-${choices.length}): `, (ans) => {
        const idx = parseInt(ans.trim(), 10) - 1;
        if (idx >= 0 && idx < choices.length) {
          rl.close();
          resolve(choices[idx].value);
        } else {
          ask();
        }
      });
    };
    ask();
  });
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  banner();

  // Step 1: Runtime
  const runtime = await askChoice('Select runtime:', RUNTIMES.map((r) => ({ value: r, label: r })));

  // Step 2: Agent name + environment
  const name = await askInput('? Agent name: \u203a', 'MyAgent');

  const environment = await askChoice('Select environment:', ENVIRONMENTS.map((e) => ({ value: e, label: e })));

  // Step 3: Security profile
  const profileChoices = PROFILES.map((p) => ({
    value: p.id,
    label: `${p.name} ${DIM}(${p.id})${RESET} - ${p.description}`,
  }));
  const profileId = await askChoice('Select ATP security profile:', profileChoices);

  // Summary
  console.log();
  ok('Agent onboarded with ATP');
  console.log();
  console.log(`  ${BOLD}Runtime:${RESET}     ${runtime}`);
  console.log(`  ${BOLD}Name:${RESET}        ${name}`);
  console.log(`  ${BOLD}Environment:${RESET} ${environment}`);
  console.log(`  ${BOLD}Profile:${RESET}     ${profileId}`);

  const agentId = `agent-${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now().toString(36)}`;
  const did = `did:atp:${agentId}`;

  console.log(`  ${BOLD}Agent ID:${RESET}    ${DIM}${agentId}${RESET}`);
  console.log(`  ${BOLD}DID:${RESET}         ${DIM}${did}${RESET}`);
  console.log();

  hint('Use this profile in your code:');
  console.log();
  console.log(`  ${DIM}import { ATPClient } from 'atp-sdk';${RESET}`);
  console.log(`  ${DIM}const client = new ATPClient({ baseUrl: '...', profileId: '${profileId}' });${RESET}`);
  console.log();
  hint('Or visit the web onboarding wizard at /onboard/agent');
  console.log();
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
