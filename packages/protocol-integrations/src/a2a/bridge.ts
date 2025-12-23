import express from 'express';
import { A2ADiscoveryService } from './discovery.js';
import { A2ACommunicationService } from './communication.js';
import {
  A2ADiscoveryRequest,
  A2AAgentProfile,
  A2ACommunicationRequest,
  A2AHandshakeRequest,
  A2AErrorCode,
} from '../types/a2a.js';
import { TrustLevel } from '@atp/shared';

export class A2ABridge {
  private app: express.Application;
  private discoveryService: A2ADiscoveryService;
  private communicationService: A2ACommunicationService;

  constructor() {
    this.app = express();
    this.discoveryService = new A2ADiscoveryService();
    this.communicationService = new A2ACommunicationService();
    
    this.setupRoutes();
    this.setupEventHandlers();
  }

  private setupRoutes(): void {
    this.app.use(express.json());

    // Discovery endpoints
    this.app.post('/a2a/discover', async (req, res) => {
      try {
        const request: A2ADiscoveryRequest = req.body;
        const response = await this.discoveryService.discoverAgents(request);
        res.json(response);
      } catch (error) {
        res.status(500).json({
          error: A2AErrorCode.DISCOVERY_SERVICE_UNAVAILABLE,
          message: error instanceof Error ? error.message : 'Discovery failed',
        });
      }
    });

    this.app.post('/a2a/register', async (req, res) => {
      try {
        const profile: A2AAgentProfile = req.body;
        await this.discoveryService.registerAgent(profile);
        this.communicationService.registerAgentProfile(profile);
        
        res.json({
          success: true,
          message: 'Agent registered successfully',
          did: profile.did,
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          error: error instanceof Error ? error.message : 'Registration failed',
        });
      }
    });

    this.app.delete('/a2a/unregister/:did', async (req, res) => {
      try {
        const { did } = req.params;
        await this.discoveryService.unregisterAgent(did);
        
        res.json({
          success: true,
          message: 'Agent unregistered successfully',
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          error: error instanceof Error ? error.message : 'Unregistration failed',
        });
      }
    });

    this.app.get('/a2a/agent/:did', async (req, res) => {
      try {
        const { did } = req.params;
        const profile = await this.discoveryService.getAgentProfile(did);
        
        if (!profile) {
          return res.status(404).json({
            error: A2AErrorCode.NO_AGENTS_FOUND,
            message: 'Agent not found',
          });
        }
        
        res.json(profile);
      } catch (error) {
        res.status(500).json({
          error: error instanceof Error ? error.message : 'Failed to get agent profile',
        });
      }
    });

    // Communication endpoints
    this.app.post('/a2a/handshake', async (req, res) => {
      try {
        const request: A2AHandshakeRequest = req.body;
        const response = await this.communicationService.initiateHandshake(request);
        res.json(response);
      } catch (error) {
        res.status(500).json({
          error: A2AErrorCode.HANDSHAKE_FAILED,
          message: error instanceof Error ? error.message : 'Handshake failed',
        });
      }
    });

    this.app.post('/a2a/message', async (req, res) => {
      try {
        const request: A2ACommunicationRequest = req.body;
        const response = await this.communicationService.sendMessage(request);
        res.json(response);
      } catch (error) {
        res.status(500).json({
          error: A2AErrorCode.MESSAGE_DELIVERY_FAILED,
          message: error instanceof Error ? error.message : 'Message delivery failed',
        });
      }
    });

    this.app.get('/a2a/messages/:did', async (req, res) => {
      try {
        const { did } = req.params;
        const messages = await this.communicationService.receiveMessages(did);
        res.json({
          success: true,
          messages,
          count: messages.length,
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to retrieve messages',
        });
      }
    });

    this.app.get('/a2a/sessions/:did', async (req, res) => {
      try {
        const { did } = req.params;
        const sessions = await this.communicationService.getActiveSessions(did);
        res.json({
          success: true,
          sessions,
          count: sessions.length,
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to get sessions',
        });
      }
    });

    this.app.delete('/a2a/session/:sessionId', async (req, res) => {
      try {
        const { sessionId } = req.params;
        const { initiator, reason } = req.body;
        
        await this.communicationService.terminateSession(sessionId, initiator, reason);
        res.json({
          success: true,
          message: 'Session terminated successfully',
        });
      } catch (error) {
        res.status(400).json({
          success: false,
          error: error instanceof Error ? error.message : 'Failed to terminate session',
        });
      }
    });

    // Statistics endpoints
    this.app.get('/a2a/stats/discovery', (req, res) => {
      const stats = this.discoveryService.getStats();
      res.json(stats);
    });

    this.app.get('/a2a/stats/communication', (req, res) => {
      const stats = this.communicationService.getStats();
      res.json(stats);
    });

    this.app.get('/a2a/health', (req, res) => {
      const discoveryStats = this.discoveryService.getStats();
      const communicationStats = this.communicationService.getStats();
      
      res.json({
        status: 'healthy',
        service: 'a2a-bridge',
        version: '0.1.0',
        protocol: 'Agent Trust Protocol™',
        integration: 'Agent-to-Agent (A2A)',
        stats: {
          discovery: discoveryStats,
          communication: communicationStats,
        },
        timestamp: new Date().toISOString(),
      });
    });
  }

