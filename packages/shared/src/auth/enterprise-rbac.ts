/**
 * Enterprise Role-Based Access Control (RBAC) System
 * Provides comprehensive authorization and permission management
 */

import { EventEmitter } from 'events';
import { createHash } from 'crypto';

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  inheritedRoles: string[];
  metadata: Record<string, any>;
  createdAt: number;
  updatedAt: number;
  active: boolean;
}

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  conditions?: PermissionCondition[];
  scope: PermissionScope;
  description: string;
  metadata: Record<string, any>;
}

export interface PermissionCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'contains' | 'startsWith' | 'endsWith';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export enum PermissionScope {
  GLOBAL = 'global',
  ORGANIZATION = 'organization',
  DEPARTMENT = 'department',
  TEAM = 'team',
  USER = 'user'
}

export interface UserRole {
  userId: string;
  roleId: string;
  assignedAt: number;
  assignedBy: string;
  expiresAt?: number;
  scope?: string;
  conditions?: Record<string, any>;
}

export interface AccessRequest {
  userId: string;
  resource: string;
  action: string;
  context: AccessContext;
  timestamp: number;
}

export interface AccessContext {
  ip?: string;
  userAgent?: string;
  sessionId?: string;
  department?: string;
  location?: string;
  timeOfDay?: number;
  dayOfWeek?: number;
  additionalData?: Record<string, any>;
}

export interface AccessDecision {
  granted: boolean;
  reason: string;
  appliedRoles: string[];
  appliedPermissions: string[];
  conditions: PermissionCondition[];
  context: AccessContext;
  timestamp: number;
  expiresAt?: number;
}

export interface PolicyRule {
  id: string;
  name: string;
  description: string;
  type: 'allow' | 'deny' | 'conditional';
  priority: number;
  conditions: PermissionCondition[];
  effect: PolicyEffect;
  resources: string[];
  actions: string[];
  principals: string[]; // users, roles, groups
  active: boolean;
}

export interface PolicyEffect {
  type: 'grant' | 'deny' | 'require_mfa' | 'audit_only' | 'time_restricted';
  parameters?: Record<string, any>;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  result: 'granted' | 'denied';
  reason: string;
  context: AccessContext;
  appliedPolicies: string[];
  riskScore: number;
  timestamp: number;
  metadata: Record<string, any>;
}

export interface ResourceHierarchy {
  resource: string;
  parent?: string;
  children: string[];
  inheritsPermissions: boolean;
  metadata: Record<string, any>;
}

export class EnterpriseRBACService extends EventEmitter {
  private roles: Map<string, Role> = new Map();
  private userRoles: Map<string, UserRole[]> = new Map();
  private policies: Map<string, PolicyRule> = new Map();
  private auditLogs: AuditLog[] = [];
  private resourceHierarchy: Map<string, ResourceHierarchy> = new Map();
  private permissionCache: Map<string, { permissions: Permission[]; expiresAt: number }> = new Map();

  constructor() {
    super();
    this.initializeDefaultRoles();
    this.startCacheCleanup();
  }

