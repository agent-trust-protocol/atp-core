import { BaseStorage, DatabaseConfig } from '@atp/shared';
import { AuditEvent, AuditQuery } from '../models/audit.js';
import { IAuditStorageService } from '../interfaces/storage.js';

export class AuditStorageService extends BaseStorage implements IAuditStorageService {
  constructor(config: DatabaseConfig) {
    super(config);
  }

  async initialize(): Promise<void> {
    await this.ensureConnection();
    // Tables are created by init-db.sql, just verify connection
  }
  async storeEvent(event: AuditEvent): Promise<void> {
    const query = `
      INSERT INTO atp_audit.events (
        event_id, source, actor, resource, action, timestamp, 
        details, hash, previous_hash, ipfs_hash, signature
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    `;

    await this.db.query(query, [
      event.id,
      event.source,
      event.actor || null,
      event.resource,
      event.action,
      this.toISOString(event.timestamp),
      this.safeJsonStringify(event.details),
      event.hash,
      event.previousHash || null,
      event.ipfsHash || null,
      event.signature || null
    ]);
  }

  async getEvent(id: string): Promise<AuditEvent | null> {
    const query = `
      SELECT event_id, source, actor, resource, action, timestamp, 
             details, hash, previous_hash, ipfs_hash, signature
      FROM atp_audit.events WHERE event_id = $1
    `;
    const result = await this.db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToEvent(result.rows[0]);
  }

  async queryEvents(query: AuditQuery): Promise<{ events: AuditEvent[]; total: number }> {
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
      params.push(this.toISOString(query.startTime));
      paramIndex++;
    }

    if (query.endTime) {
      sql += ` AND timestamp <= $${paramIndex}`;
      params.push(this.toISOString(query.endTime));
      paramIndex++;
    }

    // Get total count
    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as count');
    const countResult = await this.db.query(countSql, params);
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
    }

    const result = await this.db.query(sql, params);
    const events = result.rows.map((row: any) => this.mapRowToEvent(row));

    return { events, total };
  }

  async getLastEvent(): Promise<AuditEvent | null> {
    const query = 'SELECT * FROM atp_audit.events ORDER BY timestamp DESC LIMIT 1';
    const result = await this.db.query(query);
    
    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToEvent(result.rows[0]);
  }

  async verifyChain(): Promise<{ valid: boolean; brokenAt?: string }> {
    const query = 'SELECT * FROM atp_audit.events ORDER BY timestamp ASC';
    const result = await this.db.query(query);

    let previousHash: string | null = null;

    for (const row of result.rows) {
      if (row.previous_hash !== previousHash) {
        return { valid: false, brokenAt: row.event_id };
      }
      previousHash = row.hash;
    }

    return { valid: true };
  }

  private mapRowToEvent(row: any): AuditEvent {
    return {
      id: row.event_id,
      timestamp: row.timestamp,
      source: row.source,
      action: row.action,
      resource: row.resource,
      actor: row.actor,
      details: typeof row.details === 'string' ? this.safeJsonParse(row.details) : row.details,
      hash: row.hash,
      previousHash: row.previous_hash,
      ipfsHash: row.ipfs_hash,
      signature: row.signature,
    };
  }
}