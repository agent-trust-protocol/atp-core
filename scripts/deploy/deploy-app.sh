#!/bin/bash

# ATP System Deployment Script
# Automated deployment for Monday launch

set -e  # Exit on any error

echo "🚀 ATP SYSTEM DEPLOYMENT SCRIPT"
echo "==============================="
echo "Starting deployment at $(date)"
echo ""

# Configuration
ATP_ENV=${ATP_ENV:-production}
ATP_PORT=${ATP_PORT:-3000}
ATP_HOST=${ATP_HOST:-0.0.0.0}

echo "📋 Deployment Configuration:"
echo "   Environment: $ATP_ENV"
echo "   Port: $ATP_PORT" 
echo "   Host: $ATP_HOST"
echo ""

# Step 1: Build all packages
echo "🔨 Building All Packages"
echo "------------------------"

npm install
npm run build

echo "✅ All packages built successfully"

# Step 2: Create production config
echo "🌍 Setting up production environment"
echo "-----------------------------------"

cat > .env.production << EOL
NODE_ENV=production
PORT=$ATP_PORT
HOST=$ATP_HOST
ENABLE_CLUSTERING=true
ENABLE_ENTERPRISE_FEATURES=true
EOL

echo "✅ Production environment configured"

echo ""
echo "🎉 DEPLOYMENT READY FOR MONDAY LAUNCH!"
echo "======================================"
echo "To start: npm start"
