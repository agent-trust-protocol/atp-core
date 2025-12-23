import {
  A2AAgentProfile,
  A2ADiscoveryRequest,
  A2ADiscoveryResponse,
  A2AErrorCode,
} from '../types/a2a.js';
import { TrustLevel, TrustLevelManager } from '@atp/shared';

export class A2ADiscoveryService {
  private agents: Map<string, A2AAgentProfile> = new Map();
  private agentsByCapability: Map<string, Set<string>> = new Map();
  private agentsByTrustLevel: Map<string, Set<string>> = new Map();

  constructor() {
    // Initialize with some example agents for demonstration
    this.initializeExampleAgents();
  }

  async registerAgent(profile: A2AAgentProfile): Promise<void> {
    // Validate agent profile
    await this.validateAgentProfile(profile);
    
    // Store agent profile
    this.agents.set(profile.did, profile);
    
    // Index by capabilities
    for (const capability of profile.capabilities) {
      if (!this.agentsByCapability.has(capability.name)) {
        this.agentsByCapability.set(capability.name, new Set());
      }
      this.agentsByCapability.get(capability.name)?.add(profile.did);
    }
    
    // Index by trust level
    const trustLevel = profile.atpProfile.trustLevel;
    if (!this.agentsByTrustLevel.has(trustLevel)) {
      this.agentsByTrustLevel.set(trustLevel, new Set());
    }
    this.agentsByTrustLevel.get(trustLevel)?.add(profile.did);
    
    // Log registration
    await this.logAuditEvent(profile.did, 'agent-registered', {
      agentName: profile.name,
      trustLevel: profile.atpProfile.trustLevel,
      capabilities: profile.capabilities.map(c => c.name),
    });
    
    console.log(`Registered agent: ${profile.name} (${profile.did}) - Trust Level: ${trustLevel}`);
  }

  async unregisterAgent(did: string): Promise<void> {
    const profile = this.agents.get(did);
    if (!profile) {
      throw new Error(`Agent ${did} not found`);
    }
    
    // Remove from indices
    for (const capability of profile.capabilities) {
      this.agentsByCapability.get(capability.name)?.delete(did);
    }
    this.agentsByTrustLevel.get(profile.atpProfile.trustLevel)?.delete(did);
    
    // Remove from main storage
    this.agents.delete(did);
    
    // Log unregistration
    await this.logAuditEvent(did, 'agent-unregistered', {
      agentName: profile.name,
    });
    
    console.log(`Unregistered agent: ${profile.name} (${did})`);
  }

  async discoverAgents(request: A2ADiscoveryRequest): Promise<A2ADiscoveryResponse> {
    const startTime = Date.now();
    
    // Log discovery request
    await this.logAuditEvent(request.requester.did, 'agent-discovery-request', {
      query: request.query,
      filters: request.filters,
      purpose: request.requester.purpose,
    });
    
    // Start with all agents
    let candidateAgents = Array.from(this.agents.values());
    
    // Apply capability filter
    if (request.query?.capabilities && request.query.capabilities.length > 0) {
      candidateAgents = candidateAgents.filter(agent =>
        request.query!.capabilities!.some(reqCap =>
          agent.capabilities.some(agentCap => agentCap.name === reqCap)
        )
      );
    }
    
    // Apply trust level filter
    if (request.filters?.minTrustLevel) {
      const minLevel = request.filters.minTrustLevel as TrustLevel;
      candidateAgents = candidateAgents.filter(agent => {
        const agentLevel = agent.atpProfile.trustLevel as TrustLevel;
        return TrustLevelManager.isAuthorized(agentLevel, minLevel);
      });
    }
    
    // Apply verified only filter
    if (request.filters?.verifiedOnly) {
      candidateAgents = candidateAgents.filter(agent =>
        agent.atpProfile.verificationStatus === 'verified'
      );
    }
    
    // Apply active only filter
    if (request.filters?.activeOnly) {
      candidateAgents = candidateAgents.filter(agent => {
        // Check if agent was active recently (within last hour)
        const lastVerified = new Date(agent.atpProfile.lastVerified);
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        return lastVerified > oneHourAgo;
      });
    }
    
    // Apply tag filter
    if (request.query?.tags && request.query.tags.length > 0) {
      candidateAgents = candidateAgents.filter(agent =>
        request.query!.tags!.some(tag =>
          agent.metadata?.tags?.includes(tag)
        )
      );
    }
    
    // Sort by trust level and reputation
    candidateAgents.sort((a, b) => {
      const aLevel = TrustLevelManager.validateTrustLevel(a.atpProfile.trustLevel)
        ? (a.atpProfile.trustLevel as TrustLevel) : TrustLevel.UNTRUSTED;
      const bLevel = TrustLevelManager.validateTrustLevel(b.atpProfile.trustLevel)
        ? (b.atpProfile.trustLevel as TrustLevel) : TrustLevel.UNTRUSTED;
      
      // First sort by trust level
      const aValue = this.getTrustLevelValue(aLevel);
      const bValue = this.getTrustLevelValue(bLevel);
      if (aValue !== bValue) {
        return bValue - aValue; // Higher trust level first
      }
      
      // Then sort by reputation score
      const aScore = a.atpProfile.reputation?.score || 0;
      const bScore = b.atpProfile.reputation?.score || 0;
      return bScore - aScore;
    });
    
    // Apply pagination
    const offset = request.pagination?.offset || 0;
    const limit = request.pagination?.limit || 50;
    const total = candidateAgents.length;
    const paginatedAgents = candidateAgents.slice(offset, offset + limit);
    
    const response: A2ADiscoveryResponse = {
      agents: paginatedAgents,
      pagination: {
        offset,
        limit,
        total,
        hasMore: offset + limit < total,
      },
      query: request.query,
      metadata: {
        searchTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        source: 'atp-a2a-discovery',
      },
    };
    
    // Log discovery response
    await this.logAuditEvent(request.requester.did, 'agent-discovery-response', {
      foundAgents: paginatedAgents.length,
      totalAgents: total,
      searchTime: response.metadata.searchTime,
    });
    
    return response;
  }

