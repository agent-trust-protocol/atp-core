/**
 * Real-time Monitoring Example
 * 
 * This example demonstrates how to:
 * - Connect to real-time event streams
 * - Monitor security events and alerts
 * - Handle different types of real-time notifications
 * - Implement event filtering and processing
 * - Manage WebSocket connections and reconnection
 */

import { ATPClient, createQuickConfig, DIDUtils } from '@atp/sdk';

async function realTimeMonitoringExample() {
  console.log('⚡ ATP™ SDK Real-time Monitoring Example\n');

  // Setup client
  const config = createQuickConfig('http://localhost');
  const client = new ATPClient(config);

  try {
    // Setup: Create monitoring identity
    console.log('🏗️ Setup: Creating monitoring identity...');
    
    const monitorData = await DIDUtils.generateDID({ network: 'testnet' });
    const monitorDID = monitorData.did;
    const monitorKey = monitorData.keyPair.privateKey;

    console.log(`📡 Monitor DID: ${monitorDID}`);
    console.log();

    // Authenticate as monitor
    client.setAuthentication({
      did: monitorDID,
      privateKey: monitorKey
    });

    // Step 1: Set up event handlers
    console.log('🎧 Step 1: Setting up real-time event handlers...');
    
    // Connection status handlers
    client.gateway.on('connected', () => {
      console.log('✅ Connected to real-time event stream');
    });

    client.gateway.on('disconnected', () => {
      console.log('❌ Disconnected from event stream');
    });

    client.gateway.on('error', (error) => {
      console.error('🚨 WebSocket error:', error.message);
    });

    // General event handler
    client.gateway.on('event', (event) => {
      console.log(`📨 Received event: ${event.type} from ${event.source}`);
    });

    // Specific event type handlers
    client.gateway.on('identity.login', (event) => {
      console.log(`👤 Login Event: ${event.data.actor} from ${event.data.details?.ipAddress}`);
    });

    client.gateway.on('identity.mfa_failure', (event) => {
      console.log(`🚨 MFA Failure: ${event.data.actor} - ${event.data.details?.reason}`);
    });

    client.gateway.on('permission.access_denied', (event) => {
      console.log(`🚫 Access Denied: ${event.data.actor} -> ${event.data.resource}`);
    });

    client.gateway.on('audit.integrity_violation', (event) => {
      console.log(`⚠️ Integrity Violation: ${event.data.details?.violation}`);
    });

    client.gateway.on('system.alert', (event) => {
      console.log(`🔔 System Alert: ${event.data.severity} - ${event.data.message}`);
    });

    console.log('📝 Event handlers configured');
    console.log();

    // Step 2: Connect to event stream with filters
    console.log('🔌 Step 2: Connecting to filtered event stream...');
    
    await client.gateway.connectEventStream({
      filters: {
        eventTypes: [
          'identity.login',
          'identity.mfa_failure', 
          'permission.access_denied',
          'audit.integrity_violation',
          'system.alert'
        ],
        severities: ['medium', 'high', 'critical']
      },
      autoReconnect: true
    });

    console.log(`🔗 Connection status: ${client.gateway.connectionStatus}`);
    console.log();

    // Step 3: Simulate some activity and monitor events
    console.log('🎭 Step 3: Simulating activity to generate events...');
    
    // Simulate login attempts (these would trigger real-time events)
    await simulateActivity(client);
    
    // Wait for events to be processed
    await new Promise(resolve => setTimeout(resolve, 2000));
    console.log();

    // Step 4: Get security events from gateway
    console.log('🛡️ Step 4: Retrieving security events...');
    
    const securityEvents = await client.gateway.getSecurityEvents({
      type: 'authentication_failure',
      severity: 'high',
      limit: 5
    });

    console.log(`🚨 Security Events (${securityEvents.data.total} total):`);
    securityEvents.data.events.forEach((event, index) => {
      console.log(`  ${index + 1}. [${event.severity}] ${event.type} - ${event.source}`);
      console.log(`     Time: ${event.timestamp}`);
      console.log(`     Handled: ${event.handled ? '✅' : '❌'}`);
    });
    console.log();

    // Step 5: Send commands through WebSocket
    console.log('📤 Step 5: Sending commands through WebSocket...');
    
    try {
      await client.gateway.sendCommand({
        type: 'subscribe_alerts',
        data: {
          severities: ['critical'],
          immediate: true
        }
      });

      console.log('✅ Subscribed to critical alerts');

      await client.gateway.sendCommand({
        type: 'ping',
        data: { timestamp: new Date().toISOString() }
      });

      console.log('✅ Ping command sent');
    } catch (error) {
      console.log('ℹ️ Command sending not available (demo mode)');
    }
    console.log();

    // Step 6: Monitor audit notifications
    console.log('🔔 Step 6: Checking audit notifications...');
    
    const notifications = await client.audit.getNotifications({
      severity: 'high',
      acknowledged: false,
      limit: 5
    });

    console.log(`📢 Audit Notifications (${notifications.data.total} unacknowledged):`);
    notifications.data.notifications.forEach((notification, index) => {
      console.log(`  ${index + 1}. [${notification.severity}] ${notification.message}`);
      console.log(`     Event ID: ${notification.eventId}`);
      console.log(`     Created: ${notification.createdAt}`);
    });

    // Acknowledge notifications
    if (notifications.data.notifications.length > 0) {
      const firstNotification = notifications.data.notifications[0];
      await client.audit.acknowledgeNotification(firstNotification.id);
      console.log(`✅ Acknowledged notification: ${firstNotification.id}`);
    }
    console.log();

    // Step 7: Get real-time gateway status
    console.log('📊 Step 7: Monitoring gateway status...');
    
    const gatewayStatus = await client.gateway.getStatus();
    
    console.log(`🚦 Gateway Status: ${gatewayStatus.data.status}`);
    console.log(`📈 Load: CPU ${gatewayStatus.data.load.cpu}%, Memory ${gatewayStatus.data.load.memory}%`);
    console.log(`🔗 Connections: ${gatewayStatus.data.load.connections}`);
    console.log(`📋 Services:`);
    
    Object.entries(gatewayStatus.data.services).forEach(([service, info]) => {
      const statusIcon = info.status === 'up' ? '✅' : info.status === 'degraded' ? '⚠️' : '❌';
      console.log(`     ${statusIcon} ${service}: ${info.responseTime}ms (${info.lastCheck})`);
    });
    console.log();

    // Step 8: Monitor connection statistics
    console.log('📡 Step 8: Monitoring connection statistics...');
    
    const connectionStats = await client.gateway.getConnectionStats();
    
    console.log(`🔌 Connection Statistics:`);
    console.log(`   Total: ${connectionStats.data.totalConnections}`);
    console.log(`   Active: ${connectionStats.data.activeConnections}`);
    console.log(`   HTTP: ${connectionStats.data.httpConnections}`);
    console.log(`   WebSocket: ${connectionStats.data.wsConnections}`);
    console.log(`   TLS: ${connectionStats.data.tlsConnections}`);
    console.log(`   By service:`, connectionStats.data.connectionsByService);
    console.log();

    // Step 9: Test rate limiting status
    console.log('⏱️ Step 9: Checking rate limiting status...');
    
    const rateLimit = await client.gateway.getRateLimit();
    
    console.log(`⏰ Rate Limit Status:`);
    console.log(`   Remaining: ${rateLimit.data.remaining}/${rateLimit.data.limit}`);
    console.log(`   Reset time: ${rateLimit.data.resetTime}`);
    console.log(`   Window start: ${rateLimit.data.windowStart}`);
    console.log();

    // Step 10: Set up continuous monitoring
    console.log('🔄 Step 10: Setting up continuous monitoring...');
    
    let eventCount = 0;
    const monitoringDuration = 5000; // 5 seconds
    
    console.log(`⏱️ Monitoring for ${monitoringDuration/1000} seconds...`);
    
    // Count all events during monitoring period
    const eventCounter = (event) => {
      eventCount++;
      console.log(`📊 Event #${eventCount}: ${event.type} (${new Date().toLocaleTimeString()})`);
    };
    
    client.gateway.on('event', eventCounter);
    
    // Monitor for specified duration
    await new Promise(resolve => {
      setTimeout(() => {
        client.gateway.off('event', eventCounter);
        console.log(`✅ Monitoring completed. Received ${eventCount} events.`);
        resolve();
      }, monitoringDuration);
    });

  } catch (error) {
    console.error('❌ Real-time monitoring example failed:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  } finally {
    // Clean up WebSocket connection
    client.gateway.disconnectEventStream();
    client.cleanup();
    console.log('\n✨ Real-time monitoring example completed!');
  }
}

// Helper function to simulate activity
async function simulateActivity(client) {
  console.log('🎬 Simulating user activities...');
  
  try {
    // Simulate some audit events that might trigger real-time notifications
    await client.audit.logEvent({
      source: 'demo-simulator',
      action: 'user_login_attempt',
      resource: 'auth:system',
      actor: 'did:atp:testnet:demo-user',
      details: {
        ipAddress: '203.0.113.10',
        userAgent: 'Demo Browser',
        success: true,
        mfaRequired: true
      }
    });

    await client.audit.logEvent({
      source: 'demo-simulator', 
      action: 'suspicious_activity_detected',
      resource: 'security:monitor',
      actor: 'did:atp:testnet:suspicious-user',
      details: {
        activityType: 'multiple_failed_logins',
        attempts: 5,
        timeWindow: '60 seconds',
        blocked: true
      }
    });

    console.log('📝 Demo events logged');
    
  } catch (error) {
    console.log('ℹ️ Activity simulation not available (demo mode)');
  }
}

// Run the example
if (import.meta.url === `file://${process.argv[1]}`) {
  realTimeMonitoringExample().catch(console.error);
}

export { realTimeMonitoringExample };