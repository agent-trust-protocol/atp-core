#!/usr/bin/env node

/**
 * Test script to verify React hydration fixes
 */

const http = require('http');

function testHydration() {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:3030', (res) => {
      let html = '';
      res.on('data', chunk => html += chunk);
      res.on('end', () => {
        
        // Check for common hydration error indicators
        const hydrationIssues = [];
        
        // Look for problematic patterns that could cause hydration mismatches
        if (html.includes('new Date()')) {
          hydrationIssues.push('Found new Date() in HTML - potential hydration issue');
        }
        
        if (html.includes('toLocaleString') && !html.includes('suppressHydrationWarning')) {
          hydrationIssues.push('Found toLocaleString without suppressHydrationWarning');
        }
        
        // Check for Next.js hydration error patterns
        if (html.includes('Hydration failed') || html.includes('hydration-error')) {
          hydrationIssues.push('Found Next.js hydration error in HTML');
        }
        
        // Check that essential components are present
        const hasATProtocol = html.includes('Agent Trust Protocol');
        const hasInteractiveDemos = html.includes('Interactive Demos');
        const hasQuantumSafe = html.includes('Quantum-Safe');
        
        console.log('\n🧪 React Hydration Test Results');
        console.log('═══════════════════════════════════');
        
        if (hydrationIssues.length === 0) {
          console.log('✅ No hydration issues detected');
        } else {
          console.log('❌ Potential hydration issues found:');
          hydrationIssues.forEach(issue => console.log(`   - ${issue}`));
        }
        
        console.log('\n📄 Page Content Verification:');
        console.log(`   ATP Title: ${hasATProtocol ? '✅' : '❌'}`);
        console.log(`   Interactive Demos: ${hasInteractiveDemos ? '✅' : '❌'}`);
        console.log(`   Quantum-Safe Content: ${hasQuantumSafe ? '✅' : '❌'}`);
        
        const pageSize = (html.length / 1024).toFixed(1);
        console.log(`   Page Size: ${pageSize}KB`);
        
        const allChecks = hydrationIssues.length === 0 && hasATProtocol && hasInteractiveDemos && hasQuantumSafe;
        
        console.log(`\n🎯 Overall Status: ${allChecks ? '✅ HEALTHY' : '⚠️ NEEDS ATTENTION'}`);
        
        if (allChecks) {
          console.log('🚀 ATP Enterprise UI is ready for production!');
        }
        
        resolve({
          success: allChecks,
          hydrationIssues: hydrationIssues.length,
          pageSize: pageSize
        });
      });
    });
    
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function main() {
  try {
    const result = await testHydration();
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

main();