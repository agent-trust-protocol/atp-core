/**
 * Role-Based Access Control (RBAC) System with Organization Scoping
 * Enterprise-grade authorization system for ATP
 */

import { z } from 'zod';
import crypto from 'crypto';

// Permission definitions
export enum Permission {
  // Policy Management
  POLICY_VIEW = 'policy:view',
  POLICY_CREATE = 'policy:create',
  POLICY_EDIT = 'policy:edit',
  POLICY_DELETE = 'policy:delete',
  POLICY_EVALUATE = 'policy:evaluate',
  POLICY_PUBLISH = 'policy:publish',
  
  // Workflow Management
  WORKFLOW_VIEW = 'workflow:view',
  WORKFLOW_CREATE = 'workflow:create',
  WORKFLOW_EDIT = 'workflow:edit',
  WORKFLOW_DELETE = 'workflow:delete',
  WORKFLOW_EXECUTE = 'workflow:execute',
  WORKFLOW_MONITOR = 'workflow:monitor',
  
  // Agent Management
  AGENT_VIEW = 'agent:view',
  AGENT_CREATE = 'agent:create',
  AGENT_EDIT = 'agent:edit',
  AGENT_DELETE = 'agent:delete',
  AGENT_TRUST_MANAGE = 'agent:trust_manage',
  
  // Analytics & Monitoring
  ANALYTICS_VIEW = 'analytics:view',
  ANALYTICS_EXPORT = 'analytics:export',
  MONITORING_VIEW = 'monitoring:view',
  MONITORING_ALERTS = 'monitoring:alerts',
  
  // Organization Management
  ORG_VIEW = 'org:view',
  ORG_EDIT = 'org:edit',
  ORG_MEMBERS_MANAGE = 'org:members_manage',
  ORG_ROLES_MANAGE = 'org:roles_manage',
  ORG_BILLING = 'org:billing',
  
  // System Administration
  SYSTEM_ADMIN = 'system:admin',
  SYSTEM_AUDIT = 'system:audit',
  SYSTEM_CONFIG = 'system:config',
  
  // API Access
  API_READ = 'api:read',
  API_WRITE = 'api:write',
  API_ADMIN = 'api:admin'
}

// Role definitions
export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isSystem: boolean; // System roles cannot be modified
  priority: number; // Higher priority roles override lower ones
}

