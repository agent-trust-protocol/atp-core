#!/usr/bin/env node

import { Pool } from 'pg';

const connectionString = 'postgresql://atp_user:staging-password-change-in-production@localhost:5432/atp_staging';

console.log('🔍 Testing database connection...');
console.log('Connection string:', connectionString);

const pool = new Pool({
  connectionString,
  max: 5,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

async function testConnection() {
  try {
    // Test basic connection
    console.log('\n1. Testing basic connection...');
    const client = await pool.connect();
    const result = await client.query('SELECT current_database(), current_user, current_schema(), version()');
    console.log('✅ Basic connection successful:', result.rows[0]);
    
    // Check all databases
    console.log('\n1.5. Checking available databases...');
    const databases = await client.query('SELECT datname FROM pg_database ORDER BY datname');
    console.log('✅ Available databases:', databases.rows.map(r => r.datname));
    
    // Test schema visibility
    console.log('\n2. Testing schema visibility...');
    const schemas = await client.query("SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE 'atp_%' ORDER BY schema_name");
    console.log('✅ Available ATP schemas:', schemas.rows.map(r => r.schema_name));
    
    // Test table access without schema prefix
    console.log('\n3. Testing table access without schema prefix...');
    try {
      const result1 = await client.query('SELECT COUNT(*) FROM did_documents');
      console.log('✅ did_documents accessible without prefix:', result1.rows[0]);
    } catch (error) {
      console.log('❌ did_documents NOT accessible without prefix:', error.message);
    }
    
    // Test table access with schema prefix
    console.log('\n4. Testing table access with schema prefix...');
    try {
      const result2 = await client.query('SELECT COUNT(*) FROM atp_identity.did_documents');
      console.log('✅ atp_identity.did_documents accessible with prefix:', result2.rows[0]);
    } catch (error) {
      console.log('❌ atp_identity.did_documents NOT accessible with prefix:', error.message);
    }
    
    // Test setting search path
    console.log('\n5. Testing search path configuration...');
    await client.query('SET search_path TO atp_identity, atp_permissions, atp_credentials, atp_audit, atp_metrics, public');
    const searchPath = await client.query('SHOW search_path');
    console.log('✅ Search path set to:', searchPath.rows[0].search_path);
    
    // Test table access after setting search path
    console.log('\n6. Testing table access after setting search path...');
    try {
      const result3 = await client.query('SELECT COUNT(*) FROM did_documents');
      console.log('✅ did_documents accessible after search path:', result3.rows[0]);
    } catch (error) {
      console.log('❌ did_documents still not accessible:', error.message);
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ Connection test failed:', error);
  } finally {
    await pool.end();
  }
}

testConnection();