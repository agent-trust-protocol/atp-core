/**
 * Advanced Use Cases Example
 * 
 * This example demonstrates advanced ATP™ SDK patterns:
 * - Multi-party credential workflows
 * - Complex permission delegation chains
 * - Zero-knowledge proof integrations
 * - Cross-service orchestration
 * - Error handling and retry patterns
 */

import { ATPClient, createQuickConfig, DIDUtils, CryptoUtils, JWTUtils } from '@atp/sdk';

async function advancedUseCasesExample() {
  console.log('🚀 ATP™ SDK Advanced Use Cases Example\n');

  // Setup multiple clients for different roles
  const config = createQuickConfig('http://localhost');
  
  const universitClient = new ATPClient(config);
  const employerClient = new ATPClient(config);
  const studentClient = new ATPClient(config);
  const verifierClient = new ATPClient(config);

  try {
    // Setup: Create identities for all parties
    console.log('🏗️ Setup: Creating multi-party identities...');
    
    const universityData = await DIDUtils.generateDID({ network: 'testnet' });
    const employerData = await DIDUtils.generateDID({ network: 'testnet' });
    const studentData = await DIDUtils.generateDID({ network: 'testnet' });
    const verifierData = await DIDUtils.generateDID({ network: 'testnet' });

    console.log(`🏛️ University DID: ${universityData.did}`);
    console.log(`🏢 Employer DID: ${employerData.did}`);
    console.log(`👤 Student DID: ${studentData.did}`);
    console.log(`🔍 Verifier DID: ${verifierData.did}`);
    console.log();

    // Authenticate all clients
    universitClient.setAuthentication({
      did: universityData.did,
      privateKey: universityData.keyPair.privateKey
    });

    employerClient.setAuthentication({
      did: employerData.did,
      privateKey: employerData.keyPair.privateKey
    });

    studentClient.setAuthentication({
      did: studentData.did,
      privateKey: studentData.keyPair.privateKey
    });

    verifierClient.setAuthentication({
      did: verifierData.did,
      privateKey: verifierData.keyPair.privateKey
    });

    // Advanced Use Case 1: Multi-party Credential Workflow
    console.log('🎓 Use Case 1: Multi-party Educational Credential Workflow\n');
    
    await multiPartyCredentialWorkflow(
      universitClient,
      studentClient,
      employerClient,
      verifierClient,
      {
        universityDID: universityData.did,
        studentDID: studentData.did,
        employerDID: employerData.did,
        verifierDID: verifierData.did
      }
    );

    // Advanced Use Case 2: Complex Permission Delegation
    console.log('\n🔗 Use Case 2: Complex Permission Delegation Chain\n');
    
    await complexPermissionDelegation(
      universitClient,
      studentClient,
      employerClient,
      {
        universityDID: universityData.did,
        studentDID: studentData.did,
        employerDID: employerData.did
      }
    );

    // Advanced Use Case 3: Cross-service Orchestration
    console.log('\n🌐 Use Case 3: Cross-service Orchestration\n');
    
    await crossServiceOrchestration(
      studentClient,
      {
        studentDID: studentData.did,
        studentKey: studentData.keyPair.privateKey
      }
    );

    // Advanced Use Case 4: Error Handling and Retry Patterns
    console.log('\n🔄 Use Case 4: Advanced Error Handling and Retry Patterns\n');
    
    await errorHandlingPatterns(studentClient, studentData.did);

    // Advanced Use Case 5: Batch Operations and Transactions
    console.log('\n📦 Use Case 5: Batch Operations and Atomic Transactions\n');
    
    await batchOperationsExample(universitClient, universityData.did);

  } catch (error) {
    console.error('❌ Advanced use cases example failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  } finally {
    // Cleanup all clients
    [universitClient, employerClient, studentClient, verifierClient].forEach(client => {
      client.cleanup();
    });
    console.log('\n✨ Advanced use cases example completed!');
  }
}

// Use Case 1: Multi-party Educational Credential Workflow
async function multiPartyCredentialWorkflow(universityClient, studentClient, employerClient, verifierClient, dids) {
  console.log('📚 Implementing multi-party educational credential workflow...');

  // Step 1: University creates academic achievement schema
  const schema = await universityClient.credentials.createSchema({
    name: 'Academic Achievement Certificate',
    description: 'Multi-party verified academic achievement',
    version: '2.0.0',
    schema: {
      type: 'object',
      properties: {
        degree: { type: 'string' },
        gpa: { type: 'number', minimum: 0, maximum: 4.0 },
        graduationDate: { type: 'string', format: 'date' },
        universityVerification: { type: 'object' },
        employerEndorsement: { type: 'object' }
      },
      required: ['degree', 'gpa', 'graduationDate']
    }
  });

  console.log(`✅ Schema created: ${schema.data.id}`);

  // Step 2: University issues credential to student
  const credential = await universityClient.credentials.issue({
    schemaId: schema.data.id,
    holder: dids.studentDID,
    claims: {
      degree: 'Master of Computer Science',
      gpa: 3.85,
      graduationDate: '2024-05-15',
      universityVerification: {
        verifiedBy: dids.universityDID,
        verificationDate: new Date().toISOString(),
        registrarSignature: 'verified'
      }
    }
  });

  console.log(`✅ Credential issued: ${credential.data.id}`);

  // Step 3: Student creates presentation for employer
  const presentation = await studentClient.credentials.createPresentation({
    credentialIds: [credential.data.id],
    audience: dids.employerDID,
    challenge: 'employment-verification-2024',
    purpose: 'Job application verification'
  });

  console.log(`✅ Presentation created: ${presentation.data.id}`);

  // Step 4: Employer verifies and endorses
  const verification = await employerClient.credentials.verifyPresentation({
    presentationId: presentation.data.id,
    expectedChallenge: 'employment-verification-2024',
    expectedAudience: dids.employerDID
  });

  console.log(`✅ Employer verification: ${verification.data.valid ? 'Valid' : 'Invalid'}`);

  // Step 5: Add employer endorsement to credential
  if (verification.data.valid) {
    const endorsement = await employerClient.credentials.addEndorsement({
      credentialId: credential.data.id,
      endorsement: {
        endorsedBy: dids.employerDID,
        endorsementType: 'employment_verification',
        endorsementDate: new Date().toISOString(),
        details: {
          position: 'Senior Software Engineer',
          performanceRating: 'Excellent',
          verified: true
        }
      }
    });

    console.log(`✅ Employer endorsement added: ${endorsement.data.id}`);
  }

  // Step 6: Third-party verifier validates the complete chain
  const finalVerification = await verifierClient.credentials.verify({
    credentialId: credential.data.id,
    checkRevocation: true,
    checkExpiry: true,
    checkEndorsements: true
  });

  console.log(`🔍 Final verification by third party: ${finalVerification.data.valid ? 'Valid' : 'Invalid'}`);
  console.log(`   Endorsements verified: ${finalVerification.data.endorsementsValid}`);
}

// Use Case 2: Complex Permission Delegation
async function complexPermissionDelegation(universityClient, studentClient, employerClient, dids) {
  console.log('🔗 Implementing complex permission delegation chain...');

  // Step 1: University creates departmental access policy
  const departmentPolicy = await universityClient.permissions.createPolicy({
    name: 'Departmental Resource Access',
    description: 'Hierarchical access to department resources',
    version: '1.0.0',
    rules: [
      {
        action: 'read',
        resource: 'department:cs:*',
        effect: 'allow',
        conditions: [
          {
            attribute: 'user.affiliation',
            operator: 'equals',
            value: 'cs_department'
          }
        ]
      },
      {
        action: 'delegate',
        resource: 'department:cs:research_data',
        effect: 'allow',
        conditions: [
          {
            attribute: 'user.role',
            operator: 'in',
            value: ['professor', 'phd_student']
          }
        ]
      }
    ]
  });

  console.log(`✅ Department policy created: ${departmentPolicy.data.id}`);

  // Step 2: Grant base permission to student
  const baseGrant = await universityClient.permissions.grant({
    grantee: dids.studentDID,
    resource: 'department:cs:research_data',
    actions: ['read', 'delegate'],
    policyId: departmentPolicy.data.id,
    conditions: {
      'user.affiliation': 'cs_department',
      'user.role': 'phd_student'
    },
    metadata: {
      grantType: 'academic_access',
      delegationDepth: 2
    }
  });

  console.log(`✅ Base permission granted: ${baseGrant.data.id}`);

  // Step 3: Student creates capability token for employer collaboration
  const delegatedToken = await studentClient.permissions.createCapabilityToken({
    grantee: dids.employerDID,
    capabilities: ['read'],
    resource: 'department:cs:research_data',
    restrictions: {
      timeWindow: {
        start: new Date().toISOString(),
        end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
      },
      usageLimit: 100,
      ipRestriction: ['192.168.1.0/24'],
      delegationDepth: 1
    },
    metadata: {
      delegationReason: 'Industry collaboration project',
      project: 'Machine Learning Research'
    }
  });

  console.log(`✅ Capability token created: ${delegatedToken.data.id}`);

  // Step 4: Verify delegation chain
  const delegationVerification = await employerClient.permissions.verifyCapabilityToken({
    token: delegatedToken.data.token,
    requiredCapability: 'read',
    resource: 'department:cs:research_data'
  });

  console.log(`🔍 Delegation verification: ${delegationVerification.data.valid ? 'Valid' : 'Invalid'}`);
  console.log(`   Delegation depth: ${delegationVerification.data.restrictions?.delegationDepth}`);

  // Step 5: Track delegation chain audit trail
  const delegationAudit = await universityClient.permissions.getAuditTrail({
    resource: 'department:cs:research_data',
    actions: ['grant', 'delegate'],
    includeChain: true
  });

  console.log(`📋 Delegation audit trail (${delegationAudit.data.total} events):`);
  delegationAudit.data.events.slice(0, 3).forEach((event, index) => {
    console.log(`   ${index + 1}. ${event.action} by ${event.actor} (${event.timestamp})`);
  });
}

// Use Case 3: Cross-service Orchestration
async function crossServiceOrchestration(client, identity) {
  console.log('🌐 Implementing cross-service orchestration...');

  // Step 1: Create atomic transaction across services
  const transactionId = CryptoUtils.randomString(16);
  
  console.log(`🔄 Starting atomic transaction: ${transactionId}`);

  try {
    // Begin transaction
    await client.audit.logEvent({
      source: 'orchestrator',
      action: 'transaction_begin',
      resource: `transaction:${transactionId}`,
      actor: identity.studentDID,
      details: {
        transactionType: 'credential_lifecycle',
        services: ['identity', 'credentials', 'permissions', 'audit']
      }
    });

    // Step 2: Update identity trust level
    const trustUpdate = await client.identity.updateTrustLevel(identity.studentDID, {
      level: 'PREMIUM',
      evidence: ['education_verified', 'employment_verified'],
      verifiedBy: identity.studentDID
    });

    console.log(`✅ Identity trust updated: ${trustUpdate.data.newLevel}`);

    // Step 3: Issue self-sovereign credential
    const ssiCredential = await client.credentials.issue({
      schemaId: 'self-sovereign-identity-v1',
      holder: identity.studentDID,
      claims: {
        identityLevel: 'verified',
        trustScore: 95,
        verificationDate: new Date().toISOString()
      },
      metadata: {
        transactionId,
        selfIssued: true
      }
    });

    console.log(`✅ SSI credential issued: ${ssiCredential.data.id}`);

    // Step 4: Grant enhanced permissions based on new trust level
    const enhancedGrant = await client.permissions.grant({
      grantee: identity.studentDID,
      resource: 'premium:services:*',
      actions: ['read', 'write', 'execute'],
      conditions: {
        'identity.trustLevel': 'PREMIUM',
        'credential.verified': true
      },
      metadata: {
        transactionId,
        grantType: 'trust_based'
      }
    });

    console.log(`✅ Enhanced permissions granted: ${enhancedGrant.data.id}`);

    // Step 5: Log successful transaction completion
    await client.audit.logEvent({
      source: 'orchestrator',
      action: 'transaction_commit',
      resource: `transaction:${transactionId}`,
      actor: identity.studentDID,
      details: {
        status: 'success',
        operations: [
          { service: 'identity', operation: 'trust_update', result: 'success' },
          { service: 'credentials', operation: 'issue', result: 'success' },
          { service: 'permissions', operation: 'grant', result: 'success' }
        ]
      }
    });

    console.log(`✅ Transaction committed successfully: ${transactionId}`);

  } catch (error) {
    // Rollback transaction on error
    await client.audit.logEvent({
      source: 'orchestrator',
      action: 'transaction_rollback',
      resource: `transaction:${transactionId}`,
      actor: identity.studentDID,
      details: {
        status: 'failed',
        error: error.message,
        rollbackReason: 'Operation failed, reverting changes'
      }
    });

    console.error(`❌ Transaction rolled back: ${transactionId}`);
    throw error;
  }
}

// Use Case 4: Error Handling and Retry Patterns
async function errorHandlingPatterns(client, actorDID) {
  console.log('🔄 Demonstrating advanced error handling patterns...');

  // Exponential backoff retry pattern
  async function retryWithBackoff(operation, maxRetries = 3) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === maxRetries - 1) throw error;
        
        const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
        console.log(`⏱️ Retry attempt ${attempt + 1}/${maxRetries} after ${delay}ms`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  // Circuit breaker pattern
  class CircuitBreaker {
    constructor(threshold = 3, timeout = 30000) {
      this.threshold = threshold;
      this.timeout = timeout;
      this.failureCount = 0;
      this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
      this.lastFailureTime = null;
    }

    async execute(operation) {
      if (this.state === 'OPEN') {
        if (Date.now() - this.lastFailureTime > this.timeout) {
          this.state = 'HALF_OPEN';
        } else {
          throw new Error('Circuit breaker is OPEN');
        }
      }

      try {
        const result = await operation();
        this.onSuccess();
        return result;
      } catch (error) {
        this.onFailure();
        throw error;
      }
    }

    onSuccess() {
      this.failureCount = 0;
      this.state = 'CLOSED';
    }

    onFailure() {
      this.failureCount++;
      this.lastFailureTime = Date.now();
      if (this.failureCount >= this.threshold) {
        this.state = 'OPEN';
      }
    }
  }

  const circuitBreaker = new CircuitBreaker(2, 5000);

  // Test retry pattern
  console.log('🔄 Testing retry pattern...');
  try {
    await retryWithBackoff(async () => {
      // Simulate an operation that might fail
      if (Math.random() < 0.7) { // 70% chance of failure
        throw new Error('Simulated network error');
      }
      
      return await client.audit.logEvent({
        source: 'error-handler',
        action: 'retry_test',
        resource: 'test:retry',
        actor: actorDID,
        details: { attempt: 'successful' }
      });
    });
    
    console.log('✅ Retry pattern succeeded');
  } catch (error) {
    console.log(`❌ Retry pattern failed: ${error.message}`);
  }

  // Test circuit breaker
  console.log('🔒 Testing circuit breaker pattern...');
  for (let i = 0; i < 5; i++) {
    try {
      await circuitBreaker.execute(async () => {
        if (i < 3) { // First 3 attempts fail
          throw new Error('Simulated service error');
        }
        return 'Success';
      });
      
      console.log(`✅ Circuit breaker attempt ${i + 1}: Success`);
    } catch (error) {
      console.log(`❌ Circuit breaker attempt ${i + 1}: ${error.message}`);
    }
  }
}

// Use Case 5: Batch Operations
async function batchOperationsExample(client, actorDID) {
  console.log('📦 Demonstrating batch operations...');

  // Batch audit logging
  const batchEvents = [];
  for (let i = 0; i < 5; i++) {
    batchEvents.push({
      source: 'batch-processor',
      action: 'batch_operation',
      resource: `resource:batch:${i}`,
      actor: actorDID,
      details: {
        batchId: 'batch-001',
        itemIndex: i,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Execute batch operations
  const batchResults = await Promise.allSettled(
    batchEvents.map(event => client.audit.logEvent(event))
  );

  const successCount = batchResults.filter(result => result.status === 'fulfilled').length;
  const failureCount = batchResults.filter(result => result.status === 'rejected').length;

  console.log(`📊 Batch operation results: ${successCount} succeeded, ${failureCount} failed`);

  // Batch permission grants
  const batchGrants = [];
  for (let i = 0; i < 3; i++) {
    batchGrants.push(
      client.permissions.grant({
        grantee: actorDID,
        resource: `batch:resource:${i}`,
        actions: ['read'],
        metadata: {
          batchId: 'grant-batch-001',
          itemIndex: i
        }
      })
    );
  }

  const grantResults = await Promise.allSettled(batchGrants);
  const grantSuccessCount = grantResults.filter(result => result.status === 'fulfilled').length;

  console.log(`🎫 Batch grant results: ${grantSuccessCount} grants created`);
}

// Run the example
if (import.meta.url === `file://${process.argv[1]}`) {
  advancedUseCasesExample().catch(console.error);
}

export { advancedUseCasesExample };