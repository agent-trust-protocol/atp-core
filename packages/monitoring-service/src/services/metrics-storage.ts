/**
 * ATP™ Monitoring Service - Metrics Storage
 */

import sqlite3 from 'sqlite3';
import { SystemMetrics, MetricsQuery } from '../types/metrics.js';
import { promisify } from 'util';

export class MetricsStorage {
  private db: sqlite3.Database;

  constructor(dbPath = 'monitoring.db') {
    this.db = new sqlite3.Database(dbPath);
    this.initializeDatabase();
  }

  private async initializeDatabase() {
    const run = promisify(this.db.run.bind(this.db));
    
    try {
      // Create metrics table
      await run(`
        CREATE TABLE IF NOT EXISTS metrics (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          timestamp TEXT NOT NULL,
          data TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create index on timestamp for faster queries
      await run(`
        CREATE INDEX IF NOT EXISTS idx_metrics_timestamp 
        ON metrics(timestamp)
      `);

      console.log('✓ Monitoring database initialized');
    } catch (error) {
      console.error('Failed to initialize monitoring database:', error);
    }
  }

  async storeMetrics(metrics: SystemMetrics): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.run(
        'INSERT INTO metrics (timestamp, data) VALUES (?, ?)',
        [metrics.timestamp, JSON.stringify(metrics)],
        (err) => {
          if (err) {
            console.error('Failed to store metrics:', err);
            reject(err);
          } else {
            resolve();
          }
        }
      );
    });
  }

  async getMetricsHistory(query: MetricsQuery): Promise<SystemMetrics[]> {
    return new Promise((resolve, reject) => {
      // Calculate time range
      const now = new Date();
      let startTime: Date;
      
      switch (query.timeRange) {
        case 'hour':
          startTime = new Date(now.getTime() - 60 * 60 * 1000);
          break;
        case 'day':
          startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startTime = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        default:
          startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000); // Default to day
      }

      this.db.all(
        `
        SELECT data FROM metrics 
        WHERE timestamp >= ? 
        ORDER BY timestamp DESC 
        LIMIT ?
        `,
        [startTime.toISOString(), query.limit || 100],
        (err, rows: any[]) => {
          if (err) {
            console.error('Failed to get metrics history:', err);
            resolve([]);
          } else {
            const metrics = rows.map((row: any) => JSON.parse(row.data));
            resolve(metrics);
          }
        }
      );
    });
  }

  async getLatestMetrics(): Promise<SystemMetrics | null> {
    const get = promisify(this.db.get.bind(this.db));
    
    try {
      const row = await get(
        'SELECT data FROM metrics ORDER BY timestamp DESC LIMIT 1'
      ) as any;
      
      return row ? JSON.parse(row.data) : null;
    } catch (error) {
      console.error('Failed to get latest metrics:', error);
      return null;
    }
  }

  async cleanup(): Promise<void> {
    return new Promise((resolve) => {
      // Keep only last 30 days of data
      const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      
      this.db.run(
        'DELETE FROM metrics WHERE timestamp < ?',
        [cutoffDate.toISOString()],
        (err) => {
          if (err) {
            console.error('Failed to cleanup metrics:', err);
          } else {
            console.log('✓ Cleaned up old monitoring data');
          }
          resolve();
        }
      );
    });
  }

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }
}