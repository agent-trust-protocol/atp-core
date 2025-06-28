/**
 * ATP™ SDK Examples Runner
 * 
 * This script runs all the SDK examples in sequence or individually.
 * Use this to demonstrate the full capabilities of the ATP™ SDK.
 */

import { basicSetupExample } from './01-basic-setup.js';
import { identityManagementExample } from './02-identity-management.js';
import { verifiableCredentialsExample } from './03-verifiable-credentials.js';
import { permissionsAccessControlExample } from './04-permissions-and-access-control.js';
import { auditLoggingExample } from './05-audit-logging.js';
import { realTimeMonitoringExample } from './06-real-time-monitoring.js';
import { advancedUseCasesExample } from './07-advanced-use-cases.js';

const EXAMPLES = [
  { name: 'Basic Setup', fn: basicSetupExample, description: 'SDK initialization and connectivity testing' },
  { name: 'Identity Management', fn: identityManagementExample, description: 'DID creation, registration, and MFA setup' },
  { name: 'Verifiable Credentials', fn: verifiableCredentialsExample, description: 'Credential issuance, verification, and presentations' },
  { name: 'Permissions & Access Control', fn: permissionsAccessControlExample, description: 'Policy management and access control' },
  { name: 'Audit Logging', fn: auditLoggingExample, description: 'Comprehensive audit trail management' },
  { name: 'Real-time Monitoring', fn: realTimeMonitoringExample, description: 'WebSocket events and live monitoring' },
  { name: 'Advanced Use Cases', fn: advancedUseCasesExample, description: 'Complex workflows and patterns' }
];

async function runAllExamples() {
  console.log('🚀 ATP™ SDK Examples - Running All Examples\n');
  console.log('═'.repeat(60));
  
  for (let i = 0; i < EXAMPLES.length; i++) {
    const example = EXAMPLES[i];
    
    console.log(`\n📍 Example ${i + 1}/${EXAMPLES.length}: ${example.name}`);
    console.log(`📝 ${example.description}`);
    console.log('─'.repeat(60));
    
    try {
      await example.fn();
      console.log(`✅ Example ${i + 1} completed successfully!`);
    } catch (error) {
      console.error(`❌ Example ${i + 1} failed:`, error.message);
      
      // Continue with next example
      console.log('⏭️ Continuing with next example...');
    }
    
    if (i < EXAMPLES.length - 1) {
      console.log('\n⏱️ Waiting 2 seconds before next example...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log('\n═'.repeat(60));
  console.log('✨ All ATP™ SDK examples completed!');
  console.log('📚 Check individual example files for detailed implementation');
}

async function runExample(exampleNumber) {
  if (exampleNumber < 1 || exampleNumber > EXAMPLES.length) {
    console.error(`❌ Invalid example number. Choose 1-${EXAMPLES.length}`);
    return;
  }
  
  const example = EXAMPLES[exampleNumber - 1];
  
  console.log(`🚀 ATP™ SDK Examples - Running Example ${exampleNumber}`);
  console.log(`📍 ${example.name}: ${example.description}\n`);
  console.log('═'.repeat(60));
  
  try {
    await example.fn();
    console.log(`\n✅ Example ${exampleNumber} completed successfully!`);
  } catch (error) {
    console.error(`\n❌ Example ${exampleNumber} failed:`, error.message);
    process.exit(1);
  }
}

function showHelp() {
  console.log('🚀 ATP™ SDK Examples Runner\n');
  
  console.log('Usage:');
  console.log('  node examples/index.js [example-number]');
  console.log('  node examples/index.js --all');
  console.log('  node examples/index.js --help\n');
  
  console.log('Available Examples:');
  EXAMPLES.forEach((example, index) => {
    console.log(`  ${index + 1}. ${example.name}`);
    console.log(`     ${example.description}`);
  });
  
  console.log('\nExamples:');
  console.log('  node examples/index.js 1          # Run basic setup example');
  console.log('  node examples/index.js --all      # Run all examples');
  console.log('  node examples/index.js --help     # Show this help');
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showHelp();
    return;
  }
  
  if (args.includes('--all')) {
    await runAllExamples();
    return;
  }
  
  const exampleNumber = parseInt(args[0]);
  if (isNaN(exampleNumber)) {
    console.error('❌ Invalid argument. Use --help for usage information.');
    process.exit(1);
  }
  
  await runExample(exampleNumber);
}

// Export for programmatic use
export {
  runAllExamples,
  runExample,
  EXAMPLES
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}