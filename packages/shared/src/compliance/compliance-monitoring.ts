/**
 * Compliance Monitoring and Real-time Assessment
 * Continuous compliance monitoring and automated assessment
 */

import { EventEmitter } from 'events';
import { createHash } from 'crypto';
import {
  ComplianceFramework,
  ComplianceStatus,
  DataClassification,
  ComplianceRequirement,
  AuditFinding
} from './compliance-framework';

export interface ComplianceEvent {
  id: string;
  timestamp: number;
  type: ComplianceEventType;
  framework: ComplianceFramework;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  description: string;
  affectedRequirements: string[];
  remediation: string;
  autoRemediation: boolean;
  metadata: Record<string, any>;
}

export enum ComplianceEventType {
  VIOLATION_DETECTED = 'violation-detected',
  CONTROL_FAILURE = 'control-failure',
  ACCESS_VIOLATION = 'access-violation',
  DATA_BREACH = 'data-breach',
  RETENTION_VIOLATION = 'retention-violation',
  ENCRYPTION_FAILURE = 'encryption-failure',
  AUDIT_LOG_FAILURE = 'audit-log-failure',
  CONFIGURATION_DRIFT = 'configuration-drift',
  CERTIFICATE_EXPIRY = 'certificate-expiry',
  BACKUP_FAILURE = 'backup-failure',
  ASSESSMENT_OVERDUE = 'assessment-overdue',
  CONTROL_EXECUTION_FAILED = 'control-execution-failed'
}

export interface ComplianceAlert {
  id: string;
  event: ComplianceEvent;
  alertLevel: 'info' | 'warning' | 'error' | 'critical';
  recipients: string[];
  channels: string[];
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: number;
  resolved: boolean;
  resolvedAt?: number;
  escalated: boolean;
  escalationLevel: number;
  metadata: Record<string, any>;
}

export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  framework: ComplianceFramework;
  type: 'preventive' | 'detective' | 'corrective';
  conditions: ComplianceCondition[];
  actions: ComplianceAction[];
  enabled: boolean;
  priority: number;
  lastTriggered?: number;
  triggerCount: number;
}

export interface ComplianceCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'contains' | 'regex';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface ComplianceAction {
  type: 'alert' | 'log' | 'block' | 'quarantine' | 'remediate' | 'escalate';
  parameters: Record<string, any>;
  delay?: number;
}

export interface DataGovernancePolicy {
  id: string;
  name: string;
  dataTypes: DataClassification[];
  retentionPeriod: number; // in milliseconds
  encryptionRequired: boolean;
  accessControls: string[];
  geographicRestrictions: string[];
  crossBorderTransferAllowed: boolean;
  auditRequired: boolean;
  anonymizationRequired: boolean;
  metadata: Record<string, any>;
}

export interface ComplianceMetric {
  id: string;
  name: string;
  framework: ComplianceFramework;
  type: 'percentage' | 'count' | 'duration' | 'score';
  value: number;
  target: number;
  threshold: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  lastUpdated: number;
  historical: Array<{ timestamp: number; value: number }>;
}

export class ComplianceMonitoringService extends EventEmitter {
  private rules: Map<string, ComplianceRule> = new Map();
  private alerts: Map<string, ComplianceAlert> = new Map();
  private events: ComplianceEvent[] = [];
  private policies: Map<string, DataGovernancePolicy> = new Map();
  private metrics: Map<string, ComplianceMetric> = new Map();
  private monitoring: boolean = false;

  constructor() {
    super();
    this.initializeDefaultRules();
    this.initializeMetrics();
  }

  /**
   * Start continuous compliance monitoring
   */
  startMonitoring(): void {
    if (this.monitoring) return;

    this.monitoring = true;
    this.emit('monitoringStarted', { timestamp: Date.now() });

    // Start monitoring intervals
    this.startEventProcessing();
    this.startMetricsCollection();
    this.startAlertProcessing();
  }

  /**
   * Stop compliance monitoring
   */
  stopMonitoring(): void {
    this.monitoring = false;
    this.emit('monitoringStopped', { timestamp: Date.now() });
  }

