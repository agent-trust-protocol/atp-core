/**
 * Better Auth Database Initialization Script
 * This script creates the necessary database tables for Better Auth
 */

import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, '..', 'dev.db');

console.log('Initializing Better Auth database...');
console.log('Database path:', dbPath);

const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create user table
db.exec(`
  CREATE TABLE IF NOT EXISTS user (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    emailVerified INTEGER NOT NULL DEFAULT 0,
    name TEXT,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL,
    image TEXT,

    -- Custom fields from ATP
    tenantId TEXT,
    plan TEXT DEFAULT 'free',
    companyName TEXT
  );
`);

console.log('✓ Created user table');

// Create session table
db.exec(`
  CREATE TABLE IF NOT EXISTS session (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    expiresAt INTEGER NOT NULL,
    token TEXT NOT NULL UNIQUE,
    ipAddress TEXT,
    userAgent TEXT,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL,

    FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE
  );
`);

console.log('✓ Created session table');

// Create account table (for OAuth)
db.exec(`
  CREATE TABLE IF NOT EXISTS account (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    accountId TEXT NOT NULL,
    providerId TEXT NOT NULL,
    accessToken TEXT,
    refreshToken TEXT,
    idToken TEXT,
    accessTokenExpiresAt INTEGER,
    refreshTokenExpiresAt INTEGER,
    scope TEXT,
    password TEXT,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL,

    FOREIGN KEY (userId) REFERENCES user(id) ON DELETE CASCADE,
    UNIQUE(providerId, accountId)
  );
`);

console.log('✓ Created account table');

// Create verification table
db.exec(`
  CREATE TABLE IF NOT EXISTS verification (
    id TEXT PRIMARY KEY,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    expiresAt INTEGER NOT NULL,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL,

    UNIQUE(identifier, value)
  );
`);

console.log('✓ Created verification table');

// Create indexes for better performance
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_session_userId ON session(userId);
  CREATE INDEX IF NOT EXISTS idx_session_token ON session(token);
  CREATE INDEX IF NOT EXISTS idx_account_userId ON account(userId);
  CREATE INDEX IF NOT EXISTS idx_verification_identifier ON verification(identifier);
`);

console.log('✓ Created indexes');

// Insert a demo user for testing (optional)
const demoUserExists = db.prepare('SELECT id FROM user WHERE email = ?').get('demo@company.com');

if (!demoUserExists) {
  const now = Date.now();
  db.prepare(`
    INSERT INTO user (id, email, emailVerified, name, createdAt, updatedAt, plan, companyName)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'demo_user_123',
    'demo@company.com',
    1,
    'Demo User',
    now,
    now,
    'professional',
    'Demo Company'
  );

  console.log('✓ Created demo user: demo@company.com');
  console.log('  (Note: Password will be set on first login through Better Auth)');
}

db.close();

console.log('\n🎉 Database initialization complete!');
console.log('\nNext steps:');
console.log('1. Start your dev server: npm run dev');
console.log('2. Visit http://localhost:3000/signup to create an account');
console.log('3. Or use the demo account: demo@company.com (set password on first use)');
