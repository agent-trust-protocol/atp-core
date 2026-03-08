# Recurse ML - Complete Documentation (2025)

## 🤖 What is Recurse ML?

Recurse ML is an AI-powered codebase maintenance tool that analyzes your code, detects bugs, breaking changes, and performs automatic reviews before code hits production. It's designed to work with AI coding agents like Claude Code, Cursor, and GitHub Copilot.

---

## ✨ Key Features

### Code Analysis & Review
- **Full Codebase Understanding** - Analyzes component interactions across your entire codebase
- **Bug Detection** - Finds bugs upstream and downstream of code changes
- **Breaking Change Detection** - Identifies breaking changes before they hit production
- **Expert Library Knowledge** - Has up-to-date information on external and internal libraries
- **Documentation Links** - Links to correct documentation for every suggested fix
- **SQL Query Analysis** - Identifies edge cases in database queries

### AI Agent Integration
- Works seamlessly with Claude Code and Cursor
- Teaches agents to use `rml` as a final quality check
- Agents run `rml` automatically after large changes or task completion
- Ensures code quality before submission

### Supported Frameworks
- **React** - v19 with Server Components & Actions
- **Vue** - v3.5 Vapor Mode
- **Angular** - v19 with Signals & Control Flow

---

## 🚀 Installation

### Quick Install
```bash
curl install.recurse.ml | sh
```

### Verify Installation
```bash
rml --help
```

---

## 💻 Command Line Usage

```bash
# Get help
rml --help

# Analyze current directory
rml

# Analyze specific file
rml path/to/file.ts

# Analyze entire project
rml .
```

---

## 📖 Context 7 (AI Agent Integration)

### What is Context 7?

Context 7 refers to Recurse ML's deep integration with AI coding agents, providing 7 layers of context:

1. **Codebase Structure** - Understanding of entire project architecture
2. **Component Relationships** - How files and modules interact
3. **External Dependencies** - Library versions and APIs
4. **Internal APIs** - Your custom APIs and contracts
5. **Code Patterns** - Project-specific conventions
6. **Historical Changes** - Evolution of codebase
7. **Documentation** - Inline docs and external references

### How Context 7 Works

When integrated with AI agents like Claude Code:

```
Agent generates code
    ↓
Recurse ML analyzes with Context 7
    ↓
Identifies issues across all 7 layers
    ↓
Agent fixes issues
    ↓
Re-validates
    ↓
Presents clean code to developer
```

---

## 💰 Pricing

### Pro Plan: $25/month
- 14-day free trial
- Unlimited CLI access
- Integration with coding assistants
- GitHub PR review bot

---

## 🔒 Security & Privacy

- **Zero retention policy** - Code analyzed in real-time, then removed
- **SOC 2 compliance** - Currently pursuing certification
- **Never trains on your code** - Your code remains private

---

## 📊 Performance Metrics

- **80% reduction** in code review time
- **15,000+ bugs** resolved by users
- **Reduced production incidents**

---

## 🔗 Resources

- **Website**: https://www.recurse.ml/
- **GitHub**: https://github.com/Recurse-ML
- **GitHub Marketplace**: https://github.com/marketplace/recurse-ml

---

**Get Started:**

```bash
# Install now
curl install.recurse.ml | sh

# Run your first analysis
rml .
```
