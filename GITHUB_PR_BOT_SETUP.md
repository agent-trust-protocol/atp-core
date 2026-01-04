# 🤖 Recurse ML GitHub PR Bot Setup Guide

## ✨ What You're Installing

The **FREE Recurse ML GitHub App** for automated pull request reviews.

### Features:
- 🔍 **Automatic Code Analysis** on every PR
- 🐛 **Bug Detection** before merge
- 🚨 **Breaking Change Alerts**
- 📚 **Documentation Links** for fixes
- 🔒 **Security Issue Detection**
- ✅ **Zero Cost** for open source projects

---

## 🚀 Installation Steps

### Step 1: Open GitHub Marketplace

**Click this link:**
```
https://github.com/marketplace/recurse-ml
```

Or manually navigate to:
1. Go to https://github.com/marketplace
2. Search for "Recurse ML"
3. Click on the Recurse ML app

### Step 2: Install the App

1. Click **"Set up a plan"** or **"Install it for free"**
2. Select **"Free for open source"** plan
3. Click **"Install it for free"**
4. Click **"Complete order and begin installation"**

### Step 3: Configure Repository Access

Choose one of these options:

**Option A: All Repositories** (Recommended)
- Select "All repositories"
- This will analyze all your repos automatically

**Option B: Specific Repository**
- Select "Only select repositories"
- Choose: `agent-trust-protocol`
- Click **"Install"**

### Step 4: Authorize the App

1. GitHub will show permissions required
2. Review the permissions:
   - Read access to code
   - Read and write access to pull requests
   - Read access to metadata
3. Click **"Authorize"** or **"Install"**

### Step 5: Verify Installation

After installation, you'll be redirected to Recurse ML dashboard.

---

## 📊 How It Works

### Automatic PR Review Workflow:

```
Developer creates PR
       ↓
GitHub triggers Recurse ML bot
       ↓
Bot analyzes changed files with Context 7
       ↓
Bot posts review comments on PR
       ↓
Developer sees inline suggestions
       ↓
Developer fixes issues
       ↓
Bot re-analyzes after changes
       ↓
PR gets approval when clean
```

---

## 🎯 Testing the Setup

### Create a Test PR

1. **Create a new branch:**
   ```bash
   cd /Users/jacklu/agent-trust-protocol-1
   git checkout -b test-recurse-ml-bot
   ```

2. **Make a small change:**
   ```bash
   echo "// Testing Recurse ML bot" >> website-repo/src/app/page.tsx
   git add website-repo/src/app/page.tsx
   git commit -m "test: verify Recurse ML bot integration"
   git push origin test-recurse-ml-bot
   ```

3. **Create PR on GitHub:**
   - Go to https://github.com/YOUR_USERNAME/agent-trust-protocol
   - Click "Compare & pull request"
   - Create the PR

4. **Watch for bot comment:**
   - Recurse ML bot should comment within 1-2 minutes
   - You'll see analysis results and any issues found

---

## 💡 What the Bot Analyzes

### In Your Authentication Code:

#### Security Issues:
- SQL injection vulnerabilities
- XSS vulnerabilities
- Authentication bypasses
- Token handling issues
- Password storage problems
- Session management flaws

#### Logic Bugs:
- Missing error handling
- Race conditions
- Validation gaps
- Edge cases in auth flow
- Async/await issues

#### Code Quality:
- Unused variables
- Dead code paths
- Performance issues
- Best practice violations
- TypeScript type issues

#### Breaking Changes:
- API contract changes
- Database schema changes
- Dependency updates
- Config changes

---

## 📋 Expected Bot Comments

### Example Bot Review Comment:

```
🐛 Recurse ML found potential issues:

**Security Issue - High Severity**
📍 src/app/api/auth/login/route.ts:42

Issue: Password comparison using == instead of bcrypt.compare()
Risk: Authentication bypass vulnerability

Suggestion: Use bcrypt.compare() for secure password verification
```

With link to documentation and suggested fix.

---

## 🔧 Configuration Options

### Configure Bot Behavior (Optional)

After installation, you can configure:

1. **Severity Threshold**: Which issues trigger comments
   - Critical only
   - High and above
   - Medium and above (default)
   - All issues

2. **Auto-fix**: Let bot create commits with fixes
   - Enabled/Disabled

3. **File Ignore Patterns**:
   - `node_modules/**`
   - `dist/**`
   - `*.test.ts`

Access configuration at:
```
https://github.com/settings/installations
→ Configure Recurse ML
```

---

## 🎓 Best Practices

### 1. Review Bot Comments Promptly
- Bot provides valuable security insights
- Address critical issues before merging

### 2. Use Bot as Learning Tool
- Bot links to documentation
- Learn from suggested fixes

### 3. Integrate with CI/CD
- Bot comments appear in PR checks
- Use as merge requirement

### 4. Don't Ignore Security Issues
- Bot flags real vulnerabilities
- Fix before production deployment

---

## 🔍 Monitoring Bot Activity

### Check Bot Performance:

1. **PR Comments**: See inline reviews on pull requests
2. **GitHub Checks**: View in PR "Checks" tab
3. **Recurse Dashboard**: Visit https://app.recurse.ml for analytics

---

## 🆘 Troubleshooting

### Bot Not Commenting on PR

**Check:**
1. Is bot installed on correct repository?
2. Does PR contain code changes? (Not just markdown)
3. Are changes in analyzed file types? (.ts, .tsx, .js, .jsx)
4. Check GitHub Settings → Installed Apps → Recurse ML

**Fix:**
```bash
# Re-trigger bot by pushing new commit
git commit --allow-empty -m "chore: trigger Recurse ML bot"
git push
```

### Bot Permissions Issue

If bot can't comment:
1. Go to https://github.com/settings/installations
2. Click "Configure" next to Recurse ML
3. Ensure these permissions are granted:
   - Read access to code
   - Write access to pull requests

### Bot Missing from Repository

Reinstall:
1. Go to https://github.com/marketplace/recurse-ml
2. Click "Install" again
3. Select your repository
4. Authorize

---

## 📊 What to Expect

### First PR Review:

The bot will analyze your authentication code and likely find:

1. **Security Issues** (if any):
   - Token validation edge cases
   - Session management issues
   - SQL injection risks

2. **Logic Bugs**:
   - Missing error boundaries
   - Async/await patterns
   - Race conditions

3. **Code Quality**:
   - Unused imports
   - Type safety improvements
   - Best practices

### After Fixes:

Bot re-analyzes automatically when you push fixes. You'll see:
- ✅ Issues resolved
- 🎉 Clean code approval
- 📊 Code quality score

---

## 🎉 Success Criteria

Your setup is successful when:

✅ Bot appears in repository's installed apps
✅ Bot comments on test PR within 2 minutes
✅ Bot provides actionable feedback with documentation links
✅ Bot re-analyzes after fixes
✅ PR shows "Recurse ML approved" when clean

---

## 🔗 Quick Links

- **Install Bot**: https://github.com/marketplace/recurse-ml
- **Bot Settings**: https://github.com/settings/installations
- **Dashboard**: https://app.recurse.ml
- **Documentation**: https://docs.recurse.ml

---

## 📝 Next Steps After Installation

1. ✅ Install bot from GitHub Marketplace
2. ✅ Configure repository access
3. ✅ Create test PR to verify
4. ✅ Review bot comments
5. ✅ Make bot a required check for PRs (optional)
6. ✅ Share setup with team

---

**Installation Link:** https://github.com/marketplace/recurse-ml

**Start the installation now!** 🚀

After installation, create a test PR to see the bot in action.
