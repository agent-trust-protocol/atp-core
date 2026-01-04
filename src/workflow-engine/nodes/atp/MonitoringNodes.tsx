import { 
  NodeExecutor, 
  NodeDefinition, 
  NodeInput, 
  NodeOutput,
  WorkflowExecutionContext 
} from '../../types/WorkflowTypes';

export const metricThresholdExecutor: NodeExecutor = {
  type: 'metric-threshold-trigger',
  async execute(inputs: any, config: any, context: WorkflowExecutionContext) {
    console.log('[Metric Threshold Trigger] Monitoring metrics...');
    
    const metricName = inputs.metricName || config.metricName;
    const threshold = inputs.threshold || config.threshold;
    const operator = inputs.operator || config.operator || 'gt';
    const windowSize = inputs.windowSize || config.windowSize || 300;
    
    if (!metricName || threshold === undefined) {
      throw new Error('Metric name and threshold are required');
    }
    
    const currentValue = 85 + Math.random() * 30 - 15;
    const avgValue = 75;
    const maxValue = 95;
    const minValue = 65;
    
    let triggered: boolean;
    switch (operator) {
      case 'gt':
        triggered = currentValue > threshold;
        break;
      case 'gte':
        triggered = currentValue >= threshold;
        break;
      case 'lt':
        triggered = currentValue < threshold;
        break;
      case 'lte':
        triggered = currentValue <= threshold;
        break;
      case 'eq':
        triggered = Math.abs(currentValue - threshold) < 0.1;
        break;
      default:
        triggered = currentValue > threshold;
    }
    
    const metricEvent = {
      metricName: metricName,
      currentValue: currentValue,
      threshold: threshold,
      operator: operator,
      triggered: triggered,
      statistics: {
        average: avgValue,
        max: maxValue,
        min: minValue,
        samples: Math.floor(windowSize / 10)
      },
      windowSize: windowSize,
      unit: 'percent',
      timestamp: new Date(),
      source: 'monitoring-system'
    };
    
    return {
      triggered: triggered,
      metric: metricEvent,
      alert: triggered && (currentValue > 90 || currentValue < 10),
      metadata: {
        executionId: context.executionId,
        timestamp: new Date()
      }
    };
  },
  
  validate(config: any) {
    if (!config.metricName || !config.threshold) {
      return false;
    }
    const validOperators = ['gt', 'gte', 'lt', 'lte', 'eq'];
    if (config.operator && !validOperators.includes(config.operator)) {
      return false;
    }
    return true;
  },
  
  getSchema() {
    return {
      inputs: [
        {
          name: 'metricName',
          type: 'string',
          required: true,
          description: 'Name of the metric to monitor'
        },
        {
          name: 'threshold',
          type: 'number',
          required: true,
          description: 'Threshold value'
        },
        {
          name: 'operator',
          type: 'string',
          required: false,
          description: 'Comparison operator',
          default: 'gt',
          validation: {
            enum: ['gt', 'gte', 'lt', 'lte', 'eq']
          }
        },
        {
          name: 'windowSize',
          type: 'number',
          required: false,
          description: 'Time window in seconds',
          default: 300
        }
      ],
      outputs: [
        {
          name: 'metric',
          type: 'object',
          description: 'Metric event details'
        },
        {
          name: 'alert',
          type: 'boolean',
          description: 'Whether to raise an alert'
        }
      ]
    };
  }
};

