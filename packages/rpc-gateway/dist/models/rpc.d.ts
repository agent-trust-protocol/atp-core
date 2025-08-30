import { z } from 'zod';
import { RPCRequestSchema, RPCResponseSchema } from '@atp/shared';
export declare const WebSocketMessageSchema: z.ZodObject<{
    type: z.ZodEnum<["rpc", "auth", "subscribe", "unsubscribe", "notification"]>;
    payload: z.ZodAny;
}, "strip", z.ZodTypeAny, {
    type: "rpc" | "auth" | "subscribe" | "unsubscribe" | "notification";
    payload?: any;
}, {
    type: "rpc" | "auth" | "subscribe" | "unsubscribe" | "notification";
    payload?: any;
}>;
export declare const AuthMessageSchema: z.ZodObject<{
    did: z.ZodString;
    proof: z.ZodString;
    timestamp: z.ZodNumber;
    nonce: z.ZodString;
}, "strip", z.ZodTypeAny, {
    did: string;
    proof: string;
    timestamp: number;
    nonce: string;
}, {
    did: string;
    proof: string;
    timestamp: number;
    nonce: string;
}>;
export declare const SubscriptionSchema: z.ZodObject<{
    id: z.ZodString;
    event: z.ZodString;
    filter: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    event: string;
    filter?: Record<string, any> | undefined;
}, {
    id: string;
    event: string;
    filter?: Record<string, any> | undefined;
}>;
export declare const NotificationSchema: z.ZodObject<{
    event: z.ZodString;
    data: z.ZodAny;
    timestamp: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    timestamp: number;
    event: string;
    data?: any;
}, {
    timestamp: number;
    event: string;
    data?: any;
}>;
export declare const ServiceRegistrationSchema: z.ZodObject<{
    name: z.ZodString;
    endpoint: z.ZodString;
    methods: z.ZodArray<z.ZodString, "many">;
    description: z.ZodString;
}, "strip", z.ZodTypeAny, {
    name: string;
    endpoint: string;
    methods: string[];
    description: string;
}, {
    name: string;
    endpoint: string;
    methods: string[];
    description: string;
}>;
export type WebSocketMessage = z.infer<typeof WebSocketMessageSchema>;
export type AuthMessage = z.infer<typeof AuthMessageSchema>;
export type Subscription = z.infer<typeof SubscriptionSchema>;
export type Notification = z.infer<typeof NotificationSchema>;
export type ServiceRegistration = z.infer<typeof ServiceRegistrationSchema>;
export type RPCRequest = z.infer<typeof RPCRequestSchema>;
export type RPCResponse = z.infer<typeof RPCResponseSchema>;
export interface ConnectedClient {
    id: string;
    did?: string;
    authenticated: boolean;
    subscriptions: Map<string, Subscription>;
    lastSeen: number;
}
export interface ServiceProxy {
    name: string;
    endpoint: string;
    methods: Set<string>;
    healthy: boolean;
    lastHealthCheck: number;
}
//# sourceMappingURL=rpc.d.ts.map