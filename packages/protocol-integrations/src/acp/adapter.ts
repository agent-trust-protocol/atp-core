/**
 * IBM Agent Communication Protocol (ACP) Adapter
 * Bridges IBM ACP with ATP quantum-safe security
 */

import { EventEmitter } from 'events';
import { createHash, randomBytes } from 'crypto';
import { ACPMessage, ACPAgent, ACPEnvelope, SecuredACPMessage, ACPPerformative } from './types';
import { QuantumSafeSignature } from '@atp/shared';

export class ACPAdapter extends EventEmitter {
  private agents: Map<string, ACPAgent> = new Map();
  private conversations: Map<string, ACPMessage[]> = new Map();
  private quantumCrypto: QuantumSafeSignature;

  constructor() {
    super();
    this.quantumCrypto = new QuantumSafeSignature();
  }

  /**
   * Register an agent in the ACP directory
   */
  async registerAgent(agent: ACPAgent): Promise<void> {
    this.agents.set(agent.aid, agent);
    this.emit('agentRegistered', agent);
  }

  /**
   * Send a secure ACP message with ATP protection
   */
  async sendMessage(
    message: ACPMessage,
    senderPrivateKey: string,
    senderDID: string
  ): Promise<void> {
    try {
      // Create quantum-safe signature
      const messageHash = this.hashMessage(message);
      const signature = await this.quantumCrypto.sign(messageHash);

      // Create secured message
      const securedMessage: SecuredACPMessage = {
        ...message,
        atpHeaders: {
          clientDID: senderDID,
          signature,
          trustLevel: 'verified',
          timestamp: Date.now(),
          nonce: randomBytes(16).toString('hex')
        },
        envelope: this.createEnvelope(message)
      };

      // Store in conversation history
      if (message.conversationId) {
        if (!this.conversations.has(message.conversationId)) {
          this.conversations.set(message.conversationId, []);
        }
        this.conversations.get(message.conversationId)!.push(message);
      }

      // Route message to recipients
      await this.routeMessage(securedMessage);

      this.emit('messageSent', securedMessage);
    } catch (error) {
      this.emit('error', error);
      throw error;
    }
  }

  /**
   * Receive and verify a secure ACP message
   */
  async receiveMessage(securedMessage: SecuredACPMessage): Promise<ACPMessage | null> {
    try {
      // Verify quantum-safe signature
      const messageHash = this.hashMessage(securedMessage);
      const isValid = await this.quantumCrypto.verify(
        messageHash,
        securedMessage.atpHeaders.signature
      );

      if (!isValid) {
        this.emit('securityViolation', {
          reason: 'Invalid signature',
          message: securedMessage
        });
        return null;
      }

      // Check timestamp freshness (prevent replay attacks)
      const messageAge = Date.now() - securedMessage.atpHeaders.timestamp;
      if (messageAge > 300000) { // 5 minutes
        this.emit('securityViolation', {
          reason: 'Message too old',
          message: securedMessage
        });
        return null;
      }

      // Store in conversation
      if (securedMessage.conversationId) {
        if (!this.conversations.has(securedMessage.conversationId)) {
          this.conversations.set(securedMessage.conversationId, []);
        }
        this.conversations.get(securedMessage.conversationId)!.push(securedMessage);
      }

      this.emit('messageReceived', securedMessage);
      return securedMessage;
    } catch (error) {
      this.emit('error', error);
      return null;
    }
  }

  /**
   * Create a standard ACP request message
   */
  createRequest(
    sender: string,
    receiver: string,
    action: string,
    parameters: any,
    conversationId?: string
  ): ACPMessage {
    return {
      id: this.generateMessageId(),
      performative: ACPPerformative.REQUEST,
      sender,
      receiver,
      content: {
        action,
        parameters
      },
      language: 'JSON',
      protocol: 'atp-request',
      conversationId: conversationId || this.generateConversationId(),
      timestamp: new Date()
    };
  }

  /**
   * Create a standard ACP inform message
   */
  createInform(
    sender: string,
    receiver: string,
    information: any,
    conversationId?: string,
    inReplyTo?: string
  ): ACPMessage {
    return {
      id: this.generateMessageId(),
      performative: ACPPerformative.INFORM,
      sender,
      receiver,
      content: information,
      language: 'JSON',
      protocol: 'atp-inform',
      conversationId,
      inReplyTo,
      timestamp: new Date()
    };
  }

  /**
   * Create a call for proposal (CFP) message
   */
  createCFP(
    sender: string,
    receivers: string[],
    task: any,
    deadline?: Date,
    conversationId?: string
  ): ACPMessage {
    return {
      id: this.generateMessageId(),
      performative: ACPPerformative.CFP,
      sender,
      receiver: receivers,
      content: {
        task,
        deadline
      },
      language: 'JSON',
      protocol: 'atp-cfp',
      conversationId: conversationId || this.generateConversationId(),
      replyBy: deadline,
      timestamp: new Date()
    };
  }

  /**
   * Get conversation history
   */
  getConversation(conversationId: string): ACPMessage[] {
    return this.conversations.get(conversationId) || [];
  }

  /**
   * Get registered agent by ID
   */
  getAgent(aid: string): ACPAgent | undefined {
    return this.agents.get(aid);
  }

  /**
   * List all registered agents
   */
  listAgents(): ACPAgent[] {
    return Array.from(this.agents.values());
  }

  private hashMessage(message: Omit<ACPMessage, 'timestamp'>): string {
    const content = JSON.stringify({
      id: message.id,
      performative: message.performative,
      sender: message.sender,
      receiver: message.receiver,
      content: message.content
    });
    return createHash('sha256').update(content).digest('hex');
  }

  private createEnvelope(message: ACPMessage): ACPEnvelope {
    const senderAgent = this.agents.get(message.sender);
    const receiverAgents = Array.isArray(message.receiver) 
      ? message.receiver.map(r => this.agents.get(r)).filter(Boolean) as ACPAgent[]
      : [this.agents.get(message.receiver)].filter(Boolean) as ACPAgent[];

    return {
      to: receiverAgents,
      from: senderAgent!,
      date: new Date(),
      aclRepresentation: 'JSON',
      encrypted: true
    };
  }

  private async routeMessage(securedMessage: SecuredACPMessage): Promise<void> {
    // In a real implementation, this would route to actual agent endpoints
    // For now, we emit the message for local handling
    this.emit('routeMessage', securedMessage);
  }

  private generateMessageId(): string {
    return `acp-${Date.now()}-${randomBytes(8).toString('hex')}`;
  }

  private generateConversationId(): string {
    return `conv-${Date.now()}-${randomBytes(8).toString('hex')}`;
  }
}