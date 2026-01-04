# Domain Routing Strategy

## Overview

ATP uses two domains with different purposes:

### 🏢 `agenttrustprotocol.com` → Enterprise Portal
- Enterprise customers
- Enterprise features and pricing
- Enterprise support
- On-premise deployments
- Enterprise sales

### 👨‍💻 `agenttrust.dev` → Developer Portal
- Developer-focused landing
- SDK documentation
- GitHub access
- Developer resources
- Open source community
- Developer onboarding

## Implementation Options

### Option 1: Domain-Based Redirect (Recommended)
When someone visits `agenttrust.dev`, automatically redirect to `/developers` page.

**Pros:**
- Simple and clear
- Direct path to developer resources
- SEO-friendly (single canonical URL)

**Cons:**
- Extra redirect (minor performance impact)

### Option 2: Domain-Based Homepage
Detect domain in middleware and serve different homepage content.

**Pros:**
- No redirect needed
- Customized experience per domain

**Cons:**
- More complex to maintain
- Duplicate content concerns

### Option 3: Shared Homepage with Smart CTA
Single homepage that adapts based on domain, showing relevant CTAs.

**Pros:**
- Single codebase
- Flexible

**Cons:**
- Less focused experience

## Recommended: Option 1

**Implementation:**
1. Add domain detection in `middleware.ts`
2. Redirect `agenttrust.dev` → `/developers`
3. Keep `agenttrustprotocol.com` → `/` (current enterprise homepage)

---

**Status**: Ready to implement

