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

### Required (app breaks without these)

| Key | Source | Purpose | How to set |
|-----|--------|---------|-----------|
| `BETTER_AUTH_SECRET` | `src/lib/auth.ts` | Auth secret for session signing | Generate: `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | `src/lib/auth.ts` | Public auth callback URL | Use your Vercel domain: `https://your-domain.vercel.app` |
| `DATABASE_URL` | Better Auth & email | PostgreSQL connection | See "Set up PostgreSQL" section below |

### Recommended (features won't work without these)

| Key | Source | Purpose | Notes |
|-----|--------|---------|-------|
| `EMAIL_PROVIDER` | `src/lib/email.ts` | Email transport | Options: `resend`, `sendgrid`, `smtp` |
| `RESEND_API_KEY` | `src/lib/email.ts` | Resend.com email API | If `EMAIL_PROVIDER=resend`. Get from resend.com |
| `SENDGRID_API_KEY` | `src/lib/email.ts` | SendGrid API key | If `EMAIL_PROVIDER=sendgrid`. Alternative to Resend. |
| `EMAIL_FROM` | `src/lib/email.ts` | Sender email address | e.g., `noreply@yourdomain.com` |
| `EMAIL_FROM_NAME` | `src/lib/email.ts` | Sender display name | e.g., `Agent Trust Protocol` (default: `ATP`) |
| `ADMIN_EMAIL` | `src/lib/email.ts` | Admin notification address | Your email for alerts |

### SMTP-only (if using SMTP email provider)

| Key | Purpose |
|-----|---------|
| `SMTP_HOST` | SMTP server hostname |
| `SMTP_PORT` | SMTP port (usually 587 or 465) |
| `SMTP_USER` | SMTP username |
| `SMTP_PASSWORD` | SMTP password |
| `SMTP_SECURE` | `true` for TLS, `false` for unencrypted |

### Optional (connects to ATP backend services)

Public URLs (sent to browser) — set if you have Railway services:
- `NEXT_PUBLIC_ATP_IDENTITY_URL` — DID registry service
- `NEXT_PUBLIC_ATP_PERMISSION_URL` — RBAC service
- `NEXT_PUBLIC_ATP_AUDIT_URL` — Audit trail service
- `NEXT_PUBLIC_APP_URL` — Your app URL (same as `BETTER_AUTH_URL`)

Private URLs (backend only) — set if services are behind a private network:
- `ATP_IDENTITY_URL`
- `ATP_CREDENTIALS_URL`
- `ATP_PERMISSIONS_URL`
- `ATP_AUDIT_URL`

### Workflow engine (optional, only if running workflows in Vercel)

Not typically used on Vercel (workflows run in backend services):
- `DATABASE_HOST`, `DATABASE_PORT`, `DATABASE_NAME`, `DATABASE_USER`, `DATABASE_PASSWORD`
- `WORKFLOW_API_PORT`, `CORS_ORIGIN`, `API_KEY_REQUIRED`, `API_KEY`
- All `SCHEDULER_*`, `EVENTS_*`, `LOG_*` vars

See `src/workflow-engine/config/WorkflowConfig.ts` if needed.

## Setup Steps (in order)

### 1. Generate `BETTER_AUTH_SECRET`

One-time, on your local machine:

```bash
openssl rand -base64 32
```

Save this value. You'll paste it as `BETTER_AUTH_SECRET` in Vercel Settings → Environment Variables.

### 2. Set up PostgreSQL database

**Choose one:**

- **Vercel Postgres** (recommended — built-in, simplest)
  1. In Vercel dashboard, go to your `atp-core` project
  2. Settings → Storage → Create Database → Postgres
  3. Copy the connection string
  4. Set as `DATABASE_URL` in Environment Variables

- **Neon** (serverless PostgreSQL, free tier)
  1. Sign up at https://neon.tech
  2. Create a project
  3. Copy the connection string
  4. Set as `DATABASE_URL` in Vercel

- **Railway** (used for backend services anyway)
  1. Create a PostgreSQL instance at https://railway.app
  2. Copy the private connection URL
  3. Set as `DATABASE_URL` in Vercel

### 3. Set up email

**Resend** (recommended — simplest, free tier):
1. Sign up at https://resend.com
2. Verify your domain (or use `onboarding@resend.dev` for testing)
3. Get API key from https://resend.com/api-keys
4. In Vercel Environment Variables, set:
   - `EMAIL_PROVIDER`: `resend`
   - `RESEND_API_KEY`: `re_xxxxxxxxxxxxx`
   - `EMAIL_FROM`: `noreply@yourdomain.com`
   - `EMAIL_FROM_NAME`: `Agent Trust Protocol`
   - `ADMIN_EMAIL`: Your email for alerts

**SendGrid** (alternative):
1. Sign up at https://sendgrid.com
2. Get API key from Settings
3. In Vercel, set:
   - `EMAIL_PROVIDER`: `sendgrid`
   - `SENDGRID_API_KEY`: Your API key
   - `EMAIL_FROM`, `EMAIL_FROM_NAME`, `ADMIN_EMAIL` (same as above)

**SMTP** (alternative — Gmail, custom server):
1. Get SMTP credentials from your email provider
2. In Vercel, set:
   - `EMAIL_PROVIDER`: `smtp`
   - `SMTP_HOST`: e.g., `smtp.gmail.com`
   - `SMTP_PORT`: `587` or `465`
   - `SMTP_USER`: Your email
   - `SMTP_PASSWORD`: App password (not your real password)
   - `SMTP_SECURE`: `true` for TLS
   - `EMAIL_FROM`, `EMAIL_FROM_NAME`, `ADMIN_EMAIL`

### 4. Set required auth URLs

In Vercel Environment Variables:
- `BETTER_AUTH_URL`: Your Vercel domain (e.g., `https://atp-core.vercel.app` or your custom domain)
- (optional) `NEXT_PUBLIC_APP_URL`: Same as `BETTER_AUTH_URL`

### 5. (Optional) Connect ATP backend services

If you have Railway services (identity, permission, audit) running, point to them:

In Vercel Environment Variables:
- `NEXT_PUBLIC_ATP_IDENTITY_URL`: e.g., `https://identity.railway.app`
- `NEXT_PUBLIC_ATP_PERMISSION_URL`: e.g., `https://permission.railway.app`
- `NEXT_PUBLIC_ATP_AUDIT_URL`: e.g., `https://audit.railway.app`

Private backend URLs (backend only):
- `ATP_IDENTITY_URL`, `ATP_CREDENTIALS_URL`, `ATP_PERMISSIONS_URL`, `ATP_AUDIT_URL`

See `packages/<service>/README.md` for Railway deployment instructions.

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
