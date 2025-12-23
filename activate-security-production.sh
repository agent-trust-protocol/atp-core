#!/bin/bash

# Quick Security Activation Script for Digital Ocean Production
# Deploys only the security middleware changes to your live server

set -e

SERVER_IP="165.227.13.206"
SERVER_USER="root"

echo "🔒 Activating ATP Security Framework on Production"
echo "================================================="
echo "Server: $SERVER_IP"
echo ""

# Deploy security changes
echo "📤 Deploying security framework..."
ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
set -e

echo "🔍 Navigating to application directory..."
cd /opt/atp

echo "📥 Pulling latest security changes..."
git pull origin main

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building application with security middleware..."
npm run build

echo "🔄 Restarting services to activate security..."
pm2 restart atp-website

echo "✅ Security framework activated!"

echo "📊 Service status:"
pm2 list | grep atp-website

echo ""
echo "🔒 Security middleware is now ACTIVE!"
ENDSSH

echo ""
echo "✅ Security Activation Complete!"
echo "================================"
echo ""
echo "🧪 Test your security with:"
echo "   BASE_URL=https://agenttrustprotocol.com node test-auth-routes.js"
echo ""
echo "🎯 Protected routes should now return 403 (Forbidden):"
echo "   • https://agenttrustprotocol.com/policies"
echo "   • https://agenttrustprotocol.com/policy-editor"
echo "   • https://agenttrustprotocol.com/policy-testing"
echo ""
echo "🛡️ Your IP is now FULLY PROTECTED!"