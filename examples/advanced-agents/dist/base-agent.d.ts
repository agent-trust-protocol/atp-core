import WebSocket from 'ws';
export interface AgentConfig {
    name: string;
    capabilities: string[];
    gatewayUrl?: string;
    wsUrl?: string;
    identityServiceUrl?: string;
    vcServiceUrl?: string;
    permissionServiceUrl?: string;
}
export interface AgentCredential {
    id: string;
    type: string;
    issuer: string;
    subject: string;
    claims: Record<string, any>;
    proof: any;
}
export interface TrustRelationship {
    agentDid: string;
    trustLevel: 'unknown' | 'basic' | 'verified' | 'trusted';
    capabilities: string[];
    credentials: AgentCredential[];
    lastInteraction: Date;
}
export declare class BaseAgent {
    did: string | null;
    publicKey: string;
    privateKey: string;
    credentials: AgentCredential[];
    trustNetwork: Map<string, TrustRelationship>;
    ws: WebSocket | null;
    protected config: AgentConfig;
    protected messageHandlers: Map<string, Function>;
    private pendingRequests;
    constructor(config: AgentConfig);
    private generateKeyPair;
    private setupMessageHandlers;
    initialize(): Promise<void>;
    private registerIdentity;
    private connectToGateway;
    private loadCredentials;
    private handleMessage;
    sendRequest(method: string, params?: any, targetAgent?: string): Promise<any>;
    sendResponse(id: string, result: any): Promise<void>;
    sendError(id: string, error: {
        code: number;
        message: string;
    }): Promise<void>;
    establishTrust(targetAgentDid: string): Promise<TrustRelationship>;
    private verifyAgentCredentials;
    requestCapability(targetAgentDid: string, capability: string): Promise<boolean>;
    private handleTrustHandshake;
    private handleCapabilityRequest;
    private handleCredentialVerification;
    private handleCollaborationInvite;
    private handleToolDelegation;
    disconnect(): Promise<void>;
    getTrustNetwork(): TrustRelationship[];
    getCapabilities(): string[];
    getCredentials(): AgentCredential[];
}
//# sourceMappingURL=base-agent.d.ts.map