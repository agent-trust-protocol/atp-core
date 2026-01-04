# Deployment Updates - Developer Portal & Repo Links

## Changes Made

### 1. ✅ NPM Package Homepage Updated
**File:** `packages/sdk/package.json`
- **Changed:** `homepage` from `https://agenttrust.dev` → `https://agenttrustprotocol.com/developers`
- **Impact:** When developers click the homepage link from npm, they'll go directly to the developer portal

### 2. ✅ Repository Links Added to Footer
**File:** `website-repo/src/components/ui/footer.tsx`
- **Added:** New "Repositories" section in footer
- **Links:**
  - Core Protocol → `https://github.com/agent-trust-protocol/core`
  - Organization → `https://github.com/agent-trust-protocol`
- **Layout:** Changed from 4 columns to 5 columns to accommodate new section

### 3. ✅ Repository Links Added to Homepage
**File:** `website-repo/src/app/page.tsx`
- **Added:** Repository links in the hero section below the main CTA
- **Links:**
  - Core Protocol (with Git icon)
  - All Repositories (with GitHub icon)
- **Design:** Clean, minimal links with icons

## Deployment Steps

### Step 1: Commit Changes
```bash
cd /Users/jacklu/agent-trust-protocol-1
git add packages/sdk/package.json website-repo/src/components/ui/footer.tsx website-repo/src/app/page.tsx
git commit -m "Update npm homepage to agenttrustprotocol.com/developers and add repo links"
```

### Step 2: Deploy Website to Production
```bash
cd website-repo
./deploy-to-production.sh
```

This will:
- Push code to GitHub
- Pull latest code on production server
- Install dependencies
- Build Next.js application
- Restart PM2 process

### Step 3: Publish Updated NPM Package (Optional)
If you want to update the npm package with the new homepage:
```bash
cd packages/sdk
npm version patch  # Bumps to 1.1.2
npm run release   # Builds, tests, and publishes
```

## Expected Results

### After Deployment:
1. **`agenttrustprotocol.com/developers`** → Full developer portal page
2. **NPM Package Homepage** → Links to `agenttrustprotocol.com/developers`
3. **Homepage** → Shows repository links in hero section
4. **Footer** → New "Repositories" section with links

### Testing Checklist:
- [ ] Visit `https://agenttrustprotocol.com/developers` - should show developer portal
- [ ] Check npm package homepage link - should redirect to `/developers`
- [ ] Check homepage - should show repo links
- [ ] Check footer - should have "Repositories" section

## Files Changed
1. `packages/sdk/package.json` - Homepage URL updated
2. `website-repo/src/components/ui/footer.tsx` - Repositories section added
3. `website-repo/src/app/page.tsx` - Repo links added to hero

---

**Status:** ✅ Ready for deployment
**Next:** Run `./deploy-to-production.sh` in `website-repo` directory