  async getAgentProfile(did: string): Promise<A2AAgentProfile | null> {
    return this.agents.get(did) || null;
  }

  async updateAgentStatus(did: string, status: Partial<A2AAgentProfile['atpProfile']>): Promise<void> {
    const agent = this.agents.get(did);
    if (!agent) {
      throw new Error(`Agent ${did} not found`);
    }
    
    // Update status
    agent.atpProfile = {
      ...agent.atpProfile,
      ...status,
      lastVerified: new Date().toISOString(),
    };
    
    // Update metadata
    if (agent.metadata) {
      agent.metadata.updated = new Date().toISOString();
    }
    
    // Log status update
    await this.logAuditEvent(did, 'agent-status-updated', {
      updatedFields: Object.keys(status),
      newStatus: status,
    });
  }

  private async validateAgentProfile(profile: A2AAgentProfile): Promise<void> {
    // Validate DID format
    if (!profile.did.startsWith('did:')) {
      throw new Error('Invalid DID format');
    }
    
    // Validate trust level
    if (!TrustLevelManager.validateTrustLevel(profile.atpProfile.trustLevel)) {
      throw new Error(`Invalid trust level: ${profile.atpProfile.trustLevel}`);
    }
    
    // Validate capabilities match trust level
    const trustLevel = profile.atpProfile.trustLevel as TrustLevel;
    for (const capability of profile.capabilities) {
      if (capability.trustLevelRequired) {
        const requiredLevel = capability.trustLevelRequired as TrustLevel;
        if (!TrustLevelManager.isAuthorized(trustLevel, requiredLevel)) {
          throw new Error(
            `Agent trust level ${trustLevel} insufficient for capability ${capability.name} (requires ${requiredLevel})`
          );
        }
      }
    }
    
    // TODO: Validate DID against ATP™ identity service
    // TODO: Verify agent endpoints are accessible
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

  private async logAuditEvent(
    actor: string,
    action: string,
    details: Record<string, any>
  ): Promise<void> {
    try {
      await fetch('http://localhost:3005/audit/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: 'a2a-discovery',
          action,
          resource: 'agent-discovery',
          actor,
          details,
        }),
      });
    } catch (error) {
      console.warn('Failed to log A2A audit event:', error);
    }
  }

  private initializeExampleAgents(): void {
    // Add some example agents for demonstration
    const exampleAgents: A2AAgentProfile[] = [
      {
        did: 'did:atp:z6MkpTHR8VNsBxYAAWHut2Geadd9jSwuBV8xRoAnwWsdvktH',
        name: 'WeatherBot',
        description: 'Provides weather information and forecasts',
        version: '1.0.0',
        endpoints: {
          discovery: 'http://localhost:3008/discovery',
          communication: 'http://localhost:3008/communicate',
          status: 'http://localhost:3008/status',
        },
        capabilities: [
          {
            name: 'weather-current',
            description: 'Get current weather conditions',
            version: '1.0.0',
            trustLevelRequired: TrustLevel.UNTRUSTED,
            permissions: ['read-public'],
          },
          {
            name: 'weather-forecast',
            description: 'Get weather forecasts',
            version: '1.0.0',
            trustLevelRequired: TrustLevel.BASIC,
            permissions: ['read-public'],
          },
        ],
        metadata: {
          created: new Date().toISOString(),
          updated: new Date().toISOString(),
          tags: ['weather', 'forecast', 'public'],
        },
        atpProfile: {
          trustLevel: TrustLevel.VERIFIED,
          verificationStatus: 'verified',
          capabilities: ['read-public', 'basic-operations'],
          lastVerified: new Date().toISOString(),
          reputation: {
            score: 85,
            interactions: 1500,
            successRate: 0.98,
          },
          securityFeatures: {
            encryption: true,
            authentication: true,
            auditLogging: true,
            rateLimiting: true,
          },
        },
      },
      {
        did: 'did:atp:z6MkrJVnaZkeFzdQyQSUHZOGPUQcDYRKnU5S8gvN8zfPjDp2',
        name: 'FileManagerBot',
        description: 'Secure file operations and management',
        version: '2.1.0',
        endpoints: {
          discovery: 'http://localhost:3009/discovery',
          communication: 'http://localhost:3009/communicate',
          status: 'http://localhost:3009/status',
        },
        capabilities: [
          {
            name: 'file-read',
            description: 'Read file contents',
            version: '2.0.0',
            trustLevelRequired: TrustLevel.BASIC,
            permissions: ['file-read', 'basic-operations'],
          },
          {
            name: 'file-write',
            description: 'Write file contents',
            version: '2.0.0',
            trustLevelRequired: TrustLevel.VERIFIED,
            permissions: ['file-write', 'credential-operations'],
          },
          {
            name: 'file-admin',
            description: 'Administrative file operations',
            version: '2.1.0',
            trustLevelRequired: TrustLevel.PREMIUM,
            permissions: ['file-admin', 'advanced-operations'],
          },
        ],
        metadata: {
          created: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          updated: new Date().toISOString(),
          tags: ['file-management', 'storage', 'secure'],
        },
        atpProfile: {
          trustLevel: TrustLevel.PREMIUM,
          verificationStatus: 'verified',
          capabilities: ['file-read', 'file-write', 'file-admin', 'advanced-operations'],
          lastVerified: new Date().toISOString(),
          reputation: {
            score: 92,
            interactions: 5200,
            successRate: 0.995,
          },
          securityFeatures: {
            encryption: true,
            authentication: true,
            auditLogging: true,
            rateLimiting: true,
          },
        },
      },
    ];

    // Register example agents
    exampleAgents.forEach(agent => {
      this.agents.set(agent.did, agent);
      
      // Index by capabilities
      for (const capability of agent.capabilities) {
        if (!this.agentsByCapability.has(capability.name)) {
          this.agentsByCapability.set(capability.name, new Set());
        }
        this.agentsByCapability.get(capability.name)?.add(agent.did);
      }
      
      // Index by trust level
      if (!this.agentsByTrustLevel.has(agent.atpProfile.trustLevel)) {
        this.agentsByTrustLevel.set(agent.atpProfile.trustLevel, new Set());
      }
      this.agentsByTrustLevel.get(agent.atpProfile.trustLevel)?.add(agent.did);
    });

    console.log(`Initialized A2A Discovery with ${exampleAgents.length} example agents`);
  }

  // Statistics and monitoring
  getStats(): {
    totalAgents: number;
    agentsByTrustLevel: Record<string, number>;
    topCapabilities: Array<{ name: string; agentCount: number }>;
  } {
    const agentsByTrustLevel: Record<string, number> = {};
    for (const [level, agents] of this.agentsByTrustLevel.entries()) {
      agentsByTrustLevel[level] = agents.size;
    }

    const topCapabilities = Array.from(this.agentsByCapability.entries())
      .map(([name, agents]) => ({ name, agentCount: agents.size }))
      .sort((a, b) => b.agentCount - a.agentCount)
      .slice(0, 10);

    return {
      totalAgents: this.agents.size,
      agentsByTrustLevel,
      topCapabilities,
    };
  }
}