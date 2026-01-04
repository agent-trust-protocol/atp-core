import { EventEmitter } from 'events';

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ErrorCategory {
  VALIDATION = 'validation',
  EXECUTION = 'execution',
  NETWORK = 'network',
  DATABASE = 'database',
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  CONFIGURATION = 'configuration',
  RESOURCE = 'resource',
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown'
}

export interface WorkflowError {
  id: string;
  timestamp: Date;
  severity: ErrorSeverity;
  category: ErrorCategory;
  message: string;
  details?: any;
  stack?: string;
  context?: {
    workflowId?: string;
    executionId?: string;
    nodeId?: string;
    userId?: string;
    requestId?: string;
  };
  metadata?: Record<string, any>;
  recoverable: boolean;
  retryable: boolean;
  suggestions?: string[];
}

export interface ErrorHandlerConfig {
  enableLogging: boolean;
  enableNotifications: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  maxRetries: number;
  retryDelay: number;
  escalationRules: {
    criticalTimeout: number;
    highTimeout: number;
    mediumTimeout: number;
  };
  notificationChannels: string[];
  sensitiveDataMasking: boolean;
}

export class WorkflowErrorHandler extends EventEmitter {
  private errors: Map<string, WorkflowError> = new Map();
  private config: ErrorHandlerConfig;
  private retryAttempts: Map<string, number> = new Map();

  constructor(config: Partial<ErrorHandlerConfig> = {}) {
    super();
    this.config = {
      enableLogging: true,
      enableNotifications: true,
      logLevel: 'error',
      maxRetries: 3,
      retryDelay: 1000,
      escalationRules: {
        criticalTimeout: 300000, // 5 minutes
        highTimeout: 900000,     // 15 minutes
        mediumTimeout: 3600000   // 1 hour
      },
      notificationChannels: ['console', 'log'],
      sensitiveDataMasking: true,
      ...config
    };
  }

