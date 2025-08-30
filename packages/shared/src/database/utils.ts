import { DatabaseManager } from './manager.js';
import { DatabaseConfig } from './types.js';

export function createDatabaseConnection(config: DatabaseConfig): DatabaseManager {
  return new DatabaseManager(config);
}

export async function healthCheck(connectionString: string): Promise<{ healthy: boolean; message?: string }> {
  const config: DatabaseConfig = { connectionString };
  const db = new DatabaseManager(config);
  
  try {
    const result = await db.healthCheck();
    await db.close();
    return result;
  } catch (error) {
    await db.close();
    return { 
      healthy: false, 
      message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

export function parseDatabaseUrl(url: string): {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
} {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port) || 5432,
    database: parsed.pathname.slice(1), // Remove leading slash
    username: parsed.username,
    password: parsed.password,
    ssl: parsed.searchParams.get('ssl') === 'true' || parsed.protocol === 'postgres:',
  };
}