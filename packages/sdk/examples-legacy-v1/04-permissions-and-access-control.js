/**
 * Permissions and Access Control Example
 * 
 * This example demonstrates how to:
 * - Create and manage permission policies
 * - Grant and revoke permissions
 * - Evaluate access control decisions
 * - Use capability tokens for delegation
 */

import { ATPClient, createQuickConfig, DIDUtils } from '@atp/sdk';

async function permissionsAccessControlExample() {
  console.log('🔒 ATP™ SDK Permissions and Access Control Example\n');

  // Setup client
  const config = createQuickConfig('http://localhost');
  const client = new ATPClient(config);

  try {
    // Setup: Create admin, user, and resource owner identities
    console.log('🏗️ Setup: Creating identities...');
    
    const adminData = await DIDUtils.generateDID({ network: 'testnet' });
    const adminDID = adminData.did;
    const adminKey = adminData.keyPair.privateKey;

    const userData = await DIDUtils.generateDID({ network: 'testnet' });
    const userDID = userData.did;
    const userKey = userData.keyPair.privateKey;

    const resourceData = await DIDUtils.generateDID({ network: 'testnet' });
    const resourceDID = resourceData.did;

    console.log(`👑 Admin DID: ${adminDID}`);
    console.log(`👤 User DID: ${userDID}`);
    console.log(`📁 Resource DID: ${resourceDID}`);
    console.log();

    // Authenticate as admin
    client.setAuthentication({
      did: adminDID,
      privateKey: adminKey
    });

    // Step 1: Create permission policies
    console.log('📋 Step 1: Creating permission policies...');
    
    // Policy for document access
    const documentPolicy = await client.permissions.createPolicy({
      name: 'Document Access Policy',
      description: 'Controls access to organizational documents',
      version: '1.0.0',
      rules: [
        {
          action: 'read',
          resource: 'document:*',
          effect: 'allow',
          conditions: [
            {
              attribute: 'user.department',
              operator: 'equals',
              value: 'engineering'
            }
          ]
        },
        {
          action: 'write',
          resource: 'document:*',
          effect: 'allow',
          conditions: [
            {
              attribute: 'user.role',
              operator: 'in',
              value: ['manager', 'admin']
            }
          ]
        },
        {
          action: 'delete',
          resource: 'document:*',
          effect: 'allow',
          conditions: [
            {
              attribute: 'user.role',
              operator: 'equals',
              value: 'admin'
            }
          ]
        }
      ]
    });

    console.log(`✅ Document policy created: ${documentPolicy.data.id}`);

    // Policy for API access
    const apiPolicy = await client.permissions.createPolicy({
      name: 'API Access Policy',
      description: 'Controls access to API endpoints',
      version: '1.0.0',
      rules: [
        {
          action: 'api:call',
          resource: 'api:/public/*',
          effect: 'allow',
          conditions: []
        },
        {
          action: 'api:call',
          resource: 'api:/admin/*',
          effect: 'allow',
          conditions: [
            {
              attribute: 'user.role',
              operator: 'equals',
              value: 'admin'
            }
          ]
        }
      ]
    });

    console.log(`✅ API policy created: ${apiPolicy.data.id}`);
    console.log();

    // Step 2: Grant permissions to user
    console.log('🎫 Step 2: Granting permissions to user...');
    
    const documentGrant = await client.permissions.grant({
      grantee: userDID,
      resource: `document:${resourceDID}:quarterly-report`,
      actions: ['read', 'write'],
      policyId: documentPolicy.data.id,
      conditions: {
        'user.department': 'engineering',
        'user.role': 'manager'
      },
      metadata: {
        grantedBy: adminDID,
        reason: 'User needs access for quarterly review'
      }
    });

    console.log(`✅ Document permission granted: ${documentGrant.data.id}`);

    const apiGrant = await client.permissions.grant({
      grantee: userDID,
      resource: 'api:/public/reports',
      actions: ['api:call'],
      policyId: apiPolicy.data.id,
      metadata: {
        grantedBy: adminDID,
        reason: 'Access to public reporting API'
      }
    });

    console.log(`✅ API permission granted: ${apiGrant.data.id}`);
    console.log();

    // Step 3: Evaluate access control decisions
    console.log('⚖️ Step 3: Evaluating access control decisions...');
    
    // Test document read access
    const readDecision = await client.permissions.evaluate({
      subject: userDID,
      action: 'read',
      resource: `document:${resourceDID}:quarterly-report`,
      context: {
        'user.department': 'engineering',
        'user.role': 'manager',
        'time.hour': 14,
        'ip.address': '192.168.1.100'
      }
    });

    console.log(`📖 Read access decision: ${readDecision.data.decision}`);
    console.log(`   Reason: ${readDecision.data.reason}`);

    // Test document delete access
    const deleteDecision = await client.permissions.evaluate({
      subject: userDID,
      action: 'delete',
      resource: `document:${resourceDID}:quarterly-report`,
      context: {
        'user.department': 'engineering',
        'user.role': 'manager'
      }
    });

    console.log(`🗑️ Delete access decision: ${deleteDecision.data.decision}`);
    console.log(`   Reason: ${deleteDecision.data.reason}`);

    // Test API access
    const apiDecision = await client.permissions.evaluate({
      subject: userDID,
      action: 'api:call',
      resource: 'api:/public/reports',
      context: {}
    });

    console.log(`🔌 API access decision: ${apiDecision.data.decision}`);
    console.log(`   Reason: ${apiDecision.data.reason}`);
    console.log();

    // Step 4: Create and use capability tokens
    console.log('🎟️ Step 4: Creating capability tokens...');
    
    const capabilityToken = await client.permissions.createCapabilityToken({
      grantee: userDID,
      capabilities: [
        'document:read',
        'document:write'
      ],
      resource: `document:${resourceDID}:quarterly-report`,
      restrictions: {
        timeWindow: {
          start: new Date().toISOString(),
          end: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        },
        usageLimit: 10
      },
      metadata: {
        purpose: 'Temporary document access for review'
      }
    });

    console.log(`✅ Capability token created: ${capabilityToken.data.id}`);
    console.log(`🔑 Token: ${capabilityToken.data.token.substring(0, 50)}...`);
    console.log();

    // Step 5: Verify capability token
    console.log('🔍 Step 5: Verifying capability token...');
    
    const tokenVerification = await client.permissions.verifyCapabilityToken({
      token: capabilityToken.data.token,
      requiredCapability: 'document:read',
      resource: `document:${resourceDID}:quarterly-report`
    });

    console.log(`✅ Token verification: ${tokenVerification.data.valid ? 'Valid' : 'Invalid'}`);
    console.log(`👤 Subject: ${tokenVerification.data.subject}`);
    console.log(`🎯 Capabilities: ${tokenVerification.data.capabilities?.join(', ')}`);
    console.log();

    // Step 6: Get permission analytics
    console.log('📊 Step 6: Getting permission analytics...');
    
    const analytics = await client.permissions.getAnalytics({
      subject: userDID,
      timeframe: 'last_7_days'
    });

    console.log(`📈 Permission Analytics:`);
    console.log(`  Total grants: ${analytics.data.totalGrants}`);
    console.log(`  Active grants: ${analytics.data.activeGrants}`);
    console.log(`  Access requests: ${analytics.data.accessRequests}`);
    console.log(`  Denied requests: ${analytics.data.deniedRequests}`);
    console.log();

    // Step 7: List and manage permissions
    console.log('📋 Step 7: Managing permissions...');
    
    // List all grants for user
    const userGrants = await client.permissions.listGrants({
      grantee: userDID,
      status: 'active'
    });

    console.log(`👤 User has ${userGrants.data.total} active grants:`);
    userGrants.data.grants.forEach((grant, index) => {
      console.log(`  ${index + 1}. Resource: ${grant.resource}, Actions: ${grant.actions.join(', ')}`);
    });
    console.log();

    // Step 8: Revoke a permission
    console.log('🚫 Step 8: Revoking permission...');
    
    await client.permissions.revoke({
      grantId: apiGrant.data.id,
      reason: 'Access no longer needed'
    });

    console.log(`✅ API permission revoked`);

    // Verify revocation
    const revokedApiDecision = await client.permissions.evaluate({
      subject: userDID,
      action: 'api:call',
      resource: 'api:/public/reports',
      context: {}
    });

    console.log(`🔌 API access after revocation: ${revokedApiDecision.data.decision}`);
    console.log();

    // Step 9: Audit permission changes
    console.log('📝 Step 9: Auditing permission changes...');
    
    const auditTrail = await client.permissions.getAuditTrail({
      subject: userDID,
      actions: ['grant', 'revoke'],
      limit: 10
    });

    console.log(`📋 Permission audit trail (${auditTrail.data.total} events):`);
    auditTrail.data.events.forEach((event, index) => {
      console.log(`  ${index + 1}. ${event.action} - ${event.resource} (${event.timestamp})`);
    });

  } catch (error) {
    console.error('❌ Permissions and access control example failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  } finally {
    client.cleanup();
    console.log('\n✨ Permissions and access control example completed!');
  }
}

// Run the example
if (import.meta.url === `file://${process.argv[1]}`) {
  permissionsAccessControlExample().catch(console.error);
}

export { permissionsAccessControlExample };