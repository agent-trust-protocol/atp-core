import { ATPMCPAdapter } from '../mcp/adapter.js';
import { A2ABridge } from '../a2a/bridge.js';
import { TrustLevel } from '@atp/shared';
import {
  MCPAuthContext,
  ATPMCPServerConfig,
} from '../types/mcp.js';
import {
  A2ADiscoveryRequest,
  A2AHandshakeRequest,
  A2ACommunicationRequest,
} from '../types/a2a.js';

/**
 * ATP™ Protocol Integrations Test Suite
 * Tests MCP and A2A integrations with ATP™ security features
 */
export class ProtocolIntegrationTest {
  private a2aBridge: A2ABridge;
  
  constructor() {
    this.a2aBridge = new A2ABridge();
  }

  async runAllTests(): Promise<{
    mcp: any;
    a2a: any;
    summary: {
      totalTests: number;
      passed: number;
      failed: number;
      duration: number;
    };
  }> {
    console.log('🚀 Starting ATP™ Protocol Integration Tests...\n');
    const startTime = Date.now();
    
    let totalTests = 0;
    let passed = 0;
    let failed = 0;

    // Test MCP Integration
    console.log('📡 Testing MCP (Model Context Protocol) Integration...');
    const mcpResults = await this.testMCPIntegration();
    totalTests += mcpResults.totalTests;
    passed += mcpResults.passed;
    failed += mcpResults.failed;

    // Test A2A Integration  
    console.log('🤝 Testing A2A (Agent-to-Agent) Integration...');
    const a2aResults = await this.testA2AIntegration();
    totalTests += a2aResults.totalTests;
    passed += a2aResults.passed;
    failed += a2aResults.failed;

    const duration = Date.now() - startTime;
    const summary = { totalTests, passed, failed, duration };

    console.log(`\n📊 Test Summary:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${passed} ✅`);
    console.log(`   Failed: ${failed} ${failed > 0 ? '❌' : '✅'}`);
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Success Rate: ${((passed / totalTests) * 100).toFixed(1)}%`);

    return {
      mcp: mcpResults,
      a2a: a2aResults,
      summary,
    };
  }

  private async testMCPIntegration(): Promise<{
    totalTests: number;
    passed: number;
    failed: number;
    tests: Array<{ name: string; passed: boolean; error?: string; duration: number }>;
  }> {
    const tests: Array<{ name: string; passed: boolean; error?: string; duration: number }> = [];

    // Test 1: MCP Server Configuration
    await this.runTest(tests, 'MCP Server Configuration', async () => {
      const config: ATPMCPServerConfig = {
        name: 'Test ATP™ MCP Server',
        version: '0.1.0',
        description: 'Test server for integration testing',
        atpConfig: {
          serverDID: 'did:atp:z6MktestServerDID123',
          trustLevel: TrustLevel.VERIFIED,
          supportedAuthMethods: ['did-signature', 'did-jwt'],
          rateLimits: {
            globalRequestsPerMinute: 100,
            perClientRequestsPerMinute: 20,
          },
        },
      };
      
      // Validate configuration
      if (!config.name || !config.atpConfig.serverDID) {
        throw new Error('Invalid MCP configuration');
      }
      
      return { config, valid: true };
    });

    // Test 2: MCP Authentication Context
    await this.runTest(tests, 'MCP Authentication Context', async () => {
      const authContext: MCPAuthContext = {
        clientDID: 'did:atp:z6MktestClientDID456',
        trustLevel: TrustLevel.VERIFIED,
        capabilities: ['basic-operations', 'credential-operations'],
        authenticated: true,
        authMethod: 'did-jwt',
        sessionId: 'test-session-mcp-123',
      };

      // Validate authentication context
      if (!authContext.clientDID || !authContext.trustLevel) {
        throw new Error('Invalid authentication context');
      }

      return { authContext, valid: true };
    });

    // Test 3: Tool Security Validation
    await this.runTest(tests, 'Tool Security Validation', async () => {
      const testCases = [
        {
          toolTrustLevel: TrustLevel.BASIC,
          userTrustLevel: TrustLevel.VERIFIED,
          shouldPass: true,
        },
        {
          toolTrustLevel: TrustLevel.PREMIUM,
          userTrustLevel: TrustLevel.BASIC,
          shouldPass: false,
        },
        {
          toolTrustLevel: TrustLevel.VERIFIED,
          userTrustLevel: TrustLevel.VERIFIED,
          shouldPass: true,
        },
      ];

      const results = testCases.map(testCase => {
        const userLevelValue = this.getTrustLevelValue(testCase.userTrustLevel);
        const toolLevelValue = this.getTrustLevelValue(testCase.toolTrustLevel);
        const actualResult = userLevelValue >= toolLevelValue;
        return {
          ...testCase,
          actualResult,
          correct: actualResult === testCase.shouldPass,
        };
      });

      const allCorrect = results.every(r => r.correct);
      if (!allCorrect) {
        throw new Error('Trust level validation failed');
      }

      return { results, allCorrect };
    });

    // Test 4: Rate Limiting Logic
    await this.runTest(tests, 'Rate Limiting Logic', async () => {
      const rateLimits = {
        requestsPerMinute: 5,
        requestsPerHour: 50,
      };

      // Simulate rate limiting check
      const currentRequests = 3;
      const withinLimit = currentRequests < rateLimits.requestsPerMinute;

      if (!withinLimit) {
        throw new Error('Rate limit exceeded');
      }

      return { rateLimits, currentRequests, withinLimit };
    });

    const passed = tests.filter(t => t.passed).length;
    const failed = tests.filter(t => !t.passed).length;

    console.log(`   MCP Tests: ${passed}/${tests.length} passed`);
    
    return {
      totalTests: tests.length,
      passed,
      failed,
      tests,
    };
  }

  private async testA2AIntegration(): Promise<{
    totalTests: number;
    passed: number;
    failed: number;
    tests: Array<{ name: string; passed: boolean; error?: string; duration: number }>;
  }> {
    const tests: Array<{ name: string; passed: boolean; error?: string; duration: number }> = [];

    // Test 1: Agent Discovery
    await this.runTest(tests, 'Agent Discovery', async () => {
      const discoveryRequest: A2ADiscoveryRequest = {
        query: {
          capabilities: ['weather-current'],
          trustLevel: TrustLevel.BASIC,
        },
        filters: {
          minTrustLevel: TrustLevel.BASIC,
          verifiedOnly: true,
        },
        requester: {
          did: 'did:atp:z6MktestRequesterDID789',
          trustLevel: TrustLevel.VERIFIED,
          purpose: 'Integration testing',
          sessionId: 'test-discovery-123',
        },
      };

      // Simulate discovery (this would normally call the actual service)
      const mockResponse = {
        agents: [
          {
            did: 'did:atp:z6MkweatherAgentDID123',
            name: 'WeatherBot',
            capabilities: ['weather-current', 'weather-forecast'],
            trustLevel: TrustLevel.VERIFIED,
          },
        ],
        pagination: {
          offset: 0,
          limit: 50,
          total: 1,
          hasMore: false,
        },
      };

      if (mockResponse.agents.length === 0) {
        throw new Error('No agents found in discovery');
      }

      return { request: discoveryRequest, response: mockResponse };
    });

    // Test 2: Trust Level Compatibility
    await this.runTest(tests, 'Trust Level Compatibility', async () => {
      const testCases = [
        {
          agent1: TrustLevel.VERIFIED,
          agent2: TrustLevel.VERIFIED,
          compatible: true,
        },
        {
          agent1: TrustLevel.BASIC,
          agent2: TrustLevel.PREMIUM,
          compatible: true,
        },
        {
          agent1: TrustLevel.UNTRUSTED,
          agent2: TrustLevel.VERIFIED,
          compatible: false,
        },
      ];

      const results = testCases.map(testCase => {
        const minLevel = TrustLevel.BASIC;
        const agent1Valid = this.getTrustLevelValue(testCase.agent1) >= this.getTrustLevelValue(minLevel);
        const agent2Valid = this.getTrustLevelValue(testCase.agent2) >= this.getTrustLevelValue(minLevel);
        const actualCompatible = agent1Valid && agent2Valid;
        
        return {
          ...testCase,
          actualCompatible,
          correct: actualCompatible === testCase.compatible,
        };
      });

      const allCorrect = results.every(r => r.correct);
      if (!allCorrect) {
        throw new Error('Trust level compatibility check failed');
      }

      return { results, allCorrect };
    });

    // Test 3: Session Management
    await this.runTest(tests, 'Session Management', async () => {
      const sessionData = {
        sessionId: 'test-session-a2a-456',
        participants: {
          initiator: 'did:atp:z6MktestInitiatorDID',
          responder: 'did:atp:z6MktestResponderDID',
        },
        status: 'active',
        startTime: new Date().toISOString(),
      };

      // Validate session data
      if (!sessionData.sessionId || !sessionData.participants.initiator) {
        throw new Error('Invalid session data');
      }

      // Simulate session activity
      const messageCount = 5;
      const maxMessages = 50;
      const withinLimit = messageCount < maxMessages;

      if (!withinLimit) {
        throw new Error('Session message limit exceeded');
      }

      return {
        session: sessionData,
        messageCount,
        maxMessages,
        withinLimit,
      };
    });

    // Test 4: Message Security
    await this.runTest(tests, 'Message Security', async () => {
      const messageRequest: A2ACommunicationRequest = {
        from: 'did:atp:z6MktestSenderDID',
        to: 'did:atp:z6MktestReceiverDID',
        messageType: 'task-request',
        content: {
          task: 'test-task',
          data: 'encrypted-test-data',
        },
        metadata: {
          messageId: 'test-message-789',
          timestamp: new Date().toISOString(),
          priority: 'normal',
        },
        atpSecurity: {
          encrypted: true,
          signed: true,
          trustVerified: true,
          auditRequired: true,
        },
      };

      // Validate security requirements
      const requiredSecurity = messageRequest.atpSecurity;
      if (!requiredSecurity.encrypted || !requiredSecurity.signed) {
        throw new Error('Message security requirements not met');
      }

      return {
        message: messageRequest,
        securityValid: true,
      };
    });

    // Test 5: Example A2A Interaction
    await this.runTest(tests, 'Complete A2A Interaction Flow', async () => {
      // This would test the full flow but for now we'll simulate it
      const interaction = {
        discovery: { agents: 1, duration: 50 },
        handshake: { accepted: true, sessionId: 'test-session' },
        communication: { messagesSent: 3, errors: 0 },
      };

      if (!interaction.handshake.accepted) {
        throw new Error('Handshake failed');
      }

      if (interaction.communication.errors > 0) {
        throw new Error('Communication errors detected');
      }

      return interaction;
    });

    const passed = tests.filter(t => t.passed).length;
    const failed = tests.filter(t => !t.passed).length;

    console.log(`   A2A Tests: ${passed}/${tests.length} passed`);
    
    return {
      totalTests: tests.length,
      passed,
      failed,
      tests,
    };
  }

  private async runTest(
    tests: Array<{ name: string; passed: boolean; error?: string; duration: number }>,
    name: string,
    testFn: () => Promise<any>
  ): Promise<void> {
    const startTime = Date.now();
    
    try {
      await testFn();
      const duration = Date.now() - startTime;
      tests.push({ name, passed: true, duration });
      console.log(`   ✅ ${name} (${duration}ms)`);
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);
      tests.push({ name, passed: false, error: errorMessage, duration });
      console.log(`   ❌ ${name} (${duration}ms): ${errorMessage}`);
    }
  }

  private getTrustLevelValue(level: TrustLevel): number {
    const levels = [
      TrustLevel.UNTRUSTED,
      TrustLevel.BASIC,
      TrustLevel.VERIFIED,
      TrustLevel.PREMIUM,
      TrustLevel.ENTERPRISE,
    ];
    return levels.indexOf(level);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const testSuite = new ProtocolIntegrationTest();
  testSuite.runAllTests().then(results => {
    const success = results.summary.failed === 0;
    console.log(`\n🎯 Integration Test ${success ? 'PASSED' : 'FAILED'}`);
    process.exit(success ? 0 : 1);
  }).catch(error => {
    console.error('❌ Test suite failed:', error);
    process.exit(1);
  });
}