  /**
   * Process a compliance event
   */
  async processEvent(eventData: Omit<ComplianceEvent, 'id'>): Promise<ComplianceEvent> {
    const event: ComplianceEvent = {
      ...eventData,
      id: this.generateEventId()
    };

    this.events.push(event);

    // Keep only last 10000 events
    if (this.events.length > 10000) {
      this.events = this.events.slice(-10000);
    }

    // Evaluate compliance rules
    await this.evaluateRules(event);

    // Update metrics
    this.updateMetrics(event);

    this.emit('eventProcessed', event);
    return event;
  }

  /**
   * Create a compliance rule
   */
  createRule(rule: Omit<ComplianceRule, 'id' | 'triggerCount'>): ComplianceRule {
    const newRule: ComplianceRule = {
      ...rule,
      id: this.generateRuleId(),
      triggerCount: 0
    };

    this.rules.set(newRule.id, newRule);

    this.emit('ruleCreated', {
      ruleId: newRule.id,
      name: newRule.name,
      framework: newRule.framework
    });

    return newRule;
  }

  /**
   * Create data governance policy
   */
  createDataPolicy(policy: Omit<DataGovernancePolicy, 'id'>): DataGovernancePolicy {
    const newPolicy: DataGovernancePolicy = {
      ...policy,
      id: this.generatePolicyId()
    };

    this.policies.set(newPolicy.id, newPolicy);

    this.emit('policyCreated', {
      policyId: newPolicy.id,
      name: newPolicy.name,
      dataTypes: newPolicy.dataTypes
    });

    return newPolicy;
  }

  /**
   * Validate data access against governance policies
   */
  validateDataAccess(
    userId: string,
    dataType: DataClassification,
    operation: 'read' | 'write' | 'delete' | 'export',
    context: Record<string, any> = {}
  ): { allowed: boolean; policies: string[]; violations: string[] } {
    const applicablePolicies = Array.from(this.policies.values())
      .filter(policy => policy.dataTypes.includes(dataType));

    const violations: string[] = [];
    const appliedPolicies: string[] = [];

    for (const policy of applicablePolicies) {
      appliedPolicies.push(policy.id);

      // Check access controls
      if (policy.accessControls.length > 0 && !this.checkAccessControls(userId, policy.accessControls)) {
        violations.push(`Access control violation for policy ${policy.name}`);
      }

      // Check geographic restrictions
      if (policy.geographicRestrictions.length > 0 && context.location) {
        if (!policy.geographicRestrictions.includes(context.location)) {
          violations.push(`Geographic restriction violation for policy ${policy.name}`);
        }
      }

      // Check cross-border transfer
      if (operation === 'export' && !policy.crossBorderTransferAllowed && context.targetCountry) {
        violations.push(`Cross-border transfer not allowed for policy ${policy.name}`);
      }

      // Check encryption requirement
      if (policy.encryptionRequired && !context.encrypted) {
        violations.push(`Encryption required for policy ${policy.name}`);
      }
    }

    const allowed = violations.length === 0;

    // Log access attempt
    this.processEvent({
      timestamp: Date.now(),
      type: allowed ? ComplianceEventType.ACCESS_VIOLATION : ComplianceEventType.VIOLATION_DETECTED,
      framework: ComplianceFramework.GDPR, // Could be determined based on data type
      severity: allowed ? 'low' : 'high',
      source: 'data-access-monitor',
      description: `Data access ${allowed ? 'allowed' : 'denied'} for user ${userId}`,
      affectedRequirements: appliedPolicies,
      remediation: violations.length > 0 ? 'Review and fix policy violations' : '',
      autoRemediation: false,
      metadata: {
        userId,
        dataType,
        operation,
        context,
        violations
      }
    });

    return {
      allowed,
      policies: appliedPolicies,
      violations
    };
  }

