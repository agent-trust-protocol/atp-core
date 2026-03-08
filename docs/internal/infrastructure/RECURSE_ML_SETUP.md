# 🔧 Recurse ML Setup for Agent Trust Protocol

## ✅ Installation Complete!

Recurse ML version **0.1.13** is now installed on your system!

**Installation Location**: `/Users/jacklu/.rml/bin/rml`

---

## 🔐 GitHub Authentication Required

Recurse ML requires GitHub authentication to analyze your code.

### Steps to Authenticate:

1. **Open this link in your browser**:
   ```
   https://github.com/login/device
   ```

2. **Enter this code**:
   ```
   D602-6F24
   ```

3. **Authorize Recurse ML** - Click "Authorize" when prompted

4. **Return to terminal** - Analysis will start automatically

---

## 🚀 Quick Start Commands

### Add to PATH Permanently

Add this to your shell config:

```bash
echo 'export PATH="$PATH:/Users/jacklu/.rml/bin"' >> ~/.zshrc
source ~/.zshrc
```

### Verify Installation

```bash
rml --version
```

Expected output: `🐞Running rml version 0.1.13`

---

## 📊 Analyze Your Code

### Analyze Authentication Code

```bash
cd /Users/jacklu/agent-trust-protocol-1/website-repo
rml src/app/api/auth/
```

### Analyze Entire Website

```bash
cd /Users/jacklu/agent-trust-protocol-1/website-repo
rml .
```

### Analyze Specific Files

```bash
# Login route
rml src/app/api/auth/login/route.ts

# Signup route
rml src/app/api/auth/signup/route.ts

# Email verification
rml src/app/api/auth/verify-email/route.ts

# Middleware
rml middleware.ts
```

---

## 🎯 Recommended Analysis Workflow

### 1. Authentication System

```bash
cd /Users/jacklu/agent-trust-protocol-1/website-repo

# Analyze auth routes
rml src/app/api/auth/

# Analyze auth pages
rml src/app/login/page.tsx
rml src/app/signup/page.tsx
rml src/app/verify-email/page.tsx

# Analyze middleware
rml middleware.ts
```

### 2. Main Application

```bash
# Analyze all pages
rml src/app/

# Analyze components
rml src/components/

# Analyze utilities
rml src/lib/
```

### 3. SDK Package

```bash
cd /Users/jacklu/agent-trust-protocol-1/packages/sdk

# Analyze SDK
rml src/

# Analyze crypto utilities
rml src/utils/crypto.ts
```

---

## 🔧 Configuration

### Create .rmlrc Config (Optional)

Create a config file in your project root:

```bash
cd /Users/jacklu/agent-trust-protocol-1/website-repo
```

Create `.rmlrc` file:

```json
{
  "ignore": [
    "node_modules/**",
    ".next/**",
    "dist/**",
    "build/**",
    "*.test.ts",
    "*.spec.ts"
  ],
  "severity": "high",
  "autoFix": false
}
```

---

## 🤖 AI Agent Integration

### For Claude Code

Recurse ML is already integrated with Claude Code! When you use Claude to generate code:

1. Claude generates the code
2. Recurse ML automatically analyzes it
3. Issues are detected via Context 7
4. Claude fixes issues before showing you
5. You receive clean, bug-free code

### For Cursor

Similar integration - Cursor will automatically use Recurse ML when available.

---

## 📋 Common Commands

### Help

```bash
rml --help
```

### Check Version

```bash
rml --version
```

### Analyze Current Directory

```bash
rml .
```

### Analyze with Verbose Output

```bash
rml --verbose src/app/
```

### Export Results

```bash
rml --output report.json src/
```

---

## 🐛 What Recurse ML Will Find

### In Your Authentication Code

- **Security Issues**
  - SQL injection vulnerabilities
  - XSS vulnerabilities
  - Authentication bypasses
  - Token handling issues

- **Logic Bugs**
  - Missing error handling
  - Race conditions
  - Validation gaps
  - Edge cases

- **Code Quality**
  - Unused variables
  - Dead code
  - Performance issues
  - Best practice violations

- **Breaking Changes**
  - API compatibility issues
  - Deprecated function usage
  - Library upgrade impacts

---

## 📊 Expected Analysis Results

### Authentication Routes Analysis

You'll get reports on:

