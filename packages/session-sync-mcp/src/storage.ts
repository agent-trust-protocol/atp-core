/**
 * Session Sync MCP - SQLite Storage Layer
 * 
 * Persistent storage for cross-agent session synchronization.
 * Stores sessions, messages, context, and decisions.
 */

import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { homedir } from 'os';

export interface Session {
  id: string;
  projectPath: string;
  projectName: string;
  createdAt: string;
  updatedAt: string;
  lastAgent: string;
  summary?: string;
  tags?: string;
}

export interface Message {
  id: number;
  sessionId: string;
  agent: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: string;
}

export interface Context {
  id: number;
  sessionId: string;
  key: string;
  value: string;
  agent: string;
  timestamp: string;
}

export interface Decision {
  id: number;
  sessionId: string;
  description: string;
  rationale: string;
  agent: string;
  timestamp: string;
  status: 'active' | 'superseded' | 'reverted';
}

export class SessionStorage {
  private db: Database.Database;
  private dbPath: string;

  constructor(customPath?: string) {
    // Default to ~/.session-sync-mcp/sessions.db
    const defaultDir = join(homedir(), '.session-sync-mcp');
    this.dbPath = customPath || join(defaultDir, 'sessions.db');
    
    // Ensure directory exists
    const dir = dirname(this.dbPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(this.dbPath);
    this.db.pragma('journal_mode = WAL');
    this.initializeTables();
  }

  private initializeTables(): void {
    // Sessions table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        project_path TEXT NOT NULL,
        project_name TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        last_agent TEXT NOT NULL,
        summary TEXT,
        tags TEXT
      )
    `);

    // Messages table
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        agent TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('user', 'assistant', 'system')),
        content TEXT NOT NULL,
        timestamp TEXT NOT NULL DEFAULT (datetime('now')),
        metadata TEXT,
        FOREIGN KEY (session_id) REFERENCES sessions(id)
      )
    `);

