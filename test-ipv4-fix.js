#!/usr/bin/env node

/**
 * Test IPv4-specific connection to quantum-safe server
 */

console.log('🔧 Testing IPv4-specific connection...');

// Test 1: Force IPv4 with explicit IP
try {
  console.log('\n📋 Test 1: Explicit IPv4 address');
  const response1 = await fetch('http://127.0.0.1:3008/health');
  const data1 = await response1.json();
  console.log('✅ SUCCESS with 127.0.0.1:', data1.status);
} catch (error) {
  console.log('❌ FAILED with 127.0.0.1:', error.message);
}

// Test 2: Use Node.js http with explicit IPv4
try {
  console.log('\n📋 Test 2: Node.js http with IPv4');
  const http = await import('http');
  
  const result = await new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',  // Explicit IPv4
      port: 3008,
      path: '/health',
      method: 'GET',
      family: 4,  // Force IPv4
      timeout: 5000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve(parsed);
        } catch (e) {
          resolve({ raw: data });
        }
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Timeout'));
    });
    
    req.end();
  });
  
  console.log('✅ SUCCESS with http module:', result.status);
} catch (error) {
  console.log('❌ FAILED with http module:', error.message);
}

// Test 3: Check DNS resolution
try {
  console.log('\n📋 Test 3: DNS resolution check');
  const dns = await import('dns');
  const { promisify } = await import('util');
  const lookup = promisify(dns.lookup);
  
  const result = await lookup('localhost');
  console.log('✅ localhost resolves to:', result);
} catch (error) {
  console.log('❌ DNS lookup failed:', error.message);
}

console.log('\n🎯 IPv4 connectivity test complete');