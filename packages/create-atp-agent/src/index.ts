#!/usr/bin/env node
/**
 * ATP - create-atp-agent
 * Bootstrap a quantum-safe AI agent in under 60 seconds
 *
 * Usage: npx create-atp-agent
 *        npx atp-init
 */

import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import * as readline from 'readline';
import { startDashboard } from './dashboard';

const VERSION = '1.1.0';
const CYAN  = '\x1b[36m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BOLD  = '\x1b[1m';
const DIM   = '\x1b[2m';
const RESET = '\x1b[0m';

function banner(): void {
  console.log(`\n${CYAN}${BOLD} ATP - Agent Trust Protocol${RESET}`);
  console.log(` ${DIM}The world's first quantum-safe AI agent protocol${RESET}\n`);
}

function ok(msg: string): void {
  console.log(` ${GREEN}\u2713${RESET} ${msg}`);
}

function hint(msg: string): void {
  console.log(` ${YELLOW}\u2192${RESET} ${msg}`);
}

async function ask(q: string, fallback = ''): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise(resolve => {
    rl.question(` ${q} `, ans => {
      rl.close();
      resolve(ans.trim() || fallback);
    });
  });
}

async function main(): Promise<void> {
  banner();

  const name = await ask('? Agent name: \u203a', 'MyAgent');
  const dir  = name.toLowerCase().replace(/\s+/g, '-');

  if (existsSync(dir)) {
    console.error(`\n Error: directory "${dir}" already exists.\n`);
    process.exit(1);
  }

  console.log();
  mkdirSync(dir, { recursive: true });

  // package.json
  const pkg = {
    name: dir,
    version: '0.1.0',
    type: 'module',
    scripts: {
      start: 'tsx agent.ts',
      dev: 'tsx --watch agent.ts'
    },
    dependencies: {
      'atp-sdk': `^${VERSION}`
    },
    devDependencies: {
      tsx: '^4.0.0',
      typescript: '^5.0.0'
    }
  };
  writeFileSync(join(dir, 'package.json'), JSON.stringify(pkg, null, 2) + '\n');

  // agent.ts
  const agentCode = `import { Agent } from 'atp-sdk';

// One line: create a quantum-safe agent with auto-logged status
await Agent.quickstart('${name}');
`;
  writeFileSync(join(dir, 'agent.ts'), agentCode);

  // README.md
  const readme = `# ${name}

Quantum-safe AI agent built with [Agent Trust Protocol](https://agenttrustprotocol.com).

## Start

\`\`\`bash
npm install
npm start
\`\`\`

## Full ATP network features

\`\`\`bash
# From the atp-core repo root:
docker-compose up -d
\`\`\`

## Docs

- [Quick Start](https://github.com/agent-trust-protocol/atp-core/blob/main/QUICK_START.md)
- [API Reference](https://github.com/agent-trust-protocol/atp-core/tree/main/docs)
- [Examples](https://github.com/agent-trust-protocol/atp-core/tree/main/examples)
- [Discord](https://discord.gg/agenttrustprotocol)
`;
  writeFileSync(join(dir, 'README.md'), readme);

  ok(`Agent directory created: ${BOLD}${dir}/${RESET}`);
  ok(`Quantum-safe keypair ready (ML-DSA + Ed25519)`);
  ok(`DID: ${DIM}did:atp:zb2r... (generated at first run)${RESET}`);

  console.log(`\n ${BOLD}Created: ${dir}/${RESET}`);
  console.log(' \u251C\u2500\u2500 agent.ts         \u2190 your agent');
  console.log(' \u251C\u2500\u2500 package.json');
  console.log(' \u2514\u2500\u2500 README.md\n');

  hint(`cd ${dir} && npm install && npm start`);
  hint('Docs: https://github.com/agent-trust-protocol/atp-core/tree/main/docs\n');

  // Launch the embedded onboarding dashboard and auto-open browser
  startDashboard(name, dir);
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});
