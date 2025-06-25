import { EventEmitter } from 'events';
import {
  A2ACommunicationRequest,
  A2ACommunicationResponse,
  A2AHandshakeRequest,
  A2AHandshakeResponse,
  A2ASession,
  A2AErrorCode,
  A2AAgentProfile,
} from '../types/a2a.js';
import { TrustLevel, TrustLevelManager } from '@atp/shared';
import { randomUUID } from 'crypto';

export class A2ACommunicationService extends EventEmitter {
  private sessions: Map<string, A2ASession> = new Map();
  private agentProfiles: Map<string, A2AAgentProfile> = new Map();
  private messageQueue: Map<string, A2ACommunicationRequest[]> = new Map();

  constructor() {
    super();
    this.startSessionCleanup();
  }

  async initiateHandshake(request: A2AHandshakeRequest): Promise<A2AHandshakeResponse> {
    const startTime = Date.now();
    
    // Log handshake initiation
    await this.logAuditEvent(request.initiator.did, 'a2a-handshake-initiated', {
      target: request.target.did,
      purpose: request.initiator.intendedPurpose,
      securityRequirements: request.security,
    });

    // Validate initiator profile
    await this.validateAgentProfile(request.initiator.profile);
    
    // Check if target agent exists and is available
    const targetProfile = this.agentProfiles.get(request.target.did);
    if (!targetProfile) {
      await this.logAuditEvent(request.initiator.did, 'a2a-handshake-failed', {
        target: request.target.did,
        reason: 'Target agent not found',
        duration: Date.now() - startTime,
      });
      
      return {
        accepted: false,
        rejection: {
          reason: 'Target agent not found or not available',
          code: A2AErrorCode.AGENT_UNREACHABLE,
          suggestedAlternatives: await this.findSimilarAgents(request.target.expectedCapabilities),
        },
      };
    }

    // Validate trust levels are compatible
    const initiatorTrustLevel = request.initiator.profile.atpProfile.trustLevel as TrustLevel;
    const targetTrustLevel = targetProfile.atpProfile.trustLevel as TrustLevel;
    
    if (!this.areTrustLevelsCompatible(initiatorTrustLevel, targetTrustLevel)) {
      await this.logAuditEvent(request.initiator.did, 'a2a-handshake-failed', {
        target: request.target.did,
        reason: 'Incompatible trust levels',
        initiatorLevel: initiatorTrustLevel,
        targetLevel: targetTrustLevel,
      });
      
      return {
        accepted: false,
        rejection: {
          reason: 'Trust levels incompatible',
          code: A2AErrorCode.TRUST_VERIFICATION_FAILED,
        },
      };
    }

    // Check capability requirements
    const hasRequiredCapabilities = request.target.expectedCapabilities.every(cap =>
      targetProfile.capabilities.some(agentCap => agentCap.name === cap)
    );

    if (!hasRequiredCapabilities) {
      const missing = request.target.expectedCapabilities.filter(cap =>
        !targetProfile.capabilities.some(agentCap => agentCap.name === cap)
      );
      
      return {
        accepted: false,
        rejection: {
          reason: `Target agent missing required capabilities: ${missing.join(', ')}`,
          code: A2AErrorCode.CAPABILITY_NOT_AVAILABLE,
        },
      };
    }

    // Create session
    const sessionId = randomUUID();
    const session: A2ASession = {
      sessionId,
      participants: {
        initiator: request.initiator.did,
        responder: request.target.did,
      },
      status: 'active',
      security: {
        protocols: request.security.proposedProtocols,
        encrypted: request.security.encryptionRequired,
        authenticated: request.security.mutualAuthentication,
      },
      metrics: {
        startTime: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        messageCount: 0,
        errorCount: 0,
      },
      auditTrail: [{
        timestamp: new Date().toISOString(),
        action: 'session-created',
        actor: request.initiator.did,
        details: {
          purpose: request.initiator.intendedPurpose,
          security: request.security,
        },
      }],
    };

    this.sessions.set(sessionId, session);
    this.agentProfiles.set(request.initiator.did, request.initiator.profile);

    // Log successful handshake
    await this.logAuditEvent(request.initiator.did, 'a2a-handshake-success', {
      target: request.target.did,
      sessionId,
      duration: Date.now() - startTime,
    });

    return {
      accepted: true,
      sessionId,
      responder: {
        did: targetProfile.did,
        profile: targetProfile,
      },
      agreedProtocols: request.security.proposedProtocols,
      sessionParameters: {
        timeout: request.sessionParameters.timeout,
        maxMessages: request.sessionParameters.maxMessages,
        auditLevel: request.sessionParameters.auditLevel,
        endpoints: {
          communication: targetProfile.endpoints.communication,
          status: targetProfile.endpoints.status || '',
        },
      },
    };
  }