export const securityAlertExecutor: NodeExecutor = {
  type: 'security-alert-trigger',
  async execute(inputs: any, config: any, context: WorkflowExecutionContext) {
    console.log('[Security Alert Trigger] Monitoring security events...');
    
    const alertTypes = inputs.alertTypes || config.alertTypes || ['intrusion', 'authentication', 'authorization', 'data'];
    const severityLevel = inputs.severityLevel || config.severityLevel || 'medium';
    
    const securityAlert = {
      alertId: `sec-${Date.now()}`,
      type: 'authentication',
      severity: 'high',
      title: 'Multiple Failed Authentication Attempts',
      description: 'Detected 15 failed authentication attempts from the same IP address within 5 minutes',
      source: {
        ip: '192.168.1.100',
        location: 'San Francisco, CA',
        userAgent: 'Mozilla/5.0'
      },
      affectedResources: [
        { type: 'api_endpoint', name: '/api/auth/login' },
        { type: 'agent', did: 'did:atp:agent-suspect-001' }
      ],
      indicators: [
        'Rapid succession of requests',
        'Invalid credentials used',
        'Pattern matches brute force attack'
      ],
      recommendedActions: [
        'Block IP address temporarily',
        'Enable rate limiting',
        'Require CAPTCHA verification',
        'Alert security team'
      ],
      timestamp: new Date(),
      ttl: 3600
    };
    
    const severityValues = { low: 1, medium: 2, high: 3, critical: 4 };
    const alertSeverityValue = severityValues[securityAlert.severity as keyof typeof severityValues];
    const thresholdSeverityValue = severityValues[severityLevel as keyof typeof severityValues];
    
    const triggered = alertSeverityValue >= thresholdSeverityValue && alertTypes.includes(securityAlert.type);
    
    return {
      triggered: triggered,
      alert: securityAlert,
      requiresImmediateResponse: securityAlert.severity === 'critical' || securityAlert.severity === 'high',
      metadata: {
        executionId: context.executionId,
        timestamp: new Date()
      }
    };
  },
  
  validate(config: any) {
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    if (config.severityLevel && !validSeverities.includes(config.severityLevel)) {
      return false;
    }
    return true;
  },
  
  getSchema() {
    return {
      inputs: [
        {
          name: 'alertTypes',
          type: 'array',
          required: false,
          description: 'Types of security alerts to monitor',
          default: ['intrusion', 'authentication', 'authorization', 'data']
        },
        {
          name: 'severityLevel',
          type: 'string',
          required: false,
          description: 'Minimum severity to trigger',
          default: 'medium',
          validation: {
            enum: ['low', 'medium', 'high', 'critical']
          }
        }
      ],
      outputs: [
        {
          name: 'alert',
          type: 'object',
          description: 'Security alert details'
        },
        {
          name: 'requiresImmediateResponse',
          type: 'boolean',
          description: 'Whether immediate response is needed'
        }
      ]
    };
  }
};

