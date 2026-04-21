#!/usr/bin/env tsx

import Database from 'better-sqlite3';
import { Pool } from 'pg';
import { existsSync } from 'fs';
import { join } from 'path';

interface SQLiteAuditEvent {
  id: string;
  timestamp: string;
  source: string;
  action: string;
  resource: string;
  actor?: string;
  details?: string;
  hash: string;
  previous_hash?: string;
  ipfs_hash?: string;
  signature?: string;
}

class SQLiteToPostgresMigrator {
  private sqliteDb: Database.Database;
  private pgPool: Pool;

  constructor(sqlitePath: string, postgresUrl: string) {
    this.sqliteDb = new Database(sqlitePath);
    this.pgPool = new Pool({
      connectionString: postgresUrl,
      max: 20,
    });
  }

  async migrate(): Promise<void> {
    console.log('🔄 Starting SQLite to PostgreSQL migration...');

    try {
      // Get all events from SQLite
      const events = this.sqliteDb.prepare('SELECT * FROM audit_events ORDER BY timestamp ASC').all() as SQLiteAuditEvent[];
      
      console.log(`📊 Found ${events.length} events in SQLite database`);

      if (events.length === 0) {
        console.log('✅ No events to migrate');
        return;
      }

      // Start PostgreSQL transaction
      const client = await this.pgPool.connect();
      
      try {
        await client.query('BEGIN');
        
        let migratedCount = 0;
        
        for (const event of events) {
          await client.query(`
            SELECT atp_audit.add_event($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          `, [
            event.source,
            event.action,
            event.resource,
            event.actor || null,
            event.details || null,
            event.hash,
            event.previous_hash || null,
            event.signature || null,
            event.ipfs_hash || null,
            null, // block_number
            null, // nonce
            false // encrypted
          ]);
          
          migratedCount++;
          
          if (migratedCount % 100 === 0) {
            console.log(`📈 Migrated ${migratedCount}/${events.length} events...`);
          }
        }
        
        await client.query('COMMIT');
        console.log(`✅ Successfully migrated ${migratedCount} events to PostgreSQL`);
        
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    } finally {
      this.sqliteDb.close();
      await this.pgPool.end();
    }
  }
}

async function main() {
  const sqlitePath = process.argv[2] || './packages/audit-logger/audit.db';
  const postgresUrl = process.env.DATABASE_URL || 'postgresql://atp_user:CHANGE_THIS_SECURE_PASSWORD_IN_PRODUCTION@localhost:5432/atp_production';

  if (!existsSync(sqlitePath)) {
    console.log(`⚠️  SQLite database not found at: ${sqlitePath}`);
    console.log('   This is normal if you haven\'t run the audit logger service yet.');
    console.log('   No migration needed.');
    return;
  }

  console.log(`📁 SQLite database: ${sqlitePath}`);
  console.log(`🐘 PostgreSQL URL: ${postgresUrl.replace(/:[^@]+@/, ':***@')}`);

  const migrator = new SQLiteToPostgresMigrator(sqlitePath, postgresUrl);
  await migrator.migrate();
  
  console.log('🎉 Migration completed successfully!');
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}