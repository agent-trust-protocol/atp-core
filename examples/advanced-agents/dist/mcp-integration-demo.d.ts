import { BaseAgent } from './base-agent.js';
/**
 * MCP Integration Concepts for Agent Trust Protocol:
 *
 * 1. Transport Layer Integration - Use MCP's efficient transport for agent communication
 * 2. Tool Delegation - Enable trusted agents to share and delegate MCP tools
 * 3. Identity Bridge - DID-based authentication for MCP connections
 * 4. Capability Tokens - ATP permissions as MCP authorization mechanism
 */
interface MCPTool {
    name: string;
    description: string;
    inputSchema: any;
    owner: string;
    trustLevel: 'public' | 'verified' | 'trusted';
    capabilities: string[];
}
interface MCPSession {
    sessionId: string;
    agentDid: string;
    tools: MCPTool[];
    permissions: string[];
    established: Date;
}
export declare class MCPIntegratedAgent extends BaseAgent {
    private mcpTools;
    private mcpSessions;
    private delegatedTools;
    constructor(name: string, mcpEnabled?: boolean);
    private setupMCPHandlers;
    private initializeMCPTools;
    establishMCPSession(targetAgent: string): Promise<MCPSession>;
    private deriveMCPPermissions;
    private getAuthorizedTools;
    delegateMCPTool(toolName: string, targetAgent: string, duration?: number): Promise<boolean>;
    requestMCPCapability(targetAgent: string, capability: string): Promise<MCPTool[]>;
    executeDelegatedTool(toolName: string, params: any, delegationToken: string): Promise<any>;
    private executeMCPTool;
    private handleMCPSessionEstablishment;
    private handleMCPToolDelegation;
    private handleMCPToolExecution;
    private handleMCPCapabilityRequest;
    getMCPTools(): MCPTool[];
    getMCPSessions(): MCPSession[];
    getDelegatedTools(): any[];
}
export declare function demonstrateMCPIntegration(): Promise<void>;
export declare const MCPIntegrationRoadmap: {
    'Phase 1': {
        description: string;
        features: string[];
    };
    'Phase 2': {
        description: string;
        features: string[];
    };
    'Phase 3': {
        description: string;
        features: string[];
    };
    'Phase 4': {
        description: string;
        features: string[];
    };
};
export {};
//# sourceMappingURL=mcp-integration-demo.d.ts.map