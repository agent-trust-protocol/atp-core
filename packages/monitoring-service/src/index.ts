/**
 * ATP™ Monitoring Service - Main Server
 * Enterprise real-time monitoring and alerting system
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { WebSocketServer } from 'ws';
import { MonitoringController } from './controllers/monitoring.js';
import { MetricsCollector } from './services/metrics-collector.js';
import cron from 'node-cron';

const app = express();
const PORT = process.env.ATP_MONITORING_PORT || 3005;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://agenttrustprotocol.com', 'https://agenttrust.dev']
    : true,
  credentials: true
}));
app.use(compression());
app.use(express.json());

// Initialize controller
const monitoringController = new MonitoringController();
const metricsCollector = new MetricsCollector();

// Routes
app.get('/health', (req, res) => monitoringController.healthCheck(req, res));

// API Routes
const apiRouter = express.Router();

// Metrics endpoints
apiRouter.get('/metrics', (req, res) => monitoringController.getCurrentMetrics(req, res));
apiRouter.get('/metrics/history', (req, res) => monitoringController.getMetricsHistory(req, res));

// Service health
apiRouter.get('/services', (req, res) => monitoringController.getServiceHealth(req, res));

// Alerts
apiRouter.get('/alerts', (req, res) => monitoringController.getAlerts(req, res));
apiRouter.post('/alerts/:id/resolve', (req, res) => monitoringController.resolveAlert(req, res));

// Dashboard data
apiRouter.get('/dashboard', (req, res) => monitoringController.getDashboardData(req, res));

app.use('/api/monitoring', apiRouter);

// Legacy routes for backward compatibility
app.get('/monitoring/metrics', (req, res) => monitoringController.getCurrentMetrics(req, res));
app.get('/monitoring/dashboard', (req, res) => monitoringController.getDashboardData(req, res));

// WebSocket for real-time updates
const server = app.listen(PORT, () => {
  console.log(`🔍 ATP™ Monitoring Service started on port ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/api/monitoring/dashboard`);
  console.log(`🚨 Alerts: http://localhost:${PORT}/api/monitoring/alerts`);
});

const wss = new WebSocketServer({ server, path: '/ws' });
const clients = new Set<any>();

wss.on('connection', (ws) => {
  console.log('📡 Monitoring client connected via WebSocket');
  clients.add(ws);

  ws.on('close', () => {
    clients.delete(ws);
    console.log('📡 Monitoring client disconnected');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws);
  });
});

// Broadcast metrics to connected clients every 5 seconds
const broadcastMetrics = async () => {
  if (clients.size === 0) return;

  try {
    const metrics = await metricsCollector.collectMetrics();
    const message = JSON.stringify({
      type: 'metrics',
      data: metrics,
      timestamp: new Date().toISOString()
    });

    clients.forEach((client) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        try {
          client.send(message);
        } catch (error) {
          console.error('Failed to send WebSocket message:', error);
          clients.delete(client);
        }
      } else {
        clients.delete(client);
      }
    });
  } catch (error) {
    console.error('Failed to broadcast metrics:', error);
  }
};

// Start real-time metrics broadcasting
setInterval(broadcastMetrics, 5000); // Every 5 seconds

// Scheduled tasks
// Collect and store metrics every minute
cron.schedule('* * * * *', async () => {
  try {
    await monitoringController.getCurrentMetrics({ query: {}, params: {}, body: {} } as any, {
      json: () => {}, status: () => ({ json: () => {} })
    } as any);
  } catch (error) {
    console.error('Scheduled metrics collection failed:', error);
  }
});

// Cleanup old data every day at 2 AM
cron.schedule('0 2 * * *', async () => {
  console.log('🧹 Running daily cleanup...');
  // The storage service will handle cleanup
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 ATP™ Monitoring Service shutting down...');
  server.close(() => {
    console.log('✓ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🛑 ATP™ Monitoring Service shutting down...');
  server.close(() => {
    console.log('✓ Server closed');
    process.exit(0);
  });
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

console.log('🚀 ATP™ Monitoring Service initialized');
console.log('📈 Real-time metrics collection started');
console.log('🔔 Alert system active');
console.log('📡 WebSocket server ready for real-time updates');

export default app;