import { z } from 'zod';
export declare const ScopeSchema: z.ZodEnum<["read", "write", "execute", "admin", "identity:read", "identity:write", "vc:issue", "vc:verify", "vc:revoke", "permission:grant", "permission:revoke", "audit:read", "audit:write"]>;
export declare const CapabilityTokenSchema: z.ZodObject<{
    id: z.ZodString;
    issuer: z.ZodString;
    subject: z.ZodString;
    audience: z.ZodString;
    scopes: z.ZodArray<z.ZodEnum<["read", "write", "execute", "admin", "identity:read", "identity:write", "vc:issue", "vc:verify", "vc:revoke", "permission:grant", "permission:revoke", "audit:read", "audit:write"]>, "many">;
    resource: z.ZodOptional<z.ZodString>;
    conditions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    issuedAt: z.ZodNumber;
    expiresAt: z.ZodNumber;
    notBefore: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    id: string;
    issuer: string;
    subject: string;
    audience: string;
    scopes: ("read" | "write" | "execute" | "admin" | "identity:read" | "identity:write" | "vc:issue" | "vc:verify" | "vc:revoke" | "permission:grant" | "permission:revoke" | "audit:read" | "audit:write")[];
    issuedAt: number;
    expiresAt: number;
    resource?: string | undefined;
    conditions?: Record<string, any> | undefined;
    notBefore?: number | undefined;
}, {
    id: string;
    issuer: string;
    subject: string;
    audience: string;
    scopes: ("read" | "write" | "execute" | "admin" | "identity:read" | "identity:write" | "vc:issue" | "vc:verify" | "vc:revoke" | "permission:grant" | "permission:revoke" | "audit:read" | "audit:write")[];
    issuedAt: number;
    expiresAt: number;
    resource?: string | undefined;
    conditions?: Record<string, any> | undefined;
    notBefore?: number | undefined;
}>;
export declare const PermissionGrantSchema: z.ZodObject<{
    id: z.ZodString;
    grantor: z.ZodString;
    grantee: z.ZodString;
    scopes: z.ZodArray<z.ZodEnum<["read", "write", "execute", "admin", "identity:read", "identity:write", "vc:issue", "vc:verify", "vc:revoke", "permission:grant", "permission:revoke", "audit:read", "audit:write"]>, "many">;
    resource: z.ZodOptional<z.ZodString>;
    conditions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    expiresAt: z.ZodOptional<z.ZodNumber>;
    createdAt: z.ZodNumber;
    revokedAt: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    id: string;
    scopes: ("read" | "write" | "execute" | "admin" | "identity:read" | "identity:write" | "vc:issue" | "vc:verify" | "vc:revoke" | "permission:grant" | "permission:revoke" | "audit:read" | "audit:write")[];
    grantor: string;
    grantee: string;
    createdAt: number;
    resource?: string | undefined;
    conditions?: Record<string, any> | undefined;
    expiresAt?: number | undefined;
    revokedAt?: number | undefined;
}, {
    id: string;
    scopes: ("read" | "write" | "execute" | "admin" | "identity:read" | "identity:write" | "vc:issue" | "vc:verify" | "vc:revoke" | "permission:grant" | "permission:revoke" | "audit:read" | "audit:write")[];
    grantor: string;
    grantee: string;
    createdAt: number;
    resource?: string | undefined;
    conditions?: Record<string, any> | undefined;
    expiresAt?: number | undefined;
    revokedAt?: number | undefined;
}>;
export declare const PermissionRequestSchema: z.ZodObject<{
    grantor: z.ZodString;
    grantee: z.ZodString;
    scopes: z.ZodArray<z.ZodEnum<["read", "write", "execute", "admin", "identity:read", "identity:write", "vc:issue", "vc:verify", "vc:revoke", "permission:grant", "permission:revoke", "audit:read", "audit:write"]>, "many">;
    resource: z.ZodOptional<z.ZodString>;
    conditions: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    expiresAt: z.ZodOptional<z.ZodNumber>;
    justification: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    scopes: ("read" | "write" | "execute" | "admin" | "identity:read" | "identity:write" | "vc:issue" | "vc:verify" | "vc:revoke" | "permission:grant" | "permission:revoke" | "audit:read" | "audit:write")[];
    grantor: string;
    grantee: string;
    resource?: string | undefined;
    conditions?: Record<string, any> | undefined;
    expiresAt?: number | undefined;
    justification?: string | undefined;
}, {
    scopes: ("read" | "write" | "execute" | "admin" | "identity:read" | "identity:write" | "vc:issue" | "vc:verify" | "vc:revoke" | "permission:grant" | "permission:revoke" | "audit:read" | "audit:write")[];
    grantor: string;
    grantee: string;
    resource?: string | undefined;
    conditions?: Record<string, any> | undefined;
    expiresAt?: number | undefined;
    justification?: string | undefined;
}>;
export declare const PermissionCheckSchema: z.ZodObject<{
    subject: z.ZodString;
    action: z.ZodEnum<["read", "write", "execute", "admin", "identity:read", "identity:write", "vc:issue", "vc:verify", "vc:revoke", "permission:grant", "permission:revoke", "audit:read", "audit:write"]>;
    resource: z.ZodOptional<z.ZodString>;
    context: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
}, "strip", z.ZodTypeAny, {
    subject: string;
    action: "read" | "write" | "execute" | "admin" | "identity:read" | "identity:write" | "vc:issue" | "vc:verify" | "vc:revoke" | "permission:grant" | "permission:revoke" | "audit:read" | "audit:write";
    resource?: string | undefined;
    context?: Record<string, any> | undefined;
}, {
    subject: string;
    action: "read" | "write" | "execute" | "admin" | "identity:read" | "identity:write" | "vc:issue" | "vc:verify" | "vc:revoke" | "permission:grant" | "permission:revoke" | "audit:read" | "audit:write";
    resource?: string | undefined;
    context?: Record<string, any> | undefined;
}>;
export declare const PolicyRuleSchema: z.ZodObject<{
    id: z.ZodString;
    name: z.ZodString;
    condition: z.ZodString;
    effect: z.ZodEnum<["allow", "deny"]>;
    priority: z.ZodNumber;
    active: z.ZodBoolean;
}, "strip", z.ZodTypeAny, {
    id: string;
    name: string;
    condition: string;
    effect: "allow" | "deny";
    priority: number;
    active: boolean;
}, {
    id: string;
    name: string;
    condition: string;
    effect: "allow" | "deny";
    priority: number;
    active: boolean;
}>;
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
//# sourceMappingURL=permission.d.ts.map