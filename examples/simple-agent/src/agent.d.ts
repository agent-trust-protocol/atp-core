export interface AgentConfig {
    name: string;
    atpGateway: string;
    did?: string;
    privateKey?: string;
}
export declare class SimpleAgent {
    private config;
    private ws;
    private did;
    protected privateKey: string | null;
    private authenticated;
    private subscriptions;
    constructor(config: AgentConfig);
    initialize(): Promise<void>;
    private registerIdentity;
    private connect;
    private authenticate;
    private handleMessage;
    private handleNotification;
    private handleRPCResponse;
    protected onReady(): void;
    invoke(method: string, params?: any): Promise<any>;
    subscribe(event: string, callback: Function): void;
    disconnect(): Promise<void>;
    getDID(): string | null;
    isAuthenticated(): boolean;
}
