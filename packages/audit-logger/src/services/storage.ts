import Database from 'better-sqlite3';
import { AuditEvent, AuditQuery } from '../models/audit.js';

export class AuditStorageService {
  private db: Database.Database;

  constructor(dbPath: string = './audit.db') {
    this.db = new Database(dbPath);
    this.initializeDatabase();
  }

  private initializeDatabase(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS audit_events (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        source TEXT NOT NULL,
        action TEXT NOT NULL,
        resource TEXT NOT NULL,
        actor TEXT,
        details TEXT,
        hash TEXT NOT NULL,
        previous_hash TEXT,
        ipfs_hash TEXT,
        signature TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_events(timestamp);
      CREATE INDEX IF NOT EXISTS idx_audit_source ON audit_events(source);
      CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_events(action);
      CREATE INDEX IF NOT EXISTS idx_audit_resource ON audit_events(resource);
      CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_events(actor);
      CREATE INDEX IF NOT EXISTS idx_audit_hash ON audit_events(hash);
    `);
  }

  async storeEvent(event: AuditEvent): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO audit_events (
        id, timestamp, source, action, resource, actor, details, hash, previous_hash, ipfs_hash, signature
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      event.id,
      event.timestamp,
      event.source,
      event.action,
      event.resource,
      event.actor || null,
      event.details ? JSON.stringify(event.details) : null,
      event.hash,
      event.previousHash || null,
      event.ipfsHash || null,
      event.signature || null
    );
  }

  async getEvent(id: string): Promise<AuditEvent | null> {
    const stmt = this.db.prepare('SELECT * FROM audit_events WHERE id = ?');
    const row = stmt.get(id) as any;
    
    if (!row) {
      return null;
    }

    return this.mapRowToEvent(row);
  }

  async queryEvents(query: AuditQuery): Promise<{ events: AuditEvent[]; total: number }> {
    let sql = 'SELECT * FROM audit_events WHERE 1=1';
    const params: any[] = [];

    if (query.source) {
      sql += ' AND source = ?';
      params.push(query.source);
    }

    if (query.action) {
      sql += ' AND action = ?';
      params.push(query.action);
    }

    if (query.resource) {
      sql += ' AND resource = ?';
      params.push(query.resource);
    }

    if (query.actor) {
      sql += ' AND actor = ?';
      params.push(query.actor);
    }

    if (query.startTime) {
      sql += ' AND timestamp >= ?';
      params.push(query.startTime);
    }

    if (query.endTime) {
      sql += ' AND timestamp <= ?';
      params.push(query.endTime);
    }

    // Get total count
    const countStmt = this.db.prepare(sql.replace('SELECT *', 'SELECT COUNT(*) as count'));
    const countResult = countStmt.get(...params) as any;
    const total = countResult.count;

    // Add ordering and pagination
    sql += ' ORDER BY timestamp DESC';

    if (query.limit) {
      sql += ' LIMIT ?';
      params.push(query.limit);
    }

    if (query.offset) {
      sql += ' OFFSET ?';
      params.push(query.offset);
    }

    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params) as any[];

    const events = rows.map(row => this.mapRowToEvent(row));

    return { events, total };
  }

  async getLastEvent(): Promise<AuditEvent | null> {
    const stmt = this.db.prepare('SELECT * FROM audit_events ORDER BY timestamp DESC LIMIT 1');
    const row = stmt.get() as any;
    
    if (!row) {
      return null;
    }

    return this.mapRowToEvent(row);
  }

  async verifyChain(): Promise<{ valid: boolean; brokenAt?: string }> {
    const stmt = this.db.prepare('SELECT * FROM audit_events ORDER BY timestamp ASC');
    const rows = stmt.all() as any[];

    let previousHash: string | null = null;

    for (const row of rows) {
      if (row.previous_hash !== previousHash) {
        return { valid: false, brokenAt: row.id };
      }
      previousHash = row.hash;
    }

    return { valid: true };
  }

  private mapRowToEvent(row: any): AuditEvent {
    return {
      id: row.id,
      timestamp: row.timestamp,
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

  close(): void {
    this.db.close();
  }
}