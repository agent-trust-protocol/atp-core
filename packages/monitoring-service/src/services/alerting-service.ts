/**
 * ATP™ Monitoring Service - Alerting System
 */

import { Alert, AlertRule, SystemMetrics } from '../types/metrics.js';
import { randomUUID } from 'crypto';

export class AlertingService {
  private alerts: Alert[] = [];
  private alertRules: AlertRule[] = [];

  constructor() {
    this.setupDefaultRules();
  }

  private setupDefaultRules() {
    // Default alert rules for ATP system
    this.alertRules = [
      {
        id: 'service-down',
        name: 'Service Down',
        service: '*',
        metric: 'status',
        condition: 'eq',
        threshold: 0, // 0 = offline
        enabled: true,
        notificationChannels: ['console', 'webhook']
      },
      {
        id: 'high-error-rate',
        name: 'High Error Rate',
        service: 'performance',
        metric: 'errorRate',
        condition: 'gt',
        threshold: 5.0, // 5% error rate
        enabled: true,
        notificationChannels: ['console']
      },
      {
        id: 'slow-response',
        name: 'Slow Response Time',
        service: 'performance',
        metric: 'avgResponseTime',
        condition: 'gt',
        threshold: 1000, // 1 second
        enabled: true,
        notificationChannels: ['console']
      },
      {
        id: 'failed-auth',
        name: 'High Failed Authentication Rate',
        service: 'security',
        metric: 'failedAuthentications',
        condition: 'gt',
        threshold: 10, // More than 10 failed auths
        enabled: true,
        notificationChannels: ['console', 'webhook']
      },
      {
        id: 'compromised-agent',
        name: 'Compromised Agent Detected',
        service: 'security',
        metric: 'compromisedAgents',
        condition: 'gt',
        threshold: 0, // Any compromised agent
        enabled: true,
        notificationChannels: ['console', 'webhook', 'email']
      }
    ];
  }

  async checkMetrics(metrics: SystemMetrics): Promise<void> {
    for (const rule of this.alertRules) {
      if (!rule.enabled) continue;

      await this.evaluateRule(rule, metrics);
    }
  }

  private async evaluateRule(rule: AlertRule, metrics: SystemMetrics): Promise<void> {
    try {
      let metricValue: number;
      let serviceName = rule.service;

      // Extract metric value based on rule
      if (rule.service === '*') {
        // Check all services for status
        for (const service of metrics.services) {
          const serviceValue = this.getServiceMetricValue(service, rule.metric);
          if (serviceValue !== null && this.meetsCondition(serviceValue, rule.condition, rule.threshold)) {
            await this.createAlert(rule, serviceValue, service.name, metrics);
          }
        }
        return;
      } else if (rule.service === 'performance') {
        metricValue = this.getPerformanceMetricValue(metrics.performance, rule.metric) ?? 0;
      } else if (rule.service === 'security') {
        metricValue = this.getSecurityMetricValue(metrics.security, rule.metric) ?? 0;
      } else if (rule.service === 'business') {
        metricValue = this.getBusinessMetricValue(metrics.business, rule.metric) ?? 0;
      } else {
        // Specific service check
        const service = metrics.services.find(s => s.name.toLowerCase().includes(rule.service.toLowerCase()));
        if (service) {
          metricValue = this.getServiceMetricValue(service, rule.metric) ?? 0;
          serviceName = service.name;
        } else {
          return; // Service not found
        }
      }

      if (metricValue !== null && this.meetsCondition(metricValue, rule.condition, rule.threshold)) {
        await this.createAlert(rule, metricValue, serviceName, metrics);
      }
    } catch (error) {
      console.error(`Failed to evaluate alert rule ${rule.name}:`, error);
    }
  }

  private getServiceMetricValue(service: any, metric: string): number | null {
    switch (metric) {
      case 'status':
        return service.status === 'online' ? 1 : service.status === 'degraded' ? 0.5 : 0;
      case 'responseTime':
        return service.responseTime;
      case 'uptime':
        return service.uptime;
      default:
        return null;
    }
  }

  private getPerformanceMetricValue(performance: any, metric: string): number | null {
    return performance[metric] || null;
  }

  private getSecurityMetricValue(security: any, metric: string): number | null {
    return security[metric] || null;
  }

  private getBusinessMetricValue(business: any, metric: string): number | null {
    return business[metric] || null;
  }

  private meetsCondition(value: number, condition: string, threshold: number): boolean {
    switch (condition) {
      case 'gt': return value > threshold;
      case 'lt': return value < threshold;
      case 'eq': return value === threshold;
      case 'ne': return value !== threshold;
      default: return false;
    }
  }

