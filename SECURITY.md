# ATP Security Testing Suite

This document outlines the comprehensive security testing framework implemented for the Agent Trust Protocol.

## 🔒 Security Features Implemented

### 1. Authentication & Authorization
- **Route Protection**: All premium routes protected by middleware
- **Server-side Validation**: No client-side authentication bypasses
- **RBAC System**: Role-based access control with organization scoping
- **Session Management**: Secure session handling with proper timeout

### 2. Rate Limiting
- **Brute Force Protection**: Progressive rate limiting with blocking
- **API Protection**: Endpoint-specific rate limits
- **Distributed Support**: Redis-backed for multi-instance deployments
- **Adaptive Limiting**: Dynamic limits based on system load

### 3. IP Protection
- **Server-side Algorithms**: All proprietary logic moved to secure APIs
- **Code Obfuscation**: Sensitive client code removed or obfuscated
- **Access Control**: Multi-layered authentication requirements
- **Audit Trail**: Comprehensive logging and monitoring

### 4. Automated Security Monitoring
- **Continuous Auditing**: Automated security rule evaluation
- **Vulnerability Detection**: Pattern-based security issue identification
- **Real-time Alerts**: Immediate notification of critical findings
- **Compliance Tracking**: Security policy compliance monitoring

### 5. Penetration Testing
- **Automated Testing**: Comprehensive vulnerability assessment
- **Multiple Attack Vectors**: Authentication, authorization, injection testing
- **Executive Reporting**: Business-focused security reports
- **Remediation Guidance**: Actionable security recommendations

### 6. Security Profiles & Policy Enforcement
- **Built-in Profiles**: Four runtime-agnostic security profiles (`safe-default`, `dev-mode`, `enterprise-locked`, `openclaw-sandbox`) that define granular controls for shell, filesystem, network, credentials, and messaging
- **State-Based Enforcement**: Lifecycle-aware policy evaluation across agent states (`planning`, `executing`, `communicating`, `completed`) — each state restricts or allows specific tool categories
- **Profile-Based Action Evaluation**: `evaluateActionWithProfile()` returns `allow`, `deny`, or `require_approval` decisions based on the active profile's controls and state policies
- **Adapter Integration**: Runtime adapters (OpenClaw, MCP, LangChain) call profile evaluation before every tool execution via `ATPToolWrapper.checkPermissions` and `enforceAtpPoliciesForClawSession`
- **Approval Workflows**: Sensitive actions (e.g., shell in `openclaw-sandbox`, credentials in `executing` state) require explicit approval rather than silent denial

#### Built-in Profile Summary

| Profile | Shell | Filesystem | Network | Credentials | Use Case |
|---------|-------|-----------|---------|-------------|----------|
| `safe-default` | Denied (approval) | Read-only | Internal only | Denied (approval) | Most agents |
| `dev-mode` | Allowed | Read/Write (all) | All domains | Allowed | Local development |
| `enterprise-locked` | Denied | Read-only (approved paths) | Internal corp only | Denied | Production environments |
| `openclaw-sandbox` | Denied (approval) | Read/Write (sandbox) | Internal + company | Denied (approval) | OpenClaw/NemoClaw agents |

#### Profile Enforcement Tests
- ✅ Tool wrapper denies actions when profile returns `deny`
- ✅ Tool wrapper blocks actions requiring approval when profile returns `require_approval`
- ✅ Tool wrapper allows actions when profile returns `allow`
- ✅ Tool wrapper skips profile check when no `actionType` is configured
- ✅ Session enforcement filters tools per profile in `planning` state
- ✅ Session enforcement marks tools as `require_approval` in `executing` state
- ✅ Session enforcement allows tools when profile permits in `executing` state

## 🛠️ Usage

### Running Individual Tests

#### Authentication Tests
```bash
node test-auth-routes.js
```

#### Comprehensive Security Suite
```bash
node run-security-tests.js
```

#### Environment Variables
```bash
# Target URL
export BASE_URL=http://localhost:3000

# Run tests in parallel (default: true)
export PARALLEL_TESTS=true

# Severity threshold for notifications
export SEVERITY_THRESHOLD=medium
```

### Running from npm Scripts

Add to your `package.json`:
```json
{
  "scripts": {
    "security:test": "node run-security-tests.js",
    "security:auth": "node test-auth-routes.js",
    "security:audit": "node -e \"require('./packages/shared/src/security/automated-security-audit').securityAuditSystem.start()\"",
    "security:pentest": "node -e \"require('./packages/shared/src/security/penetration-testing').penTestFramework.runTests('http://localhost:3000')\""
  }
}
```

Then run:
```bash
npm run security:test
```

## 📊 Test Coverage

### Authentication Tests
- ✅ Route protection verification
- ✅ Brute force protection testing  
- ✅ Session management validation
- ✅ Default credential detection
- ✅ Authentication bypass attempts

### Authorization Tests  
- ✅ RBAC implementation verification
- ✅ Privilege escalation testing
- ✅ Insecure direct object reference testing
- ✅ Function level access control validation

### Rate Limiting Tests
- ✅ Endpoint-specific rate limiting
- ✅ Progressive blocking verification
- ✅ Rate limit header validation
- ✅ Distributed rate limiting (Redis)

