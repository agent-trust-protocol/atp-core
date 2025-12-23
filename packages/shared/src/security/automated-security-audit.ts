/**
 * Automated Security Audit System
 * Continuous security monitoring and vulnerability detection
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

export enum AuditSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info'
}

export enum AuditCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  DATA_EXPOSURE = 'data_exposure',
  INJECTION = 'injection',
  CONFIGURATION = 'configuration',
  CRYPTOGRAPHY = 'cryptography',
  SESSION = 'session',
  RATE_LIMITING = 'rate_limiting',
  DEPENDENCY = 'dependency',
  CODE_QUALITY = 'code_quality'
}

export interface AuditFinding {
  id: string;
  timestamp: Date;
  severity: AuditSeverity;
  category: AuditCategory;
  title: string;
  description: string;
  affected: string[];
  recommendation: string;
  metadata?: Record<string, any>;
  automated?: boolean;
  falsePositive?: boolean;
}

export interface AuditReport {
  id: string;
  timestamp: Date;
  duration: number;
  findings: AuditFinding[];
  statistics: {
    total: number;
    bySeverity: Record<AuditSeverity, number>;
    byCategory: Record<AuditCategory, number>;
    newFindings: number;
    resolvedFindings: number;
  };
  score: number; // 0-100 security score
}

/**
 * Security audit rules
 */
export class SecurityAuditRules {
  /**
   * Authentication audit rules
   */
  static authenticationRules = [
    {
      id: 'auth-001',
      name: 'Weak Password Policy',
      check: async (context: any): Promise<AuditFinding | null> => {
        // Check password policy configuration
        const minLength = context.config?.password?.minLength || 0;
        if (minLength < 12) {
          return {
            id: crypto.randomUUID(),
            timestamp: new Date(),
            severity: AuditSeverity.HIGH,
            category: AuditCategory.AUTHENTICATION,
            title: 'Weak Password Policy Detected',
            description: `Password minimum length is ${minLength}, should be at least 12`,
            affected: ['Authentication System'],
            recommendation: 'Increase minimum password length to 12+ characters',
            automated: true
          };
        }
        return null;
      }
    },
    {
      id: 'auth-002',
      name: 'Missing MFA',
      check: async (context: any): Promise<AuditFinding | null> => {
        if (!context.config?.mfa?.enabled) {
          return {
            id: crypto.randomUUID(),
            timestamp: new Date(),
            severity: AuditSeverity.HIGH,
            category: AuditCategory.AUTHENTICATION,
            title: 'Multi-Factor Authentication Not Enabled',
            description: 'MFA is not enabled for user accounts',
            affected: ['User Authentication'],
            recommendation: 'Enable MFA for all user accounts, especially admin accounts',
            automated: true
          };
        }
        return null;
      }
    },
    {
      id: 'auth-003',
      name: 'Session Timeout',
      check: async (context: any): Promise<AuditFinding | null> => {
        const timeout = context.config?.session?.timeout || Infinity;
        if (timeout > 3600000) { // 1 hour
          return {
            id: crypto.randomUUID(),
            timestamp: new Date(),
            severity: AuditSeverity.MEDIUM,
            category: AuditCategory.SESSION,
            title: 'Excessive Session Timeout',
            description: `Session timeout is ${timeout/60000} minutes, should be 60 minutes or less`,
            affected: ['Session Management'],
            recommendation: 'Reduce session timeout to 60 minutes or less',
            automated: true
          };
        }
        return null;
      }
    }
  ];

