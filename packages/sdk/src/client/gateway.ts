import { BaseClient } from './base.js';
import {
  ATPConfig,
  ATPResponse,
  ATPEvent,
  ATPEventHandler
} from '../types.js';
import WebSocket from 'ws';
import { EventEmitter } from 'eventemitter3';

export interface GatewayStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  services: Record<string, {
    status: 'up' | 'down' | 'degraded';
    responseTime: number;
    lastCheck: string;
  }>;
  load: {
    cpu: number;
    memory: number;
    connections: number;
  };
  version: string;
}

export interface RouteInfo {
  path: string;
  service: string;
  method: string;
  authenticated: boolean;
  rateLimit?: {
    requests: number;
    window: string;
  };
}

export interface ConnectionStats {
  totalConnections: number;
  activeConnections: number;
  httpConnections: number;
  wsConnections: number;
  tlsConnections: number;
  connectionsByService: Record<string, number>;
}

export interface SecurityEvent {
  id: string;
  type: 'authentication_failure' | 'authorization_failure' | 'rate_limit_exceeded' | 'certificate_error' | 'suspicious_activity';
  timestamp: string;
  source: string;
  details: any;
  severity: 'low' | 'medium' | 'high' | 'critical';
  handled: boolean;
}

export class GatewayClient extends BaseClient {
  private ws?: WebSocket;
  private eventEmitter = new EventEmitter();
  private reconnectInterval?: NodeJS.Timeout;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;

  constructor(config: ATPConfig) {
    super(config, 'gateway');
  }

  /**
   * Get gateway status and health information
   */
  async getStatus(): Promise<ATPResponse<GatewayStatus>> {
    return this.get('/status');
  }

  /**
   * Get detailed health check for all services
   */
  async getHealth(): Promise<ATPResponse<{
    status: string;
    services: Record<string, any>;
    timestamp: string;
  }>> {
    return this.get('/health');
  }

  /**
   * Get available routes
   */
  async getRoutes(): Promise<ATPResponse<{ routes: RouteInfo[] }>> {
    return this.get('/routes');
  }

  /**
   * Get connection statistics
   */
  async getConnectionStats(): Promise<ATPResponse<ConnectionStats>> {
    return this.get('/stats/connections');
  }

