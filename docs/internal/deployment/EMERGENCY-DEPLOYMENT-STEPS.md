# 🚨 ATP Emergency Production Deployment

## Current Issues
- ✅ Server accessible at 165.227.13.206
- ❌ HTTPS not working (port 443 connection failed)  
- ❌ Cloud Dashboard showing 502 Gateway errors
- ❌ SSL certificates need configuration
- ⚠️ Some services may need restart

## Quick Fix (Recommended)

### Option 1: Automated Fix (Easiest)
```bash
./fix-production.sh
```
This script handles everything automatically:
- Diagnoses current issues
- Fixes service configurations
- Configures SSL certificates
- Verifies deployment

### Option 2: Manual Step-by-Step

#### Step 1: Fix Services First
```bash
scp restart-services.sh root@165.227.13.206:/tmp/
ssh root@165.227.13.206 "chmod +x /tmp/restart-services.sh && /tmp/restart-services.sh"
```

#### Step 2: Configure SSL Certificates
```bash
scp configure-ssl.sh root@165.227.13.206:/tmp/
ssh root@165.227.13.206 "chmod +x /tmp/configure-ssl.sh && /tmp/configure-ssl.sh"
```

#### Step 3: Verify Deployment
```bash
./verify-deployment.sh
```

## Key Fixes Included

### 🔧 Service Fixes
- **Cloud Dashboard**: Fixed PM2 configuration to use `npm start` instead of direct server.js
- **Build Process**: Added separate dashboard build step to ensure Next.js is properly built
- **Dependencies**: Ensures all packages install dependencies and build correctly
- **PM2 Configuration**: Updated ecosystem.config.js with proper service definitions

### 🔒 SSL Configuration
- **Let's Encrypt**: Automated certificate generation for all domains
- **Multi-domain Certificate**: Covers all subdomains in one certificate
- **Nginx Configuration**: Proper HTTPS proxy configuration with headers
- **Auto-renewal**: Sets up automatic certificate renewal

### 🏥 Health Monitoring
- **Service Health Checks**: Tests all service endpoints
- **SSL Verification**: Validates certificate status and expiration
- **Auto-repair**: Attempts to restart failed services
- **Continuous Monitoring**: Optional continuous health monitoring

## Expected Results

After running the fix script, you should have:

### ✅ Working URLs
- **Main Website**: https://agenttrustprotocol.com
- **Cloud Dashboard**: https://cloud.agenttrustprotocol.com  
- **Monitoring**: https://monitoring.agenttrustprotocol.com
- **Support Agent**: https://support.agenttrustprotocol.com
- **API Gateway**: https://api.agenttrustprotocol.com

### ✅ Services Running
- Main Website (port 3002)
- Cloud Dashboard (port 3030) - **502 error fixed**
- Monitoring Service (port 3007)
- Support Agent (port 3001)
- Identity Service (port 3003)
- Permission Service (port 3004)
- RPC Gateway (port 3005)
- Audit Logger (port 3006)
- VC Service (port 3008)
- Protocol Integrations (port 3009)

### ✅ SSL Certificates
- Valid certificates for all domains
- Automatic HTTPS redirect
- Proper certificate renewal setup

## Troubleshooting

### If Services Still Show 502 Errors:
```bash
ssh root@165.227.13.206 "pm2 restart all && pm2 logs"
```

### If SSL Doesn't Work:
```bash
ssh root@165.227.13.206 "certbot certificates && nginx -t && systemctl restart nginx"
```

### For Continuous Monitoring:
```bash
ssh root@165.227.13.206 "/tmp/health-monitor.sh monitor"
```

### Check Specific Service Logs:
```bash
ssh root@165.227.13.206 "pm2 logs atp-cloud-dashboard"
```

## Production URLs After Fix

| Service | URL | Expected Status |
|---------|-----|----------------|
| Main Website | https://agenttrustprotocol.com | ✅ Working |
| Cloud Dashboard | https://cloud.agenttrustprotocol.com | ✅ Fixed (was 502) |
| Monitoring | https://monitoring.agenttrustprotocol.com | ✅ Working |
| Support Agent | https://support.agenttrustprotocol.com | ✅ Working |
| API Gateway | https://api.agenttrustprotocol.com | ✅ Working |

## Next Steps After Deployment

1. **Verify All Services**: Run `./verify-deployment.sh`
2. **Monitor Health**: Use `./health-monitor.sh monitor` 
3. **Test Functionality**: Check each service's core features
4. **Setup Alerts**: Configure monitoring alerts for production
5. **Backup Configuration**: Save working configs for future deployments

## Support Commands

```bash
# Quick health check
./verify-deployment.sh

# Monitor all services
ssh root@165.227.13.206 "/tmp/health-monitor.sh monitor"

# Restart specific service
ssh root@165.227.13.206 "pm2 restart atp-cloud-dashboard"

# View all logs
ssh root@165.227.13.206 "pm2 logs"

# Check SSL certificate status
ssh root@165.227.13.206 "certbot certificates"
```

---

**Time to Fix**: ~5-10 minutes with automated script
**Production Impact**: Minimal - services restart gracefully
**Risk Level**: Low - scripts include safety checks and rollback capabilities