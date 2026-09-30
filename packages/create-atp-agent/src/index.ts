#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import chalk from 'chalk';
import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { startOnboardingDashboard } from './serve-dashboard.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const program = new Command();

program
  .name('create-atp-agent')
  .description('Scaffold an Agent Trust Protocol SDK project')
  .option('--dashboard-only', 'Only serve the embedded onboarding UI on port 3456 (no scaffold)')
  .option('--no-dashboard', 'After scaffolding, do not start the local configuration UI')
  .option('--no-open', 'Do not launch the system browser for the configuration UI')
  .option('--skip-install', 'Skip npm install after scaffolding')
  .argument('[project-name]', 'project directory', 'my-atp-agent')
  .action(async function (this: Command, projectName: string) {
    const opts = this.opts<{
      dashboardOnly?: boolean;
      dashboard: boolean;
      open: boolean;
      skipInstall?: boolean;
    }>();

    const openBrowser =
      opts.open && process.env.CREATE_ATP_AGENT_NO_OPEN !== '1';

    if (opts.dashboardOnly) {
      await startOnboardingDashboard({ openBrowser });
      return;
    }

    const finalName = projectName;
    if (!/^[a-z0-9][a-z0-9-_]*$/.test(finalName)) {
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

    // The published SDK 1.2.5 omits its index.d.ts from the npm tarball.
    // Scaffold runnable ESM until a typed SDK package is published.
    const starterPath = path.join(targetDir, 'agent.mjs');
    const starter = await fs.readFile(starterPath, 'utf8');
    await fs.writeFile(starterPath, starter.replaceAll('__AGENT_NAME__', finalName), 'utf8');
    pkg.scripts = { start: 'node agent.mjs' };

    await fs.writeJson(pkgPath, pkg, { spaces: 2 });

    console.log(chalk.green('✓ ATP Agent project scaffolded'));

    if (!opts.skipInstall) {
      console.log('Installing dependencies…');
      const result = spawnSync('npm', ['install'], { cwd: targetDir, stdio: 'inherit' });
      if (result.error || result.status !== 0) {
        console.error(chalk.yellow('Dependencies were not installed. Run npm install inside the new project.'));
        process.exitCode = 1;
        return;
      }
      console.log(chalk.green('✓ Dependencies installed'));
    }

    if (!opts.dashboard) {
      console.log(chalk.blue(`Next: cd ${finalName} && ${opts.skipInstall ? 'npm install && ' : ''}npm start`));
      return;
    }

    await startOnboardingDashboard({
      openBrowser,
      mode: 'create',
      agentContext: {
        projectName: finalName,
        projectDir: targetDir,
        language: 'javascript',
        agentFile: 'agent.mjs'
      },
      logLines: [
        'Local configuration UI ready (no identity or keys are issued here)',
        `Run the SDK: cd ${finalName} && ${opts.skipInstall ? 'npm install && ' : ''}npm start`
      ]
    });
  });

program.parse();
