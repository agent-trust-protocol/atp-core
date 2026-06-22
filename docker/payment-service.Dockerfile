# payment-service — built from the REPO ROOT context (matches the other
# docker/<service>.Dockerfile files and the `railway up` invocation in
# .github/workflows/deploy.yml, which runs from the repo root).
#
# Unlike the workspace-coupled services, @atp/payment-service is self-contained
# (no @atp/shared dependency), so this is a simple two-stage build of just the
# package — no root manifests or packages/shared are needed.

# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

COPY packages/payment-service/package.json ./
RUN npm install

COPY packages/payment-service/tsconfig.json ./
COPY packages/payment-service/src ./src
RUN npm run build

# Production stage
FROM node:20-alpine AS production
WORKDIR /app

COPY packages/payment-service/package.json ./
RUN npm install --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production
EXPOSE 3009

# Railway injects PORT; the service listens on PORT (default 3009).
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:'+(process.env.PORT||3009)+'/health',(r)=>{process.exit(r.statusCode===200?0:1)})"

USER node
CMD ["node", "dist/index.js"]
