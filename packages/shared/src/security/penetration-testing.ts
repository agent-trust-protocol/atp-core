/**
 * Automated Penetration Testing Framework
 * Comprehensive security testing and vulnerability assessment
 */

import { EventEmitter } from 'events';
import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';

export enum TestSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info'
}

export enum TestCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  INJECTION = 'injection',
  CRYPTOGRAPHY = 'cryptography',
  SESSION = 'session',
  BUSINESS_LOGIC = 'business_logic',
  INPUT_VALIDATION = 'input_validation',
  ERROR_HANDLING = 'error_handling',
  INFORMATION_DISCLOSURE = 'information_disclosure',
  DENIAL_OF_SERVICE = 'denial_of_service'
}

export interface PenTestResult {
  id: string;
  testName: string;
  category: TestCategory;
  severity: TestSeverity;
  status: 'pass' | 'fail' | 'warning';
  description: string;
  details: string;
  affected: string[];
  recommendation: string;
  evidence?: {
    request?: string;
    response?: string;
    payload?: string;
    screenshots?: string[];
  };
  timestamp: Date;
  duration: number;
}

export interface PenTestReport {
  id: string;
  timestamp: Date;
  duration: number;
  target: string;
  scope: string[];
  results: PenTestResult[];
  statistics: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
    bySeverity: Record<TestSeverity, number>;
    byCategory: Record<TestCategory, number>;
  };
  riskScore: number; // 0-100
  executive: {
    critical: string[];
    recommendations: string[];
    nextSteps: string[];
  };
}

/**
 * Base class for penetration test modules
 */
export abstract class PenTestModule {
  abstract name: string;
  abstract category: TestCategory;
  abstract description: string;

  abstract run(target: string, context: any): Promise<PenTestResult[]>;

  protected createResult(
    testName: string,
    severity: TestSeverity,
    status: 'pass' | 'fail' | 'warning',
    description: string,
    details: string,
    affected: string[] = [],
    recommendation: string = '',
    evidence?: PenTestResult['evidence'],
    startTime: number = Date.now()
  ): PenTestResult {
    return {
      id: crypto.randomUUID(),
      testName,
      category: this.category,
      severity,
      status,
      description,
      details,
      affected,
      recommendation,
      evidence,
      timestamp: new Date(),
      duration: Date.now() - startTime
    };
  }

  protected async makeRequest(
    url: string,
    options: {
      method?: string;
      headers?: Record<string, string>;
      body?: string;
      timeout?: number;
      allowInsecure?: boolean;
    } = {}
  ): Promise<{
    status: number;
    headers: Record<string, string>;
    body: string;
    duration: number;
    error?: string;
  }> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers: options.headers || {},
        body: options.body,
        signal: AbortSignal.timeout(options.timeout || 10000)
      });

      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      return {
        status: response.status,
        headers,
        body: await response.text(),
        duration: Date.now() - startTime
      };
    } catch (error: any) {
      return {
        status: 0,
        headers: {},
        body: '',
        duration: Date.now() - startTime,
        error: error.message
      };
    }
  }
}

/**
 * Authentication Testing Module
 */
export class AuthenticationTests extends PenTestModule {
  name = 'Authentication Security Tests';
  category = TestCategory.AUTHENTICATION;
  description = 'Tests authentication mechanisms for common vulnerabilities';

  async run(target: string, context: any): Promise<PenTestResult[]> {
    const results: PenTestResult[] = [];

    // Test 1: Brute Force Protection
    results.push(await this.testBruteForceProtection(target));

    // Test 2: Password Policy
    results.push(await this.testPasswordPolicy(target));

    // Test 3: Session Management
    results.push(await this.testSessionManagement(target));

    // Test 4: Default Credentials
    results.push(await this.testDefaultCredentials(target));

    // Test 5: Authentication Bypass
    results.push(await this.testAuthBypass(target));

    return results.filter(Boolean);
  }

