# agenttrust.dev Routing Implementation

## Problem
When developers click the homepage link from the npm package (`agenttrust.dev`), they should land on a developer-focused page, not the enterprise homepage.

## Solution
Domain-based routing in middleware that redirects `agenttrust.dev` root to `/developers`.

## Implementation

### Middleware Update
Added domain detection in `middleware.ts`:
- If hostname is `agenttrust.dev` and path is `/` → redirect to `/developers`
- `agenttrustprotocol.com` continues to show enterprise homepage at `/`

### User Flow

**From NPM Package:**
1. Developer clicks homepage link: `https://agenttrust.dev`
2. Middleware detects domain
3. Automatically redirects to: `https://agenttrust.dev/developers`
4. Developer sees developer portal with SDK docs, examples, etc.

**From Enterprise Domain:**
1. Enterprise user visits: `https://agenttrustprotocol.com`
2. Shows standard homepage with enterprise CTAs
3. Can navigate to `/developers` if needed

## Benefits
- ✅ Clear separation of concerns
- ✅ Better developer experience
- ✅ SEO-friendly (canonical URLs)
- ✅ No duplicate content issues
- ✅ Simple implementation

## Testing

### Local Testing
```bash
# Simulate agenttrust.dev
curl -H "Host: agenttrust.dev" http://localhost:3030/

# Should redirect to /developers
```

### Production
- `agenttrust.dev` → `/developers` (automatic redirect)
- `agenttrustprotocol.com` → `/` (enterprise homepage)

---

**Status**: ✅ Implemented in middleware.ts

