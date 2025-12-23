/**
 * Database utilities for payment service
 */

import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://atp_user:dev_password@localhost:5432/atp_development',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test connection on startup
pool.on('connect', () => {
  console.log('✅ Database connected');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
});

export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const result = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log(`[DB] Query executed in ${duration}ms`);
    return result;
  } catch (error) {
    console.error('[DB Error]', error);
    throw error;
  }
};

export const getClient = async () => {
  return await pool.connect();
};

export default { query, getClient };
