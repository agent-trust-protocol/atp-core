import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Database configuration
interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  maxConnections?: number;
  connectionTimeout?: number;
}

class DatabaseConnection {
  private static instance: DatabaseConnection;
  private db: ReturnType<typeof drizzle> | null = null;
  private client: ReturnType<typeof postgres> | null = null;
  private config: DatabaseConfig | null = null;

  private constructor() {}

  static getInstance(): DatabaseConnection {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new DatabaseConnection();
    }
    return DatabaseConnection.instance;
  }

  initialize(config: DatabaseConfig) {
    if (this.db) {
      console.warn('Database connection already initialized');
      return this.db;
    }

    this.config = config;

    try {
      // Create PostgreSQL connection
      this.client = postgres({
        host: config.host,
        port: config.port,
        database: config.database,
        username: config.username,
        password: config.password,
        ssl: config.ssl ? 'require' : false,
        max: config.maxConnections || 20,
        connect_timeout: config.connectionTimeout || 10,
        idle_timeout: 20,
        prepare: false, // Disable prepared statements for better compatibility
      });

      // Initialize Drizzle ORM
      this.db = drizzle(this.client, { schema });

      console.log('Database connection initialized successfully');
      return this.db;
    } catch (error) {
      console.error('Failed to initialize database connection:', error);
      throw new Error(`Database initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  initializeFromEnv() {
    const config: DatabaseConfig = {
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      database: process.env.DATABASE_NAME || 'atp_workflows',
      username: process.env.DATABASE_USER || 'atp_user',
      password: process.env.DATABASE_PASSWORD || '',
      ssl: process.env.DATABASE_SSL === 'true',
      maxConnections: parseInt(process.env.DATABASE_MAX_CONNECTIONS || '20'),
      connectionTimeout: parseInt(process.env.DATABASE_TIMEOUT || '10'),
    };

    // Support for DATABASE_URL
    if (process.env.DATABASE_URL) {
      try {
        const url = new URL(process.env.DATABASE_URL);
        config.host = url.hostname;
        config.port = parseInt(url.port) || 5432;
        config.database = url.pathname.slice(1);
        config.username = url.username;
        config.password = url.password;
        config.ssl = url.searchParams.get('ssl') === 'true' || url.protocol === 'postgres:';
      } catch (error) {
        console.error('Invalid DATABASE_URL format:', error);
        throw new Error('Invalid DATABASE_URL format');
      }
    }

    return this.initialize(config);
  }

  getDatabase() {
    if (!this.db) {
      throw new Error('Database not initialized. Call initialize() first.');
    }
    return this.db;
  }

  getClient() {
    if (!this.client) {
      throw new Error('Database client not initialized. Call initialize() first.');
    }
    return this.client;
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.client) {
        throw new Error('Database client not initialized');
      }

      await this.client`SELECT 1 as test`;
      console.log('Database connection test successful');
      return true;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }

  async close() {
    try {
      if (this.client) {
        await this.client.end();
        this.client = null;
        this.db = null;
        console.log('Database connection closed');
      }
    } catch (error) {
      console.error('Error closing database connection:', error);
    }
  }

  isConnected(): boolean {
    return this.db !== null && this.client !== null;
  }

  getConfig(): DatabaseConfig | null {
    return this.config;
  }
}

// Export singleton instance
export const dbConnection = DatabaseConnection.getInstance();

// Export database instance getter
export const getDb = () => dbConnection.getDatabase();

// Convenience function for direct database access
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(target, prop) {
    const database = dbConnection.getDatabase();
    return database[prop as keyof typeof database];
  }
});

// Migration utilities
export async function runMigrations() {
  // This would be implemented with drizzle-kit
  console.log('Migrations should be run using drizzle-kit CLI');
  console.log('Run: npx drizzle-kit push:pg');
}

// Health check function
export async function healthCheck() {
  try {
    const isConnected = await dbConnection.testConnection();
    return {
      status: isConnected ? 'healthy' : 'unhealthy',
      database: 'postgresql',
      config: {
        host: dbConnection.getConfig()?.host,
        database: dbConnection.getConfig()?.database,
        ssl: dbConnection.getConfig()?.ssl
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    };
  }
}

// Export schema for external use
export { schema };