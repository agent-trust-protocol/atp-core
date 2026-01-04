/**
 * Enterprise Authentication and Authorization System
 * Complete enterprise-grade security suite for ATP
 */

export {
  EnterpriseAuthenticationService,
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

export {
  EnterpriseRBACService,
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

export {
  EnterpriseAuthMiddleware,
  AuthenticatedRequest,
  MiddlewareConfig,
  AuthorizationOptions
} from './enterprise-middleware';

// Re-export security components
export * from '../security/zkp';
export * from '../security/blockchain-audit';
