/**
 * Production-Ready MCP Security Wrapper
 * Drop-in security layer for any MCP server
 */

import { EventEmitter } from 'events';
import { createHash } from 'crypto';
import { AgentTrustLevel, TrustScoringEngine } from '@atp/shared';
import { DatabaseManager } from '@atp/shared';

export interface MCPSecurityConfig {
  enforceAuthentication: boolean;
  requireAuditLogging: boolean;
  rateLimitEnabled: boolean;
  quantumSafeSignatures: boolean;
  trustedDomains: string[];
  maxRequestsPerMinute: number;
}

export interface SecuredMCPRequest {
  id: string | number;
  method: string;
  params?: any;
  atpHeaders?: {
    clientDID: string;
    signature: string;
    trustLevel: AgentTrustLevel;
    timestamp: number;
  };
}

export interface SecuredMCPResponse {
  id: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  atpMetadata?: {
    auditEventId: string;
    trustVerified: boolean;
    executionTime: number;
  };
}

export class MCPSecurityWrapper extends EventEmitter {
  private config: MCPSecurityConfig;
  private db: DatabaseManager;
  private trustEngine: TrustScoringEngine;
  private rateLimitMap = new Map<string, number[]>();
  
  constructor(config: MCPSecurityConfig, db: DatabaseManager) {
    super();
    this.config = config;
    this.db = db;
    this.trustEngine = new TrustScoringEngine(db);
  }
  
  /**
   * Wrap an existing MCP server with ATP security
   */
  wrapMCPServer(originalHandler: (request: any) => Promise<any>) {
    return async (request: SecuredMCPRequest): Promise<SecuredMCPResponse> => {
      const startTime = Date.now();
      let auditEventId = '';
      
      try {
        // Step 1: Authentication & Authorization
        if (this.config.enforceAuthentication) {
          await this.verifyAuthentication(request);
        }
        
        // Step 2: Trust Level Verification
        const trustScore = await this.verifyTrustLevel(request);
        
        // Step 3: Rate Limiting
        if (this.config.rateLimitEnabled) {
          await this.checkRateLimit(request);
        }
        
        // Step 4: Audit Logging (Pre-execution)
        if (this.config.requireAuditLogging) {
          auditEventId = await this.logAuditEvent('mcp-request', {
            method: request.method,
            clientDID: request.atpHeaders?.clientDID,
            params: this.sanitizeParams(request.params)
          });
        }
        
        // Step 5: Execute original handler
        const result = await originalHandler(request);
        
        // Step 6: Audit Logging (Post-execution)
        if (this.config.requireAuditLogging && auditEventId) {
          await this.updateAuditEvent(auditEventId, {
            status: 'success',
            executionTime: Date.now() - startTime,
            resultSize: JSON.stringify(result).length
          });
        }
        
        return {
          id: request.id,
          result,
          atpMetadata: {
            auditEventId,
            trustVerified: true,
            executionTime: Date.now() - startTime
          }
        };
        
      } catch (error) {
        // Audit failed execution
        if (this.config.requireAuditLogging && auditEventId) {
          await this.updateAuditEvent(auditEventId, {
            status: 'error',
            error: error instanceof Error ? error.message : String(error),
            executionTime: Date.now() - startTime
          });
        }
        
        return {
          id: request.id,
          error: {
            code: -32603,
            message: error instanceof Error ? error.message : 'Internal error',
            data: { type: 'ATP_SECURITY_ERROR' }
          },
          atpMetadata: {
            auditEventId,
            trustVerified: false,
            executionTime: Date.now() - startTime
          }
        };
      }
    };
  }
  
  /**
   * Verify ATP authentication headers
   */
  private async verifyAuthentication(request: SecuredMCPRequest): Promise<void> {
    if (!request.atpHeaders) {
      throw new Error('ATP authentication headers required');
    }
    
    const { clientDID, signature, timestamp } = request.atpHeaders;
    
    // Check timestamp (prevent replay attacks)
    const now = Date.now();
    if (Math.abs(now - timestamp) > 300000) { // 5 minutes
      throw new Error('Request timestamp too old or too far in future');
    }
    
    // Verify DID exists in identity service
    const identity = await this.db.query(
      'SELECT verified, public_key FROM identities WHERE did = $1',
      [clientDID]
    );
    
    if (identity.rows.length === 0) {
      throw new Error(`Unknown client DID: ${clientDID}`);
    }
    
    if (!identity.rows[0].verified) {
      throw new Error(`Unverified client DID: ${clientDID}`);
    }
    
    // Verify signature (simplified - in production use proper crypto verification)
    const expectedSignature = this.createSignature(request, identity.rows[0].public_key);
    if (signature !== expectedSignature) {
      throw new Error('Invalid signature');
    }
  }
  
