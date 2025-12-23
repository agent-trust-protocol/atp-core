import { BaseStorage, DatabaseConfig } from '@atp/shared';
import { PermissionGrant, PolicyRule } from '../models/permission.js';
export declare class StorageService extends BaseStorage {
    constructor(config: DatabaseConfig);
    initialize(): Promise<void>;
    storeGrant(grant: PermissionGrant): Promise<void>;
    getGrant(grantId: string): Promise<PermissionGrant | null>;
    getGrantsForSubject(subject: string): Promise<PermissionGrant[]>;
    getGrantsByGrantor(grantor: string): Promise<PermissionGrant[]>;
    revokeGrant(grantId: string): Promise<void>;
    storePolicyRule(rule: PolicyRule): Promise<void>;
    removePolicyRule(ruleId: string): Promise<void>;
    listPolicyRules(): Promise<PolicyRule[]>;
    private rowToGrant;
}
//# sourceMappingURL=storage.d.ts.map