// Predefined system roles
export const SystemRoles: Record<string, Role> = {
  SUPER_ADMIN: {
    id: 'super_admin',
    name: 'Super Administrator',
    description: 'Full system access',
    permissions: Object.values(Permission),
    isSystem: true,
    priority: 1000
  },
  
  ORG_ADMIN: {
    id: 'org_admin',
    name: 'Organization Administrator',
    description: 'Full organization access',
    permissions: [
      Permission.POLICY_VIEW, Permission.POLICY_CREATE, Permission.POLICY_EDIT, Permission.POLICY_DELETE, Permission.POLICY_EVALUATE, Permission.POLICY_PUBLISH,
      Permission.WORKFLOW_VIEW, Permission.WORKFLOW_CREATE, Permission.WORKFLOW_EDIT, Permission.WORKFLOW_DELETE, Permission.WORKFLOW_EXECUTE, Permission.WORKFLOW_MONITOR,
      Permission.AGENT_VIEW, Permission.AGENT_CREATE, Permission.AGENT_EDIT, Permission.AGENT_DELETE, Permission.AGENT_TRUST_MANAGE,
      Permission.ANALYTICS_VIEW, Permission.ANALYTICS_EXPORT, Permission.MONITORING_VIEW, Permission.MONITORING_ALERTS,
      Permission.ORG_VIEW, Permission.ORG_EDIT, Permission.ORG_MEMBERS_MANAGE, Permission.ORG_ROLES_MANAGE, Permission.ORG_BILLING,
      Permission.API_READ, Permission.API_WRITE
    ],
    isSystem: true,
    priority: 900
  },
  
  DEVELOPER: {
    id: 'developer',
    name: 'Developer',
    description: 'Development and integration access',
    permissions: [
      Permission.POLICY_VIEW, Permission.POLICY_CREATE, Permission.POLICY_EDIT, Permission.POLICY_EVALUATE,
      Permission.WORKFLOW_VIEW, Permission.WORKFLOW_CREATE, Permission.WORKFLOW_EDIT, Permission.WORKFLOW_EXECUTE,
      Permission.AGENT_VIEW, Permission.AGENT_CREATE, Permission.AGENT_EDIT,
      Permission.ANALYTICS_VIEW, Permission.MONITORING_VIEW,
      Permission.API_READ, Permission.API_WRITE
    ],
    isSystem: true,
    priority: 700
  },
  
  ANALYST: {
    id: 'analyst',
    name: 'Analyst',
    description: 'Analytics and monitoring access',
    permissions: [
      Permission.POLICY_VIEW, Permission.POLICY_EVALUATE,
      Permission.WORKFLOW_VIEW, Permission.WORKFLOW_MONITOR,
      Permission.AGENT_VIEW,
      Permission.ANALYTICS_VIEW, Permission.ANALYTICS_EXPORT,
      Permission.MONITORING_VIEW, Permission.MONITORING_ALERTS,
      Permission.API_READ
    ],
    isSystem: true,
    priority: 500
  },
  
  OPERATOR: {
    id: 'operator',
    name: 'Operator',
    description: 'Operational access',
    permissions: [
      Permission.POLICY_VIEW, Permission.POLICY_EVALUATE,
      Permission.WORKFLOW_VIEW, Permission.WORKFLOW_EXECUTE, Permission.WORKFLOW_MONITOR,
      Permission.AGENT_VIEW,
      Permission.MONITORING_VIEW,
      Permission.API_READ
    ],
    isSystem: true,
    priority: 400
  },
  
  VIEWER: {
    id: 'viewer',
    name: 'Viewer',
    description: 'Read-only access',
    permissions: [
      Permission.POLICY_VIEW,
      Permission.WORKFLOW_VIEW,
      Permission.AGENT_VIEW,
      Permission.ANALYTICS_VIEW,
      Permission.MONITORING_VIEW,
      Permission.ORG_VIEW,
      Permission.API_READ
    ],
    isSystem: true,
    priority: 200
  },
  
  GUEST: {
    id: 'guest',
    name: 'Guest',
    description: 'Limited read-only access',
    permissions: [
      Permission.POLICY_VIEW,
      Permission.WORKFLOW_VIEW,
      Permission.AGENT_VIEW
    ],
    isSystem: true,
    priority: 100
  }
};

// Organization structure
export interface Organization {
  id: string;
  name: string;
  tier: 'free' | 'startup' | 'professional' | 'enterprise';
  parentOrgId?: string; // For multi-tenant hierarchies
  settings: {
    allowCustomRoles: boolean;
    maxCustomRoles: number;
    mfaRequired: boolean;
    ipWhitelist?: string[];
    sessionTimeout: number;
  };
  metadata: Record<string, any>;
}

// User-Role-Organization mapping
export interface UserRole {
  userId: string;
  roleId: string;
  organizationId: string;
  scope?: {
    resources?: string[]; // Specific resource IDs
    conditions?: Record<string, any>; // Additional conditions
    expiresAt?: Date;
  };
}

// Access Control List Entry
export interface ACLEntry {
  principalType: 'user' | 'role' | 'organization';
  principalId: string;
  resourceType: string;
  resourceId: string;
  permissions: Permission[];
  conditions?: Record<string, any>;
  grant: boolean; // true = grant, false = deny
}

// RBAC Manager Class
export class RBACManager {
  private roles: Map<string, Role> = new Map();
  private userRoles: Map<string, UserRole[]> = new Map();
  private organizations: Map<string, Organization> = new Map();
  private acl: Map<string, ACLEntry[]> = new Map();
  private cache: Map<string, { result: boolean; expiresAt: number }> = new Map();

  constructor() {
    // Initialize with system roles
    Object.values(SystemRoles).forEach(role => {
      this.roles.set(role.id, role);
    });
  }

