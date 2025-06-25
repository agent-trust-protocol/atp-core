import { RPCRequest, RPCResponse } from '../models/rpc.js';
export declare class RPCService {
    private services;
    constructor();
    registerService(config: {
        name: string;
        endpoint: string;
        methods: string[];
        description: string;
    }): void;
    handleRequest(request: RPCRequest, clientDid: string): Promise<RPCResponse>;
    private proxyRequest;
    private getHttpMethod;
    private getServiceEndpoint;
    healthCheck(): Promise<void>;
    getServiceStatus(): Record<string, {
        healthy: boolean;
        lastCheck: number;
    }>;
    private logAuditEvent;
}
