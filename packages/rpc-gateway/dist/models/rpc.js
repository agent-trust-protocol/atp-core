import { z } from 'zod';
export const WebSocketMessageSchema = z.object({
    type: z.enum(['rpc', 'auth', 'subscribe', 'unsubscribe', 'notification']),
    payload: z.any(),
});
export const AuthMessageSchema = z.object({
    did: z.string(),
    proof: z.string(),
    timestamp: z.number(),
    nonce: z.string(), // Required nonce for replay protection
});
export const SubscriptionSchema = z.object({
    id: z.string(),
    event: z.string(),
    filter: z.record(z.any()).optional(),
});
export const NotificationSchema = z.object({
    event: z.string(),
    data: z.any(),
    timestamp: z.number(),
});
export const ServiceRegistrationSchema = z.object({
    name: z.string(),
    endpoint: z.string(),
    methods: z.array(z.string()),
    description: z.string(),
});
