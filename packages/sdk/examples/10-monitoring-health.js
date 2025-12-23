// Monitoring & Health Checks Example
// Run with: node packages/sdk/examples/10-monitoring-health.js
//
// This example demonstrates:
// 1. Testing connectivity to all ATP services
// 2. Getting gateway health status
// 3. Checking service-specific health endpoints
// 4. Monitoring connection statistics

import { ATPClient, createQuickConfig } from 'atp-sdk';

async function main() {
  console.log('🏥 ATP SDK - Health & Monitoring Example\n');

  // Create client with local services (default)
  const config = createQuickConfig('http://localhost');
  const client = new ATPClient(config);

  try {
    // 1. Test connectivity to all services
    console.log('1️⃣ Testing connectivity to all ATP services...');
    const connectivity = await client.testConnectivity();
    
    console.log('\n📊 Connectivity Results:');
    console.log(`   Identity Service: ${connectivity.identity ? '✅' : '❌'}`);
    console.log(`   Credentials Service: ${connectivity.credentials ? '✅' : '❌'}`);
    console.log(`   Permissions Service: ${connectivity.permissions ? '✅' : '❌'}`);
    console.log(`   Audit Service: ${connectivity.audit ? '✅' : '❌'}`);
    console.log(`   Gateway Service: ${connectivity.gateway ? '✅' : '❌'}`);
    console.log(`   Overall: ${connectivity.overall ? '✅ All Healthy' : '❌ Some Services Down'}`);

    if (!connectivity.overall) {
      console.log('\n⚠️  Some services are not responding. Check docker-compose.yml or service URLs.');
      process.exitCode = 1;
      return;
    }

    // 2. Get detailed gateway health status
    console.log('\n2️⃣ Getting gateway health status...');
    try {
      const health = await client.gateway.getHealth();
      console.log('\n📈 Gateway Health:');
      console.log(`   Status: ${health.data?.status || 'unknown'}`);
      
      if (health.data?.services) {
        console.log('\n   Service Health:');
        Object.entries(health.data.services).forEach(([service, status]) => {
          const icon = status?.status === 'up' ? '✅' : '❌';
          console.log(`   ${icon} ${service}: ${status?.status || 'unknown'}`);
        });
      }
    } catch (error) {
      console.log(`   ⚠️  Could not fetch gateway health: ${error.message}`);
    }

    // 3. Get gateway status with load information
    console.log('\n3️⃣ Getting gateway status (with load info)...');
    try {
      const status = await client.gateway.getStatus();
      if (status.data) {
        console.log('\n📊 Gateway Status:');
        console.log(`   Status: ${status.data.status}`);
        console.log(`   Version: ${status.data.version || 'N/A'}`);
        
        if (status.data.load) {
          console.log('\n   Load Metrics:');
          console.log(`   CPU: ${status.data.load.cpu}%`);
          console.log(`   Memory: ${status.data.load.memory}%`);
          console.log(`   Connections: ${status.data.load.connections}`);
        }
      }
    } catch (error) {
      console.log(`   ⚠️  Could not fetch gateway status: ${error.message}`);
    }

    // 4. Get connection statistics
    console.log('\n4️⃣ Getting connection statistics...');
    try {
      const stats = await client.gateway.getConnectionStats();
      if (stats.data) {
        console.log('\n🔌 Connection Stats:');
        console.log(`   Total Connections: ${stats.data.totalConnections}`);
        console.log(`   Active Connections: ${stats.data.activeConnections}`);
        console.log(`   HTTP: ${stats.data.httpConnections}`);
        console.log(`   WebSocket: ${stats.data.wsConnections}`);
        console.log(`   TLS: ${stats.data.tlsConnections}`);
        
        if (stats.data.connectionsByService) {
          console.log('\n   By Service:');
          Object.entries(stats.data.connectionsByService).forEach(([service, count]) => {
            console.log(`   ${service}: ${count}`);
          });
        }
      }
    } catch (error) {
      console.log(`   ⚠️  Could not fetch connection stats: ${error.message}`);
    }

    // 5. Simple health check function for use in your app
    console.log('\n5️⃣ Example: Simple health check function...\n');
    console.log(`
// Add this to your Express/API health endpoint:
import { ATPClient, createQuickConfig } from 'atp-sdk';

export async function healthCheck(req, res) {
  const client = new ATPClient(createQuickConfig('http://localhost'));
  
  try {
    const connectivity = await client.testConnectivity();
    const isHealthy = connectivity.overall;
    
    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'degraded',
      services: connectivity,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
    `);

    console.log('\n✅ Monitoring example completed!\n');

  } catch (error) {
    console.error('\n❌ Monitoring example failed:', error.message);
    console.error('\nHint: Ensure ATP services are running:');
    console.error('   docker compose up -d');
    console.error('\nOr set environment variables:');
    console.error('   ATP_GATEWAY_URL=http://your-gateway:3000');
    console.error('   ATP_IDENTITY_URL=http://your-identity:3001');
    console.error('   ... (see docs for all service URLs)');
    process.exitCode = 1;
  }
}

main();

