/**
 * Verifiable Credentials Example
 * 
 * This example demonstrates how to:
 * - Create and register credential schemas
 * - Issue verifiable credentials
 * - Create and verify presentations
 * - Manage credential lifecycle
 */

import { ATPClient, createQuickConfig, DIDUtils } from '@atp/sdk';

async function verifiableCredentialsExample() {
  console.log('📜 ATP™ SDK Verifiable Credentials Example\n');

  // Setup client
  const config = createQuickConfig('http://localhost');
  const client = new ATPClient(config);

  try {
    // Setup: Create issuer and holder identities
    console.log('🏗️ Setup: Creating issuer and holder identities...');
    
    // Generate issuer DID (e.g., university)
    const issuerData = await DIDUtils.generateDID({ network: 'testnet' });
    const issuerDID = issuerData.did;
    const issuerKey = issuerData.keyPair.privateKey;

    // Generate holder DID (e.g., student)
    const holderData = await DIDUtils.generateDID({ network: 'testnet' });
    const holderDID = holderData.did;
    const holderKey = holderData.keyPair.privateKey;

    console.log(`🏛️ Issuer DID: ${issuerDID}`);
    console.log(`👤 Holder DID: ${holderDID}`);
    console.log();

    // Authenticate as issuer
    client.setAuthentication({
      did: issuerDID,
      privateKey: issuerKey
    });

    // Step 1: Create a credential schema
    console.log('📋 Step 1: Creating credential schema...');
    const schema = await client.credentials.createSchema({
      name: 'University Degree Certificate',
      description: 'Official university degree certificate',
      version: '1.0.0',
      schema: {
        type: 'object',
        properties: {
          degree: {
            type: 'string',
            description: 'Type of degree earned'
          },
          major: {
            type: 'string',
            description: 'Field of study'
          },
          university: {
            type: 'string',
            description: 'Name of the university'
          },
          graduationDate: {
            type: 'string',
            format: 'date',
            description: 'Date of graduation'
          },
          gpa: {
            type: 'number',
            minimum: 0,
            maximum: 4.0,
            description: 'Grade point average'
          },
          honors: {
            type: 'boolean',
            description: 'Whether degree was earned with honors'
          }
        },
        required: ['degree', 'major', 'university', 'graduationDate']
      }
    });

    console.log(`✅ Schema created with ID: ${schema.data.id}`);
    console.log();

    // Step 2: Issue a verifiable credential
    console.log('🎓 Step 2: Issuing verifiable credential...');
    const credential = await client.credentials.issue({
      schemaId: schema.data.id,
      holder: holderDID,
      claims: {
        degree: 'Bachelor of Science',
        major: 'Computer Science',
        university: 'ATP University',
        graduationDate: '2024-05-15',
        gpa: 3.75,
        honors: true
      },
      metadata: {
        issueReason: 'Academic achievement',
        validityPeriod: '10 years'
      }
    });

    console.log(`✅ Credential issued with ID: ${credential.data.id}`);
    console.log(`📅 Valid from: ${credential.data.validFrom}`);
    console.log(`📅 Valid until: ${credential.data.validUntil}`);
    console.log();

    // Step 3: Verify the credential
    console.log('🔍 Step 3: Verifying credential...');
    const verification = await client.credentials.verify({
      credentialId: credential.data.id,
      checkRevocation: true,
      checkExpiry: true
    });

    console.log(`✅ Verification result: ${verification.data.valid ? 'Valid' : 'Invalid'}`);
    console.log(`🔐 Signature valid: ${verification.data.signatureValid}`);
    console.log(`📋 Schema valid: ${verification.data.schemaValid}`);
    console.log(`⏰ Not expired: ${verification.data.notExpired}`);
    console.log(`🚫 Not revoked: ${verification.data.notRevoked}`);
    console.log();

    // Step 4: Switch to holder and create a presentation
    console.log('👤 Step 4: Creating verifiable presentation as holder...');
    client.setAuthentication({
      did: holderDID,
      privateKey: holderKey
    });

    const presentation = await client.credentials.createPresentation({
      credentialIds: [credential.data.id],
      audience: 'did:atp:testnet:employer123',
      challenge: 'job-application-2024-001',
      purpose: 'Employment verification'
    });

    console.log(`✅ Presentation created with ID: ${presentation.data.id}`);
    console.log(`🎯 Audience: ${presentation.data.audience}`);
    console.log(`🔑 Challenge: ${presentation.data.challenge}`);
    console.log();

    // Step 5: Verify the presentation (as the audience/verifier)
    console.log('🔎 Step 5: Verifying presentation...');
    const presentationVerification = await client.credentials.verifyPresentation({
      presentationId: presentation.data.id,
      expectedChallenge: 'job-application-2024-001',
      expectedAudience: 'did:atp:testnet:employer123'
    });

    console.log(`✅ Presentation verification: ${presentationVerification.data.valid ? 'Valid' : 'Invalid'}`);
    console.log(`👤 Holder verified: ${presentationVerification.data.holderValid}`);
    console.log(`🔐 Signature verified: ${presentationVerification.data.signatureValid}`);
    console.log(`🎯 Challenge matched: ${presentationVerification.data.challengeValid}`);
    console.log();

    // Step 6: Query credentials (back to issuer)
    console.log('📊 Step 6: Querying issued credentials...');
    client.setAuthentication({
      did: issuerDID,
      privateKey: issuerKey
    });

    const credentialQuery = await client.credentials.query({
      issuer: issuerDID,
      schemaId: schema.data.id,
      status: 'active',
      limit: 10
    });

    console.log(`📋 Found ${credentialQuery.data.total} credentials`);
    credentialQuery.data.credentials.forEach((cred, index) => {
      console.log(`  ${index + 1}. ID: ${cred.id}, Holder: ${cred.holder}, Status: ${cred.status}`);
    });
    console.log();

    // Step 7: Demonstrate credential lifecycle
    console.log('♻️ Step 7: Demonstrating credential lifecycle...');
    
    // Suspend credential
    console.log('⏸️ Suspending credential...');
    await client.credentials.suspend({
      credentialId: credential.data.id,
      reason: 'Academic probation'
    });

    // Check status
    const suspendedStatus = await client.credentials.getStatus(credential.data.id);
    console.log(`Status after suspension: ${suspendedStatus.data.status}`);

    // Reactivate credential
    console.log('▶️ Reactivating credential...');
    await client.credentials.reactivate({
      credentialId: credential.data.id,
      reason: 'Probation resolved'
    });

    const reactivatedStatus = await client.credentials.getStatus(credential.data.id);
    console.log(`Status after reactivation: ${reactivatedStatus.data.status}`);
    console.log();

    // Step 8: Get credential analytics
    console.log('📈 Step 8: Getting credential analytics...');
    const analytics = await client.credentials.getAnalytics({
      issuer: issuerDID,
      timeframe: 'last_30_days'
    });

    console.log(`📊 Analytics Summary:`);
    console.log(`  Total issued: ${analytics.data.totalIssued}`);
    console.log(`  Currently active: ${analytics.data.active}`);
    console.log(`  Revoked: ${analytics.data.revoked}`);
    console.log(`  Verification requests: ${analytics.data.verificationRequests}`);

  } catch (error) {
    console.error('❌ Verifiable credentials example failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  } finally {
    client.cleanup();
    console.log('\n✨ Verifiable credentials example completed!');
  }
}

// Run the example
if (import.meta.url === `file://${process.argv[1]}`) {
  verifiableCredentialsExample().catch(console.error);
}

export { verifiableCredentialsExample };