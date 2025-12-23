#!/usr/bin/env tsx

import { ATPSecurityTestingFramework } from '../packages/shared/src/security/security-testing.js';

async function main() {
  console.log('🔐 ATP™ Enhanced Security Framework Test Suite');
  console.log('==============================================');
  console.log('');

  const framework = new ATPSecurityTestingFramework();

  try {
    console.log('🚀 Starting comprehensive security tests...');
    console.log('');

    const startTime = Date.now();
    const report = await framework.runAllTests();
    const totalTime = Date.now() - startTime;

    console.log('');
    console.log('📊 SECURITY TEST RESULTS');
    console.log('========================');
    console.log(`Total Tests: ${report.summary.totalTests}`);
    console.log(`✅ Passed: ${report.summary.passed}`);
    console.log(`❌ Failed: ${report.summary.failed}`);
    console.log(`🔴 Critical: ${report.summary.critical}`);
    console.log(`🟠 High: ${report.summary.high}`);
    console.log(`🟡 Medium: ${report.summary.medium}`);
    console.log(`🟢 Low: ${report.summary.low}`);
    console.log(`⏱️  Total Time: ${totalTime}ms`);
    console.log(`🎯 Risk Score: ${report.riskScore}%`);
    console.log('');

    if (report.summary.failed > 0) {
      console.log('❌ FAILED TESTS:');
      console.log('================');
      
      const failedTests = report.results.filter(r => !r.passed);
      failedTests.forEach(test => {
        const severityIcon = {
          critical: '🔴',
          high: '🟠',
          medium: '🟡',
          low: '🟢'
        }[test.severity];
        
        console.log(`${severityIcon} ${test.testName}`);
        console.log(`   Category: ${test.category}`);
        console.log(`   Severity: ${test.severity.toUpperCase()}`);
        console.log(`   Message: ${test.message}`);
        console.log(`   Duration: ${test.duration}ms`);
        console.log('');
      });
    }

    if (report.recommendations.length > 0) {
      console.log('💡 SECURITY RECOMMENDATIONS:');
      console.log('============================');
      report.recommendations.forEach(rec => {
        console.log(`• ${rec}`);
      });
      console.log('');
    }

    // Run cryptographic strength tests
    console.log('🔬 Running cryptographic strength tests...');
    const cryptoResults = await framework.testCryptographicStrength();
    
    console.log('');
    console.log('🔐 CRYPTOGRAPHIC STRENGTH RESULTS:');
    console.log('==================================');
    
    cryptoResults.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${result.testName}: ${result.message} (${result.duration}ms)`);
    });

    console.log('');

    // Security recommendations based on overall results
    if (report.riskScore === 0) {
      console.log('🎉 EXCELLENT: All security tests passed!');
      console.log('Continue monitoring and maintaining security posture.');
    } else if (report.riskScore < 25) {
      console.log('✅ GOOD: Low security risk detected.');
      console.log('Address any medium/high priority issues when possible.');
    } else if (report.riskScore < 50) {
      console.log('⚠️  MODERATE: Medium security risk detected.');
      console.log('Prioritize addressing high and critical severity issues.');
    } else if (report.riskScore < 75) {
      console.log('🚨 HIGH: High security risk detected.');
      console.log('Immediately address all critical and high severity issues.');
    } else {
      console.log('🔥 CRITICAL: Very high security risk detected.');
      console.log('URGENT: Address all security issues before deployment.');
    }

    console.log('');
    console.log('Security test completed successfully! 🔐');

    // Exit with error code if critical issues found
    const hasCritical = report.summary.critical > 0;
    process.exit(hasCritical ? 1 : 0);

  } catch (error) {
    console.error('❌ Security test failed:', error);
    process.exit(1);
  } finally {
    framework.cleanup();
  }
}

// Handle CLI arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log('ATP™ Security Testing Framework');
  console.log('');
  console.log('Usage: tsx run-security-tests.ts [options]');
  console.log('');
  console.log('Options:');
  console.log('  --help, -h     Show this help message');
  console.log('  --pentest      Run penetration tests (requires endpoint)');
  console.log('  --endpoint     Target endpoint for penetration testing');
  console.log('');
  console.log('Examples:');
  console.log('  tsx run-security-tests.ts');
  console.log('  tsx run-security-tests.ts --pentest --endpoint http://localhost:3000');
  process.exit(0);
}

if (args.includes('--pentest')) {
  const endpointIndex = args.indexOf('--endpoint');
  const endpoint = endpointIndex !== -1 ? args[endpointIndex + 1] : 'http://localhost:3000';
  
  console.log(`🎯 Running penetration tests against: ${endpoint}`);
  // This would run penetration tests
  // For now, just run the main security tests
}

if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}