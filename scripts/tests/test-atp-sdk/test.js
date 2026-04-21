// Test ATP SDK
import { Agent } from 'atp-sdk';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function test() {
  try {
    console.log('🚀 Testing ATP SDK...\n');
    
    // Check installed SDK version
    try {
      const sdkPath = join(__dirname, 'node_modules', 'atp-sdk', 'package.json');
      const sdkPackage = JSON.parse(readFileSync(sdkPath, 'utf8'));
      console.log('📦 Installed SDK Version:', sdkPackage.version);
    } catch (e) {
      console.log('📦 SDK Version: Could not determine');
    }
    
    console.log('\n--- Creating Agent ---');
    // The SDK should work even if services aren't running
    // It will create a DID and quantum-safe keys locally
    try {
      const agent = await Agent.create('TestBot');
      console.log('✅ Agent created successfully!');
      console.log('DID:', agent.getDID());
      console.log('Quantum-safe:', agent.isQuantumSafe());
      
      // Test basic functionality
      console.log('\n--- Testing Basic Features ---');
      const did = agent.getDID();
      console.log('✅ DID generated:', did.substring(0, 30) + '...');
      console.log('✅ Quantum-safe:', agent.isQuantumSafe() ? 'Yes' : 'No');
    } catch (error) {
      // If initialization fails, the agent should still have a DID
      // This is a known issue - the SDK needs to handle offline mode better
      console.log('\n⚠️  Note: Services not running, but agent should still work');
      console.log('Error:', error.message);
      console.log('\n💡 The SDK version 1.1.0 will handle this better.');
      console.log('   Current npm version: 1.0.1 (needs update)');
      throw error;
    }
    
    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

test();

