import { BaseClient } from './base.js';
import {
  ATPConfig,
  AuditEvent,
  ATPResponse
} from '../types.js';

export interface AuditLogRequest {
  source: string;
  action: string;
  resource: string;
  actor?: string;
  details?: any;
}

export interface AuditQuery {
  source?: string;
  action?: string;
  resource?: string;
  actor?: string;
  startTime?: string;
  endTime?: string;
  limit?: number;
  offset?: number;
}

export interface IntegrityVerification {
  valid: boolean;
  brokenAt?: string;
  totalEvents: number;
  verifiedEvents: number;
  chainHash: string;
}

export interface AuditStats {
  totalEvents: number;
  eventsBySource: Record<string, number>;
  eventsByAction: Record<string, number>;
  recentActivity: Array<{
    timestamp: string;
    eventCount: number;
  }>;
  integrityStatus: 'valid' | 'compromised' | 'unknown';
}

export interface BlockchainAnchor {
  eventId: string;
  blockIndex: number;
  transactionId: string;
  merkleProof: string[];
  anchoredAt: string;
}

export class AuditClient extends BaseClient {
  constructor(config: ATPConfig) {
    super(config, 'audit');
  }

  /**
   * Log an audit event
   */
  async logEvent(request: AuditLogRequest): Promise<ATPResponse<AuditEvent>> {
    return this.post('/audit/log', request);
  }

  /**
   * Get audit event by ID
   */
  async getEvent(eventId: string): Promise<ATPResponse<AuditEvent>> {
    return this.get(`/audit/event/${encodeURIComponent(eventId)}`);
  }

  /**
   * Query audit events with filters
   */
  async queryEvents(query: AuditQuery): Promise<ATPResponse<{
    events: AuditEvent[];
    total: number;
  }>> {
    return this.get('/audit/events', { params: query });
  }

  /**
   * Verify audit chain integrity
   */
  async verifyIntegrity(): Promise<ATPResponse<IntegrityVerification>> {
    return this.get('/audit/integrity');
  }

  /**
   * Get audit statistics
   */
  async getStats(params?: {
    startDate?: string;
    endDate?: string;
    groupBy?: 'hour' | 'day' | 'week' | 'month';
  }): Promise<ATPResponse<AuditStats>> {
    return this.get('/audit/stats', { params });
  }

  /**
   * Get events from IPFS
   */
  async getEventFromIPFS(ipfsHash: string): Promise<ATPResponse<AuditEvent>> {
    return this.get(`/audit/ipfs/${encodeURIComponent(ipfsHash)}`);
  }

  // Advanced Audit Features

  /**
   * Get audit trail for a specific resource
   */
  async getResourceAuditTrail(resource: string, params?: {
    startDate?: string;
    endDate?: string;
    actions?: string[];
    limit?: number;
    offset?: number;
  }): Promise<ATPResponse<{
    events: AuditEvent[];
    total: number;
    summary: {
      firstEvent: string;
      lastEvent: string;
      uniqueActors: number;
      actionCounts: Record<string, number>;
    };
  }>> {
    return this.get(`/audit/resource/${encodeURIComponent(resource)}`, { params });
  }

  /**
   * Get audit trail for a specific actor
   */
  async getActorAuditTrail(actor: string, params?: {
    startDate?: string;
    endDate?: string;
    resources?: string[];
    actions?: string[];
    limit?: number;
    offset?: number;
  }): Promise<ATPResponse<{
    events: AuditEvent[];
    total: number;
    summary: {
      firstEvent: string;
      lastEvent: string;
      uniqueResources: number;
      actionCounts: Record<string, number>;
    };
  }>> {
    return this.get(`/audit/actor/${encodeURIComponent(actor)}`, { params });
  }

  /**
   * Search audit events with advanced filters
   */
  async searchEvents(params: {
    query?: string;
    filters?: {
      sources?: string[];
      actions?: string[];
      actors?: string[];
      resources?: string[];
      hasDetails?: boolean;
      hasSignature?: boolean;
      hasIPFSHash?: boolean;
    };
    dateRange?: {
      start: string;
      end: string;
    };
    sort?: {
      field: 'timestamp' | 'source' | 'action' | 'resource' | 'actor';
      order: 'asc' | 'desc';
    };
    limit?: number;
    offset?: number;
  }): Promise<ATPResponse<{
    events: AuditEvent[];
    total: number;
    facets: {
      sources: Record<string, number>;
      actions: Record<string, number>;
      actors: Record<string, number>;
      resources: Record<string, number>;
    };
  }>> {
    return this.post('/audit/search', params);
  }

