#!/bin/bash

# Agent Trust Protocol - Service Starter Script
# Starts all ATP services for integration testing

export DATABASE_URL="postgresql://atp_user:dev_password@localhost:5432/atp_development"

echo "🚀 Starting Agent Trust Protocol Services..."

# Function to start a service
start_service() {
    local name=$1
    local path=$2
    local port=$3
    
    echo "Starting $name service on port $port..."
    cd "$path"
    PORT=$port nohup node dist/index.js > "../../logs/$name.log" 2>&1 &
    echo $! > "../../logs/$name.pid"
    cd - > /dev/null
}

# Create logs directory
mkdir -p logs

# Start all services
start_service "identity" "packages/identity-service" 3001
start_service "vc" "packages/vc-service" 3002
start_service "permission" "packages/permission-service" 3003
start_service "audit" "packages/audit-logger" 3004
start_service "rpc-gateway" "packages/rpc-gateway" 3000

echo "⏳ Waiting for services to start..."
sleep 5

echo "✅ All services started!"
echo "📋 Service status:"
echo "  - Identity Service: http://localhost:3001/health"
echo "  - VC Service: http://localhost:3002/health"
echo "  - Permission Service: http://localhost:3003/health"
echo "  - Audit Service: http://localhost:3004/health"
echo "  - RPC Gateway: http://localhost:3000/health"
echo ""
echo "📝 Logs are available in the logs/ directory"
echo "🛑 To stop services, run: ./stop-services.sh"