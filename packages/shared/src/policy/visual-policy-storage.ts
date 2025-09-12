/**
 * Visual Trust Policy Storage Service
 *
 * Provides comprehensive CRUD operations for Visual Trust Policies
 * with support for multi-tenancy, version control, audit logging,
 * and performance metrics.
 *
 * @version 1.0.0
 * @author ATP Team
 */

import { BaseStorage } from '../database/base-storage.js';
import type { DatabaseConfig } from '../database/types.js';
import {
  ATPVisualPolicy,
  VisualPolicyRule,
  validateATPPolicy,
  validatePolicyRule,
  createAllowAllPolicyTemplate,
  createSecurityPolicyTemplate
} from './visual-policy-schema.js';
import { randomUUID } from 'crypto';

// ============================================================================
// INTERFACES AND TYPES
// ============================================================================

export interface PolicySearchFilters {
  organizationId?: string;
  status?: 'draft' | 'active' | 'inactive' | 'archived';
  category?: string;
  createdBy?: string;
  tags?: string[];
  enabled?: boolean;
  limit?: number;
  offset?: number;
  sortBy?: 'name' | 'created_at' | 'updated_at' | 'priority';
  sortOrder?: 'asc' | 'desc';
}

export interface PolicyDeployment {
  deploymentId: string;
  policyId: string;
  version: string;
  deployedBy: string;
  deployedAt: Date;
  environment: 'development' | 'staging' | 'production';
  gatewayInstances: string[];
  status: 'pending' | 'active' | 'failed' | 'rolled_back';
  rollbackReason?: string;
}

export interface PolicyMetrics {
  policyId: string;
  date: Date;
  evaluationsCount: number;
  allowCount: number;
  denyCount: number;
  throttleCount: number;
  errorCount: number;
  avgEvaluationTimeMs: number;
  maxEvaluationTimeMs: number;
  minEvaluationTimeMs: number;
}

export interface PolicyAuditEvent {
  id: string;
  policyId: string;
  timestamp: Date;
  action: 'created' | 'updated' | 'enabled' | 'disabled' | 'deployed' | 'tested' | 'archived';
  actor: string;
  changes?: Record<string, any>;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
}

export interface OrganizationSettings {
  organizationId: string;
  maxPoliciesPerOrg: number;
  maxRulesPerPolicy: number;
  requireApprovalForDeployment: boolean;
  defaultPolicyCategory: string;
  notifyOnPolicyChanges: boolean;
  notificationChannels: string[];
  notificationRecipients: string[];
  auditRetentionDays: number;
  enableDetailedLogging: boolean;
}

// ============================================================================
// VISUAL POLICY STORAGE SERVICE
// ============================================================================

export class VisualPolicyStorageService extends BaseStorage {
  constructor(config: DatabaseConfig) {
    super(config);
  }

  async initialize(): Promise<void> {
    await this.ensureConnection();
    // Tables are created by visual-policy-schema.sql
  }

  // ========================================================================
  // POLICY CRUD OPERATIONS
  // ========================================================================

  /**
   * Create a new visual policy
   */
  async createPolicy(policy: ATPVisualPolicy, createdBy: string): Promise<string> {
    // Validate the policy
    const validatedPolicy = validateATPPolicy(policy);

    // Check organization limits
    await this.checkOrganizationLimits(policy.organizationId);

    const query = `
      SELECT atp_permissions.create_visual_policy($1, $2, $3, $4, $5, $6, $7, $8)
    `;

    const result = await this.db.query(query, [
      validatedPolicy.id,
      validatedPolicy.name,
      validatedPolicy.description || null,
      validatedPolicy.organizationId,
      createdBy,
      JSON.stringify(validatedPolicy),
      validatedPolicy.category || 'operational',
      validatedPolicy.tags || []
    ]);

    return validatedPolicy.id;
  }

  /**
   * Get a policy by ID
   */
  async getPolicy(policyId: string, organizationId?: string): Promise<ATPVisualPolicy | null> {
    let query = `
      SELECT policy_document, status, enabled
      FROM atp_permissions.visual_policies 
      WHERE policy_id = $1
    `;
    const params: any[] = [policyId];

    if (organizationId) {
      query += ' AND organization_id = $2';
      params.push(organizationId);
    }

    const result = await this.db.query(query, params);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return row.policy_document as ATPVisualPolicy;
  }

