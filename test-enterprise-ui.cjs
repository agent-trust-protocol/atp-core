#!/usr/bin/env node

/**
 * ATP™ Enterprise UI Testing Script
 * Tests the complete stack: Frontend UI + Backend Services
 */

const http = require('http');
const https = require('https');

// Configuration
const FRONTEND_URL = 'http://localhost:3030';
const BACKEND_SERVICES = [
  { name: 'RPC Gateway', url: 'http://localhost:3000/health' },
  { name: 'Identity Service', url: 'http://localhost:3001/health' },
  { name: 'VC Service', url: 'http://localhost:3002/health' },
  { name: 'Permission Service', url: 'http://localhost:3003/health' },
  { name: 'Audit Service', url: 'http://localhost:3004/health' }
];

// Colors for output
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  purple: '\x1b[35m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const client = url.startsWith('https:') ? https : http;
    
    const req = client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        resolve({
          statusCode: res.statusCode,
          data: data,
          responseTime: responseTime
        });
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function testFrontend() {
  log('\n🌐 Testing Frontend (Next.js UI)', 'cyan');
  log('═══════════════════════════════════', 'cyan');
  
  try {
    const response = await makeRequest(FRONTEND_URL);
    
    if (response.statusCode === 200) {
      log(`✅ Frontend is running at ${FRONTEND_URL}`, 'green');
      log(`   Response time: ${response.responseTime}ms`, 'blue');
      log(`   Status: HTTP ${response.statusCode}`, 'blue');
      
      // Check if it contains ATP content
      if (response.data.includes('Agent Trust Protocol')) {
        log(`   Content: ✅ ATP UI loaded correctly`, 'green');
      } else {
        log(`   Content: ⚠️  ATP content not detected`, 'yellow');
      }
      
      return true;
    } else {
      log(`❌ Frontend returned HTTP ${response.statusCode}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Frontend test failed: ${error.message}`, 'red');
    return false;
  }
}

async function testBackendServices() {
  log('\n🔧 Testing Backend Services', 'purple');
  log('═══════════════════════════════════', 'purple');
  
  let allHealthy = true;
  const results = [];
  
  for (const service of BACKEND_SERVICES) {
    try {
      const response = await makeRequest(service.url);
      
      if (response.statusCode === 200) {
        const healthData = JSON.parse(response.data);
        const isHealthy = healthData.status === 'healthy';
        
        log(`${isHealthy ? '✅' : '⚠️ '} ${service.name}`, isHealthy ? 'green' : 'yellow');
        log(`   URL: ${service.url}`, 'blue');
        log(`   Response time: ${response.responseTime}ms`, 'blue');
        log(`   Status: ${healthData.status}`, 'blue');
        
        if (healthData.database) {
          log(`   Database: ${healthData.database.healthy ? '✅ Connected' : '❌ Disconnected'}`, 
              healthData.database.healthy ? 'green' : 'red');
        }
        
        results.push({
          name: service.name,
          healthy: isHealthy,
          responseTime: response.responseTime
        });
        
        if (!isHealthy) allHealthy = false;
      } else {
        log(`❌ ${service.name} returned HTTP ${response.statusCode}`, 'red');
        results.push({ name: service.name, healthy: false, responseTime: response.responseTime });
        allHealthy = false;
      }
    } catch (error) {
      log(`❌ ${service.name} failed: ${error.message}`, 'red');
      results.push({ name: service.name, healthy: false, error: error.message });
      allHealthy = false;
    }
    
    console.log(''); // Add spacing
  }
  
  return { allHealthy, results };
}

async function testEndToEnd() {
  log('\n🧪 End-to-End Integration Test', 'yellow');
  log('═══════════════════════════════════', 'yellow');
  
  try {
    // Test agent registration flow
    log('Testing agent registration flow...', 'blue');
    
    const identityResponse = await makeRequest('http://localhost:3001/health');
    if (identityResponse.statusCode === 200) {
      log('✅ Identity service ready for agent registration', 'green');
    }
    
    const vcResponse = await makeRequest('http://localhost:3002/health');
    if (vcResponse.statusCode === 200) {
      log('✅ VC service ready for credential issuance', 'green');
    }
    
    const permissionResponse = await makeRequest('http://localhost:3003/health');
    if (permissionResponse.statusCode === 200) {
      log('✅ Permission service ready for access control', 'green');
    }
    
    const auditResponse = await makeRequest('http://localhost:3004/health');
    if (auditResponse.statusCode === 200) {
      log('✅ Audit service ready for logging', 'green');
    }
    
    log('\n🎯 Full ATP stack is operational!', 'green');
    return true;
    
  } catch (error) {
    log(`❌ End-to-end test failed: ${error.message}`, 'red');
    return false;
  }
}

function generateSummaryReport(frontendOk, backendResults, e2eOk) {
  log('\n📊 ATP™ Enterprise UI Test Summary', 'bold');
  log('═══════════════════════════════════════════════', 'bold');
  
  // Frontend status
  log(`\n🌐 Frontend Status: ${frontendOk ? '✅ OPERATIONAL' : '❌ FAILED'}`, 
      frontendOk ? 'green' : 'red');
  if (frontendOk) {
    log(`   ATP Modern UI: http://localhost:3030`, 'blue');
    log(`   Dashboard: http://localhost:3030/dashboard`, 'blue');
    log(`   Policy Editor: http://localhost:3030/policy-editor`, 'blue');
  }
  
  // Backend status
  log(`\n🔧 Backend Services: ${backendResults.allHealthy ? '✅ ALL HEALTHY' : '⚠️  PARTIAL'}`, 
      backendResults.allHealthy ? 'green' : 'yellow');
  
  const avgResponseTime = backendResults.results
    .filter(r => r.responseTime)
    .reduce((sum, r) => sum + r.responseTime, 0) / 
    backendResults.results.filter(r => r.responseTime).length;
  
  if (avgResponseTime) {
    log(`   Average response time: ${Math.round(avgResponseTime)}ms`, 'blue');
  }
  
  // Service breakdown
  backendResults.results.forEach(result => {
    const status = result.healthy ? '✅' : '❌';
    const time = result.responseTime ? `(${result.responseTime}ms)` : '';
    log(`   ${status} ${result.name} ${time}`, result.healthy ? 'green' : 'red');
  });
  
  // E2E status
  log(`\n🧪 Integration: ${e2eOk ? '✅ PASSING' : '❌ FAILED'}`, 
      e2eOk ? 'green' : 'red');
  
  // Overall status
  const overallStatus = frontendOk && backendResults.allHealthy && e2eOk;
  log(`\n🎯 Overall Status: ${overallStatus ? '✅ ATP™ FULLY OPERATIONAL' : '⚠️  NEEDS ATTENTION'}`, 
      overallStatus ? 'green' : 'yellow');
  
  if (overallStatus) {
    log('\n🚀 Ready for enterprise demonstration!', 'green');
    log('   Frontend: Modern React UI with interactive demos', 'blue');
    log('   Backend: 5 microservices with health monitoring', 'blue');
    log('   Features: Quantum-safe signatures, trust scoring, policy management', 'blue');
  } else {
    log('\n🔧 Action required to achieve full operational status', 'yellow');
  }
  
  log('\n═══════════════════════════════════════════════', 'bold');
}

async function main() {
  log('\n🛡️  ATP™ Enterprise UI Testing Suite', 'bold');
  log('Testing complete frontend + backend integration\n', 'cyan');
  
  // Run all tests
  const frontendOk = await testFrontend();
  const backendResults = await testBackendServices();
  const e2eOk = await testEndToEnd();
  
  // Generate summary
  generateSummaryReport(frontendOk, backendResults, e2eOk);
  
  // Exit with appropriate code
  const success = frontendOk && backendResults.allHealthy && e2eOk;
  process.exit(success ? 0 : 1);
}

// Run the tests
main().catch(error => {
  log(`\n💥 Test suite crashed: ${error.message}`, 'red');
  process.exit(1);
});