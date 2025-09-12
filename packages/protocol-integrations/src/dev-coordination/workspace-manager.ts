/**
 * Workspace Manager - Coordinates agent-specific workspace boundaries
 */

import { AgentSpecialization, AgentWorkspace, SharedResource, ConflictBoundary, SupportedProtocol } from './types';
import { SupportedProtocol as FederationProtocol } from '../federation/types';

export class WorkspaceManager {
  private workspaces: Map<AgentSpecialization, AgentWorkspace> = new Map();
  private sharedResources: Map<string, SharedResource> = new Map();
  private conflictBoundaries: Map<string, ConflictBoundary> = new Map();

  constructor() {
    this.initializeWorkspaces();
  }

  private initializeWorkspaces(): void {
    // MCP-Agent Workspace
    const mcpWorkspace: AgentWorkspace = {
      agentId: AgentSpecialization.MCP_AGENT,
      name: 'Anthropic MCP Integration Agent',
      description: 'Focuses on Anthropic MCP protocol integration with security wrapper',
      protocols: [FederationProtocol.MCP, FederationProtocol.ATP],
      workspaceDirectory: 'src/mcp-agent',
      dependencies: [AgentSpecialization.ANP_AGENT], // Needs federation for cross-domain
      sharedResources: [
        this.createSharedResource('mcp-types', 'type-definitions', 'src/types/mcp.ts'),
        this.createSharedResource('security-context', 'security-context', 'src/shared/security.ts'),
        this.createSharedResource('federation-bridge', 'protocol-bridge', 'src/federation/mcp-bridge.ts')
      ],
      conflictBoundaries: [
        this.createConflictBoundary('mcp-protocol-impl', 'MCP protocol implementation conflicts', ['mcp-tools', 'mcp-server'])
      ],
      communicationPatterns: []
    };

    // A2A-Agent Workspace  
    const a2aWorkspace: AgentWorkspace = {
      agentId: AgentSpecialization.A2A_AGENT,
      name: 'Google A2A Integration Agent',
      description: 'Handles Google A2A protocol with trust bridge implementation',
      protocols: [FederationProtocol.WEBSOCKET, FederationProtocol.ATP], // A2A uses WebSocket transport
      workspaceDirectory: 'src/a2a-agent',
      dependencies: [AgentSpecialization.ANP_AGENT], // Needs federation for protocol bridging
      sharedResources: [
        this.createSharedResource('a2a-types', 'type-definitions', 'src/types/a2a.ts'),
        this.createSharedResource('trust-bridge', 'protocol-bridge', 'src/a2a/trust-bridge.ts'),
        this.createSharedResource('security-context', 'security-context', 'src/shared/security.ts')
      ],
      conflictBoundaries: [
        this.createConflictBoundary('a2a-discovery', 'A2A discovery service conflicts', ['discovery-service', 'peer-registry'])
      ],
      communicationPatterns: []
    };

    // Enterprise-Agent Workspace
    const enterpriseWorkspace: AgentWorkspace = {
      agentId: AgentSpecialization.ENTERPRISE_AGENT,
      name: 'Enterprise Protocol Integration Agent', 
      description: 'Manages IBM ACP/Cisco AGP enterprise compatibility bridges',
      protocols: [FederationProtocol.ACP, FederationProtocol.AGP, FederationProtocol.ATP],
      workspaceDirectory: 'src/enterprise-agent',
      dependencies: [AgentSpecialization.ANP_AGENT], // Needs federation for enterprise protocols
      sharedResources: [
        this.createSharedResource('enterprise-types', 'type-definitions', 'src/types/enterprise.ts'),
        this.createSharedResource('acp-bridge', 'protocol-bridge', 'src/acp/bridge.ts'),
        this.createSharedResource('agp-bridge', 'protocol-bridge', 'src/agp/bridge.ts'),
        this.createSharedResource('enterprise-security', 'security-context', 'src/enterprise/security.ts')
      ],
      conflictBoundaries: [
        this.createConflictBoundary('enterprise-auth', 'Enterprise authentication conflicts', ['acp-auth', 'agp-auth']),
        this.createConflictBoundary('enterprise-gateway', 'Gateway implementation conflicts', ['acp-gateway', 'agp-gateway'])
      ],
      communicationPatterns: []
    };

    // ANP-Agent Workspace
    const anpWorkspace: AgentWorkspace = {
      agentId: AgentSpecialization.ANP_AGENT,
      name: 'ANP Federation Agent',
      description: 'Develops ANP federation for cross-domain agents',
      protocols: [
        FederationProtocol.ATP,
        FederationProtocol.MCP,
        FederationProtocol.ACP,
        FederationProtocol.AGP,
        FederationProtocol.WEBSOCKET,
        FederationProtocol.KAFKA,
        FederationProtocol.AMQP
      ],
      workspaceDirectory: 'src/anp-agent',
      dependencies: [], // Core federation engine - no dependencies
      sharedResources: [
        this.createSharedResource('federation-types', 'type-definitions', 'src/federation/types.ts'),
        this.createSharedResource('universal-adapter', 'federation-engine', 'src/federation/universal-adapter.ts'),
        this.createSharedResource('protocol-bridge-engine', 'federation-engine', 'src/federation/protocol-bridge.ts'),
        this.createSharedResource('federation-security', 'security-context', 'src/federation/security.ts')
      ],
      conflictBoundaries: [
        this.createConflictBoundary('federation-core', 'Core federation engine conflicts', ['federation-engine', 'protocol-bridge'])
      ],
      communicationPatterns: []
    };

    this.workspaces.set(AgentSpecialization.MCP_AGENT, mcpWorkspace);
    this.workspaces.set(AgentSpecialization.A2A_AGENT, a2aWorkspace);
    this.workspaces.set(AgentSpecialization.ENTERPRISE_AGENT, enterpriseWorkspace);
    this.workspaces.set(AgentSpecialization.ANP_AGENT, anpWorkspace);
  }

