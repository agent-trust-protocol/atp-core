# =============================================================================
# DEBIAN-BASED DOCKERFILE FOR MAXIMUM BETTER-SQLITE3 COMPATIBILITY
# =============================================================================
# This Dockerfile uses Debian slim as the base image, which provides:
# 1. Better compatibility with pre-compiled binaries (glibc vs musl)
# 2. More complete build toolchain
# 3. Reduced compilation issues for native Node.js modules
# 4. Widely tested and documented solutions

# Build stage
FROM node:18-slim AS builder

LABEL maintainer="Agent Trust Protocol"
LABEL description="Identity Service with better-sqlite3 (Debian-based)"

WORKDIR /app

# Update package lists and install build dependencies
# Debian provides better binary compatibility for better-sqlite3
RUN apt-get update && apt-get install -y \
    python3 \
    python3-dev \
    python3-pip \
    build-essential \
    libsqlite3-dev \
    sqlite3 \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Ensure python3 is available as python for node-gyp
RUN ln -sf /usr/bin/python3 /usr/bin/python

# Set environment variables for node-gyp
ENV PYTHONUNBUFFERED=1
ENV NODE_GYP_FORCE_PYTHON=/usr/bin/python3

# Copy package files
COPY package.json package-lock.json lerna.json ./
COPY packages/shared/package.json ./packages/shared/
COPY packages/identity-service/package.json ./packages/identity-service/

# Install dependencies
# Debian typically has better support for pre-built better-sqlite3 binaries
RUN npm ci

# Copy source code and build
COPY packages/shared ./packages/shared
COPY packages/identity-service ./packages/identity-service
COPY tsconfig.json ./

RUN npm run build --workspace=@atp/shared
RUN npm run build --workspace=@atp/identity-service

# Install production dependencies
RUN npm install --omit=dev

# Production stage
FROM node:18-slim AS production

WORKDIR /app

# Install only runtime dependencies
RUN apt-get update && apt-get install -y \
    sqlite3 \
    dumb-init \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --gid 1001 nodejs \
    && useradd --uid 1001 --gid nodejs --shell /bin/bash --create-home nodejs

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