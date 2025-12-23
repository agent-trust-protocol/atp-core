/**
 * Protocol Registry - Manages protocol adapters and bridge configurations
 */

import { 
  SupportedProtocol,
  ProtocolAdapter,
  BridgeConfiguration,
  EndpointInfo
} from '../federation/types';
import { AgentSpecialization } from './types';

export interface ProtocolRegistration {
  protocol: SupportedProtocol;
  adapter: ProtocolAdapter;
  owner: AgentSpecialization;
  status: ProtocolStatus;
  registeredAt: number;
  lastHealthCheck: number;
  metadata: Record<string, any>;
}

export enum ProtocolStatus {
  REGISTERED = 'registered',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ERROR = 'error',
  MAINTENANCE = 'maintenance'
}

export class ProtocolRegistry {
  private protocolAdapters: Map<SupportedProtocol, ProtocolRegistration> = new Map();
  private bridgeConfigurations: Map<string, BridgeConfiguration> = new Map();
  private protocolDependencies: Map<SupportedProtocol, SupportedProtocol[]> = new Map();
  private healthCheckInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initializeCoreBridges();
    this.startHealthChecking();
  }

  private initializeCoreBridges(): void {
    // MCP to ATP Bridge
    const mcpToAtpBridge: BridgeConfiguration = {
      bridgeId: 'mcp-atp-bridge',
      name: 'MCP to ATP Bridge',
      sourceProtocol: SupportedProtocol.MCP,
      targetProtocol: SupportedProtocol.ATP,
      transformationRules: [
        {
          ruleId: 'mcp-tool-call',
          sourceMessageType: 'tools/call',
          targetMessageType: 'rpc-request',
          transformation: '$.tools/call',
          validation: [
            {
              field: 'name',
              type: 'required',
              constraint: true,
              errorMessage: 'Tool name is required'
            }
          ],
          conditions: [
            {
              field: 'method',
              operator: 'eq',
              value: 'tools/call'
            }
          ]
        }
      ],
      securityPolicy: {
        requireAuthentication: true,
        allowedSources: ['*'],
        allowedTargets: ['*'],
        encryptionRequired: false,
        signatureRequired: true,
        accessControlRules: []
      },
      qosPolicy: {
        reliability: 'exactly-once' as any,
        latency: { maxLatency: 1000, preferredLatency: 200 },
        throughput: { minThroughput: 10, maxThroughput: 1000 },
        durability: false,
        ordering: 'fifo' as any
      },
      monitoring: {
        enableMetrics: true,
        enableTracing: true,
        enableLogging: true,
        logLevel: 'info' as any
      }
    };

    // A2A to ATP Bridge  
    const a2aToAtpBridge: BridgeConfiguration = {
      bridgeId: 'a2a-atp-bridge',
      name: 'A2A to ATP Bridge',
      sourceProtocol: SupportedProtocol.WEBSOCKET, // A2A uses WebSocket
      targetProtocol: SupportedProtocol.ATP,
      transformationRules: [
        {
          ruleId: 'a2a-peer-message',
          sourceMessageType: 'peer-message',
          targetMessageType: 'agent-message',
          transformation: '$.peer-message',
          validation: [
            {
              field: 'agentId',
              type: 'required',
              constraint: true,
              errorMessage: 'Agent ID is required'
            }
          ],
          conditions: []
        }
      ],
      securityPolicy: {
        requireAuthentication: true,
        allowedSources: ['*'],
        allowedTargets: ['*'],
        encryptionRequired: true,
        signatureRequired: true,
        accessControlRules: []
      },
      qosPolicy: {
        reliability: 'at-least-once' as any,
        latency: { maxLatency: 500, preferredLatency: 100 },
        throughput: { minThroughput: 50, maxThroughput: 5000 },
        durability: true,
        ordering: 'causal' as any
      },
      monitoring: {
        enableMetrics: true,
        enableTracing: true,
        enableLogging: true,
        logLevel: 'info' as any
      }
    };

    // ACP to ATP Bridge
    const acpToAtpBridge: BridgeConfiguration = {
      bridgeId: 'acp-atp-bridge',
      name: 'IBM ACP to ATP Bridge',
      sourceProtocol: SupportedProtocol.ACP,
      targetProtocol: SupportedProtocol.ATP,
      transformationRules: [
        {
          ruleId: 'acp-agent-message',
          sourceMessageType: 'ACLMessage',
          targetMessageType: 'agent-message',
          transformation: '$.ACLMessage',
          validation: [
            {
              field: 'performative',
              type: 'required',
              constraint: true,
              errorMessage: 'ACL performative is required'
            }
          ],
          conditions: []
        }
      ],
      securityPolicy: {
        requireAuthentication: true,
        allowedSources: ['enterprise'],
        allowedTargets: ['enterprise'],
        encryptionRequired: true,
        signatureRequired: true,
        accessControlRules: [
          {
            principal: 'enterprise-agent',
            resource: 'acp-bridge',
            action: 'transform',
            effect: 'allow'
          }
        ]
      },
      qosPolicy: {
        reliability: 'exactly-once' as any,
        latency: { maxLatency: 2000, preferredLatency: 500 },
        throughput: { minThroughput: 5, maxThroughput: 100 },
        durability: true,
        ordering: 'total' as any
      },
      monitoring: {
        enableMetrics: true,
        enableTracing: true,
        enableLogging: true,
        logLevel: 'debug' as any
      }
    };

    // AGP to ATP Bridge
    const agpToAtpBridge: BridgeConfiguration = {
      bridgeId: 'agp-atp-bridge',
      name: 'Cisco AGP to ATP Bridge',
      sourceProtocol: SupportedProtocol.AGP,
      targetProtocol: SupportedProtocol.ATP,
      transformationRules: [
        {
          ruleId: 'agp-gateway-message',
          sourceMessageType: 'GatewayMessage',
          targetMessageType: 'agent-message',
          transformation: '$.GatewayMessage',
          validation: [
            {
              field: 'gatewayId',
              type: 'required',
              constraint: true,
              errorMessage: 'Gateway ID is required'
            }
          ],
          conditions: []
        }
      ],
      securityPolicy: {
        requireAuthentication: true,
        allowedSources: ['enterprise'],
        allowedTargets: ['enterprise'],
        encryptionRequired: true,
        signatureRequired: true,
        accessControlRules: [
          {
            principal: 'enterprise-agent',
            resource: 'agp-bridge',
            action: 'transform',
            effect: 'allow'
          }
        ]
      },
      qosPolicy: {
        reliability: 'exactly-once' as any,
        latency: { maxLatency: 1500, preferredLatency: 300 },
        throughput: { minThroughput: 10, maxThroughput: 500 },
        durability: true,
        ordering: 'fifo' as any
      },
      monitoring: {
        enableMetrics: true,
        enableTracing: true,
        enableLogging: true,
        logLevel: 'debug' as any
      }
    };

    this.bridgeConfigurations.set('mcp-atp-bridge', mcpToAtpBridge);
    this.bridgeConfigurations.set('a2a-atp-bridge', a2aToAtpBridge);
    this.bridgeConfigurations.set('acp-atp-bridge', acpToAtpBridge);
    this.bridgeConfigurations.set('agp-atp-bridge', agpToAtpBridge);

    // Set up protocol dependencies
    this.protocolDependencies.set(SupportedProtocol.MCP, [SupportedProtocol.ATP]);
    this.protocolDependencies.set(SupportedProtocol.WEBSOCKET, [SupportedProtocol.ATP]); // For A2A
    this.protocolDependencies.set(SupportedProtocol.ACP, [SupportedProtocol.ATP]);
    this.protocolDependencies.set(SupportedProtocol.AGP, [SupportedProtocol.ATP]);
  }

  registerProtocolAdapter(
    protocol: SupportedProtocol, 
    adapter: ProtocolAdapter, 
    owner: AgentSpecialization,
    metadata: Record<string, any> = {}
  ): void {
    const registration: ProtocolRegistration = {
      protocol,
      adapter,
      owner,
      status: ProtocolStatus.REGISTERED,
      registeredAt: Date.now(),
      lastHealthCheck: Date.now(),
      metadata
    };

    this.protocolAdapters.set(protocol, registration);
    console.log(`Protocol adapter registered: ${protocol} by ${owner}`);
  }

  unregisterProtocolAdapter(protocol: SupportedProtocol): boolean {
    const removed = this.protocolAdapters.delete(protocol);
    if (removed) {
      console.log(`Protocol adapter unregistered: ${protocol}`);
    }
    return removed;
  }

  getProtocolAdapter(protocol: SupportedProtocol): ProtocolAdapter | undefined {
    const registration = this.protocolAdapters.get(protocol);
    return registration?.adapter;
  }

  getProtocolRegistration(protocol: SupportedProtocol): ProtocolRegistration | undefined {
    return this.protocolAdapters.get(protocol);
  }

  getBridgeConfiguration(bridgeId: string): BridgeConfiguration | undefined {
    return this.bridgeConfigurations.get(bridgeId);
  }

  getAllBridgeConfigurations(): BridgeConfiguration[] {
    return Array.from(this.bridgeConfigurations.values());
  }

  findBridgeForProtocols(source: SupportedProtocol, target: SupportedProtocol): BridgeConfiguration | undefined {
    for (const bridge of this.bridgeConfigurations.values()) {
      if (bridge.sourceProtocol === source && bridge.targetProtocol === target) {
        return bridge;
      }
    }
    return undefined;
  }

  updateProtocolStatus(protocol: SupportedProtocol, status: ProtocolStatus): boolean {
    const registration = this.protocolAdapters.get(protocol);
    if (registration) {
      registration.status = status;
      registration.lastHealthCheck = Date.now();
      return true;
    }
    return false;
  }

  getActiveProtocols(): SupportedProtocol[] {
    const active: SupportedProtocol[] = [];
    for (const [protocol, registration] of this.protocolAdapters.entries()) {
      if (registration.status === ProtocolStatus.ACTIVE) {
        active.push(protocol);
      }
    }
    return active;
  }

  getProtocolsByOwner(owner: AgentSpecialization): SupportedProtocol[] {
    const protocols: SupportedProtocol[] = [];
    for (const [protocol, registration] of this.protocolAdapters.entries()) {
      if (registration.owner === owner) {
        protocols.push(protocol);
      }
    }
    return protocols;
  }

  getProtocolDependencies(protocol: SupportedProtocol): SupportedProtocol[] {
    return this.protocolDependencies.get(protocol) || [];
  }

  validateProtocolDependencies(protocol: SupportedProtocol): boolean {
    const dependencies = this.getProtocolDependencies(protocol);
    
    for (const dependency of dependencies) {
      const registration = this.protocolAdapters.get(dependency);
      if (!registration || registration.status !== ProtocolStatus.ACTIVE) {
        return false;
      }
    }
    
    return true;
  }

  private startHealthChecking(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, 30000); // Every 30 seconds
  }

  private async performHealthChecks(): Promise<void> {
    for (const [protocol, registration] of this.protocolAdapters.entries()) {
      try {
        // Get endpoint info to check if adapter is responsive
        const endpointInfo = registration.adapter.getEndpointInfo();
        
        // Update status based on availability
        if (endpointInfo && this.validateProtocolDependencies(protocol)) {
          registration.status = ProtocolStatus.ACTIVE;
        } else {
          registration.status = ProtocolStatus.INACTIVE;
        }
        
        registration.lastHealthCheck = Date.now();
        
      } catch (error) {
        console.error(`Health check failed for protocol ${protocol}:`, error);
        registration.status = ProtocolStatus.ERROR;
        registration.lastHealthCheck = Date.now();
      }
    }
  }

  getRegistryStatus(): any {
    return {
      totalProtocols: this.protocolAdapters.size,
      totalBridges: this.bridgeConfigurations.size,
      activeProtocols: this.getActiveProtocols().length,
      protocolStatus: Object.fromEntries(
        Array.from(this.protocolAdapters.entries()).map(([protocol, registration]) => [
          protocol,
          {
            status: registration.status,
            owner: registration.owner,
            lastHealthCheck: registration.lastHealthCheck,
            registeredAt: registration.registeredAt
          }
        ])
      ),
      bridgeConfigurations: Array.from(this.bridgeConfigurations.keys())
    };
  }

  cleanup(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
  }
}