  /**
   * Authorization audit rules
   */
  static authorizationRules = [
    {
      id: 'authz-001',
      name: 'Overly Permissive Roles',
      check: async (context: any): Promise<AuditFinding | null> => {
        const roles = context.roles || [];
        const overlyPermissive = roles.filter((role: any) => 
          role.permissions?.length > 20 && !role.isSystem
        );
        
        if (overlyPermissive.length > 0) {
          return {
            id: crypto.randomUUID(),
            timestamp: new Date(),
            severity: AuditSeverity.MEDIUM,
            category: AuditCategory.AUTHORIZATION,
            title: 'Overly Permissive Custom Roles Detected',
            description: `${overlyPermissive.length} custom roles have excessive permissions`,
            affected: overlyPermissive.map((r: any) => r.name),
            recommendation: 'Review and reduce permissions for custom roles following principle of least privilege',
            automated: true
          };
        }
        return null;
      }
    },
    {
      id: 'authz-002',
      name: 'Missing RBAC Implementation',
      check: async (context: any): Promise<AuditFinding | null> => {
        const endpoints = context.endpoints || [];
        const unprotected = endpoints.filter((ep: any) => 
          !ep.authentication && !ep.public && ep.method !== 'GET'
        );
        
        if (unprotected.length > 0) {
          return {
            id: crypto.randomUUID(),
            timestamp: new Date(),
            severity: AuditSeverity.CRITICAL,
            category: AuditCategory.AUTHORIZATION,
            title: 'Unprotected API Endpoints',
            description: `${unprotected.length} API endpoints lack authentication`,
            affected: unprotected.map((ep: any) => `${ep.method} ${ep.path}`),
            recommendation: 'Implement authentication for all non-public endpoints',
            automated: true
          };
        }
        return null;
      }
    }
  ];

  /**
   * Data exposure audit rules
   */
  static dataExposureRules = [
    {
      id: 'data-001',
      name: 'Sensitive Data in Logs',
      check: async (context: any): Promise<AuditFinding | null> => {
        const logPatterns = [
          /password["\s:=]+["']?[^"'\s]+/gi,
          /api[_-]?key["\s:=]+["']?[^"'\s]+/gi,
          /secret["\s:=]+["']?[^"'\s]+/gi,
          /token["\s:=]+["']?[^"'\s]+/gi
        ];
        
        const matches: string[] = [];
        for (const log of (context.logs || [])) {
          for (const pattern of logPatterns) {
            if (pattern.test(log)) {
              matches.push(log.substring(0, 100));
            }
          }
        }
        
        if (matches.length > 0) {
          return {
            id: crypto.randomUUID(),
            timestamp: new Date(),
            severity: AuditSeverity.CRITICAL,
            category: AuditCategory.DATA_EXPOSURE,
            title: 'Sensitive Data Found in Logs',
            description: `${matches.length} instances of potential sensitive data in logs`,
            affected: ['Logging System'],
            recommendation: 'Implement log sanitization to remove sensitive data before logging',
            metadata: { samples: matches.slice(0, 3) },
            automated: true
          };
        }
        return null;
      }
    },
    {
      id: 'data-002',
      name: 'Unencrypted Sensitive Data',
      check: async (context: any): Promise<AuditFinding | null> => {
        const unencrypted = context.database?.tables?.filter((table: any) => 
          table.sensitive && !table.encrypted
        ) || [];
        
        if (unencrypted.length > 0) {
          return {
            id: crypto.randomUUID(),
            timestamp: new Date(),
            severity: AuditSeverity.HIGH,
            category: AuditCategory.CRYPTOGRAPHY,
            title: 'Unencrypted Sensitive Data at Rest',
            description: `${unencrypted.length} database tables contain unencrypted sensitive data`,
            affected: unencrypted.map((t: any) => t.name),
            recommendation: 'Implement encryption at rest for all sensitive data',
            automated: true
          };
        }
        return null;
      }
    }
  ];