  /**
   * Create a new role
   */
  createRole(role: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>): Role {
    const newRole: Role = {
      ...role,
      id: this.generateRoleId(),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.roles.set(newRole.id, newRole);
    this.invalidateUserCaches();

    this.emit('roleCreated', {
      roleId: newRole.id,
      roleName: newRole.name,
      permissions: newRole.permissions.length
    });

    return newRole;
  }

  /**
   * Update an existing role
   */
  updateRole(roleId: string, updates: Partial<Role>): Role {
    const role = this.roles.get(roleId);
    if (!role) {
      throw new Error(`Role ${roleId} not found`);
    }

    const updatedRole: Role = {
      ...role,
      ...updates,
      id: roleId,
      updatedAt: Date.now()
    };

    this.roles.set(roleId, updatedRole);
    this.invalidateUserCaches();

    this.emit('roleUpdated', {
      roleId,
      roleName: updatedRole.name,
      changes: Object.keys(updates)
    });

    return updatedRole;
  }

  /**
   * Assign role to user
   */
  assignRole(
    userId: string,
    roleId: string,
    assignedBy: string,
    options: {
      expiresAt?: number;
      scope?: string;
      conditions?: Record<string, any>;
    } = {}
  ): void {
    const role = this.roles.get(roleId);
    if (!role) {
      throw new Error(`Role ${roleId} not found`);
    }

    if (!this.userRoles.has(userId)) {
      this.userRoles.set(userId, []);
    }

    const userRole: UserRole = {
      userId,
      roleId,
      assignedAt: Date.now(),
      assignedBy,
      ...options
    };

    this.userRoles.get(userId)!.push(userRole);
    this.invalidateUserCache(userId);

    this.emit('roleAssigned', {
      userId,
      roleId,
      roleName: role.name,
      assignedBy,
      expiresAt: options.expiresAt
    });
  }

  /**
   * Revoke role from user
   */
  revokeRole(userId: string, roleId: string): boolean {
    const userRoles = this.userRoles.get(userId);
    if (!userRoles) {
      return false;
    }

    const index = userRoles.findIndex(ur => ur.roleId === roleId);
    if (index === -1) {
      return false;
    }

    userRoles.splice(index, 1);
    this.invalidateUserCache(userId);

    const role = this.roles.get(roleId);
    this.emit('roleRevoked', {
      userId,
      roleId,
      roleName: role?.name || 'Unknown'
    });

    return true;
  }

  /**
   * Check if user has permission for a specific action on a resource
   */
  async checkPermission(
    userId: string,
    resource: string,
    action: string,
    context: AccessContext = {}
  ): Promise<AccessDecision> {
    const startTime = Date.now();

    try {
      // Get user permissions
      const userPermissions = await this.getUserPermissions(userId);

      // Check direct permissions
      const directPermission = this.findMatchingPermission(userPermissions, resource, action);
      if (directPermission && this.evaluatePermissionConditions(directPermission, context)) {
        const decision = this.createAccessDecision(true, 'Direct permission granted', [directPermission], [], context);
        await this.auditAccess(userId, resource, action, decision, context);
        return decision;
      }

      // Check inherited permissions from parent resources
      const inheritedPermissions = this.getInheritedPermissions(resource, userPermissions);
      for (const permission of inheritedPermissions) {
        if (permission.action === action && this.evaluatePermissionConditions(permission, context)) {
          const decision = this.createAccessDecision(true, 'Inherited permission granted', [permission], [], context);
          await this.auditAccess(userId, resource, action, decision, context);
          return decision;
        }
      }

      // Check policy rules
      const policyDecision = await this.evaluatePolicies(userId, resource, action, context);
      if (policyDecision) {
        await this.auditAccess(userId, resource, action, policyDecision, context);
        return policyDecision;
      }

      // Default deny
      const denyDecision = this.createAccessDecision(false, 'No matching permissions found', [], [], context);
      await this.auditAccess(userId, resource, action, denyDecision, context);
      return denyDecision;

    } catch (error) {
      const errorDecision = this.createAccessDecision(false, `Error evaluating permissions: ${error instanceof Error ? error.message : String(error)}`, [], [], context);
      await this.auditAccess(userId, resource, action, errorDecision, context);
      return errorDecision;
    } finally {
      const duration = Date.now() - startTime;
      this.emit('permissionCheck', {
        userId,
        resource,
        action,
        duration,
        context
      });
    }
  }

  /**
   * Bulk permission check for multiple resources/actions
   */
  async checkPermissions(
    userId: string,
    requests: Array<{ resource: string; action: string }>,
    context: AccessContext = {}
  ): Promise<Map<string, AccessDecision>> {
    const results = new Map<string, AccessDecision>();

    for (const request of requests) {
      const key = `${request.resource}:${request.action}`;
      const decision = await this.checkPermission(userId, request.resource, request.action, context);
      results.set(key, decision);
    }

    return results;
  }

  /**
   * Get all permissions for a user
   */
  async getUserPermissions(userId: string): Promise<Permission[]> {
    // Check cache first
    const cacheKey = `user:${userId}`;
    const cached = this.permissionCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.permissions;
    }

    const permissions: Permission[] = [];
    const userRoles = this.userRoles.get(userId) || [];

    // Get permissions from assigned roles
    for (const userRole of userRoles) {
      // Check if role assignment is expired
      if (userRole.expiresAt && userRole.expiresAt < Date.now()) {
        continue;
      }

      const role = this.roles.get(userRole.roleId);
      if (role && role.active) {
        permissions.push(...role.permissions);

        // Get permissions from inherited roles
        const inheritedPermissions = await this.getInheritedRolePermissions(role.inheritedRoles);
        permissions.push(...inheritedPermissions);
      }
    }

    // Remove duplicates
    const uniquePermissions = permissions.filter((permission, index, self) =>
      index === self.findIndex(p => p.id === permission.id)
    );

    // Cache the result
    this.permissionCache.set(cacheKey, {
      permissions: uniquePermissions,
      expiresAt: Date.now() + (5 * 60 * 1000) // 5 minutes
    });

    return uniquePermissions;
  }

