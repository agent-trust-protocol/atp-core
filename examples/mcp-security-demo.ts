#!/usr/bin/env node
/**
 * ATP™ MCP Security Wrapper Demo
 * Demonstrates how ATP provides the world's first security layer for Model Context Protocol
 */

import { ATPMCPAdapter } from '../packages/protocol-integrations/src/mcp/adapter.js';
import { AgentTrustLevel } from '../packages/shared/src/trust/trust-scoring.js';
import { MCPAuthContext } from '../packages/protocol-integrations/src/types/mcp.js';

class MCPSecurityDemo {
  private adapter: ATPMCPAdapter;
  
  constructor() {
    this.adapter = new ATPMCPAdapter({
      serverUrl: 'ws://localhost:3007',
      trustedHosts: ['localhost'],
      maxConnections: 10
    });
  }
  
  async runDemo(): Promise<void> {
    console.log('🛡️ ATP™ MCP Security Demo - World\'s First Quantum-Safe MCP Integration');
    console.log('================================================================\n');
    
    // Test different trust levels
    await this.testBasicTrustLevel();
    await this.testVerifiedTrustLevel();
    await this.testPrivilegedTrustLevel();
    
    console.log('\n✅ ATP™ MCP Security Demo Complete!');
    console.log('🔐 Your MCP tools are now secured with quantum-safe cryptography');
  }
  
  private async testBasicTrustLevel(): Promise<void> {
    console.log('🔑 Testing Basic Trust Level Agent');
    console.log('──────────────────────────────────');
    
    const basicAuth: MCPAuthContext = {
      clientDID: 'did:atp:basic-agent-demo',
      trustLevel: AgentTrustLevel.BASIC,
      capabilities: ['read-public', 'basic-operations'],
      authMethod: 'did-jwt',
      sessionId: 'demo-basic-session'
    };
    
    try {
      await this.adapter.connect('ws://localhost:3007', basicAuth);
      
      // Should succeed - public tool
      console.log('✅ Calling weather_info (public tool)...');
      const weather = await this.adapter.callTool('weather_info', {
        location: 'San Francisco',
        units: 'celsius'
      });
      console.log('   Result:', weather);
      
      // Should succeed - basic trust required
      console.log('✅ Calling atp_identity_lookup (basic trust)...');
      const identity = await this.adapter.callTool('atp_identity_lookup', {
        did: 'did:atp:example-agent',
        includeMetadata: false
      });
      console.log('   Identity found:', identity.did);
      
      // Should fail - requires verified trust
      try {
        console.log('❌ Attempting database_query (requires verified trust)...');
        await this.adapter.callTool('database_query', {
          query: 'SELECT COUNT(*) FROM agents',
          database: 'atp_main'
        });
        console.log('   ERROR: Should have been blocked!');
      } catch (error) {
        console.log('   ✅ Correctly blocked:', (error as Error).message);
      }
      
    } catch (error) {
      console.error('   Error:', error);
    } finally {
      this.adapter.disconnect();
    }
    
    console.log('');
  }
  
  private async testVerifiedTrustLevel(): Promise<void> {
    console.log('🔐 Testing Verified Trust Level Agent');
    console.log('─────────────────────────────────────');
    
    const verifiedAuth: MCPAuthContext = {
      clientDID: 'did:atp:verified-agent-demo',
      trustLevel: AgentTrustLevel.VERIFIED,
      capabilities: ['read-public', 'basic-operations', 'credential-operations', 'database-access'],
      authMethod: 'did-jwt',
      sessionId: 'demo-verified-session'
    };
    
    try {
      await this.adapter.connect('ws://localhost:3007', verifiedAuth);
      
      console.log('✅ Calling database_query (verified trust)...');
      const dbResult = await this.adapter.callTool('database_query', {
        query: 'SELECT COUNT(*) as agent_count FROM identities',
        database: 'atp_staging'
      });
      console.log('   Query result:', dbResult);
      
      console.log('✅ Calling atp_audit_query (verified trust)...');
      const auditResult = await this.adapter.callTool('atp_audit_query', {
        source: 'identity-service',
        action: 'register',
        limit: 5
      });
      console.log('   Found', auditResult.total, 'audit events');
      
      // Should fail - requires privileged trust
      try {
        console.log('❌ Attempting system_command (requires privileged trust)...');
        await this.adapter.callTool('system_command', {
          command: 'whoami'
        });
        console.log('   ERROR: Should have been blocked!');
      } catch (error) {
        console.log('   ✅ Correctly blocked:', (error as Error).message);
      }
      
    } catch (error) {
      console.error('   Error:', error);
    } finally {
      this.adapter.disconnect();
    }
    
    console.log('');
  }
  
  private async testPrivilegedTrustLevel(): Promise<void> {
    console.log('🔒 Testing Privileged Trust Level Agent');
    console.log('──────────────────────────────────────');
    
    const privilegedAuth: MCPAuthContext = {
      clientDID: 'did:atp:privileged-admin-demo',
      trustLevel: AgentTrustLevel.PRIVILEGED,
      capabilities: [
        'read-public', 'basic-operations', 'credential-operations', 
        'database-access', 'advanced-operations', 'system-access',
        'admin-operations', 'system-management'
      ],
      authMethod: 'did-jwt',
      sessionId: 'demo-privileged-session'
    };
    
    try {
      await this.adapter.connect('ws://localhost:3007', privilegedAuth);
      
      console.log('✅ Calling system_command (privileged access)...');
      const sysResult = await this.adapter.callTool('system_command', {
        command: 'echo "ATP Security Demo"',
        timeout: 10
      });
      console.log('   Command output:', sysResult.stdout.trim());
      
      console.log('✅ Calling admin_user_management (privileged access)...');
      const adminResult = await this.adapter.callTool('admin_user_management', {
        action: 'list'
      });
      console.log('   Admin operation result:', adminResult.success);
      
      console.log('✅ All privileged operations completed successfully!');
      
    } catch (error) {
      console.error('   Error:', error);
    } finally {
      this.adapter.disconnect();
    }
    
    console.log('');
  }
}

// Utility function to show available tools by trust level
function showToolsByTrustLevel(): void {
  console.log('🛠️ Available MCP Tools by Trust Level');
  console.log('═══════════════════════════════════════');
  console.log('');
  
  console.log('📖 BASIC Trust Level:');
  console.log('  • weather_info - Get weather information');
  console.log('  • file_read - Read file contents');
  console.log('  • atp_identity_lookup - Look up agent identity');
  console.log('');
  
  console.log('🔐 VERIFIED Trust Level:');
  console.log('  • database_query - Execute database queries');
  console.log('  • atp_audit_query - Query audit logs');
  console.log('  • policy_deploy - Deploy trust policies');
  console.log('');
  
  console.log('🔒 PRIVILEGED Trust Level:');
  console.log('  • system_command - Execute system commands');
  console.log('  • admin_user_management - Manage user accounts');
  console.log('');
}

// Main execution
async function main(): Promise<void> {
  const demo = new MCPSecurityDemo();
  
  console.clear();
  showToolsByTrustLevel();
  
  await demo.runDemo();
  
  console.log('\n🚀 Next Steps:');
  console.log('1. Integrate ATP™ with your existing MCP servers');
  console.log('2. Configure trust levels for your agent ecosystem');
  console.log('3. Enable quantum-safe signatures for future-proofing');
  console.log('4. Set up audit logging for compliance requirements');
  console.log('\n📚 Learn more: https://github.com/agent-trust-protocol/atp');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { MCPSecurityDemo };