  private setupEventHandlers(): void {
    // Listen to communication events
    this.communicationService.on('messageSent', (event) => {
      console.log(`A2A Message sent: ${event.from} → ${event.to} (${event.messageType})`);
    });

    this.communicationService.on('sessionTerminated', (event) => {
      console.log(`A2A Session terminated: ${event.sessionId} by ${event.initiator}`);
    });
  }

  public getApp(): express.Application {
    return this.app;
  }

  public async start(port: number = 3008): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(port, () => {
        console.log(`Agent Trust Protocol™ - A2A Bridge running on port ${port}`);
        console.log('Endpoints:');
        console.log(`  Discovery: http://localhost:${port}/a2a/discover`);
        console.log(`  Registration: http://localhost:${port}/a2a/register`);
        console.log(`  Communication: http://localhost:${port}/a2a/message`);
        console.log(`  Health: http://localhost:${port}/a2a/health`);
        resolve();
      });
    });
  }

  // Helper methods for testing and integration
  public async createExampleInteraction(): Promise<{
    discovery: any;
    handshake: any;
    communication: any;
  }> {
    console.log('Creating example A2A interaction...');

    // 1. Discovery request
    const discoveryRequest: A2ADiscoveryRequest = {
      query: {
        capabilities: ['weather-current'],
        trustLevel: TrustLevel.BASIC,
      },
      filters: {
        minTrustLevel: TrustLevel.BASIC,
        verifiedOnly: true,
        activeOnly: true,
      },
      requester: {
        did: 'did:atp:z6MktestRequesterDID123',
        trustLevel: TrustLevel.VERIFIED,
        purpose: 'Weather information lookup',
        sessionId: 'test-session-123',
      },
    };

    const discoveryResponse = await this.discoveryService.discoverAgents(discoveryRequest);
    console.log(`Discovery found ${discoveryResponse.agents.length} agents`);

    if (discoveryResponse.agents.length === 0) {
      return {
        discovery: discoveryResponse,
        handshake: null,
        communication: null,
      };
    }

    // 2. Handshake with first agent
    const targetAgent = discoveryResponse.agents[0];
    const handshakeRequest: A2AHandshakeRequest = {
      initiator: {
        did: discoveryRequest.requester.did,
        profile: {
          did: discoveryRequest.requester.did,
          name: 'Test Requester Agent',
          description: 'Test agent for A2A integration',
          version: '1.0.0',
          endpoints: {
            discovery: 'http://localhost:3008/discovery',
            communication: 'http://localhost:3008/communicate',
          },
          capabilities: [
            {
              name: 'weather-query',
              description: 'Query weather information',
              version: '1.0.0',
              trustLevelRequired: TrustLevel.BASIC,
            },
          ],
          atpProfile: {
            trustLevel: TrustLevel.VERIFIED,
            verificationStatus: 'verified',
            capabilities: ['basic-operations', 'credential-operations'],
            lastVerified: new Date().toISOString(),
            reputation: {
              score: 88,
              interactions: 250,
              successRate: 0.96,
            },
          },
        },
        intendedPurpose: 'Request weather information',
      },
      target: {
        did: targetAgent.did,
        expectedCapabilities: ['weather-current'],
      },
      security: {
        proposedProtocols: ['https', 'wss'],
        encryptionRequired: true,
        mutualAuthentication: true,
      },
      sessionParameters: {
        timeout: 300,
        maxMessages: 50,
        auditLevel: 'standard',
      },
    };

    const handshakeResponse = await this.communicationService.initiateHandshake(handshakeRequest);
    console.log(`Handshake ${handshakeResponse.accepted ? 'accepted' : 'rejected'}`);

    if (!handshakeResponse.accepted) {
      return {
        discovery: discoveryResponse,
        handshake: handshakeResponse,
        communication: null,
      };
    }

    // 3. Send a test message
    const messageRequest: A2ACommunicationRequest = {
      from: discoveryRequest.requester.did,
      to: targetAgent.did,
      messageType: 'task-request',
      content: {
        task: 'get-weather',
        parameters: {
          location: 'San Francisco, CA',
          units: 'celsius',
        },
      },
      metadata: {
        messageId: 'test-message-123',
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

    const messageResponse = await this.communicationService.sendMessage(messageRequest);
    console.log(`Message ${messageResponse.success ? 'sent successfully' : 'failed'}`);

    return {
      discovery: discoveryResponse,
      handshake: handshakeResponse,
      communication: messageResponse,
    };
  }
}