  /**
   * Update an existing policy
   */
  async updatePolicy(
    policyId: string,
    updates: Partial<ATPVisualPolicy>,
    updatedBy: string,
    reason?: string
  ): Promise<void> {
    // Get current policy for change tracking
    const currentPolicy = await this.getPolicy(policyId);
    if (!currentPolicy) {
      throw new Error(`Policy not found: ${policyId}`);
    }

    // Merge updates with current policy
    const updatedPolicy = { ...currentPolicy, ...updates, updatedAt: new Date().toISOString() };

    // Validate the updated policy
    const validatedPolicy = validateATPPolicy(updatedPolicy);

    const query = `
      UPDATE atp_permissions.visual_policies 
      SET 
        name = $2,
        description = $3,
        policy_document = $4,
        category = $5,
        tags = $6,
        updated_at = NOW()
      WHERE policy_id = $1
    `;

    await this.db.query(query, [
      policyId,
      validatedPolicy.name,
      validatedPolicy.description || null,
      JSON.stringify(validatedPolicy),
      validatedPolicy.category || 'operational',
      validatedPolicy.tags || []
    ]);

    // Log the update
    await this.logAuditEvent({
      policyId,
      action: 'updated',
      actor: updatedBy,
      changes: this.calculateChanges(currentPolicy, validatedPolicy),
      reason
    });
  }

  /**
   * Delete a policy (soft delete by archiving)
   */
  async deletePolicy(policyId: string, deletedBy: string, reason?: string): Promise<void> {
    const query = `
      UPDATE atp_permissions.visual_policies 
      SET status = 'archived', archived_at = NOW()
      WHERE policy_id = $1
    `;

    await this.db.query(query, [policyId]);

    // Log the deletion
    await this.logAuditEvent({
      policyId,
      action: 'archived',
      actor: deletedBy,
      reason: reason || 'Policy archived'
    });
  }

  /**
   * Search policies with filters
   */
  async searchPolicies(filters: PolicySearchFilters): Promise<{
    policies: ATPVisualPolicy[];
    total: number;
  }> {
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.organizationId) {
      whereClause += ` AND organization_id = $${paramIndex++}`;
      params.push(filters.organizationId);
    }

    if (filters.status) {
      whereClause += ` AND status = $${paramIndex++}`;
      params.push(filters.status);
    }

    if (filters.category) {
      whereClause += ` AND category = $${paramIndex++}`;
      params.push(filters.category);
    }

    if (filters.createdBy) {
      whereClause += ` AND created_by = $${paramIndex++}`;
      params.push(filters.createdBy);
    }

    if (filters.enabled !== undefined) {
      whereClause += ` AND enabled = $${paramIndex++}`;
      params.push(filters.enabled);
    }

    if (filters.tags && filters.tags.length > 0) {
      whereClause += ` AND tags && $${paramIndex++}`;
      params.push(filters.tags);
    }

    // Count total results
    const countQuery = `
      SELECT COUNT(*) as total
      FROM atp_permissions.visual_policies
      ${whereClause}
    `;

