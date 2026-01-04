/**
 * AGP Gateway
 * High-performance Cisco Agent Gateway Protocol server with ATP security
 */

import { EventEmitter } from 'events';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';
import { AGPAdapter } from './adapter';
import { AGPSecurityWrapper } from './security-wrapper';
import { 
  AGPGatewayConfig, 
  AGPMessage, 
  AGPAgent, 
  AGPMessageType,
  SecuredAGPMessage 
} from './types';

export class AGPGateway extends EventEmitter {
  private config: AGPGatewayConfig;
  private adapter: AGPAdapter;
  private security: AGPSecurityWrapper;
  private wsServer?: WebSocketServer;
  private httpServer?: any;
  private connections: Map<string, WebSocket> = new Map();
  private metrics: {
    messagesProcessed: number;
    connectionsCount: number;
    errorsCount: number;
    startTime: number;
  };

  constructor(config: AGPGatewayConfig) {
    super();
    this.config = config;
    this.adapter = new AGPAdapter();
    this.security = new AGPSecurityWrapper(config.security);
    this.metrics = {
      messagesProcessed: 0,
      connectionsCount: 0,
      errorsCount: 0,
      startTime: Date.now()
    };

    this.setupEventHandlers();
  }

  /**
   * Start the AGP gateway
   */
  async start(): Promise<void> {
    try {
      // Start HTTP server for health checks and metrics
      if (this.config.monitoring.enableHealthCheck) {
        await this.startHTTPServer();
      }

      // Start WebSocket server for agent connections
      await this.startWebSocketServer();

      // Start metrics collection if enabled
      if (this.config.monitoring.enableMetrics) {
        this.startMetricsCollection();
      }

      this.emit('gatewayStarted', {
        gatewayId: this.config.gatewayId,
        port: this.config.port,
        host: this.config.host
      });

      console.log(`AGP Gateway '${this.config.gatewayName}' started on ${this.config.host}:${this.config.port}`);
    } catch (error) {
      this.emit('gatewayError', error);
      throw error;
    }
  }

  /**
   * Stop the AGP gateway
   */
  async stop(): Promise<void> {
    // Close all connections
    for (const [agentId, ws] of this.connections) {
      ws.close();
    }
    this.connections.clear();

    // Stop servers
    if (this.wsServer) {
      this.wsServer.close();
    }
    if (this.httpServer) {
      this.httpServer.close();
    }

    this.emit('gatewayStopped', this.config.gatewayId);
    console.log(`AGP Gateway '${this.config.gatewayName}' stopped`);
  }