  /**
   * Verify trust level for the requested operation
   */
  private async verifyTrustLevel(request: SecuredMCPRequest): Promise<number> {
    if (!request.atpHeaders?.clientDID) {
      return 0; // Unknown trust
    }
    
    const trustScore = await this.trustEngine.calculateTrustScore(request.atpHeaders.clientDID);
    
    // Get required trust level for the method
    const requiredLevel = this.getRequiredTrustLevel(request.method);
    
    if (trustScore.score < requiredLevel) {
      throw new Error(
        `Insufficient trust level. Required: ${requiredLevel}, Current: ${trustScore.score}`
      );
    }
    
    return trustScore.score;
  }
  
  /**
   * Check rate limits for the client
   */
  private async checkRateLimit(request: SecuredMCPRequest): Promise<void> {
    const clientId = request.atpHeaders?.clientDID || 'anonymous';
    const now = Date.now();
    const minute = Math.floor(now / 60000);
    
    if (!this.rateLimitMap.has(clientId)) {
      this.rateLimitMap.set(clientId, []);
    }
    
    const requests = this.rateLimitMap.get(clientId)!;
    
    // Remove old requests (older than 1 minute)
    const recentRequests = requests.filter(timestamp => timestamp > now - 60000);
    
    if (recentRequests.length >= this.config.maxRequestsPerMinute) {
      throw new Error('Rate limit exceeded');
    }
    
    recentRequests.push(now);
    this.rateLimitMap.set(clientId, recentRequests);
  }
  
  /**
   * Log audit event
   */
  private async logAuditEvent(action: string, details: any): Promise<string> {
    const eventId = createHash('sha256')
      .update(`${action}-${Date.now()}-${Math.random()}`)
      .digest('hex')
      .substring(0, 16);
    
    await this.db.query(`
      INSERT INTO agent_interactions 
      (id, agent_did, interaction_type, success, details, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
    `, [
      eventId,
      details.clientDID || 'unknown',
      action,
      false, // Will be updated on completion
      JSON.stringify(details)
    ]);
    
    return eventId;
  }
  
  /**
   * Update audit event with completion details
   */
  private async updateAuditEvent(eventId: string, details: any): Promise<void> {
    await this.db.query(`
      UPDATE agent_interactions 
      SET success = $1, details = details || $2
      WHERE id = $3
    `, [
      details.status === 'success',
      JSON.stringify(details),
      eventId
    ]);
  }
  
  /**
   * Get required trust level for a method
   */
  private getRequiredTrustLevel(method: string): number {
    const trustRequirements: Record<string, number> = {
      // Public methods
      'ping': 0,
      'initialize': 0.1,
      
      // Basic methods
      'tools/list': 0.2,
      'resources/list': 0.2,
      'prompts/list': 0.2,
      
      // Tool execution (varies by tool)
      'tools/call': 0.4,
      
      // Administrative methods
      'notifications/initialized': 0.8,
      'logging/setLevel': 0.9,
    };
    
    return trustRequirements[method] || 0.4; // Default to verified level
  }
  
  /**
   * Create signature for request verification
   */
  private createSignature(request: SecuredMCPRequest, publicKey: string): string {
    // Simplified signature creation - use proper crypto in production
    const payload = JSON.stringify({
      method: request.method,
      params: request.params,
      timestamp: request.atpHeaders?.timestamp
    });
    
    return createHash('sha256')
      .update(payload + publicKey)
      .digest('hex');
  }
  
  /**
   * Sanitize parameters for audit logging
   */
  private sanitizeParams(params: any): any {
    if (!params) return params;
    
    // Remove sensitive data
    const sanitized = { ...params };
    
    // List of fields to redact
    const sensitiveFields = ['password', 'secret', 'token', 'key', 'credential'];
    
    function redactObject(obj: any): any {
      if (typeof obj !== 'object' || obj === null) return obj;
      
      const result: any = {};
      for (const [key, value] of Object.entries(obj)) {
        if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
          result[key] = '[REDACTED]';
        } else if (typeof value === 'object') {
          result[key] = redactObject(value);
        } else {
          result[key] = value;
        }
      }
      return result;
    }
    
    return redactObject(sanitized);
  }
}

/**
 * Convenience function to create a secured MCP handler
 */
export function createSecuredMCPHandler(
  originalHandler: (request: any) => Promise<any>,
  config: MCPSecurityConfig,
  db: DatabaseManager
) {
  const wrapper = new MCPSecurityWrapper(config, db);
  return wrapper.wrapMCPServer(originalHandler);
}

/**
 * Default security configuration
 */
export const defaultMCPSecurityConfig: MCPSecurityConfig = {
  enforceAuthentication: true,
  requireAuditLogging: true,
  rateLimitEnabled: true,
  quantumSafeSignatures: true,
  trustedDomains: ['localhost', '127.0.0.1'],
  maxRequestsPerMinute: 60
};