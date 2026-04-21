#!/usr/bin/env node

/**
 * ATP™ Production Validation Test Suite
 * 
 * Comprehensive testing of CoreATP with real-world use cases:
 * 1. Developer Use Case
 * 2. Enterprise Use Case
 * 3. Production Readiness Assessment
 */

import { DeveloperUseCase } from './developer-use-case.js';
import { EnterpriseUseCase } from './enterprise-use-case.js';

class ProductionValidationSuite {
  constructor() {
    this.results = {
      developer: null,
      enterprise: null,
      overall: null
    };
  }

  async runValidation() {
    console.log('🚀 ATP™ PRODUCTION VALIDATION SUITE');
    console.log('=====================================');
    console.log('Testing CoreATP with real-world scenarios');
    console.log('');

    const startTime = Date.now();

    try {
      // Pre-flight checks
      console.log('🔍 Pre-flight system checks...');
      await this.performPreflightChecks();
      console.log('');

      // Test 1: Developer Use Case
      console.log('📋 TEST 1: DEVELOPER USE CASE');
      console.log('─'.repeat(50));
      const developerTest = new DeveloperUseCase();
      this.results.developer = await developerTest.runTest();
      console.log('');

      // Test 2: Enterprise Use Case
      console.log('📋 TEST 2: ENTERPRISE USE CASE');
      console.log('─'.repeat(50));
      const enterpriseTest = new EnterpriseUseCase();
      this.results.enterprise = await enterpriseTest.runTest();
      console.log('');

      // Overall Assessment
      const totalTime = Date.now() - startTime;
      await this.generateOverallAssessment(totalTime);

      return this.results;

    } catch (error) {
      console.error('❌ VALIDATION SUITE FAILED!');
      console.error(`Error: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  async performPreflightChecks() {
    const checks = [
      { name: 'RPC Gateway', url: 'http://localhost:3000/health' },
      { name: 'Quantum-Safe Server', url: 'http://localhost:3008/health' },
      { name: 'Metrics Endpoint', url: 'http://localhost:3000/metrics' },
      { name: 'Service Discovery', url: 'http://localhost:3000/services' }
    ];

    for (const check of checks) {
      try {
        const response = await fetch(check.url);
        const status = response.ok ? '✅ ONLINE' : '❌ OFFLINE';
        console.log(`   ${status} ${check.name}`);
      } catch (error) {
        console.log(`   ❌ OFFLINE ${check.name} (${error.message})`);
        throw new Error(`Required service ${check.name} is not available`);
      }
    }
  }

  async generateOverallAssessment(totalTime) {
    console.log('📊 OVERALL PRODUCTION ASSESSMENT');
    console.log('=====================================');

    const developerSuccess = this.results.developer?.success || false;
    const enterpriseSuccess = this.results.enterprise?.success || false;

    // Calculate scores
    const scores = {
      developer: developerSuccess ? 100 : 0,
      enterprise: enterpriseSuccess ? 100 : 0,
      performance: this.calculatePerformanceScore(),
      security: this.calculateSecurityScore(),
      compliance: this.calculateComplianceScore()
    };

    const overallScore = Object.values(scores).reduce((a, b) => a + b, 0) / Object.keys(scores).length;

    // Display results
    console.log('📈 Test Results:');
    console.log(`   👩‍💻 Developer Use Case: ${scores.developer}% ${developerSuccess ? '✅' : '❌'}`);
    console.log(`   🏢 Enterprise Use Case: ${scores.enterprise}% ${enterpriseSuccess ? '✅' : '❌'}`);
    console.log(`   ⚡ Performance Score: ${scores.performance}%`);
    console.log(`   🛡️ Security Score: ${scores.security}%`);
    console.log(`   📋 Compliance Score: ${scores.compliance}%`);
    console.log('');

    console.log('⏱️ Performance Metrics:');
    console.log(`   🕐 Total test time: ${(totalTime / 1000).toFixed(2)}s`);
    
    if (this.results.developer?.responseTime) {
      console.log(`   📊 Developer avg response: ${this.results.developer.responseTime.toFixed(2)}ms`);
    }
    
    if (this.results.enterprise?.results?.performanceMetrics) {
      const perf = this.results.enterprise.results.performanceMetrics;
      console.log(`   📊 Enterprise throughput: ${perf.throughput} req/s`);
      console.log(`   📊 Enterprise success rate: ${perf.successRate.toFixed(1)}%`);
    }
    console.log('');

    // Production Readiness Assessment
    const readinessLevel = this.assessProductionReadiness(overallScore);
    console.log('🎯 PRODUCTION READINESS ASSESSMENT:');
    console.log(`   📊 Overall Score: ${overallScore.toFixed(1)}%`);
    console.log(`   🏆 Readiness Level: ${readinessLevel.level}`);
    console.log(`   📝 Assessment: ${readinessLevel.assessment}`);
    console.log('');

    // Recommendations
    this.generateRecommendations(scores);

    this.results.overall = {
      scores,
      overallScore,
      readinessLevel,
      testDuration: totalTime,
      timestamp: new Date().toISOString()
    };
  }

  calculatePerformanceScore() {
    let score = 100;
    
    // Developer performance
    if (this.results.developer?.responseTime > 500) score -= 20;
    else if (this.results.developer?.responseTime > 200) score -= 10;
    
    // Enterprise performance
    if (this.results.enterprise?.results?.performanceMetrics) {
      const perf = this.results.enterprise.results.performanceMetrics;
      if (perf.successRate < 95) score -= 30;
      if (perf.avgResponseTime > 1000) score -= 20;
      if (perf.errorRate > 5) score -= 25;
    }
    
    return Math.max(0, score);
  }

  calculateSecurityScore() {
    let score = 100;
    
    // Check if quantum-safe is working
    if (!this.results.enterprise?.results?.securityTests?.some(t => t.quantumSafe)) {
      score -= 40;
    }
    
    // Check mTLS availability
    if (!this.results.enterprise?.results?.securityTests?.some(t => t.mtlsCerts)) {
      score -= 30;
    }
    
    // Check authentication success
    if (!this.results.developer?.success) score -= 15;
    if (!this.results.enterprise?.success) score -= 15;
    
    return Math.max(0, score);
  }

  calculateComplianceScore() {
    let score = 100;
    
    if (this.results.enterprise?.results?.complianceChecks) {
      const checks = this.results.enterprise.results.complianceChecks;
      const passedChecks = checks.filter(c => c.status).length;
      score = (passedChecks / checks.length) * 100;
    }
    
    return score;
  }

  assessProductionReadiness(score) {
    if (score >= 95) {
      return {
        level: 'PRODUCTION READY ✅',
        assessment: 'CoreATP is fully ready for production deployment with excellent performance and security.'
      };
    } else if (score >= 85) {
      return {
        level: 'PRODUCTION READY ⚠️',
        assessment: 'CoreATP is ready for production with minor optimizations recommended.'
      };
    } else if (score >= 70) {
      return {
        level: 'STAGING READY 🔄',
        assessment: 'CoreATP is suitable for staging environment. Address issues before production.'
      };
    } else {
      return {
        level: 'NOT READY ❌',
        assessment: 'CoreATP requires significant improvements before production deployment.'
      };
    }
  }

  generateRecommendations(scores) {
    console.log('💡 RECOMMENDATIONS:');
    
    const recommendations = [];
    
    if (scores.performance < 90) {
      recommendations.push('🔧 Optimize response times and throughput');
    }
    
    if (scores.security < 95) {
      recommendations.push('🛡️ Complete security configuration (mTLS, certificates)');
    }
    
    if (scores.compliance < 90) {
      recommendations.push('📋 Enhance compliance monitoring and audit logging');
    }
    
    if (!this.results.developer?.success) {
      recommendations.push('👩‍💻 Fix developer onboarding flow');
    }
    
    if (!this.results.enterprise?.success) {
      recommendations.push('🏢 Resolve enterprise integration issues');
    }
    
    if (recommendations.length === 0) {
      console.log('   🎉 No recommendations - CoreATP is performing excellently!');
    } else {
      recommendations.forEach((rec, index) => {
        console.log(`   ${index + 1}. ${rec}`);
      });
    }
    console.log('');
  }
}

// Run the validation suite if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const suite = new ProductionValidationSuite();
  const results = await suite.runValidation();
  
  // Exit with appropriate code
  const success = results.developer?.success && results.enterprise?.success;
  process.exit(success ? 0 : 1);
}

export { ProductionValidationSuite };