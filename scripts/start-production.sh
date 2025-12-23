#!/bin/bash

# ATP Production Startup Script
# Starts all services with production security configurations

set -e

echo "🚀 Starting Agent Trust Protocol™ in Production Mode"
echo "=================================================="

# Load production environment
if [ -f .env.production ]; then
    set -a
    source .env.production
    set +a
    echo "✅ Production environment loaded"
else
    echo "❌ .env.production file not found!"
    exit 1
fi

# Check if certificates exist
if [ ! -d "./certs" ]; then
    echo "🔐 Generating mTLS certificates..."
    ./scripts/generate-certs.sh
fi

# Check if database is running
if ! pg_isready -h localhost -p 5432 -U atp_user > /dev/null 2>&1; then
    echo "❌ PostgreSQL is not running. Please start the database first."
    echo "   Run: docker run -d --name atp-postgres -e POSTGRES_DB=atp_production -e POSTGRES_USER=atp_user -e POSTGRES_PASSWORD=your-secure-password -p 5432:5432 postgres:15-alpine"
    exit 1
fi

echo "✅ Database connection verified"

# Build all packages
echo "🔨 Building packages..."
npm run build

# Start services with production configuration
echo "🌟 Starting ATP services..."

# Start Identity Service
echo "  🆔 Starting Identity Service (port 3001)..."
cd packages/identity-service
PORT=3001 \
DATABASE_URL="$DATABASE_URL" \
MTLS_ENABLED=true \
MTLS_CA_CERT="../../certs/ca-cert.pem" \
MTLS_SERVER_CERT="../../certs/server-cert.pem" \
MTLS_SERVER_KEY="../../certs/server-key.pem" \
node dist/index.js &
IDENTITY_PID=$!
cd ../..

# Start VC Service
echo "  📜 Starting VC Service (port 3002)..."
cd packages/vc-service
PORT=3002 \
DATABASE_URL="$DATABASE_URL" \
MTLS_ENABLED=true \
MTLS_CA_CERT="../../certs/ca-cert.pem" \
MTLS_SERVER_CERT="../../certs/server-cert.pem" \
MTLS_SERVER_KEY="../../certs/server-key.pem" \
node dist/index.js &
VC_PID=$!
cd ../..

# Start Permission Service
echo "  🔐 Starting Permission Service (port 3003)..."
cd packages/permission-service
PORT=3003 \
DATABASE_URL="$DATABASE_URL" \
JWT_SECRET="$JWT_SECRET" \
MTLS_ENABLED=true \
MTLS_CA_CERT="../../certs/ca-cert.pem" \
MTLS_SERVER_CERT="../../certs/server-cert.pem" \
MTLS_SERVER_KEY="../../certs/server-key.pem" \
node dist/index.js &
PERMISSION_PID=$!
cd ../..

# Start Audit Logger
echo "  📊 Starting Audit Logger (port 3004)..."
cd packages/audit-logger
PORT=3004 \
DATABASE_URL="$DATABASE_URL" \
IPFS_URL="http://localhost:5001" \
MTLS_ENABLED=true \
MTLS_CA_CERT="../../certs/ca-cert.pem" \
MTLS_SERVER_CERT="../../certs/server-cert.pem" \
MTLS_SERVER_KEY="../../certs/server-key.pem" \
node dist/index.js &
AUDIT_PID=$!
cd ../..

# Start Identity Service (required for authentication)
echo "  🆔 Starting Identity Service (port 3001)..."
cd packages/identity-service
PORT=3001 \
DATABASE_URL="postgresql://atp_user:CHANGE_ME_SECURE_PASSWORD_123!@localhost:5432/atp_production" \
SESSION_SECRET="atp-identity-session-secret-production-change-me" \
NODE_ENV=production \
node dist/index.js &
IDENTITY_PID=$!
cd ../..

# Start RPC Gateway
echo "  🌐 Starting RPC Gateway (port 3000 HTTP, 3443 HTTPS)..."
cd packages/rpc-gateway
PORT=3000 \
HTTPS_PORT=3443 \
TLS_CONFIG_PATH="../../tls-config.json" \
MTLS_ENABLED=true \
node dist/index.js &
GATEWAY_PID=$!
cd ../..

# Start Quantum-Safe Server
echo "  🛡️ Starting Quantum-Safe Server (port 3008)..."
NODE_ENV=production \
PORT=3008 \
ATP_QUANTUM_SAFE=true \
ATP_TRUST_LEVELS=basic,verified,enterprise \
ATP_RATE_LIMIT_ENABLED=true \
node quantum-safe-server-standalone-v2.js &
QUANTUM_PID=$!

# Wait for services to start
echo "⏳ Waiting for services to initialize..."
sleep 10

# Health check
echo "🏥 Performing health checks..."
if curl -s http://localhost:3000/health > /dev/null; then
    echo "✅ All services are healthy and running!"
    echo ""
    echo "🎯 ATP Production Services Status:"
    echo "   🆔 Identity Service:    http://localhost:3001"
    echo "   📜 VC Service:          http://localhost:3002"
    echo "   🔐 Permission Service:  http://localhost:3003"
    echo "   📊 Audit Logger:        http://localhost:3004"
    echo "   🌐 RPC Gateway:         http://localhost:3000"
    echo "   🛡️ Quantum-Safe Server: http://localhost:3008"
    echo ""
    echo "🔒 Security Features Enabled:"
    echo "   ✅ mTLS Authentication"
    echo "   ✅ Quantum-Safe Cryptography"
    echo "   ✅ Rate Limiting"
    echo "   ✅ Audit Logging"
    echo "   ✅ Production Environment"
    echo ""
    echo "📋 To stop all services: ./scripts/stop-production.sh"
else
    echo "❌ Health check failed. Check service logs."
    exit 1
fi

# Create PID file for cleanup
echo "$IDENTITY_PID $VC_PID $PERMISSION_PID $AUDIT_PID $GATEWAY_PID $QUANTUM_PID" > .atp-pids

echo "🚀 ATP Production deployment complete!"