import { z } from 'zod';
export declare enum TrustLevel {
    UNTRUSTED = "untrusted",
    BASIC = "basic",
    VERIFIED = "verified",
    PREMIUM = "premium",
    ENTERPRISE = "enterprise"
}
export declare const TrustLevelSchema: z.ZodEnum<{
    untrusted: TrustLevel.UNTRUSTED;
    basic: TrustLevel.BASIC;
    verified: TrustLevel.VERIFIED;
    premium: TrustLevel.PREMIUM;
    enterprise: TrustLevel.ENTERPRISE;
}>;
export interface TrustLevelInfo {
    level: TrustLevel;
    name: string;
    description: string;
    capabilities: string[];
    requirements: string[];
    numericValue: number;
}
export declare const TRUST_LEVELS: Record<TrustLevel, TrustLevelInfo>;
export declare class TrustLevelManager {
    static isAuthorized(userLevel: TrustLevel, requiredLevel: TrustLevel): boolean;
    static hasCapability(userLevel: TrustLevel, capability: string): boolean;
    static getNextLevel(currentLevel: TrustLevel): TrustLevel | null;
    static getLevelRequirements(level: TrustLevel): string[];
    static validateTrustLevel(level: string): level is TrustLevel;
    static getUpgradeRequirements(currentLevel: TrustLevel, targetLevel: TrustLevel): string[];
}
export declare const APIResponseSchema: z.ZodObject<{
    success: z.ZodBoolean;
    data: z.ZodOptional<z.ZodAny>;
    error: z.ZodOptional<z.ZodString>;
    timestamp: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const AuditEventSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodEnum<{
        DID_CREATED: "DID_CREATED";
        DID_RESOLVED: "DID_RESOLVED";
        VC_ISSUED: "VC_ISSUED";
        VC_VERIFIED: "VC_VERIFIED";
        PERMISSION_GRANTED: "PERMISSION_GRANTED";
        PERMISSION_REVOKED: "PERMISSION_REVOKED";
        RPC_INVOKED: "RPC_INVOKED";
    }>;
    actor: z.ZodString;
    target: z.ZodOptional<z.ZodString>;
    metadata: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    timestamp: z.ZodString;
    signature: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export declare const RPCRequestSchema: z.ZodObject<{
    jsonrpc: z.ZodLiteral<"2.0">;
    method: z.ZodString;
    params: z.ZodOptional<z.ZodAny>;
    id: z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>;
}, z.core.$strip>;
export declare const RPCResponseSchema: z.ZodObject<{
    jsonrpc: z.ZodLiteral<"2.0">;
    result: z.ZodOptional<z.ZodAny>;
    error: z.ZodOptional<z.ZodObject<{
        code: z.ZodNumber;
        message: z.ZodString;
        data: z.ZodOptional<z.ZodAny>;
    }, z.core.$strip>>;
    id: z.ZodUnion<readonly [z.ZodString, z.ZodNumber]>;
}, z.core.$strip>;
export type APIResponse = z.infer<typeof APIResponseSchema>;
export type AuditEvent = z.infer<typeof AuditEventSchema>;
export type RPCRequest = z.infer<typeof RPCRequestSchema>;
export type RPCResponse = z.infer<typeof RPCResponseSchema>;
export interface ServiceConfig {
    port: number;
    host: string;
    dbPath?: string;
    corsOrigins?: string[];
}
//# sourceMappingURL=types.d.ts.map