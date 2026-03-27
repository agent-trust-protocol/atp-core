#!/usr/bin/env node

/**
 * Debug script to isolate quantum-safe server connectivity issue
 * Systematic testing of different connection methods
 */

import { spawn } from 'child_process';

console.log('🔍 DEBUGGING QUANTUM-SAFE SERVER CONNECTIVITY');
console.log('==============================================');

async function debugStep(stepName, testFunction) {
  console.log(`\n📋 ${stepName}`);
  console.log('─'.repeat(50));
  
  try {
    const result = await testFunction();
    console.log(`✅ SUCCESS: ${JSON.stringify(result, null, 2)}`);
    return { success: true, result };
  } catch (error) {
    console.log(`❌ FAILED: ${error.message}`);
    console.log(`   Stack: ${error.stack?.split('\n')[1]?.trim()}`);
    return { success: false, error: error.message };
  }
}

// Test 1: Basic curl test
await debugStep('Step 1: Curl baseline test', async () => {
  return new Promise((resolve, reject) => {
    const curl = spawn('curl', ['-s', 'http://localhost:3008/health']);
    let output = '';
    let error = '';
    
    curl.stdout.on('data', (data) => output += data);
    curl.stderr.on('data', (data) => error += data);
    
    curl.on('close', (code) => {
      if (code === 0) {
        try {
          const parsed = JSON.parse(output);
          resolve(parsed);
        } catch (e) {
          resolve({ raw: output });
        }
      } else {
        reject(new Error(`Curl failed with code ${code}: ${error}`));
      }
    });
    
    setTimeout(() => {
      curl.kill();
      reject(new Error('Curl timeout'));
    }, 5000);
  });
});

// Test 2: Node.js fetch with detailed error handling
await debugStep('Step 2: Node.js fetch with timeout', async () => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);
  
  try {
    const response = await fetch('http://localhost:3008/health', {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Node.js-Debug-Client/1.0'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
});

// Test 3: Node.js http module
await debugStep('Step 3: Node.js http module', async () => {
  const http = await import('http');
  
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3008,
      path: '/health',
      method: 'GET',
      timeout: 5000
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, raw: data });
        }
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('HTTP request timeout'));
    });
    
    req.end();
  });
});

// Test 4: Check if server is actually listening
await debugStep('Step 4: Port and process verification', async () => {
  const { execSync } = await import('child_process');
  
  const netstat = execSync('netstat -an | grep 3008').toString();
  const processes = execSync('ps aux | grep quantum').toString();
  
  return {
    netstat: netstat.trim(),
    processes: processes.split('\n').filter(line => line.includes('quantum') && !line.includes('grep'))
  };
});

// Test 5: Test different endpoints
await debugStep('Step 5: Test different endpoints', async () => {
  const endpoints = ['/', '/demo', '/health', '/status'];
  const results = {};
  
  for (const endpoint of endpoints) {
    try {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 2000);
      
      const response = await fetch(`http://localhost:3008${endpoint}`, {
        signal: controller.signal
      });
      
      results[endpoint] = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      };
    } catch (error) {
      results[endpoint] = { error: error.message };
    }
  }
  
  return results;
});

// Test 6: Check server logs/output
await debugStep('Step 6: Server process analysis', async () => {
  const { execSync } = await import('child_process');
  
  try {
    // Get the quantum server process details
    const psOutput = execSync('ps aux | grep quantum-safe-server').toString();
    const lines = psOutput.split('\n').filter(line => line.includes('quantum') && !line.includes('grep'));
    
    if (lines.length === 0) {
      throw new Error('No quantum-safe server process found');
    }
    
    const processInfo = lines[0].split(/\s+/);
    const pid = processInfo[1];
    
    return {
      processFound: true,
      pid: pid,
      processLine: lines[0],
      processCount: lines.length
    };
  } catch (error) {
    return {
      processFound: false,
      error: error.message
    };
  }
});

console.log('\n🎯 DEBUGGING SUMMARY');
console.log('===================');
console.log('Analysis complete. Check results above for connectivity patterns.');
console.log('Next steps will be determined based on these findings.');