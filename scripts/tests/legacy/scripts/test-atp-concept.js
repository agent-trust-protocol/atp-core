#!/usr/bin/env node

/**
 * Agent Trust Protocol (ATP) - Concept Demonstration
 * 
 * This script demonstrates the core ATP concepts without requiring 
 * the full service infrastructure to be running.
 */

console.log('🚀 Agent Trust Protocol (ATP) - Concept Demo');
console.log('=' .repeat(50));

// Simulate DID generation
function generateMockDID() {
  const randomId = Math.random().toString(36).substring(2, 15);
  return `did:key:z6Mk${randomId}`;
}

// Simulate agents
const weatherAgent = {
  did: generateMockDID(),
  name: 'WeatherAgent',
  capabilities: ['weather:read', 'weather:forecast'],
  data: {
    'london': { temp: 15, humidity: 80, conditions: 'cloudy' },
    'paris': { temp: 18, humidity: 65, conditions: 'sunny' },
    'tokyo': { temp: 22, humidity: 90, conditions: 'rainy' }
  }
};

const calculatorAgent = {
  did: generateMockDID(),
  name: 'CalculatorAgent', 
  capabilities: ['math:basic', 'math:advanced'],
  operations: ['add', 'subtract', 'multiply', 'divide', 'sqrt', 'power']
};

const clientAgent = {
  did: generateMockDID(),
  name: 'ClientAgent'
};

console.log('\n📋 Registered Agents:');
console.log(`1. ${weatherAgent.name}: ${weatherAgent.did}`);
console.log(`2. ${calculatorAgent.name}: ${calculatorAgent.did}`);
console.log(`3. ${clientAgent.name}: ${clientAgent.did}`);

// Simulate permission granting
console.log('\n🔑 Permission Granting Phase:');
console.log(`${weatherAgent.name} grants weather:london read access to ${clientAgent.name}`);
console.log(`${calculatorAgent.name} grants math:basic access to ${clientAgent.name}`);

const permissions = new Map();
permissions.set(`${clientAgent.did}:weather:london`, {
  grantor: weatherAgent.did,
  scopes: ['read'],
  expiresAt: Date.now() + (60 * 60 * 1000), // 1 hour
  granted: Date.now()
});

permissions.set(`${clientAgent.did}:math:basic`, {
  grantor: calculatorAgent.did,
  scopes: ['execute'],
  expiresAt: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
  granted: Date.now()
});

// Simulate verifiable credential issuance
console.log('\n📜 Verifiable Credential Issuance:');

function issueCredential(issuer, subject, claims) {
  const credential = {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    id: `urn:uuid:${Math.random().toString(36)}`,
    type: ['VerifiableCredential', 'DataCredential'],
    issuer: issuer.did,
    issuanceDate: new Date().toISOString(),
    credentialSubject: {
      id: subject.did,
      ...claims
    },
    proof: {
      type: 'Ed25519Signature2020',
      created: new Date().toISOString(),
      proofValue: 'simulated_signature_' + Math.random().toString(36)
    }
  };
  
  console.log(`✅ ${issuer.name} issued credential to ${subject.name}`);
  console.log(`   Claims: ${JSON.stringify(claims, null, 2)}`);
  return credential;
}

// Client requests weather data
console.log('\n🌤️  Weather Data Request:');
const permissionKey = `${clientAgent.did}:weather:london`;
if (permissions.has(permissionKey)) {
  const perm = permissions.get(permissionKey);
  if (perm.expiresAt > Date.now()) {
    console.log('✅ Permission check passed');
    const weatherData = weatherAgent.data.london;
    const weatherCredential = issueCredential(weatherAgent, clientAgent, {
      city: 'london',
      ...weatherData,
      timestamp: new Date().toISOString()
    });
    console.log('🏆 Weather data delivered with verifiable credential');
  } else {
    console.log('❌ Permission expired');
  }
} else {
  console.log('❌ No permission found');
}

// Client requests calculation
console.log('\n🧮 Calculation Request:');
const mathPermKey = `${clientAgent.did}:math:basic`;
if (permissions.has(mathPermKey)) {
  console.log('✅ Permission check passed');
  const operation = 'add';
  const operands = [15, 27];
  const result = operands.reduce((sum, num) => sum + num, 0);
  
  const calcCredential = issueCredential(calculatorAgent, clientAgent, {
    operation,
    operands,
    result,
    timestamp: new Date().toISOString()
  });
  console.log('🏆 Calculation completed with verifiable credential');
  console.log(`   Result: ${operands.join(' + ')} = ${result}`);
} else {
  console.log('❌ No permission found');
}

// Simulate audit trail
console.log('\n📊 Audit Trail:');
const auditEvents = [
  { type: 'DID_CREATED', actor: weatherAgent.did, timestamp: Date.now() - 10000 },
  { type: 'DID_CREATED', actor: calculatorAgent.did, timestamp: Date.now() - 9000 },
  { type: 'DID_CREATED', actor: clientAgent.did, timestamp: Date.now() - 8000 },
  { type: 'PERMISSION_GRANTED', actor: weatherAgent.did, target: clientAgent.did, timestamp: Date.now() - 5000 },
  { type: 'PERMISSION_GRANTED', actor: calculatorAgent.did, target: clientAgent.did, timestamp: Date.now() - 4000 },
  { type: 'VC_ISSUED', actor: weatherAgent.did, target: clientAgent.did, timestamp: Date.now() - 2000 },
  { type: 'VC_ISSUED', actor: calculatorAgent.did, target: clientAgent.did, timestamp: Date.now() - 1000 }
];

auditEvents.forEach((event, i) => {
  console.log(`${i + 1}. ${event.type} - ${event.actor} ${event.target ? '→ ' + event.target : ''}`);
});

console.log('\n🎉 ATP Concept Demo Complete!');
console.log('\nKey Features Demonstrated:');
console.log('✓ Decentralized Identity (DID) for each agent');
console.log('✓ Permission-based access control');
console.log('✓ Verifiable credential issuance');
console.log('✓ Capability-based delegation');
console.log('✓ Immutable audit trail');
console.log('✓ Trust establishment between agents');

console.log('\n📚 What ATP Enables:');
console.log('• Agents can verify each other\'s identity');
console.log('• Secure capability delegation with time bounds');
console.log('• Provable data exchange via verifiable credentials');
console.log('• Complete audit trail for compliance');
console.log('• Decentralized trust without central authority');

console.log('\n🔗 To see the full implementation:');
console.log('1. Review the source code in packages/');
console.log('2. Check the API documentation in docs/api/README.md');
console.log('3. Run: docker-compose up (once dependencies are fixed)');
console.log('4. Explore examples in archive/examples-legacy/simple-agent/');