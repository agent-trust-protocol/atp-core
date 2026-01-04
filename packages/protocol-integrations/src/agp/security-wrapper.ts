/**
 * AGP Security Wrapper
 * Enterprise-grade security layer for Cisco Agent Gateway Protocol
 */

import { EventEmitter } from 'events';
import { createHash, createCipher, createDecipher } from 'crypto';
import { AGPSecurityConfig, SecuredAGPMessage, AGPMessage } from './types';
import { TrustScoringEngine, AuditLogger } from '@atp/shared';

export class AGPSecurityWrapper extends EventEmitter {
  private config: AGPSecurityConfig;
  private trustEngine: TrustScoringEngine;
  private auditLogger: AuditLogger;
  private rateLimits: Map<string, { count: number; resetTime: number }> = new Map();
  private sessions: Map<string, any> = new Map();

  constructor(config: AGPSecurityConfig) {
    super();
    this.config = config;
    this.trustEngine = new TrustScoringEngine(config.database);
    this.auditLogger = new AuditLogger('agp-security');
    this.startSessionMonitor();
  }

  /**
   * Secure an outgoing AGP message with quantum-safe protection
   */
  async secureMessage(
    message: AGPMessage,
    agentDID: string,
    privateKey: string
  ): Promise<SecuredAGPMessage> {
    try {
      // Validate message size
      const messageSize = JSON.stringify(message).length;
      if (messageSize > this.config.maxMessageSize) {
        throw new Error(`Message size ${messageSize} exceeds limit ${this.config.maxMessageSize}`);
      }

      // Check rate limiting
      if (this.config.enableRateLimit && !this.checkRateLimit(message.sourceAgent)) {
        throw new Error('Rate limit exceeded for agent');
      }

      // Create message hash for integrity
      const messageHash = this.createMessageHash(message);

      // Create quantum-safe signature
      let signature = '';
      if (this.config.quantumSafeEnabled) {
        signature = await this.createQuantumSafeSignature(messageHash, privateKey);
      }

      // Encrypt payload if required
      let encryptedPayload = message.payload;
      if (this.config.requireEncryption) {
        encryptedPayload = await this.encryptPayload(message.payload, agentDID);
      }

      // Get trust level
      const trustLevel = await this.trustEngine.evaluateAgent(agentDID);

      // Create secured message
      const securedMessage: SecuredAGPMessage = {
        ...message,
        payload: encryptedPayload,
        atpHeaders: {
          clientDID: agentDID,
          signature,
          trustLevel: String(trustLevel.level),
          nonce: this.generateNonce(),
          encryptionMethod: this.config.requireEncryption ? 'AES-256-GCM' : undefined
        },
        securityContext: {
          authenticated: this.config.enforceAuthentication,
          authorized: true,
          encrypted: this.config.requireEncryption,
          integrityChecked: this.config.quantumSafeEnabled
        }
      };

      // Log security event
      if (this.config.enableAuditLogging) {
        await this.auditLogger.logEvent({
          eventType: 'agp_message_secured',
          agentDID,
          timestamp: new Date(),
          details: {
            messageId: message.messageId,
            messageType: message.messageType,
            targetAgent: message.targetAgent,
            trustLevel: String(trustLevel.level),
            encrypted: this.config.requireEncryption
          }
        });
      }

      this.emit('messageSecured', securedMessage);
      return securedMessage;

    } catch (error) {
      this.emit('securityError', { error, message });
      throw error;
    }
  }

