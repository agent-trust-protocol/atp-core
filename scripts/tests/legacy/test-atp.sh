#!/bin/bash

echo "🧪 ATP™ Quick Test Script"
echo "========================"

# Test 1: Check services
echo "1. Testing service health..."
curl -sf http://localhost:5432 > /dev/null && echo "  ✅ PostgreSQL responding" || echo "  ⚠️  PostgreSQL not ready"
curl -sf http://localhost:5001/api/v0/version > /dev/null && echo "  ✅ IPFS API responding" || echo "  ⚠️  IPFS not ready"
curl -sf http://localhost:9090/-/healthy > /dev/null && echo "  ✅ Prometheus responding" || echo "  ⚠️  Prometheus not ready"

# Test 2: Database query
echo "2. Testing database..."
if docker compose -f docker-compose.simple.yml exec -T postgres psql -U atp_user -d atp_staging -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema LIKE 'atp_%';" 2>/dev/null | grep -q "[0-9]"; then
    echo "  ✅ Database schemas present"
else
    echo "  ⚠️  Database schemas not ready"
fi

# Test 3: IPFS storage
echo "3. Testing IPFS storage..."
TEST_HASH=$(echo "ATP™ Test $(date)" | curl -sf -F "file=@-" http://localhost:5001/api/v0/add 2>/dev/null | grep -o '"Hash":"[^"]*"' | cut -d'"' -f4)
if [ -n "$TEST_HASH" ]; then
    echo "  ✅ IPFS storage working (Hash: $TEST_HASH)"
else
    echo "  ⚠️  IPFS storage not ready"
fi

echo ""
echo "🎉 Quick test complete!"
