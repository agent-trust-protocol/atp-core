/**
 * ATP OpenClaw Integration - Main Entry Point
 * 
 * Provides quantum-safe security layer for OpenClaw AI agents
 */

// Core Agent Integration
export { AtpOpenClawAgent } from './agent/atp-agent.js';
export { registerAgentWithAtp } from './agent/registration.js';
export type { AgentMetadata, AgentRegistrationOptions } from './agent/types.js';

// Tool Security
export { ATPToolWrapper, secureTools } from './tools/wrapper.js';
export type { ToolSecurityConfig, ToolCallContext } from './tools/types.js';

// Task Protection
export { atpProtectedTask } from './tasks/decorator.js';
export { ATPTaskValidator } from './tasks/validator.js';
export type { TaskSecurityMetadata, TaskValidationResult } from './tasks/types.js';

// Graph Validation
export { ATPGraphValidator } from './graph/validator.js';
export { validateCrewWithAtp } from './graph/crew-validator.js';
export type { GraphValidationResult, InterAgentPolicy } from './graph/types.js';

// Policy Profiles
export { ATPPolicyProfile } from './policy/profile.js';
export { ATPConfigProfile } from './policy/config.js';
export type { PolicyRule, WorkflowConstraints } from './policy/types.js';

// Observability Integration
export { ATPLunaryExporter } from './observability/lunary-exporter.js';
export { ATPMonitor } from './observability/monitor.js';
export type { BehaviorMetrics, AnomalyDetection } from './observability/types.js';

// External Service Connectors
export { ATPSecretManager } from './connectors/secrets.js';
export { ATPServiceConnector } from './connectors/service-connector.js';
export type { ConnectorConfig, CredentialScope } from './connectors/types.js';

// Session Policy Enforcement
export { enforceAtpPoliciesForClawSession, defaultClawStatePolicy } from './session/enforce.js';
export type {
  SessionState,
  ClawStatePolicy,
  ClawStatePermissions,
  ClawSessionContext,
  SessionPolicyResult,
  EnforceSessionOptions
} from './session/types.js';

// OpenClaw Convenience API (canonical function names)
export { registerClawWithAtp, wrapSkillWithAtp } from './claw-api.js';
export type { ClawConfig } from './claw-api.js';

// Utilities
export { OpenClawATPClient } from './client.js';
export type { OpenClawIntegrationConfig } from './types.js';

// Re-export ATP SDK types commonly used
export type {
  TrustLevel,
  AuditEvent,
  Permission,
  DIDDocument
} from 'atp-sdk';

// Version
export const VERSION = '1.0.0';