  private async testBruteForceProtection(target: string): Promise<PenTestResult> {
    const startTime = Date.now();
    const testName = 'Brute Force Protection';
    
    const attempts = 10;
    let blockedAfter = -1;
    let lastResponse: any;

    for (let i = 0; i < attempts; i++) {
      lastResponse = await this.makeRequest(`${target}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'admin',
          password: `invalid-password-${i}`
        })
      });

      if (lastResponse.status === 429) {
        blockedAfter = i + 1;
        break;
      }
    }

    if (blockedAfter > 0 && blockedAfter <= 5) {
      return this.createResult(
        testName,
        TestSeverity.INFO,
        'pass',
        'Brute force protection is active',
        `Account blocked after ${blockedAfter} attempts`,
        ['Authentication System'],
        'Continue monitoring brute force protection effectiveness',
        {
          request: `POST ${target}/api/auth/login`,
          response: `Status: ${lastResponse.status}, Blocked after ${blockedAfter} attempts`
        },
        startTime
      );
    } else if (blockedAfter > 5) {
      return this.createResult(
        testName,
        TestSeverity.MEDIUM,
        'warning',
        'Weak brute force protection',
        `Too many attempts allowed before blocking (${blockedAfter})`,
        ['Authentication System'],
        'Reduce the number of allowed failed attempts to 3-5',
        undefined,
        startTime
      );
    } else {
      return this.createResult(
        testName,
        TestSeverity.HIGH,
        'fail',
        'No brute force protection detected',
        `${attempts} failed login attempts were allowed without blocking`,
        ['Authentication System'],
        'Implement rate limiting and account lockout after 3-5 failed attempts',
        undefined,
        startTime
      );
    }
  }

  private async testPasswordPolicy(target: string): Promise<PenTestResult> {
    const startTime = Date.now();
    const testName = 'Password Policy Enforcement';

    // Test weak passwords
    const weakPasswords = ['123456', 'password', 'admin', '12345678'];
    const results: { password: string; accepted: boolean }[] = [];

    for (const password of weakPasswords) {
      const response = await this.makeRequest(`${target}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: `test-${Date.now()}`,
          password,
          email: `test-${Date.now()}@example.com`
        })
      });

      results.push({
        password,
        accepted: response.status < 400
      });
    }

    const acceptedWeak = results.filter(r => r.accepted);

    if (acceptedWeak.length === 0) {
      return this.createResult(
        testName,
        TestSeverity.INFO,
        'pass',
        'Strong password policy enforced',
        'All weak passwords were rejected',
        ['Registration System'],
        'Continue enforcing strong password policies',
        undefined,
        startTime
      );
    } else {
      return this.createResult(
        testName,
        TestSeverity.HIGH,
        'fail',
        'Weak password policy',
        `${acceptedWeak.length} weak passwords were accepted`,
        ['Registration System'],
        'Implement stronger password requirements (12+ chars, complexity)',
        {
          payload: acceptedWeak.map(p => p.password).join(', ')
        },
        startTime
      );
    }
  }

  private async testSessionManagement(target: string): Promise<PenTestResult> {
    const startTime = Date.now();
    const testName = 'Session Management Security';

    // Test session fixation
    const response1 = await this.makeRequest(`${target}/api/auth/status`);
    const sessionId1 = this.extractSessionId(response1.headers);

    const response2 = await this.makeRequest(`${target}/api/auth/login`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': sessionId1 ? `session=${sessionId1}` : ''
      },
      body: JSON.stringify({
        username: 'test',
        password: 'test'
      })
    });

    const sessionId2 = this.extractSessionId(response2.headers);

    if (sessionId1 && sessionId2 && sessionId1 === sessionId2) {
      return this.createResult(
        testName,
        TestSeverity.MEDIUM,
        'fail',
        'Session fixation vulnerability',
        'Session ID not regenerated after login',
        ['Session Management'],
        'Regenerate session IDs after successful authentication',
        undefined,
        startTime
      );
    } else {
      return this.createResult(
        testName,
        TestSeverity.INFO,
        'pass',
        'Session management appears secure',
        'Session ID properly regenerated or no session fixation detected',
        ['Session Management'],
        'Continue monitoring session management practices',
        undefined,
        startTime
      );
    }
  }

  private async testDefaultCredentials(target: string): Promise<PenTestResult> {
    const startTime = Date.now();
    const testName = 'Default Credentials Test';

    const defaultCreds = [
      { username: 'admin', password: 'admin' },
      { username: 'admin', password: 'password' },
      { username: 'root', password: 'root' },
      { username: 'admin', password: '123456' },
      { username: 'admin', password: '' }
    ];

    const successful: string[] = [];

    for (const cred of defaultCreds) {
      const response = await this.makeRequest(`${target}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cred)
      });

      if (response.status === 200) {
        successful.push(`${cred.username}/${cred.password}`);
      }
    }

    if (successful.length > 0) {
      return this.createResult(
        testName,
        TestSeverity.CRITICAL,
        'fail',
        'Default credentials found',
        `${successful.length} default credential combinations work`,
        ['Authentication System'],
        'Change all default credentials immediately',
        {
          payload: successful.join(', ')
        },
        startTime
      );
    } else {
      return this.createResult(
        testName,
        TestSeverity.INFO,
        'pass',
        'No default credentials detected',
        'Common default credential combinations failed',
        ['Authentication System'],
        'Continue avoiding default credentials',
        undefined,
        startTime
      );
    }
  }

  private async testAuthBypass(target: string): Promise<PenTestResult> {
    const startTime = Date.now();
    const testName = 'Authentication Bypass';

    // Test various bypass techniques
    const bypasses = [
      { method: 'SQL Injection', payload: { username: "admin' OR '1'='1", password: 'anything' } },
      { method: 'NoSQL Injection', payload: { username: { '$ne': null }, password: { '$ne': null } } },
      { method: 'Header Injection', headers: { 'X-User': 'admin', 'X-Authenticated': 'true' } },
      { method: 'Parameter Pollution', payload: { username: 'admin', password: 'wrong', admin: 'true' } }
    ];

    const successful: string[] = [];

    for (const bypass of bypasses) {
      const response = await this.makeRequest(`${target}/api/auth/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(bypass.headers || {})
        },
        body: JSON.stringify(bypass.payload || {})
      });

      if (response.status === 200) {
        successful.push(bypass.method);
      }
    }

    if (successful.length > 0) {
      return this.createResult(
        testName,
        TestSeverity.CRITICAL,
        'fail',
        'Authentication bypass vulnerability',
        `Authentication bypassed using: ${successful.join(', ')}`,
        ['Authentication System'],
        'Implement proper input validation and parameterized queries',
        undefined,
        startTime
      );
    } else {
      return this.createResult(
        testName,
        TestSeverity.INFO,
        'pass',
        'No authentication bypass detected',
        'Common bypass techniques failed',
        ['Authentication System'],
        'Continue implementing secure authentication practices',
        undefined,
        startTime
      );
    }
  }

  private extractSessionId(headers: Record<string, string>): string | null {
    const setCookie = headers['set-cookie'] || headers['Set-Cookie'];
    if (!setCookie) return null;

    const match = setCookie.match(/session=([^;]+)/);
    return match ? match[1] : null;
  }
}

