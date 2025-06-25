import { z } from 'zod';

export const AuditEventSchema = z.object({
  id: z.string(),
  timestamp: z.string(),
  source: z.string(),
  action: z.string(),
  resource: z.string(),
  actor: z.string().optional(),
  details: z.record(z.any()).optional(),
  hash: z.string(),
  previousHash: z.string().optional(),
  ipfsHash: z.string().optional(),
  signature: z.string().optional(),
  // Enhanced security fields
  blockNumber: z.number().optional(),
  nonce: z.string().optional(),
  encrypted: z.boolean().optional(),
});

export const AuditQuerySchema = z.object({
  source: z.string().optional(),
  action: z.string().optional(),
  resource: z.string().optional(),
  actor: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  limit: z.number().optional(),
  offset: z.number().optional(),
});

export type AuditEvent = z.infer<typeof AuditEventSchema>;
export type AuditQuery = z.infer<typeof AuditQuerySchema>;

export interface AuditEventRequest {
  source: string;
  action: string;
  resource: string;
  actor?: string;
  details?: Record<string, any>;
}

export interface AuditEventResponse {
  success: boolean;
  event?: AuditEvent;
  error?: string;
}

export interface AuditQueryResponse {
  success: boolean;
  events?: AuditEvent[];
  total?: number;
  error?: string;
}