  async sendMessage(request: A2ACommunicationRequest): Promise<A2ACommunicationResponse> {
    const startTime = Date.now();
    
    // Validate session exists for participants
    const session = this.findSessionByParticipants(request.from, request.to);
    if (!session) {
      return {
        success: false,
        messageId: request.metadata.messageId,
        timestamp: new Date().toISOString(),
        error: {
          code: A2AErrorCode.SESSION_EXPIRED,
          message: 'No active session found between participants',
        },
      };
    }

    // Check session status
    if (session.status !== 'active') {
      return {
        success: false,
        messageId: request.metadata.messageId,
        timestamp: new Date().toISOString(),
        error: {
          code: A2AErrorCode.SESSION_EXPIRED,
          message: `Session status is ${session.status}`,
        },
      };
    }

    // Validate message hasn't expired
    if (request.metadata.expiresAt) {
      const expiryTime = new Date(request.metadata.expiresAt);
      if (new Date() > expiryTime) {
        return {
          success: false,
          messageId: request.metadata.messageId,
          timestamp: new Date().toISOString(),
          error: {
            code: A2AErrorCode.MESSAGE_DELIVERY_FAILED,
            message: 'Message has expired',
          },
        };
      }
    }

    // Update session metrics
    session.metrics.messageCount++;
    session.metrics.lastActivity = new Date().toISOString();

    // Add to audit trail
    session.auditTrail.push({
      timestamp: new Date().toISOString(),
      action: 'message-sent',
      actor: request.from,
      details: {
        messageId: request.metadata.messageId,
        messageType: request.messageType,
        priority: request.metadata.priority,
        encrypted: request.atpSecurity.encrypted,
        signed: request.atpSecurity.signed,
      },
    });

    // Queue message for delivery (in real implementation, this would send to the target agent)
    if (!this.messageQueue.has(request.to)) {
      this.messageQueue.set(request.to, []);
    }
    this.messageQueue.get(request.to)?.push(request);

    // Log message activity
    if (request.atpSecurity.auditRequired) {
      await this.logAuditEvent(request.from, 'a2a-message-sent', {
        recipient: request.to,
        messageType: request.messageType,
        messageId: request.metadata.messageId,
        sessionId: session.sessionId,
        priority: request.metadata.priority,
        duration: Date.now() - startTime,
      });
    }

    // Emit event for listeners
    this.emit('messageSent', {
      session: session.sessionId,
      from: request.from,
      to: request.to,
      messageType: request.messageType,
      messageId: request.metadata.messageId,
    });

    return {
      success: true,
      messageId: request.metadata.messageId,
      timestamp: new Date().toISOString(),
      response: {
        sessionId: session.sessionId,
        deliveryStatus: 'queued',
        estimatedDelivery: new Date(Date.now() + 1000).toISOString(),
      },
    };
  }

  async receiveMessages(agentDID: string): Promise<A2ACommunicationRequest[]> {
    const messages = this.messageQueue.get(agentDID) || [];
    this.messageQueue.set(agentDID, []); // Clear the queue
    
    // Log message retrieval
    if (messages.length > 0) {
      await this.logAuditEvent(agentDID, 'a2a-messages-received', {
        messageCount: messages.length,
        messageIds: messages.map(m => m.metadata.messageId),
      });
    }

    return messages;
  }

  async terminateSession(sessionId: string, initiator: string, reason?: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    // Verify initiator is a participant
    if (session.participants.initiator !== initiator && session.participants.responder !== initiator) {
      throw new Error('Only session participants can terminate the session');
    }

    // Update session status
    session.status = 'terminated';
    session.auditTrail.push({
      timestamp: new Date().toISOString(),
      action: 'session-terminated',
      actor: initiator,
      details: {
        reason: reason || 'Manual termination',
        finalMessageCount: session.metrics.messageCount,
        sessionDuration: Date.now() - new Date(session.metrics.startTime).getTime(),
      },
    });

    // Log session termination
    await this.logAuditEvent(initiator, 'a2a-session-terminated', {
      sessionId,
      reason: reason || 'Manual termination',
      messageCount: session.metrics.messageCount,
      errorCount: session.metrics.errorCount,
      duration: Date.now() - new Date(session.metrics.startTime).getTime(),
    });

    // Emit event
    this.emit('sessionTerminated', {
      sessionId,
      initiator,
      reason,
    });

    console.log(`A2A Session ${sessionId} terminated by ${initiator}`);
  }

  async getSessionStatus(sessionId: string): Promise<A2ASession | null> {
    return this.sessions.get(sessionId) || null;
  }

