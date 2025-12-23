import { PolicyRule, PermissionGrant, Scope } from '../models/permission.js';
export interface PolicyContext {
    subject: string;
    action: Scope;
    resource?: string;
    grant: PermissionGrant;
    context?: Record<string, any>;
}
export interface PolicyResult {
    allowed: boolean;
    reason?: string;
}
export declare class PolicyEngine {
    private rules;
    addRule(rule: PolicyRule): void;
    removeRule(ruleId: string): void;
    evaluate(context: PolicyContext): Promise<PolicyResult>;
    private evaluateRule;
    private createSafeContext;
    getDefaultRules(): PolicyRule[];
}
//# sourceMappingURL=policy.d.ts.map