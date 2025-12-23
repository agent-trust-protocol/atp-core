/**
 * Development Coordination Types
 */

import { SupportedProtocol, UniversalMessage } from '../federation/types';

// Agent Specialization Types
export enum AgentSpecialization {
  MCP_AGENT = 'mcp-agent',
  A2A_AGENT = 'a2a-agent', 
  ENTERPRISE_AGENT = 'enterprise-agent',
  ANP_AGENT = 'anp-agent'
}

export interface AgentWorkspace {
  agentId: AgentSpecialization;
  name: string;
  description: string;
  protocols: SupportedProtocol[];
  workspaceDirectory: string;
  dependencies: AgentSpecialization[];
  sharedResources: SharedResource[];
  conflictBoundaries: ConflictBoundary[];
  communicationPatterns: CommunicationPattern[];
}

export interface SharedResource {
  resourceId: string;
  resourceType: SharedResourceType;
  path: string;
  accessLevel: ResourceAccessLevel;
  lockingStrategy: LockingStrategy;
  conflictResolution: ConflictResolutionStrategy;
}

export enum SharedResourceType {
  TYPE_DEFINITIONS = 'type-definitions',
  PROTOCOL_BRIDGE = 'protocol-bridge',
  SECURITY_CONTEXT = 'security-context',
  FEDERATION_ENGINE = 'federation-engine',
  SHARED_UTILITIES = 'shared-utilities',
  CONFIGURATION = 'configuration',
  TEST_FRAMEWORK = 'test-framework'
}

export enum ResourceAccessLevel {
  READ_ONLY = 'read-only',
  READ_WRITE = 'read-write',
  EXCLUSIVE = 'exclusive',
  COORDINATED_WRITE = 'coordinated-write'
}

export enum LockingStrategy {
  NO_LOCK = 'no-lock',
  OPTIMISTIC = 'optimistic',
  PESSIMISTIC = 'pessimistic',
  COOPERATIVE = 'cooperative'
}

export enum ConflictResolutionStrategy {
  MERGE = 'merge',
  LAST_WRITER_WINS = 'last-writer-wins',
  FIRST_WRITER_WINS = 'first-writer-wins',
  MANUAL_RESOLUTION = 'manual-resolution',
  AGENT_NEGOTIATION = 'agent-negotiation'
}

export interface ConflictBoundary {
  boundaryId: string;
  description: string;
  conflictingSources: string[];
  isolationStrategy: IsolationStrategy;
  coordinationRequired: boolean;
}

export enum IsolationStrategy {
  NAMESPACE_ISOLATION = 'namespace-isolation',
  FILE_SEPARATION = 'file-separation',
  MODULE_BOUNDARIES = 'module-boundaries',
  INTERFACE_CONTRACTS = 'interface-contracts'
}

export interface CommunicationPattern {
  patternId: string;
  sourceAgent: AgentSpecialization;
  targetAgent: AgentSpecialization;
  messageTypes: InterAgentMessageType[];
  protocol: CommunicationProtocol;
  reliability: ReliabilityLevel;
  security: SecurityLevel;
}

export enum InterAgentMessageType {
  COORDINATION_REQUEST = 'coordination-request',
  COORDINATION_RESPONSE = 'coordination-response',
  RESOURCE_LOCK_REQUEST = 'resource-lock-request',
  RESOURCE_LOCK_RELEASE = 'resource-lock-release',
  CONFLICT_NOTIFICATION = 'conflict-notification',
  PROGRESS_UPDATE = 'progress-update',
  DEPENDENCY_READY = 'dependency-ready',
  INTEGRATION_TEST_REQUEST = 'integration-test-request',
  SYNC_REQUEST = 'sync-request',
  HANDOFF_REQUEST = 'handoff-request'
}

export enum CommunicationProtocol {
  MESSAGE_QUEUE = 'message-queue',
  EVENT_BUS = 'event-bus',
  RPC = 'rpc',
  WEBSOCKET = 'websocket',
  HTTP_API = 'http-api'
}

export enum ReliabilityLevel {
  BEST_EFFORT = 'best-effort',
  AT_LEAST_ONCE = 'at-least-once',
  EXACTLY_ONCE = 'exactly-once'
}

export enum SecurityLevel {
  NONE = 'none',
  BASIC_AUTH = 'basic-auth',
  TOKEN_BASED = 'token-based',
  MUTUAL_TLS = 'mutual-tls',
  SIGNED_MESSAGES = 'signed-messages'
}

// Development Lifecycle Types
export interface DevelopmentPhase {
  phaseId: string;
  name: string;
  description: string;
  prerequisites: string[];
  deliverables: Deliverable[];
  dependencies: PhaseDependency[];
  estimatedDuration: number; // hours
  parallelizable: boolean;
}

export interface Deliverable {
  deliverableId: string;
  name: string;
  type: DeliverableType;
  owner: AgentSpecialization;
  dependencies: string[];
  testRequirements: TestRequirement[];
  integrationPoints: IntegrationPoint[];
}

