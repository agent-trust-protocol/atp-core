import { z } from 'zod';
// Trust Level System for Agent Trust Protocol™
export var TrustLevel;
(function (TrustLevel) {
    TrustLevel["UNTRUSTED"] = "untrusted";
    TrustLevel["BASIC"] = "basic";
    TrustLevel["VERIFIED"] = "verified";
    TrustLevel["PREMIUM"] = "premium";
    TrustLevel["ENTERPRISE"] = "enterprise";
})(TrustLevel || (TrustLevel = {}));
export const TrustLevelSchema = z.enum([
    TrustLevel.UNTRUSTED,
    TrustLevel.BASIC,
    TrustLevel.VERIFIED,
    TrustLevel.PREMIUM,
    TrustLevel.ENTERPRISE,
]);
export const TRUST_LEVELS = {
    [TrustLevel.UNTRUSTED]: {
        level: TrustLevel.UNTRUSTED,
        name: 'Untrusted',
        description: 'Default level for unverified agents',
        capabilities: ['read-public'],
        requirements: ['None'],
        numericValue: 0,
    },
    [TrustLevel.BASIC]: {
        level: TrustLevel.BASIC,
        name: 'Basic Trust',
        description: 'Basic verification completed',
        capabilities: ['read-public', 'write-limited', 'basic-operations'],
        requirements: ['DID verification', 'Email verification'],
        numericValue: 1,
    },
    [TrustLevel.VERIFIED]: {
        level: TrustLevel.VERIFIED,
        name: 'Verified Agent',
        description: 'Identity and credentials verified',
        capabilities: ['read-public', 'write-limited', 'basic-operations', 'credential-operations', 'audit-read'],
        requirements: ['DID verification', 'Credential verification', 'Background check'],
        numericValue: 2,
    },
    [TrustLevel.PREMIUM]: {
        level: TrustLevel.PREMIUM,
        name: 'Premium Trust',
        description: 'High-trust agent with extended capabilities',
        capabilities: ['read-public', 'write-limited', 'basic-operations', 'credential-operations', 'audit-read', 'advanced-operations', 'cross-domain-access'],
        requirements: ['DID verification', 'Credential verification', 'Background check', 'Security audit', 'Insurance coverage'],
        numericValue: 3,
    },
    [TrustLevel.ENTERPRISE]: {
        level: TrustLevel.ENTERPRISE,
        name: 'Enterprise Trust',
        description: 'Maximum trust level for enterprise agents',
        capabilities: ['read-public', 'write-limited', 'basic-operations', 'credential-operations', 'audit-read', 'advanced-operations', 'cross-domain-access', 'admin-operations', 'system-management'],
        requirements: ['DID verification', 'Credential verification', 'Background check', 'Security audit', 'Insurance coverage', 'Enterprise agreement', 'Compliance certification'],
        numericValue: 4,
    },
};
export class TrustLevelManager {
    static isAuthorized(userLevel, requiredLevel) {
        return TRUST_LEVELS[userLevel].numericValue >= TRUST_LEVELS[requiredLevel].numericValue;
    }
    static hasCapability(userLevel, capability) {
        return TRUST_LEVELS[userLevel].capabilities.includes(capability);
    }
    static getNextLevel(currentLevel) {
        const levels = Object.values(TrustLevel);
        const currentIndex = levels.indexOf(currentLevel);
        return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : null;
    }
    static getLevelRequirements(level) {
        return TRUST_LEVELS[level].requirements;
    }
    static validateTrustLevel(level) {
        return Object.values(TrustLevel).includes(level);
    }
    static getUpgradeRequirements(currentLevel, targetLevel) {
        if (!this.isAuthorized(targetLevel, currentLevel)) {
            const currentReqs = new Set(TRUST_LEVELS[currentLevel].requirements);
            const targetReqs = TRUST_LEVELS[targetLevel].requirements;
            return targetReqs.filter(req => !currentReqs.has(req));
        }
        return [];
    }
}
export const APIResponseSchema = z.object({
    success: z.boolean(),
    data: z.any().optional(),
    error: z.string().optional(),
    timestamp: z.string().optional(),
});
export const AuditEventSchema = z.object({
    id: z.string(),
    type: z.enum(['DID_CREATED', 'DID_RESOLVED', 'VC_ISSUED', 'VC_VERIFIED', 'PERMISSION_GRANTED', 'PERMISSION_REVOKED', 'RPC_INVOKED']),
    actor: z.string(),
    target: z.string().optional(),
    metadata: z.record(z.any()).optional(),
    timestamp: z.string(),
    signature: z.string().optional(),
});
export const RPCRequestSchema = z.object({
    jsonrpc: z.literal('2.0'),
    method: z.string(),
    params: z.any().optional(),
    id: z.union([z.string(), z.number()]),
});
export const RPCResponseSchema = z.object({
    jsonrpc: z.literal('2.0'),
    result: z.any().optional(),
    error: z.object({
        code: z.number(),
        message: z.string(),
        data: z.any().optional(),
    }).optional(),
    id: z.union([z.string(), z.number()]),
});
