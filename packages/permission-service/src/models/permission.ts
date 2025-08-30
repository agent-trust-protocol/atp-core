import { z } from 'zod';

export const ScopeSchema = z.enum([
  'read', 'write', 'execute', 'admin',
  'identity:read', 'identity:write',
  'vc:issue', 'vc:verify', 'vc:revoke',
  'permission:grant', 'permission:revoke',
  'audit:read', 'audit:write'
]);

export const CapabilityTokenSchema = z.object({
  id: z.string(),
  issuer: z.string(),
  subject: z.string(),
  audience: z.string(),
  scopes: z.array(ScopeSchema),
  resource: z.string().optional(),
  conditions: z.record(z.any()).optional(),
  issuedAt: z.number(),
  expiresAt: z.number(),
  notBefore: z.number().optional(),
});

export const PermissionGrantSchema = z.object({
  id: z.string(),
  grantor: z.string(),
  grantee: z.string(),
  scopes: z.array(ScopeSchema),
  resource: z.string().optional(),
  conditions: z.record(z.any()).optional(),
  expiresAt: z.number().optional(),
  createdAt: z.number(),
  revokedAt: z.number().optional(),
});

export const PermissionRequestSchema = z.object({
  grantor: z.string(),
  grantee: z.string(),
  scopes: z.array(ScopeSchema),
  resource: z.string().optional(),
  conditions: z.record(z.any()).optional(),
  expiresAt: z.number().optional(),
  justification: z.string().optional(),
});

export const PermissionCheckSchema = z.object({
  subject: z.string(),
  action: ScopeSchema,
  resource: z.string().optional(),
  context: z.record(z.any()).optional(),
});

export const PolicyRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  condition: z.string(), // JavaScript expression
  effect: z.enum(['allow', 'deny']),
  priority: z.number(),
  active: z.boolean(),
});

export type Scope = z.infer<typeof ScopeSchema>;
export type CapabilityToken = z.infer<typeof CapabilityTokenSchema>;
export type PermissionGrant = z.infer<typeof PermissionGrantSchema>;
export type PermissionRequest = z.infer<typeof PermissionRequestSchema>;
export type PermissionCheck = z.infer<typeof PermissionCheckSchema>;
export type PolicyRule = z.infer<typeof PolicyRuleSchema>;

export interface PermissionResult {
  allowed: boolean;
  reason?: string;
  token?: string;
  expiresAt?: number;
}

export interface TokenValidationResult {
  valid: boolean;
  payload?: CapabilityToken;
  error?: string;
}