  /**
   * Get user roles
   */
  getUserRoles(userId: string): UserRole[] {
    return this.userRoles.get(userId) || [];
  }

  /**
   * Create a policy rule
   */
  createPolicy(policy: Omit<PolicyRule, 'id'>): PolicyRule {
    const newPolicy: PolicyRule = {
      ...policy,
      id: this.generatePolicyId()
    };

    this.policies.set(newPolicy.id, newPolicy);
    this.invalidateUserCaches();

    this.emit('policyCreated', {
      policyId: newPolicy.id,
      policyName: newPolicy.name,
      type: newPolicy.type
    });

    return newPolicy;
  }

  /**
   * Add resource to hierarchy
   */
  addResource(
    resource: string,
    parent?: string,
    inheritsPermissions: boolean = true,
    metadata: Record<string, any> = {}
  ): void {
    const resourceHierarchy: ResourceHierarchy = {
      resource,
      parent,
      children: [],
      inheritsPermissions,
      metadata
    };

    // Update parent's children
    if (parent) {
      const parentResource = this.resourceHierarchy.get(parent);
      if (parentResource) {
        parentResource.children.push(resource);
      }
    }

    this.resourceHierarchy.set(resource, resourceHierarchy);

    this.emit('resourceAdded', {
      resource,
      parent,
      inheritsPermissions
    });
  }

  /**
   * Get audit logs
   */
  getAuditLogs(
    filters: {
      userId?: string;
      resource?: string;
      action?: string;
      result?: 'granted' | 'denied';
      fromDate?: number;
      toDate?: number;
      limit?: number;
    } = {}
  ): AuditLog[] {
    let logs = this.auditLogs;

    // Apply filters
    if (filters.userId) {
      logs = logs.filter(log => log.userId === filters.userId);
    }
    if (filters.resource) {
      logs = logs.filter(log => log.resource === filters.resource);
    }
    if (filters.action) {
      logs = logs.filter(log => log.action === filters.action);
    }
    if (filters.result) {
      logs = logs.filter(log => log.result === filters.result);
    }
    if (filters.fromDate) {
      logs = logs.filter(log => log.timestamp >= filters.fromDate!);
    }
    if (filters.toDate) {
      logs = logs.filter(log => log.timestamp <= filters.toDate!);
    }

    // Sort by timestamp (newest first) and limit
    logs = logs.sort((a, b) => b.timestamp - a.timestamp);
    if (filters.limit) {
      logs = logs.slice(0, filters.limit);
    }

    return logs;
  }

