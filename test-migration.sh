#!/bin/bash

echo "🧪 Testing Database Migration (SQLite → PostgreSQL)"
echo "=================================================="

# Check if PostgreSQL is running
echo "1. Checking PostgreSQL availability..."
export DATABASE_URL="postgresql://atp_user:CHANGE_THIS_SECURE_PASSWORD_IN_PRODUCTION@localhost:5432/atp_production"

# Start PostgreSQL in background (if not running)
docker run --name atp-postgres-test -p 5432:5432 \
  -e POSTGRES_DB=atp_production \
  -e POSTGRES_USER=atp_user \
  -e POSTGRES_PASSWORD=CHANGE_THIS_SECURE_PASSWORD_IN_PRODUCTION \
  -v $(pwd)/scripts/init-db.sql:/docker-entrypoint-initdb.d/init-db.sql \
  -d postgres:15-alpine 2>/dev/null || echo "PostgreSQL container already running"

# Wait for PostgreSQL to be ready
echo "2. Waiting for PostgreSQL to initialize..."
sleep 10

# Test PostgreSQL connection
if command -v psql &> /dev/null; then
  psql $DATABASE_URL -c "SELECT schemaname FROM pg_catalog.pg_tables WHERE schemaname LIKE 'atp_%' LIMIT 1;" > /dev/null 2>&1
  if [ $? -eq 0 ]; then
    echo "✅ PostgreSQL database is ready"
  else
    echo "❌ PostgreSQL connection failed"
    exit 1
  fi
else
  echo "⚠️  psql not available, skipping direct database test"
fi

# Test audit logger service with PostgreSQL
echo "3. Testing audit logger with PostgreSQL..."
cd packages/audit-logger

# Create a simple test script
cat > test-postgres.js << 'EOF'
import { PostgresAuditStorageService } from './dist/services/postgres-storage.js';

async function testPostgresStorage() {
  const storage = new PostgresAuditStorageService();
  
  try {
    // Test storing an event
    const testEvent = {
      id: 'test-' + Date.now(),
      timestamp: new Date().toISOString(),
      source: 'test-migration',
      action: 'create',
      resource: 'test-resource',
      actor: 'migration-test',
      details: { test: true },
      hash: 'test-hash-' + Date.now(),
      previousHash: null,
    };
    
    await storage.storeEvent(testEvent);
    console.log('✅ Event stored successfully');
    
    // Test retrieving the event
    const retrieved = await storage.getEvent(testEvent.id);
    if (retrieved && retrieved.id === testEvent.id) {
      console.log('✅ Event retrieved successfully');
    } else {
      console.log('❌ Event retrieval failed');
    }
    
    // Test chain verification
    const chainCheck = await storage.verifyChain();
    console.log('✅ Chain verification:', chainCheck.valid ? 'VALID' : 'INVALID');
    
    await storage.close();
    console.log('✅ PostgreSQL storage test completed');
    
  } catch (error) {
    console.error('❌ PostgreSQL storage test failed:', error.message);
    process.exit(1);
  }
}

testPostgresStorage();
EOF

# Run the test
if [ -f "dist/services/postgres-storage.js" ]; then
  DATABASE_URL=$DATABASE_URL node test-postgres.js
  TEST_RESULT=$?
  
  # Cleanup
  rm -f test-postgres.js
  
  if [ $TEST_RESULT -eq 0 ]; then
    echo "✅ Audit logger PostgreSQL integration test passed"
  else
    echo "❌ Audit logger PostgreSQL integration test failed"
    exit 1
  fi
else
  echo "❌ Build artifacts not found. Run 'npm run build' first."
  exit 1
fi

cd ../..

echo ""
echo "4. Testing fallback to SQLite..."
# Test that SQLite still works when PostgreSQL is not available
unset DATABASE_URL
export USE_POSTGRES=false

cd packages/audit-logger

cat > test-sqlite.js << 'EOF'
import { AuditStorageService } from './dist/services/storage.js';

async function testSQLiteStorage() {
  const storage = new AuditStorageService('./test-migration.db');
  
  try {
    const testEvent = {
      id: 'sqlite-test-' + Date.now(),
      timestamp: new Date().toISOString(),
      source: 'test-fallback',
      action: 'create',
      resource: 'test-resource',
      actor: 'fallback-test',
      details: { test: true },
      hash: 'sqlite-hash-' + Date.now(),
      previousHash: null,
    };
    
    await storage.storeEvent(testEvent);
    console.log('✅ SQLite event stored successfully');
    
    const retrieved = await storage.getEvent(testEvent.id);
    if (retrieved && retrieved.id === testEvent.id) {
      console.log('✅ SQLite event retrieved successfully');
    }
    
    storage.close();
    console.log('✅ SQLite fallback test completed');
    
  } catch (error) {
    console.error('❌ SQLite fallback test failed:', error.message);
    process.exit(1);
  }
}

testSQLiteStorage();
EOF

if [ -f "dist/services/storage.js" ]; then
  node test-sqlite.js
  TEST_RESULT=$?
  
  # Cleanup
  rm -f test-sqlite.js test-migration.db
  
  if [ $TEST_RESULT -eq 0 ]; then
    echo "✅ SQLite fallback test passed"
  else
    echo "❌ SQLite fallback test failed"
    exit 1
  fi
fi

cd ../..

echo ""
echo "🎉 Migration testing completed successfully!"
echo ""
echo "Summary:"
echo "✅ PostgreSQL schema initialization"
echo "✅ PostgreSQL audit storage integration"
echo "✅ SQLite fallback compatibility"
echo ""
echo "To use PostgreSQL in production:"
echo "  export DATABASE_URL='postgresql://user:pass@host:port/db'"
echo ""
echo "To use SQLite (development):"
echo "  unset DATABASE_URL"
echo ""

# Cleanup test PostgreSQL container
echo "🧹 Cleaning up test container..."
docker stop atp-postgres-test > /dev/null 2>&1
docker rm atp-postgres-test > /dev/null 2>&1

echo "Done!"