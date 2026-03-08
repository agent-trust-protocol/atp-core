# Option A: Pre-Build Locally - Step by Step Guide

## 🎯 Goal
Build packages locally first, see real errors, fix them, then use pre-built packages in Docker.

---

## 📋 Step-by-Step Instructions

### **Step 1: Build SDK Package Locally**

```bash
cd /Users/jacklu/agent-trust-protocol-1/packages/sdk

# Install dependencies (if not already installed)
npm install

# Try to build - this will show real errors
npm run build
```

**What to look for:**
- ✅ If it builds successfully → Great! Move to Step 2
- ❌ If it fails → Note the errors, we'll fix them

**Common errors you might see:**
- Missing dependencies
- TypeScript type errors
- Module resolution issues

---

### **Step 2: Build Shared Package Locally**

```bash
cd /Users/jacklu/agent-trust-protocol-1/packages/shared

# Install dependencies (if not already installed)
npm install

# Try to build - this will show real errors
npm run build
```

**What to look for:**
- ✅ If it builds successfully → Great! Move to Step 3
- ❌ If it fails → Note the errors, we'll fix them

---

### **Step 3: Fix Errors as They Appear**

Based on the errors you see, we'll fix them. Common fixes:

#### **Missing Dependencies:**
```bash
# If you see "Cannot find module 'express'"
cd packages/shared
npm install express @types/express --save-dev

# If you see "Cannot find module 'fast-xml-parser'"
npm install fast-xml-parser --save-dev
```

#### **TypeScript Errors:**
- We'll fix type definitions
- Add missing type declarations
- Fix type mismatches

---

### **Step 4: Verify Builds Succeed**

After fixing errors, verify both packages build:

```bash
# SDK
cd /Users/jacklu/agent-trust-protocol-1/packages/sdk
npm run build

# Shared
cd /Users/jacklu/agent-trust-protocol-1/packages/shared
npm run build
```

**Success indicators:**
- ✅ `dist/` folder created in each package
- ✅ No error messages
- ✅ Build completes successfully

---

### **Step 5: Update Dockerfile to Use Pre-Built Packages**

Once packages build locally, we'll update the Dockerfile to copy the pre-built `dist/` folders instead of building inside Docker.

**The clean Dockerfile is already created:**
- `website-repo/Dockerfile.production.clean`

**To use it:**
```bash
# Update docker-compose to use the clean Dockerfile
# Or rename it to replace the current one
```

---

### **Step 6: Build Docker Image**

```bash
cd /Users/jacklu/agent-trust-protocol-1

# Build with clean Dockerfile (assumes pre-built packages)
docker-compose -f docker-compose.website.yml build website
```

This should be much faster since packages are already built!

---

## 🔧 Quick Fixes for Common Errors

### **Error: "Cannot find module 'express'"**
**Fix:**
```bash
cd packages/shared
npm install express @types/express --save-dev
```

### **Error: "Cannot find module 'fast-xml-parser'"**
**Fix:**
```bash
cd packages/shared
npm install fast-xml-parser --save-dev
```

### **Error: TypeScript type errors**
**Options:**
1. Fix the actual types (best)
2. Add `// @ts-ignore` comments (temporary)
3. Update tsconfig to be less strict (temporary)

---

## 📊 Progress Tracking

- [ ] Step 1: SDK builds locally
- [ ] Step 2: Shared builds locally
- [ ] Step 3: All errors fixed
- [ ] Step 4: Both packages have dist/ folders
- [ ] Step 5: Dockerfile updated
- [ ] Step 6: Docker build succeeds

---

## 🆘 If You Get Stuck

**Share the error message** and I'll help you fix it. Common things to share:
- Full error output
- Which package (SDK or Shared)
- Which step you're on

---

## ✅ Success Criteria

You'll know Option A is complete when:
1. ✅ `packages/sdk/dist/` exists and has files
2. ✅ `packages/shared/dist/` exists and has files
3. ✅ Docker build completes successfully
4. ✅ Website starts without errors

---

**Ready to start? Run Step 1 and share any errors you see!**