### Security Audit Tests
- ✅ Configuration security analysis
- ✅ Sensitive data exposure detection
- ✅ Cryptography implementation review
- ✅ Session security validation
- ✅ Dependency vulnerability scanning

### Penetration Tests
- ✅ SQL injection testing
- ✅ NoSQL injection testing
- ✅ Cross-site scripting (XSS) testing
- ✅ Path traversal testing
- ✅ Business logic flaw detection

### Security Profile Tests
- ✅ Profile-based tool deny enforcement
- ✅ Profile-based approval requirement enforcement
- ✅ Profile allow passthrough for permitted actions
- ✅ Graceful skip when no actionType configured
- ✅ State-based session tool filtering with profiles
- ✅ State-based approval requirement via profiles
- ✅ State-based allow decisions via profiles

## 🚨 Security Score Calculation

The security score (0-100) is calculated based on:

- **Critical Issues**: -25 points each
- **High Issues**: -15 points each  
- **Medium Issues**: -10 points each
- **Low Issues**: -5 points each
- **Failed Tests**: -10 points each

### Score Interpretation
- **90-100**: Excellent security posture
- **70-89**: Good security with minor issues
- **50-69**: Moderate security, needs attention
- **30-49**: Poor security, immediate action required
- **0-29**: Critical security flaws, urgent remediation needed

## 📈 Report Generation

### Automated Reports
- **JSON Format**: Machine-readable detailed results
- **HTML Format**: Human-readable executive dashboard
- **CSV Export**: Data analysis and trending
- **Webhook Notifications**: Real-time alert integration

### Report Location
```
./security-reports/
├── security-report-2024-01-15.json
├── security-report-2024-01-15.html
├── audit-2024-01-15.json
└── pentest-2024-01-15.json
```

## 🔧 Configuration

### Security Audit Configuration
```typescript
const securityAuditSystem = new SecurityAuditSystem({
  enabled: true,
  intervalMs: 3600000, // 1 hour
  outputPath: './security-audits',
  severityThreshold: AuditSeverity.MEDIUM,
  notificationWebhook: process.env.SECURITY_WEBHOOK
});
```

### Rate Limiting Configuration
```typescript
const rateLimitConfigs = {
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    blockDuration: 30 * 60 * 1000 // 30 minutes
  },
  policyEvaluation: {
    windowMs: 60 * 1000, // 1 minute  
    maxRequests: 20,
    blockDuration: 5 * 60 * 1000 // 5 minutes
  }
};
```

### RBAC Configuration
```typescript
const rbacConfig = {
  roles: SystemRoles,
  organizations: ['org1', 'org2'],
  permissions: Permission,
  cacheTimeout: 60000 // 1 minute
};
```

### Security Profile Configuration
```typescript
import { ATPClient, BUILTIN_PROFILES } from 'atp-sdk';

// Assign a profile at client creation
const client = new ATPClient({
  baseUrl: 'https://atp.example.com',
  profileId: 'enterprise-locked',
});

// Or set a profile dynamically
client.setProfile('openclaw-sandbox');

// Evaluate an action against the active profile
const decision = client.evaluateActionWithProfile({
  actionType: 'shell',
  state: 'executing',
});
// Returns: "allow" | "deny" | "require_approval"

// Available built-in profiles
console.log(Object.keys(BUILTIN_PROFILES));
// ["safe-default", "dev-mode", "enterprise-locked", "openclaw-sandbox"]
```

## 🚀 CI/CD Integration

### GitHub Actions Example
```yaml
name: Security Tests
on: [push, pull_request]
jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm install
      - run: npm run security:test
      - uses: actions/upload-artifact@v2
        with:
          name: security-reports
          path: security-reports/
```

### Docker Integration
```dockerfile
# Add to your Dockerfile
COPY test-auth-routes.js run-security-tests.js ./
RUN npm run security:test
```

## 📋 Security Checklist

### Pre-Deployment
- [ ] All authentication tests pass
- [ ] Rate limiting properly configured
- [ ] RBAC permissions correctly assigned
- [ ] Security audit score > 80
- [ ] No critical penetration test failures
- [ ] All IP protection measures active
- [ ] Security profile assigned to all agents (never deploy without a profile)
- [ ] Profile enforcement tests pass (27/27 in openclaw-atp)
- [ ] Production agents use `enterprise-locked` or `safe-default` profile (never `dev-mode`)

### Post-Deployment
- [ ] Security monitoring active
- [ ] Automated audits scheduled
- [ ] Alert webhooks configured
- [ ] Access logs monitored
- [ ] Incident response plan tested

## 🆘 Incident Response

### Critical Security Issues
1. **Immediate**: Stop affected services
2. **Assess**: Determine scope and impact
3. **Contain**: Implement emergency fixes
4. **Communicate**: Notify stakeholders
5. **Remediate**: Apply permanent solutions
6. **Review**: Post-incident analysis

### Security Contact
For security issues, contact: security@agenttrust.org

## 🔄 Continuous Improvement

### Monthly Reviews
- Security test results analysis
- Threat landscape assessment
- Security control effectiveness review
- Policy and procedure updates

### Quarterly Assessments
- External penetration testing
- Security architecture review
- Compliance audit
- Team security training

---

**Last Updated**: April 2026  
**Version**: 1.2.1  
**Maintainer**: ATP Security Team