// Base Agent class for advanced agent-to-agent communication
import WebSocket from 'ws';
import axios from 'axios';
// Simple crypto initialization for demo
function initializeCrypto() {
    // Placeholder for crypto setup
}
initializeCrypto();
export class BaseAgent {
    did = null;
    publicKey;
    privateKey;
    credentials = [];
    trustNetwork = new Map();
    ws = null;
    config;
    messageHandlers = new Map();
    pendingRequests = new Map();
    constructor(config) {
        this.config = config;
        // Generate key pair for this agent
        const keyPair = this.generateKeyPair();
        this.publicKey = keyPair.publicKey;
        this.privateKey = keyPair.privateKey;
        this.setupMessageHandlers();
    }
    generateKeyPair() {
        // Simple key generation for demo purposes
        const timestamp = Date.now();
        const randomPart = Math.random().toString(36).substring(2);
        return {
            publicKey: `pub_${this.config.name}_${timestamp}_${randomPart}`,
            privateKey: `priv_${this.config.name}_${timestamp}_${randomPart}`
        };
    }
    setupMessageHandlers() {
        this.messageHandlers.set('capability.request', this.handleCapabilityRequest.bind(this));
        this.messageHandlers.set('credential.verify', this.handleCredentialVerification.bind(this));
        this.messageHandlers.set('trust.handshake', this.handleTrustHandshake.bind(this));
        this.messageHandlers.set('collaboration.invite', this.handleCollaborationInvite.bind(this));
        this.messageHandlers.set('tool.delegate', this.handleToolDelegation.bind(this));
    }
    async initialize() {
        console.log(`🤖 Initializing agent: ${this.config.name}`);
        try {
            // Register with identity service
            await this.registerIdentity();
            // Connect to RPC gateway
            await this.connectToGateway();
            // Load existing credentials
            await this.loadCredentials();
            console.log(`✅ Agent ${this.config.name} initialized with DID: ${this.did}`);
        }
        catch (error) {
            console.error(`❌ Failed to initialize agent ${this.config.name}:`, error.message);
            throw error;
        }
    }
    async registerIdentity() {
        const identityUrl = this.config.identityServiceUrl || 'http://localhost:3001';
        const response = await axios.post(`${identityUrl}/identity/register`, {
            publicKey: this.publicKey
        });
        this.did = response.data.data.did;
    }
    async connectToGateway() {
        const wsUrl = this.config.wsUrl || 'ws://localhost:8081';
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(wsUrl);
            this.ws.on('open', () => {
                console.log(`🔗 Agent ${this.config.name} connected to gateway`);
                resolve();
            });
            this.ws.on('message', this.handleMessage.bind(this));
            this.ws.on('error', (error) => {
                console.error(`❌ WebSocket error for ${this.config.name}:`, error);
                reject(error);
            });
            this.ws.on('close', () => {
                console.log(`🔌 Agent ${this.config.name} disconnected from gateway`);
                this.ws = null;
            });
        });
    }
    async loadCredentials() {
        try {
            const vcUrl = this.config.vcServiceUrl || 'http://localhost:3002';
            const response = await axios.get(`${vcUrl}/credentials/subject/${this.did}`);
            this.credentials = response.data.data || [];
            console.log(`📜 Loaded ${this.credentials.length} credentials for ${this.config.name}`);
        }
        catch (error) {
            console.log(`📜 No existing credentials found for ${this.config.name}`);
            this.credentials = [];
        }
    }
    handleMessage(data) {
        try {
            const message = JSON.parse(data.toString());
            if (message.id && this.pendingRequests.has(message.id)) {
                // Response to our request
                const pending = this.pendingRequests.get(message.id);
                this.pendingRequests.delete(message.id);
                if (message.error) {
                    pending.reject(new Error(message.error.message));
                }
                else {
                    pending.resolve(message.result);
                }
            }
            else if (message.method && this.messageHandlers.has(message.method)) {
                // Incoming request from another agent
                const handler = this.messageHandlers.get(message.method);
                handler(message.params, message.id);
            }
        }
        catch (error) {
            console.error(`❌ Error handling message for ${this.config.name}:`, error);
        }
    }
    async sendRequest(method, params = {}, targetAgent) {
        if (!this.ws) {
            throw new Error('Not connected to gateway');
        }
        const id = `${this.config.name}_${Date.now()}_${Math.random().toString(36).substring(2)}`;
        const request = {
            jsonrpc: '2.0',
            method,
            params: {
                ...params,
                fromAgent: this.did,
                targetAgent
            },
            id
        };
        return new Promise((resolve, reject) => {
            this.pendingRequests.set(id, { resolve, reject });
            this.ws.send(JSON.stringify(request));
            // Timeout after 30 seconds
            setTimeout(() => {
                if (this.pendingRequests.has(id)) {
                    this.pendingRequests.delete(id);
                    reject(new Error('Request timeout'));
                }
            }, 30000);
        });
    }
    async sendResponse(id, result) {
        if (!this.ws)
            return;
        const response = {
            jsonrpc: '2.0',
            result,
            id
        };
        this.ws.send(JSON.stringify(response));
    }
    async sendError(id, error) {
        if (!this.ws)
            return;
        const response = {
            jsonrpc: '2.0',
            error,
            id
        };
        this.ws.send(JSON.stringify(response));
    }
    // Trust and capability management
    async establishTrust(targetAgentDid) {
        console.log(`🤝 ${this.config.name} establishing trust with ${targetAgentDid}`);
        try {
            // Initiate trust handshake
            const handshakeResult = await this.sendRequest('trust.handshake', {
                capabilities: this.config.capabilities,
                credentials: this.credentials.map(c => ({ id: c.id, type: c.type }))
            }, targetAgentDid);
            // Verify credentials if provided
            const trustLevel = await this.verifyAgentCredentials(targetAgentDid, handshakeResult.credentials);
            const relationship = {
                agentDid: targetAgentDid,
                trustLevel,
                capabilities: handshakeResult.capabilities || [],
                credentials: handshakeResult.credentials || [],
                lastInteraction: new Date()
            };
            this.trustNetwork.set(targetAgentDid, relationship);
            console.log(`✅ Trust established with ${targetAgentDid} at level: ${trustLevel}`);
            return relationship;
        }
        catch (error) {
            console.error(`❌ Failed to establish trust with ${targetAgentDid}:`, error.message);
            throw error;
        }
    }
    async verifyAgentCredentials(agentDid, credentials) {
        if (!credentials || credentials.length === 0) {
            return 'basic';
        }
        // In a real implementation, verify credentials against VC service
        // For demo, we'll simulate verification logic
        const hasValidCredentials = credentials.some(c => c.type === 'AgentCapabilityCredential');
        const hasHighTrustCredentials = credentials.some(c => c.type === 'TrustedAgentCredential');
        if (hasHighTrustCredentials)
            return 'trusted';
        if (hasValidCredentials)
            return 'verified';
        return 'basic';
    }
    async requestCapability(targetAgentDid, capability) {
        console.log(`🔍 ${this.config.name} requesting capability '${capability}' from ${targetAgentDid}`);
        const relationship = this.trustNetwork.get(targetAgentDid);
        if (!relationship) {
            console.log(`⚠️ No trust relationship with ${targetAgentDid}, establishing trust first...`);
            await this.establishTrust(targetAgentDid);
        }
        try {
            const result = await this.sendRequest('capability.request', {
                capability,
                context: `Request from ${this.config.name}`
            }, targetAgentDid);
            console.log(`${result.granted ? '✅' : '❌'} Capability '${capability}' ${result.granted ? 'granted' : 'denied'}`);
            return result.granted;
        }
        catch (error) {
            console.error(`❌ Error requesting capability:`, error.message);
            return false;
        }
    }
    // Message handlers
    async handleTrustHandshake(params, id) {
        console.log(`🤝 ${this.config.name} received trust handshake from ${params.fromAgent}`);
        const response = {
            capabilities: this.config.capabilities,
            credentials: this.credentials.map(c => ({ id: c.id, type: c.type, issuer: c.issuer })),
            trustPolicy: 'open', // or 'restricted' based on agent policy
        };
        await this.sendResponse(id, response);
    }
    async handleCapabilityRequest(params, id) {
        console.log(`🔍 ${this.config.name} received capability request for '${params.capability}' from ${params.fromAgent}`);
        const hasCapability = this.config.capabilities.includes(params.capability);
        const relationship = this.trustNetwork.get(params.fromAgent);
        const trustAuthorized = relationship && ['verified', 'trusted'].includes(relationship.trustLevel);
        const granted = hasCapability && (trustAuthorized || this.config.capabilities.includes('open-sharing'));
        await this.sendResponse(id, {
            granted,
            capability: params.capability,
            reason: granted ? 'Authorized' : 'Insufficient trust or capability not available'
        });
    }
    async handleCredentialVerification(params, id) {
        console.log(`📜 ${this.config.name} verifying credential for ${params.fromAgent}`);
        // Simulate credential verification
        const verified = Math.random() > 0.2; // 80% success rate for demo
        await this.sendResponse(id, {
            verified,
            credentialId: params.credentialId,
            verificationMethod: 'ATP-Standard-Verification'
        });
    }
    async handleCollaborationInvite(params, id) {
        console.log(`🤝 ${this.config.name} received collaboration invite for '${params.task}' from ${params.fromAgent}`);
        const relationship = this.trustNetwork.get(params.fromAgent);
        const accepted = relationship && ['verified', 'trusted'].includes(relationship.trustLevel);
        await this.sendResponse(id, {
            accepted,
            task: params.task,
            availableCapabilities: accepted ? this.config.capabilities : []
        });
    }
    async handleToolDelegation(params, id) {
        console.log(`🛠️ ${this.config.name} received tool delegation request for '${params.tool}' from ${params.fromAgent}`);
        // This is where MCP integration would be powerful
        const relationship = this.trustNetwork.get(params.fromAgent);
        const authorized = relationship && relationship.trustLevel === 'trusted';
        await this.sendResponse(id, {
            authorized,
            tool: params.tool,
            delegationToken: authorized ? `token_${Date.now()}` : null,
            mcpCompatible: true // Future MCP integration flag
        });
    }
    async disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        console.log(`👋 Agent ${this.config.name} disconnected`);
    }
    // Utility methods
    getTrustNetwork() {
        return Array.from(this.trustNetwork.values());
    }
    getCapabilities() {
        return this.config.capabilities;
    }
    getCredentials() {
        return this.credentials;
    }
}
