#!/bin/bash
# build-all.sh - Build all ATP backend service packages
# Run this before start-services.sh when dist/ directories are missing

set -e

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Building ATP service packages..."

# 1. shared must be built first (all services depend on it)
echo ""
echo "[1/6] Building @atp/shared..."
cd "$ROOT_DIR/packages/shared" && npm run build
echo "      ✓ shared"

# 2. Backend services (order doesn't matter after shared)
echo ""
echo "[2/6] Building identity-service..."
cd "$ROOT_DIR/packages/identity-service" && npm run build
echo "      ✓ identity-service"

echo ""
echo "[3/6] Building vc-service..."
cd "$ROOT_DIR/packages/vc-service" && npm run build
echo "      ✓ vc-service"

echo ""
echo "[4/6] Building permission-service..."
cd "$ROOT_DIR/packages/permission-service" && npm run build
echo "      ✓ permission-service"

echo ""
echo "[5/6] Building audit-logger..."
cd "$ROOT_DIR/packages/audit-logger" && npm run build
echo "      ✓ audit-logger"

echo ""
echo "[6/6] Building rpc-gateway..."
cd "$ROOT_DIR/packages/rpc-gateway" && npm run build
echo "      ✓ rpc-gateway"

echo ""
echo "All packages built. You can now run ./start-services.sh"
