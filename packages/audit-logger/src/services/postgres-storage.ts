import { Pool, PoolClient } from 'pg';
import { AuditEvent, AuditQuery } from '../models/audit.js';
import { IAuditStorageService } from '../interfaces/storage.js';

export class PostgresAuditStorageService implements IAuditStorageService {
  private pool: Pool;

  constructor(connectionString?: string) {
    this.pool = new Pool({
      connectionString: connectionString || process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });
  }

  async storeEvent(event: AuditEvent): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      const result = await client.query(`
        SELECT atp_audit.add_event($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `, [
        event.source,
        event.action,
        event.resource,
        event.actor || null,
        event.details ? JSON.stringify(event.details) : null,
        event.hash,
        event.previousHash || null,
        event.signature || null,
        event.ipfsHash || null,
        null, // block_number - will be calculated by the stored procedure
        null, // nonce
        false // encrypted
      ]);

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async getEvent(id: string): Promise<AuditEvent | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM atp_audit.events WHERE event_id = $1',
        [id]
      );
      
      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToEvent(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async queryEvents(query: AuditQuery): Promise<{ events: AuditEvent[]; total: number }> {
    const client = await this.pool.connect();
    try {
      let sql = 'SELECT * FROM atp_audit.events WHERE 1=1';
      const params: any[] = [];
      let paramIndex = 1;

      if (query.source) {
        sql += ` AND source = $${paramIndex}`;
        params.push(query.source);
        paramIndex++;
      }

      if (query.action) {
        sql += ` AND action = $${paramIndex}`;
        params.push(query.action);
        paramIndex++;
      }

      if (query.resource) {
        sql += ` AND resource = $${paramIndex}`;
        params.push(query.resource);
        paramIndex++;
      }

      if (query.actor) {
        sql += ` AND actor = $${paramIndex}`;
        params.push(query.actor);
        paramIndex++;
      }

      if (query.startTime) {
        sql += ` AND timestamp >= $${paramIndex}`;
        params.push(query.startTime);
        paramIndex++;
      }

      if (query.endTime) {
        sql += ` AND timestamp <= $${paramIndex}`;
        params.push(query.endTime);
        paramIndex++;
      }

      // Get total count
      const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as count');
      const countResult = await client.query(countSql, params);
      const total = parseInt(countResult.rows[0].count);

      // Add ordering and pagination
      sql += ' ORDER BY timestamp DESC';

      if (query.limit) {
        sql += ` LIMIT $${paramIndex}`;
        params.push(query.limit);
        paramIndex++;
      }

      if (query.offset) {
        sql += ` OFFSET $${paramIndex}`;
        params.push(query.offset);
        paramIndex++;
      }

      const result = await client.query(sql, params);
      const events = result.rows.map(row => this.mapRowToEvent(row));

      return { events, total };
    } finally {
      client.release();
    }
  }

  async getLastEvent(): Promise<AuditEvent | null> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM atp_audit.events ORDER BY timestamp DESC LIMIT 1'
      );
      
      if (result.rows.length === 0) {
        return null;
      }

      return this.mapRowToEvent(result.rows[0]);
    } finally {
      client.release();
    }
  }

  async verifyChain(): Promise<{ valid: boolean; brokenAt?: string }> {
    const client = await this.pool.connect();
    try {
      const result = await client.query(
        'SELECT * FROM atp_audit.events ORDER BY timestamp ASC'
      );

      let previousHash: string | null = null;

      for (const row of result.rows) {
        if (row.previous_hash !== previousHash) {
          return { valid: false, brokenAt: row.event_id };
        }
        previousHash = row.hash;
      }

      return { valid: true };
    } finally {
      client.release();
    }
  }

  private mapRowToEvent(row: any): AuditEvent {
    return {
      id: row.event_id,
      timestamp: row.timestamp.toISOString(),
      source: row.source,
      action: row.action,
      resource: row.resource,
      actor: row.actor,
      details: row.details ? JSON.parse(row.details) : undefined,
      hash: row.hash,
      previousHash: row.previous_hash,
      ipfsHash: row.ipfs_hash,
      signature: row.signature,
    };
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}