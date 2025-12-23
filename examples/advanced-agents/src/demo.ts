// Main demo orchestrator for advanced agent examples
import readline from 'readline';
import { demonstrateCollaborativeAgents, demonstrateAgentMarketplace } from './collaborative-agents-demo.js';
import { demonstrateMCPIntegration } from './mcp-integration-demo.js';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function displayMenu(): Promise<void> {
  console.log('\n🤖 === Agent Trust Protocol - Advanced Examples ===\n');
  console.log('Choose a demonstration:');
  console.log('1. 🤝 Collaborative Agents Network');
  console.log('2. 🔗 MCP Integration Demo');
  console.log('3. 🏪 Agent Marketplace (Preview)');
  console.log('4. 📖 View Architecture Overview');
  console.log('5. 🚀 Run All Demos');
  console.log('0. 👋 Exit');
  console.log();
}

async function showArchitectureOverview(): Promise<void> {
  console.log('\n📖 === Agent Trust Protocol Architecture ===\n');
  
  console.log('🏗️ Core Components:');
  console.log('┌─────────────────────────────────────────────────────────┐');
  console.log('│ 1. Identity Service (DID Management)                   │');
  console.log('│    • Decentralized identifier registration              │');
  console.log('│    • Public key infrastructure                          │');
  console.log('│    • Key rotation and recovery                          │');
  console.log('├─────────────────────────────────────────────────────────┤');
  console.log('│ 2. Verifiable Credentials Service                      │');
  console.log('│    • Credential issuance and verification              │');
  console.log('│    • Schema management                                  │');
  console.log('│    • Trust chain validation                            │');
  console.log('├─────────────────────────────────────────────────────────┤');
  console.log('│ 3. Permission Service                                   │');
  console.log('│    • Capability-based access control                   │');
  console.log('│    • Policy enforcement                                 │');
  console.log('│    • Token-based authorization                          │');
  console.log('├─────────────────────────────────────────────────────────┤');
  console.log('│ 4. RPC Gateway                                          │');
  console.log('│    • JSON-RPC 2.0 over WebSocket                       │');
  console.log('│    • Service discovery and routing                     │');
  console.log('│    • Load balancing and failover                       │');
  console.log('└─────────────────────────────────────────────────────────┘');
  
  console.log('\n🤖 Agent Capabilities:');
  console.log('┌─────────────────────────────────────────────────────────┐');
  console.log('│ • Trust Network Management                              │');
  console.log('│ • Capability Discovery and Sharing                     │');
  console.log('│ • Secure Inter-Agent Communication                     │');
  console.log('│ • Workflow Coordination                                 │');
  console.log('│ • Tool Delegation and Execution                        │');
  console.log('│ • Real-time Collaboration                              │');
  console.log('│ • Fault Tolerance and Recovery                         │');
  console.log('└─────────────────────────────────────────────────────────┘');
  
  console.log('\n🔗 MCP Integration Benefits:');
  console.log('┌─────────────────────────────────────────────────────────┐');
  console.log('│ • DID-based authentication for MCP sessions            │');
  console.log('│ • Trust-validated tool delegation                      │');
  console.log('│ • Capability-based tool authorization                  │');
  console.log('│ • Verifiable credentials for tool access               │');
  console.log('│ • Decentralized tool discovery                         │');
  console.log('│ • Cross-protocol interoperability                      │');
  console.log('└─────────────────────────────────────────────────────────┘');
  
  console.log('\n🌐 Use Cases:');
  console.log('• Multi-AI system coordination');
  console.log('• Federated learning with trust');
  console.log('• Decentralized autonomous organizations (DAOs)');
  console.log('• Supply chain agent networks');
  console.log('• IoT device trust management');
  console.log('• Cross-domain data sharing');
  console.log('• Collaborative research networks');
  
  console.log('\n🔮 Future Roadmap:');
  console.log('• Economic incentive mechanisms');
  console.log('• Reputation and rating systems');
  console.log('• Cross-chain interoperability');
  console.log('• Privacy-preserving protocols');
  console.log('• Quantum-resistant cryptography');
  console.log('• Integration with emerging standards');
}

async function runAllDemos(): Promise<void> {
  console.log('\n🚀 Running all demonstrations...\n');
  
  try {
    await demonstrateCollaborativeAgents();
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    await demonstrateMCPIntegration();
    
    console.log('\n' + '='.repeat(60) + '\n');
    
    await demonstrateAgentMarketplace();
    
    console.log('\n🎉 All demonstrations completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Demo execution failed:', error instanceof Error ? error.message : String(error));
  }
}

async function main(): Promise<void> {
  console.log('🤖 Welcome to Agent Trust Protocol Advanced Examples!');
  console.log('This demonstration showcases advanced agent-to-agent communication,');
  console.log('trust management, and integration with emerging protocols like MCP.\n');
  
  let running = true;
  
  while (running) {
    await displayMenu();
    const choice = await question('Enter your choice (0-5): ');
    
    switch (choice.trim()) {
      case '1':
        console.log('\n🤝 Starting Collaborative Agents Demo...');
        try {
          await demonstrateCollaborativeAgents();
        } catch (error) {
          console.error('❌ Demo failed:', error instanceof Error ? error.message : String(error));
        }
        break;
        
      case '2':
        console.log('\n🔗 Starting MCP Integration Demo...');
        try {
          await demonstrateMCPIntegration();
        } catch (error) {
          console.error('❌ Demo failed:', error instanceof Error ? error.message : String(error));
        }
        break;
        
      case '3':
        console.log('\n🏪 Starting Agent Marketplace Preview...');
        try {
          await demonstrateAgentMarketplace();
        } catch (error) {
          console.error('❌ Demo failed:', error instanceof Error ? error.message : String(error));
        }
        break;
        
      case '4':
        await showArchitectureOverview();
        break;
        
      case '5':
        await runAllDemos();
        break;
        
      case '0':
        console.log('\n👋 Thank you for exploring Agent Trust Protocol!');
        console.log('Visit https://github.com/your-org/agent-trust-protocol for more information.');
        running = false;
        break;
        
      default:
        console.log('\n⚠️ Invalid choice. Please select a number from 0-5.');
        break;
    }
    
    if (running) {
      console.log('\nPress Enter to continue...');
      await question('');
    }
  }
  
  rl.close();
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Gracefully shutting down...');
  rl.close();
  process.exit(0);
});

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}