  /**
   * Check data retention compliance
   */
  checkRetentionCompliance(
    dataId: string,
    dataType: DataClassification,
    createdAt: number
  ): { compliant: boolean; action: 'none' | 'archive' | 'delete'; daysOverdue?: number } {
    const policy = Array.from(this.policies.values())
      .find(p => p.dataTypes.includes(dataType));

    if (!policy) {
      return { compliant: true, action: 'none' };
    }

    const dataAge = Date.now() - createdAt;
    const isOverdue = dataAge > policy.retentionPeriod;
    const daysOverdue = isOverdue ? Math.floor((dataAge - policy.retentionPeriod) / (24 * 60 * 60 * 1000)) : undefined;

    if (isOverdue) {
      this.processEvent({
        timestamp: Date.now(),
        type: ComplianceEventType.RETENTION_VIOLATION,
        framework: ComplianceFramework.GDPR,
        severity: 'medium',
        source: 'retention-monitor',
        description: `Data retention violation for ${dataId}`,
        affectedRequirements: [policy.id],
        remediation: 'Archive or delete overdue data',
        autoRemediation: true,
        metadata: {
          dataId,
          dataType,
          createdAt,
          dataAge,
          retentionPeriod: policy.retentionPeriod,
          daysOverdue
        }
      });
    }

    return {
      compliant: !isOverdue,
      action: isOverdue ? 'delete' : 'none',
      daysOverdue
    };
  }

