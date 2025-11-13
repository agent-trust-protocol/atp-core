#!/bin/bash

# FIXED SSH DEPLOYMENT COMMAND
# The previous command hung because of quote nesting issues

echo "🔧 FIXED ATP SECURITY DEPLOYMENT"
echo "=================================="
echo ""
echo "First, press Ctrl+C to escape the hanging command, then run:"
echo ""
echo "────────────────────────────────────────────────────────────"
echo 'ssh root@165.227.13.206 "cd /opt/atp-clean && git pull origin main && npm install && npm run build && pm2 restart atp-website && pm2 list && curl -I https://agenttrustprotocol.com/policies"'
echo "────────────────────────────────────────────────────────────"
echo ""
echo "This simplified command will:"
echo "  1. Connect to your server"
echo "  2. Go to the correct directory (/opt/atp-clean)"
echo "  3. Pull latest security code"
echo "  4. Install dependencies"
echo "  5. Build with security middleware"
echo "  6. Restart the website"
echo "  7. Show PM2 status"
echo "  8. Test if /policies is now protected"
echo ""
echo "Expected result: HTTP/1.1 403 Forbidden"