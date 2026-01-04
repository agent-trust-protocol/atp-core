/**
 * ACP Server
 * Production-ready IBM Agent Communication Protocol server with ATP security
 */

import { EventEmitter } from 'events';
import { WebSocketServer, WebSocket } from 'ws';
import { ACPAdapter } from './adapter';
import { ACPSecurityWrapper } from './security-wrapper';
import { ACPMessage, ACPAgent, ACPSecurityConfig } from './types';

export interface ACPServerConfig {
  port: number;
  host: string;
  security: ACPSecurityConfig;
  enableWebSocket: boolean;
  enableHTTP: boolean;
}

export class ACPServer extends EventEmitter {
  private adapter: ACPAdapter;
  private security: ACPSecurityWrapper;
  private config: ACPServerConfig;
  private wsServer?: WebSocketServer;
  private connections: Map<string, WebSocket> = new Map();

  constructor(config: ACPServerConfig) {
    super();
    this.config = config;
    this.adapter = new ACPAdapter();
    this.security = new ACPSecurityWrapper(config.security);
    
    this.setupEventHandlers();
  }

  /**
   * Start the ACP server
   */
  async start(): Promise<void> {
    try {
      if (this.config.enableWebSocket) {
        await this.startWebSocketServer();
      }

      if (this.config.enableHTTP) {
        await this.startHTTPServer();
      }

      this.emit('serverStarted', {
        port: this.config.port,
        host: this.config.host
      });

      console.log(`ACP Server started on ${this.config.host}:${this.config.port}`);
    } catch (error) {
      this.emit('serverError', error);
      throw error;
    }
  }

  /**
   * Stop the ACP server
   */
  async stop(): Promise<void> {
    if (this.wsServer) {
      this.wsServer.close();
    }

    // Close all WebSocket connections
    for (const [agentId, ws] of this.connections) {
      ws.close();
    }
    this.connections.clear();

    this.emit('serverStopped');
    console.log('ACP Server stopped');
  }

  /**
   * Register an agent with the server
   */
  async registerAgent(agent: ACPAgent, ws?: WebSocket): Promise<void> {
    await this.adapter.registerAgent(agent);
    
    if (ws) {
      this.connections.set(agent.aid, ws);
      ws.on('close', () => {
        this.connections.delete(agent.aid);
        this.emit('agentDisconnected', agent.aid);
      });
    }

    this.emit('agentRegistered', agent);
  }

  /**
   * Send a message through the server
   */
  async sendMessage(
    message: ACPMessage,
    senderDID: string,
    senderPrivateKey: string
  ): Promise<void> {
    try {
      // Secure the message
      const securedMessage = await this.security.secureMessage(
        message,
        senderDID,
        senderPrivateKey
      );

      // Send through adapter
      await this.adapter.sendMessage(message, senderPrivateKey, senderDID);

      // Route to recipients if they're connected
      await this.routeSecuredMessage(securedMessage);

      this.emit('messageSent', securedMessage);
    } catch (error) {
      this.emit('messageError', { error, message });
      throw error;
    }
  }

  /**
   * Get server statistics
   */
  getStats(): {
    connectedAgents: number;
    totalMessages: number;
    uptime: number;
    conversations: number;
  } {
    return {
      connectedAgents: this.connections.size,
      totalMessages: 0, // Would track in real implementation
      uptime: process.uptime(),
      conversations: 0 // Would track in real implementation
    };
  }

  /**
   * Get list of connected agents
   */
  getConnectedAgents(): string[] {
    return Array.from(this.connections.keys());
  }

  private async startWebSocketServer(): Promise<void> {
    this.wsServer = new WebSocketServer({
      port: this.config.port,
      host: this.config.host
    });

    this.wsServer.on('connection', (ws, request) => {
      console.log(`New WebSocket connection from ${request.socket.remoteAddress}`);

      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          await this.handleIncomingMessage(message, ws);
        } catch (error) {
          ws.send(JSON.stringify({
            error: 'Invalid message format',
            details: error instanceof Error ? error.message : String(error)
          }));
        }
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        this.emit('connectionError', error);
      });

      ws.on('close', () => {
        console.log('WebSocket connection closed');
      });
    });

    this.wsServer.on('error', (error) => {
      console.error('WebSocket server error:', error);
      this.emit('serverError', error);
    });
  }

  private async startHTTPServer(): Promise<void> {
    // HTTP server implementation would go here
    // For now, focusing on WebSocket implementation
    console.log('HTTP server support planned for future implementation');
  }

  private async handleIncomingMessage(data: any, ws: WebSocket): Promise<void> {
    try {
      if (data.type === 'register') {
        const agent: ACPAgent = data.agent;
        await this.registerAgent(agent, ws);
        ws.send(JSON.stringify({
          type: 'registration_success',
          agentId: agent.aid
        }));
        return;
      }

      if (data.type === 'message') {
        const securedMessage = data.message;
        
        // Verify the message
        const verification = await this.security.verifyMessage(securedMessage);
        
        if (!verification.isValid) {
          ws.send(JSON.stringify({
            type: 'error',
            error: 'Message verification failed',
            reason: verification.reason
          }));
          return;
        }

        // Process the verified message
        await this.adapter.receiveMessage(securedMessage);
        
        // Route to intended recipients
        await this.routeSecuredMessage(securedMessage);

        ws.send(JSON.stringify({
          type: 'message_processed',
          messageId: securedMessage.id
        }));
      }
    } catch (error) {
      ws.send(JSON.stringify({
        type: 'error',
        error: error instanceof Error ? error.message : String(error)
      }));
    }
  }

  private async routeSecuredMessage(securedMessage: any): Promise<void> {
    const receivers = Array.isArray(securedMessage.receiver) 
      ? securedMessage.receiver 
      : [securedMessage.receiver];

    for (const receiverId of receivers) {
      const receiverWs = this.connections.get(receiverId);
      if (receiverWs && receiverWs.readyState === WebSocket.OPEN) {
        receiverWs.send(JSON.stringify({
          type: 'incoming_message',
          message: securedMessage
        }));
      }
    }
  }

  private setupEventHandlers(): void {
    this.adapter.on('messageSent', (message) => {
      this.emit('messageSent', message);
    });

    this.adapter.on('messageReceived', (message) => {
      this.emit('messageReceived', message);
    });

    this.adapter.on('securityViolation', (violation) => {
      this.emit('securityViolation', violation);
      console.warn('ACP Security Violation:', violation);
    });

    this.security.on('messageSecured', (message) => {
      this.emit('messageSecured', message);
    });

    this.security.on('messageVerified', (message) => {
      this.emit('messageVerified', message);
    });

    this.security.on('securityViolation', (violation) => {
      this.emit('securityViolation', violation);
      console.warn('ACP Security Violation:', violation);
    });
  }
}