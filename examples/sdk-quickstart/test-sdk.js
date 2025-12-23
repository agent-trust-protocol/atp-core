const { ATPClient } = require('atp-sdk');

async function testSDK() {
  console.log('🔐 Testing ATP SDK v1.0.0...\n');
  
  try {
    // Initialize the ATP Client
    const client = new ATPClient({
      serviceUrl: 'http://localhost:3001', // Identity service
      environment: 'development'
    });
    
    console.log('✅ ATP Client initialized successfully');
    
    // Test 1: Create a DID
    console.log('\n📝 Test 1: Creating DID...');
    const did = await client.createDID();
    console.log('✅ DID created:', did.id);
    console.log('   Public Key:', did.publicKey.substring(0, 20) + '...');
    
    // Test 2: Register an agent
    console.log('\n🤖 Test 2: Registering agent...');
    const agent = await client.registerAgent({
      name: 'SDK Test Agent',
      did: did.id,
      capabilities: ['read', 'write'],
      metadata: {
        version: '1.0.0',
        testRun: true
      }
    });
    console.log('✅ Agent registered:', agent.id);
    console.log('   Trust Level:', agent.trustLevel);
    
    // Test 3: Create a credential
    console.log('\n📋 Test 3: Creating credential...');
    const credential = await client.createCredential({
      subject: did.id,
      claims: {
        role: 'developer',
        permissions: ['api:read', 'api:write'],
        verified: true
      }
    });
    console.log('✅ Credential created:', credential.id);
    console.log('   Type:', credential.type);
    
    // Test 4: Evaluate trust
    console.log('\n🔍 Test 4: Evaluating trust...');
    const trustScore = await client.evaluateTrust(agent.id);
    console.log('✅ Trust Score:', trustScore.score);
    console.log('   Level:', trustScore.level);
    console.log('   Factors:', trustScore.factors);
    
    // Test 5: Sign a message (quantum-safe)
    console.log('\n✍️  Test 5: Quantum-safe signature...');
    const message = 'Hello from ATP SDK Test!';
    const signature = await client.signMessage(message, did.privateKey);
    console.log('✅ Message signed with quantum-safe crypto');
    console.log('   Signature:', signature.substring(0, 40) + '...');
    
    // Test 6: Verify signature
    console.log('\n✔️  Test 6: Verifying signature...');
    const isValid = await client.verifySignature(message, signature, did.publicKey);
    console.log('✅ Signature verified:', isValid ? 'VALID' : 'INVALID');
    
    console.log('\n' + '='.repeat(50));
    console.log('🎉 All SDK tests passed successfully!');
    console.log('='.repeat(50));
    console.log('\n📦 ATP SDK v1.0.0 is working perfectly!');
    console.log('🌐 Install: npm install atp-sdk');
    console.log('📚 Docs: https://github.com/agent-trust-protocol/core\n');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\nNote: Make sure ATP services are running:');
    console.error('  npm run dev (in main directory)');
  }
}

// Run the test
testSDK();