/**
 * Authorization Testing Module
 */
export class AuthorizationTests extends PenTestModule {
  name = 'Authorization Security Tests';
  category = TestCategory.AUTHORIZATION;
  description = 'Tests authorization mechanisms for privilege escalation and access control bypasses';

  async run(target: string, context: any): Promise<PenTestResult[]> {
    const results: PenTestResult[] = [];

    // Test 1: Privilege Escalation
    results.push(await this.testPrivilegeEscalation(target));

    // Test 2: Insecure Direct Object References
    results.push(await this.testIDOR(target));

    // Test 3: Missing Function Level Access Control
    results.push(await this.testFunctionLevelAccess(target));

    // Test 4: Path Traversal
    results.push(await this.testPathTraversal(target));

    return results.filter(Boolean);
  }

  private async testPrivilegeEscalation(target: string): Promise<PenTestResult> {
    const startTime = Date.now();
    const testName = 'Privilege Escalation';

    // Test admin endpoint access without proper permissions
    const adminEndpoints = [
      '/api/admin/users',
      '/api/admin/config',
      '/api/admin/system',
      '/api/users',
      '/dashboard/admin'
    ];

    const accessible: string[] = [];

    for (const endpoint of adminEndpoints) {
      const response = await this.makeRequest(`${target}${endpoint}`);
      
      // If we get data instead of 401/403, it might be accessible
      if (response.status === 200) {
        accessible.push(endpoint);
      }
    }

    if (accessible.length > 0) {
      return this.createResult(
        testName,
        TestSeverity.HIGH,
        'fail',
        'Potential privilege escalation vulnerability',
        `${accessible.length} admin endpoints accessible without authentication`,
        accessible,
        'Implement proper authentication and authorization checks on all admin endpoints',
        undefined,
        startTime
      );
    } else {
      return this.createResult(
        testName,
        TestSeverity.INFO,
        'pass',
        'Admin endpoints properly protected',
        'All tested admin endpoints require proper authentication',
        ['Authorization System'],
        'Continue implementing proper access controls',
        undefined,
        startTime
      );
    }
  }