  /**
   * Send a message through the gateway
   */
  async sendMessage(
    message: AGPMessage,
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

      // Process through adapter
      await this.adapter.sendMessage(message, senderDID, senderPrivateKey);

      // Route to connected agents
      await this.routeMessage(securedMessage);

      this.metrics.messagesProcessed++;
      this.emit('messageSent', securedMessage);
    } catch (error) {
      this.metrics.errorsCount++;
      this.emit('messageError', { error, message });
      throw error;
    }
  }

  /**
   * Broadcast a message to all connected agents
   */
  async broadcastMessage(
    message: Omit<AGPMessage, 'targetAgent'>,
    senderDID: string,
    senderPrivateKey: string
  ): Promise<void> {
    const connectedAgents = Array.from(this.connections.keys());
    const broadcastMessage: AGPMessage = {
      ...message,
      targetAgent: connectedAgents
    };

    await this.sendMessage(broadcastMessage, senderDID, senderPrivateKey);
  }

  /**
   * Get gateway status and statistics
   */
  getStatus(): {
    gatewayId: string;
    status: 'running' | 'stopped';
    uptime: number;
    connectedAgents: number;
    metrics: any;
    memoryUsage: NodeJS.MemoryUsage;
  } {
    return {
      gatewayId: this.config.gatewayId,
      status: this.wsServer ? 'running' : 'stopped',
      uptime: Date.now() - this.metrics.startTime,
      connectedAgents: this.connections.size,
      metrics: { ...this.metrics },
      memoryUsage: process.memoryUsage()
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
      host: this.config.host,
      maxPayload: this.config.security.maxMessageSize
    });

    this.wsServer.on('connection', (ws, request) => {
      console.log(`New AGP connection from ${request.socket.remoteAddress}`);
      this.metrics.connectionsCount++;

      ws.on('message', async (data) => {
        try {
          const message = JSON.parse(data.toString());
          await this.handleIncomingMessage(message, ws);
        } catch (error) {
          this.metrics.errorsCount++;
          ws.send(JSON.stringify({
            messageType: AGPMessageType.ERROR,
            error: 'Invalid message format',
            details: error instanceof Error ? error.message : String(error)
          }));
        }
      });

      ws.on('error', (error) => {
        console.error('AGP WebSocket error:', error);
        this.metrics.errorsCount++;
        this.emit('connectionError', error);
      });

      ws.on('close', () => {
        // Find and remove the agent from connections
        for (const [agentId, connection] of this.connections) {
          if (connection === ws) {
            this.connections.delete(agentId);
            this.emit('agentDisconnected', agentId);
            break;
          }
        }
        this.metrics.connectionsCount--;
      });
    });

    this.wsServer.on('error', (error) => {
      console.error('AGP WebSocket server error:', error);
      this.emit('gatewayError', error);
    });
  }

  private async startHTTPServer(): Promise<void> {
    this.httpServer = createServer((req, res) => {
      res.setHeader('Content-Type', 'application/json');

      if (req.url === this.config.monitoring.healthCheckPath) {
        // Health check endpoint
        const status = this.getStatus();
        res.statusCode = 200;
        res.end(JSON.stringify({
          status: 'healthy',
          gateway: status,
          timestamp: new Date().toISOString()
        }));
      } else if (req.url === '/metrics' && this.config.monitoring.enableMetrics) {
        // Metrics endpoint
        res.statusCode = 200;
        res.end(JSON.stringify({
          metrics: this.metrics,
          connectedAgents: this.connections.size,
          timestamp: new Date().toISOString()
        }));
      } else {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: 'Not found' }));
      }
    });

    this.httpServer.listen(this.config.monitoring.metricsPort, () => {
      console.log(`AGP Gateway HTTP server listening on port ${this.config.monitoring.metricsPort}`);
    });
  }

  private async handleIncomingMessage(data: any, ws: WebSocket): Promise<void> {
    try {
      if (data.type === 'register') {
        // Agent registration
        const agent: AGPAgent = data.agent;
        await this.adapter.registerAgent(agent);
        this.connections.set(agent.agentId, ws);

        ws.send(JSON.stringify({
          messageType: AGPMessageType.REGISTRATION,
          messageId: `reg-${Date.now()}`,
          sourceAgent: this.config.gatewayId,
          targetAgent: agent.agentId,
          payload: {
            status: 'registered',
            gatewayInfo: {
              gatewayId: this.config.gatewayId,
              gatewayName: this.config.gatewayName,
              capabilities: ['quantum-safe', 'high-availability', 'load-balancing']
            }
          },
          priority: 3,
          timestamp: Date.now()
        }));

        this.emit('agentRegistered', agent);
        return;
      }

      if (data.type === 'message') {
        // Regular message processing
        const securedMessage: SecuredAGPMessage = data.message;

        // Verify the message
        const verification = await this.security.verifyMessage(securedMessage);
        
        if (!verification.isValid) {
          ws.send(JSON.stringify({
            messageType: AGPMessageType.ERROR,
            messageId: `error-${Date.now()}`,
            sourceAgent: this.config.gatewayId,
            targetAgent: securedMessage.sourceAgent,
            payload: {
              error: 'Message verification failed',
              reason: verification.reason
            },
            priority: 3,
            timestamp: Date.now()
          }));
          return;
        }

        // Process the verified message
        await this.adapter.processIncomingMessage(securedMessage);
        
        // Route to intended recipients
        await this.routeMessage(securedMessage);

        // Send acknowledgment
        ws.send(JSON.stringify({
          messageType: AGPMessageType.RESPONSE,
          messageId: `ack-${Date.now()}`,
          sourceAgent: this.config.gatewayId,
          targetAgent: securedMessage.sourceAgent,
          payload: {
            status: 'processed',
            originalMessageId: securedMessage.messageId
          },
          priority: 2,
          timestamp: Date.now(),
          correlationId: securedMessage.messageId
        }));

        this.metrics.messagesProcessed++;
      }
    } catch (error) {
      this.metrics.errorsCount++;
      ws.send(JSON.stringify({
        messageType: AGPMessageType.ERROR,
        error: error instanceof Error ? error.message : String(error)
      }));
    }
  }

  private async routeMessage(securedMessage: SecuredAGPMessage): Promise<void> {
    const targets = Array.isArray(securedMessage.targetAgent) 
      ? securedMessage.targetAgent 
      : [securedMessage.targetAgent];

    for (const targetAgent of targets) {
      const targetWs = this.connections.get(targetAgent);
      if (targetWs && targetWs.readyState === WebSocket.OPEN) {
        targetWs.send(JSON.stringify({
          type: 'incoming_message',
          message: securedMessage
        }));
      } else {
        // Agent not connected, queue message or handle offline delivery
        this.emit('agentOffline', { targetAgent, message: securedMessage });
      }
    }
  }

  private startMetricsCollection(): void {
    setInterval(() => {
      const status = this.getStatus();
      this.emit('metricsUpdate', status);
      
      // Optional: Send metrics to external monitoring system
      // this.sendMetricsToMonitoring(status);
    }, 30000); // Collect metrics every 30 seconds
  }

  private setupEventHandlers(): void {
    this.adapter.on('messageSent', (message) => {
      this.emit('messageSent', message);
    });

    this.adapter.on('messageProcessed', (message) => {
      this.emit('messageProcessed', message);
    });

    this.adapter.on('agentRegistered', (data) => {
      this.emit('agentRegistered', data.agent);
    });

    this.adapter.on('agentDeregistered', (agentId) => {
      this.emit('agentDeregistered', agentId);
    });

    this.adapter.on('securityViolation', (violation) => {
      this.emit('securityViolation', violation);
      console.warn('AGP Security Violation:', violation);
    });

    this.security.on('messageSecured', (message) => {
      this.emit('messageSecured', message);
    });

    this.security.on('messageVerified', (message) => {
      this.emit('messageVerified', message);
    });

    this.security.on('securityViolation', (violation) => {
      this.emit('securityViolation', violation);
      console.warn('AGP Security Violation:', violation);
    });
  }
}