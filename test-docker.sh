#!/bin/bash

echo "Starting Docker test for Agent Trust Protocol..."

# Build all services
echo "Building Docker images..."
docker compose build

if [ $? -ne 0 ]; then
    echo "Docker build failed!"
    exit 1
fi

# Start services
echo "Starting services..."
docker compose up -d

# Wait for services to be ready
echo "Waiting for services to start..."
sleep 30

# Test each service
echo "Testing services..."

# Test Identity Service
echo "Testing Identity Service..."
curl -f http://localhost:3001/health || echo "Identity Service failed"

# Test VC Service
echo "Testing VC Service..."
curl -f http://localhost:3002/health || echo "VC Service failed"

# Test Permission Service
echo "Testing Permission Service..."
curl -f http://localhost:3003/health || echo "Permission Service failed"

# Test RPC Gateway
echo "Testing RPC Gateway..."
curl -f http://localhost:3000/health || echo "RPC Gateway failed"

# Show logs if any failures
echo "Service logs:"
docker compose logs --tail=50

echo "Docker test complete!"