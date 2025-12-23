import { RPCService } from './rpc.js';
import { AuthService } from './auth.js';
export declare class WebSocketService {
    private rpcService;
    private authService;
    private wss;
    private clients;
    private clientSockets;
    constructor(rpcService: RPCService, authService: AuthService);
    private handleConnection;
    private handleMessage;
    private handleAuth;
    private handleRPC;
    private handleSubscription;
    private handleUnsubscription;
    private handleDisconnection;
    private handleError;
    private sendMessage;
    private sendError;
    broadcast(event: string, data: any): void;
    private generateClientId;
    private startCleanupInterval;
}
//# sourceMappingURL=websocket.d.ts.map