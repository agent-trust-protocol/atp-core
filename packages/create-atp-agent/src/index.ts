#!/usr/bin/env node
import { execSync } from 'child_process';
import chalk from 'chalk';
import { Command } from 'commander';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import path from 'path';
import { fileURLToPath } from 'url';
import { startOnboardingDashboard } from './serve-dashboard.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const program = new Command();

program
  .name('create-atp-agent')
  .description('Create a new Agent Trust Protocol agent')
  .option('--dashboard-only', 'Only serve the embedded onboarding UI on port 3456 (no scaffold)')
  .option('--no-dashboard', 'After scaffolding, do not start the embedded onboarding UI')
  .option('--no-open', 'Do not launch the system browser for the onboarding UI')
  .argument('[project-name]', 'project directory')
  .action(async function (this: Command, projectName?: string) {
    const opts = this.opts<{
      dashboardOnly?: boolean;
      noDashboard?: boolean;
      noOpen?: boolean;
    }>();

    const openBrowser =
      !opts.noOpen && process.env.CREATE_ATP_AGENT_NO_OPEN !== '1';

    console.log(chalk.blue('🛡️  Agent Trust Protocol — create-atp-agent\n'));

    if (opts.dashboardOnly) {
      console.log(chalk.gray('Starting embedded onboarding dashboard (Ctrl+C to stop)…\n'));
      await startOnboardingDashboard({ openBrowser });
      return;
    }

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Project name:',
        default: projectName || 'my-atp-agent',
        validate: (input: string) =>
          /^[a-z0-9-_]+$/.test(input) || 'Use lowercase letters, numbers, hyphens, and underscores only'
      },
      {
        type: 'list',
        name: 'lang',
        message: 'Language:',
        choices: ['TypeScript', 'JavaScript'],
        default: 'TypeScript'
      },
      {
        type: 'list',
        name: 'profile',
        message: 'Security profile:',
        choices: [
          { name: 'safe-default (recommended)', value: 'safe-default' },
          { name: 'dev-mode (all tools)', value: 'dev-mode' },
          { name: 'enterprise-locked', value: 'enterprise-locked' }
        ],
        default: 'safe-default'
      },
      {
        type: 'confirm',
        name: 'install',
        message: 'Install dependencies now?',
        default: true
      }
    ]);

    const targetDir = path.resolve(process.cwd(), answers.name as string);

    if (fs.existsSync(targetDir)) {
      console.log(chalk.red(`\n✗ Directory ${answers.name} already exists`));
      process.exit(1);
    }

    const templateDir = path.join(__dirname, '../template');
    await fs.copy(templateDir, targetDir);

    const pkgPath = path.join(targetDir, 'package.json');
    const pkg = (await fs.readJson(pkgPath)) as Record<string, unknown>;
    pkg.name = answers.name;

    const lang = answers.lang as string;
    if (lang === 'JavaScript') {
      await fs.remove(path.join(targetDir, 'agent.ts'));
      pkg.scripts = {
        start: 'node agent.mjs',
        dev: 'node --watch agent.mjs'
      };
    } else {
      await fs.remove(path.join(targetDir, 'agent.mjs'));
      pkg.scripts = {
        start: 'tsx agent.ts',
        dev: 'tsx watch agent.ts',
        build: 'tsc'
      };
    }

    await fs.writeJson(pkgPath, pkg, { spaces: 2 });

    await fs.writeJson(
      path.join(targetDir, '.atp.json'),
      {
        profile: answers.profile,
        created: new Date().toISOString()
      },
      { spaces: 2 }
    );

    console.log(chalk.green(`\n✓ Created ${answers.name}`));

    if (answers.install) {
      console.log(chalk.gray('\nInstalling dependencies...'));
      execSync('npm install', { cwd: targetDir, stdio: 'inherit' });
    }

    console.log(chalk.blue('\n🚀 Next steps:'));
    console.log(`  cd ${answers.name}`);
    if (!answers.install) console.log('  npm install');
    console.log('  npm start\n');

    console.log(chalk.gray('Your agent is quantum-safe and ready.'));
    console.log(chalk.gray(`Profile: ${answers.profile}`));

    if (!opts.noDashboard) {
      console.log(
        openBrowser
          ? chalk.blue('\nOpening local onboarding dashboard…')
          : chalk.blue('\nStarting local onboarding dashboard (browser launch disabled)…')
      );
      await startOnboardingDashboard({ openBrowser });
    }
  });

program.parse();
