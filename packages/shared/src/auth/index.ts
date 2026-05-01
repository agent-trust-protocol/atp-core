/**
 * Enterprise Authentication and Authorization System
 * Complete enterprise-grade security suite for ATP
 */

export { EnterpriseAuthenticationService } from './enterprise-sso';
export type {
  SAMLConfiguration,
  SAMLNameIdFormat,
  SAMLAttributeMapping,
  SAMLRequest,
  SAMLResponse,
  SAMLStatus,
  SAMLAssertion,
  SAMLSubject,
  SAMLSubjectConfirmation,
  SAMLConditions,
  SAMLAttributeStatement,
  SAMLAttribute,
  SAMLAuthnStatement,
  EnterpriseUser,
  SSOSession,
  OIDCConfiguration,
  LDAPConfiguration,
  EnterpriseAuthProvider
} from './enterprise-sso';

export { EnterpriseRBACService } from './enterprise-rbac';
export type {
  Role,
  Permission,
  PermissionCondition,
  PermissionScope,
  UserRole,
  AccessRequest,
  AccessContext,
  AccessDecision,
  PolicyRule,
  PolicyEffect,
  AuditLog,
  ResourceHierarchy
} from './enterprise-rbac';

export { EnterpriseAuthMiddleware } from './enterprise-middleware';
export type {
  AuthenticatedRequest,
  MiddlewareConfig,
  AuthorizationOptions
} from './enterprise-middleware';

// Re-export security components
export * from '../security/zkp';
export * from '../security/blockchain-audit';