export enum DeliverableType {
  PROTOCOL_ADAPTER = 'protocol-adapter',
  SECURITY_WRAPPER = 'security-wrapper',
  BRIDGE_IMPLEMENTATION = 'bridge-implementation',
  TYPE_DEFINITIONS = 'type-definitions',
  TEST_SUITE = 'test-suite',
  DOCUMENTATION = 'documentation',
  CONFIGURATION = 'configuration'
}

export interface TestRequirement {
  testId: string;
  testType: TestType;
  scope: TestScope;
  dependencies: string[];
  automatable: boolean;
}

export enum TestType {
  UNIT_TEST = 'unit-test',
  INTEGRATION_TEST = 'integration-test',
  END_TO_END_TEST = 'end-to-end-test',
  SECURITY_TEST = 'security-test',
  PERFORMANCE_TEST = 'performance-test',
  COMPATIBILITY_TEST = 'compatibility-test'
}

export enum TestScope {
  COMPONENT = 'component',
  PROTOCOL = 'protocol',
  BRIDGE = 'bridge',
  FEDERATION = 'federation',
  SYSTEM = 'system'
}

export interface IntegrationPoint {
  pointId: string;
  sourceComponent: string;
  targetComponent: string;
  interface: string;
  dataFlow: DataFlow;
  securityRequirements: string[];
  performanceRequirements: PerformanceRequirement[];
}

export enum DataFlow {
  UNIDIRECTIONAL = 'unidirectional',
  BIDIRECTIONAL = 'bidirectional',
  STREAMING = 'streaming',
  BATCH = 'batch'
}

export interface PerformanceRequirement {
  metric: PerformanceMetric;
  threshold: number;
  unit: string;
}

export enum PerformanceMetric {
  LATENCY = 'latency',
  THROUGHPUT = 'throughput',
  MEMORY_USAGE = 'memory-usage',
  CPU_USAGE = 'cpu-usage',
  ERROR_RATE = 'error-rate'
}

export interface PhaseDependency {
  dependsOn: string;
  dependencyType: DependencyType;
  criticalPath: boolean;
}

export enum DependencyType {
  BLOCKS = 'blocks',
  ENABLES = 'enables',
  OPTIMIZES = 'optimizes',
  REQUIRES = 'requires'
}

// Coordination Events
export interface CoordinationEvent {
  eventId: string;
  eventType: CoordinationEventType;
  sourceAgent: AgentSpecialization;
  targetAgent?: AgentSpecialization;
  timestamp: number;
  payload: any;
  priority: EventPriority;
  requiresResponse: boolean;
  correlationId?: string;
}

export enum CoordinationEventType {
  AGENT_STARTED = 'agent-started',
  AGENT_STOPPED = 'agent-stopped',
  PHASE_STARTED = 'phase-started',
  PHASE_COMPLETED = 'phase-completed',
  DELIVERABLE_READY = 'deliverable-ready',
  INTEGRATION_REQUEST = 'integration-request',
  CONFLICT_DETECTED = 'conflict-detected',
  SYNC_REQUIRED = 'sync-required',
  TEST_RESULTS = 'test-results',
  MILESTONE_ACHIEVED = 'milestone-achieved'
}

export enum EventPriority {
  LOW = 1,
  NORMAL = 2,
  HIGH = 3,
  CRITICAL = 4
}

// Progress Tracking
export interface ProgressTracker {
  trackerId: string;
  agentId: AgentSpecialization;
  currentPhase: string;
  completedDeliverables: string[];
  blockedTasks: BlockedTask[];
  metrics: ProgressMetrics;
  lastUpdate: number;
}

export interface BlockedTask {
  taskId: string;
  blocker: string;
  blockerType: BlockerType;
  estimatedResolution: number;
  escalated: boolean;
}

export enum BlockerType {
  DEPENDENCY_NOT_READY = 'dependency-not-ready',
  RESOURCE_CONFLICT = 'resource-conflict',
  TECHNICAL_ISSUE = 'technical-issue',
  EXTERNAL_DEPENDENCY = 'external-dependency'
}

export interface ProgressMetrics {
  completionPercentage: number;
  velocityTrend: number[];
  qualityMetrics: QualityMetric[];
  riskIndicators: RiskIndicator[];
}

export interface QualityMetric {
  metric: QualityMetricType;
  value: number;
  threshold: number;
  status: MetricStatus;
}

export enum QualityMetricType {
  TEST_COVERAGE = 'test-coverage',
  CODE_QUALITY = 'code-quality',
  INTEGRATION_SUCCESS_RATE = 'integration-success-rate',
  DEFECT_DENSITY = 'defect-density'
}

export enum MetricStatus {
  GOOD = 'good',
  WARNING = 'warning',
  CRITICAL = 'critical'
}

export interface RiskIndicator {
  risk: RiskType;
  level: RiskLevel;
  description: string;
  mitigation: string[];
}

export enum RiskType {
  SCHEDULE_RISK = 'schedule-risk',
  TECHNICAL_RISK = 'technical-risk',
  INTEGRATION_RISK = 'integration-risk',
  QUALITY_RISK = 'quality-risk'
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}