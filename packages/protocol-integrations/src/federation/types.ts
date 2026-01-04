/**
 * Cross-Protocol Federation Types
 */

export interface UniversalMessage {
  messageId: string;
  sourceProtocol: SupportedProtocol;
  targetProtocol: SupportedProtocol;
  sourceAgent: string;
  targetAgent: string;
  messageType: UniversalMessageType;
  payload: any;
  metadata: MessageMetadata;
  securityContext: SecurityContext;
  federationHeaders: FederationHeaders;
  timestamp: number;
}

export enum SupportedProtocol {
  ATP = 'atp',
  MCP = 'mcp',
  ACP = 'acp',
  AGP = 'agp',
  FIPA = 'fipa',
  JADE = 'jade',
  MQTT = 'mqtt',
  AMQP = 'amqp',
  KAFKA = 'kafka',
  WEBSOCKET = 'websocket'
}

export enum UniversalMessageType {
  REQUEST = 'request',
  RESPONSE = 'response',
  INFORM = 'inform',
  QUERY = 'query',
  PROPOSE = 'propose',
  ACCEPT = 'accept',
  REJECT = 'reject',
  SUBSCRIBE = 'subscribe',
  UNSUBSCRIBE = 'unsubscribe',
  NOTIFY = 'notify',
  HEARTBEAT = 'heartbeat',
  DISCOVERY = 'discovery'
}

export interface MessageMetadata {
  conversationId?: string;
  correlationId?: string;
  priority: MessagePriority;
  timeout?: number;
  encoding: string;
  compression?: string;
  encryption?: string;
  routing: RoutingInfo;
}

export enum MessagePriority {
  LOW = 1,
  NORMAL = 2,
  HIGH = 3,
  CRITICAL = 4
}

export interface RoutingInfo {
  hops: ProtocolHop[];
  maxHops: number;
  routingStrategy: RoutingStrategy;
  fallbackRoutes: string[];
}

export interface ProtocolHop {
  protocol: SupportedProtocol;
  endpoint: string;
  transformationId: string;
  timestamp: number;
}

export enum RoutingStrategy {
  DIRECT = 'direct',
  BEST_EFFORT = 'best-effort',
  GUARANTEED_DELIVERY = 'guaranteed-delivery',
  BROADCAST = 'broadcast',
  MULTICAST = 'multicast'
}

export interface SecurityContext {
  authenticated: boolean;
  trustLevel: string;
  permissions: string[];
  signature?: string;
  encryptionKey?: string;
  accessToken?: string;
}

export interface FederationHeaders {
  federationVersion: string;
  bridgeId: string;
  transformationChain: string[];
  qualityOfService: QoSRequirements;
  compliance: ComplianceInfo;
}

export interface QoSRequirements {
  reliability: ReliabilityLevel;
  latency: LatencyRequirement;
  throughput: ThroughputRequirement;
  durability: boolean;
  ordering: OrderingGuarantee;
}

export enum ReliabilityLevel {
  AT_MOST_ONCE = 'at-most-once',
  AT_LEAST_ONCE = 'at-least-once',
  EXACTLY_ONCE = 'exactly-once'
}

export interface LatencyRequirement {
  maxLatency: number; // milliseconds
  preferredLatency: number;
}

export interface ThroughputRequirement {
  minThroughput: number; // messages per second
  maxThroughput: number;
}

export enum OrderingGuarantee {
  NONE = 'none',
  FIFO = 'fifo',
  CAUSAL = 'causal',
  TOTAL = 'total'
}

export interface ComplianceInfo {
  dataClassification: DataClassification;
  requiredCompliance: string[];
  dataResidency: string[];
  auditRequired: boolean;
}

export enum DataClassification {
  PUBLIC = 'public',
  INTERNAL = 'internal',
  CONFIDENTIAL = 'confidential',
  RESTRICTED = 'restricted'
}

export interface ProtocolAdapter {
  protocolType: SupportedProtocol;
  version: string;
  capabilities: string[];
  transformToUniversal(nativeMessage: any): Promise<UniversalMessage>;
  transformFromUniversal(universalMessage: UniversalMessage): Promise<any>;
  validateMessage(message: any): boolean;
  getEndpointInfo(): EndpointInfo;
}

export interface EndpointInfo {
  protocol: SupportedProtocol;
  address: string;
  port?: number;
  path?: string;
  secure: boolean;
  metadata: Record<string, any>;
}

export interface BridgeConfiguration {
  bridgeId: string;
  name: string;
  sourceProtocol: SupportedProtocol;
  targetProtocol: SupportedProtocol;
  transformationRules: TransformationRule[];
  securityPolicy: BridgeSecurityPolicy;
  qosPolicy: QoSRequirements;
  monitoring: MonitoringConfig;
}

export interface TransformationRule {
  ruleId: string;
  sourceMessageType: string;
  targetMessageType: string;
  transformation: string; // JSONPath or custom function
  validation: ValidationRule[];
  conditions: Condition[];
}

export interface ValidationRule {
  field: string;
  type: 'required' | 'type' | 'range' | 'regex' | 'custom';
  constraint: any;
  errorMessage: string;
}

export interface Condition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'contains';
  value: any;
}

export interface BridgeSecurityPolicy {
  requireAuthentication: boolean;
  allowedSources: string[];
  allowedTargets: string[];
  encryptionRequired: boolean;
  signatureRequired: boolean;
  accessControlRules: AccessControlRule[];
}

export interface AccessControlRule {
  principal: string;
  resource: string;
  action: string;
  effect: 'allow' | 'deny';
  conditions?: Condition[];
}

export interface MonitoringConfig {
  enableMetrics: boolean;
  enableTracing: boolean;
  enableLogging: boolean;
  metricsEndpoint?: string;
  tracingEndpoint?: string;
  logLevel: LogLevel;
}

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  TRACE = 'trace'
}

export interface FederationMetrics {
  totalMessages: number;
  messagesByProtocol: Record<SupportedProtocol, number>;
  messagesByType: Record<UniversalMessageType, number>;
  averageLatency: number;
  errorRate: number;
  throughput: number;
  activeBridges: number;
  failedTransformations: number;
  securityViolations: number;
}

export interface FederationEvent {
  eventId: string;
  eventType: FederationEventType;
  timestamp: number;
  bridgeId?: string;
  messageId?: string;
  sourceProtocol?: SupportedProtocol;
  targetProtocol?: SupportedProtocol;
  details: any;
  severity: EventSeverity;
}

export enum FederationEventType {
  MESSAGE_RECEIVED = 'message-received',
  MESSAGE_TRANSFORMED = 'message-transformed',
  MESSAGE_ROUTED = 'message-routed',
  MESSAGE_DELIVERED = 'message-delivered',
  MESSAGE_FAILED = 'message-failed',
  BRIDGE_CONNECTED = 'bridge-connected',
  BRIDGE_DISCONNECTED = 'bridge-disconnected',
  PROTOCOL_ERROR = 'protocol-error',
  SECURITY_VIOLATION = 'security-violation',
  QOS_VIOLATION = 'qos-violation'
}

export enum EventSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}