  /**
   * Configuration audit rules
   */
  static configurationRules = [
    {
      id: 'config-001',
      name: 'Debug Mode in Production',
      check: async (context: any): Promise<AuditFinding | null> => {
        if (context.env === 'production' && context.config?.debug) {
          return {
            id: crypto.randomUUID(),
            timestamp: new Date(),
            severity: AuditSeverity.HIGH,
            category: AuditCategory.CONFIGURATION,
            title: 'Debug Mode Enabled in Production',
            description: 'Debug mode is enabled in production environment',
            affected: ['Application Configuration'],
            recommendation: 'Disable debug mode in production',
            automated: true
          };
        }
        return null;
      }
    },
    {
      id: 'config-002',
      name: 'Default Credentials',
      check: async (context: any): Promise<AuditFinding | null> => {
        const defaultCreds = [
          'admin/admin',
          'admin/password',
          'root/root',
          'test/test'
        ];
        
        const found = context.users?.filter((user: any) => 
          defaultCreds.some(cred => {
            const [username, password] = cred.split('/');
            return user.username === username && user.hasDefaultPassword;
          })
        ) || [];
        
        if (found.length > 0) {
          return {
            id: crypto.randomUUID(),
            timestamp: new Date(),
            severity: AuditSeverity.CRITICAL,
            category: AuditCategory.CONFIGURATION,
            title: 'Default Credentials Detected',
            description: `${found.length} accounts using default credentials`,
            affected: found.map((u: any) => u.username),
            recommendation: 'Force password change for all default accounts',
            automated: true
          };
        }
        return null;
      }
    }
  ];
}

/**
 * Automated Security Audit System
 */
export class SecurityAuditSystem extends EventEmitter {
  private findings: Map<string, AuditFinding> = new Map();
  private reports: AuditReport[] = [];
  private running: boolean = false;
  private auditInterval: NodeJS.Timeout | null = null;

  constructor(
    private config: {
      enabled: boolean;
      intervalMs: number;
      outputPath: string;
      notificationWebhook?: string;
      severityThreshold: AuditSeverity;
    }
  ) {
    super();
  }

  /**
   * Start automated security audits
   */
  async start(): Promise<void> {
    if (!this.config.enabled) {
      console.log('Security audit system is disabled');
      return;
    }

    if (this.running) {
      console.log('Security audit system is already running');
      return;
    }

    this.running = true;
    console.log('Starting automated security audit system');

    // Run initial audit
    await this.runAudit();

    // Schedule periodic audits
    this.auditInterval = setInterval(async () => {
      await this.runAudit();
    }, this.config.intervalMs);

    this.emit('started');
  }

  /**
   * Stop automated security audits
   */
  async stop(): Promise<void> {
    if (!this.running) {
      return;
    }

    this.running = false;

    if (this.auditInterval) {
      clearInterval(this.auditInterval);
      this.auditInterval = null;
    }

    console.log('Stopped automated security audit system');
    this.emit('stopped');
  }

  /**
   * Run a security audit
   */
  async runAudit(context?: any): Promise<AuditReport> {
    const startTime = Date.now();
    const auditId = crypto.randomUUID();
    const findings: AuditFinding[] = [];

    console.log(`Starting security audit ${auditId}`);

    // Prepare audit context
    const auditContext = context || await this.gatherContext();

    // Run all audit rules
    const allRules = [
      ...SecurityAuditRules.authenticationRules,
      ...SecurityAuditRules.authorizationRules,
      ...SecurityAuditRules.dataExposureRules,
      ...SecurityAuditRules.configurationRules
    ];

    for (const rule of allRules) {
      try {
        const finding = await rule.check(auditContext);
        if (finding) {
          findings.push(finding);
          this.findings.set(finding.id, finding);
          
          // Emit high severity findings immediately
          if (this.getSeverityLevel(finding.severity) >= this.getSeverityLevel(this.config.severityThreshold)) {
            this.emit('finding', finding);
            await this.notifyFinding(finding);
          }
        }
      } catch (error) {
        console.error(`Error running audit rule ${rule.id}:`, error);
      }
    }

    // Calculate statistics
    const statistics = this.calculateStatistics(findings);

    // Calculate security score
    const score = this.calculateSecurityScore(findings);

    // Create report
    const report: AuditReport = {
      id: auditId,
      timestamp: new Date(),
      duration: Date.now() - startTime,
      findings,
      statistics,
      score
    };

    // Save report
    await this.saveReport(report);
    this.reports.push(report);

    // Emit report
    this.emit('report', report);

    console.log(`Security audit ${auditId} completed: ${findings.length} findings, score: ${score}/100`);

    return report;
  }