    const countResult = await this.db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Get paginated results
    const sortBy = filters.sortBy || 'created_at';
    const sortOrder = filters.sortOrder || 'desc';
    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const query = `
      SELECT policy_document
      FROM atp_permissions.visual_policies
      ${whereClause}
      ORDER BY ${sortBy} ${sortOrder}
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;

    params.push(limit, offset);

    const result = await this.db.query(query, params);
    const policies = result.rows.map((row: any) => row.policy_document as ATPVisualPolicy);

    return { policies, total };
  }

  /**
   * Enable or disable a policy
   */
  async togglePolicy(policyId: string, enabled: boolean, actor: string): Promise<void> {
    const query = `
      UPDATE atp_permissions.visual_policies 
      SET enabled = $2, updated_at = NOW()
      WHERE policy_id = $1
    `;

    await this.db.query(query, [policyId, enabled]);

    // Log the change
    await this.logAuditEvent({
      policyId,
      action: enabled ? 'enabled' : 'disabled',
      actor,
      reason: `Policy ${enabled ? 'enabled' : 'disabled'} by ${actor}`
    });
  }

  // ========================================================================
  // POLICY DEPLOYMENT OPERATIONS
  // ========================================================================

  /**
   * Deploy a policy to an environment
   */
  async deployPolicy(
    policyId: string,
    deployedBy: string,
    environment: 'development' | 'staging' | 'production' = 'production',
    gatewayInstances: string[] = []
  ): Promise<string> {
    const query = `
      SELECT atp_permissions.deploy_visual_policy($1, $2, $3, $4)
    `;

    const result = await this.db.query(query, [
      policyId,
      deployedBy,
      environment,
      gatewayInstances
    ]);

    return result.rows[0].deploy_visual_policy;
  }

  /**
   * Get deployment history for a policy
   */
  async getDeploymentHistory(policyId: string): Promise<PolicyDeployment[]> {
    const query = `
      SELECT 
        deployment_id, policy_id, version, deployed_by, deployed_at,
        environment, gateway_instances, status, rollback_reason
      FROM atp_permissions.visual_policy_deployments
      WHERE policy_id = $1
      ORDER BY deployed_at DESC
    `;

    const result = await this.db.query(query, [policyId]);

    return result.rows.map((row: any) => ({
      deploymentId: row.deployment_id,
      policyId: row.policy_id,
      version: row.version,
      deployedBy: row.deployed_by,
      deployedAt: new Date(row.deployed_at),
      environment: row.environment,
      gatewayInstances: row.gateway_instances || [],
      status: row.status,
      rollbackReason: row.rollback_reason
    }));
  }

  // ========================================================================
  // POLICY METRICS AND ANALYTICS
  // ========================================================================

  /**
   * Record policy evaluation metrics
   */
  async recordEvaluation(
    policyId: string,
    action: 'allow' | 'deny' | 'throttle' | 'error',
    evaluationTimeMs: number
  ): Promise<void> {
    const query = `
      SELECT atp_permissions.record_policy_evaluation($1, $2, $3)
    `;

    await this.db.query(query, [policyId, action, evaluationTimeMs]);
  }

  /**
   * Get policy metrics for a date range
   */
  async getPolicyMetrics(
    policyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<PolicyMetrics[]> {
    const query = `
      SELECT 
        policy_id, date, evaluations_count, allow_count, deny_count,
        throttle_count, error_count, avg_evaluation_time_ms,
        max_evaluation_time_ms, min_evaluation_time_ms
      FROM atp_permissions.visual_policy_metrics
      WHERE policy_id = $1 AND date BETWEEN $2 AND $3
      ORDER BY date DESC
    `;

    const result = await this.db.query(query, [
      policyId,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0]
    ]);

    return result.rows.map((row: any) => ({
      policyId: row.policy_id,
      date: new Date(row.date),
      evaluationsCount: row.evaluations_count,
      allowCount: row.allow_count,
      denyCount: row.deny_count,
      throttleCount: row.throttle_count,
      errorCount: row.error_count,
      avgEvaluationTimeMs: parseFloat(row.avg_evaluation_time_ms),
      maxEvaluationTimeMs: parseFloat(row.max_evaluation_time_ms),
      minEvaluationTimeMs: parseFloat(row.min_evaluation_time_ms)
    }));
  }

  // ========================================================================
  // AUDIT AND COMPLIANCE
  // ========================================================================

  /**
   * Log an audit event
   */
  async logAuditEvent(event: Omit<PolicyAuditEvent, 'id' | 'timestamp'>): Promise<void> {
    const query = `
      INSERT INTO atp_permissions.visual_policy_audit_log
      (policy_id, action, actor, changes_json, reason, ip_address, user_agent, session_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;

    await this.db.query(query, [
      event.policyId,
      event.action,
      event.actor,
      event.changes ? JSON.stringify(event.changes) : null,
      event.reason || null,
      event.ipAddress || null,
      event.userAgent || null,
      event.sessionId || null
    ]);
  }

  /**
   * Get audit trail for a policy
   */
  async getAuditTrail(
    policyId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<PolicyAuditEvent[]> {
    const query = `
      SELECT 
        id, policy_id, timestamp, action, actor, changes_json,
        reason, ip_address, user_agent, session_id
      FROM atp_permissions.visual_policy_audit_log
      WHERE policy_id = $1
      ORDER BY timestamp DESC
      LIMIT $2 OFFSET $3
    `;

    const result = await this.db.query(query, [policyId, limit, offset]);

    return result.rows.map((row: any) => ({
      id: row.id,
      policyId: row.policy_id,
      timestamp: new Date(row.timestamp),
      action: row.action,
      actor: row.actor,
      changes: this.safeJsonParse(row.changes_json),
      reason: row.reason,
      ipAddress: row.ip_address,
      userAgent: row.user_agent,
      sessionId: row.session_id
    }));
  }

  // ========================================================================
  // ORGANIZATION MANAGEMENT
  // ========================================================================

  /**
   * Get organization settings
   */
  async getOrganizationSettings(organizationId: string): Promise<OrganizationSettings | null> {
    const query = `
      SELECT *
      FROM atp_permissions.visual_policy_org_settings
      WHERE organization_id = $1
    `;

    const result = await this.db.query(query, [organizationId]);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      organizationId: row.organization_id,
      maxPoliciesPerOrg: row.max_policies_per_org,
      maxRulesPerPolicy: row.max_rules_per_policy,
      requireApprovalForDeployment: row.require_approval_for_deployment,
      defaultPolicyCategory: row.default_policy_category,
      notifyOnPolicyChanges: row.notify_on_policy_changes,
      notificationChannels: row.notification_channels || [],
      notificationRecipients: row.notification_recipients || [],
      auditRetentionDays: row.audit_retention_days,
      enableDetailedLogging: row.enable_detailed_logging
    };
  }