  private async testIDOR(target: string): Promise<PenTestResult> {
    const startTime = Date.now();
    const testName = 'Insecure Direct Object References (IDOR)';

    // Test access to other users' resources
    const resources = [
      '/api/users/1',
      '/api/users/2',
      '/api/policies/1',
      '/api/workflows/1',
      '/api/agents/1'
    ];

    const accessible: string[] = [];

    for (const resource of resources) {
      const response = await this.makeRequest(`${target}${resource}`);
      
      if (response.status === 200 && response.body.length > 10) {
        accessible.push(resource);
      }
    }

    if (accessible.length > 0) {
      return this.createResult(
        testName,
        TestSeverity.HIGH,
        'fail',
        'Insecure direct object references detected',
        `${accessible.length} resources accessible without proper authorization`,
        accessible,
        'Implement proper authorization checks to verify users can only access their own resources',
        undefined,
        startTime
      );
    } else {
      return this.createResult(
        testName,
        TestSeverity.INFO,
        'pass',
        'Object references appear secure',
        'Resources properly protected from unauthorized access',
        ['Authorization System'],
        'Continue implementing proper resource-level authorization',
        undefined,
        startTime
      );
    }
  }

  private async testFunctionLevelAccess(target: string): Promise<PenTestResult> {
    const startTime = Date.now();
    const testName = 'Function Level Access Control';

    // Test HTTP method bypass
    const endpoints = [
      { url: '/api/users', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
      { url: '/api/policies', methods: ['GET', 'POST', 'PUT', 'DELETE'] },
      { url: '/api/admin', methods: ['GET', 'POST', 'PUT', 'DELETE'] }
    ];

    const bypasses: string[] = [];

    for (const endpoint of endpoints) {
      for (const method of endpoint.methods) {
        const response = await this.makeRequest(`${target}${endpoint.url}`, {
          method
        });

        // Look for unexpected success or different behavior
        if (response.status === 200 && method !== 'GET') {
          bypasses.push(`${method} ${endpoint.url}`);
        }
      }
    }

    if (bypasses.length > 0) {
      return this.createResult(
        testName,
        TestSeverity.MEDIUM,
        'fail',
        'Missing function level access control',
        `${bypasses.length} endpoints allow unauthorized HTTP methods`,
        bypasses,
        'Implement method-specific authorization checks',
        undefined,
        startTime
      );
    } else {
      return this.createResult(
        testName,
        TestSeverity.INFO,
        'pass',
        'Function level access control appears adequate',
        'HTTP methods properly restricted',
        ['Authorization System'],
        'Continue implementing method-specific access controls',
        undefined,
        startTime
      );
    }
  }

  private async testPathTraversal(target: string): Promise<PenTestResult> {
    const startTime = Date.now();
    const testName = 'Path Traversal';

    const payloads = [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system.ini',
      '....//....//....//etc/passwd',
      '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd'
    ];

    const vulnerable: string[] = [];

    for (const payload of payloads) {
      const response = await this.makeRequest(`${target}/api/files/${payload}`);
      
      if (response.body.includes('root:') || response.body.includes('[fonts]')) {
        vulnerable.push(payload);
      }
    }

    if (vulnerable.length > 0) {
      return this.createResult(
        testName,
        TestSeverity.HIGH,
        'fail',
        'Path traversal vulnerability detected',
        'System files accessible through path traversal',
        ['File System Access'],
        'Implement proper input validation and sanitization for file paths',
        {
          payload: vulnerable[0]
        },
        startTime
      );
    } else {
      return this.createResult(
        testName,
        TestSeverity.INFO,
        'pass',
        'No path traversal vulnerability detected',
        'File access properly restricted',
        ['File System Access'],
        'Continue implementing secure file handling',
        undefined,
        startTime
      );
    }
  }
}

/**
 * Main Penetration Testing Framework
 */
export class PenetrationTestingFramework extends EventEmitter {
  private modules: Map<string, PenTestModule> = new Map();
  private reports: PenTestReport[] = [];

  constructor() {
    super();
    
    // Register default modules
    this.registerModule(new AuthenticationTests());
    this.registerModule(new AuthorizationTests());
  }

  /**
   * Register a test module
   */
  registerModule(module: PenTestModule): void {
    this.modules.set(module.name, module);
  }