  /**
   * Gather context for audit
   */
  private async gatherContext(): Promise<any> {
    // This would gather real system information
    // For now, returning mock data
    return {
      env: process.env.NODE_ENV,
      config: {
        password: { minLength: 8 },
        mfa: { enabled: false },
        session: { timeout: 7200000 },
        debug: process.env.DEBUG === 'true'
      },
      roles: [],
      endpoints: [],
      logs: [],
      database: { tables: [] },
      users: []
    };
  }

  /**
   * Calculate statistics
   */
  private calculateStatistics(findings: AuditFinding[]): AuditReport['statistics'] {
    const bySeverity: Record<AuditSeverity, number> = {
      [AuditSeverity.CRITICAL]: 0,
      [AuditSeverity.HIGH]: 0,
      [AuditSeverity.MEDIUM]: 0,
      [AuditSeverity.LOW]: 0,
      [AuditSeverity.INFO]: 0
    };

    const byCategory: Record<string, number> = {};

    for (const finding of findings) {
      bySeverity[finding.severity]++;
      byCategory[finding.category] = (byCategory[finding.category] || 0) + 1;
    }

    return {
      total: findings.length,
      bySeverity,
      byCategory: byCategory as Record<AuditCategory, number>,
      newFindings: findings.filter(f => !f.falsePositive).length,
      resolvedFindings: 0
    };
  }

  /**
   * Calculate security score
   */
  private calculateSecurityScore(findings: AuditFinding[]): number {
    const weights = {
      [AuditSeverity.CRITICAL]: 25,
      [AuditSeverity.HIGH]: 15,
      [AuditSeverity.MEDIUM]: 10,
      [AuditSeverity.LOW]: 5,
      [AuditSeverity.INFO]: 2
    };

    let totalPenalty = 0;
    for (const finding of findings) {
      if (!finding.falsePositive) {
        totalPenalty += weights[finding.severity];
      }
    }

    return Math.max(0, 100 - totalPenalty);
  }

  /**
   * Get severity level
   */
  private getSeverityLevel(severity: AuditSeverity): number {
    const levels = {
      [AuditSeverity.CRITICAL]: 5,
      [AuditSeverity.HIGH]: 4,
      [AuditSeverity.MEDIUM]: 3,
      [AuditSeverity.LOW]: 2,
      [AuditSeverity.INFO]: 1
    };
    return levels[severity];
  }

  /**
   * Save report to file
   */
  private async saveReport(report: AuditReport): Promise<void> {
    try {
      const reportPath = path.join(
        this.config.outputPath,
        `audit-${report.timestamp.toISOString().split('T')[0]}.json`
      );
      
      await fs.mkdir(this.config.outputPath, { recursive: true });
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    } catch (error) {
      console.error('Failed to save audit report:', error);
    }
  }

  /**
   * Notify about finding
   */
  private async notifyFinding(finding: AuditFinding): Promise<void> {
    if (!this.config.notificationWebhook) return;

    try {
      // Send webhook notification
      const response = await fetch(this.config.notificationWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'security_finding',
          severity: finding.severity,
          finding
        })
      });

      if (!response.ok) {
        console.error('Failed to send notification:', response.statusText);
      }
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  /**
   * Get latest report
   */
  getLatestReport(): AuditReport | null {
    return this.reports[this.reports.length - 1] || null;
  }

  /**
   * Get all findings
   */
  getFindings(filter?: { severity?: AuditSeverity; category?: AuditCategory }): AuditFinding[] {
    let findings = Array.from(this.findings.values());
    
    if (filter?.severity) {
      findings = findings.filter(f => f.severity === filter.severity);
    }
    
    if (filter?.category) {
      findings = findings.filter(f => f.category === filter.category);
    }
    
    return findings;
  }

  /**
   * Mark finding as false positive
   */
  markFalsePositive(findingId: string): void {
    const finding = this.findings.get(findingId);
    if (finding) {
      finding.falsePositive = true;
    }
  }
}

// Export singleton instance
export const securityAuditSystem = new SecurityAuditSystem({
  enabled: true,
  intervalMs: 3600000, // 1 hour
  outputPath: './security-audits',
  severityThreshold: AuditSeverity.MEDIUM
});

export default SecurityAuditSystem;