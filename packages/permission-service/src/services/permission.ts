import { PermissionGrant, PermissionRequest, PermissionCheck, PermissionResult, CapabilityToken, TokenValidationResult, PolicyRule, Scope } from '../models/permission.js';
import { TokenService } from './token.js';
import { StorageService } from './storage.js';
import { PolicyEngine } from './policy.js';
import { randomUUID } from 'crypto';

export class PermissionService {
  private tokenService: TokenService;
  private policyEngine: PolicyEngine;

  constructor(private storage: StorageService, secretKey: string) {
    this.tokenService = new TokenService(secretKey);
    this.policyEngine = new PolicyEngine();
  }

  async grantPermission(request: PermissionRequest): Promise<PermissionResult> {
    const grantId = randomUUID();
    const now = Date.now();
    
    const grant: PermissionGrant = {
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

  async checkPermission(check: PermissionCheck): Promise<PermissionResult> {
    const grants = await this.storage.getGrantsForSubject(check.subject);
    const activeGrants = grants.filter(g => 
      !g.revokedAt && 
      (!g.expiresAt || g.expiresAt > Date.now())
    );

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

  async validateToken(token: string): Promise<TokenValidationResult> {
    return await this.tokenService.validateCapabilityToken(token);
  }

  async revokePermission(grantId: string, revoker: string): Promise<void> {
    const grant = await this.storage.getGrant(grantId);
    if (!grant) {
      throw new Error('Grant not found');
    }

    if (grant.grantor !== revoker && grant.grantee !== revoker) {
      throw new Error('Only grantor or grantee can revoke permission');
    }

    await this.storage.revokeGrant(grantId);
  }

  async listPermissions(subject: string): Promise<PermissionGrant[]> {
    return await this.storage.getGrantsForSubject(subject);
  }

  async addPolicyRule(rule: PolicyRule): Promise<void> {
    await this.storage.storePolicyRule(rule);
    this.policyEngine.addRule(rule);
  }

  async removePolicyRule(ruleId: string): Promise<void> {
    await this.storage.removePolicyRule(ruleId);
    this.policyEngine.removeRule(ruleId);
  }

  async listPolicyRules(): Promise<PolicyRule[]> {
    return await this.storage.listPolicyRules();
  }

  private scopeMatches(requestedScope: Scope, grantedScopes: Scope[]): boolean {
    if (grantedScopes.includes(requestedScope)) {
      return true;
    }

    if (grantedScopes.includes('admin')) {
      return true;
    }

    const [requestedNS, requestedAction] = requestedScope.split(':');
    if (requestedNS && requestedAction) {
      const wildcardScope = `${requestedNS}:*` as Scope;
      if (grantedScopes.includes(wildcardScope)) {
        return true;
      }
    }

    return false;
  }

  async loadPolicyRules(): Promise<void> {
    const rules = await this.storage.listPolicyRules();
    for (const rule of rules) {
      this.policyEngine.addRule(rule);
    }
  }
}