  // Blockchain Integration

  /**
   * Get blockchain anchor for an event
   */
  async getBlockchainAnchor(eventId: string): Promise<ATPResponse<BlockchainAnchor>> {
    return this.get(`/audit/blockchain/anchor/${encodeURIComponent(eventId)}`);
  }

  /**
   * Verify blockchain anchor
   */
  async verifyBlockchainAnchor(anchor: BlockchainAnchor): Promise<ATPResponse<{
    valid: boolean;
    error?: string;
    blockchainHeight: number;
    confirmations: number;
  }>> {
    return this.post('/audit/blockchain/verify', { anchor });
  }

  /**
   * Get blockchain statistics
   */
  async getBlockchainStats(): Promise<ATPResponse<{
    totalBlocks: number;
    totalTransactions: number;
    totalAuditEvents: number;
    lastBlockTime: string;
    averageBlockTime: number;
    chainHash: string;
    integrityStatus: 'valid' | 'invalid';
  }>> {
    return this.get('/audit/blockchain/stats');
  }

  // Compliance and Reporting

  /**
   * Generate compliance report
   */
  async generateComplianceReport(params: {
    startDate: string;
    endDate: string;
    reportType: 'summary' | 'detailed' | 'security' | 'access';
    filters?: {
      actors?: string[];
      resources?: string[];
      actions?: string[];
      sources?: string[];
    };
    format?: 'json' | 'csv' | 'pdf';
  }): Promise<ATPResponse<{
    reportId: string;
    downloadUrl?: string;
    summary: {
      totalEvents: number;
      uniqueActors: number;
      uniqueResources: number;
      securityEvents: number;
      integrityViolations: number;
    };
    data?: any;
  }>> {
    return this.post('/audit/compliance/report', params);
  }

  /**
   * Export audit data
   */
  async exportAuditData(params: {
    startDate: string;
    endDate: string;
    format: 'json' | 'csv' | 'jsonl';
    filters?: AuditQuery;
    includeDetails?: boolean;
    compression?: 'gzip' | 'none';
  }): Promise<ATPResponse<{
    exportId: string;
    downloadUrl: string;
    fileSize: number;
    eventCount: number;
    expiresAt: string;
  }>> {
    return this.post('/audit/export', params);
  }

  /**
   * Get export status
   */
  async getExportStatus(exportId: string): Promise<ATPResponse<{
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress?: number;
    downloadUrl?: string;
    error?: string;
    createdAt: string;
    completedAt?: string;
  }>> {
    return this.get(`/audit/export/${encodeURIComponent(exportId)}/status`);
  }

  // Real-time Monitoring

  /**
   * Get recent audit events (live feed)
   */
  async getRecentEvents(params?: {
    sources?: string[];
    actions?: string[];
    limit?: number;
    since?: string;
  }): Promise<ATPResponse<{
    events: AuditEvent[];
    lastEventTime: string;
    hasMore: boolean;
  }>> {
    return this.get('/audit/recent', { params });
  }

  /**
   * Get audit event notifications
   */
  async getNotifications(params?: {
    severity?: 'low' | 'medium' | 'high' | 'critical';
    acknowledged?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<ATPResponse<{
    notifications: Array<{
      id: string;
      eventId: string;
      severity: string;
      message: string;
      acknowledged: boolean;
      createdAt: string;
      acknowledgedAt?: string;
    }>;
    total: number;
  }>> {
    return this.get('/audit/notifications', { params });
  }

  /**
   * Acknowledge notification
   */
  async acknowledgeNotification(notificationId: string): Promise<ATPResponse<{ success: boolean }>> {
    return this.post(`/audit/notifications/${encodeURIComponent(notificationId)}/acknowledge`);
  }

  /**
   * Check service health
   */
  async getHealth(): Promise<ATPResponse<{
    status: string;
    service: string;
    database?: any;
    ipfs?: { connected: boolean; peerId?: string };
    blockchain?: { height: number; integrityStatus: string };
  }>> {
    return this.get('/health');
  }
}
