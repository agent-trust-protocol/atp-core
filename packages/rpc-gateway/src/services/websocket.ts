import { WebSocketServer, WebSocket, RawData } from 'ws';
import { IncomingMessage } from 'http';
import { ConnectedClient, WebSocketMessage, AuthMessage, RPCRequest, RPCResponse, Subscription } from '../models/rpc.js';
import { RPCService } from './rpc.js';
import { AuthService } from './auth.js';
import { randomUUID } from 'crypto';

export class WebSocketService {
  private wss: WebSocketServer;
  private clients: Map<string, ConnectedClient> = new Map();
  private clientSockets: Map<string, WebSocket> = new Map();

  constructor(
    private rpcService: RPCService,
    private authService: AuthService
  ) {
    this.wss = new WebSocketServer({ 
      port: parseInt(process.env.WS_PORT || '8081'),
      path: '/rpc'
    });
    
    this.wss.on('connection', this.handleConnection.bind(this));
    this.startCleanupInterval();
  }

  private handleConnection(ws: WebSocket, req: IncomingMessage): void {
    const clientId = this.generateClientId();
    
    const client: ConnectedClient = {
      id: clientId,
      authenticated: false,
      subscriptions: new Map(),
      lastSeen: Date.now(),
    };

    this.clients.set(clientId, client);
    this.clientSockets.set(clientId, ws);

    ws.on('message', (data) => this.handleMessage(clientId, data));
    ws.on('close', () => this.handleDisconnection(clientId));
    ws.on('error', (error) => this.handleError(clientId, error));

    console.log(`Client ${clientId} connected`);
    this.sendMessage(clientId, {
      type: 'notification',
      payload: { event: 'connected', clientId },
    });
  }

  private async handleMessage(clientId: string, data: RawData): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.lastSeen = Date.now();

    try {
      const message: WebSocketMessage = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'auth':
          await this.handleAuth(clientId, message.payload);
          break;
        case 'rpc':
          await this.handleRPC(clientId, message.payload);
          break;
        case 'subscribe':
          await this.handleSubscription(clientId, message.payload);
          break;
        case 'unsubscribe':
          await this.handleUnsubscription(clientId, message.payload);
          break;
        default:
          this.sendError(clientId, 'Unknown message type');
      }
    } catch (error) {
      this.sendError(clientId, 'Invalid message format');
    }
  }

  private async handleAuth(clientId: string, authData: AuthMessage): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client) return;

    try {
      const isValid = await this.authService.verifyAuth(authData);
      
      if (isValid) {
        client.authenticated = true;
        client.did = authData.did;
        
        this.sendMessage(clientId, {
          type: 'notification',
          payload: { event: 'authenticated', success: true },
        });
        
        console.log(`Client ${clientId} authenticated as ${authData.did}`);
      } else {
        this.sendMessage(clientId, {
          type: 'notification',
          payload: { event: 'authenticated', success: false, error: 'Invalid credentials' },
        });
      }
    } catch (error) {
      this.sendMessage(clientId, {
        type: 'notification',
        payload: { event: 'authenticated', success: false, error: 'Authentication failed' },
      });
    }
  }

  private async handleRPC(clientId: string, rpcRequest: RPCRequest): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client || !client.authenticated) {
      this.sendMessage(clientId, {
        type: 'rpc',
        payload: {
          jsonrpc: '2.0',
          error: { code: -32600, message: 'Not authenticated' },
          id: rpcRequest.id,
        },
      });
      return;
    }

    try {
      const response = await this.rpcService.handleRequest(rpcRequest, client.did!);
      this.sendMessage(clientId, {
        type: 'rpc',
        payload: response,
      });
    } catch (error) {
      this.sendMessage(clientId, {
        type: 'rpc',
        payload: {
          jsonrpc: '2.0',
          error: { 
            code: -32603, 
            message: 'Internal error',
            data: error instanceof Error ? error.message : 'Unknown error'
          },
          id: rpcRequest.id,
        },
      });
    }
  }

  private async handleSubscription(clientId: string, subscription: Subscription): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client || !client.authenticated) {
      this.sendError(clientId, 'Not authenticated');
      return;
    }

    client.subscriptions.set(subscription.id, subscription);
    
    this.sendMessage(clientId, {
      type: 'notification',
      payload: { event: 'subscribed', subscriptionId: subscription.id },
    });
    
    console.log(`Client ${clientId} subscribed to ${subscription.event}`);
  }

  private async handleUnsubscription(clientId: string, subscriptionId: string): Promise<void> {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.subscriptions.delete(subscriptionId);
    
    this.sendMessage(clientId, {
      type: 'notification',
      payload: { event: 'unsubscribed', subscriptionId },
    });
  }

  private handleDisconnection(clientId: string): void {
    this.clients.delete(clientId);
    this.clientSockets.delete(clientId);
    console.log(`Client ${clientId} disconnected`);
  }

  private handleError(clientId: string, error: Error): void {
    console.error(`WebSocket error for client ${clientId}:`, error);
  }

  private sendMessage(clientId: string, message: WebSocketMessage): void {
    const ws = this.clientSockets.get(clientId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private sendError(clientId: string, error: string): void {
    this.sendMessage(clientId, {
      type: 'notification',
      payload: { event: 'error', error },
    });
  }

  public broadcast(event: string, data: any): void {
    const message: WebSocketMessage = {
      type: 'notification',
      payload: { event, data, timestamp: Date.now() },
    };

    for (const [clientId, client] of this.clients.entries()) {
      if (client.authenticated) {
        for (const subscription of client.subscriptions.values()) {
          if (subscription.event === event) {
            this.sendMessage(clientId, message);
            break;
          }
        }
      }
    }
  }

  private generateClientId(): string {
    return randomUUID();
  }

  private startCleanupInterval(): void {
    setInterval(() => {
      const now = Date.now();
      const timeout = 5 * 60 * 1000; // 5 minutes

      for (const [clientId, client] of this.clients.entries()) {
        if (now - client.lastSeen > timeout) {
          const ws = this.clientSockets.get(clientId);
          if (ws) {
            ws.close();
          }
          this.handleDisconnection(clientId);
        }
      }
    }, 60000); // Check every minute
  }
}