  /**
   * Generate compliance report
   */
  generateMonitoringReport(
    framework?: ComplianceFramework,
    timeRange?: { from: number; to: number }
  ): {
    summary: {
      totalEvents: number;
      violations: number;
      criticalAlerts: number;
      complianceScore: number;
    };
    eventsByType: Record<ComplianceEventType, number>;
    topViolations: Array<{ type: string; count: number }>;
    metrics: ComplianceMetric[];
    trends: Array<{ date: string; events: number; violations: number }>;
  } {
    let events = this.events;

    // Filter by framework
    if (framework) {
      events = events.filter(e => e.framework === framework);
    }

    // Filter by time range
    if (timeRange) {
      events = events.filter(e => e.timestamp >= timeRange.from && e.timestamp <= timeRange.to);
    }

    // Count events by type
    const eventsByType: Record<ComplianceEventType, number> = {} as any;
    for (const eventType of Object.values(ComplianceEventType)) {
      eventsByType[eventType] = events.filter(e => e.type === eventType).length;
    }

    // Count violations
    const violations = events.filter(e =>
      e.type === ComplianceEventType.VIOLATION_DETECTED ||
      e.type === ComplianceEventType.ACCESS_VIOLATION ||
      e.type === ComplianceEventType.RETENTION_VIOLATION
    ).length;

    // Count critical alerts
    const criticalAlerts = Array.from(this.alerts.values())
      .filter(a => a.alertLevel === 'critical' && !a.resolved).length;

    // Calculate compliance score
    const totalEvents = events.length;
    const complianceScore = totalEvents > 0 ? ((totalEvents - violations) / totalEvents) * 100 : 100;

    // Top violations
    const violationCounts: Record<string, number> = {};
    events.forEach(e => {
      if (e.severity === 'high' || e.severity === 'critical') {
        violationCounts[e.type] = (violationCounts[e.type] || 0) + 1;
      }
    });

    const topViolations = Object.entries(violationCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Generate trends (daily aggregation)
    const trends = this.generateTrends(events, timeRange);

    // Get relevant metrics
    const relevantMetrics = Array.from(this.metrics.values())
      .filter(m => !framework || m.framework === framework);

    return {
      summary: {
        totalEvents,
        violations,
        criticalAlerts,
        complianceScore
      },
      eventsByType,
      topViolations,
      metrics: relevantMetrics,
      trends
    };
  }

  /**
   * Get active alerts
   */
  getActiveAlerts(severity?: string): ComplianceAlert[] {
    return Array.from(this.alerts.values())
      .filter(alert =>
        !alert.resolved &&
        (!severity || alert.alertLevel === severity)
      )
      .sort((a, b) => b.event.timestamp - a.event.timestamp);
  }

  /**
   * Acknowledge alert
   */
  acknowledgeAlert(alertId: string, acknowledgedBy: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    alert.acknowledged = true;
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = Date.now();

    this.emit('alertAcknowledged', {
      alertId,
      acknowledgedBy,
      acknowledgedAt: alert.acknowledgedAt
    });

    return true;
  }

  /**
   * Resolve alert
   */
  resolveAlert(alertId: string, resolvedBy: string): boolean {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    alert.resolved = true;
    alert.resolvedAt = Date.now();

    this.emit('alertResolved', {
      alertId,
      resolvedBy,
      resolvedAt: alert.resolvedAt
    });

    return true;
  }

  // Private methods

  private initializeDefaultRules(): void {
    // Data access monitoring rule
    this.createRule({
      name: 'Unauthorized PHI Access',
      description: 'Detect unauthorized access to PHI data',
      framework: ComplianceFramework.HIPAA,
      type: 'detective',
      conditions: [
        {
          field: 'dataType',
          operator: 'eq',
          value: DataClassification.PHI
        },
        {
          field: 'authorized',
          operator: 'eq',
          value: false
        }
      ],
      actions: [
        {
          type: 'alert',
          parameters: { severity: 'critical', recipients: ['security-team'] }
        },
        {
          type: 'block',
          parameters: { duration: 3600000 } // 1 hour
        }
      ],
      enabled: true,
      priority: 1
    });

    // Encryption failure rule
    this.createRule({
      name: 'Encryption Failure Detection',
      description: 'Detect when required encryption is not applied',
      framework: ComplianceFramework.SOC2,
      type: 'detective',
      conditions: [
        {
          field: 'encryptionRequired',
          operator: 'eq',
          value: true
        },
        {
          field: 'encrypted',
          operator: 'eq',
          value: false
        }
      ],
      actions: [
        {
          type: 'alert',
          parameters: { severity: 'high', recipients: ['security-team'] }
        },
        {
          type: 'remediate',
          parameters: { action: 'apply-encryption' }
        }
      ],
      enabled: true,
      priority: 2
    });
  }

  private initializeMetrics(): void {
    const frameworks = Object.values(ComplianceFramework);

    for (const framework of frameworks) {
      // Compliance score metric
      this.metrics.set(`${framework}-compliance-score`, {
        id: `${framework}-compliance-score`,
        name: 'Compliance Score',
        framework,
        type: 'percentage',
        value: 0,
        target: 95,
        threshold: 90,
        trend: 'stable',
        lastUpdated: Date.now(),
        historical: []
      });

      // Violation count metric
      this.metrics.set(`${framework}-violations`, {
        id: `${framework}-violations`,
        name: 'Violations Count',
        framework,
        type: 'count',
        value: 0,
        target: 0,
        threshold: 5,
        trend: 'stable',
        lastUpdated: Date.now(),
        historical: []
      });
    }
  }

  private async evaluateRules(event: ComplianceEvent): Promise<void> {
    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      // Check if rule applies to this framework
      if (rule.framework !== event.framework) continue;

      // Evaluate conditions
      if (this.evaluateConditions(rule.conditions, event)) {
        // Execute actions
        await this.executeActions(rule, event);

        // Update rule statistics
        rule.triggerCount++;
        rule.lastTriggered = Date.now();

        this.emit('ruleTriggered', {
          ruleId: rule.id,
          ruleName: rule.name,
          eventId: event.id,
          triggerCount: rule.triggerCount
        });
      }
    }
  }

  private evaluateConditions(conditions: ComplianceCondition[], event: ComplianceEvent): boolean {
    for (const condition of conditions) {
      if (!this.evaluateCondition(condition, event)) {
        return false;
      }
    }
    return true;
  }

  private evaluateCondition(condition: ComplianceCondition, event: ComplianceEvent): boolean {
    const fieldValue = this.getFieldValue(event, condition.field);

    switch (condition.operator) {
      case 'eq':
        return fieldValue === condition.value;
      case 'ne':
        return fieldValue !== condition.value;
      case 'gt':
        return fieldValue > condition.value;
      case 'lt':
        return fieldValue < condition.value;
      case 'gte':
        return fieldValue >= condition.value;
      case 'lte':
        return fieldValue <= condition.value;
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      case 'contains':
        return String(fieldValue).includes(String(condition.value));
      case 'regex':
        return new RegExp(condition.value).test(String(fieldValue));
      default:
        return false;
    }
  }

