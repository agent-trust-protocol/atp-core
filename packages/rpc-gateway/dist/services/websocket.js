import { WebSocketServer, WebSocket } from 'ws';
import { randomUUID } from 'crypto';
export class WebSocketService {
    rpcService;
    authService;
    wss;
    clients = new Map();
    clientSockets = new Map();
    constructor(rpcService, authService) {
        this.rpcService = rpcService;
        this.authService = authService;
        this.wss = new WebSocketServer({
            port: parseInt(process.env.WS_PORT || '8081'),
            path: '/rpc'
        });
        this.wss.on('connection', this.handleConnection.bind(this));
        this.startCleanupInterval();
    }
    handleConnection(ws, req) {
        const clientId = this.generateClientId();
        const client = {
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
    async handleMessage(clientId, data) {
        const client = this.clients.get(clientId);
        if (!client)
            return;
        client.lastSeen = Date.now();
        try {
            const message = JSON.parse(data.toString());
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
        }
        catch (error) {
            this.sendError(clientId, 'Invalid message format');
        }
    }
    async handleAuth(clientId, authData) {
        const client = this.clients.get(clientId);
        if (!client)
            return;
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
            }
            else {
                this.sendMessage(clientId, {
                    type: 'notification',
                    payload: { event: 'authenticated', success: false, error: 'Invalid credentials' },
                });
            }
        }
        catch (error) {
            this.sendMessage(clientId, {
                type: 'notification',
                payload: { event: 'authenticated', success: false, error: 'Authentication failed' },
            });
        }
    }
    async handleRPC(clientId, rpcRequest) {
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
            const response = await this.rpcService.handleRequest(rpcRequest, client.did);
            this.sendMessage(clientId, {
                type: 'rpc',
                payload: response,
            });
        }
        catch (error) {
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
    async handleSubscription(clientId, subscription) {
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
    async handleUnsubscription(clientId, subscriptionId) {
        const client = this.clients.get(clientId);
        if (!client)
            return;
        client.subscriptions.delete(subscriptionId);
        this.sendMessage(clientId, {
            type: 'notification',
            payload: { event: 'unsubscribed', subscriptionId },
        });
    }
    handleDisconnection(clientId) {
        this.clients.delete(clientId);
        this.clientSockets.delete(clientId);
        console.log(`Client ${clientId} disconnected`);
    }
    handleError(clientId, error) {
        console.error(`WebSocket error for client ${clientId}:`, error);
    }
    sendMessage(clientId, message) {
        const ws = this.clientSockets.get(clientId);
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(message));
        }
    }
    sendError(clientId, error) {
        this.sendMessage(clientId, {
            type: 'notification',
            payload: { event: 'error', error },
        });
    }
    broadcast(event, data) {
        const message = {
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
    generateClientId() {
        return randomUUID();
    }
    startCleanupInterval() {
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
