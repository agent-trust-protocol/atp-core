#!/bin/bash

# Quick Security Activation for Digital Ocean Production
SERVER_IP="165.227.13.206"
SERVER_USER="root"

echo "🔒 Activating ATP Security Framework..."

ssh $SERVER_USER@$SERVER_IP << 'ENDSSH'
cd /opt/atp
git pull origin main
npm install
npm run build
pm2 restart atp-website
pm2 list | grep atp-website
echo "✅ Security middleware ACTIVATED!"
ENDSSH

echo "🧪 Test with: curl -I https://agenttrustprotocol.com/policies"
echo "Expected: HTTP/1.1 403 Forbidden"