  private getFieldValue(event: ComplianceEvent, field: string): any {
    const fields = field.split('.');
    let value: any = event;

    for (const f of fields) {
      value = value?.[f];
    }

    return value;
  }

  private async executeActions(rule: ComplianceRule, event: ComplianceEvent): Promise<void> {
    for (const action of rule.actions) {
      try {
        if (action.delay) {
          setTimeout(() => this.executeAction(action, rule, event), action.delay);
        } else {
          await this.executeAction(action, rule, event);
        }
      } catch (error) {
        this.emit('actionExecutionError', {
          ruleId: rule.id,
          action: action.type,
          error: error instanceof Error ? error.message : String(error)
        });
      }
    }
  }

  private async executeAction(action: ComplianceAction, rule: ComplianceRule, event: ComplianceEvent): Promise<void> {
    switch (action.type) {
      case 'alert':
        await this.createAlert(rule, event, action.parameters);
        break;
      case 'log':
        console.log(`[COMPLIANCE] ${rule.name}: ${event.description}`);
        break;
      case 'block':
        this.emit('blockRequired', {
          eventId: event.id,
          duration: action.parameters.duration,
          reason: rule.name
        });
        break;
      case 'quarantine':
        this.emit('quarantineRequired', {
          eventId: event.id,
          restrictions: action.parameters.restrictions,
          reason: rule.name
        });
        break;
      case 'remediate':
        this.emit('remediationRequired', {
          eventId: event.id,
          action: action.parameters.action,
          automated: action.parameters.automated || false
        });
        break;
      case 'escalate':
        await this.escalateAlert(rule, event, action.parameters);
        break;
    }
  }

  private async createAlert(rule: ComplianceRule, event: ComplianceEvent, parameters: any): Promise<void> {
    const alert: ComplianceAlert = {
      id: this.generateAlertId(),
      event,
      alertLevel: parameters.severity || 'warning',
      recipients: parameters.recipients || ['compliance-team'],
      channels: parameters.channels || ['email'],
      acknowledged: false,
      resolved: false,
      escalated: false,
      escalationLevel: 0,
      metadata: {
        ruleId: rule.id,
        ruleName: rule.name,
        ...parameters
      }
    };

    this.alerts.set(alert.id, alert);

    this.emit('alertCreated', alert);
  }

  private async escalateAlert(rule: ComplianceRule, event: ComplianceEvent, parameters: any): Promise<void> {
    // Find existing alert for this event
    const existingAlert = Array.from(this.alerts.values())
      .find(a => a.event.id === event.id);

    if (existingAlert) {
      existingAlert.escalated = true;
      existingAlert.escalationLevel++;

      this.emit('alertEscalated', {
        alertId: existingAlert.id,
        escalationLevel: existingAlert.escalationLevel,
        escalatedTo: parameters.escalatedTo
      });
    }
  }

  private updateMetrics(event: ComplianceEvent): void {
    // Update violation count
    const violationCountKey = `${event.framework}-violations`;
    const violationMetric = this.metrics.get(violationCountKey);

    if (violationMetric && this.isViolationEvent(event)) {
      violationMetric.value++;
      violationMetric.lastUpdated = Date.now();
      violationMetric.historical.push({
        timestamp: Date.now(),
        value: violationMetric.value
      });
    }

    // Update compliance score
    this.updateComplianceScore(event.framework);
  }

