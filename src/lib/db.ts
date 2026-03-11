import { Pool } from 'pg';

/**
 * Shared PostgreSQL connection pool for the application.
 * Uses DATABASE_URL from environment variables.
 *
 * In development: connects to local PostgreSQL
 * In production: connects to managed PostgreSQL (e.g., Neon, Supabase, RDS)
 */

const {DATABASE_URL} = process.env;

// Only warn at runtime, not during build
if (!DATABASE_URL && typeof globalThis !== 'undefined' && process.env.NEXT_PHASE !== 'phase-production-build') {
  console.warn(
    '[DB] DATABASE_URL not set. Database features will not work.\n' +
    'Set DATABASE_URL=postgresql://user:pass@host:5432/dbname in your .env file.'
  );
}

// Create a singleton pool
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    if (!DATABASE_URL) {
      throw new Error(
        'DATABASE_URL environment variable is required. ' +
        'Set it in your .env file: DATABASE_URL=postgresql://user:pass@host:5432/dbname'
      );
    }
    pool = new Pool({
      connectionString: DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      // SSL: disabled for local dev and Fly internal network; enabled for external DBs
      ssl: DATABASE_URL.includes('localhost') || DATABASE_URL.includes('127.0.0.1') || DATABASE_URL.includes('sslmode=disable') || DATABASE_URL.includes('.flycast')
        ? false
        : { rejectUnauthorized: false }
    });

    pool.on('error', (err) => {
      console.error('[DB] Unexpected pool error:', err);
    });
  }
  return pool;
}

/**
 * Execute a parameterized query against the database.
 * Uses connection pooling for efficient resource management.
 */
export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const pool = getPool();
  const result = await pool.query(text, params);
  return result.rows as T[];
}

/**
 * Execute a query and return the first row or null.
 */
export async function queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] || null;
}

/**
 * Execute an INSERT/UPDATE/DELETE and return the number of affected rows.
 */
export async function execute(text: string, params?: any[]): Promise<number> {
  const pool = getPool();
  const result = await pool.query(text, params);
  return result.rowCount ?? 0;
}

/**
 * Initialize the application tables (api_keys, user_settings, etc.)
 * Better Auth creates its own tables (user, session, account, verification).
 * This function creates the additional tables our app needs.
 */
export async function initializeAppTables(): Promise<void> {
  const pool = getPool();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      key_prefix TEXT NOT NULL,
      key_hash TEXT NOT NULL,
      permissions TEXT[] DEFAULT ARRAY['read:agents', 'read:credentials'],
      environment TEXT NOT NULL DEFAULT 'development',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_used_at TIMESTAMPTZ,
      expires_at TIMESTAMPTZ,
      status TEXT NOT NULL DEFAULT 'active',
      rate_limit_rpm INTEGER NOT NULL DEFAULT 100,
      rate_limit_rpd INTEGER NOT NULL DEFAULT 10000,
      description TEXT,
      ip_whitelist TEXT[],
      CONSTRAINT valid_status CHECK (status IN ('active', 'revoked', 'expired')),
      CONSTRAINT valid_environment CHECK (environment IN ('development', 'staging', 'production'))
    );

    CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
    CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
    CREATE INDEX IF NOT EXISTS idx_api_keys_status ON api_keys(status);

    CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT PRIMARY KEY REFERENCES "user"(id) ON DELETE CASCADE,
      organization_name TEXT,
      webhook_url TEXT,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

export default { getPool, query, queryOne, execute, initializeAppTables };
