# =============================================================================
# NATIVE NODE.JS SQLITE DOCKERFILE (NO COMPILATION REQUIRED)
# =============================================================================
# This Dockerfile uses Node.js 22+ with built-in SQLite support
# Benefits:
# - No native module compilation required
# - Minimal dependencies
# - Fast builds
# - Cross-platform compatibility
# - Small image size

FROM node:22-alpine AS builder

LABEL maintainer="Agent Trust Protocol"
LABEL description="Identity Service with native Node.js SQLite"

WORKDIR /app

# No build tools needed - only basic dependencies
RUN apk add --no-cache dumb-init

# Copy package files
COPY package.json package-lock.json lerna.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/identity-service/package.json ./packages/identity-service/

# Install dependencies (no compilation needed)
RUN npm ci

# Copy source code
COPY packages/shared ./packages/shared
COPY packages/identity-service ./packages/identity-service
COPY tsconfig.json ./

# Build TypeScript
RUN npm run build --workspace=@atp/shared
RUN npm run build --workspace=@atp/identity-service

# Install production dependencies
RUN npm install --omit=dev

# Production stage
FROM node:22-alpine AS production

WORKDIR /app

RUN apk add --no-cache dumb-init \
    && addgroup -g 1001 -S nodejs \
    && adduser -S nodejs -u 1001

# Copy built application
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/shared/package.json ./packages/shared/
COPY --from=builder --chown=nodejs:nodejs /app/packages/identity-service/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/packages/identity-service/package.json ./

# Create data directory
RUN mkdir -p /data && chown -R nodejs:nodejs /data

USER nodejs

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "fetch('http://localhost:3001/health').then(() => process.exit(0)).catch(() => process.exit(1))" || exit 1

EXPOSE 3001

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]