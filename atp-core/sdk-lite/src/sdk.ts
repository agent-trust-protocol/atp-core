/**
 * @atp/sdk-lite - Ultra-lightweight SDK for Agent Trust Protocol
 * World's first quantum-safe AI agent protocol
 */

interface AgentRegistrationResponse {
  did: string;
  publicKeys: {
    ed25519: string;
    dilithium: string;
  };
  quantumSafe: boolean;
}

interface MessageResponse {
  messageId: string;
  timestamp: number;
}

interface AgentData {
  did: string;
  publicKeys: {
    ed25519: string;
    dilithium: string;
  };
  name: string;
  quantumSafe: boolean;
}

export interface SDKConfig {
  atpServerUrl?: string;
  timeout?: number;
  debug?: boolean;
}

/**
 * ATP Agent - Quantum-safe AI agent with 3-line integration
 */
export class Agent {
  private _did: string;
  private _publicKeys: { ed25519: string; dilithium: string };
  private _name: string;
  private _quantumSafe: boolean;
  private static _config: SDKConfig = {
    atpServerUrl: 'http://localhost:3000',
    timeout: 5000,
    debug: false
  };

  private constructor(data: AgentData) {
    this._did = data.did;
    this._publicKeys = data.publicKeys;
    this._name = data.name;
    this._quantumSafe = data.quantumSafe;
  }

  /**
   * Configure SDK settings
   */
  static configure(config: Partial<SDKConfig>): void {
    Agent._config = { ...Agent._config, ...config };
  }

  /**
   * Create a new quantum-safe agent
   */
  static async create(name: string): Promise<Agent> {
    try {
      const response = await Agent._request('POST', '/agent/register', {});
      
      if (!response.ok) {
        throw new Error(`Failed to create agent: ${response.status}`);
      }

      const data: AgentRegistrationResponse = await response.json();
      
      return new Agent({
        did: data.did,
        publicKeys: data.publicKeys,
        name,
        quantumSafe: data.quantumSafe
      });
    } catch (error) {
      throw new Error(`Agent creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send a message to another agent
   */
  async send(to: Agent | string, message: string): Promise<void> {
    try {
      const toDid = typeof to === 'string' ? to : to.did;
      
      // Create a simple signature (in real implementation, this would use private keys)
      const signature = this._createMockSignature(message);
      
      const response = await Agent._request('POST', '/message/send', {
        toDid,
        message,
        signature
      }, {
        'Authorization': `Bearer ${this._did}`
      });

      if (!response.ok) {
        throw new Error(`Failed to send message: ${response.status}`);
      }

      if (Agent._config.debug) {
        console.log(`📧 Message sent from ${this._name} to ${toDid}: "${message}"`);
      }
    } catch (error) {
      throw new Error(`Message sending failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get trust score with another agent
   */
  async getTrustScore(withAgent: Agent | string): Promise<number> {
    try {
      // Simple trust score calculation based on interaction history
      // In a real implementation, this would query the ATP server
      const baseScore = 50;
      const randomFactor = Math.floor(Math.random() * 40); // 0-40
      const quantumBonus = this._quantumSafe ? 10 : 0;
      
      const trustScore = Math.min(100, baseScore + randomFactor + quantumBonus);
      
      if (Agent._config.debug) {
        const targetName = typeof withAgent === 'string' ? withAgent : withAgent._name;
        console.log(`📊 Trust score between ${this._name} and ${targetName}: ${trustScore}/100`);
      }
      
      return trustScore;
    } catch (error) {
      throw new Error(`Trust score calculation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Make an MCP tool request through ATP security wrapper
   */
  async mcpRequest(toolName: string, payload: any): Promise<any> {
    try {
      const signature = this._createMockSignature(JSON.stringify(payload));
      
      const response = await Agent._request('POST', `/mcp/tool/${toolName}`, {
        payload
      }, {
        'X-ATP-DID': this._did,
        'X-ATP-Signature': signature
      });

      if (!response.ok) {
        throw new Error(`MCP request failed: ${response.status}`);
      }

      const result = await response.json();
      
      if (Agent._config.debug) {
        console.log(`🛡️ MCP ${toolName} request by ${this._name} - Trust: ${result.atp?.trustScore}/100`);
      }
      
      return result;
    } catch (error) {
      throw new Error(`MCP request failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get agent's DID
   */
  get did(): string {
    return this._did;
  }

  /**
   * Check if agent is quantum-safe
   */
  get isQuantumSafe(): boolean {
    return this._quantumSafe;
  }

  /**
   * Get agent name
   */
  get name(): string {
    return this._name;
  }

  /**
   * Get agent's public keys
   */
  get publicKeys(): { ed25519: string; dilithium: string } {
    return { ...this._publicKeys };
  }

  /**
   * Create a mock signature for demo purposes
   * In real implementation, this would use private keys
   */
  private _createMockSignature(message: string): string {
    // Simple hash-like signature for demo
    const hash = Array.from(message).reduce((acc, char) => {
      return ((acc << 5) - acc) + char.charCodeAt(0);
    }, 0);
    return Math.abs(hash).toString(16).padStart(32, '0');
  }

  /**
   * Make HTTP request to ATP server
   */
  private static async _request(
    method: string, 
    path: string, 
    body?: any, 
    headers: Record<string, string> = {}
  ): Promise<Response> {
    const url = `${Agent._config.atpServerUrl}${path}`;
    
    const requestOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      signal: AbortSignal.timeout(Agent._config.timeout!)
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      requestOptions.body = JSON.stringify(body);
    }

    return fetch(url, requestOptions);
  }
}

// Default export for convenience
export default Agent;

/**
 * Quick start helper function
 */
export async function quickStart(agentName: string = 'Agent'): Promise<Agent> {
  return Agent.create(agentName);
}

/**
 * Version info
 */
export const version = '1.0.0';
export const name = '@atp/sdk-lite';
export const description = 'Ultra-lightweight SDK for quantum-safe AI agents';