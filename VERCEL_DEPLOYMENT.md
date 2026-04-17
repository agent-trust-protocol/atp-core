# Vercel Deployment Guide — ATP Core

This guide covers deploying the ATP Core Next.js frontend to Vercel.

## Quick Start

1. **Connect the repository** to Vercel (https://vercel.com/new)
   - Select `atp-core` from GitHub
   - Vercel auto-detects Next.js
   
2. **Set environment variables** (see table below)
   - Go to Project → Settings → Environment Variables
   - Paste each key-value pair

3. **Deploy**
   - Click "Deploy" — Vercel builds and deploys automatically

## Environment Variables

### Required (must be set before first deployment)

| Key | Example | Notes |
|-----|---------|-------|
| `BETTER_AUTH_SECRET` | `<openssl rand -base64 32>` | Auth secret. Generate once, keep safe. |
| `BETTER_AUTH_URL` | `https://myapp.vercel.app` | Public auth callback URL. Use your Vercel domain. |
| `DATABASE_URL` | `postgresql://user:pass@host:5432/db` | PostgreSQL connection. Better Auth uses this for sessions. |

### Recommended (for email & API features)

| Key | Example | Notes |
|-----|---------|-------|
| `RESEND_API_KEY` | `re_xxxxxxxxxxxxx` | Resend.com API key. Free tier available. |
| `NEXT_PUBLIC_ATP_IDENTITY_URL` | `https://identity.myapp.com` | Public identity service URL. |
| `NEXT_PUBLIC_ATP_PERMISSION_URL` | `https://permission.myapp.com` | Public permission service URL. |
| `NEXT_PUBLIC_ATP_AUDIT_URL` | `https://audit.myapp.com` | Public audit service URL. |
| `NEXT_PUBLIC_APP_URL` | `https://myapp.vercel.app` | Your deployed app URL. |
| `NEXT_PUBLIC_APP_DOMAIN` | `https://myapp.vercel.app` | Domain for routing. Usually same as above. |

### Private Backend Services (optional, for ATP service integration)

Set these if you have ATP services running behind a private network or on Railway:

| Key | Example |
|-----|---------|
| `ATP_IDENTITY_URL` | `http://identity-service:3001` or Railway private URL |
| `ATP_CREDENTIALS_URL` | `http://credentials-service:3002` or Railway private URL |
| `ATP_PERMISSIONS_URL` | `http://permissions-service:3003` or Railway private URL |
| `ATP_AUDIT_URL` | `http://audit-service:3005` or Railway private URL |

## Setup Steps

### 1. Generate `BETTER_AUTH_SECRET`

Run once, on your local machine:

```bash
openssl rand -base64 32
```

Copy the output and paste as `BETTER_AUTH_SECRET` in Vercel.

### 2. Set up PostgreSQL database

Options:
- **Vercel Postgres** (recommended) — built-in, serverless
  - Create a Vercel Postgres database in your Project Settings
  - Copy the connection string as `DATABASE_URL`
- **Railway** — fast, simple deployment
  - Create a PostgreSQL instance at https://railway.app
  - Copy the connection string as `DATABASE_URL`
- **Neon** — serverless PostgreSQL
  - Create a project at https://neon.tech
  - Copy the connection string as `DATABASE_URL`

### 3. Set up email (optional)

**Resend** (recommended):
1. Sign up at https://resend.com
2. Create an API key at https://resend.com/api-keys
3. Set `RESEND_API_KEY` in Vercel
4. Verify your domain in Resend (or use `onboarding@resend.dev` for testing)

**Alternatives:**
- **SendGrid** — set `SENDGRID_API_KEY`
- **SMTP** — configure `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`

### 4. Connect ATP backend services (optional)

If you're running ATP services (identity, permission, audit), point to them:

**Public URLs** (accessible from browser):
- `NEXT_PUBLIC_ATP_IDENTITY_URL`
- `NEXT_PUBLIC_ATP_PERMISSION_URL`
- `NEXT_PUBLIC_ATP_AUDIT_URL`

**Private URLs** (backend only):
- `ATP_IDENTITY_URL`
- `ATP_CREDENTIALS_URL`
- `ATP_PERMISSIONS_URL`
- `ATP_AUDIT_URL`

See `packages/<service>/README.md` for deployment instructions.

## Monorepo Structure

ATP Core is a monorepo:
- **Root** (`src/`) — Next.js frontend (deployed on Vercel)
- **packages/** — shared utilities and backend services
  - `packages/sdk` — TypeScript SDK (published to npm)
  - `packages/identity-service` — DID + agent identity
  - `packages/permission-service` — RBAC + policies
  - `packages/audit-logger` — blockchain audit trail
  - Other services (vc-service, monitoring-service, etc.)

**Vercel deploys only the Next.js frontend** (`src/`). Backend services are deployed separately (usually on Railway, Docker, or Kubernetes).

## Build Settings

| Setting | Value | Notes |
|---------|-------|-------|
| Build command | `npm run build` | Uses Next.js build. |
| Install command | `npm ci` | Clean install (recommended for CI). |
| Output dir | `.next` | Next.js auto-handles this. |
| Functions memory | 3008 MB | Increased for monorepo. |
| Functions max duration | 60 seconds | Reasonable for server-side ops. |

These are configured in `vercel.json`.

## Troubleshooting

### Build fails: "Cannot find module 'package-x'"

**Cause:** Vercel can't resolve monorepo packages.

**Fix:**
1. Ensure `vercel.json` has `installCommand: "npm ci"`
2. Check `package.json` has all workspace packages listed
3. Rebuild: `npm run build` locally first to verify

### "BETTER_AUTH_SECRET is required"

**Cause:** Auth secret not set in Vercel env vars.

**Fix:**
1. Generate: `openssl rand -base64 32`
2. In Vercel → Settings → Environment Variables, add `BETTER_AUTH_SECRET=<value>`
3. Redeploy

### Database connection refused

**Cause:** `DATABASE_URL` is invalid or database is unreachable.

**Fix:**
1. Verify `DATABASE_URL` is correct: `postgresql://user:pass@host/db`
2. Check database is running and accessible from Vercel's IP
3. Test locally: `psql $DATABASE_URL` (if you have pg installed)

### Emails not sending

**Cause:** `RESEND_API_KEY` not set or sender not verified.

**Fix:**
1. Set `RESEND_API_KEY` in Vercel env vars
2. In Resend dashboard, verify your sender email
3. For testing, use `onboarding@resend.dev`

## Local Development

To test locally before deploying:

```bash
# Copy env template
cp .env.example .env.local

# Fill in your secrets (or test values)
nano .env.local

# Install deps
npm install

# Build and start
npm run build
npm start

# Or use dev mode (with hot reload)
npm run dev
```

Visit `http://localhost:3000`.

## CI/CD

GitHub Actions automatically triggers Vercel deployments when you push:
- **main** → production
- **develop** → preview

Set GitHub token in Vercel dashboard if needed (usually auto-detected).

## See Also

- `.env.example` — all available environment variables
- `.vercel/` — Vercel-specific config (auto-generated)
- `next.config.js` — Next.js build settings
- `packages/*/README.md` — backend service deployment guides
