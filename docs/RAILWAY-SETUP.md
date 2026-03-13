# Railway Deployment Setup

This guide covers deploying all ATP backend services to Railway.

## Prerequisites

- [Railway CLI](https://docs.railway.app/develop/cli) installed (`npm i -g @railway/cli`)
- A Railway account and project created at [railway.app](https://railway.app)
- The `atp-core` repository pushed to GitHub

---

## 1. Project Structure on Railway

Each backend service runs as a separate Railway **service** within one Railway **project**. The shared Postgres database is provisioned as a Railway Postgres plugin and its `DATABASE_URL` is injected per-service automatically.

Services to deploy:

| Service              | Directory                         | Port |
|----------------------|-----------------------------------|------|
| identity-service     | docker/identity-service.Dockerfile | 3001 |
| vc-service           | docker/vc-service.Dockerfile       | 3002 |
| permission-service   | docker/permission-service.Dockerfile | 3003 |
| audit-logger         | docker/audit-logger.Dockerfile     | 3005 |
| protocol-integrations| docker/protocol-integrations.Dockerfile | 3006 |
| payment-service      | packages/payment-service/Dockerfile | 3009 |
| rpc-gateway          | docker/rpc-gateway.Dockerfile      | 3000 |

---

## 2. Initial Project Setup

```bash
# Log in to Railway
railway login

# Link to your Railway project (run from repo root)
railway link
```

---

## 3. Add the Postgres Database

1. In the Railway dashboard, open your project.
2. Click **+ New** → **Database** → **PostgreSQL**.
3. Railway creates a Postgres instance and exposes `DATABASE_URL` as an environment variable.

The `DATABASE_URL` is automatically available to all services in the same project — you don't need to copy it manually.

### Run the initial schema migration

After Postgres is running, execute `scripts/init-db.sql` once:

```bash
# Get the connection string from Railway
railway variables --service postgres

# Run the init script (replace $DATABASE_URL with the value above)
psql "$DATABASE_URL" -f scripts/init-db.sql
```

---

## 4. Deploy Each Service

For each service, create a Railway service pointing at the correct Dockerfile:

### Via Dashboard (recommended for first setup)

1. Click **+ New** → **GitHub Repo**.
2. Select the `atp-core` repository.
3. Under **Build & Deploy**, set the **Dockerfile path** to the value from the table above (e.g. `docker/identity-service.Dockerfile`).
4. Set the **Root Directory** to `/` (repo root) — the Dockerfiles use monorepo-relative COPY paths.
5. Repeat for every service.

### Via CLI

```bash
# Example: deploy identity-service
railway service create identity-service
railway up --service identity-service --dockerfile docker/identity-service.Dockerfile
```

---

## 5. Environment Variables

Set these variables on each service in the Railway dashboard under **Variables**.

### Variables shared by all services

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Runtime environment | `production` |
| `DATABASE_URL` | Auto-injected by Railway Postgres plugin | — |

### identity-service

| Variable | Required | Description |
|----------|----------|-------------|
| `SESSION_SECRET` | Yes | ≥32 random chars — `openssl rand -base64 32` |
| `CORS_ORIGIN` | Yes | Your frontend URL, e.g. `https://yourdomain.com` |
| `PORT` | No | Defaults to `3001` |

### permission-service

| Variable | Required | Description |
|----------|----------|-------------|
| `JWT_SECRET` | Yes | ≥32 random chars — `openssl rand -base64 32` |
| `CORS_ORIGIN` | Yes | Frontend URL |
| `REDIS_HOST` | No | Redis hostname if using distributed rate-limiting |
| `REDIS_PORT` | No | Defaults to `6379` |
| `REDIS_PASSWORD` | No | Redis password |

### audit-logger

| Variable | Required | Description |
|----------|----------|-------------|
| `AUDIT_ENCRYPTION_KEY` | Yes | ≥32 random chars — `openssl rand -base64 32` |
| `CORS_ORIGIN` | Yes | Frontend URL |
| `IPFS_URL` | No | IPFS API endpoint (omit to disable IPFS anchoring) |

### vc-service

| Variable | Required | Description |
|----------|----------|-------------|
| `CORS_ORIGIN` | Yes | Frontend URL |

### payment-service

| Variable | Required | Description |
|----------|----------|-------------|
| `CORS_ORIGIN` | Yes | Frontend URL |

### rpc-gateway

| Variable | Required | Description |
|----------|----------|-------------|
| `IDENTITY_SERVICE_URL` | Yes | Internal Railway URL for identity-service |
| `VC_SERVICE_URL` | Yes | Internal Railway URL for vc-service |
| `PERMISSION_SERVICE_URL` | Yes | Internal Railway URL for permission-service |
| `AUDIT_SERVICE_URL` | Yes | Internal Railway URL for audit-logger |
| `JWT_SECRET` | Yes | Must match permission-service value |
| `CORS_ORIGIN` | Yes | Frontend URL |

> **Internal service URLs on Railway** look like:
> `https://identity-service.railway.internal` (private networking)
> or the public domain if private networking is not enabled.

### protocol-integrations

| Variable | Required | Description |
|----------|----------|-------------|
| `IDENTITY_SERVICE_URL` | Yes | Identity service URL |
| `GATEWAY_URL` | Yes | RPC gateway URL |

---

## 6. Service Start Order

Railway does not support `depends_on`. The services must be resilient to temporary unavailability of their dependencies. All services include retry/health-check logic in their HTTP clients.

Recommended deploy order:
1. `identity-service`
2. `vc-service`, `permission-service`, `audit-logger`, `payment-service` (parallel)
3. `protocol-integrations`
4. `rpc-gateway` (depends on all above)

---

## 7. Health Checks

Configure a health-check path in the Railway service settings:

| Service | Health endpoint |
|---------|----------------|
| All services | `GET /health` |
| rpc-gateway  | `GET /health` |

Set **Health Check Path** to `/health` and **Health Check Timeout** to `30s` in each service's Railway settings.

---

## 8. Custom Domains

1. In the Railway service settings click **+ Custom Domain**.
2. Add a CNAME record at your DNS provider pointing to the Railway-generated domain.
3. Update `CORS_ORIGIN` on all services to include the new domain.

---

## 9. Generating Secrets

```bash
# SESSION_SECRET / JWT_SECRET / AUDIT_ENCRYPTION_KEY
openssl rand -base64 32

# Or via Node
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 10. CI/CD Auto-Deploy

The `.github/workflows/deploy.yml` workflow automatically deploys all services on push to `main` using the `RAILWAY_TOKEN` secret.

To set it up:
1. Go to Railway → **Account Settings** → **Tokens** → create a new token.
2. Add it as `RAILWAY_TOKEN` in your GitHub repository's **Settings → Secrets and variables → Actions**.

Each service is deployed in parallel via a matrix strategy in the workflow.
