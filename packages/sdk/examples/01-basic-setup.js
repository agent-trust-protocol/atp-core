/**
 * Basic SDK Setup Example
 * 
 * This example shows how to set up the ATP™ SDK with basic configuration
 * and test connectivity to all services.
 */

import { ATPClient, createQuickConfig } from '@atp/sdk';

async function basicSetupExample() {
  console.log('🚀 ATP™ SDK Basic Setup Example\n');

  // Create basic configuration
  const config = createQuickConfig('http://localhost', {
    timeout: 10000,
    retries: 2
  });

  // Initialize ATP client
  const client = new ATPClient(config);

  console.log('📋 Configuration:');
  console.log(JSON.stringify(config, null, 2));
  console.log();

  // Test connectivity to all services
  console.log('🔍 Testing connectivity to all ATP services...');
  try {
    const connectivity = await client.testConnectivity();
    
    console.log('📊 Service Status:');
    console.log(`  Identity Service:    ${connectivity.identity ? '✅' : '❌'}`);
    console.log(`  Credentials Service: ${connectivity.credentials ? '✅' : '❌'}`);
    console.log(`  Permissions Service: ${connectivity.permissions ? '✅' : '❌'}`);
    console.log(`  Audit Service:       ${connectivity.audit ? '✅' : '❌'}`);
    console.log(`  Gateway Service:     ${connectivity.gateway ? '✅' : '❌'}`);
    console.log(`  Overall Status:      ${connectivity.overall ? '✅ All services healthy' : '❌ Some services unavailable'}`);

  } catch (error) {
    console.error('❌ Connectivity test failed:', error.message);
  }

  // Cleanup
  client.cleanup();
  console.log('\n✨ Basic setup example completed!');
}

// Run the example
if (import.meta.url === `file://${process.argv[1]}`) {
  basicSetupExample().catch(console.error);
}

export { basicSetupExample };