  /**
   * Register a custom role for an organization
   */
  async registerRole(role: Role, organizationId: string): Promise<void> {
    const org = this.organizations.get(organizationId);
    if (!org) {
      throw new Error('Organization not found');
    }

    if (!org.settings.allowCustomRoles) {
      throw new Error('Custom roles not allowed for this organization');
    }

    const customRoleCount = Array.from(this.roles.values()).filter(
      r => !r.isSystem && r.id.startsWith(`${organizationId}:`)
    ).length;

    if (customRoleCount >= org.settings.maxCustomRoles) {
      throw new Error('Maximum custom roles limit reached');
    }

    // Prefix role ID with organization ID for scoping
    role.id = `${organizationId}:${role.id}`;
    role.isSystem = false;
    
    this.roles.set(role.id, role);
  }

  /**
   * Assign a role to a user within an organization
   */
  async assignRole(userId: string, roleId: string, organizationId: string, scope?: UserRole['scope']): Promise<void> {
    const role = this.roles.get(roleId);
    if (!role) {
      throw new Error('Role not found');
    }

    const org = this.organizations.get(organizationId);
    if (!org) {
      throw new Error('Organization not found');
    }

    const userRole: UserRole = {
      userId,
      roleId,
      organizationId,
      scope
    };

    const userRolesList = this.userRoles.get(userId) || [];
    
    // Check for duplicate assignments
    const existingIndex = userRolesList.findIndex(
      ur => ur.roleId === roleId && ur.organizationId === organizationId
    );

    if (existingIndex >= 0) {
      // Update existing assignment
      userRolesList[existingIndex] = userRole;
    } else {
      userRolesList.push(userRole);
    }

    this.userRoles.set(userId, userRolesList);
    
    // Clear cache for this user
    this.clearUserCache(userId);
  }

  /**
   * Check if a user has a specific permission
   */
  async hasPermission(
    userId: string,
    permission: Permission,
    context: {
      organizationId: string;
      resourceType?: string;
      resourceId?: string;
      additionalContext?: Record<string, any>;
    }
  ): Promise<boolean> {
    // Check cache first
    const cacheKey = this.getCacheKey(userId, permission, context);
    const cached = this.cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.result;
    }

    // Get user's roles for the organization
    const userRoles = this.getUserRolesForOrg(userId, context.organizationId);
    
    // Check if any role grants the permission
    let hasPermissionFromRole = false;
    let highestPriority = 0;

    for (const userRole of userRoles) {
      const role = this.roles.get(userRole.roleId);
      if (!role) continue;

      // Check role expiration
      if (userRole.scope?.expiresAt && new Date(userRole.scope.expiresAt) < new Date()) {
        continue;
      }

      // Check resource scope
      if (userRole.scope?.resources && context.resourceId) {
        if (!userRole.scope.resources.includes(context.resourceId)) {
          continue;
        }
      }

      // Check additional conditions
      if (userRole.scope?.conditions && !this.evaluateConditions(userRole.scope.conditions, context.additionalContext)) {
        continue;
      }

      // Check if role has the permission
      if (role.permissions.includes(permission)) {
        hasPermissionFromRole = true;
        highestPriority = Math.max(highestPriority, role.priority);
      }
    }

    // Check ACL entries
    let aclResult = await this.checkACL(userId, permission, context);
    
    // Combine results (ACL can override role permissions)
    const finalResult = aclResult !== null ? aclResult : hasPermissionFromRole;

    // Cache the result
    this.cache.set(cacheKey, {
      result: finalResult,
      expiresAt: Date.now() + 60000 // Cache for 1 minute
    });

