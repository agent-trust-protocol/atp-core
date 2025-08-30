import { BaseClient } from './base.js';
import { 
  ATPConfig, 
  PermissionGrant,
  ATPResponse 
} from '../types.js';

export interface PermissionRequest {
  subject: string;
  resource: string;
  action: string;
  conditions?: any;
  expiresAt?: string;
  metadata?: any;
}

export interface PolicyRule {
  id?: string;
  name: string;
  description?: string;
  effect: 'allow' | 'deny';
  subjects: string[];
  resources: string[];
  actions: string[];
  conditions?: any;
  priority?: number;
}

export interface PermissionQuery {
  subject?: string;
  resource?: string;
  action?: string;
  status?: 'active' | 'revoked' | 'expired';
  limit?: number;
  offset?: number;
}

export interface AccessRequest {
  subject: string;
  resource: string;
  action: string;
  context?: any;
}

export interface CapabilityToken {
  id: string;
  subject: string;
  capabilities: string[];
  restrictions?: any;
  expiresAt?: string;
  issuedAt: string;
  signature: string;
}

export class PermissionsClient extends BaseClient {
  constructor(config: ATPConfig) {
    super(config, 'permissions');
  }

  /**
   * Grant permission to a subject
   */
  async grantPermission(request: PermissionRequest): Promise<ATPResponse<PermissionGrant>> {
    return this.post('/permissions/grant', request);
  }

  /**
   * Check if a subject has permission for a specific action
   */
  async checkAccess(request: AccessRequest): Promise<ATPResponse<{
    allowed: boolean;
    reason?: string;
    appliedPolicies: string[];
    grantId?: string;
  }>> {
    return this.post('/permissions/check', request);
  }

  /**
   * Revoke a permission grant
   */
  async revokePermission(grantId: string, reason?: string): Promise<ATPResponse<{ success: boolean }>> {
    return this.delete(`/permissions/grant/${encodeURIComponent(grantId)}`, {
      data: { reason }
    });
  }

  /**
   * Get permission grant by ID
   */
  async getPermission(grantId: string): Promise<ATPResponse<PermissionGrant>> {
    return this.get(`/permissions/grant/${encodeURIComponent(grantId)}`);
  }

  /**
   * Query permission grants with filters
   */
  async queryPermissions(query: PermissionQuery): Promise<ATPResponse<{
    grants: PermissionGrant[];
    total: number;
  }>> {
    return this.get('/permissions/grants', { params: query });
  }

  /**
   * Get all permissions for a subject
   */
  async getPermissionsForSubject(subject: string, params?: {
    resource?: string;
    action?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<ATPResponse<{
    grants: PermissionGrant[];
    total: number;
  }>> {
    return this.get(`/permissions/subject/${encodeURIComponent(subject)}`, { params });
  }

  /**
   * Get all permissions for a resource
   */
  async getPermissionsForResource(resource: string, params?: {
    action?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<ATPResponse<{
    grants: PermissionGrant[];
    total: number;
  }>> {
    return this.get(`/permissions/resource/${encodeURIComponent(resource)}`, { params });
  }

  // Policy Management

  /**
   * Create a policy rule
   */
  async createPolicy(policy: PolicyRule): Promise<ATPResponse<{ policyId: string }>> {
    return this.post('/policies', policy);
  }

  /**
   * Get policy by ID
   */
  async getPolicy(policyId: string): Promise<ATPResponse<PolicyRule>> {
    return this.get(`/policies/${encodeURIComponent(policyId)}`);
  }

  /**
   * Update a policy rule
   */
  async updatePolicy(policyId: string, policy: Partial<PolicyRule>): Promise<ATPResponse<PolicyRule>> {
    return this.put(`/policies/${encodeURIComponent(policyId)}`, policy);
  }

  /**
   * Delete a policy rule
   */
  async deletePolicy(policyId: string): Promise<ATPResponse<{ success: boolean }>> {
    return this.delete(`/policies/${encodeURIComponent(policyId)}`);
  }

  /**
   * List all policies
   */
  async listPolicies(params?: {
    effect?: 'allow' | 'deny';
    subject?: string;
    resource?: string;
    limit?: number;
    offset?: number;
  }): Promise<ATPResponse<{
    policies: PolicyRule[];
    total: number;
  }>> {
    return this.get('/policies', { params });
  }

  /**
   * Evaluate policies for a specific request
   */
  async evaluatePolicies(request: AccessRequest): Promise<ATPResponse<{
    decision: 'allow' | 'deny';
    appliedPolicies: Array<{
      policyId: string;
      effect: 'allow' | 'deny';
      priority: number;
    }>;
    explanation: string;
  }>> {
    return this.post('/policies/evaluate', request);
  }

  // Capability Tokens

  /**
   * Issue a capability token
   */
  async issueCapabilityToken(request: {
    subject: string;
    capabilities: string[];
    restrictions?: any;
    expiresAt?: string;
  }): Promise<ATPResponse<CapabilityToken>> {
    return this.post('/capabilities/issue', request);
  }

  /**
   * Verify a capability token
   */
  async verifyCapabilityToken(token: string): Promise<ATPResponse<{
    valid: boolean;
    token?: CapabilityToken;
    error?: string;
  }>> {
    return this.post('/capabilities/verify', { token });
  }

  /**
   * Revoke a capability token
   */
  async revokeCapabilityToken(tokenId: string): Promise<ATPResponse<{ success: boolean }>> {
    return this.delete(`/capabilities/${encodeURIComponent(tokenId)}`);
  }

  /**
   * List capability tokens for a subject
   */
  async getCapabilityTokens(subject: string): Promise<ATPResponse<{
    tokens: CapabilityToken[];
    total: number;
  }>> {
    return this.get(`/capabilities/subject/${encodeURIComponent(subject)}`);
  }

  // Permission Analytics

  /**
   * Get permission usage statistics
   */
  async getPermissionStats(params?: {
    startDate?: string;
    endDate?: string;
    subject?: string;
    resource?: string;
  }): Promise<ATPResponse<{
    totalGrants: number;
    activeGrants: number;
    revokedGrants: number;
    expiredGrants: number;
    usageByAction: Record<string, number>;
    usageByResource: Record<string, number>;
  }>> {
    return this.get('/permissions/stats', { params });
  }

  /**
   * Get access audit trail
   */
  async getAccessAuditTrail(params?: {
    subject?: string;
    resource?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<ATPResponse<{
    events: Array<{
      timestamp: string;
      subject: string;
      resource: string;
      action: string;
      decision: 'allow' | 'deny';
      grantId?: string;
      policyIds: string[];
    }>;
    total: number;
  }>> {
    return this.get('/permissions/audit', { params });
  }

  /**
   * Check service health
   */
  async getHealth(): Promise<ATPResponse<{ status: string; service: string; database?: any }>> {
    return this.get('/health');
  }
}