  async getActiveSessions(agentDID: string): Promise<A2ASession[]> {
    const sessions = Array.from(this.sessions.values()).filter(session =>
      (session.participants.initiator === agentDID || session.participants.responder === agentDID) &&
      session.status === 'active'
    );
    return sessions;
  }

  registerAgentProfile(profile: A2AAgentProfile): void {
    this.agentProfiles.set(profile.did, profile);
  }

  private findSessionByParticipants(agent1: string, agent2: string): A2ASession | undefined {
    return Array.from(this.sessions.values()).find(session =>
      (session.participants.initiator === agent1 && session.participants.responder === agent2) ||
      (session.participants.initiator === agent2 && session.participants.responder === agent1)
    );
  }

  private areTrustLevelsCompatible(level1: TrustLevel, level2: TrustLevel): boolean {
    // Both agents should have at least basic trust level for communication
    const minLevel = TrustLevel.BASIC;
    return TrustLevelManager.isAuthorized(level1, minLevel) && 
           TrustLevelManager.isAuthorized(level2, minLevel);
  }

  private async findSimilarAgents(requiredCapabilities: string[]): Promise<string[]> {
    const suggestions: string[] = [];
    
    for (const [did, profile] of this.agentProfiles.entries()) {
      const matchingCaps = requiredCapabilities.filter(reqCap =>
        profile.capabilities.some(agentCap => agentCap.name === reqCap)
      );
      
      if (matchingCaps.length > 0) {
        suggestions.push(`${profile.name} (${did}) - has ${matchingCaps.length}/${requiredCapabilities.length} capabilities`);
      }
    }
    
    return suggestions.slice(0, 3); // Return top 3 suggestions
  }

  private async validateAgentProfile(profile: A2AAgentProfile): Promise<void> {
    // Validate DID format
    if (!profile.did.startsWith('did:')) {
      throw new Error('Invalid DID format');
    }
    
    // Validate trust level
    if (!TrustLevelManager.validateTrustLevel(profile.atpProfile.trustLevel)) {
      throw new Error(`Invalid trust level: ${profile.atpProfile.trustLevel}`);
    }
    
    // TODO: Additional validation against ATP™ identity service
  }

  private startSessionCleanup(): void {
    // Clean up expired sessions every 5 minutes
    setInterval(() => {
      const now = Date.now();
      const sessionsToCleanup: string[] = [];
      
      for (const [sessionId, session] of this.sessions.entries()) {
        const lastActivityTime = new Date(session.metrics.lastActivity).getTime();
        const fiveMinutesAgo = now - (5 * 60 * 1000);
        
        // Clean up sessions inactive for more than 5 minutes
        if (lastActivityTime < fiveMinutesAgo && session.status === 'active') {
          session.status = 'terminated';
          session.auditTrail.push({
            timestamp: new Date().toISOString(),
            action: 'session-auto-terminated',
            actor: 'system',
            details: {
              reason: 'Inactivity timeout',
              lastActivity: session.metrics.lastActivity,
            },
          });
          sessionsToCleanup.push(sessionId);
        }
      }
      
      if (sessionsToCleanup.length > 0) {
        console.log(`Cleaned up ${sessionsToCleanup.length} inactive A2A sessions`);
      }
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private async logAuditEvent(
    actor: string,
    action: string,
    details: Record<string, any>
  ): Promise<void> {
    try {
      await fetch('http://localhost:3005/audit/log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: 'a2a-communication',
          action,
          resource: 'agent-communication',
          actor,
          details,
        }),
      });
    } catch (error) {
      console.warn('Failed to log A2A audit event:', error);
    }
  }

  // Statistics and monitoring
  getStats(): {
    totalSessions: number;
    activeSessions: number;
    totalMessages: number;
    sessionsByStatus: Record<string, number>;
    averageSessionDuration: number;
  } {
    const sessions = Array.from(this.sessions.values());
    const now = Date.now();
    
    const sessionsByStatus: Record<string, number> = {};
    let totalMessages = 0;
    let totalDuration = 0;
    let completedSessions = 0;
    
    for (const session of sessions) {
      sessionsByStatus[session.status] = (sessionsByStatus[session.status] || 0) + 1;
      totalMessages += session.metrics.messageCount;
      
      if (session.status === 'terminated') {
        const startTime = new Date(session.metrics.startTime).getTime();
        const endTime = session.auditTrail
          .filter(entry => entry.action === 'session-terminated')
          .map(entry => new Date(entry.timestamp).getTime())[0] || now;
        
        totalDuration += endTime - startTime;
        completedSessions++;
      }
    }
    
    return {
      totalSessions: sessions.length,
      activeSessions: sessionsByStatus['active'] || 0,
      totalMessages,
      sessionsByStatus,
      averageSessionDuration: completedSessions > 0 ? totalDuration / completedSessions : 0,
    };
  }
}