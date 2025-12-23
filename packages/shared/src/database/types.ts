import { Pool, PoolClient } from 'pg';

export interface DatabaseConfig {
  connectionString: string;
  ssl?: boolean;
  max?: number; // Maximum number of clients in the pool
  idleTimeoutMillis?: number;
  connectionTimeoutMillis?: number;
}

export interface DatabaseConnection {
  pool: Pool;
  query: (text: string, params?: any[]) => Promise<any>;
  getClient: () => Promise<PoolClient>;
  close: () => Promise<void>;
}

export interface QueryResult<T = any> {
  rows: T[];
  rowCount: number;
}

export interface TransactionCallback<T> {
  (client: PoolClient): Promise<T>;
}