  /**
   * Get security events
   */
  async getSecurityEvents(params?: {
    type?: string;
    severity?: string;
    startDate?: string;
    endDate?: string;
    handled?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<ATPResponse<{
    events: SecurityEvent[];
    total: number;
  }>> {
    return this.get('/security/events', { params });
  }

  /**
   * Acknowledge security event
   */
  async acknowledgeSecurityEvent(eventId: string): Promise<ATPResponse<{ success: boolean }>> {
    return this.post(`/security/events/${encodeURIComponent(eventId)}/acknowledge`);
  }

  // Rate Limiting Management

  /**
   * Get rate limit status for authenticated user
   */
  async getRateLimit(): Promise<ATPResponse<{
    remaining: number;
    limit: number;
    resetTime: string;
    windowStart: string;
  }>> {
    return this.get('/rate-limit');
  }

  /**
   * Get rate limiting rules
   */
  async getRateLimitRules(): Promise<ATPResponse<{
    rules: Array<{
      id: string;
      path: string;
      method: string;
      limit: number;
      window: string;
      scope: 'global' | 'user' | 'ip';
      enabled: boolean;
    }>;
  }>> {
    return this.get('/rate-limit/rules');
  }

  // TLS Certificate Management

  /**
   * Get certificate information
   */
  async getCertificateInfo(): Promise<ATPResponse<{
    certificates: Array<{
      subject: string;
      issuer: string;
      validFrom: string;
      validTo: string;
      fingerprint: string;
      keyUsage: string[];
      extendedKeyUsage: string[];
    }>;
  }>> {
    return this.get('/tls/certificates');
  }

  /**
   * Verify certificate chain
   */
  async verifyCertificateChain(certificatePem: string): Promise<ATPResponse<{
    valid: boolean;
    error?: string;
    chain: Array<{
      subject: string;
      issuer: string;
      validFrom: string;
      validTo: string;
    }>;
  }>> {
    return this.post('/tls/verify', { certificate: certificatePem });
  }

  // WebSocket Real-time Features

  /**
   * Connect to real-time event stream
   */
  async connectEventStream(options?: {
    filters?: {
      eventTypes?: string[];
      sources?: string[];
      severities?: string[];
    };
    autoReconnect?: boolean;
  }): Promise<void> {
    const wsUrl = this.config.services.gateway?.replace('http', 'ws') ||
                  `${this.config.baseUrl.replace('http', 'ws')  }:3000`;

    const url = `${wsUrl}/ws/events`;
    const queryParams = new URLSearchParams();

    if (options?.filters) {
      queryParams.append('filters', JSON.stringify(options.filters));
    }

    this.ws = new WebSocket(`${url}?${queryParams}`, {
      headers: this.isAuthenticated() ? {
        'Authorization': `Bearer ${this.config.auth.token}`
      } : undefined
    });

    this.ws.on('open', () => {
      this.reconnectAttempts = 0;
      this.eventEmitter.emit('connected');
    });

    this.ws.on('message', (data) => {
      try {
        const event: ATPEvent = JSON.parse(data.toString());
        this.eventEmitter.emit('event', event);
        this.eventEmitter.emit(event.type, event);
      } catch (error) {
        this.eventEmitter.emit('error', new Error(`Failed to parse event: ${error}`));
      }
    });

    this.ws.on('error', (error) => {
      this.eventEmitter.emit('error', error);
    });

    this.ws.on('close', () => {
      this.eventEmitter.emit('disconnected');

      if (options?.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.scheduleReconnect(options);
      }
    });
  }

  /**
   * Disconnect from event stream
   */
  disconnectEventStream(): void {
    if (this.reconnectInterval) {
      clearTimeout(this.reconnectInterval);
      this.reconnectInterval = undefined;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = undefined;
    }
  }

  /**
   * Subscribe to specific event types
   */
  on(event: 'connected' | 'disconnected' | 'error', handler: (...args: any[]) => void): void;
  on(event: 'event', handler: ATPEventHandler): void;
  on(event: string, handler: ATPEventHandler): void;
  on(event: string, handler: (...args: any[]) => void): void {
    this.eventEmitter.on(event, handler);
  }

  /**
   * Unsubscribe from events
   */
  off(event: string, handler?: (...args: any[]) => void): void {
    if (handler) {
      this.eventEmitter.off(event, handler);
    } else {
      this.eventEmitter.removeAllListeners(event);
    }
  }

  /**
   * Send command through WebSocket
   */
  async sendCommand(command: {
    type: string;
    data?: any;
    id?: string;
  }): Promise<void> {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not connected');
    }

    this.ws.send(JSON.stringify({
      ...command,
      id: command.id || Date.now().toString(),
      timestamp: new Date().toISOString()
    }));
  }

  // Service Proxy Methods

  /**
   * Proxy request to any ATP service through gateway
   */
  async proxyRequest<T = any>(
    service: 'identity' | 'credentials' | 'permissions' | 'audit',
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    path: string,
    data?: any
  ): Promise<ATPResponse<T>> {
    return this.request<T>(method, `/proxy/${service}${path}`, data);
  }

  // Load Balancing and Failover

  /**
   * Get service discovery information
   */
  async getServiceDiscovery(): Promise<ATPResponse<{
    services: Record<string, {
      instances: Array<{
        id: string;
        url: string;
        status: 'healthy' | 'unhealthy';
        load: number;
        responseTime: number;
      }>;
      loadBalancing: 'round-robin' | 'least-connections' | 'weighted';
    }>;
  }>> {
    return this.get('/discovery/services');
  }

  /**
   * Force service discovery refresh
   */
  async refreshServiceDiscovery(): Promise<ATPResponse<{ success: boolean }>> {
    return this.post('/discovery/refresh');
  }

  // Configuration Management

  /**
   * Get gateway configuration
   */
  async getConfiguration(): Promise<ATPResponse<{
    cors: {
      enabled: boolean;
      origins: string[];
      credentials: boolean;
    };
    rateLimit: {
      enabled: boolean;
      defaultRules: any[];
    };
    security: {
      tlsEnabled: boolean;
      clientCertRequired: boolean;
      trustedCAs: string[];
    };
    routing: {
      timeout: number;
      retries: number;
      circuitBreaker: boolean;
    };
  }>> {
    return this.get('/config');
  }

  /**
   * Update gateway configuration (admin only)
   */
  async updateConfiguration(config: any): Promise<ATPResponse<{ success: boolean }>> {
    return this.put('/config', config);
  }

  private scheduleReconnect(options: any): void {
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    this.reconnectInterval = setTimeout(() => {
      this.connectEventStream(options);
    }, delay);
  }

  /**
   * Get WebSocket connection status
   */
  get connectionStatus(): 'connected' | 'connecting' | 'disconnected' {
    if (!this.ws) return 'disconnected';

    switch (this.ws.readyState) {
      case WebSocket.OPEN: return 'connected';
      case WebSocket.CONNECTING: return 'connecting';
      default: return 'disconnected';
    }
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    this.disconnectEventStream();
    this.eventEmitter.removeAllListeners();
  }
}
