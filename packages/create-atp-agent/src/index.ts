#!/usr/bin/env node
import { execSync } from 'child_process';
import chalk from 'chalk';
import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import { startOnboardingDashboard } from './serve-dashboard';

const program = new Command();

program
  .name('create-atp-agent')
  .description('Create a new Agent Trust Protocol agent')
  .option('--dashboard-only', 'Only serve the embedded onboarding UI on port 3456 (no scaffold)')
  .option('--no-dashboard', 'After scaffolding, do not start the embedded onboarding UI')
  .option('--no-open', 'Do not launch the system browser for the onboarding UI')
  .option('--skip-install', 'Skip npm install after scaffolding')
  .argument('[project-name]', 'project directory', 'my-atp-agent')
  .action(async function (this: Command, projectName: string) {
    const opts = this.opts<{
      dashboardOnly?: boolean;
      noDashboard?: boolean;
      noOpen?: boolean;
      skipInstall?: boolean;
    }>();

    const openBrowser =
      !opts.noOpen && process.env.CREATE_ATP_AGENT_NO_OPEN !== '1';

    if (opts.dashboardOnly) {
      await startOnboardingDashboard({ openBrowser });
      return;
    }

    const finalName = projectName;
    if (!/^[a-z0-9-_]+$/.test(finalName)) {
      console.log(chalk.red(`✗ Invalid project name: ${finalName}`));
      process.exit(1);
    }

    const targetDir = path.resolve(process.cwd(), finalName);

    if (fs.existsSync(targetDir)) {
      console.log(chalk.red(`✗ Directory ${finalName} already exists`));
      process.exit(1);
    }

    const templateDir = path.join(__dirname, '../template');
    await fs.copy(templateDir, targetDir);

    const pkgPath = path.join(targetDir, 'package.json');
    const pkg = (await fs.readJson(pkgPath)) as Record<string, unknown>;
    pkg.name = finalName;

    // TypeScript only — JavaScript variant removed.
    await fs.remove(path.join(targetDir, 'agent.mjs'));
    pkg.scripts = {
      start: 'tsx agent.ts',
      dev: 'tsx watch agent.ts',
      build: 'tsc'
    };

    await fs.writeJson(pkgPath, pkg, { spaces: 2 });

    console.log(chalk.green('✓ ATP Agent project scaffolded'));

    if (!opts.skipInstall) {
      execSync('npm install', { cwd: targetDir, stdio: 'ignore' });
      console.log(chalk.green('✓ Dependencies installed'));
    }

    if (opts.noDashboard) {
      console.log(chalk.green('✓ To skip dashboard: npm start'));
      return;
    }

    await startOnboardingDashboard({
      openBrowser,
      mode: 'create',
      agentContext: {
        projectName: finalName,
        projectDir: targetDir,
        language: 'typescript',
        agentFile: 'agent.ts'
      },
      logLines: [
        '✓ Dashboard ready — complete setup in your browser',
        '✓ To skip dashboard: npm start'
      ]
    });
  });

program.parse();