  createError(options: {
    message: string;
    severity?: ErrorSeverity;
    category?: ErrorCategory;
    details?: any;
    context?: WorkflowError['context'];
    originalError?: Error;
    recoverable?: boolean;
    retryable?: boolean;
    suggestions?: string[];
  }): WorkflowError {
    const errorId = `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const workflowError: WorkflowError = {
      id: errorId,
      timestamp: new Date(),
      severity: options.severity || ErrorSeverity.MEDIUM,
      category: options.category || ErrorCategory.UNKNOWN,
      message: options.message,
      details: this.maskSensitiveData(options.details),
      stack: options.originalError?.stack,
      context: options.context,
      recoverable: options.recoverable !== false,
      retryable: options.retryable !== false,
      suggestions: options.suggestions || this.generateSuggestions(options.category, options.message)
    };

    this.errors.set(errorId, workflowError);
    this.handleError(workflowError);
    
    return workflowError;
  }

  handleError(error: WorkflowError): void {
    if (this.config.enableLogging) {
      this.logError(error);
    }

    if (this.config.enableNotifications) {
      this.notifyError(error);
    }

    this.emit('error', error);

    // Handle retries for retryable errors
    if (error.retryable && this.shouldRetry(error)) {
      this.scheduleRetry(error);
    }

    // Escalate critical errors
    if (error.severity === ErrorSeverity.CRITICAL) {
      this.escalateError(error);
    }
  }

  private logError(error: WorkflowError): void {
    const logMessage = this.formatErrorMessage(error);
    
    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
      case ErrorSeverity.HIGH:
        console.error(logMessage);
        break;
      case ErrorSeverity.MEDIUM:
        if (this.config.logLevel === 'warn' || this.config.logLevel === 'info' || this.config.logLevel === 'debug') {
          console.warn(logMessage);
        }
        break;
      case ErrorSeverity.LOW:
        if (this.config.logLevel === 'info' || this.config.logLevel === 'debug') {
          console.info(logMessage);
        }
        break;
    }
  }

  private formatErrorMessage(error: WorkflowError): string {
    const contextStr = error.context ? 
      ` [${Object.entries(error.context).map(([k, v]) => `${k}=${v}`).join(', ')}]` : '';
    
    return `[${error.severity.toUpperCase()}] ${error.category}: ${error.message}${contextStr}`;
  }

  private notifyError(error: WorkflowError): void {
    for (const channel of this.config.notificationChannels) {
      switch (channel) {
        case 'console':
          // Already handled in logError
          break;
        case 'email':
          this.sendEmailNotification(error);
          break;
        case 'slack':
          this.sendSlackNotification(error);
          break;
        case 'webhook':
          this.sendWebhookNotification(error);
          break;
      }
    }
  }

  private sendEmailNotification(error: WorkflowError): void {
    // Implementation would depend on email service
    console.log(`Email notification for error: ${error.id}`);
    this.emit('notification:email', error);
  }

  private sendSlackNotification(error: WorkflowError): void {
    // Implementation would depend on Slack API
    console.log(`Slack notification for error: ${error.id}`);
    this.emit('notification:slack', error);
  }

  private sendWebhookNotification(error: WorkflowError): void {
    // Implementation would depend on webhook configuration
    console.log(`Webhook notification for error: ${error.id}`);
    this.emit('notification:webhook', error);
  }

  private shouldRetry(error: WorkflowError): boolean {
    const attempts = this.retryAttempts.get(error.id) || 0;
    return attempts < this.config.maxRetries && error.retryable;
  }

  private scheduleRetry(error: WorkflowError): void {
    const attempts = this.retryAttempts.get(error.id) || 0;
    const delay = this.config.retryDelay * Math.pow(2, attempts); // Exponential backoff
    
    setTimeout(() => {
      this.retryAttempts.set(error.id, attempts + 1);
      console.log(`Retrying operation for error ${error.id} (attempt ${attempts + 1}/${this.config.maxRetries})`);
      this.emit('retry', error, attempts + 1);
    }, delay);
  }

  private escalateError(error: WorkflowError): void {
    console.error(`CRITICAL ERROR ESCALATION: ${error.message}`);
    this.emit('escalation', error);
    
    // Immediate notification for critical errors
    this.sendImmediateNotification(error);
  }

  private sendImmediateNotification(error: WorkflowError): void {
    // Implementation for immediate critical error notifications
    console.log(`IMMEDIATE NOTIFICATION: Critical error ${error.id} requires attention`);
    this.emit('notification:immediate', error);
  }

  private maskSensitiveData(data: any): any {
    if (!this.config.sensitiveDataMasking || !data) {
      return data;
    }

    if (typeof data === 'string') {
      return this.maskSensitiveString(data);
    }

    if (Array.isArray(data)) {
      return data.map(item => this.maskSensitiveData(item));
    }

    if (typeof data === 'object') {
      const masked: any = {};
      for (const [key, value] of Object.entries(data)) {
        if (this.isSensitiveKey(key)) {
          masked[key] = '***MASKED***';
        } else {
          masked[key] = this.maskSensitiveData(value);
        }
      }
      return masked;
    }

    return data;
  }

  private isSensitiveKey(key: string): boolean {
    const sensitiveKeys = [
      'password', 'token', 'secret', 'key', 'apikey', 'api_key',
      'credential', 'auth', 'authorization', 'session', 'cookie'
    ];
    return sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive));
  }

  private maskSensitiveString(str: string): string {
    // Mask potential API keys, tokens, etc.
    return str.replace(/\b[A-Za-z0-9]{20,}\b/g, '***MASKED***');
  }

  private generateSuggestions(category?: ErrorCategory, message?: string): string[] {
    const suggestions: string[] = [];

    switch (category) {
      case ErrorCategory.VALIDATION:
        suggestions.push('Check input parameters and their types');
        suggestions.push('Verify required fields are provided');
        suggestions.push('Review validation rules and constraints');
        break;
      
      case ErrorCategory.EXECUTION:
        suggestions.push('Check workflow node configuration');
        suggestions.push('Verify all required inputs are available');
        suggestions.push('Review node dependencies and execution order');
        break;
      
      case ErrorCategory.NETWORK:
        suggestions.push('Check network connectivity');
        suggestions.push('Verify service endpoints are accessible');
        suggestions.push('Review firewall and proxy settings');
        break;
      
      case ErrorCategory.DATABASE:
        suggestions.push('Check database connection and credentials');
        suggestions.push('Verify database schema and permissions');
        suggestions.push('Review query syntax and parameters');
        break;
      
      case ErrorCategory.AUTHENTICATION:
        suggestions.push('Verify authentication credentials');
        suggestions.push('Check token expiration and validity');
        suggestions.push('Review authentication configuration');
        break;
      
      case ErrorCategory.AUTHORIZATION:
        suggestions.push('Verify user permissions and roles');
        suggestions.push('Check resource access policies');
        suggestions.push('Review authorization configuration');
        break;
      
      case ErrorCategory.CONFIGURATION:
        suggestions.push('Check configuration file syntax');
        suggestions.push('Verify environment variables');
        suggestions.push('Review default configuration values');
        break;
      
      case ErrorCategory.RESOURCE:
        suggestions.push('Check available memory and CPU resources');
        suggestions.push('Review resource limits and quotas');
        suggestions.push('Monitor disk space and file descriptors');
        break;
      
      case ErrorCategory.TIMEOUT:
        suggestions.push('Increase timeout values if appropriate');
        suggestions.push('Check for slow operations or bottlenecks');
        suggestions.push('Review system performance and load');
        break;
    }

    // Add message-specific suggestions
    if (message?.toLowerCase().includes('connection')) {
      suggestions.push('Verify connection strings and network settings');
    }
    if (message?.toLowerCase().includes('permission')) {
      suggestions.push('Check file/directory permissions');
    }
    if (message?.toLowerCase().includes('memory')) {
      suggestions.push('Increase memory allocation or optimize usage');
    }

    return suggestions;
  }

  getError(errorId: string): WorkflowError | undefined {
    return this.errors.get(errorId);
  }

  getErrors(filter?: {
    severity?: ErrorSeverity;
    category?: ErrorCategory;
    workflowId?: string;
    executionId?: string;
    since?: Date;
  }): WorkflowError[] {
    let errors = Array.from(this.errors.values());

    if (filter) {
      if (filter.severity) {
        errors = errors.filter(e => e.severity === filter.severity);
      }
      if (filter.category) {
        errors = errors.filter(e => e.category === filter.category);
      }
      if (filter.workflowId) {
        errors = errors.filter(e => e.context?.workflowId === filter.workflowId);
      }
      if (filter.executionId) {
        errors = errors.filter(e => e.context?.executionId === filter.executionId);
      }
      if (filter.since) {
        errors = errors.filter(e => e.timestamp >= filter.since!);
      }
    }

    return errors.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  clearErrors(olderThan?: Date): void {
    if (olderThan) {
      for (const [id, error] of this.errors) {
        if (error.timestamp < olderThan) {
          this.errors.delete(id);
          this.retryAttempts.delete(id);
        }
      }
    } else {
      this.errors.clear();
      this.retryAttempts.clear();
    }
  }

  getStatistics(): {
    totalErrors: number;
    errorsBySeverity: Record<ErrorSeverity, number>;
    errorsByCategory: Record<ErrorCategory, number>;
    recentErrors: number;
    retryRate: number;
  } {
    const errors = Array.from(this.errors.values());
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    const recentErrors = errors.filter(e => e.timestamp >= oneHourAgo).length;
    const totalRetries = Array.from(this.retryAttempts.values()).reduce((sum, count) => sum + count, 0);
    const retryRate = errors.length > 0 ? totalRetries / errors.length : 0;

    const errorsBySeverity = Object.values(ErrorSeverity).reduce((acc, severity) => {
      acc[severity] = errors.filter(e => e.severity === severity).length;
      return acc;
    }, {} as Record<ErrorSeverity, number>);

    const errorsByCategory = Object.values(ErrorCategory).reduce((acc, category) => {
      acc[category] = errors.filter(e => e.category === category).length;
      return acc;
    }, {} as Record<ErrorCategory, number>);

    return {
      totalErrors: errors.length,
      errorsBySeverity,
      errorsByCategory,
      recentErrors,
      retryRate
    };
  }

  updateConfig(newConfig: Partial<ErrorHandlerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('Error handler configuration updated');
  }
}

// Utility functions for common error scenarios
export function createValidationError(message: string, context?: WorkflowError['context']): WorkflowError {
  return globalErrorHandler.createError({
    message,
    severity: ErrorSeverity.MEDIUM,
    category: ErrorCategory.VALIDATION,
    context,
    recoverable: true,
    retryable: false
  });
}

export function createExecutionError(message: string, context?: WorkflowError['context'], originalError?: Error): WorkflowError {
  return globalErrorHandler.createError({
    message,
    severity: ErrorSeverity.HIGH,
    category: ErrorCategory.EXECUTION,
    context,
    originalError,
    recoverable: true,
    retryable: true
  });
}

export function createNetworkError(message: string, context?: WorkflowError['context'], originalError?: Error): WorkflowError {
  return globalErrorHandler.createError({
    message,
    severity: ErrorSeverity.MEDIUM,
    category: ErrorCategory.NETWORK,
    context,
    originalError,
    recoverable: true,
    retryable: true
  });
}

export function createDatabaseError(message: string, context?: WorkflowError['context'], originalError?: Error): WorkflowError {
  return globalErrorHandler.createError({
    message,
    severity: ErrorSeverity.HIGH,
    category: ErrorCategory.DATABASE,
    context,
    originalError,
    recoverable: true,
    retryable: true
  });
}

export function createConfigurationError(message: string, context?: WorkflowError['context']): WorkflowError {
  return globalErrorHandler.createError({
    message,
    severity: ErrorSeverity.CRITICAL,
    category: ErrorCategory.CONFIGURATION,
    context,
    recoverable: false,
    retryable: false
  });
}

// Global error handler instance
export const globalErrorHandler = new WorkflowErrorHandler();