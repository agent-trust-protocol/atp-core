import { PermissionGrant, PermissionRequest, PermissionCheck, PermissionResult, TokenValidationResult, PolicyRule } from '../models/permission.js';
import { StorageService } from './storage.js';
export declare class PermissionService {
    private storage;
    private tokenService;
    private policyEngine;
    constructor(storage: StorageService, secretKey: string);
    grantPermission(request: PermissionRequest): Promise<PermissionResult>;
    checkPermission(check: PermissionCheck): Promise<PermissionResult>;
    validateToken(token: string): Promise<TokenValidationResult>;
    revokePermission(grantId: string, revoker: string): Promise<void>;
    listPermissions(subject: string): Promise<PermissionGrant[]>;
    addPolicyRule(rule: PolicyRule): Promise<void>;
    removePolicyRule(ruleId: string): Promise<void>;
    listPolicyRules(): Promise<PolicyRule[]>;
    private scopeMatches;
    loadPolicyRules(): Promise<void>;
}
//# sourceMappingURL=permission.d.ts.map