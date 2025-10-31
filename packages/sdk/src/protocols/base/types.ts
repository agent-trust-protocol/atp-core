/**
 * Base Protocol Types for ATP SDK
 *
 * Defines core types for multi-protocol support including
 * MCP, OpenAI Swarm, Google ADK, and Agent2Agent protocols.
 */

import { AuditEvent } from '../../types.js';

/**
 * Supported AI Agent Protocols
 */
export enum Protocol {
  MCP = 'mcp',           // Model Context Protocol
  SWARM = 'swarm',       // OpenAI Swarm
  ADK = 'adk',           // Google Agent Development Kit
  A2A = 'a2a',           // Agent2Agent Protocol
  UNKNOWN = 'unknown'
}

/**
 * Protocol Information
 */
export interface ProtocolInfo {
  protocol: Protocol;
  version: string;
  name: string;
  description: string;
  capabilities: string[];
  metadata?: Record<string, any>;
}

/**
 * Agent Event - Core event type for protocol monitoring
 */
export interface AgentEvent {
  id: string;
  protocol: Protocol;
  timestamp: string;
  type: AgentEventType;
  source: {
    agentDid: string;
    agentName?: string;
  };
  data: any;
  trustScore?: number;
  signature?: string;
  metadata?: Record<string, any>;
}

/**
 * Types of agent events across protocols
 */
export type AgentEventType =
  // MCP Events
  | 'mcp.context.update'
  | 'mcp.tool.invoke'
  | 'mcp.retrieval.request'
  // Swarm Events
  | 'swarm.handoff'
  | 'swarm.routine.start'
  | 'swarm.routine.complete'
  | 'swarm.context.transfer'
  // ADK Events
  | 'adk.role.assign'
  | 'adk.evaluate'
  | 'adk.deploy'
  | 'adk.collaborate'
  // A2A Events
  | 'a2a.discover'
  | 'a2a.message'
  | 'a2a.capability.advertise'
  | 'a2a.bridge'
  // Generic Events
  | 'agent.created'
  | 'agent.message'
  | 'agent.error';

/**
 * Secured Message - Message with ATP security layer
 */
export interface SecuredMessage {
  id: string;
  protocol: Protocol;
  sender: string;
  recipient: string;
  payload: any;
  timestamp: string;
  signature: string;
  encryption?: {
    algorithm: string;
    publicKey?: string;
  };
  trustLevel: number;
  metadata?: Record<string, any>;
}

/**
 * Message before security layer
 */
export interface Message {
  id: string;
  protocol: Protocol;
  sender: string;
  recipient: string;
  payload: any;
  timestamp?: string;
  metadata?: Record<string, any>;
}

/**
 * Verification Result
 */
export interface VerificationResult {
  verified: boolean;
  trustScore: number;
  verifiedAt: string;
  details?: {
    signatureValid: boolean;
    senderVerified: boolean;
    trustLevel: string;
    issues?: string[];
  };
  metadata?: Record<string, any>;
}

/**
 * Audit Entry for protocol operations
 */
export interface ProtocolAuditEntry extends AuditEvent {
  protocol: Protocol;
  operation: string;
  agentDid: string;
  result: 'success' | 'failure' | 'partial';
  details?: Record<string, any>;
}

/**
 * Observable-like interface for event streams
 */
export interface Observable<T> {
  subscribe(observer: Observer<T>): Subscription;
  pipe(...operations: Operation<any, any>[]): Observable<any>;
}

export interface Observer<T> {
  next: (value: T) => void;
  error?: (error: Error) => void;
  complete?: () => void;
}

export interface Subscription {
  unsubscribe(): void;
}

export interface Operation<T, R> {
  (source: Observable<T>): Observable<R>;
}

/**
 * Agent representation across protocols
 */
export interface Agent {
  did: string;
  protocol: Protocol;
  name?: string;
  capabilities: string[];
  metadata?: Record<string, any>;
  trustScore?: number;
}

/**
 * Protocol-Specific Event Types
 */

// OpenAI Swarm specific
export interface HandoffEvent extends AgentEvent {
  type: 'swarm.handoff';
  data: {
    fromAgent: string;
    toAgent: string;
    context: any;
    reason?: string;
  };
}

export interface ContextFlow {
  flowId: string;
  agents: string[];
  context: any;
  timestamp: string;
}

// Google ADK specific
export interface RolePolicy {
  policyId: string;
  agentDid: string;
  role: string;
  permissions: string[];
  constraints?: any;
}

export interface EvalResult {
  evaluationId: string;
  agentDid: string;
  metrics: Record<string, number>;
  passed: boolean;
  timestamp: string;
}

export interface DeploymentLog {
  deploymentId: string;
  agentDid: string;
  environment: string;
  status: 'pending' | 'deployed' | 'failed';
  timestamp: string;
  logs?: string[];
}

// Agent2Agent specific
export interface DiscoveryResult {
  discoveredAgents: Array<{
    did: string;
    capabilities: string[];
    endpoint: string;
    trustScore?: number;
  }>;
  timestamp: string;
}

export interface CapabilitySet {
  agentDid: string;
  capabilities: Array<{
    name: string;
    version: string;
    description?: string;
    parameters?: any;
  }>;
  verified: boolean;
}

export interface BridgeConfig {
  bridgeId: string;
  sourceProtocol: Protocol;
  targetProtocol: Protocol;
  mappings: Record<string, string>;
  active: boolean;
}

/**
 * Monitoring Stream - Combined event stream
 */
export interface MonitoringStream extends Observable<AgentEvent> {
  protocol: Protocol;
  agentDid: string;
  startTime: string;
  filters?: EventFilter[];
}

export interface EventFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'contains';
  value: any;
}

/**
 * Protocol Adapter Configuration
 */
export interface ProtocolAdapterConfig {
  protocol: Protocol;
  atpConfig: {
    baseUrl: string;
    auth?: {
      did?: string;
      privateKey?: string;
      token?: string;
    };
  };
  options?: Record<string, any>;
  enableMonitoring?: boolean;
  enableAudit?: boolean;
  securityLevel?: 'basic' | 'standard' | 'quantum-safe';
}
