import { TokenService } from './token.js';
import { PolicyEngine } from './policy.js';
import { randomUUID } from 'crypto';
export class PermissionService {
    storage;
    tokenService;
    policyEngine;
    constructor(storage, secretKey) {
        this.storage = storage;
        this.tokenService = new TokenService(secretKey);
        this.policyEngine = new PolicyEngine();
    }
    async grantPermission(request) {
        const grantId = randomUUID();
        const now = Date.now();
        const grant = {
            id: grantId,
            grantor: request.grantor,
            grantee: request.grantee,
            scopes: request.scopes,
            resource: request.resource,
            conditions: request.conditions,
            expiresAt: request.expiresAt,
            createdAt: now,
        };
        await this.storage.storeGrant(grant);
        const token = await this.tokenService.createCapabilityToken({
            id: randomUUID(),
            issuer: request.grantor,
            subject: request.grantee,
            audience: 'atp:services',
            scopes: request.scopes,
            resource: request.resource,
            conditions: request.conditions,
            issuedAt: now,
            expiresAt: request.expiresAt || (now + (24 * 60 * 60 * 1000)), // 24 hours default
        });
        return {
            allowed: true,
            token,
            expiresAt: request.expiresAt,
        };
    }
    async checkPermission(check) {
        const grants = await this.storage.getGrantsForSubject(check.subject);
        const activeGrants = grants.filter(g => !g.revokedAt &&
            (!g.expiresAt || g.expiresAt > Date.now()));
        for (const grant of activeGrants) {
            if (this.scopeMatches(check.action, grant.scopes)) {
                if (grant.resource && check.resource && grant.resource !== check.resource) {
                    continue;
                }
                const policyCheck = await this.policyEngine.evaluate({
                    subject: check.subject,
                    action: check.action,
                    resource: check.resource,
                    grant,
                    context: check.context,
                });
                if (policyCheck.allowed) {
                    return {
                        allowed: true,
                        reason: `Permission granted via grant ${grant.id}`,
                    };
                }
            }
        }
        return {
            allowed: false,
            reason: 'No matching permission found',
        };
    }
    async validateToken(token) {
        return await this.tokenService.validateCapabilityToken(token);
    }
    async revokePermission(grantId, revoker) {
        const grant = await this.storage.getGrant(grantId);
        if (!grant) {
            throw new Error('Grant not found');
        }
        if (grant.grantor !== revoker && grant.grantee !== revoker) {
            throw new Error('Only grantor or grantee can revoke permission');
        }
        await this.storage.revokeGrant(grantId);
    }
    async listPermissions(subject) {
        return await this.storage.getGrantsForSubject(subject);
    }
    async addPolicyRule(rule) {
        await this.storage.storePolicyRule(rule);
        this.policyEngine.addRule(rule);
    }
    async removePolicyRule(ruleId) {
        await this.storage.removePolicyRule(ruleId);
        this.policyEngine.removeRule(ruleId);
    }
    async listPolicyRules() {
        return await this.storage.listPolicyRules();
    }
    scopeMatches(requestedScope, grantedScopes) {
        if (grantedScopes.includes(requestedScope)) {
            return true;
        }
        if (grantedScopes.includes('admin')) {
            return true;
        }
        const [requestedNS, requestedAction] = requestedScope.split(':');
        if (requestedNS && requestedAction) {
            const wildcardScope = `${requestedNS}:*`;
            if (grantedScopes.includes(wildcardScope)) {
                return true;
            }
        }
        return false;
    }
    async loadPolicyRules() {
        const rules = await this.storage.listPolicyRules();
        for (const rule of rules) {
            this.policyEngine.addRule(rule);
        }
    }
}
