/**
 * Better Auth Database Initialization Script
 * Run with: node scripts/init-db.js
 */

const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = path.join(__dirname, '..', 'dev.db');

console.log('🔧 Initializing Better Auth database...');
console.log('📁 Database path:', dbPath);

const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');

console.log('\n📊 Creating tables...');

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
    tenantId TEXT,
    plan TEXT DEFAULT 'free',
    companyName TEXT
  );
`);
console.log('✓ user');

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
console.log('✓ session');

// Create account table (for OAuth and password storage)
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
console.log('✓ account');

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
console.log('✓ verification');

console.log('\n📑 Creating indexes...');

// Create indexes for better performance
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_session_userId ON session(userId);
  CREATE INDEX IF NOT EXISTS idx_session_token ON session(token);
  CREATE INDEX IF NOT EXISTS idx_account_userId ON account(userId);
  CREATE INDEX IF NOT EXISTS idx_verification_identifier ON verification(identifier);
`);
console.log('✓ All indexes created');

// Check database stats
const userCount = db.prepare('SELECT COUNT(*) as count FROM user').get().count;
const sessionCount = db.prepare('SELECT COUNT(*) as count FROM session').get().count;

console.log('\n📊 Database statistics:');
console.log(`   Users: ${userCount}`);
console.log(`   Sessions: ${sessionCount}`);

db.close();

console.log('\n🎉 Database initialization complete!');
console.log('\n📝 Next steps:');
console.log('   1. Start dev server: npm run dev');
console.log('   2. Visit: http://localhost:3000/signup');
console.log('   3. Create your first account!');
console.log('\n💡 The database file is at: dev.db');
