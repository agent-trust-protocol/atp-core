// ATP™ Example Agent - Basic Integration
// =====================================

import fetch from 'node-fetch';

const agentConfig = {
  name: 'My First ATP Agent',
  type: 'assistant',
  capabilities: ['chat', 'analysis']
};

const baseUrls = {
  identity: 'http://localhost:3001',
  gateway: 'http://localhost:3000',
  audit: 'http://localhost:3004'
};

// Example 1: Register Agent Identity
async function registerAgent() {
  try {
    const response = await fetch(`${baseUrls.identity}/identity/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        publicKey: 'example-public-key-' + Date.now(),
        metadata: agentConfig
      })
    });

    const result = await response.json();
    console.log('✅ Agent registered:', result.data.did);
    return result.data;
  } catch (error) {
    console.error('❌ Registration failed:', error.message);
  }
}

// Example 2: Log Agent Activity
async function logActivity(agentDid, action, details) {
  try {
    const response = await fetch(`${baseUrls.audit}/audit/log`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source: 'example-agent',
        action: action,
        resource: 'agent-interaction',
        actor: agentDid,
        details: details
      })
    });

    const result = await response.json();
    console.log('✅ Activity logged:', result.event.id);
  } catch (error) {
    console.error('❌ Logging failed:', error.message);
  }
}

// Example 3: Check Gateway Status
async function checkGatewayStatus() {
  try {
    const response = await fetch(`${baseUrls.gateway}/health`);
    const result = await response.json();
    console.log('✅ Gateway status:', result.status);
    return result;
  } catch (error) {
    console.error('❌ Gateway check failed:', error.message);
  }
}

// Run example
async function runExample() {
  console.log('🚀 ATP™ Example Agent Starting...');
  
  // Check gateway
  await checkGatewayStatus();
  
  // Register agent
  const agent = await registerAgent();
  
  if (agent) {
    // Log some activities
    await logActivity(agent.did, 'agent-startup', { 
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    });
    
    await logActivity(agent.did, 'example-task', {
      task: 'demonstrate-atp-integration',
      duration: 1000,
      success: true
    });
    
    console.log('🎉 Example complete! Check audit logs for recorded activities.');
  }
}

// Export for use in other scripts
export { registerAgent, logActivity, checkGatewayStatus };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runExample();
}