  private updateComplianceScore(framework: ComplianceFramework): void {
    const scoreKey = `${framework}-compliance-score`;
    const scoreMetric = this.metrics.get(scoreKey);

    if (!scoreMetric) return;

    const frameworkEvents = this.events.filter(e => e.framework === framework);
    const violations = frameworkEvents.filter(e => this.isViolationEvent(e)).length;

    const score = frameworkEvents.length > 0
      ? ((frameworkEvents.length - violations) / frameworkEvents.length) * 100
      : 100;

    scoreMetric.value = score;
    scoreMetric.lastUpdated = Date.now();
    scoreMetric.historical.push({
      timestamp: Date.now(),
      value: score
    });

    // Keep only last 100 historical values
    if (scoreMetric.historical.length > 100) {
      scoreMetric.historical = scoreMetric.historical.slice(-100);
    }
  }

  private isViolationEvent(event: ComplianceEvent): boolean {
    return [
      ComplianceEventType.VIOLATION_DETECTED,
      ComplianceEventType.ACCESS_VIOLATION,
      ComplianceEventType.DATA_BREACH,
      ComplianceEventType.RETENTION_VIOLATION,
      ComplianceEventType.ENCRYPTION_FAILURE
    ].includes(event.type);
  }

  private checkAccessControls(userId: string, accessControls: string[]): boolean {
    // Simplified implementation - would integrate with actual RBAC system
    return true;
  }

  private generateTrends(events: ComplianceEvent[], timeRange?: { from: number; to: number }): Array<{ date: string; events: number; violations: number }> {
    const trends: Array<{ date: string; events: number; violations: number }> = [];
    const now = Date.now();
    const days = 30;

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now - (i * 24 * 60 * 60 * 1000));
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
      const dayEnd = dayStart + (24 * 60 * 60 * 1000);

      const dayEvents = events.filter(e => e.timestamp >= dayStart && e.timestamp < dayEnd);
      const dayViolations = dayEvents.filter(e => this.isViolationEvent(e));

      trends.push({
        date: date.toISOString().split('T')[0],
        events: dayEvents.length,
        violations: dayViolations.length
      });
    }

    return trends;
  }

  private startEventProcessing(): void {
    // This would integrate with actual monitoring systems
    setInterval(() => {
      if (this.monitoring) {
        this.performPeriodicChecks();
      }
    }, 60000); // Every minute
  }

  private startMetricsCollection(): void {
    setInterval(() => {
      if (this.monitoring) {
        this.collectMetrics();
      }
    }, 300000); // Every 5 minutes
  }

  private startAlertProcessing(): void {
    setInterval(() => {
      if (this.monitoring) {
        this.processAlerts();
      }
    }, 30000); // Every 30 seconds
  }

  private performPeriodicChecks(): void {
    // Check for overdue assessments, certificate expiries, etc.
    this.emit('periodicCheckCompleted', { timestamp: Date.now() });
  }

  private collectMetrics(): void {
    // Update all metrics with current values
    for (const metric of this.metrics.values()) {
      this.updateMetricValue(metric);
    }
  }

  private updateMetricValue(metric: ComplianceMetric): void {
    // Implementation would depend on metric type
    // This is a placeholder
  }

  private processAlerts(): void {
    // Check for alerts that need escalation
    const unacknowledgedAlerts = Array.from(this.alerts.values())
      .filter(a => !a.acknowledged && Date.now() - a.event.timestamp > 300000); // 5 minutes

    for (const alert of unacknowledgedAlerts) {
      if (!alert.escalated) {
        this.emit('alertEscalationRequired', {
          alertId: alert.id,
          unacknowledgedDuration: Date.now() - alert.event.timestamp
        });
      }
    }
  }

  private generateEventId(): string {
    return `evt_${  createHash('sha256').update(Date.now() + Math.random().toString()).digest('hex').substring(0, 16)}`;
  }

  private generateRuleId(): string {
    return `rule_${  createHash('sha256').update(Date.now() + Math.random().toString()).digest('hex').substring(0, 16)}`;
  }

  private generatePolicyId(): string {
    return `pol_${  createHash('sha256').update(Date.now() + Math.random().toString()).digest('hex').substring(0, 16)}`;
  }

  private generateAlertId(): string {
    return `alert_${  createHash('sha256').update(Date.now() + Math.random().toString()).digest('hex').substring(0, 16)}`;
  }
}
