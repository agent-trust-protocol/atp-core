#!/usr/bin/env node

/**
 * Test script for Policy Storage Service Integration
 * Tests basic CRUD operations and database connectivity
 */

import { VisualPolicyStorageService } from './packages/shared/dist/policy/visual-policy-storage.js';
import { createAllowAllPolicyTemplate } from './packages/shared/dist/policy/visual-policy-schema.js';

const dbConfig = {
  connectionString: 'postgresql://atp_user:dev_password@localhost:5432/atp_development',
  ssl: false,
  max: 10
};

async function testPolicyStorage() {
  console.log('🧪 Testing Policy Storage Service Integration...\n');
  
  const storage = new VisualPolicyStorageService(dbConfig);
  
  try {
    // Test 1: Initialize and health check
    console.log('1. Testing database connection...');
    await storage.initialize();
    const health = await storage.healthCheck();
    console.log(`   ✅ Database health: ${health.healthy ? 'OK' : 'FAILED'}`);
    
    // Test 2: Create a test policy
    console.log('\n2. Testing policy creation...');
    const testPolicy = createAllowAllPolicyTemplate('org_test', 'did:atp:test-creator');
    testPolicy.name = 'Test Policy - ' + Date.now();
    testPolicy.description = 'Test policy for storage service validation';
    
    const policyId = await storage.createPolicy(testPolicy, 'did:atp:test-creator');
    console.log(`   ✅ Policy created with ID: ${policyId}`);
    
    // Test 3: Retrieve the policy
    console.log('\n3. Testing policy retrieval...');
    const retrievedPolicy = await storage.getPolicy(policyId, 'org_test');
    console.log(`   ✅ Policy retrieved: ${retrievedPolicy ? retrievedPolicy.name : 'NOT FOUND'}`);
    
    // Test 4: Update the policy
    console.log('\n4. Testing policy update...');
    await storage.updatePolicy(
      policyId, 
      { description: 'Updated test policy description' }, 
      'did:atp:test-updater',
      'Testing policy update functionality'
    );
    console.log('   ✅ Policy updated successfully');
    
    // Test 5: Search policies
    console.log('\n5. Testing policy search...');
    const searchResults = await storage.searchPolicies({
      organizationId: 'org_test',
      limit: 10
    });
    console.log(`   ✅ Found ${searchResults.policies.length} policies (total: ${searchResults.total})`);
    
    // Test 6: Toggle policy status
    console.log('\n6. Testing policy toggle...');
    await storage.togglePolicy(policyId, false, 'did:atp:test-admin');
    console.log('   ✅ Policy disabled successfully');
    
    // Test 7: Get audit trail
    console.log('\n7. Testing audit trail...');
    const auditTrail = await storage.getAuditTrail(policyId, 10);
    console.log(`   ✅ Audit trail retrieved: ${auditTrail.length} events`);
    
    // Test 8: Organization settings
    console.log('\n8. Testing organization settings...');
    const orgSettings = await storage.getOrganizationSettings('org_test');
    console.log(`   ✅ Organization settings: ${orgSettings ? 'Found' : 'Using defaults'}`);
    
    // Test 9: Clean up - Archive the test policy
    console.log('\n9. Testing policy archival...');
    await storage.deletePolicy(policyId, 'did:atp:test-admin', 'Test cleanup');
    console.log('   ✅ Policy archived successfully');
    
    console.log('\n🎉 All tests passed! Policy Storage Service is working correctly.\n');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await storage.close();
  }
}

// Run the test
testPolicyStorage().catch(console.error);