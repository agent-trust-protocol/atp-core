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
  .option('--skip-install', 'Skip npm install after scaffolding')
  .argument('[project-name]', 'project directory')
  .action(async function (this: Command, projectName?: string) {
    const opts = this.opts<{
      dashboardOnly?: boolean;
      noDashboard?: boolean;
      noOpen?: boolean;
      skipInstall?: boolean;
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
        when: () => !projectName,
        validate: (input: string) =>
          /^[a-z0-9-_]+$/.test(input) || 'Use lowercase letters, numbers, hyphens, and underscores only'
      },
      {
        type: 'list',
        name: 'lang',
        message: 'Language:',
        choices: ['TypeScript', 'JavaScript'],
        default: 'TypeScript'
      }
    ]);

    const finalName = (answers.name as string | undefined) ?? projectName ?? 'my-atp-agent';
    if (!/^[a-z0-9-_]+$/.test(finalName)) {
      console.log(chalk.red(`\n✗ Invalid project name: ${finalName}`));
      process.exit(1);
    }

    const targetDir = path.resolve(process.cwd(), finalName);

    if (fs.existsSync(targetDir)) {
      console.log(chalk.red(`\n✗ Directory ${finalName} already exists`));
      process.exit(1);
    }

    const templateDir = path.join(__dirname, '../template');
    await fs.copy(templateDir, targetDir);

    const pkgPath = path.join(targetDir, 'package.json');
    const pkg = (await fs.readJson(pkgPath)) as Record<string, unknown>;
    pkg.name = finalName;

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

    // .atp.json is written later by the dashboard onboarding step once the
    // user picks a security profile. Placeholder lets the agent run offline.
    await fs.writeJson(
      path.join(targetDir, '.atp.json'),
      {
        profile: 'safe-default',
        pending: true,
        created: new Date().toISOString()
      },
      { spaces: 2 }
    );

    console.log(chalk.green(`\n✓ Created ${finalName}`));

    if (!opts.skipInstall) {
      console.log(chalk.gray('\nInstalling dependencies...'));
      execSync('npm install', { cwd: targetDir, stdio: 'inherit' });
    }

    if (opts.noDashboard) {
      console.log(chalk.blue('\n🚀 Next steps:'));
      console.log(`  cd ${finalName}`);
      if (opts.skipInstall) console.log('  npm install');
      console.log('  npm start\n');
      console.log(chalk.gray('Tip: run `npx atp-onboard-agent` to pick a security profile later.'));
      return;
    }

    const agentFile = lang === 'JavaScript' ? 'agent.mjs' : 'agent.ts';
    console.log(
      openBrowser
        ? chalk.blue('\n✨ Launching onboarding dashboard…')
        : chalk.blue('\n✨ Starting onboarding dashboard (browser launch disabled)…')
    );
    console.log(chalk.gray(`Finish setup in your browser, then: cd ${finalName} && npm start\n`));

    await startOnboardingDashboard({
      openBrowser,
      agentContext: {
        projectName: finalName,
        projectDir: targetDir,
        language: lang === 'JavaScript' ? 'javascript' : 'typescript',
        agentFile
      }
    });
  });

program.parse();