  /**
   * Get RBAC statistics
   */
  getRBACStats(): {
    totalRoles: number;
    totalUsers: number;
    totalPolicies: number;
    totalAuditLogs: number;
    permissionsByResource: Record<string, number>;
    accessGrantRate: number;
    mostAccessedResources: Array<{ resource: string; count: number }>;
    } {
    const totalUsers = this.userRoles.size;
    const permissionsByResource: Record<string, number> = {};

    // Count permissions by resource
    for (const role of this.roles.values()) {
      for (const permission of role.permissions) {
        permissionsByResource[permission.resource] = (permissionsByResource[permission.resource] || 0) + 1;
      }
    }

    // Calculate access grant rate
    const grantedAccess = this.auditLogs.filter(log => log.result === 'granted').length;
    const accessGrantRate = this.auditLogs.length > 0 ? grantedAccess / this.auditLogs.length : 0;

    // Most accessed resources
    const resourceCounts: Record<string, number> = {};
    for (const log of this.auditLogs) {
      resourceCounts[log.resource] = (resourceCounts[log.resource] || 0) + 1;
    }
    const mostAccessedResources = Object.entries(resourceCounts)
      .map(([resource, count]) => ({ resource, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      totalRoles: this.roles.size,
      totalUsers,
      totalPolicies: this.policies.size,
      totalAuditLogs: this.auditLogs.length,
      permissionsByResource,
      accessGrantRate,
      mostAccessedResources
    };
  }

  // Private methods

  private initializeDefaultRoles(): void {
    // System Administrator
    this.createRole({
      name: 'System Administrator',
      description: 'Full system access',
      permissions: [
        {
          id: 'perm_admin_all',
          name: 'Admin All',
          resource: '*',
          action: '*',
          scope: PermissionScope.GLOBAL,
          description: 'Full administrative access',
          metadata: {}
        }
      ],
      inheritedRoles: [],
      metadata: { systemRole: true },
      active: true
    });

    // Agent Manager
    this.createRole({
      name: 'Agent Manager',
      description: 'Manage agent operations',
      permissions: [
        {
          id: 'perm_agent_read',
          name: 'Read Agents',
          resource: 'agents',
          action: 'read',
          scope: PermissionScope.ORGANIZATION,
          description: 'View agent information',
          metadata: {}
        },
        {
          id: 'perm_agent_write',
          name: 'Write Agents',
          resource: 'agents',
          action: 'write',
          scope: PermissionScope.ORGANIZATION,
          description: 'Modify agent configuration',
          metadata: {}
        }
      ],
      inheritedRoles: [],
      metadata: { departmentRole: true },
      active: true
    });

    // Auditor
    this.createRole({
      name: 'Auditor',
      description: 'Read-only access for compliance',
      permissions: [
        {
          id: 'perm_audit_read',
          name: 'Read Audit Logs',
          resource: 'audit',
          action: 'read',
          scope: PermissionScope.GLOBAL,
          description: 'View audit logs and compliance data',
          metadata: {}
        }
      ],
      inheritedRoles: [],
      metadata: { complianceRole: true },
      active: true
    });
  }

  private findMatchingPermission(permissions: Permission[], resource: string, action: string): Permission | null {
    return permissions.find(permission =>
      (permission.resource === resource || permission.resource === '*') &&
      (permission.action === action || permission.action === '*')
    ) || null;
  }

  private evaluatePermissionConditions(permission: Permission, context: AccessContext): boolean {
    if (!permission.conditions || permission.conditions.length === 0) {
      return true;
    }

    for (const condition of permission.conditions) {
      if (!this.evaluateCondition(condition, context)) {
        return false;
      }
    }

    return true;
  }

  private evaluateCondition(condition: PermissionCondition, context: AccessContext): boolean {
    const contextValue = this.getContextValue(context, condition.field);

    switch (condition.operator) {
      case 'eq':
        return contextValue === condition.value;
      case 'ne':
        return contextValue !== condition.value;
      case 'gt':
        return contextValue > condition.value;
      case 'lt':
        return contextValue < condition.value;
      case 'gte':
        return contextValue >= condition.value;
      case 'lte':
        return contextValue <= condition.value;
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(contextValue);
      case 'contains':
        return String(contextValue).includes(String(condition.value));
      case 'startsWith':
        return String(contextValue).startsWith(String(condition.value));
      case 'endsWith':
        return String(contextValue).endsWith(String(condition.value));
      default:
        return false;
    }
  }

  private getContextValue(context: AccessContext, field: string): any {
    const fields = field.split('.');
    let value: any = context;

    for (const f of fields) {
      value = value?.[f];
    }

    return value;
  }

  private getInheritedPermissions(resource: string, permissions: Permission[]): Permission[] {
    const resourceHierarchy = this.resourceHierarchy.get(resource);
    if (!resourceHierarchy?.parent || !resourceHierarchy.inheritsPermissions) {
      return [];
    }

    const parentPermissions = permissions.filter(p => p.resource === resourceHierarchy.parent);
    const grandParentPermissions = this.getInheritedPermissions(resourceHierarchy.parent, permissions);

    return [...parentPermissions, ...grandParentPermissions];
  }

  private async getInheritedRolePermissions(roleIds: string[]): Promise<Permission[]> {
    const permissions: Permission[] = [];

    for (const roleId of roleIds) {
      const role = this.roles.get(roleId);
      if (role && role.active) {
        permissions.push(...role.permissions);

        // Recursively get permissions from inherited roles
        if (role.inheritedRoles.length > 0) {
          const inheritedPermissions = await this.getInheritedRolePermissions(role.inheritedRoles);
          permissions.push(...inheritedPermissions);
        }
      }
    }

    return permissions;
  }

  private async evaluatePolicies(
    userId: string,
    resource: string,
    action: string,
    context: AccessContext
  ): Promise<AccessDecision | null> {
    const applicablePolicies = Array.from(this.policies.values())
      .filter(policy =>
        policy.active &&
        (policy.resources.includes(resource) || policy.resources.includes('*')) &&
        (policy.actions.includes(action) || policy.actions.includes('*')) &&
        (policy.principals.includes(userId) || policy.principals.includes('*'))
      )
      .sort((a, b) => b.priority - a.priority);

    for (const policy of applicablePolicies) {
      if (this.evaluatePolicyConditions(policy.conditions, context)) {
        const granted = policy.type === 'allow' ||
                       (policy.type === 'conditional' && policy.effect.type === 'grant');

        return this.createAccessDecision(
          granted,
          `Policy ${policy.name} applied`,
          [],
          [],
          context,
          policy.effect.type === 'time_restricted' ?
            Date.now() + (policy.effect.parameters?.duration || 3600000) : undefined
        );
      }
    }

    return null;
  }

  private evaluatePolicyConditions(conditions: PermissionCondition[], context: AccessContext): boolean {
    for (const condition of conditions) {
      if (!this.evaluateCondition(condition, context)) {
        return false;
      }
    }
    return true;
  }

  private createAccessDecision(
    granted: boolean,
    reason: string,
    appliedPermissions: Permission[],
    appliedRoles: string[],
    context: AccessContext,
    expiresAt?: number
  ): AccessDecision {
    return {
      granted,
      reason,
      appliedRoles,
      appliedPermissions: appliedPermissions.map(p => p.id),
      conditions: [],
      context,
      timestamp: Date.now(),
      expiresAt
    };
  }

  private async auditAccess(
    userId: string,
    resource: string,
    action: string,
    decision: AccessDecision,
    context: AccessContext
  ): Promise<void> {
    const auditLog: AuditLog = {
      id: this.generateAuditId(),
      userId,
      action,
      resource,
      result: decision.granted ? 'granted' : 'denied',
      reason: decision.reason,
      context,
      appliedPolicies: [],
      riskScore: this.calculateRiskScore(context, decision),
      timestamp: Date.now(),
      metadata: {
        appliedPermissions: decision.appliedPermissions,
        appliedRoles: decision.appliedRoles
      }
    };

    this.auditLogs.push(auditLog);

    // Keep only last 10000 audit logs
    if (this.auditLogs.length > 10000) {
      this.auditLogs = this.auditLogs.slice(-10000);
    }

    this.emit('accessAudited', auditLog);
  }

  private calculateRiskScore(context: AccessContext, decision: AccessDecision): number {
    let riskScore = 0;

    // Higher risk for denied access
    if (!decision.granted) riskScore += 30;

    // Risk factors from context
    if (context.timeOfDay && (context.timeOfDay < 6 || context.timeOfDay > 22)) {
      riskScore += 20; // Off-hours access
    }

    if (context.dayOfWeek && (context.dayOfWeek === 0 || context.dayOfWeek === 6)) {
      riskScore += 15; // Weekend access
    }

    // Additional risk factors could include geolocation, device fingerprinting, etc.

    return Math.min(100, riskScore);
  }

  private invalidateUserCaches(): void {
    this.permissionCache.clear();
  }

  private invalidateUserCache(userId: string): void {
    this.permissionCache.delete(`user:${userId}`);
  }

  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, cached] of this.permissionCache) {
        if (cached.expiresAt <= now) {
          this.permissionCache.delete(key);
        }
      }
    }, 60000); // Clean every minute
  }

  private generateRoleId(): string {
    return `role_${  createHash('sha256').update(Date.now() + Math.random().toString()).digest('hex').substring(0, 16)}`;
  }

  private generatePolicyId(): string {
    return `policy_${  createHash('sha256').update(Date.now() + Math.random().toString()).digest('hex').substring(0, 16)}`;
  }

  private generateAuditId(): string {
    return `audit_${  createHash('sha256').update(Date.now() + Math.random().toString()).digest('hex').substring(0, 16)}`;
  }
}
