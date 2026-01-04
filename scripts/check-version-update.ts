#!/usr/bin/env node
/**
 * Version Update Checker
 * 
 * Checks if SDK version needs updating based on protocol and agent changes.
 * Run this script before releasing a new SDK version.
 * 
 * Usage:
 *   npm run check-version
 *   npm run check-version -- --protocol mcp:2024-12-01:breaking
 *   npm run check-version -- --agent simple-agent:1.2.0:feature
 */

import { VersionManager, Protocol } from '../packages/sdk/src/utils/version-manager.js';
import { readFileSync } from 'fs';
import { join } from 'path';

const versionManager = VersionManager.getInstance();

interface CheckOptions {
  protocolChanges?: Map<Protocol, { version: string; breaking: boolean }>;
  agentChanges?: Map<string, { version: string; breaking: boolean }>;
  checkPackageJson?: boolean;
}

/**
 * Parse command line arguments
 */
function parseArgs(): CheckOptions {
  const args = process.argv.slice(2);
  const options: CheckOptions = {
    protocolChanges: new Map(),
    agentChanges: new Map(),
    checkPackageJson: true
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    if (arg === '--protocol' && args[i + 1]) {
      const [protocol, version, type] = args[i + 1].split(':');
      options.protocolChanges!.set(
        protocol.toUpperCase() as Protocol,
        {
          version,
          breaking: type === 'breaking'
        }
      );
      i++;
    } else if (arg === '--agent' && args[i + 1]) {
      const [agentType, version, type] = args[i + 1].split(':');
      options.agentChanges!.set(
        agentType,
        {
          version,
          breaking: type === 'breaking'
        }
      );
      i++;
    } else if (arg === '--no-package-check') {
      options.checkPackageJson = false;
    }
  }

  return options;
}

/**
 * Check current package.json version
 */
function getCurrentPackageVersion(): string {
  try {
    const packagePath = join(process.cwd(), 'packages/sdk/package.json');
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf-8'));
    return packageJson.version;
  } catch (error) {
    console.error('❌ Could not read package.json:', error);
    return '1.1.0'; // fallback
  }
}

/**
 * Main check function
 */
function main() {
  console.log('🔍 ATP SDK Version Update Checker\n');
  console.log('=' .repeat(60));

  const options = parseArgs();
  const currentVersion = getCurrentPackageVersion();

  console.log(`\n📦 Current SDK Version: ${currentVersion}`);
  console.log(`📅 Check Date: ${new Date().toISOString()}\n`);

  // Generate current version report
  const report = versionManager.generateVersionReport();
  console.log('📊 Current Version Status:');
  console.log(`   ${report.summary}\n`);

  // Check if update is needed
  const updateCheck = versionManager.checkSDKVersionUpdate(
    options.protocolChanges,
    options.agentChanges
  );

  if (updateCheck.needsUpdate) {
    console.log('⚠️  SDK VERSION UPDATE REQUIRED\n');
    console.log(`📈 Recommended Version: ${updateCheck.recommendedVersion}`);
    console.log(`📝 Change Type: ${updateCheck.changeType.toUpperCase()}\n`);
    console.log('📋 Reasons:');
    updateCheck.reasons.forEach((reason, index) => {
      console.log(`   ${index + 1}. ${reason}`);
    });

    console.log('\n🔧 Action Required:');
    console.log(`   1. Update packages/sdk/package.json version to ${updateCheck.recommendedVersion}`);
    console.log(`   2. Update packages/sdk/CHANGELOG.md with new changes`);
    console.log(`   3. Update version in packages/sdk/src/utils/version-manager.ts`);
    console.log(`   4. Run tests: npm test --workspace=packages/sdk`);
    console.log(`   5. Build: npm run build --workspace=packages/sdk`);
    console.log(`   6. Publish: npm publish --workspace=packages/sdk`);

    process.exit(1); // Exit with error to indicate update needed
  } else {
    console.log('✅ No SDK version update required');
    console.log('   All protocol and agent versions are compatible with current SDK version.\n');

    // Show current versions
    console.log('📋 Current Protocol Versions:');
    const protocols = versionManager.getAllProtocolVersions();
    protocols.forEach((pv, protocol) => {
      console.log(`   ${protocol}: ${pv.version} (SDK ${pv.sdkVersion})`);
    });

    console.log('\n📋 Current Agent Versions:');
    const agents = versionManager.getAllAgentVersions();
    agents.forEach((av) => {
      console.log(`   ${av.agentType}: ${av.version} (SDK ${av.sdkVersion})`);
    });

    process.exit(0);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main };

