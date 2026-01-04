# Website Deployment Guide

## Deployment Method Discovered

**Repository**: GitHub (`https://github.com/agent-trust-protocol/core.git`)  
**Production Server**: `165.227.13.206` (Digital Ocean)  
**Server Path**: `/opt/atp`  
**Service Manager**: PM2 (`atp-website` service)

## Deployment Process

The deployment uses a **Git-based workflow**:

1. **Push code to GitHub** (main branch)
2. **SSH to production server**
3. **Pull latest code** from GitHub
4. **Build SDK and website**
5. **Restart PM2 service**

## Quick Deployment Command

I've created a deployment script: `deploy-website-updates.sh`

### To deploy manually:

```bash
# 1. Build SDK (required for website API routes)
cd packages/sdk
npm install
npm run build
cd ../..

# 2. Commit and push changes
git add .
git commit -m "feat: Integrate quantum-safe SDK and update compliance badges

- Update compliance badges: SOC2-Ready, HIPAA-Aligned, GDPR-Ready
- Integrate actual atp-sdk for quantum-safe signature demo
- Add API routes for signature generation/verification
- Use hybrid Ed25519 + ML-DSA cryptography by default"
git push origin main

# 3. Deploy to production server
ssh root@165.227.13.206 'cd /opt/atp && git pull origin main && npm install && cd packages/sdk && npm install && npm run build && cd ../.. && cd website-repo && npm install && npm run build && cd .. && pm2 restart atp-website && pm2 status'
```

### Or use the automated script:

```bash
./deploy-website-updates.sh
```

## What Gets Deployed

### Files Changed (6 files):

**Created:**
- `website-repo/src/app/api/crypto/generate-signature/route.ts`
- `website-repo/src/app/api/crypto/verify-signature/route.ts`

**Modified:**
- `website-repo/src/components/atp/demo-dashboard-simple.tsx`
- `website-repo/src/components/atp/demo-dashboard.tsx`
- `website-repo/src/components/atp/enterprise-dashboard.tsx`
- `website-repo/src/components/atp/quantum-safe-signature-demo.tsx`

### Updates:

1. **Compliance Badges**: Now show "SOC2-Ready", "HIPAA-Aligned", "GDPR-Ready", "ISO 27001-Aligned"
2. **Quantum-Safe Demo**: Now uses actual SDK with real hybrid cryptography (not simulated)
3. **API Routes**: Server-side endpoints for signature generation/verification

## Verification After Deployment

1. **Test Homepage Demo:**
   ```
   Visit: https://agenttrustprotocol.com
   → Scroll to "Interactive Demos"
   → Click "Generate Signature" in Quantum-Safe Signatures
   → Verify real signature is generated (not random hex)
   ```

2. **Test API Endpoints:**
   ```bash
   curl https://agenttrustprotocol.com/api/crypto/generate-signature
   # Should return API info
   ```

3. **Check Compliance Badges:**
   ```
   Visit: https://agenttrustprotocol.com/dashboard
   → Verify badges show "SOC2-Ready", "HIPAA-Aligned", etc.
   ```

## Troubleshooting

If deployment fails:

1. **Check SSH access:**
   ```bash
   ssh root@165.227.13.206
   ```

2. **Check PM2 service:**
   ```bash
   ssh root@165.227.13.206 'pm2 status'
   ```

3. **Check build errors:**
   ```bash
   ssh root@165.227.13.206 'cd /opt/atp/website-repo && npm run build'
   ```

4. **Manual restart:**
   ```bash
   ssh root@165.227.13.206 'cd /opt/atp && pm2 restart atp-website'
   ```

## Notes

- The SDK must be built before the website can use the API routes
- PM2 manages the website service as `atp-website`
- The server pulls from GitHub's `main` branch
- All deployment happens via SSH to the production server