  /**
   * Update organization settings
   */
  async updateOrganizationSettings(settings: OrganizationSettings): Promise<void> {
    const query = `
      INSERT INTO atp_permissions.visual_policy_org_settings (
        organization_id, max_policies_per_org, max_rules_per_policy,
        require_approval_for_deployment, default_policy_category,
        notify_on_policy_changes, notification_channels, notification_recipients,
        audit_retention_days, enable_detailed_logging, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
      ON CONFLICT (organization_id) DO UPDATE SET
        max_policies_per_org = EXCLUDED.max_policies_per_org,
        max_rules_per_policy = EXCLUDED.max_rules_per_policy,
        require_approval_for_deployment = EXCLUDED.require_approval_for_deployment,
        default_policy_category = EXCLUDED.default_policy_category,
        notify_on_policy_changes = EXCLUDED.notify_on_policy_changes,
        notification_channels = EXCLUDED.notification_channels,
        notification_recipients = EXCLUDED.notification_recipients,
        audit_retention_days = EXCLUDED.audit_retention_days,
        enable_detailed_logging = EXCLUDED.enable_detailed_logging,
        updated_at = NOW()
    `;

    await this.db.query(query, [
      settings.organizationId,
      settings.maxPoliciesPerOrg,
      settings.maxRulesPerPolicy,
      settings.requireApprovalForDeployment,
      settings.defaultPolicyCategory,
      settings.notifyOnPolicyChanges,
      settings.notificationChannels,
      settings.notificationRecipients,
      settings.auditRetentionDays,
      settings.enableDetailedLogging
    ]);
  }

  // ========================================================================
  // POLICY TEMPLATES
  // ========================================================================

  /**
   * Create a policy from a template
   */
  async createFromTemplate(
    templateType: 'allow_all' | 'security',
    organizationId: string,
    createdBy: string,
    customizations?: Partial<ATPVisualPolicy>
  ): Promise<string> {
    let templatePolicy: ATPVisualPolicy;

    switch (templateType) {
      case 'allow_all':
        templatePolicy = createAllowAllPolicyTemplate(organizationId, createdBy);
        break;
      case 'security':
        templatePolicy = createSecurityPolicyTemplate(organizationId, createdBy);
        break;
      default:
        throw new Error(`Unknown template type: ${templateType}`);
    }

    // Apply customizations
    if (customizations) {
      templatePolicy = { ...templatePolicy, ...customizations };
    }

    return await this.createPolicy(templatePolicy, createdBy);
  }

  // ========================================================================
  // PRIVATE HELPER METHODS
  // ========================================================================

  /**
   * Check organization limits before creating policies
   */
  private async checkOrganizationLimits(organizationId: string): Promise<void> {
    const settings = await this.getOrganizationSettings(organizationId);
    if (!settings) {
      return; // No limits configured
    }

    const countQuery = `
      SELECT COUNT(*) as count
      FROM atp_permissions.visual_policies
      WHERE organization_id = $1 AND status != 'archived'
    `;

    const result = await this.db.query(countQuery, [organizationId]);
    const currentCount = parseInt(result.rows[0].count);

    if (currentCount >= settings.maxPoliciesPerOrg) {
      throw new Error(
        `Organization policy limit exceeded. Maximum: ${settings.maxPoliciesPerOrg}, Current: ${currentCount}`
      );
    }
  }

  /**
   * Calculate changes between two policy versions
   */
  private calculateChanges(oldPolicy: ATPVisualPolicy, newPolicy: ATPVisualPolicy): Record<string, any> {
    const changes: Record<string, any> = {};

    // Compare key fields
    const fieldsToCompare = ['name', 'description', 'enabled', 'defaultAction', 'evaluationMode', 'category', 'tags'];

    for (const field of fieldsToCompare) {
      const oldValue = (oldPolicy as any)[field];
      const newValue = (newPolicy as any)[field];

      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        changes[field] = { from: oldValue, to: newValue };
      }
    }

    // Compare rules (simplified)
    if (oldPolicy.rules.length !== newPolicy.rules.length) {
      changes.rules = {
        from: `${oldPolicy.rules.length} rules`,
        to: `${newPolicy.rules.length} rules`
      };
    }

    return changes;
  }
}
