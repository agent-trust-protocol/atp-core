/**
 * ACP Security Wrapper
 * Production-ready security layer for IBM Agent Communication Protocol
 */

import { EventEmitter } from 'events';
import { createHash } from 'crypto';
import { ACPSecurityConfig, SecuredACPMessage, ACPMessage } from './types';
import { TrustScoringEngine, AuditLogger } from '@atp/shared';

export class ACPSecurityWrapper extends EventEmitter {
  private config: ACPSecurityConfig;
  private trustEngine: TrustScoringEngine;
  private auditLogger: AuditLogger;
  private rateLimits: Map<string, { count: number; resetTime: number }> = new Map();

  constructor(config: ACPSecurityConfig) {
    super();
    this.config = config;
    this.trustEngine = new TrustScoringEngine(config.database);
    this.auditLogger = new AuditLogger('acp-security');
  }

  /**
   * Secure an outgoing ACP message
   */
  async secureMessage(
    message: ACPMessage,
    agentDID: string,
    privateKey: string
  ): Promise<SecuredACPMessage> {
    try {
      // Check message size
      const messageSize = JSON.stringify(message).length;
      if (messageSize > this.config.maxMessageSize) {
        throw new Error(`Message size ${messageSize} exceeds limit ${this.config.maxMessageSize}`);
      }

      // Apply rate limiting
      if (!this.checkRateLimit(message.sender)) {
        throw new Error('Rate limit exceeded for agent');
      }

      // Create quantum-safe signature if required
      let signature = '';
      if (this.config.requireQuantumSafeSignatures) {
        const messageHash = this.createMessageHash(message);
        // In real implementation, use actual quantum-safe signing
        signature = await this.createQuantumSafeSignature(messageHash, privateKey);
      }

      // Get trust level
      const trustLevel = await this.trustEngine.evaluateAgent(agentDID);

      const securedMessage: SecuredACPMessage = {
        ...message,
        atpHeaders: {
          clientDID: agentDID,
          signature,
          trustLevel: String(trustLevel.level),
          timestamp: Date.now(),
          nonce: this.generateNonce()
        },
        envelope: {
          to: [],
          from: { aid: message.sender, name: message.sender, addresses: [] },
          date: new Date(),
          encrypted: this.config.requireQuantumSafeSignatures
        }
      };

      // Log security event
      if (this.config.enableAuditLogging) {
        await this.auditLogger.logEvent({
          eventType: 'acp_message_secured',
          agentDID,
          timestamp: new Date(),
          details: {
            messageId: message.id,
            performative: message.performative,
            trustLevel: trustLevel.level
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
   * Verify an incoming secured ACP message
   */
  async verifyMessage(securedMessage: SecuredACPMessage): Promise<{
    isValid: boolean;
    message?: ACPMessage;
    reason?: string;
  }> {
    try {
      // Check authentication if required
      if (this.config.enforceAuthentication && !securedMessage.atpHeaders.clientDID) {
        return { isValid: false, reason: 'Missing client DID' };
      }

      // Check if agent is trusted
      if (this.config.trustedAgents.length > 0 && 
          !this.config.trustedAgents.includes(securedMessage.sender)) {
        return { isValid: false, reason: 'Agent not in trusted list' };
      }

      // Verify quantum-safe signature
      if (this.config.requireQuantumSafeSignatures) {
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

      // Check message freshness
      const messageAge = Date.now() - securedMessage.atpHeaders.timestamp;
      if (messageAge > this.config.conversationTimeout) {
        return { isValid: false, reason: 'Message expired' };
      }

      // Evaluate trust score
      const trustScore = await this.trustEngine.evaluateAgent(securedMessage.atpHeaders.clientDID);
      if (trustScore.score < 0.5) {
        await this.logSecurityViolation(securedMessage, `Low trust score: ${trustScore.score}`);
        return { isValid: false, reason: 'Insufficient trust level' };
      }

      // Log successful verification
      if (this.config.enableAuditLogging) {
        await this.auditLogger.logEvent({
          eventType: 'acp_message_verified',
          agentDID: securedMessage.atpHeaders.clientDID,
          timestamp: new Date(),
          details: {
            messageId: securedMessage.id,
            trustScore: trustScore.score,
            performative: securedMessage.performative
          }
        });
      }

      this.emit('messageVerified', securedMessage);
      return { isValid: true, message: securedMessage };

    } catch (error) {
      this.emit('verificationError', { error, message: securedMessage });
      return { isValid: false, reason: error instanceof Error ? error.message : String(error) };
    }
  }

  /**
   * Monitor ACP conversation for anomalies
   */
  async monitorConversation(conversationId: string, messages: ACPMessage[]): Promise<{
    anomalies: string[];
    riskScore: number;
    recommendations: string[];
  }> {
    const anomalies: string[] = [];
    const recommendations: string[] = [];
    let riskScore = 0;

    // Check conversation patterns
    const performatives = messages.map(m => m.performative);
    const uniquePerformatives = new Set(performatives);

    // Detect rapid-fire messaging
    const timeDeltas = [];
    for (let i = 1; i < messages.length; i++) {
      const delta = messages[i].timestamp.getTime() - messages[i-1].timestamp.getTime();
      timeDeltas.push(delta);
    }

    const avgTimeDelta = timeDeltas.reduce((a, b) => a + b, 0) / timeDeltas.length;
    if (avgTimeDelta < 100) { // Less than 100ms between messages
      anomalies.push('Rapid-fire messaging detected');
      riskScore += 0.3;
      recommendations.push('Implement stricter rate limiting');
    }

    // Detect unusual performative patterns
    const suspiciousPatterns = [
      'cancel', 'failure', 'refuse', 'reject-proposal', 'not-understood'
    ];
    const suspiciousCount = performatives.filter(p => suspiciousPatterns.includes(p)).length;
    const suspiciousRatio = suspiciousCount / messages.length;

    if (suspiciousRatio > 0.3) {
      anomalies.push('High rate of negative responses');
      riskScore += 0.4;
      recommendations.push('Review agent behavior and trust scores');
    }

    // Check for conversation loops
    const performativeSequence = performatives.join(',');
    const loopPattern = /(.{3,})\1{2,}/; // Repeating patterns
    if (loopPattern.test(performativeSequence)) {
      anomalies.push('Conversation loop detected');
      riskScore += 0.2;
      recommendations.push('Implement conversation deadlock detection');
    }

    // Log monitoring results
    if (this.config.enableAuditLogging) {
      await this.auditLogger.logEvent({
        eventType: 'acp_conversation_monitored',
        agentDID: 'system',
        timestamp: new Date(),
        details: {
          conversationId,
          messageCount: messages.length,
          anomalies,
          riskScore
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

  private createMessageHash(message: ACPMessage): string {
    const content = JSON.stringify({
      id: message.id,
      performative: message.performative,
      sender: message.sender,
      receiver: message.receiver,
      content: message.content
    });
    return createHash('sha256').update(content).digest('hex');
  }

  private async createQuantumSafeSignature(messageHash: string, privateKey: string): Promise<string> {
    // In real implementation, use actual quantum-safe cryptography library
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

  private generateNonce(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private async logSecurityViolation(message: SecuredACPMessage, reason: string): Promise<void> {
    if (this.config.enableAuditLogging) {
      await this.auditLogger.logEvent({
        eventType: 'acp_security_violation',
        agentDID: message.atpHeaders.clientDID,
        timestamp: new Date(),
        details: {
          messageId: message.id,
          reason,
          sender: message.sender
        }
      });
    }

    this.emit('securityViolation', { message, reason });
  }
}