  /**
   * Run penetration tests
   */
  async runTests(
    target: string,
    options: {
      scope?: string[];
      modules?: string[];
      context?: any;
      concurrent?: boolean;
    } = {}
  ): Promise<PenTestReport> {
    const startTime = Date.now();
    const reportId = crypto.randomUUID();

    console.log(`Starting penetration tests against ${target}`);

    // Determine which modules to run
    const modulesToRun = options.modules 
      ? options.modules.map(name => this.modules.get(name)).filter(Boolean) as PenTestModule[]
      : Array.from(this.modules.values());

    // Run tests
    const allResults: PenTestResult[] = [];

    if (options.concurrent) {
      // Run modules concurrently
      const promises = modulesToRun.map(module => module.run(target, options.context));
      const results = await Promise.all(promises);
      allResults.push(...results.flat());
    } else {
      // Run modules sequentially
      for (const module of modulesToRun) {
        console.log(`Running ${module.name}...`);
        const results = await module.run(target, options.context);
        allResults.push(...results);
        this.emit('moduleComplete', { module: module.name, results });
      }
    }

    // Calculate statistics
    const statistics = this.calculateStatistics(allResults);

    // Calculate risk score
    const riskScore = this.calculateRiskScore(allResults);

    // Generate executive summary
    const executive = this.generateExecutiveSummary(allResults);

    // Create report
    const report: PenTestReport = {
      id: reportId,
      timestamp: new Date(),
      duration: Date.now() - startTime,
      target,
      scope: options.scope || ['*'],
      results: allResults,
      statistics,
      riskScore,
      executive
    };

    // Save report
    this.reports.push(report);
    
    // Save to file
    await this.saveReport(report);

    // Emit events
    this.emit('reportComplete', report);

    console.log(`Penetration tests completed: ${allResults.length} tests, risk score: ${riskScore}/100`);

    return report;
  }

  /**
   * Calculate test statistics
   */
  private calculateStatistics(results: PenTestResult[]): PenTestReport['statistics'] {
    const bySeverity: Record<TestSeverity, number> = {
      [TestSeverity.CRITICAL]: 0,
      [TestSeverity.HIGH]: 0,
      [TestSeverity.MEDIUM]: 0,
      [TestSeverity.LOW]: 0,
      [TestSeverity.INFO]: 0
    };

    const byCategory: Record<string, number> = {};

    let passed = 0;
    let failed = 0;
    let warnings = 0;

    for (const result of results) {
      bySeverity[result.severity]++;
      byCategory[result.category] = (byCategory[result.category] || 0) + 1;
      
      switch (result.status) {
        case 'pass':
          passed++;
          break;
        case 'fail':
          failed++;
          break;
        case 'warning':
          warnings++;
          break;
      }
    }

    return {
      total: results.length,
      passed,
      failed,
      warnings,
      bySeverity,
      byCategory: byCategory as Record<TestCategory, number>
    };
  }

  /**
   * Calculate risk score (0-100, higher is riskier)
   */
  private calculateRiskScore(results: PenTestResult[]): number {
    const weights = {
      [TestSeverity.CRITICAL]: 25,
      [TestSeverity.HIGH]: 15,
      [TestSeverity.MEDIUM]: 10,
      [TestSeverity.LOW]: 5,
      [TestSeverity.INFO]: 1
    };

    let totalRisk = 0;
    for (const result of results) {
      if (result.status === 'fail') {
        totalRisk += weights[result.severity];
      } else if (result.status === 'warning') {
        totalRisk += weights[result.severity] * 0.5;
      }
    }

    return Math.min(100, totalRisk);
  }

  /**
   * Generate executive summary
   */
  private generateExecutiveSummary(results: PenTestResult[]): PenTestReport['executive'] {
    const critical = results
      .filter(r => r.severity === TestSeverity.CRITICAL && r.status === 'fail')
      .map(r => r.description);

    const recommendations = [
      ...new Set(
        results
          .filter(r => r.status === 'fail')
          .map(r => r.recommendation)
          .filter(Boolean)
      )
    ].slice(0, 10);

    const nextSteps = [
      'Review and remediate critical vulnerabilities immediately',
      'Implement regular security testing in CI/CD pipeline',
      'Conduct security code review',
      'Update security policies and procedures',
      'Provide security training for development team'
    ];

    return {
      critical,
      recommendations,
      nextSteps
    };
  }

  /**
   * Save report to file
   */
  private async saveReport(report: PenTestReport): Promise<void> {
    try {
      const outputDir = './penetration-tests';
      const reportPath = path.join(
        outputDir,
        `pentest-${report.timestamp.toISOString().split('T')[0]}.json`
      );
      
      await fs.mkdir(outputDir, { recursive: true });
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    } catch (error) {
      console.error('Failed to save penetration test report:', error);
    }
  }

  /**
   * Get latest report
   */
  getLatestReport(): PenTestReport | null {
    return this.reports[this.reports.length - 1] || null;
  }
}

// Export singleton instance
export const penTestFramework = new PenetrationTestingFramework();

export default PenetrationTestingFramework;