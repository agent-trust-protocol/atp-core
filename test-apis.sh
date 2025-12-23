#!/bin/bash

echo "Testing ATP APIs..."

# Test Identity Service
echo "1. Testing Identity Registration..."
IDENTITY_RESPONSE=$(curl -s -X POST http://localhost:3001/identity/register \
  -H "Content-Type: application/json" \
  -d '{}')

echo "Identity Response: $IDENTITY_RESPONSE"

# Extract DID from response (basic parsing)
DID=$(echo $IDENTITY_RESPONSE | grep -o '"did":"[^"]*"' | cut -d'"' -f4)
echo "Generated DID: $DID"

# Test Identity Resolution
if [ ! -z "$DID" ]; then
  echo "2. Testing Identity Resolution..."
  curl -s "http://localhost:3001/identity/$DID" | jq .
fi

# Test VC Service
echo "3. Testing VC Schema Registration..."
curl -s -X POST http://localhost:3002/vc/schemas \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-schema-v1",
    "name": "TestSchema", 
    "description": "Test schema for API validation",
    "version": "1.0.0",
    "properties": {
      "name": {"type": "string", "required": true}
    }
  }' | jq .

# Test Permission Service
echo "4. Testing Permission Check..."
curl -s -X POST http://localhost:3003/perm/check \
  -H "Content-Type: application/json" \
  -d '{
    "subject": "did:test:123",
    "action": "read",
    "resource": "test-resource"
  }' | jq .

# Test RPC Gateway
echo "5. Testing RPC Gateway Services..."
curl -s http://localhost:3000/services | jq .

echo "API testing complete!"