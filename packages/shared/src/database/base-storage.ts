import { DatabaseManager } from './manager.js';
import { DatabaseConfig } from './types.js';

export abstract class BaseStorage {
  protected db: DatabaseManager;

  constructor(config: DatabaseConfig) {
    this.db = new DatabaseManager(config);
  }

  protected async ensureConnection(): Promise<void> {
    const health = await this.db.healthCheck();
    if (!health.healthy) {
      throw new Error(`Database connection failed: ${health.message}`);
    }
  }

  async close(): Promise<void> {
    await this.db.close();
  }

  async healthCheck(): Promise<{ healthy: boolean; message?: string }> {
    return await this.db.healthCheck();
  }

  // Helper method for safe JSON parsing
  protected safeJsonParse<T>(jsonString: string | null): T | null {
    if (!jsonString) return null;
    try {
      return JSON.parse(jsonString) as T;
    } catch (error) {
      console.error('JSON parse error:', error);
      return null;
    }
  }

  // Helper method for safe JSON stringification
  protected safeJsonStringify(obj: any): string | null {
    if (obj === null || obj === undefined) return null;
    try {
      return JSON.stringify(obj);
    } catch (error) {
      console.error('JSON stringify error:', error);
      return null;
    }
  }

  // Helper method for handling timestamps
  protected toISOString(date?: Date | string | number): string {
    if (!date) return new Date().toISOString();
    if (date instanceof Date) return date.toISOString();
    if (typeof date === 'string') return new Date(date).toISOString();
    if (typeof date === 'number') return new Date(date).toISOString();
    return new Date().toISOString();
  }
}