  private async createAlert(rule: AlertRule, value: number, serviceName: string, metrics: SystemMetrics): Promise<void> {
    // Check if we already have a recent alert for this rule and service
    const recentAlert = this.alerts.find(alert => 
      alert.service === serviceName &&
      alert.details.ruleId === rule.id &&
      !alert.resolved &&
      (Date.now() - new Date(alert.timestamp).getTime()) < 5 * 60 * 1000 // 5 minutes
    );

    if (recentAlert) {
      return; // Don't spam alerts
    }

    const alert: Alert = {
      id: randomUUID(),
      timestamp: new Date().toISOString(),
      level: this.getAlertLevel(rule, value),
      service: serviceName,
      message: this.generateAlertMessage(rule, value, serviceName),
      details: {
        ruleId: rule.id,
        ruleName: rule.name,
        metric: rule.metric,
        value,
        threshold: rule.threshold,
        condition: rule.condition,
        metrics: this.sanitizeMetricsForAlert(metrics)
      },
      resolved: false
    };

    this.alerts.push(alert);

    // Send notifications
    await this.sendNotifications(alert, rule.notificationChannels);

    console.log(`🚨 ALERT: ${alert.level.toUpperCase()} - ${alert.message}`);
  }

  private getAlertLevel(rule: AlertRule, value: number): 'info' | 'warning' | 'error' | 'critical' {
    if (rule.id === 'compromised-agent' || rule.id === 'service-down') {
      return 'critical';
    }
    if (rule.id === 'failed-auth' || rule.id === 'high-error-rate') {
      return 'error';
    }
    if (rule.id === 'slow-response') {
      return 'warning';
    }
    return 'info';
  }

  private generateAlertMessage(rule: AlertRule, value: number, serviceName: string): string {
    switch (rule.id) {
      case 'service-down':
        return `${serviceName} is offline`;
      case 'high-error-rate':
        return `High error rate detected: ${value.toFixed(2)}% (threshold: ${rule.threshold}%)`;
      case 'slow-response':
        return `Slow response time: ${value}ms (threshold: ${rule.threshold}ms)`;
      case 'failed-auth':
        return `High failed authentication rate: ${value} attempts (threshold: ${rule.threshold})`;
      case 'compromised-agent':
        return `🚨 SECURITY ALERT: ${value} compromised agent(s) detected`;
      default:
        return `${rule.name}: ${rule.metric} is ${value} (threshold: ${rule.threshold})`;
    }
  }

  private sanitizeMetricsForAlert(metrics: SystemMetrics): any {
    // Return only essential metrics to avoid huge alert payloads
    return {
      timestamp: metrics.timestamp,
      servicesOnline: metrics.services.filter(s => s.status === 'online').length,
      totalServices: metrics.services.length,
      errorRate: metrics.performance.errorRate,
      avgResponseTime: metrics.performance.avgResponseTime
    };
  }

  private async sendNotifications(alert: Alert, channels: string[]): Promise<void> {
    for (const channel of channels) {
      try {
        switch (channel) {
          case 'console':
            // Already logged above
            break;
          case 'webhook':
            await this.sendWebhookNotification(alert);
            break;
          case 'email':
            await this.sendEmailNotification(alert);
            break;
          default:
            console.warn(`Unknown notification channel: ${channel}`);
        }
      } catch (error) {
        console.error(`Failed to send notification via ${channel}:`, error);
      }
    }
  }

  private async sendWebhookNotification(alert: Alert): Promise<void> {
    const webhookUrl = process.env.ATP_ALERT_WEBHOOK_URL;
    if (!webhookUrl) {
      console.warn('No webhook URL configured for alerts');
      return;
    }

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          alert,
          source: 'ATP™ Monitoring Service',
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) {
        throw new Error(`Webhook responded with ${response.status}`);
      }
    } catch (error) {
      console.error('Webhook notification failed:', error);
    }
  }

  private async sendEmailNotification(alert: Alert): Promise<void> {
    // Email notification would be implemented here
    // For now, just log that we would send an email
    console.log(`📧 Would send email notification for: ${alert.message}`);
  }

  async getAlerts(options: { resolved?: boolean; limit?: number } = {}): Promise<Alert[]> {
    let filteredAlerts = this.alerts;

    if (options.resolved !== undefined) {
      filteredAlerts = filteredAlerts.filter(alert => alert.resolved === options.resolved);
    }

    // Sort by timestamp, newest first
    filteredAlerts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    if (options.limit) {
      filteredAlerts = filteredAlerts.slice(0, options.limit);
    }

    return filteredAlerts;
  }

  async resolveAlert(alertId: string): Promise<Alert | null> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) {
      return null;
    }

    alert.resolved = true;
    alert.resolvedAt = new Date().toISOString();

    console.log(`✓ Alert resolved: ${alert.message}`);
    return alert;
  }
}