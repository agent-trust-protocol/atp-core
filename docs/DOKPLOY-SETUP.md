# Dokploy Deployment Setup

Self-host the ATP backend stack with [Dokploy](https://dokploy.com) — an
open-source, Railway-like PaaS. This replaces the Railway flow, which failed
because it built each service in isolation and couldn't resolve the private
`@atp/shared` workspace package. Dokploy deploys `docker-compose.dokploy.yml`,
whose services build from the **repo root** with the workspace-aware
`docker/*.Dockerfile`s, so the monorepo builds correctly.

The Next.js **frontend stays on Vercel** — this covers only the backend services.

> ⚠️ **Dokploy runs on a Linux server, not on your laptop.** The installer must be
> run **as root on the server** — you `ssh root@<server-ip>` first, *then* run it.
> Running `curl … | sh` on macOS fails (`This script must be run as root`, and it
> only supports Linux). Your Mac is just where you SSH *from*.

---

## 1. Provision a server (Hetzner Cloud)

Any Ubuntu 22.04/24.04 LTS host with **≥ 4 GB RAM / 2 vCPU** works (eight Node
services + Postgres + Redis; image builds need the headroom). Steps below use
[Hetzner Cloud](https://console.hetzner.cloud) (~€4.5/mo); other providers differ
only in this "create a VM" UI.

1. Create a Hetzner account, then **New Project** → name it `atp`.
2. **Add Server**:
   - **Location**: nearest to your users.
   - **Image**: Ubuntu 24.04.
   - **Type**: Shared vCPU → **CX22** (2 vCPU / 4 GB RAM).
   - **SSH key**: add your public key. If you don't have one, on your Mac run
     `ssh-keygen -t ed25519` then paste `~/.ssh/id_ed25519.pub`. (Password login
     also works — Hetzner emails the root password.)
   - **Name**: `atp-dokploy` → **Create & Buy**.
3. Note the server's **public IPv4**.

> **Firewall**: if you attach a Hetzner Cloud Firewall, allow inbound **22** (SSH),
> **80** + **443** (Traefik/TLS), and **3000** (initial Dokploy dashboard). With no
> firewall attached, all ports are open by default — nothing to do.

You also need a **domain you control** (next section), so Dokploy/Traefik can issue
Let's Encrypt TLS for the API.

## 2. Point your domain (DNS)

In your DNS provider, add an **A record** for the API subdomain → the server IPv4:

| Type | Name | Value | TTL |
|---|---|---|---|
| A | `api` (→ `api.yourdomain.com`) | `<server-ip>` | 300 |
| A | `dokploy` (optional, for the panel) | `<server-ip>` | 300 |
| A | `monitoring` (optional) | `<server-ip>` | 300 |

Verify it resolves before continuing: `dig api.yourdomain.com +short` → server IP.

## 3. Install Dokploy (on the server, as root)

```bash
ssh root@<server-ip>
# optional: apt update && apt upgrade -y
curl -sSL https://dokploy.com/install.sh | sh
```

Open `http://<server-ip>:3000`, create the admin account, and (recommended) set a
domain for the Dokploy dashboard itself (`dokploy.yourdomain.com`) under
**Settings → Server / Web Domain**.

> Our services do **not** publish host ports (Traefik routes to them internally),
> so there's no conflict with Dokploy's own `:3000` dashboard.

## 4. Create the Compose application

1. **Create Project** → name it `atp`.
2. **Create Service → Compose**.
3. **Provider**: connect the GitHub repo `agent-trust-protocol/atp-core` (via
   Dokploy's GitHub integration; a private repo needs the GitHub app or a deploy
   key) or a Git URL + **branch**.
   - The `docker-compose.dokploy.yml` file must exist on the branch you select.
     Merge it to `main` and track `main`, or point Dokploy at the feature branch
     until then.
4. **Compose Path**: `docker-compose.dokploy.yml`.

## 5. Set environment variables

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

## 6. Deploy

Click **Deploy**. Order is handled by the compose `depends_on`:

1. `postgres` + `redis` start and become healthy.
2. `db-migrate` runs `scripts/init-db.sql` + `packages/shared/src/database/migrations`,
   then **exits 0** (this is expected — it's a one-shot job, not a long-running service).
3. The services start once `db-migrate` completes and report healthy via `/health`.

## 7. Expose the gateway (and monitoring) publicly

Internal services talk over the `atp` Docker network by name; only the gateway
needs a public domain.

1. In the Compose service → **Domains** → **Add Domain**.
2. **Service**: `rpc-gateway`, **Container Port**: `3000`, **Host**: your API
   domain (e.g. `api.yourdomain.com`), **HTTPS**: on (Let's Encrypt).
3. (Optional) Repeat for `monitoring-service` (port `3005`) if you want the
   dashboard exposed.
4. Set `CORS_ORIGIN` to your frontend origin and redeploy if you changed it.

**Health check path** for each service is `GET /health`.

## 8. Auto-deploy on push (optional)

Either enable Dokploy's **GitHub** integration on the service (auto-deploy on push
to `main`), or copy the service's **Webhook URL** (Compose service → Deployments)
into the repo's GitHub **Settings → Webhooks**.

## 9. Retiring Railway

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
