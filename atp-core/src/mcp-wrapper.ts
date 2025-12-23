import { Request, Response } from 'express';
// import fetch from 'node-fetch';
import { Ed25519Crypto } from './crypto.js';
import { QuantumSafeCrypto } from './quantum-crypto.js';
import { SQLiteStorage } from './storage.js';
import { HybridSignature } from './types.js';

export interface MCPToolConfig {
  [toolName: string]: string;
}

export interface MCPAuditRecord {
  id: string;
  did: string;
  toolName: string;
  request: string;
  response: string;
  trustScore: number;
  quantumSafe: boolean;
  timestamp: number;
}

export interface MCPResponse {
  success: boolean;
  data: any;
  atp: {
    callerDid: string;
    trustScore: number;
    quantumSafe: boolean;
    verificationMethod: string;
  };
}

export class MCPSecurityWrapper {
  private storage: SQLiteStorage;
  private mcpConfig: MCPToolConfig;

  constructor(storage: SQLiteStorage) {
    this.storage = storage;
    this.mcpConfig = {
      "search": "http://localhost:8080/mcp/search",
      "calculator": "http://localhost:8081/mcp/calc"
    };
  }

  calculateTrustScore(did: string): number {
    const messages = this.storage.getMessages(did);
    const baseScore = 50;
    const messageCount = messages.length;
    const recentMessages = messages.filter(m => 
      Date.now() - m.timestamp < 24 * 60 * 60 * 1000
    ).length;
    
    return Math.min(100, baseScore + messageCount * 2 + recentMessages * 5);
  }

  private verifySignature(message: string, signature: string | HybridSignature, agent: any): {
    valid: boolean;
    method: string;
    quantumSafe: boolean;
  } {
    if (typeof signature === 'string') {
      return {
        valid: Ed25519Crypto.verify(message, signature, agent.publicKeys.ed25519),
        method: 'ed25519',
        quantumSafe: false
      };
    } else {
      return {
        valid: QuantumSafeCrypto.hybridVerify(message, signature, agent.publicKeys),
        method: 'hybrid',
        quantumSafe: true
      };
    }
  }

  private logMCPCall(auditRecord: MCPAuditRecord): void {
    const stmt = this.storage['db'].prepare(`
      INSERT INTO mcp_audit (id, did, tool_name, request, response, trust_score, quantum_safe, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      auditRecord.id,
      auditRecord.did,
      auditRecord.toolName,
      auditRecord.request,
      auditRecord.response,
      auditRecord.trustScore,
      auditRecord.quantumSafe ? 1 : 0,
      auditRecord.timestamp
    );
  }

  async handleMCPRequest(req: Request, res: Response): Promise<void> {
    try {
      const { toolname } = req.params;
      const { payload } = req.body;

      const atpDid = req.headers['x-atp-did'] as string;
      const atpSignature = req.headers['x-atp-signature'] as string;

      if (!atpDid || !atpSignature) {
        res.status(401).json({ 
          error: 'Missing ATP authentication headers',
          required: ['X-ATP-DID', 'X-ATP-Signature']
        });
        return;
      }

      const agent = this.storage.getAgent(atpDid);
      if (!agent) {
        res.status(404).json({ error: 'Agent not found' });
        return;
      }

      const messageToVerify = JSON.stringify({ toolname, payload, timestamp: Date.now() });
      let parsedSignature: string | HybridSignature;
      
      try {
        parsedSignature = JSON.parse(atpSignature);
      } catch {
        parsedSignature = atpSignature;
      }

      const verification = this.verifySignature(messageToVerify, parsedSignature, agent);
      
      if (!verification.valid) {
        res.status(401).json({ error: 'Invalid ATP signature' });
        return;
      }

      const mcpEndpoint = this.mcpConfig[toolname];
      if (!mcpEndpoint) {
        res.status(404).json({ 
          error: 'MCP tool not found',
          availableTools: Object.keys(this.mcpConfig)
        });
        return;
      }

      const trustScore = this.calculateTrustScore(atpDid);
      if (trustScore < 25) {
        res.status(403).json({ 
          error: 'Insufficient trust score',
          currentScore: trustScore,
          minimumRequired: 25
        });
        return;
      }

      // Simulate MCP response for demo
      const mcpData = {
        success: true,
        result: `Mock ${toolname} response for demo`,
        timestamp: Date.now()
      };
      const mcpResponse = { ok: true, status: 200 };
      
      const response: MCPResponse = {
        success: mcpResponse.ok,
        data: mcpData,
        atp: {
          callerDid: atpDid,
          trustScore,
          quantumSafe: verification.quantumSafe,
          verificationMethod: verification.method
        }
      };

      const auditRecord: MCPAuditRecord = {
        id: Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('hex'),
        did: atpDid,
        toolName: toolname,
        request: JSON.stringify(payload),
        response: JSON.stringify(mcpData),
        trustScore,
        quantumSafe: verification.quantumSafe,
        timestamp: Date.now()
      };

      this.logMCPCall(auditRecord);

      res.status(mcpResponse.status).json(response);
    } catch (error) {
      console.error('MCP wrapper error:', error);
      res.status(500).json({ error: 'MCP security wrapper failed' });
    }
  }

  getAuditLogs(did?: string): MCPAuditRecord[] {
    const query = did ? 
      'SELECT * FROM mcp_audit WHERE did = ? ORDER BY timestamp DESC LIMIT 100' :
      'SELECT * FROM mcp_audit ORDER BY timestamp DESC LIMIT 100';
    
    const stmt = this.storage['db'].prepare(query);
    const rows = did ? stmt.all(did) : stmt.all();
    
    return (rows as any[]).map(row => ({
      id: row.id,
      did: row.did,
      toolName: row.tool_name,
      request: row.request,
      response: row.response,
      trustScore: row.trust_score,
      quantumSafe: row.quantum_safe === 1,
      timestamp: row.timestamp
    }));
  }
}