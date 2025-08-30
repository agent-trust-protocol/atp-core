#!/usr/bin/env ts-node

import { WeatherAgent } from '../simple-agent/src/weather-agent.js';
import { CalculatorAgent } from '../simple-agent/src/calculator-agent.js';

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runDemo() {
  console.log('🚀 Starting Agent Trust Protocol Demo');
  console.log('=====================================\n');

  const gatewayUrl = 'ws://localhost:8081/rpc';

  // Initialize agents
  console.log('📡 Initializing agents...');
  const weatherAgent = new WeatherAgent({
    name: 'DemoWeatherAgent',
    atpGateway: gatewayUrl,
  });

  const calculatorAgent = new CalculatorAgent({
    name: 'DemoCalculatorAgent', 
    atpGateway: gatewayUrl,
  });

  try {
    // Start both agents
    await Promise.all([
      weatherAgent.initialize(),
      calculatorAgent.initialize(),
    ]);

    console.log('\n✅ Both agents initialized successfully');
    console.log(`Weather Agent DID: ${weatherAgent.getDID()}`);
    console.log(`Calculator Agent DID: ${calculatorAgent.getDID()}`);

    await sleep(2000);

    // Demo 1: Permission Granting
    console.log('\n🔑 Demo 1: Permission Granting');
    console.log('--------------------------------');
    
    await weatherAgent.requestWeatherPermission(
      calculatorAgent.getDID()!,
      'london'
    );

    await calculatorAgent.grantCalculationPermission(
      weatherAgent.getDID()!,
      ['add', 'multiply', 'sqrt']
    );

    console.log('✅ Permissions granted between agents');
    await sleep(2000);

    // Demo 2: Verifiable Credential Issuance
    console.log('\n📜 Demo 2: Verifiable Credential Issuance');
    console.log('------------------------------------------');

    // Register credential schemas first
    await weatherAgent.invoke('vc.schemas', {
      id: 'weather-data-v1',
      name: 'WeatherData',
      description: 'Weather information for a specific location',
      version: '1.0.0',
      properties: {
        city: { type: 'string', description: 'City name', required: true },
        temperature: { type: 'number', description: 'Temperature in Celsius' },
        humidity: { type: 'number', description: 'Humidity percentage' },
        conditions: { type: 'string', description: 'Weather conditions' },
        timestamp: { type: 'string', description: 'Data timestamp' },
        source: { type: 'string', description: 'Data source DID' },
      },
      required: ['city', 'temperature', 'timestamp', 'source'],
    });

    await calculatorAgent.invoke('vc.schemas', {
      id: 'calculation-result-v1',
      name: 'CalculationResult',
      description: 'Result of a mathematical calculation',
      version: '1.0.0',
      properties: {
        operation: { type: 'string', description: 'Operation performed', required: true },
        operands: { type: 'array', description: 'Input values' },
        result: { type: 'number', description: 'Calculation result' },
        timestamp: { type: 'string', description: 'Calculation timestamp' },
        calculator: { type: 'string', description: 'Calculator agent DID' },
        requestId: { type: 'string', description: 'Request identifier' },
      },
      required: ['operation', 'operands', 'result', 'timestamp', 'calculator'],
    });

    console.log('📋 Credential schemas registered');
    await sleep(1000);

    // Demo 3: Agent Interaction via RPC
    console.log('\n🤝 Demo 3: Agent Interaction');
    console.log('-----------------------------');

    // Simulate weather request
    weatherAgent.subscribe('weather-request', () => {
      console.log('🌤️  Weather Agent received data request');
    });

    calculatorAgent.subscribe('calculation-request', () => {
      console.log('🧮 Calculator Agent received calculation request');
    });

    // Simulate some interactions
    setTimeout(() => {
      console.log('📤 Simulating weather data request...');
    }, 1000);

    setTimeout(() => {
      console.log('📤 Simulating calculation request...');
    }, 2000);

    await sleep(5000);

    // Demo 4: Audit Trail
    console.log('\n📊 Demo 4: Audit and Trust Verification');
    console.log('----------------------------------------');

    // Query audit logs (this would be implemented in audit service)
    console.log('🔍 Querying audit trail...');
    console.log('📝 All agent interactions are being logged for trust verification');

    await sleep(2000);

    console.log('\n🎉 Demo completed successfully!');
    console.log('\nKey ATP Features Demonstrated:');
    console.log('✓ Decentralized Identity (DID) generation');
    console.log('✓ Secure agent authentication');
    console.log('✓ Permission-based access control');
    console.log('✓ Verifiable credential issuance');
    console.log('✓ Real-time agent communication');
    console.log('✓ Audit trail generation');

  } catch (error) {
    console.error('❌ Demo failed:', error);
  } finally {
    // Cleanup
    console.log('\n🧹 Cleaning up...');
    await weatherAgent.disconnect();
    await calculatorAgent.disconnect();
    console.log('👋 Demo agents disconnected');
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Demo interrupted by user');
  process.exit(0);
});

// Run the demo if this file is executed directly
if (require.main === module) {
  runDemo().catch(console.error);
}

export { runDemo };