1. **`/api/auth/signup`**
   - Password hashing security
   - Input validation
   - Token generation
   - Database operations

2. **`/api/auth/login`**
   - Credential verification
   - Session management
   - Error handling
   - Rate limiting gaps

3. **`/api/auth/verify-email`**
   - Token validation
   - Expiration handling
   - Single-use enforcement
   - Database updates

### Middleware Analysis

- Route protection logic
- JWT validation
- Maintenance mode logic
- Authentication flow

---

## 🔄 Integration with Your Workflow

### Pre-commit Hook

Add to `.git/hooks/pre-commit`:

```bash
#!/bin/sh
export PATH="$PATH:/Users/jacklu/.rml/bin"
rml --staged
```

Make it executable:

```bash
chmod +x .git/hooks/pre-commit
```

### CI/CD Integration

Add to GitHub Actions workflow:

```yaml
# .github/workflows/recurse.yml
name: Recurse ML Analysis
on: [pull_request]

jobs:
  analyze:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install Recurse ML
        run: curl -fsSL install.recurse.ml | sh

      - name: Add to PATH
        run: echo "$HOME/.rml/bin" >> $GITHUB_PATH

      - name: Analyze Code
        run: rml .
```

---

## 🎓 Best Practices

### 1. Start Small

```bash
# Analyze one file first
rml src/app/api/auth/login/route.ts
```

### 2. Fix Critical Issues First

Look for severity levels:
- 🔴 Critical
- 🟠 High
- 🟡 Medium
- 🔵 Low

### 3. Run Before Commits

```bash
# Before committing
rml src/app/api/auth/
git add .
git commit -m "fix: address security issues"
```

### 4. Integrate with AI Agents

Let Claude Code and Cursor use Recurse ML automatically for quality checks.

---

## 📈 Monitoring Progress

### Track Improvements

```bash
# Run analysis
rml . > analysis-before.txt

# Fix issues
# ... make changes ...

# Run again
rml . > analysis-after.txt

# Compare
diff analysis-before.txt analysis-after.txt
```

---

## 💡 Pro Tips

1. **Combine with Other Tools**
   - Use with ESLint for style
   - Use with TypeScript for types
   - Use with Jest for tests
   - Recurse ML finds logic bugs

2. **Focus on New Code**
   ```bash
   # Only analyze changed files
   git diff --name-only | xargs rml
   ```

3. **Use in Development**
   ```bash
   # Watch mode (if available)
   rml --watch src/
   ```

4. **Share Results with Team**
   ```bash
   rml --output team-report.html .
   ```

---

## 🔗 Quick Links

- **Authentication Routes**: `/Users/jacklu/agent-trust-protocol-1/website-repo/src/app/api/auth/`
- **Pages**: `/Users/jacklu/agent-trust-protocol-1/website-repo/src/app/`
- **Middleware**: `/Users/jacklu/agent-trust-protocol-1/website-repo/middleware.ts`
- **SDK**: `/Users/jacklu/agent-trust-protocol-1/packages/sdk/`

---

## 📞 Support

### If Issues Occur

1. **Check version**: `rml --version`
2. **Re-authenticate**: Delete `~/.rml/config.json` and re-run
3. **Update**: `curl -fsSL install.recurse.ml | sh`
4. **Check logs**: `rml --verbose`

---

## ✅ Setup Checklist

- [x] Recurse ML installed (v0.1.13)
- [ ] **GitHub authentication** ← COMPLETE THIS NOW
- [ ] PATH added to shell config
- [ ] Initial analysis run
- [ ] Issues reviewed
- [ ] Pre-commit hook configured (optional)
- [ ] CI/CD integration (optional)

---

## 🚀 Next Steps

### 1. Authenticate with GitHub

Go to: https://github.com/login/device
Enter code: **D602-6F24**

### 2. Run First Analysis

```bash
cd /Users/jacklu/agent-trust-protocol-1/website-repo
export PATH="$PATH:/Users/jacklu/.rml/bin"
rml src/app/api/auth/
```

### 3. Review Results

Fix any critical or high-severity issues found.

### 4. Integrate with Workflow

Add pre-commit hooks or CI/CD integration.

---

**Recurse ML is ready to help you build better code!** 🎉

Complete the GitHub authentication and start your first analysis!
