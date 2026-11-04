#!/usr/bin/env node
import chalk from 'chalk';
import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import { startOnboardingDashboard } from './serve-dashboard.js';

const program = new Command();

program
  .name('atp-stamp-agent')
  .description('Configure an existing agent project for ATP SDK integration')
  .option('--no-open', 'Do not launch the system browser')
  .option('--no-dashboard', 'Do not start the embedded dashboard')
  .option('-p, --port <port>', 'Port to serve on (default 3456)', (v) => Number.parseInt(v, 10))
  .action(async function (this: Command) {
    const opts = this.opts<{
      open: boolean;
      dashboard: boolean;
      port?: number;
    }>();

    const openBrowser =
      opts.open && process.env.CREATE_ATP_AGENT_NO_OPEN !== '1';

    const projectDir = process.cwd();
    const pkgPath = path.join(projectDir, 'package.json');

    let projectName = path.basename(projectDir);
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = (await fs.readJson(pkgPath)) as { name?: string };
        if (pkg.name) projectName = pkg.name;
      } catch {
        // fall back to directory name
      }
    }

    console.log(chalk.green('✓ Detected existing agent project'));

    if (!opts.dashboard) {
      console.log(chalk.blue('No files changed. Install atp-sdk and integrate it in your agent. npx atp-stamp-agent opens the local config UI.'));
      return;
    }

    console.log(chalk.green('✓ Launching ATP stamping dashboard'));

    await startOnboardingDashboard({
      openBrowser,
      port: opts.port,
      mode: 'stamp',
      agentContext: {
        projectName,
        projectDir,
        language: 'typescript',
        agentFile: 'agent.ts'
      },
      logLines: ['Configure a local profile in the browser; integrate the SDK in your application.']
    });
  });

program.parse();
