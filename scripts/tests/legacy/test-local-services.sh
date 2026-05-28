#!/bin/bash

echo "Starting all ATP services locally..."

# Kill any existing processes on ATP ports
lsof -ti:3000,3001,3002,3003,8081 | xargs -r kill -9

# Start services in background
echo "Starting Identity Service..."
(cd packages/identity-service && node dist/index.js) &
IDENTITY_PID=$!

echo "Starting VC Service..."
(cd packages/vc-service && node dist/index.js) &
VC_PID=$!

echo "Starting Permission Service..." 
(cd packages/permission-service && node dist/index.js) &
PERMISSION_PID=$!

echo "Starting RPC Gateway..."
(cd packages/rpc-gateway && node dist/index.js) &
RPC_PID=$!

# Wait for services to start
echo "Waiting for services to start..."
sleep 10

# Test health endpoints
echo "Testing service health..."
curl -f http://localhost:3001/health && echo "✅ Identity Service healthy"
curl -f http://localhost:3002/health && echo "✅ VC Service healthy" 
curl -f http://localhost:3003/health && echo "✅ Permission Service healthy"
curl -f http://localhost:3000/health && echo "✅ RPC Gateway healthy"

echo "All services started with PIDs:"
echo "Identity: $IDENTITY_PID"
echo "VC: $VC_PID" 
echo "Permission: $PERMISSION_PID"
echo "RPC Gateway: $RPC_PID"

echo "Services are running. Press Ctrl+C to stop all services."

# Wait for user interrupt
wait