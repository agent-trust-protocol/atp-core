#!/bin/bash

# FINAL SECURITY DEPLOYMENT COMMAND
# This script ensures your security framework is properly deployed

echo "======================================================"
echo "🔒 ATP SECURITY FRAMEWORK - FINAL DEPLOYMENT"
echo "======================================================"
echo ""
echo "Target Server: 165.227.13.206"
echo "Application Path: /opt/atp"
echo ""

# The complete deployment command
echo "📋 COPY AND RUN THIS COMPLETE COMMAND:"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
cat << 'COMMAND'
ssh root@165.227.13.206 '
set -e
echo "🚀 Starting security deployment..."

# Navigate to main application
cd /opt/atp
echo "📍 Location: $(pwd)"

# Ensure we have the latest code
echo "📥 Fetching latest changes..."
git fetch origin main
git reset --hard origin/main

# Check if website-repo exists and update it
if [ -d "website-repo" ]; then
  echo "📂 Updating website-repo submodule..."
  cd website-repo
  git fetch origin main
  git reset --hard origin/main
  cd ..
else
  echo "⚠️  No website-repo found, continuing..."
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Build the application
echo "🔨 Building with security middleware..."
npm run build

# If website-repo exists, build it separately
if [ -d "website-repo" ]; then
  echo "🔨 Building website-repo..."
  cd website-repo
  npm install --production
  npm run build
  cd ..
fi

# Restart the main website service
echo "🔄 Restarting website service..."
pm2 restart atp-website

# Show status
echo "📊 Service status:"
pm2 status atp-website

echo "✅ Security deployment complete!"
echo ""
echo "Testing protection..."
curl -s -o /dev/null -w "• /policies: HTTP %{http_code}\n" https://agenttrustprotocol.com/policies
curl -s -o /dev/null -w "• /policy-editor: HTTP %{http_code}\n" https://agenttrustprotocol.com/policy-editor
'
COMMAND
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "After running, you should see:"
echo "  • /policies: HTTP 403 (currently 200)"
echo "  • /policy-editor: HTTP 403 (currently 200)"
echo ""
echo "🎯 This will activate your $65K+ IP protection!"