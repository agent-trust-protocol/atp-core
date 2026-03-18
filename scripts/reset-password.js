#!/usr/bin/env node

import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('\n===========================================');
  console.log('       PASSWORD RESET TOOL');
  console.log('===========================================\n');

  const dbPath = path.join(__dirname, 'website-repo', 'dev.db');
  const db = new Database(dbPath);

  // Get email
  const email = await question('Enter email address: ');

  // Find user
  const user = db.prepare('SELECT id, email, name FROM user WHERE email = ?').get(email);

  if (!user) {
    console.log('\n❌ User not found!\n');
    rl.close();
    db.close();
    process.exit(1);
  }

  console.log(`\n✅ User found: ${user.name} (${user.email})\n`);

  // Get new password
  const newPassword = await question('Enter new password (min 8 characters): ');

  if (newPassword.length < 8) {
    console.log('\n❌ Password must be at least 8 characters!\n');
    rl.close();
    db.close();
    process.exit(1);
  }

  // Confirm password
  const confirmPassword = await question('Confirm new password: ');

  if (newPassword !== confirmPassword) {
    console.log('\n❌ Passwords do not match!\n');
    rl.close();
    db.close();
    process.exit(1);
  }

  // Hash password
  console.log('\n⏳ Hashing password...');
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update database
  const result = db.prepare(`
    UPDATE account
    SET password = ?, updatedAt = ?
    WHERE userId = ? AND providerId = 'credential'
  `).run(hashedPassword, Date.now(), user.id);

  if (result.changes > 0) {
    console.log('✅ Password updated successfully!\n');
    console.log('Details:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Hash: ${hashedPassword.substring(0, 30)}...`);
    console.log(`\nYou can now login with your new password.\n`);
  } else {
    console.log('\n❌ Failed to update password. No account found.\n');
  }

  rl.close();
  db.close();
}

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
