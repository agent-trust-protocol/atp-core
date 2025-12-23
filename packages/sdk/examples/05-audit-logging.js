/**
 * Audit Logging Example
 * 
 * This example demonstrates how to:
 * - Log audit events for various activities
 * - Query and search audit trails
 * - Verify audit chain integrity
 * - Generate compliance reports
 * - Monitor real-time audit events
 */

import { ATPClient, createQuickConfig, DIDUtils } from '@atp/sdk';

async function auditLoggingExample() {
  console.log('📋 ATP™ SDK Audit Logging Example\n');

  // Setup client
  const config = createQuickConfig('http://localhost');
  const client = new ATPClient(config);

  try {
    // Setup: Create identities for different actors
    console.log('🏗️ Setup: Creating actor identities...');
    
    const adminData = await DIDUtils.generateDID({ network: 'testnet' });
    const adminDID = adminData.did;
    const adminKey = adminData.keyPair.privateKey;

    const userDID = 'did:atp:testnet:user123';
    const systemDID = 'did:atp:testnet:system';

    console.log(`👑 Admin DID: ${adminDID}`);
    console.log(`👤 User DID: ${userDID}`);
    console.log(`🖥️ System DID: ${systemDID}`);
    console.log();

    // Authenticate as admin
    client.setAuthentication({
      did: adminDID,
      privateKey: adminKey
    });

    // Step 1: Log various audit events
    console.log('📝 Step 1: Logging audit events...');
    
    // Login event
    const loginEvent = await client.audit.logEvent({
      source: 'identity-service',
      action: 'user_login',
      resource: `user:${userDID}`,
      actor: userDID,
      details: {
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Web Browser)',
        mfaUsed: true,
        loginMethod: 'password_mfa'
      }
    });

    console.log(`✅ Login event logged: ${loginEvent.data.id}`);

    // Document access event
    const documentAccessEvent = await client.audit.logEvent({
      source: 'document-service',
      action: 'document_read',
      resource: 'document:quarterly-report-2024',
      actor: userDID,
      details: {
        documentSize: 1024000,
        accessMethod: 'web_interface',
        permissions: ['read'],
        classification: 'confidential'
      }
    });

    console.log(`✅ Document access event logged: ${documentAccessEvent.data.id}`);

    // Permission grant event
    const permissionEvent = await client.audit.logEvent({
      source: 'permission-service',
      action: 'permission_granted',
      resource: `permission:document:quarterly-report-2024`,
      actor: adminDID,
      details: {
        grantee: userDID,
        permissions: ['read', 'write'],
        grantReason: 'Quarterly review assignment',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    });

    console.log(`✅ Permission event logged: ${permissionEvent.data.id}`);

    // System event
    const systemEvent = await client.audit.logEvent({
      source: 'system',
      action: 'backup_completed',
      resource: 'database:primary',
      actor: systemDID,
      details: {
        backupSize: 5.2e9, // 5.2GB
        backupLocation: 's3://atp-backups/2024-06-28/',
        backupDuration: 1847, // seconds
        checksumValid: true
      }
    });

    console.log(`✅ System event logged: ${systemEvent.data.id}`);
    console.log();

    // Step 2: Query audit events
    console.log('🔍 Step 2: Querying audit events...');
    
    // Query events by actor
    const userEvents = await client.audit.queryEvents({
      actor: userDID,
      limit: 10
    });

    console.log(`📋 Found ${userEvents.data.total} events for user:`);
    userEvents.data.events.forEach((event, index) => {
      console.log(`  ${index + 1}. ${event.action} on ${event.resource} (${event.timestamp})`);
    });
    console.log();

    // Query events by time range
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const recentEvents = await client.audit.queryEvents({
      startTime: todayStart.toISOString(),
      endTime: new Date().toISOString(),
      limit: 20
    });

    console.log(`📅 Found ${recentEvents.data.total} events today`);
    console.log();

    // Step 3: Get resource audit trail
    console.log('📂 Step 3: Getting resource audit trail...');
    
    const documentTrail = await client.audit.getResourceAuditTrail(
      'document:quarterly-report-2024',
      {
        limit: 5
      }
    );

    console.log(`📄 Document audit trail (${documentTrail.data.total} events):`);
    console.log(`   First event: ${documentTrail.data.summary.firstEvent}`);
    console.log(`   Last event: ${documentTrail.data.summary.lastEvent}`);
    console.log(`   Unique actors: ${documentTrail.data.summary.uniqueActors}`);
    console.log(`   Action counts:`, documentTrail.data.summary.actionCounts);
    console.log();

    // Step 4: Search audit events with advanced filters
    console.log('🔎 Step 4: Advanced audit search...');
    
    const searchResults = await client.audit.searchEvents({
      query: 'quarterly report',
      filters: {
        actions: ['document_read', 'document_write', 'permission_granted'],
        hasDetails: true
      },
      sort: {
        field: 'timestamp',
        order: 'desc'
      },
      limit: 5
    });

    console.log(`🔍 Search results (${searchResults.data.total} matches):`);
    console.log(`📊 Facets:`, searchResults.data.facets);
    searchResults.data.events.forEach((event, index) => {
      console.log(`  ${index + 1}. ${event.action} by ${event.actor} (${event.timestamp})`);
    });
    console.log();

    // Step 5: Verify audit chain integrity
    console.log('🔐 Step 5: Verifying audit chain integrity...');
    
    const integrityCheck = await client.audit.verifyIntegrity();
    
    console.log(`🛡️ Audit Chain Integrity:`);
    console.log(`   Valid: ${integrityCheck.data.valid ? '✅' : '❌'}`);
    console.log(`   Total events: ${integrityCheck.data.totalEvents}`);
    console.log(`   Verified events: ${integrityCheck.data.verifiedEvents}`);
    console.log(`   Chain hash: ${integrityCheck.data.chainHash}`);
    
    if (!integrityCheck.data.valid && integrityCheck.data.brokenAt) {
      console.log(`   ⚠️ Chain broken at: ${integrityCheck.data.brokenAt}`);
    }
    console.log();

    // Step 6: Get blockchain anchoring information
    console.log('⛓️ Step 6: Checking blockchain anchoring...');
    
    try {
      const blockchainAnchor = await client.audit.getBlockchainAnchor(loginEvent.data.id);
      
      console.log(`🔗 Blockchain Anchor for login event:`);
      console.log(`   Block index: ${blockchainAnchor.data.blockIndex}`);
      console.log(`   Transaction ID: ${blockchainAnchor.data.transactionId}`);
      console.log(`   Anchored at: ${blockchainAnchor.data.anchoredAt}`);
      
      // Verify the anchor
      const anchorVerification = await client.audit.verifyBlockchainAnchor(blockchainAnchor.data);
      console.log(`   Verification: ${anchorVerification.data.valid ? '✅ Valid' : '❌ Invalid'}`);
      console.log(`   Confirmations: ${anchorVerification.data.confirmations}`);
    } catch (error) {
      console.log(`ℹ️ Blockchain anchoring not available (demo mode)`);
    }
    console.log();

    // Step 7: Generate compliance report
    console.log('📊 Step 7: Generating compliance report...');
    
    const reportEndDate = new Date();
    const reportStartDate = new Date(reportEndDate.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    
    const complianceReport = await client.audit.generateComplianceReport({
      startDate: reportStartDate.toISOString(),
      endDate: reportEndDate.toISOString(),
      reportType: 'security',
      filters: {
        actions: ['user_login', 'permission_granted', 'document_read']
      },
      format: 'json'
    });

    console.log(`📋 Compliance Report Generated:`);
    console.log(`   Report ID: ${complianceReport.data.reportId}`);
    console.log(`   Total events: ${complianceReport.data.summary.totalEvents}`);
    console.log(`   Unique actors: ${complianceReport.data.summary.uniqueActors}`);
    console.log(`   Security events: ${complianceReport.data.summary.securityEvents}`);
    console.log(`   Integrity violations: ${complianceReport.data.summary.integrityViolations}`);
    console.log();

    // Step 8: Export audit data
    console.log('📤 Step 8: Exporting audit data...');
    
    const exportRequest = await client.audit.exportAuditData({
      startDate: reportStartDate.toISOString(),
      endDate: reportEndDate.toISOString(),
      format: 'csv',
      includeDetails: true,
      compression: 'gzip'
    });

    console.log(`📦 Export Request:`);
    console.log(`   Export ID: ${exportRequest.data.exportId}`);
    console.log(`   Event count: ${exportRequest.data.eventCount}`);
    console.log(`   File size: ${Math.round(exportRequest.data.fileSize / 1024)} KB`);
    console.log(`   Download URL: ${exportRequest.data.downloadUrl}`);
    console.log(`   Expires at: ${exportRequest.data.expiresAt}`);
    console.log();

    // Step 9: Get audit statistics
    console.log('📈 Step 9: Getting audit statistics...');
    
    const auditStats = await client.audit.getStats({
      startDate: reportStartDate.toISOString(),
      endDate: reportEndDate.toISOString(),
      groupBy: 'day'
    });

    console.log(`📊 Audit Statistics:`);
    console.log(`   Total events: ${auditStats.data.totalEvents}`);
    console.log(`   Events by source:`, auditStats.data.eventsBySource);
    console.log(`   Events by action:`, auditStats.data.eventsByAction);
    console.log(`   Integrity status: ${auditStats.data.integrityStatus}`);
    console.log(`   Recent activity (${auditStats.data.recentActivity.length} data points):`);
    
    auditStats.data.recentActivity.slice(0, 3).forEach((activity, index) => {
      console.log(`     ${activity.timestamp}: ${activity.eventCount} events`);
    });
    console.log();

    // Step 10: Real-time monitoring
    console.log('⚡ Step 10: Monitoring recent events...');
    
    const recentAuditEvents = await client.audit.getRecentEvents({
      limit: 5,
      sources: ['identity-service', 'document-service']
    });

    console.log(`🔄 Recent events (${recentAuditEvents.data.events.length}):`);
    recentAuditEvents.data.events.forEach((event, index) => {
      console.log(`  ${index + 1}. [${event.source}] ${event.action} (${event.timestamp})`);
    });
    console.log(`   Last event time: ${recentAuditEvents.data.lastEventTime}`);
    console.log(`   Has more: ${recentAuditEvents.data.hasMore}`);

  } catch (error) {
    console.error('❌ Audit logging example failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  } finally {
    client.cleanup();
    console.log('\n✨ Audit logging example completed!');
  }
}

// Run the example
if (import.meta.url === `file://${process.argv[1]}`) {
  auditLoggingExample().catch(console.error);
}

export { auditLoggingExample };