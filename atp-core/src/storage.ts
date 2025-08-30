import Database from 'better-sqlite3';
import { Agent, Message } from './types.js';

export class SQLiteStorage {
  private db: Database.Database;

  constructor(dbPath: string = './atp.db') {
    this.db = new Database(dbPath);
    this.initializeTables();
  }

  private initializeTables(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS agents (
        did TEXT PRIMARY KEY,
        ed25519_public_key TEXT NOT NULL,
        dilithium_public_key TEXT NOT NULL,
        supported_algorithms TEXT NOT NULL,
        created_at INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        from_did TEXT NOT NULL,
        to_did TEXT NOT NULL,
        message TEXT NOT NULL,
        signature TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        FOREIGN KEY (from_did) REFERENCES agents (did),
        FOREIGN KEY (to_did) REFERENCES agents (did)
      );

      CREATE TABLE IF NOT EXISTS mcp_audit (
        id TEXT PRIMARY KEY,
        did TEXT NOT NULL,
        tool_name TEXT NOT NULL,
        request TEXT NOT NULL,
        response TEXT NOT NULL,
        trust_score INTEGER NOT NULL,
        quantum_safe INTEGER NOT NULL,
        timestamp INTEGER NOT NULL,
        FOREIGN KEY (did) REFERENCES agents (did)
      );
    `);
  }

  saveAgent(agent: Agent): void {
    const stmt = this.db.prepare(`
      INSERT INTO agents (did, ed25519_public_key, dilithium_public_key, supported_algorithms, created_at) 
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(
      agent.did, 
      agent.publicKeys.ed25519, 
      agent.publicKeys.dilithium,
      JSON.stringify(agent.supportedAlgorithms),
      agent.createdAt
    );
  }

  getAgent(did: string): Agent | null {
    const stmt = this.db.prepare(`
      SELECT did, ed25519_public_key, dilithium_public_key, supported_algorithms, created_at 
      FROM agents 
      WHERE did = ?
    `);
    const row = stmt.get(did) as any;
    if (!row) return null;
    
    return {
      did: row.did,
      publicKeys: {
        ed25519: row.ed25519_public_key,
        dilithium: row.dilithium_public_key
      },
      supportedAlgorithms: JSON.parse(row.supported_algorithms),
      createdAt: row.created_at
    };
  }

  saveMessage(message: Message): void {
    const stmt = this.db.prepare(`
      INSERT INTO messages (id, from_did, to_did, message, signature, timestamp) 
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      message.id,
      message.fromDid,
      message.toDid,
      message.message,
      message.signature,
      message.timestamp
    );
  }

  getMessages(did: string): Message[] {
    const stmt = this.db.prepare(`
      SELECT id, from_did, to_did, message, signature, timestamp 
      FROM messages 
      WHERE from_did = ? OR to_did = ?
      ORDER BY timestamp DESC
    `);
    const rows = stmt.all(did, did) as any[];
    
    return rows.map(row => ({
      id: row.id,
      fromDid: row.from_did,
      toDid: row.to_did,
      message: row.message,
      signature: row.signature,
      timestamp: row.timestamp
    }));
  }

  close(): void {
    this.db.close();
  }
}