    // Context table (key-value store for session context)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS context (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        key TEXT NOT NULL,
        value TEXT NOT NULL,
        agent TEXT NOT NULL,
        timestamp TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (session_id) REFERENCES sessions(id),
        UNIQUE(session_id, key)
      )
    `);

    // Decisions table (architectural decisions, changes made)
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS decisions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        description TEXT NOT NULL,
        rationale TEXT NOT NULL,
        agent TEXT NOT NULL,
        timestamp TEXT NOT NULL DEFAULT (datetime('now')),
        status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'superseded', 'reverted')),
        FOREIGN KEY (session_id) REFERENCES sessions(id)
      )
    `);

    // Indexes for better query performance
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
      CREATE INDEX IF NOT EXISTS idx_context_session ON context(session_id);
      CREATE INDEX IF NOT EXISTS idx_decisions_session ON decisions(session_id);
      CREATE INDEX IF NOT EXISTS idx_sessions_project ON sessions(project_path);
    `);
  }

  // Session operations
  createSession(session: Omit<Session, 'createdAt' | 'updatedAt'>): Session {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO sessions (id, project_path, project_name, last_agent, summary, tags, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      session.id,
      session.projectPath,
      session.projectName,
      session.lastAgent,
      session.summary || null,
      session.tags || null,
      now,
      now
    );
    return { ...session, createdAt: now, updatedAt: now };
  }

  getSession(id: string): Session | null {
    const stmt = this.db.prepare('SELECT * FROM sessions WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) return null;
    return this.mapSession(row);
  }

  getSessionByProject(projectPath: string): Session | null {
    const stmt = this.db.prepare('SELECT * FROM sessions WHERE project_path = ? ORDER BY updated_at DESC LIMIT 1');
    const row = stmt.get(projectPath) as any;
    if (!row) return null;
    return this.mapSession(row);
  }

  listSessions(options?: { projectPath?: string; agent?: string; limit?: number }): Session[] {
    let query = 'SELECT * FROM sessions WHERE 1=1';
    const params: any[] = [];

    if (options?.projectPath) {
      query += ' AND project_path = ?';
      params.push(options.projectPath);
    }
    if (options?.agent) {
      query += ' AND last_agent = ?';
      params.push(options.agent);
    }
    query += ' ORDER BY updated_at DESC';
    if (options?.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);
    }

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];
    return rows.map(this.mapSession);
  }

  updateSession(id: string, updates: Partial<Session>): void {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      UPDATE sessions 
      SET last_agent = COALESCE(?, last_agent),
          summary = COALESCE(?, summary),
          tags = COALESCE(?, tags),
          updated_at = ?
      WHERE id = ?
    `);
    stmt.run(
      updates.lastAgent || null,
      updates.summary || null,
      updates.tags || null,
      now,
      id
    );
  }

  // Message operations
  addMessage(message: Omit<Message, 'id' | 'timestamp'>): Message {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO messages (session_id, agent, role, content, metadata, timestamp)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(
      message.sessionId,
      message.agent,
      message.role,
      message.content,
      message.metadata || null,
      now
    );
    
    // Update session's updated_at
    this.db.prepare('UPDATE sessions SET updated_at = ?, last_agent = ? WHERE id = ?')
      .run(now, message.agent, message.sessionId);
    
    return { ...message, id: Number(result.lastInsertRowid), timestamp: now };
  }

  getMessages(sessionId: string, options?: { limit?: number; offset?: number }): Message[] {
    let query = 'SELECT * FROM messages WHERE session_id = ? ORDER BY timestamp DESC';
    const params: any[] = [sessionId];
    
    if (options?.limit) {
      query += ' LIMIT ?';
      params.push(options.limit);
    }
    if (options?.offset) {
      query += ' OFFSET ?';
      params.push(options.offset);
    }

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];
    return rows.map(this.mapMessage);
  }

  // Context operations
  setContext(context: Omit<Context, 'id' | 'timestamp'>): Context {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO context (session_id, key, value, agent, timestamp)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(session_id, key) DO UPDATE SET
        value = excluded.value,
        agent = excluded.agent,
        timestamp = excluded.timestamp
    `);
    const result = stmt.run(context.sessionId, context.key, context.value, context.agent, now);
    return { ...context, id: Number(result.lastInsertRowid), timestamp: now };
  }

  getContext(sessionId: string, key?: string): Context[] {
    if (key) {
      const stmt = this.db.prepare('SELECT * FROM context WHERE session_id = ? AND key = ?');
      const rows = stmt.all(sessionId, key) as any[];
      return rows.map(this.mapContext);
    }
    const stmt = this.db.prepare('SELECT * FROM context WHERE session_id = ?');
    const rows = stmt.all(sessionId) as any[];
    return rows.map(this.mapContext);
  }

  // Decision operations
  addDecision(decision: Omit<Decision, 'id' | 'timestamp' | 'status'>): Decision {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(`
      INSERT INTO decisions (session_id, description, rationale, agent, timestamp, status)
      VALUES (?, ?, ?, ?, ?, 'active')
    `);
    const result = stmt.run(
      decision.sessionId,
      decision.description,
      decision.rationale,
      decision.agent,
      now
    );
    return { ...decision, id: Number(result.lastInsertRowid), timestamp: now, status: 'active' };
  }

  getDecisions(sessionId: string, status?: string): Decision[] {
    let query = 'SELECT * FROM decisions WHERE session_id = ?';
    const params: any[] = [sessionId];
    
    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }
    query += ' ORDER BY timestamp DESC';

    const stmt = this.db.prepare(query);
    const rows = stmt.all(...params) as any[];
    return rows.map(this.mapDecision);
  }

  // Search across all content
  search(query: string, sessionId?: string): { messages: Message[]; context: Context[]; decisions: Decision[] } {
    const searchTerm = `%${query}%`;
    
    let messageQuery = 'SELECT * FROM messages WHERE content LIKE ?';
    let contextQuery = 'SELECT * FROM context WHERE value LIKE ? OR key LIKE ?';
    let decisionQuery = 'SELECT * FROM decisions WHERE description LIKE ? OR rationale LIKE ?';
    
    const messageParams: any[] = [searchTerm];
    const contextParams: any[] = [searchTerm, searchTerm];
    const decisionParams: any[] = [searchTerm, searchTerm];

    if (sessionId) {
      messageQuery += ' AND session_id = ?';
      contextQuery += ' AND session_id = ?';
      decisionQuery += ' AND session_id = ?';
      messageParams.push(sessionId);
      contextParams.push(sessionId);
      decisionParams.push(sessionId);
    }

    const messages = (this.db.prepare(messageQuery).all(...messageParams) as any[]).map(this.mapMessage);
    const context = (this.db.prepare(contextQuery).all(...contextParams) as any[]).map(this.mapContext);
    const decisions = (this.db.prepare(decisionQuery).all(...decisionParams) as any[]).map(this.mapDecision);

    return { messages, context, decisions };
  }

  // Mappers
  private mapSession(row: any): Session {
    return {
      id: row.id,
      projectPath: row.project_path,
      projectName: row.project_name,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastAgent: row.last_agent,
      summary: row.summary,
      tags: row.tags,
    };
  }

  private mapMessage(row: any): Message {
    return {
      id: row.id,
      sessionId: row.session_id,
      agent: row.agent,
      role: row.role,
      content: row.content,
      timestamp: row.timestamp,
      metadata: row.metadata,
    };
  }

  private mapContext(row: any): Context {
    return {
      id: row.id,
      sessionId: row.session_id,
      key: row.key,
      value: row.value,
      agent: row.agent,
      timestamp: row.timestamp,
    };
  }

  private mapDecision(row: any): Decision {
    return {
      id: row.id,
      sessionId: row.session_id,
      description: row.description,
      rationale: row.rationale,
      agent: row.agent,
      timestamp: row.timestamp,
      status: row.status,
    };
  }

  close(): void {
    this.db.close();
  }
}