export const generateReportExecutor: NodeExecutor = {
  type: 'generate-report',
  async execute(inputs: any, config: any, context: WorkflowExecutionContext) {
    console.log('[Generate Report] Creating report...');
    
    const reportType = inputs.reportType || config.reportType || 'compliance';
    const period = inputs.period || config.period || { start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), end: new Date() };
    const format = inputs.format || config.format || 'json';
    const includeMetrics = inputs.includeMetrics || config.includeMetrics || ['trust', 'compliance', 'security', 'performance'];
    
    const report = {
      reportId: `report-${Date.now()}`,
      type: reportType,
      title: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`,
      period: period,
      generatedAt: new Date(),
      generatedBy: context.user?.id || 'system',
      format: format,
      summary: {
        totalAgents: 142,
        activeAgents: 128,
        totalPolicies: 23,
        activePolicies: 21,
        complianceScore: 0.94,
        averageTrustLevel: 0.76
      },
      metrics: {
        trust: {
          average: 0.76,
          min: 0.45,
          max: 0.98,
          trend: 'increasing'
        },
        compliance: {
          score: 0.94,
          violations: 3,
          resolved: 2,
          pending: 1
        },
        security: {
          incidents: 5,
          resolved: 4,
          severity: 'low',
          lastIncident: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        },
        performance: {
          avgResponseTime: 234,
          uptime: 99.97,
          throughput: 1250,
          errors: 12
        }
      },
      recommendations: [
        'Review and update policies for agents with trust level below 0.5',
        'Implement additional monitoring for high-risk activities',
        'Schedule security audit for next quarter'
      ],
      exportUrl: `/api/reports/${reportType}/${Date.now()}.${format}`
    };
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      report: report,
      message: `${reportType} report generated successfully`
    };
  },
  
  validate(config: any) {
    const validTypes = ['compliance', 'security', 'performance', 'audit', 'executive'];
    const validFormats = ['json', 'pdf', 'csv', 'html'];
    
    if (config.reportType && !validTypes.includes(config.reportType)) {
      return false;
    }
    if (config.format && !validFormats.includes(config.format)) {
      return false;
    }
    return true;
  },
  
  getSchema() {
    return {
      inputs: [
        {
          name: 'reportType',
          type: 'string',
          required: false,
          description: 'Type of report to generate',
          default: 'compliance',
          validation: {
            enum: ['compliance', 'security', 'performance', 'audit', 'executive']
          }
        },
        {
          name: 'period',
          type: 'object',
          required: false,
          description: 'Report period'
        },
        {
          name: 'format',
          type: 'string',
          required: false,
          description: 'Report format',
          default: 'json',
          validation: {
            enum: ['json', 'pdf', 'csv', 'html']
          }
        },
        {
          name: 'includeMetrics',
          type: 'array',
          required: false,
          description: 'Metrics to include in report'
        }
      ],
      outputs: [
        {
          name: 'report',
          type: 'object',
          description: 'Generated report'
        },
        {
          name: 'success',
          type: 'boolean',
          description: 'Operation success status'
        }
      ]
    };
  }
};

export const sendAlertExecutor: NodeExecutor = {
  type: 'send-alert',
  async execute(inputs: any, config: any, context: WorkflowExecutionContext) {
    console.log('[Send Alert] Sending notification...');
    
    const alertTitle = inputs.title || config.title || 'System Alert';
    const alertMessage = inputs.message || config.message || 'An event requiring attention has occurred';
    const severity = inputs.severity || config.severity || 'medium';
    const channels = inputs.channels || config.channels || ['email'];
    const recipients = inputs.recipients || config.recipients || [];
    
    const notifications = channels.map((channel: string) => ({
      channel: channel,
      status: 'sent',
      sentAt: new Date(),
      recipients: channel === 'email' ? recipients : [],
      messageId: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }));
    
    const alert = {
      alertId: `alert-${Date.now()}`,
      title: alertTitle,
      message: alertMessage,
      severity: severity,
      source: 'workflow-engine',
      workflowId: context.workflowId,
      executionId: context.executionId,
      createdAt: new Date(),
      notifications: notifications,
      metadata: {
        triggeredBy: context.user?.id || 'system',
        environment: 'production'
      }
    };
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      alert: alert,
      notificationsSent: notifications.length,
      message: `Alert sent via ${channels.join(', ')}`
    };
  },
  
  validate(config: any) {
    const validSeverities = ['low', 'medium', 'high', 'critical'];
    const validChannels = ['email', 'sms', 'slack', 'webhook', 'dashboard'];
    
    if (config.severity && !validSeverities.includes(config.severity)) {
      return false;
    }
    if (config.channels) {
      for (const channel of config.channels) {
        if (!validChannels.includes(channel)) {
          return false;
        }
      }
    }
    return true;
  },
  
  getSchema() {
    return {
      inputs: [
        {
          name: 'title',
          type: 'string',
          required: false,
          description: 'Alert title',
          default: 'System Alert'
        },
        {
          name: 'message',
          type: 'string',
          required: true,
          description: 'Alert message'
        },
        {
          name: 'severity',
          type: 'string',
          required: false,
          description: 'Alert severity',
          default: 'medium',
          validation: {
            enum: ['low', 'medium', 'high', 'critical']
          }
        },
        {
          name: 'channels',
          type: 'array',
          required: false,
          description: 'Notification channels',
          default: ['email']
        },
        {
          name: 'recipients',
          type: 'array',
          required: false,
          description: 'Alert recipients'
        }
      ],
      outputs: [
        {
          name: 'alert',
          type: 'object',
          description: 'Alert details'
        },
        {
          name: 'notificationsSent',
          type: 'number',
          description: 'Number of notifications sent'
        }
      ]
    };
  }
};

export const complianceStatusConditionExecutor: NodeExecutor = {
  type: 'compliance-status',
  async execute(inputs: any, config: any, context: WorkflowExecutionContext) {
    console.log('[Compliance Status Condition] Checking compliance...');
    
    const complianceType = inputs.complianceType || config.complianceType || 'general';
    const requiredScore = inputs.requiredScore || config.requiredScore || 0.8;
    const checkPeriod = inputs.checkPeriod || config.checkPeriod || 30;
    
    const complianceCheck = {
      type: complianceType,
      score: 0.75 + Math.random() * 0.25,
      isCompliant: false,
      period: checkPeriod,
      checkedAt: new Date(),
      details: {
        policiesChecked: 23,
        policiesCompliant: 21,
        violations: 2,
        warnings: 5
      },
      categories: {
        dataProtection: 0.95,
        accessControl: 0.88,
        auditLogging: 0.92,
        encryption: 0.85
      },
      nonCompliantItems: [],
      recommendations: []
    };
    
    complianceCheck.isCompliant = complianceCheck.score >= requiredScore;
    
    if (!complianceCheck.isCompliant) {
      complianceCheck.nonCompliantItems = [
        'Encryption key rotation overdue',
        'Access logs retention below requirement'
      ];
      complianceCheck.recommendations = [
        'Schedule immediate key rotation',
        'Extend log retention to 90 days',
        'Review access control policies'
      ];
    }
    
    return complianceCheck;
  },
  
  validate(config: any) {
    if (config.requiredScore && (config.requiredScore < 0 || config.requiredScore > 1)) {
      return false;
    }
    if (config.checkPeriod && config.checkPeriod < 1) {
      return false;
    }
    return true;
  },
  
  getSchema() {
    return {
      inputs: [
        {
          name: 'complianceType',
          type: 'string',
          required: false,
          description: 'Type of compliance to check',
          default: 'general'
        },
        {
          name: 'requiredScore',
          type: 'number',
          required: false,
          description: 'Required compliance score (0-1)',
          default: 0.8,
          validation: {
            min: 0,
            max: 1
          }
        },
        {
          name: 'checkPeriod',
          type: 'number',
          required: false,
          description: 'Check period in days',
          default: 30
        }
      ],
      outputs: [
        {
          name: 'isCompliant',
          type: 'boolean',
          description: 'Whether system is compliant'
        },
        {
          name: 'score',
          type: 'number',
          description: 'Compliance score'
        },
        {
          name: 'nonCompliantItems',
          type: 'array',
          description: 'List of non-compliant items'
        },
        {
          name: 'recommendations',
          type: 'array',
          description: 'Compliance recommendations'
        }
      ]
    };
  }
};

export const performanceMetricsConditionExecutor: NodeExecutor = {
  type: 'performance-metrics',
  async execute(inputs: any, config: any, context: WorkflowExecutionContext) {
    console.log('[Performance Metrics Condition] Evaluating performance...');
    
    const metricType = inputs.metricType || config.metricType || 'response_time';
    const threshold = inputs.threshold || config.threshold;
    const aggregation = inputs.aggregation || config.aggregation || 'average';
    const windowMinutes = inputs.windowMinutes || config.windowMinutes || 5;
    
    const metrics = {
      response_time: {
        average: 234,
        p50: 180,
        p95: 450,
        p99: 890,
        max: 1250
      },
      throughput: {
        average: 1250,
        current: 1180,
        peak: 1890
      },
      error_rate: {
        average: 0.02,
        current: 0.015,
        threshold: 0.05
      },
      cpu_usage: {
        average: 65,
        current: 72,
        max: 95
      },
      memory_usage: {
        average: 78,
        current: 81,
        max: 92
      }
    };
    
    const selectedMetric = metrics[metricType as keyof typeof metrics] || metrics.response_time;
    const value = selectedMetric[aggregation as keyof typeof selectedMetric] || selectedMetric.average;
    
    const performanceCheck = {
      meetsThreshold: threshold ? value <= threshold : true,
      metricType: metricType,
      currentValue: value,
      threshold: threshold,
      aggregation: aggregation,
      window: windowMinutes,
      trend: Math.random() > 0.5 ? 'improving' : 'degrading',
      status: value <= (threshold || Infinity) ? 'healthy' : 'degraded',
      recommendations: value > (threshold || Infinity) ? [
        'Scale up resources',
        'Optimize database queries',
        'Enable caching',
        'Review recent deployments'
      ] : [],
      evaluatedAt: new Date()
    };
    
    return performanceCheck;
  },
  
  validate(config: any) {
    const validMetrics = ['response_time', 'throughput', 'error_rate', 'cpu_usage', 'memory_usage'];
    const validAggregations = ['average', 'current', 'max', 'min', 'p50', 'p95', 'p99'];
    
    if (config.metricType && !validMetrics.includes(config.metricType)) {
      return false;
    }
    if (config.aggregation && !validAggregations.includes(config.aggregation)) {
      return false;
    }
    return true;
  },
  
  getSchema() {
    return {
      inputs: [
        {
          name: 'metricType',
          type: 'string',
          required: false,
          description: 'Performance metric to check',
          default: 'response_time',
          validation: {
            enum: ['response_time', 'throughput', 'error_rate', 'cpu_usage', 'memory_usage']
          }
        },
        {
          name: 'threshold',
          type: 'number',
          required: false,
          description: 'Performance threshold'
        },
        {
          name: 'aggregation',
          type: 'string',
          required: false,
          description: 'Aggregation method',
          default: 'average',
          validation: {
            enum: ['average', 'current', 'max', 'min', 'p50', 'p95', 'p99']
          }
        },
        {
          name: 'windowMinutes',
          type: 'number',
          required: false,
          description: 'Time window in minutes',
          default: 5
        }
      ],
      outputs: [
        {
          name: 'meetsThreshold',
          type: 'boolean',
          description: 'Whether threshold is met'
        },
        {
          name: 'currentValue',
          type: 'number',
          description: 'Current metric value'
        },
        {
          name: 'status',
          type: 'string',
          description: 'Performance status'
        },
        {
          name: 'recommendations',
          type: 'array',
          description: 'Performance recommendations'
        }
      ]
    };
  }
};

export const monitoringNodeDefinitions: NodeDefinition[] = [
  {
    type: 'metric-threshold-trigger',
    category: 'trigger',
    label: 'Metric Threshold',
    description: 'Triggers when metric crosses threshold',
    icon: '📈',
    color: '#06b6d4',
    inputs: metricThresholdExecutor.getSchema!().inputs,
    outputs: metricThresholdExecutor.getSchema!().outputs,
    executor: metricThresholdExecutor
  },
  {
    type: 'security-alert-trigger',
    category: 'trigger',
    label: 'Security Alert',
    description: 'Triggers on security events',
    icon: '🚨',
    color: '#dc2626',
    inputs: securityAlertExecutor.getSchema!().inputs,
    outputs: securityAlertExecutor.getSchema!().outputs,
    executor: securityAlertExecutor
  },
  {
    type: 'generate-report',
    category: 'action',
    label: 'Generate Report',
    description: 'Generate compliance or audit report',
    icon: '📊',
    color: '#3b82f6',
    inputs: generateReportExecutor.getSchema!().inputs,
    outputs: generateReportExecutor.getSchema!().outputs,
    executor: generateReportExecutor
  },
  {
    type: 'send-alert',
    category: 'action',
    label: 'Send Alert',
    description: 'Send notification alert',
    icon: '📧',
    color: '#3b82f6',
    inputs: sendAlertExecutor.getSchema!().inputs,
    outputs: sendAlertExecutor.getSchema!().outputs,
    executor: sendAlertExecutor
  },
  {
    type: 'compliance-status',
    category: 'condition',
    label: 'Compliance Status',
    description: 'Check compliance status',
    icon: '✔️',
    color: '#eab308',
    inputs: complianceStatusConditionExecutor.getSchema!().inputs,
    outputs: complianceStatusConditionExecutor.getSchema!().outputs,
    executor: complianceStatusConditionExecutor
  },
  {
    type: 'performance-metrics',
    category: 'condition',
    label: 'Performance Metrics',
    description: 'Check performance metrics',
    icon: '⚡',
    color: '#eab308',
    inputs: performanceMetricsConditionExecutor.getSchema!().inputs,
    outputs: performanceMetricsConditionExecutor.getSchema!().outputs,
    executor: performanceMetricsConditionExecutor
  }
];