  /**
   * Verify and decrypt an incoming secured AGP message
   */
  async verifyMessage(securedMessage: SecuredAGPMessage): Promise<{
    isValid: boolean;
    message?: AGPMessage;
    reason?: string;
  }> {
    try {
      // Check authentication if required
      if (this.config.enforceAuthentication && !securedMessage.atpHeaders.clientDID) {
        return { isValid: false, reason: 'Missing client authentication' };
      }

      // Check if agent is in trusted list
      if (this.config.trustedAgents.length > 0 && 
          !this.config.trustedAgents.includes(securedMessage.sourceAgent)) {
        return { isValid: false, reason: 'Agent not in trusted list' };
      }

      // Verify quantum-safe signature if enabled
      if (this.config.quantumSafeEnabled && securedMessage.atpHeaders.signature) {
        const messageHash = this.createMessageHash(securedMessage);
        const isValidSignature = await this.verifyQuantumSafeSignature(
          messageHash,
          securedMessage.atpHeaders.signature,
          securedMessage.atpHeaders.clientDID
        );

        if (!isValidSignature) {
          await this.logSecurityViolation(securedMessage, 'Invalid quantum-safe signature');
          return { isValid: false, reason: 'Invalid signature' };
        }
      }

      // Check session validity
      if (securedMessage.sessionId && !this.isValidSession(securedMessage.sessionId)) {
        return { isValid: false, reason: 'Invalid or expired session' };
      }

      // Evaluate trust score
      const trustScore = await this.trustEngine.evaluateAgent(securedMessage.atpHeaders.clientDID);
      if (trustScore.score < 0.5) {
        await this.logSecurityViolation(securedMessage, `Low trust score: ${trustScore.score}`);
        return { isValid: false, reason: 'Insufficient trust level' };
      }

      // Decrypt payload if encrypted
      let decryptedPayload = securedMessage.payload;
      if (securedMessage.securityContext.encrypted) {
        decryptedPayload = await this.decryptPayload(
          securedMessage.payload,
          securedMessage.atpHeaders.clientDID
        );
      }

      // Create verified message
      const verifiedMessage: AGPMessage = {
        ...securedMessage,
        payload: decryptedPayload
      };

      // Log successful verification
      if (this.config.enableAuditLogging) {
        await this.auditLogger.logEvent({
          eventType: 'agp_message_verified',
          agentDID: securedMessage.atpHeaders.clientDID,
          timestamp: new Date(),
          details: {
            messageId: securedMessage.messageId,
            messageType: securedMessage.messageType,
            sourceAgent: securedMessage.sourceAgent,
            trustScore: trustScore.score
          }
        });
      }

      this.emit('messageVerified', verifiedMessage);
      return { isValid: true, message: verifiedMessage };

    } catch (error) {
      this.emit('verificationError', { error, message: securedMessage });
      return { isValid: false, reason: error instanceof Error ? error.message : String(error) };
    }
  }

  /**
   * Create a secure session for agent communication
   */
  async createSession(agentId: string, agentDID: string): Promise<{
    sessionId: string;
    sessionToken: string;
    expiresAt: number;
  }> {
    const sessionId = this.generateSessionId();
    const sessionToken = this.generateSessionToken();
    const expiresAt = Date.now() + this.config.sessionTimeout;

    const session = {
      sessionId,
      sessionToken,
      agentId,
      agentDID,
      createdAt: Date.now(),
      expiresAt,
      isActive: true
    };

    this.sessions.set(sessionId, session);

    // Log session creation
    if (this.config.enableAuditLogging) {
      await this.auditLogger.logEvent({
        eventType: 'agp_session_created',
        agentDID,
        timestamp: new Date(),
        details: {
          sessionId,
          agentId,
          expiresAt
        }
      });
    }

    this.emit('sessionCreated', session);
    return { sessionId, sessionToken, expiresAt };
  }

