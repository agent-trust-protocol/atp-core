import { z } from 'zod';
import { RPCRequestSchema, RPCResponseSchema } from '@atp/shared';

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