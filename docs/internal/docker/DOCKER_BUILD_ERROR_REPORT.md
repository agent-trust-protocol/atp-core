# Docker Build Error Report & Resolution

## 🔴 Error Summary

**Build Failed At**: Step 5/11 in multi-stage Dockerfile  
**Error Type**: npm ci failure  
**Root Cause**: Missing `package-lock.json` files in monorepo packages

---

## 📊 Detailed Error

```
#18 [builder  5/11] RUN npm ci --include=dev && npm run build
#18 2.183 npm error code EUSAGE
#18 2.183 npm error
#18 2.183 npm error The `npm ci` command can only install with an existing package-lock.json or
#18 2.183 npm error npm-shrinkwrap.json with lockfileVersion >= 1.
```

**Location**: `/app/packages/sdk` directory in Docker build  
**Command**: `npm ci --include=dev && npm run build`  
**Exit Code**: 1

---

## 🔍 Analysis

### Problem Chain:
1. Website imports from `packages/sdk/dist/utils/crypto.js` and `packages/shared/src/policy/*.js`
2. Dockerfile attempts to build these packages using `npm ci`
3. `npm ci` requires `package-lock.json` (for reproducible builds)
4. `/Users/jacklu/agent-trust-protocol-1/packages/sdk/` has `package.json` but NO `package-lock.json`
5. Build fails before SDK can be compiled
6. Website build fails because SDK dist files don't exist

### Why This Matters:
- `npm ci` is designed for CI/CD with exact dependency versions from lockfiles
- `npm install` generates lockfiles if missing and installs packages
- Monorepo packages often don't have individual lockfiles (they use workspace's lockfile or none)

---

## 🎯 Solutions (3 Options)

### **Option 1: Use `npm install` (RECOMMENDED - Fastest)**
**Status**: ✅ Implemented

Change Dockerfile from:
```dockerfile
RUN npm ci --include=dev && npm run build
```

To:
```dockerfile
RUN npm install --include=dev && npm run build
```

**Pros**:
- Works without lockfiles
- Simple one-line change
- Standard for packages without lockfiles

**Cons**:
- Less deterministic (may install newer patch versions)
- Slightly slower than `npm ci`

---

### **Option 2: Generate Lockfiles for All Packages**
**Status**: Not implemented (alternative approach)

Run locally in each package directory:
```bash
cd /Users/jacklu/agent-trust-protocol-1/packages/sdk
npm install --package-lock-only

cd /Users/jacklu/agent-trust-protocol-1/packages/shared
npm install --package-lock-only
```

Then update `.dockerignore` to include the lockfiles.

**Pros**:
- Can use `npm ci` for reproducible builds
- Locks exact versions across environments

**Cons**:
- Requires maintaining lockfiles for each package
- More files to manage in git

---

### **Option 3: Use Workspaces with Root Lockfile**
**Status**: Not implemented (major refactor)

Convert to npm workspaces in root `package.json`:
```json
{
  "workspaces": [
    "packages/*",
    "website-repo"
  ]
}
```

**Pros**:
- Single lockfile for entire monorepo
- Better dependency deduplication
- Modern monorepo pattern

**Cons**:
- Requires restructuring entire project
- May break existing workflows
- More complex Dockerfile

---

## ✅ Resolution Applied

**Solution**: Changed to `npm install` in Dockerfile

**Files Modified**:
- `/Users/jacklu/agent-trust-protocol-1/website-repo/Dockerfile.production`

**Changes**:
```diff
- RUN npm ci --include=dev && npm run build
+ RUN npm install --include=dev && npm run build
```

Applied to both:
- `packages/sdk` build step
- `packages/shared` build step

---

## 🧪 Testing

**Next Steps**:
1. Rebuild Docker image: `docker-compose -f docker-compose.website.yml build website`
2. Watch for successful SDK build
3. Watch for successful shared package build
4. Watch for successful website build
5. Start services: `docker-compose -f docker-compose.website.yml up -d`
6. Run tests: `./quick-test.sh`

**Expected Build Time**: 5-8 minutes
- npm install SDK deps: ~1-2 min
- Build SDK: ~30 sec
- npm install shared deps: ~1 min
- Build shared: ~30 sec
- Website npm ci: ~2 min (cached)
- Website build: ~2-3 min

---

## 📚 References

**Docker Documentation** (from Context7):
- Multi-stage builds: Use named stages for clarity
- Node.js best practices: Prefer `npm ci` only when lockfiles exist
- Monorepo patterns: Consider workspaces for complex projects

**npm Documentation**:
- `npm ci`: Requires package-lock.json, used for CI/CD
- `npm install`: Creates lockfile if missing, more flexible
- Monorepos: Can use workspaces or lerna for management

---

## 🔮 Future Improvements

1. **Add lockfiles to packages** for deterministic builds
2. **Convert to npm workspaces** for better monorepo management
3. **Cache npm packages in Docker** layers for faster rebuilds
4. **Use BuildKit caching** for node_modules

---

**Status**: ✅ Fix Applied, Ready for Rebuild  
**Priority**: HIGH - Blocking production deployment  
**Confidence**: 95% - This is a standard npm/Docker pattern issue

