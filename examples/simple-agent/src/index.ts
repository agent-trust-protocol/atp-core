import { WeatherAgent } from './weather-agent.js';
import { CalculatorAgent } from './calculator-agent.js';

async function main() {
  const agentType = process.argv[2] || 'weather';
  const gatewayUrl = process.env.ATP_GATEWAY || 'ws://localhost:8081/rpc';

  try {
    if (agentType === 'weather') {
      const weatherAgent = new WeatherAgent({
        name: 'WeatherAgent',
        atpGateway: gatewayUrl,
      });

      await weatherAgent.initialize();
      
      // Keep the agent running
      console.log('Weather Agent is running. Press Ctrl+C to exit.');
      
      // Graceful shutdown
      process.on('SIGINT', async () => {
        console.log('\nShutting down Weather Agent...');
        await weatherAgent.disconnect();
        process.exit(0);
      });

    } else if (agentType === 'calculator') {
      const calculatorAgent = new CalculatorAgent({
        name: 'CalculatorAgent',
        atpGateway: gatewayUrl,
      });

      await calculatorAgent.initialize();
      
      console.log('Calculator Agent is running. Press Ctrl+C to exit.');
      
      // Graceful shutdown
      process.on('SIGINT', async () => {
        console.log('\nShutting down Calculator Agent...');
        await calculatorAgent.disconnect();
        process.exit(0);
      });

    } else {
      console.error('Unknown agent type. Use "weather" or "calculator"');
      process.exit(1);
    }

  } catch (error) {
    console.error('Failed to start agent:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

main();