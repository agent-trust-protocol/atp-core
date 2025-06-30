import { BaseStorage, DatabaseConfig } from '@atp/shared';
import { PermissionGrant, PolicyRule } from '../models/permission.js';

export class StorageService extends BaseStorage {
  constructor(config: DatabaseConfig) {
    super(config);
  }

  async initialize(): Promise<void> {
    await this.ensureConnection();
    // Tables are created by init-db.sql, just verify connection
  }

  async storeGrant(grant: PermissionGrant): Promise<void> {
    const query = `
      INSERT INTO atp_permissions.grants 
      (subject_did, resource, action, granted_by, granted_at, expires_at, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (id) DO UPDATE SET
        resource = EXCLUDED.resource,
        action = EXCLUDED.action,
        expires_at = EXCLUDED.expires_at,
        status = EXCLUDED.status
    `;
    
    // Map the grant to the PostgreSQL schema structure
    await this.db.query(query, [
      grant.grantee,
      grant.resource || 'default',
      grant.scopes.join(','), // Convert scopes array to string
      grant.grantor,
      this.toISOString(grant.createdAt),
      grant.expiresAt ? this.toISOString(grant.expiresAt) : null,
      grant.revokedAt ? 'revoked' : 'active'
    ]);
  }

  async getGrant(grantId: string): Promise<PermissionGrant | null> {
    const query = `
      SELECT id, subject_did, resource, action, granted_by, granted_at, expires_at, status
      FROM atp_permissions.grants WHERE id = $1
    `;
    const result = await this.db.query(query, [grantId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.rowToGrant(result.rows[0]);
  }

  async getGrantsForSubject(subject: string): Promise<PermissionGrant[]> {
    const query = `
      SELECT id, subject_did, resource, action, granted_by, granted_at, expires_at, status
      FROM atp_permissions.grants WHERE subject_did = $1 AND status = 'active'
      ORDER BY granted_at DESC
    `;
    const result = await this.db.query(query, [subject]);
    
    return result.rows.map((row: any) => this.rowToGrant(row));
  }

  async getGrantsByGrantor(grantor: string): Promise<PermissionGrant[]> {
    const query = `
      SELECT id, subject_did, resource, action, granted_by, granted_at, expires_at, status
      FROM atp_permissions.grants WHERE granted_by = $1
      ORDER BY granted_at DESC
    `;
    const result = await this.db.query(query, [grantor]);
    
    return result.rows.map((row: any) => this.rowToGrant(row));
  }

  async revokeGrant(grantId: string): Promise<void> {
    const query = `
      UPDATE atp_permissions.grants SET status = 'revoked' WHERE id = $1
    `;
    await this.db.query(query, [grantId]);
  }

  async storePolicyRule(rule: PolicyRule): Promise<void> {
    const query = `
      INSERT INTO atp_permissions.policies 
      (policy_id, name, description, policy_document, trust_level_required, created_by, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (policy_id) DO UPDATE SET
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        policy_document = EXCLUDED.policy_document,
        updated_at = NOW()
    `;
    
    const policyDocument = {
      condition: rule.condition,
      effect: rule.effect,
      priority: rule.priority,
      active: rule.active
    };
    
    await this.db.query(query, [
      rule.id,
      rule.name,
      `Policy rule: ${rule.name}`,
      this.safeJsonStringify(policyDocument),
      'BASIC', // Default trust level
      'system', // Default creator
      rule.active ? 'active' : 'inactive'
    ]);
  }

  async removePolicyRule(ruleId: string): Promise<void> {
    const query = 'UPDATE atp_permissions.policies SET status = $1 WHERE policy_id = $2';
    await this.db.query(query, ['inactive', ruleId]);
  }

  async listPolicyRules(): Promise<PolicyRule[]> {
    const query = `
      SELECT policy_id, name, policy_document, status
      FROM atp_permissions.policies WHERE status = 'active'
      ORDER BY created_at DESC
    `;
    const result = await this.db.query(query);
    
    return result.rows.map((row: any) => {
      // PostgreSQL JSONB returns objects, not strings
      const policyDoc = row.policy_document || {};
      return {
        id: row.policy_id,
        name: row.name,
        condition: policyDoc.condition || '',
        effect: policyDoc.effect || 'deny',
        priority: policyDoc.priority || 0,
        active: row.status === 'active',
      };
    });
  }

  private rowToGrant(row: any): PermissionGrant {
    return {
      id: row.id || `grant_${Date.now()}`,
      grantor: row.granted_by,
      grantee: row.subject_did,
      scopes: row.action && typeof row.action === 'string' ? row.action.split(',') : [],
      resource: row.resource,
      conditions: undefined, // Not stored in current schema
      expiresAt: row.expires_at ? new Date(row.expires_at).getTime() : undefined,
      createdAt: new Date(row.granted_at).getTime(),
      revokedAt: row.status === 'revoked' ? Date.now() : undefined,
    };
  }
}