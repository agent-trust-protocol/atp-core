# Dokploy Deployment Setup

Self-host the ATP backend stack with [Dokploy](https://dokploy.com) — an
open-source, Railway-like PaaS. This replaces the Railway flow, which failed
because it built each service in isolation and couldn't resolve the private
`@atp/shared` workspace package. Dokploy deploys `docker-compose.dokploy.yml`,
whose services build from the **repo root** with the workspace-aware
`docker/*.Dockerfile`s, so the monorepo builds correctly.

The Next.js **frontend stays on Vercel** — this covers only the backend services.

---

## 1. Provision a server

- A Linux VPS (Ubuntu 22.04/24.04 LTS), **≥ 4 GB RAM / 2 vCPU** recommended
  (eight Node services + Postgres + Redis; building images needs headroom).
- A domain you control, so Dokploy/Traefik can issue Let's Encrypt TLS.

## 2. Install Dokploy

On a fresh VPS (installs Docker + Dokploy; dashboard on port `3000`):

```bash
curl -sSL https://dokploy.com/install.sh | sh
```

Open `http://<server-ip>:3000`, create the admin account, and (recommended) set a
domain for the Dokploy dashboard itself under **Settings → Server**.

> Our services do **not** publish host ports (Traefik routes to them internally),
> so there's no conflict with Dokploy's own `:3000` dashboard.

## 3. Create the Compose application

1. **Create Project** → name it `atp`.
2. **Create Service → Compose**.
3. **Provider**: connect the GitHub repo `agent-trust-protocol/atp-core` (via
   Dokploy's GitHub integration) or a Git URL + branch (`main`).
4. **Compose Path**: `docker-compose.dokploy.yml`.

## 4. Set environment variables

In the Compose service → **Environment**, add the variables from
[`.env.dokploy.example`](../.env.dokploy.example). Generate each secret with
`openssl rand -base64 32`:

| Variable | Notes |
|---|---|
| `POSTGRES_PASSWORD` | Postgres superuser password |
| `REDIS_PASSWORD` | Redis auth (used by permission-service) |
| `SESSION_SECRET` | identity-service, ≥32 chars |
| `JWT_SECRET` | **same value** for permission-service + rpc-gateway |
| `AUDIT_ENCRYPTION_KEY` | audit-logger, ≥32 chars |
| `CORS_ORIGIN` | your frontend URL, e.g. `https://app.yourdomain.com` |
| `NODE_ENV` | `production` (default) |
| `POSTGRES_USER` / `POSTGRES_DB` | optional, default `atp_user` / `atp_prod` |
| `ATP_ALERT_WEBHOOK_URL` | optional, monitoring alerts |

The compose fails fast if any required secret is missing — that's intentional.

## 5. Deploy

Click **Deploy**. Order is handled by the compose `depends_on`:

1. `postgres` + `redis` start and become healthy.
2. `db-migrate` runs `scripts/init-db.sql` + `packages/shared/src/database/migrations`,
   then **exits 0** (this is expected — it's a one-shot job, not a long-running service).
3. The services start once `db-migrate` completes and report healthy via `/health`.

## 6. Expose the gateway (and monitoring) publicly

Internal services talk over the `atp` Docker network by name; only the gateway
needs a public domain.

1. In the Compose service → **Domains** → **Add Domain**.
2. **Service**: `rpc-gateway`, **Container Port**: `3000`, **Host**: your API
   domain (e.g. `api.yourdomain.com`), **HTTPS**: on (Let's Encrypt).
3. (Optional) Repeat for `monitoring-service` (port `3005`) if you want the
   dashboard exposed.
4. Set `CORS_ORIGIN` to your frontend origin and redeploy if you changed it.

**Health check path** for each service is `GET /health`.

## 7. Auto-deploy on push (optional)

Either enable Dokploy's **GitHub** integration on the service (auto-deploy on push
to `main`), or copy the service's **Webhook URL** (Compose service → Deployments)
into the repo's GitHub **Settings → Webhooks**.

## 8. Retiring Railway

`.github/workflows/deploy.yml` (Railway) is now dormant — it only runs when the
`RAILWAY_TOKEN` secret is set. Once Dokploy is serving traffic, you can delete that
workflow and the per-service `packages/*/railway.json` files. (Left in place for now
so nothing is removed prematurely.)

---

## Notes

- **Why this fixes the Railway failure:** the `docker/*.Dockerfile`s copy the root
  `package.json`/`package-lock.json`/`lerna.json` + `packages/shared` and run
  `npm run build --workspace=@atp/shared` before building each service. Building
  from the repo root (as compose does) is what makes `@atp/shared` resolve.
- **IPFS** anchoring in audit-logger is disabled (no `IPFS_URL`). To enable it, add
  an IPFS service and set `IPFS_URL` on `audit-logger`.
- **quantum-safe-server** and **nginx/ipfs** from the dev `docker-compose.yml` are
  intentionally omitted; Traefik (built into Dokploy) replaces nginx.
