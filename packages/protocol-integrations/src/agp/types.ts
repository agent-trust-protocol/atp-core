/**
 * Cisco Agent Gateway Protocol (AGP) Type Definitions
 */

export interface AGPMessage {
  messageId: string;
  messageType: AGPMessageType;
  sourceAgent: string;
  targetAgent: string | string[];
  payload: any;
  priority: AGPPriority;
  timeout?: number;
  sessionId?: string;
  correlationId?: string;
  timestamp: number;
  headers?: Record<string, string>;
}

export enum AGPMessageType {
  REQUEST = 'REQUEST',
  RESPONSE = 'RESPONSE',
  NOTIFICATION = 'NOTIFICATION',
  HEARTBEAT = 'HEARTBEAT',
  DISCOVERY = 'DISCOVERY',
  REGISTRATION = 'REGISTRATION',
  DEREGISTRATION = 'DEREGISTRATION',
  ERROR = 'ERROR'
}

export enum AGPPriority {
  LOW = 1,
  NORMAL = 2,
  HIGH = 3,
  CRITICAL = 4
}

export interface AGPAgent {
  agentId: string;
  agentName: string;
  agentType: string;
  capabilities: string[];
  endpoints: AGPEndpoint[];
  status: AGPAgentStatus;
  metadata?: Record<string, any>;
  heartbeatInterval: number;
  lastHeartbeat?: number;
}

export interface AGPEndpoint {
  protocol: 'HTTP' | 'HTTPS' | 'WebSocket' | 'TCP' | 'UDP';
  host: string;
  port: number;
  path?: string;
  secure: boolean;
}

export enum AGPAgentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BUSY = 'BUSY',
  ERROR = 'ERROR',
  MAINTENANCE = 'MAINTENANCE'
}

export interface AGPRoute {
  routeId: string;
  sourcePattern: string;
  targetPattern: string;
  priority: number;
  loadBalancing: AGPLoadBalancing;
  filters: AGPFilter[];
  timeout: number;
  retryPolicy: AGPRetryPolicy;
}

export enum AGPLoadBalancing {
  ROUND_ROBIN = 'ROUND_ROBIN',
  WEIGHTED_ROUND_ROBIN = 'WEIGHTED_ROUND_ROBIN',
  LEAST_CONNECTIONS = 'LEAST_CONNECTIONS',
  RANDOM = 'RANDOM',
  HASH = 'HASH'
}

export interface AGPFilter {
  filterId: string;
  filterType: 'RATE_LIMIT' | 'AUTH' | 'VALIDATION' | 'TRANSFORM' | 'AUDIT';
  config: Record<string, any>;
  order: number;
}

export interface AGPRetryPolicy {
  maxRetries: number;
  backoffStrategy: 'FIXED' | 'EXPONENTIAL' | 'LINEAR';
  baseDelay: number;
  maxDelay: number;
  retryableErrors: string[];
}

export interface SecuredAGPMessage extends AGPMessage {
  atpHeaders: {
    clientDID: string;
    signature: string;
    trustLevel: string;
    nonce: string;
    encryptionMethod?: string;
  };
  securityContext: {
    authenticated: boolean;
    authorized: boolean;
    encrypted: boolean;
    integrityChecked: boolean;
  };
}

export interface AGPSecurityConfig {
  enforceAuthentication: boolean;
  requireEncryption: boolean;
  enableRateLimit: boolean;
  enableAuditLogging: boolean;
  trustedAgents: string[];
  maxMessageSize: number;
  sessionTimeout: number;
  rateLimitPerAgent: number;
  quantumSafeEnabled: boolean;
  database: any; // DatabaseManager instance
}

export interface AGPGatewayConfig {
  gatewayId: string;
  gatewayName: string;
  port: number;
  host: string;
  maxConnections: number;
  enableClustering: boolean;
  clusterNodes?: string[];
  security: AGPSecurityConfig;
  monitoring: {
    enableMetrics: boolean;
    metricsPort: number;
    enableHealthCheck: boolean;
    healthCheckPath: string;
  };
}