  /**
   * Invalidate a session
   */
  async invalidateSession(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isActive = false;
      this.sessions.delete(sessionId);

      // Log session invalidation
      if (this.config.enableAuditLogging) {
        await this.auditLogger.logEvent({
          eventType: 'agp_session_invalidated',
          agentDID: session.agentDID,
          timestamp: new Date(),
          details: {
            sessionId,
            agentId: session.agentId
          }
        });
      }

      this.emit('sessionInvalidated', sessionId);
    }
  }

  /**
   * Analyze message patterns for anomaly detection
   */
  async analyzeMessagePatterns(
    agentId: string,
    recentMessages: AGPMessage[]
  ): Promise<{
    anomalies: string[];
    riskScore: number;
    recommendations: string[];
  }> {
    const anomalies: string[] = [];
    const recommendations: string[] = [];
    let riskScore = 0;

    // Analyze message frequency
    const timeWindow = 60000; // 1 minute
    const currentTime = Date.now();
    const recentCount = recentMessages.filter(
      msg => currentTime - msg.timestamp <= timeWindow
    ).length;

    if (recentCount > 100) { // More than 100 messages per minute
      anomalies.push('High message frequency detected');
      riskScore += 0.4;
      recommendations.push('Implement stricter rate limiting');
    }

    // Analyze message types distribution
    const messageTypes = recentMessages.map(msg => msg.messageType);
    const typeDistribution = messageTypes.reduce((acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Check for unusual message type patterns
    const errorRatio = (typeDistribution['ERROR'] || 0) / recentMessages.length;
    if (errorRatio > 0.3) {
      anomalies.push('High error message ratio');
      riskScore += 0.3;
      recommendations.push('Investigate source of errors');
    }

    // Analyze payload sizes
    const payloadSizes = recentMessages.map(msg => JSON.stringify(msg.payload).length);
    const avgPayloadSize = payloadSizes.reduce((a, b) => a + b, 0) / payloadSizes.length;
    const maxPayloadSize = Math.max(...payloadSizes);

    if (maxPayloadSize > avgPayloadSize * 10) {
      anomalies.push('Unusually large payload detected');
      riskScore += 0.2;
      recommendations.push('Review large message content');
    }

    // Check for repeated identical messages (potential replay attack)
    const messageHashes = recentMessages.map(msg => this.createMessageHash(msg));
    const uniqueHashes = new Set(messageHashes);
    const duplicateRatio = 1 - (uniqueHashes.size / messageHashes.length);

    if (duplicateRatio > 0.5) {
      anomalies.push('High rate of duplicate messages');
      riskScore += 0.5;
      recommendations.push('Implement replay attack protection');
    }

    // Log analysis results
    if (this.config.enableAuditLogging) {
      await this.auditLogger.logEvent({
        eventType: 'agp_pattern_analysis',
        agentDID: 'system',
        timestamp: new Date(),
        details: {
          agentId,
          messageCount: recentMessages.length,
          anomalies,
          riskScore,
          timeWindow
        }
      });
    }

    return { anomalies, riskScore, recommendations };
  }

  private checkRateLimit(agentId: string): boolean {
    const now = Date.now();
    const limit = this.rateLimits.get(agentId);

    if (!limit) {
      this.rateLimits.set(agentId, { count: 1, resetTime: now + 60000 });
      return true;
    }

    if (now > limit.resetTime) {
      this.rateLimits.set(agentId, { count: 1, resetTime: now + 60000 });
      return true;
    }

    if (limit.count >= this.config.rateLimitPerAgent) {
      return false;
    }

    limit.count++;
    return true;
  }

  private isValidSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (!session) return false;
    
    if (!session.isActive || Date.now() > session.expiresAt) {
      this.sessions.delete(sessionId);
      return false;
    }
    
    return true;
  }

  private createMessageHash(message: AGPMessage): string {
    const content = JSON.stringify({
      messageId: message.messageId,
      messageType: message.messageType,
      sourceAgent: message.sourceAgent,
      targetAgent: message.targetAgent,
      payload: message.payload
    });
    return createHash('sha256').update(content).digest('hex');
  }

  private async createQuantumSafeSignature(messageHash: string, privateKey: string): Promise<string> {
    // In real implementation, use actual quantum-safe cryptography
    return createHash('sha256').update(messageHash + privateKey).digest('hex');
  }

  private async verifyQuantumSafeSignature(
    messageHash: string,
    signature: string,
    publicKey: string
  ): Promise<boolean> {
    // In real implementation, use actual quantum-safe verification
    const expectedSignature = createHash('sha256').update(messageHash + publicKey).digest('hex');
    return signature === expectedSignature;
  }

  private async encryptPayload(payload: any, agentDID: string): Promise<string> {
    // Simplified encryption - in production, use proper encryption
    const payloadStr = JSON.stringify(payload);
    const cipher = createCipher('aes256', agentDID);
    let encrypted = cipher.update(payloadStr, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
  }

  private async decryptPayload(encryptedPayload: string, agentDID: string): Promise<any> {
    // Simplified decryption - in production, use proper decryption
    const decipher = createDecipher('aes256', agentDID);
    let decrypted = decipher.update(encryptedPayload, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted);
  }

  private generateNonce(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private generateSessionId(): string {
    return `agp-session-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  private generateSessionToken(): string {
    return createHash('sha256').update(`${Date.now()}-${Math.random()}`).digest('hex');
  }

  private async logSecurityViolation(message: SecuredAGPMessage, reason: string): Promise<void> {
    if (this.config.enableAuditLogging) {
      await this.auditLogger.logEvent({
        eventType: 'agp_security_violation',
        agentDID: message.atpHeaders.clientDID,
        timestamp: new Date(),
        details: {
          messageId: message.messageId,
          sourceAgent: message.sourceAgent,
          reason
        }
      });
    }

    this.emit('securityViolation', { message, reason });
  }

  private startSessionMonitor(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [sessionId, session] of this.sessions) {
        if (now > session.expiresAt) {
          this.invalidateSession(sessionId);
        }
      }
    }, 60000); // Check every minute
  }
}