  private createSharedResource(id: string, type: string, path: string): SharedResource {
    const resource: SharedResource = {
      resourceId: id,
      resourceType: type as any,
      path,
      accessLevel: 'coordinated-write' as any,
      lockingStrategy: 'cooperative' as any,
      conflictResolution: 'agent-negotiation' as any
    };
    this.sharedResources.set(id, resource);
    return resource;
  }

  private createConflictBoundary(id: string, description: string, conflictingSources: string[]): ConflictBoundary {
    const boundary: ConflictBoundary = {
      boundaryId: id,
      description,
      conflictingSources,
      isolationStrategy: 'module-boundaries' as any,
      coordinationRequired: true
    };
    this.conflictBoundaries.set(id, boundary);
    return boundary;
  }

  getWorkspace(agentId: AgentSpecialization): AgentWorkspace | undefined {
    return this.workspaces.get(agentId);
  }

  getAllWorkspaces(): AgentWorkspace[] {
    return Array.from(this.workspaces.values());
  }

  getSharedResource(resourceId: string): SharedResource | undefined {
    return this.sharedResources.get(resourceId);
  }

  getConflictBoundary(boundaryId: string): ConflictBoundary | undefined {
    return this.conflictBoundaries.get(boundaryId);
  }

  getAgentDependencies(agentId: AgentSpecialization): AgentSpecialization[] {
    const workspace = this.workspaces.get(agentId);
    return workspace ? workspace.dependencies : [];
  }

  getDependentAgents(agentId: AgentSpecialization): AgentSpecialization[] {
    const dependents: AgentSpecialization[] = [];
    for (const workspace of this.workspaces.values()) {
      if (workspace.dependencies.includes(agentId)) {
        dependents.push(workspace.agentId);
      }
    }
    return dependents;
  }

  validateWorkspaceAccess(agentId: AgentSpecialization, resourceId: string, operation: 'read' | 'write'): boolean {
    const workspace = this.workspaces.get(agentId);
    const resource = this.sharedResources.get(resourceId);
    
    if (!workspace || !resource) {
      return false;
    }

    // Check if agent has access to this resource
    const hasResource = workspace.sharedResources.some(r => r.resourceId === resourceId);
    if (!hasResource) {
      return false;
    }

    // Check access level permissions
    switch (resource.accessLevel) {
      case 'read-only' as any:
        return operation === 'read';
      case 'read-write' as any:
      case 'coordinated-write' as any:
        return true;
      case 'exclusive' as any:
        // Would need to check if resource is locked by this agent
        return true; // Simplified for now
      default:
        return false;
    }
  }

  getWorkspaceSummary(): any {
    return {
      totalWorkspaces: this.workspaces.size,
      totalSharedResources: this.sharedResources.size,
      totalConflictBoundaries: this.conflictBoundaries.size,
      workspaces: Array.from(this.workspaces.entries()).map(([id, workspace]) => ({
        agentId: id,
        name: workspace.name,
        protocols: workspace.protocols,
        dependencies: workspace.dependencies,
        sharedResourceCount: workspace.sharedResources.length,
        conflictBoundaryCount: workspace.conflictBoundaries.length
      }))
    };
  }
}