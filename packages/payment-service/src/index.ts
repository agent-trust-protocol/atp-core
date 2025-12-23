/**
 * ATP Payment Service - MVP
 * Supports Google AP2 and OpenAI ACP payment protocols
 */

import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import { mandateRouter } from './controllers/mandate.controller.js';
import { checkoutRouter } from './controllers/checkout.controller.js';
import { policyRouter } from './controllers/policy.controller.js';
import { transactionRouter } from './controllers/transaction.controller.js';

const app = express();
const PORT = process.env.PORT || 3009;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'payment-service',
    version: '1.0.0-mvp',
    timestamp: new Date().toISOString(),
    protocols: ['ap2', 'acp']
  });
});

// API Routes
app.use('/ap2', mandateRouter);          // AP2 mandate endpoints
app.use('/acp', checkoutRouter);         // ACP checkout endpoints
app.use('/payments/policies', policyRouter);      // Payment policy management
app.use('/payments/transactions', transactionRouter); // Transaction queries

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    service: 'payment-service'
  });
});

// Error handling
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[ERROR]', err.stack);
  res.status(err.statusCode || 500).json({
    error: err.name || 'Internal Server Error',
    message: err.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
app.listen(PORT, () => {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║         ATP Payment Service (MVP) - Starting...               ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');
  console.log();
  console.log(`💳 Payment Service listening on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log();
  console.log('📡 Supported Protocols:');
  console.log('   ├─ Google AP2 (Agent Payments Protocol)');
  console.log('   └─ OpenAI ACP (Agentic Commerce Protocol)');
  console.log();
  console.log('🎯 MVP Mode: Mock payment processing enabled');
  console.log('⚠️  No real money will be processed');
  console.log();
});

export default app;
