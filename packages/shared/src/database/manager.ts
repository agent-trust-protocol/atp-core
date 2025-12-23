import { Pool, PoolClient } from 'pg';
import { DatabaseConfig, DatabaseConnection, TransactionCallback } from './types.js';

export class DatabaseManager implements DatabaseConnection {
  private _pool: Pool;

  constructor(config: DatabaseConfig) {
    this._pool = new Pool({
      connectionString: config.connectionString,
      ssl: config.ssl ? { rejectUnauthorized: false } : false,
      max: config.max || 20,
      idleTimeoutMillis: config.idleTimeoutMillis || 30000,
      connectionTimeoutMillis: config.connectionTimeoutMillis || 2000
    });

    // Set search path for ATP schemas on each new connection
    this._pool.on('connect', async (client) => {
      try {
        await client.query('SET search_path TO atp_identity, atp_permissions, atp_credentials, atp_audit, atp_metrics, public');
        console.log('✅ Search path set for new database connection');
      } catch (error) {
        console.error('❌ Failed to set search path:', error);
      }
    });

    // Handle pool errors
    this._pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }

  get pool(): Pool {
    return this._pool;
  }

  async query(text: string, params?: any[]): Promise<any> {
    const start = Date.now();
    try {
      const res = await this._pool.query(text, params);
      const duration = Date.now() - start;
      console.log('Executed query', { text, duration, rows: res.rowCount });
      return res;
    } catch (error) {
      const duration = Date.now() - start;
      console.error('Query error', { text, duration, error });
      throw error;
    }
  }

  async getClient(): Promise<PoolClient> {
    return await this._pool.connect();
  }

  async transaction<T>(callback: TransactionCallback<T>): Promise<T> {
    const client = await this.getClient();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async close(): Promise<void> {
    await this._pool.end();
  }

  async healthCheck(): Promise<{ healthy: boolean; message?: string }> {
    try {
      const result = await this.query('SELECT 1 as health_check');
      return {
        healthy: result.rows.length > 0 && result.rows[0].health_check === 1,
        message: 'Database connection successful'
      };
    } catch (error) {
      return {
        healthy: false,
        message: `Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}
