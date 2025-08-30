/**
 * ATP™ Monitoring Service - Types and Interfaces
 */

export interface ServiceHealth {
  name: string;
  status: 'online' | 'offline' | 'degraded';
  uptime: number;
  lastCheck: string;
  responseTime: number;
  version?: string;
  url: string;
}

export interface SystemMetrics {
  timestamp: string;
  
  // Core Services
  services: ServiceHealth[];
  
  // Performance Metrics
  performance: {
    activeConnections: number;
    signaturesGenerated: number;
    avgResponseTime: number;
    requestsPerSecond: number;
    errorRate: number;
    memoryUsage: number;
    cpuUsage: number;
  };
  
  // Security Metrics
  security: {
    trustTransactions: number;
    failedAuthentications: number;
    compromisedAgents: number;
    quantumThreats: number;
  };
  
  // Business Metrics
  business: {
    registeredAgents: number;
    activeAgents: number;
    credentialsIssued: number;
    auditEvents: number;
  };
}

export interface MetricsQuery {
  timeRange?: 'hour' | 'day' | 'week' | 'month';
  services?: string[];
  limit?: number;
}

export interface Alert {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  service: string;
  message: string;
  details: Record<string, any>;
  resolved: boolean;
  resolvedAt?: string;
}

export interface AlertRule {
  id: string;
  name: string;
  service: string;
  metric: string;
  condition: 'gt' | 'lt' | 'eq' | 'ne';
  threshold: number;
  enabled: boolean;
  notificationChannels: string[];
}