    return finalResult;
  }

  /**
   * Get all permissions for a user in an organization
   */
  async getUserPermissions(userId: string, organizationId: string): Promise<Permission[]> {
    const userRoles = this.getUserRolesForOrg(userId, organizationId);
    const permissions = new Set<Permission>();

    for (const userRole of userRoles) {
      const role = this.roles.get(userRole.roleId);
      if (!role) continue;

      // Check role expiration
      if (userRole.scope?.expiresAt && new Date(userRole.scope.expiresAt) < new Date()) {
        continue;
      }

      role.permissions.forEach(p => permissions.add(p));
    }

    return Array.from(permissions);
  }

  /**
   * Check if a user can access a resource
   */
  async canAccess(
    userId: string,
    resource: {
      type: string;
      id: string;
      requiredPermissions: Permission[];
      organizationId: string;
    }
  ): Promise<boolean> {
    // Check all required permissions
    for (const permission of resource.requiredPermissions) {
      const hasPermission = await this.hasPermission(userId, permission, {
        organizationId: resource.organizationId,
        resourceType: resource.type,
        resourceId: resource.id
      });

      if (!hasPermission) {
        return false;
      }
    }

    return true;
  }

  /**
   * Add an ACL entry for fine-grained control
   */
  async addACLEntry(entry: ACLEntry): Promise<void> {
    const key = `${entry.resourceType}:${entry.resourceId}`;
    const entries = this.acl.get(key) || [];
    entries.push(entry);
    this.acl.set(key, entries);
    
    // Clear relevant caches
    this.clearCache();
  }

  // Private helper methods
  
  private getUserRolesForOrg(userId: string, organizationId: string): UserRole[] {
    const allUserRoles = this.userRoles.get(userId) || [];
    return allUserRoles.filter(ur => ur.organizationId === organizationId);
  }

  private async checkACL(
    userId: string,
    permission: Permission,
    context: { resourceType?: string; resourceId?: string; additionalContext?: Record<string, any> }
  ): Promise<boolean | null> {
    if (!context.resourceType || !context.resourceId) {
      return null;
    }

    const key = `${context.resourceType}:${context.resourceId}`;
    const entries = this.acl.get(key) || [];

    let grant: boolean | null = null;
    let deny: boolean | null = null;

    for (const entry of entries) {
      // Check if entry applies to this user
      if (entry.principalType === 'user' && entry.principalId !== userId) {
        continue;
      }

      // Check if entry has the permission
      if (!entry.permissions.includes(permission)) {
        continue;
      }

      // Evaluate conditions
      if (entry.conditions && !this.evaluateConditions(entry.conditions, context.additionalContext)) {
        continue;
      }

      // Apply grant/deny
      if (entry.grant) {
        grant = true;
      } else {
        deny = true;
      }
    }

    // Deny takes precedence
    if (deny) return false;
    if (grant) return true;
    
    return null;
  }

  private evaluateConditions(conditions: Record<string, any>, context?: Record<string, any>): boolean {
    if (!context) return false;

    for (const [key, value] of Object.entries(conditions)) {
      if (context[key] !== value) {
        return false;
      }
    }

    return true;
  }

  private getCacheKey(userId: string, permission: Permission, context: any): string {
    return crypto
      .createHash('sha256')
      .update(`${userId}:${permission}:${JSON.stringify(context)}`)
      .digest('hex');
  }

  private clearUserCache(userId: string): void {
    // Clear all cache entries for a user
    for (const key of this.cache.keys()) {
      if (key.includes(userId)) {
        this.cache.delete(key);
      }
    }
  }

  private clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const rbacManager = new RBACManager();

// Middleware helper for Express/Next.js
export function requirePermission(permission: Permission | Permission[]) {
  return async (req: any, res: any, next: any) => {
    const userId = req.user?.id;
    const organizationId = req.user?.organizationId || req.headers['x-organization-id'];

    if (!userId || !organizationId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const permissions = Array.isArray(permission) ? permission : [permission];
    
    for (const perm of permissions) {
      const hasPermission = await rbacManager.hasPermission(userId, perm, {
        organizationId,
        resourceType: req.params?.resourceType,
        resourceId: req.params?.resourceId,
        additionalContext: req.body
      });

      if (!hasPermission) {
        return res.status(403).json({ 
          error: 'Forbidden',
          message: `Missing required permission: ${perm}`
        });
      }
    }

    next();
  };
}

export default RBACManager;