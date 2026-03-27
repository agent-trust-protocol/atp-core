#!/usr/bin/env node

import WebSocket from 'ws';

console.log('Testing WebSocket connection to quantum-safe server...');

const ws = new WebSocket('ws://127.0.0.1:3008', {
  headers: {
    'x-atp-did': 'did:atp:test-client',
    'x-atp-trust-level': 'basic',
    'x-atp-auth-method': 'test'
  }
});

ws.on('open', () => {
  console.log('✅ WebSocket connection successful!');
  ws.close();
  process.exit(0);
});

ws.on('error', (err) => {
  console.log('❌ WebSocket error:', err.message);
  process.exit(1);
});

ws.on('close', () => {
  console.log('🔌 Connection closed');
});

setTimeout(() => {
  console.log('⏰ Connection timeout');
  process.exit(1);
}, 5000);