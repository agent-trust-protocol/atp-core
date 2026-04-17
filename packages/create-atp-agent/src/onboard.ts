#!/usr/bin/env node
import chalk from 'chalk';
import { Command } from 'commander';
import { startOnboardingDashboard } from './serve-dashboard.js';

const program = new Command();

program
  .name('atp-onboard-agent')
  .description('Launch the ATP onboarding dashboard in your browser')
  .option('--no-open', 'Do not launch the system browser')
  .option('-p, --port <port>', 'Port to serve on (default 3456)', (v) => Number.parseInt(v, 10))
  .action(async function (this: Command) {
    const opts = this.opts<{ noOpen?: boolean; port?: number }>();
    const openBrowser =
      !opts.noOpen && process.env.CREATE_ATP_AGENT_NO_OPEN !== '1';

    console.log(chalk.blue('🛡️  Agent Trust Protocol — onboard-agent\n'));
    await startOnboardingDashboard({ openBrowser, port: opts.port });
  });

program.parse();
